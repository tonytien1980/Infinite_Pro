# Phase 5 Personal Provider Settings + Allowlist Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 讓 owner / consultant 都能在雲端保存自己的 provider 設定，讓 owner 控制 firm-level provider allowlist，並讓 run-time provider resolution 在真正執行分析前，按身份、allowlist 與個人 key 狀態做正確的 fail-closed 判斷。

**Architecture:** 這份 plan 只實作 phase 5 的第二個可上線子專案：`Personal Provider Settings + Allowlist Foundation`。後端新增 personal provider credential 與 allowlist data model、加密保存 helper、owner-only allowlist API、personal provider settings API、auth-aware provider resolution；前端把 `/settings` 正式拆成 `Firm Settings` 與 `Personal Provider Settings` 兩區，並讓 consultant 可以在 allowlist 範圍內設定自己的 provider / model / key。`demo workspace`、sample dataset、billing / analytics、multi-firm policy 仍留在後續子計畫。

**Tech Stack:** FastAPI, SQLAlchemy 2, Pydantic 2, cryptography(Fernet), httpx, Next.js 15 App Router, React 19, TypeScript, node:test

---

## Scope Guard

這份 implementation plan 只處理：

- personal provider credential backend model
- owner-managed provider allowlist backend model
- encrypted personal API key storage
- owner / consultant provider settings APIs
- auth-aware provider resolution for run-time analysis
- `/settings` 的 `Firm Settings` / `Personal Provider Settings` 分層
- consultant 沒有個人 key 時的 fail-closed 行為

這份 plan **不處理**：

- demo workspace data isolation
- sample dataset
- provider usage analytics / billing
- multi-firm / tenant boundary
- external secret manager integration

---

## File Structure

### Backend

- Create: `backend/app/services/provider_secret_crypto.py`
  - personal provider key encrypt / decrypt helper
- Create: `backend/app/services/personal_provider_settings.py`
  - personal provider credential read / validate / save / revalidate
- Create: `backend/app/services/provider_allowlist.py`
  - owner allowlist read / save / normalize
- Modify: `backend/requirements.txt`
  - add `cryptography`
- Modify: `backend/app/core/config.py`
  - add `PROVIDER_SECRET_ENCRYPTION_KEY`
- Modify: `backend/app/domain/models.py`
  - add `PersonalProviderCredential`
  - add `ProviderAllowlistEntry`
- Modify: `backend/app/core/database.py`
  - create_all / incremental schema patch / indexes / normalization
- Modify: `backend/app/workbench/schemas.py`
  - add personal provider / allowlist request and response contracts
- Modify: `backend/app/api/routes/workbench.py`
  - add:
    - `GET /workbench/personal-provider-settings`
    - `PUT /workbench/personal-provider-settings`
    - `POST /workbench/personal-provider-settings/validate`
    - `POST /workbench/personal-provider-settings/revalidate`
    - `GET /workbench/provider-allowlist`
    - `PUT /workbench/provider-allowlist`
  - keep existing `/workbench/provider-settings*` as owner-only `Firm Settings`
- Modify: `backend/app/services/system_provider_settings.py`
  - reposition existing API as firm-level settings
- Modify: `backend/app/model_router/factory.py`
  - make provider resolution current-member aware
- Modify: `backend/app/services/extension_contract_synthesis.py`
  - owner routes should use auth-aware provider resolution
- Modify: `backend/app/agents/host.py`
  - inject current member into provider resolution path
- Modify: `backend/app/api/routes/runs.py`
  - preflight or mapped fail-closed status when consultant has no personal key
- Test: `backend/tests/test_mvp_slice.py`
  - owner allowlist
  - personal provider save / validate / revalidate
  - consultant fail-closed on missing key
  - owner fallback to firm-level provider

### Frontend

- Create: `frontend/src/components/settings-firm-provider-panel.tsx`
  - owner-only firm provider settings panel
- Create: `frontend/src/components/settings-personal-provider-panel.tsx`
  - owner / consultant personal provider settings panel
- Create: `frontend/src/lib/provider-settings.ts`
  - personal / firm provider view mappers
- Create: `frontend/tests/provider-settings-foundation.test.mjs`
  - helper tests for settings split / allowlist wording / fail-closed copy
- Modify: `frontend/src/lib/types.ts`
  - add personal provider and allowlist contracts
- Modify: `frontend/src/lib/api.ts`
  - add personal provider settings / allowlist methods
- Modify: `frontend/src/components/settings-page-panel.tsx`
  - split into `Firm Settings` and `Personal Provider Settings`
  - use session role to gate owner-only sections

### Docs

- Modify: `docs/00_product_definition_and_current_state.md`
  - mark second phase-5 slice as current in-progress direction
- Modify: `docs/01_runtime_architecture_and_data_contracts.md`
  - add personal provider / allowlist / precedence contract
- Modify: `docs/03_workbench_ux_and_page_spec.md`
  - update `/settings` for split panels and fail-closed consultant copy
- Modify: `docs/04_qa_matrix.md`
  - append real verification evidence only after full green run
- Modify: `docs/superpowers/specs/2026-04-06-phase-5-personal-provider-settings-allowlist-design.md`
  - mark first implemented sub-slice once shipped

---

### Task 1: Backend Crypto and Data Model Foundation

