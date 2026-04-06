from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.agents.host import HostOrchestrator
from app.core.auth import require_permission
from app.core.database import get_db
from app.domain import schemas
from app.model_router.base import ModelProviderAccessError, ModelProviderError
from app.services.tasks import ensure_task_allows_continuation_activity, get_loaded_task

router = APIRouter(prefix="/tasks", tags=["runs"])
logger = logging.getLogger(__name__)


@router.post("/{task_id}/run", response_model=schemas.ResearchRunResponse)
def run_task(
    task_id: str,
    current_member=Depends(require_permission("access_firm_workspace")),
    db: Session = Depends(get_db),
) -> schemas.ResearchRunResponse:
    logger.info("Received run request for task %s", task_id)
    ensure_task_allows_continuation_activity(get_loaded_task(db, task_id))
    try:
        orchestrator = HostOrchestrator(db, current_member=current_member)
        return orchestrator.orchestrate_task(task_id)
    except ModelProviderAccessError as exc:
        logger.warning("Model provider access denied for task %s: %s", task_id, exc)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        ) from exc
    except ModelProviderError as exc:
        logger.warning("Model provider failed while running task %s: %s", task_id, exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc


@router.post("/{task_id}/runs/research-synthesis", response_model=schemas.ResearchRunResponse)
def run_research_synthesis(
    task_id: str,
    current_member=Depends(require_permission("access_firm_workspace")),
    db: Session = Depends(get_db),
) -> schemas.ResearchRunResponse:
    ensure_task_allows_continuation_activity(get_loaded_task(db, task_id))
    try:
        orchestrator = HostOrchestrator(db, current_member=current_member)
        return orchestrator.orchestrate_task(task_id)
    except ModelProviderAccessError as exc:
        logger.warning("Model provider access denied for research synthesis %s: %s", task_id, exc)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        ) from exc
    except ModelProviderError as exc:
        logger.warning("Model provider failed while running research synthesis %s: %s", task_id, exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
