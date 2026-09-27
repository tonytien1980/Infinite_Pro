from __future__ import annotations

import logging
from dataclasses import asdict
from io import SEEK_END
from uuid import uuid4

from fastapi import HTTPException, UploadFile
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.auth import CurrentMember
from app.core.config import settings
from app.domain import models, schemas
from app.domain.enums import TaskStatus
from app.ingestion.files import FileExtractResult, analyze_upload_content
from app.ingestion.sources import ManualUploadConnector
from app.services.ingestion_contracts import build_ingestion_contract_summary, resolve_source_availability_state
from app.services.material_storage import preview_extracted_text, sync_source_material_from_document
from app.services.source_materials import (
    build_media_reference_for_document,
    build_failed_evidence_item,
    build_source_objects_for_document,
    build_processed_evidence_items,
    build_unparsed_evidence_item,
    ensure_source_chain_participation_links,
    load_existing_world_shared_bundle,
    ensure_material_capacity,
    lock_material_case,
    source_character_count,
    PARTICIPATION_TYPE_DIRECT_INGEST,
    PARTICIPATION_TYPE_SHARED_REUSE,
    SLICE_PARTICIPATION_CONTINUITY_SCOPE,
)
from app.services.storage_manager import (
    AVAILABILITY_AVAILABLE,
    AVAILABILITY_METADATA_ONLY,
    RAW_STORAGE_KIND,
    RETENTION_POLICY_FAILED,
    RETENTION_POLICY_RAW_ACTIVE,
    RETENTION_POLICY_RAW_DEFAULT,
    STORAGE_PROVIDER_LOCAL,
    build_derived_storage_key,
    build_raw_storage_key,
    calculate_purge_at,
    compute_digest,
    normalize_extension,
    read_bytes,
    write_bytes,
    write_text,
)
from app.services.tasks import (
    MAX_INTAKE_MATERIAL_UNITS,
    build_upload_result_item_from_aggregate,
    get_loaded_task,
    prepare_case_world_follow_up_for_task,
    serialize_task,
)

logger = logging.getLogger(__name__)


def reprocess_source_document(db: Session, task_id: str, source_id: str, *, current_member=None) -> schemas.SourceDocumentRead:
    task = get_loaded_task(db, task_id, current_member=current_member)
    lock_material_case(db, task)
    matter_id = _linked_matter_workspace_id(task)
    source = db.scalar(select(models.SourceDocument).where(
        models.SourceDocument.id == source_id,
        models.SourceDocument.matter_workspace_id == matter_id if matter_id else models.SourceDocument.task_id == task.id,
    ))
    if source is None:
        raise HTTPException(status_code=404, detail="找不到這個案件的材料。")
    db.refresh(source)
    if source.source_type != "manual_upload" or not source.storage_key:
        raise HTTPException(status_code=409, detail="缺少可重讀的原始檔案，請重新上傳材料。")
    try:
        raw = read_bytes(source.storage_key, max_bytes=settings.material_max_file_bytes)
    except ValueError as exc:
        raise HTTPException(status_code=413, detail=str(exc)) from exc
    except OSError as exc:
        raise HTTPException(status_code=409, detail="無法讀取原始檔案，請重新上傳；舊版依據仍保留。") from exc
    if raw is None or (source.content_digest and compute_digest(raw) != source.content_digest):
        raise HTTPException(status_code=409, detail="原始檔案已不存在或內容不一致，請重新上傳；舊版依據仍保留。")
    try:
        analyzed = analyze_upload_content(source.file_name, raw)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=f"重新讀取失敗，原版保留：{exc}") from exc
    if not analyzed.text or analyzed.support_level == "unsupported":
        raise HTTPException(status_code=422, detail=f"尚未讀到可用文字，原版保留。{analyzed.message or ''}")
    ensure_material_capacity(db, task, new_sources=0, added_chars=len(analyzed.text) - source_character_count(source))
    previous = dict(source.extraction_manifest or {})
    existing_version = db.scalar(select(func.max(models.ChunkObject.extraction_version)).where(models.ChunkObject.source_document_id == source.id)) or 0
    version = max(int(previous.get("version", 0)), existing_version) + 1
    history = list(previous.pop("history", []))
    previous.setdefault("version", version - 1)
    previous.setdefault("coverage", "unverified")
    previous["derived_storage_key"] = source.derived_storage_key
    history.append(previous)
    manifest = analyzed.to_manifest(version=version)
    manifest["history"] = history
    key = build_derived_storage_key(source_document_id=source.id, file_name=source.file_name, extension=f".v{version}.txt")
    write_text(key, analyzed.text)
    source.extraction_manifest = manifest
    source.derived_storage_key = key
    source.extracted_text = preview_extracted_text(analyzed.text)
    source.ingest_status = "processed"
    source.ingest_strategy = analyzed.ingest_strategy
    source.support_level = analyzed.support_level
    source.metadata_only = False
    source.availability_state = AVAILABILITY_AVAILABLE
    source.ingestion_error = analyzed.message
    material = next(iter(source.source_materials), None)
    artifact = next(iter(source.artifacts), None)
    for item in source.source_materials:
        sync_source_material_from_document(item, source)
        item.ingest_status = source.ingest_status
        item.summary = analyzed.text[:500]
    # Keep the source's compatibility owner stable; the requesting slice gets participation links.
    primary, chunks, evidence = build_processed_evidence_items(
        task=source.task, matter_workspace_id=matter_id, source_document=source,
        source_material_id=material.id if material else None, artifact_id=artifact.id if artifact else None,
        source_ref=ManualUploadConnector().build_source_ref(task.id, source.id), title=source.file_name,
        text=analyzed.text, primary_evidence_type="uploaded_file_excerpt", continuity_scope=source.continuity_scope,
    )
    db.add_all([primary, *chunks, *evidence])
    db.flush()
    ensure_source_chain_participation_links(db, task_id=task.id, matter_workspace_id=matter_id,
        source_document_id=source.id, source_material_id=material.id if material else None,
        artifact_id=artifact.id if artifact else None, evidence_id=primary.id, participation_type=PARTICIPATION_TYPE_DIRECT_INGEST)
    prepare_case_world_follow_up_for_task(db, task=task, follow_up_summary=f"重新讀取材料「{source.file_name}」，舊版依據保留。")
    contract = build_ingestion_contract_summary(ingest_status=source.ingest_status, support_level=source.support_level,
        ingest_strategy=source.ingest_strategy, metadata_only=source.metadata_only, ingestion_error=source.ingestion_error,
        extraction_coverage=source.extraction_coverage)
    result = schemas.SourceDocumentRead.model_validate(source).model_copy(update=asdict(contract))
    db.commit()
    return result


