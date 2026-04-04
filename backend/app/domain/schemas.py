from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field

from app.domain.enums import (
    ActionType,
    AdoptionFeedbackStatus,
    ApprovalPolicy,
    ApprovalStatus,
    AuditEventType,
    CanonicalizationMatchBasis,
    CanonicalizationObjectFamily,
    CanonicalizationReviewStatus,
    DeliverableClass,
    EngagementContinuityMode,
    ExternalDataStrategy,
    FlowMode,
    FunctionType,
    InputEntryMode,
    ObjectSetCreationMode,
    ObjectSetLifecycleStatus,
    ObjectSetMembershipSource,
    ObjectSetScopeType,
    ObjectSetType,
    PrecedentCandidateStatus,
    PrecedentCandidateType,
    PresenceState,
    RunStatus,
    TaskStatus,
    WritebackDepth,
)
from app.extensions.schemas import PackContractBaseline


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class FlagshipLaneRead(BaseModel):
    lane_id: str = "diagnostic_start"
    label: str = ""
    summary: str = ""
    next_step_summary: str = ""
    upgrade_note: str = ""
    current_output_label: str = ""
    current_output_summary: str = ""
    upgrade_target_label: str = ""
    upgrade_requirements: list[str] = Field(default_factory=list)
    upgrade_ready: bool = False
    boundary_note: str = ""


class ResearchGuidanceRead(BaseModel):
    status: str = "not_needed"
    label: str = ""
    summary: str = ""
    recommended_depth: str = ""
    suggested_questions: list[str] = Field(default_factory=list)
    evidence_gap_focus: list[str] = Field(default_factory=list)
    source_quality_summary: str = ""
    freshness_summary: str = ""
    contradiction_watchouts: list[str] = Field(default_factory=list)
    citation_ready_summary: str = ""
    evidence_gap_closure_plan: list[str] = Field(default_factory=list)
    stop_condition: str = ""
    handoff_summary: str = ""
    latest_run_summary: str = ""
    execution_owner_label: str = ""
    supplement_boundary_note: str = ""
    boundary_note: str = ""


class ConstraintCreate(BaseModel):
    description: str = Field(min_length=1)
    constraint_type: str = "general"
    severity: str = "medium"


class InitialIntakeFileDescriptor(BaseModel):
    file_name: str = Field(min_length=1)
    content_type: str | None = None
    file_size: int = 0


class TaskCreateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str = ""
    task_type: str = "research_synthesis"
    mode: FlowMode = FlowMode.SPECIALIST
    entry_preset: InputEntryMode = InputEntryMode.ONE_LINE_INQUIRY
    external_data_strategy: ExternalDataStrategy = ExternalDataStrategy.SUPPLEMENTAL
    engagement_continuity_mode: EngagementContinuityMode = EngagementContinuityMode.ONE_OFF
    writeback_depth: WritebackDepth = WritebackDepth.MINIMAL
    client_name: str | None = None
    client_type: str | None = None
    client_stage: str | None = None
    client_description: str | None = None
    engagement_name: str | None = None
    engagement_description: str | None = None
    workstream_name: str | None = None
    workstream_description: str | None = None
    domain_lenses: list[str] = Field(default_factory=list)
    decision_title: str | None = None
    decision_summary: str | None = None
    judgment_to_make: str | None = None
    background_text: str = ""
    assumptions: str | None = None
    notes: str | None = None
    subject_name: str | None = None
    subject_type: str = "topic"
    subject_description: str | None = None
    goal_description: str | None = None
    goal_type: str = "research_synthesis"
    success_criteria: str | None = None
    constraints: list[ConstraintCreate] = Field(default_factory=list)
    initial_source_urls: list[str] = Field(default_factory=list)
    initial_pasted_text: str = ""
    initial_pasted_title: str | None = None
    initial_file_descriptors: list[InitialIntakeFileDescriptor] = Field(default_factory=list)


class TaskExtensionOverrideRequest(BaseModel):
    pack_override_ids: list[str] = Field(default_factory=list)
    agent_override_ids: list[str] = Field(default_factory=list)


class MatterWorkspaceMetadataUpdateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    summary: str = ""
    status: Literal["active", "paused", "closed", "archived"]


class MatterWorkspaceContentSectionsRequest(BaseModel):
    core_question: str = ""
    analysis_focus: str = ""
    constraints_and_risks: str = ""
    next_steps: str = ""


class MatterWorkspaceUpdateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    summary: str = ""
    status: Literal["active", "paused", "closed", "archived"]
    content_sections: MatterWorkspaceContentSectionsRequest = Field(
        default_factory=MatterWorkspaceContentSectionsRequest
    )


class MatterContinuationActionRequest(BaseModel):
    action: Literal["close", "reopen", "checkpoint", "record_outcome"]
    summary: str = ""
    note: str = ""
    action_status: Literal["planned", "in_progress", "blocked", "completed", "review_required"] | None = None


class TaskWritebackApprovalRequest(BaseModel):
    target_type: Literal["decision_record", "action_plan"]
    target_id: str
    note: str = ""


class MatterCanonicalizationReviewRequest(BaseModel):
    review_key: str
    resolution: Literal["human_confirmed_canonical_row", "keep_separate", "split"]
    note: str = ""


class MatterPrecedentDuplicateReviewRequest(BaseModel):
    review_key: str
    resolution: Literal["human_confirmed_canonical_row", "keep_separate", "split"]
    note: str = ""


class DeliverableMetadataUpdateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    summary: str = ""
    status: Literal["draft", "pending_confirmation", "final", "archived"]
    version_tag: str = Field(min_length=1, max_length=50)
    event_note: str = ""


class DeliverableContentSectionsRequest(BaseModel):
    executive_summary: str = ""
    recommendations: list[str] = Field(default_factory=list)
    risks: list[str] = Field(default_factory=list)
    action_items: list[str] = Field(default_factory=list)
    evidence_basis: list[str] = Field(default_factory=list)


class DeliverableWorkspaceUpdateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    summary: str = ""
    status: Literal["draft", "pending_confirmation", "final", "archived"]
    version_tag: str = Field(min_length=1, max_length=50)
    event_note: str = ""
    content_sections: DeliverableContentSectionsRequest = Field(
        default_factory=DeliverableContentSectionsRequest
    )


