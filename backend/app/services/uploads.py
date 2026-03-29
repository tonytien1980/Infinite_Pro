from __future__ import annotations

import logging
from uuid import uuid4

from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.domain import models, schemas
from app.domain.enums import TaskStatus
from app.ingestion.files import analyze_upload_content
from app.ingestion.preprocess import normalize_text
from app.ingestion.sources import ManualUploadConnector
from app.services.material_storage import preview_extracted_text
from app.services.source_materials import (
    build_failed_evidence_item,
    build_source_objects_for_document,
    build_processed_evidence_items,
    build_unparsed_evidence_item,
    ensure_source_chain_participation_links,
    load_existing_world_shared_bundle,
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
    write_bytes,
    write_text,
)
from app.services.tasks import (
    build_upload_result_item_from_aggregate,
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


def save_uploads_for_task(
    db: Session,
    task_id: str,
    files: list[UploadFile],
) -> schemas.UploadBatchResponse:
    if not files:
        raise HTTPException(status_code=400, detail="至少需要上傳一個檔案。")

    task = get_loaded_task(db, task_id)
    matter_workspace_id = _linked_matter_workspace_id(task)
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

    for file in files:
        content = file.file.read()
        extension = normalize_extension(file.filename or "", "")
        stored_name = file.filename or f"{uuid4()}{extension}"
        extracted_text = ""
        ingest_status = "metadata_only"
        ingestion_error: str | None = None
        support_level = "full"
        ingest_strategy = "text_extract"
        metadata_only = False

        if not content:
            ingest_status = "failed"
            ingestion_error = "上傳檔案為空白內容。"
            support_level = "unsupported"
            ingest_strategy = "unsupported"
            metadata_only = True
        else:
            try:
                analyzed = analyze_upload_content(file.filename or stored_name, content)
                extracted_text = normalize_text(analyzed.text)
                support_level = analyzed.support_level
                ingest_strategy = analyzed.ingest_strategy
                metadata_only = analyzed.metadata_only
                ingestion_error = analyzed.message
                if support_level == "unsupported":
                    ingest_status = "unsupported"
                elif extracted_text:
                    ingest_status = "processed"
                else:
                    ingest_status = "metadata_only"
            except Exception as exc:
                ingest_status = "failed"
                ingestion_error = str(exc)
                support_level = "unsupported"
                ingest_strategy = "unsupported"
                metadata_only = True

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
            availability_state=AVAILABILITY_AVAILABLE if stored is not None else AVAILABILITY_METADATA_ONLY,
            metadata_only=metadata_only,
            extracted_text=preview_extracted_text(extracted_text) or None,
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
            evidence, chunk_items = build_processed_evidence_items(
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
            for chunk_item in chunk_items:
                db.add(chunk_item)
        elif ingest_status == "failed":
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
            evidence.excerpt_or_summary = (
                f"上傳檔案「{file.filename or stored_name}」未能完整擷取。"
                f"不確定性說明：{ingestion_error or '未知的擷取錯誤'}。"
            )
            db.add(evidence)
        elif ingest_status == "unsupported":
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
            evidence.excerpt_or_summary = (
                f"上傳檔案「{file.filename or stored_name}」目前只建立 metadata。"
                f"支援狀態：{ingestion_error or '尚未正式支援這種格式。'}"
            )
            db.add(evidence)
        else:
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
    refreshed_task = get_loaded_task(db, task.id)
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
