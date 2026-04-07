from __future__ import annotations

from app.workbench import schemas

REUSE_WEIGHTING_RANK = {
    "can_expand": 0,
    "keep_contextual": 1,
    "restrict_narrow_use": 2,
}


def build_phase_six_maturity_review() -> schemas.PhaseSixMaturityReviewResponse:
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
            "coverage、boundary、weighting、propagation 與 second-layer guardrails 都已站穩。"
        ),
        maturity_snapshot="已完成 17 個 slice｜目前屬於 refinement lane，不是新的基礎施工期。",
        completed_count=17,
        remaining_count=len(remaining_focus_items),
        milestone_audits=milestone_audits,
        remaining_focus_items=remaining_focus_items,
        recommended_next_step=(
            "下一刀應優先處理 Phase 6 的 runtime feedback loop / closure criteria，"
            "而不是再繼續往 note wording 微調。"
        ),
    )


def build_phase_six_closure_criteria_review(
    *,
    feedback_signal_count: int,
    governed_outcome_count: int,
) -> schemas.PhaseSixClosureCriteriaReviewResponse:
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
            "真正還差的是 feedback loop depth 與 completion review flow。"
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
        recommended_next_step=(
            "下一刀應優先把 feedback-linked evidence 更正式接回 persisted scoring / completion review，"
            "而不是再新增新的 note micro-slice。"
        ),
    )


def build_phase_six_completion_review(
    *,
    closure_review: schemas.PhaseSixClosureCriteriaReviewResponse,
    checkpoint_state: dict | None = None,
) -> schemas.PhaseSixCompletionReviewResponse:
    runtime_score = 84
    propagation_score = 86
    feedback_loop_score = (
        82
        if closure_review.feedback_signal_count >= 3 and closure_review.governed_outcome_count >= 2
        else 64
        if closure_review.feedback_signal_count > 0 or closure_review.governed_outcome_count > 0
        else 38
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
            summary=closure_review.feedback_loop_summary,
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
        f"最近一次 checkpoint 由 {checkpoint_state.get('checkpointed_by_label') or 'owner'} 記錄，當時總分 {overall_score}。"
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
            "下一刀應把這份 checkpoint 與 feedback-linked evidence 更正式接回 persisted governance scoring / next-phase handoff。"
            if signed_off
            else "下一刀應把這份 checkpoint 與 feedback-linked evidence 更正式接回 persisted governance scoring，而不是直接跳 sign-off。"
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
) -> schemas.PhaseSixGeneralistGuidancePostureResponse:
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
) -> schemas.PhaseSixContextDistanceAuditResponse:
    source_audit = audit or build_phase_six_capability_coverage_audit()
    source_governance = governance or build_phase_six_reuse_boundary_governance(
        audit=source_audit,
    )

    distance_items: list[schemas.PhaseSixContextDistanceItemRead] = []
    for item in source_governance.governance_items:
        if item.reuse_recommendation == "can_expand":
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
) -> schemas.PhaseSixConfidenceCalibrationResponse:
    source_distance = context_distance or build_phase_six_context_distance_audit()
    calibration_items: list[schemas.PhaseSixConfidenceCalibrationItemRead] = [
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
) -> schemas.PhaseSixCalibrationAwareWeightingResponse:
    source_calibration = calibration or build_phase_six_confidence_calibration()
    weighting_items: list[schemas.PhaseSixCalibrationAwareWeightingItemRead] = []

    for item in source_calibration.calibration_items:
        if item.axis_kind == "domain_lens" and item.calibration_status == "mismatch":
            weighting_effect = "background_only"
            weighting_effect_label = "先留背景校正"
            summary = "domain lens 不對齊時，就算共享訊號穩，也先不要讓這類來源單獨帶主線。"
        elif item.calibration_status == "caution":
            weighting_effect = "keep_contextual"
            weighting_effect_label = "先保留邊界"
            summary = "這條 calibration axis 若仍有距離，Host 應把 reusable source 留在 contextual reuse。"
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
        ),
        host_weighting_summary=(
            "Host 現在會先看 domain lens 是否對齊；若不對齊，就算 shared intelligence 穩，也先留背景校正。"
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