**Files:**
- Create: `backend/app/services/provider_secret_crypto.py`
- Modify: `backend/requirements.txt`
- Modify: `backend/app/core/config.py`
- Modify: `backend/app/domain/models.py`
- Modify: `backend/app/core/database.py`
- Test: `backend/tests/test_mvp_slice.py`

- [ ] **Step 1: Write the failing backend tests for encrypted personal credentials and provider allowlist rows**

```python
def test_personal_provider_secret_round_trip_requires_encryption_key(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr("app.core.config.settings.provider_secret_encryption_key", "phase5-fernet-test-key")

    from app.services.provider_secret_crypto import decrypt_provider_secret, encrypt_provider_secret

    ciphertext = encrypt_provider_secret("sk-test-1234567890")
    assert ciphertext != "sk-test-1234567890"
    assert decrypt_provider_secret(ciphertext) == "sk-test-1234567890"


def test_personal_provider_secret_write_fails_closed_without_encryption_key(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr("app.core.config.settings.provider_secret_encryption_key", None)

    from app.services.provider_secret_crypto import encrypt_provider_secret

    with pytest.raises(RuntimeError):
        encrypt_provider_secret("sk-test-1234567890")
```

- [ ] **Step 2: Run the targeted backend tests to verify they fail**

Run:

```bash
PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -k "personal_provider_secret_round_trip or write_fails_closed_without_encryption_key" -q
```

Expected:

```text
FAIL because provider_secret_crypto does not exist yet
```

- [ ] **Step 3: Add runtime dependency and config**

```text
# backend/requirements.txt
cryptography>=44,<45
```

```python
# backend/app/core/config.py
provider_secret_encryption_key: str | None = None
```

- [ ] **Step 4: Add encrypted secret helper and new DB models**

```python
# backend/app/services/provider_secret_crypto.py
from cryptography.fernet import Fernet, InvalidToken

def _get_fernet() -> Fernet:
    if not settings.provider_secret_encryption_key:
        raise RuntimeError("目前未設定 PROVIDER_SECRET_ENCRYPTION_KEY。")
    return Fernet(settings.provider_secret_encryption_key.encode("utf-8"))


def encrypt_provider_secret(raw_secret: str) -> str:
    if not raw_secret.strip():
        raise RuntimeError("不能加密空白 provider secret。")
    return _get_fernet().encrypt(raw_secret.strip().encode("utf-8")).decode("utf-8")


def decrypt_provider_secret(ciphertext: str) -> str:
    try:
        return _get_fernet().decrypt(ciphertext.encode("utf-8")).decode("utf-8")
    except InvalidToken as exc:
        raise RuntimeError("無法解密 provider secret。") from exc
```

```python
# backend/app/domain/models.py
class PersonalProviderCredential(Base):
    __tablename__ = "personal_provider_credentials"
    __table_args__ = (UniqueConstraint("user_id", name="uq_personal_provider_credential_user"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    provider_id: Mapped[str] = mapped_column(String(50), nullable=False)
    model_level: Mapped[str] = mapped_column(String(30), default="balanced")
    model_id: Mapped[str] = mapped_column(String(255), nullable=False)
    custom_model_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    base_url: Mapped[str] = mapped_column(String(1024), nullable=False)
    timeout_seconds: Mapped[int] = mapped_column(Integer, default=60)
    api_key_ciphertext: Mapped[str | None] = mapped_column(Text, nullable=True)
    api_key_masked: Mapped[str | None] = mapped_column(String(32), nullable=True)
    last_validation_status: Mapped[str] = mapped_column(String(50), default="not_validated")
    last_validation_message: Mapped[str] = mapped_column(Text, default="")
    last_validated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    key_updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)


class ProviderAllowlistEntry(Base):
    __tablename__ = "provider_allowlist_entries"
    __table_args__ = (UniqueConstraint("firm_id", "provider_id", "model_level", name="uq_provider_allowlist_entry"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    firm_id: Mapped[str] = mapped_column(ForeignKey("firms.id"), nullable=False)
    provider_id: Mapped[str] = mapped_column(String(50), nullable=False)
    model_level: Mapped[str] = mapped_column(String(30), nullable=False, default="balanced")
    allowed_model_ids: Mapped[list[str]] = mapped_column(JSON, default=list)
    allow_custom_model: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[str] = mapped_column(String(30), default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)
```

- [ ] **Step 5: Update incremental schema patching and run targeted tests to green**

Run:

```bash
PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -k "personal_provider_secret_round_trip or write_fails_closed_without_encryption_key" -q
```

Expected:

```text
2 passed
```

- [ ] **Step 6: Commit the crypto / model foundation**

```bash
git add backend/requirements.txt backend/app/core/config.py backend/app/domain/models.py backend/app/core/database.py backend/app/services/provider_secret_crypto.py backend/tests/test_mvp_slice.py
git commit -m "feat: add personal provider credential foundation"
```

---

### Task 2: Personal Provider Settings and Allowlist APIs

**Files:**
- Create: `backend/app/services/personal_provider_settings.py`
- Create: `backend/app/services/provider_allowlist.py`
- Modify: `backend/app/workbench/schemas.py`
- Modify: `backend/app/api/routes/workbench.py`
- Modify: `backend/app/services/system_provider_settings.py`
- Test: `backend/tests/test_mvp_slice.py`

