from __future__ import annotations

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.domain import models
from app.domain import schemas as domain_schemas
from app.services.precedent_duplicate_governance import (
    apply_matter_precedent_duplicate_review,
    build_precedent_duplicate_contract,
)
from app.services.precedent_intelligence import (
    PRECEDENT_REVIEW_PRIORITY_RANK,
    classify_precedent_review_priority,
)
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


def get_precedent_review_state(db: Session) -> schemas.PrecedentReviewResponse:
    rows = (
        db.scalars(
            select(models.PrecedentCandidate)
            .options(
                selectinload(models.PrecedentCandidate.task),
                selectinload(models.PrecedentCandidate.matter_workspace),
                selectinload(models.PrecedentCandidate.deliverable),
                selectinload(models.PrecedentCandidate.recommendation),
            )
            .order_by(models.PrecedentCandidate.updated_at.desc())
        )
        .unique()
        .all()
    )

    ranked_items: list[tuple[int, int, float, float, schemas.PrecedentReviewItemResponse]] = []
    for row in rows:
        review_priority, review_priority_reason, nuance_rank = classify_precedent_review_priority(
            row.candidate_status,
            row.source_feedback_status,
        )
        item = schemas.PrecedentReviewItemResponse(
            id=row.id,
            candidate_type=row.candidate_type,  # type: ignore[arg-type]
            candidate_status=row.candidate_status,  # type: ignore[arg-type]
            review_priority=review_priority,  # type: ignore[arg-type]
            review_priority_reason=review_priority_reason,
            title=row.title or "",
            summary=row.summary or "",
            reusable_reason=row.reusable_reason or "",
            lane_id=row.lane_id or "",
            continuity_mode=row.continuity_mode or "one_off",
            deliverable_type=row.deliverable_type,
            client_stage=row.client_stage,
            client_type=row.client_type,
            matter_workspace_id=row.matter_workspace_id,
            matter_title=row.matter_workspace.title if row.matter_workspace else None,
            task_id=row.task_id,
            task_title=row.task.title if row.task else "",
            deliverable_id=row.source_deliverable_id,
            deliverable_title=row.deliverable.title if row.deliverable else None,
            recommendation_id=row.source_recommendation_id,
            recommendation_summary=row.recommendation.summary if row.recommendation else None,
            created_at=row.created_at.isoformat(),
            updated_at=row.updated_at.isoformat(),
        )
        ranked_items.append(
            (
                PRECEDENT_REVIEW_PRIORITY_RANK[review_priority],
                nuance_rank,
                -row.updated_at.timestamp(),
                -row.created_at.timestamp(),
                item,
            )
        )

    ranked_items.sort(key=lambda entry: entry[:4])
    items = [entry[4] for entry in ranked_items]
    duplicate_summary, duplicate_candidates = build_precedent_duplicate_contract(
        db,
        candidate_rows=rows,
    )

    return schemas.PrecedentReviewResponse(
        summary=schemas.PrecedentReviewSummaryResponse(
            total_items=len(items),
            candidate_count=sum(1 for item in items if item.candidate_status == "candidate"),
            promoted_count=sum(1 for item in items if item.candidate_status == "promoted"),
            dismissed_count=sum(1 for item in items if item.candidate_status == "dismissed"),
            high_priority_count=sum(1 for item in items if item.review_priority == "high"),
            medium_priority_count=sum(1 for item in items if item.review_priority == "medium"),
            low_priority_count=sum(1 for item in items if item.review_priority == "low"),
        ),
        items=items,
        duplicate_summary=schemas.PrecedentDuplicateSummaryResponse(
            pending_review_count=duplicate_summary.pending_review_count,
            human_confirmed_count=duplicate_summary.human_confirmed_count,
            kept_separate_count=duplicate_summary.kept_separate_count,
            split_count=duplicate_summary.split_count,
            summary=duplicate_summary.summary,
        ),
        duplicate_candidates=[
            schemas.PrecedentDuplicateCandidateResponse(
                review_key=item.review_key,
                review_status=item.review_status.value,  # type: ignore[arg-type]
                suggested_action=item.suggested_action,
                confidence_level=item.confidence_level,
                consultant_summary=item.consultant_summary,
                canonical_candidate_id=item.canonical_candidate_id,
                canonical_title=item.canonical_title,
                matter_workspace_id=item.matter_workspace_id,
                matter_title=item.matter_title,
                candidate_type=item.candidate_type.value,  # type: ignore[arg-type]
                candidate_ids=item.candidate_ids,
                candidate_titles=item.candidate_titles,
                task_ids=item.task_ids,
                task_titles=item.task_titles,
                candidate_count=item.candidate_count,
                resolution_note=item.resolution_note,
                resolved_at=item.resolved_at.isoformat() if item.resolved_at else None,
            )
            for item in duplicate_candidates
        ],
    )


def update_precedent_duplicate_review_state(
    db: Session,
    *,
    matter_workspace_id: str,
    payload: schemas.PrecedentDuplicateReviewRequest,
) -> schemas.PrecedentReviewResponse:
    apply_matter_precedent_duplicate_review(
        db,
        matter_workspace_id=matter_workspace_id,
        payload=domain_schemas.MatterPrecedentDuplicateReviewRequest(
            review_key=payload.review_key,
            resolution=payload.resolution,
            note=payload.note,
        ),
    )
    return get_precedent_review_state(db)
