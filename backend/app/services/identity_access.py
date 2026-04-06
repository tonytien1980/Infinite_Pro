from __future__ import annotations

from dataclasses import dataclass
import secrets
from urllib.parse import urlencode

import httpx
from fastapi import HTTPException, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core import auth as auth_core
from app.core.config import settings
from app.domain import models
from app.identity import schemas as identity_schemas


@dataclass
class GoogleIdentity:
    subject: str
    email: str
    email_verified: bool
    full_name: str
    avatar_url: str | None


@dataclass
class AuthLoginResult:
    user: models.User
    firm: models.Firm
    membership: models.FirmMembership


def build_google_authorization_url(request: Request) -> tuple[str, str]:
    if not settings.google_client_id:
        raise HTTPException(status_code=503, detail="目前尚未設定 Google Login。")

    state = secrets.token_urlsafe(24)
    request.session["google_oauth_state"] = state
    redirect_uri = f"{settings.app_base_url}{settings.google_oauth_redirect_path}"
    params = urlencode(
        {
            "client_id": settings.google_client_id,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": "openid email profile",
            "state": state,
            "prompt": "select_account",
        }
    )
    return state, f"https://accounts.google.com/o/oauth2/v2/auth?{params}"


def exchange_google_code_for_identity(code: str) -> GoogleIdentity:
    if not settings.google_client_id or not settings.google_client_secret:
        raise HTTPException(status_code=503, detail="目前尚未設定 Google Login。")

    redirect_uri = f"{settings.app_base_url}{settings.google_oauth_redirect_path}"
    token_response = httpx.post(
        "https://oauth2.googleapis.com/token",
        data={
            "code": code,
            "client_id": settings.google_client_id,
            "client_secret": settings.google_client_secret,
            "redirect_uri": redirect_uri,
            "grant_type": "authorization_code",
        },
        timeout=30.0,
    )
    token_response.raise_for_status()
    access_token = token_response.json()["access_token"]

    profile_response = httpx.get(
        "https://openidconnect.googleapis.com/v1/userinfo",
        headers={"Authorization": f"Bearer {access_token}"},
        timeout=30.0,
    )
    profile_response.raise_for_status()
    profile = profile_response.json()

    return GoogleIdentity(
        subject=profile["sub"],
        email=profile["email"].lower(),
        email_verified=bool(profile.get("email_verified")),
        full_name=profile.get("name", ""),
        avatar_url=profile.get("picture"),
    )


def upsert_google_identity_and_membership(
    db: Session,
    *,
    identity: GoogleIdentity,
) -> AuthLoginResult:
    bootstrapped_new_firm = False
    firm = db.scalar(select(models.Firm).order_by(models.Firm.created_at.asc()))
    if firm is None:
        if identity.email.lower() not in settings.bootstrap_owner_email_list:
            raise HTTPException(status_code=403, detail="尚未獲邀加入這個 firm。")
        firm = models.Firm(
            name=settings.default_firm_name,
            slug=settings.default_firm_slug,
        )
        db.add(firm)
        db.flush()
        bootstrapped_new_firm = True

    user = db.scalar(select(models.User).where(models.User.email == identity.email.lower()))
    if user is None:
        user = models.User(
            email=identity.email.lower(),
            full_name=identity.full_name,
            avatar_url=identity.avatar_url,
        )
        db.add(user)
        db.flush()
    else:
        user.full_name = identity.full_name or user.full_name
        user.avatar_url = identity.avatar_url or user.avatar_url
        db.add(user)

    auth_identity = db.scalar(
        select(models.AuthIdentity)
        .where(models.AuthIdentity.provider == "google")
        .where(models.AuthIdentity.provider_subject == identity.subject)
    )
    if auth_identity is None:
        auth_identity = models.AuthIdentity(
            user_id=user.id,
            provider="google",
            provider_subject=identity.subject,
            email=identity.email.lower(),
            email_verified=identity.email_verified,
        )
    else:
        auth_identity.email = identity.email.lower()
        auth_identity.email_verified = identity.email_verified
    db.add(auth_identity)

    membership = db.scalar(
        select(models.FirmMembership)
        .where(models.FirmMembership.firm_id == firm.id)
        .where(models.FirmMembership.user_id == user.id)
    )
    if membership is None:
        invite = db.scalar(
            select(models.FirmInvite)
            .where(models.FirmInvite.firm_id == firm.id)
            .where(models.FirmInvite.invited_email == identity.email.lower())
            .where(models.FirmInvite.status == "pending")
            .order_by(models.FirmInvite.created_at.desc())
        )
        if invite is None:
            if not bootstrapped_new_firm:
                raise HTTPException(status_code=403, detail="尚未獲邀加入這個 firm。")
            membership_role = "owner"
            invited_by_user_id = None
        else:
            membership_role = invite.role
            invited_by_user_id = invite.invited_by_user_id
            invite.status = "accepted"
            invite.accepted_at = models.utc_now()
            db.add(invite)

        membership = models.FirmMembership(
            firm_id=firm.id,
            user_id=user.id,
            role=membership_role,
            status="active",
            invited_by_user_id=invited_by_user_id,
        )
        db.add(membership)

    db.commit()
    db.refresh(user)
    db.refresh(firm)
    db.refresh(membership)
    return AuthLoginResult(user=user, firm=firm, membership=membership)


def issue_user_session(
    db: Session,
    *,
    request: Request,
    membership: models.FirmMembership,
    user: models.User,
) -> models.UserSession:
    session_row = models.UserSession(
        user_id=user.id,
        membership_id=membership.id,
        session_token=secrets.token_urlsafe(32),
        status="active",
    )
    db.add(session_row)
    db.commit()
    db.refresh(session_row)
    request.session[auth_core.SESSION_STATE_KEY] = session_row.session_token
    return session_row


def complete_google_login(
    db: Session,
    request: Request,
    *,
    code: str,
    state: str,
) -> identity_schemas.SessionStateResponse:
    expected_state = request.session.get("google_oauth_state")
    if not expected_state or state != expected_state:
        raise HTTPException(status_code=400, detail="Google 登入 state 不一致，請重新登入。")

    identity = exchange_google_code_for_identity(code)
    if not identity.email_verified:
        raise HTTPException(status_code=403, detail="Google 帳號尚未完成 email 驗證。")

    auth_result = upsert_google_identity_and_membership(db, identity=identity)
    issue_user_session(db, request=request, membership=auth_result.membership, user=auth_result.user)
    request.session.pop("google_oauth_state", None)
    return auth_core.build_session_state_response(
        auth_result.user,
        auth_result.firm,
        auth_result.membership,
    )