- [ ] **Step 1: Write failing backend tests for personal settings save / validate and owner allowlist**

```python
def login_as_consultant_with_owner_invite(
    anonymous_client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> TestClient:
    configure_auth_settings(monkeypatch, bootstrap_owner_emails="owner@example.com")
    login_google_user(
        anonymous_client,
        monkeypatch,
        email="owner@example.com",
        full_name="Owner User",
    )
    invite = anonymous_client.post(
        "/api/v1/members/invites",
        json={"email": "consultant@example.com", "role": "consultant"},
    )
    assert invite.status_code == 200
    logout = anonymous_client.post("/api/v1/auth/logout")
    assert logout.status_code == 200
    login_google_user(
        anonymous_client,
        monkeypatch,
        email="consultant@example.com",
        full_name="Consultant User",
    )
    return anonymous_client


def test_owner_can_save_provider_allowlist(client: TestClient) -> None:
    response = client.put(
        "/api/v1/workbench/provider-allowlist",
        json={
            "entries": [
                {
                    "provider_id": "openai",
                    "model_level": "balanced",
                    "allowed_model_ids": ["gpt-5.4-mini"],
                    "allow_custom_model": False,
                    "status": "active",
                }
            ]
        },
    )
    assert response.status_code == 200
    assert response.json()["entries"][0]["provider_id"] == "openai"


def test_consultant_can_save_personal_provider_settings_with_encrypted_key(
    anonymous_client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    consultant_client = login_as_consultant_with_owner_invite(anonymous_client, monkeypatch)

    response = consultant_client.put(
        "/api/v1/workbench/personal-provider-settings",
        json={
            "provider_id": "openai",
            "model_level": "balanced",
            "model_id": "gpt-5.4-mini",
            "custom_model_id": "",
            "base_url": "https://api.openai.com/v1",
            "timeout_seconds": 60,
            "api_key": "sk-personal-123456",
            "keep_existing_key": False,
            "validate_before_save": False,
        },
    )
    assert response.status_code == 200
    assert response.json()["current"]["api_key_configured"] is True
    assert response.json()["current"]["source"] == "personal_config"
```

- [ ] **Step 2: Run the targeted backend API tests to verify they fail**

Run:

```bash
PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -k "provider_allowlist or personal_provider_settings_with_encrypted_key" -q
```

Expected:

```text
FAIL because the new workbench routes and schemas do not exist yet
```

- [ ] **Step 3: Add new workbench request / response contracts**

```python
# backend/app/workbench/schemas.py
class ProviderAllowlistEntryResponse(BaseModel):
    provider_id: Literal["openai", "anthropic", "gemini", "xai", "minimax"]
    model_level: ProviderModelLevel
    allowed_model_ids: list[str] = Field(default_factory=list)
    allow_custom_model: bool = False
    status: Literal["active", "inactive"] = "active"


class ProviderAllowlistResponse(BaseModel):
    entries: list[ProviderAllowlistEntryResponse] = Field(default_factory=list)


class ProviderAllowlistUpdateRequest(BaseModel):
    entries: list[ProviderAllowlistEntryResponse] = Field(default_factory=list)


class PersonalProviderSettingsValidateRequest(SystemProviderSettingsValidateRequest):
    pass


class PersonalProviderSettingsUpdateRequest(SystemProviderSettingsValidateRequest):
    validate_before_save: bool = True


class PersonalProviderSettingsResponse(BaseModel):
    current: CurrentProviderConfigResponse
    presets: list[ProviderPresetResponse] = Field(default_factory=list)
```

- [ ] **Step 4: Implement personal settings service and allowlist service**

```python
# backend/app/services/provider_allowlist.py
def list_provider_allowlist(db: Session, *, firm_id: str) -> schemas.ProviderAllowlistResponse:
    rows = db.scalars(
        select(models.ProviderAllowlistEntry)
        .where(models.ProviderAllowlistEntry.firm_id == firm_id)
        .order_by(
            models.ProviderAllowlistEntry.provider_id.asc(),
            models.ProviderAllowlistEntry.model_level.asc(),
        )
    ).all()
    return schemas.ProviderAllowlistResponse(
        entries=[
            schemas.ProviderAllowlistEntryResponse(
                provider_id=row.provider_id,
                model_level=row.model_level,
                allowed_model_ids=list(row.allowed_model_ids or []),
                allow_custom_model=row.allow_custom_model,
                status="active" if row.status == "active" else "inactive",
            )
            for row in rows
        ]
    )


def update_provider_allowlist(
    db: Session,
    *,
    firm_id: str,
    payload: schemas.ProviderAllowlistUpdateRequest,
) -> schemas.ProviderAllowlistResponse:
    existing_rows = {
        (row.provider_id, row.model_level): row
        for row in db.scalars(
            select(models.ProviderAllowlistEntry).where(
                models.ProviderAllowlistEntry.firm_id == firm_id
            )
        ).all()
    }
    seen_keys: set[tuple[str, str]] = set()
    for entry in payload.entries:
        key = (entry.provider_id, entry.model_level)
        seen_keys.add(key)
        row = existing_rows.get(key)
        if row is None:
            row = models.ProviderAllowlistEntry(
                firm_id=firm_id,
                provider_id=entry.provider_id,
                model_level=entry.model_level,
            )
        row.allowed_model_ids = list(dict.fromkeys(entry.allowed_model_ids))
        row.allow_custom_model = entry.allow_custom_model
        row.status = "active" if entry.status == "active" else "inactive"
        db.add(row)

    for key, row in existing_rows.items():
        if key not in seen_keys:
            db.delete(row)

    db.commit()
    return list_provider_allowlist(db, firm_id=firm_id)
```

