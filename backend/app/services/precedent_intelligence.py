from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING, Iterable

from app.domain import schemas
from app.domain.enums import (
    AdoptionFeedbackStatus,
    PrecedentCandidateStatus,
    PrecedentCandidateType,
)
from app.services.adoption_feedback_intelligence import (
    label_for_adoption_feedback_reason,
    matches_reusable_asset_reason,
)
from app.services.feedback_optimization_intelligence import (
    STRENGTH_RANK,
    build_precedent_optimization_signal,
)

if TYPE_CHECKING:
    from app.domain import models


PRECEDENT_REVIEW_PRIORITY_RANK = {
    "high": 0,
    "medium": 1,
    "low": 2,
}

SHARED_INTELLIGENCE_MATURITY_RANK = {
    "shared": 0,
    "emerging": 1,
    "personal": 2,
}

SHARED_INTELLIGENCE_WEIGHT_RANK = {
    "upweight": 0,
    "hold": 1,
    "downweight": 2,
}

SHARED_INTELLIGENCE_STABILITY_RANK = {
    "stable": 0,
    "watch": 1,
    "recovering": 2,
    "retired": 3,
}

GOVERNANCE_ACTION_RANK = {
    "promote": 0,
    "keep_candidate": 1,
    "keep_promoted": 1,
    "demote": 2,
    "dismiss": 3,
    "keep_dismissed": 4,
}


@dataclass(frozen=True)
class PrecedentReferenceMatch:
    candidate: "models.PrecedentCandidate"
    review_priority: str
    review_priority_reason: str
    primary_reason_label: str
    source_feedback_reason_labels: list[str]
    optimization_signal: schemas.PrecedentOptimizationSignalRead
    shared_intelligence_signal: schemas.SharedIntelligenceSignalRead
    match_reason: str
    safe_use_note: str
    score: int


def classify_precedent_review_priority(
    candidate_status: str,
    source_feedback_status: str,
    *,
    primary_reason_label: str = "",
) -> tuple[str, str, int]:
    reason_fragment = (
        f"而且主要原因是「{primary_reason_label}」。"
        if primary_reason_label
        else ""
    )
    if candidate_status == PrecedentCandidateStatus.DISMISSED.value:
        return (
            "low",
            f"這個候選目前已停用，先留作背景；之後若需要，再從這裡恢復即可。{reason_fragment}",
            0,
        )

    if candidate_status == PrecedentCandidateStatus.CANDIDATE.value:
        if source_feedback_status == AdoptionFeedbackStatus.TEMPLATE_CANDIDATE.value:
            return (
                "high",
                f"這個候選來自「值得當範本」的採納訊號，{reason_fragment or '而且目前仍待決，最值得先回看。'}",
                0 if primary_reason_label else 1,
            )
        if source_feedback_status == AdoptionFeedbackStatus.ADOPTED.value:
            return (
                "high",
                f"這個候選已被直接採用，{reason_fragment or '而且目前仍待決，值得先決定是否升格成正式模式。'}",
                1 if primary_reason_label else 2,
            )
        return (
            "medium",
            f"這個候選仍有參考價值，但來源回饋仍偏向需要改寫。{reason_fragment or '可安排下一輪回看。'}",
            1 if primary_reason_label else 2,
        )

    return (
        "medium",
        f"這個模式已正式升格，目前比較適合週期性回看。{reason_fragment or '不必搶在待決候選前面。'}",
        2 if primary_reason_label else 3,
    )


def is_precedent_candidate_reference_eligible(
    *,
    candidate_status: str,
    source_feedback_status: str,
) -> bool:
    if candidate_status == PrecedentCandidateStatus.DISMISSED.value:
        return False
    if candidate_status == PrecedentCandidateStatus.PROMOTED.value:
        return True
    return source_feedback_status in {
        AdoptionFeedbackStatus.ADOPTED.value,
        AdoptionFeedbackStatus.TEMPLATE_CANDIDATE.value,
    }


def _surface_kind_for_candidate_type(candidate_type: str) -> str:
    if candidate_type == PrecedentCandidateType.DELIVERABLE_PATTERN.value:
        return "deliverable"
    return "recommendation"


