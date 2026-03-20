from __future__ import annotations

import logging
from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.config import settings
from app.domain import models, schemas
from app.ingestion.files import extract_text_from_upload, summarize_evidence_text
from app.ingestion.sources import ManualUploadConnector
from app.services.tasks import get_loaded_task

logger = logging.getLogger(__name__)


def _build_evidence_from_upload(
    *,
    task_id: str,
    source_document_id: str,
    source_ref: str,
    file_name: str,
    extracted_text: str,
    ingest_status: str,
    ingestion_error: str | None,
) -> models.Evidence:
    if ingest_status == "processed" and extracted_text:
        evidence_type = "uploaded_file_excerpt"
        excerpt = summarize_evidence_text(extracted_text)
    elif ingest_status == "failed":
        evidence_type = "uploaded_file_ingestion_issue"
        excerpt = (
            f"Uploaded file '{file_name}' could not be fully ingested. "
            f"Uncertainty note: {ingestion_error or 'unknown ingestion error'}."
        )
    else:
        evidence_type = "uploaded_file_unparsed"
        excerpt = (
            f"Uploaded file '{file_name}' is attached, but no usable text was extracted automatically. "
            "This source should be treated as unavailable until a supported text format is provided."
        )

    return models.Evidence(
        task_id=task_id,
        source_document_id=source_document_id,
        evidence_type=evidence_type,
        source_type="manual_upload",
        source_ref=source_ref,
        title=file_name,
        excerpt_or_summary=excerpt,
        reliability_level="user_provided",
    )


def save_uploads_for_task(
    db: Session,
    task_id: str,
    files: list[UploadFile],
) -> schemas.UploadBatchResponse:
    if not files:
        raise HTTPException(status_code=400, detail="At least one file is required.")

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
            ingestion_error = "The uploaded file was empty."
        else:
            try:
                extracted_text = extract_text_from_upload(file.filename or stored_name, content)
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

        evidence = _build_evidence_from_upload(
            task_id=task.id,
            source_document_id=source_document.id,
            source_ref=connector.build_source_ref(task.id, source_document.id),
            file_name=file.filename or stored_name,
            extracted_text=extracted_text,
            ingest_status=ingest_status,
            ingestion_error=ingestion_error,
        )
        db.add(evidence)
        db.flush()

        uploaded.append(
            schemas.UploadResultItem(
                source_document=schemas.SourceDocumentRead.model_validate(source_document),
                evidence=schemas.EvidenceRead.model_validate(evidence),
            )
        )

    if not uploaded:
        raise HTTPException(status_code=400, detail="No files were uploaded successfully.")

    db.commit()
    return schemas.UploadBatchResponse(task_id=task.id, uploaded=uploaded)
