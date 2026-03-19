from __future__ import annotations

from app.core.config import settings
from app.model_router.base import ModelProvider
from app.model_router.mock import MockModelProvider


def get_model_provider() -> ModelProvider:
    if settings.model_provider == "mock":
        return MockModelProvider()
    return MockModelProvider()
