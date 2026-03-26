from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.domain import models

CONTENT_REVISION_SOURCE_MANUAL_EDIT = "manual_edit"
CONTENT_REVISION_SOURCE_ROLLBACK = "rollback"
CONTENT_REVISION_SOURCE_RUNTIME_BACKFILL = "runtime_backfill"

CONTENT_CHANGE_ADDED = "added"
CONTENT_CHANGE_UPDATED = "updated"
CONTENT_CHANGE_CLEARED = "cleared"

MATTER_SECTION_LABELS = {
    "core_question": "目前核心問題",
    "analysis_focus": "分析焦點",
    "constraints_and_risks": "限制 / 風險",
    "next_steps": "下一步建議",
}

DELIVERABLE_SECTION_LABELS = {
    "executive_summary": "摘要",
    "recommendations": "建議",
    "risks": "風險",
    "action_items": "行動項目",
    "evidence_basis": "依據來源",
}


def _normalize_text(value: object) -> str:
    return str(value or "").strip()


def _normalize_string_list(value: object) -> list[str]:
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]

    normalized = _normalize_text(value)
    return [normalized] if normalized else []


def normalize_matter_content_snapshot(snapshot: dict | None) -> dict[str, str]:
    payload = snapshot if isinstance(snapshot, dict) else {}
    return {
        "core_question": _normalize_text(payload.get("core_question")),
        "analysis_focus": _normalize_text(payload.get("analysis_focus")),
        "constraints_and_risks": _normalize_text(payload.get("constraints_and_risks")),
        "next_steps": _normalize_text(payload.get("next_steps")),
    }


def normalize_deliverable_content_snapshot(snapshot: dict | None) -> dict[str, object]:
    payload = snapshot if isinstance(snapshot, dict) else {}
    return {
        "executive_summary": _normalize_text(payload.get("executive_summary")),
        "recommendations": _normalize_string_list(payload.get("recommendations")),
        "risks": _normalize_string_list(payload.get("risks")),
        "action_items": _normalize_string_list(payload.get("action_items")),
        "evidence_basis": _normalize_string_list(payload.get("evidence_basis")),
    }


def _is_empty_snapshot_value(value: object) -> bool:
    if isinstance(value, list):
        return len(value) == 0
    return not _normalize_text(value)


def _preview_snapshot_value(value: object) -> str:
    if isinstance(value, list):
        preview = " / ".join(_normalize_string_list(value))
    else:
        preview = _normalize_text(value).replace("\n", " / ")

    if len(preview) <= 120:
        return preview
    return f"{preview[:117]}..."


def build_content_diff_summary(
    previous_snapshot: dict[str, object],
    next_snapshot: dict[str, object],
    *,
    section_labels: dict[str, str],
) -> tuple[list[str], list[dict[str, str]]]:
    changed_sections: list[str] = []
    diff_summary: list[dict[str, str]] = []

    for section_key, section_label in section_labels.items():
        previous_value = previous_snapshot.get(section_key)
        next_value = next_snapshot.get(section_key)
        if previous_value == next_value:
            continue

        if _is_empty_snapshot_value(previous_value) and not _is_empty_snapshot_value(next_value):
            change_type = CONTENT_CHANGE_ADDED
        elif not _is_empty_snapshot_value(previous_value) and _is_empty_snapshot_value(next_value):
            change_type = CONTENT_CHANGE_CLEARED
        else:
            change_type = CONTENT_CHANGE_UPDATED

        changed_sections.append(section_key)
        diff_summary.append(
            {
                "section_key": section_key,
                "section_label": section_label,
                "change_type": change_type,
                "previous_preview": _preview_snapshot_value(previous_value),
                "current_preview": _preview_snapshot_value(next_value),
            }
        )

    return changed_sections, diff_summary


def _build_revision_summary(
    changed_sections: list[str],
    *,
    section_labels: dict[str, str],
    source: str,
    object_label: str,
    override: str | None = None,
) -> str:
    if override and override.strip():
        return override.strip()

    changed_labels = [section_labels.get(section, section) for section in changed_sections]
    if source == CONTENT_REVISION_SOURCE_RUNTIME_BACKFILL:
        return f"回填既有{object_label}正文基線"
    if source == CONTENT_REVISION_SOURCE_ROLLBACK:
        return f"回退{object_label}正文：{'、'.join(changed_labels)}" if changed_labels else f"回退{object_label}正文"
    return f"更新{object_label}正文：{'、'.join(changed_labels)}" if changed_labels else f"更新{object_label}正文"


def list_matter_content_revisions(
    db: Session,
    matter_workspace_id: str,
) -> list[models.MatterContentRevision]:
    return db.scalars(
        select(models.MatterContentRevision)
        .where(models.MatterContentRevision.matter_workspace_id == matter_workspace_id)
        .order_by(
            models.MatterContentRevision.created_at.desc(),
            models.MatterContentRevision.id.desc(),
        )
    ).all()


