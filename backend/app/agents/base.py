from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any

from pydantic import BaseModel, Field
from typing import Literal

from app.domain.enums import (
    AgentCategory,
    AgentStatus,
    DeliverableClass,
    EngagementContinuityMode,
    FlowMode,
    InputEntryMode,
    WritebackDepth,
)
from app.domain.schemas import (
    AgentSelectionRead,
    ArtifactRead,
    CaseWorldDraftRead,
    CaseWorldStateRead,
    ClientRead,
    CommonRiskGuidanceRead,
    ConstraintRead,
    DecisionContextRead,
    DeliverableShapeGuidanceRead,
    DeliverableTemplateGuidanceRead,
    DomainPlaybookGuidanceRead,
    EngagementRead,
    EvidenceRead,
    GoalRead,
    OrganizationMemoryGuidanceRead,
    PackResolutionRead,
    PrecedentReferenceGuidanceRead,
    PresenceStateSummaryRead,
    ReviewLensGuidanceRead,
    SourceMaterialRead,
    SubjectRead,
    WorkstreamRead,
)


class AgentDescriptor(BaseModel):
    agent_id: str
    agent_type: str
    display_name: str
    agent_category: AgentCategory
    supported_task_types: list[str]
    supported_flow_modes: list[FlowMode]
    required_inputs: list[str]
    produced_objects: list[str]
    default_model_policy: str
    version: str
    status: AgentStatus


class AgentInputPayload(BaseModel):
    task_id: str
    title: str
    description: str
    response_language: Literal["zh-Hant", "en"] = "zh-Hant"
    task_type: str
    flow_mode: FlowMode
    background_text: str = ""
    client: ClientRead | None = None
    engagement: EngagementRead | None = None
    workstream: WorkstreamRead | None = None
    decision_context: DecisionContextRead | None = None
    domain_lenses: list[str] = Field(default_factory=list)
    assumptions: list[str] = Field(default_factory=list)
    entry_preset: InputEntryMode = InputEntryMode.ONE_LINE_INQUIRY
    input_entry_mode: InputEntryMode = InputEntryMode.ONE_LINE_INQUIRY
    engagement_continuity_mode: EngagementContinuityMode = EngagementContinuityMode.ONE_OFF
    writeback_depth: WritebackDepth = WritebackDepth.MINIMAL
    deliverable_class_hint: DeliverableClass = DeliverableClass.EXPLORATORY_BRIEF
    external_research_heavy_candidate: bool = False
    research_depth: str = ""
    research_sub_questions: list[str] = Field(default_factory=list)
    research_evidence_gap_focus: list[str] = Field(default_factory=list)
    sparse_input_summary: str = ""
    case_world_draft: CaseWorldDraftRead | None = None
    case_world_state: CaseWorldStateRead | None = None
    presence_state_summary: PresenceStateSummaryRead
    pack_resolution: PackResolutionRead = Field(default_factory=PackResolutionRead)
    agent_selection: AgentSelectionRead = Field(default_factory=AgentSelectionRead)
    organization_memory_guidance: OrganizationMemoryGuidanceRead = Field(
        default_factory=OrganizationMemoryGuidanceRead
    )
    domain_playbook_guidance: DomainPlaybookGuidanceRead = Field(
        default_factory=DomainPlaybookGuidanceRead
    )
    precedent_reference_guidance: PrecedentReferenceGuidanceRead = Field(
        default_factory=PrecedentReferenceGuidanceRead
    )
    review_lens_guidance: ReviewLensGuidanceRead = Field(default_factory=ReviewLensGuidanceRead)
    common_risk_guidance: CommonRiskGuidanceRead = Field(default_factory=CommonRiskGuidanceRead)
    deliverable_shape_guidance: DeliverableShapeGuidanceRead = Field(
        default_factory=DeliverableShapeGuidanceRead
    )
    deliverable_template_guidance: DeliverableTemplateGuidanceRead = Field(
        default_factory=DeliverableTemplateGuidanceRead
    )
    source_materials: list[SourceMaterialRead] = Field(default_factory=list)
    artifacts: list[ArtifactRead] = Field(default_factory=list)
    subjects: list[SubjectRead] = Field(default_factory=list)
    goals: list[GoalRead] = Field(default_factory=list)
    constraints: list[ConstraintRead] = Field(default_factory=list)
    evidence: list[EvidenceRead] = Field(default_factory=list)


