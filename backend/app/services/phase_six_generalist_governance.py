from __future__ import annotations

from dataclasses import dataclass, field
from typing import Iterable

from app.services.feedback_optimization_intelligence import OPTIMIZATION_ASSET_LABELS
from app.workbench import schemas

REUSE_WEIGHTING_RANK = {
    "can_expand": 0,
    "keep_contextual": 1,
    "restrict_narrow_use": 2,
}
DEFAULT_DOMAIN_LENS = "綜合"
UNSPECIFIED_LABEL = "未指定"


@dataclass(frozen=True)
class PhaseSixCaseContext:
    client_stage: str | None = None
    client_type: str | None = None
    domain_lenses: list[str] = field(default_factory=list)
    evidence_count: int = 0
    unresolved_evidence_gap_count: int = 0
    selected_domain_pack_ids: list[str] = field(default_factory=list)
    selected_industry_pack_ids: list[str] = field(default_factory=list)


@dataclass(frozen=True)
class PhaseSixPhaseLevelAlignmentSnapshot:
    phase_level_boundary_note: str
    work_surface_landed_summary: str
    scoring_pending_summary: str


def _has_explicit_value(value: str | None) -> bool:
    normalized = (value or "").strip()
    return bool(normalized and normalized != UNSPECIFIED_LABEL)


def _normalized_domain_lenses(case_context: PhaseSixCaseContext | None) -> list[str]:
    if case_context is None:
        return []
    return [
        item.strip()
        for item in case_context.domain_lenses
        if item and item.strip() and item.strip() != DEFAULT_DOMAIN_LENS
    ]


def _has_pack_context(case_context: PhaseSixCaseContext | None) -> bool:
    if case_context is None:
        return False
    return bool(case_context.selected_domain_pack_ids or case_context.selected_industry_pack_ids)


def _is_evidence_ready(case_context: PhaseSixCaseContext | None) -> bool:
    if case_context is None:
        return False
    return case_context.evidence_count >= 2 and case_context.unresolved_evidence_gap_count <= 1


def _is_evidence_rich(case_context: PhaseSixCaseContext | None) -> bool:
    if case_context is None:
        return False
    return case_context.evidence_count >= 4 and case_context.unresolved_evidence_gap_count == 0


def _is_evidence_thin(case_context: PhaseSixCaseContext | None) -> bool:
    if case_context is None:
        return False
    return case_context.evidence_count == 0 or case_context.unresolved_evidence_gap_count >= 3


def _resolve_context_distance_status(
    *,
    asset_code: str,
    case_context: PhaseSixCaseContext,
) -> tuple[str, str, str, str]:
    has_stage = _has_explicit_value(case_context.client_stage)
    has_type = _has_explicit_value(case_context.client_type)
    has_domain_focus = bool(_normalized_domain_lenses(case_context))
    has_pack_context = _has_pack_context(case_context)
    evidence_ready = _is_evidence_ready(case_context)
    evidence_rich = _is_evidence_rich(case_context)
    evidence_thin = _is_evidence_thin(case_context)

    if asset_code == "precedent_general_pattern":
        if has_stage and has_type and evidence_ready:
            return (
                "close",
                "距離較近",
                "high_confidence",
                "高信心重用",
            )
        if evidence_thin and not (has_stage or has_type):
            return (
                "far",
                "距離偏遠",
                "low_confidence",
                "低信心重用",
            )
        return (
            "moderate",
            "仍有距離",
            "bounded_confidence",
            "有邊界重用",
        )

    if asset_code == "domain_playbook_contextual":
        if has_domain_focus and has_pack_context and evidence_ready:
            return (
                "close",
                "距離較近",
                "high_confidence",
                "高信心重用",
            )
        if evidence_thin or not has_domain_focus or not has_pack_context:
            return (
                "far",
                "距離偏遠",
                "low_confidence",
                "低信心重用",
            )
        return (
            "moderate",
            "仍有距離",
            "bounded_confidence",
            "有邊界重用",
        )

    if asset_code == "template_narrow_shape" and evidence_rich and has_pack_context:
        return (
            "moderate",
            "仍有距離",
            "bounded_confidence",
            "有邊界重用",
        )
    return (
        "far",
        "距離偏遠",
        "low_confidence",
        "低信心重用",
    )


def _resolve_calibration_status(
    *,
    axis_kind: str,
    case_context: PhaseSixCaseContext,
) -> tuple[str, str, str, str, str]:
    has_domain_focus = bool(_normalized_domain_lenses(case_context))
    has_pack_context = _has_pack_context(case_context)
    evidence_ready = _is_evidence_ready(case_context)
    evidence_thin = _is_evidence_thin(case_context)

    if axis_kind == "client_stage":
        explicit = _has_explicit_value(case_context.client_stage)
        if explicit and evidence_ready:
            return (
                "aligned",
                "目前對齊",
                "high_confidence",
                "高信心重用",
                "目前 client stage 已較明確，這條 reusable confidence 可更正式地吃進目前案件。",
            )
        if explicit or case_context.evidence_count > 0:
            return (
                "caution",
                "需要留意",
                "bounded_confidence",
                "有邊界重用",
                "client stage 雖已有部分脈絡，但 evidence thickness 還不夠厚，先保留邊界再重用。",
            )
        return (
            "mismatch",
            "仍有不對齊",
            "low_confidence",
            "低信心重用",
            "目前 client stage 仍未明確，先不要把這條 reusable confidence 放大。",
        )

    if axis_kind == "client_type":
        explicit = _has_explicit_value(case_context.client_type)
        if explicit and evidence_ready:
            return (
                "aligned",
                "目前對齊",
                "high_confidence",
                "高信心重用",
                "目前 client type 已較明確，這條 reusable confidence 可更正式地吃進目前案件。",
            )
        if explicit or case_context.evidence_count > 0:
            return (
                "caution",
                "需要留意",
                "bounded_confidence",
                "有邊界重用",
                "client type 雖已有部分脈絡，但 evidence thickness 還不夠厚，先保留邊界再重用。",
            )
        return (
            "mismatch",
            "仍有不對齊",
            "low_confidence",
            "低信心重用",
            "目前 client type 仍未明確，先不要把這條 reusable confidence 放大。",
        )

    if has_domain_focus and has_pack_context and evidence_ready:
        return (
            "aligned",
            "目前對齊",
            "high_confidence",
            "高信心重用",
            "目前 domain lens 與 pack context 都較明確，可讓 reusable guidance 更正式地吃進當前案件。",
        )
    if has_domain_focus or (has_pack_context and not evidence_thin):
        return (
            "caution",
            "需要留意",
            "bounded_confidence",
            "有邊界重用",
            "domain lens 雖已有部分脈絡，但 pack context 或 evidence thickness 還不夠厚，先保留邊界再重用。",
        )
    return (
        "mismatch",
        "仍有不對齊",
        "low_confidence",
        "低信心重用",
        "目前 domain lens 與 pack context 都偏薄，先把這條 reusable confidence 留在背景校正。",
    )


