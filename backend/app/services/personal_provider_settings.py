from __future__ import annotations

from datetime import datetime

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.auth import CurrentMember
from app.domain import models
from app.model_router.provider_presets import get_provider_preset, list_settings_provider_presets
from app.services import system_provider_settings
from app.services.provider_allowlist import get_allowlist_entry
from app.services.provider_secret_crypto import decrypt_provider_secret, encrypt_provider_secret
from app.workbench import schemas


def _serialize_datetime(value):
    return value.isoformat() if value is not None else None


def _load_personal_credential(
    db: Session,
    *,
    user_id: str,
) -> models.PersonalProviderCredential | None:
    return db.scalar(
        select(models.PersonalProviderCredential).where(
            models.PersonalProviderCredential.user_id == user_id
        )
    )


def _load_existing_personal_secret(
    db: Session,
    *,
    user_id: str,
    provider_id: str,
) -> tuple[str | None, str | None]:
    credential = _load_personal_credential(db, user_id=user_id)
    if credential is None or not credential.api_key_ciphertext:
        return None, credential.provider_id if credential is not None else None
    return decrypt_provider_secret(credential.api_key_ciphertext), credential.provider_id


def _assert_personal_provider_allowed(
    db: Session,
    *,
    current_member: CurrentMember,
    provider_id: str,
    model_level: schemas.ProviderModelLevel,
    model_id: str,
    custom_model_id: str,
) -> None:
    if current_member.membership.role != "consultant":
        return

    allowlist = get_allowlist_entry(
        db,
        firm_id=current_member.firm.id,
        provider_id=provider_id,
        model_level=model_level,
    )
    if allowlist is None or allowlist.status != "active":
        raise HTTPException(status_code=400, detail="目前 firm 尚未允許這組 provider / model。")

    if custom_model_id.strip() and not allowlist.allow_custom_model:
        raise HTTPException(status_code=400, detail="目前 firm 尚未允許自訂模型。")

    actual_model_id = custom_model_id.strip() or model_id.strip()
    if allowlist.allowed_model_ids and actual_model_id not in allowlist.allowed_model_ids:
        raise HTTPException(status_code=400, detail="目前 firm 尚未允許這個模型。")


def _build_fallback_personal_response() -> schemas.CurrentProviderConfigResponse:
    baseline = system_provider_settings.resolve_effective_provider_config()
    return schemas.CurrentProviderConfigResponse(
        source=baseline.source,  # type: ignore[arg-type]
        provider_id=baseline.provider_id,
        provider_display_name=baseline.provider_display_name,
        model_level=baseline.model_level,
        actual_model_id=baseline.actual_model_id,
        custom_model_id=baseline.custom_model_id,
        base_url=baseline.base_url,
        timeout_seconds=baseline.timeout_seconds,
        api_key_configured=False,
        api_key_masked=None,
        last_validation_status="not_validated",
        last_validation_message="目前尚未保存個人模型設定。",
        last_validated_at=None,
        updated_at=None,
        key_updated_at=None,
        preset_runtime_support_level=baseline.preset_runtime_support_level,  # type: ignore[arg-type]
        using_env_baseline=True,
    )


def get_personal_provider_settings(
    db: Session,
    *,
    user_id: str,
) -> schemas.PersonalProviderSettingsResponse:
    credential = _load_personal_credential(db, user_id=user_id)
    if credential is None:
        current = _build_fallback_personal_response()
    else:
        preset = get_provider_preset(credential.provider_id)
        current = schemas.CurrentProviderConfigResponse(
            source="personal_config",
            provider_id=credential.provider_id,
            provider_display_name=preset.display_name if preset else credential.provider_id,
            model_level=credential.model_level,  # type: ignore[arg-type]
            actual_model_id=credential.custom_model_id or credential.model_id,
            custom_model_id=credential.custom_model_id,
            base_url=credential.base_url,
            timeout_seconds=credential.timeout_seconds,
            api_key_configured=bool(credential.api_key_ciphertext),
            api_key_masked=credential.api_key_masked,
            last_validation_status=credential.last_validation_status,  # type: ignore[arg-type]
            last_validation_message=credential.last_validation_message,
            last_validated_at=_serialize_datetime(credential.last_validated_at),
            updated_at=_serialize_datetime(credential.updated_at),
            key_updated_at=_serialize_datetime(credential.key_updated_at),
            preset_runtime_support_level=preset.runtime_support_level if preset else "beta",
            using_env_baseline=False,
        )

    return schemas.PersonalProviderSettingsResponse(
        current=current,
        presets=[
            system_provider_settings.serialize_provider_preset(item)
            for item in list_settings_provider_presets()
        ],
    )


