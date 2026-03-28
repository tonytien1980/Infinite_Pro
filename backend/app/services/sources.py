from __future__ import annotations

import logging
from uuid import uuid4

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.domain import models, schemas
from app.ingestion.preprocess import normalize_text
from app.ingestion.remote import RemoteSourceContent, fetch_remote_source
from app.ingestion.sources import (
    ExternalSearchConnector,
    GoogleDocsConnector,
    ManualTextConnector,
    ManualUrlConnector,
)
from app.services.material_storage import preview_extracted_text
from app.services.source_materials import (
    build_failed_evidence_item,
    build_processed_evidence_items,
    build_source_objects_for_document,
    build_unparsed_evidence_item,
)
from app.services.storage_manager import (
    AVAILABILITY_AVAILABLE,
    AVAILABILITY_METADATA_ONLY,
    AVAILABILITY_REFERENCE_ONLY,
    DERIVED_STORAGE_KIND,
    RETENTION_POLICY_DERIVED,
    RETENTION_POLICY_FAILED,
    STORAGE_PROVIDER_LOCAL,
    build_derived_storage_key,
    calculate_purge_at,
    compute_digest,
    normalize_extension,
    write_text,
)
from app.services.tasks import (
    get_loaded_task,
    prepare_case_world_follow_up_for_task,
    serialize_task,
)

logger = logging.getLogger(__name__)


def _linked_matter_workspace_id(task: models.Task) -> str | None:
    for link in task.matter_workspace_links:
        if link.matter_workspace_id:
            return link.matter_workspace_id
    return None


def _persist_processed_source(
    *,
    db: Session,
    task: models.Task,
    connector_source_type: str,
    connector,
    title: str,
    content_type: str | None,
    storage_path: str,
    extracted_text: str,
    support_level: str = "full",
    ingest_strategy: str = "text_extract",
    metadata_only: bool = False,
    message: str | None = None,
    reliability_level: str = "user_provided",
    research_run_id: str | None = None,
) -> tuple[models.SourceDocument, models.SourceMaterial, models.Artifact, models.Evidence]:
    retention_policy = RETENTION_POLICY_DERIVED
    extension = normalize_extension(title, "")
    matter_workspace_id = _linked_matter_workspace_id(task)
    continuity_scope = "world_shared" if matter_workspace_id else "task_slice"
    source_document = models.SourceDocument(
        task_id=task.id,
        matter_workspace_id=matter_workspace_id,
        research_run_id=research_run_id,
        continuity_scope=continuity_scope,
        source_type=connector_source_type,
        file_name=title,
        canonical_display_name=title,
        file_extension=extension or None,
        content_type=content_type,
        storage_key=None,
        storage_path=storage_path,
        storage_kind=DERIVED_STORAGE_KIND,
        storage_provider=STORAGE_PROVIDER_LOCAL,
        file_size=len(extracted_text.encode("utf-8")) if extracted_text else 0,
        content_digest=compute_digest(extracted_text.encode("utf-8")) if extracted_text else None,
        ingest_status="metadata_only" if metadata_only and not extracted_text else "processed",
        ingest_strategy=ingest_strategy,
        support_level=support_level,
        retention_policy=retention_policy,
        purge_at=calculate_purge_at(
            created_at=models.utc_now(),
            retention_policy=retention_policy,
        ),
        availability_state=(
            AVAILABILITY_REFERENCE_ONLY if metadata_only and not extracted_text else AVAILABILITY_AVAILABLE
        ),
        metadata_only=metadata_only,
        extracted_text=preview_extracted_text(extracted_text) or None,
        ingestion_error=message,
    )
    db.add(source_document)
    db.flush()
    if extracted_text:
        derived_storage_key = build_derived_storage_key(
            source_document_id=source_document.id,
            file_name=title,
        )
        write_text(derived_storage_key, extracted_text)
        source_document.derived_storage_key = derived_storage_key
        source_document.storage_key = derived_storage_key
        db.add(source_document)
        db.flush()
    source_material, artifact = build_source_objects_for_document(
        task_id=task.id,
        matter_workspace_id=matter_workspace_id,
        source_document=source_document,
        continuity_scope=continuity_scope,
    )
    db.add(source_material)
    db.flush()
    artifact.source_material_id = source_material.id
    db.add(artifact)
    db.flush()
    source_ref = connector.build_source_ref(task.id, source_document.id)

    primary_evidence, chunk_items = build_processed_evidence_items(
        task=task,
        matter_workspace_id=matter_workspace_id,
        source_document=source_document,
        source_material_id=source_material.id,
        artifact_id=artifact.id,
        source_ref=source_ref,
        title=title,
        text=extracted_text,
        primary_evidence_type="source_excerpt",
        reliability_level=reliability_level,
        continuity_scope=continuity_scope,
    ) if extracted_text else (
        build_unparsed_evidence_item(
            task_id=task.id,
            matter_workspace_id=matter_workspace_id,
            source_document_id=source_document.id,
            source_material_id=source_material.id,
            artifact_id=artifact.id,
            source_type=connector_source_type,
            source_ref=source_ref,
            title=title,
            continuity_scope=continuity_scope,
        ),
        [],
    )
    if extracted_text:
        db.add(primary_evidence)
        for chunk_item in chunk_items:
            db.add(chunk_item)
    else:
        primary_evidence.evidence_type = "source_unparsed"
        primary_evidence.excerpt_or_summary = (
            f"來源「{title}」目前只建立 reference / metadata。"
            f"{message or '這份來源尚未抽出可直接分析的文字內容。'}"
        )
        db.add(primary_evidence)
    db.flush()
    return source_document, source_material, artifact, primary_evidence


