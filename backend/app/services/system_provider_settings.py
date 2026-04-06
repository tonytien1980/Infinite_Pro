from __future__ import annotations

import json
import socket
from dataclasses import dataclass
from datetime import datetime
from typing import Any
from urllib import error, request

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import SessionLocal
from app.domain import models
from app.model_router.base import ModelProviderAccessError
from app.model_router.provider_presets import (
    ProviderPreset,
    get_provider_preset,
    list_settings_provider_presets,
)
from app.services.provider_allowlist import get_allowlist_entry
from app.services.provider_secret_crypto import decrypt_provider_secret
from app.workbench import schemas

DEFAULT_SYSTEM_PROVIDER_SCOPE = "single_owner_runtime"


@dataclass
class ResolvedProviderConfig:
    source: str
    provider_id: str
    provider_display_name: str
    model_level: schemas.ProviderModelLevel
    actual_model_id: str
    custom_model_id: str | None
    base_url: str
    timeout_seconds: int
    api_key: str | None
    api_key_configured: bool
    api_key_masked: str | None
    last_validation_status: schemas.ProviderValidationStatus
    last_validation_message: str
    last_validated_at: datetime | None
    updated_at: datetime | None
    key_updated_at: datetime | None
    preset_runtime_support_level: str
    using_env_baseline: bool


def _mask_api_key(api_key: str) -> str:
    trimmed = api_key.strip()
    if not trimmed:
        return ""
    if len(trimmed) <= 4:
        return "••••"
    return f"••••••{trimmed[-4:]}"


def mask_api_key(api_key: str) -> str:
    return _mask_api_key(api_key)


def _serialize_datetime(value: datetime | None) -> str | None:
    return value.isoformat() if value is not None else None


def _serialize_preset(preset: ProviderPreset) -> schemas.ProviderPresetResponse:
    return schemas.ProviderPresetResponse(
        provider_id=preset.provider_id,  # type: ignore[arg-type]
        display_name=preset.display_name,
        default_base_url=preset.default_base_url,
        default_timeout_seconds=preset.default_timeout_seconds,
        auth_scheme_type=preset.auth_scheme_type,
        adapter_kind=preset.adapter_kind,
        runtime_support_level=preset.runtime_support_level,  # type: ignore[arg-type]
        validation_support_level=preset.validation_support_level,  # type: ignore[arg-type]
        recommended_models=schemas.ProviderPresetModelsResponse(
            high_quality=preset.recommended_models["high_quality"],
            balanced=preset.recommended_models["balanced"],
            low_cost=preset.recommended_models["low_cost"],
        ),
    )


def serialize_provider_preset(preset: ProviderPreset) -> schemas.ProviderPresetResponse:
    return _serialize_preset(preset)


def _serialize_resolved_config(
    config: ResolvedProviderConfig,
) -> schemas.CurrentProviderConfigResponse:
    return schemas.CurrentProviderConfigResponse(
        source=config.source,  # type: ignore[arg-type]
        provider_id=config.provider_id,
        provider_display_name=config.provider_display_name,
        model_level=config.model_level,
        actual_model_id=config.actual_model_id,
        custom_model_id=config.custom_model_id,
        base_url=config.base_url,
        timeout_seconds=config.timeout_seconds,
        api_key_configured=config.api_key_configured,
        api_key_masked=config.api_key_masked,
        last_validation_status=config.last_validation_status,
        last_validation_message=config.last_validation_message,
        last_validated_at=_serialize_datetime(config.last_validated_at),
        updated_at=_serialize_datetime(config.updated_at),
        key_updated_at=_serialize_datetime(config.key_updated_at),
        preset_runtime_support_level=config.preset_runtime_support_level,  # type: ignore[arg-type]
        using_env_baseline=config.using_env_baseline,
    )


def _get_runtime_config_row(db: Session) -> models.SystemProviderConfig | None:
    return db.scalars(
        select(models.SystemProviderConfig).where(
            models.SystemProviderConfig.scope_key == DEFAULT_SYSTEM_PROVIDER_SCOPE
        )
    ).one_or_none()