def build_phase_six_feedback_linked_scoring_snapshot(
    *,
    adopted_count: int,
    needs_revision_count: int,
    not_adopted_count: int,
    template_candidate_count: int,
    governed_candidate_count: int,
    promoted_candidate_count: int,
    dismissed_candidate_count: int,
    override_signal_count: int,
    top_asset_codes: list[str],
    deliverable_feedback_count: int = 0,
    deliverable_adopted_count: int = 0,
    published_deliverable_count: int = 0,
    published_adopted_count: int = 0,
    deliverable_candidate_count: int = 0,
    governed_deliverable_candidate_count: int = 0,
    outcome_record_count: int = 0,
    deliverable_outcome_record_count: int = 0,
    follow_up_outcome_count: int = 0,
    writeback_generated_event_count: int = 0,
    review_required_execution_count: int = 0,
    planned_execution_count: int = 0,
    writeback_expected_task_count: int = 0,
) -> schemas.PhaseSixFeedbackLinkedScoringSnapshotRead:
    normalized_top_asset_codes: list[str] = []
    for code in top_asset_codes:
        normalized = str(code).strip()
        if not normalized or normalized in normalized_top_asset_codes:
            continue
        normalized_top_asset_codes.append(normalized)

    top_asset_labels = [
        OPTIMIZATION_ASSET_LABELS[item]
        for item in normalized_top_asset_codes
        if item in OPTIMIZATION_ASSET_LABELS
    ]
    summary = (
        f"已採用 {adopted_count}｜需改寫 {needs_revision_count}｜不採用 {not_adopted_count}"
        f"｜主要影響 {'、'.join(top_asset_labels[:2]) or '既有 reusable assets'}。"
    )
    closeout_depth_summary = (
        f"交付回饋 {deliverable_feedback_count}｜已 publish {published_deliverable_count}"
        f"｜deliverable governed {governed_deliverable_candidate_count}"
    )
    positive_feedback_count = adopted_count + template_candidate_count + promoted_candidate_count
    has_strong_deliverable_closeout_depth = (
        deliverable_adopted_count > 0 and published_adopted_count > 0
    )
    has_deliverable_closeout_depth = (
        deliverable_feedback_count > 0 or governed_deliverable_candidate_count > 0
    )
    has_writeback_depth = (
        writeback_expected_task_count > 0
        and (
            outcome_record_count > 0
            or writeback_generated_event_count > 0
            or review_required_execution_count > 0
        )
    )
    if has_writeback_depth:
        effectiveness_posture = "writeback_supported"
        effectiveness_posture_label = "已到 writeback 支撐"
    elif has_strong_deliverable_closeout_depth or has_deliverable_closeout_depth:
        effectiveness_posture = "closeout_supported"
        effectiveness_posture_label = "已到 closeout 支撐"
    elif positive_feedback_count > 0 or governed_candidate_count > 0:
        effectiveness_posture = "adoption_supported"
        effectiveness_posture_label = "已有 adoption 支撐"
    else:
        effectiveness_posture = "evidence_thin"
        effectiveness_posture_label = "證據仍薄"
    effectiveness_posture_summary = (
        f"{effectiveness_posture_label}｜主要看 {'、'.join(top_asset_labels[:2]) or '既有 reusable assets'}。"
    )
    effectiveness_caveat_summary = (
        "目前多為 one-off / minimal 案件，沒有 writeback 不算負訊號。"
        if writeback_expected_task_count == 0
        else "已有 full writeback expectation，若後續沒有 outcome / writeback evidence，就不要過度解讀 effectiveness。"
    )
    writeback_depth_summary = (
        "目前多為 one-off / minimal 案件，沒有 writeback 不算負訊號。"
        if writeback_expected_task_count == 0
        else (
            f"outcome {outcome_record_count}｜writeback events {writeback_generated_event_count}"
            f"｜review-required executions {review_required_execution_count}"
        )
    )
    return schemas.PhaseSixFeedbackLinkedScoringSnapshotRead(
        adopted_count=adopted_count,
        needs_revision_count=needs_revision_count,
        not_adopted_count=not_adopted_count,
        template_candidate_count=template_candidate_count,
        governed_candidate_count=governed_candidate_count,
        promoted_candidate_count=promoted_candidate_count,
        dismissed_candidate_count=dismissed_candidate_count,
        override_signal_count=override_signal_count,
        top_asset_codes=normalized_top_asset_codes[:3],
        top_asset_labels=top_asset_labels[:3],
        deliverable_feedback_count=deliverable_feedback_count,
        deliverable_adopted_count=deliverable_adopted_count,
        published_deliverable_count=published_deliverable_count,
        published_adopted_count=published_adopted_count,
        deliverable_candidate_count=deliverable_candidate_count,
        governed_deliverable_candidate_count=governed_deliverable_candidate_count,
        closeout_depth_summary=closeout_depth_summary,
        outcome_record_count=outcome_record_count,
        deliverable_outcome_record_count=deliverable_outcome_record_count,
        follow_up_outcome_count=follow_up_outcome_count,
        writeback_generated_event_count=writeback_generated_event_count,
        review_required_execution_count=review_required_execution_count,
        planned_execution_count=planned_execution_count,
        writeback_expected_task_count=writeback_expected_task_count,
        writeback_depth_summary=writeback_depth_summary,
        effectiveness_posture=effectiveness_posture,
        effectiveness_posture_label=effectiveness_posture_label,
        effectiveness_posture_summary=effectiveness_posture_summary,
        effectiveness_caveat_summary=effectiveness_caveat_summary,
        summary=summary,
    )


def build_phase_six_closeout_review(
    *,
    completion_review: schemas.PhaseSixCompletionReviewResponse,
    alignment: PhaseSixPhaseLevelAlignmentSnapshot | None = None,
) -> schemas.PhaseSixCloseoutReviewResponse:
    source_alignment = alignment or build_phase_six_phase_level_alignment_snapshot(
        feedback_signal_count=0,
        governed_outcome_count=0,
    )
    signed_off = completion_review.sign_off_status == "signed_off"
    asset_audits = [
        schemas.PhaseSixAssetAuditItemResponse(
            asset_code="governance_runtime",
            asset_label="governance runtime",
            audit_status="audited",
            audit_status_label="已站穩",
            summary="coverage / boundary / weighting / calibration / guidance 已形成正式治理 runtime。",
            next_step="",
        ),
        schemas.PhaseSixAssetAuditItemResponse(
            asset_code="work_surface_propagation",
            asset_label="work-surface propagation",
            audit_status="audited",
            audit_status_label="已站穩",
            summary="task / matter / deliverable 已能低噪音回讀 phase-6 signals。",
            next_step="",
        ),
        schemas.PhaseSixAssetAuditItemResponse(
            asset_code="feedback_loop",
            asset_label="feedback loop",
            audit_status="audited" if completion_review.overall_score >= 75 else "needs_followup",
            audit_status_label="已站穩" if completion_review.overall_score >= 75 else "仍需補強",
            summary="runtime feedback loop 已開始形成，現在也已被納入 completion review / sign-off 基礎。",
            next_step="" if completion_review.overall_score >= 75 else "持續把 feedback-linked evidence 接回 persisted scoring。",
        ),
        schemas.PhaseSixAssetAuditItemResponse(
            asset_code="completion_review",
            asset_label="completion review foundation",
            audit_status="audited",
            audit_status_label="已站穩",
            summary="completion review、checkpoint 與 persisted score snapshot 已正式成立。",
            next_step="",
        ),
        schemas.PhaseSixAssetAuditItemResponse(
            asset_code="sign_off_handoff",
            asset_label="sign-off / handoff",
            audit_status="audited" if signed_off else "needs_followup",
            audit_status_label="已站穩" if signed_off else "仍待收口",
            summary="owner sign-off 與 next-phase handoff 已成立。" if signed_off else "目前只剩 explicit sign-off 與 signed-off handoff readout。",
            next_step="" if signed_off else "先完成 explicit sign-off，再正式回讀 handoff。",
        ),
    ]
    completed_items = [
        "generalist governance runtime 已成立",
        "work-surface propagation 已成立",
        "runtime feedback loop / closure criteria 已成立",
        "completion review foundation 已成立",
        "persisted scoring / sign-off foundation 已成立",
    ]
    remaining_items = [] if signed_off else ["phase 6 sign-off 與下一階段 handoff"]
    return schemas.PhaseSixCloseoutReviewResponse(
        phase_id="phase_6",
        phase_label="Generalist Consulting Intelligence Governance",
        closure_status="signed_off" if signed_off else "ready_to_close",
        closure_status_label="已正式收口" if signed_off else "可準備收口",
        summary=(
            f"{source_alignment.phase_level_boundary_note} phase 6 已正式收口，下一階段 handoff 已整理。"
            if signed_off
            else (
                f"{source_alignment.phase_level_boundary_note}"
                " phase 6 的 governance runtime、completion review foundation 與 sign-off foundation 已站穩；"
                f"{source_alignment.work_surface_landed_summary}"
            )
        ),
        foundation_snapshot=(
            "Generalist governance 主線已完成並正式收口。"
            if signed_off
            else "目前已補 5 項主要子線｜剩 1 項收尾項目。"
        ),
        completed_count=len(completed_items) + len(asset_audits),
        remaining_count=len(remaining_items),
        completed_items=completed_items,
        asset_audits=asset_audits,
        remaining_items=remaining_items,
        recommended_next_step=(
            "下一階段先做 consultant operating leverage framing。"
            if signed_off
            else "先完成 phase 6 sign-off，再把這些治理基礎轉成顧問工作面更直接感受到的 operating leverage。"
        ),
        signed_off_at=completion_review.signed_off_at,
        signed_off_by_label=completion_review.signed_off_by_label,
        next_phase_label=completion_review.next_phase_label,
        handoff_summary=completion_review.handoff_summary,
        handoff_items=completion_review.handoff_items,
    )


