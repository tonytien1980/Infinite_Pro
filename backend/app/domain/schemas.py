from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.domain.enums import FlowMode, RunStatus, TaskStatus


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


class TaskContextRead(ORMModel):
    id: str
    task_id: str
    summary: str
    assumptions: str | None
    notes: str | None
    version: int
    created_at: datetime


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


class EvidenceRead(ORMModel):
    id: str
    task_id: str
    source_document_id: str | None
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
    status: str
    created_at: datetime


class DeliverableRead(ORMModel):
    id: str
    task_id: str
    task_run_id: str | None
    deliverable_type: str
    title: str
    content_structure: dict[str, Any]
    version: int
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


class TaskListItemResponse(BaseModel):
    id: str
    title: str
    description: str
    task_type: str
    mode: FlowMode
    status: TaskStatus
    created_at: datetime
    updated_at: datetime
    evidence_count: int
    deliverable_count: int
    run_count: int
    latest_deliverable_title: str | None


class TaskAggregateResponse(BaseModel):
    id: str
    title: str
    description: str
    task_type: str
    mode: FlowMode
    status: TaskStatus
    created_at: datetime
    updated_at: datetime
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


class UploadResultItem(BaseModel):
    source_document: SourceDocumentRead
    evidence: EvidenceRead


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