class DeliverablePublishRequest(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    summary: str = ""
    version_tag: str = Field(min_length=1, max_length=50)
    publish_note: str = ""
    artifact_formats: list[Literal["markdown", "docx"]] = Field(
        default_factory=lambda: ["markdown", "docx"]
    )
    content_sections: DeliverableContentSectionsRequest = Field(
        default_factory=DeliverableContentSectionsRequest
    )


class AdoptionFeedbackRequest(BaseModel):
    feedback_status: AdoptionFeedbackStatus
    reason_codes: list[str] | None = None
    note: str | None = None


class PrecedentCandidateStatusUpdateRequest(BaseModel):
    candidate_status: PrecedentCandidateStatus


class TaskContextRead(ORMModel):
    id: str
    task_id: str
    summary: str
    assumptions: str | None
    notes: str | None
    version: int
    created_at: datetime


class ClientRead(ORMModel):
    id: str
    task_id: str
    matter_workspace_id: str | None = None
    identity_scope: str = "slice_overlay"
    task_reference_role: str = "slice_linkage"
    name: str
    client_type: str
    client_stage: str
    description: str | None
    created_at: datetime


class EngagementRead(ORMModel):
    id: str
    task_id: str
    matter_workspace_id: str | None = None
    identity_scope: str = "slice_overlay"
    task_reference_role: str = "slice_linkage"
    client_id: str | None
    name: str
    description: str | None
    created_at: datetime


class WorkstreamRead(ORMModel):
    id: str
    task_id: str
    matter_workspace_id: str | None = None
    identity_scope: str = "slice_overlay"
    task_reference_role: str = "slice_linkage"
    engagement_id: str | None
    name: str
    description: str | None
    domain_lenses: list[str]
    created_at: datetime


class DecisionContextRead(BaseModel):
    id: str
    task_id: str
    matter_workspace_id: str | None = None
    identity_scope: str = "slice_overlay"
    task_reference_role: str = "slice_linkage"
    client_id: str | None
    engagement_id: str | None
    workstream_id: str | None
    title: str
    summary: str
    judgment_to_make: str
    domain_lenses: list[str] = Field(default_factory=list)
    client_stage: str | None = None
    client_type: str | None = None
    goals: list[str] = Field(default_factory=list)
    constraints: list[str] = Field(default_factory=list)
    assumptions: list[str] = Field(default_factory=list)
    source_priority: str = ""
    external_data_policy: str = ""
    created_at: datetime


class DecisionContextDeltaRead(BaseModel):
    title: str | None = None
    summary: str | None = None
    judgment_to_make: str | None = None
    domain_lenses: list[str] = Field(default_factory=list)
    client_stage: str | None = None
    client_type: str | None = None
    goals: list[str] = Field(default_factory=list)
    constraints: list[str] = Field(default_factory=list)
    assumptions: list[str] = Field(default_factory=list)
    source_priority: str | None = None
    external_data_policy: str | None = None
    changed_fields: list[str] = Field(default_factory=list)


class PresenceStateItemRead(BaseModel):
    state: PresenceState
    reason: str
    display_value: str | None = None


class PresenceStateSummaryRead(BaseModel):
    client: PresenceStateItemRead
    engagement: PresenceStateItemRead
    workstream: PresenceStateItemRead
    decision_context: PresenceStateItemRead
    artifact: PresenceStateItemRead
    source_material: PresenceStateItemRead
    domain_lens: PresenceStateItemRead
    client_stage: PresenceStateItemRead
    client_type: PresenceStateItemRead


class SelectedPackRead(BaseModel):
    pack_id: str
    pack_type: str
    pack_name: str
    description: str
    domain_definition: str = ""
    industry_definition: str = ""
    common_business_models: list[str] = Field(default_factory=list)
    common_problem_patterns: list[str] = Field(default_factory=list)
    stage_specific_heuristics: dict[str, list[str]] = Field(default_factory=dict)
    key_kpis_or_operating_signals: list[str] = Field(default_factory=list)
    key_kpis: list[str] = Field(default_factory=list)
    default_decision_context_patterns: list[str] = Field(default_factory=list)
    reason: str = ""
    selection_score: int = 0
    selection_signals: list[str] = Field(default_factory=list)
    status: str = "active"
    version: str = "1.0.0"
    evidence_expectations: list[str] = Field(default_factory=list)
    common_risks: list[str] = Field(default_factory=list)
    decision_patterns: list[str] = Field(default_factory=list)
    deliverable_presets: list[str] = Field(default_factory=list)
    routing_hints: list[str] = Field(default_factory=list)
    pack_notes: list[str] = Field(default_factory=list)
    scope_boundaries: list[str] = Field(default_factory=list)
    pack_rationale: list[str] = Field(default_factory=list)
    contract_baseline: PackContractBaseline | None = None


class PackResolutionRead(BaseModel):
    selected_domain_packs: list[SelectedPackRead] = Field(default_factory=list)
    selected_industry_packs: list[SelectedPackRead] = Field(default_factory=list)
    override_pack_ids: list[str] = Field(default_factory=list)
    conflicts: list[str] = Field(default_factory=list)
    stack_order: list[str] = Field(default_factory=list)
    resolver_notes: list[str] = Field(default_factory=list)
    evidence_expectations: list[str] = Field(default_factory=list)
    key_kpis_or_operating_signals: list[str] = Field(default_factory=list)
    key_kpis: list[str] = Field(default_factory=list)
    common_risks: list[str] = Field(default_factory=list)
    decision_patterns: list[str] = Field(default_factory=list)
    decision_context_patterns: list[str] = Field(default_factory=list)
    deliverable_presets: list[str] = Field(default_factory=list)
    ready_interface_ids: list[str] = Field(default_factory=list)
    ready_rule_binding_ids: list[str] = Field(default_factory=list)
    missing_required_property_ids: list[str] = Field(default_factory=list)
    contract_status: str = "ready"


class SelectedAgentRead(BaseModel):
    agent_id: str
    agent_name: str
    agent_type: str
    description: str
    supported_capabilities: list[str] = Field(default_factory=list)
    relevant_domain_packs: list[str] = Field(default_factory=list)
    relevant_industry_packs: list[str] = Field(default_factory=list)
    primary_responsibilities: list[str] = Field(default_factory=list)
    out_of_scope: list[str] = Field(default_factory=list)
    defer_rules: list[str] = Field(default_factory=list)
    preferred_execution_modes: list[str] = Field(default_factory=list)
    input_requirements: list[str] = Field(default_factory=list)
    minimum_evidence_readiness: list[str] = Field(default_factory=list)
    required_context_fields: list[str] = Field(default_factory=list)
    output_contract: list[str] = Field(default_factory=list)
    produced_objects: list[str] = Field(default_factory=list)
    deliverable_impact: list[str] = Field(default_factory=list)
    writeback_expectations: list[str] = Field(default_factory=list)
    invocation_rules: list[str] = Field(default_factory=list)
    escalation_rules: list[str] = Field(default_factory=list)
    handoff_targets: list[str] = Field(default_factory=list)
    evaluation_focus: list[str] = Field(default_factory=list)
    failure_modes_to_watch: list[str] = Field(default_factory=list)
    trace_requirements: list[str] = Field(default_factory=list)
    reason: str = ""
    selection_score: int = 0
    selection_signals: list[str] = Field(default_factory=list)
    runtime_binding: str | None = None
    status: str = "active"
    version: str = "1.0.0"


class AgentSelectionRead(BaseModel):
    host_agent: SelectedAgentRead | None = None
    selected_reasoning_agents: list[SelectedAgentRead] = Field(default_factory=list)
    selected_specialist_agents: list[SelectedAgentRead] = Field(default_factory=list)
    selected_agent_ids: list[str] = Field(default_factory=list)
    selected_agent_names: list[str] = Field(default_factory=list)
    override_agent_ids: list[str] = Field(default_factory=list)
    resolver_notes: list[str] = Field(default_factory=list)
    rationale: list[str] = Field(default_factory=list)
    omitted_agent_notes: list[str] = Field(default_factory=list)
    deferred_agent_notes: list[str] = Field(default_factory=list)
    escalation_notes: list[str] = Field(default_factory=list)


class SubjectRead(ORMModel):
    id: str
    task_id: str
    subject_type: str
    name: str
    description: str | None
    source_ref: str | None


class GoalRead(ORMModel):
    id: str
    task_id: str
    goal_type: str
    description: str
    success_criteria: str | None
    priority: str


class ConstraintRead(ORMModel):
    id: str
    task_id: str
    constraint_type: str
    description: str
    severity: str


class SourceDocumentRead(ORMModel):
    id: str
    task_id: str
    matter_workspace_id: str | None = None
    research_run_id: str | None = None
    continuity_scope: str = "slice_participation"
    source_type: str
    file_name: str
    canonical_display_name: str
    file_extension: str | None
    content_type: str | None
    storage_key: str | None
    storage_path: str
    storage_kind: str
    storage_provider: str
    file_size: int
    content_digest: str | None
    ingest_status: str
    ingest_strategy: str
    support_level: str
    retention_policy: str
    purge_at: datetime | None
    availability_state: str
    metadata_only: bool
    diagnostic_category: str | None = None
    extract_availability: str | None = None
    current_usable_scope: str | None = None
    fallback_mode: str | None = None
    derived_storage_key: str | None
    extracted_text: str | None
    ingestion_error: str | None
    participation: ObjectParticipationRead | None = None
    created_at: datetime
    updated_at: datetime


class ObjectParticipationRead(BaseModel):
    canonical_object_id: str | None = None
    canonical_owner_scope: str | None = None
    compatibility_task_id: str | None = None
    current_task_participation: bool = False
    participation_type: str | None = None
    participation_task_count: int = 0
    mapping_mode: str | None = None


class CanonicalizationSummaryRead(BaseModel):
    pending_review_count: int = 0
    human_confirmed_count: int = 0
    kept_separate_count: int = 0
    split_count: int = 0
    current_task_pending_count: int = 0
    summary: str = ""


class CanonicalizationCandidateRead(BaseModel):
    review_key: str
    object_family: CanonicalizationObjectFamily = CanonicalizationObjectFamily.SOURCE_CHAIN
    review_status: CanonicalizationReviewStatus = CanonicalizationReviewStatus.PENDING_REVIEW
    match_basis: CanonicalizationMatchBasis = CanonicalizationMatchBasis.DISPLAY_NAME_MATCH
    suggested_action: Literal["merge_candidate"] | None = None
    confidence_level: str = "medium"
    consultant_summary: str = ""
    canonical_title: str = ""
    canonical_source_document_id: str | None = None
    canonical_source_material_id: str | None = None
    canonical_artifact_id: str | None = None
    canonical_evidence_id: str | None = None
    source_document_ids: list[str] = Field(default_factory=list)
    source_material_ids: list[str] = Field(default_factory=list)
    artifact_ids: list[str] = Field(default_factory=list)
    evidence_ids: list[str] = Field(default_factory=list)
    affected_task_ids: list[str] = Field(default_factory=list)
    affected_task_titles: list[str] = Field(default_factory=list)
    candidate_count: int = 0
    task_count: int = 0
    current_task_involved: bool = False
    canonical_owner_scope: str = "matter_canonical"
    local_participation_boundary: str = "task_slice_participation"
    resolution_note: str = ""
    resolved_at: datetime | None = None


class SourceMaterialRead(ORMModel):
    id: str
    task_id: str
    matter_workspace_id: str | None = None
    source_document_id: str | None = None
    continuity_scope: str = "slice_participation"
    source_type: str
    title: str
    canonical_display_name: str
    source_ref: str
    file_extension: str | None
    content_type: str | None
    file_size: int
    storage_key: str | None
    storage_kind: str
    storage_provider: str
    content_digest: str | None
    ingest_status: str
    ingest_strategy: str
    support_level: str
    retention_policy: str
    purge_at: datetime | None
    availability_state: str
    metadata_only: bool
    diagnostic_category: str | None = None
    extract_availability: str | None = None
    current_usable_scope: str | None = None
    fallback_mode: str | None = None
    summary: str
    ingestion_error: str | None = None
    participation: ObjectParticipationRead | None = None
    created_at: datetime
    updated_at: datetime


class ArtifactRead(ORMModel):
    id: str
    task_id: str
    matter_workspace_id: str | None = None
    continuity_scope: str = "slice_participation"
    title: str
    artifact_type: str
    source_document_id: str | None
    source_material_id: str | None
    description: str
    participation: ObjectParticipationRead | None = None
    created_at: datetime


class ChunkObjectRead(ORMModel):
    id: str
    task_id: str
    matter_workspace_id: str | None = None
    source_document_id: str
    source_material_id: str | None = None
    artifact_id: str | None = None
    continuity_scope: str = "slice_participation"
    chunk_type: str
    sequence_index: int
    start_offset: int
    end_offset: int
    locator_label: str
    excerpt_text: str
    excerpt_digest: str
    support_level: str
    availability_state: str
    created_at: datetime


class MediaReferenceRead(ORMModel):
    id: str
    task_id: str
    matter_workspace_id: str | None = None
    source_document_id: str
    source_material_id: str | None = None
    artifact_id: str | None = None
    continuity_scope: str = "slice_participation"
    media_type: str
    locator_kind: str
    locator_label: str
    preview_text: str
    support_level: str
    usable_scope: str
    availability_state: str
    created_at: datetime


class RetrievalProvenanceRead(BaseModel):
    support_kind: str
    source_document_id: str | None = None
    source_document_title: str | None = None
    source_material_id: str | None = None
    source_material_title: str | None = None
    artifact_id: str | None = None
    artifact_title: str | None = None
    support_level: str | None = None
    availability_state: str | None = None
    locator_label: str | None = None
    usable_scope: str | None = None
    excerpt_text: str | None = None
    preview_text: str | None = None
    chunk_object: ChunkObjectRead | None = None
    media_reference: MediaReferenceRead | None = None


class EvidenceRead(ORMModel):
    id: str
    task_id: str
    matter_workspace_id: str | None = None
    source_document_id: str | None
    source_material_id: str | None = None
    artifact_id: str | None = None
    chunk_object_id: str | None = None
    media_reference_id: str | None = None
    continuity_scope: str = "slice_participation"
    evidence_type: str
    source_type: str
    source_ref: str | None
    title: str
    excerpt_or_summary: str
    reliability_level: str
    retrieval_provenance: RetrievalProvenanceRead | None = None
    participation: ObjectParticipationRead | None = None
    created_at: datetime


class InsightRead(ORMModel):
    id: str
    task_id: str
    generated_by: str
    summary: str
    evidence_refs: list[str]
    confidence_level: str
    created_at: datetime


class RiskRead(ORMModel):
    id: str
    task_id: str
    title: str
    description: str
    risk_type: str
    impact_level: str
    likelihood_level: str
    evidence_refs: list[str]
    supporting_evidence_ids: list[str] = Field(default_factory=list)
    created_at: datetime


class OptionRead(ORMModel):
    id: str
    task_id: str
    title: str
    description: str
    pros: list[str]
    cons: list[str]
    related_risk_refs: list[str]
    created_at: datetime


class RecommendationRead(ORMModel):
    id: str
    task_id: str
    summary: str
    rationale: str
    based_on_refs: list[str]
    supporting_evidence_ids: list[str] = Field(default_factory=list)
    priority: str
    owner_suggestion: str | None
    adoption_feedback: "AdoptionFeedbackRead | None" = None
    precedent_candidate: "PrecedentCandidateRead | None" = None
    created_at: datetime


class ActionItemRead(ORMModel):
    id: str
    task_id: str
    description: str
    suggested_owner: str | None
    priority: str
    due_hint: str | None
    dependency_refs: list[str]
    supporting_evidence_ids: list[str] = Field(default_factory=list)
    status: str
    created_at: datetime


class DeliverableObjectLinkRead(ORMModel):
    id: str
    task_id: str
    deliverable_id: str
    object_type: str
    object_id: str | None
    object_label: str | None
    relation_type: str
    created_at: datetime


class DeliverableRead(ORMModel):
    id: str
    task_id: str
    task_run_id: str | None
    deliverable_type: str
    title: str
    summary: str
    status: str
    version_tag: str
    content_structure: dict[str, Any]
    version: int
    linked_objects: list[DeliverableObjectLinkRead] = Field(default_factory=list)
    adoption_feedback: "AdoptionFeedbackRead | None" = None
    precedent_candidate: "PrecedentCandidateRead | None" = None
    generated_at: datetime


class AdoptionFeedbackRead(ORMModel):
    id: str
    task_id: str
    matter_workspace_id: str | None = None
    deliverable_id: str | None = None
    recommendation_id: str | None = None
    feedback_status: AdoptionFeedbackStatus
    reason_codes: list[str] = Field(default_factory=list)
    note: str = ""
    created_at: datetime
    updated_at: datetime


class PrecedentCandidateRead(ORMModel):
    id: str
    candidate_type: PrecedentCandidateType
    candidate_status: PrecedentCandidateStatus
    source_feedback_status: AdoptionFeedbackStatus
    source_feedback_reason_codes: list[str] = Field(default_factory=list)
    source_task_id: str
    source_deliverable_id: str | None = None
    source_recommendation_id: str | None = None
    title: str = ""
    summary: str = ""
    reusable_reason: str = ""
    lane_id: str = ""
    continuity_mode: str = "one_off"
    deliverable_type: str | None = None
    client_stage: str | None = None
    client_type: str | None = None
    domain_lenses: list[str] = Field(default_factory=list)
    selected_pack_ids: list[str] = Field(default_factory=list)
    keywords: list[str] = Field(default_factory=list)
    pattern_snapshot: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime
    updated_at: datetime


class PrecedentCandidateSummaryRead(BaseModel):
    total_candidates: int = 0
    deliverable_candidate_count: int = 0
    recommendation_candidate_count: int = 0
    summary: str = ""


class PrecedentReferenceItemRead(BaseModel):
    candidate_id: str
    candidate_type: PrecedentCandidateType
    candidate_status: PrecedentCandidateStatus
    review_priority: Literal["high", "medium", "low"] = "medium"
    primary_reason_label: str = ""
    source_feedback_reason_labels: list[str] = Field(default_factory=list)
    source_feedback_reason_codes: list[str] = Field(default_factory=list)
    title: str = ""
    summary: str = ""
    reusable_reason: str = ""
    match_reason: str = ""
    safe_use_note: str = ""
    source_task_id: str
    source_deliverable_id: str | None = None
    source_recommendation_id: str | None = None


class PrecedentReferenceGuidanceRead(BaseModel):
    status: Literal["available", "no_match"] = "no_match"
    label: str = ""
    summary: str = ""
    recommended_uses: list[str] = Field(default_factory=list)
    boundary_note: str = ""
    matched_items: list[PrecedentReferenceItemRead] = Field(default_factory=list)


class OrganizationMemoryGuidanceRead(BaseModel):
    status: Literal["available", "none"] = "none"
    label: str = ""
    summary: str = ""
    organization_label: str = ""
    stable_context_items: list[str] = Field(default_factory=list)
    known_constraints: list[str] = Field(default_factory=list)
    continuity_anchor: str = ""
    boundary_note: str = ""


class ReviewLensItemRead(BaseModel):
    lens_id: str
    title: str
    summary: str = ""
    why_now: str = ""
    source_kind: Literal[
        "precedent_reference",
        "pack_decision_pattern",
        "task_heuristic",
    ] = "task_heuristic"
    source_label: str = ""
    priority: Literal["high", "medium", "low"] = "medium"


class ReviewLensGuidanceRead(BaseModel):
    status: Literal["available", "fallback", "none"] = "none"
    label: str = ""
    summary: str = ""
    boundary_note: str = ""
    lenses: list[ReviewLensItemRead] = Field(default_factory=list)


class CommonRiskItemRead(BaseModel):
    risk_id: str
    title: str
    summary: str = ""
    why_watch: str = ""
    source_kind: Literal[
        "precedent_risk_pattern",
        "pack_common_risk",
        "task_heuristic",
    ] = "task_heuristic"
    source_label: str = ""
    priority: Literal["high", "medium", "low"] = "medium"


class CommonRiskGuidanceRead(BaseModel):
    status: Literal["available", "fallback", "none"] = "none"
    label: str = ""
    summary: str = ""
    boundary_note: str = ""
    risks: list[CommonRiskItemRead] = Field(default_factory=list)


class DeliverableShapeHintRead(BaseModel):
    hint_id: str
    title: str
    summary: str = ""
    why_fit: str = ""
    source_kind: Literal[
        "precedent_deliverable_pattern",
        "pack_deliverable_preset",
        "task_heuristic",
    ] = "task_heuristic"
    source_label: str = ""
    priority: Literal["high", "medium", "low"] = "medium"


class DeliverableShapeGuidanceRead(BaseModel):
    status: Literal["available", "fallback", "none"] = "none"
    label: str = ""
    summary: str = ""
    primary_shape_label: str = ""
    section_hints: list[str] = Field(default_factory=list)
    boundary_note: str = ""
    hints: list[DeliverableShapeHintRead] = Field(default_factory=list)


class PrecedentDuplicateSummaryRead(BaseModel):
    pending_review_count: int = 0
    human_confirmed_count: int = 0
    kept_separate_count: int = 0
    split_count: int = 0
    summary: str = ""


class PrecedentDuplicateCandidateRead(BaseModel):
    review_key: str
    object_family: CanonicalizationObjectFamily = CanonicalizationObjectFamily.PRECEDENT
    review_status: CanonicalizationReviewStatus = CanonicalizationReviewStatus.PENDING_REVIEW
    match_basis: CanonicalizationMatchBasis = CanonicalizationMatchBasis.PATTERN_SIGNATURE_MATCH
    suggested_action: Literal["merge_candidate"] | None = None
    confidence_level: str = "medium"
    consultant_summary: str = ""
    canonical_candidate_id: str | None = None
    canonical_title: str = ""
    matter_workspace_id: str
    matter_title: str = ""
    candidate_type: PrecedentCandidateType
    candidate_ids: list[str] = Field(default_factory=list)
    candidate_titles: list[str] = Field(default_factory=list)
    task_ids: list[str] = Field(default_factory=list)
    task_titles: list[str] = Field(default_factory=list)
    candidate_count: int = 0
    resolution_note: str = ""
    resolved_at: datetime | None = None


class ObjectSetMemberRead(ORMModel):
    id: str
    object_set_id: str
    task_id: str
    member_object_type: str
    member_object_id: str
    member_label: str
    membership_source: ObjectSetMembershipSource
    ordering_index: int
    included_reason: str = ""
    derivation_hint: str = ""
    support_evidence_id: str | None = None
    member_metadata: dict[str, Any] = Field(default_factory=dict)
    support_label: str | None = None
    created_at: datetime


class ObjectSetRead(ORMModel):
    id: str
    task_id: str
    matter_workspace_id: str | None = None
    deliverable_id: str | None = None
    set_type: ObjectSetType
    scope_type: ObjectSetScopeType
    scope_id: str
    display_title: str
    description: str = ""
    intent: str = ""
    creation_mode: ObjectSetCreationMode
    lifecycle_status: ObjectSetLifecycleStatus
    continuity_scope: str = "task_scope"
    membership_source_summary: dict[str, Any] = Field(default_factory=dict)
    member_count: int = 0
    members: list[ObjectSetMemberRead] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime


class DeliverableVersionEventRead(ORMModel):
    id: str
    deliverable_id: str
    task_id: str
    event_type: str
    version_tag: str
    deliverable_status: str | None = None
    summary: str
    event_payload: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime


class DeliverableContentSectionsRead(BaseModel):
    executive_summary: str = ""
    recommendations: list[str] = Field(default_factory=list)
    risks: list[str] = Field(default_factory=list)
    action_items: list[str] = Field(default_factory=list)
    evidence_basis: list[str] = Field(default_factory=list)


class ContentRevisionDiffItemRead(BaseModel):
    section_key: str
    section_label: str
    change_type: str
    previous_preview: str = ""
    current_preview: str = ""


class MatterContentRevisionRead(ORMModel):
    id: str
    matter_workspace_id: str
    object_type: str = "matter"
    object_id: str
    source: str
    revision_summary: str
    changed_sections: list[str] = Field(default_factory=list)
    diff_summary: list[ContentRevisionDiffItemRead] = Field(default_factory=list)
    snapshot: MatterWorkspaceContentSectionsRead = Field(
        default_factory=lambda: MatterWorkspaceContentSectionsRead()
    )
    rollback_target_revision_id: str | None = None
    created_at: datetime


class DeliverableContentRevisionRead(ORMModel):
    id: str
    deliverable_id: str
    task_id: str
    object_type: str = "deliverable"
    object_id: str
    source: str
    revision_summary: str
    changed_sections: list[str] = Field(default_factory=list)
    diff_summary: list[ContentRevisionDiffItemRead] = Field(default_factory=list)
    snapshot: DeliverableContentSectionsRead = Field(
        default_factory=DeliverableContentSectionsRead
    )
    version_tag: str
    deliverable_status: str | None = None
    source_version_event_id: str | None = None
    rollback_target_revision_id: str | None = None
    created_at: datetime


class DeliverableArtifactRecordRead(ORMModel):
    id: str
    deliverable_id: str
    task_id: str
    publish_record_id: str | None = None
    source_version_event_id: str | None = None
    artifact_kind: str
    artifact_format: str
    version_tag: str
    deliverable_status: str | None = None
    file_name: str
    mime_type: str
    artifact_key: str
    storage_provider: str
    retention_policy: str
    purge_at: datetime | None
    availability_state: str
    artifact_digest: str | None = None
    file_size: int
    created_at: datetime


class DeliverablePublishRecordRead(ORMModel):
    id: str
    deliverable_id: str
    task_id: str
    source_version_event_id: str | None = None
    version_tag: str
    deliverable_status: str | None = None
    publish_note: str = ""
    artifact_formats: list[str] = Field(default_factory=list)
    created_at: datetime
    artifact_records: list[DeliverableArtifactRecordRead] = Field(default_factory=list)


class TaskRunRead(ORMModel):
    id: str
    task_id: str
    agent_id: str
    flow_mode: str
    status: RunStatus
    summary: str | None
    error_message: str | None
    created_at: datetime
    completed_at: datetime | None


class CaseWorldFactRead(BaseModel):
    title: str
    detail: str
    source: str = "explicit"


class CaseWorldAssumptionRead(BaseModel):
    title: str
    detail: str
    source: str = "inferred"


class CaseWorldGapRead(BaseModel):
    gap_key: str
    title: str
    description: str
    priority: str = "medium"
    related_pack_ids: list[str] = Field(default_factory=list)


class CaseWorldDraftRead(BaseModel):
    id: str
    task_id: str
    matter_workspace_id: str | None = None
    compiler_status: str
    entry_preset: InputEntryMode = InputEntryMode.ONE_LINE_INQUIRY
    continuity_mode: EngagementContinuityMode = EngagementContinuityMode.ONE_OFF
    writeback_depth: WritebackDepth = WritebackDepth.MINIMAL
    canonical_intake_summary: dict[str, Any] = Field(default_factory=dict)
    task_interpretation: dict[str, Any] = Field(default_factory=dict)
    decision_context: dict[str, Any] = Field(default_factory=dict)
    extracted_objects: list[dict[str, Any]] = Field(default_factory=list)
    inferred_links: list[dict[str, Any]] = Field(default_factory=list)
    facts: list[CaseWorldFactRead] = Field(default_factory=list)
    assumptions: list[CaseWorldAssumptionRead] = Field(default_factory=list)
    evidence_gaps: list[CaseWorldGapRead] = Field(default_factory=list)
    suggested_capabilities: list[str] = Field(default_factory=list)
    suggested_domain_packs: list[str] = Field(default_factory=list)
    suggested_industry_packs: list[str] = Field(default_factory=list)
    suggested_agents: list[str] = Field(default_factory=list)
    suggested_research_need: bool = False
    next_best_actions: list[str] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime


class CaseWorldStateRead(BaseModel):
    id: str
    matter_workspace_id: str
    compiler_status: str
    world_status: str
    client_id: str | None = None
    engagement_id: str | None = None
    workstream_id: str | None = None
    decision_context_id: str | None = None
    entry_preset: InputEntryMode = InputEntryMode.ONE_LINE_INQUIRY
    continuity_mode: EngagementContinuityMode = EngagementContinuityMode.ONE_OFF
    writeback_depth: WritebackDepth = WritebackDepth.MINIMAL
    world_identity: dict[str, Any] = Field(default_factory=dict)
    canonical_intake_summary: dict[str, Any] = Field(default_factory=dict)
    decision_context: dict[str, Any] = Field(default_factory=dict)
    extracted_objects: list[dict[str, Any]] = Field(default_factory=list)
    inferred_links: list[dict[str, Any]] = Field(default_factory=list)
    facts: list[CaseWorldFactRead] = Field(default_factory=list)
    assumptions: list[CaseWorldAssumptionRead] = Field(default_factory=list)
    evidence_gaps: list[CaseWorldGapRead] = Field(default_factory=list)
    selected_capabilities: list[str] = Field(default_factory=list)
    selected_domain_packs: list[str] = Field(default_factory=list)
    selected_industry_packs: list[str] = Field(default_factory=list)
    selected_agent_ids: list[str] = Field(default_factory=list)
    suggested_research_need: bool = False
    next_best_actions: list[str] = Field(default_factory=list)
    active_task_ids: list[str] = Field(default_factory=list)
    latest_task_id: str | None = None
    latest_task_title: str | None = None
    supplement_count: int = 0
    last_supplement_summary: str = ""
    created_at: datetime
    updated_at: datetime


class EvidenceGapRead(ORMModel):
    id: str
    task_id: str
    matter_workspace_id: str | None = None
    gap_key: str
    title: str
    gap_type: str
    description: str
    priority: str
    status: str
    source: str
    supporting_pack_ids: list[str] = Field(default_factory=list)
    related_source_refs: list[str] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime


class ResearchRunRead(ORMModel):
    id: str
    task_id: str
    matter_workspace_id: str | None = None
    status: RunStatus
    query: str
    trigger_reason: str
    research_scope: str
    research_depth: str = "light_completion"
    freshness_policy: str
    confidence_note: str
    source_trace_summary: str
    selected_domain_pack_ids: list[str] = Field(default_factory=list)
    selected_industry_pack_ids: list[str] = Field(default_factory=list)
    sub_questions: list[str] = Field(default_factory=list)
    evidence_gap_focus: list[str] = Field(default_factory=list)
    source_quality_summary: str = ""
    contradiction_summary: str = ""
    citation_handoff_summary: str = ""
    result_summary: str
    source_count: int
    error_message: str | None = None
    started_at: datetime
    completed_at: datetime | None


class DecisionRecordRead(ORMModel):
    id: str
    task_id: str
    matter_workspace_id: str | None = None
    deliverable_id: str | None = None
    task_run_id: str | None = None
    continuity_mode: EngagementContinuityMode = EngagementContinuityMode.ONE_OFF
    writeback_depth: WritebackDepth = WritebackDepth.MINIMAL
    function_type: FunctionType = FunctionType.SYNTHESIZE_BRIEF
    approval_policy: ApprovalPolicy = ApprovalPolicy.NOT_REQUIRED
    approval_status: ApprovalStatus = ApprovalStatus.NOT_REQUIRED
    approval_summary: str = ""
    approved_at: datetime | None = None
    title: str
    decision_summary: str
    evidence_basis_ids: list[str] = Field(default_factory=list)
    recommendation_ids: list[str] = Field(default_factory=list)
    risk_ids: list[str] = Field(default_factory=list)
    action_item_ids: list[str] = Field(default_factory=list)
    created_at: datetime


class ActionPlanRead(ORMModel):
    id: str
    task_id: str
    matter_workspace_id: str | None = None
    decision_record_id: str
    action_type: ActionType = ActionType.DECISION_FOLLOW_THROUGH
    approval_policy: ApprovalPolicy = ApprovalPolicy.NOT_REQUIRED
    approval_status: ApprovalStatus = ApprovalStatus.NOT_REQUIRED
    approval_summary: str = ""
    approved_at: datetime | None = None
    title: str
    summary: str
    status: str
    action_item_ids: list[str] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime


class ActionExecutionRead(ORMModel):
    id: str
    task_id: str
    action_plan_id: str
    action_item_id: str | None = None
    action_type: ActionType = ActionType.ACTION_EXECUTION_TRACKING
    status: str
    owner_hint: str | None = None
    execution_note: str
    created_at: datetime
    updated_at: datetime


class OutcomeRecordRead(ORMModel):
    id: str
    task_id: str
    matter_workspace_id: str | None = None
    decision_record_id: str | None = None
    action_execution_id: str | None = None
    deliverable_id: str | None = None
    function_type: FunctionType = FunctionType.OUTCOME_OBSERVATION
    status: str
    signal_type: str
    summary: str
    evidence_note: str
    created_at: datetime


class AuditEventRead(ORMModel):
    id: str
    task_id: str
    matter_workspace_id: str | None = None
    deliverable_id: str | None = None
    decision_record_id: str | None = None
    action_plan_id: str | None = None
    action_execution_id: str | None = None
    outcome_record_id: str | None = None
    event_type: AuditEventType
    function_type: FunctionType | None = None
    action_type: ActionType | None = None
    approval_policy: ApprovalPolicy | None = None
    approval_status: ApprovalStatus | None = None
    actor_label: str
    summary: str
    event_payload: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime


class ContinuationActionRead(BaseModel):
    action_id: str
    label: str
    description: str


class CheckpointSnapshotRead(BaseModel):
    record_id: str | None = None
    task_id: str | None = None
    task_title: str = ""
    deliverable_id: str | None = None
    deliverable_title: str | None = None
    summary: str = ""
    created_at: datetime | None = None


class ContinuationChangeItemRead(BaseModel):
    kind: Literal["recommendation", "risk", "action_item"]
    title: str
    change_type: str
    summary: str


class FollowUpLaneRead(BaseModel):
    latest_update: CheckpointSnapshotRead | None = None
    previous_checkpoint: CheckpointSnapshotRead | None = None
    recent_checkpoints: list[CheckpointSnapshotRead] = Field(default_factory=list)
    what_changed: list[str] = Field(default_factory=list)
    recommendation_changes: list[ContinuationChangeItemRead] = Field(default_factory=list)
    risk_changes: list[ContinuationChangeItemRead] = Field(default_factory=list)
    action_changes: list[ContinuationChangeItemRead] = Field(default_factory=list)
    next_follow_up_actions: list[str] = Field(default_factory=list)
    evidence_update_goal: str = ""


class ProgressionSnapshotRead(BaseModel):
    record_id: str | None = None
    task_id: str | None = None
    task_title: str = ""
    deliverable_id: str | None = None
    deliverable_title: str | None = None
    summary: str = ""
    action_state_summary: str = ""
    outcome_summary: str = ""
    created_at: datetime | None = None


class ProgressionStateItemRead(BaseModel):
    title: str
    state: str
    summary: str


class ProgressionLaneRead(BaseModel):
    latest_progression: ProgressionSnapshotRead | None = None
    previous_progression: ProgressionSnapshotRead | None = None
    recent_progressions: list[ProgressionSnapshotRead] = Field(default_factory=list)
    what_changed: list[str] = Field(default_factory=list)
    recommendation_states: list[ProgressionStateItemRead] = Field(default_factory=list)
    action_states: list[ProgressionStateItemRead] = Field(default_factory=list)
    outcome_signals: list[str] = Field(default_factory=list)
    next_progression_actions: list[str] = Field(default_factory=list)
    evidence_update_goal: str = ""


class ContinuationHealthSignalRead(BaseModel):
    status: Literal["build_baseline", "watch", "at_risk", "steady"]
    label: str
    summary: str


class ContinuationTimelineItemRead(BaseModel):
    kind: Literal["checkpoint", "progression"]
    title: str
    summary: str
    created_at: datetime | None = None
    task_id: str | None = None
    task_title: str = ""
    deliverable_id: str | None = None
    deliverable_title: str | None = None


class ContinuationOutcomeTrackingRead(BaseModel):
    label: str
    summary: str
    latest_signal_summary: str = ""
    needs_deliverable_refresh: bool = False
    tracked_signal_count: int = 0


class ContinuationReviewRhythmRead(BaseModel):
    label: str
    summary: str
    next_review_prompt: str


class ContinuationSurfaceRead(BaseModel):
    workflow_layer: Literal["closure", "checkpoint", "progression"]
    mode: EngagementContinuityMode
    writeback_depth: WritebackDepth
    current_state: str
    title: str
    summary: str
    primary_action: ContinuationActionRead | None = None
    secondary_actions: list[ContinuationActionRead] = Field(default_factory=list)
    closure_ready: bool = False
    can_reopen: bool = False
    checkpoint_enabled: bool = False
    outcome_logging_enabled: bool = False
    health_signal: ContinuationHealthSignalRead | None = None
    timeline_items: list[ContinuationTimelineItemRead] = Field(default_factory=list)
    next_step_queue: list[str] = Field(default_factory=list)
    outcome_tracking: ContinuationOutcomeTrackingRead | None = None
    review_rhythm: ContinuationReviewRhythmRead | None = None
    follow_up_lane: FollowUpLaneRead | None = None
    progression_lane: ProgressionLaneRead | None = None


class MatterWorkspaceSummaryRead(BaseModel):
    id: str
    title: str
    workspace_summary: str = ""
    status: str = "active"
    object_path: str
    client_name: str
    engagement_name: str
    workstream_name: str
    client_stage: str | None = None
    client_type: str | None = None
    domain_lenses: list[str] = Field(default_factory=list)
    current_decision_context_title: str | None = None
    current_decision_context_summary: str | None = None
    total_task_count: int = 0
    active_task_count: int = 0
    deliverable_count: int = 0
    artifact_count: int = 0
    source_material_count: int = 0
    latest_updated_at: datetime
    continuity_summary: str = ""
    active_work_summary: str = ""
    flagship_lane: FlagshipLaneRead = Field(default_factory=FlagshipLaneRead)
    engagement_continuity_mode: EngagementContinuityMode = EngagementContinuityMode.ONE_OFF
    writeback_depth: WritebackDepth = WritebackDepth.MINIMAL
    selected_pack_names: list[str] = Field(default_factory=list)
    selected_agent_names: list[str] = Field(default_factory=list)
    precedent_candidate_summary: PrecedentCandidateSummaryRead = Field(
        default_factory=PrecedentCandidateSummaryRead
    )


class TaskListItemResponse(BaseModel):
    id: str
    title: str
    description: str
    task_type: str
    mode: FlowMode
    status: TaskStatus
    created_at: datetime
    updated_at: datetime
    client_name: str | None = None
    engagement_name: str | None = None
    workstream_name: str | None = None
    decision_context_title: str | None = None
    client_stage: str | None = None
    client_type: str | None = None
    domain_lenses: list[str] = Field(default_factory=list)
    entry_preset: InputEntryMode = InputEntryMode.ONE_LINE_INQUIRY
    input_entry_mode: InputEntryMode = InputEntryMode.ONE_LINE_INQUIRY
    engagement_continuity_mode: EngagementContinuityMode = EngagementContinuityMode.ONE_OFF
    writeback_depth: WritebackDepth = WritebackDepth.MINIMAL
    deliverable_class_hint: DeliverableClass = DeliverableClass.EXPLORATORY_BRIEF
    external_research_heavy_candidate: bool = False
    flagship_lane: FlagshipLaneRead = Field(default_factory=FlagshipLaneRead)
    selected_pack_ids: list[str] = Field(default_factory=list)
    selected_pack_names: list[str] = Field(default_factory=list)
    pack_summary: str | None = None
    selected_agent_ids: list[str] = Field(default_factory=list)
    selected_agent_names: list[str] = Field(default_factory=list)
    agent_summary: str | None = None
    evidence_count: int
    deliverable_count: int
    run_count: int
    latest_deliverable_id: str | None = None
    latest_deliverable_title: str | None
    latest_deliverable_summary: str | None = None
    latest_deliverable_status: str | None = None
    latest_deliverable_version_tag: str | None = None
    matter_workspace: MatterWorkspaceSummaryRead | None = None


class MatterDecisionPointRead(BaseModel):
    task_id: str
    task_title: str
    task_status: TaskStatus
    decision_context_id: str | None = None
    decision_context_title: str
    judgment_to_make: str
    deliverable_class_hint: DeliverableClass
    updated_at: datetime


class MatterDeliverableSummaryRead(BaseModel):
    deliverable_id: str
    task_id: str
    task_title: str
    title: str
    summary: str
    status: str
    version_tag: str
    deliverable_type: str
    version: int
    generated_at: datetime
    decision_context_title: str | None = None


class MatterWorkspaceContentSectionsRead(BaseModel):
    core_question: str = ""
    analysis_focus: str = ""
    constraints_and_risks: str = ""
    next_steps: str = ""


class MatterMaterialSummaryRead(BaseModel):
    object_id: str
    task_id: str
    task_title: str
    object_type: str
    title: str
    summary: str
    file_extension: str | None = None
    content_type: str | None = None
    file_size: int = 0
    ingest_status: str | None = None
    support_level: str | None = None
    ingest_strategy: str | None = None
    ingestion_error: str | None = None
    retention_policy: str | None = None
    purge_at: datetime | None = None
    availability_state: str | None = None
    metadata_only: bool = False
    diagnostic_category: str | None = None
    extract_availability: str | None = None
    current_usable_scope: str | None = None
    fallback_mode: str | None = None
    created_at: datetime


class MatterWorkspaceResponse(BaseModel):
    summary: MatterWorkspaceSummaryRead
    client: ClientRead | None = None
    engagement: EngagementRead | None = None
    workstream: WorkstreamRead | None = None
    current_decision_context: DecisionContextRead | None = None
    case_world_state: CaseWorldStateRead | None = None
    content_sections: MatterWorkspaceContentSectionsRead = Field(
        default_factory=MatterWorkspaceContentSectionsRead
    )
    content_revisions: list[MatterContentRevisionRead] = Field(default_factory=list)
    decision_trajectory: list[MatterDecisionPointRead] = Field(default_factory=list)
    related_tasks: list[TaskListItemResponse] = Field(default_factory=list)
    related_deliverables: list[MatterDeliverableSummaryRead] = Field(default_factory=list)
    related_artifacts: list[MatterMaterialSummaryRead] = Field(default_factory=list)
    related_source_materials: list[MatterMaterialSummaryRead] = Field(default_factory=list)
    case_world_drafts: list[CaseWorldDraftRead] = Field(default_factory=list)
    evidence_gaps: list[EvidenceGapRead] = Field(default_factory=list)
    research_runs: list[ResearchRunRead] = Field(default_factory=list)
    decision_records: list[DecisionRecordRead] = Field(default_factory=list)
    action_plans: list[ActionPlanRead] = Field(default_factory=list)
    action_executions: list[ActionExecutionRead] = Field(default_factory=list)
    outcome_records: list[OutcomeRecordRead] = Field(default_factory=list)
    audit_events: list[AuditEventRead] = Field(default_factory=list)
    canonicalization_summary: CanonicalizationSummaryRead = Field(
        default_factory=CanonicalizationSummaryRead
    )
    canonicalization_candidates: list[CanonicalizationCandidateRead] = Field(default_factory=list)
    research_guidance: ResearchGuidanceRead = Field(default_factory=ResearchGuidanceRead)
    organization_memory_guidance: OrganizationMemoryGuidanceRead = Field(
        default_factory=OrganizationMemoryGuidanceRead
    )
    readiness_hint: str = ""
    continuity_notes: list[str] = Field(default_factory=list)
    continuation_surface: ContinuationSurfaceRead | None = None


class ArtifactEvidenceMaterialRead(BaseModel):
    object_id: str
    task_id: str
    task_title: str
    object_type: str
    title: str
    summary: str
    role_label: str
    presence_state: PresenceState
    continuity_scope: str | None = None
    participation_type: str | None = None
    participation_task_count: int = 0
    current_task_participation: bool = False
    canonical_owner_scope: str | None = None
    compatibility_task_id: str | None = None
    mapping_mode: str | None = None
    source_type: str | None = None
    ingest_status: str | None = None
    support_level: str | None = None
    ingest_strategy: str | None = None
    ingestion_error: str | None = None
    source_ref: str | None = None
    file_extension: str | None = None
    content_type: str | None = None
    file_size: int = 0
    storage_key: str | None = None
    retention_policy: str | None = None
    purge_at: datetime | None = None
    availability_state: str | None = None
    metadata_only: bool = False
    diagnostic_category: str | None = None
    extract_availability: str | None = None
    current_usable_scope: str | None = None
    fallback_mode: str | None = None
    linked_evidence_count: int = 0
    linked_output_count: int = 0
    created_at: datetime


class EvidenceSupportTargetRead(BaseModel):
    target_type: str
    target_id: str | None = None
    task_id: str
    task_title: str
    title: str
    note: str = ""


class EvidenceWorkspaceEvidenceRead(BaseModel):
    evidence: EvidenceRead
    task_title: str
    source_material_title: str | None = None
    artifact_title: str | None = None
    strength_label: str
    sufficiency_note: str
    linked_recommendations: list[EvidenceSupportTargetRead] = Field(default_factory=list)
    linked_risks: list[EvidenceSupportTargetRead] = Field(default_factory=list)
    linked_action_items: list[EvidenceSupportTargetRead] = Field(default_factory=list)
    linked_deliverables: list[EvidenceSupportTargetRead] = Field(default_factory=list)


class ArtifactEvidenceWorkspaceResponse(BaseModel):
    matter_summary: MatterWorkspaceSummaryRead
    client: ClientRead | None = None
    engagement: EngagementRead | None = None
    workstream: WorkstreamRead | None = None
    current_decision_context: DecisionContextRead | None = None
    continuation_surface: ContinuationSurfaceRead | None = None
    related_tasks: list[TaskListItemResponse] = Field(default_factory=list)
    artifact_cards: list[ArtifactEvidenceMaterialRead] = Field(default_factory=list)
    source_material_cards: list[ArtifactEvidenceMaterialRead] = Field(default_factory=list)
    evidence_chains: list[EvidenceWorkspaceEvidenceRead] = Field(default_factory=list)
    evidence_expectations: list[str] = Field(default_factory=list)
    high_impact_gaps: list[str] = Field(default_factory=list)
    evidence_gaps: list[EvidenceGapRead] = Field(default_factory=list)
    research_runs: list[ResearchRunRead] = Field(default_factory=list)
    canonicalization_summary: CanonicalizationSummaryRead = Field(
        default_factory=CanonicalizationSummaryRead
    )
    canonicalization_candidates: list[CanonicalizationCandidateRead] = Field(default_factory=list)
    research_guidance: ResearchGuidanceRead = Field(default_factory=ResearchGuidanceRead)
    sufficiency_summary: str = ""
    deliverable_limitations: list[str] = Field(default_factory=list)
    continuity_notes: list[str] = Field(default_factory=list)
    object_sets: list[ObjectSetRead] = Field(default_factory=list)


class TaskAggregateResponse(BaseModel):
    id: str
    title: str
    description: str
    task_type: str
    mode: FlowMode
    external_data_strategy: ExternalDataStrategy
    status: TaskStatus
    created_at: datetime
    updated_at: datetime
    client: ClientRead | None = None
    engagement: EngagementRead | None = None
    workstream: WorkstreamRead | None = None
    decision_context: DecisionContextRead | None = None
    slice_decision_context: DecisionContextDeltaRead | None = None
    world_decision_context: DecisionContextRead | None = None
    client_stage: str | None = None
    client_type: str | None = None
    domain_lenses: list[str] = Field(default_factory=list)
    assumptions: list[str] = Field(default_factory=list)
    entry_preset: InputEntryMode = InputEntryMode.ONE_LINE_INQUIRY
    input_entry_mode: InputEntryMode = InputEntryMode.ONE_LINE_INQUIRY
    engagement_continuity_mode: EngagementContinuityMode = EngagementContinuityMode.ONE_OFF
    writeback_depth: WritebackDepth = WritebackDepth.MINIMAL
    deliverable_class_hint: DeliverableClass = DeliverableClass.EXPLORATORY_BRIEF
    external_research_heavy_candidate: bool = False
    flagship_lane: FlagshipLaneRead = Field(default_factory=FlagshipLaneRead)
    sparse_input_summary: str = ""
    presence_state_summary: PresenceStateSummaryRead
    pack_resolution: PackResolutionRead = Field(default_factory=PackResolutionRead)
    agent_selection: AgentSelectionRead = Field(default_factory=AgentSelectionRead)
    source_materials: list[SourceMaterialRead] = Field(default_factory=list)
    artifacts: list[ArtifactRead] = Field(default_factory=list)
    contexts: list[TaskContextRead] = Field(default_factory=list)
    subjects: list[SubjectRead] = Field(default_factory=list)
    goals: list[GoalRead] = Field(default_factory=list)
    constraints: list[ConstraintRead] = Field(default_factory=list)
    uploads: list[SourceDocumentRead] = Field(default_factory=list)
    evidence: list[EvidenceRead] = Field(default_factory=list)
    insights: list[InsightRead] = Field(default_factory=list)
    risks: list[RiskRead] = Field(default_factory=list)
    options: list[OptionRead] = Field(default_factory=list)
    recommendations: list[RecommendationRead] = Field(default_factory=list)
    action_items: list[ActionItemRead] = Field(default_factory=list)
    deliverables: list[DeliverableRead] = Field(default_factory=list)
    runs: list[TaskRunRead] = Field(default_factory=list)
    case_world_draft: CaseWorldDraftRead | None = None
    case_world_state: CaseWorldStateRead | None = None
    world_work_slice_summary: str = ""
    evidence_gaps: list[EvidenceGapRead] = Field(default_factory=list)
    research_guidance: ResearchGuidanceRead = Field(default_factory=ResearchGuidanceRead)
    organization_memory_guidance: OrganizationMemoryGuidanceRead = Field(
        default_factory=OrganizationMemoryGuidanceRead
    )
    precedent_reference_guidance: PrecedentReferenceGuidanceRead = Field(
        default_factory=PrecedentReferenceGuidanceRead
    )
    review_lens_guidance: ReviewLensGuidanceRead = Field(default_factory=ReviewLensGuidanceRead)
    common_risk_guidance: CommonRiskGuidanceRead = Field(default_factory=CommonRiskGuidanceRead)
    deliverable_shape_guidance: DeliverableShapeGuidanceRead = Field(
        default_factory=DeliverableShapeGuidanceRead
    )
    research_runs: list[ResearchRunRead] = Field(default_factory=list)
    decision_records: list[DecisionRecordRead] = Field(default_factory=list)
    action_plans: list[ActionPlanRead] = Field(default_factory=list)
    action_executions: list[ActionExecutionRead] = Field(default_factory=list)
    outcome_records: list[OutcomeRecordRead] = Field(default_factory=list)
    audit_events: list[AuditEventRead] = Field(default_factory=list)
    object_sets: list[ObjectSetRead] = Field(default_factory=list)
    canonicalization_summary: CanonicalizationSummaryRead = Field(
        default_factory=CanonicalizationSummaryRead
    )
    canonicalization_candidates: list[CanonicalizationCandidateRead] = Field(default_factory=list)
    matter_workspace: MatterWorkspaceSummaryRead | None = None
    continuation_surface: ContinuationSurfaceRead | None = None


class DeliverableWorkspaceResponse(BaseModel):
    deliverable: DeliverableRead
    task: TaskAggregateResponse
    matter_workspace: MatterWorkspaceSummaryRead | None = None
    deliverable_class: DeliverableClass
    workspace_status: str
    is_latest_for_task: bool = True
    confidence_summary: str = ""
    deliverable_guidance: str = ""
    high_impact_gaps: list[str] = Field(default_factory=list)
    limitation_notes: list[str] = Field(default_factory=list)
    linked_source_materials: list[SourceMaterialRead] = Field(default_factory=list)
    linked_artifacts: list[ArtifactRead] = Field(default_factory=list)
    linked_evidence: list[EvidenceRead] = Field(default_factory=list)
    linked_recommendations: list[RecommendationRead] = Field(default_factory=list)
    linked_risks: list[RiskRead] = Field(default_factory=list)
    linked_action_items: list[ActionItemRead] = Field(default_factory=list)
    related_deliverables: list[MatterDeliverableSummaryRead] = Field(default_factory=list)
    decision_records: list[DecisionRecordRead] = Field(default_factory=list)
    action_plans: list[ActionPlanRead] = Field(default_factory=list)
    action_executions: list[ActionExecutionRead] = Field(default_factory=list)
    outcome_records: list[OutcomeRecordRead] = Field(default_factory=list)
    audit_events: list[AuditEventRead] = Field(default_factory=list)
    research_runs: list[ResearchRunRead] = Field(default_factory=list)
    continuity_notes: list[str] = Field(default_factory=list)
    continuation_surface: ContinuationSurfaceRead | None = None
    content_sections: DeliverableContentSectionsRead = Field(
        default_factory=DeliverableContentSectionsRead
    )
    content_revisions: list[DeliverableContentRevisionRead] = Field(default_factory=list)
    version_events: list[DeliverableVersionEventRead] = Field(default_factory=list)
    artifact_records: list[DeliverableArtifactRecordRead] = Field(default_factory=list)
    publish_records: list[DeliverablePublishRecordRead] = Field(default_factory=list)
    object_sets: list[ObjectSetRead] = Field(default_factory=list)


class UploadResultItem(BaseModel):
    source_document: SourceDocumentRead
    evidence: EvidenceRead
    source_material: SourceMaterialRead | None = None
    artifact: ArtifactRead | None = None


class UploadBatchResponse(BaseModel):
    task_id: str
    matter_workspace_id: str | None = None
    world_updated_first: bool = False
    world_update_summary: str = ""
    uploaded: list[UploadResultItem]


class SourceIngestRequest(BaseModel):
    urls: list[str] = Field(default_factory=list)
    pasted_text: str = ""
    pasted_title: str | None = None


class SourceIngestBatchResponse(BaseModel):
    task_id: str
    matter_workspace_id: str | None = None
    world_updated_first: bool = False
    world_update_summary: str = ""
    ingested: list[UploadResultItem]


class TaskHistoryResponse(BaseModel):
    task_id: str
    runs: list[TaskRunRead]
    deliverables: list[DeliverableRead]
    recommendations: list[RecommendationRead]
    action_items: list[ActionItemRead]
    evidence: list[EvidenceRead]


class ResearchRunResponse(BaseModel):
    task_id: str
    run: TaskRunRead
    deliverable: DeliverableRead
    insights: list[InsightRead]
    risks: list[RiskRead]
    recommendations: list[RecommendationRead]
    action_items: list[ActionItemRead]
