from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.domain.enums import (
    DeliverableClass,
    ExternalDataStrategy,
    FlowMode,
    InputEntryMode,
    PresenceState,
    RunStatus,
    TaskStatus,
)


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class ConstraintCreate(BaseModel):
    description: str = Field(min_length=1)
    constraint_type: str = "general"
    severity: str = "medium"


class TaskCreateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str = ""
    task_type: str = "research_synthesis"
    mode: FlowMode = FlowMode.SPECIALIST
    external_data_strategy: ExternalDataStrategy = ExternalDataStrategy.SUPPLEMENTAL
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


class TaskExtensionOverrideRequest(BaseModel):
    pack_override_ids: list[str] = Field(default_factory=list)
    agent_override_ids: list[str] = Field(default_factory=list)


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
    name: str
    client_type: str
    client_stage: str
    description: str | None
    created_at: datetime


class EngagementRead(ORMModel):
    id: str
    task_id: str
    client_id: str | None
    name: str
    description: str | None
    created_at: datetime


class WorkstreamRead(ORMModel):
    id: str
    task_id: str
    engagement_id: str | None
    name: str
    description: str | None
    domain_lenses: list[str]
    created_at: datetime


class DecisionContextRead(BaseModel):
    id: str
    task_id: str
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
    reason: str = ""
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
    deliverable_presets: list[str] = Field(default_factory=list)


class SelectedAgentRead(BaseModel):
    agent_id: str
    agent_name: str
    agent_type: str
    description: str
    supported_capabilities: list[str] = Field(default_factory=list)
    relevant_domain_packs: list[str] = Field(default_factory=list)
    relevant_industry_packs: list[str] = Field(default_factory=list)
    reason: str = ""
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
    source_type: str
    file_name: str
    content_type: str | None
    storage_path: str
    file_size: int
    ingest_status: str
    extracted_text: str | None
    ingestion_error: str | None
    created_at: datetime


class SourceMaterialRead(ORMModel):
    id: str
    task_id: str
    source_document_id: str | None = None
    source_type: str
    title: str
    source_ref: str
    content_type: str | None
    ingest_status: str
    summary: str
    created_at: datetime


class ArtifactRead(ORMModel):
    id: str
    task_id: str
    title: str
    artifact_type: str
    source_document_id: str | None
    source_material_id: str | None
    description: str
    created_at: datetime


class EvidenceRead(ORMModel):
    id: str
    task_id: str
    source_document_id: str | None
    source_material_id: str | None = None
    artifact_id: str | None = None
    evidence_type: str
    source_type: str
    source_ref: str | None
    title: str
    excerpt_or_summary: str
    reliability_level: str
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
    content_structure: dict[str, Any]
    version: int
    linked_objects: list[DeliverableObjectLinkRead] = Field(default_factory=list)
    generated_at: datetime


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


class MatterWorkspaceSummaryRead(BaseModel):
    id: str
    title: str
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
    selected_pack_names: list[str] = Field(default_factory=list)
    selected_agent_names: list[str] = Field(default_factory=list)


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
    input_entry_mode: InputEntryMode = InputEntryMode.ONE_LINE_INQUIRY
    deliverable_class_hint: DeliverableClass = DeliverableClass.EXPLORATORY_BRIEF
    external_research_heavy_candidate: bool = False
    selected_pack_ids: list[str] = Field(default_factory=list)
    selected_pack_names: list[str] = Field(default_factory=list)
    pack_summary: str | None = None
    selected_agent_ids: list[str] = Field(default_factory=list)
    selected_agent_names: list[str] = Field(default_factory=list)
    agent_summary: str | None = None
    evidence_count: int
    deliverable_count: int
    run_count: int
    latest_deliverable_title: str | None
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
    deliverable_type: str
    version: int
    generated_at: datetime
    decision_context_title: str | None = None


class MatterMaterialSummaryRead(BaseModel):
    object_id: str
    task_id: str
    task_title: str
    object_type: str
    title: str
    summary: str
    created_at: datetime


class MatterWorkspaceResponse(BaseModel):
    summary: MatterWorkspaceSummaryRead
    client: ClientRead | None = None
    engagement: EngagementRead | None = None
    workstream: WorkstreamRead | None = None
    current_decision_context: DecisionContextRead | None = None
    decision_trajectory: list[MatterDecisionPointRead] = Field(default_factory=list)
    related_tasks: list[TaskListItemResponse] = Field(default_factory=list)
    related_deliverables: list[MatterDeliverableSummaryRead] = Field(default_factory=list)
    related_artifacts: list[MatterMaterialSummaryRead] = Field(default_factory=list)
    related_source_materials: list[MatterMaterialSummaryRead] = Field(default_factory=list)
    readiness_hint: str = ""
    continuity_notes: list[str] = Field(default_factory=list)


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
    client_stage: str | None = None
    client_type: str | None = None
    domain_lenses: list[str] = Field(default_factory=list)
    assumptions: list[str] = Field(default_factory=list)
    input_entry_mode: InputEntryMode = InputEntryMode.ONE_LINE_INQUIRY
    deliverable_class_hint: DeliverableClass = DeliverableClass.EXPLORATORY_BRIEF
    external_research_heavy_candidate: bool = False
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
    matter_workspace: MatterWorkspaceSummaryRead | None = None


class UploadResultItem(BaseModel):
    source_document: SourceDocumentRead
    evidence: EvidenceRead
    source_material: SourceMaterialRead | None = None
    artifact: ArtifactRead | None = None


class UploadBatchResponse(BaseModel):
    task_id: str
    uploaded: list[UploadResultItem]


class SourceIngestRequest(BaseModel):
    urls: list[str] = Field(default_factory=list)
    pasted_text: str = ""
    pasted_title: str | None = None


class SourceIngestBatchResponse(BaseModel):
    task_id: str
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
