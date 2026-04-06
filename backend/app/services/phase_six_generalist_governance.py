from __future__ import annotations

from app.workbench import schemas


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
