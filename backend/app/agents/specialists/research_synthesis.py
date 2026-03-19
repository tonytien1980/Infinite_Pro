from __future__ import annotations

from app.agents.base import (
    ActionItemDraft,
    AgentDescriptor,
    AgentInputPayload,
    AgentResult,
    DeliverableDraft,
    InsightDraft,
    RecommendationDraft,
    RiskDraft,
    SpecialistAgent,
)
from app.domain.enums import AgentCategory, AgentStatus, FlowMode
from app.model_router.base import ModelProvider, ResearchSynthesisRequest


class ResearchSynthesisAgent(SpecialistAgent):
    descriptor = AgentDescriptor(
        agent_id="research_synthesis",
        agent_type="specialist",
        display_name="Research Synthesis Agent",
        agent_category=AgentCategory.SPECIALIST,
        supported_task_types=["research_synthesis"],
        supported_flow_modes=[FlowMode.SPECIALIST],
        required_inputs=["Task", "TaskContext", "Evidence", "Insight"],
        produced_objects=["Insight", "Recommendation", "ActionItem", "Deliverable"],
        default_model_policy="balanced",
        version="0.1.0",
        status=AgentStatus.ACTIVE,
    )

    def __init__(self, model_provider: ModelProvider):
        self.model_provider = model_provider

    def run(self, payload: AgentInputPayload) -> AgentResult:
        synthesis = self.model_provider.generate_research_synthesis(
            ResearchSynthesisRequest(
                task_title=payload.title,
                task_description=payload.description,
                background_text=payload.background_text,
                goals=[goal.description for goal in payload.goals],
                constraints=[constraint.description for constraint in payload.constraints],
                evidence=[
                    {
                        "id": evidence.id,
                        "title": evidence.title,
                        "content": evidence.excerpt_or_summary,
                    }
                    for evidence in payload.evidence
                ],
            )
        )

        evidence_refs = [item.id for item in payload.evidence][:4]
        insights = [
            InsightDraft(summary=finding, evidence_refs=evidence_refs[:2], confidence_level="medium")
            for finding in synthesis.findings
        ]
        risks = [
            RiskDraft(
                title=f"Research synthesis risk {index + 1}",
                description=risk,
                risk_type="evidence_gap",
                impact_level="medium",
                likelihood_level="medium",
                evidence_refs=evidence_refs[:2],
            )
            for index, risk in enumerate(synthesis.risks)
        ]
        recommendations = [
            RecommendationDraft(
                summary=recommendation,
                rationale="Derived from the current background context and uploaded evidence.",
                based_on_refs=evidence_refs,
                priority="high" if index == 0 else "medium",
                owner_suggestion="Task owner",
            )
            for index, recommendation in enumerate(synthesis.recommendations)
        ]
        action_items = [
            ActionItemDraft(
                description=action_item,
                suggested_owner="Task owner",
                priority="high" if index == 0 else "medium",
            )
            for index, action_item in enumerate(synthesis.action_items)
        ]
        deliverable = DeliverableDraft(
            deliverable_type="research_synthesis",
            title=f"{payload.title} - Research Synthesis",
            content_structure={
                "problem_definition": synthesis.problem_definition,
                "background_summary": synthesis.background_summary,
                "findings": synthesis.findings,
                "risks": synthesis.risks,
                "recommendations": synthesis.recommendations,
                "action_items": synthesis.action_items,
                "missing_information": synthesis.missing_information,
                "sources_used": [
                    {"evidence_id": evidence.id, "title": evidence.title}
                    for evidence in payload.evidence
                ],
            },
        )
        return AgentResult(
            insights=insights,
            risks=risks,
            recommendations=recommendations,
            action_items=action_items,
            deliverable=deliverable,
        )
