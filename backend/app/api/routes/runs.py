from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.agents.host import HostOrchestrator
from app.core.auth import require_current_member
from app.core.database import get_db
from app.domain import schemas
from app.model_router.base import ModelProviderError
from app.services.tasks import ensure_task_allows_continuation_activity, get_loaded_task

router = APIRouter(prefix="/tasks", tags=["runs"])
logger = logging.getLogger(__name__)


@router.post("/{task_id}/run", response_model=schemas.ResearchRunResponse)
def run_task(
    task_id: str,
    current_member=Depends(require_current_member),
    db: Session = Depends(get_db),
) -> schemas.ResearchRunResponse:
    logger.info("Received run request for task %s", task_id)
    ensure_task_allows_continuation_activity(get_loaded_task(db, task_id))
    orchestrator = HostOrchestrator(db)
    try:
        return orchestrator.orchestrate_task(task_id)
    except ModelProviderError as exc:
        logger.warning("Model provider failed while running task %s: %s", task_id, exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc


@router.post("/{task_id}/runs/research-synthesis", response_model=schemas.ResearchRunResponse)
def run_research_synthesis(
    task_id: str,
    current_member=Depends(require_current_member),
    db: Session = Depends(get_db),
) -> schemas.ResearchRunResponse:
    ensure_task_allows_continuation_activity(get_loaded_task(db, task_id))
    orchestrator = HostOrchestrator(db)
    try:
        return orchestrator.orchestrate_task(task_id)
    except ModelProviderError as exc:
        logger.warning("Model provider failed while running research synthesis %s: %s", task_id, exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
