from __future__ import annotations

from app.workbench import schemas


def _build_asset_audits() -> list[schemas.SharedIntelligenceAssetAuditItemResponse]:
    return [
        schemas.SharedIntelligenceAssetAuditItemResponse(
            asset_code="review_lens",
            asset_label="review lens",
            audit_status="audited",
            audit_status_label="已完成 audit",
            summary="review lens 的 contract、prompt 與 second-layer surface 已站穩。",
            next_step="",
        ),
        schemas.SharedIntelligenceAssetAuditItemResponse(
            asset_code="common_risk",
            asset_label="common risk",
            audit_status="audited",
            audit_status_label="已完成 audit",
            summary="common risk 的 contract、prompt 與 second-layer surface 已站穩。",
            next_step="",
        ),
        schemas.SharedIntelligenceAssetAuditItemResponse(
            asset_code="deliverable_shape",
            asset_label="deliverable shape",
            audit_status="audited",
            audit_status_label="已完成 audit",
            summary="deliverable shape 的 contract、prompt 與 second-layer surface 已站穩。",
            next_step="",
        ),
    ]


def build_shared_intelligence_closure_review(
    *,
    total_candidates: int,
    promoted_count: int,
    pending_duplicate_count: int,
    sign_off_state: dict | None = None,
) -> schemas.SharedIntelligenceClosureReviewResponse:
    asset_audits = _build_asset_audits()
    completed_items = [
        "precedent governance / lifecycle 已成立",
        "organization memory 已有 lifecycle posture",
        "domain playbook 已有 shared-source lifecycle posture",
        "deliverable template 已有 shared-source lifecycle posture",
    ]
    remaining_items = ["phase 4 sign-off 與下一階段 handoff"]
    closure_status = "ready_to_close" if pending_duplicate_count == 0 else "completion_pass"
    closure_status_label = "可準備 sign-off" if pending_duplicate_count == 0 else "接近可收口"
    duplicate_note = (
        f"目前另有 {pending_duplicate_count} 組同案重複候選待整理。"
        if pending_duplicate_count > 0
        else "目前沒有待整理的同案重複候選。"
    )
    if sign_off_state and sign_off_state.get("signed_off"):
        return schemas.SharedIntelligenceClosureReviewResponse(
            phase_id="phase_4",
            phase_label="precedent / reusable intelligence",
            closure_status="signed_off",
            closure_status_label="已正式收口",
            summary="phase 4 已正式收口，下一階段 handoff 已整理。",
            candidate_snapshot=(
                f"目前共有 {total_candidates} 筆候選，其中 {promoted_count} 筆已升格成正式可重用模式。{duplicate_note}"
            ),
            completed_count=len(completed_items) + len(asset_audits),
            remaining_count=0,
            completed_items=completed_items,
            asset_audits=asset_audits,
            remaining_items=[],
            recommended_next_step="下一階段先做 phase-5 decision framing。",
            signed_off_at=sign_off_state.get("signed_off_at"),
            signed_off_by_label=sign_off_state.get("signed_off_by_label", ""),
            next_phase_label="下一階段：phase-5 decision framing",
            handoff_summary=(
                "先確認 phase 5 要從小型顧問團隊 operating layer / next-phase decision framing 開始，"
                "而不是直接跳去 enterprise governance shell。"
            ),
            handoff_items=[
                "先確認下一階段主線仍以顧問團隊內部 operating layer 為主。",
                "不要先開 enterprise governance shell。",
            ],
        )
    return schemas.SharedIntelligenceClosureReviewResponse(
        phase_id="phase_4",
        phase_label="precedent / reusable intelligence",
        closure_status=closure_status,
        closure_status_label=closure_status_label,
        summary=(
            "precedent governance、organization memory、playbook、template 的 shared-source lifecycle contract 已大致站穩，"
            "review lens / common risk / deliverable shape 的 closure audit 也已完成，現在主要剩 sign-off。"
        ),
        candidate_snapshot=(
            f"目前共有 {total_candidates} 筆候選，其中 {promoted_count} 筆已升格成正式可重用模式。{duplicate_note}"
        ),
        completed_count=len(completed_items) + len(asset_audits),
        remaining_count=len(remaining_items),
        completed_items=completed_items,
        asset_audits=asset_audits,
        remaining_items=remaining_items,
        recommended_next_step="若沒有新的 regression，就可準備做 phase 4 sign-off 與下一階段 handoff。",
    )