def _record_provider_event(
    db: Session,
    *,
    config: models.SystemProviderConfig | None,
    event_type: str,
    summary: str,
    payload: dict[str, Any] | None = None,
) -> None:
    db.add(
        models.SystemProviderConfigEvent(
            scope_key=DEFAULT_SYSTEM_PROVIDER_SCOPE,
            config_id=config.id if config is not None else None,
            event_type=event_type,
            summary=summary,
            payload=payload or {},
        )
    )


def _get_effective_model_id(
    *,
    preset: ProviderPreset,
    model_level: schemas.ProviderModelLevel,
    model_id: str,
    custom_model_id: str,
) -> tuple[str, str | None]:
    trimmed_custom = custom_model_id.strip()
    if trimmed_custom:
        return trimmed_custom, trimmed_custom

    trimmed_model = model_id.strip()
    if trimmed_model:
        return trimmed_model, None

    return preset.recommended_models[model_level], None


def get_effective_model_id(
    *,
    preset: ProviderPreset,
    model_level: schemas.ProviderModelLevel,
    model_id: str,
    custom_model_id: str,
) -> tuple[str, str | None]:
    return _get_effective_model_id(
        preset=preset,
        model_level=model_level,
        model_id=model_id,
        custom_model_id=custom_model_id,
    )


def _build_env_baseline() -> ResolvedProviderConfig:
    provider_id = settings.model_provider.strip().lower() or "mock"
    preset = get_provider_preset(provider_id) or get_provider_preset("mock")
    if preset is None:
        raise RuntimeError("Provider presets 尚未正確初始化。")

    if provider_id == "openai":
        api_key = settings.model_provider_api_key or settings.openai_api_key
        configured_model = settings.model_provider_model or settings.openai_model
        configured_base_url = settings.model_provider_base_url or settings.openai_base_url
        configured_timeout = settings.model_provider_timeout_seconds or settings.openai_timeout_seconds
    else:
        api_key = settings.model_provider_api_key
        configured_model = settings.model_provider_model
        configured_base_url = settings.model_provider_base_url
        configured_timeout = settings.model_provider_timeout_seconds

    model_level: schemas.ProviderModelLevel = "balanced"
    actual_model_id, custom_model_id = _get_effective_model_id(
        preset=preset,
        model_level=model_level,
        model_id=configured_model or "",
        custom_model_id="",
    )
    return ResolvedProviderConfig(
        source="env_baseline",
        provider_id=provider_id,
        provider_display_name=preset.display_name,
        model_level=model_level,
        actual_model_id=actual_model_id,
        custom_model_id=custom_model_id,
        base_url=(configured_base_url or preset.default_base_url).rstrip("/"),
        timeout_seconds=configured_timeout or preset.default_timeout_seconds,
        api_key=api_key,
        api_key_configured=bool(api_key),
        api_key_masked=_mask_api_key(api_key or "") or None,
        last_validation_status="not_validated",
        last_validation_message="目前仍使用 env baseline，尚未建立正式 runtime 驗證狀態。",
        last_validated_at=None,
        updated_at=None,
        key_updated_at=None,
        preset_runtime_support_level=preset.runtime_support_level,
        using_env_baseline=True,
    )


def resolve_effective_provider_config(db: Session | None = None) -> ResolvedProviderConfig:
    if db is None:
        session = SessionLocal()
        try:
            return resolve_effective_provider_config(session)
        finally:
            session.close()

    try:
        row = _get_runtime_config_row(db)
    except OperationalError:
        return _build_env_baseline()
    if row is None:
        return _build_env_baseline()

    preset = get_provider_preset(row.provider_id) or get_provider_preset("mock")
    if preset is None:
        raise RuntimeError("Provider presets 尚未正確初始化。")

    return ResolvedProviderConfig(
        source="runtime_config",
        provider_id=row.provider_id,
        provider_display_name=preset.display_name,
        model_level=row.model_level,  # type: ignore[arg-type]
        actual_model_id=row.model_id,
        custom_model_id=row.custom_model_id,
        base_url=row.base_url.rstrip("/"),
        timeout_seconds=row.timeout_seconds,
        api_key=row.api_key_secret,
        api_key_configured=bool(row.api_key_secret),
        api_key_masked=row.api_key_masked,
        last_validation_status=row.last_validation_status,  # type: ignore[arg-type]
        last_validation_message=row.last_validation_message,
        last_validated_at=row.last_validated_at,
        updated_at=row.updated_at,
        key_updated_at=row.key_updated_at,
        preset_runtime_support_level=preset.runtime_support_level,
        using_env_baseline=False,
    )


