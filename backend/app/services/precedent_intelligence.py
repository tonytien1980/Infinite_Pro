from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING, Iterable

from app.domain.enums import (
    AdoptionFeedbackStatus,
    PrecedentCandidateStatus,
    PrecedentCandidateType,
)

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
    match_reason: str
    safe_use_note: str
    score: int


def classify_precedent_review_priority(
    candidate_status: str,
    source_feedback_status: str,
) -> tuple[str, str, int]:
    if candidate_status == PrecedentCandidateStatus.DISMISSED.value:
        return (
            "low",
            "這個候選目前已停用，先留作背景；之後若需要，再從這裡恢復即可。",
            0,
        )

    if candidate_status == PrecedentCandidateStatus.CANDIDATE.value:
        if source_feedback_status == AdoptionFeedbackStatus.TEMPLATE_CANDIDATE.value:
            return (
                "high",
                "這個候選來自「值得當範本」的採納訊號，而且目前仍待決，最值得先回看。",
                0,
            )
        if source_feedback_status == AdoptionFeedbackStatus.ADOPTED.value:
            return (
                "high",
                "這個候選已被直接採用，而且目前仍待決，值得先決定是否升格成正式模式。",
                1,
            )
        return (
            "medium",
            "這個候選仍有參考價值，但來源回饋仍偏向需要改寫，可安排下一輪回看。",
            0,
        )

    return (
        "medium",
        "這個模式已正式升格，目前比較適合週期性回看，不必搶在待決候選前面。",
        1,
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


def build_precedent_safe_use_note(candidate_type: str) -> str:
    if candidate_type == PrecedentCandidateType.DELIVERABLE_PATTERN.value:
        return "可參考交付骨架與判斷順序，不要直接複製舊案正文。"
    return "可參考建議 framing 與優先順序，不要直接照搬建議內容。"


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

        review_priority, review_priority_reason, _ = classify_precedent_review_priority(
            candidate.candidate_status,
            candidate.source_feedback_status,
        )

        matches.append(
            PrecedentReferenceMatch(
                candidate=candidate,
                review_priority=review_priority,
                review_priority_reason=review_priority_reason,
                match_reason="；".join(reasons[:2]),
                safe_use_note=build_precedent_safe_use_note(candidate.candidate_type),
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
        safe_use_note = getattr(item, "safe_use_note", "") or "只可拿來參考模式，不可直接複製舊案內容。"
        summary = getattr(item, "summary", "") or getattr(item, "reusable_reason", "") or "目前沒有額外摘要。"
        lines.extend(
            [
                f"模式 {index}：{title}",
                f"- 為何相似：{match_reason}",
                f"- 可參考：{safe_use_note}",
                f"- 摘要：{summary}",
            ]
        )
    if lines:
        lines.append(f"整體邊界：{boundary_note}")
    return lines
