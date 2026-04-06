from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

from fastapi import Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.domain import models
from app.identity import schemas as identity_schemas

SESSION_STATE_KEY = "user_session_token"

Permission = Literal[
    "access_firm_workspace",
    "access_demo_workspace",
    "view_agents",
    "view_packs",
    "manage_members",
    "manage_agents",
    "manage_packs",
    "manage_firm_settings",
    "govern_shared_intelligence",
    "sign_off_phase",
]

ROLE_PERMISSIONS: dict[str, set[str]] = {
    "owner": {
        "access_firm_workspace",
        "access_demo_workspace",
        "view_agents",
        "view_packs",
        "manage_members",
        "manage_agents",
        "manage_packs",
        "manage_firm_settings",
        "govern_shared_intelligence",
        "sign_off_phase",
    },
    "consultant": {
        "access_firm_workspace",
        "view_agents",
        "view_packs",
    },
    "demo": {
        "access_demo_workspace",
    },
}


def build_session_state_response(
    user: models.User,
    firm: models.Firm,
    membership: models.FirmMembership,
) -> identity_schemas.SessionStateResponse:
    return identity_schemas.SessionStateResponse(
        user=identity_schemas.SessionUserRead(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            avatar_url=user.avatar_url,
        ),
        firm=identity_schemas.SessionFirmRead(
            id=firm.id,
            name=firm.name,
            slug=firm.slug,
        ),
        membership=identity_schemas.SessionMembershipRead(
            id=membership.id,
            role=membership.role,  # type: ignore[arg-type]
            status="active" if membership.status == "active" else "disabled",
        ),
        permissions=sorted(ROLE_PERMISSIONS.get(membership.role, set())),
    )


@dataclass
class CurrentMember:
    user: models.User
    firm: models.Firm
    membership: models.FirmMembership
    permissions: set[str]

    def as_response(self) -> identity_schemas.SessionStateResponse:
        return build_session_state_response(self.user, self.firm, self.membership)


def require_current_member(
    request: Request,
    db: Session = Depends(get_db),
) -> CurrentMember:
    session_token = request.session.get(SESSION_STATE_KEY)
    if not session_token:
        raise HTTPException(status_code=401, detail="請先登入。")

    session_row = db.scalar(
        select(models.UserSession).where(models.UserSession.session_token == session_token)
    )
    if session_row is None or session_row.status != "active":
        raise HTTPException(status_code=401, detail="目前登入狀態已失效，請重新登入。")

    membership = db.get(models.FirmMembership, session_row.membership_id)
    user = db.get(models.User, session_row.user_id)
    firm = db.get(models.Firm, membership.firm_id) if membership is not None else None
    if membership is None or user is None or firm is None or membership.status != "active":
        raise HTTPException(status_code=401, detail="目前登入身份不可用，請重新登入。")

    return CurrentMember(
        user=user,
        firm=firm,
        membership=membership,
        permissions=ROLE_PERMISSIONS.get(membership.role, set()),
    )


def require_permission(permission: Permission):
    def dependency(current_member: CurrentMember = Depends(require_current_member)) -> CurrentMember:
        if permission not in current_member.permissions:
            raise HTTPException(status_code=403, detail="目前身份沒有這個操作權限。")
        return current_member

    return dependency


def revoke_current_session(db: Session, request: Request) -> None:
    session_token = request.session.get(SESSION_STATE_KEY)
    if session_token:
        session_row = db.scalar(
            select(models.UserSession).where(models.UserSession.session_token == session_token)
        )
        if session_row is not None:
            session_row.status = "revoked"
            db.add(session_row)
            db.commit()
    request.session.clear()
