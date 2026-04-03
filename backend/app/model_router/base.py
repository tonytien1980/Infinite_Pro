from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any

from pydantic import BaseModel, Field
from typing import Literal


ResponseLanguage = Literal["zh-Hant", "en"]


class ModelProviderError(RuntimeError):
    """Raised when the model provider cannot produce a usable result."""


class ResearchSynthesisRequest(BaseModel):
    task_title: str
    task_description: str
    response_language: ResponseLanguage = "zh-Hant"
    background_text: str = ""
    goals: list[str] = Field(default_factory=list)
    constraints: list[str] = Field(default_factory=list)
    evidence: list[dict[str, Any]] = Field(default_factory=list)


class CoreAnalysisRequest(BaseModel):
    agent_id: str
    task_title: str
    task_description: str
    response_language: ResponseLanguage = "zh-Hant"
    background_text: str = ""
    goals: list[str] = Field(default_factory=list)
    constraints: list[str] = Field(default_factory=list)
    evidence: list[dict[str, Any]] = Field(default_factory=list)
    research_depth: str = ""
    research_sub_questions: list[str] = Field(default_factory=list)
    evidence_gap_focus: list[str] = Field(default_factory=list)


class DocumentRestructuringRequest(BaseModel):
    task_title: str
    task_description: str
    response_language: ResponseLanguage = "zh-Hant"
    background_text: str = ""
    goals: list[str] = Field(default_factory=list)
    constraints: list[str] = Field(default_factory=list)
    evidence: list[dict[str, Any]] = Field(default_factory=list)


class ContractReviewRequest(BaseModel):
    task_title: str
    task_description: str
    response_language: ResponseLanguage = "zh-Hant"
    background_text: str = ""
    goals: list[str] = Field(default_factory=list)
    constraints: list[str] = Field(default_factory=list)
    evidence: list[dict[str, Any]] = Field(default_factory=list)


class SearchResultContext(BaseModel):
    title: str
    url: str
    snippet: str = ""


class AgentContractSynthesisRequest(BaseModel):
    agent_id: str
    agent_name: str
    agent_type: str
    response_language: ResponseLanguage = "zh-Hant"
    description: str = ""
    supported_capabilities: list[str] = Field(default_factory=list)
    relevant_domain_packs: list[str] = Field(default_factory=list)
    relevant_industry_packs: list[str] = Field(default_factory=list)
    role_focus: str = ""
    input_focus: str = ""
    output_focus: str = ""
    when_to_use: str = ""
    boundary_focus: str = ""
    search_query: str = ""
    search_results: list[SearchResultContext] = Field(default_factory=list)


class PackContractSynthesisRequest(BaseModel):
    pack_id: str
    pack_type: str
    pack_name: str
    response_language: ResponseLanguage = "zh-Hant"
    description: str = ""
    definition: str = ""
    domain_lenses: list[str] = Field(default_factory=list)
    routing_keywords: str = ""
    common_business_models: str = ""
    common_problem_patterns: str = ""
    key_signals: str = ""
    evidence_expectations: str = ""
    common_risks: str = ""
    search_query: str = ""
    search_results: list[SearchResultContext] = Field(default_factory=list)


class ResearchSynthesisOutput(BaseModel):
    problem_definition: str
    background_summary: str
    findings: list[str]
    risks: list[str]
    recommendations: list[str]
    action_items: list[str]
    missing_information: list[str]


class CoreAnalysisOutput(BaseModel):
    findings: list[str]
    risks: list[str]
    recommendations: list[str]
    action_items: list[str]
    missing_information: list[str]
    research_sub_questions: list[str] = Field(default_factory=list)
    source_quality_notes: list[str] = Field(default_factory=list)
    contradiction_notes: list[str] = Field(default_factory=list)
    evidence_gap_notes: list[str] = Field(default_factory=list)
    citation_handoff: list[str] = Field(default_factory=list)


class DocumentRestructuringOutput(BaseModel):
    problem_definition: str
    background_summary: str
    findings: list[str]
    risks: list[str]
    recommendations: list[str]
    action_items: list[str]
    missing_information: list[str]
    proposed_outline: list[str]
    rewrite_guidance: list[str]


class ContractReviewOutput(BaseModel):
    problem_definition: str
    background_summary: str
    findings: list[str]
    risks: list[str]
    recommendations: list[str]
    action_items: list[str]
    missing_information: list[str]
    clauses_reviewed: list[str]
    obligations_identified: list[str]


class AgentContractSynthesisOutput(BaseModel):
    agent_type: str
    supported_capabilities: list[str]
    relevant_domain_packs: list[str]
    relevant_industry_packs: list[str]
    description: str
    primary_responsibilities: list[str]
    out_of_scope: list[str]
    defer_rules: list[str]
    preferred_execution_modes: list[str]
    input_requirements: list[str]
    minimum_evidence_readiness: list[str]
    required_context_fields: list[str]
    output_contract: list[str]
    produced_objects: list[str]
    deliverable_impact: list[str]
    writeback_expectations: list[str]
    invocation_rules: list[str]
    escalation_rules: list[str]
    handoff_targets: list[str]
    evaluation_focus: list[str]
    failure_modes_to_watch: list[str]
    trace_requirements: list[str]
    synthesis_summary: str
    generation_notes: list[str]


class PackContractSynthesisOutput(BaseModel):
    description: str
    domain_definition: str
    industry_definition: str
    common_business_models: list[str]
    common_problem_patterns: list[str]
    stage_specific_heuristics: dict[str, list[str]]
    key_kpis_or_operating_signals: list[str]
    key_kpis: list[str]
    domain_lenses: list[str]
    relevant_client_types: list[str]
    relevant_client_stages: list[str]
    default_decision_context_patterns: list[str]
    evidence_expectations: list[str]
    risk_libraries: list[str]
    common_risks: list[str]
    decision_patterns: list[str]
    deliverable_presets: list[str]
    recommendation_patterns: list[str]
    routing_hints: list[str]
    pack_notes: list[str]
    scope_boundaries: list[str]
    pack_rationale: list[str]
    synthesis_summary: str
    generation_notes: list[str]


class ModelProvider(ABC):
    @abstractmethod
    def generate_research_synthesis(
        self,
        request: ResearchSynthesisRequest,
    ) -> ResearchSynthesisOutput:
        raise NotImplementedError

    @abstractmethod
    def generate_core_analysis(
        self,
        request: CoreAnalysisRequest,
    ) -> CoreAnalysisOutput:
        raise NotImplementedError

    @abstractmethod
    def generate_document_restructuring(
        self,
        request: DocumentRestructuringRequest,
    ) -> DocumentRestructuringOutput:
        raise NotImplementedError

    @abstractmethod
    def generate_contract_review(
        self,
        request: ContractReviewRequest,
    ) -> ContractReviewOutput:
        raise NotImplementedError

    @abstractmethod
    def generate_agent_contract_synthesis(
        self,
        request: AgentContractSynthesisRequest,
    ) -> AgentContractSynthesisOutput:
        raise NotImplementedError

    @abstractmethod
    def generate_pack_contract_synthesis(
        self,
        request: PackContractSynthesisRequest,
    ) -> PackContractSynthesisOutput:
        raise NotImplementedError
