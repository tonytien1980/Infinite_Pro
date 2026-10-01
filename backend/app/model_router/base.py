from __future__ import annotations

from abc import ABC, abstractmethod
from contextlib import contextmanager
from contextvars import ContextVar
from dataclasses import dataclass
import json
import time
from typing import Any

from pydantic import BaseModel, ConfigDict, Field
from typing import Literal


ResponseLanguage = Literal["zh-Hant", "en"]


class ModelProviderError(RuntimeError):
    """Raised when the model provider cannot produce a usable result."""


class ModelProviderAccessError(ModelProviderError):
    """Raised when the current member is not allowed to use a provider path."""


class AnalysisBudgetError(ModelProviderError):
    """A run cannot continue without silently exceeding its approved limits."""


@dataclass
class AnalysisBudget:
    deadline: float
    max_attempts: int
    attempts: int = 0

    def check_time(self) -> float:
        remaining = self.deadline - time.monotonic()
        if remaining <= 0:
            raise AnalysisBudgetError("本輪分析已達時間上限，尚未完成；請縮小本輪問題後再試。")
        return remaining


_analysis_budget: ContextVar[AnalysisBudget | None] = ContextVar("analysis_budget", default=None)


@contextmanager
def analysis_budget():
    from app.core.config import settings
    budget = AnalysisBudget(time.monotonic() + settings.analysis_timeout_seconds, settings.analysis_max_attempts)
    token = _analysis_budget.set(budget)
    try:
        yield budget
    finally:
        _analysis_budget.reset(token)


def check_analysis_deadline() -> None:
    if budget := _analysis_budget.get():
        budget.check_time()


def analysis_output_token_limit() -> int | None:
    from app.core.config import settings
    return settings.analysis_output_tokens if _analysis_budget.get() is not None else None


def begin_provider_attempt(model: str | None, payload: dict, timeout: float) -> float:
    from app.core.config import settings
    budget = _analysis_budget.get()
    if budget is None:
        return timeout
    remaining = budget.check_time()
    if budget.attempts >= budget.max_attempts:
        raise AnalysisBudgetError("本輪分析已達模型呼叫上限，尚未完成；請縮小本輪問題後再試。")
    if model is not None:
        capacity = settings.model_context_window_tokens.get(model)
        # UTF-8 bytes are a conservative admission bound, not measured token usage.
        # Include the complete wire payload/schema plus framing and reserved output.
        estimate = len(json.dumps(payload, ensure_ascii=False).encode("utf-8")) + 1024
        if capacity is None or capacity <= 0 or estimate + settings.analysis_output_tokens > capacity:
            raise AnalysisBudgetError("模型 context 容量未知或請求超限；請確認設定或縮小本輪材料，未送出請求。")
    budget.attempts += 1
    return min(timeout, settings.analysis_attempt_timeout_seconds, remaining)


