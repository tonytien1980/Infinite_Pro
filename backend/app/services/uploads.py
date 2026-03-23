from __future__ import annotations

import logging
from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.config import settings
from app.domain import models, schemas
from app.ingestion.files import extract_text_from_upload
from app.ingestion.preprocess import normalize_text
from app.ingestion.sources import ManualUploadConnector
from app.services.source_materials import (
    build_failed_evidence_item,
    build_source_objects_for_document,
    build_processed_evidence_items,
    build_unparsed_evidence_item,
)
from app.services.tasks import get_loaded_task

logger = logging.getLogger(__name__)


def save_uploads_for_task(
    db: Session,
    task_id: str,
    files: list[UploadFile],
) -> schemas.UploadBatchResponse:
    if not files:
        raise HTTPException(status_code=400, detail="至少需要上傳一個檔案。")

    task = get_loaded_task(db, task_id)
    connector = ManualUploadConnector()
    task_upload_dir = settings.upload_path / task.id
    task_upload_dir.mkdir(parents=True, exist_ok=True)

    uploaded: list[schemas.UploadResultItem] = []

    for file in files:
        content = file.file.read()
        extension = Path(file.filename or "").suffix
        stored_name = f"{uuid4()}{extension}"
        storage_path = task_upload_dir / stored_name
        storage_path.write_bytes(content)
        extracted_text = ""
        ingest_status = "metadata_only"
        ingestion_error: str | None = None

        if not content:
            ingest_status = "failed"
            ingestion_error = "上傳檔案為空白內容。"
        else:
            try:
                extracted_text = extract_text_from_upload(file.filename or stored_name, content)
                extracted_text = normalize_text(extracted_text)
                ingest_status = "processed" if extracted_text else "metadata_only"
            except Exception as exc:
                ingest_status = "failed"
                ingestion_error = str(exc)

        logger.info(
            "Processed upload task_id=%s file=%s ingest_status=%s",
            task.id,
            file.filename or stored_name,
            ingest_status,
        )

        source_document = models.SourceDocument(
            task_id=task.id,
            source_type=connector.source_type,
            file_name=file.filename or stored_name,
            content_type=file.content_type,
            storage_path=str(storage_path),
            file_size=len(content),
            ingest_status=ingest_status,
            extracted_text=extracted_text or None,
            ingestion_error=ingestion_error,
        )
        db.add(source_document)
        db.flush()

        source_material, artifact = build_source_objects_for_document(
            task_id=task.id,
            source_document=source_document,
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
                source_document=source_document,
                source_ref=source_ref,
                title=file.filename or stored_name,
                text=extracted_text,
                primary_evidence_type="uploaded_file_excerpt",
            )
            db.add(evidence)
            for chunk_item in chunk_items:
                db.add(chunk_item)
        elif ingest_status == "failed":
            evidence = build_failed_evidence_item(
                task_id=task.id,
                source_document_id=source_document.id,
                source_type=connector.source_type,
                source_ref=source_ref,
                title=file.filename or stored_name,
                error_message=ingestion_error or "未知的擷取錯誤",
            )
            evidence.evidence_type = "uploaded_file_ingestion_issue"
            evidence.excerpt_or_summary = (
                f"上傳檔案「{file.filename or stored_name}」未能完整擷取。"
                f"不確定性說明：{ingestion_error or '未知的擷取錯誤'}。"
            )
            db.add(evidence)
        else:
            evidence = build_unparsed_evidence_item(
                task_id=task.id,
                source_document_id=source_document.id,
                source_type=connector.source_type,
                source_ref=source_ref,
                title=file.filename or stored_name,
            )
            evidence.evidence_type = "uploaded_file_unparsed"
            evidence.excerpt_or_summary = (
                f"上傳檔案「{file.filename or stored_name}」已附加，但系統尚未自動擷取出可用文字。"
                "在提供可支援的文字格式前，這份來源應視為暫時不可用。"
            )
            db.add(evidence)
        db.flush()

        uploaded.append(
            schemas.UploadResultItem(
                source_document=schemas.SourceDocumentRead.model_validate(source_document),
                evidence=schemas.EvidenceRead.model_validate(evidence),
                source_material=schemas.SourceMaterialRead.model_validate(source_material),
                artifact=schemas.ArtifactRead.model_validate(artifact),
            )
        )

    if not uploaded:
        raise HTTPException(status_code=400, detail="沒有任何檔案成功上傳。")

    db.commit()
    return schemas.UploadBatchResponse(task_id=task.id, uploaded=uploaded)