def build_payload_precedent_context(payload: AgentInputPayload) -> list[str]:
    guidance = payload.precedent_reference_guidance
    if guidance.status != "available" or not guidance.matched_items:
        return []

    lines: list[str] = []
    for index, item in enumerate(guidance.matched_items[:2], start=1):
        optimization_signal = item.optimization_signal
        shared_intelligence_signal = item.shared_intelligence_signal
        lines.extend(
            [
                f"模式 {index}：{item.title or '未命名模式'}",
                f"為何相似：{item.match_reason or '與目前案件主線相似。'}",
                *( [f"主要原因：{item.primary_reason_label}"] if item.primary_reason_label else [] ),
                *(
                    [f"最佳幫助：{'、'.join(optimization_signal.best_for_asset_labels[:2])}"]
                    if optimization_signal.best_for_asset_labels
                    else []
                ),
                *(
                    [f"參考強度：{'高' if optimization_signal.strength == 'high' else '中' if optimization_signal.strength == 'medium' else '低'}"]
                    if optimization_signal.strength
                    else []
                ),
                *(
                    [f"共享成熟度：{shared_intelligence_signal.maturity_label}"]
                    if shared_intelligence_signal.maturity_label
                    else []
                ),
                *(
                    [f"權重趨勢：{shared_intelligence_signal.weight_action_label}"]
                    if shared_intelligence_signal.weight_action_label
                    else []
                ),
                f"可參考：{item.safe_use_note or '只可拿來參考模式，不可直接複製舊案內容。'}",
                f"摘要：{item.summary or item.reusable_reason or '目前沒有額外摘要。'}",
            ]
        )
    if guidance.recommended_uses:
        lines.append(f"建議用法：{'；'.join(guidance.recommended_uses[:3])}")
    lines.append(f"整體邊界：{guidance.boundary_note}")
    return lines


def build_payload_organization_memory_context(payload: AgentInputPayload) -> list[str]:
    guidance = payload.organization_memory_guidance
    if guidance.status != "available":
        return []

    lines: list[str] = []
    if guidance.organization_label:
        lines.append(f"組織背景：{guidance.organization_label}")
    if guidance.source_lifecycle_summary:
        lines.append(f"來源狀態：{guidance.source_lifecycle_summary}")
    if guidance.freshness_summary:
        lines.append(f"背景新鮮度：{guidance.freshness_summary}")
    if guidance.reactivation_summary:
        lines.append(f"來源回前景：{guidance.reactivation_summary}")
    if guidance.stable_context_items:
        lines.append("穩定背景：" + "；".join(guidance.stable_context_items[:4]))
    if guidance.known_constraints:
        lines.append("已知限制：" + "；".join(guidance.known_constraints[:4]))
    if guidance.continuity_anchor:
        lines.append(f"延續主線：{guidance.continuity_anchor}")
    if guidance.cross_matter_summary:
        lines.append(f"跨案件背景：{guidance.cross_matter_summary}")
    for index, item in enumerate(guidance.cross_matter_items[:2], start=1):
        parts = [item.matter_title, item.summary]
        if item.relation_reason:
            parts.append(item.relation_reason)
        lines.append(f"跨案件參考 {index}：" + "｜".join(part for part in parts if part))
    lines.append(f"整體邊界：{guidance.boundary_note}")
    return lines


