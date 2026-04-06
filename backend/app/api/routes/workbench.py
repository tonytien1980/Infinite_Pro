from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.auth import require_permission
from app.core.database import get_db
from app.services.personal_provider_settings import (
    get_personal_provider_settings,
    revalidate_personal_provider_settings,
    update_personal_provider_settings,
    validate_personal_provider_settings,
)
from app.services.provider_allowlist import list_provider_allowlist, update_provider_allowlist
from app.services.workbench import (
    apply_precedent_governance_recommendation,
    get_history_visibility_state,
    get_precedent_review_state,
    get_workbench_preferences,
    sign_off_shared_intelligence_phase,
    update_precedent_duplicate_review_state,
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
    current_member=Depends(require_permission("access_firm_workspace")),
    db: Session = Depends(get_db),
) -> schemas.WorkbenchPreferenceResponse:
    return get_workbench_preferences(db)


@router.put("/preferences", response_model=schemas.WorkbenchPreferenceResponse)
def update_workbench_preferences_route(
    payload: schemas.WorkbenchPreferenceUpdateRequest,
    current_member=Depends(require_permission("access_firm_workspace")),
    db: Session = Depends(get_db),
) -> schemas.WorkbenchPreferenceResponse:
    return update_workbench_preferences(db, payload)


@router.get(
    "/personal-provider-settings",
    response_model=schemas.PersonalProviderSettingsResponse,
)
def get_personal_provider_settings_route(
    current_member=Depends(require_permission("access_firm_workspace")),
    db: Session = Depends(get_db),
) -> schemas.PersonalProviderSettingsResponse:
    return get_personal_provider_settings(db, user_id=current_member.user.id)


@router.post(
    "/personal-provider-settings/validate",
    response_model=schemas.ProviderValidationResponse,
)
def validate_personal_provider_settings_route(
    payload: schemas.PersonalProviderSettingsValidateRequest,
    current_member=Depends(require_permission("access_firm_workspace")),
    db: Session = Depends(get_db),
) -> schemas.ProviderValidationResponse:
    return validate_personal_provider_settings(db, current_member=current_member, payload=payload)


@router.put(
    "/personal-provider-settings",
    response_model=schemas.PersonalProviderSettingsResponse,
)
def update_personal_provider_settings_route(
    payload: schemas.PersonalProviderSettingsUpdateRequest,
    current_member=Depends(require_permission("access_firm_workspace")),
    db: Session = Depends(get_db),
) -> schemas.PersonalProviderSettingsResponse:
    return update_personal_provider_settings(db, current_member=current_member, payload=payload)


@router.post(
    "/personal-provider-settings/revalidate",
    response_model=schemas.PersonalProviderSettingsResponse,
)
def revalidate_personal_provider_settings_route(
    current_member=Depends(require_permission("access_firm_workspace")),
    db: Session = Depends(get_db),
) -> schemas.PersonalProviderSettingsResponse:
    return revalidate_personal_provider_settings(db, current_member=current_member)


@router.get("/provider-allowlist", response_model=schemas.ProviderAllowlistResponse)
def get_provider_allowlist_route(
    current_member=Depends(require_permission("access_firm_workspace")),
    db: Session = Depends(get_db),
) -> schemas.ProviderAllowlistResponse:
    return list_provider_allowlist(db, firm_id=current_member.firm.id)


@router.put("/provider-allowlist", response_model=schemas.ProviderAllowlistResponse)
def update_provider_allowlist_route(
    payload: schemas.ProviderAllowlistUpdateRequest,
    current_member=Depends(require_permission("manage_firm_settings")),
    db: Session = Depends(get_db),
) -> schemas.ProviderAllowlistResponse:
    return update_provider_allowlist(db, firm_id=current_member.firm.id, payload=payload)


@router.get("/provider-settings", response_model=schemas.SystemProviderSettingsResponse)
def get_system_provider_settings_route(
    current_member=Depends(require_permission("manage_firm_settings")),
    db: Session = Depends(get_db),
) -> schemas.SystemProviderSettingsResponse:
    return get_system_provider_settings(db)