def candidate_reason_codes(candidate: "models.PrecedentCandidate") -> list[str]:
    return list(candidate.source_feedback_reason_codes or [])


def candidate_reason_labels(candidate: "models.PrecedentCandidate") -> list[str]:
    surface_kind = _surface_kind_for_candidate_type(candidate.candidate_type)
    status = AdoptionFeedbackStatus(candidate.source_feedback_status)
    labels: list[str] = []
    for code in candidate_reason_codes(candidate):
        label = label_for_adoption_feedback_reason(surface_kind, status, code)
        if label and label not in labels:
            labels.append(label)
    return labels


def _candidate_primary_asset_code(candidate: "models.PrecedentCandidate") -> str:
    optimization_signal = build_precedent_optimization_signal(
        candidate_status=candidate.candidate_status,
        source_feedback_status=candidate.source_feedback_status,
        source_feedback_reason_codes=candidate_reason_codes(candidate),
        candidate_type=candidate.candidate_type,
    )
    return optimization_signal.best_for_asset_codes[0] if optimization_signal.best_for_asset_codes else ""


def _candidate_operator_labels(candidate: "models.PrecedentCandidate") -> set[str]:
    labels = {
        label.strip()
        for label in (
            candidate.source_feedback_operator_label or "",
            candidate.created_by_label or "",
        )
        if label and label.strip()
    }
    if not labels and candidate.last_status_changed_by_label:
        labels.add(candidate.last_status_changed_by_label.strip())
    return {label for label in labels if label}


def _candidates_share_intelligence_family(
    anchor: "models.PrecedentCandidate",
    other: "models.PrecedentCandidate",
) -> bool:
    if anchor.candidate_type != other.candidate_type:
        return False

    anchor_asset = _candidate_primary_asset_code(anchor)
    other_asset = _candidate_primary_asset_code(other)
    if anchor_asset and other_asset and anchor_asset != other_asset:
        return False

    if anchor.lane_id and other.lane_id and anchor.lane_id != other.lane_id:
        return False
    if anchor.deliverable_type and other.deliverable_type and anchor.deliverable_type != other.deliverable_type:
        return False
    if anchor.client_stage and other.client_stage and anchor.client_stage != other.client_stage:
        return False
    if anchor.client_type and other.client_type and anchor.client_type != other.client_type:
        return False

    anchor_lenses = set(anchor.domain_lenses or [])
    other_lenses = set(other.domain_lenses or [])
    if anchor_lenses and other_lenses and not anchor_lenses.intersection(other_lenses):
        return False

    return True