def build_payload_review_lens_context(payload: AgentInputPayload) -> list[str]:
    guidance = payload.review_lens_guidance
    if guidance.status == "none" or not guidance.lenses:
        return []

    lines: list[str] = []
    for index, item in enumerate(guidance.lenses[:4], start=1):
        lines.extend(
            [
                f"視角 {index}：{item.title}",
                f"為什麼現在先看：{item.why_now}",
                f"來源：{item.source_label or item.source_kind}",
            ]
        )
    lines.append(f"整體邊界：{guidance.boundary_note}")
    return lines


def build_payload_domain_playbook_context(payload: AgentInputPayload) -> list[str]:
    guidance = payload.domain_playbook_guidance
    if guidance.status == "none" or not guidance.stages:
        return []

    lines: list[str] = []
    if guidance.playbook_label:
        lines.append(f"工作主線：{guidance.playbook_label}")
    if guidance.current_stage_label:
        lines.append(f"目前這輪：{guidance.current_stage_label}")
    if guidance.next_stage_label:
        lines.append(f"下一步通常接：{guidance.next_stage_label}")
    if guidance.fit_summary:
        lines.append(
            guidance.fit_summary
            if guidance.fit_summary.startswith("這輪為何適用：")
            else f"這輪為何適用：{guidance.fit_summary}"
        )
    if guidance.source_mix_summary:
        lines.append(
            guidance.source_mix_summary
            if guidance.source_mix_summary.startswith("收斂依據：")
            else f"收斂依據：{guidance.source_mix_summary}"
        )
    if guidance.source_lifecycle_summary:
        lines.append(f"來源狀態：{guidance.source_lifecycle_summary}")
    if guidance.freshness_summary:
        lines.append(f"來源新鮮度：{guidance.freshness_summary}")
    if guidance.reactivation_summary:
        lines.append(f"來源回前景：{guidance.reactivation_summary}")
    for index, item in enumerate(guidance.stages[:4], start=1):
        lines.extend(
            [
                f"playbook {index}：{item.title}",
                f"為什麼現在重要：{item.why_now}",
                f"來源：{item.source_label or item.source_kind}",
            ]
        )
    lines.append(f"整體邊界：{guidance.boundary_note}")
    return lines


def build_payload_common_risk_context(payload: AgentInputPayload) -> list[str]:
    guidance = payload.common_risk_guidance
    if guidance.status == "none" or not guidance.risks:
        return []

    lines: list[str] = []
    for index, item in enumerate(guidance.risks[:4], start=1):
        lines.extend(
            [
                f"常漏風險 {index}：{item.title}",
                f"為什麼要先掃：{item.why_watch}",
                f"來源：{item.source_label or item.source_kind}",
            ]
        )
    lines.append(f"整體邊界：{guidance.boundary_note}")
    return lines


def build_payload_deliverable_shape_context(payload: AgentInputPayload) -> list[str]:
    guidance = payload.deliverable_shape_guidance
    if guidance.status == "none":
        return []

    lines: list[str] = []
    if guidance.primary_shape_label:
        lines.append(f"建議交付形態：{guidance.primary_shape_label}")
    if guidance.section_hints:
        lines.append("建議先用段落：" + "、".join(guidance.section_hints))
    for item in guidance.hints[:3]:
        lines.extend(
            [
                f"交付提示：{item.title}",
                f"為什麼這樣收：{item.why_fit}",
                f"來源：{item.source_label or item.source_kind}",
            ]
        )
    lines.append(f"整體邊界：{guidance.boundary_note}")
    return lines