def _linked_matter_workspace_id(task: models.Task) -> str | None:
    for link in task.matter_workspace_links:
        if link.matter_workspace_id:
            return link.matter_workspace_id
    return None


def save_uploads_for_task(
    db: Session,
    task_id: str,
    files: list[UploadFile],
    *,
    current_member: CurrentMember | None = None,
) -> schemas.UploadBatchResponse:
    if not files:
        raise HTTPException(status_code=400, detail="至少需要上傳一個檔案。")
    if len(files) > MAX_INTAKE_MATERIAL_UNITS:
        raise HTTPException(
            status_code=400,
            detail=f"單次最多只能上傳 {MAX_INTAKE_MATERIAL_UNITS} 份檔案；請分批補件。",
        )

    task = get_loaded_task(db, task_id, current_member=current_member)
    for file in files:
        file.file.seek(0, SEEK_END)
        size = file.file.tell()
        file.file.seek(0)
        if size > settings.material_max_file_bytes:
            raise HTTPException(status_code=413, detail=f"檔案超過 {settings.material_max_file_bytes} bytes 上限，請拆分後重試。")
    matter_workspace_id = _linked_matter_workspace_id(task)
    lock_material_case(db, task)
    prepared = []
    new_digests = set()
    new_characters = 0
    for index, file in enumerate(files):
        content = file.file.read(settings.material_max_file_bytes + 1)
        file.file.seek(0)
        digest = compute_digest(content) if content else None
        try:
            if not content:
                raise ValueError("上傳檔案為空白內容。")
            analyzed = analyze_upload_content(file.filename or "unknown", content)
            status = "unsupported" if analyzed.support_level == "unsupported" else ("processed" if analyzed.text else "metadata_only")
        except Exception as exc:
            analyzed = FileExtractResult("", "unsupported", "unsupported", True, str(exc))
            status = "failed"
        existing = load_existing_world_shared_bundle(db, matter_workspace_id=matter_workspace_id,
                                                     source_type="manual_upload", content_digest=digest)
        key = digest if digest and matter_workspace_id else f"new:{index}"
        if existing is None and key not in new_digests:
            new_digests.add(key)
            new_characters += len(analyzed.text)
        prepared.append((file, analyzed, status))
    ensure_material_capacity(db, task, new_sources=len(new_digests), added_chars=new_characters)
    continuity_scope = "world_shared" if matter_workspace_id else SLICE_PARTICIPATION_CONTINUITY_SCOPE
    follow_up_summary = (
        f"補入 {len(files)} 份檔案："
        + "、".join((file.filename or "未命名檔案") for file in files[:3])
    )
    world_update = prepare_case_world_follow_up_for_task(
        db,
        task=task,
        follow_up_summary=follow_up_summary,
    )
    connector = ManualUploadConnector()
    uploaded_refs: list[tuple[str, str, str | None, str | None]] = []

    for file, analyzed, ingest_status in prepared:
        content = file.file.read(settings.material_max_file_bytes + 1)
        if len(content) > settings.material_max_file_bytes:
            raise HTTPException(status_code=413, detail=f"檔案超過 {settings.material_max_file_bytes} bytes 上限，請拆分後重試。")
        extension = normalize_extension(file.filename or "", "")
        stored_name = file.filename or f"{uuid4()}{extension}"
        extracted_text = analyzed.text
        ingestion_error = analyzed.message
        support_level = analyzed.support_level
        ingest_strategy = analyzed.ingest_strategy
        metadata_only = analyzed.metadata_only
        extraction_manifest = analyzed.to_manifest()

        stored = (
            write_bytes(
                build_raw_storage_key(
                    digest=compute_digest(content),
                    extension=extension or ".bin",
                ),
                content,
            )
            if content
            else None
        )
        existing_bundle = load_existing_world_shared_bundle(
            db,
            matter_workspace_id=matter_workspace_id,
            source_type=connector.source_type,
            content_digest=stored.digest if stored is not None else None,
        )
        if existing_bundle is not None:
            source_document, source_material, artifact, evidence = existing_bundle
            ensure_source_chain_participation_links(
                db,
                task_id=task.id,
                matter_workspace_id=matter_workspace_id,
                source_document_id=source_document.id,
                source_material_id=source_material.id,
                artifact_id=artifact.id,
                evidence_id=evidence.id,
                participation_type=PARTICIPATION_TYPE_SHARED_REUSE,
            )
            uploaded_refs.append((source_document.id, evidence.id, source_material.id, artifact.id))
            continue
        retention_policy = (
            RETENTION_POLICY_FAILED
            if ingest_status in {"failed", "unsupported"}
            else (
                RETENTION_POLICY_RAW_ACTIVE
                if task.status in {TaskStatus.READY.value, TaskStatus.RUNNING.value}
                else RETENTION_POLICY_RAW_DEFAULT
            )
        )

        logger.info(
            "Processed upload task_id=%s file=%s ingest_status=%s",
            task.id,
            file.filename or stored_name,
            ingest_status,
        )

        source_document = models.SourceDocument(
            task_id=task.id,
            matter_workspace_id=matter_workspace_id,
            continuity_scope=continuity_scope,
            source_type=connector.source_type,
            file_name=file.filename or stored_name,
            canonical_display_name=file.filename or stored_name,
            file_extension=extension or None,
            content_type=file.content_type,
            storage_key=stored.storage_key if stored is not None else None,
            storage_path=stored.absolute_path if stored is not None else f"failed://task/{task.id}/{stored_name}",
            storage_kind=RAW_STORAGE_KIND,
            storage_provider=STORAGE_PROVIDER_LOCAL,
            file_size=stored.file_size if stored is not None else 0,
            content_digest=stored.digest if stored is not None else None,
            ingest_status=ingest_status,
            ingest_strategy=ingest_strategy,
            support_level=support_level,
            retention_policy=retention_policy,
            purge_at=calculate_purge_at(
                created_at=models.utc_now(),
                retention_policy=retention_policy,
            ),
            availability_state=(
                resolve_source_availability_state(
                    support_level=support_level,
                    metadata_only=metadata_only,
                    extracted_text=extracted_text,
                )
                if stored is not None
                else AVAILABILITY_METADATA_ONLY
            ),
            metadata_only=metadata_only,
            extracted_text=preview_extracted_text(extracted_text) or None,
            extraction_manifest=extraction_manifest,
            ingestion_error=ingestion_error,
        )
        db.add(source_document)
        db.flush()
        if extracted_text:
            derived_storage_key = build_derived_storage_key(
                source_document_id=source_document.id,
                file_name=file.filename or stored_name,
            )
            write_text(derived_storage_key, extracted_text)
            source_document.derived_storage_key = derived_storage_key
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
        if ingest_status == "processed" and extracted_text:
            evidence, chunk_objects, chunk_items = build_processed_evidence_items(
                task=task,
                matter_workspace_id=matter_workspace_id,
                source_document=source_document,
                source_material_id=source_material.id,
                artifact_id=artifact.id,
                source_ref=source_ref,
                title=file.filename or stored_name,
                text=extracted_text,
                primary_evidence_type="uploaded_file_excerpt",
                continuity_scope=continuity_scope,
            )
            db.add(evidence)
            for chunk_object in chunk_objects:
                db.add(chunk_object)
            for chunk_item in chunk_items:
                db.add(chunk_item)
        elif ingest_status == "failed":
            media_reference = build_media_reference_for_document(
                task_id=task.id,
                matter_workspace_id=matter_workspace_id,
                source_document=source_document,
                source_material_id=source_material.id,
                artifact_id=artifact.id,
                continuity_scope=continuity_scope,
            )
            db.add(media_reference)
            db.flush()
            evidence = build_failed_evidence_item(
                task_id=task.id,
                matter_workspace_id=matter_workspace_id,
                source_document_id=source_document.id,
                source_material_id=source_material.id,
                artifact_id=artifact.id,
                source_type=connector.source_type,
                source_ref=source_ref,
                title=file.filename or stored_name,
                error_message=ingestion_error or "未知的擷取錯誤",
                continuity_scope=continuity_scope,
            )
            evidence.evidence_type = "uploaded_file_ingestion_issue"
            evidence.media_reference_id = media_reference.id
            evidence.excerpt_or_summary = (
                f"上傳檔案「{file.filename or stored_name}」未能完整擷取。"
                f"不確定性說明：{ingestion_error or '未知的擷取錯誤'}。"
            )
            db.add(evidence)
        elif ingest_status == "unsupported":
            media_reference = build_media_reference_for_document(
                task_id=task.id,
                matter_workspace_id=matter_workspace_id,
                source_document=source_document,
                source_material_id=source_material.id,
                artifact_id=artifact.id,
                continuity_scope=continuity_scope,
            )
            db.add(media_reference)
            db.flush()
            evidence = build_failed_evidence_item(
                task_id=task.id,
                matter_workspace_id=matter_workspace_id,
                source_document_id=source_document.id,
                source_material_id=source_material.id,
                artifact_id=artifact.id,
                source_type=connector.source_type,
                source_ref=source_ref,
                title=file.filename or stored_name,
                error_message=ingestion_error or "這種格式尚未正式支援。",
                continuity_scope=continuity_scope,
            )
            evidence.evidence_type = "uploaded_file_ingestion_issue"
            evidence.media_reference_id = media_reference.id
            evidence.excerpt_or_summary = (
                f"上傳檔案「{file.filename or stored_name}」目前只建立 metadata。"
                f"支援狀態：{ingestion_error or '尚未正式支援這種格式。'}"
            )
            db.add(evidence)
        else:
            media_reference = build_media_reference_for_document(
                task_id=task.id,
                matter_workspace_id=matter_workspace_id,
                source_document=source_document,
                source_material_id=source_material.id,
                artifact_id=artifact.id,
                continuity_scope=continuity_scope,
            )
            db.add(media_reference)
            db.flush()
            evidence = build_unparsed_evidence_item(
                task_id=task.id,
                matter_workspace_id=matter_workspace_id,
                source_document_id=source_document.id,
                source_material_id=source_material.id,
                artifact_id=artifact.id,
                source_type=connector.source_type,
                source_ref=source_ref,
                title=file.filename or stored_name,
                continuity_scope=continuity_scope,
            )
            evidence.evidence_type = "uploaded_file_unparsed"
            evidence.media_reference_id = media_reference.id
            evidence.excerpt_or_summary = (
                f"上傳檔案「{file.filename or stored_name}」已附加，但目前只建立 reference / metadata。"
                f"{ingestion_error or '這份來源尚未抽出可直接分析的文字內容。'}"
            )
            db.add(evidence)
        db.flush()
        ensure_source_chain_participation_links(
            db,
            task_id=task.id,
            matter_workspace_id=matter_workspace_id,
            source_document_id=source_document.id,
            source_material_id=source_material.id,
            artifact_id=artifact.id,
            evidence_id=evidence.id,
            participation_type=PARTICIPATION_TYPE_DIRECT_INGEST if matter_workspace_id else PARTICIPATION_TYPE_SHARED_REUSE,
        )

        uploaded_refs.append((source_document.id, evidence.id, source_material.id, artifact.id))

    if not uploaded_refs:
        raise HTTPException(status_code=400, detail="沒有任何檔案成功上傳。")

    db.commit()
    refreshed_task = get_loaded_task(db, task.id, current_member=current_member)
    aggregate = serialize_task(refreshed_task)
    uploaded = [
        build_upload_result_item_from_aggregate(
            aggregate,
            source_document_id=source_document_id,
            evidence_id=evidence_id,
            source_material_id=source_material_id,
            artifact_id=artifact_id,
        )
        for source_document_id, evidence_id, source_material_id, artifact_id in uploaded_refs
    ]
    return schemas.UploadBatchResponse(
        task_id=task.id,
        matter_workspace_id=aggregate.matter_workspace.id if aggregate.matter_workspace else None,
        world_updated_first=world_update is not None,
        world_update_summary=follow_up_summary if world_update is not None else "",
        uploaded=uploaded,
    )
