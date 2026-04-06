from __future__ import annotations

import logging
from typing import TYPE_CHECKING

from sqlalchemy.orm import Session

from app.model_router.base import ModelProvider, ModelProviderError
from app.model_router.anthropic_provider import AnthropicModelProvider
from app.model_router.gemini_provider import GeminiModelProvider
from app.model_router.mock import MockModelProvider
from app.model_router.openai_provider import OpenAIModelProvider
from app.model_router.provider_presets import get_provider_preset
from app.services.system_provider_settings import (
    resolve_effective_provider_config,
    resolve_effective_provider_config_for_member,
)

if TYPE_CHECKING:
    from app.core.auth import CurrentMember

logger = logging.getLogger(__name__)


def get_model_provider(
    *,
    db: Session | None = None,
    current_member: "CurrentMember | None" = None,
) -> ModelProvider:
    if db is not None and current_member is not None:
        config = resolve_effective_provider_config_for_member(
            db,
            user_id=current_member.user.id,
            role=current_member.membership.role,
            firm_id=current_member.firm.id,
        )
    else:
        config = resolve_effective_provider_config()
    provider_name = config.provider_id.lower()
    preset = get_provider_preset(provider_name)

    if provider_name == "mock":
        return MockModelProvider()

    if config.api_key is None:
        raise ModelProviderError(
            f"系統級 provider 設定目前缺少 {provider_name} 的 API key，無法正式啟用。"
        )

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
