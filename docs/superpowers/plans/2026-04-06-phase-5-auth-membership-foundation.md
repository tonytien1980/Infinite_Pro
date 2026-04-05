# Phase 5 Auth + Membership Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 為 Infinite Pro 建立單一 firm 雲端版的第一個正式地基：Google Login、owner 邀請制、owner / consultant / demo 角色、session、基本 server-side route guard，以及 owner 專用的 `/members` 管理頁。

**Architecture:** 這份 plan 只實作 `Single-Firm Cloud Foundation` 的第一個可上線子專案：`Auth + Membership Foundation`。後端新增 single-firm identity / membership domain、Google OAuth callback flow、signed session + DB-backed session row、permission bundle 與 members API；前端新增 login shell、session hydration、owner-only members surface 與最小 nav gating。`Personal Provider Settings`、provider allowlist 實際落地、demo workspace 資料隔離與完整 audit analytics 留在後續 phase-5 子計畫，不在這一份 plan 內同時施工。

**Tech Stack:** FastAPI, SQLAlchemy 2, Pydantic 2, httpx, Starlette SessionMiddleware, Next.js 15 App Router, React 19, TypeScript, node:test

---

## Scope Guard

這份 spec 涵蓋了多個 phase-5 子系統。為了讓第一刀是可完成、可驗證、可提交的雲端地基，這份 implementation plan 只處理：

- Google Login
- first-owner bootstrap 規則
- `User / Firm / Membership / Invite / Session` 資料模型
- owner / consultant / demo 角色解析
- backend current-member / permission gate
- owner-only `/members`
- 前端 login / auth shell / nav gating

這份 plan **不處理**：

- `Personal Provider Settings`
- consultant 自己的加密 API key 介面
- provider allowlist 實際 UI
- demo dataset / demo workspace 讀取體驗
- multi-tenant / multi-firm

---

## File Structure

### Backend

- Create: `backend/app/identity/__init__.py`
  - identity package 入口
- Create: `backend/app/identity/schemas.py`
  - auth / membership / members API 的 Pydantic contract
- Create: `backend/app/core/auth.py`
  - session cookie、current member resolve、permission helpers
- Create: `backend/app/services/identity_access.py`
  - Google callback exchange、first-owner bootstrap、membership resolution、session issue / revoke
- Create: `backend/app/services/members.py`
  - owner invite、member list、role update、member deactivate
- Create: `backend/app/api/routes/auth.py`
  - `/auth/google/start`
  - `/auth/google/callback`
  - `/auth/me`
  - `/auth/logout`
- Create: `backend/app/api/routes/members.py`
  - `/members`
  - `/members/invites`
  - `/members/{membership_id}`
- Modify: `backend/app/core/config.py`
  - Google OAuth、session、first-owner bootstrap、firm defaults
- Modify: `backend/app/domain/models.py`
  - 新增 single-firm cloud foundation 所需 tables
- Modify: `backend/app/core/database.py`
  - create_all / incremental schema patch / index / normalization
- Modify: `backend/app/main.py`
  - SessionMiddleware、public routes 保持可用
- Modify: `backend/app/api/router.py`
  - auth / members routers 接進主 router
- Modify: `backend/app/api/routes/tasks.py`
  - require authenticated member
- Modify: `backend/app/api/routes/matters.py`
  - require authenticated member
- Modify: `backend/app/api/routes/deliverables.py`
  - require authenticated member
- Modify: `backend/app/api/routes/uploads.py`
  - require authenticated member
- Modify: `backend/app/api/routes/runs.py`
  - require authenticated member
- Modify: `backend/app/api/routes/extensions.py`
  - read allowed to owner / consultant，write owner-only
- Modify: `backend/app/api/routes/workbench.py`
  - preferences authenticated
  - system provider settings owner-only
  - phase sign-off owner-only
- Test: `backend/tests/test_mvp_slice.py`
  - auth bootstrap / callback / me / logout
  - owner invite / member role update
  - route permission coverage

### Frontend

- Create: `frontend/src/lib/session.ts`
  - session fetch、route role gating、public-path helpers
- Create: `frontend/src/lib/permissions.ts`
  - nav / CTA / page visibility helpers
- Create: `frontend/src/components/login-page-panel.tsx`
  - Google login 入口與 invite-required copy
- Create: `frontend/src/components/members-page-panel.tsx`
  - owner-only members management UI
- Create: `frontend/src/app/login/page.tsx`
  - login page entry
- Create: `frontend/src/app/members/page.tsx`
  - owner-only members page
- Create: `frontend/tests/auth-foundation.test.mjs`
  - session / permission / nav helper tests
- Modify: `frontend/src/lib/api.ts`
  - auth / members API methods
- Modify: `frontend/src/lib/types.ts`
  - auth session、membership、member invite、permission contracts
- Modify: `frontend/src/components/app-shell.tsx`
  - session hydrate、public login shell、owner-only nav item、auth redirect
- Modify: `frontend/src/app/layout.tsx`
  - metadata copy 與 login-friendly shell context

### Docs

- Modify: `docs/01_runtime_architecture_and_data_contracts.md`
  - single-firm identity / membership / session contract
- Modify: `docs/03_workbench_ux_and_page_spec.md`
  - `/login`、`/members`、firm settings vs personal settings bridge note
