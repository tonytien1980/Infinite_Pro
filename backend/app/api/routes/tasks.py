from __future__ import annotations

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.domain import schemas
from app.services.tasks import (
    approve_task_writeback_record,
    create_task,
    get_loaded_task,
    get_task_history,
    list_tasks,
    serialize_task,
    update_task_extension_overrides,
)

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.post("", response_model=schemas.TaskAggregateResponse, status_code=status.HTTP_201_CREATED)
def create_task_route(
    payload: schemas.TaskCreateRequest,
    db: Session = Depends(get_db),
) -> schemas.TaskAggregateResponse:
    task = create_task(db, payload)
    return serialize_task(task)


@router.get("", response_model=list[schemas.TaskListItemResponse])
def list_tasks_route(db: Session = Depends(get_db)) -> list[schemas.TaskListItemResponse]:
    return list_tasks(db)


@router.get("/{task_id}", response_model=schemas.TaskAggregateResponse)
def get_task_route(task_id: str, db: Session = Depends(get_db)) -> schemas.TaskAggregateResponse:
    task = get_loaded_task(db, task_id)
    return serialize_task(task)


@router.put("/{task_id}/extensions", response_model=schemas.TaskAggregateResponse)
def update_task_extensions_route(
    task_id: str,
    payload: schemas.TaskExtensionOverrideRequest,
    db: Session = Depends(get_db),
) -> schemas.TaskAggregateResponse:
    task = update_task_extension_overrides(db, task_id, payload)
    return serialize_task(task)


@router.post("/{task_id}/writeback-approval", response_model=schemas.TaskAggregateResponse)
def approve_task_writeback_route(
    task_id: str,
    payload: schemas.TaskWritebackApprovalRequest,
    db: Session = Depends(get_db),
) -> schemas.TaskAggregateResponse:
    return approve_task_writeback_record(db, task_id, payload)


@router.get("/{task_id}/history", response_model=schemas.TaskHistoryResponse)
def get_task_history_route(task_id: str, db: Session = Depends(get_db)) -> schemas.TaskHistoryResponse:
    return get_task_history(db, task_id)
