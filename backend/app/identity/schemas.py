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
