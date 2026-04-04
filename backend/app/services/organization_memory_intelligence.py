from __future__ import annotations

from app.domain import schemas
from app.domain.enums import EngagementContinuityMode


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


def build_organization_memory_guidance(
    *,
    client_name: str,
    client_stage: str | None,
    client_type: str | None,
    domain_lenses: list[str],
    selected_pack_names: list[str],
    continuity_mode: EngagementContinuityMode,
    current_decision_context_title: str | None,
    next_best_actions: list[str],
    constraint_descriptions: list[str],
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

    continuity_anchor = ""
    if current_decision_context_title and next_best_actions:
        continuity_anchor = f"這案目前延續「{current_decision_context_title}」這條主線，下一步仍以「{next_best_actions[0]}」為主。"
    elif current_decision_context_title:
        continuity_anchor = f"這案目前延續「{current_decision_context_title}」這條主線。"
    elif next_best_actions:
        continuity_anchor = f"這案目前下一步仍以「{next_best_actions[0]}」為主。"
    elif continuity_mode != EngagementContinuityMode.ONE_OFF:
        continuity_anchor = "這案目前仍在同一案件世界內持續推進，不是一次性輸出後就結束。"

    if not stable_context_items and not known_constraints and not continuity_anchor:
        return schemas.OrganizationMemoryGuidanceRead(
            status="none",
            label="目前還沒有足夠穩定的組織背景",
            summary="這一輪先依當前案件資料推進，不額外補 organization memory。",
            boundary_note="organization memory 只整理同一案件世界裡已站穩的背景，不替代當前案件證據。",
        )

    return schemas.OrganizationMemoryGuidanceRead(
        status="available",
        label="這個客戶 / 組織目前已知的穩定背景",
        summary="Host 先把同一案件世界裡已站穩的組織背景、限制與延續主線整理出來，避免這輪又從零重問一次。",
        organization_label=organization_label,
        stable_context_items=stable_context_items,
        known_constraints=known_constraints,
        continuity_anchor=continuity_anchor,
        boundary_note="這是同一案件世界內目前已知的穩定背景，不代表跨客戶通用 profile；若與這輪正式證據衝突，仍以這案當前證據為準。",
    )