def build_phase_six_phase_level_alignment_snapshot(
    *,
    feedback_signal_count: int,
    governed_outcome_count: int,
    feedback_snapshot: schemas.PhaseSixFeedbackLinkedScoringSnapshotRead | None = None,
) -> PhaseSixPhaseLevelAlignmentSnapshot:
    source_snapshot = feedback_snapshot
    has_feedback_depth = (
        bool(source_snapshot)
        and (
            source_snapshot.adopted_count > 0
            or source_snapshot.needs_revision_count > 0
            or source_snapshot.governed_candidate_count > 0
        )
    ) or feedback_signal_count > 0 or governed_outcome_count > 0
    has_deliverable_closeout_depth = bool(source_snapshot) and (
        source_snapshot.deliverable_feedback_count > 0
        or source_snapshot.deliverable_candidate_count > 0
    )
    has_strong_deliverable_closeout_depth = bool(source_snapshot) and (
        source_snapshot.published_adopted_count > 0
        or source_snapshot.governed_deliverable_candidate_count > 0
    )
    return PhaseSixPhaseLevelAlignmentSnapshot(
        phase_level_boundary_note="這裡是 Phase 6 的階段層 review，不是案件計分引擎。",
        work_surface_landed_summary="三個正式工作面已正式落地。",
        scoring_pending_summary=(
            "下一刀應把 feedback foundation 正式接到交付收尾深度。"
            if not has_feedback_depth
            else "下一刀應把交付收尾證據再往 outcome / writeback evidence 推進。"
            if has_strong_deliverable_closeout_depth
            else "下一刀應把已形成的交付收尾證據更正式接回治理評分。"
            if has_deliverable_closeout_depth
            else "下一刀應把已形成的採用回饋證據更正式接回治理評分。"
        ),
    )


def build_phase_six_maturity_review(
    *,
    alignment: PhaseSixPhaseLevelAlignmentSnapshot | None = None,
) -> schemas.PhaseSixMaturityReviewResponse:
    source_alignment = alignment or build_phase_six_phase_level_alignment_snapshot(
        feedback_signal_count=0,
        governed_outcome_count=0,
    )
    milestone_audits = [
        schemas.PhaseSixMaturityMilestoneRead(
            milestone_code="coverage_boundary",
            milestone_label="coverage / anti-drift",
            milestone_status="landed",
            milestone_status_label="已站穩",
            summary="coverage audit 與 reuse-boundary governance 已正式成立，現在已能回讀偏科風險與泛化邊界。",
        ),
        schemas.PhaseSixMaturityMilestoneRead(
            milestone_code="host_weighting_calibration",
            milestone_label="Host weighting / calibration",
            milestone_status="landed",
            milestone_status_label="已站穩",
            summary="context distance、confidence calibration 與 calibration-aware Host weighting 已成立。",
        ),
        schemas.PhaseSixMaturityMilestoneRead(
            milestone_code="guidance_propagation",
            milestone_label="guidance propagation",
            milestone_status="landed",
            milestone_status_label="已站穩",
            summary="generalist guidance posture 已 propagation 到 task / matter / deliverable 的既有 contract。",
        ),
        schemas.PhaseSixMaturityMilestoneRead(
            milestone_code="signal_condensation",
            milestone_label="second-layer condensation",
            milestone_status="landed",
            milestone_status_label="已站穩",
            summary="multiple phase-6 signals 已被收斂成單條 low-noise second-layer note，而不是持續往卡片下堆疊。",
        ),
        schemas.PhaseSixMaturityMilestoneRead(
            milestone_code="surface_guardrails",
            milestone_label="surface guardrails",
            milestone_status="landed",
            milestone_status_label="已站穩",
            summary="freshness prioritization、cross-surface consistency、brevity guardrails 與 fallback consistency 已成立。",
        ),
    ]
    remaining_focus_items = [
        "把 Phase 6 的治理判斷再更正式接進 persisted asset scoring，而不是只停在 read model 與 note surface。",
        "定義明確的 phase-6 completion / closure criteria，避免 refinement lane 無限延長。",
        "把 generalist governance 與真實採用回饋閉環再接得更緊，讓 Host / continuity writeback 能回證哪些治理真的有效。",
    ]
    return schemas.PhaseSixMaturityReviewResponse(
        phase_id="phase_6",
        phase_label="Generalist Consulting Intelligence Governance",
        maturity_stage="refinement_lane",
        maturity_stage_label="已進入收斂深化",
        summary=(
            "Phase 6 已不再只是 foundation 起步，而是進入 generalist governance 的收斂深化期："
            "coverage、boundary、weighting、propagation 與 second-layer guardrails 都已站穩；"
            f"{source_alignment.work_surface_landed_summary}"
        ),
        maturity_snapshot="已完成 17 個 slice｜目前屬於 refinement lane，不是新的基礎施工期。",
        completed_count=17,
        remaining_count=len(remaining_focus_items),
        milestone_audits=milestone_audits,
        remaining_focus_items=remaining_focus_items,
        recommended_next_step=source_alignment.scoring_pending_summary,
    )


