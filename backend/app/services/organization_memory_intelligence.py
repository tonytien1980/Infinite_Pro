from __future__ import annotations

from difflib import SequenceMatcher
from datetime import datetime, timezone

from app.domain import schemas
from app.domain.enums import EngagementContinuityMode
from app.services.shared_source_lifecycle_intelligence import resolve_shared_source_lifecycle_state

DEFAULT_ORGANIZATION_LABEL = "尚未明確標示客戶"
RECENT_CROSS_MATTER_DAYS = 45
STALE_CROSS_MATTER_DAYS = 120


def _unique(items: list[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for item in items:
        normalized = " ".join(item.strip().split())
        if not normalized or normalized in seen:
            continue
        seen.add(normalized)
        result.append(normalized)
    return result


def _normalize_key(value: str | None) -> str:
    return " ".join((value or "").strip().split()).casefold()


def _looks_like_same_organization(current_label: str, candidate_label: str) -> bool:
    current_key = _normalize_key(current_label)
    candidate_key = _normalize_key(candidate_label)
    if not current_key or not candidate_key:
        return False
    if current_key == candidate_key:
        return True
    if current_key in candidate_key or candidate_key in current_key:
        return min(len(current_key), len(candidate_key)) >= 4
    return SequenceMatcher(None, current_key, candidate_key).ratio() >= 0.9


def _summarize_related_matter(summary: schemas.MatterWorkspaceSummaryRead) -> str:
    return (
        summary.workspace_summary
        or summary.current_decision_context_summary
        or summary.active_work_summary
        or summary.continuity_summary
        or "目前沒有額外的跨案件摘要。"
    )


def _coerce_utc_datetime(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def _cross_matter_freshness_label(latest_updated_at: datetime) -> str:
    now = datetime.now(timezone.utc)
    normalized_updated_at = _coerce_utc_datetime(latest_updated_at)
    age_days = max(0, int((now - normalized_updated_at).total_seconds() // 86400))
    if age_days <= RECENT_CROSS_MATTER_DAYS:
        return "最近更新"
    if age_days <= STALE_CROSS_MATTER_DAYS:
        return "近期可參考"
    return "較舊背景"


def build_cross_matter_organization_memory_items(
    *,
    current_matter_workspace_id: str | None,
    client_name: str,
    client_stage: str | None,
    client_type: str | None,
    domain_lenses: list[str],
    matter_summaries: list[schemas.MatterWorkspaceSummaryRead],
) -> tuple[str, str, str, list[schemas.CrossMatterOrganizationMemoryItemRead]]:
    normalized_client_name = _normalize_key(client_name)
    if not normalized_client_name or normalized_client_name == _normalize_key(DEFAULT_ORGANIZATION_LABEL):
        return "", "", "", []

    ranked: list[tuple[int, float, schemas.CrossMatterOrganizationMemoryItemRead]] = []
    current_lenses = {_normalize_key(item) for item in domain_lenses if _normalize_key(item)}

    for summary in matter_summaries:
        if current_matter_workspace_id and summary.id == current_matter_workspace_id:
            continue
        if not _looks_like_same_organization(client_name, summary.client_name):
            continue

        relation_bits = ["同一客戶"]
        score = 10

        if client_stage and summary.client_stage and client_stage == summary.client_stage:
            relation_bits.append("同階段")
            score += 2
        if client_type and summary.client_type and client_type == summary.client_type:
            relation_bits.append("同客群")
            score += 2

        overlap_lenses = [
            item
            for item in summary.domain_lenses
            if _normalize_key(item) in current_lenses and _normalize_key(item)
        ]
        if overlap_lenses:
            relation_bits.append(f"共通焦點：{'、'.join(overlap_lenses[:2])}")
            score += 1

        item = schemas.CrossMatterOrganizationMemoryItemRead(
            matter_workspace_id=summary.id,
            matter_title=summary.title,
            summary=_summarize_related_matter(summary),
            relation_reason="｜".join(relation_bits),
            freshness_label=_cross_matter_freshness_label(summary.latest_updated_at),
        )
        ranked.append(
            (
                score,
                _coerce_utc_datetime(summary.latest_updated_at).timestamp(),
                item,
            )
        )

    ranked.sort(key=lambda entry: (-entry[0], -entry[1], entry[2].matter_title))
    items = [entry[2] for entry in ranked[:3]]
    if not items:
        return "", "", "", []

    summary = f"另有 {len(items)} 個同客戶案件可回看其穩定背景。"
    freshness_labels = {item.freshness_label for item in items if item.freshness_label}
    reactivation_summary = ""
    if freshness_labels == {"最近更新"}:
        freshness_summary = "跨案件背景最近仍有更新，可直接當穩定背景。"
    elif "最近更新" in freshness_labels and len(freshness_labels) > 1:
        freshness_summary = "跨案件背景目前新舊並存，較新的背景可重新站前面。"
        reactivation_summary = "較新的同客戶背景已回來，這輪可重新拉回前景；偏舊背景仍留作背景參考。"
    elif "較舊背景" in freshness_labels and len(freshness_labels) == 1:
        freshness_summary = "跨案件背景目前偏舊，先留作背景參考。"
    else:
        freshness_summary = "跨案件背景目前可參考，但仍建議先當背景校正。"
    return summary, freshness_summary, reactivation_summary, items


def build_organization_memory_guidance(
    *,
    current_matter_workspace_id: str | None = None,
    client_name: str,
    client_stage: str | None,
    client_type: str | None,
    domain_lenses: list[str],
    selected_pack_names: list[str],
    continuity_mode: EngagementContinuityMode,
    current_decision_context_title: str | None,
    next_best_actions: list[str],
    constraint_descriptions: list[str],
    cross_matter_summaries: list[schemas.MatterWorkspaceSummaryRead] | None = None,
) -> schemas.OrganizationMemoryGuidanceRead:
    organization_label_parts = [client_name.strip() or "目前案件世界"]
    if client_stage:
        organization_label_parts.append(client_stage)
    if client_type:
        organization_label_parts.append(client_type)
    organization_label = "｜".join(part for part in organization_label_parts if part)

    stable_context_items = _unique(
        [
            f"主要工作焦點：{'、'.join(domain_lenses[:3])}" if domain_lenses else "",
            f"目前常用模組包：{'、'.join(selected_pack_names[:3])}" if selected_pack_names else "",
            (
                f"目前主要服務的是「{client_type}」"
                if client_type
                else ""
            ),
            (
                f"目前所處階段是「{client_stage}」"
                if client_stage
                else ""
            ),
        ]
    )[:4]

    known_constraints = _unique(constraint_descriptions)[:4]
    cross_matter_summary, freshness_summary, reactivation_summary, cross_matter_items = build_cross_matter_organization_memory_items(
        current_matter_workspace_id=current_matter_workspace_id,
        client_name=client_name,
        client_stage=client_stage,
        client_type=client_type,
        domain_lenses=domain_lenses,
        matter_summaries=list(cross_matter_summaries or []),
    )

    continuity_anchor = ""
    if current_decision_context_title and next_best_actions:
        continuity_anchor = f"這案目前延續「{current_decision_context_title}」這條主線，下一步仍以「{next_best_actions[0]}」為主。"
    elif current_decision_context_title:
        continuity_anchor = f"這案目前延續「{current_decision_context_title}」這條主線。"
    elif next_best_actions:
        continuity_anchor = f"這案目前下一步仍以「{next_best_actions[0]}」為主。"
    elif continuity_mode != EngagementContinuityMode.ONE_OFF:
        continuity_anchor = "這案目前仍在同一案件世界內持續推進，不是一次性輸出後就結束。"

    if (
        not stable_context_items
        and not known_constraints
        and not continuity_anchor
        and not cross_matter_items
    ):
        return schemas.OrganizationMemoryGuidanceRead(
            status="none",
            label="目前還沒有足夠穩定的組織背景",
            summary="這一輪先依當前案件資料推進，不額外補 organization memory。",
            source_lifecycle_summary="",
            lifecycle_posture="thin",
            lifecycle_posture_label="",
            freshness_summary="",
            reactivation_summary="",
            boundary_note="organization memory 只整理同一案件世界裡已站穩的背景，不替代當前案件證據。",
        )

    has_recent_cross_matter = any(item.freshness_label == "最近更新" for item in cross_matter_items)
    has_non_recent_cross_matter = any(
        item.freshness_label != "最近更新" for item in cross_matter_items
    )
    lifecycle_state = resolve_shared_source_lifecycle_state(
        has_fresh_shared_source=len(cross_matter_items) >= 2 and has_recent_cross_matter,
        has_stale_shared_source=bool(
            cross_matter_items and (len(cross_matter_items) == 1 or has_non_recent_cross_matter)
        ),
        has_authoritative_source=len(cross_matter_items) >= 2 and not reactivation_summary,
        recovery_balance_summary=reactivation_summary if reactivation_summary else "",
        balanced_summary="較新的跨案件背景已回來，可重新拉回前景；偏舊背景留在背景參考。",
        foreground_summary="跨案件背景目前可直接當穩定背景，不必每次從零重建。",
        background_summary="跨案件背景目前先留作背景參考，先不要讓它主導這輪判斷。",
        thin_summary="目前仍以同案穩定背景為主，跨案件背景還不夠厚。",
    )

    return schemas.OrganizationMemoryGuidanceRead(
        status="available",
        label="這個客戶 / 組織目前已知的穩定背景",
        summary=(
            "Host 先把同一案件世界裡已站穩的組織背景、限制與延續主線整理出來；"
            "若已有高度相近的同客戶案件，也只低風險補少量跨案件摘要，避免這輪又從零重問一次。"
        ),
        organization_label=organization_label,
        source_lifecycle_summary=lifecycle_state.source_lifecycle_summary,
        lifecycle_posture=lifecycle_state.lifecycle_posture,
        lifecycle_posture_label=lifecycle_state.lifecycle_posture_label,
        freshness_summary=freshness_summary,
        reactivation_summary=reactivation_summary,
        stable_context_items=stable_context_items,
        known_constraints=known_constraints,
        continuity_anchor=continuity_anchor,
        cross_matter_summary=cross_matter_summary,
        cross_matter_items=cross_matter_items,
        boundary_note="這是在提示同案穩定背景與少量同客戶跨案件摘要，不是 CRM profile 卡，也不代表跨客戶通用 profile；若與這輪正式證據衝突，仍以這案當前證據為準。",
    )
