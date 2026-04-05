from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

from app.domain.enums import AdoptionFeedbackStatus


SharedSourceLifecyclePosture = Literal["foreground", "balanced", "background", "thin"]


@dataclass(frozen=True)
class SharedSourceLifecycleState:
    lifecycle_posture: SharedSourceLifecyclePosture
    lifecycle_posture_label: str
    source_lifecycle_summary: str
    recovery_balance_summary: str


def build_feedback_linked_reactivation_summary(
    status: AdoptionFeedbackStatus,
    *,
    subject_label: str,
) -> str:
    if status == AdoptionFeedbackStatus.ADOPTED:
        return f"新的採納回饋已把這類{subject_label}拉回前景；偏舊來源仍留背景校正。"
    if status == AdoptionFeedbackStatus.TEMPLATE_CANDIDATE:
        return f"新的範本候選回饋已把這類{subject_label}拉回前景；偏舊來源仍留背景校正。"
    return ""


def build_feedback_linked_decay_summary(
    status: AdoptionFeedbackStatus,
    *,
    subject_label: str,
) -> str:
    if status == AdoptionFeedbackStatus.NEEDS_REVISION:
        return f"最新回饋仍是需要改寫，這類{subject_label}先退到背景觀察。"
    if status == AdoptionFeedbackStatus.NOT_ADOPTED:
        return f"最新回饋目前不採用，這類{subject_label}先退到背景觀察。"
    return ""


def build_recovery_balance_summary(
    *,
    reactivation_summary: str,
    decay_summary: str,
    subject_label: str,
) -> str:
    if not reactivation_summary or not decay_summary:
        return ""
    return (
        f"雖然新的正向回饋已把部分{subject_label}拉回前景，但近期仍有需要改寫或暫不採用的來源退到背景；"
        "這輪先讓較穩的新來源帶主線，其餘留背景觀察。"
    )


def resolve_shared_source_lifecycle_state(
    *,
    has_fresh_shared_source: bool,
    has_stale_shared_source: bool,
    has_authoritative_source: bool,
    recovery_balance_summary: str,
    balanced_summary: str,
    foreground_summary: str,
    background_summary: str,
    thin_summary: str,
) -> SharedSourceLifecycleState:
    if recovery_balance_summary:
        return SharedSourceLifecycleState(
            lifecycle_posture="balanced",
            lifecycle_posture_label="來源平衡期",
            source_lifecycle_summary=balanced_summary,
            recovery_balance_summary=recovery_balance_summary,
        )
    if has_fresh_shared_source and has_authoritative_source:
        return SharedSourceLifecycleState(
            lifecycle_posture="foreground",
            lifecycle_posture_label="來源在前景",
            source_lifecycle_summary=foreground_summary,
            recovery_balance_summary="",
        )
    if has_stale_shared_source:
        return SharedSourceLifecycleState(
            lifecycle_posture="background",
            lifecycle_posture_label="來源在背景",
            source_lifecycle_summary=background_summary,
            recovery_balance_summary="",
        )
    return SharedSourceLifecycleState(
        lifecycle_posture="thin",
        lifecycle_posture_label="來源仍偏薄",
        source_lifecycle_summary=thin_summary,
        recovery_balance_summary="",
    )