def build_phase_six_closure_criteria_review(
    *,
    feedback_signal_count: int,
    governed_outcome_count: int,
    alignment: PhaseSixPhaseLevelAlignmentSnapshot | None = None,
) -> schemas.PhaseSixClosureCriteriaReviewResponse:
    source_alignment = alignment or build_phase_six_phase_level_alignment_snapshot(
        feedback_signal_count=feedback_signal_count,
        governed_outcome_count=governed_outcome_count,
    )
    runtime_feedback_status = (
        "landed"
        if feedback_signal_count >= 3 and governed_outcome_count >= 2
        else "watching"
        if feedback_signal_count > 0 or governed_outcome_count > 0
        else "needs_followup"
    )
    runtime_feedback_status_label = (
        "已開始形成"
        if runtime_feedback_status == "landed"
        else "正在觀察"
        if runtime_feedback_status == "watching"
        else "仍待補強"
    )
    if runtime_feedback_status == "landed":
        feedback_loop_summary = (
            f"目前已看到 {feedback_signal_count} 筆 feedback signals 與 {governed_outcome_count} 筆 governed outcomes，"
            "Phase 6 已不再只是 read-model governance。"
        )
    elif runtime_feedback_status == "watching":
        feedback_loop_summary = (
            f"目前已看到 {feedback_signal_count} 筆 feedback signals 與 {governed_outcome_count} 筆 governed outcomes，"
            "但還不足以把 Phase 6 視為接近可收口。"
        )
    else:
        feedback_loop_summary = (
            "目前 Phase 6 仍偏向 read-model governance，runtime feedback loop evidence 還薄。"
        )

    criteria_items = [
        schemas.PhaseSixClosureCriterionRead(
            criterion_code="generalist_governance_runtime",
            criterion_label="generalist governance runtime",
            criterion_status="landed",
            criterion_status_label="已站穩",
            summary="coverage、boundary、weighting、guidance、calibration 與 maturity review 已形成正式 runtime read layer。",
            next_step="",
        ),
        schemas.PhaseSixClosureCriterionRead(
            criterion_code="work_surface_propagation",
            criterion_label="work-surface propagation",
            criterion_status="landed",
            criterion_status_label="已站穩",
            summary="task / matter / deliverable 已能回讀 phase-6 guidance、confidence、weighting 與 condensed note。",
            next_step="",
        ),
        schemas.PhaseSixClosureCriterionRead(
            criterion_code="runtime_feedback_loop",
            criterion_label="runtime feedback loop",
            criterion_status=runtime_feedback_status,  # type: ignore[arg-type]
            criterion_status_label=runtime_feedback_status_label,
            summary=feedback_loop_summary,
            next_step=(
                ""
                if runtime_feedback_status == "landed"
                else "應把 feedback-linked evidence 更正式接回 persisted governance scoring 與 completion review。"
            ),
        ),
        schemas.PhaseSixClosureCriterionRead(
            criterion_code="completion_review_contract",
            criterion_label="completion review contract",
            criterion_status="landed",
            criterion_status_label="已站穩",
            summary="system 現在已能正式回答距離 phase-6 completion review 還差哪些真正 blocker。",
            next_step="",
        ),
    ]

    remaining_blockers = [
        "runtime feedback loop 雖已開始形成，但仍需更正式接回 persisted governance scoring。",
        "phase-6 completion review / sign-off flow 尚未正式 shipped。",
    ]
    closure_posture = (
        "ready_for_completion_review"
        if runtime_feedback_status == "landed" and governed_outcome_count >= 4
        else "building_closure_basis"
        if runtime_feedback_status in {"landed", "watching"}
        else "not_ready"
    )
    closure_posture_label = (
        "可準備 completion review"
        if closure_posture == "ready_for_completion_review"
        else "正在建立收口基礎"
        if closure_posture == "building_closure_basis"
        else "尚未接近收口"
    )

    return schemas.PhaseSixClosureCriteriaReviewResponse(
        phase_id="phase_6",
        phase_label="Generalist Consulting Intelligence Governance",
        closure_posture=closure_posture,  # type: ignore[arg-type]
        closure_posture_label=closure_posture_label,
        summary=(
            "Phase 6 現在已能正式回答 closure criteria：目前已站穩的不是 note 文案，而是 runtime governance layer；"
            f"{source_alignment.work_surface_landed_summary}"
        ),
        closure_snapshot=(
            f"feedback signals {feedback_signal_count}｜governed outcomes {governed_outcome_count}｜"
            f"目前屬於 {closure_posture_label}"
        ),
        feedback_loop_summary=feedback_loop_summary,
        feedback_signal_count=feedback_signal_count,
        governed_outcome_count=governed_outcome_count,
        criteria_items=criteria_items,
        remaining_blockers=remaining_blockers,
        recommended_next_step=source_alignment.scoring_pending_summary,
    )


def build_phase_six_completion_review(
    *,
    closure_review: schemas.PhaseSixClosureCriteriaReviewResponse,
    feedback_snapshot: schemas.PhaseSixFeedbackLinkedScoringSnapshotRead | None = None,
    checkpoint_state: dict | None = None,
    alignment: PhaseSixPhaseLevelAlignmentSnapshot | None = None,
) -> schemas.PhaseSixCompletionReviewResponse:
    source_alignment = alignment or build_phase_six_phase_level_alignment_snapshot(
        feedback_signal_count=0,
        governed_outcome_count=0,
        feedback_snapshot=feedback_snapshot,
    )
    runtime_score = 84
    propagation_score = 86
    computed_feedback_snapshot = feedback_snapshot or build_phase_six_feedback_linked_scoring_snapshot(
        adopted_count=0,
        needs_revision_count=0,
        not_adopted_count=0,
        template_candidate_count=0,
        governed_candidate_count=0,
        promoted_candidate_count=0,
        dismissed_candidate_count=0,
        override_signal_count=0,
        top_asset_codes=[],
    )
    positive_feedback_count = (
        computed_feedback_snapshot.adopted_count
        + computed_feedback_snapshot.template_candidate_count
        + computed_feedback_snapshot.promoted_candidate_count
    )
    has_strong_deliverable_closeout_depth = (
        computed_feedback_snapshot.deliverable_adopted_count > 0
        and computed_feedback_snapshot.published_adopted_count > 0
    )
    has_deliverable_closeout_depth = (
        computed_feedback_snapshot.deliverable_feedback_count > 0
        or computed_feedback_snapshot.deliverable_candidate_count > 0
    )
    base_feedback_loop_score = (
        84
        if has_strong_deliverable_closeout_depth
        or computed_feedback_snapshot.governed_deliverable_candidate_count > 0
        else 68
        if has_deliverable_closeout_depth
        or positive_feedback_count > 0
        or computed_feedback_snapshot.needs_revision_count > 0
        or computed_feedback_snapshot.governed_candidate_count > 0
        else 42
    )
    has_writeback_depth = (
        computed_feedback_snapshot.writeback_expected_task_count > 0
        and (
            computed_feedback_snapshot.outcome_record_count > 0
            or computed_feedback_snapshot.writeback_generated_event_count > 0
            or computed_feedback_snapshot.review_required_execution_count > 0
        )
    )
    feedback_loop_score = (
        min(94, base_feedback_loop_score + 6) if has_writeback_depth else base_feedback_loop_score
    )
    completion_foundation_score = (
        88 if closure_review.closure_posture == "ready_for_completion_review" else 72
    )
    computed_scorecard_items = [
        schemas.PhaseSixCompletionScorecardItemRead(
            dimension_code="governance_runtime",
            dimension_label="governance runtime",
            score=runtime_score,
            status_label="已站穩",
            summary="coverage、boundary、weighting、guidance、closure criteria 已形成 phase-level runtime layer。",
        ),
        schemas.PhaseSixCompletionScorecardItemRead(
            dimension_code="work_surface_propagation",
            dimension_label="work-surface propagation",
            score=propagation_score,
            status_label="已站穩",
            summary="task / matter / deliverable 已能回讀 phase-6 guidance、confidence、weighting 與 condensed notes。",
        ),
        schemas.PhaseSixCompletionScorecardItemRead(
            dimension_code="feedback_loop",
            dimension_label="feedback loop",
            score=feedback_loop_score,
            status_label="已開始形成" if feedback_loop_score >= 60 else "仍需加深",
            summary=(
                f"{computed_feedback_snapshot.summary}"
                f"｜{computed_feedback_snapshot.closeout_depth_summary}"
                f"｜{computed_feedback_snapshot.writeback_depth_summary}"
                f"｜governed candidates {computed_feedback_snapshot.governed_candidate_count}。"
            ),
        ),
        schemas.PhaseSixCompletionScorecardItemRead(
            dimension_code="completion_foundation",
            dimension_label="completion foundation",
            score=completion_foundation_score,
            status_label="可準備 review" if completion_foundation_score >= 80 else "仍在打底",
            summary="system 已能正式回讀 closure posture、remaining blockers，以及下一條 completion review foundation。",
        ),
    ]
    computed_overall_score = round(
        sum(item.score for item in computed_scorecard_items) / len(computed_scorecard_items)
    )

    persisted_scorecard_items: list[schemas.PhaseSixCompletionScorecardItemRead] = []
    for item in checkpoint_state.get("scorecard_items", []) if checkpoint_state else []:
        if not isinstance(item, dict):
            continue
        persisted_scorecard_items.append(
            schemas.PhaseSixCompletionScorecardItemRead(
                dimension_code=str(item.get("dimension_code", "")),
                dimension_label=str(item.get("dimension_label", "")),
                score=int(item.get("score", 0)),
                status_label=str(item.get("status_label", "")),
                summary=str(item.get("summary", "")),
            )
        )
    scorecard_items = persisted_scorecard_items or computed_scorecard_items
    persisted_feedback_snapshot = (
        schemas.PhaseSixFeedbackLinkedScoringSnapshotRead.model_validate(
            checkpoint_state.get("feedback_linked_scoring_snapshot", {})
        )
        if checkpoint_state and checkpoint_state.get("feedback_linked_scoring_snapshot")
        else None
    )
    effective_feedback_snapshot = persisted_feedback_snapshot or computed_feedback_snapshot
    feedback_linked_summary = (
        str(checkpoint_state.get("feedback_linked_summary", "")).strip()
        if checkpoint_state and checkpoint_state.get("feedback_linked_summary")
        else (
            f"{effective_feedback_snapshot.summary}"
            f"｜{effective_feedback_snapshot.closeout_depth_summary}"
            f"｜{effective_feedback_snapshot.writeback_depth_summary}"
        )
    )
    overall_score = (
        int(checkpoint_state.get("overall_score"))
        if checkpoint_state and checkpoint_state.get("overall_score") is not None
        else computed_overall_score
    )

    checkpointed = bool(checkpoint_state and checkpoint_state.get("checkpointed"))
    review_posture = (
        "review_ready"
        if checkpointed and overall_score >= 75
        else "checkpoint_recorded"
        if checkpointed
        else "baseline_only"
    )
    review_posture_label = (
        "可準備 completion review"
        if review_posture == "review_ready"
        else "已有 review checkpoint"
        if review_posture == "checkpoint_recorded"
        else "先看基礎是否齊"
    )
    checkpoint_summary = (
        (
            f"最近一次 checkpoint 由 {checkpoint_state.get('checkpointed_by_label') or 'owner'} 記錄，"
            f"當時總分 {overall_score}，{effective_feedback_snapshot.closeout_depth_summary}｜"
            f"{effective_feedback_snapshot.writeback_depth_summary}。"
        )
        if checkpointed
        else "目前還沒有 recorded checkpoint，可先用這次 scorecard 做第一筆 completion review snapshot。"
    )
    signed_off = bool(checkpoint_state and checkpoint_state.get("signed_off"))
    can_sign_off = checkpointed and review_posture == "review_ready" and not signed_off
    sign_off_status = "signed_off" if signed_off else "open"
    sign_off_status_label = "已正式收口" if signed_off else "尚未正式收口"
    next_phase_label = (
        "下一階段：consultant operating leverage framing" if signed_off else ""
    )
    handoff_summary = (
        "下一階段應把已完成的 governance foundation 轉成顧問更直接感受到的 operating leverage，"
        "而不是再往 admin shell 或治理頁面擴張。"
        if signed_off
        else ""
    )
    handoff_items = (
        [
            "先把 governance / weighting / closure criteria 接成顧問工作面更直接感受到的 operating leverage。",
            "不要把下一階段拉成 admin shell、enterprise governance console 或純 score dashboard。",
        ]
        if signed_off
        else []
    )

    return schemas.PhaseSixCompletionReviewResponse(
        phase_id="phase_6",
        phase_label="Generalist Consulting Intelligence Governance",
        review_posture=review_posture,  # type: ignore[arg-type]
        review_posture_label=review_posture_label,
        summary=(
            "Phase 6 completion review foundation 現在已形成：system 不只知道還差什麼，也能把 readiness 收成低噪音 scorecard。"
        ),
        overall_score=overall_score,
        scorecard_items=scorecard_items,
        feedback_linked_summary=feedback_linked_summary,
        feedback_linked_scoring_snapshot=effective_feedback_snapshot,
        closure_posture=closure_review.closure_posture,
        closure_posture_label=closure_review.closure_posture_label,
        checkpoint_summary=checkpoint_summary,
        last_checkpoint_at=checkpoint_state.get("checkpointed_at") if checkpoint_state else None,
        last_checkpoint_by_label=checkpoint_state.get("checkpointed_by_label", "") if checkpoint_state else "",
        can_sign_off=can_sign_off,
        sign_off_status=sign_off_status,  # type: ignore[arg-type]
        sign_off_status_label=sign_off_status_label,
        signed_off_at=checkpoint_state.get("signed_off_at") if checkpoint_state else None,
        signed_off_by_label=checkpoint_state.get("signed_off_by_label", "") if checkpoint_state else "",
        next_phase_label=next_phase_label,
        handoff_summary=handoff_summary,
        handoff_items=handoff_items,
        recommended_next_step=(
            f"{source_alignment.scoring_pending_summary} 之後再把這份 checkpoint 接回 next-phase handoff。"
            if signed_off
            else f"{source_alignment.scoring_pending_summary} 不要直接跳 sign-off。"
        ),
    )


