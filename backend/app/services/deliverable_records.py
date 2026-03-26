from __future__ import annotations

import re
from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.domain import models
from app.services.artifact_storage import persist_artifact_content
from app.services.storage_manager import RETENTION_POLICY_RELEASE, calculate_purge_at

DELIVERABLE_EVENT_DRAFT_CREATED = "draft_created"
DELIVERABLE_EVENT_CONTENT_UPDATED = "content_updated"
DELIVERABLE_EVENT_CONTENT_ROLLED_BACK = "content_rolled_back"
DELIVERABLE_EVENT_STATUS_CHANGED = "status_changed"
DELIVERABLE_EVENT_VERSION_TAG_UPDATED = "version_tag_updated"
DELIVERABLE_EVENT_EXPORTED = "exported"
DELIVERABLE_EVENT_PUBLISHED = "published"
DELIVERABLE_EVENT_NOTE_ADDED = "note_added"

DELIVERABLE_EVENT_SOURCE_RUNTIME_BACKFILL = "runtime_backfill"
DELIVERABLE_EVENT_SOURCE_METADATA_UPDATE = "deliverable_metadata_update"
DELIVERABLE_EVENT_SOURCE_CONTENT_UPDATE = "deliverable_content_update"
DELIVERABLE_EVENT_SOURCE_CONTENT_ROLLBACK = "deliverable_content_rollback"
DELIVERABLE_EVENT_SOURCE_EXPORT = "deliverable_export"
DELIVERABLE_EVENT_SOURCE_PUBLISH = "deliverable_publish"
DELIVERABLE_EVENT_SOURCE_HOST_BOOTSTRAP = "host_bootstrap"

DELIVERABLE_ARTIFACT_KIND_EXPORT = "export"
DELIVERABLE_ARTIFACT_KIND_RELEASE = "release"
DELIVERABLE_ARTIFACT_AVAILABILITY_AVAILABLE = "available"
DELIVERABLE_ARTIFACT_AVAILABILITY_METADATA_ONLY = "metadata_only"

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


def build_deliverable_artifact_key(
    deliverable_id: str,
    version_tag: str,
    artifact_kind: str,
    file_name: str,
) -> str:
    version_segment = re.sub(r"[^a-zA-Z0-9._-]+", "-", (version_tag or "unversioned")).strip("-")
    return f"deliverables/{deliverable_id}/{version_segment or 'unversioned'}/{artifact_kind}/{file_name}"


def list_deliverable_artifact_records(
    db: Session,
    deliverable_id: str,
) -> list[models.DeliverableArtifactRecord]:
    return db.scalars(
        select(models.DeliverableArtifactRecord)
        .where(models.DeliverableArtifactRecord.deliverable_id == deliverable_id)
        .order_by(
            models.DeliverableArtifactRecord.created_at.desc(),
            models.DeliverableArtifactRecord.id.desc(),
        )
    ).all()


def list_deliverable_publish_records(
    db: Session,
    deliverable_id: str,
) -> list[models.DeliverablePublishRecord]:
    return db.scalars(
        select(models.DeliverablePublishRecord)
        .where(models.DeliverablePublishRecord.deliverable_id == deliverable_id)
        .order_by(
            models.DeliverablePublishRecord.created_at.desc(),
            models.DeliverablePublishRecord.id.desc(),
        )
    ).all()


def create_deliverable_artifact_record(
    db: Session,
    deliverable: models.Deliverable,
    *,
    artifact_kind: str,
    artifact_format: str,
    version_tag: str,
    deliverable_status: str | None,
    file_name: str,
    mime_type: str,
    content_bytes: bytes | None,
    availability_state: str = DELIVERABLE_ARTIFACT_AVAILABILITY_AVAILABLE,
    source_version_event: models.DeliverableVersionEvent | None = None,
    publish_record: models.DeliverablePublishRecord | None = None,
    created_at: datetime | None = None,
) -> models.DeliverableArtifactRecord:
    if source_version_event is not None:
        existing = db.scalar(
            select(models.DeliverableArtifactRecord).where(
                models.DeliverableArtifactRecord.source_version_event_id == source_version_event.id
            )
        )
        if existing is not None:
            if publish_record is not None and existing.publish_record_id != publish_record.id:
                existing.publish_record_id = publish_record.id
                db.add(existing)
                db.flush()
            return existing

    artifact_key = build_deliverable_artifact_key(
        deliverable.id,
        version_tag,
        artifact_kind,
        file_name,
    )
    stored_storage_key = build_deliverable_artifact_key(
        deliverable.id,
        version_tag,
        artifact_kind,
        file_name,
    )
    stored_digest = None
    stored_size = 0
    if content_bytes is not None:
        stored_storage_key, stored_digest, stored_size = persist_artifact_content(
            artifact_key,
            content_bytes,
        )

    artifact_record = models.DeliverableArtifactRecord(
        deliverable_id=deliverable.id,
        task_id=deliverable.task_id,
        publish_record_id=publish_record.id if publish_record is not None else None,
        source_version_event_id=source_version_event.id if source_version_event is not None else None,
        artifact_kind=artifact_kind,
        artifact_format=artifact_format,
        version_tag=version_tag,
        deliverable_status=deliverable_status,
        file_name=file_name,
        mime_type=mime_type,
        artifact_key=stored_storage_key,
        storage_provider="local_fs",
        retention_policy=RETENTION_POLICY_RELEASE,
        purge_at=calculate_purge_at(
            created_at=created_at or models.utc_now(),
            retention_policy=RETENTION_POLICY_RELEASE,
        ),
        availability_state=availability_state,
        artifact_digest=stored_digest,
        file_size=stored_size,
        artifact_blob=None,
        created_at=created_at or models.utc_now(),
    )
    db.add(artifact_record)
    db.flush()
    return artifact_record


