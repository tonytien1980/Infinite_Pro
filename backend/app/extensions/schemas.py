from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, ConfigDict, Field

from app.domain.enums import CapabilityArchetype, DeliverableClass, InputEntryMode


class PackType(str, Enum):
    DOMAIN = "domain"
    INDUSTRY = "industry"


class PackContractInterfaceId(str, Enum):
    EVIDENCE_READINESS_V1 = "evidence_readiness_v1"
    DECISION_FRAMING_V1 = "decision_framing_v1"
    DELIVERABLE_SHAPING_V1 = "deliverable_shaping_v1"


class PackRequiredPropertyId(str, Enum):
    DEFINITION = "definition"
    COMMON_BUSINESS_MODELS = "common_business_models"
    COMMON_PROBLEM_PATTERNS = "common_problem_patterns"
    EVIDENCE_EXPECTATIONS = "evidence_expectations"
    STAGE_SPECIFIC_HEURISTICS = "stage_specific_heuristics"
    KEY_SIGNALS = "key_signals"
    COMMON_RISKS = "common_risks"
    DEFAULT_DECISION_CONTEXT_PATTERNS = "default_decision_context_patterns"
    DECISION_PATTERNS = "decision_patterns"
    DELIVERABLE_PRESETS = "deliverable_presets"
    ROUTING_HINTS = "routing_hints"
    PACK_RATIONALE = "pack_rationale"


class PackRuleBindingId(str, Enum):
    READINESS_GATE_V1 = "readiness_gate_v1"
    DECISION_CONTEXT_HINT_V1 = "decision_context_hint_v1"
    DELIVERABLE_HINT_V1 = "deliverable_hint_v1"


class PackContractStatus(str, Enum):
    READY = "ready"
    MISSING_REQUIRED_PROPERTIES = "missing_required_properties"


