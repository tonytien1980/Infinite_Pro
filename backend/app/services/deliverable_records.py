from __future__ import annotations

from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.domain import models

DELIVERABLE_EVENT_DRAFT_CREATED = "draft_created"
DELIVERABLE_EVENT_CONTENT_UPDATED = "content_updated"
DELIVERABLE_EVENT_STATUS_CHANGED = "status_changed"
DELIVERABLE_EVENT_VERSION_TAG_UPDATED = "version_tag_updated"
DELIVERABLE_EVENT_EXPORTED = "exported"
DELIVERABLE_EVENT_PUBLISHED = "published"
DELIVERABLE_EVENT_NOTE_ADDED = "note_added"

DELIVERABLE_EVENT_SOURCE_RUNTIME_BACKFILL = "runtime_backfill"
DELIVERABLE_EVENT_SOURCE_METADATA_UPDATE = "deliverable_metadata_update"
DELIVERABLE_EVENT_SOURCE_EXPORT = "deliverable_export"
DELIVERABLE_EVENT_SOURCE_HOST_BOOTSTRAP = "host_bootstrap"

DELIVERABLE_STATUS_LABELS = {
    "draft": "草稿",
    "pending_confirmation": "待確認",
    "final": "定稿",
    "archived": "封存",
}


def default_deliverable_version_tag(deliverable: models.Deliverable) -> str:
    return (deliverable.version_tag or f"v{deliverable.version}").strip()


def label_for_deliverable_status(status: str | None) -> str:
    normalized = (status or "draft").strip()
    return DELIVERABLE_STATUS_LABELS.get(normalized, normalized or "draft")


def build_deliverable_version_event_key(
    event_type: str,
    *,
    version_tag: str | None = None,
    deliverable_status: str | None = None,
    summary: str = "",
    event_payload: dict | None = None,
) -> str | None:
    payload = event_payload if isinstance(event_payload, dict) else {}
    source = str(payload.get("source", "")).strip()
    if source != DELIVERABLE_EVENT_SOURCE_RUNTIME_BACKFILL:
        return None

    normalized_version_tag = (version_tag or "").strip() or "-"
    normalized_status = (deliverable_status or "").strip() or "-"
    normalized_summary = summary.strip() or "-"
    return "::".join(
        [
            "deliverable_event",
            source,
            event_type.strip() or "-",
            normalized_version_tag,
            normalized_status,
            normalized_summary,
        ]
    )


def normalize_deliverable_version_events(
    db: Session,
    deliverable_id: str,
) -> list[models.DeliverableVersionEvent]:
    events = db.scalars(
        select(models.DeliverableVersionEvent)
        .where(models.DeliverableVersionEvent.deliverable_id == deliverable_id)
        .order_by(
            models.DeliverableVersionEvent.created_at.asc(),
            models.DeliverableVersionEvent.id.asc(),
        )
    ).all()
    if not events:
        return []

    seen_keys: set[str] = set()
    has_changes = False

    for event in events:
        resolved_event_key = event.event_key or build_deliverable_version_event_key(
            event.event_type,
            version_tag=event.version_tag,
            deliverable_status=event.deliverable_status,
            summary=event.summary,
            event_payload=event.event_payload,
        )
        if not resolved_event_key:
            continue

        if resolved_event_key in seen_keys:
            db.delete(event)
            has_changes = True
            continue

        seen_keys.add(resolved_event_key)
        if event.event_key != resolved_event_key:
            event.event_key = resolved_event_key
            has_changes = True

    if has_changes:
        db.commit()

    return list_deliverable_version_events(db, deliverable_id)


def record_deliverable_version_event(
    db: Session,
    deliverable: models.Deliverable,
    event_type: str,
    *,
    event_key: str | None = None,
    version_tag: str | None = None,
    deliverable_status: str | None = None,
    summary: str = "",
    event_payload: dict | None = None,
    created_at: datetime | None = None,
) -> models.DeliverableVersionEvent:
    payload = event_payload or {}
    resolved_event_key = (event_key or "").strip() or build_deliverable_version_event_key(
        event_type,
        version_tag=version_tag or default_deliverable_version_tag(deliverable),
        deliverable_status=deliverable_status or deliverable.status,
        summary=summary,
        event_payload=payload,
    )
    if resolved_event_key:
        existing_event = db.scalar(
            select(models.DeliverableVersionEvent).where(
                models.DeliverableVersionEvent.deliverable_id == deliverable.id,
                models.DeliverableVersionEvent.event_key == resolved_event_key,
            )
        )
        if existing_event is not None:
            return existing_event

    event = models.DeliverableVersionEvent(
        deliverable_id=deliverable.id,
        task_id=deliverable.task_id,
        event_type=event_type,
        event_key=resolved_event_key,
        version_tag=(version_tag or default_deliverable_version_tag(deliverable)).strip(),
        deliverable_status=(deliverable_status or deliverable.status or "").strip() or None,
        summary=summary.strip(),
        event_payload=payload,
        created_at=created_at or models.utc_now(),
    )
    db.add(event)
    db.flush()
    return event


def list_deliverable_version_events(
    db: Session,
    deliverable_id: str,
) -> list[models.DeliverableVersionEvent]:
    return db.scalars(
        select(models.DeliverableVersionEvent)
        .where(models.DeliverableVersionEvent.deliverable_id == deliverable_id)
        .order_by(models.DeliverableVersionEvent.created_at.desc())
    ).all()


def ensure_deliverable_version_events(
    db: Session,
    deliverable: models.Deliverable,
    *,
    fallback_status: str | None = None,
) -> list[models.DeliverableVersionEvent]:
    existing_events = normalize_deliverable_version_events(db, deliverable.id)
    if existing_events:
        return existing_events

    created_at = deliverable.generated_at or models.utc_now()
    version_tag = default_deliverable_version_tag(deliverable)
    current_status = (fallback_status or deliverable.status or "draft").strip() or "draft"
    baseline_payload = {
        "source": DELIVERABLE_EVENT_SOURCE_RUNTIME_BACKFILL,
        "deliverable_title": deliverable.title,
        "deliverable_version": deliverable.version,
    }
    try:
        record_deliverable_version_event(
            db,
            deliverable,
            DELIVERABLE_EVENT_DRAFT_CREATED,
            event_key=f"runtime_backfill:draft_created:{version_tag}",
            version_tag=version_tag,
            deliverable_status="draft",
            summary=f"回填既有交付物基線：{deliverable.title}",
            event_payload=baseline_payload,
            created_at=created_at,
        )
        if current_status != "draft":
            record_deliverable_version_event(
                db,
                deliverable,
                DELIVERABLE_EVENT_STATUS_CHANGED,
                event_key=f"runtime_backfill:status_changed:{current_status}:{version_tag}",
                version_tag=version_tag,
                deliverable_status=current_status,
                summary=f"回填既有狀態：{label_for_deliverable_status(current_status)}",
                event_payload={
                    **baseline_payload,
                    "from_status": "draft",
                    "to_status": current_status,
                },
                created_at=created_at + timedelta(milliseconds=1),
            )
        if current_status == "final":
            record_deliverable_version_event(
                db,
                deliverable,
                DELIVERABLE_EVENT_PUBLISHED,
                event_key=f"runtime_backfill:published:{version_tag}",
                version_tag=version_tag,
                deliverable_status=current_status,
                summary=f"回填既有定稿發布：{version_tag}",
                event_payload=baseline_payload,
                created_at=created_at + timedelta(milliseconds=2),
            )
        db.commit()
    except IntegrityError:
        db.rollback()

    return normalize_deliverable_version_events(db, deliverable.id)
