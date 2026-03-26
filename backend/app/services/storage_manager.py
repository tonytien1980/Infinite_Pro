from __future__ import annotations

import hashlib
import re
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path

from app.core.config import settings

RAW_STORAGE_KIND = "raw_intake"
DERIVED_STORAGE_KIND = "derived_extract"
RELEASE_STORAGE_KIND = "released_artifact"

STORAGE_PROVIDER_LOCAL = "local_fs"

SUPPORT_LEVEL_FULL = "full"
SUPPORT_LEVEL_LIMITED = "limited"
SUPPORT_LEVEL_UNSUPPORTED = "unsupported"

RETENTION_POLICY_RAW_DEFAULT = "raw_default_30d"
RETENTION_POLICY_RAW_ACTIVE = "raw_active_90d"
RETENTION_POLICY_DERIVED = "derived_180d"
RETENTION_POLICY_RELEASE = "release_365d"
RETENTION_POLICY_FAILED = "failed_7d"

RETENTION_STATE_SCHEDULED = "scheduled"
RETENTION_STATE_EXPIRING_SOON = "expiring_soon"
RETENTION_STATE_EXPIRED = "expired"
RETENTION_STATE_PERMANENT = "record_only"

AVAILABILITY_AVAILABLE = "available"
AVAILABILITY_METADATA_ONLY = "metadata_only"
AVAILABILITY_REFERENCE_ONLY = "reference_only"
AVAILABILITY_PENDING_PURGE = "pending_purge"
AVAILABILITY_PURGED = "purged"


@dataclass(frozen=True)
class StoredObject:
    storage_key: str
    absolute_path: str
    digest: str
    file_size: int


def ensure_storage_directories() -> None:
    settings.upload_path.mkdir(parents=True, exist_ok=True)
    settings.derived_path.mkdir(parents=True, exist_ok=True)
    settings.release_path.mkdir(parents=True, exist_ok=True)


def compute_digest(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()


def normalize_extension(file_name: str, fallback: str = ".bin") -> str:
    suffix = Path(file_name).suffix.lower().strip()
    if not suffix:
        return fallback
    if re.fullmatch(r"\.[a-z0-9]{1,12}", suffix):
        return suffix
    return fallback


def sanitize_storage_segment(value: str, fallback: str) -> str:
    normalized = re.sub(r"[^a-zA-Z0-9._-]+", "-", value.strip()).strip("-")
    return normalized or fallback


def write_bytes(storage_key: str, content: bytes) -> StoredObject:
    ensure_storage_directories()
    target_path = settings.storage_root_path / storage_key
    target_path.parent.mkdir(parents=True, exist_ok=True)
    if not target_path.exists():
        target_path.write_bytes(content)
    return StoredObject(
        storage_key=storage_key,
        absolute_path=str(target_path),
        digest=compute_digest(content),
        file_size=len(content),
    )


def write_text(storage_key: str, text: str) -> StoredObject:
    return write_bytes(storage_key, text.encode("utf-8"))


def read_bytes(storage_key: str) -> bytes | None:
    target_path = settings.storage_root_path / storage_key
    if not target_path.exists():
        return None
    return target_path.read_bytes()


def file_exists(storage_key: str | None) -> bool:
    if not storage_key:
        return False
    return (settings.storage_root_path / storage_key).exists()


def build_raw_storage_key(*, digest: str, extension: str) -> str:
    return f"uploads/raw/{digest}{extension}"


def build_derived_storage_key(*, source_document_id: str, file_name: str, extension: str = ".txt") -> str:
    normalized_name = sanitize_storage_segment(Path(file_name).stem, "source")
    return f"derived/{source_document_id}/{normalized_name}{extension}"


def build_release_storage_key(artifact_key: str) -> str:
    normalized_key = artifact_key.strip("/").replace("\\", "/")
    if normalized_key.startswith("releases/"):
        return normalized_key
    return f"releases/{normalized_key}"


def calculate_purge_at(
    *,
    created_at: datetime | None,
    retention_policy: str,
) -> datetime | None:
    created = created_at or datetime.now(timezone.utc)
    if retention_policy == RETENTION_POLICY_RAW_DEFAULT:
        return created + timedelta(days=settings.raw_upload_retention_days)
    if retention_policy == RETENTION_POLICY_RAW_ACTIVE:
        return created + timedelta(days=settings.active_raw_upload_retention_days)
    if retention_policy == RETENTION_POLICY_DERIVED:
        return created + timedelta(days=settings.derived_retention_days)
    if retention_policy == RETENTION_POLICY_RELEASE:
        return created + timedelta(days=settings.release_retention_days)
    if retention_policy == RETENTION_POLICY_FAILED:
        return created + timedelta(days=settings.failed_upload_retention_days)
    return None


def retention_state_for(purge_at: datetime | None, *, now: datetime | None = None) -> str:
    if purge_at is None:
        return RETENTION_STATE_PERMANENT
    current = now or datetime.now(timezone.utc)
    if purge_at <= current:
        return RETENTION_STATE_EXPIRED
    if purge_at <= current + timedelta(days=3):
        return RETENTION_STATE_EXPIRING_SOON
    return RETENTION_STATE_SCHEDULED