def build_phase_six_capability_coverage_audit() -> schemas.PhaseSixCapabilityCoverageAuditResponse:
    return schemas.PhaseSixCapabilityCoverageAuditResponse(
        phase_id="phase_6",
        phase_label="Generalist Consulting Intelligence Governance",
        audit_status="watch_drift",
        audit_status_label="需持續防偏科",
        coverage_summary=(
            "shared intelligence 已有廣泛基礎，但仍需持續觀測哪些能力區塊過重、"
            "哪些區塊偏薄。"
        ),
        generalist_posture="watching_bias",
        generalist_posture_label="目前維持全面型姿態，但需持續看偏移。",
        priority_note=(
            "先看 reusable intelligence 是否開始過度偏向高頻案型，"
            "再決定是否需要更嚴格的 reuse boundary。"
        ),
        coverage_areas=[
            schemas.PhaseSixCoverageAreaRead(
                area_id="research_review",
                area_label="研究 / 審閱",
                coverage_status="steady",
                coverage_status_label="目前較穩",
                summary="research / review 相關 shared intelligence 已有較穩基礎。",
            ),
            schemas.PhaseSixCoverageAreaRead(
                area_id="continuous_advisory",
                area_label="持續深化案件",
                coverage_status="steady",
                coverage_status_label="目前較穩",
                summary="continuity / retained advisory 的 reusable reading 已開始站穩。",
            ),
            schemas.PhaseSixCoverageAreaRead(
                area_id="cross_domain_generalization",
                area_label="跨面向泛化",
                coverage_status="thin",
                coverage_status_label="目前偏薄",
                summary="跨 client stage / domain lens 的泛化規則仍偏薄，需持續補強。",
            ),
            schemas.PhaseSixCoverageAreaRead(
                area_id="high_frequency_patterns",
                area_label="高頻樣本集中",
                coverage_status="overweighted",
                coverage_status_label="需要留意",
                summary="近期高頻樣本較容易影響 reusable asset ordering，需持續防止過度代表。",
            ),
        ],
        reuse_boundary_items=[
            schemas.PhaseSixReuseBoundaryItemRead(
                asset_code="precedent_general_pattern",
                asset_label="precedent general pattern",
                boundary_status="generalizable",
                boundary_status_label="可跨情境泛化",
                summary="少量 precedent 已可作為較廣泛的 decision-shaping 參考。",
            ),
            schemas.PhaseSixReuseBoundaryItemRead(
                asset_code="domain_playbook_contextual",
                asset_label="domain playbook contextual guidance",
                boundary_status="contextual",
                boundary_status_label="局部可參考",
                summary="playbook 可作為主線提示，但仍需搭配當前 client stage / domain lens。",
            ),
            schemas.PhaseSixReuseBoundaryItemRead(
                asset_code="template_narrow_shape",
                asset_label="template narrow shape",
                boundary_status="narrow_use",
                boundary_status_label="只適用特定脈絡",
                summary="某些模板骨架只適合局部情境，不應被直接擴張成全域 best practice。",
            ),
        ],
        recommended_next_step="若 phase 6 要繼續往下走，下一刀應先把 reusable intelligence 的 reuse boundary 做得更正式。",
    )


