from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.domain import models
from app.services.storage_manager import (
    RETENTION_POLICY_RELEASE,
    build_release_storage_key,
    calculate_purge_at,
    file_exists,
    read_bytes,
    write_bytes,
)


def persist_artifact_content(
    artifact_key: str,
    content_bytes: bytes,
) -> tuple[str, str, int]:
    storage_key = build_release_storage_key(artifact_key)
    stored = write_bytes(storage_key, content_bytes)
    return stored.storage_key, stored.digest, stored.file_size


def load_artifact_content(artifact_record: models.DeliverableArtifactRecord) -> bytes | None:
    storage_key = build_release_storage_key(artifact_record.artifact_key)
    stored = read_bytes(storage_key)
    if stored is not None:
        return stored
    return artifact_record.artifact_blob


def backfill_deliverable_artifact_storage(db: Session, deliverable_id: str) -> None:
    artifact_records = db.scalars(
        select(models.DeliverableArtifactRecord).where(
            models.DeliverableArtifactRecord.deliverable_id == deliverable_id
        )
    ).all()
    changed = False
    for artifact_record in artifact_records:
        if not artifact_record.retention_policy:
            artifact_record.retention_policy = RETENTION_POLICY_RELEASE
            changed = True
        if artifact_record.purge_at is None:
            artifact_record.purge_at = calculate_purge_at(
                created_at=artifact_record.created_at,
                retention_policy=artifact_record.retention_policy,
            )
            changed = True
        if not artifact_record.storage_provider:
            artifact_record.storage_provider = "local_fs"
            changed = True
        storage_key = build_release_storage_key(artifact_record.artifact_key)
        if artifact_record.artifact_blob and not file_exists(storage_key):
            persist_artifact_content(artifact_record.artifact_key, artifact_record.artifact_blob)
            changed = True
    if changed:
        db.commit()