@router.post(
    "/provider-settings/validate",
    response_model=schemas.ProviderValidationResponse,
)
def validate_system_provider_settings_route(
    payload: schemas.SystemProviderSettingsValidateRequest,
    current_member=Depends(require_permission("manage_firm_settings")),
    db: Session = Depends(get_db),
) -> schemas.ProviderValidationResponse:
    return validate_system_provider_settings(db, payload)


@router.put("/provider-settings", response_model=schemas.SystemProviderSettingsResponse)
def update_system_provider_settings_route(
    payload: schemas.SystemProviderSettingsUpdateRequest,
    current_member=Depends(require_permission("manage_firm_settings")),
    db: Session = Depends(get_db),
) -> schemas.SystemProviderSettingsResponse:
    return update_system_provider_settings(db, payload)


@router.post("/provider-settings/revalidate", response_model=schemas.SystemProviderSettingsResponse)
def revalidate_system_provider_settings_route(
    current_member=Depends(require_permission("manage_firm_settings")),
    db: Session = Depends(get_db),
) -> schemas.SystemProviderSettingsResponse:
    return revalidate_system_provider_settings(db)


@router.post("/provider-settings/reset-to-env", response_model=schemas.SystemProviderSettingsResponse)
def reset_system_provider_settings_route(
    current_member=Depends(require_permission("manage_firm_settings")),
    db: Session = Depends(get_db),
) -> schemas.SystemProviderSettingsResponse:
    return reset_system_provider_settings_to_env(db)


@router.get("/history-visibility", response_model=schemas.HistoryVisibilityStateResponse)
def get_history_visibility_route(
    current_member=Depends(require_permission("access_firm_workspace")),
    db: Session = Depends(get_db),
) -> schemas.HistoryVisibilityStateResponse:
    return get_history_visibility_state(db)


@router.put("/history-visibility", response_model=schemas.HistoryVisibilityStateResponse)
def update_history_visibility_route(
    payload: schemas.HistoryVisibilityUpdateRequest,
    current_member=Depends(require_permission("access_firm_workspace")),
    db: Session = Depends(get_db),
) -> schemas.HistoryVisibilityStateResponse:
    return update_history_visibility_state(db, payload)


@router.get("/precedent-candidates", response_model=schemas.PrecedentReviewResponse)
def get_precedent_review_route(
    current_member=Depends(require_permission("access_firm_workspace")),
    db: Session = Depends(get_db),
) -> schemas.PrecedentReviewResponse:
    return get_precedent_review_state(db)


@router.post(
    "/precedent-candidates/{candidate_id}/apply-governance-recommendation",
    response_model=schemas.PrecedentReviewResponse,
)
def apply_precedent_governance_recommendation_route(
    candidate_id: str,
    payload: schemas.PrecedentGovernanceApplyRequest,
    current_member=Depends(require_permission("govern_shared_intelligence")),
    db: Session = Depends(get_db),
) -> schemas.PrecedentReviewResponse:
    return apply_precedent_governance_recommendation(
        db,
        candidate_id=candidate_id,
        payload=payload,
    )


@router.post(
    "/shared-intelligence/phase-4-sign-off",
    response_model=schemas.PrecedentReviewResponse,
)
def sign_off_shared_intelligence_phase_route(
    payload: schemas.SharedIntelligenceSignOffRequest,
    current_member=Depends(require_permission("sign_off_phase")),
    db: Session = Depends(get_db),
) -> schemas.PrecedentReviewResponse:
    return sign_off_shared_intelligence_phase(db, payload=payload)


@router.post(
    "/matters/{matter_workspace_id}/precedent-duplicate-review",
    response_model=schemas.PrecedentReviewResponse,
)
def update_precedent_duplicate_review_route(
    matter_workspace_id: str,
    payload: schemas.PrecedentDuplicateReviewRequest,
    current_member=Depends(require_permission("govern_shared_intelligence")),
    db: Session = Depends(get_db),
) -> schemas.PrecedentReviewResponse:
    return update_precedent_duplicate_review_state(
        db,
        matter_workspace_id=matter_workspace_id,
        payload=payload,
    )
