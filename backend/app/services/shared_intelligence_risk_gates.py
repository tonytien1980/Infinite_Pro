from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable

from app.domain.enums import AdoptionFeedbackStatus, PrecedentShareStatus


SENSITIVE_TEXT_TERMS = (
    "客戶名稱",
    "個資",
    "報價",
    "價格",
    "合約第",
    "保密",
    "NDA",
    "身分證",
    "電話",
    "email",
)

HIGH_RISK_DOMAIN_LENSES = (
    "法務",
    "財務",
    "募資",
    "合規",
    "Legal",
    "Finance",
    "Fundraising",
)

LOW_CONFIDENCE_REASON_CODES = {
    "too_specific",
    "insufficient_evidence",
    "needs_more_context",
}

POSITIVE_FEEDBACK_STATUSES = {
    AdoptionFeedbackStatus.ADOPTED.value,
    AdoptionFeedbackStatus.TEMPLATE_CANDIDATE.value,
}

@dataclass(frozen=True)
class ShareGateDecision:
    share_status: PrecedentShareStatus
    risk_flags: list[str]
    risk_summary: str
    positive_signal_count: int
    negative_signal_count: int


def _normalized_values(values: Iterable[str | None]) -> list[str]:
    return [value.strip() for value in values if value and value.strip()]


def _contains_any_term(text: str, terms: Iterable[str]) -> bool:
    lowered_text = text.lower()
    return any(term.lower() in lowered_text for term in terms)


def _append_unique(values: list[str], value: str) -> None:
    if value not in values:
        values.append(value)


def _risk_summary_for_flags(risk_flags: list[str]) -> str:
    if risk_flags:
        return "這筆可重用內容含有敏感、特殊或高風險訊號，先不自動進入強參考。"
    return "已自動進入共享判讀，但目前只作為弱訊號參考。"


def evaluate_precedent_share_gate(
    *,
    feedback_status: AdoptionFeedbackStatus | str,
    feedback_note: str = "",
    feedback_reason_codes: Iterable[str] | None = None,
    title: str = "",
    summary: str = "",
    reusable_reason: str = "",
    domain_lenses: Iterable[str] | None = None,
) -> ShareGateDecision:
    status_value = feedback_status.value if isinstance(feedback_status, AdoptionFeedbackStatus) else feedback_status
    reason_codes = set(_normalized_values(feedback_reason_codes or []))
    lenses = _normalized_values(domain_lenses or [])
    text = " ".join(_normalized_values([feedback_note, title, summary, reusable_reason]))
    risk_flags: list[str] = []

    if _contains_any_term(text, SENSITIVE_TEXT_TERMS):
        _append_unique(risk_flags, "sensitive_detail")

    if any(lens.lower() in {item.lower() for item in HIGH_RISK_DOMAIN_LENSES} for lens in lenses):
        _append_unique(risk_flags, "high_risk_domain")

    if reason_codes.intersection(LOW_CONFIDENCE_REASON_CODES):
        _append_unique(risk_flags, "low_reuse_confidence")

    positive_signal_count = 1 if status_value in POSITIVE_FEEDBACK_STATUSES else 0
    negative_signal_count = 0
    if status_value == AdoptionFeedbackStatus.NEEDS_REVISION.value:
        negative_signal_count += 1
        _append_unique(risk_flags, "needs_revision")
    if status_value == AdoptionFeedbackStatus.NOT_ADOPTED.value:
        negative_signal_count += 1
        _append_unique(risk_flags, "not_adopted")
    if reason_codes.intersection(LOW_CONFIDENCE_REASON_CODES):
        negative_signal_count += 1

    share_status = (
        PrecedentShareStatus.NEEDS_REVIEW
        if risk_flags
        else PrecedentShareStatus.PROVISIONAL
    )
    return ShareGateDecision(
        share_status=share_status,
        risk_flags=risk_flags,
        risk_summary=_risk_summary_for_flags(risk_flags),
        positive_signal_count=positive_signal_count,
        negative_signal_count=negative_signal_count,
    )
