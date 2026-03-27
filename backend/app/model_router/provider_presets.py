from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

ProviderId = Literal["openai", "anthropic", "gemini", "xai", "minimax", "mock"]
ProviderModelLevel = Literal["high_quality", "balanced", "low_cost"]


@dataclass(frozen=True)
class ProviderPreset:
    provider_id: ProviderId
    display_name: str
    default_base_url: str
    default_timeout_seconds: int
    auth_scheme_type: str
    adapter_kind: str
    recommended_models: dict[ProviderModelLevel, str]
    runtime_support_level: Literal["verified", "beta", "development"]
    validation_support_level: Literal["verified", "beta", "development"]
    exposed_in_settings: bool = True


PROVIDER_PRESETS: dict[ProviderId, ProviderPreset] = {
    "openai": ProviderPreset(
        provider_id="openai",
        display_name="OpenAI",
        default_base_url="https://api.openai.com/v1",
        default_timeout_seconds=60,
        auth_scheme_type="bearer",
        adapter_kind="openai_native",
        recommended_models={
            "high_quality": "gpt-5.4",
            "balanced": "gpt-5.4-mini",
            "low_cost": "gpt-5.4-nano",
        },
        runtime_support_level="verified",
        validation_support_level="verified",
    ),
    "anthropic": ProviderPreset(
        provider_id="anthropic",
        display_name="Anthropic（Claude）",
        default_base_url="https://api.anthropic.com/v1/messages",
        default_timeout_seconds=60,
        auth_scheme_type="x_api_key",
        adapter_kind="anthropic_native",
        recommended_models={
            "high_quality": "claude-opus-4-6",
            "balanced": "claude-sonnet-4-6",
            "low_cost": "claude-haiku-4-5",
        },
        runtime_support_level="beta",
        validation_support_level="beta",
    ),
    "gemini": ProviderPreset(
        provider_id="gemini",
        display_name="Google Gemini",
        default_base_url="https://generativelanguage.googleapis.com/v1beta",
        default_timeout_seconds=60,
        auth_scheme_type="x_goog_api_key",
        adapter_kind="gemini_native",
        recommended_models={
            "high_quality": "gemini-2.5-pro",
            "balanced": "gemini-2.5-flash",
            "low_cost": "gemini-2.5-flash-lite",
        },
        runtime_support_level="beta",
        validation_support_level="beta",
    ),
    "xai": ProviderPreset(
        provider_id="xai",
        display_name="xAI（Grok）",
        default_base_url="https://api.x.ai/v1",
        default_timeout_seconds=60,
        auth_scheme_type="bearer",
        adapter_kind="openai_compatible",
        recommended_models={
            "high_quality": "grok-4.20-reasoning",
            "balanced": "grok-4-1-fast-reasoning",
            "low_cost": "grok-4-1-fast-non-reasoning",
        },
        runtime_support_level="beta",
        validation_support_level="beta",
    ),
    "minimax": ProviderPreset(
        provider_id="minimax",
        display_name="MiniMax",
        default_base_url="https://api.minimax.io/v1",
        default_timeout_seconds=60,
        auth_scheme_type="bearer",
        adapter_kind="openai_compatible",
        recommended_models={
            "high_quality": "MiniMax-M2.7",
            "balanced": "MiniMax-M2.7-highspeed",
            "low_cost": "MiniMax-M2.1",
        },
        runtime_support_level="beta",
        validation_support_level="beta",
    ),
    "mock": ProviderPreset(
        provider_id="mock",
        display_name="Mock（開發用）",
        default_base_url="",
        default_timeout_seconds=0,
        auth_scheme_type="none",
        adapter_kind="mock",
        recommended_models={
            "high_quality": "mock",
            "balanced": "mock",
            "low_cost": "mock",
        },
        runtime_support_level="development",
        validation_support_level="development",
        exposed_in_settings=False,
    ),
}


def get_provider_preset(provider_id: str) -> ProviderPreset | None:
    return PROVIDER_PRESETS.get(provider_id.lower())  # type: ignore[arg-type]


def list_settings_provider_presets() -> list[ProviderPreset]:
    return [
        preset
        for preset in PROVIDER_PRESETS.values()
        if preset.exposed_in_settings
    ]
