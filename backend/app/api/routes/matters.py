from __future__ import annotations

from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session

from app.core.auth import require_permission
from app.core.database import get_db
from app.domain import schemas
from app.services.canonicalization import apply_matter_canonicalization_review
from app.services.sources import ingest_sources_for_task
from app.services.tasks import get_primary_task_for_matter
from app.services.tasks import (
    apply_matter_continuation_action,
    ensure_task_allows_continuation_activity,
    get_artifact_evidence_workspace,
    get_matter_workspace,
    list_matter_workspaces,
    rollback_matter_content_revision,
    update_matter_workspace,
    update_matter_workspace_metadata,
)
from app.services.uploads import save_uploads_for_task

router = APIRouter(prefix="/matters", tags=["matters"])


@router.get("", response_model=list[schemas.MatterWorkspaceSummaryRead])
def list_matter_workspaces_route(
    current_member=Depends(require_permission("access_firm_workspace")),
    db: Session = Depends(get_db),
) -> list[schemas.MatterWorkspaceSummaryRead]:
    return list_matter_workspaces(db)


@router.get("/{matter_id}", response_model=schemas.MatterWorkspaceResponse)
def get_matter_workspace_route(
    matter_id: str,
    current_member=Depends(require_permission("access_firm_workspace")),
    db: Session = Depends(get_db),
) -> schemas.MatterWorkspaceResponse:
    return get_matter_workspace(db, matter_id)


@router.put("/{matter_id}/metadata", response_model=schemas.MatterWorkspaceResponse)
def update_matter_workspace_metadata_route(
    matter_id: str,
    payload: schemas.MatterWorkspaceMetadataUpdateRequest,
    current_member=Depends(require_permission("access_firm_workspace")),
    db: Session = Depends(get_db),
) -> schemas.MatterWorkspaceResponse:
    return update_matter_workspace_metadata(db, matter_id, payload)


@router.put("/{matter_id}/workspace", response_model=schemas.MatterWorkspaceResponse)
def update_matter_workspace_route(
    matter_id: str,
    payload: schemas.MatterWorkspaceUpdateRequest,
    current_member=Depends(require_permission("access_firm_workspace")),
    db: Session = Depends(get_db),
) -> schemas.MatterWorkspaceResponse:
    return update_matter_workspace(db, matter_id, payload)


@router.post("/{matter_id}/continuation", response_model=schemas.MatterWorkspaceResponse)
def apply_matter_continuation_action_route(
    matter_id: str,
    payload: schemas.MatterContinuationActionRequest,
    current_member=Depends(require_permission("access_firm_workspace")),
    db: Session = Depends(get_db),
) -> schemas.MatterWorkspaceResponse:
    return apply_matter_continuation_action(db, matter_id, payload)


@router.post("/{matter_id}/revisions/{revision_id}/rollback", response_model=schemas.MatterWorkspaceResponse)
def rollback_matter_content_revision_route(
    matter_id: str,
    revision_id: str,
    current_member=Depends(require_permission("access_firm_workspace")),
    db: Session = Depends(get_db),
) -> schemas.MatterWorkspaceResponse:
    return rollback_matter_content_revision(db, matter_id, revision_id)


@router.get(
    "/{matter_id}/artifact-evidence",
    response_model=schemas.ArtifactEvidenceWorkspaceResponse,
)
def get_artifact_evidence_workspace_route(
    matter_id: str,
    current_member=Depends(require_permission("access_firm_workspace")),
    db: Session = Depends(get_db),
) -> schemas.ArtifactEvidenceWorkspaceResponse:
    return get_artifact_evidence_workspace(db, matter_id)


@router.post(
    "/{matter_id}/canonicalization-reviews",
    response_model=schemas.ArtifactEvidenceWorkspaceResponse,
)
def apply_matter_canonicalization_review_route(
    matter_id: str,
    payload: schemas.MatterCanonicalizationReviewRequest,
    current_member=Depends(require_permission("access_firm_workspace")),
    db: Session = Depends(get_db),
) -> schemas.ArtifactEvidenceWorkspaceResponse:
    apply_matter_canonicalization_review(
        db,
        matter_workspace_id=matter_id,
        payload=payload,
    )
    return get_artifact_evidence_workspace(db, matter_id)


@router.post("/{matter_id}/uploads", response_model=schemas.UploadBatchResponse)
def upload_matter_files_route(
    matter_id: str,
    files: list[UploadFile] = File(...),
    current_member=Depends(require_permission("access_firm_workspace")),
    db: Session = Depends(get_db),
) -> schemas.UploadBatchResponse:
    task = get_primary_task_for_matter(db, matter_id)
    ensure_task_allows_continuation_activity(task)
    return save_uploads_for_task(db=db, task_id=task.id, files=files)


@router.post("/{matter_id}/sources", response_model=schemas.SourceIngestBatchResponse)
def ingest_matter_sources_route(
    matter_id: str,
    payload: schemas.SourceIngestRequest,
    current_member=Depends(require_permission("access_firm_workspace")),
    db: Session = Depends(get_db),
) -> schemas.SourceIngestBatchResponse:
    task = get_primary_task_for_matter(db, matter_id)
    ensure_task_allows_continuation_activity(task)
    return ingest_sources_for_task(db=db, task_id=task.id, payload=payload)
