from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.domain import schemas
from app.services.tasks import (
    get_artifact_evidence_workspace,
    get_matter_workspace,
    list_matter_workspaces,
)

router = APIRouter(prefix="/matters", tags=["matters"])


@router.get("", response_model=list[schemas.MatterWorkspaceSummaryRead])
def list_matter_workspaces_route(
    db: Session = Depends(get_db),
) -> list[schemas.MatterWorkspaceSummaryRead]:
    return list_matter_workspaces(db)


@router.get("/{matter_id}", response_model=schemas.MatterWorkspaceResponse)
def get_matter_workspace_route(
    matter_id: str,
    db: Session = Depends(get_db),
) -> schemas.MatterWorkspaceResponse:
    return get_matter_workspace(db, matter_id)


@router.get(
    "/{matter_id}/artifact-evidence",
    response_model=schemas.ArtifactEvidenceWorkspaceResponse,
)
def get_artifact_evidence_workspace_route(
    matter_id: str,
    db: Session = Depends(get_db),
) -> schemas.ArtifactEvidenceWorkspaceResponse:
    return get_artifact_evidence_workspace(db, matter_id)