- Modify: `docs/04_qa_matrix.md`
  - phase-5 auth foundation verification evidence

---

### Task 1: Backend Identity / Session Foundation

**Files:**
- Create: `backend/app/identity/__init__.py`
- Create: `backend/app/identity/schemas.py`
- Create: `backend/app/core/auth.py`
- Create: `backend/app/services/identity_access.py`
- Create: `backend/app/api/routes/auth.py`
- Modify: `backend/app/core/config.py`
- Modify: `backend/app/domain/models.py`
- Modify: `backend/app/core/database.py`
- Modify: `backend/app/main.py`
- Modify: `backend/app/api/router.py`
- Test: `backend/tests/test_mvp_slice.py`

- [ ] **Step 1: Write the failing backend tests for Google callback, first-owner bootstrap, and session readback**

```python
def login_google_user(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
    *,
    email: str,
    full_name: str,
) -> dict:
    from app.services import identity_access

    def fake_exchange_google_code(*_args, **_kwargs):
        return identity_access.GoogleIdentity(
            subject=f"subject-{email}",
            email=email,
            email_verified=True,
            full_name=full_name,
            avatar_url=None,
        )

    monkeypatch.setattr(
        identity_access,
        "exchange_google_code_for_identity",
        fake_exchange_google_code,
    )

    start = client.get("/api/v1/auth/google/start")
    assert start.status_code == 200
    state = start.json()["state"]

    callback = client.get(f"/api/v1/auth/google/callback?code=fake-code&state={state}")
    assert callback.status_code == 200
    return callback.json()


def test_google_callback_bootstraps_first_owner_when_email_is_allowlisted(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("GOOGLE_CLIENT_ID", "google-client")
    monkeypatch.setenv("GOOGLE_CLIENT_SECRET", "google-secret")
    monkeypatch.setenv("SESSION_SECRET_KEY", "phase5-session-secret")
    monkeypatch.setenv("BOOTSTRAP_OWNER_EMAILS", "owner@example.com")
    monkeypatch.setenv("DEFAULT_FIRM_NAME", "Infinite Pro Studio")

    body = login_google_user(
        client,
        monkeypatch,
        email="owner@example.com",
        full_name="Owner User",
    )
    assert body["membership"]["role"] == "owner"
    assert body["firm"]["name"] == "Infinite Pro Studio"

    me = client.get("/api/v1/auth/me")
    assert me.status_code == 200
    assert me.json()["membership"]["role"] == "owner"
    assert me.json()["user"]["email"] == "owner@example.com"


def test_google_callback_rejects_uninvited_non_bootstrap_email(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("GOOGLE_CLIENT_ID", "google-client")
    monkeypatch.setenv("GOOGLE_CLIENT_SECRET", "google-secret")
    monkeypatch.setenv("SESSION_SECRET_KEY", "phase5-session-secret")
    monkeypatch.setenv("BOOTSTRAP_OWNER_EMAILS", "owner@example.com")

    start = client.get("/api/v1/auth/google/start")
    state = start.json()["state"]

    from app.services import identity_access

    monkeypatch.setattr(
        identity_access,
        "exchange_google_code_for_identity",
        lambda *_args, **_kwargs: identity_access.GoogleIdentity(
            subject="google-subject-consultant",
            email="consultant@example.com",
            email_verified=True,
            full_name="Consultant User",
            avatar_url=None,
        ),
    )

    callback = client.get(f"/api/v1/auth/google/callback?code=fake-code&state={state}")
    assert callback.status_code == 403
    assert "尚未獲邀加入" in callback.json()["detail"]


def test_auth_me_requires_active_session(client: TestClient) -> None:
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401
    assert "請先登入" in response.json()["detail"]
```

- [ ] **Step 2: Run the targeted backend tests to verify they fail**

Run:

```bash
PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -k "google_callback or auth_me_requires_active_session" -q
```

Expected:

```text
FAIL: `/api/v1/auth/google/start` returns 404, or auth foundation imports fail because the route and services do not exist yet
```

- [ ] **Step 3: Add config, models, and session primitives**

```python
# backend/app/core/config.py
app_base_url: str = "http://127.0.0.1:3001"
google_client_id: str | None = None
google_client_secret: str | None = None
google_oauth_redirect_path: str = "/api/v1/auth/google/callback"
session_secret_key: str = "dev-infinite-pro-session-secret"
session_cookie_name: str = "infinite_pro_session"
bootstrap_owner_emails: str = ""
default_firm_name: str = "Infinite Pro"
default_firm_slug: str = "infinite-pro"

@property
def bootstrap_owner_email_list(self) -> list[str]:
    return [item.strip().lower() for item in self.bootstrap_owner_emails.split(",") if item.strip()]
```

