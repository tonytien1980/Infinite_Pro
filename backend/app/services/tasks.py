from __future__ import annotations

import logging
import re

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.domain import models, schemas
from app.domain.enums import ExternalDataStrategy, TaskStatus

logger = logging.getLogger(__name__)
EXTERNAL_DATA_STRATEGY_CONSTRAINT_TYPE = "external_data_strategy"
UNSPECIFIED_LABEL = "未指定"
DEFAULT_CLIENT_NAME = "尚未明確標示客戶"
DEFAULT_DOMAIN_LENS = "綜合"
EXTERNAL_DATA_STRATEGY_LABELS = {
    ExternalDataStrategy.STRICT: "僅使用我提供的資料（嚴格模式）",
    ExternalDataStrategy.SUPPLEMENTAL: "視需要補充外部資料",
    ExternalDataStrategy.LATEST: "優先使用最新外部資料（研究模式）",
}
CLIENT_STAGE_KEYWORDS = {
    "創業階段": ("創業", "早期", "新創", "起步", "初期", "pmf", "驗證"),
    "制度化階段": ("制度化", "流程", "sop", "管理", "內控", "團隊", "穩定化"),
    "規模化階段": ("規模化", "擴張", "成長", "授權", "跨部門", "複製", "scale"),
}
CLIENT_TYPE_KEYWORDS = {
    "中小企業": ("中小企業", "公司", "企業", "工廠", "零售", "品牌方"),
    "個人品牌與服務": ("個人品牌", "顧問", "教練", "講師", "服務型", "freelance"),
    "自媒體": ("自媒體", "內容", "社群", "頻道", "podcast", "newsletter", "youtuber"),
    "大型企業": ("大型企業", "集團", "上市", "總部", "跨國", "enterprise"),
}
DOMAIN_LENS_KEYWORDS = {
    "營運": ("營運", "流程", "效率", "供應鏈", "交付", "執行"),
    "財務": ("財務", "現金流", "損益", "預算", "成本", "資金"),
    "法務": ("法務", "合約", "條款", "責任", "權利", "compliance", "liability", "nda"),
    "行銷": ("行銷", "品牌", "內容", "流量", "廣告", "社群", "campaign"),
    "銷售": ("銷售", "業務", "客戶開發", "pipeline", "成交", "proposal", "提案"),
    "募資": ("募資", "投資人", "term sheet", "融資", "fundraising", "cap table"),
}
TASK_TYPE_DOMAIN_HINTS = {
    "contract_review": ["法務"],
    "document_restructuring": ["綜合"],
    "research_synthesis": ["綜合"],
    "complex_convergence": ["綜合"],
}
TASK_TYPE_WORKSTREAM_HINTS = {
    "contract_review": "法務審閱工作流",
    "document_restructuring": "文件重組工作流",
    "research_synthesis": "研究綜整工作流",
    "complex_convergence": "決策收斂工作流",
}


def resolve_external_data_strategy_from_constraints(
    constraints: list[models.Constraint] | list[schemas.ConstraintRead],
) -> ExternalDataStrategy:
    for constraint in constraints:
        if constraint.constraint_type != EXTERNAL_DATA_STRATEGY_CONSTRAINT_TYPE:
            continue

        try:
            return ExternalDataStrategy(constraint.description.strip())
        except ValueError:
            logger.warning(
                "Unknown external data strategy in constraint payload: %s",
                constraint.description,
            )

    return ExternalDataStrategy.SUPPLEMENTAL


def get_external_data_strategy_for_task(task: models.Task) -> ExternalDataStrategy:
    return resolve_external_data_strategy_from_constraints(task.constraints)


def _normalize_whitespace(value: str | None) -> str:
    return re.sub(r"\s+", " ", (value or "")).strip()


def _split_multiline_items(value: str | None) -> list[str]:
    return [item.strip() for item in (value or "").splitlines() if item.strip()]


def _unique_preserve_order(values: list[str]) -> list[str]:
    seen: set[str] = set()
    unique_values: list[str] = []
    for item in values:
        normalized = item.strip()
        if not normalized or normalized in seen:
            continue
        seen.add(normalized)
        unique_values.append(normalized)
    return unique_values