def validate_personal_provider_settings(
    db: Session,
    *,
    current_member: CurrentMember,
    payload: schemas.PersonalProviderSettingsValidateRequest,
) -> schemas.ProviderValidationResponse:
    _assert_personal_provider_allowed(
        db,
        current_member=current_member,
        provider_id=payload.provider_id,
        model_level=payload.model_level,
        model_id=payload.model_id,
        custom_model_id=payload.custom_model_id,
    )
    current_secret, current_provider_id = _load_existing_personal_secret(
        db,
        user_id=current_member.user.id,
        provider_id=payload.provider_id,
    )
    return system_provider_settings.validate_runtime_provider_payload(
        payload=payload,
        current_secret=current_secret,
        current_provider_id=current_provider_id,
    )


def update_personal_provider_settings(
    db: Session,
    *,
    current_member: CurrentMember,
    payload: schemas.PersonalProviderSettingsUpdateRequest,
) -> schemas.PersonalProviderSettingsResponse:
    _assert_personal_provider_allowed(
        db,
        current_member=current_member,
        provider_id=payload.provider_id,
        model_level=payload.model_level,
        model_id=payload.model_id,
        custom_model_id=payload.custom_model_id,
    )

    preset = get_provider_preset(payload.provider_id)
    if preset is None:
        raise HTTPException(status_code=400, detail="目前不支援指定的供應商。")

    actual_model_id, custom_model_id = system_provider_settings.get_effective_model_id(
        preset=preset,
        model_level=payload.model_level,
        model_id=payload.model_id,
        custom_model_id=payload.custom_model_id,
    )
    current_secret, current_provider_id = _load_existing_personal_secret(
        db,
        user_id=current_member.user.id,
        provider_id=payload.provider_id,
    )
    validation: schemas.ProviderValidationResponse | None = None
    if payload.validate_before_save and not payload.force_save_without_validation:
        validation = system_provider_settings.validate_runtime_provider_payload(
            payload=payload,
            current_secret=current_secret,
            current_provider_id=current_provider_id,
        )
        if validation.validation_status != "success":
            raise HTTPException(status_code=400, detail=validation.message)

    credential = _load_personal_credential(db, user_id=current_member.user.id)
    if credential is None:
        credential = models.PersonalProviderCredential(user_id=current_member.user.id)

    raw_api_key = payload.api_key.strip()
    if raw_api_key:
        credential.api_key_ciphertext = encrypt_provider_secret(raw_api_key)
        credential.api_key_masked = system_provider_settings.mask_api_key(raw_api_key)
        credential.key_updated_at = models.utc_now()
    elif payload.keep_existing_key:
        if current_provider_id and current_provider_id != payload.provider_id:
            raise HTTPException(
                status_code=400,
                detail="更換供應商時不可沿用不同供應商的既有 key，請重新輸入對應 API key。",
            )
        if credential.api_key_ciphertext is None or not current_secret:
            raise HTTPException(status_code=400, detail="目前沒有可沿用的個人 API key。")
    else:
        raise HTTPException(status_code=400, detail="請先輸入個人 API key，或保留目前已設定的 key。")

    credential.provider_id = payload.provider_id
    credential.model_level = payload.model_level
    credential.model_id = actual_model_id
    credential.custom_model_id = custom_model_id
    credential.base_url = (payload.base_url.strip() or preset.default_base_url).rstrip("/")
    credential.timeout_seconds = payload.timeout_seconds or preset.default_timeout_seconds
    if validation is None:
        credential.last_validation_status = "not_validated"
        credential.last_validation_message = "個人模型設定已保存，但尚未重新驗證。"
        credential.last_validated_at = None
    else:
        credential.last_validation_status = validation.validation_status
        credential.last_validation_message = validation.message
        credential.last_validated_at = (
            datetime.fromisoformat(validation.validated_at)
            if validation.validated_at
            else None
        )
    db.add(credential)
    db.commit()
    return get_personal_provider_settings(db, user_id=current_member.user.id)


def revalidate_personal_provider_settings(
    db: Session,
    *,
    current_member: CurrentMember,
) -> schemas.PersonalProviderSettingsResponse:
    credential = _load_personal_credential(db, user_id=current_member.user.id)
    if credential is None or not credential.api_key_ciphertext:
        raise HTTPException(status_code=400, detail="目前還沒有可重新驗證的個人模型設定。")

    validation = validate_personal_provider_settings(
        db,
        current_member=current_member,
        payload=schemas.PersonalProviderSettingsValidateRequest(
            provider_id=credential.provider_id,  # type: ignore[arg-type]
            model_level=credential.model_level,  # type: ignore[arg-type]
            model_id=credential.model_id,
            custom_model_id=credential.custom_model_id or "",
            base_url=credential.base_url,
            timeout_seconds=credential.timeout_seconds,
            api_key="",
            keep_existing_key=True,
        ),
    )
    credential.last_validation_status = validation.validation_status
    credential.last_validation_message = validation.message
    credential.last_validated_at = (
        datetime.fromisoformat(validation.validated_at)
        if validation.validated_at
        else None
    )
    db.add(credential)
    db.commit()
    return get_personal_provider_settings(db, user_id=current_member.user.id)
