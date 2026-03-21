from __future__ import annotations

import logging

from app.core.config import settings
from app.model_router.base import ModelProvider
from app.model_router.mock import MockModelProvider
from app.model_router.openai_provider import OpenAIModelProvider

logger = logging.getLogger(__name__)


def get_model_provider() -> ModelProvider:
    provider_name = settings.model_provider.lower()

    if provider_name == "openai":
        if settings.openai_api_key:
            return OpenAIModelProvider(
                api_key=settings.openai_api_key,
                model=settings.openai_model,
                base_url=settings.openai_base_url,
                timeout_seconds=settings.openai_timeout_seconds,
            )
        logger.warning(
            "MODEL_PROVIDER=openai was requested but OPENAI_API_KEY is not configured. Falling back to mock provider."
        )
        return MockModelProvider()

    if settings.model_provider == "mock":
        return MockModelProvider()

    logger.warning("Unknown MODEL_PROVIDER=%s. Falling back to mock provider.", settings.model_provider)
    return MockModelProvider()