def build_payload_deliverable_template_context(payload: AgentInputPayload) -> list[str]:
    guidance = payload.deliverable_template_guidance
    if guidance.status == "none":
        return []

    lines: list[str] = []
    if guidance.template_label:
        lines.append(f"模板主線：{guidance.template_label}")
    if guidance.template_fit_summary:
        lines.append(f"這輪適合：{guidance.template_fit_summary}")
    if guidance.fit_summary:
        lines.append(
            guidance.fit_summary
            if guidance.fit_summary.startswith("這輪為何適用：")
            else f"這輪為何適用：{guidance.fit_summary}"
        )
    if guidance.source_mix_summary:
        lines.append(
            guidance.source_mix_summary
            if guidance.source_mix_summary.startswith("收斂依據：")
            else f"收斂依據：{guidance.source_mix_summary}"
        )
    if guidance.source_lifecycle_summary:
        lines.append(f"來源狀態：{guidance.source_lifecycle_summary}")
    if guidance.freshness_summary:
        lines.append(f"來源新鮮度：{guidance.freshness_summary}")
    if guidance.reactivation_summary:
        lines.append(f"來源回前景：{guidance.reactivation_summary}")
    if guidance.core_sections:
        lines.append("核心區塊：" + "、".join(guidance.core_sections))
    if guidance.optional_sections:
        lines.append("可選區塊：" + "、".join(guidance.optional_sections))
    for item in guidance.blocks[:3]:
        lines.extend(
            [
                f"模板提示：{item.title}",
                f"為什麼適合：{item.why_fit}",
                f"來源：{item.source_label or item.source_kind}",
            ]
        )
    lines.append(f"整體邊界：{guidance.boundary_note}")
    return lines


class InsightDraft(BaseModel):
    summary: str
    evidence_refs: list[str] = Field(default_factory=list)
    confidence_level: str = "medium"


class RiskDraft(BaseModel):
    title: str
    description: str
    risk_type: str = "general"
    impact_level: str = "medium"
    likelihood_level: str = "medium"
    evidence_refs: list[str] = Field(default_factory=list)


class OptionDraft(BaseModel):
    title: str
    description: str
    pros: list[str] = Field(default_factory=list)
    cons: list[str] = Field(default_factory=list)
    related_risk_refs: list[str] = Field(default_factory=list)


class RecommendationDraft(BaseModel):
    summary: str
    rationale: str
    based_on_refs: list[str] = Field(default_factory=list)
    priority: str = "medium"
    owner_suggestion: str | None = None


class ActionItemDraft(BaseModel):
    description: str
    suggested_owner: str | None = None
    priority: str = "medium"
    due_hint: str | None = None
    dependency_refs: list[str] = Field(default_factory=list)
    status: str = "open"


class DeliverableDraft(BaseModel):
    deliverable_type: str
    title: str
    content_structure: dict[str, Any]


class AgentResult(BaseModel):
    insights: list[InsightDraft] = Field(default_factory=list)
    risks: list[RiskDraft] = Field(default_factory=list)
    options: list[OptionDraft] = Field(default_factory=list)
    recommendations: list[RecommendationDraft] = Field(default_factory=list)
    action_items: list[ActionItemDraft] = Field(default_factory=list)
    deliverable: DeliverableDraft


class CoreAgentResult(BaseModel):
    findings: list[str] = Field(default_factory=list)
    insights: list[InsightDraft] = Field(default_factory=list)
    risks: list[RiskDraft] = Field(default_factory=list)
    recommendations: list[RecommendationDraft] = Field(default_factory=list)
    action_items: list[ActionItemDraft] = Field(default_factory=list)
    missing_information: list[str] = Field(default_factory=list)
    research_sub_questions: list[str] = Field(default_factory=list)
    source_quality_notes: list[str] = Field(default_factory=list)
    contradiction_notes: list[str] = Field(default_factory=list)
    evidence_gap_notes: list[str] = Field(default_factory=list)
    citation_handoff: list[str] = Field(default_factory=list)


class SpecialistAgent(ABC):
    descriptor: AgentDescriptor

    @abstractmethod
    def run(self, payload: AgentInputPayload) -> AgentResult:
        raise NotImplementedError


class CoreAnalysisAgent(ABC):
    descriptor: AgentDescriptor

    @abstractmethod
    def run(self, payload: AgentInputPayload) -> CoreAgentResult:
        raise NotImplementedError