```python
# backend/app/services/personal_provider_settings.py
def get_personal_provider_settings(
    db: Session,
    *,
    user_id: str,
) -> schemas.PersonalProviderSettingsResponse:
    credential = db.scalar(
        select(models.PersonalProviderCredential).where(
            models.PersonalProviderCredential.user_id == user_id
        )
    )
    if credential is None:
        fallback = system_provider_settings._build_env_baseline()
        current = workbench_schemas.CurrentProviderConfigResponse(
            source="env_baseline",
            provider_id=fallback.provider_id,
            provider_display_name=fallback.provider_display_name,
            model_level=fallback.model_level,
            actual_model_id=fallback.actual_model_id,
            custom_model_id=fallback.custom_model_id,
            base_url=fallback.base_url,
            timeout_seconds=fallback.timeout_seconds,
            api_key_configured=False,
            api_key_masked=None,
            last_validation_status="not_validated",
            last_validation_message="目前尚未保存個人模型設定。",
            last_validated_at=None,
            updated_at=None,
            key_updated_at=None,
            preset_runtime_support_level=fallback.preset_runtime_support_level,
            using_env_baseline=True,
        )
    else:
        preset = get_provider_preset(credential.provider_id)
        current = workbench_schemas.CurrentProviderConfigResponse(
            source="runtime_config",
            provider_id=credential.provider_id,
            provider_display_name=preset.display_name if preset else credential.provider_id,
            model_level=credential.model_level,
            actual_model_id=credential.custom_model_id or credential.model_id,
            custom_model_id=credential.custom_model_id,
            base_url=credential.base_url,
            timeout_seconds=credential.timeout_seconds,
            api_key_configured=bool(credential.api_key_ciphertext),
            api_key_masked=credential.api_key_masked,
            last_validation_status=credential.last_validation_status,
            last_validation_message=credential.last_validation_message,
            last_validated_at=credential.last_validated_at.isoformat() if credential.last_validated_at else None,
            updated_at=credential.updated_at.isoformat() if credential.updated_at else None,
            key_updated_at=credential.key_updated_at.isoformat() if credential.key_updated_at else None,
            preset_runtime_support_level=preset.runtime_support_level if preset else "beta",
            using_env_baseline=False,
        )
    return workbench_schemas.PersonalProviderSettingsResponse(
        current=current,
        presets=[system_provider_settings._serialize_preset(item) for item in list_settings_provider_presets()],
    )


def validate_personal_provider_settings(
    db: Session,
    *,
    user_id: str,
    payload: schemas.PersonalProviderSettingsValidateRequest,
) -> schemas.ProviderValidationResponse:
    translated = workbench_schemas.SystemProviderSettingsValidateRequest(
        provider_id=payload.provider_id,
        model_level=payload.model_level,
        model_id=payload.model_id,
        custom_model_id=payload.custom_model_id,
        base_url=payload.base_url,
        timeout_seconds=payload.timeout_seconds,
        api_key=payload.api_key,
        keep_existing_key=payload.keep_existing_key,
    )
    return system_provider_settings.validate_runtime_provider_payload(
        db,
        payload=translated,
        current_secret=_load_existing_personal_secret(
            db,
            user_id=user_id,
            provider_id=payload.provider_id,
        ),
    )


def update_personal_provider_settings(
    db: Session,
    *,
    user_id: str,
    payload: schemas.PersonalProviderSettingsUpdateRequest,
) -> schemas.PersonalProviderSettingsResponse:
    current_secret = _load_existing_personal_secret(
        db,
        user_id=user_id,
        provider_id=payload.provider_id,
    )
    if payload.validate_before_save:
        validate_personal_provider_settings(db, user_id=user_id, payload=payload)

    credential = db.scalar(
        select(models.PersonalProviderCredential).where(
            models.PersonalProviderCredential.user_id == user_id
        )
    )
    if credential is None:
        credential = models.PersonalProviderCredential(user_id=user_id)

    if payload.api_key.strip():
        credential.api_key_ciphertext = encrypt_provider_secret(payload.api_key)
        credential.api_key_masked = system_provider_settings._mask_api_key(payload.api_key)
        credential.key_updated_at = models.utc_now()
    elif not current_secret:
        raise HTTPException(status_code=400, detail="請先輸入個人 API key。")

    credential.provider_id = payload.provider_id
    credential.model_level = payload.model_level
    credential.model_id = payload.model_id.strip() or payload.custom_model_id.strip()
    credential.custom_model_id = payload.custom_model_id.strip() or None
    credential.base_url = payload.base_url.strip()
    credential.timeout_seconds = payload.timeout_seconds
    credential.last_validation_status = "success" if payload.validate_before_save else "not_validated"
    credential.last_validation_message = (
        "個人模型設定已驗證。" if payload.validate_before_save else "個人模型設定已保存，但尚未重新驗證。"
    )
    credential.last_validated_at = models.utc_now() if payload.validate_before_save else None
    db.add(credential)
    db.commit()
    return get_personal_provider_settings(db, user_id=user_id)
```

