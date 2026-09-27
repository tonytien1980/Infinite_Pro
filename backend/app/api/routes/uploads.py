from __future__ import annotations

from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session

from app.core.auth import require_permission
from app.core.config import settings
from app.core.database import get_db
from app.domain import schemas
from app.services.sources import ingest_sources_for_task
from app.services.tasks import ensure_task_allows_continuation_activity, get_loaded_task
from app.services.uploads import reprocess_source_document, save_uploads_for_task
from app.services.source_materials import get_material_capacity

router = APIRouter(prefix="/tasks", tags=["uploads"])


@router.get("/support/materials")
def material_support_contract(current_member=Depends(require_permission("access_firm_workspace"))) -> dict:
    return {
        "max_case_sources": settings.material_max_case_sources,
        "max_case_chars": settings.material_max_case_chars,
        "max_file_bytes": settings.material_max_file_bytes,
        "max_source_chars": settings.material_max_source_chars,
        "max_pdf_pages": settings.material_max_pdf_pages,
        "max_ocr_pages": settings.material_max_ocr_pages,
        "max_image_pixels": settings.material_max_image_pixels,
        "max_sheets": settings.material_max_sheets,
        "max_cells": settings.material_max_cells,
        "ocr_enabled": settings.material_ocr_enabled,
        "max_zip_bytes": settings.material_max_zip_bytes,
        "max_zip_entries": settings.material_max_zip_entries,
        "parse_timeout_seconds": settings.material_parse_timeout_seconds,
        "ocr_page_timeout_seconds": settings.material_ocr_page_timeout_seconds,
        "ocr_file_timeout_seconds": settings.material_ocr_file_timeout_seconds,
    }


@router.get("/{task_id}/material-capacity")
def task_material_capacity(task_id: str, db: Session = Depends(get_db),
                           current_member=Depends(require_permission("access_firm_workspace"))) -> dict:
    task = get_loaded_task(db, task_id, current_member=current_member)
    return get_material_capacity(db, task)


@router.post("/{task_id}/uploads", response_model=schemas.UploadBatchResponse)
def upload_task_files(
    task_id: str,
    files: list[UploadFile] = File(...),
    current_member=Depends(require_permission("access_firm_workspace")),
    db: Session = Depends(get_db),
) -> schemas.UploadBatchResponse:
    task = get_loaded_task(db, task_id, current_member=current_member)
    ensure_task_allows_continuation_activity(task)
    return save_uploads_for_task(
        db=db,
        task_id=task_id,
        files=files,
        current_member=current_member,
    )


@router.post("/{task_id}/sources/{source_id}/reprocess", response_model=schemas.SourceDocumentRead)
def reprocess_task_source(task_id: str, source_id: str, db: Session = Depends(get_db),
                          current_member=Depends(require_permission("access_firm_workspace"))) -> schemas.SourceDocumentRead:
    task = get_loaded_task(db, task_id, current_member=current_member)
    ensure_task_allows_continuation_activity(task)
    return reprocess_source_document(db, task_id, source_id, current_member=current_member)


@router.post("/{task_id}/sources", response_model=schemas.SourceIngestBatchResponse)
def ingest_task_sources(
    task_id: str,
    payload: schemas.SourceIngestRequest,
    current_member=Depends(require_permission("access_firm_workspace")),
    db: Session = Depends(get_db),
) -> schemas.SourceIngestBatchResponse:
    task = get_loaded_task(db, task_id, current_member=current_member)
    ensure_task_allows_continuation_activity(task)
    return ingest_sources_for_task(
        db=db,
        task_id=task_id,
        payload=payload,
        current_member=current_member,
    )
