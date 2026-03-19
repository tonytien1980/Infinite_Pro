from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.agents.host import HostOrchestrator
from app.core.database import get_db
from app.domain import schemas

router = APIRouter(prefix="/tasks", tags=["runs"])


@router.post("/{task_id}/runs/research-synthesis", response_model=schemas.ResearchRunResponse)
def run_research_synthesis(
    task_id: str,
    db: Session = Depends(get_db),
) -> schemas.ResearchRunResponse:
    orchestrator = HostOrchestrator(db)
    return orchestrator.run_research_synthesis(task_id)
