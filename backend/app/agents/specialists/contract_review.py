from __future__ import annotations

from app.agents.base import (
    ActionItemDraft,
    AgentDescriptor,
    AgentInputPayload,
    AgentResult,
    DeliverableDraft,
    RecommendationDraft,
    RiskDraft,
    SpecialistAgent,
)
from app.domain.enums import AgentCategory, AgentStatus, FlowMode
from app.model_router.base import ContractReviewRequest, ModelProvider


class ContractReviewAgent(SpecialistAgent):
    descriptor = AgentDescriptor(
        agent_id="contract_review",
        agent_type="specialist",
        display_name="Contract Review Agent",
        agent_category=AgentCategory.SPECIALIST,
        supported_task_types=["contract_review"],
        supported_flow_modes=[FlowMode.SPECIALIST],
        required_inputs=["Task", "TaskContext", "Evidence"],
        produced_objects=["Risk", "Recommendation", "ActionItem", "Deliverable"],
        default_model_policy="precise",
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
            "The current contract review is a degraded issue-spotting draft and should not be treated as final legal review.",
        ]
        if usable_evidence_count == 0:
            missing_information.append(
                "No usable evidence was available from background text or uploaded sources."
            )

        recommendations = [
            RecommendationDraft(
                summary="Provide the latest contract draft before relying on this review output.",
                rationale="The current run did not have enough stable clause-level evidence for a confident review.",
                based_on_refs=[],
                priority="high",
                owner_suggestion="Task owner",
            )
        ]
        action_items = [
            ActionItemDraft(
                description="Upload the executable draft or key clause excerpts, then rerun contract review.",
                suggested_owner="Task owner",
                priority="high",
            )
        ]
        risks = [
            RiskDraft(
                title="Insufficient material for contract review",
                description="This deliverable is intentionally incomplete because the available source material is too thin for a reliable issue-spotting pass.",
                risk_type="evidence_gap",
                impact_level="high",
                likelihood_level="high",
                evidence_refs=[],
            )
        ]
        deliverable = DeliverableDraft(
            deliverable_type="contract_review",
            title=f"{payload.title} - Contract Review (Degraded)",
            content_structure={
                "problem_definition": payload.description or payload.title,
                "background_summary": payload.background_text or "No background summary was available.",
                "findings": [],
                "risks": [risk.description for risk in risks],
                "recommendations": [item.summary for item in recommendations],
                "action_items": [item.description for item in action_items],
                "missing_information": missing_information,
                "clauses_reviewed": [],
            },
        )
        return AgentResult(
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
                reason="No usable evidence was available for the Contract Review Agent.",
                usable_evidence_count=0,
            )

        try:
            review = self.model_provider.generate_contract_review(
                ContractReviewRequest(
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
        risks = [
            RiskDraft(
                title=f"Contract review risk {index + 1}",
                description=risk,
                risk_type="contractual",
                impact_level="high" if index == 0 else "medium",
                likelihood_level="medium",
                evidence_refs=evidence_refs[:2],
            )
            for index, risk in enumerate(review.risks)
        ]
        recommendations = [
            RecommendationDraft(
                summary=recommendation,
                rationale="Derived from the current contract context and uploaded source material.",
                based_on_refs=evidence_refs,
                priority="high" if index == 0 else "medium",
                owner_suggestion="Task owner",
            )
            for index, recommendation in enumerate(review.recommendations)
        ]
        action_items = [
            ActionItemDraft(
                description=action_item,
                suggested_owner="Task owner",
                priority="high" if index == 0 else "medium",
            )
            for index, action_item in enumerate(review.action_items)
        ]
        deliverable = DeliverableDraft(
            deliverable_type="contract_review",
            title=f"{payload.title} - Contract Review",
            content_structure={
                "problem_definition": review.problem_definition,
                "background_summary": review.background_summary,
                "findings": review.findings,
                "risks": review.risks,
                "recommendations": review.recommendations,
                "action_items": review.action_items,
                "missing_information": review.missing_information,
                "clauses_reviewed": review.clauses_reviewed,
                "sources_used": [
                    {"evidence_id": evidence.id, "title": evidence.title}
                    for evidence in usable_evidence
                ],
            },
        )
        return AgentResult(
            risks=risks,
            recommendations=recommendations,
            action_items=action_items,
            deliverable=deliverable,
        )