class EvidenceCitation(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    evidence_id: str = Field(min_length=1)
    quote: str = Field(min_length=1)


class CitedStatement(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    text: str = Field(min_length=1)
    kind: Literal["fact", "inference", "assumption"]
    citations: list[EvidenceCitation]

    @property
    def evidence_refs(self) -> list[str]:
        return list(dict.fromkeys(item.evidence_id for item in self.citations))

    def display_text(self, language: str = "zh-Hant") -> str:
        if self.kind == "fact":
            return self.text
        labels = {"inference": "Inference: ", "assumption": "Assumption: "} if language == "en" else {"inference": "推論：", "assumption": "假設："}
        return labels[self.kind] + self.text


class EvidenceReadingRequest(BaseModel):
    evidence: list[dict[str, Any]]
    response_language: ResponseLanguage = "zh-Hant"
    mode: Literal["read", "consolidate"] = "read"
    repair_reason: str = ""


class EvidenceReadingOutput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    covered_evidence_ids: list[str]
    facts: list[CitedStatement]
    numbers: list[CitedStatement]
    conditions: list[CitedStatement]
    conflicts: list[CitedStatement]
    gaps: list[CitedStatement]


class ResearchSynthesisRequest(BaseModel):
    task_title: str
    task_description: str
    response_language: ResponseLanguage = "zh-Hant"
    background_text: str = ""
    repair_reason: str = ""
    goals: list[str] = Field(default_factory=list)
    constraints: list[str] = Field(default_factory=list)
    evidence: list[dict[str, Any]] = Field(default_factory=list)
    organization_memory_context: list[str] = Field(default_factory=list)
    domain_playbook_context: list[str] = Field(default_factory=list)
    precedent_context: list[str] = Field(default_factory=list)
    review_lens_context: list[str] = Field(default_factory=list)
    common_risk_context: list[str] = Field(default_factory=list)
    deliverable_shape_context: list[str] = Field(default_factory=list)
    deliverable_template_context: list[str] = Field(default_factory=list)


class CoreAnalysisRequest(BaseModel):
    agent_id: str
    task_title: str
    task_description: str
    response_language: ResponseLanguage = "zh-Hant"
    background_text: str = ""
    repair_reason: str = ""
    goals: list[str] = Field(default_factory=list)
    constraints: list[str] = Field(default_factory=list)
    evidence: list[dict[str, Any]] = Field(default_factory=list)
    organization_memory_context: list[str] = Field(default_factory=list)
    domain_playbook_context: list[str] = Field(default_factory=list)
    precedent_context: list[str] = Field(default_factory=list)
    review_lens_context: list[str] = Field(default_factory=list)
    common_risk_context: list[str] = Field(default_factory=list)
    deliverable_shape_context: list[str] = Field(default_factory=list)
    deliverable_template_context: list[str] = Field(default_factory=list)
    research_depth: str = ""
    research_sub_questions: list[str] = Field(default_factory=list)
    evidence_gap_focus: list[str] = Field(default_factory=list)


class DocumentRestructuringRequest(BaseModel):
    task_title: str
    task_description: str
    response_language: ResponseLanguage = "zh-Hant"
    background_text: str = ""
    repair_reason: str = ""
    goals: list[str] = Field(default_factory=list)
    constraints: list[str] = Field(default_factory=list)
    evidence: list[dict[str, Any]] = Field(default_factory=list)
    organization_memory_context: list[str] = Field(default_factory=list)
    domain_playbook_context: list[str] = Field(default_factory=list)
    precedent_context: list[str] = Field(default_factory=list)
    review_lens_context: list[str] = Field(default_factory=list)
    common_risk_context: list[str] = Field(default_factory=list)
    deliverable_shape_context: list[str] = Field(default_factory=list)
    deliverable_template_context: list[str] = Field(default_factory=list)


class ContractReviewRequest(BaseModel):
    task_title: str
    task_description: str
    response_language: ResponseLanguage = "zh-Hant"
    background_text: str = ""
    repair_reason: str = ""
    goals: list[str] = Field(default_factory=list)
    constraints: list[str] = Field(default_factory=list)
    evidence: list[dict[str, Any]] = Field(default_factory=list)
    organization_memory_context: list[str] = Field(default_factory=list)
    domain_playbook_context: list[str] = Field(default_factory=list)
    precedent_context: list[str] = Field(default_factory=list)
    review_lens_context: list[str] = Field(default_factory=list)
    common_risk_context: list[str] = Field(default_factory=list)
    deliverable_shape_context: list[str] = Field(default_factory=list)
    deliverable_template_context: list[str] = Field(default_factory=list)


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
    model_config = ConfigDict(extra="forbid")
    problem_definition: str
    background_summary: str
    findings: list[CitedStatement]
    risks: list[CitedStatement]
    recommendations: list[CitedStatement]
    action_items: list[str]
    missing_information: list[str]


class CoreAnalysisOutput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    findings: list[CitedStatement]
    risks: list[CitedStatement]
    recommendations: list[CitedStatement]
    action_items: list[str]
    missing_information: list[str]
    research_sub_questions: list[str] = Field(default_factory=list)
    source_quality_notes: list[str] = Field(default_factory=list)
    contradiction_notes: list[str] = Field(default_factory=list)
    evidence_gap_notes: list[str] = Field(default_factory=list)
    citation_handoff: list[str] = Field(default_factory=list)


class DocumentRestructuringOutput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    problem_definition: str
    background_summary: str
    findings: list[CitedStatement]
    risks: list[CitedStatement]
    recommendations: list[CitedStatement]
    action_items: list[str]
    missing_information: list[str]
    proposed_outline: list[str]
    rewrite_guidance: list[str]


class ContractReviewOutput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    problem_definition: str
    background_summary: str
    findings: list[CitedStatement]
    risks: list[CitedStatement]
    recommendations: list[CitedStatement]
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
    def read_evidence(self, request: EvidenceReadingRequest) -> EvidenceReadingOutput:
        raise NotImplementedError

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