```python
# backend/app/domain/models.py
class Firm(Base):
    __tablename__ = "firms"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)


class User(Base):
    __tablename__ = "users"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), default="")
    avatar_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)


class AuthIdentity(Base):
    __tablename__ = "auth_identities"
    __table_args__ = (UniqueConstraint("provider", "provider_subject", name="uq_auth_identity_provider_subject"),)
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    provider: Mapped[str] = mapped_column(String(50), nullable=False, default="google")
    provider_subject: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    email_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)


class FirmMembership(Base):
    __tablename__ = "firm_memberships"
    __table_args__ = (UniqueConstraint("firm_id", "user_id", name="uq_firm_membership_user"),)
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    firm_id: Mapped[str] = mapped_column(ForeignKey("firms.id"), nullable=False)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    role: Mapped[str] = mapped_column(String(30), nullable=False, default="consultant")
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="active")
    invited_by_user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)


class FirmInvite(Base):
    __tablename__ = "firm_invites"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    firm_id: Mapped[str] = mapped_column(ForeignKey("firms.id"), nullable=False)
    invited_email: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(30), nullable=False, default="consultant")
    invite_token: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="pending")
    invited_by_user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    accepted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)


class UserSession(Base):
    __tablename__ = "user_sessions"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    membership_id: Mapped[str] = mapped_column(ForeignKey("firm_memberships.id"), nullable=False)
    session_token: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="active")
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_seen_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)
```

```python
# backend/app/core/auth.py
SESSION_STATE_KEY = "user_session_token"

Permission = Literal[
    "access_firm_workspace",
    "view_agents",
    "view_packs",
    "manage_members",
    "manage_agents",
    "manage_packs",
    "manage_firm_settings",
    "govern_shared_intelligence",
    "sign_off_phase",
]
```

- [ ] **Step 4: Implement Google auth start/callback, current-member read model, and logout**

```python
# backend/app/identity/schemas.py
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
    permissions: list[str]


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


class MemberListResponse(BaseModel):
    members: list[MemberRead] = Field(default_factory=list)
    pending_invites: list[MemberInviteRead] = Field(default_factory=list)
```

```python
# backend/app/services/identity_access.py
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


def upsert_google_identity_and_membership(db: Session, *, identity: GoogleIdentity) -> AuthLoginResult:
    firm = db.scalar(select(models.Firm).order_by(models.Firm.created_at.asc()))
    if firm is None:
        if identity.email not in settings.bootstrap_owner_email_list:
            raise HTTPException(status_code=403, detail="目前尚未開放這個帳號進行 owner bootstrap。")
        firm = models.Firm(name=settings.default_firm_name, slug=settings.default_firm_slug)
        db.add(firm)
        db.flush()

    user = db.scalar(select(models.User).where(models.User.email == identity.email))
    if user is None:
        user = models.User(email=identity.email, full_name=identity.full_name, avatar_url=identity.avatar_url)
        db.add(user)
        db.flush()

    auth_identity = db.scalar(
        select(models.AuthIdentity)
        .where(models.AuthIdentity.provider == "google")
        .where(models.AuthIdentity.provider_subject == identity.subject)
    )
    if auth_identity is None:
        db.add(
            models.AuthIdentity(
                user_id=user.id,
                provider="google",
                provider_subject=identity.subject,
                email=identity.email,
                email_verified=identity.email_verified,
            )
        )

    membership = db.scalar(
        select(models.FirmMembership)
        .where(models.FirmMembership.firm_id == firm.id)
        .where(models.FirmMembership.user_id == user.id)
    )
    if membership is None:
        pending_invite = db.scalar(
            select(models.FirmInvite)
            .where(models.FirmInvite.firm_id == firm.id)
            .where(models.FirmInvite.invited_email == identity.email)
            .where(models.FirmInvite.status == "pending")
        )
        if pending_invite is None and identity.email not in settings.bootstrap_owner_email_list:
            raise HTTPException(status_code=403, detail="尚未獲邀加入這個 firm。")

        membership = models.FirmMembership(
            firm_id=firm.id,
            user_id=user.id,
            role="owner" if pending_invite is None else pending_invite.role,
            status="active",
            invited_by_user_id=pending_invite.invited_by_user_id if pending_invite else None,
        )
        db.add(membership)
        if pending_invite is not None:
            pending_invite.status = "accepted"
            pending_invite.accepted_at = models.utc_now()
            db.add(pending_invite)

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
    request.session["user_session_token"] = session_row.session_token
    return session_row


def build_session_state_response(
    user: models.User,
    firm: models.Firm,
    membership: models.FirmMembership,
) -> identity_schemas.SessionStateResponse:
    permissions = sorted(core_auth.ROLE_PERMISSIONS[membership.role])
    return identity_schemas.SessionStateResponse(
        user=identity_schemas.SessionUserRead(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            avatar_url=user.avatar_url,
        ),
        firm=identity_schemas.SessionFirmRead(id=firm.id, name=firm.name, slug=firm.slug),
        membership=identity_schemas.SessionMembershipRead(
            id=membership.id,
            role=membership.role,
            status=membership.status,
        ),
        permissions=permissions,
    )


def complete_google_login(db: Session, request: Request, *, code: str, state: str) -> identity_schemas.SessionStateResponse:
    expected_state = request.session.get("google_oauth_state")
    if not expected_state or state != expected_state:
        raise HTTPException(status_code=400, detail="Google 登入 state 不一致，請重新登入。")

    identity = exchange_google_code_for_identity(code)
    if not identity.email_verified:
        raise HTTPException(status_code=403, detail="Google 帳號尚未完成 email 驗證。")

    auth_result = upsert_google_identity_and_membership(db, identity=identity)
    issue_user_session(db, request=request, membership=auth_result.membership, user=auth_result.user)
    request.session.pop("google_oauth_state", None)
    return build_session_state_response(auth_result.user, auth_result.firm, auth_result.membership)
```

