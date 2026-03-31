from __future__ import annotations

from app.domain import models
from app.domain.enums import (
    ActionType,
    ApprovalPolicy,
    ApprovalStatus,
    AuditEventType,
    CapabilityArchetype,
    EngagementContinuityMode,
    FunctionType,
    WritebackDepth,
)

CAPABILITY_TO_FUNCTION_TYPE = {
    CapabilityArchetype.DIAGNOSE_ASSESS.value: FunctionType.DIAGNOSE_ASSESS,
    CapabilityArchetype.DECIDE_CONVERGE.value: FunctionType.DECIDE_CONVERGE,
    CapabilityArchetype.REVIEW_CHALLENGE.value: FunctionType.REVIEW_CHALLENGE,
    CapabilityArchetype.SYNTHESIZE_BRIEF.value: FunctionType.SYNTHESIZE_BRIEF,
    CapabilityArchetype.RESTRUCTURE_REFRAME.value: FunctionType.RESTRUCTURE_REFRAME,
    CapabilityArchetype.PLAN_ROADMAP.value: FunctionType.PLAN_ROADMAP,
    CapabilityArchetype.SCENARIO_COMPARISON.value: FunctionType.SCENARIO_COMPARISON,
    CapabilityArchetype.RISK_SURFACING.value: FunctionType.RISK_SURFACING,
}

TASK_TYPE_TO_FUNCTION_TYPE = {
    "contract_review": FunctionType.REVIEW_CHALLENGE,
    "document_restructuring": FunctionType.RESTRUCTURE_REFRAME,
    "research_synthesis": FunctionType.SYNTHESIZE_BRIEF,
    "complex_convergence": FunctionType.DECIDE_CONVERGE,
}


def resolve_function_type_for_task(
    task: models.Task,
    deliverable: models.Deliverable | None = None,
) -> FunctionType:
    if deliverable is not None:
        capability_frame = deliverable.content_structure.get("capability_frame")
        if isinstance(capability_frame, dict):
            capability = capability_frame.get("capability")
            if isinstance(capability, str) and capability in CAPABILITY_TO_FUNCTION_TYPE:
                return CAPABILITY_TO_FUNCTION_TYPE[capability]
    return TASK_TYPE_TO_FUNCTION_TYPE.get(task.task_type, FunctionType.SYNTHESIZE_BRIEF)


def resolve_function_type_for_continuation_action(action: str) -> FunctionType:
    if action == "checkpoint":
        return FunctionType.CHECKPOINT_UPDATE
    return FunctionType.OUTCOME_OBSERVATION


def resolve_action_type_for_plan(
    continuity_mode: EngagementContinuityMode,
) -> ActionType:
    if continuity_mode == EngagementContinuityMode.FOLLOW_UP:
        return ActionType.CHECKPOINT_FOLLOW_UP
    if continuity_mode == EngagementContinuityMode.CONTINUOUS:
        return ActionType.PROGRESSION_ACTION
    return ActionType.DECISION_FOLLOW_THROUGH


def resolve_action_type_for_execution(
    continuity_mode: EngagementContinuityMode,
) -> ActionType:
    if continuity_mode == EngagementContinuityMode.CONTINUOUS:
        return ActionType.ACTION_EXECUTION_TRACKING
    return resolve_action_type_for_plan(continuity_mode)


def resolve_continuation_action_type(action: str) -> ActionType:
    if action == "close":
        return ActionType.CLOSE_CASE
    if action == "reopen":
        return ActionType.REOPEN_CASE
    if action == "checkpoint":
        return ActionType.CHECKPOINT_FOLLOW_UP
    return ActionType.PROGRESSION_ACTION


def default_approval_policy(
    *,
    continuity_mode: EngagementContinuityMode,
    writeback_depth: WritebackDepth,
    target: str,
) -> ApprovalPolicy:
    if continuity_mode == EngagementContinuityMode.ONE_OFF:
        return ApprovalPolicy.NOT_REQUIRED
    if target == "action_plan" and writeback_depth == WritebackDepth.FULL:
        return ApprovalPolicy.CONSULTANT_CONFIRMATION
    return ApprovalPolicy.CONSULTANT_REVIEW


def initial_approval_status(policy: ApprovalPolicy) -> ApprovalStatus:
    if policy == ApprovalPolicy.NOT_REQUIRED:
        return ApprovalStatus.NOT_REQUIRED
    return ApprovalStatus.PENDING


def default_approval_summary(
    *,
    policy: ApprovalPolicy,
    status: ApprovalStatus,
    target_label: str,
    manual_confirmation: bool = False,
) -> str:
    if manual_confirmation:
        return f"{target_label}已由顧問明確操作並直接成立，不需要另外掛起正式核可。"
    if policy == ApprovalPolicy.NOT_REQUIRED:
        return f"{target_label}依目前案件策略直接成立，不需要額外核可。"
    if status == ApprovalStatus.PENDING:
        return f"{target_label}已寫回正式紀錄，但仍待顧問標記為正式核可。"
    if status == ApprovalStatus.APPROVED:
        return f"{target_label}已被標記為正式核可。"
    return f"{target_label}目前尚未通過正式核可。"


def build_audit_event(
    *,
    task_id: str,
    event_type: AuditEventType,
    summary: str,
    actor_label: str,
    matter_workspace_id: str | None = None,
    deliverable_id: str | None = None,
    decision_record_id: str | None = None,
    action_plan_id: str | None = None,
    action_execution_id: str | None = None,
    outcome_record_id: str | None = None,
    function_type: FunctionType | None = None,
    action_type: ActionType | None = None,
    approval_policy: ApprovalPolicy | None = None,
    approval_status: ApprovalStatus | None = None,
    event_payload: dict | None = None,
) -> models.AuditEvent:
    return models.AuditEvent(
        task_id=task_id,
        matter_workspace_id=matter_workspace_id,
        deliverable_id=deliverable_id,
        decision_record_id=decision_record_id,
        action_plan_id=action_plan_id,
        action_execution_id=action_execution_id,
        outcome_record_id=outcome_record_id,
        event_type=event_type.value,
        function_type=function_type.value if function_type else None,
        action_type=action_type.value if action_type else None,
        approval_policy=approval_policy.value if approval_policy else None,
        approval_status=approval_status.value if approval_status else None,
        actor_label=actor_label,
        summary=summary,
        event_payload=event_payload or {},
    )
