from __future__ import annotations

from collections.abc import Iterable

from sqlalchemy.orm import Session

from app.domain import models, schemas
from app.domain.enums import (
    ObjectSetCreationMode,
    ObjectSetLifecycleStatus,
    ObjectSetMembershipSource,
    ObjectSetScopeType,
    ObjectSetType,
)


_RISK_IMPACT_RANK = {"high": 3, "medium": 2, "low": 1}
_RISK_LIKELIHOOD_RANK = {"high": 3, "medium": 2, "low": 1}


def _unique_preserve_order(values: Iterable[str]) -> list[str]:
    ordered: list[str] = []
    seen: set[str] = set()
    for value in values:
        normalized = value.strip()
        if not normalized or normalized in seen:
            continue
        seen.add(normalized)
        ordered.append(normalized)
    return ordered


def _linked_matter_workspace(task: models.Task) -> models.MatterWorkspace | None:
    for link in task.matter_workspace_links:
        if link.matter_workspace is not None:
            return link.matter_workspace
    return None


def _upsert_object_set(
    db: Session,
    *,
    task: models.Task,
    deliverable: models.Deliverable | None,
    matter_workspace: models.MatterWorkspace | None,
    set_type: ObjectSetType,
    scope_type: ObjectSetScopeType,
    scope_id: str,
    display_title: str,
    description: str,
    intent: str,
    creation_mode: ObjectSetCreationMode,
    continuity_scope: str,
    membership_source_summary: dict,
) -> tuple[models.ObjectSet, bool]:
    existing = next(
        (
            item
            for item in task.object_sets
            if item.scope_type == scope_type.value
            and item.scope_id == scope_id
            and item.set_type == set_type.value
            and item.creation_mode == creation_mode.value
        ),
        None,
    )
    created = False
    if existing is None:
        existing = models.ObjectSet(
            task_id=task.id,
            matter_workspace_id=matter_workspace.id if matter_workspace else None,
            deliverable_id=deliverable.id if deliverable else None,
            set_type=set_type.value,
            scope_type=scope_type.value,
            scope_id=scope_id,
            display_title=display_title,
            description=description,
            intent=intent,
            creation_mode=creation_mode.value,
            lifecycle_status=ObjectSetLifecycleStatus.ACTIVE.value,
            continuity_scope=continuity_scope,
            membership_source_summary=membership_source_summary,
        )
        db.add(existing)
        created = True

    existing.matter_workspace_id = matter_workspace.id if matter_workspace else None
    existing.deliverable_id = deliverable.id if deliverable else None
    existing.display_title = display_title
    existing.description = description
    existing.intent = intent
    existing.continuity_scope = continuity_scope
    existing.membership_source_summary = membership_source_summary
    return existing, created


def _archive_object_set_if_present(
    *,
    task: models.Task,
    set_type: ObjectSetType,
    scope_type: ObjectSetScopeType,
    scope_id: str,
) -> bool:
    existing = next(
        (
            item
            for item in task.object_sets
            if item.scope_type == scope_type.value
            and item.scope_id == scope_id
            and item.set_type == set_type.value
        ),
        None,
    )
    if existing is None:
        return False
    return _replace_members(object_set=existing, member_payloads=[])


def _replace_members(
    *,
    object_set: models.ObjectSet,
    member_payloads: list[dict[str, object]],
) -> bool:
    changed = False
    existing_by_key = {
        (item.member_object_type, item.member_object_id): item for item in object_set.members
    }
    next_keys: set[tuple[str, str]] = set()

    for payload in member_payloads:
        key = (str(payload["member_object_type"]), str(payload["member_object_id"]))
        next_keys.add(key)
        row = existing_by_key.get(key)
        if row is None:
            row = models.ObjectSetMember(
                object_set=object_set,
                task_id=object_set.task_id,
                member_object_type=key[0],
                member_object_id=key[1],
            )
            object_set.members.append(row)
            changed = True
        next_state = (
            str(payload["member_label"]),
            str(payload["membership_source"]),
            int(payload["ordering_index"]),
            str(payload["included_reason"]),
            str(payload["derivation_hint"]),
            payload["support_label"],
        )
        previous_state = (
            row.member_label,
            row.membership_source,
            row.ordering_index,
            row.included_reason,
            row.derivation_hint,
            row.support_label,
        )
        row.member_label = str(payload["member_label"])
        row.membership_source = str(payload["membership_source"])
        row.ordering_index = int(payload["ordering_index"])
        row.included_reason = str(payload["included_reason"])
        row.derivation_hint = str(payload["derivation_hint"])
        row.support_label = (
            str(payload["support_label"]) if payload["support_label"] is not None else None
        )
        if previous_state != next_state:
            changed = True

    for key, row in existing_by_key.items():
        if key in next_keys:
            continue
        object_set.members.remove(row)
        changed = True

    object_set.lifecycle_status = (
        ObjectSetLifecycleStatus.ACTIVE.value
        if member_payloads
        else ObjectSetLifecycleStatus.ARCHIVED.value
    )
    return changed


