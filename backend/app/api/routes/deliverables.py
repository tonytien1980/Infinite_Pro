from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.domain import schemas
from app.services.tasks import get_deliverable_workspace, update_deliverable_metadata

router = APIRouter(prefix="/deliverables", tags=["deliverables"])


@router.get("/{deliverable_id}", response_model=schemas.DeliverableWorkspaceResponse)
def get_deliverable_workspace_route(
    deliverable_id: str,
    db: Session = Depends(get_db),
) -> schemas.DeliverableWorkspaceResponse:
    return get_deliverable_workspace(db, deliverable_id)


@router.put("/{deliverable_id}/metadata", response_model=schemas.DeliverableWorkspaceResponse)
def update_deliverable_metadata_route(
    deliverable_id: str,
    payload: schemas.DeliverableMetadataUpdateRequest,
    db: Session = Depends(get_db),
) -> schemas.DeliverableWorkspaceResponse:
    return update_deliverable_metadata(db, deliverable_id, payload)
