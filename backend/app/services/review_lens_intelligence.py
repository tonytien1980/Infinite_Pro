from __future__ import annotations

from hashlib import sha1

from app.domain import schemas
from app.domain.enums import DeliverableClass, InputEntryMode


TASK_HEURISTIC_LENSES: dict[str, list[tuple[str, str]]] = {
    "contract_review": [
        (
            "先看終止條款與義務邊界",
            "這類合約審閱最容易先卡在終止、續約、驗收與履約責任邊界。",
        ),
        (
            "再看責任限制與賠償風險",
            "責任不對稱、liability cap 與 indemnity 通常最容易直接改變決策邊界。",
        ),
        (
            "確認附件、定義與資料條款是否缺漏",
            "附件、SLA、資料處理或定義缺漏，常讓表面可簽的合約在執行時失真。",
        ),
    ],
    "research_synthesis": [
        (
            "先分清事實、推論與待驗證事項",
            "研究綜整最怕把推論寫成既成事實，所以先分清證據層次。",
        ),
        (
            "再看主要結論是否真的有證據支撐",
            "先確認最重要的判斷有沒有被正式證據與來源脈絡站穩。",
        ),
        (
            "把建議與後續待查分開",
            "避免把可執行建議和仍待補證據的問題混在一起。",
        ),
    ],
    "document_restructuring": [
        (
            "先看受眾與這份文件的目的",
            "文件重構先要搞清楚是給誰看、要推進什麼，不然只會改表面順序。",
        ),
        (
            "再看結構順序與主線是否清楚",
            "先確認主結論、支撐點與段落順序有沒有真的服務讀者判斷。",
        ),
        (
            "確認哪些原始訊息必須保留",
            "重構不是重寫成另一份文件，要先守住不能被稀釋的內容。",
        ),
    ],
    "complex_convergence": [
        (
            "先看決策界線與取捨依據",
            "複雜收斂最先要確認的是這輪到底要替誰收斂哪個決策。",
        ),
        (
            "再看高影響風險與執行依賴",
            "避免只剩抽象方向，卻沒看到真正會卡住落地的條件。",
        ),
        (
            "確認哪個建議最值得先落地",
            "先把下一個最有價值的動作定清楚，避免收斂後還是無法推進。",
        ),
    ],
}


def _normalize_lens_key(value: str) -> str:
    return " ".join(value.strip().lower().split())


def _build_lens_id(source_kind: str, title: str) -> str:
    return f"{source_kind}:{sha1(title.encode('utf-8')).hexdigest()[:12]}"


def _coerce_decision_pattern_title(pattern: str) -> str:
    pattern = pattern.strip()
    if pattern.startswith("是否"):
        return f"先釐清：{pattern}"
    if pattern.startswith("先"):
        return pattern
    return f"先看：{pattern}"


def _coerce_common_risk_title(risk: str) -> str:
    risk = risk.strip()
    if risk.startswith("先"):
        return risk
    return f"先檢查：{risk}"


def build_review_lens_guidance(
    *,
    task_type: str,
    flagship_lane: schemas.FlagshipLaneRead,
    deliverable_class_hint: DeliverableClass,
    input_entry_mode: InputEntryMode,
    precedent_reference_guidance: schemas.PrecedentReferenceGuidanceRead,
    pack_resolution: schemas.PackResolutionRead,
) -> schemas.ReviewLensGuidanceRead:
    seen_keys: set[str] = set()
    lenses: list[schemas.ReviewLensItemRead] = []

    def add_lens(
        *,
        title: str,
        summary: str,
        why_now: str,
        source_kind: str,
        source_label: str,
        priority: str,
    ) -> None:
        key = _normalize_lens_key(title)
        if not title or key in seen_keys or len(lenses) >= 4:
            return
        seen_keys.add(key)
        lenses.append(
            schemas.ReviewLensItemRead(
                lens_id=_build_lens_id(source_kind, title),
                title=title,
                summary=summary,
                why_now=why_now,
                source_kind=source_kind,  # type: ignore[arg-type]
                source_label=source_label,
                priority=priority,  # type: ignore[arg-type]
            )
        )

    if precedent_reference_guidance.status == "available" and precedent_reference_guidance.matched_items:
        top_match = precedent_reference_guidance.matched_items[0]
        add_lens(
            title=f"先比對這次案件與「{top_match.title or '既有模式'}」的差異點",
            summary=top_match.summary or top_match.reusable_reason or "先回看這個既有模式目前代表的審閱骨架。",
            why_now=top_match.match_reason or "目前找到高度相似的既有模式，先用它校正審閱方向。",
            source_kind="precedent_reference",
            source_label="來源：precedent reference",
            priority="high",
        )

    for pattern in pack_resolution.decision_patterns[:2]:
        add_lens(
            title=_coerce_decision_pattern_title(pattern),
            summary="先用這個決策模式檢查這輪判斷的取捨與邊界是否清楚。",
            why_now="這個 pack 的 decision pattern 已被目前案件正式選用，應先拿來排審閱順序。",
            source_kind="pack_decision_pattern",
            source_label="來源：pack decision pattern",
            priority="high" if len(lenses) == 0 else "medium",
        )

    for risk in pack_resolution.common_risks[:2]:
        add_lens(
            title=_coerce_common_risk_title(risk),
            summary="先確認這個高頻風險是否已經在目前材料、判斷或交付骨架中出現。",
            why_now="這是目前 selected packs 的常見風險之一，適合先拿來做風險掃描。",
            source_kind="pack_common_risk",
            source_label="來源：pack common risk",
            priority="medium",
        )

    if len(lenses) < 2:
        for title, why_now in TASK_HEURISTIC_LENSES.get(task_type, []):
            add_lens(
                title=title,
                summary=(
                    f"這輪目前屬於 {flagship_lane.label or task_type}，"
                    f"輸出姿態偏向 {deliverable_class_hint.value} / {input_entry_mode.value}。"
                ),
                why_now=why_now,
                source_kind="task_heuristic",
                source_label="來源：task heuristic",
                priority="medium",
            )

    if not lenses:
        return schemas.ReviewLensGuidanceRead(
            status="none",
            label="目前沒有可明確收斂的審閱視角",
            summary="這一輪先依現有證據與主問題推進，不額外補 review lenses。",
            boundary_note="review lenses 是幫你排審閱順序，不是替你直接下結論。",
        )

    return schemas.ReviewLensGuidanceRead(
        status="available" if any(item.source_kind != "task_heuristic" for item in lenses) else "fallback",
        label="這輪先看哪幾點",
        summary=f"Host 先整理出 {len(lenses)} 個 review lenses，幫你把這輪審閱順序排好。",
        boundary_note="這些視角是幫你排審閱順序，不是自動結論；若與正式證據衝突，仍以這案的正式證據為準。",
        lenses=lenses,
    )
