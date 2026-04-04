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
    build_payload_common_risk_context,
    build_payload_deliverable_shape_context,
    build_payload_domain_playbook_context,
    build_payload_organization_memory_context,
    build_payload_precedent_context,
    build_payload_review_lens_context,
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
            "本次合約審閱屬於降級的議題標記草稿，不應視為最終法律審閱結果。",
        ]
        if usable_evidence_count == 0:
            missing_information.append(
                "目前無法從背景文字或上傳來源中取得可用證據。"
            )

        recommendations = [
            RecommendationDraft(
                summary="在依賴這份審閱結果前，請先提供最新合約草稿。",
                rationale="本次執行缺乏足夠穩定的條款層級證據，因此無法支撐高信心審閱。",
                based_on_refs=[],
                priority="high",
                owner_suggestion="任務負責人",
            )
        ]
        action_items = [
            ActionItemDraft(
                description="請上傳可執行草稿或關鍵條款摘錄後，再重新執行合約審閱。",
                suggested_owner="任務負責人",
                priority="high",
            )
        ]
        risks = [
            RiskDraft(
                title="合約審閱素材不足",
                description="目前可用來源素材不足以支撐可靠的議題標記，因此這份交付物刻意保持不完整。",
                risk_type="evidence_gap",
                impact_level="high",
                likelihood_level="high",
                evidence_refs=[],
            )
        ]
        deliverable = DeliverableDraft(
            deliverable_type="contract_review",
            title=f"{payload.title} - 合約審閱（降級）",
            content_structure={
                "problem_definition": payload.description or payload.title,
                "background_summary": payload.background_text or "目前尚無可用的背景摘要。",
                "findings": [],
                "risks": [risk.description for risk in risks],
                "recommendations": [item.summary for item in recommendations],
                "action_items": [item.description for item in action_items],
                "missing_information": missing_information,
                "clauses_reviewed": [],
                "obligations_identified": [],
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
            if not evidence.evidence_type.endswith("unparsed")
            and not evidence.evidence_type.endswith("ingestion_issue")
            and evidence.excerpt_or_summary.strip()
        ]

        if not usable_evidence and not payload.background_text.strip():
            return self._fallback_result(
                payload,
                reason="合約審閱代理目前沒有可用證據可供分析。",
                usable_evidence_count=0,
            )

        review = self.model_provider.generate_contract_review(
            ContractReviewRequest(
                task_title=payload.title,
                task_description=payload.description,
                response_language=payload.response_language,
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
                organization_memory_context=build_payload_organization_memory_context(payload),
                domain_playbook_context=build_payload_domain_playbook_context(payload),
                precedent_context=build_payload_precedent_context(payload),
                review_lens_context=build_payload_review_lens_context(payload),
                common_risk_context=build_payload_common_risk_context(payload),
                deliverable_shape_context=build_payload_deliverable_shape_context(payload),
            )
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
                rationale="根據目前合約脈絡與上傳來源整理而成。",
                based_on_refs=evidence_refs,
                priority="high" if index == 0 else "medium",
                owner_suggestion="任務負責人",
            )
            for index, recommendation in enumerate(review.recommendations)
        ]
        action_items = [
            ActionItemDraft(
                description=action_item,
                suggested_owner="任務負責人",
                priority="high" if index == 0 else "medium",
            )
            for index, action_item in enumerate(review.action_items)
        ]
        deliverable = DeliverableDraft(
            deliverable_type="contract_review",
            title=f"{payload.title} - 合約審閱",
            content_structure={
                "problem_definition": review.problem_definition,
                "background_summary": review.background_summary,
                "findings": review.findings,
                "risks": review.risks,
                "recommendations": review.recommendations,
                "action_items": review.action_items,
                "missing_information": review.missing_information,
                "clauses_reviewed": review.clauses_reviewed,
                "obligations_identified": review.obligations_identified,
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