```python
# backend/app/core/auth.py
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
    firm = db.get(models.Firm, membership.firm_id) if membership else None
    if membership is None or user is None or firm is None or membership.status != "active":
        raise HTTPException(status_code=401, detail="目前登入身份不可用，請重新登入。")
    return CurrentMember(
        user=user,
        firm=firm,
        membership=membership,
        permissions=ROLE_PERMISSIONS[membership.role],
    )


def revoke_current_session(db: Session, request: Request) -> None:
    session_token = request.session.get(SESSION_STATE_KEY)
    if not session_token:
        request.session.clear()
        return
    session_row = db.scalar(
        select(models.UserSession).where(models.UserSession.session_token == session_token)
    )
    if session_row is not None:
        session_row.status = "revoked"
        db.add(session_row)
        db.commit()
    request.session.clear()
```

```python
# backend/app/api/routes/auth.py
@router.get("/google/start", response_model=identity_schemas.GoogleStartResponse)
def start_google_login(request: Request) -> identity_schemas.GoogleStartResponse:
    state, authorization_url = build_google_authorization_url(request)
    return identity_schemas.GoogleStartResponse(state=state, authorization_url=authorization_url)


@router.get("/google/callback", response_model=identity_schemas.SessionStateResponse)
def google_callback(
    code: str,
    state: str,
    request: Request,
    db: Session = Depends(get_db),
) -> identity_schemas.SessionStateResponse:
    return complete_google_login(db, request, code=code, state=state)


@router.get("/me", response_model=identity_schemas.SessionStateResponse)
def get_current_session_route(
    current=Depends(require_current_member),
) -> identity_schemas.SessionStateResponse:
    return current.as_response()


@router.post("/logout")
def logout_route(
    request: Request,
    db: Session = Depends(get_db),
):
    revoke_current_session(db, request)
    return {"status": "ok"}
```

```python
# backend/app/main.py
app.add_middleware(
    SessionMiddleware,
    secret_key=settings.session_secret_key,
    session_cookie=settings.session_cookie_name,
    same_site="lax",
    https_only=False,
)
```

- [ ] **Step 5: Run the targeted backend tests to verify they pass**

Run:

```bash
PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -k "google_callback or auth_me_requires_active_session" -q
```

Expected:

```text
3 passed
```

- [ ] **Step 6: Commit the backend auth foundation**

```bash
git add backend/app/core/config.py backend/app/domain/models.py backend/app/core/database.py backend/app/main.py backend/app/api/router.py backend/app/core/auth.py backend/app/identity/__init__.py backend/app/identity/schemas.py backend/app/services/identity_access.py backend/app/api/routes/auth.py backend/tests/test_mvp_slice.py
git commit -m "feat: add auth and membership foundation"
```

---

### Task 2: Permission Bundles and Members API

**Files:**
- Create: `backend/app/services/members.py`
- Create: `backend/app/api/routes/members.py`
- Modify: `backend/app/core/auth.py`
- Modify: `backend/app/api/router.py`
- Modify: `backend/app/api/routes/tasks.py`
- Modify: `backend/app/api/routes/matters.py`
- Modify: `backend/app/api/routes/deliverables.py`
- Modify: `backend/app/api/routes/uploads.py`
- Modify: `backend/app/api/routes/runs.py`
- Modify: `backend/app/api/routes/extensions.py`
- Modify: `backend/app/api/routes/workbench.py`
- Modify: `backend/app/identity/schemas.py`
- Test: `backend/tests/test_mvp_slice.py`

- [ ] **Step 1: Write failing tests for owner-only members management and route permission gates**