def _build_resolved_config_from_personal_credential(
    credential: models.PersonalProviderCredential,
) -> ResolvedProviderConfig:
    preset = get_provider_preset(credential.provider_id) or get_provider_preset("mock")
    if preset is None:
        raise ModelProviderAccessError("目前不支援這組個人模型設定供應商。")

    actual_model_id = credential.custom_model_id or credential.model_id
    return ResolvedProviderConfig(
        source="personal_config",
        provider_id=credential.provider_id,
        provider_display_name=preset.display_name,
        model_level=credential.model_level,  # type: ignore[arg-type]
        actual_model_id=actual_model_id,
        custom_model_id=credential.custom_model_id,
        base_url=credential.base_url.rstrip("/"),
        timeout_seconds=credential.timeout_seconds,
        api_key=decrypt_provider_secret(credential.api_key_ciphertext or ""),
        api_key_configured=bool(credential.api_key_ciphertext),
        api_key_masked=credential.api_key_masked,
        last_validation_status=credential.last_validation_status,  # type: ignore[arg-type]
        last_validation_message=credential.last_validation_message,
        last_validated_at=credential.last_validated_at,
        updated_at=credential.updated_at,
        key_updated_at=credential.key_updated_at,
        preset_runtime_support_level=preset.runtime_support_level,
        using_env_baseline=False,
    )


def resolve_effective_provider_config_for_member(
    db: Session,
    *,
    user_id: str,
    role: str,
    firm_id: str,
) -> ResolvedProviderConfig:
    if role == "demo":
        raise ModelProviderAccessError("demo 帳號不可執行分析。")

    credential = db.scalar(
        select(models.PersonalProviderCredential).where(
            models.PersonalProviderCredential.user_id == user_id
        )
    )

    if role == "consultant":
        if credential is None or not credential.api_key_ciphertext:
            raise ModelProviderAccessError("請先完成個人模型設定，才能執行分析。")
        allowlist = get_allowlist_entry(
            db,
            firm_id=firm_id,
            provider_id=credential.provider_id,
            model_level=credential.model_level,
        )
        if allowlist is None or allowlist.status != "active":
            raise ModelProviderAccessError("目前 firm 尚未允許這組 provider / model。")
        actual_model_id = credential.custom_model_id or credential.model_id
        if credential.custom_model_id and not allowlist.allow_custom_model:
            raise ModelProviderAccessError("目前 firm 尚未允許這個模型。")
        if allowlist.allowed_model_ids and actual_model_id not in allowlist.allowed_model_ids:
            raise ModelProviderAccessError("目前 firm 尚未允許這個模型。")
        return _build_resolved_config_from_personal_credential(credential)

    if credential is not None and credential.api_key_ciphertext:
        return _build_resolved_config_from_personal_credential(credential)

    return resolve_effective_provider_config(db)


def get_system_provider_settings(
    db: Session,
) -> schemas.SystemProviderSettingsResponse:
    return schemas.SystemProviderSettingsResponse(
        current=_serialize_resolved_config(resolve_effective_provider_config(db)),
        env_baseline=_serialize_resolved_config(_build_env_baseline()),
        presets=[_serialize_preset(preset) for preset in list_settings_provider_presets()],
    )


def _resolve_secret_for_payload(
    db: Session,
    payload: schemas.SystemProviderSettingsValidateRequest,
) -> str:
    current = resolve_effective_provider_config(db)
    return resolve_secret_for_validation_payload(
        payload=payload,
        current_secret=current.api_key,
        current_provider_id=current.provider_id,
    )


