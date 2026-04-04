from __future__ import annotations

from hashlib import sha1

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.domain import models, schemas
from app.domain.enums import DeliverableClass
from app.services.adoption_feedback_intelligence import matches_reusable_asset_reason


TASK_HEURISTIC_SHAPES: dict[str, tuple[str, list[str], str]] = {
    "contract_review": (
        "評估 / 審閱備忘",
        ["一句話結論", "主要發現", "主要風險", "建議處置", "待補資料"],
        "這輪仍屬合約審閱主線，先把 review / assessment 站穩，比直接假裝已完成最終決策版本更可靠。",
    ),
    "research_synthesis": (
        "研究整理備忘",
        ["一句話結論", "主要發現", "來源品質", "主要風險", "下一步行動"],
        "研究綜整更適合先把發現、風險與下一步整理清楚，而不是直接長成最終行動方案。",
    ),
    "document_restructuring": (
        "重構 / 改寫建議",
        ["一句話結論", "主要發現", "建議結構", "改寫方向", "待補資料"],
        "文件重構主線需要先把新結構和改寫方向講清楚，再談最後版本。",
    ),
    "complex_convergence": (
        "決策 / 行動交付",
        ["一句話結論", "主要發現", "主要風險", "建議處置", "下一步行動"],
        "複雜收斂通常要直接服務決策與下一步，所以交付骨架要先把 judgment 與 action 放前面。",
    ),
}

SECTION_LABEL_ALIASES = {
    "問題定義": "背景與問題",
    "background_summary": "背景與脈絡",
    "背景摘要": "背景與脈絡",
    "executive_summary": "一句話結論",
    "findings": "主要發現",
    "recommendations": "建議處置",
    "risks": "主要風險",
    "action_items": "下一步行動",
    "missing_information": "待補資料",
    "clauses_reviewed": "已審範圍",
    "已審條款": "已審範圍",
    "obligations_identified": "主要義務",
    "義務清單": "主要義務",
    "proposed_outline": "建議結構",
    "rewrite_guidance": "改寫方向",
}

SECTION_DISPLAY_ORDER = {
    "一句話結論": 0,
    "主要發現": 1,
    "主要風險": 2,
    "建議處置": 3,
    "下一步行動": 4,
    "待補資料": 5,
    "背景與問題": 6,
    "背景與脈絡": 7,
    "已審範圍": 8,
    "主要義務": 9,
    "建議結構": 10,
    "改寫方向": 11,
}


def _normalize_shape_key(value: str) -> str:
    return " ".join(value.strip().lower().split())


def _build_shape_hint_id(source_kind: str, title: str) -> str:
    return f"{source_kind}:{sha1(title.encode('utf-8')).hexdigest()[:12]}"


def _candidate_shape_rows(db: Session, candidate_ids: list[str]) -> dict[str, dict]:
    if not candidate_ids:
        return {}
    rows = db.scalars(
        select(models.PrecedentCandidate).where(models.PrecedentCandidate.id.in_(candidate_ids))
    ).all()
    result: dict[str, dict] = {}
    for row in rows:
        result[row.id] = dict(row.pattern_snapshot or {})
    return result


def _fallback_shape_for_class(deliverable_class_hint: DeliverableClass) -> str:
    if deliverable_class_hint == DeliverableClass.DECISION_ACTION_DELIVERABLE:
        return "決策 / 行動交付"
    if deliverable_class_hint == DeliverableClass.ASSESSMENT_REVIEW_MEMO:
        return "評估 / 審閱備忘"
    return "探索 / 診斷備忘"


def _normalize_section_label(value: str) -> str:
    raw = value.strip()
    if not raw:
        return ""
    return SECTION_LABEL_ALIASES.get(raw, raw)


def _normalize_and_sort_sections(items: list[str]) -> list[str]:
    normalized: list[str] = []
    seen: set[str] = set()
    for item in items:
        label = _normalize_section_label(item)
        key = _normalize_shape_key(label)
        if not label or key in seen:
            continue
        seen.add(key)
        normalized.append(label)
    return sorted(
        normalized,
        key=lambda item: (SECTION_DISPLAY_ORDER.get(item, 99), normalized.index(item)),
    )[:5]


