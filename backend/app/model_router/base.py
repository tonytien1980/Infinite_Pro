from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any

from pydantic import BaseModel, Field


class ModelProviderError(RuntimeError):
    """Raised when the model provider cannot produce a usable result."""


class ResearchSynthesisRequest(BaseModel):
    task_title: str
    task_description: str
    background_text: str = ""
    goals: list[str] = Field(default_factory=list)
    constraints: list[str] = Field(default_factory=list)
    evidence: list[dict[str, Any]] = Field(default_factory=list)


class CoreAnalysisRequest(BaseModel):
    agent_id: str
    task_title: str
    task_description: str
    background_text: str = ""
    goals: list[str] = Field(default_factory=list)
    constraints: list[str] = Field(default_factory=list)
    evidence: list[dict[str, Any]] = Field(default_factory=list)


class DocumentRestructuringRequest(BaseModel):
    task_title: str
    task_description: str
    background_text: str = ""
    goals: list[str] = Field(default_factory=list)
    constraints: list[str] = Field(default_factory=list)
    evidence: list[dict[str, Any]] = Field(default_factory=list)


class ContractReviewRequest(BaseModel):
    task_title: str
    task_description: str
    background_text: str = ""
    goals: list[str] = Field(default_factory=list)
    constraints: list[str] = Field(default_factory=list)
    evidence: list[dict[str, Any]] = Field(default_factory=list)


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