def _infer_stage_from_text(text: str) -> str:
    normalized = text.lower()
    for stage, keywords in CLIENT_STAGE_KEYWORDS.items():
        if any(keyword.lower() in normalized for keyword in keywords):
            return stage
    return UNSPECIFIED_LABEL


def _infer_client_type_from_text(text: str) -> str:
    normalized = text.lower()
    for client_type, keywords in CLIENT_TYPE_KEYWORDS.items():
        if any(keyword.lower() in normalized for keyword in keywords):
            return client_type
    return UNSPECIFIED_LABEL


def _infer_domain_lenses_from_text(task_type: str, text: str) -> list[str]:
    normalized = text.lower()
    detected = list(TASK_TYPE_DOMAIN_HINTS.get(task_type, []))
    for lens, keywords in DOMAIN_LENS_KEYWORDS.items():
        if any(keyword.lower() in normalized for keyword in keywords):
            detected.append(lens)
    detected = [item for item in detected if item != DEFAULT_DOMAIN_LENS]
    return _unique_preserve_order(detected) or [DEFAULT_DOMAIN_LENS]


def _infer_client_name(payload: schemas.TaskCreateRequest) -> str:
    return _normalize_whitespace(payload.client_name) or DEFAULT_CLIENT_NAME


def _infer_client_stage(payload: schemas.TaskCreateRequest) -> str:
    explicit = _normalize_whitespace(payload.client_stage)
    if explicit:
        return explicit
    text = " ".join(
        filter(
            None,
            [
                payload.title,
                payload.description,
                payload.background_text,
                payload.goal_description,
                payload.assumptions,
                payload.notes,
            ],
        )
    )
    return _infer_stage_from_text(text)


def _infer_client_type(payload: schemas.TaskCreateRequest) -> str:
    explicit = _normalize_whitespace(payload.client_type)
    if explicit:
        return explicit
    text = " ".join(
        filter(
            None,
            [
                payload.title,
                payload.description,
                payload.background_text,
                payload.subject_name,
                payload.notes,
            ],
        )
    )
    return _infer_client_type_from_text(text)


def _infer_domain_lenses(payload: schemas.TaskCreateRequest) -> list[str]:
    explicit = _unique_preserve_order(payload.domain_lenses)
    if explicit:
        return explicit
    text = " ".join(
        filter(
            None,
            [
                payload.title,
                payload.description,
                payload.background_text,
                payload.goal_description,
                payload.subject_name,
                payload.notes,
            ],
        )
    )
    return _infer_domain_lenses_from_text(payload.task_type, text)


def _infer_engagement_name(payload: schemas.TaskCreateRequest) -> str:
    return _normalize_whitespace(payload.engagement_name) or payload.title


def _infer_workstream_name(payload: schemas.TaskCreateRequest) -> str:
    return (
        _normalize_whitespace(payload.workstream_name)
        or _normalize_whitespace(payload.subject_name)
        or TASK_TYPE_WORKSTREAM_HINTS.get(payload.task_type, "顧問工作流")
    )


def _build_source_priority_from_payload(payload: schemas.TaskCreateRequest) -> str:
    source_hints: list[str] = []
    if payload.description.strip():
        source_hints.append("原始問題")
    if payload.background_text.strip():
        source_hints.append("背景脈絡")
    if payload.notes and payload.notes.strip():
        source_hints.append("既有資料整理")
    if payload.subject_name:
        source_hints.append("分析對象說明")

    if not source_hints:
        return "目前主要只能依賴任務名稱與少量上下文進行第一輪判斷。"

    if len(source_hints) == 1:
        joined = source_hints[0]
    else:
        joined = "、".join(source_hints[:-1]) + f" 與 {source_hints[-1]}"
    return f"系統會先依據 {joined} 形成第一輪判斷脈絡，再視需要補充其他來源。"


def _build_external_data_policy_text(strategy: ExternalDataStrategy) -> str:
    if strategy == ExternalDataStrategy.STRICT:
        return "這輪判斷只使用你提供的資料，不主動補充外部來源。"
    if strategy == ExternalDataStrategy.LATEST:
        return "這輪判斷會優先補充最新外部資料，再與你提供的材料一起評估。"
    return "這輪判斷會先使用你提供的資料，若證據不足再由 Host 視需要補充外部來源。"