def build_deliverable_shape_guidance(
    db: Session,
    *,
    task_type: str,
    deliverable_class_hint: DeliverableClass,
    precedent_reference_guidance: schemas.PrecedentReferenceGuidanceRead,
    pack_resolution: schemas.PackResolutionRead,
) -> schemas.DeliverableShapeGuidanceRead:
    seen_keys: set[str] = set()
    hints: list[schemas.DeliverableShapeHintRead] = []
    section_hints: list[str] = []
    primary_shape_label = ""

    def add_hint(
        *,
        title: str,
        summary: str,
        why_fit: str,
        source_kind: str,
        source_label: str,
        priority: str,
    ) -> None:
        key = _normalize_shape_key(title)
        if not title or key in seen_keys or len(hints) >= 3:
            return
        seen_keys.add(key)
        hints.append(
            schemas.DeliverableShapeHintRead(
                hint_id=_build_shape_hint_id(source_kind, title),
                title=title,
                summary=summary,
                why_fit=why_fit,
                source_kind=source_kind,  # type: ignore[arg-type]
                source_label=source_label,
                priority=priority,  # type: ignore[arg-type]
            )
        )

    snapshots = _candidate_shape_rows(
        db,
        [item.candidate_id for item in precedent_reference_guidance.matched_items[:2]],
    )
    if precedent_reference_guidance.status == "available":
        for matched in precedent_reference_guidance.matched_items[:2]:
            if not matches_reusable_asset_reason(
                matched.source_feedback_reason_codes,
                "deliverable_shape",
            ):
                continue
            snapshot = snapshots.get(matched.candidate_id, {})
            if not primary_shape_label:
                primary_shape_label = str(snapshot.get("current_output_label") or "").strip()
            if not section_hints:
                raw_sections = snapshot.get("shape_sections")
                if isinstance(raw_sections, list):
                    section_hints = _normalize_and_sort_sections([
                        item.strip()
                        for item in raw_sections
                        if isinstance(item, str) and item.strip()
                    ])
            add_hint(
                title=f"先用{str(snapshot.get('current_output_label') or '這份交付骨架').strip() or '這份交付骨架'}收斂",
                summary=matched.summary or matched.reusable_reason or "先沿用相似 precedent 的交付骨架。",
                why_fit=matched.match_reason or "目前已有相似 precedent，先用它校正交付收斂方式。",
                source_kind="precedent_deliverable_pattern",
                source_label="來源：precedent deliverable pattern",
                priority="high",
            )

    if not primary_shape_label and pack_resolution.deliverable_presets:
        primary_shape_label = pack_resolution.deliverable_presets[0]
    for preset in pack_resolution.deliverable_presets[:2]:
        add_hint(
            title=f"先朝「{preset}」這種交付姿態收斂",
            summary="selected packs 已提供這類案件較穩的交付預設，可先用來定交付骨架。",
            why_fit="這份交付若先照 pack deliverable preset 收，會比較不容易把 review、decision 與 action 混在一起。",
            source_kind="pack_deliverable_preset",
            source_label="來源：pack deliverable preset",
            priority="medium",
        )

    heuristic_shape, heuristic_sections, heuristic_why = TASK_HEURISTIC_SHAPES.get(
        task_type,
        (
            _fallback_shape_for_class(deliverable_class_hint),
            ["一句話結論", "主要發現", "主要風險", "建議處置", "待補資料"],
            "目前 precedent / pack 訊號仍偏薄，先用 task heuristic 補最小可信交付骨架。",
        ),
    )
    if not primary_shape_label:
        primary_shape_label = heuristic_shape
    if not section_hints:
        section_hints = heuristic_sections[:5]
    else:
        section_hints = _normalize_and_sort_sections(section_hints)
    add_hint(
        title=f"先用{heuristic_shape}這種交付骨架",
        summary="目前 precedent / pack 訊號仍偏薄，先用 task heuristic 定最小可信交付形態。",
        why_fit=heuristic_why,
        source_kind="task_heuristic",
        source_label="來源：task heuristic",
        priority="medium",
    )

    if not primary_shape_label:
        return schemas.DeliverableShapeGuidanceRead(
            status="none",
            label="目前沒有額外 deliverable shape hints",
            summary="這一輪先依現有證據與主問題推進，不額外補交付骨架提示。",
            boundary_note="deliverable shape hints 是在提示交付骨架，不是自動套模板。",
        )

    return schemas.DeliverableShapeGuidanceRead(
        status="available" if any(item.source_kind != "task_heuristic" for item in hints) else "fallback",
        label="這份交付物通常怎麼收比較穩",
        summary="Host 先整理出這輪較穩的交付骨架，幫你把最後收斂方式定清楚。",
        primary_shape_label=primary_shape_label,
        section_hints=section_hints[:5],
        boundary_note="這是在提示交付骨架，不是自動套模板；若和這案正式證據衝突，仍以這案當前判斷與證據為準。",
        hints=hints,
    )
