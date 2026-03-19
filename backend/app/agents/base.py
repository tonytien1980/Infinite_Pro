from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any

from pydantic import BaseModel, Field

from app.domain.enums import AgentCategory, AgentStatus, FlowMode
from app.domain.schemas import ConstraintRead, EvidenceRead, GoalRead, SubjectRead


class AgentDescriptor(BaseModel):
    agent_id: str
    agent_type: str
    display_name: str
    agent_category: AgentCategory
    supported_task_types: list[str]
    supported_flow_modes: list[FlowMode]
    required_inputs: list[str]
    produced_objects: list[str]
    default_model_policy: str
    version: str
    status: AgentStatus


class AgentInputPayload(BaseModel):
    task_id: str
    title: str
    description: str
    task_type: str
    flow_mode: FlowMode
    background_text: str = ""
    subjects: list[SubjectRead] = Field(default_factory=list)
    goals: list[GoalRead] = Field(default_factory=list)
    constraints: list[ConstraintRead] = Field(default_factory=list)
    evidence: list[EvidenceRead] = Field(default_factory=list)


class InsightDraft(BaseModel):
    summary: str
    evidence_refs: list[str] = Field(default_factory=list)
    confidence_level: str = "medium"


class RiskDraft(BaseModel):
    title: str
    description: str
    risk_type: str = "general"
    impact_level: str = "medium"
    likelihood_level: str = "medium"
    evidence_refs: list[str] = Field(default_factory=list)


class OptionDraft(BaseModel):
    title: str
    description: str
    pros: list[str] = Field(default_factory=list)
    cons: list[str] = Field(default_factory=list)
    related_risk_refs: list[str] = Field(default_factory=list)


class RecommendationDraft(BaseModel):
    summary: str
    rationale: str
    based_on_refs: list[str] = Field(default_factory=list)
    priority: str = "medium"
    owner_suggestion: str | None = None


class ActionItemDraft(BaseModel):
    description: str
    suggested_owner: str | None = None
    priority: str = "medium"
    due_hint: str | None = None
    dependency_refs: list[str] = Field(default_factory=list)
    status: str = "open"


class DeliverableDraft(BaseModel):
    deliverable_type: str
    title: str
    content_structure: dict[str, Any]


class AgentResult(BaseModel):
    insights: list[InsightDraft] = Field(default_factory=list)
    risks: list[RiskDraft] = Field(default_factory=list)
    options: list[OptionDraft] = Field(default_factory=list)
    recommendations: list[RecommendationDraft] = Field(default_factory=list)
    action_items: list[ActionItemDraft] = Field(default_factory=list)
    deliverable: DeliverableDraft


class SpecialistAgent(ABC):
    descriptor: AgentDescriptor

    @abstractmethod
    def run(self, payload: AgentInputPayload) -> AgentResult:
        raise NotImplementedError