def list_deliverable_content_revisions(
    db: Session,
    deliverable_id: str,
) -> list[models.DeliverableContentRevision]:
    return db.scalars(
        select(models.DeliverableContentRevision)
        .where(models.DeliverableContentRevision.deliverable_id == deliverable_id)
        .order_by(
            models.DeliverableContentRevision.created_at.desc(),
            models.DeliverableContentRevision.id.desc(),
        )
    ).all()


def has_non_empty_matter_snapshot(snapshot: dict | None) -> bool:
    return any(normalize_matter_content_snapshot(snapshot).values())


def has_non_empty_deliverable_snapshot(snapshot: dict | None) -> bool:
    normalized = normalize_deliverable_content_snapshot(snapshot)
    return any(
        value if isinstance(value, list) else bool(value)
        for value in normalized.values()
    )


def create_matter_content_revision(
    db: Session,
    matter_workspace: models.MatterWorkspace,
    *,
    snapshot: dict | None,
    previous_snapshot: dict | None = None,
    source: str = CONTENT_REVISION_SOURCE_MANUAL_EDIT,
    revision_summary: str | None = None,
    rollback_target_revision_id: str | None = None,
) -> models.MatterContentRevision | None:
    normalized_snapshot = normalize_matter_content_snapshot(snapshot)
    normalized_previous = normalize_matter_content_snapshot(previous_snapshot)
    changed_sections, diff_summary = build_content_diff_summary(
        normalized_previous,
        normalized_snapshot,
        section_labels=MATTER_SECTION_LABELS,
    )
    if source != CONTENT_REVISION_SOURCE_RUNTIME_BACKFILL and not changed_sections:
        return None

    revision = models.MatterContentRevision(
        matter_workspace_id=matter_workspace.id,
        source=source,
        revision_summary=_build_revision_summary(
            changed_sections,
            section_labels=MATTER_SECTION_LABELS,
            source=source,
            object_label="案件",
            override=revision_summary,
        ),
        changed_sections=changed_sections,
        diff_summary=diff_summary,
        snapshot=normalized_snapshot,
        rollback_target_revision_id=rollback_target_revision_id,
    )
    db.add(revision)
    db.flush()
    return revision


def create_deliverable_content_revision(
    db: Session,
    deliverable: models.Deliverable,
    *,
    snapshot: dict | None,
    previous_snapshot: dict | None = None,
    source: str = CONTENT_REVISION_SOURCE_MANUAL_EDIT,
    revision_summary: str | None = None,
    rollback_target_revision_id: str | None = None,
    source_version_event_id: str | None = None,
) -> models.DeliverableContentRevision | None:
    normalized_snapshot = normalize_deliverable_content_snapshot(snapshot)
    normalized_previous = normalize_deliverable_content_snapshot(previous_snapshot)
    changed_sections, diff_summary = build_content_diff_summary(
        normalized_previous,
        normalized_snapshot,
        section_labels=DELIVERABLE_SECTION_LABELS,
    )
    if source != CONTENT_REVISION_SOURCE_RUNTIME_BACKFILL and not changed_sections:
        return None

    revision = models.DeliverableContentRevision(
        deliverable_id=deliverable.id,
        task_id=deliverable.task_id,
        source=source,
        revision_summary=_build_revision_summary(
            changed_sections,
            section_labels=DELIVERABLE_SECTION_LABELS,
            source=source,
            object_label="交付物",
            override=revision_summary,
        ),
        changed_sections=changed_sections,
        diff_summary=diff_summary,
        snapshot=normalized_snapshot,
        version_tag=(deliverable.version_tag or f"v{deliverable.version}").strip(),
        deliverable_status=(deliverable.status or "draft").strip() or "draft",
        source_version_event_id=source_version_event_id,
        rollback_target_revision_id=rollback_target_revision_id,
    )
    db.add(revision)
    db.flush()
    return revision


def ensure_matter_content_revisions(
    db: Session,
    matter_workspace: models.MatterWorkspace,
) -> list[models.MatterContentRevision]:
    existing_revisions = list_matter_content_revisions(db, matter_workspace.id)
    if existing_revisions or not has_non_empty_matter_snapshot(matter_workspace.content_sections):
        return existing_revisions

    create_matter_content_revision(
        db,
        matter_workspace,
        snapshot=matter_workspace.content_sections,
        previous_snapshot={},
        source=CONTENT_REVISION_SOURCE_RUNTIME_BACKFILL,
    )
    db.commit()
    return list_matter_content_revisions(db, matter_workspace.id)


def ensure_deliverable_content_revisions(
    db: Session,
    deliverable: models.Deliverable,
) -> list[models.DeliverableContentRevision]:
    existing_revisions = list_deliverable_content_revisions(db, deliverable.id)
    if existing_revisions or not has_non_empty_deliverable_snapshot(deliverable.content_sections):
        return existing_revisions

    create_deliverable_content_revision(
        db,
        deliverable,
        snapshot=deliverable.content_sections,
        previous_snapshot={},
        source=CONTENT_REVISION_SOURCE_RUNTIME_BACKFILL,
    )
    db.commit()
    return list_deliverable_content_revisions(db, deliverable.id)