def _evidence_derivation_hint(evidence: models.Evidence) -> str:
    if evidence.chunk_object is not None and evidence.chunk_object.locator_label:
        return evidence.chunk_object.locator_label
    if evidence.media_reference is not None and evidence.media_reference.locator_label:
        return evidence.media_reference.locator_label
    if evidence.source_document is not None and evidence.source_document.file_name:
        return evidence.source_document.file_name
    if evidence.source_ref:
        return evidence.source_ref
    return evidence.title


def _ensure_task_risk_set(
    db: Session,
    *,
    task: models.Task,
    matter_workspace: models.MatterWorkspace | None,
) -> bool:
    risks = sorted(
        task.risks,
        key=lambda item: (
            _RISK_IMPACT_RANK.get(item.impact_level, 0),
            _RISK_LIKELIHOOD_RANK.get(item.likelihood_level, 0),
            item.created_at,
        ),
        reverse=True,
    )
    if not risks:
        return _archive_object_set_if_present(
            task=task,
            set_type=ObjectSetType.RISK_SET_V1,
            scope_type=ObjectSetScopeType.TASK,
            scope_id=task.id,
        )

    object_set, created = _upsert_object_set(
        db,
        task=task,
        deliverable=None,
        matter_workspace=matter_workspace,
        set_type=ObjectSetType.RISK_SET_V1,
        scope_type=ObjectSetScopeType.TASK,
        scope_id=task.id,
        display_title="這次分析風險群組",
        description="集中查看這輪分析已納入範圍的主要風險。",
        intent="risk triage and focus grouping",
        creation_mode=ObjectSetCreationMode.HOST_CURATED,
        continuity_scope="task_scope",
        membership_source_summary={
            "primary_source": ObjectSetMembershipSource.HOST_CURATED.value,
            "derived_from": "task.risks",
            "owning_scope": ObjectSetScopeType.TASK.value,
        },
    )
    member_payloads = []
    for index, risk in enumerate(risks):
        evidence_count = len(risk.supporting_evidence_links)
        included_reason = "已納入這次分析範圍"
        if evidence_count > 0:
            included_reason += f"；目前有 {evidence_count} 則正式證據支撐。"
        member_payloads.append(
            {
                "member_object_type": "risk",
                "member_object_id": risk.id,
                "member_label": risk.title,
                "membership_source": ObjectSetMembershipSource.HOST_CURATED.value,
                "ordering_index": index,
                "included_reason": included_reason,
                "derivation_hint": risk.risk_type,
                "support_label": f"影響 {risk.impact_level} / 可能性 {risk.likelihood_level}",
            }
        )
    return _replace_members(object_set=object_set, member_payloads=member_payloads) or created


def _deliverable_evidence_ids(deliverable: models.Deliverable) -> list[str]:
    return _unique_preserve_order(
        [
            link.object_id
            for link in deliverable.object_links
            if link.object_type == "evidence" and link.object_id
        ]
    )


