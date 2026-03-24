from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.domain import schemas
from app.services.tasks import get_deliverable_workspace

router = APIRouter(prefix="/deliverables", tags=["deliverables"])


@router.get("/{deliverable_id}", response_model=schemas.DeliverableWorkspaceResponse)
def get_deliverable_workspace_route(
    deliverable_id: str,
    db: Session = Depends(get_db),
) -> schemas.DeliverableWorkspaceResponse:
    return get_deliverable_workspace(db, deliverable_id)