def _infer_decision_title(payload: schemas.TaskCreateRequest) -> str:
    return _normalize_whitespace(payload.decision_title) or f"{payload.title}｜Decision Context"


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
    lines.append(
        f"外部資料使用方式：{EXTERNAL_DATA_STRATEGY_LABELS[payload.external_data_strategy]}"
    )
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


def _build_external_data_strategy_constraint(
    strategy: ExternalDataStrategy,
) -> schemas.ConstraintCreate:
    return schemas.ConstraintCreate(
        description=strategy.value,
        constraint_type=EXTERNAL_DATA_STRATEGY_CONSTRAINT_TYPE,
        severity="low",
    )


def task_load_options():
    return (
        selectinload(models.Task.clients),
        selectinload(models.Task.engagements),
        selectinload(models.Task.workstreams),
        selectinload(models.Task.decision_contexts),
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


def _primary_item(items: list[models.Client] | list[models.Engagement] | list[models.Workstream] | list[models.DecisionContext]):
    return items[0] if items else None


def _extract_assumptions(task: models.Task) -> list[str]:
    latest_context = task.contexts[-1] if task.contexts else None
    return _split_multiline_items(latest_context.assumptions if latest_context else None)


def _build_source_materials(task: models.Task) -> list[schemas.SourceMaterialRead]:
    materials: list[schemas.SourceMaterialRead] = []
    for item in task.uploads:
        summary = _normalize_whitespace((item.extracted_text or item.ingestion_error or "")[:500])
        materials.append(
            schemas.SourceMaterialRead(
                id=item.id,
                task_id=item.task_id,
                source_type=item.source_type,
                title=item.file_name,
                source_ref=item.storage_path,
                content_type=item.content_type,
                ingest_status=item.ingest_status,
                summary=summary,
                created_at=item.created_at,
            )
        )
    return materials


def _infer_artifact_type(source_document: models.SourceDocument) -> str:
    if source_document.source_type in {"manual_upload", "manual_input", "manual_url", "google_docs"}:
        return "working_material"
    if source_document.source_type == "external_search":
        return "external_reference"
    return "source_artifact"


def _build_artifacts(task: models.Task) -> list[schemas.ArtifactRead]:
    return [
        schemas.ArtifactRead(
            id=item.id,
            task_id=item.task_id,
            title=item.file_name,
            artifact_type=_infer_artifact_type(item),
            source_document_id=item.id,
            source_material_id=item.id,
            description=_normalize_whitespace((item.extracted_text or item.ingestion_error or "")[:280]),
            created_at=item.created_at,
        )
        for item in task.uploads
    ]


def _build_decision_context_read(task: models.Task) -> schemas.DecisionContextRead | None:
    decision_context = _primary_item(task.decision_contexts)
    if decision_context is None:
        return None

    visible_constraints = [
        item.description
        for item in task.constraints
        if item.constraint_type != EXTERNAL_DATA_STRATEGY_CONSTRAINT_TYPE
    ]
    return schemas.DecisionContextRead(
        id=decision_context.id,
        task_id=decision_context.task_id,
        client_id=decision_context.client_id,
        engagement_id=decision_context.engagement_id,
        workstream_id=decision_context.workstream_id,
        title=decision_context.title,
        summary=decision_context.summary,
        judgment_to_make=decision_context.judgment_to_make,
        domain_lenses=decision_context.domain_lenses,
        client_stage=decision_context.client_stage,
        client_type=decision_context.client_type,
        goals=[item.description for item in task.goals],
        constraints=visible_constraints,
        assumptions=_extract_assumptions(task),
        source_priority=decision_context.source_priority or "",
        external_data_policy=decision_context.external_data_policy or "",
        created_at=decision_context.created_at,
    )


def _build_ontology_spine_for_task(
    task: models.Task,
) -> tuple[
    schemas.ClientRead | None,
    schemas.EngagementRead | None,
    schemas.WorkstreamRead | None,
    schemas.DecisionContextRead | None,
    list[str],
    list[schemas.SourceMaterialRead],
    list[schemas.ArtifactRead],
]:
    client = _primary_item(task.clients)
    engagement = _primary_item(task.engagements)
    workstream = _primary_item(task.workstreams)
    decision_context = _build_decision_context_read(task)
    domain_lenses = (
        decision_context.domain_lenses
        if decision_context and decision_context.domain_lenses
        else workstream.domain_lenses if workstream else [DEFAULT_DOMAIN_LENS]
    )

    return (
        schemas.ClientRead.model_validate(client) if client else None,
        schemas.EngagementRead.model_validate(engagement) if engagement else None,
        schemas.WorkstreamRead.model_validate(workstream) if workstream else None,
        decision_context,
        domain_lenses,
        _build_source_materials(task),
        _build_artifacts(task),
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

    client = models.Client(
        task_id=task.id,
        name=_infer_client_name(payload),
        client_type=_infer_client_type(payload),
        client_stage=_infer_client_stage(payload),
        description=payload.client_description,
    )
    db.add(client)
    db.flush()

    engagement = models.Engagement(
        task_id=task.id,
        client_id=client.id,
        name=_infer_engagement_name(payload),
        description=payload.engagement_description or payload.description or None,
    )
    db.add(engagement)
    db.flush()

    domain_lenses = _infer_domain_lenses(payload)
    workstream = models.Workstream(
        task_id=task.id,
        engagement_id=engagement.id,
        name=_infer_workstream_name(payload),
        description=payload.workstream_description or payload.subject_description or None,
        domain_lenses=domain_lenses,
    )
    db.add(workstream)
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
    success_criteria = _infer_success_criteria(payload)
    db.add(
        models.Goal(
            task_id=task.id,
            goal_type=payload.goal_type,
            description=goal_description,
            success_criteria=success_criteria,
            priority="high",
        )
    )

    inferred_constraints = _infer_constraints(payload)
    for item in inferred_constraints:
        db.add(
            models.Constraint(
                task_id=task.id,
                constraint_type=item.constraint_type,
                description=item.description,
                severity=item.severity,
            )
        )

    strategy_constraint = _build_external_data_strategy_constraint(payload.external_data_strategy)
    db.add(
        models.Constraint(
            task_id=task.id,
            constraint_type=strategy_constraint.constraint_type,
            description=strategy_constraint.description,
            severity=strategy_constraint.severity,
        )
    )

    constraint_summary = "；".join(item.description for item in inferred_constraints)
    decision_context = models.DecisionContext(
        task_id=task.id,
        client_id=client.id,
        engagement_id=engagement.id,
        workstream_id=workstream.id,
        title=_infer_decision_title(payload),
        summary=_normalize_whitespace(payload.decision_summary)
        or f"本輪要圍繞「{payload.description or payload.title}」形成可採用的顧問判斷。",
        judgment_to_make=_normalize_whitespace(payload.judgment_to_make) or goal_description,
        domain_lenses=domain_lenses,
        client_stage=client.client_stage,
        client_type=client.client_type,
        goal_summary=goal_description,
        constraint_summary=constraint_summary or None,
        assumption_summary=payload.assumptions,
        source_priority=_build_source_priority_from_payload(payload),
        external_data_policy=_build_external_data_policy_text(payload.external_data_strategy),
    )
    db.add(decision_context)

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
    client, engagement, workstream, decision_context, domain_lenses, source_materials, artifacts = (
        _build_ontology_spine_for_task(task)
    )
    return schemas.TaskAggregateResponse(
        id=task.id,
        title=task.title,
        description=task.description,
        task_type=task.task_type,
        mode=task.mode,
        external_data_strategy=get_external_data_strategy_for_task(task),
        status=task.status,
        created_at=task.created_at,
        updated_at=task.updated_at,
        client=client,
        engagement=engagement,
        workstream=workstream,
        decision_context=decision_context,
        client_stage=decision_context.client_stage if decision_context else client.client_stage if client else None,
        client_type=decision_context.client_type if decision_context else client.client_type if client else None,
        domain_lenses=domain_lenses,
        assumptions=_extract_assumptions(task),
        source_materials=source_materials,
        artifacts=artifacts,
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
