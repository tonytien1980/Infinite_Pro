from __future__ import annotations

from hashlib import sha1

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.domain import models, schemas
from app.services.precedent_intelligence import select_weighted_precedent_reference_items


TASK_HEURISTIC_COMMON_RISKS: dict[str, list[tuple[str, str]]] = {
    "contract_review": [
        (
            "責任不對稱與 indemnity / liability 暴露",
            "這類案件最容易在條款不完整、附件未齊時低估責任暴露。",
        ),
        (
            "附件、定義、驗收條件或 termination 邏輯缺漏",
            "文件看似可審，但真正會卡住簽署與執行的常常是附件與終止邏輯缺口。",
        ),
        (
            "資料處理、授權流程或合規邊界未被正式寫清",
            "商務條件先行時，法遵與資料處理風險常被放到太後面才看見。",
        ),
    ],
    "research_synthesis": [
        (
            "把推論寫成事實",
            "研究綜整最常漏的是證據層次，而不是缺少更多句子。",
        ),
        (
            "來源時效與矛盾訊號被摘要吃掉",
            "一旦只剩濃縮摘要，來源新舊與彼此衝突最容易被忽略。",
        ),
        (
            "可執行建議和待補問題混在一起",
            "這會讓後續讀者誤把探索性內容當成已可採納結論。",
        ),
    ],
    "document_restructuring": [
        (
            "把重構做成重寫，丟掉原始必要訊息",
            "文件重構常見風險不是排版，而是把原本一定要保留的意思改沒了。",
        ),
        (
            "主線更順了，但適用邊界變模糊",
            "看起來更好讀，不代表更忠於原始決策目的與限制。",
        ),
    ],
    "complex_convergence": [
        (
            "把不同假設下的建議混成同一個答案",
            "複雜收斂最常漏的是邊界與前提，而不是缺少更多選項。",
        ),
        (
            "高影響依賴與落地阻塞被低估",
            "結論先成形時，執行依賴很容易被看成次要細節。",
        ),
        (
            "下一步很多，但沒有一個真的能先落地",
            "收斂後若沒有最先要做的那一步，團隊仍會停在抽象共識。",
        ),
    ],
}


def _normalize_common_risk_key(value: str) -> str:
    return " ".join(value.strip().lower().split())


def _build_common_risk_id(source_kind: str, title: str) -> str:
    return f"{source_kind}:{sha1(title.encode('utf-8')).hexdigest()[:12]}"


def _coerce_common_risk_title(risk: str) -> str:
    return risk.strip()


def _candidate_top_risks(
    db: Session,
    candidate_ids: list[str],
) -> dict[str, list[str]]:
    if not candidate_ids:
        return {}

    rows = db.scalars(
        select(models.PrecedentCandidate).where(models.PrecedentCandidate.id.in_(candidate_ids))
    ).all()
    result: dict[str, list[str]] = {}
    for row in rows:
        snapshot = dict(row.pattern_snapshot or {})
        raw_items = snapshot.get("top_risks")
        if not isinstance(raw_items, list):
            continue
        normalized = [
            item.strip()
            for item in raw_items
            if isinstance(item, str) and item.strip()
        ]
        if normalized:
            result[row.id] = normalized[:3]
    return result


def build_common_risk_guidance(
    db: Session,
    *,
    task_type: str,
    precedent_reference_guidance: schemas.PrecedentReferenceGuidanceRead,
    pack_resolution: schemas.PackResolutionRead,
) -> schemas.CommonRiskGuidanceRead:
    seen_keys: set[str] = set()
    risks: list[schemas.CommonRiskItemRead] = []

    def add_risk(
        *,
        title: str,
        summary: str,
        why_watch: str,
        source_kind: str,
        source_label: str,
        priority: str,
    ) -> None:
        normalized_title = _coerce_common_risk_title(title)
        key = _normalize_common_risk_key(normalized_title)
        if not normalized_title or key in seen_keys or len(risks) >= 4:
            return
        seen_keys.add(key)
        risks.append(
            schemas.CommonRiskItemRead(
                risk_id=_build_common_risk_id(source_kind, normalized_title),
                title=normalized_title,
                summary=summary,
                why_watch=why_watch,
                source_kind=source_kind,  # type: ignore[arg-type]
                source_label=source_label,
                priority=priority,  # type: ignore[arg-type]
            )
        )

    weighted_matches = select_weighted_precedent_reference_items(
        precedent_reference_guidance,
        asset_code="common_risk",
        limit=2,
    )
    precedent_top_risks = _candidate_top_risks(
        db,
        [item.candidate_id for item in weighted_matches],
    )
    if weighted_matches:
        for matched in weighted_matches:
            for title in precedent_top_risks.get(matched.candidate_id, [])[:2]:
                add_risk(
                    title=title,
                    summary="這是相似 precedent 已留下的高頻風險模式，適合先做漏看掃描。",
                    why_watch=matched.match_reason or "目前已有相似 precedent，可先拿這類風險做對照。",
                    source_kind="precedent_risk_pattern",
                    source_label=(
                        "來源：precedent risk pattern（共享模式優先）"
                        if matched.shared_intelligence_signal.weight_action == "upweight"
                        else "來源：precedent risk pattern"
                    ),
                    priority="high",
                )

    for risk_title in pack_resolution.common_risks[:3]:
        add_risk(
            title=risk_title,
            summary="這是目前 selected packs 的常見風險，適合先掃一遍是否被漏看。",
            why_watch="這類案件若只看主問題與結論，常把這種高頻風險放到太後面才注意到。",
            source_kind="pack_common_risk",
            source_label="來源：pack common risk",
            priority="high" if len(risks) == 0 else "medium",
        )

    if len(risks) < 2:
        for title, why_watch in TASK_HEURISTIC_COMMON_RISKS.get(task_type, []):
            add_risk(
                title=title,
                summary="目前 precedent / pack 訊號仍偏薄，先用 task heuristic 補最小可信風險掃描提醒。",
                why_watch=why_watch,
                source_kind="task_heuristic",
                source_label="來源：task heuristic",
                priority="medium",
            )

    if not risks:
        return schemas.CommonRiskGuidanceRead(
            status="none",
            label="目前沒有額外 common risk watchouts",
            summary="這一輪先依現有證據與主問題推進，不額外補 common risk libraries。",
            boundary_note="common risk libraries 是在提醒這類案子常漏哪些風險，不代表這案已經發生。",
        )

    return schemas.CommonRiskGuidanceRead(
        status="available" if any(item.source_kind != "task_heuristic" for item in risks) else "fallback",
        label="這類案件常漏哪些風險",
        summary=f"Host 先整理出 {len(risks)} 個 common risk watchouts，提醒你不要漏看高頻風險。",
        boundary_note="這些是 common risk watchouts，不代表這案已經發生；若要成立正式風險，仍須由這案的證據與分析支撐。",
        risks=risks,
    )
