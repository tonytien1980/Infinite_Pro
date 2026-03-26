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
from app.services.system_provider_settings import (
    get_system_provider_settings,
    reset_system_provider_settings_to_env,
    revalidate_system_provider_settings,
    update_system_provider_settings,
    validate_system_provider_settings,
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


@router.get("/provider-settings", response_model=schemas.SystemProviderSettingsResponse)
def get_system_provider_settings_route(
    db: Session = Depends(get_db),
) -> schemas.SystemProviderSettingsResponse:
    return get_system_provider_settings(db)


@router.post(
    "/provider-settings/validate",
    response_model=schemas.ProviderValidationResponse,
)
def validate_system_provider_settings_route(
    payload: schemas.SystemProviderSettingsValidateRequest,
    db: Session = Depends(get_db),
) -> schemas.ProviderValidationResponse:
    return validate_system_provider_settings(db, payload)


@router.put("/provider-settings", response_model=schemas.SystemProviderSettingsResponse)
def update_system_provider_settings_route(
    payload: schemas.SystemProviderSettingsUpdateRequest,
    db: Session = Depends(get_db),
) -> schemas.SystemProviderSettingsResponse:
    return update_system_provider_settings(db, payload)


@router.post("/provider-settings/revalidate", response_model=schemas.SystemProviderSettingsResponse)
def revalidate_system_provider_settings_route(
    db: Session = Depends(get_db),
) -> schemas.SystemProviderSettingsResponse:
    return revalidate_system_provider_settings(db)


@router.post("/provider-settings/reset-to-env", response_model=schemas.SystemProviderSettingsResponse)
def reset_system_provider_settings_route(
    db: Session = Depends(get_db),
) -> schemas.SystemProviderSettingsResponse:
    return reset_system_provider_settings_to_env(db)


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