def build_shared_intelligence_signal(
    *,
    candidate: "models.PrecedentCandidate",
    candidates: Iterable["models.PrecedentCandidate"],
) -> schemas.SharedIntelligenceSignalRead:
    family_candidates = [
        item
        for item in candidates
        if _candidates_share_intelligence_family(candidate, item)
    ]
    supporting_candidates = [
        item
        for item in family_candidates
        if item.candidate_status != PrecedentCandidateStatus.DISMISSED.value
    ]
    dismissed_candidates = [
        item
        for item in family_candidates
        if item.candidate_status == PrecedentCandidateStatus.DISMISSED.value
    ]
    distinct_operator_count = len(
        {
            label
            for item in supporting_candidates
            for label in _candidate_operator_labels(item)
        }
    )
    promoted_candidate_count = sum(
        1
        for item in supporting_candidates
        if item.candidate_status == PrecedentCandidateStatus.PROMOTED.value
    )
    supporting_candidate_count = len(supporting_candidates)
    dismissed_candidate_count = len(dismissed_candidates)

    if (
        distinct_operator_count >= 2
        and promoted_candidate_count >= 2
        and dismissed_candidate_count == 0
    ) or (
        distinct_operator_count >= 2
        and supporting_candidate_count >= 3
        and promoted_candidate_count >= 1
        and dismissed_candidate_count == 0
    ):
        maturity = "shared"
        maturity_label = "已接近共享模式"
        maturity_reason = "這類模式已在多筆案件被不同顧問反覆保留，而且已有正式升格。"
        weight_action = "upweight"
        weight_action_label = "提高參考"
    elif distinct_operator_count >= 2 and supporting_candidate_count >= 2:
        maturity = "emerging"
        maturity_label = "開始形成共享模式"
        if dismissed_candidate_count > 0:
            maturity_reason = "這類模式已開始在不同案件被多位顧問保留，但仍有停用訊號，先持平觀察。"
            weight_action = "hold"
            weight_action_label = "先持平觀察"
        else:
            maturity_reason = "這類模式已開始在不同案件被多位顧問重複保留，可提高後續參考權重。"
            weight_action = "upweight"
            weight_action_label = "提高參考"
    elif dismissed_candidate_count > 0 and supporting_candidate_count <= 1:
        maturity = "personal"
        maturity_label = "仍偏個別經驗"
        maturity_reason = "目前仍偏單次或個別經驗，而且已有停用訊號，先降低參考權重。"
        weight_action = "downweight"
        weight_action_label = "降低參考"
    else:
        maturity = "personal"
        maturity_label = "仍偏個別經驗"
        maturity_reason = "目前仍偏單次或個別經驗，先持平觀察，不急著放大影響。"
        weight_action = "hold"
        weight_action_label = "先持平觀察"

    if candidate.candidate_status == PrecedentCandidateStatus.DISMISSED.value:
        weight_action = "downweight"
        weight_action_label = "降低參考"
        maturity_reason = (
            "這筆候選目前已停用；即使相關模式仍有參考價值，這筆個體也先降低參考權重。"
        )

    if candidate.candidate_status == PrecedentCandidateStatus.DISMISSED.value:
        stability = "retired"
        stability_label = "目前已退到背景"
        stability_reason = "這筆模式目前已停用，先留在背景，不宜再主動放大影響。"
    elif (
        candidate.candidate_status == PrecedentCandidateStatus.PROMOTED.value
        and maturity == "shared"
        and weight_action == "upweight"
    ):
        stability = "stable"
        stability_label = "已站穩共享模式"
        stability_reason = "這筆模式已正式升格，而且共享成熟度與權重趨勢都相對穩定。"
    elif (
        candidate.candidate_status == PrecedentCandidateStatus.CANDIDATE.value
        and candidate.source_feedback_status
        in {
            AdoptionFeedbackStatus.ADOPTED.value,
            AdoptionFeedbackStatus.NEEDS_REVISION.value,
            AdoptionFeedbackStatus.TEMPLATE_CANDIDATE.value,
        }
        and dismissed_candidate_count > 0
    ):
        stability = "recovering"
        stability_label = "剛恢復觀察"
        stability_reason = "這類模式雖已重新進入觀察，但同 family 仍帶停用痕跡，先不要過早放大。"
    else:
        stability = "watch"
        stability_label = "仍在共享觀察期"
        stability_reason = "這類模式已有共享訊號，但目前仍適合先觀察，不急著視為穩定共享模式。"

    return schemas.SharedIntelligenceSignalRead(
        maturity=maturity,
        maturity_reason=maturity_reason,
        maturity_label=maturity_label,
        weight_action=weight_action,
        weight_action_label=weight_action_label,
        stability=stability,
        stability_reason=stability_reason,
        stability_label=stability_label,
        supporting_candidate_count=supporting_candidate_count,
        distinct_operator_count=distinct_operator_count,
        promoted_candidate_count=promoted_candidate_count,
        dismissed_candidate_count=dismissed_candidate_count,
        summary=f"{maturity_label}，{weight_action_label}，{stability_label}。",
    )


