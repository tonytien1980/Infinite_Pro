from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING, Iterable

from app.domain.enums import (
    AdoptionFeedbackStatus,
    PrecedentCandidateStatus,
    PrecedentCandidateType,
)
from app.services.adoption_feedback_intelligence import label_for_adoption_feedback_reason

if TYPE_CHECKING:
    from app.domain import models


PRECEDENT_REVIEW_PRIORITY_RANK = {
    "high": 0,
    "medium": 1,
    "low": 2,
}


@dataclass(frozen=True)
class PrecedentReferenceMatch:
    candidate: "models.PrecedentCandidate"
    review_priority: str
    review_priority_reason: str
    primary_reason_label: str
    source_feedback_reason_labels: list[str]
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
    codes = {
        code
        for item in matched
        for code in candidate_reason_codes(item.candidate)
    }
    uses: list[str] = []

    if {"reusable_structure", "reusable_deliverable_shape"} & codes:
        uses.append("先拿來校正交付骨架與段落順序，不要把舊案內容直接當成現成答案。")
    if {"reusable_reasoning", "reusable_priority_judgment", "reusable_client_framing"} & codes:
        uses.append("再拿來校正 framing、判斷順序與優先級，不要把 precedent 當成定案。")
    if {"reusable_risk_scan", "reusable_constraint_handling", "reusable_action_pattern"} & codes:
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
    normalized_domain_lenses = {item.strip() for item in domain_lenses if item.strip()}
    normalized_pack_ids = {item.strip() for item in selected_pack_ids if item.strip()}
    matches: list[PrecedentReferenceMatch] = []

    for candidate in candidates:
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

        matches.append(
            PrecedentReferenceMatch(
                candidate=candidate,
                review_priority=review_priority,
                review_priority_reason=review_priority_reason,
                primary_reason_label=primary_reason_label,
                source_feedback_reason_labels=source_feedback_reason_labels,
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
        lines.extend(
            [
                f"模式 {index}：{title}",
                f"- 為何相似：{match_reason}",
                *( [f"- 主要原因：{primary_reason_label}"] if primary_reason_label else [] ),
                f"- 可參考：{safe_use_note}",
                f"- 摘要：{summary}",
            ]
        )
    if lines:
        lines.append(f"整體邊界：{boundary_note}")
    return lines