- [ ] **Step 5: Wire new workbench routes with role gates**

```python
# backend/app/api/routes/workbench.py
@router.get("/personal-provider-settings", response_model=schemas.PersonalProviderSettingsResponse)
def get_personal_provider_settings_route(
    current_member=Depends(require_permission("access_firm_workspace")),
    db: Session = Depends(get_db),
):
    return get_personal_provider_settings(db, user_id=current_member.user.id)


@router.put("/provider-allowlist", response_model=schemas.ProviderAllowlistResponse)
def update_provider_allowlist_route(
    payload: schemas.ProviderAllowlistUpdateRequest,
    current_member=Depends(require_permission("manage_firm_settings")),
    db: Session = Depends(get_db),
):
    return update_provider_allowlist(db, firm_id=current_member.firm.id, payload=payload)
```

- [ ] **Step 6: Run the targeted backend API tests to verify they pass**

Run:

```bash
PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -k "provider_allowlist or personal_provider_settings_with_encrypted_key" -q
```

Expected:

```text
2 passed
```

- [ ] **Step 7: Commit the workbench API slice**

```bash
git add backend/app/services/personal_provider_settings.py backend/app/services/provider_allowlist.py backend/app/workbench/schemas.py backend/app/api/routes/workbench.py backend/app/services/system_provider_settings.py backend/tests/test_mvp_slice.py
git commit -m "feat: add personal provider settings APIs"
```

---

### Task 3: Auth-Aware Provider Resolution and Run Fail-Closed

**Files:**
- Modify: `backend/app/model_router/factory.py`
- Modify: `backend/app/services/system_provider_settings.py`
- Modify: `backend/app/agents/host.py`
- Modify: `backend/app/services/extension_contract_synthesis.py`
- Modify: `backend/app/api/routes/runs.py`
- Test: `backend/tests/test_mvp_slice.py`

- [ ] **Step 1: Write the failing backend tests for consultant run fail-closed and owner fallback**

```python
def test_consultant_run_fails_closed_without_personal_provider_settings(
    anonymous_client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    consultant_client = login_as_consultant_with_owner_invite(anonymous_client, monkeypatch)
    task = consultant_client.post("/api/v1/tasks", json=create_task_payload("Provider gate")).json()
    run = consultant_client.post(f"/api/v1/tasks/{task['id']}/run")
    assert run.status_code == 403
    assert "先完成個人模型設定" in run.json()["detail"]


def test_owner_run_can_fallback_to_firm_provider_default(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr("app.core.config.settings.model_provider", "mock")
    task = client.post("/api/v1/tasks", json=create_task_payload("Owner fallback")).json()
    run = client.post(f"/api/v1/tasks/{task['id']}/run")
    assert run.status_code == 200
```

- [ ] **Step 2: Run the targeted run-path tests to verify they fail**

Run:

```bash
PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -k "consultant_run_fails_closed or owner_run_can_fallback" -q
```

Expected:

```text
FAIL because model provider resolution is still global and not current-member aware
```

- [ ] **Step 3: Implement current-member-aware provider resolution**

```python
# backend/app/services/system_provider_settings.py
def resolve_effective_provider_config_for_member(
    db: Session,
    *,
    user_id: str,
    role: str,
    firm_id: str,
) -> ResolvedProviderConfig:
    if role == "demo":
        raise ModelProviderError("demo 帳號不可執行分析。")

    if role == "consultant":
        credential = db.scalar(
            select(models.PersonalProviderCredential).where(
                models.PersonalProviderCredential.user_id == user_id
            )
        )
        if credential is None or not credential.api_key_ciphertext:
            raise ModelProviderError("請先完成個人模型設定，才能執行分析。")
        allowlist = _resolve_allowlist_entry(
            db,
            firm_id=firm_id,
            provider_id=credential.provider_id,
            model_level=credential.model_level,
        )
        if allowlist is None or allowlist.status != "active":
            raise ModelProviderError("目前 firm 尚未允許這組 provider / model。")
        actual_model_id = credential.custom_model_id or credential.model_id
        if (
            not allowlist.allow_custom_model
            and allowlist.allowed_model_ids
            and actual_model_id not in allowlist.allowed_model_ids
        ):
            raise ModelProviderError("目前 firm 尚未允許這個模型。")
        preset = get_provider_preset(credential.provider_id)
        return ResolvedProviderConfig(
            source="runtime_config",
            provider_id=credential.provider_id,
            provider_display_name=preset.display_name if preset else credential.provider_id,
            model_level=credential.model_level,
            actual_model_id=actual_model_id,
            custom_model_id=credential.custom_model_id,
            base_url=credential.base_url.rstrip("/"),
            timeout_seconds=credential.timeout_seconds,
            api_key=decrypt_provider_secret(credential.api_key_ciphertext),
            api_key_configured=True,
            api_key_masked=credential.api_key_masked,
            last_validation_status=credential.last_validation_status,
            last_validation_message=credential.last_validation_message,
            last_validated_at=credential.last_validated_at,
            updated_at=credential.updated_at,
            key_updated_at=credential.key_updated_at,
            preset_runtime_support_level=preset.runtime_support_level if preset else "beta",
            using_env_baseline=False,
        )

    credential = db.scalar(
        select(models.PersonalProviderCredential).where(
            models.PersonalProviderCredential.user_id == user_id
        )
    )
    if credential and credential.api_key_ciphertext:
        return resolve_effective_provider_config_for_member(
            db,
            user_id=user_id,
            role="consultant",
            firm_id=firm_id,
        )

    return resolve_effective_provider_config(db)
```

