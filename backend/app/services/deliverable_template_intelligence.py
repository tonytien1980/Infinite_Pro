from __future__ import annotations

from hashlib import sha1

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.domain import models, schemas
from app.domain.enums import DeliverableClass
from app.services.adoption_feedback_intelligence import matches_reusable_asset_reason


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
    template_label = ""
    template_fit_summary = ""
    core_sections: list[str] = []
    optional_sections: list[str] = []

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

    snapshots = _candidate_rows(
        db,
        [item.candidate_id for item in precedent_reference_guidance.matched_items[:2]],
    )
    if precedent_reference_guidance.status == "available":
        for matched in precedent_reference_guidance.matched_items[:2]:
            if not matches_reusable_asset_reason(
                matched.source_feedback_reason_codes,
                "deliverable_template",
            ):
                continue
            snapshot = snapshots.get(matched.candidate_id, {})
            candidate_label = _coerce_template_label(
                str(snapshot.get("template_label") or snapshot.get("current_output_label") or "")
            )
            if candidate_label and not template_label:
                template_label = candidate_label
            if not template_fit_summary:
                template_fit_summary = matched.match_reason or matched.summary or matched.reusable_reason
            raw_sections = snapshot.get("shape_sections")
            if isinstance(raw_sections, list) and not core_sections:
                normalized = _dedupe_sections(
                    [item for item in raw_sections if isinstance(item, str)]
                )
                core_sections = normalized[:4]
                optional_sections = normalized[4:6]
            add_block(
                title=f"先用{candidate_label or '這份模板'}站穩主線",
                summary=matched.summary or matched.reusable_reason or "先沿用相似 precedent 的模板主線。",
                why_fit=matched.match_reason or "目前已有相似 precedent，可先用它校正模板選型。",
                source_kind="precedent_deliverable_template",
                source_label="來源：precedent deliverable template",
                priority="high",
            )

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

    if domain_playbook_guidance.status != "none":
        add_block(
            title=f"模板主線先對齊到「{domain_playbook_guidance.current_stage_label or domain_playbook_guidance.playbook_label}」",
            summary=domain_playbook_guidance.summary or "先讓模板節奏對齊目前這類案件的工作主線。",
            why_fit=domain_playbook_guidance.next_stage_label or domain_playbook_guidance.boundary_note,
            source_kind="domain_playbook",
            source_label="來源：domain playbook",
            priority="medium",
        )

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
            boundary_note="這是在提示模板主線，不是自動套模板。",
        )

    return schemas.DeliverableTemplateGuidanceRead(
        status="available" if any(item.source_kind != "task_heuristic" for item in blocks) else "fallback",
        label="這份交付比較適合沿用哪種模板主線",
        summary="Host 先整理出較穩的模板主線，幫你知道這份交付更像哪一型正式模板。",
        template_label=template_label,
        template_fit_summary=template_fit_summary or fallback_fit,
        core_sections=core_sections,
        optional_sections=optional_sections,
        boundary_note="這是在提示模板主線，不是自動套模板；若和這案正式證據衝突，仍以這案當前判斷與證據為準。",
        blocks=blocks,
    )