def resolve_secret_for_validation_payload(
    *,
    payload: schemas.SystemProviderSettingsValidateRequest,
    current_secret: str | None,
    current_provider_id: str | None,
) -> str:
    trimmed_key = payload.api_key.strip()
    if trimmed_key:
        return trimmed_key

    if not payload.keep_existing_key:
        raise HTTPException(status_code=400, detail="請先輸入 API key，或保留目前已設定的 key。")

    if current_provider_id and current_provider_id != payload.provider_id:
        raise HTTPException(
            status_code=400,
            detail="更換供應商時不可沿用不同供應商的既有 key，請重新輸入對應 API key。",
        )

    if not current_secret:
        raise HTTPException(status_code=400, detail="目前沒有可沿用的 API key。")

    return current_secret


def _classify_http_error(
    status_code: int,
    body: str,
) -> tuple[schemas.ProviderValidationStatus, str]:
    normalized = body.lower()
    if status_code in {401, 403}:
        return "invalid_api_key", "API key 無效，或目前沒有權限存取指定模型。"
    if status_code == 408:
        return "timeout", "請求逾時，供應商在限定時間內沒有回應。"
    if status_code in {400, 404, 422}:
        if "model" in normalized or "not found" in normalized or "unsupported" in normalized:
            return "model_unavailable", "目前模型不可用，請改用推薦模型或自訂其他 model id。"
        return "base_url_unreachable", "Base URL 可達性異常，請確認 endpoint 是否正確。"
    return "unknown_error", f"供應商回傳 HTTP {status_code}。"


def _anthropic_messages_endpoint(base_url: str) -> str:
    normalized = base_url.rstrip("/")
    if normalized.endswith("/messages"):
        return normalized
    return f"{normalized}/messages"


def _gemini_generate_content_endpoint(base_url: str, model_id: str) -> str:
    normalized = base_url.rstrip("/")
    sanitized_model = model_id.removeprefix("models/")
    return f"{normalized}/models/{sanitized_model}:generateContent"


def _validate_openai_compatible_provider(
    *,
    api_key: str,
    base_url: str,
    model_id: str,
    timeout_seconds: int,
    token_field: str = "max_tokens",
    token_value: int = 16,
) -> tuple[schemas.ProviderValidationStatus, str, str]:
    payload = {
        "model": model_id,
        "messages": [{"role": "user", "content": "ping"}],
    }
    payload[token_field] = token_value
    http_request = request.Request(
        f"{base_url.rstrip('/')}/chat/completions",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
        method="POST",
    )

    try:
        with request.urlopen(http_request, timeout=timeout_seconds) as response:
            raw_payload = json.loads(response.read().decode("utf-8"))
        choices = raw_payload.get("choices")
        if not isinstance(choices, list):
            return "unknown_error", "供應商回傳格式不符合預期。", json.dumps(raw_payload)[:500]
        return "success", "測試連線成功，key、Base URL 與 model 目前可用。", ""
    except error.HTTPError as exc:
        try:
            body = exc.read().decode("utf-8")
        except Exception:  # noqa: BLE001
            body = exc.reason if isinstance(exc.reason, str) else ""
        status, message = _classify_http_error(exc.code, body)
        return status, message, body[:800]
    except error.URLError as exc:
        reason = getattr(exc, "reason", exc)
        if isinstance(reason, socket.timeout):
            return "timeout", "請求逾時，供應商在限定時間內沒有回應。", str(reason)
        return "base_url_unreachable", "Base URL 無法連線，請確認 endpoint 與網路狀態。", str(reason)
    except TimeoutError as exc:
        return "timeout", "請求逾時，供應商在限定時間內沒有回應。", str(exc)
    except json.JSONDecodeError as exc:
        return "unknown_error", "供應商回傳了無法解析的資料。", str(exc)
    except Exception as exc:  # noqa: BLE001
        return "unknown_error", "發生未預期錯誤，請檢查詳細訊息。", str(exc)