```python
# backend/app/model_router/factory.py
def get_model_provider(
    db: Session | None = None,
    *,
    current_member: CurrentMember | None = None,
) -> ModelProvider:
    if current_member is not None and db is not None:
        config = resolve_effective_provider_config_for_member(
            db,
            user_id=current_member.user.id,
            role=current_member.membership.role,
            firm_id=current_member.firm.id,
        )
    else:
        config = resolve_effective_provider_config(db)
    provider_name = config.provider_id.lower()
    preset = get_provider_preset(provider_name)

    if provider_name == "mock":
        return MockModelProvider()

    if config.api_key is None:
        raise ModelProviderError("目前可用的 provider 設定缺少 API key。")

    if preset is None:
        raise ModelProviderError(f"目前不支援供應商「{provider_name}」的正式 runtime path。")

    if preset.adapter_kind in {"openai_native", "openai_compatible"}:
        return OpenAIModelProvider(
            api_key=config.api_key,
            model=config.actual_model_id,
            base_url=config.base_url,
            timeout_seconds=config.timeout_seconds,
        )

    if preset.adapter_kind == "anthropic_native":
        return AnthropicModelProvider(
            api_key=config.api_key,
            model=config.actual_model_id,
            base_url=config.base_url,
            timeout_seconds=config.timeout_seconds,
        )

    if preset.adapter_kind == "gemini_native":
        return GeminiModelProvider(
            api_key=config.api_key,
            model=config.actual_model_id,
            base_url=config.base_url,
            timeout_seconds=config.timeout_seconds,
        )

    raise ModelProviderError(
        f"供應商「{provider_name}」目前尚未配置正式 runtime adapter（{preset.adapter_kind}）。"
    )
```

```python
# backend/app/api/routes/runs.py
@router.post("/{task_id}/run", response_model=schemas.ResearchRunResponse)
def run_task(
    task_id: str,
    current_member=Depends(require_permission("access_firm_workspace")),
    db: Session = Depends(get_db),
) -> schemas.ResearchRunResponse:
    orchestrator = HostOrchestrator(db, current_member=current_member)
    try:
        return orchestrator.orchestrate_task(task_id)
    except ModelProviderError as exc:
        message = str(exc)
        if "個人模型設定" in message or "尚未允許" in message or "demo 帳號" in message:
            raise HTTPException(status_code=403, detail=message) from exc
        raise HTTPException(status_code=503, detail=message) from exc
```

- [ ] **Step 4: Run the targeted run-path tests to verify they pass**

Run:

```bash
PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -k "consultant_run_fails_closed or owner_run_can_fallback" -q
```

Expected:

```text
2 passed
```

- [ ] **Step 5: Commit the provider-resolution slice**

```bash
git add backend/app/model_router/factory.py backend/app/services/system_provider_settings.py backend/app/agents/host.py backend/app/services/extension_contract_synthesis.py backend/app/api/routes/runs.py backend/tests/test_mvp_slice.py
git commit -m "feat: add auth-aware provider resolution"
```

---

### Task 4: Settings UI Split and Consultant Personal Settings Flow

**Files:**
- Create: `frontend/src/components/settings-firm-provider-panel.tsx`
- Create: `frontend/src/components/settings-personal-provider-panel.tsx`
- Create: `frontend/src/lib/provider-settings.ts`
- Create: `frontend/tests/provider-settings-foundation.test.mjs`
- Modify: `frontend/src/lib/types.ts`
- Modify: `frontend/src/lib/api.ts`
- Modify: `frontend/src/components/settings-page-panel.tsx`

- [ ] **Step 1: Write failing frontend helper tests for settings split and consultant wording**

```javascript
import test from "node:test";
import assert from "node:assert/strict";

import {
  buildFirmProviderSettingsView,
  buildPersonalProviderSettingsView,
} from "../src/lib/provider-settings.ts";

test("consultant personal provider view says analysis is blocked when no key exists", () => {
  const view = buildPersonalProviderSettingsView({
    role: "consultant",
    current: {
      apiKeyConfigured: false,
      providerDisplayName: "OpenAI",
      actualModelId: "gpt-5.4-mini",
    },
  });

  assert.match(view.statusSummary, /先完成個人模型設定/);
});

test("owner firm provider view exposes allowlist summary", () => {
  const view = buildFirmProviderSettingsView({
    entries: [{ providerId: "openai", modelLevel: "balanced", allowCustomModel: false }],
  });

  assert.match(view.allowlistSummary, /OpenAI/);
});
```

- [ ] **Step 2: Run the frontend helper tests to verify they fail**

Run:

```bash
cd frontend && node --test tests/provider-settings-foundation.test.mjs
```

Expected:

```text
ERR_MODULE_NOT_FOUND because provider-settings helpers do not exist yet
```

- [ ] **Step 3: Add new frontend contracts and API methods**

```typescript
// frontend/src/lib/types.ts
export interface PersonalProviderSettingsSnapshot {
  current: CurrentProviderConfig;
  presets: ProviderPreset[];
}

export interface ProviderAllowlistEntry {
  providerId: ProviderId;
  modelLevel: ProviderModelLevel;
  allowedModelIds: string[];
  allowCustomModel: boolean;
  status: "active" | "inactive";
}

export interface ProviderAllowlistSnapshot {
  entries: ProviderAllowlistEntry[];
}
```

```typescript
// frontend/src/lib/api.ts
export async function getPersonalProviderSettings(): Promise<PersonalProviderSettingsSnapshot> {
  const response = await apiFetch(`${getApiBaseUrl()}/workbench/personal-provider-settings`, {
    cache: "no-store",
  });
  const body = await parseResponse<any>(response);
  return {
    current: parseCurrentProviderConfigPayload(body.current),
    presets: (body.presets || []).map(parseProviderPresetPayload),
  };
}

export async function updatePersonalProviderSettings(payload: {
  providerId: ProviderId;
  modelLevel: ProviderModelLevel;
  modelId: string;
  customModelId: string;
  baseUrl: string;
  timeoutSeconds: number;
  apiKey: string;
  keepExistingKey: boolean;
  validateBeforeSave: boolean;
}): Promise<PersonalProviderSettingsSnapshot> {
  const response = await apiFetch(`${getApiBaseUrl()}/workbench/personal-provider-settings`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      provider_id: payload.providerId,
      model_level: payload.modelLevel,
      model_id: payload.modelId,
      custom_model_id: payload.customModelId,
      base_url: payload.baseUrl,
      timeout_seconds: payload.timeoutSeconds,
      api_key: payload.apiKey,
      keep_existing_key: payload.keepExistingKey,
      validate_before_save: payload.validateBeforeSave,
    }),
  });
  const body = await parseResponse<any>(response);
  return {
    current: parseCurrentProviderConfigPayload(body.current),
    presets: (body.presets || []).map(parseProviderPresetPayload),
  };
}

export async function getProviderAllowlist(): Promise<ProviderAllowlistSnapshot> {
  const response = await apiFetch(`${getApiBaseUrl()}/workbench/provider-allowlist`, {
    cache: "no-store",
  });
  return getProviderAllowlistFromPayload(await parseResponse<any>(response));
}

export async function updateProviderAllowlist(payload: {
  entries: Array<{
    providerId: ProviderId;
    modelLevel: ProviderModelLevel;
    allowedModelIds: string[];
    allowCustomModel: boolean;
    status: "active" | "inactive";
  }>;
}): Promise<ProviderAllowlistSnapshot> {
  const response = await apiFetch(`${getApiBaseUrl()}/workbench/provider-allowlist`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      entries: payload.entries.map((entry) => ({
        provider_id: entry.providerId,
        model_level: entry.modelLevel,
        allowed_model_ids: entry.allowedModelIds,
        allow_custom_model: entry.allowCustomModel,
        status: entry.status,
      })),
    }),
  });
  return getProviderAllowlistFromPayload(await parseResponse<any>(response));
}
```

- [ ] **Step 4: Split settings UI into owner-only firm panel and owner/consultant personal panel**

```tsx
// frontend/src/components/settings-page-panel.tsx
const isOwner = session?.membership.role === "owner";

return (
  <main className="page-shell settings-page-shell">
    {isOwner ? (
      <SettingsFirmProviderPanel
        providerSnapshot={providerSnapshot}
        allowlistSnapshot={allowlistSnapshot}
        providerDraft={providerDraft}
        providerValidation={providerValidation}
        providerFeedback={providerFeedback}
        providerError={providerError}
        onProviderTest={handleProviderTest}
        onProviderSave={handleProviderSave}
        onProviderResetToEnv={handleProviderResetToEnv}
        onProviderRevalidate={handleProviderRevalidate}
        onAllowlistSave={handleProviderAllowlistSave}
      />
    ) : null}
    <SettingsPersonalProviderPanel
      personalSnapshot={personalProviderSnapshot}
      allowlistSnapshot={allowlistSnapshot}
      personalDraft={personalProviderDraft}
      personalValidation={personalValidation}
      personalFeedback={personalFeedback}
      personalError={personalError}
      onPersonalProviderSave={handlePersonalProviderSave}
      onPersonalProviderTest={handlePersonalProviderTest}
    />
    <section id="preference-panel" className="panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">工作台偏好</h2>
          <p className="panel-copy">這裡只管理你的介面偏好與本機顧問署名。</p>
        </div>
      </div>
      <WorkbenchPreferencesSection
        draft={draft}
        operatorDraft={operatorDraft}
        onSave={handleSave}
        onReset={handleReset}
      />
    </section>
  </main>
);
```

