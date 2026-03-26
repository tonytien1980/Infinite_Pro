from __future__ import annotations

import logging

from app.model_router.base import ModelProvider, ModelProviderError
from app.model_router.mock import MockModelProvider
from app.model_router.openai_provider import OpenAIModelProvider
from app.services.system_provider_settings import resolve_effective_provider_config

logger = logging.getLogger(__name__)


def get_model_provider() -> ModelProvider:
    config = resolve_effective_provider_config()
    provider_name = config.provider_id.lower()

    if provider_name == "mock":
        return MockModelProvider()

    if provider_name in {"openai", "anthropic", "gemini", "xai", "minimax"}:
        if config.api_key:
            return OpenAIModelProvider(
                api_key=config.api_key,
                model=config.actual_model_id,
                base_url=config.base_url,
                timeout_seconds=config.timeout_seconds,
            )

        raise ModelProviderError(
            f"系統級 provider 設定目前缺少 {provider_name} 的 API key，無法正式啟用。"
        )

    raise ModelProviderError(f"目前不支援供應商「{provider_name}」的正式 runtime path。")