def _validate_anthropic_native_provider(
    *,
    api_key: str,
    base_url: str,
    model_id: str,
    timeout_seconds: int,
) -> tuple[schemas.ProviderValidationStatus, str, str]:
    payload = {
        "model": model_id,
        "max_tokens": 1,
        "messages": [{"role": "user", "content": "ping"}],
    }
    http_request = request.Request(
        _anthropic_messages_endpoint(base_url),
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
        },
        method="POST",
    )

    try:
        with request.urlopen(http_request, timeout=timeout_seconds) as response:
            raw_payload = json.loads(response.read().decode("utf-8"))
        content = raw_payload.get("content")
        if not isinstance(content, list):
            return "unknown_error", "Anthropic 回傳格式不符合預期。", json.dumps(raw_payload)[:500]
        return "success", "測試連線成功，key、Base URL 與 model 目前可用。", ""
    except error.HTTPError as exc:
        try:
            body = exc.read().decode("utf-8")
        except Exception:  # noqa: BLE001
            body = exc.reason if isinstance(exc.reason, str) else ""
        status, message = _classify_http_error(exc.code, body)
        return status, message, body[:800]
    except error.URLError as exc:
        reason = getattr(exc, "reason", exc)
        if isinstance(reason, socket.timeout):
            return "timeout", "請求逾時，供應商在限定時間內沒有回應。", str(reason)
        return "base_url_unreachable", "Base URL 無法連線，請確認 endpoint 與網路狀態。", str(reason)
    except TimeoutError as exc:
        return "timeout", "請求逾時，供應商在限定時間內沒有回應。", str(exc)
    except json.JSONDecodeError as exc:
        return "unknown_error", "供應商回傳了無法解析的資料。", str(exc)
    except Exception as exc:  # noqa: BLE001
        return "unknown_error", "發生未預期錯誤，請檢查詳細訊息。", str(exc)


def _validate_gemini_native_provider(
    *,
    api_key: str,
    base_url: str,
    model_id: str,
    timeout_seconds: int,
) -> tuple[schemas.ProviderValidationStatus, str, str]:
    payload = {
        "contents": [{"role": "user", "parts": [{"text": "ping"}]}],
        "generationConfig": {"maxOutputTokens": 1},
    }
    http_request = request.Request(
        _gemini_generate_content_endpoint(base_url, model_id),
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "x-goog-api-key": api_key,
        },
        method="POST",
    )

    try:
        with request.urlopen(http_request, timeout=timeout_seconds) as response:
            raw_payload = json.loads(response.read().decode("utf-8"))
        candidates = raw_payload.get("candidates")
        if not isinstance(candidates, list):
            return "unknown_error", "Gemini 回傳格式不符合預期。", json.dumps(raw_payload)[:500]
        return "success", "測試連線成功，key、Base URL 與 model 目前可用。", ""
    except error.HTTPError as exc:
        try:
            body = exc.read().decode("utf-8")
        except Exception:  # noqa: BLE001
            body = exc.reason if isinstance(exc.reason, str) else ""
        status, message = _classify_http_error(exc.code, body)
        return status, message, body[:800]
    except error.URLError as exc:
        reason = getattr(exc, "reason", exc)
        if isinstance(reason, socket.timeout):
            return "timeout", "請求逾時，供應商在限定時間內沒有回應。", str(reason)
        return "base_url_unreachable", "Base URL 無法連線，請確認 endpoint 與網路狀態。", str(reason)
    except TimeoutError as exc:
        return "timeout", "請求逾時，供應商在限定時間內沒有回應。", str(exc)
    except json.JSONDecodeError as exc:
        return "unknown_error", "供應商回傳了無法解析的資料。", str(exc)
    except Exception as exc:  # noqa: BLE001
        return "unknown_error", "發生未預期錯誤，請檢查詳細訊息。", str(exc)


def validate_system_provider_settings(
    db: Session,
    payload: schemas.SystemProviderSettingsValidateRequest,
) -> schemas.ProviderValidationResponse:
    current = resolve_effective_provider_config(db)
    return validate_runtime_provider_payload(
        payload=payload,
        current_secret=current.api_key,
        current_provider_id=current.provider_id,
    )


