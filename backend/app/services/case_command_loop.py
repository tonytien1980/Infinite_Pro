from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass(slots=True)
class MatterCommandModel:
    command_posture: str
    command_posture_label: str
    focus_summary: str
    primary_task_id: str | None
    primary_task_title: str
    primary_task_reason: str
    blocker_summary: str
    deliverable_direction_summary: str
    next_step_summary: str


@dataclass(slots=True)
class DecisionBriefModel:
    posture: str
    posture_label: str
    question_summary: str
    options_summary: str
    risk_summary: str
    recommendation_summary: str
    next_action_summary: str
    boundary_note: str


@dataclass(slots=True)
class WritebackApprovalModel:
    posture: str
    posture_label: str
    summary: str
    primary_action_label: str
    primary_action_summary: str
    candidate_summary: str
    boundary_note: str


def _clean_text(value: Any) -> str:
    if isinstance(value, str):
        return value.strip()
    return ""


def _first_text(*values: Any) -> str:
    for value in values:
        text = _clean_text(value)
        if text:
            return text
    return ""


def _first_non_none(*values: Any) -> Any:
    for value in values:
        if value is not None:
            return value
    return None


def _text_attr(value: Any, attr: str) -> str:
    return _clean_text(getattr(value, attr, ""))


def _summarize_titles(items: list[Any], *, attr: str, limit: int = 3) -> str:
    titles = [_text_attr(item, attr) for item in items[:limit]]
    return "、".join(item for item in titles if item)


def build_matter_command(
    *,
    summary: Any,
    related_tasks: list[Any],
    related_deliverables: list[Any],
    evidence_gap_records: list[Any],
) -> MatterCommandModel:
    primary_task = related_tasks[0] if related_tasks else None
    has_open_gaps = any(
        _clean_text(getattr(item, "status", "")) != "resolved" for item in evidence_gap_records
    )
    has_deliverable = bool(related_deliverables)

    if has_open_gaps:
        posture = "fill_evidence"
        label = "先補依據"
        blocker_summary = "目前高影響缺口仍在，應先補來源、證據或脈絡。"
    elif has_deliverable:
        posture = "review_deliverable"
        label = "先回交付物"
        blocker_summary = "正式結果已形成，現在應先確認結果站不站得住。"
    else:
        posture = "push_task"
        label = "先推工作紀錄"
        blocker_summary = "目前沒有結果層阻塞，應先把主工作往前推。"

    focus_summary = _first_text(
        _text_attr(summary, "active_work_summary"),
        _text_attr(summary, "workspace_summary"),
        "目前案件世界尚未形成可直接回看的摘要。",
    )
    latest_deliverable_title = _text_attr(related_deliverables[0], "title") if has_deliverable else ""

    return MatterCommandModel(
        command_posture=posture,
        command_posture_label=label,
        focus_summary=focus_summary,
        primary_task_id=getattr(primary_task, "id", None),
        primary_task_title=_first_text(
            _text_attr(primary_task, "title"),
            "目前沒有可直接推進的工作紀錄",
        ),
        primary_task_reason=_first_text(
            _text_attr(primary_task, "decision_context_title"),
            _text_attr(summary, "current_decision_context_title"),
            "先沿著這輪主決策往前推。",
        ),
        blocker_summary=blocker_summary,
        deliverable_direction_summary=(
            f"下一個正式結果應收斂到「{latest_deliverable_title}」。"
            if latest_deliverable_title
            else "目前應先把 task 收成第一版正式結果，再決定交付物版本。"
        ),
        next_step_summary=label,
    )