def _ensure_deliverable_evidence_set(
    db: Session,
    *,
    task: models.Task,
    deliverable: models.Deliverable,
    matter_workspace: models.MatterWorkspace | None,
) -> bool:
    evidence_lookup = {item.id: item for item in task.evidence}
    evidence_ids = _deliverable_evidence_ids(deliverable)
    if not evidence_ids:
        return _archive_object_set_if_present(
            task=task,
            set_type=ObjectSetType.EVIDENCE_SET_V1,
            scope_type=ObjectSetScopeType.DELIVERABLE,
            scope_id=deliverable.id,
        )

    object_set, created = _upsert_object_set(
        db,
        task=task,
        deliverable=deliverable,
        matter_workspace=matter_workspace,
        set_type=ObjectSetType.EVIDENCE_SET_V1,
        scope_type=ObjectSetScopeType.DELIVERABLE,
        scope_id=deliverable.id,
        display_title="這次交付支撐證據集",
        description=f"這組證據已被選入「{deliverable.title}」的正式交付支撐集。",
        intent="deliverable support bundle",
        creation_mode=ObjectSetCreationMode.DELIVERABLE_SUPPORT_BUNDLE,
        continuity_scope="deliverable_local",
        membership_source_summary={
            "primary_source": ObjectSetMembershipSource.DELIVERABLE_SUPPORT_BUNDLE.value,
            "derived_from": "deliverable.linked_evidence",
            "owning_scope": ObjectSetScopeType.DELIVERABLE.value,
            "deliverable_id": deliverable.id,
        },
    )
    member_payloads = []
    for index, evidence_id in enumerate(evidence_ids):
        evidence = evidence_lookup.get(evidence_id)
        if evidence is None:
            continue
        support_count = (
            len(evidence.recommendation_links)
            + len(evidence.risk_links)
            + len(evidence.action_item_links)
        )
        included_reason = "已選入這次交付支撐集"
        if support_count > 0:
            included_reason += f"；目前支撐 {support_count} 項決策輸出。"
        member_payloads.append(
            {
                "member_object_type": "evidence",
                "member_object_id": evidence.id,
                "member_label": evidence.title,
                "membership_source": ObjectSetMembershipSource.DELIVERABLE_SUPPORT_BUNDLE.value,
                "ordering_index": index,
                "included_reason": included_reason,
                "derivation_hint": _evidence_derivation_hint(evidence),
                "support_label": evidence.reliability_level,
            }
        )
    return _replace_members(object_set=object_set, member_payloads=member_payloads) or created


def ensure_object_sets_for_task(db: Session, task: models.Task) -> bool:
    matter_workspace = _linked_matter_workspace(task)
    changed = _ensure_task_risk_set(db, task=task, matter_workspace=matter_workspace)
    for deliverable in task.deliverables:
        changed = (
            _ensure_deliverable_evidence_set(
                db,
                task=task,
                deliverable=deliverable,
                matter_workspace=matter_workspace,
            )
            or changed
        )
    if changed:
        db.flush()
    return changed


def serialize_object_sets(object_sets: list[models.ObjectSet]) -> list[schemas.ObjectSetRead]:
    active_sets = [
        item
        for item in sorted(object_sets, key=lambda value: value.updated_at, reverse=True)
        if item.lifecycle_status == ObjectSetLifecycleStatus.ACTIVE.value
    ]
    return [
        schemas.ObjectSetRead(
            id=item.id,
            task_id=item.task_id,
            matter_workspace_id=item.matter_workspace_id,
            deliverable_id=item.deliverable_id,
            set_type=ObjectSetType(item.set_type),
            scope_type=ObjectSetScopeType(item.scope_type),
            scope_id=item.scope_id,
            display_title=item.display_title,
            description=item.description,
            intent=item.intent,
            creation_mode=ObjectSetCreationMode(item.creation_mode),
            lifecycle_status=ObjectSetLifecycleStatus(item.lifecycle_status),
            continuity_scope=item.continuity_scope,
            membership_source_summary=item.membership_source_summary or {},
            member_count=len(item.members),
            members=[
                schemas.ObjectSetMemberRead(
                    id=member.id,
                    object_set_id=member.object_set_id,
                    task_id=member.task_id,
                    member_object_type=member.member_object_type,
                    member_object_id=member.member_object_id,
                    member_label=member.member_label,
                    membership_source=ObjectSetMembershipSource(member.membership_source),
                    ordering_index=member.ordering_index,
                    included_reason=member.included_reason,
                    derivation_hint=member.derivation_hint,
                    support_label=member.support_label,
                    created_at=member.created_at,
                )
                for member in item.members
            ],
            created_at=item.created_at,
            updated_at=item.updated_at,
        )
        for item in active_sets
    ]


def relevant_object_sets_for_deliverable(
    task: models.Task,
    deliverable_id: str,
) -> list[models.ObjectSet]:
    return [
        item
        for item in task.object_sets
        if item.lifecycle_status == ObjectSetLifecycleStatus.ACTIVE.value
        and (
            (item.scope_type == ObjectSetScopeType.TASK.value and item.scope_id == task.id)
            or (
                item.scope_type == ObjectSetScopeType.DELIVERABLE.value
                and item.scope_id == deliverable_id
            )
        )
    ]
