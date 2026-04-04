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
    build_payload_common_risk_context,
    build_payload_deliverable_shape_context,
    build_payload_deliverable_template_context,
    build_payload_domain_playbook_context,
    build_payload_organization_memory_context,
    build_payload_precedent_context,
    build_payload_review_lens_context,
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
            "本次執行屬於降級結果，應視為帶有不確定性註記的工作草稿。",
        ]
        if usable_evidence_count == 0:
            missing_information.append(
                "目前無法從背景文字或上傳來源中取得可用證據。"
            )

        recommendations = [
            RecommendationDraft(
                summary="在依賴這份綜整前，請先補齊或修復來源資料。",
                rationale="本次執行缺乏足夠穩定的證據，因此無法支撐高信心綜整。",
                based_on_refs=[],
                priority="high",
                owner_suggestion="任務負責人",
            )
        ]
        action_items = [
            ActionItemDraft(
                description="請補上可用的背景筆記或支援的文字型檔案，再重新執行研究綜整。",
                suggested_owner="任務負責人",
                priority="high",
            )
        ]
        risks = [
            RiskDraft(
                title="證據不足，無法形成高信心綜整",
                description="目前可用證據不足以支撐可靠摘要，因此這份交付物刻意保持不完整。",
                risk_type="evidence_gap",
                impact_level="high",
                likelihood_level="high",
                evidence_refs=[],
            )
        ]
        deliverable = DeliverableDraft(
            deliverable_type="research_synthesis",
            title=f"{payload.title} - 研究綜整（降級）",
            content_structure={
                "problem_definition": payload.description or payload.title,
                "background_summary": payload.background_text or "目前尚無可用的背景摘要。",
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
            if not evidence.evidence_type.endswith("unparsed")
            and not evidence.evidence_type.endswith("ingestion_issue")
            and evidence.excerpt_or_summary.strip()
        ]

        if not usable_evidence and not payload.background_text.strip():
            return self._fallback_result(
                payload,
                reason="研究綜整代理目前沒有可用證據可供分析。",
                usable_evidence_count=0,
            )

        synthesis = self.model_provider.generate_research_synthesis(
            ResearchSynthesisRequest(
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
                deliverable_template_context=build_payload_deliverable_template_context(payload),
            )
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
                rationale="根據目前背景脈絡與上傳證據整理而成。",
                based_on_refs=evidence_refs,
                priority="high" if index == 0 else "medium",
                owner_suggestion="任務負責人",
            )
            for index, recommendation in enumerate(synthesis.recommendations)
        ]
        action_items = [
            ActionItemDraft(
                description=action_item,
                suggested_owner="任務負責人",
                priority="high" if index == 0 else "medium",
            )
            for index, action_item in enumerate(synthesis.action_items)
        ]
        deliverable = DeliverableDraft(
            deliverable_type="research_synthesis",
            title=f"{payload.title} - 研究綜整",
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
