from __future__ import annotations

from hashlib import sha1

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.domain import models, schemas
from app.domain.enums import AdoptionFeedbackStatus, DeliverableClass
from app.services.phase_six_generalist_governance import (
    recommend_phase_six_reuse_weighting,
)
from app.services.precedent_intelligence import select_weighted_precedent_reference_items
from app.services.shared_source_lifecycle_intelligence import (
    build_feedback_linked_decay_summary,
    build_feedback_linked_reactivation_summary,
    build_recovery_balance_summary,
    resolve_shared_source_lifecycle_state,
)


TASK_HEURISTIC_TEMPLATES: dict[str, dict[str, object]] = {
    "contract_review": {
        "template_label": "合約審閱備忘模板",
        "core_sections": ["一句話結論", "主要發現", "主要風險", "建議處置"],
        "optional_sections": ["待補資料", "已審範圍", "主要義務"],
        "fit_summary": "這輪仍屬 review / assessment 主線，先站穩審閱備忘模板會更可靠。",
    },
    "research_synthesis": {
        "template_label": "研究整理備忘模板",
        "core_sections": ["一句話結論", "主要發現", "來源品質", "主要風險"],
        "optional_sections": ["下一步行動", "待補資料"],
        "fit_summary": "研究綜整先用整理備忘模板，比太早拉成最終決策版本更穩。",
    },
    "document_restructuring": {
        "template_label": "重構建議模板",
        "core_sections": ["一句話結論", "主要發現", "建議結構", "改寫方向"],
        "optional_sections": ["待補資料", "背景與問題"],
        "fit_summary": "這輪更適合先用重構建議模板，把新結構與改寫方向站穩。",
    },
    "complex_convergence": {
        "template_label": "決策 / 行動建議模板",
        "core_sections": ["一句話結論", "主要發現", "主要風險", "建議處置"],
        "optional_sections": ["下一步行動", "待補資料"],
        "fit_summary": "複雜收斂更適合直接用決策 / 行動模板，先把 judgment 與 action 放前面。",
    },
}


def _normalize_key(value: str) -> str:
    return " ".join(value.strip().lower().split())


def _build_block_id(source_kind: str, title: str) -> str:
    return f"{source_kind}:{sha1(title.encode('utf-8')).hexdigest()[:12]}"


def _coerce_template_label(value: str) -> str:
    label = value.strip()
    if not label:
        return ""
    if label.endswith("模板"):
        return label
    return f"{label}模板"


def _candidate_rows(db: Session, candidate_ids: list[str]) -> dict[str, dict]:
    if not candidate_ids:
        return {}
    rows = db.scalars(
        select(models.PrecedentCandidate).where(models.PrecedentCandidate.id.in_(candidate_ids))
    ).all()
    return {row.id: dict(row.pattern_snapshot or {}) for row in rows}


