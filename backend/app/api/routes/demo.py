from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.auth import require_permission
from app.core.database import get_db
from app.demo.schemas import DemoWorkspaceRead
from app.services.demo_workspace import get_demo_workspace_snapshot

router = APIRouter(prefix="/demo", tags=["demo"])


@router.get("/workspace", response_model=DemoWorkspaceRead)
def get_demo_workspace_route(
    current_member=Depends(require_permission("access_demo_workspace")),
    db: Session = Depends(get_db),
) -> DemoWorkspaceRead:
    return get_demo_workspace_snapshot(db, firm_id=current_member.firm.id)
