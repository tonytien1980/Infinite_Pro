from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class SessionUserRead(BaseModel):
    id: str
    email: str
    full_name: str
    avatar_url: str | None = None


class SessionFirmRead(BaseModel):
    id: str
    name: str
    slug: str


class SessionMembershipRead(BaseModel):
    id: str
    role: Literal["owner", "consultant", "demo"]
    status: Literal["active", "disabled"]


class SessionStateResponse(BaseModel):
    user: SessionUserRead
    firm: SessionFirmRead
    membership: SessionMembershipRead
    permissions: list[str] = Field(default_factory=list)


class GoogleStartResponse(BaseModel):
    state: str
    authorization_url: str


class MemberRead(BaseModel):
    id: str
    email: str
    full_name: str
    role: Literal["owner", "consultant", "demo"]
    status: Literal["active", "disabled"]


class MemberInviteCreateRequest(BaseModel):
    email: str
    role: Literal["consultant", "demo"]


class MemberInviteRead(BaseModel):
    id: str
    email: str
    role: Literal["consultant", "demo"]
    status: Literal["pending", "accepted", "revoked"]


class MemberUpdateRequest(BaseModel):
    role: Literal["owner", "consultant", "demo"]
    status: Literal["active", "disabled"]


class MemberListSummary(BaseModel):
    active_demo_member_count: int = 0
    pending_demo_invite_count: int = 0


class MemberListResponse(BaseModel):
    members: list[MemberRead] = Field(default_factory=list)
    pending_invites: list[MemberInviteRead] = Field(default_factory=list)
    summary: MemberListSummary = Field(default_factory=MemberListSummary)
