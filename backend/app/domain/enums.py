from __future__ import annotations

from enum import Enum


class FlowMode(str, Enum):
    MULTI_AGENT = "multi_agent"
    SPECIALIST = "specialist"


class CapabilityArchetype(str, Enum):
    DIAGNOSE_ASSESS = "diagnose_assess"
    DECIDE_CONVERGE = "decide_converge"
    REVIEW_CHALLENGE = "review_challenge"
    SYNTHESIZE_BRIEF = "synthesize_brief"
    RESTRUCTURE_REFRAME = "restructure_reframe"
    PLAN_ROADMAP = "plan_roadmap"
    SCENARIO_COMPARISON = "scenario_comparison"
    RISK_SURFACING = "risk_surfacing"


class FunctionType(str, Enum):
    DIAGNOSE_ASSESS = "diagnose_assess"
    DECIDE_CONVERGE = "decide_converge"
    REVIEW_CHALLENGE = "review_challenge"
    SYNTHESIZE_BRIEF = "synthesize_brief"
    RESTRUCTURE_REFRAME = "restructure_reframe"
    PLAN_ROADMAP = "plan_roadmap"
    SCENARIO_COMPARISON = "scenario_comparison"
    RISK_SURFACING = "risk_surfacing"
    CHECKPOINT_UPDATE = "checkpoint_update"
    OUTCOME_OBSERVATION = "outcome_observation"


class InputEntryMode(str, Enum):
    ONE_LINE_INQUIRY = "one_line_inquiry"
    SINGLE_DOCUMENT_INTAKE = "single_document_intake"
    MULTI_MATERIAL_CASE = "multi_material_case"


class EngagementContinuityMode(str, Enum):
    ONE_OFF = "one_off"
    FOLLOW_UP = "follow_up"
    CONTINUOUS = "continuous"


class WritebackDepth(str, Enum):
    MINIMAL = "minimal"
    MILESTONE = "milestone"
    FULL = "full"


class ActionType(str, Enum):
    DECISION_FOLLOW_THROUGH = "decision_follow_through"
    CHECKPOINT_FOLLOW_UP = "checkpoint_follow_up"
    PROGRESSION_ACTION = "progression_action"
    ACTION_EXECUTION_TRACKING = "action_execution_tracking"
    CLOSE_CASE = "close_case"
    REOPEN_CASE = "reopen_case"


class ApprovalPolicy(str, Enum):
    NOT_REQUIRED = "not_required"
    CONSULTANT_REVIEW = "consultant_review"
    CONSULTANT_CONFIRMATION = "consultant_confirmation"


class ApprovalStatus(str, Enum):
    NOT_REQUIRED = "not_required"
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class AuditEventType(str, Enum):
    WRITEBACK_GENERATED = "writeback_generated"
    APPROVAL_RECORDED = "approval_recorded"
    CONTINUATION_ACTION_APPLIED = "continuation_action_applied"


class CanonicalizationObjectFamily(str, Enum):
    SOURCE_CHAIN = "source_chain"


class CanonicalizationMatchBasis(str, Enum):
    CONTENT_DIGEST_MATCH = "content_digest_match"
    SOURCE_REF_MATCH = "source_ref_match"
    DISPLAY_NAME_MATCH = "display_name_match"


class CanonicalizationReviewStatus(str, Enum):
    PENDING_REVIEW = "pending_review"
    HUMAN_CONFIRMED_CANONICAL_ROW = "human_confirmed_canonical_row"
    KEEP_SEPARATE = "keep_separate"
    SPLIT = "split"


class PresenceState(str, Enum):
    EXPLICIT = "explicit"
    INFERRED = "inferred"
    PROVISIONAL = "provisional"
    MISSING = "missing"
    NOT_APPLICABLE = "not_applicable"


class DeliverableClass(str, Enum):
    EXPLORATORY_BRIEF = "exploratory_brief"
    ASSESSMENT_REVIEW_MEMO = "assessment_review_memo"
    DECISION_ACTION_DELIVERABLE = "decision_action_deliverable"


class ObjectSetType(str, Enum):
    EVIDENCE_SET_V1 = "evidence_set_v1"
    RISK_SET_V1 = "risk_set_v1"


class ObjectSetScopeType(str, Enum):
    TASK = "task"
    DELIVERABLE = "deliverable"
    MATTER = "matter"


class ObjectSetCreationMode(str, Enum):
    HOST_CURATED = "host_curated"
    DELIVERABLE_SUPPORT_BUNDLE = "deliverable_support_bundle"


class ObjectSetLifecycleStatus(str, Enum):
    ACTIVE = "active"
    ARCHIVED = "archived"


class ObjectSetMembershipSource(str, Enum):
    HOST_CURATED = "host_curated"
    DELIVERABLE_SUPPORT_BUNDLE = "deliverable_support_bundle"


class ExternalDataStrategy(str, Enum):
    STRICT = "strict"
    SUPPLEMENTAL = "supplemental"
    LATEST = "latest"


class TaskStatus(str, Enum):
    DRAFT = "draft"
    READY = "ready"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class RunStatus(str, Enum):
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class AgentCategory(str, Enum):
    CORE = "core"
    SPECIALIST = "specialist"


class AgentStatus(str, Enum):
    ACTIVE = "active"
    DISABLED = "disabled"
    DEPRECATED = "deprecated"