def _persist_failed_source(
    *,
    db: Session,
    task: models.Task,
    connector_source_type: str,
    connector,
    title: str,
    storage_path: str,
    error_message: str,
    support_level: str = "unsupported",
    ingest_strategy: str = "unsupported",
    research_run_id: str | None = None,
) -> tuple[models.SourceDocument, models.SourceMaterial, models.Artifact, models.Evidence]:
    matter_workspace_id = _linked_matter_workspace_id(task)
    continuity_scope = "world_shared" if matter_workspace_id else "task_slice"
    source_document = models.SourceDocument(
        task_id=task.id,
        matter_workspace_id=matter_workspace_id,
        research_run_id=research_run_id,
        continuity_scope=continuity_scope,
        source_type=connector_source_type,
        file_name=title,
        canonical_display_name=title,
        file_extension=normalize_extension(title, "") or None,
        content_type=None,
        storage_key=None,
        storage_path=storage_path,
        storage_kind=DERIVED_STORAGE_KIND,
        storage_provider=STORAGE_PROVIDER_LOCAL,
        file_size=0,
        ingest_status="failed",
        ingest_strategy=ingest_strategy,
        support_level=support_level,
        retention_policy=RETENTION_POLICY_FAILED,
        purge_at=calculate_purge_at(
            created_at=models.utc_now(),
            retention_policy=RETENTION_POLICY_FAILED,
        ),
        availability_state=AVAILABILITY_METADATA_ONLY,
        metadata_only=True,
        extracted_text=None,
        ingestion_error=error_message,
    )
    db.add(source_document)
    db.flush()
    source_material, artifact = build_source_objects_for_document(
        task_id=task.id,
        matter_workspace_id=matter_workspace_id,
        source_document=source_document,
        continuity_scope=continuity_scope,
    )
    db.add(source_material)
    db.flush()
    artifact.source_material_id = source_material.id
    db.add(artifact)
    db.flush()
    source_ref = connector.build_source_ref(task.id, source_document.id)

    primary_evidence = build_failed_evidence_item(
        task_id=task.id,
        matter_workspace_id=matter_workspace_id,
        source_document_id=source_document.id,
        source_material_id=source_material.id,
        artifact_id=artifact.id,
        source_type=connector_source_type,
        source_ref=source_ref,
        title=title,
        error_message=error_message,
        continuity_scope=continuity_scope,
    )
    db.add(primary_evidence)
    db.flush()
    return source_document, source_material, artifact, primary_evidence


def _select_connector_for_remote_source(
    remote_source: RemoteSourceContent,
    *,
    origin: str,
):
    if origin == "external_search":
        return ExternalSearchConnector()
    if remote_source.source_type == "google_docs":
        return GoogleDocsConnector()
    return ManualUrlConnector()


def _serialize_upload_item(
    source_document: models.SourceDocument,
    source_material: models.SourceMaterial,
    artifact: models.Artifact,
    evidence: models.Evidence,
) -> schemas.UploadResultItem:
    return schemas.UploadResultItem(
        source_document=schemas.SourceDocumentRead.model_validate(source_document),
        evidence=schemas.EvidenceRead.model_validate(evidence),
        source_material=schemas.SourceMaterialRead.model_validate(source_material),
        artifact=schemas.ArtifactRead.model_validate(artifact),
    )