def build_precedent_governance_recommendation(
    *,
    candidate_status: str,
    shared_intelligence_signal: schemas.SharedIntelligenceSignalRead,
) -> schemas.PrecedentGovernanceRecommendationRead:
    if candidate_status == PrecedentCandidateStatus.CANDIDATE.value:
        if shared_intelligence_signal.weight_action == "upweight":
            return schemas.PrecedentGovernanceRecommendationRead(
                action="promote",
                target_status="promoted",
                action_label="可考慮升格",
                summary="這筆模式已開始形成共享模式，可考慮升格成正式可重用模式。",
                rationale=shared_intelligence_signal.maturity_reason,
            )
        if shared_intelligence_signal.weight_action == "downweight":
            return schemas.PrecedentGovernanceRecommendationRead(
                action="dismiss",
                target_status="dismissed",
                action_label="可考慮退場",
                summary="這筆模式目前較像局部經驗，可考慮先停用，避免持續影響後續重用。",
                rationale=shared_intelligence_signal.maturity_reason,
            )
        return schemas.PrecedentGovernanceRecommendationRead(
            action="keep_candidate",
            target_status="candidate",
            action_label="先留在候選",
            summary="這筆模式仍在累積共享訊號，先留在候選觀察即可。",
            rationale=shared_intelligence_signal.maturity_reason,
        )

    if candidate_status == PrecedentCandidateStatus.PROMOTED.value:
        if shared_intelligence_signal.weight_action == "downweight":
            return schemas.PrecedentGovernanceRecommendationRead(
                action="dismiss",
                target_status="dismissed",
                action_label="可考慮退場",
                summary="這筆正式模式目前共享成熟度偏低，可考慮先退場。",
                rationale=shared_intelligence_signal.maturity_reason,
            )
        if shared_intelligence_signal.weight_action == "hold" and shared_intelligence_signal.maturity == "personal":
            return schemas.PrecedentGovernanceRecommendationRead(
                action="demote",
                target_status="candidate",
                action_label="可考慮降回候選",
                summary="這筆模式仍有參考價值，但目前更適合先降回候選觀察。",
                rationale=shared_intelligence_signal.maturity_reason,
            )
        return schemas.PrecedentGovernanceRecommendationRead(
            action="keep_promoted",
            target_status="promoted",
            action_label="維持正式模式",
            summary="這筆模式目前仍適合維持正式可重用模式。",
            rationale=shared_intelligence_signal.maturity_reason,
        )

    return schemas.PrecedentGovernanceRecommendationRead(
        action="keep_dismissed",
        target_status="dismissed",
        action_label="維持停用",
        summary="這筆模式目前仍適合留在停用狀態，先作為背景即可。",
        rationale=shared_intelligence_signal.maturity_reason,
    )


def select_weighted_precedent_reference_items(
    guidance: schemas.PrecedentReferenceGuidanceRead,
    *,
    asset_code: str,
    limit: int = 2,
) -> list[schemas.PrecedentReferenceItemRead]:
    if guidance.status != "available" or not guidance.matched_items:
        return []

    matches = [
        item
        for item in guidance.matched_items
        if matches_reusable_asset_reason(item.source_feedback_reason_codes, asset_code)
    ]
    if not matches:
        return []

    preferred_matches = [
        item
        for item in matches
        if item.shared_intelligence_signal.weight_action != "downweight"
    ]
    if preferred_matches:
        matches = preferred_matches

    matches.sort(
        key=lambda item: (
            SHARED_INTELLIGENCE_WEIGHT_RANK[item.shared_intelligence_signal.weight_action],
            SHARED_INTELLIGENCE_MATURITY_RANK[item.shared_intelligence_signal.maturity],
            SHARED_INTELLIGENCE_STABILITY_RANK[item.shared_intelligence_signal.stability],
            STRENGTH_RANK[item.optimization_signal.strength],
            PRECEDENT_REVIEW_PRIORITY_RANK[item.review_priority],
            item.title or "",
        )
    )
    return matches[:limit]


def build_precedent_safe_use_note(candidate_type: str, reason_codes: Iterable[str] | None = None) -> str:
    codes = set(reason_codes or [])
    if candidate_type == PrecedentCandidateType.DELIVERABLE_PATTERN.value:
        if {"reusable_structure", "reusable_deliverable_shape"} & codes:
            return "優先參考交付骨架與段落順序，不要直接複製舊案正文。"
        if "reusable_reasoning" in codes:
            return "優先參考判斷收斂方式與段落取捨，不要直接複製舊案正文。"
        if "reusable_risk_scan" in codes:
            return "優先參考風險掃描順序，不要把舊案風險直接套到新案。"
        return "可參考交付骨架與判斷順序，不要直接複製舊案正文。"
    if {"reusable_action_pattern", "reusable_priority_judgment"} & codes:
        return "優先參考行動排序與優先順序，不要直接照搬建議內容。"
    if {"reusable_constraint_handling", "reusable_client_framing"} & codes:
        return "優先參考限制處理與客戶情境 framing，不要直接照搬建議內容。"
    return "可參考建議 framing 與優先順序，不要直接照搬建議內容。"