```tsx
// frontend/src/components/settings-personal-provider-panel.tsx
export function SettingsPersonalProviderPanel({
  personalSnapshot,
  allowlistSnapshot,
  personalDraft,
  personalFeedback,
  personalError,
  onPersonalProviderSave,
  onPersonalProviderTest,
}: SettingsPersonalProviderPanelProps) {
  const blocked = !personalSnapshot?.current.apiKeyConfigured;
  const allowlistSummary = allowlistSnapshot.entries
    .map((entry) => `${entry.providerId} / ${entry.modelLevel}`)
    .join("、");
  return (
    <section className="panel" id="personal-provider-panel">
      <h2 className="panel-title">個人模型設定</h2>
      <p className="panel-copy">這裡只管理你自己的 provider、model 與 API key。</p>
      <p className={blocked ? "error-text" : "muted-text"}>
        {blocked ? "先完成個人模型設定，才能執行分析。" : "目前已可用個人模型設定執行分析。"}
      </p>
      <p className="muted-text">目前可選範圍：{allowlistSummary || "尚未設定 allowlist"}</p>
      {personalError ? <p className="error-text">{personalError}</p> : null}
      {personalFeedback ? <p className="success-text">{personalFeedback}</p> : null}
      <div className="button-row">
        <button className="button-secondary" type="button" onClick={onPersonalProviderTest}>
          測試個人設定
        </button>
        <button className="button-primary" type="button" onClick={onPersonalProviderSave}>
          儲存個人設定
        </button>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Run frontend helper tests, typecheck, and builds**

Run:

```bash
cd frontend && node --test tests/provider-settings-foundation.test.mjs tests/auth-foundation.test.mjs tests/intake-progress.test.mjs
cd frontend && rm -f .next/cache/.tsbuildinfo && npx next typegen && npm run typecheck
cd frontend && npm run build
cd frontend && NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8010/api/v1 npm run build
```

Expected:

```text
all node tests PASS
typecheck PASS
both Next builds PASS
```

- [ ] **Step 6: Commit the settings UI slice**

```bash
git add frontend/src/components/settings-firm-provider-panel.tsx frontend/src/components/settings-personal-provider-panel.tsx frontend/src/lib/provider-settings.ts frontend/tests/provider-settings-foundation.test.mjs frontend/src/lib/types.ts frontend/src/lib/api.ts frontend/src/components/settings-page-panel.tsx
git commit -m "feat: split firm and personal provider settings"
```

---

### Task 5: Active Docs, QA Evidence, and Full Verification

**Files:**
- Modify: `docs/00_product_definition_and_current_state.md`
- Modify: `docs/01_runtime_architecture_and_data_contracts.md`
- Modify: `docs/03_workbench_ux_and_page_spec.md`
- Modify: `docs/04_qa_matrix.md`
- Modify: `docs/superpowers/specs/2026-04-06-phase-5-personal-provider-settings-allowlist-design.md`
- Modify: `docs/superpowers/plans/2026-04-06-phase-5-personal-provider-settings-allowlist-foundation.md`

- [ ] **Step 1: Update active docs only after code is green**

```md
- `PersonalProviderCredential`
- `ProviderAllowlistEntry`
- owner-only `Firm Settings`
- owner / consultant `Personal Provider Settings`
- auth-aware provider precedence
- consultant run fail-closed when personal key missing
```

- [ ] **Step 2: Run full repo verification before touching QA matrix**

Run:

```bash
python3 -m compileall backend/app
PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -q
cd frontend && node --test tests/provider-settings-foundation.test.mjs tests/auth-foundation.test.mjs tests/intake-progress.test.mjs
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

- [ ] **Step 3: Append QA evidence honestly**

```md
- phase 5 personal provider settings + allowlist foundation
- browser smoke 未執行時需明講
- `Personal Provider Settings` 與 owner allowlist 已 shipped
- demo isolation 仍未 shipped
```

- [ ] **Step 4: Commit docs and QA evidence**

```bash
git add docs/00_product_definition_and_current_state.md docs/01_runtime_architecture_and_data_contracts.md docs/03_workbench_ux_and_page_spec.md docs/04_qa_matrix.md docs/superpowers/specs/2026-04-06-phase-5-personal-provider-settings-allowlist-design.md docs/superpowers/plans/2026-04-06-phase-5-personal-provider-settings-allowlist-foundation.md
git commit -m "docs: align personal provider settings foundation"
```

---

## Follow-On Plans After This One Ships

這份 plan 完成後，phase 5 後續最合理的順序是：

1. `Demo Workspace Isolation`
   - demo dataset
   - demo-only read surface
   - demo 與正式資料完全隔離
2. `Firm Operating Surfaces`
   - team-level operating read models
   - but still no heavy collaboration shell
3. `Cloud Deployment Hardening`
   - callback domains
   - secure cookie posture
   - production secret handling

---

## Self-Review

### Spec coverage

- consultant personal key ownership: Task 1 + Task 2 + Task 3 + Task 4
- owner allowlist: Task 1 + Task 2 + Task 4
- auth-aware provider precedence: Task 3
- `/settings` split: Task 4
- fail-closed consultant run: Task 3

### Deliberate exclusions

- demo workspace isolation remains out of scope
- analytics / billing remain out of scope
- multi-firm remains out of scope

### Type consistency

- backend reuses existing `ProviderModelLevel`, `ProviderValidationStatus`, `CurrentProviderConfigResponse`
- frontend reuses existing `ProviderId`, `ProviderModelLevel`, and current provider snapshots instead of inventing a parallel provider taxonomy