def validate_runtime_provider_payload(
    *,
    payload: schemas.SystemProviderSettingsValidateRequest,
    current_secret: str | None,
    current_provider_id: str | None,
) -> schemas.ProviderValidationResponse:
    preset = get_provider_preset(payload.provider_id)
    if preset is None:
        raise HTTPException(status_code=400, detail="目前不支援指定的供應商。")

    api_key = resolve_secret_for_validation_payload(
        payload=payload,
        current_secret=current_secret,
        current_provider_id=current_provider_id,
    )
    actual_model_id, _ = _get_effective_model_id(
        preset=preset,
        model_level=payload.model_level,
        model_id=payload.model_id,
        custom_model_id=payload.custom_model_id,
    )
    base_url = (payload.base_url.strip() or preset.default_base_url).rstrip("/")
    timeout_seconds = payload.timeout_seconds or preset.default_timeout_seconds
    if preset.adapter_kind == "openai_native":
        validation_status, message, detail = _validate_openai_compatible_provider(
            api_key=api_key,
            base_url=base_url,
            model_id=actual_model_id,
            timeout_seconds=timeout_seconds,
            token_field="max_completion_tokens",
        )
    elif preset.adapter_kind == "openai_compatible":
        validation_status, message, detail = _validate_openai_compatible_provider(
            api_key=api_key,
            base_url=base_url,
            model_id=actual_model_id,
            timeout_seconds=timeout_seconds,
        )
    elif preset.adapter_kind == "anthropic_native":
        validation_status, message, detail = _validate_anthropic_native_provider(
            api_key=api_key,
            base_url=base_url,
            model_id=actual_model_id,
            timeout_seconds=timeout_seconds,
        )
    elif preset.adapter_kind == "gemini_native":
        validation_status, message, detail = _validate_gemini_native_provider(
            api_key=api_key,
            base_url=base_url,
            model_id=actual_model_id,
            timeout_seconds=timeout_seconds,
        )
    else:
        raise HTTPException(status_code=400, detail="目前不支援此供應商的正式驗證路徑。")

    return schemas.ProviderValidationResponse(
        provider_id=payload.provider_id,
        provider_display_name=preset.display_name,
        model_id=actual_model_id,
        validation_status=validation_status,
        message=message,
        detail=detail,
        validated_at=models.utc_now().isoformat(),
    )


def _apply_validation_result(
    row: models.SystemProviderConfig,
    validation: schemas.ProviderValidationResponse | None,
) -> None:
    if validation is None:
        row.last_validation_status = "not_validated"
        row.last_validation_message = "目前設定尚未重新驗證。"
        row.last_validated_at = None
        return

    row.last_validation_status = validation.validation_status
    row.last_validation_message = validation.message
    row.last_validated_at = (
        datetime.fromisoformat(validation.validated_at)
        if validation.validated_at
        else None
    )


