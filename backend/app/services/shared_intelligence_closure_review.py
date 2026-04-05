from __future__ import annotations

from app.workbench import schemas


def build_shared_intelligence_closure_review(
    *,
    total_candidates: int,
    promoted_count: int,
    pending_duplicate_count: int,
) -> schemas.SharedIntelligenceClosureReviewResponse:
    completed_items = [
        "precedent governance / lifecycle 已成立",
        "organization memory 已有 lifecycle posture",
        "domain playbook 已有 shared-source lifecycle posture",
        "deliverable template 已有 shared-source lifecycle posture",
    ]
    remaining_items = [
        "review lens / common risk / deliverable shape 的 closure audit",
        "phase 4 sign-off 與下一階段 handoff",
    ]
    duplicate_note = (
        f"目前另有 {pending_duplicate_count} 組同案重複候選待整理。"
        if pending_duplicate_count > 0
        else "目前沒有待整理的同案重複候選。"
    )
    return schemas.SharedIntelligenceClosureReviewResponse(
        phase_id="phase_4",
        phase_label="precedent / reusable intelligence",
        closure_status="completion_pass",
        closure_status_label="接近可收口",
        summary=(
            "precedent governance、organization memory、playbook、template 的 shared-source lifecycle contract 已大致站穩，"
            "現在主要剩 closure audit 與 sign-off。"
        ),
        candidate_snapshot=(
            f"目前共有 {total_candidates} 筆候選，其中 {promoted_count} 筆已升格成正式可重用模式。{duplicate_note}"
        ),
        completed_count=len(completed_items),
        remaining_count=len(remaining_items),
        completed_items=completed_items,
        remaining_items=remaining_items,
        recommended_next_step="先做 shared-intelligence final gap audit，再決定是否正式關閉 phase 4。",
    )