def ingest_remote_urls_for_task(
    db: Session,
    task_id: str,
    urls: list[str],
    *,
    origin: str = "manual",
    research_run_id: str | None = None,
) -> list[schemas.UploadResultItem]:
    task = get_loaded_task(db, task_id)
    existing_storage_paths = {item.storage_path for item in task.uploads}
    ingested: list[schemas.UploadResultItem] = []

    for url in urls:
        normalized_url = url.strip()
        if not normalized_url or normalized_url in existing_storage_paths:
            continue

        connector = ManualUrlConnector() if origin == "manual" else ExternalSearchConnector()
        title = normalized_url

        try:
            remote_source = fetch_remote_source(normalized_url)
            connector = _select_connector_for_remote_source(remote_source, origin=origin)
            title = remote_source.title
            source_document, source_material, artifact, evidence = _persist_processed_source(
                db=db,
                task=task,
                connector_source_type=connector.source_type,
                connector=connector,
                title=remote_source.title,
                content_type=remote_source.content_type,
                storage_path=normalized_url,
                extracted_text=remote_source.normalized_text,
                support_level=remote_source.support_level,
                ingest_strategy=remote_source.ingest_strategy,
                metadata_only=remote_source.metadata_only,
                message=remote_source.message,
                reliability_level="externally_retrieved" if origin == "external_search" else "user_provided",
                research_run_id=research_run_id,
            )
        except Exception as exc:  # noqa: BLE001
            logger.warning(
                "Remote source ingestion degraded for task %s origin=%s url=%s error=%s",
                task.id,
                origin,
                normalized_url,
                exc,
            )
            source_document, source_material, artifact, evidence = _persist_failed_source(
                db=db,
                task=task,
                connector_source_type=connector.source_type,
                connector=connector,
                title=title,
                storage_path=normalized_url,
                error_message=str(exc),
                research_run_id=research_run_id,
            )

        existing_storage_paths.add(normalized_url)
        ingested.append(_serialize_upload_item(source_document, source_material, artifact, evidence))

    if ingested:
        db.commit()

    return ingested


def ingest_sources_for_task(
    db: Session,
    task_id: str,
    payload: schemas.SourceIngestRequest,
) -> schemas.SourceIngestBatchResponse:
    urls = [url.strip() for url in payload.urls if url.strip()]
    pasted_text = normalize_text(payload.pasted_text)
    if not urls and not pasted_text:
        raise HTTPException(status_code=400, detail="至少需要提供一個網址或一段貼上內容。")

    task = get_loaded_task(db, task_id)
    world_update_summary_parts: list[str] = []
    if pasted_text:
        world_update_summary_parts.append(
            f"補入貼上內容「{payload.pasted_title or '手動貼上內容'}」"
        )
    if urls:
        world_update_summary_parts.append(f"補入 {len(urls)} 筆網址")
    world_update_summary = "；".join(world_update_summary_parts)
    world_update = prepare_case_world_follow_up_for_task(
        db,
        task=task,
        follow_up_summary=world_update_summary,
    )
    text_connector = ManualTextConnector()
    ingested: list[schemas.UploadResultItem] = []

    if pasted_text:
        title = payload.pasted_title or "手動貼上內容"
        source_document, source_material, artifact, evidence = _persist_processed_source(
            db=db,
            task=task,
            connector_source_type=text_connector.source_type,
            connector=text_connector,
            title=title,
            content_type="text/plain",
            storage_path=f"inline://task/{task.id}/pasted/{uuid4()}",
            extracted_text=pasted_text,
            support_level="full",
            ingest_strategy="inline_text_extract",
        )
        ingested.append(_serialize_upload_item(source_document, source_material, artifact, evidence))
        db.commit()

    ingested.extend(ingest_remote_urls_for_task(db=db, task_id=task_id, urls=urls, origin="manual"))

    refreshed_task = get_loaded_task(db, task.id)
    aggregate = serialize_task(refreshed_task)
    return schemas.SourceIngestBatchResponse(
        task_id=task.id,
        matter_workspace_id=aggregate.matter_workspace.id if aggregate.matter_workspace else None,
        world_updated_first=world_update is not None,
        world_update_summary=world_update_summary if world_update is not None else "",
        ingested=ingested,
    )