```python
def test_owner_can_invite_consultant_and_list_members(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    login_google_user(
        client,
        monkeypatch,
        email="owner@example.com",
        full_name="Owner User",
    )

    invite = client.post(
        "/api/v1/members/invites",
        json={"email": "consultant@example.com", "role": "consultant"},
    )
    assert invite.status_code == 200

    listing = client.get("/api/v1/members")
    assert listing.status_code == 200
    assert any(item["email"] == "consultant@example.com" for item in listing.json()["pending_invites"])


def test_consultant_cannot_invite_members_or_manage_agents(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    login_google_user(
        client,
        monkeypatch,
        email="owner@example.com",
        full_name="Owner User",
    )
    invite = client.post(
        "/api/v1/members/invites",
        json={"email": "consultant@example.com", "role": "consultant"},
    )
    assert invite.status_code == 200

    logout = client.post("/api/v1/auth/logout")
    assert logout.status_code == 200

    login_google_user(
        client,
        monkeypatch,
        email="consultant@example.com",
        full_name="Consultant User",
    )

    invite = client.post(
        "/api/v1/members/invites",
        json={"email": "new@example.com", "role": "consultant"},
    )
    assert invite.status_code == 403

    update_agent = client.put(
        "/api/v1/extensions/agents/operations_agent",
        json={
            "agent_id": "operations_agent",
            "agent_name": "Operations Agent",
            "agent_type": "specialist",
            "description": "updated by consultant",
            "supported_capabilities": [],
            "relevant_domain_packs": [],
            "relevant_industry_packs": [],
            "primary_responsibilities": [],
            "out_of_scope": [],
            "defer_rules": [],
            "preferred_execution_modes": [],
            "input_requirements": [],
            "minimum_evidence_readiness": [],
            "required_context_fields": [],
            "output_contract": [],
            "produced_objects": [],
            "deliverable_impact": [],
            "writeback_expectations": [],
            "invocation_rules": [],
            "escalation_rules": [],
            "handoff_targets": [],
            "evaluation_focus": [],
            "failure_modes_to_watch": [],
            "trace_requirements": [],
            "version": "1.0.0",
            "status": "active",
            "is_custom": False,
        },
    )
    assert update_agent.status_code == 403


def test_owner_can_sign_off_phase_but_consultant_cannot(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    login_google_user(
        client,
        monkeypatch,
        email="owner@example.com",
        full_name="Owner User",
    )
    invite = client.post(
        "/api/v1/members/invites",
        json={"email": "consultant@example.com", "role": "consultant"},
    )
    assert invite.status_code == 200

    owner_attempt = client.post(
        "/api/v1/workbench/shared-intelligence/phase-4-sign-off",
        json={"operator_label": "Owner User"},
    )
    assert owner_attempt.status_code in {200, 400}

    logout = client.post("/api/v1/auth/logout")
    assert logout.status_code == 200

    login_google_user(
        client,
        monkeypatch,
        email="consultant@example.com",
        full_name="Consultant User",
    )

    consultant_attempt = client.post(
        "/api/v1/workbench/shared-intelligence/phase-4-sign-off",
        json={"operator_label": "Consultant User"},
    )
    assert consultant_attempt.status_code == 403
```

- [ ] **Step 2: Run the targeted backend permission tests to verify they fail**

Run:

```bash
PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -k "invite_members or manage_agents or sign_off_phase" -q
```

Expected:

```text
FAIL because /members routes do not exist yet and consultant / owner permissions are not enforced
```

- [ ] **Step 3: Implement permission bundles and members service / routes**

```python
# backend/app/core/auth.py
ROLE_PERMISSIONS: dict[str, set[str]] = {
    "owner": {
        "access_firm_workspace",
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
    "demo": set(),
}


def require_permission(permission: Permission):
    def dependency(current_member: CurrentMember = Depends(require_current_member)) -> CurrentMember:
        if permission not in current_member.permissions:
            raise HTTPException(status_code=403, detail="目前身份沒有這個操作權限。")
        return current_member
    return dependency
```

```python
# backend/app/services/members.py
def list_firm_members(db: Session, *, current_member: CurrentMember) -> identity_schemas.MemberListResponse:
    memberships = db.scalars(
        select(models.FirmMembership)
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
    invite = models.FirmInvite(
        firm_id=current_member.firm.id,
        invited_email=payload.email.lower(),
        role=payload.role,
        invite_token=secrets.token_urlsafe(24),
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
        .where(models.FirmMembership.id == membership_id)
        .where(models.FirmMembership.firm_id == current_member.firm.id)
    )
    if membership is None:
        raise HTTPException(status_code=404, detail="找不到指定成員。")
    membership.role = payload.role
    membership.status = payload.status
    db.add(membership)
    db.commit()
    db.refresh(membership)
    return serialize_member_row(membership)


def serialize_member_row(row: models.FirmMembership) -> identity_schemas.MemberRead:
    return identity_schemas.MemberRead(
        id=row.id,
        email=row.user.email,
        full_name=row.user.full_name,
        role=row.role,
        status=row.status,
    )


def serialize_invite_row(row: models.FirmInvite) -> identity_schemas.MemberInviteRead:
    return identity_schemas.MemberInviteRead(
        id=row.id,
        email=row.invited_email,
        role=row.role,
        status=row.status,
    )
```

```python
# backend/app/api/routes/members.py
router = APIRouter(prefix="/members", tags=["members"])


@router.get("", response_model=identity_schemas.MemberListResponse)
def list_members_route(
    current_member=Depends(require_permission("manage_members")),
    db: Session = Depends(get_db),
):
    return list_firm_members(db, current_member=current_member)


@router.post("/invites", response_model=identity_schemas.MemberInviteRead)
def create_invite_route(
    payload: identity_schemas.MemberInviteCreateRequest,
    current_member=Depends(require_permission("manage_members")),
    db: Session = Depends(get_db),
):
    return create_firm_invite(db, current_member=current_member, payload=payload)
```

- [ ] **Step 4: Apply route guards to existing routers**

```python
# backend/app/api/routes/extensions.py
@router.get("/manager", response_model=workbench_schemas.ExtensionManagerSnapshot)
def get_extension_manager_route(
    current_member=Depends(require_current_member),
    db: Session = Depends(get_db),
):
    return get_extension_manager(db)


@router.put("/agents/{agent_id}", response_model=workbench_schemas.ExtensionManagerSnapshot)
def update_agent_catalog_entry_route(
    agent_id: str,
    payload: workbench_schemas.AgentCatalogEntryUpdateRequest,
    current_member=Depends(require_permission("manage_agents")),
    db: Session = Depends(get_db),
):
    return update_agent_catalog_entry(db, agent_id=agent_id, payload=payload)
```

