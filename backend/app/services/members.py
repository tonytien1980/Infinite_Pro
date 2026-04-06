from __future__ import annotations

import secrets

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.auth import CurrentMember
from app.domain import models
from app.identity import schemas as identity_schemas


def serialize_member_row(row: models.FirmMembership) -> identity_schemas.MemberRead:
    return identity_schemas.MemberRead(
        id=row.id,
        email=row.user.email,
        full_name=row.user.full_name,
        role=row.role,  # type: ignore[arg-type]
        status="active" if row.status == "active" else "disabled",
    )


def serialize_invite_row(row: models.FirmInvite) -> identity_schemas.MemberInviteRead:
    return identity_schemas.MemberInviteRead(
        id=row.id,
        email=row.invited_email,
        role=row.role,  # type: ignore[arg-type]
        status=row.status,  # type: ignore[arg-type]
    )


def list_firm_members(
    db: Session,
    *,
    current_member: CurrentMember,
) -> identity_schemas.MemberListResponse:
    memberships = db.scalars(
        select(models.FirmMembership)
        .options(selectinload(models.FirmMembership.user))
        .where(models.FirmMembership.firm_id == current_member.firm.id)
        .order_by(models.FirmMembership.created_at.asc())
    ).all()
    invites = db.scalars(
        select(models.FirmInvite)
        .where(models.FirmInvite.firm_id == current_member.firm.id)
        .where(models.FirmInvite.status == "pending")
        .order_by(models.FirmInvite.created_at.desc())
    ).all()
    return identity_schemas.MemberListResponse(
        members=[serialize_member_row(item) for item in memberships],
        pending_invites=[serialize_invite_row(item) for item in invites],
    )


def create_firm_invite(
    db: Session,
    *,
    current_member: CurrentMember,
    payload: identity_schemas.MemberInviteCreateRequest,
) -> identity_schemas.MemberInviteRead:
    normalized_email = payload.email.strip().lower()
    if not normalized_email:
        raise HTTPException(status_code=400, detail="請先輸入受邀 email。")

    existing_membership = db.scalar(
        select(models.FirmMembership)
        .join(models.User, models.User.id == models.FirmMembership.user_id)
        .where(models.FirmMembership.firm_id == current_member.firm.id)
        .where(models.User.email == normalized_email)
    )
    if existing_membership is not None:
        raise HTTPException(status_code=400, detail="這個成員已經在 firm 內。")

    existing_invite = db.scalar(
        select(models.FirmInvite)
        .where(models.FirmInvite.firm_id == current_member.firm.id)
        .where(models.FirmInvite.invited_email == normalized_email)
        .where(models.FirmInvite.status == "pending")
    )
    if existing_invite is not None:
        raise HTTPException(status_code=400, detail="這個 email 目前已有待接受邀請。")

    invite = models.FirmInvite(
        firm_id=current_member.firm.id,
        invited_email=normalized_email,
        role=payload.role,
        invite_token=secrets.token_urlsafe(24),
        status="pending",
        invited_by_user_id=current_member.user.id,
    )
    db.add(invite)
    db.commit()
    db.refresh(invite)
    return serialize_invite_row(invite)


def update_firm_membership(
    db: Session,
    *,
    current_member: CurrentMember,
    membership_id: str,
    payload: identity_schemas.MemberUpdateRequest,
) -> identity_schemas.MemberRead:
    membership = db.scalar(
        select(models.FirmMembership)
        .options(selectinload(models.FirmMembership.user))
        .where(models.FirmMembership.id == membership_id)
        .where(models.FirmMembership.firm_id == current_member.firm.id)
    )
    if membership is None:
        raise HTTPException(status_code=404, detail="找不到指定成員。")

    membership.role = payload.role
    membership.status = "active" if payload.status == "active" else "disabled"
    db.add(membership)
    db.commit()
    db.refresh(membership)
    db.refresh(membership.user)
    return serialize_member_row(membership)
