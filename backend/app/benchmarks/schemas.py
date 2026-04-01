from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, ConfigDict, Field

from app.extensions.schemas import PackContractInterfaceId


class FrozenModel(BaseModel):
    model_config = ConfigDict(frozen=True)


class BenchmarkHintArea(str, Enum):
    EVIDENCE_EXPECTATIONS = "evidence_expectations"
    DECISION_PATTERNS = "decision_patterns"
    DELIVERABLE_PRESETS = "deliverable_presets"
    ROUTING_HINTS = "routing_hints"
    READINESS = "readiness"


class BenchmarkStatus(str, Enum):
    PASS = "pass"
    WARN = "warn"
    FAIL = "fail"


class BenchmarkCategoryId(str, Enum):
    DOMAIN_PACK_CONTRACTS = "domain_pack_contracts"
    INDUSTRY_BATCH1 = "industry_batch1"
    INDUSTRY_BATCH2 = "industry_batch2"
    LEGAL_FINANCE_CONTRACT = "legal_finance_contract"
    OPERATIONS_PROCESS = "operations_process"
    DELIVERABLE_HARDENING = "deliverable_hardening"
    INGESTION_HARDENING = "ingestion_hardening"


class RegressionGateMode(str, Enum):
    REQUIRED = "required"
    ADVISORY = "advisory"
    OBSERVATION_ONLY = "observation_only"


class BenchmarkCase(FrozenModel):
    case_id: str
    title: str
    description: str
    client_stage: str
    client_type: str
    domain_lenses: list[str] = Field(default_factory=list)
    industry_hints: list[str] = Field(default_factory=list)
    decision_context_summary: str
    source_mix_summary: list[str] = Field(default_factory=list)
    target_domain_pack_ids: list[str] = Field(default_factory=list)
    target_industry_pack_ids: list[str] = Field(default_factory=list)
    expected_contract_interface_ids: list[PackContractInterfaceId] = Field(default_factory=list)
    expected_hint_areas: list[BenchmarkHintArea] = Field(default_factory=list)
    expected_failure_markers: list[str] = Field(default_factory=list)
    expected_deliverable_markers: list[str] = Field(default_factory=list)
    expected_ingestion_markers: list[str] = Field(default_factory=list)
    notes: list[str] = Field(default_factory=list)


class BenchmarkManifest(FrozenModel):
    manifest_id: str
    title: str
    purpose: str
    update_policy: list[str] = Field(default_factory=list)
    cases: list[BenchmarkCase] = Field(default_factory=list)


class BenchmarkObservation(FrozenModel):
    dimension: str
    status: BenchmarkStatus
    detail: str
    regression_marker: str | None = None


class BenchmarkResultRecord(FrozenModel):
    category_id: BenchmarkCategoryId | None = None
    case_id: str
    target_domain_pack_ids: list[str] = Field(default_factory=list)
    target_industry_pack_ids: list[str] = Field(default_factory=list)
    selected_domain_pack_ids: list[str] = Field(default_factory=list)
    selected_industry_pack_ids: list[str] = Field(default_factory=list)
    observed_hint_areas: list[BenchmarkHintArea] = Field(default_factory=list)
    satisfied_interface_ids: list[PackContractInterfaceId] = Field(default_factory=list)
    missing_target_pack_ids: list[str] = Field(default_factory=list)
    observed_deliverable_markers: list[str] = Field(default_factory=list)
    observed_ingestion_markers: list[str] = Field(default_factory=list)
    pack_scores: dict[str, int] = Field(default_factory=dict)
    pack_signal_counts: dict[str, int] = Field(default_factory=dict)
    status: BenchmarkStatus
    observations: list[BenchmarkObservation] = Field(default_factory=list)
    notes: list[str] = Field(default_factory=list)


class BenchmarkSuiteCategory(FrozenModel):
    category_id: BenchmarkCategoryId
    title: str
    manifest_path: str
    gate_mode: RegressionGateMode = RegressionGateMode.REQUIRED
    purpose: str = ""


class BenchmarkSuiteManifest(FrozenModel):
    suite_id: str
    title: str
    purpose: str
    update_policy: list[str] = Field(default_factory=list)
    categories: list[BenchmarkSuiteCategory] = Field(default_factory=list)


class BenchmarkCategoryGateResult(FrozenModel):
    category_id: BenchmarkCategoryId
    title: str
    gate_mode: RegressionGateMode
    manifest_id: str
    case_count: int
    pass_count: int
    warn_count: int
    fail_count: int
    gate_status: BenchmarkStatus
    failing_case_ids: list[str] = Field(default_factory=list)
    warning_case_ids: list[str] = Field(default_factory=list)
    results: list[BenchmarkResultRecord] = Field(default_factory=list)


class BenchmarkSuiteRunResult(FrozenModel):
    suite_id: str
    title: str
    category_results: list[BenchmarkCategoryGateResult] = Field(default_factory=list)
    total_case_count: int = 0
    gate_status: BenchmarkStatus = BenchmarkStatus.PASS
    failing_categories: list[BenchmarkCategoryId] = Field(default_factory=list)
    warning_categories: list[BenchmarkCategoryId] = Field(default_factory=list)