def build_reason_aware_precedent_recommended_uses(
    matches: Iterable[PrecedentReferenceMatch],
) -> list[str]:
    matched = list(matches)
    best_for_codes = {
        code
        for item in matched
        for code in item.optimization_signal.best_for_asset_codes
    }
    uses: list[str] = []

    if {"deliverable_shape", "deliverable_template"} & best_for_codes:
        uses.append("先拿來校正交付骨架與段落順序，不要把舊案內容直接當成現成答案。")
    if {"review_lens", "domain_playbook"} & best_for_codes:
        uses.append("再拿來校正 framing、判斷順序與優先級，不要把 precedent 當成定案。")
    if {"common_risk"} & best_for_codes:
        uses.append("最後拿來提醒常漏風險、限制條件與下一步排序，但仍要回到這案的正式證據核對。")

    if uses:
        return uses[:3]

    return [
        "先拿來校正 framing 與問題定義，不要把 precedent 當成定案。",
        "再拿來提醒交付骨架、審閱順序與常漏風險。",
        "若與這案當前證據衝突，仍以這案的正式證據與限制為準。",
    ]


def select_precedent_reference_matches(
    *,
    candidates: Iterable["models.PrecedentCandidate"],
    current_task_id: str,
    lane_id: str,
    deliverable_type: str | None,
    domain_lenses: list[str],
    selected_pack_ids: list[str],
    continuity_mode: str,
    client_stage: str | None,
    client_type: str | None,
    limit: int = 2,
) -> list[PrecedentReferenceMatch]:
    candidate_rows = list(candidates)
    normalized_domain_lenses = {item.strip() for item in domain_lenses if item.strip()}
    normalized_pack_ids = {item.strip() for item in selected_pack_ids if item.strip()}
    matches: list[PrecedentReferenceMatch] = []

    for candidate in candidate_rows:
        if candidate.task_id == current_task_id:
            continue
        if not is_precedent_candidate_reference_eligible(
            candidate_status=candidate.candidate_status,
            source_feedback_status=candidate.source_feedback_status,
        ):
            continue

        score = 0
        reasons: list[str] = []

        if lane_id and candidate.lane_id == lane_id:
            score += 5
            reasons.append("同樣屬於這條旗艦主線")
        if deliverable_type and candidate.deliverable_type == deliverable_type:
            score += 4
            reasons.append("交付型態一致")

        overlapping_lenses = sorted(normalized_domain_lenses.intersection(candidate.domain_lenses or []))
        if overlapping_lenses:
            score += 3
            reasons.append(f"同樣聚焦「{'、'.join(overlapping_lenses[:2])}」")

        overlapping_packs = sorted(normalized_pack_ids.intersection(candidate.selected_pack_ids or []))
        if overlapping_packs:
            score += 2
            reasons.append("套用的模組包高度重疊")

        if client_stage and candidate.client_stage and candidate.client_stage == client_stage:
            score += 1
            reasons.append("客戶階段一致")
        if client_type and candidate.client_type and candidate.client_type == client_type:
            score += 1
            reasons.append("客戶型態一致")
        if continuity_mode and candidate.continuity_mode == continuity_mode:
            score += 1
        if candidate.candidate_status == PrecedentCandidateStatus.PROMOTED.value:
            score += 2
        if candidate.source_feedback_status == AdoptionFeedbackStatus.TEMPLATE_CANDIDATE.value:
            score += 1

        if not reasons:
            continue

        source_feedback_reason_labels = candidate_reason_labels(candidate)
        primary_reason_label = source_feedback_reason_labels[0] if source_feedback_reason_labels else ""
        review_priority, review_priority_reason, _ = classify_precedent_review_priority(
            candidate.candidate_status,
            candidate.source_feedback_status,
            primary_reason_label=primary_reason_label,
        )
        optimization_signal = build_precedent_optimization_signal(
            candidate_status=candidate.candidate_status,
            source_feedback_status=candidate.source_feedback_status,
            source_feedback_reason_codes=candidate_reason_codes(candidate),
            candidate_type=candidate.candidate_type,
        )
        shared_intelligence_signal = build_shared_intelligence_signal(
            candidate=candidate,
            candidates=candidate_rows,
        )

        matches.append(
            PrecedentReferenceMatch(
                candidate=candidate,
                review_priority=review_priority,
                review_priority_reason=review_priority_reason,
                primary_reason_label=primary_reason_label,
                source_feedback_reason_labels=source_feedback_reason_labels,
                optimization_signal=optimization_signal,
                shared_intelligence_signal=shared_intelligence_signal,
                match_reason="；".join(reasons[:2]),
                safe_use_note=build_precedent_safe_use_note(
                    candidate.candidate_type,
                    candidate_reason_codes(candidate),
                ),
                score=score,
            )
        )

    matches.sort(
        key=lambda item: (
            -item.score,
            PRECEDENT_REVIEW_PRIORITY_RANK[item.review_priority],
            STRENGTH_RANK[item.optimization_signal.strength],
            SHARED_INTELLIGENCE_WEIGHT_RANK[item.shared_intelligence_signal.weight_action],
            SHARED_INTELLIGENCE_MATURITY_RANK[item.shared_intelligence_signal.maturity],
            SHARED_INTELLIGENCE_STABILITY_RANK[item.shared_intelligence_signal.stability],
            -item.candidate.updated_at.timestamp(),
            -item.candidate.created_at.timestamp(),
        )
    )
    return matches[:limit]


