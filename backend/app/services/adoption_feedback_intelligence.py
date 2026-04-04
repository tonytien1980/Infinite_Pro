from __future__ import annotations

from collections.abc import Iterable

from app.domain.enums import AdoptionFeedbackStatus


ADOPTION_FEEDBACK_REASON_CATALOG: dict[str, dict[str, list[dict[str, str]]]] = {
    "deliverable": {
        AdoptionFeedbackStatus.ADOPTED.value: [
            {"code": "ready_to_send", "label": "已可直接交付"},
            {"code": "judgment_clear", "label": "判斷已很清楚"},
            {"code": "structure_clear", "label": "結構已很清楚"},
            {"code": "fits_this_case", "label": "很適合這個案件"},
        ],
        AdoptionFeedbackStatus.NEEDS_REVISION.value: [
            {"code": "needs_more_evidence", "label": "還需要更多證據"},
            {"code": "needs_tighter_logic", "label": "邏輯還可以更緊"},
            {"code": "needs_clearer_structure", "label": "結構還可以更清楚"},
            {"code": "needs_scope_adjustment", "label": "適用範圍還要再調整"},
        ],
        AdoptionFeedbackStatus.NOT_ADOPTED.value: [
            {"code": "too_generic", "label": "內容還太泛"},
            {"code": "misread_context", "label": "有點讀錯情境"},
            {"code": "too_risky", "label": "風險還太高"},
            {"code": "not_actionable", "label": "還不夠可執行"},
        ],
        AdoptionFeedbackStatus.TEMPLATE_CANDIDATE.value: [
            {"code": "reusable_structure", "label": "可重用的交付結構"},
            {"code": "reusable_reasoning", "label": "可重用的判斷方式"},
            {"code": "reusable_risk_scan", "label": "可重用的風險掃描"},
            {"code": "reusable_deliverable_shape", "label": "可重用的交付骨架"},
        ],
    },
    "recommendation": {
        AdoptionFeedbackStatus.ADOPTED.value: [
            {"code": "actionable_now", "label": "現在就能採行"},
            {"code": "priority_is_right", "label": "優先順序正確"},
            {"code": "fits_constraints", "label": "符合這案限制"},
            {"code": "ready_to_assign", "label": "已可直接指派"},
        ],
        AdoptionFeedbackStatus.NEEDS_REVISION.value: [
            {"code": "needs_more_support", "label": "還需要更多支撐"},
            {"code": "needs_owner_clarity", "label": "owner 還不夠清楚"},
            {"code": "needs_scope_clarity", "label": "範圍還要更清楚"},
            {"code": "needs_sequence_adjustment", "label": "順序還要再調整"},
        ],
        AdoptionFeedbackStatus.NOT_ADOPTED.value: [
            {"code": "not_fit_for_case", "label": "不太適合這個案子"},
            {"code": "too_abstract", "label": "還太抽象"},
            {"code": "timing_not_right", "label": "現在時機不對"},
            {"code": "risk_too_high", "label": "執行風險太高"},
        ],
        AdoptionFeedbackStatus.TEMPLATE_CANDIDATE.value: [
            {"code": "reusable_action_pattern", "label": "可重用的行動模式"},
            {"code": "reusable_priority_judgment", "label": "可重用的優先順序判斷"},
            {"code": "reusable_constraint_handling", "label": "可重用的限制處理"},
            {"code": "reusable_client_framing", "label": "可重用的客戶情境 framing"},
        ],
    },
}

DEFAULT_REUSABLE_REASON_BY_STATUS = {
    AdoptionFeedbackStatus.ADOPTED: "已被明確標記為可直接採用，適合作為後續可重用模式候選。",
    AdoptionFeedbackStatus.NEEDS_REVISION: "已被標記為可在改寫後採用，適合作為後續修正版模式候選。",
    AdoptionFeedbackStatus.TEMPLATE_CANDIDATE: "已被標記為值得當範本，適合作為後續可重用模式候選。",
}


def get_adoption_feedback_reason_options(
    surface_kind: str,
    feedback_status: AdoptionFeedbackStatus,
) -> list[dict[str, str]]:
    return list(ADOPTION_FEEDBACK_REASON_CATALOG.get(surface_kind, {}).get(feedback_status.value, []))


def normalize_adoption_feedback_reason_codes(
    surface_kind: str,
    feedback_status: AdoptionFeedbackStatus,
    reason_codes: Iterable[str] | None,
) -> list[str]:
    allowed = {
        item["code"]
        for item in get_adoption_feedback_reason_options(surface_kind, feedback_status)
    }
    if not allowed or not reason_codes:
        return []

    normalized: list[str] = []
    for code in reason_codes:
        stripped = str(code).strip()
        if not stripped or stripped not in allowed or stripped in normalized:
            continue
        normalized.append(stripped)
    return normalized[:1]


def label_for_adoption_feedback_reason(
    surface_kind: str,
    feedback_status: AdoptionFeedbackStatus,
    reason_code: str,
) -> str | None:
    for item in get_adoption_feedback_reason_options(surface_kind, feedback_status):
        if item["code"] == reason_code:
            return item["label"]
    return None


def summarize_adoption_feedback_reason(
    surface_kind: str,
    feedback_status: AdoptionFeedbackStatus,
    feedback_note: str,
    reason_codes: Iterable[str] | None,
) -> str:
    normalized_note = (feedback_note or "").strip()
    if normalized_note:
        return normalized_note

    if reason_codes:
        for code in reason_codes:
            label = label_for_adoption_feedback_reason(surface_kind, feedback_status, code)
            if label:
                return label

    return DEFAULT_REUSABLE_REASON_BY_STATUS.get(
        feedback_status,
        "已被標記為可重用候選。",
    )