```python
# backend/app/api/routes/workbench.py
@router.get("/provider-settings", response_model=schemas.SystemProviderSettingsResponse)
def get_system_provider_settings_route(
    current_member=Depends(require_permission("manage_firm_settings")),
    db: Session = Depends(get_db),
):
    return get_system_provider_settings(db)


@router.post("/shared-intelligence/phase-4-sign-off", response_model=schemas.PrecedentReviewResponse)
def sign_off_shared_intelligence_phase_route(
    payload: schemas.SharedIntelligenceSignOffRequest,
    current_member=Depends(require_permission("sign_off_phase")),
    db: Session = Depends(get_db),
):
    return sign_off_shared_intelligence_phase(db, payload=payload)
```

- [ ] **Step 5: Run the targeted backend permission tests to verify they pass**

Run:

```bash
PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -k "invite_members or manage_agents or sign_off_phase" -q
```

Expected:

```text
3 passed
```

- [ ] **Step 6: Commit the backend permission / members slice**

```bash
git add backend/app/core/auth.py backend/app/services/members.py backend/app/api/routes/members.py backend/app/api/router.py backend/app/api/routes/tasks.py backend/app/api/routes/matters.py backend/app/api/routes/deliverables.py backend/app/api/routes/uploads.py backend/app/api/routes/runs.py backend/app/api/routes/extensions.py backend/app/api/routes/workbench.py backend/app/identity/schemas.py backend/tests/test_mvp_slice.py
git commit -m "feat: add member roles and route permissions"
```

---

### Task 3: Frontend Login Shell and Owner Members Page

**Files:**
- Create: `frontend/src/lib/session.ts`
- Create: `frontend/src/lib/permissions.ts`
- Create: `frontend/src/components/login-page-panel.tsx`
- Create: `frontend/src/components/members-page-panel.tsx`
- Create: `frontend/src/app/login/page.tsx`
- Create: `frontend/src/app/members/page.tsx`
- Create: `frontend/tests/auth-foundation.test.mjs`
- Modify: `frontend/src/lib/api.ts`
- Modify: `frontend/src/lib/types.ts`
- Modify: `frontend/src/components/app-shell.tsx`

- [ ] **Step 1: Write failing frontend helper tests for nav gating and role visibility**

```javascript
import test from "node:test";
import assert from "node:assert/strict";

import {
  buildPrimaryNavForMembershipRole,
  canManageMembers,
  canManageExtensions,
  isPublicAppPath,
} from "../src/lib/permissions.ts";

test("owner sees members nav and consultant does not", () => {
  const ownerNav = buildPrimaryNavForMembershipRole("owner");
  const consultantNav = buildPrimaryNavForMembershipRole("consultant");

  assert.equal(ownerNav.some((item) => item.href === "/members"), true);
  assert.equal(consultantNav.some((item) => item.href === "/members"), false);
});

test("public login path stays public but app routes do not", () => {
  assert.equal(isPublicAppPath("/login"), true);
  assert.equal(isPublicAppPath("/matters"), false);
});

test("consultant can view agents packs but cannot manage extensions", () => {
  assert.equal(canManageMembers("consultant"), false);
  assert.equal(canManageExtensions("consultant"), false);
});
```

- [ ] **Step 2: Run the frontend helper test to verify it fails**

Run:

```bash
cd frontend && node --test tests/auth-foundation.test.mjs
```

Expected:

```text
ERR_MODULE_NOT_FOUND for session / permissions helpers because they do not exist yet
```

- [ ] **Step 3: Add auth types, API client methods, and permission helpers**

```typescript
// frontend/src/lib/types.ts
export type MembershipRole = "owner" | "consultant" | "demo";

export type SessionState = {
  user: {
    id: string;
    email: string;
    fullName: string;
    avatarUrl: string | null;
  };
  firm: {
    id: string;
    name: string;
    slug: string;
  };
  membership: {
    id: string;
    role: MembershipRole;
    status: "active" | "disabled";
  };
  permissions: string[];
};

export type MemberRead = {
  id: string;
  email: string;
  fullName: string;
  role: MembershipRole;
  status: "active" | "disabled";
};

export type MemberInviteRead = {
  id: string;
  email: string;
  role: "consultant" | "demo";
  status: "pending" | "accepted" | "revoked";
};

export type MemberListSnapshot = {
  members: MemberRead[];
  pendingInvites: MemberInviteRead[];
};
```

