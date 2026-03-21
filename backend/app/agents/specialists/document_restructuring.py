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
from app.model_router.base import DocumentRestructuringRequest, ModelProvider


class DocumentRestructuringAgent(SpecialistAgent):
    descriptor = AgentDescriptor(
        agent_id="document_restructuring",
        agent_type="specialist",
        display_name="Document Restructuring Agent",
        agent_category=AgentCategory.SPECIALIST,
        supported_task_types=["document_restructuring"],
        supported_flow_modes=[FlowMode.SPECIALIST],
        required_inputs=["Task", "TaskContext", "Evidence", "Goal"],
        produced_objects=["Recommendation", "ActionItem", "Deliverable"],
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
            "本次文件重構屬於降級草稿，在重用前仍需人工檢查。",
        ]
        if usable_evidence_count == 0:
            missing_information.append(
                "目前無法從背景文字或上傳來源中取得可用證據。"
            )

        recommendations = [
            RecommendationDraft(
                summary="在依賴這份重構建議前，請先提供更完整的來源草稿。",
                rationale="本次執行缺乏足夠穩定的素材，因此無法提出高信心的改寫結構。",
                based_on_refs=[],
                priority="high",
                owner_suggestion="任務負責人",
            )
        ]
        action_items = [
            ActionItemDraft(
                description="請上傳最新工作草稿或補上更完整背景筆記，再重新執行文件重構。",
                suggested_owner="任務負責人",
                priority="high",
            )
        ]
        risks = [
            RiskDraft(
                title="文件重構素材不足",
                description="目前可用來源素材仍偏薄，因此這份重構交付物刻意保持不完整。",
                risk_type="evidence_gap",
                impact_level="high",
                likelihood_level="high",
                evidence_refs=[],
            )
        ]
        deliverable = DeliverableDraft(
            deliverable_type="document_restructuring",
            title=f"{payload.title} - 文件重構（降級）",
            content_structure={
                "problem_definition": payload.description or payload.title,
                "background_summary": payload.background_text or "目前尚無可用的背景摘要。",
                "findings": [],
                "risks": [risk.description for risk in risks],
                "recommendations": [item.summary for item in recommendations],
                "action_items": [item.description for item in action_items],
                "missing_information": missing_information,
                "proposed_outline": [],
                "rewrite_guidance": [],
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
                reason="文件重構代理目前沒有可用證據可供分析。",
                usable_evidence_count=0,
            )

        try:
            restructuring = self.model_provider.generate_document_restructuring(
                DocumentRestructuringRequest(
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
                reason=f"模型路由失敗：{exc}",
                usable_evidence_count=len(usable_evidence),
            )

        evidence_refs = [item.id for item in usable_evidence][:4]
        risks = [
            RiskDraft(
                title=f"Document restructuring risk {index + 1}",
                description=risk,
                risk_type="draft_quality",
                impact_level="medium",
                likelihood_level="medium",
                evidence_refs=evidence_refs[:2],
            )
            for index, risk in enumerate(restructuring.risks)
        ]
        recommendations = [
            RecommendationDraft(
                summary=recommendation,
                rationale="根據目前草稿脈絡與上傳證據整理而成。",
                based_on_refs=evidence_refs,
                priority="high" if index == 0 else "medium",
                owner_suggestion="任務負責人",
            )
            for index, recommendation in enumerate(restructuring.recommendations)
        ]
        action_items = [
            ActionItemDraft(
                description=action_item,
                suggested_owner="任務負責人",
                priority="high" if index == 0 else "medium",
            )
            for index, action_item in enumerate(restructuring.action_items)
        ]
        deliverable = DeliverableDraft(
            deliverable_type="document_restructuring",
            title=f"{payload.title} - 文件重構",
            content_structure={
                "problem_definition": restructuring.problem_definition,
                "background_summary": restructuring.background_summary,
                "findings": restructuring.findings,
                "risks": restructuring.risks,
                "recommendations": restructuring.recommendations,
                "action_items": restructuring.action_items,
                "missing_information": restructuring.missing_information,
                "proposed_outline": restructuring.proposed_outline,
                "rewrite_guidance": restructuring.rewrite_guidance,
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
