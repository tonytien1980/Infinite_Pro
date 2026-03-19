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

    def _fallback_result(
        self,
        payload: AgentInputPayload,
        *,
        reason: str,
        usable_evidence_count: int,
    ) -> AgentResult:
        missing_information = [
            reason,
            "The current run is degraded and should be treated as an uncertainty-marked working draft.",
        ]
        if usable_evidence_count == 0:
            missing_information.append(
                "No usable evidence was available from background text or uploaded sources."
            )

        recommendations = [
            RecommendationDraft(
                summary="Collect or repair source material before relying on this synthesis.",
                rationale="The current run did not have enough stable evidence to support a confident synthesis.",
                based_on_refs=[],
                priority="high",
                owner_suggestion="Task owner",
            )
        ]
        action_items = [
            ActionItemDraft(
                description="Add usable background notes or upload supported text-based files, then rerun the synthesis.",
                suggested_owner="Task owner",
                priority="high",
            )
        ]
        risks = [
            RiskDraft(
                title="Insufficient evidence for a confident synthesis",
                description="This deliverable is intentionally incomplete because the available evidence could not support a reliable summary.",
                risk_type="evidence_gap",
                impact_level="high",
                likelihood_level="high",
                evidence_refs=[],
            )
        ]
        deliverable = DeliverableDraft(
            deliverable_type="research_synthesis",
            title=f"{payload.title} - Research Synthesis (Degraded)",
            content_structure={
                "problem_definition": payload.description or payload.title,
                "background_summary": payload.background_text or "No background summary was available.",
                "findings": [],
                "risks": [risk.description for risk in risks],
                "recommendations": [item.summary for item in recommendations],
                "action_items": [item.description for item in action_items],
                "missing_information": missing_information,
            },
        )
        return AgentResult(
            insights=[],
            risks=risks,
            recommendations=recommendations,
            action_items=action_items,
            deliverable=deliverable,
        )

    def run(self, payload: AgentInputPayload) -> AgentResult:
        usable_evidence = [
            evidence
            for evidence in payload.evidence
            if evidence.evidence_type not in {"uploaded_file_unparsed", "uploaded_file_ingestion_issue"}
            and evidence.excerpt_or_summary.strip()
        ]

        if not usable_evidence and not payload.background_text.strip():
            return self._fallback_result(
                payload,
                reason="No usable evidence was available for the Research Synthesis Agent.",
                usable_evidence_count=0,
            )

        try:
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
                        for evidence in usable_evidence
                    ],
                )
            )
        except Exception as exc:
            return self._fallback_result(
                payload,
                reason=f"Model router failure: {exc}",
                usable_evidence_count=len(usable_evidence),
            )

        evidence_refs = [item.id for item in usable_evidence][:4]
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
                    for evidence in usable_evidence
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
