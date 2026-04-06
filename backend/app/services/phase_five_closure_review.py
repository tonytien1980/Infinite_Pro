from __future__ import annotations

from app.workbench import schemas


def _build_asset_audits() -> list[schemas.PhaseFiveAssetAuditItemResponse]:
    return [
        schemas.PhaseFiveAssetAuditItemResponse(
            asset_code="auth_membership",
            asset_label="auth / membership",
            audit_status="audited",
            audit_status_label="已站穩",
            summary="Google Login、invite-only membership、role gate 與 members surface 已正式成立。",
            next_step="",
        ),
        schemas.PhaseFiveAssetAuditItemResponse(
            asset_code="provider_settings",
            asset_label="provider settings / allowlist",
            audit_status="audited",
            audit_status_label="已站穩",
            summary="Firm Settings、Personal Provider Settings、allowlist 與 fail-closed run path 已成立。",
            next_step="",
        ),
        schemas.PhaseFiveAssetAuditItemResponse(
            asset_code="demo_isolation",
            asset_label="demo workspace isolation",
            audit_status="audited",
            audit_status_label="已站穩",
            summary="demo 只進 `/demo`、只讀固定 sample dataset，且不回讀正式 workspace。",
            next_step="",
        ),
        schemas.PhaseFiveAssetAuditItemResponse(
            asset_code="owner_controls",
            asset_label="owner controls",
            audit_status="audited",
            audit_status_label="已站穩",
            summary="owner 現在已能管理 pending invite revoke 與 demo workspace policy。",
            next_step="",
        ),
        schemas.PhaseFiveAssetAuditItemResponse(
            asset_code="demo_polish",
            asset_label="demo polish",
            audit_status="audited",
            audit_status_label="已站穩",
            summary="`/demo` 已補成 guided showcase，而不是 raw dataset list。",
            next_step="",
        ),
        schemas.PhaseFiveAssetAuditItemResponse(
            asset_code="firm_operating",
            asset_label="firm operating surfaces",
            audit_status="audited",
            audit_status_label="已站穩",
            summary="首頁總覽已補上 role-aware 的 firm operating snapshot。",
            next_step="",
        ),
    ]


def build_phase_five_closure_review() -> schemas.PhaseFiveClosureReviewResponse:
    asset_audits = _build_asset_audits()
    completed_items = [
        "single-firm identity / access foundation 已成立",
        "personal provider settings 與 allowlist 已成立",
        "demo workspace isolation 已成立",
        "owner controls deepen 已成立",
        "demo polish 已成立",
        "firm operating surfaces 已成立",
    ]
    remaining_items = ["phase 5 sign-off 與下一階段 handoff"]

    return schemas.PhaseFiveClosureReviewResponse(
        phase_id="phase_5",
        phase_label="Single-Firm Cloud Foundation",
        closure_status="ready_to_close",
        closure_status_label="可準備收口",
        summary=(
            "phase 5 的 cloud foundation、provider boundary、demo boundary、owner controls 與 firm operating surface 已站穩，"
            "目前主要剩 explicit sign-off 與 next-phase handoff。"
        ),
        foundation_snapshot="目前已補 6 項主要子線｜剩 1 項收尾項目。",
        completed_count=len(completed_items) + len(asset_audits),
        remaining_count=len(remaining_items),
        completed_items=completed_items,
        asset_audits=asset_audits,
        remaining_items=remaining_items,
        recommended_next_step="若沒有新的 regression，就可準備做 phase 5 sign-off 與下一階段 handoff。",
    )
