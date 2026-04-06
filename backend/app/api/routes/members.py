from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.auth import require_permission
from app.core.database import get_db
from app.identity import schemas as identity_schemas
from app.services.members import create_firm_invite, list_firm_members, update_firm_membership

router = APIRouter(prefix="/members", tags=["members"])


@router.get("", response_model=identity_schemas.MemberListResponse)
def list_members_route(
    current_member=Depends(require_permission("manage_members")),
    db: Session = Depends(get_db),
) -> identity_schemas.MemberListResponse:
    return list_firm_members(db, current_member=current_member)


@router.post("/invites", response_model=identity_schemas.MemberInviteRead)
def create_member_invite_route(
    payload: identity_schemas.MemberInviteCreateRequest,
    current_member=Depends(require_permission("manage_members")),
    db: Session = Depends(get_db),
) -> identity_schemas.MemberInviteRead:
    return create_firm_invite(db, current_member=current_member, payload=payload)


@router.patch("/{membership_id}", response_model=identity_schemas.MemberRead)
def update_firm_membership_route(
    membership_id: str,
    payload: identity_schemas.MemberUpdateRequest,
    current_member=Depends(require_permission("manage_members")),
    db: Session = Depends(get_db),
) -> identity_schemas.MemberRead:
    return update_firm_membership(
        db,
        current_member=current_member,
        membership_id=membership_id,
        payload=payload,
    )