```typescript
// frontend/src/lib/api.ts
export async function getCurrentSession(): Promise<SessionState> {
  const response = await fetch(`${getApiBaseUrl()}/auth/me`, {
    credentials: "include",
    cache: "no-store",
  });
  return parseResponse<SessionState>(response);
}

export async function startGoogleLogin(): Promise<{ authorizationUrl: string }> {
  const response = await fetch(`${getApiBaseUrl()}/auth/google/start`, {
    credentials: "include",
    cache: "no-store",
  });
  const payload = await parseResponse<{ state: string; authorization_url: string }>(response);
  return { authorizationUrl: payload.authorization_url };
}

export async function listMembers(): Promise<MemberListSnapshot> {
  const response = await fetch(`${getApiBaseUrl()}/members`, {
    credentials: "include",
    cache: "no-store",
  });
  const payload = await parseResponse<{
    members: Array<{ id: string; email: string; full_name: string; role: MembershipRole; status: "active" | "disabled" }>;
    pending_invites: Array<{ id: string; email: string; role: "consultant" | "demo"; status: "pending" | "accepted" | "revoked" }>;
  }>(response);
  return {
    members: payload.members.map((member) => ({
      id: member.id,
      email: member.email,
      fullName: member.full_name,
      role: member.role,
      status: member.status,
    })),
    pendingInvites: payload.pending_invites,
  };
}

export async function createMemberInvite(payload: {
  email: string;
  role: "consultant" | "demo";
}): Promise<MemberInviteRead> {
  const response = await fetch(`${getApiBaseUrl()}/members/invites`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return parseResponse<MemberInviteRead>(response);
}

export async function updateMemberRole(
  membershipId: string,
  payload: { role: MembershipRole; status: "active" | "disabled" },
): Promise<MemberRead> {
  const response = await fetch(`${getApiBaseUrl()}/members/${membershipId}`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const member = await parseResponse<{
    id: string;
    email: string;
    full_name: string;
    role: MembershipRole;
    status: "active" | "disabled";
  }>(response);
  return {
    id: member.id,
    email: member.email,
    fullName: member.full_name,
    role: member.role,
    status: member.status,
  };
}
```

```typescript
// frontend/src/lib/permissions.ts
export function isPublicAppPath(pathname: string) {
  return pathname === "/login";
}

export function canManageMembers(role: MembershipRole) {
  return role === "owner";
}

export function canManageExtensions(role: MembershipRole) {
  return role === "owner";
}

export function buildPrimaryNavForMembershipRole(role: MembershipRole) {
  const common = [
    { href: "/", label: "總覽" },
    { href: "/matters", label: "案件工作台" },
    { href: "/deliverables", label: "交付物" },
    { href: "/history", label: "歷史紀錄" },
    { href: "/settings", label: "系統設定" },
  ];

  if (role === "owner") {
    return common.concat([
      { href: "/agents", label: "代理管理" },
      { href: "/packs", label: "模組包管理" },
      { href: "/members", label: "成員管理" },
    ]);
  }

  if (role === "consultant") {
    return common.concat([
      { href: "/agents", label: "代理一覽" },
      { href: "/packs", label: "模組包一覽" },
    ]);
  }

  return [{ href: "/login", label: "返回登入" }];
}
```

- [ ] **Step 4: Implement login page, app shell session gating, and owner-only members page**

```tsx
// frontend/src/components/login-page-panel.tsx
"use client";

import { useState } from "react";
import { startGoogleLogin } from "@/lib/api";

export function LoginPagePanel() {
  const [error, setError] = useState<string | null>(null);

  async function handleGoogleLogin() {
    try {
      const result = await startGoogleLogin();
      window.location.href = result.authorizationUrl;
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "目前無法開始 Google 登入。");
    }
  }

  return (
    <main className="page-shell">
      <section className="surface-card">
        <h1>登入 Infinite Pro</h1>
        <p>請使用已受邀的 Google 帳號登入。</p>
        <button className="button-primary" onClick={handleGoogleLogin}>
          使用 Google 登入
        </button>
        {error ? <p className="error-text">{error}</p> : null}
      </section>
    </main>
  );
}
```

```tsx
// frontend/src/components/app-shell.tsx
const pathname = usePathname();
const [session, setSession] = useState<SessionState | null>(null);
const [authLoading, setAuthLoading] = useState(true);

useEffect(() => {
  if (isPublicAppPath(pathname)) {
    setAuthLoading(false);
    return;
  }

  void (async () => {
    try {
      setSession(await getCurrentSession());
    } catch {
      window.location.href = "/login";
      return;
    } finally {
      setAuthLoading(false);
    }
  })();
}, [pathname]);

const primaryNavItems = session
  ? buildPrimaryNavForMembershipRole(session.membership.role)
  : [];
```

```tsx
// frontend/src/components/members-page-panel.tsx
"use client";

import { useEffect, useState } from "react";
import { createMemberInvite, listMembers, updateMemberRole } from "@/lib/api";
import type { MemberListSnapshot } from "@/lib/types";

export function MembersPagePanel() {
  const [snapshot, setSnapshot] = useState<MemberListSnapshot | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"consultant" | "demo">("consultant");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setSnapshot(await listMembers());
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "目前無法載入成員資料。");
      }
    })();
  }, []);

  async function handleInvite() {
    const created = await createMemberInvite({ email, role });
    setSnapshot((current) =>
      current
        ? {
            members: current.members,
            pendingInvites: [created].concat(current.pendingInvites),
          }
        : current,
    );
    setEmail("");
  }

  return (
    <main className="page-shell">
      <section className="surface-card">
        <h1>成員管理</h1>
        <p>由 owner 管理 firm 成員與邀請。</p>
        <div className="form-row">
          <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="email@example.com" />
          <select value={role} onChange={(event) => setRole(event.target.value as "consultant" | "demo")}>
            <option value="consultant">Consultant</option>
            <option value="demo">Demo</option>
          </select>
          <button className="button-primary" onClick={handleInvite}>送出邀請</button>
        </div>
        {error ? <p className="error-text">{error}</p> : null}
        <ul>
          {(snapshot?.members ?? []).map((member) => (
            <li key={member.id}>
              {member.email}｜{member.role}
              <button onClick={() => void updateMemberRole(member.id, { role: member.role, status: member.status })}>
                重新儲存
              </button>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
```

