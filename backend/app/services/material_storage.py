from __future__ import annotations

from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.domain import models
from app.domain.enums import TaskStatus
from app.services.storage_manager import (
    AVAILABILITY_AVAILABLE,
    AVAILABILITY_METADATA_ONLY,
    AVAILABILITY_REFERENCE_ONLY,
    DERIVED_STORAGE_KIND,
    RAW_STORAGE_KIND,
    RETENTION_POLICY_DERIVED,
    RETENTION_POLICY_FAILED,
    RETENTION_POLICY_RAW_ACTIVE,
    RETENTION_POLICY_RAW_DEFAULT,
    build_derived_storage_key,
    calculate_purge_at,
    compute_digest,
    file_exists,
    normalize_extension,
    write_text,
)


def preview_extracted_text(text: str, limit: int = 4000) -> str:
    return text.strip()[:limit]


def build_source_reference(source_document: models.SourceDocument) -> str:
    if source_document.source_type == "manual_upload":
        return source_document.file_name
    if source_document.source_type in {"manual_url", "google_docs", "external_search"}:
        return source_document.storage_path
    if source_document.source_type == "manual_input":
        return source_document.file_name or "手動補充文字"
    return source_document.file_name


def retention_policy_for_source_document(source_document: models.SourceDocument) -> str:
    if source_document.ingest_status in {"failed", "unsupported"}:
        return RETENTION_POLICY_FAILED
    if source_document.storage_kind == RAW_STORAGE_KIND:
        if source_document.task.status in {TaskStatus.READY.value, TaskStatus.RUNNING.value}:
            return RETENTION_POLICY_RAW_ACTIVE
        return RETENTION_POLICY_RAW_DEFAULT
    return RETENTION_POLICY_DERIVED


def sync_source_material_from_document(
    source_material: models.SourceMaterial,
    source_document: models.SourceDocument,
) -> None:
    source_material.canonical_display_name = source_document.canonical_display_name or source_material.title
    source_material.file_extension = source_document.file_extension
    source_material.content_type = source_document.content_type
    source_material.file_size = source_document.file_size
    source_material.storage_key = source_document.storage_key
    source_material.storage_kind = source_document.storage_kind
    source_material.storage_provider = source_document.storage_provider
    source_material.content_digest = source_document.content_digest
    source_material.ingest_strategy = source_document.ingest_strategy
    source_material.support_level = source_document.support_level
    source_material.retention_policy = source_document.retention_policy
    source_material.purge_at = source_document.purge_at
    source_material.availability_state = source_document.availability_state
    source_material.metadata_only = source_document.metadata_only
    source_material.source_ref = build_source_reference(source_document)
    source_material.title = source_document.canonical_display_name or source_material.title


def _derive_storage_key_from_absolute_path(storage_path: str) -> str | None:
    path = Path(storage_path)
    if not path.is_absolute():
        return storage_path
    try:
        return str(path.relative_to(settings.storage_root_path))
    except ValueError:
        return None


def _ensure_derived_extract(source_document: models.SourceDocument) -> None:
    if not source_document.extracted_text:
        return
    if source_document.derived_storage_key and file_exists(source_document.derived_storage_key):
        return
    derived_key = build_derived_storage_key(
        source_document_id=source_document.id,
        file_name=source_document.file_name or source_document.canonical_display_name or "source",
    )
    write_text(derived_key, source_document.extracted_text)
    source_document.derived_storage_key = derived_key
    if source_document.storage_kind != RAW_STORAGE_KIND:
        source_document.storage_key = derived_key


def normalize_source_storage_metadata(db: Session) -> None:
    changed = False
    source_documents = db.scalars(select(models.SourceDocument).order_by(models.SourceDocument.created_at)).all()
    source_materials_by_document = {
        item.source_document_id: item
        for item in db.scalars(select(models.SourceMaterial)).all()
        if item.source_document_id
    }

    for source_document in source_documents:
        if not source_document.canonical_display_name:
            source_document.canonical_display_name = source_document.file_name
            changed = True
        if not source_document.file_extension:
            source_document.file_extension = normalize_extension(source_document.file_name, "")
            changed = True
        if not source_document.storage_key:
            storage_key = _derive_storage_key_from_absolute_path(source_document.storage_path)
            if storage_key:
                source_document.storage_key = storage_key
                changed = True
        if not source_document.storage_kind:
            source_document.storage_kind = (
                RAW_STORAGE_KIND
                if source_document.source_type == "manual_upload"
                else DERIVED_STORAGE_KIND
            )
            changed = True
        if not source_document.storage_provider:
            source_document.storage_provider = "local_fs"
            changed = True
        if not source_document.content_digest:
            if source_document.storage_key and file_exists(source_document.storage_key):
                existing_bytes = (settings.storage_root_path / source_document.storage_key).read_bytes()
                source_document.content_digest = compute_digest(existing_bytes)
            elif source_document.extracted_text:
                source_document.content_digest = compute_digest(
                    source_document.extracted_text.encode("utf-8")
                )
            changed = True
        if not source_document.ingest_strategy:
            source_document.ingest_strategy = "text_extract"
            changed = True
        if not source_document.support_level:
            source_document.support_level = "full"
            changed = True
        if not source_document.retention_policy:
            source_document.retention_policy = retention_policy_for_source_document(source_document)
            changed = True
        if source_document.purge_at is None:
            source_document.purge_at = calculate_purge_at(
                created_at=source_document.created_at,
                retention_policy=source_document.retention_policy,
            )
            changed = True
        if not source_document.availability_state:
            source_document.availability_state = (
                AVAILABILITY_METADATA_ONLY if source_document.metadata_only else AVAILABILITY_AVAILABLE
            )
            changed = True
        _ensure_derived_extract(source_document)

        source_material = source_materials_by_document.get(source_document.id)
        if source_material is not None:
            sync_source_material_from_document(source_material, source_document)
            changed = True

    if changed:
        db.commit()
