from __future__ import annotations

from enum import Enum


class FlowMode(str, Enum):
    MULTI_AGENT = "multi_agent"
    SPECIALIST = "specialist"


class CapabilityArchetype(str, Enum):
    DIAGNOSE_ASSESS = "diagnose_assess"
    DECIDE_CONVERGE = "decide_converge"
    REVIEW_CHALLENGE = "review_challenge"
    SYNTHESIZE_BRIEF = "synthesize_brief"
    RESTRUCTURE_REFRAME = "restructure_reframe"
    PLAN_ROADMAP = "plan_roadmap"
    SCENARIO_COMPARISON = "scenario_comparison"
    RISK_SURFACING = "risk_surfacing"


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
