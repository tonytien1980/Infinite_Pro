from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class DemoWorkspaceSectionRead(BaseModel):
    section_id: Literal[
        "sample_matters",
        "sample_deliverables",
        "sample_history",
        "workspace_rules",
    ]
    title: str
    summary: str
    items: list[str] = Field(default_factory=list)


class DemoWorkspaceRead(BaseModel):
    workspace_mode: Literal["demo"] = "demo"
    title: str
    subtitle: str
    entry_message: str
    sections: list[DemoWorkspaceSectionRead] = Field(default_factory=list)