def update_system_provider_settings(
    db: Session,
    payload: schemas.SystemProviderSettingsUpdateRequest,
) -> schemas.SystemProviderSettingsResponse:
    preset = get_provider_preset(payload.provider_id)
    if preset is None:
        raise HTTPException(status_code=400, detail="目前不支援指定的供應商。")

    actual_model_id, custom_model_id = _get_effective_model_id(
        preset=preset,
        model_level=payload.model_level,
        model_id=payload.model_id,
        custom_model_id=payload.custom_model_id,
    )
    api_key = _resolve_secret_for_payload(db, payload)
    base_url = (payload.base_url.strip() or preset.default_base_url).rstrip("/")
    timeout_seconds = payload.timeout_seconds or preset.default_timeout_seconds

    validation: schemas.ProviderValidationResponse | None = None
    if payload.validate_before_save and not payload.force_save_without_validation:
        validation = validate_system_provider_settings(db, payload)
        if validation.validation_status != "success":
            raise HTTPException(status_code=400, detail=validation.message)

    row = _get_runtime_config_row(db)
    previous_provider = row.provider_id if row is not None else None
    previous_model = row.model_id if row is not None else None
    previous_mask = row.api_key_masked if row is not None else None

    if row is None:
        row = models.SystemProviderConfig(scope_key=DEFAULT_SYSTEM_PROVIDER_SCOPE)

    key_was_updated = previous_mask != _mask_api_key(api_key) or row.api_key_secret != api_key

    row.provider_id = payload.provider_id
    row.model_level = payload.model_level
    row.model_id = actual_model_id
    row.custom_model_id = custom_model_id
    row.base_url = base_url
    row.timeout_seconds = timeout_seconds
    row.api_key_secret = api_key
    row.api_key_masked = _mask_api_key(api_key)
    row.config_source = "runtime_config"
    if key_was_updated:
        row.key_updated_at = models.utc_now()
    _apply_validation_result(row, validation)
    db.add(row)
    db.flush()

    if previous_provider != row.provider_id:
        _record_provider_event(
            db,
            config=row,
            event_type="provider_changed",
            summary=f"主動供應商改為 {preset.display_name}。",
            payload={
                "previous_provider_id": previous_provider,
                "current_provider_id": row.provider_id,
            },
        )

    if previous_model != row.model_id:
        _record_provider_event(
            db,
            config=row,
            event_type="model_changed",
            summary=f"模型改為 {row.model_id}。",
            payload={
                "previous_model_id": previous_model,
                "current_model_id": row.model_id,
                "model_level": row.model_level,
            },
        )

    if key_was_updated:
        _record_provider_event(
            db,
            config=row,
            event_type="api_key_updated",
            summary="已更新系統級 API key。",
            payload={"provider_id": row.provider_id, "api_key_masked": row.api_key_masked},
        )

    if validation is not None:
        _record_provider_event(
            db,
            config=row,
            event_type="validation_succeeded",
            summary="儲存前驗證成功，已直接套用新的系統級設定。",
            payload={
                "provider_id": row.provider_id,
                "model_id": row.model_id,
                "status": validation.validation_status,
            },
        )
    elif payload.force_save_without_validation:
        _record_provider_event(
            db,
            config=row,
            event_type="saved_without_validation",
            summary="這次設定未先通過驗證，已依使用者要求強制儲存。",
            payload={"provider_id": row.provider_id, "model_id": row.model_id},
        )

    db.commit()
    return get_system_provider_settings(db)


def revalidate_system_provider_settings(
    db: Session,
) -> schemas.SystemProviderSettingsResponse:
    row = _get_runtime_config_row(db)
    if row is None:
        raise HTTPException(status_code=400, detail="目前仍使用 env baseline，請先建立正式 runtime config。")

    validation = validate_system_provider_settings(
        db,
        schemas.SystemProviderSettingsValidateRequest(
            provider_id=row.provider_id,  # type: ignore[arg-type]
            model_level=row.model_level,  # type: ignore[arg-type]
            model_id=row.model_id,
            custom_model_id=row.custom_model_id or "",
            base_url=row.base_url,
            timeout_seconds=row.timeout_seconds,
            keep_existing_key=True,
        ),
    )
    _apply_validation_result(row, validation)
    db.add(row)
    _record_provider_event(
        db,
        config=row,
        event_type="validation_succeeded"
        if validation.validation_status == "success"
        else "validation_failed",
        summary=validation.message,
        payload={
            "provider_id": row.provider_id,
            "model_id": row.model_id,
            "status": validation.validation_status,
        },
    )
    db.commit()
    return get_system_provider_settings(db)


def reset_system_provider_settings_to_env(
    db: Session,
) -> schemas.SystemProviderSettingsResponse:
    row = _get_runtime_config_row(db)
    if row is not None:
        for event in row.events:
            event.config_id = None
            db.add(event)
        _record_provider_event(
            db,
            config=None,
            event_type="reset_to_env",
            summary="已移除正式 runtime config，回退到 env baseline。",
            payload={"provider_id": row.provider_id, "model_id": row.model_id},
        )
        db.delete(row)
        db.commit()
    return get_system_provider_settings(db)
