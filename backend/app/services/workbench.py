from __future__ import annotations

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.domain import models
from app.workbench import schemas

DEFAULT_WORKBENCH_PROFILE = "single_consultant_default"
DEFAULT_WORKBENCH_PREFERENCES = schemas.WorkbenchPreferenceResponse()


def _get_or_create_preference_row(db: Session) -> models.WorkbenchPreference:
    row = db.scalars(
        select(models.WorkbenchPreference).where(
            models.WorkbenchPreference.profile_key == DEFAULT_WORKBENCH_PROFILE
        )
    ).one_or_none()
    if row is not None:
        return row

    row = models.WorkbenchPreference(
        profile_key=DEFAULT_WORKBENCH_PROFILE,
        interface_language=DEFAULT_WORKBENCH_PREFERENCES.interface_language,
        theme_preference=DEFAULT_WORKBENCH_PREFERENCES.theme_preference,
        homepage_display_preference=DEFAULT_WORKBENCH_PREFERENCES.homepage_display_preference,
        history_default_page_size=DEFAULT_WORKBENCH_PREFERENCES.history_default_page_size,
        show_recent_activity=DEFAULT_WORKBENCH_PREFERENCES.show_recent_activity,
        show_frequent_extensions=DEFAULT_WORKBENCH_PREFERENCES.show_frequent_extensions,
        new_task_default_input_mode=DEFAULT_WORKBENCH_PREFERENCES.new_task_default_input_mode,
        density=DEFAULT_WORKBENCH_PREFERENCES.density,
        deliverable_sort_preference=DEFAULT_WORKBENCH_PREFERENCES.deliverable_sort_preference,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def _serialize_preferences(
    row: models.WorkbenchPreference,
) -> schemas.WorkbenchPreferenceResponse:
    return schemas.WorkbenchPreferenceResponse(
        interface_language=row.interface_language,  # type: ignore[arg-type]
        theme_preference=row.theme_preference,  # type: ignore[arg-type]
        homepage_display_preference=row.homepage_display_preference,  # type: ignore[arg-type]
        history_default_page_size=row.history_default_page_size,
        show_recent_activity=row.show_recent_activity,
        show_frequent_extensions=row.show_frequent_extensions,
        new_task_default_input_mode=row.new_task_default_input_mode,  # type: ignore[arg-type]
        density=row.density,  # type: ignore[arg-type]
        deliverable_sort_preference=row.deliverable_sort_preference,  # type: ignore[arg-type]
    )


def get_workbench_preferences(db: Session) -> schemas.WorkbenchPreferenceResponse:
    row = _get_or_create_preference_row(db)
    return _serialize_preferences(row)


def update_workbench_preferences(
    db: Session,
    payload: schemas.WorkbenchPreferenceUpdateRequest,
) -> schemas.WorkbenchPreferenceResponse:
    row = _get_or_create_preference_row(db)
    row.interface_language = payload.interface_language
    row.theme_preference = payload.theme_preference
    row.homepage_display_preference = payload.homepage_display_preference
    row.history_default_page_size = payload.history_default_page_size
    row.show_recent_activity = payload.show_recent_activity
    row.show_frequent_extensions = payload.show_frequent_extensions
    row.new_task_default_input_mode = payload.new_task_default_input_mode
    row.density = payload.density
    row.deliverable_sort_preference = payload.deliverable_sort_preference
    db.add(row)
    db.commit()
    db.refresh(row)
    return _serialize_preferences(row)


def get_history_visibility_state(db: Session) -> schemas.HistoryVisibilityStateResponse:
    hidden_task_ids = db.scalars(
        select(models.TaskVisibilityState.task_id)
        .where(models.TaskVisibilityState.profile_key == DEFAULT_WORKBENCH_PROFILE)
        .where(models.TaskVisibilityState.visibility_state == "hidden")
        .order_by(models.TaskVisibilityState.updated_at.desc())
    ).all()
    return schemas.HistoryVisibilityStateResponse(hidden_task_ids=hidden_task_ids)


def update_history_visibility_state(
    db: Session,
    payload: schemas.HistoryVisibilityUpdateRequest,
) -> schemas.HistoryVisibilityStateResponse:
    if not payload.task_ids:
        return get_history_visibility_state(db)

    existing_task_ids = set(
        db.scalars(select(models.Task.id).where(models.Task.id.in_(payload.task_ids))).all()
    )
    missing_task_ids = [task_id for task_id in payload.task_ids if task_id not in existing_task_ids]
    if missing_task_ids:
        raise HTTPException(
            status_code=404,
            detail=f"找不到指定工作紀錄：{', '.join(missing_task_ids[:3])}",
        )

    existing_rows = {
        row.task_id: row
        for row in db.scalars(
            select(models.TaskVisibilityState)
            .where(models.TaskVisibilityState.profile_key == DEFAULT_WORKBENCH_PROFILE)
            .where(models.TaskVisibilityState.task_id.in_(payload.task_ids))
        ).all()
    }

    now = models.utc_now()

    for task_id in payload.task_ids:
        row = existing_rows.get(task_id)
        if row is None:
            row = models.TaskVisibilityState(
                profile_key=DEFAULT_WORKBENCH_PROFILE,
                task_id=task_id,
            )
        row.visibility_state = payload.visibility_state
        row.hidden_at = now if payload.visibility_state == "hidden" else None
        db.add(row)

    db.commit()
    return get_history_visibility_state(db)