def build_phase_six_reuse_boundary_governance(
    *,
    audit: schemas.PhaseSixCapabilityCoverageAuditResponse | None = None,
) -> schemas.PhaseSixReuseBoundaryGovernanceResponse:
    source_audit = audit or build_phase_six_capability_coverage_audit()
    governance_items: list[schemas.PhaseSixReuseBoundaryGovernanceItemRead] = []

    for item in source_audit.reuse_boundary_items:
        if item.boundary_status == "generalizable":
            recommendation = "can_expand"
            recommendation_label = "可擴大重用"
            guardrail_note = "仍需由 Host 依當前案件脈絡做最後收斂，不可直接視為全域定論。"
        elif item.boundary_status == "narrow_use":
            recommendation = "restrict_narrow_use"
            recommendation_label = "不要擴大套用"
            guardrail_note = "這類資產只適合窄情境，應避免被直接擴張成全域 best practice。"
        else:
            recommendation = "keep_contextual"
            recommendation_label = "維持局部參考"
            guardrail_note = "這類資產可作為局部提示，但仍需搭配 client stage / domain lens 使用。"

        governance_items.append(
            schemas.PhaseSixReuseBoundaryGovernanceItemRead(
                asset_code=item.asset_code,
                asset_label=item.asset_label,
                boundary_status=item.boundary_status,
                boundary_status_label=item.boundary_status_label,
                reuse_recommendation=recommendation,
                reuse_recommendation_label=recommendation_label,
                summary=item.summary,
                guardrail_note=guardrail_note,
            )
        )

    generalizable_count = sum(1 for item in governance_items if item.boundary_status == "generalizable")
    contextual_count = sum(1 for item in governance_items if item.boundary_status == "contextual")
    narrow_use_count = sum(1 for item in governance_items if item.boundary_status == "narrow_use")
    if generalizable_count > 0 and narrow_use_count > 0:
        host_weighting_summary = (
            "Host 現在會先讓較可擴大重用的來源站前面，窄情境模板 / 骨架則先留背景校正。"
        )
    elif generalizable_count > 0:
        host_weighting_summary = "Host 現在會先讓較可擴大重用的來源站前面。"
    elif narrow_use_count > 0:
        host_weighting_summary = "Host 現在會先讓窄情境來源留在背景校正，不讓它單獨帶主線。"
    else:
        host_weighting_summary = "Host 現在仍以局部參考排序為主，避免把來源過度放大。"

    return schemas.PhaseSixReuseBoundaryGovernanceResponse(
        phase_id="phase_6",
        phase_label="Generalist Consulting Intelligence Governance",
        governance_posture="guardrails_needed" if narrow_use_count > 0 else "stable",
        governance_posture_label="仍需治理邊界" if narrow_use_count > 0 else "目前治理較穩",
        summary=(
            "phase 6 現在已能更正式回答哪些 reusable assets 可擴大重用、"
            "哪些應維持局部參考、哪些不應被擴大套用。"
        ),
        host_weighting_summary=host_weighting_summary,
        host_weighting_guardrail_note=(
            "這一刀只影響 reusable asset ordering，不是硬性封鎖；最終仍由 Host 依當前案件脈絡收斂。"
        ),
        generalizable_count=generalizable_count,
        contextual_count=contextual_count,
        narrow_use_count=narrow_use_count,
        governance_items=governance_items,
        recommended_next_step="若要繼續往下走，下一刀應把 reusable-intelligence guardrail 再往更正式的 Host weighting 規則推進。",
    )


def build_phase_six_generalist_guidance_posture(
    *,
    audit: schemas.PhaseSixCapabilityCoverageAuditResponse | None = None,
    governance: schemas.PhaseSixReuseBoundaryGovernanceResponse | None = None,
    case_context: PhaseSixCaseContext | None = None,
) -> schemas.PhaseSixGeneralistGuidancePostureResponse:
    if case_context is not None:
        has_domain_focus = bool(_normalized_domain_lenses(case_context))
        has_pack_context = _has_pack_context(case_context)
        has_client_context = _has_explicit_value(case_context.client_stage) and _has_explicit_value(
            case_context.client_type
        )
        evidence_rich = _is_evidence_rich(case_context)
        evidence_thin = _is_evidence_thin(case_context)

        if evidence_thin or not has_domain_focus:
            guidance_posture = "guarded_guidance"
            guidance_posture_label = "先保守引導"
            summary = (
                "目前案件的 evidence thickness 與 domain / pack context 仍偏薄，"
                "Phase 6 應先保守地把 shared intelligence 當成校正主線。"
            )
            work_guidance_summary = (
                "目前先保守引導：讓 shared intelligence 幫你校正方向，但不要直接把它讀成當前案件的定論。"
            )
            boundary_emphasis = "先把 evidence gaps 與 pack context 補清楚，再決定哪些 reusable assets 能站到前面。"
            guidance_items = [
                "目前 evidence thickness 仍薄，shared intelligence 先做背景校正。",
                "domain lens 或 pack context 還沒站穩時，不要讓 reusable guidance 直接帶主線。",
                "若關鍵 client stage / client type 還未明確，先保留 boundary note。",
            ]
        elif evidence_rich and has_pack_context and has_client_context:
            guidance_posture = "light_guidance"
            guidance_posture_label = "維持低噪音"
            summary = (
                "目前案件的 client stage / client type / domain lens、evidence thickness 與 pack context 都較明確，"
                "shared intelligence 可維持 low-noise second-layer 提示。"
            )
            work_guidance_summary = "目前工作 guidance 可維持低噪音，只在需要時補 reusable boundary。"
            boundary_emphasis = "這輪 reusable guidance 可站前面，但仍保留簡短 guardrail。"
            guidance_items = [
                "目前案件上下文已較完整，讓 reusable guidance 低噪音地站前面即可。",
                "只在真的碰到窄情境來源時，再補一條短 boundary note。",
            ]
        else:
            guidance_posture = "balanced_guidance"
            guidance_posture_label = "適度明示"
            summary = (
                "目前案件已有基本 client / domain 脈絡，但 evidence thickness 或 pack context 還沒有厚到可完全低噪音，"
                "Phase 6 應維持適度明示。"
            )
            work_guidance_summary = "目前工作 guidance 應維持低噪音，但要適度把 reusable boundary 與 evidence thickness 說清楚。"
            boundary_emphasis = "可重用來源可站前面，但 evidence / pack context 還不夠厚的地方要保留提醒。"
            guidance_items = [
                "讓較穩的 reusable guidance 先帶主線，但保留 evidence thickness 提醒。",
                "當 domain lens 與 pack context 還未完全站穩時，補一條簡短 boundary note。",
            ]

        return schemas.PhaseSixGeneralistGuidancePostureResponse(
            phase_id="phase_6",
            phase_label="Generalist Consulting Intelligence Governance",
            guidance_posture=guidance_posture,
            guidance_posture_label=guidance_posture_label,
            summary=summary,
            work_guidance_summary=work_guidance_summary,
            boundary_emphasis=boundary_emphasis,
            guidance_items=guidance_items,
            recommended_next_step=(
                "下一刀應把這條 case-aware guidance posture 再更正式地延伸到 deliverable-side reading，"
                "而不是回頭做新的 note wording micro-slice。"
            ),
        )

    source_audit = audit or build_phase_six_capability_coverage_audit()
    source_governance = governance or build_phase_six_reuse_boundary_governance(
        audit=source_audit,
    )

    if (
        source_audit.audit_status == "watch_drift"
        and source_governance.governance_posture == "guardrails_needed"
    ):
        guidance_posture = "guarded_guidance"
        guidance_posture_label = "先保守引導"
        summary = "目前 shared intelligence 已能提供方向，但仍需先保守地把它當成工作校正主線。"
        work_guidance_summary = (
            "目前工作 guidance 應先保守引導：讓較可擴大重用的來源帶路，但不要把 shared intelligence 讀成近乎定論。"
        )
        boundary_emphasis = "窄情境模板 / 骨架與局部模式仍應明示邊界，必要時先留背景校正。"
        guidance_items = [
            "先把 shared intelligence 當校正主線，不要直接當成定論。",
            "窄情境來源若有其他較穩替代，先留背景校正。",
            "若當前案件證據仍薄，仍以 pack / shape / heuristic 先站主線。",
        ]
    elif (
        source_audit.generalist_posture == "broad"
        and source_governance.governance_posture == "stable"
    ):
        guidance_posture = "light_guidance"
        guidance_posture_label = "維持低噪音"
        summary = "目前 shared intelligence 較穩，工作 guidance 可維持低噪音 second-layer 提示。"
        work_guidance_summary = "目前工作 guidance 可維持低噪音，只在需要時補 reusable boundary。"
        boundary_emphasis = "仍保留 boundary note，但不需要在每輪都強烈前置。"
        guidance_items = [
            "優先保持 consultant-first 的低噪音讀法。",
            "只有在 reusable boundary 真的影響判斷時，才補明示 guardrail。",
        ]
    else:
        guidance_posture = "balanced_guidance"
        guidance_posture_label = "適度明示"
        summary = "目前 shared intelligence 已可提供穩定方向，但仍需適度明示哪些來源只屬局部參考。"
        work_guidance_summary = "目前工作 guidance 應維持低噪音，但要適度把 reusable boundary 說清楚。"
        boundary_emphasis = "可重用來源可站前面，但局部情境的限制仍要被看見。"
        guidance_items = [
            "讓較穩的 reusable intelligence 先帶工作主線。",
            "遇到局部模式時，補一條簡短 boundary note 即可。",
        ]

    return schemas.PhaseSixGeneralistGuidancePostureResponse(
        phase_id="phase_6",
        phase_label="Generalist Consulting Intelligence Governance",
        guidance_posture=guidance_posture,
        guidance_posture_label=guidance_posture_label,
        summary=summary,
        work_guidance_summary=work_guidance_summary,
        boundary_emphasis=boundary_emphasis,
        guidance_items=guidance_items,
        recommended_next_step=(
            "若要繼續往下走，下一刀應把這條 guidance posture 再更正式地回寫到 task / matter / deliverable 的 second-layer guidance。"
        ),
    )


