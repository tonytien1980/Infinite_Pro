from __future__ import annotations

from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session

from app.core.auth import require_current_member
from app.core.database import get_db
from app.domain import schemas
from app.services.sources import ingest_sources_for_task
from app.services.tasks import ensure_task_allows_continuation_activity, get_loaded_task
from app.services.uploads import save_uploads_for_task

router = APIRouter(prefix="/tasks", tags=["uploads"])


@router.post("/{task_id}/uploads", response_model=schemas.UploadBatchResponse)
def upload_task_files(
    task_id: str,
    files: list[UploadFile] = File(...),
    current_member=Depends(require_current_member),
    db: Session = Depends(get_db),
) -> schemas.UploadBatchResponse:
    ensure_task_allows_continuation_activity(get_loaded_task(db, task_id))
    return save_uploads_for_task(db=db, task_id=task_id, files=files)


@router.post("/{task_id}/sources", response_model=schemas.SourceIngestBatchResponse)
def ingest_task_sources(
    task_id: str,
    payload: schemas.SourceIngestRequest,
    current_member=Depends(require_current_member),
    db: Session = Depends(get_db),
) -> schemas.SourceIngestBatchResponse:
    ensure_task_allows_continuation_activity(get_loaded_task(db, task_id))
    return ingest_sources_for_task(db=db, task_id=task_id, payload=payload)