def build_precedent_context_lines(
    matched_items: Iterable[object],
    *,
    boundary_note: str,
) -> list[str]:
    lines: list[str] = []
    for index, item in enumerate(matched_items, start=1):
        title = getattr(item, "title", "") or "未命名模式"
        match_reason = getattr(item, "match_reason", "") or "與目前案件主線相似。"
        primary_reason_label = getattr(item, "primary_reason_label", "") or ""
        safe_use_note = getattr(item, "safe_use_note", "") or "只可拿來參考模式，不可直接複製舊案內容。"
        summary = getattr(item, "summary", "") or getattr(item, "reusable_reason", "") or "目前沒有額外摘要。"
        optimization_signal = getattr(item, "optimization_signal", None)
        optimization_summary = getattr(optimization_signal, "summary", "") if optimization_signal else ""
        optimization_labels = getattr(optimization_signal, "best_for_asset_labels", []) if optimization_signal else []
        optimization_strength = getattr(optimization_signal, "strength", "") if optimization_signal else ""
        shared_intelligence_signal = getattr(item, "shared_intelligence_signal", None)
        shared_maturity_label = (
            getattr(shared_intelligence_signal, "maturity_label", "") if shared_intelligence_signal else ""
        )
        shared_weight_label = (
            getattr(shared_intelligence_signal, "weight_action_label", "") if shared_intelligence_signal else ""
        )
        shared_stability_label = (
            getattr(shared_intelligence_signal, "stability_label", "") if shared_intelligence_signal else ""
        )
        lines.extend(
            [
                f"模式 {index}：{title}",
                f"- 為何相似：{match_reason}",
                *( [f"- 主要原因：{primary_reason_label}"] if primary_reason_label else [] ),
                *(
                    [f"- 最佳幫助：{'、'.join(optimization_labels[:2])}"]
                    if optimization_labels
                    else []
                ),
                *(
                    [f"- 參考強度：{'高' if optimization_strength == 'high' else '中' if optimization_strength == 'medium' else '低'}"]
                    if optimization_strength
                    else []
                ),
                *( [f"- 共享成熟度：{shared_maturity_label}"] if shared_maturity_label else [] ),
                *( [f"- 權重趨勢：{shared_weight_label}"] if shared_weight_label else [] ),
                *( [f"- 共享穩定度：{shared_stability_label}"] if shared_stability_label else [] ),
                *( [f"- 優化摘要：{optimization_summary}"] if optimization_summary else [] ),
                f"- 可參考：{safe_use_note}",
                f"- 摘要：{summary}",
            ]
        )
    if lines:
        lines.append(f"整體邊界：{boundary_note}")
    return lines