class ExtensionStatus(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    INACTIVE = "inactive"
    DEPRECATED = "deprecated"


class AgentType(str, Enum):
    HOST = "host"
    REASONING = "reasoning"
    SPECIALIST = "specialist"


class FrozenModel(BaseModel):
    model_config = ConfigDict(frozen=True)


class PackContractRequirement(FrozenModel):
    interface_id: PackContractInterfaceId
    required_property_ids: list[PackRequiredPropertyId] = Field(default_factory=list)
    missing_required_property_ids: list[PackRequiredPropertyId] = Field(default_factory=list)
    rule_binding_ids: list[PackRuleBindingId] = Field(default_factory=list)
    status: PackContractStatus = PackContractStatus.READY
    summary: str = ""


class PackContractBaseline(FrozenModel):
    pack_api_name: str
    requirements: list[PackContractRequirement] = Field(default_factory=list)
    ready_interface_ids: list[PackContractInterfaceId] = Field(default_factory=list)
    ready_rule_binding_ids: list[PackRuleBindingId] = Field(default_factory=list)
    missing_required_property_ids: list[PackRequiredPropertyId] = Field(default_factory=list)
    status: PackContractStatus = PackContractStatus.READY


class PackSpec(FrozenModel):
    pack_id: str
    pack_type: PackType
    pack_name: str
    description: str
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
    recommendation_patterns: list[str] = Field(default_factory=list)
    deliverable_presets: list[str] = Field(default_factory=list)
    routing_hints: list[str] = Field(default_factory=list)
    pack_notes: list[str] = Field(default_factory=list)
    scope_boundaries: list[str] = Field(default_factory=list)
    pack_rationale: list[str] = Field(default_factory=list)
    version: str = "1.0.0"
    status: ExtensionStatus = ExtensionStatus.ACTIVE
    override_rules: list[str] = Field(default_factory=list)
    contract_baseline: PackContractBaseline | None = None


class AgentSpec(FrozenModel):
    agent_id: str
    agent_name: str
    agent_type: AgentType
    description: str
    supported_capabilities: list[CapabilityArchetype] = Field(default_factory=list)
    relevant_domain_packs: list[str] = Field(default_factory=list)
    relevant_industry_packs: list[str] = Field(default_factory=list)
    primary_responsibilities: list[str] = Field(default_factory=list)
    out_of_scope: list[str] = Field(default_factory=list)
    defer_rules: list[str] = Field(default_factory=list)
    preferred_execution_modes: list[str] = Field(default_factory=list)
    input_requirements: list[str] = Field(default_factory=list)
    minimum_evidence_readiness: list[str] = Field(default_factory=list)
    required_context_fields: list[str] = Field(default_factory=list)
    output_contract: list[str] = Field(default_factory=list)
    produced_objects: list[str] = Field(default_factory=list)
    deliverable_impact: list[str] = Field(default_factory=list)
    writeback_expectations: list[str] = Field(default_factory=list)
    invocation_rules: list[str] = Field(default_factory=list)
    escalation_rules: list[str] = Field(default_factory=list)
    handoff_targets: list[str] = Field(default_factory=list)
    evaluation_focus: list[str] = Field(default_factory=list)
    failure_modes_to_watch: list[str] = Field(default_factory=list)
    trace_requirements: list[str] = Field(default_factory=list)
    version: str = "1.0.0"
    status: ExtensionStatus = ExtensionStatus.ACTIVE


class PackResolverInput(BaseModel):
    domain_lenses: list[str] = Field(default_factory=list)
    client_type: str | None = None
    client_stage: str | None = None
    decision_context_summary: str | None = None
    explicit_pack_ids: list[str] = Field(default_factory=list)
    industry_hints: list[str] = Field(default_factory=list)


class PackResolution(BaseModel):
    selected_domain_pack_ids: list[str] = Field(default_factory=list)
    selected_industry_pack_ids: list[str] = Field(default_factory=list)
    override_pack_ids: list[str] = Field(default_factory=list)
    conflicts: list[str] = Field(default_factory=list)
    stack_order: list[str] = Field(default_factory=list)
    resolver_notes: list[str] = Field(default_factory=list)
    pack_scores: dict[str, int] = Field(default_factory=dict)
    pack_signals: dict[str, list[str]] = Field(default_factory=dict)


class AgentResolverInput(BaseModel):
    capability: CapabilityArchetype
    selected_domain_pack_ids: list[str] = Field(default_factory=list)
    selected_industry_pack_ids: list[str] = Field(default_factory=list)
    decision_context_summary: str | None = None
    explicit_agent_ids: list[str] = Field(default_factory=list)
    evidence_count: int = 0
    artifact_count: int = 0
    input_entry_mode: InputEntryMode = InputEntryMode.ONE_LINE_INQUIRY
    deliverable_class: DeliverableClass = DeliverableClass.EXPLORATORY_BRIEF
    decision_context_clear: bool = False
    external_research_heavy_case: bool = False
    allow_specialists: bool = True


class AgentResolution(BaseModel):
    host_agent_id: str
    reasoning_agent_ids: list[str] = Field(default_factory=list)
    specialist_agent_ids: list[str] = Field(default_factory=list)
    override_agent_ids: list[str] = Field(default_factory=list)
    resolver_notes: list[str] = Field(default_factory=list)
    agent_scores: dict[str, int] = Field(default_factory=dict)
    agent_signals: dict[str, list[str]] = Field(default_factory=dict)
    omitted_agent_notes: list[str] = Field(default_factory=list)
    deferred_agent_notes: list[str] = Field(default_factory=list)
    escalation_notes: list[str] = Field(default_factory=list)


class PackRegistrySnapshot(BaseModel):
    packs: list[PackSpec]
    active_pack_ids: list[str]
    draft_pack_ids: list[str]
    inactive_pack_ids: list[str]


class AgentRegistrySnapshot(BaseModel):
    agents: list[AgentSpec]
    host_agent_id: str
    active_agent_ids: list[str]
    draft_agent_ids: list[str]
    inactive_agent_ids: list[str]


class ExtensionManagerSnapshot(BaseModel):
    pack_registry: PackRegistrySnapshot
    agent_registry: AgentRegistrySnapshot
