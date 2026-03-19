from __future__ import annotations

from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.config import settings
from app.domain import models, schemas
from app.ingestion.files import extract_text_from_upload, summarize_evidence_text
from app.ingestion.sources import ManualUploadConnector
from app.services.tasks import get_loaded_task


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
        if not content:
            continue

        extension = Path(file.filename or "").suffix
        stored_name = f"{uuid4()}{extension}"
        storage_path = task_upload_dir / stored_name
        storage_path.write_bytes(content)

        extracted_text = extract_text_from_upload(file.filename or stored_name, content)
        ingest_status = "processed" if extracted_text else "metadata_only"

        source_document = models.SourceDocument(
            task_id=task.id,
            source_type=connector.source_type,
            file_name=file.filename or stored_name,
            content_type=file.content_type,
            storage_path=str(storage_path),
            file_size=len(content),
            ingest_status=ingest_status,
            extracted_text=extracted_text or None,
        )
        db.add(source_document)
        db.flush()

        evidence_body = summarize_evidence_text(extracted_text) if extracted_text else (
            f"Uploaded file '{file.filename or stored_name}' is attached, but no text could be extracted automatically."
        )
        evidence = models.Evidence(
            task_id=task.id,
            source_document_id=source_document.id,
            evidence_type="uploaded_file",
            source_type=connector.source_type,
            source_ref=connector.build_source_ref(task.id, source_document.id),
            title=file.filename or stored_name,
            excerpt_or_summary=evidence_body,
            reliability_level="user_provided",
        )
        db.add(evidence)
        db.flush()

        uploaded.append(
            schemas.UploadResultItem(
                source_document=schemas.SourceDocumentRead.model_validate(source_document),
                evidence=schemas.EvidenceRead.model_validate(evidence),
            )
        )

    db.commit()
    return schemas.UploadBatchResponse(task_id=task.id, uploaded=uploaded)
