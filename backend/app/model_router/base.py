from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any

from pydantic import BaseModel, Field


class ResearchSynthesisRequest(BaseModel):
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


class ModelProvider(ABC):
    @abstractmethod
    def generate_research_synthesis(
        self,
        request: ResearchSynthesisRequest,
    ) -> ResearchSynthesisOutput:
        raise NotImplementedError
