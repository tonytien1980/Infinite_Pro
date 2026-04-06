from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.domain import models
from app.workbench import schemas


def list_provider_allowlist(
    db: Session,
    *,
    firm_id: str,
) -> schemas.ProviderAllowlistResponse:
    rows = db.scalars(
        select(models.ProviderAllowlistEntry)
        .where(models.ProviderAllowlistEntry.firm_id == firm_id)
        .order_by(
            models.ProviderAllowlistEntry.provider_id.asc(),
            models.ProviderAllowlistEntry.model_level.asc(),
        )
    ).all()
    return schemas.ProviderAllowlistResponse(
        entries=[
            schemas.ProviderAllowlistEntryResponse(
                provider_id=row.provider_id,  # type: ignore[arg-type]
                model_level=row.model_level,  # type: ignore[arg-type]
                allowed_model_ids=list(row.allowed_model_ids or []),
                allow_custom_model=row.allow_custom_model,
                status="active" if row.status == "active" else "inactive",
            )
            for row in rows
        ]
    )


def get_allowlist_entry(
    db: Session,
    *,
    firm_id: str,
    provider_id: str,
    model_level: str,
) -> models.ProviderAllowlistEntry | None:
    return db.scalar(
        select(models.ProviderAllowlistEntry).where(
            models.ProviderAllowlistEntry.firm_id == firm_id,
            models.ProviderAllowlistEntry.provider_id == provider_id,
            models.ProviderAllowlistEntry.model_level == model_level,
        )
    )


def update_provider_allowlist(
    db: Session,
    *,
    firm_id: str,
    payload: schemas.ProviderAllowlistUpdateRequest,
) -> schemas.ProviderAllowlistResponse:
    existing_rows = {
        (row.provider_id, row.model_level): row
        for row in db.scalars(
            select(models.ProviderAllowlistEntry).where(
                models.ProviderAllowlistEntry.firm_id == firm_id
            )
        ).all()
    }
    seen_keys: set[tuple[str, str]] = set()

    for entry in payload.entries:
        key = (entry.provider_id, entry.model_level)
        seen_keys.add(key)
        row = existing_rows.get(key)
        if row is None:
            row = models.ProviderAllowlistEntry(
                firm_id=firm_id,
                provider_id=entry.provider_id,
                model_level=entry.model_level,
            )
        row.allowed_model_ids = list(dict.fromkeys(entry.allowed_model_ids))
        row.allow_custom_model = entry.allow_custom_model
        row.status = "active" if entry.status == "active" else "inactive"
        db.add(row)

    for key, row in existing_rows.items():
        if key not in seen_keys:
            db.delete(row)

    db.commit()
    return list_provider_allowlist(db, firm_id=firm_id)
