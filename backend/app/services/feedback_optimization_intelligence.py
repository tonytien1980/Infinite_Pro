from __future__ import annotations

from app.domain import schemas
from app.domain.enums import AdoptionFeedbackStatus, PrecedentCandidateStatus, PrecedentCandidateType


OPTIMIZATION_ASSET_LABELS = {
    "review_lens": "審閱視角",
    "common_risk": "漏看風險",
    "deliverable_shape": "交付骨架",
    "deliverable_template": "交付模板",
    "domain_playbook": "工作主線",
}

REASON_TO_ASSET_CODES = {
    "reusable_reasoning": ["review_lens", "domain_playbook"],
    "reusable_priority_judgment": ["review_lens", "domain_playbook"],
    "reusable_client_framing": ["review_lens", "domain_playbook"],
    "reusable_risk_scan": ["common_risk"],
    "reusable_constraint_handling": ["common_risk", "domain_playbook"],
    "reusable_structure": ["deliverable_shape", "deliverable_template"],
    "reusable_deliverable_shape": ["deliverable_shape", "deliverable_template"],
    "reusable_action_pattern": ["domain_playbook"],
}

STRENGTH_RANK = {"high": 0, "medium": 1, "low": 2}


def _unique(values: list[str]) -> list[str]:
    result: list[str] = []
    for value in values:
        if value not in result:
            result.append(value)
    return result


def build_precedent_optimization_signal(
    *,
    candidate_status: str,
    source_feedback_status: str,
    source_feedback_reason_codes: list[str],
    candidate_type: str,
) -> schemas.PrecedentOptimizationSignalRead:
    asset_codes = _unique(
        [
            asset
            for code in source_feedback_reason_codes
            for asset in REASON_TO_ASSET_CODES.get(code, [])
        ]
    )
    if not asset_codes:
        asset_codes = (
            ["deliverable_shape", "deliverable_template"]
            if candidate_type == PrecedentCandidateType.DELIVERABLE_PATTERN.value
            else ["review_lens", "domain_playbook"]
        )

    asset_labels = [OPTIMIZATION_ASSET_LABELS[item] for item in asset_codes if item in OPTIMIZATION_ASSET_LABELS]

    if candidate_status == PrecedentCandidateStatus.DISMISSED.value:
        strength = "low"
        strength_reason = "這筆 precedent 目前已停用，先留作背景，不適合高權重影響下一案。"
    elif candidate_status == PrecedentCandidateStatus.PROMOTED.value:
        strength = "high" if source_feedback_reason_codes else "medium"
        strength_reason = "這筆 precedent 已正式升格，而且可明確對應可重用資產。"
    elif source_feedback_status == AdoptionFeedbackStatus.TEMPLATE_CANDIDATE.value:
        strength = "high"
        strength_reason = "這筆 precedent 來自「值得當範本」訊號，對後續優化最有參考價值。"
    elif source_feedback_status == AdoptionFeedbackStatus.ADOPTED.value:
        strength = "high" if source_feedback_reason_codes else "medium"
        strength_reason = "這筆 precedent 已被直接採用，可作為較強的後續參考訊號。"
    elif source_feedback_status == AdoptionFeedbackStatus.NEEDS_REVISION.value:
        strength = "medium"
        strength_reason = "這筆 precedent 仍有可重用價值，但更適合作為修正版或輔助參考。"
    else:
        strength = "low"
        strength_reason = "目前只有有限訊號可參考，先留作背景。"

    summary = (
        f"最能幫助{'、'.join(asset_labels[:2])}，參考強度"
        f"{'高' if strength == 'high' else '中' if strength == 'medium' else '低'}。"
    )

    return schemas.PrecedentOptimizationSignalRead(
        strength=strength,
        strength_reason=strength_reason,
        best_for_asset_codes=asset_codes[:3],
        best_for_asset_labels=asset_labels[:3],
        summary=summary,
    )
