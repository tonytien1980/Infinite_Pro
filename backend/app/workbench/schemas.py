from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

ProviderModelLevel = Literal["high_quality", "balanced", "low_cost"]
ProviderValidationStatus = Literal[
    "success",
    "invalid_api_key",
    "base_url_unreachable",
    "model_unavailable",
    "timeout",
    "unknown_error",
    "not_validated",
]


class WorkbenchPreferenceResponse(BaseModel):
    interface_language: Literal["zh-Hant", "en"] = "zh-Hant"
    theme_preference: Literal["light", "dark", "system"] = "light"
    homepage_display_preference: Literal["matters", "deliverables", "evidence"] = "matters"
    history_default_page_size: int = 20
    show_recent_activity: bool = True
    show_frequent_extensions: bool = True
    new_task_default_input_mode: Literal[
        "one_line_inquiry",
        "single_document_intake",
        "multi_material_case",
    ] = "one_line_inquiry"
    density: Literal["standard", "compact"] = "standard"
    deliverable_sort_preference: Literal[
        "updated_desc",
        "title_asc",
        "version_desc",
    ] = "updated_desc"


class WorkbenchPreferenceUpdateRequest(WorkbenchPreferenceResponse):
    pass


class ProviderPresetModelsResponse(BaseModel):
    high_quality: str
    balanced: str
    low_cost: str


class ProviderPresetResponse(BaseModel):
    provider_id: Literal["openai", "anthropic", "gemini", "xai", "minimax"]
    display_name: str
    default_base_url: str
    default_timeout_seconds: int
    auth_scheme_type: str
    adapter_kind: str
    runtime_support_level: Literal["verified", "beta"]
    validation_support_level: Literal["verified", "beta"]
    recommended_models: ProviderPresetModelsResponse


class ProviderValidationResponse(BaseModel):
    provider_id: str
    provider_display_name: str
    model_id: str
    validation_status: ProviderValidationStatus = "not_validated"
    message: str = ""
    detail: str = ""
    validated_at: str | None = None


class CurrentProviderConfigResponse(BaseModel):
    source: Literal["runtime_config", "env_baseline"]
    provider_id: str
    provider_display_name: str
    model_level: ProviderModelLevel
    actual_model_id: str
    custom_model_id: str | None = None
    base_url: str
    timeout_seconds: int
    api_key_configured: bool = False
    api_key_masked: str | None = None
    last_validation_status: ProviderValidationStatus = "not_validated"
    last_validation_message: str = ""
    last_validated_at: str | None = None
    updated_at: str | None = None
    key_updated_at: str | None = None
    preset_runtime_support_level: Literal["verified", "beta", "development"] = "beta"
    using_env_baseline: bool = False


class SystemProviderSettingsResponse(BaseModel):
    current: CurrentProviderConfigResponse
    env_baseline: CurrentProviderConfigResponse
    presets: list[ProviderPresetResponse] = Field(default_factory=list)


class SystemProviderSettingsValidateRequest(BaseModel):
    provider_id: Literal["openai", "anthropic", "gemini", "xai", "minimax"]
    model_level: ProviderModelLevel = "balanced"
    model_id: str = ""
    custom_model_id: str = ""
    base_url: str = ""
    timeout_seconds: int = 60
    api_key: str = ""
    keep_existing_key: bool = False


class SystemProviderSettingsUpdateRequest(SystemProviderSettingsValidateRequest):
    validate_before_save: bool = True
    force_save_without_validation: bool = False


class AgentCatalogEntryUpdateRequest(BaseModel):
    agent_id: str = Field(min_length=1, max_length=255)
    agent_name: str = Field(min_length=1, max_length=255)
    agent_type: Literal["host", "reasoning", "specialist"]
    description: str = ""
    supported_capabilities: list[str] = Field(default_factory=list)
    relevant_domain_packs: list[str] = Field(default_factory=list)
    relevant_industry_packs: list[str] = Field(default_factory=list)
    version: str = Field(min_length=1, max_length=50, default="1.0.0")
    status: Literal["draft", "active", "inactive", "deprecated"] = "active"
    is_custom: bool = False


class PackCatalogEntryUpdateRequest(BaseModel):
    pack_id: str = Field(min_length=1, max_length=255)
    pack_type: Literal["domain", "industry"]
    pack_name: str = Field(min_length=1, max_length=255)
    description: str = ""
    domain_definition: str = ""
    industry_definition: str = ""
    common_business_models: list[str] = Field(default_factory=list)
    common_problem_patterns: list[str] = Field(default_factory=list)
    stage_specific_heuristics: dict[str, list[str]] = Field(default_factory=dict)
    key_kpis_or_operating_signals: list[str] = Field(default_factory=list)
    key_kpis: list[str] = Field(default_factory=list)
    domain_lenses: list[str] = Field(default_factory=list)
    relevant_client_types: list[str] = Field(default_factory=list)
    relevant_client_stages: list[str] = Field(default_factory=list)
    default_decision_context_patterns: list[str] = Field(default_factory=list)
    evidence_expectations: list[str] = Field(default_factory=list)
    risk_libraries: list[str] = Field(default_factory=list)
    common_risks: list[str] = Field(default_factory=list)
    decision_patterns: list[str] = Field(default_factory=list)
    deliverable_presets: list[str] = Field(default_factory=list)
    recommendation_patterns: list[str] = Field(default_factory=list)
    routing_hints: list[str] = Field(default_factory=list)
    pack_notes: list[str] = Field(default_factory=list)
    scope_boundaries: list[str] = Field(default_factory=list)
    pack_rationale: list[str] = Field(default_factory=list)
    version: str = Field(min_length=1, max_length=50, default="1.0.0")
    status: Literal["draft", "active", "inactive", "deprecated"] = "active"
    override_rules: list[str] = Field(default_factory=list)
    is_custom: bool = False


class HistoryVisibilityStateResponse(BaseModel):
    hidden_task_ids: list[str] = Field(default_factory=list)


class HistoryVisibilityUpdateRequest(BaseModel):
    task_ids: list[str] = Field(default_factory=list)
    visibility_state: Literal["visible", "hidden"] = "hidden"
