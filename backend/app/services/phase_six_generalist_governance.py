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

    return schemas.PhaseSixReuseBoundaryGovernanceResponse(
        phase_id="phase_6",
        phase_label="Generalist Consulting Intelligence Governance",
        governance_posture="guardrails_needed" if narrow_use_count > 0 else "stable",
        governance_posture_label="仍需治理邊界" if narrow_use_count > 0 else "目前治理較穩",
        summary=(
            "phase 6 現在已能更正式回答哪些 reusable assets 可擴大重用、"
            "哪些應維持局部參考、哪些不應被擴大套用。"
        ),
        generalizable_count=generalizable_count,
        contextual_count=contextual_count,
        narrow_use_count=narrow_use_count,
        governance_items=governance_items,
        recommended_next_step="若要繼續往下走，下一刀應把 reusable-intelligence guardrail 再往更正式的 Host weighting 規則推進。",
    )