- [ ] **Step 5: Run the frontend helper tests and typecheck to verify they pass**

Run:

```bash
cd frontend && node --test tests/auth-foundation.test.mjs tests/intake-progress.test.mjs
cd frontend && rm -f .next/cache/.tsbuildinfo && npx next typegen && npm run typecheck
```

Expected:

```text
auth-foundation tests PASS
intake-progress tests PASS
typecheck PASS
```

- [ ] **Step 6: Commit the frontend auth shell and members page**

```bash
git add frontend/src/lib/session.ts frontend/src/lib/permissions.ts frontend/src/components/login-page-panel.tsx frontend/src/components/members-page-panel.tsx frontend/src/app/login/page.tsx frontend/src/app/members/page.tsx frontend/tests/auth-foundation.test.mjs frontend/src/lib/api.ts frontend/src/lib/types.ts frontend/src/components/app-shell.tsx
git commit -m "feat: add login shell and members page"
```

---

### Task 4: Active Docs, QA Evidence, and Full Verification

**Files:**
- Modify: `docs/01_runtime_architecture_and_data_contracts.md`
- Modify: `docs/03_workbench_ux_and_page_spec.md`
- Modify: `docs/04_qa_matrix.md`
- Modify: `docs/superpowers/specs/2026-04-06-phase-5-single-firm-cloud-foundation-design.md`
- Modify: `docs/superpowers/plans/2026-04-06-phase-5-auth-membership-foundation.md`

- [ ] **Step 1: Update runtime docs to describe single-firm auth foundation truthfully**

```md
## 6.x Single-Firm Identity / Membership Foundation

- `User`
- `AuthIdentity`
- `Firm`
- `FirmMembership`
- `FirmInvite`
- `UserSession`

正式規則：

- 第一版只支援 single-firm runtime
- Google Login + owner invite
- owner / consultant / demo
- backend route 必須透過 current-member / permission gate
- demo workspace 資料隔離仍屬後續 slice，不可誤寫成已完成
```

- [ ] **Step 2: Update workbench UX doc for `/login` and `/members`**

```md
### `/login`

- public entry
- only Google Login
- consultant-facing copy 應簡潔

### `/members`

- owner-only
- 顯示成員、邀請、身份別
- 不可長成 enterprise RBAC matrix
```

- [ ] **Step 3: Run full repo verification before touching QA matrix**

Run:

```bash
python3 -m compileall backend/app
PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -q
cd frontend && node --test tests/auth-foundation.test.mjs tests/intake-progress.test.mjs
cd frontend && npm run build
cd frontend && NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8010/api/v1 npm run build
cd frontend && rm -f .next/cache/.tsbuildinfo && npx next typegen && npm run typecheck
```

Expected:

```text
compileall PASS
pytest PASS
node tests PASS
both Next builds PASS
typecheck PASS
```

- [ ] **Step 4: Only after green verification, append QA evidence**

```md
- `2026-04-06`
  - phase 5 auth + membership foundation
  - backend compileall / pytest
  - frontend auth helper tests / build / typecheck
  - browser smoke 未執行時需誠實標示
```

- [ ] **Step 5: Commit the docs and verification evidence**

```bash
git add docs/01_runtime_architecture_and_data_contracts.md docs/03_workbench_ux_and_page_spec.md docs/04_qa_matrix.md docs/superpowers/specs/2026-04-06-phase-5-single-firm-cloud-foundation-design.md docs/superpowers/plans/2026-04-06-phase-5-auth-membership-foundation.md
git commit -m "docs: align phase 5 auth foundation contracts"
```

---

## Follow-On Plans After This One Ships

這份 plan 完成後，phase 5 的下一批子計畫應按這個順序開：

1. `Personal Provider Settings`
   - consultant 自己的加密 API key
   - firm settings 與 personal settings 正式拆開
2. `Demo Workspace Isolation`
   - demo dataset
   - demo read-only surface
   - demo 與正式資料完全隔離
3. `Provider Allowlist UX + Enforcement`
   - owner 設定允許供應商 / 模型
   - consultant 只能在允許範圍內設定自己的工作引擎

---

## Self-Review

### Spec coverage

- Google Login: Task 1
- owner invite: Task 2
- owner / consultant / demo role foundation: Task 1 + Task 2 + Task 3
- members page: Task 3
- server-side permission gate: Task 2
- cloud-ready single-firm posture: Task 1 + Task 4

### Deliberate exclusions

- `Personal Provider Settings` UI 與加密保存的完整落地已明確留到 follow-on plans
- demo dataset / demo workspace 隔離已明確留到 follow-on plans
- 因此這份 plan 是 phase 5 的第一個 shippable foundation，不是假裝整個 phase 5 一次做完