def build_phase_six_context_distance_audit(
    *,
    audit: schemas.PhaseSixCapabilityCoverageAuditResponse | None = None,
    governance: schemas.PhaseSixReuseBoundaryGovernanceResponse | None = None,
    case_context: PhaseSixCaseContext | None = None,
) -> schemas.PhaseSixContextDistanceAuditResponse:
    source_audit = audit or build_phase_six_capability_coverage_audit()
    source_governance = governance or build_phase_six_reuse_boundary_governance(
        audit=source_audit,
    )

    distance_items: list[schemas.PhaseSixContextDistanceItemRead] = []
    for item in source_governance.governance_items:
        if case_context is not None:
            (
                context_distance,
                context_distance_label,
                reuse_confidence,
                reuse_confidence_label,
            ) = _resolve_context_distance_status(
                asset_code=item.asset_code,
                case_context=case_context,
            )
            if context_distance == "close":
                summary = (
                    f"{item.asset_label} 與目前案件脈絡較接近，"
                    "可作為較高信心的重用來源。"
                )
                guardrail_note = "仍需由 Host 做最後 contextual 收斂，不可直接視為全域定論。"
            elif context_distance == "far":
                summary = (
                    f"{item.asset_label} 與目前案件的 domain / evidence / pack context 距離偏遠，"
                    "較適合留在背景校正。"
                )
                guardrail_note = "先留背景校正，避免直接擴張成目前案件的主要依據。"
            else:
                summary = (
                    f"{item.asset_label} 可提供方向，但 evidence thickness 或 pack context 還不夠厚，"
                    "仍需明示脈絡邊界。"
                )
                guardrail_note = "可作為局部參考，但要搭配 client stage / domain lens / pack context 收斂。"
        elif item.reuse_recommendation == "can_expand":
            context_distance = "close"
            context_distance_label = "距離較近"
            reuse_confidence = "high_confidence"
            reuse_confidence_label = "高信心重用"
            summary = "這類 reusable asset 與目前案件脈絡較接近，可作為較高信心的重用來源。"
            guardrail_note = "仍需由 Host 做最後 contextual 收斂，不可直接視為全域定論。"
        elif item.reuse_recommendation == "restrict_narrow_use":
            context_distance = "far"
            context_distance_label = "距離偏遠"
            reuse_confidence = "low_confidence"
            reuse_confidence_label = "低信心重用"
            summary = "這類 reusable asset 與目前案件距離偏遠，較適合留在背景校正。"
            guardrail_note = "先留背景校正，避免直接擴張成目前案件的主要依據。"
        else:
            context_distance = "moderate"
            context_distance_label = "仍有距離"
            reuse_confidence = "bounded_confidence"
            reuse_confidence_label = "有邊界重用"
            summary = "這類 reusable asset 可提供方向，但仍需明示脈絡邊界。"
            guardrail_note = "可作為局部參考，但要搭配 client stage / domain lens 收斂。"

        distance_items.append(
            schemas.PhaseSixContextDistanceItemRead(
                asset_code=item.asset_code,
                asset_label=item.asset_label,
                context_distance=context_distance,
                context_distance_label=context_distance_label,
                reuse_confidence=reuse_confidence,
                reuse_confidence_label=reuse_confidence_label,
                summary=summary,
                guardrail_note=guardrail_note,
            )
        )

    has_far = any(item.context_distance == "far" for item in distance_items)
    return schemas.PhaseSixContextDistanceAuditResponse(
        phase_id="phase_6",
        phase_label="Generalist Consulting Intelligence Governance",
        confidence_posture="mixed_distance" if has_far else "mostly_close",
        confidence_posture_label="目前距離混合" if has_far else "目前多數較近",
        summary=(
            "phase 6 現在已能更正式回答 reusable assets 與目前案件脈絡的距離，"
            "以及目前較接近高信心、有限邊界或低信心的重用。"
        ),
        distance_items=distance_items,
        recommended_next_step=(
            "若要繼續往下走，下一刀應把 context distance 再更正式接進 Host 的 reuse confidence weighting。"
        ),
    )


def build_phase_six_confidence_calibration(
    *,
    context_distance: schemas.PhaseSixContextDistanceAuditResponse | None = None,
    case_context: PhaseSixCaseContext | None = None,
) -> schemas.PhaseSixConfidenceCalibrationResponse:
    source_distance = context_distance or build_phase_six_context_distance_audit(case_context=case_context)
    if case_context is not None:
        calibration_items: list[schemas.PhaseSixConfidenceCalibrationItemRead] = []
        for axis_kind, axis_label in (
            ("client_stage", "client stage"),
            ("client_type", "client type"),
            ("domain_lens", "domain lens"),
        ):
            (
                calibration_status,
                calibration_status_label,
                reuse_confidence,
                reuse_confidence_label,
                summary,
            ) = _resolve_calibration_status(axis_kind=axis_kind, case_context=case_context)
            if calibration_status == "aligned":
                guardrail_note = "目前已較接近可正式沿用的脈絡，但仍需由 Host 做最後收斂。"
            elif calibration_status == "caution":
                guardrail_note = "先保留 boundary note，再決定哪些模式能沿用。"
            else:
                guardrail_note = "先留背景校正，不要讓它單獨帶主線。"
            calibration_items.append(
                schemas.PhaseSixConfidenceCalibrationItemRead(
                    axis_kind=axis_kind,  # type: ignore[arg-type]
                    axis_label=axis_label,
                    calibration_status=calibration_status,  # type: ignore[arg-type]
                    calibration_status_label=calibration_status_label,
                    reuse_confidence=reuse_confidence,  # type: ignore[arg-type]
                    reuse_confidence_label=reuse_confidence_label,
                    summary=summary,
                    guardrail_note=guardrail_note,
                )
            )
    else:
        calibration_items = [
            schemas.PhaseSixConfidenceCalibrationItemRead(
                axis_kind="client_stage",
                axis_label="client stage",
                calibration_status="caution",
                calibration_status_label="需要留意",
                reuse_confidence="bounded_confidence",
                reuse_confidence_label="有邊界重用",
                summary="目前 reusable confidence 在 client stage 上仍有距離，較適合保留邊界再重用。",
                guardrail_note="若 client stage 明顯不同，先把 precedent / playbook 當方向參考，不要直接視為同一成熟度做法。",
            ),
            schemas.PhaseSixConfidenceCalibrationItemRead(
                axis_kind="client_type",
                axis_label="client type",
                calibration_status="caution",
                calibration_status_label="需要留意",
                reuse_confidence="bounded_confidence",
                reuse_confidence_label="有邊界重用",
                summary="目前 reusable confidence 在 client type 上仍需保留邊界，不宜直接假設同樣成立。",
                guardrail_note="若 client type 差異明顯，先保留 boundary note，再決定哪些模式能沿用。",
            ),
            schemas.PhaseSixConfidenceCalibrationItemRead(
                axis_kind="domain_lens",
                axis_label="domain lens",
                calibration_status="mismatch",
                calibration_status_label="仍有不對齊",
                reuse_confidence="low_confidence",
                reuse_confidence_label="低信心重用",
                summary="目前最容易拉低 reusable confidence 的仍是 domain lens 差距，應避免直接擴張重用。",
                guardrail_note="若 domain lens 本身差距偏遠，先留背景校正，不要讓它帶主線。",
            ),
        ]
    has_mismatch = any(item.calibration_status == "mismatch" for item in calibration_items)
    return schemas.PhaseSixConfidenceCalibrationResponse(
        phase_id="phase_6",
        phase_label="Generalist Consulting Intelligence Governance",
        calibration_posture="watch_mismatch" if has_mismatch else "stable_alignment",
        calibration_posture_label="仍需看不對齊" if has_mismatch else "目前較對齊",
        summary=(
            "phase 6 現在已能把 reusable confidence 再拆成 client stage、client type、domain lens 三個 calibration axes。"
        ),
        calibration_items=calibration_items,
        recommended_next_step=(
            "若要繼續往下走，下一刀應把這些 calibration axes 更正式接進 Host 的 reusable ordering，而不是只停在首頁。"
        ),
    )