def create_deliverable_publish_record(
    db: Session,
    deliverable: models.Deliverable,
    *,
    version_tag: str,
    deliverable_status: str | None,
    publish_note: str = "",
    artifact_formats: list[str] | None = None,
    source_version_event: models.DeliverableVersionEvent | None = None,
    created_at: datetime | None = None,
) -> models.DeliverablePublishRecord:
    if source_version_event is not None:
        existing = db.scalar(
            select(models.DeliverablePublishRecord).where(
                models.DeliverablePublishRecord.source_version_event_id == source_version_event.id
            )
        )
        if existing is not None:
            return existing

    publish_record = models.DeliverablePublishRecord(
        deliverable_id=deliverable.id,
        task_id=deliverable.task_id,
        source_version_event_id=source_version_event.id if source_version_event is not None else None,
        version_tag=version_tag,
        deliverable_status=deliverable_status,
        publish_note=publish_note.strip(),
        artifact_formats=artifact_formats or [],
        created_at=created_at or models.utc_now(),
    )
    db.add(publish_record)
    db.flush()
    return publish_record


def ensure_deliverable_release_records(
    db: Session,
    deliverable: models.Deliverable,
    *,
    fallback_status: str | None = None,
) -> tuple[list[models.DeliverableArtifactRecord], list[models.DeliverablePublishRecord]]:
    version_events = ensure_deliverable_version_events(
        db,
        deliverable,
        fallback_status=fallback_status,
    )
    existing_artifacts = list_deliverable_artifact_records(db, deliverable.id)
    existing_publish_records = list_deliverable_publish_records(db, deliverable.id)
    if existing_artifacts or existing_publish_records:
        return existing_artifacts, existing_publish_records

    has_changes = False
    chronological_events = sorted(
        version_events,
        key=lambda item: (item.created_at, item.id),
    )

    for event in chronological_events:
        payload = event.event_payload if isinstance(event.event_payload, dict) else {}
        if event.event_type == DELIVERABLE_EVENT_EXPORTED:
            artifact_format = str(payload.get("artifact_format", "")).strip()
            file_name = str(payload.get("file_name", "")).strip()
            artifact_kind = str(payload.get("artifact_kind", DELIVERABLE_ARTIFACT_KIND_EXPORT)).strip() or DELIVERABLE_ARTIFACT_KIND_EXPORT
            if not artifact_format or not file_name:
                continue
            create_deliverable_artifact_record(
                db,
                deliverable,
                artifact_kind=artifact_kind,
                artifact_format=artifact_format,
                version_tag=event.version_tag or default_deliverable_version_tag(deliverable),
                deliverable_status=event.deliverable_status,
                file_name=file_name,
                mime_type=str(payload.get("mime_type", "application/octet-stream")).strip()
                or "application/octet-stream",
                content_bytes=None,
                availability_state=DELIVERABLE_ARTIFACT_AVAILABILITY_METADATA_ONLY,
                source_version_event=event,
                created_at=event.created_at,
            )
            has_changes = True
            continue

        if event.event_type == DELIVERABLE_EVENT_PUBLISHED:
            publish_note = str(payload.get("publish_note", "") or payload.get("note", "")).strip()
            artifact_formats = payload.get("artifact_formats", [])
            if not isinstance(artifact_formats, list):
                artifact_formats = []
            artifact_formats = [str(item).strip() for item in artifact_formats if str(item).strip()]
            create_deliverable_publish_record(
                db,
                deliverable,
                version_tag=event.version_tag or default_deliverable_version_tag(deliverable),
                deliverable_status=event.deliverable_status or fallback_status or deliverable.status,
                publish_note=publish_note,
                artifact_formats=artifact_formats,
                source_version_event=event,
                created_at=event.created_at,
            )
            has_changes = True

    if has_changes:
        db.commit()

    return (
        list_deliverable_artifact_records(db, deliverable.id),
        list_deliverable_publish_records(db, deliverable.id),
    )
