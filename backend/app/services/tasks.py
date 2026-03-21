from __future__ import annotations

import logging

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.domain import models, schemas
from app.domain.enums import TaskStatus

logger = logging.getLogger(__name__)


def _infer_background_brief(payload: schemas.TaskCreateRequest) -> str:
    if payload.background_text.strip():
        return payload.background_text

    lines = [
        f"工作流程：{payload.mode.value}",
        f"任務名稱：{payload.title}",
    ]
    if payload.description.strip():
        lines.append(f"核心問題：{payload.description.strip()}")
    if payload.subject_name:
        lines.append(f"分析對象：{payload.subject_name}")
    if payload.assumptions:
        lines.append(f"已確定假設：{payload.assumptions}")

    return "\n".join(lines)


def _infer_goal_description(payload: schemas.TaskCreateRequest) -> str:
    if payload.goal_description:
        return payload.goal_description

    subject = payload.subject_name or "目前議題"
    if payload.task_type == "contract_review":
        return f"針對「{subject}」整理高風險條款、主要風險與下一步審閱建議。"
    if payload.task_type == "document_restructuring":
        return f"針對「{subject}」提出可直接使用的新版結構、重組策略與改寫重點。"
    if payload.mode.value == "multi_agent":
        return f"針對「{subject}」收斂主要建議、主要風險與下一步決策方向。"
    return f"針對「{subject}」整理摘要、關鍵發現、建議與缺漏資訊。"


def _infer_success_criteria(payload: schemas.TaskCreateRequest) -> str:
    if payload.success_criteria:
        return payload.success_criteria

    if payload.task_type == "contract_review":
        return "能清楚標示高風險條款、主要風險、建議處理方式與待補文件。"
    if payload.task_type == "document_restructuring":
        return "能提出可直接重組的新版骨架、改寫方向與後續行動。"
    if payload.mode.value == "multi_agent":
        return "能形成可供決策討論的收斂摘要、建議、風險、行動項目與未收斂處。"
    return "能清楚整理摘要、關鍵發現、洞察、建議與研究缺口。"


def _infer_constraints(payload: schemas.TaskCreateRequest) -> list[schemas.ConstraintCreate]:
    if payload.constraints:
        return payload.constraints

    if payload.task_type == "contract_review":
        description = "在正式法務審閱前，本結果應視為內部 issue spotting / redline 草稿。"
    elif payload.task_type == "document_restructuring":
        description = "若原始草稿或上下文不足，重構建議應視為工作骨架而非最終定稿。"
    elif payload.mode.value == "multi_agent":
        description = "若證據厚度不足，多代理結果應視為收斂骨架而非最終決策。"
    else:
        description = "若資料來源仍偏薄，這份分析應視為第一輪顧問草稿。"

    return [
        schemas.ConstraintCreate(
            description=description,
            constraint_type="system_inferred",
            severity="medium",
        )
    ]


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
        raise HTTPException(status_code=404, detail="找不到指定任務。")
    return task


def create_task(db: Session, payload: schemas.TaskCreateRequest) -> models.Task:
    logger.info(
        "Creating task title=%s task_type=%s mode=%s",
        payload.title,
        payload.task_type,
        payload.mode.value,
    )
    background_brief = _infer_background_brief(payload)
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
        summary=background_brief,
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

    goal_description = _infer_goal_description(payload)
    db.add(
        models.Goal(
            task_id=task.id,
            goal_type=payload.goal_type,
            description=goal_description,
            success_criteria=_infer_success_criteria(payload),
            priority="high",
        )
    )

    for item in _infer_constraints(payload):
        db.add(
            models.Constraint(
                task_id=task.id,
                constraint_type=item.constraint_type,
                description=item.description,
                severity=item.severity,
            )
        )

    if background_brief.strip():
        db.add(
            models.Evidence(
                task_id=task.id,
                evidence_type="background_text",
                source_type="manual_input",
                source_ref=f"task_context:{context.id}",
                title="任務背景摘要",
                excerpt_or_summary=background_brief.strip()[:1500],
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