def build_phase_six_calibration_aware_weighting(
    *,
    calibration: schemas.PhaseSixConfidenceCalibrationResponse | None = None,
    case_context: PhaseSixCaseContext | None = None,
) -> schemas.PhaseSixCalibrationAwareWeightingResponse:
    source_calibration = calibration or build_phase_six_confidence_calibration(case_context=case_context)
    weighting_items: list[schemas.PhaseSixCalibrationAwareWeightingItemRead] = []

    for item in source_calibration.calibration_items:
        if item.axis_kind == "domain_lens" and item.calibration_status == "mismatch":
            weighting_effect = "background_only"
            weighting_effect_label = "先留背景校正"
            summary = "domain lens 不對齊時，就算共享訊號穩，也先不要讓這類來源單獨帶主線。"
        elif item.calibration_status == "caution":
            weighting_effect = "keep_contextual"
            weighting_effect_label = "先保留邊界"
            summary = (
                "這條 calibration axis 若仍有距離，Host 應把 reusable source 留在 contextual reuse，"
                "不要在 evidence thickness 還薄時直接放大。"
            )
        else:
            weighting_effect = "allow_expand"
            weighting_effect_label = "可維持擴大重用"
            summary = "這條 calibration axis 目前較對齊，不需要額外拉低 reusable ordering。"

        weighting_items.append(
            schemas.PhaseSixCalibrationAwareWeightingItemRead(
                axis_kind=item.axis_kind,
                axis_label=item.axis_label,
                calibration_status=item.calibration_status,
                calibration_status_label=item.calibration_status_label,
                weighting_effect=weighting_effect,
                weighting_effect_label=weighting_effect_label,
                summary=summary,
            )
        )

    has_background_only = any(
        item.weighting_effect == "background_only" for item in weighting_items
    )
    return schemas.PhaseSixCalibrationAwareWeightingResponse(
        phase_id="phase_6",
        phase_label="Generalist Consulting Intelligence Governance",
        weighting_posture="watch_mismatch" if has_background_only else "calibrated_ordering",
        weighting_posture_label="仍需看 mismatch" if has_background_only else "已接入 ordering",
        summary=(
            "phase 6 現在已把 confidence calibration 接回 Host ordering："
            "domain lens mismatch 先退背景，stage / type mismatch 不再直接視為可擴大重用。"
            if case_context is None
            else "phase 6 現在會依當前案件的 client / domain / evidence / pack context，"
            "把 calibration signal 正式接回 Host ordering。"
        ),
        host_weighting_summary=(
            "Host 現在會先看 domain lens 是否對齊；若不對齊，就算 shared intelligence 穩，也先留背景校正。"
            if case_context is None
            else "Host 現在會先看這輪案件的 domain lens、evidence thickness 與 pack context；"
            "脈絡還沒站穩時，shared intelligence 先留在背景或 contextual reuse。"
        ),
        host_weighting_guardrail_note=(
            "這一刀仍是 soft ordering，不做 hard block；最終仍由 Host 依當前案件證據與限制收斂。"
        ),
        weighting_items=weighting_items,
        recommended_next_step=(
            "若要繼續往下走，下一刀應把 calibration-aware weighting 再更正式地回寫到 second-layer reuse note。"
        ),
    )


def recommend_phase_six_reuse_weighting(
    *,
    asset_code: str,
    reason_codes: Iterable[str] | None,
    weight_action: str,
    stability: str,
    strength: str,
    client_stage_alignment: str = "unknown",
    client_type_alignment: str = "unknown",
    domain_lens_alignment: str = "unknown",
) -> tuple[str, str, str, int]:
    codes = set(reason_codes or [])

    if weight_action == "downweight":
        recommendation = "restrict_narrow_use"
        label = "不要擴大套用"
        note = "這筆模式目前仍屬低信任來源，應避免被擴張成全域 best practice。"
    elif asset_code in {"deliverable_template", "deliverable_shape"} and {
        "reusable_structure",
        "reusable_deliverable_shape",
    } & codes:
        recommendation = "restrict_narrow_use"
        label = "不要擴大套用"
        note = "這筆模式主要屬於窄情境模板 / 骨架參考，應先留在背景校正。"
    elif (
        asset_code == "domain_playbook"
        and {"reusable_action_pattern", "reusable_priority_judgment"} & codes
        and stability == "stable"
        and weight_action == "upweight"
        and strength == "high"
    ):
        recommendation = "can_expand"
        label = "可擴大重用"
        note = "這筆模式目前較接近可跨情境重用的工作主線，可優先站到前面。"
    elif (
        asset_code == "common_risk"
        and "reusable_risk_scan" in codes
        and stability == "stable"
        and weight_action == "upweight"
        and strength == "high"
    ):
        recommendation = "can_expand"
        label = "可擴大重用"
        note = "這筆模式目前較接近可跨情境重用的風險掃描來源，可優先站到前面。"
    elif (
        asset_code == "review_lens"
        and "reusable_reasoning" in codes
        and stability == "stable"
        and weight_action == "upweight"
        and strength == "high"
    ):
        recommendation = "can_expand"
        label = "可擴大重用"
        note = "這筆模式目前較接近可跨情境重用的審閱視角，可優先站到前面。"
    else:
        recommendation = "keep_contextual"
        label = "維持局部參考"
        note = "這筆模式可作為局部提示，但仍需搭配當前案件脈絡收斂。"

    if domain_lens_alignment == "mismatch":
        recommendation = "restrict_narrow_use"
        label = "不要擴大套用"
        note = "這筆模式與目前案件的 domain lens 不對齊，先留在背景校正，不要讓它直接帶主線。"
    elif (
        recommendation == "can_expand"
        and "mismatch" in {client_stage_alignment, client_type_alignment}
    ):
        recommendation = "keep_contextual"
        label = "維持局部參考"
        note = "這筆模式雖然共享訊號穩，但 client stage / client type 仍未完全對齊，先保留邊界再重用。"

    return recommendation, label, note, REUSE_WEIGHTING_RANK[recommendation]
