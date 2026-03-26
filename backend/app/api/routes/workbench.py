from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.workbench import (
    get_history_visibility_state,
    get_workbench_preferences,
    update_history_visibility_state,
    update_workbench_preferences,
)
from app.workbench import schemas

router = APIRouter(prefix="/workbench", tags=["workbench"])


@router.get("/preferences", response_model=schemas.WorkbenchPreferenceResponse)
def get_workbench_preferences_route(
    db: Session = Depends(get_db),
) -> schemas.WorkbenchPreferenceResponse:
    return get_workbench_preferences(db)


@router.put("/preferences", response_model=schemas.WorkbenchPreferenceResponse)
def update_workbench_preferences_route(
    payload: schemas.WorkbenchPreferenceUpdateRequest,
    db: Session = Depends(get_db),
) -> schemas.WorkbenchPreferenceResponse:
    return update_workbench_preferences(db, payload)


@router.get("/history-visibility", response_model=schemas.HistoryVisibilityStateResponse)
def get_history_visibility_route(
    db: Session = Depends(get_db),
) -> schemas.HistoryVisibilityStateResponse:
    return get_history_visibility_state(db)


@router.put("/history-visibility", response_model=schemas.HistoryVisibilityStateResponse)
def update_history_visibility_route(
    payload: schemas.HistoryVisibilityUpdateRequest,
    db: Session = Depends(get_db),
) -> schemas.HistoryVisibilityStateResponse:
    return update_history_visibility_state(db, payload)
