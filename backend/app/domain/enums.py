from __future__ import annotations

from enum import Enum


class FlowMode(str, Enum):
    MULTI_AGENT = "multi_agent"
    SPECIALIST = "specialist"


class ExternalDataStrategy(str, Enum):
    STRICT = "strict"
    SUPPLEMENTAL = "supplemental"
    LATEST = "latest"


class TaskStatus(str, Enum):
    DRAFT = "draft"
    READY = "ready"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class RunStatus(str, Enum):
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class AgentCategory(str, Enum):
    CORE = "core"
    SPECIALIST = "specialist"


class AgentStatus(str, Enum):
    ACTIVE = "active"
    DISABLED = "disabled"
    DEPRECATED = "deprecated"
