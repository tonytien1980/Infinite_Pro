from __future__ import annotations

import logging

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.domain import models, schemas
from app.domain.enums import TaskStatus

logger = logging.getLogger(__name__)


def task_load_options():
    return (
        selectinload(models.Task.contexts),
        selectinload(models.Task.subjects),
        selectinload(models.Task.goals),
        selectinload(models.Task.constraints),
        selectinload(models.Task.uploads),
        selectinload(models.Task.evidence),
        selectinload(models.Task.insights),
        selectinload(models.Task.risks),
        selectinload(models.Task.options),
        selectinload(models.Task.recommendations),
        selectinload(models.Task.action_items),
        selectinload(models.Task.deliverables),
        selectinload(models.Task.runs),
    )


def get_loaded_task(db: Session, task_id: str) -> models.Task:
    statement = select(models.Task).options(*task_load_options()).where(models.Task.id == task_id)
    task = db.scalars(statement).unique().one_or_none()
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found.")
    return task


def create_task(db: Session, payload: schemas.TaskCreateRequest) -> models.Task:
    logger.info(
        "Creating task title=%s task_type=%s mode=%s",
        payload.title,
        payload.task_type,
        payload.mode.value,
    )
    task = models.Task(
        title=payload.title,
        description=payload.description,
        task_type=payload.task_type,
        mode=payload.mode.value,
        status=TaskStatus.READY.value,
    )
    db.add(task)
    db.flush()

    context = models.TaskContext(
        task_id=task.id,
        summary=payload.background_text,
        assumptions=payload.assumptions,
        notes=payload.notes,
        version=1,
    )
    db.add(context)
    db.flush()

    if payload.subject_name:
        db.add(
            models.Subject(
                task_id=task.id,
                subject_type=payload.subject_type,
                name=payload.subject_name,
                description=payload.subject_description,
                source_ref=None,
            )
        )

    goal_description = payload.goal_description or "Create a structured research synthesis deliverable."
    db.add(
        models.Goal(
            task_id=task.id,
            goal_type=payload.goal_type,
            description=goal_description,
            success_criteria=payload.success_criteria,
            priority="high",
        )
    )

    for item in payload.constraints:
        db.add(
            models.Constraint(
                task_id=task.id,
                constraint_type=item.constraint_type,
                description=item.description,
                severity=item.severity,
            )
        )

    if payload.background_text.strip():
        db.add(
            models.Evidence(
                task_id=task.id,
                evidence_type="background_text",
                source_type="manual_input",
                source_ref=f"task_context:{context.id}",
                title="Manual background context",
                excerpt_or_summary=payload.background_text.strip()[:1500],
                reliability_level="user_provided",
            )
        )

    db.commit()
    return get_loaded_task(db, task.id)


def list_tasks(db: Session) -> list[schemas.TaskListItemResponse]:
    statement = select(models.Task).options(
        selectinload(models.Task.evidence),
        selectinload(models.Task.deliverables),
        selectinload(models.Task.runs),
    ).order_by(models.Task.updated_at.desc())
    tasks = db.scalars(statement).unique().all()

    items: list[schemas.TaskListItemResponse] = []
    for task in tasks:
        latest_deliverable = max(task.deliverables, key=lambda item: item.version, default=None)
        items.append(
            schemas.TaskListItemResponse(
                id=task.id,
                title=task.title,
                description=task.description,
                task_type=task.task_type,
                mode=task.mode,
                status=task.status,
                created_at=task.created_at,
                updated_at=task.updated_at,
                evidence_count=len(task.evidence),
                deliverable_count=len(task.deliverables),
                run_count=len(task.runs),
                latest_deliverable_title=latest_deliverable.title if latest_deliverable else None,
            )
        )
    return items


def serialize_task(task: models.Task) -> schemas.TaskAggregateResponse:
    return schemas.TaskAggregateResponse(
        id=task.id,
        title=task.title,
        description=task.description,
        task_type=task.task_type,
        mode=task.mode,
        status=task.status,
        created_at=task.created_at,
        updated_at=task.updated_at,
        contexts=[schemas.TaskContextRead.model_validate(item) for item in task.contexts],
        subjects=[schemas.SubjectRead.model_validate(item) for item in task.subjects],
        goals=[schemas.GoalRead.model_validate(item) for item in task.goals],
        constraints=[schemas.ConstraintRead.model_validate(item) for item in task.constraints],
        uploads=[schemas.SourceDocumentRead.model_validate(item) for item in task.uploads],
        evidence=[schemas.EvidenceRead.model_validate(item) for item in task.evidence],
        insights=[schemas.InsightRead.model_validate(item) for item in task.insights],
        risks=[schemas.RiskRead.model_validate(item) for item in task.risks],
        options=[schemas.OptionRead.model_validate(item) for item in task.options],
        recommendations=[
            schemas.RecommendationRead.model_validate(item) for item in task.recommendations
        ],
        action_items=[schemas.ActionItemRead.model_validate(item) for item in task.action_items],
        deliverables=[schemas.DeliverableRead.model_validate(item) for item in task.deliverables],
        runs=[schemas.TaskRunRead.model_validate(item) for item in task.runs],
    )


def get_task_history(db: Session, task_id: str) -> schemas.TaskHistoryResponse:
    task = get_loaded_task(db, task_id)
    return schemas.TaskHistoryResponse(
        task_id=task.id,
        runs=[schemas.TaskRunRead.model_validate(item) for item in task.runs],
        deliverables=[schemas.DeliverableRead.model_validate(item) for item in task.deliverables],
        recommendations=[
            schemas.RecommendationRead.model_validate(item) for item in task.recommendations
        ],
        action_items=[schemas.ActionItemRead.model_validate(item) for item in task.action_items],
        evidence=[schemas.EvidenceRead.model_validate(item) for item in task.evidence],
    )