def build_decision_brief(
    *,
    task: Any,
    linked_risks: list[Any],
    linked_recommendations: list[Any],
    linked_action_items: list[Any],
    latest_deliverable: Any,
) -> DecisionBriefModel:
    decision_context = _first_non_none(
        getattr(task, "world_decision_context", None),
        getattr(task, "decision_context", None),
        getattr(task, "slice_decision_context", None),
    )

    question_summary = _first_text(
        _text_attr(decision_context, "judgment_to_make"),
        _text_attr(task, "description"),
        _text_attr(task, "title"),
    )
    latest_deliverable_title = _text_attr(latest_deliverable, "title")
    latest_deliverable_summary = _text_attr(latest_deliverable, "summary")
    recommendation_summary_text = _summarize_titles(linked_recommendations, attr="summary")
    action_summary_text = _summarize_titles(linked_action_items, attr="description")
    risk_summary_text = _summarize_titles(linked_risks, attr="title")

    if latest_deliverable and linked_recommendations and linked_action_items:
        posture = "publish_ready"
        posture_label = "可發布"
    elif latest_deliverable or linked_recommendations or linked_action_items:
        posture = "decision_ready"
        posture_label = "可決策"
    else:
        posture = "draft"
        posture_label = "草稿"

    options_parts = [
        part
        for part in (
            f"建議主軸：{recommendation_summary_text}" if recommendation_summary_text else "",
            f"接續動作：{action_summary_text}" if action_summary_text else "",
            f"目前交付物：{latest_deliverable_title}" if latest_deliverable_title else "",
        )
        if part
    ]
    options_summary = "；".join(options_parts) or "目前仍以收斂 decision brief 為主。"

    if risk_summary_text:
        risk_summary = f"高風險項目集中在：{risk_summary_text}。"
    elif latest_deliverable_summary:
        risk_summary = (
            "最新交付物已可回看，但仍要確認其 evidence basis 是否足夠。"
            f"{latest_deliverable_summary}"
        )
    else:
        risk_summary = "目前尚未看到明確高風險項目，但仍需先確認證據是否足夠。"

    recommendation_summary = (
        "先把目前資料收斂成可核對的 decision brief，再決定是否回寫交付物。"
        if posture == "draft"
        else "先沿著現有結論往前推，必要時再補最後一輪證據或改版交付物。"
    )
    if recommendation_summary_text:
        recommendation_summary = (
            f"{recommendation_summary} 目前候選建議包含：{recommendation_summary_text}。"
        )

    next_action_summary = (
        "先補最少必要資訊，讓 Host 能把 decision brief 推進到可判讀狀態。"
        if posture == "draft"
        else "先用現有 evidence 與交付物收斂下一步，再決定是否進入正式 writeback。"
    )
    if action_summary_text:
        next_action_summary = (
            f"{next_action_summary} 目前可接續的動作有：{action_summary_text}。"
        )

    return DecisionBriefModel(
        posture=posture,
        posture_label=posture_label,
        question_summary=question_summary,
        options_summary=options_summary,
        risk_summary=risk_summary,
        recommendation_summary=recommendation_summary,
        next_action_summary=next_action_summary,
        boundary_note="這份 decision brief 只提供命令迴圈摘要，最終決策仍由 Host 與顧問核定。",
    )


def build_writeback_approval(
    *,
    decision_records: list[Any],
    action_plans: list[Any],
    outcome_records: list[Any],
    precedent_candidate_summary: Any,
) -> WritebackApprovalModel:
    latest_decision_record = decision_records[0] if decision_records else None
    latest_action_plan = action_plans[0] if action_plans else None
    latest_outcome_record = outcome_records[0] if outcome_records else None

    total_candidates = getattr(precedent_candidate_summary, "total_candidates", 0) or 0
    deliverable_candidate_count = (
        getattr(precedent_candidate_summary, "deliverable_candidate_count", 0) or 0
    )
    recommendation_candidate_count = (
        getattr(precedent_candidate_summary, "recommendation_candidate_count", 0) or 0
    )
    candidate_summary = _first_text(
        _text_attr(precedent_candidate_summary, "summary"),
        "目前沒有可用的 precedent 候選摘要。",
    )

    if latest_outcome_record and latest_action_plan and latest_decision_record:
        posture = "completed"
        posture_label = "已完成"
    elif latest_action_plan or latest_decision_record:
        posture = "formal_approval"
        posture_label = "正式核可"
    elif total_candidates > 0:
        posture = "candidate_review"
        posture_label = "候選檢視"
    else:
        posture = "minimal"
        posture_label = "最小寫回"

    summary = (
        f"目前已有 {len(decision_records)} 筆 decision record、"
        f"{len(action_plans)} 份 action plan、"
        f"{len(outcome_records)} 筆 outcome record。"
    )

    if latest_action_plan:
        primary_action_label = "先核 action plan"
        primary_action_summary = _first_text(
            _text_attr(latest_action_plan, "summary"),
            _text_attr(latest_action_plan, "title"),
            "目前 action plan 已形成，但仍待正式核可。",
        )
    elif latest_decision_record:
        primary_action_label = "先核 decision record"
        primary_action_summary = _first_text(
            _text_attr(latest_decision_record, "decision_summary"),
            _text_attr(latest_decision_record, "title"),
            "目前 decision record 已形成，但仍待正式核可。",
        )
    elif total_candidates > 0:
        primary_action_label = "先看候選寫回"
        primary_action_summary = (
            f"目前有 {total_candidates} 個 precedent 候選，其中交付物候選 {deliverable_candidate_count} 個、"
            f"建議候選 {recommendation_candidate_count} 個。"
        )
    else:
        primary_action_label = "先建立最小寫回"
        primary_action_summary = "目前還沒有可直接核對的 writeback 候選。"

    if total_candidates > 0 and not _text_attr(precedent_candidate_summary, "summary"):
        candidate_summary = (
            f"目前有 {total_candidates} 個 precedent 候選，其中交付物候選 {deliverable_candidate_count} 個、"
            f"建議候選 {recommendation_candidate_count} 個。"
        )

    return WritebackApprovalModel(
        posture=posture,
        posture_label=posture_label,
        summary=summary,
        primary_action_label=primary_action_label,
        primary_action_summary=primary_action_summary,
        candidate_summary=candidate_summary,
        boundary_note="這個 writeback approval read model 只描述狀態，正式核可仍需 Host / 顧問操作。",
    )
