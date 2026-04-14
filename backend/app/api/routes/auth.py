from __future__ import annotations

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session
from starlette.responses import RedirectResponse

from app.core.auth import require_current_member, revoke_current_session
from app.core.config import settings
from app.core.database import get_db
from app.identity import schemas as identity_schemas
from app.services.identity_access import (
    build_google_authorization_url,
    build_post_login_redirect_url,
    complete_google_login,
    consume_post_login_next_path,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/google/start", response_model=identity_schemas.GoogleStartResponse)
def start_google_login(
    request: Request,
    next: str | None = Query(default=None),
) -> identity_schemas.GoogleStartResponse:
    state, authorization_url = build_google_authorization_url(request, next_path=next)
    return identity_schemas.GoogleStartResponse(
        state=state,
        authorization_url=authorization_url,
    )


@router.get("/google/callback")
def google_callback(
    code: str,
    state: str,
    request: Request,
    db: Session = Depends(get_db),
) -> RedirectResponse:
    complete_google_login(db, request, code=code, state=state)
    return RedirectResponse(
        url=build_post_login_redirect_url(
            settings.frontend_base_url,
            consume_post_login_next_path(request),
        ),
        status_code=302,
    )


@router.get("/me", response_model=identity_schemas.SessionStateResponse)
def get_current_session_route(
    current=Depends(require_current_member),
) -> identity_schemas.SessionStateResponse:
    return current.as_response()


@router.post("/logout")
def logout_route(
    request: Request,
    db: Session = Depends(get_db),
) -> dict[str, str]:
    revoke_current_session(db, request)
    return {"status": "ok"}