def _dedupe_sections(items: list[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for item in items:
        value = item.strip()
        key = _normalize_key(value)
        if not value or key in seen:
            continue
        seen.add(key)
        result.append(value)
    return result


def _fallback_template(
    task_type: str,
    deliverable_class_hint: DeliverableClass,
) -> tuple[str, list[str], list[str], str]:
    heuristic = TASK_HEURISTIC_TEMPLATES.get(task_type)
    if heuristic:
        return (
            str(heuristic["template_label"]),
            list(heuristic["core_sections"]),  # type: ignore[arg-type]
            list(heuristic["optional_sections"]),  # type: ignore[arg-type]
            str(heuristic["fit_summary"]),
        )
    if deliverable_class_hint == DeliverableClass.DECISION_ACTION_DELIVERABLE:
        return (
            "決策 / 行動建議模板",
            ["一句話結論", "主要發現", "主要風險", "建議處置"],
            ["下一步行動", "待補資料"],
            "這輪更像正式 decision / action 模板，而不是 exploratory memo。",
        )
    if deliverable_class_hint == DeliverableClass.ASSESSMENT_REVIEW_MEMO:
        return (
            "評估 / 審閱備忘模板",
            ["一句話結論", "主要發現", "主要風險", "建議處置"],
            ["待補資料", "背景與問題"],
            "這輪仍屬評估 / 審閱模板，先把 judgment 與風險站穩最重要。",
        )
    return (
        "探索 / 診斷備忘模板",
        ["一句話結論", "主要發現", "主要風險"],
        ["建議處置", "待補資料"],
        "目前仍適合先用探索 / 診斷模板，而不是太早切成正式決策模板。",
    )

def build_deliverable_template_guidance(
    db: Session,
    *,
    task_type: str,
    deliverable_class_hint: DeliverableClass,
    precedent_reference_guidance: schemas.PrecedentReferenceGuidanceRead,
    pack_resolution: schemas.PackResolutionRead,
    domain_playbook_guidance: schemas.DomainPlaybookGuidanceRead,
    deliverable_shape_guidance: schemas.DeliverableShapeGuidanceRead,
) -> schemas.DeliverableTemplateGuidanceRead:
    blocks: list[schemas.DeliverableTemplateBlockRead] = []
    seen_keys: set[str] = set()
    source_kinds_used: list[str] = []
    template_label = ""
    template_fit_summary = ""
    freshness_summary = ""
    reactivation_summary = ""
    feedback_reactivation_summary = ""
    decay_summary = ""
    has_authoritative_source = False
    has_fresh_shared_source = False
    has_stale_shared_source = False
    core_sections: list[str] = []
    optional_sections: list[str] = []
    has_alternative_template_anchor = (
        bool(pack_resolution.deliverable_presets)
        or deliverable_shape_guidance.status != "none"
        or domain_playbook_guidance.status != "none"
    )

    def add_block(
        *,
        title: str,
        summary: str,
        why_fit: str,
        source_kind: str,
        source_label: str,
        priority: str,
    ) -> None:
        key = _normalize_key(title)
        if not title or key in seen_keys or len(blocks) >= 4:
            return
        seen_keys.add(key)
        if source_kind not in source_kinds_used:
            source_kinds_used.append(source_kind)
        blocks.append(
            schemas.DeliverableTemplateBlockRead(
                block_id=_build_block_id(source_kind, title),
                title=title,
                summary=summary,
                why_fit=why_fit,
                source_kind=source_kind,  # type: ignore[arg-type]
                source_label=source_label,
                priority=priority,  # type: ignore[arg-type]
            )
        )

    weighted_matches = select_weighted_precedent_reference_items(
        precedent_reference_guidance,
        asset_code="deliverable_template",
        limit=2,
    )
    stable_precedent_matches = [
        item for item in weighted_matches if item.shared_intelligence_signal.stability == "stable"
    ]
    snapshots = _candidate_rows(
        db,
        [item.candidate_id for item in weighted_matches],
    )
    if weighted_matches:
        for matched in weighted_matches:
            reuse_recommendation, _, reuse_guardrail_note, _ = recommend_phase_six_reuse_weighting(
                asset_code="deliverable_template",
                reason_codes=matched.source_feedback_reason_codes,
                weight_action=matched.shared_intelligence_signal.weight_action,
                stability=matched.shared_intelligence_signal.stability,
                strength=matched.optimization_signal.strength,
            )
            feedback_decay_summary = build_feedback_linked_decay_summary(
                matched.source_feedback_status,
                subject_label="模板主線",
            )
            restrict_to_background = (
                reuse_recommendation == "restrict_narrow_use"
                and has_alternative_template_anchor
            )
            precedent_is_background_only = (
                matched.shared_intelligence_signal.stability != "stable"
                or bool(feedback_decay_summary)
                or matched.shared_intelligence_signal.weight_action == "downweight"
                or restrict_to_background
            )
            snapshot = snapshots.get(matched.candidate_id, {})
            candidate_label = _coerce_template_label(
                str(snapshot.get("template_label") or snapshot.get("current_output_label") or "")
            )
            if candidate_label and not template_label and not precedent_is_background_only:
                template_label = candidate_label
            if not template_fit_summary and not precedent_is_background_only:
                template_fit_summary = matched.match_reason or matched.summary or matched.reusable_reason
            raw_sections = snapshot.get("shape_sections")
            if isinstance(raw_sections, list) and not core_sections and not precedent_is_background_only:
                normalized = _dedupe_sections(
                    [item for item in raw_sections if isinstance(item, str)]
                )
                core_sections = normalized[:4]
                optional_sections = normalized[4:6]
            add_block(
                title=f"先用{candidate_label or '這份模板'}站穩主線",
                summary=matched.summary or matched.reusable_reason or "先沿用相似 precedent 的模板主線。",
                why_fit=(
                    "這筆 precedent 目前仍偏觀察 / 恢復期，先拿來校正模板，不讓它單獨主導模板主線。"
                    if precedent_is_background_only
                    else matched.match_reason or "目前已有相似 precedent，可先用它校正模板選型。"
                ),
                source_kind="precedent_deliverable_template",
                source_label=(
                    "來源：precedent deliverable template（先留背景）"
                    if precedent_is_background_only
                    else (
                        "來源：precedent deliverable template（共享模式優先）"
                        if matched.shared_intelligence_signal.weight_action == "upweight"
                        else "來源：precedent deliverable template"
                    )
                ),
                priority="medium" if precedent_is_background_only else "high",
            )
            if not precedent_is_background_only:
                has_authoritative_source = True
                has_fresh_shared_source = True
                if not feedback_reactivation_summary:
                    feedback_reactivation_summary = build_feedback_linked_reactivation_summary(
                        matched.source_feedback_status,
                        subject_label="模板主線",
                    )
                
            else:
                has_stale_shared_source = True
                if feedback_decay_summary and not decay_summary:
                    decay_summary = feedback_decay_summary
                elif restrict_to_background and not decay_summary:
                    decay_summary = reuse_guardrail_note

    if not template_label and pack_resolution.deliverable_presets:
        template_label = _coerce_template_label(pack_resolution.deliverable_presets[0])
    for preset in pack_resolution.deliverable_presets[:2]:
        add_block(
            title=f"先沿用「{_coerce_template_label(preset)}」這條模板主線",
            summary="selected packs 已提供這類案件較穩的 deliverable preset，可先用來定模板主線。",
            why_fit="先定模板主線，會比一開始就直接散寫內容更穩。",
            source_kind="pack_deliverable_preset",
            source_label="來源：pack deliverable preset",
            priority="medium",
        )
        has_authoritative_source = True

    if deliverable_shape_guidance.status != "none":
        shape_title = deliverable_shape_guidance.primary_shape_label or "目前交付骨架"
        add_block(
            title=f"模板主線先對齊到「{shape_title}」這個交付骨架",
            summary=deliverable_shape_guidance.summary or "先讓模板主線與目前交付骨架一致。",
            why_fit=deliverable_shape_guidance.boundary_note or "先守住交付骨架，模板主線才不會太早漂掉。",
            source_kind="deliverable_shape",
            source_label="來源：deliverable shape",
            priority="medium",
        )
        has_authoritative_source = True

    if domain_playbook_guidance.status != "none":
        add_block(
            title=f"模板主線先對齊到「{domain_playbook_guidance.current_stage_label or domain_playbook_guidance.playbook_label}」",
            summary=domain_playbook_guidance.summary or "先讓模板節奏對齊目前這類案件的工作主線。",
            why_fit=(
                domain_playbook_guidance.fit_summary
                or domain_playbook_guidance.next_stage_label
                or domain_playbook_guidance.boundary_note
            ),
            source_kind="domain_playbook",
            source_label="來源：domain playbook",
            priority="medium",
        )
        if domain_playbook_guidance.status == "available":
            has_authoritative_source = True
        if domain_playbook_guidance.freshness_summary:
            if "近期仍可直接參考" in domain_playbook_guidance.freshness_summary or "新舊並存" in domain_playbook_guidance.freshness_summary:
                has_fresh_shared_source = True
            else:
                has_stale_shared_source = True
        if domain_playbook_guidance.reactivation_summary:
            has_fresh_shared_source = True
            has_stale_shared_source = True

    fallback_label, fallback_core, fallback_optional, fallback_fit = _fallback_template(
        task_type,
        deliverable_class_hint,
    )
    if not template_label:
        template_label = fallback_label
    if not template_fit_summary:
        template_fit_summary = fallback_fit
    if not core_sections:
        core_sections = deliverable_shape_guidance.section_hints[:4] or fallback_core
    if not optional_sections:
        optional_sections = deliverable_shape_guidance.section_hints[4:6] or fallback_optional

    add_block(
        title=f"先用{fallback_label}這種模板主線",
        summary="目前 precedent / pack 訊號仍偏薄，先用 task heuristic 補最小可信模板主線。",
        why_fit=fallback_fit,
        source_kind="task_heuristic",
        source_label="來源：task heuristic",
        priority="medium",
    )

    core_sections = _dedupe_sections(core_sections)[:4]
    optional_sections = [
        item
        for item in _dedupe_sections(optional_sections)[:4]
        if _normalize_key(item) not in {_normalize_key(section) for section in core_sections}
    ]

    if not template_label:
        return schemas.DeliverableTemplateGuidanceRead(
            status="none",
            label="目前沒有額外 deliverable template guidance",
            summary="這一輪先依現有證據與主問題推進，不額外補模板主線提示。",
            fit_summary="",
            source_mix_summary="",
            source_lifecycle_summary="",
            boundary_note="這是在提示模板主線，不是自動套模板。",
        )

    fit_parts: list[str] = []
    if precedent_reference_guidance.status == "available":
        fit_parts.append("已有可參考的 precedent 模板主線")
    if deliverable_shape_guidance.status != "none":
        fit_parts.append("交付骨架已先收斂")
    if domain_playbook_guidance.status != "none":
        fit_parts.append("playbook 主線已經站穩")
    if any(item.source_kind == "pack_deliverable_preset" for item in blocks):
        fit_parts.append("pack deliverable preset 可補模板主線")
    if not fit_parts:
        fit_parts.append("目前仍以 task heuristic 補最小可信模板主線")
    fit_summary = "這輪為何適用：" + "、".join(fit_parts) + "。"

    source_label_map = {
        "precedent_deliverable_template": "precedent deliverable template",
        "pack_deliverable_preset": "pack deliverable preset",
        "deliverable_shape": "deliverable shape",
        "domain_playbook": "domain playbook",
        "task_heuristic": "task heuristic",
    }
    source_mix_summary = "收斂依據：" + "、".join(
        source_label_map[item] for item in source_kinds_used if item in source_label_map
    )
    if has_fresh_shared_source and has_stale_shared_source:
        freshness_summary = "shared sources 目前新舊並存，先讓近期來源站前面，偏舊來源仍留背景校正。"
        reactivation_summary = (
            feedback_reactivation_summary
            or "較新的 shared source 已回來，這輪可重新讓模板主線站前面；偏舊來源仍留背景校正。"
        )
    elif has_fresh_shared_source:
        freshness_summary = "shared sources 近期仍可直接參考，模板主線可以繼續沿用。"
    elif has_stale_shared_source:
        freshness_summary = "shared sources 目前偏舊或仍在恢復，先讓較新的 pack / shape / task heuristic 站在前面。"
    recovery_balance_summary = build_recovery_balance_summary(
        reactivation_summary=reactivation_summary,
        decay_summary=decay_summary,
        subject_label="模板主線",
    )
    lifecycle_state = resolve_shared_source_lifecycle_state(
        has_fresh_shared_source=has_fresh_shared_source,
        has_stale_shared_source=has_stale_shared_source,
        has_authoritative_source=has_authoritative_source,
        recovery_balance_summary=recovery_balance_summary,
        balanced_summary="shared sources 目前進入平衡期，先讓較穩的新來源帶模板主線，其餘仍留背景觀察。",
        foreground_summary="shared sources 目前以穩定來源為主，可直接拿來校正模板主線。",
        background_summary="shared sources 目前仍偏背景校正，較舊或恢復中的 shared source 先退到背景，不要主導模板主線。",
        thin_summary="目前仍以 pack / shape / task heuristic 為主，shared source 還不夠厚。",
    )

    return schemas.DeliverableTemplateGuidanceRead(
        status="available" if has_authoritative_source else "fallback",
        label="這份交付比較適合沿用哪種模板主線",
        summary="Host 先整理出較穩的模板主線，幫你知道這份交付更像哪一型正式模板。",
        template_label=template_label,
        template_fit_summary=template_fit_summary or fallback_fit,
        fit_summary=fit_summary,
        source_mix_summary=source_mix_summary,
        source_lifecycle_summary=lifecycle_state.source_lifecycle_summary,
        lifecycle_posture=lifecycle_state.lifecycle_posture,
        lifecycle_posture_label=lifecycle_state.lifecycle_posture_label,
        freshness_summary=freshness_summary,
        reactivation_summary=reactivation_summary,
        decay_summary=decay_summary,
        recovery_balance_summary=lifecycle_state.recovery_balance_summary,
        core_sections=core_sections,
        optional_sections=optional_sections,
        boundary_note="這是在提示模板主線，不是自動套模板；若和這案正式證據衝突，仍以這案當前判斷與證據為準。",
        blocks=blocks,
    )
