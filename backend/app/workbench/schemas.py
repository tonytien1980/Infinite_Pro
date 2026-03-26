from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class WorkbenchPreferenceResponse(BaseModel):
    interface_language: Literal["zh-Hant", "en"] = "zh-Hant"
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
    key_kpis_or_operating_signals: list[str] = Field(default_factory=list)
    key_kpis: list[str] = Field(default_factory=list)
    deliverable_presets: list[str] = Field(default_factory=list)
    version: str = Field(min_length=1, max_length=50, default="1.0.0")
    status: Literal["draft", "active", "inactive", "deprecated"] = "active"
    is_custom: bool = False


class HistoryVisibilityStateResponse(BaseModel):
    hidden_task_ids: list[str] = Field(default_factory=list)


class HistoryVisibilityUpdateRequest(BaseModel):
    task_ids: list[str] = Field(default_factory=list)
    visibility_state: Literal["visible", "hidden"] = "hidden"
