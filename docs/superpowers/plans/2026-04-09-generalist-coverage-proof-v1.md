# Generalist Coverage Proof v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把現有 `pack / hardening` benchmark scaffold，推進成 `7.3 Generalist coverage proof v1`：讓 suite 能正式回讀 `client_stage / client_type / continuity / cross-domain` coverage，而不滑向大型 benchmark platform。

**Architecture:** 保留現有 `p0_full_regression_suite` 作為 hardening regression，不硬改名成 generalist suite。新增一組專屬的 `generalist coverage proof` manifest/suite family，並擴充 benchmark schema 與 runner，讓 suite run result 正式帶出 coverage summary、thin values 與 missing values。所有變更都維持在 `backend/app/benchmarks`、`backend/tests/test_benchmark_scaffolding.py` 與 active docs；不新增產品 UI。

**Tech Stack:** Python, Pydantic, JSON manifests, pytest, benchmark runner CLI, active docs under `docs/`

---

## File Structure

- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/app/benchmarks/schemas.py`
  - Add continuity metadata to benchmark cases
  - Add suite-level coverage target and coverage summary schema
  - Add new category ids for generalist coverage families
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/app/benchmarks/runner.py`
  - Carry coverage metadata into result records
  - Build suite-level coverage summary for coverage-proof suites
- Create: `/Users/oldtien_base/Desktop/Infinite Pro/backend/app/benchmarks/manifests/g1_stage_type_coverage.json`
  - Representative seed cases for stage/type coverage
- Create: `/Users/oldtien_base/Desktop/Infinite Pro/backend/app/benchmarks/manifests/g1_continuity_coverage.json`
  - Representative seed cases for one-off / follow-up / continuous coverage
- Create: `/Users/oldtien_base/Desktop/Infinite Pro/backend/app/benchmarks/manifests/g1_cross_domain_coverage.json`
  - Representative seed cases for cross-domain bundle coverage
- Create: `/Users/oldtien_base/Desktop/Infinite Pro/backend/app/benchmarks/suites/generalist_coverage_proof_v1.json`
  - Coverage-proof suite with explicit coverage targets
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/scripts/run_pack_benchmark_scaffold.py`
  - Optionally add a `--suite coverage` alias for convenience without changing default behavior
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/tests/test_benchmark_scaffolding.py`
  - Add manifest / suite / coverage-summary regression tests
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/05_benchmark_and_regression.md`
  - Separate hardening regression from coverage-proof suite
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/06_product_alignment_and_85_point_roadmap.md`
  - Mark `7.3` first slice as started with honest scope
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/04_qa_matrix.md`
  - Append real verification evidence only after all commands pass

---

### Task 1: Extend Benchmark Schema And Runner For Coverage Summary

**Files:**
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/app/benchmarks/schemas.py`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/app/benchmarks/runner.py`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/tests/test_benchmark_scaffolding.py`

- [ ] **Step 1: Write the failing schema / runner test**

```python
def test_generalist_coverage_suite_returns_coverage_summary() -> None:
    suite = load_suite(
        "backend/app/benchmarks/suites/generalist_coverage_proof_v1.json"
    )
    result = run_suite(suite)

    assert result.coverage_summary
    stage_summary = next(item for item in result.coverage_summary if item.axis == "client_stage")
    continuity_summary = next(item for item in result.coverage_summary if item.axis == "continuity")

    assert "創業階段" in stage_summary.expected_values
    assert "one_off" in continuity_summary.expected_values
    assert isinstance(stage_summary.missing_values, list)
```

- [ ] **Step 2: Run the benchmark test to verify it fails**

Run: `PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_benchmark_scaffolding.py -q`

Expected:
- FAIL because `BenchmarkSuiteRunResult` currently has no `coverage_summary`
- FAIL because no coverage suite file exists yet

- [ ] **Step 3: Extend benchmark schema for coverage metadata**

```python
class BenchmarkCoverageAxis(str, Enum):
    CLIENT_STAGE = "client_stage"
    CLIENT_TYPE = "client_type"
    CONTINUITY = "continuity"
    CROSS_DOMAIN = "cross_domain"


class BenchmarkCoverageTarget(FrozenModel):
    axis: BenchmarkCoverageAxis
    expected_values: list[str] = Field(default_factory=list)
    thin_threshold: int = 1


class BenchmarkCoverageSummary(FrozenModel):
    axis: BenchmarkCoverageAxis
    expected_values: list[str] = Field(default_factory=list)
    covered_values: list[str] = Field(default_factory=list)
    thin_values: list[str] = Field(default_factory=list)
    missing_values: list[str] = Field(default_factory=list)
    counts: dict[str, int] = Field(default_factory=dict)


class BenchmarkCase(FrozenModel):
    case_id: str
    title: str
    description: str
    client_stage: str
    client_type: str
    engagement_continuity_mode: str = "one_off"
    writeback_depth: str = "minimal"
    coverage_bundle_id: str = ""
    domain_lenses: list[str] = Field(default_factory=list)
    ...
```

```python
class BenchmarkResultRecord(FrozenModel):
    category_id: BenchmarkCategoryId | None = None
    case_id: str
    client_stage: str = ""
    client_type: str = ""
    engagement_continuity_mode: str = "one_off"
    writeback_depth: str = "minimal"
    coverage_bundle_id: str = ""
    ...
```

```python
class BenchmarkSuiteManifest(FrozenModel):
    suite_id: str
    title: str
    purpose: str
    update_policy: list[str] = Field(default_factory=list)
    coverage_targets: list[BenchmarkCoverageTarget] = Field(default_factory=list)
    categories: list[BenchmarkSuiteCategory] = Field(default_factory=list)


class BenchmarkSuiteRunResult(FrozenModel):
    suite_id: str
    title: str
    category_results: list[BenchmarkCategoryGateResult] = Field(default_factory=list)
    coverage_summary: list[BenchmarkCoverageSummary] = Field(default_factory=list)
    ...
```

- [ ] **Step 4: Add new benchmark category ids**

```python
class BenchmarkCategoryId(str, Enum):
    DOMAIN_PACK_CONTRACTS = "domain_pack_contracts"
    INDUSTRY_BATCH1 = "industry_batch1"
    INDUSTRY_BATCH2 = "industry_batch2"
    LEGAL_FINANCE_CONTRACT = "legal_finance_contract"
    OPERATIONS_PROCESS = "operations_process"
    DELIVERABLE_HARDENING = "deliverable_hardening"
    INGESTION_HARDENING = "ingestion_hardening"
    GENERALIST_STAGE_TYPE = "generalist_stage_type"
    GENERALIST_CONTINUITY = "generalist_continuity"
    GENERALIST_CROSS_DOMAIN = "generalist_cross_domain"
```

- [ ] **Step 5: Extend runner to carry coverage metadata and build suite-level coverage summary**

```python
def run_benchmark_case(
    case: BenchmarkCase,
    *,
    registry: ExtensionRegistry | None = None,
    resolver: PackResolver | None = None,
    category_id: BenchmarkCategoryId | None = None,
) -> BenchmarkResultRecord:
    ...
    return BenchmarkResultRecord(
        category_id=category_id,
        case_id=case.case_id,
        client_stage=case.client_stage,
        client_type=case.client_type,
        engagement_continuity_mode=case.engagement_continuity_mode,
        writeback_depth=case.writeback_depth,
        coverage_bundle_id=case.coverage_bundle_id,
        ...
    )
```

```python
def build_suite_coverage_summary(
    suite: BenchmarkSuiteManifest,
    category_results: list[BenchmarkCategoryGateResult],
) -> list[BenchmarkCoverageSummary]:
    results = [record for category in category_results for record in category.results]
    summaries: list[BenchmarkCoverageSummary] = []

    for target in suite.coverage_targets:
        if target.axis == BenchmarkCoverageAxis.CLIENT_STAGE:
            values = [record.client_stage for record in results if record.client_stage]
        elif target.axis == BenchmarkCoverageAxis.CLIENT_TYPE:
            values = [record.client_type for record in results if record.client_type]
        elif target.axis == BenchmarkCoverageAxis.CONTINUITY:
            values = [
                record.engagement_continuity_mode
                for record in results
                if record.engagement_continuity_mode
            ]
        else:
            values = [record.coverage_bundle_id for record in results if record.coverage_bundle_id]

        counts: dict[str, int] = {}
        for value in values:
            counts[value] = counts.get(value, 0) + 1

        covered_values = sorted(counts.keys())
        missing_values = [value for value in target.expected_values if value not in counts]
        thin_values = [
            value
            for value in target.expected_values
            if value in counts and counts[value] <= target.thin_threshold
        ]

        summaries.append(
            BenchmarkCoverageSummary(
                axis=target.axis,
                expected_values=target.expected_values,
                covered_values=covered_values,
                thin_values=thin_values,
                missing_values=missing_values,
                counts=counts,
            )
        )

    return summaries
```

```python
def run_suite(
    suite: BenchmarkSuiteManifest,
    *,
    registry: ExtensionRegistry | None = None,
    resolver: PackResolver | None = None,
) -> BenchmarkSuiteRunResult:
    ...
    coverage_summary = build_suite_coverage_summary(suite, category_results)
    return BenchmarkSuiteRunResult(
        suite_id=suite.suite_id,
        title=suite.title,
        category_results=category_results,
        coverage_summary=coverage_summary,
        total_case_count=sum(item.case_count for item in category_results),
        gate_status=overall_gate_status,
        failing_categories=failing_categories,
        warning_categories=warning_categories,
    )
```

- [ ] **Step 6: Re-run the benchmark test**

Run: `PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_benchmark_scaffolding.py -q`

Expected:
- FAIL now because the new suite / manifests are still missing
- but no longer fail on missing schema fields

- [ ] **Step 7: Commit the schema/runner slice**

```bash
git add backend/app/benchmarks/schemas.py \
  backend/app/benchmarks/runner.py \
  backend/tests/test_benchmark_scaffolding.py
git commit -m "feat: add generalist coverage summary"
```

---

### Task 2: Add Coverage Manifests And Coverage Suite

**Files:**
- Create: `/Users/oldtien_base/Desktop/Infinite Pro/backend/app/benchmarks/manifests/g1_stage_type_coverage.json`
- Create: `/Users/oldtien_base/Desktop/Infinite Pro/backend/app/benchmarks/manifests/g1_continuity_coverage.json`
- Create: `/Users/oldtien_base/Desktop/Infinite Pro/backend/app/benchmarks/manifests/g1_cross_domain_coverage.json`
- Create: `/Users/oldtien_base/Desktop/Infinite Pro/backend/app/benchmarks/suites/generalist_coverage_proof_v1.json`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/tests/test_benchmark_scaffolding.py`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/scripts/run_pack_benchmark_scaffold.py`

- [ ] **Step 1: Write the failing manifest/suite tests**

```python
def test_generalist_stage_type_manifest_covers_representative_seed_cases() -> None:
    manifest = load_manifest("backend/app/benchmarks/manifests/g1_stage_type_coverage.json")

    assert manifest.manifest_id == "g1_stage_type_coverage_baseline"
    assert len(manifest.cases) >= 4
    assert {"創業階段", "制度化階段", "規模化階段"} <= {case.client_stage for case in manifest.cases}
    assert {"中小企業", "大型企業", "個人品牌與服務", "自媒體"} <= {
        case.client_type for case in manifest.cases
    }
```

```python
def test_generalist_coverage_suite_manifest_covers_expected_categories() -> None:
    suite = load_suite("backend/app/benchmarks/suites/generalist_coverage_proof_v1.json")

    assert suite.suite_id == "generalist_coverage_proof_v1"
    assert [category.category_id for category in suite.categories] == [
        BenchmarkCategoryId.GENERALIST_STAGE_TYPE,
        BenchmarkCategoryId.GENERALIST_CONTINUITY,
        BenchmarkCategoryId.GENERALIST_CROSS_DOMAIN,
    ]
    assert {target.axis for target in suite.coverage_targets} == {
        BenchmarkCoverageAxis.CLIENT_STAGE,
        BenchmarkCoverageAxis.CLIENT_TYPE,
        BenchmarkCoverageAxis.CONTINUITY,
        BenchmarkCoverageAxis.CROSS_DOMAIN,
    }
```

- [ ] **Step 2: Run the benchmark test to verify it fails**

Run: `PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_benchmark_scaffolding.py -q`

Expected:
- FAIL because the new manifests / suite files do not exist yet

- [ ] **Step 3: Create stage/type coverage manifest**

```json
{
  "manifest_id": "g1_stage_type_coverage_baseline",
  "title": "G1 stage / type coverage baseline",
  "purpose": "Provide representative seed cases for client-stage and client-type coverage without turning the benchmark scaffold into a scoring platform.",
  "update_policy": [
    "Only update this manifest when shipped stage/type coverage scope changes.",
    "Prefer revising representative cases over inflating the matrix."
  ],
  "cases": [
    {
      "case_id": "startup_smb_research_reset",
      "title": "Startup SMB research reset",
      "description": "創業階段的中小企業，需要研究與市場判斷支撐。",
      "client_stage": "創業階段",
      "client_type": "中小企業",
      "engagement_continuity_mode": "one_off",
      "writeback_depth": "minimal",
      "coverage_bundle_id": "research_plus_domain_advisory",
      "domain_lenses": ["研究", "產品服務"],
      "industry_hints": ["saas"],
      "decision_context_summary": "Need a startup recommendation on early market signal quality, packaging focus, and whether to narrow scope before sales expansion.",
      "source_mix_summary": ["research note", "founder interview", "customer call summary"],
      "target_domain_pack_ids": ["research_intelligence_pack", "product_service_pack"],
      "target_industry_pack_ids": ["saas_pack"],
      "expected_contract_interface_ids": ["evidence_readiness_v1", "decision_framing_v1", "deliverable_shaping_v1"],
      "expected_hint_areas": ["evidence_expectations", "decision_patterns", "readiness"]
    },
    {
      "case_id": "institutional_smb_ops_reset",
      "title": "Institutional-stage SMB ops reset",
      "description": "制度化階段的中小企業，需要營運與組織補強。",
      "client_stage": "制度化階段",
      "client_type": "中小企業",
      "engagement_continuity_mode": "follow_up",
      "writeback_depth": "milestone",
      "coverage_bundle_id": "operations_plus_org_people",
      "domain_lenses": ["營運", "組織人力"],
      "industry_hints": [],
      "decision_context_summary": "Need an operations and org recommendation on owner gaps, handoff friction, and whether the current team can sustain the next operating step.",
      "source_mix_summary": ["handoff note", "org scope summary", "backlog report"],
      "target_domain_pack_ids": ["operations_pack", "organization_people_pack"],
      "target_industry_pack_ids": [],
      "expected_contract_interface_ids": ["evidence_readiness_v1", "decision_framing_v1", "deliverable_shaping_v1"],
      "expected_hint_areas": ["evidence_expectations", "decision_patterns", "readiness"]
    },
    {
      "case_id": "scaled_enterprise_finance_legal",
      "title": "Scaled enterprise finance/legal review",
      "description": "規模化階段的大型企業，需要 legal + finance contract-aware framing。",
      "client_stage": "規模化階段",
      "client_type": "大型企業",
      "engagement_continuity_mode": "continuous",
      "writeback_depth": "full",
      "coverage_bundle_id": "legal_plus_finance",
      "domain_lenses": ["法務", "財務"],
      "industry_hints": ["energy"],
      "decision_context_summary": "Need a scaled-enterprise review on covenant risk, approval obligations, and whether to prioritize portfolio discipline before scaling exposure.",
      "source_mix_summary": ["term sheet", "cash note", "obligation tracker"],
      "target_domain_pack_ids": ["legal_risk_pack", "finance_fundraising_pack"],
      "target_industry_pack_ids": ["energy_pack"],
      "expected_contract_interface_ids": ["evidence_readiness_v1", "decision_framing_v1", "deliverable_shaping_v1"],
      "expected_hint_areas": ["evidence_expectations", "decision_patterns", "readiness"]
    },
    {
      "case_id": "creator_service_growth_mix",
      "title": "Creator/service growth mix",
      "description": "個人品牌與服務類型，需要 marketing + product/service framing。",
      "client_stage": "制度化階段",
      "client_type": "個人品牌與服務",
      "engagement_continuity_mode": "follow_up",
      "writeback_depth": "milestone",
      "coverage_bundle_id": "marketing_sales_plus_product_service",
      "domain_lenses": ["行銷", "產品服務"],
      "industry_hints": ["online course"],
      "decision_context_summary": "Need a service-business recommendation on offer packaging, acquisition mix, and whether to simplify before scaling more traffic.",
      "source_mix_summary": ["offer catalog", "sales note", "audience conversion summary"],
      "target_domain_pack_ids": ["marketing_sales_pack", "product_service_pack"],
      "target_industry_pack_ids": ["online_education_pack"],
      "expected_contract_interface_ids": ["evidence_readiness_v1", "decision_framing_v1", "deliverable_shaping_v1"],
      "expected_hint_areas": ["evidence_expectations", "decision_patterns", "readiness"]
    },
    {
      "case_id": "media_creator_audience_dependency",
      "title": "Media creator audience dependency",
      "description": "自媒體類型，需要 research + marketing 代表 case。",
      "client_stage": "制度化階段",
      "client_type": "自媒體",
      "engagement_continuity_mode": "one_off",
      "writeback_depth": "minimal",
      "coverage_bundle_id": "research_plus_domain_advisory",
      "domain_lenses": ["研究", "行銷"],
      "industry_hints": ["creator"],
      "decision_context_summary": "Need a creator recommendation on revenue mix, audience dependence, and whether to rebalance owned audience before taking more sponsorship.",
      "source_mix_summary": ["audience report", "revenue mix note", "creator workload summary"],
      "target_domain_pack_ids": ["research_intelligence_pack", "marketing_sales_pack"],
      "target_industry_pack_ids": ["media_creator_pack"],
      "expected_contract_interface_ids": ["evidence_readiness_v1", "decision_framing_v1", "deliverable_shaping_v1"],
      "expected_hint_areas": ["evidence_expectations", "decision_patterns", "readiness"]
    }
  ]
}
```

- [ ] **Step 4: Create continuity coverage manifest**

```json
{
  "manifest_id": "g1_continuity_coverage_baseline",
  "title": "G1 continuity coverage baseline",
  "purpose": "Provide representative one-off, follow-up, and continuous cases for generalist continuity coverage proof.",
  "update_policy": [
    "Only update this manifest when shipped continuity coverage scope changes.",
    "Keep one representative case per major continuity lane before expanding."
  ],
  "cases": [
    {
      "case_id": "one_off_contract_review",
      "title": "One-off contract review",
      "description": "Closure-first one-off consultant case.",
      "client_stage": "制度化階段",
      "client_type": "中小企業",
      "engagement_continuity_mode": "one_off",
      "writeback_depth": "minimal",
      "coverage_bundle_id": "legal_plus_finance",
      "domain_lenses": ["法務", "財務"],
      "industry_hints": [],
      "decision_context_summary": "Need a one-off contract review that should not be mistaken for a continuous writeback case.",
      "source_mix_summary": ["agreement note", "approval email", "obligation summary"],
      "target_domain_pack_ids": ["legal_risk_pack", "finance_fundraising_pack"],
      "target_industry_pack_ids": [],
      "expected_contract_interface_ids": ["evidence_readiness_v1", "decision_framing_v1", "deliverable_shaping_v1"],
      "expected_hint_areas": ["evidence_expectations", "decision_patterns", "readiness"]
    },
    {
      "case_id": "follow_up_operating_checkpoint",
      "title": "Follow-up operating checkpoint",
      "description": "Checkpoint-oriented follow-up case.",
      "client_stage": "制度化階段",
      "client_type": "中小企業",
      "engagement_continuity_mode": "follow_up",
      "writeback_depth": "milestone",
      "coverage_bundle_id": "operations_plus_org_people",
      "domain_lenses": ["營運", "組織人力"],
      "industry_hints": [],
      "decision_context_summary": "Need a follow-up checkpoint case where milestone writeback matters but full outcome loops are not yet expected.",
      "source_mix_summary": ["checkpoint note", "handoff log", "next-step summary"],
      "target_domain_pack_ids": ["operations_pack", "organization_people_pack"],
      "target_industry_pack_ids": [],
      "expected_contract_interface_ids": ["evidence_readiness_v1", "decision_framing_v1", "deliverable_shaping_v1"],
      "expected_hint_areas": ["evidence_expectations", "decision_patterns", "readiness"]
    },
    {
      "case_id": "continuous_progression_case",
      "title": "Continuous progression case",
      "description": "Continuous case with full writeback expectations.",
      "client_stage": "規模化階段",
      "client_type": "大型企業",
      "engagement_continuity_mode": "continuous",
      "writeback_depth": "full",
      "coverage_bundle_id": "operations_plus_org_people",
      "domain_lenses": ["營運", "財務"],
      "industry_hints": ["manufacturing"],
      "decision_context_summary": "Need a continuous case where progression, action execution, and full writeback are part of the expected operating model.",
      "source_mix_summary": ["progression report", "capacity note", "execution review"],
      "target_domain_pack_ids": ["operations_pack", "finance_fundraising_pack"],
      "target_industry_pack_ids": ["manufacturing_pack"],
      "expected_contract_interface_ids": ["evidence_readiness_v1", "decision_framing_v1", "deliverable_shaping_v1"],
      "expected_hint_areas": ["evidence_expectations", "decision_patterns", "readiness"]
    }
  ]
}
```

- [ ] **Step 5: Create cross-domain coverage manifest**

```json
{
  "manifest_id": "g1_cross_domain_coverage_baseline",
  "title": "G1 cross-domain coverage baseline",
  "purpose": "Provide representative cross-domain bundles for generalist coverage proof without inflating the benchmark system into a full matrix platform.",
  "update_policy": [
    "Only update this manifest when shipped cross-domain coverage scope changes.",
    "Prefer a small set of high-signal representative bundles over a full combinatorial matrix."
  ],
  "cases": [
    {
      "case_id": "legal_finance_bundle",
      "title": "Legal + finance bundle",
      "description": "Contract and financing bundle representative case.",
      "client_stage": "制度化階段",
      "client_type": "中小企業",
      "engagement_continuity_mode": "one_off",
      "writeback_depth": "minimal",
      "coverage_bundle_id": "legal_plus_finance",
      "domain_lenses": ["法務", "財務"],
      "industry_hints": [],
      "decision_context_summary": "Need a contract and financing recommendation where legal and finance must both shape the answer.",
      "source_mix_summary": ["term sheet", "agreement note", "cash summary"],
      "target_domain_pack_ids": ["legal_risk_pack", "finance_fundraising_pack"],
      "target_industry_pack_ids": [],
      "expected_contract_interface_ids": ["evidence_readiness_v1", "decision_framing_v1", "deliverable_shaping_v1"],
      "expected_hint_areas": ["evidence_expectations", "decision_patterns", "readiness"]
    },
    {
      "case_id": "operations_org_people_bundle",
      "title": "Operations + org/people bundle",
      "description": "Cross-functional operating + org case.",
      "client_stage": "制度化階段",
      "client_type": "中小企業",
      "engagement_continuity_mode": "follow_up",
      "writeback_depth": "milestone",
      "coverage_bundle_id": "operations_plus_org_people",
      "domain_lenses": ["營運", "組織人力"],
      "industry_hints": [],
      "decision_context_summary": "Need an operating recommendation where owner gaps and org design affect process stability.",
      "source_mix_summary": ["owner map", "handoff report", "manager scope note"],
      "target_domain_pack_ids": ["operations_pack", "organization_people_pack"],
      "target_industry_pack_ids": [],
      "expected_contract_interface_ids": ["evidence_readiness_v1", "decision_framing_v1", "deliverable_shaping_v1"],
      "expected_hint_areas": ["evidence_expectations", "decision_patterns", "readiness"]
    },
    {
      "case_id": "marketing_product_bundle",
      "title": "Marketing/sales + product/service bundle",
      "description": "Demand and offer-shaping bundle representative case.",
      "client_stage": "制度化階段",
      "client_type": "個人品牌與服務",
      "engagement_continuity_mode": "follow_up",
      "writeback_depth": "milestone",
      "coverage_bundle_id": "marketing_sales_plus_product_service",
      "domain_lenses": ["行銷", "產品服務"],
      "industry_hints": ["online course"],
      "decision_context_summary": "Need a recommendation where offer architecture and demand quality must be solved together.",
      "source_mix_summary": ["offer map", "campaign note", "customer confusion summary"],
      "target_domain_pack_ids": ["marketing_sales_pack", "product_service_pack"],
      "target_industry_pack_ids": ["online_education_pack"],
      "expected_contract_interface_ids": ["evidence_readiness_v1", "decision_framing_v1", "deliverable_shaping_v1"],
      "expected_hint_areas": ["evidence_expectations", "decision_patterns", "readiness"]
    },
    {
      "case_id": "research_domain_bundle",
      "title": "Research + domain advisory bundle",
      "description": "Research-led but still domain-specific representative case.",
      "client_stage": "創業階段",
      "client_type": "中小企業",
      "engagement_continuity_mode": "one_off",
      "writeback_depth": "minimal",
      "coverage_bundle_id": "research_plus_domain_advisory",
      "domain_lenses": ["研究", "營運"],
      "industry_hints": ["saas"],
      "decision_context_summary": "Need a recommendation where research uncertainty and domain actionability both matter.",
      "source_mix_summary": ["research note", "market summary", "operator interview"],
      "target_domain_pack_ids": ["research_intelligence_pack", "operations_pack"],
      "target_industry_pack_ids": ["saas_pack"],
      "expected_contract_interface_ids": ["evidence_readiness_v1", "decision_framing_v1", "deliverable_shaping_v1"],
      "expected_hint_areas": ["evidence_expectations", "decision_patterns", "readiness"]
    }
  ]
}
```

- [ ] **Step 6: Create the coverage suite**

```json
{
  "suite_id": "generalist_coverage_proof_v1",
  "title": "Generalist coverage proof v1",
  "purpose": "Provide a repeatable advisory-first baseline for client-stage, client-type, continuity, and cross-domain representative coverage without turning benchmark scaffolding into a new product layer.",
  "update_policy": [
    "Only update this suite when shipped generalist coverage scope changes.",
    "Keep coverage proof separate from hardening regression suites.",
    "Prefer advisory-first coverage reporting before introducing hard fail gates."
  ],
  "coverage_targets": [
    {
      "axis": "client_stage",
      "expected_values": ["創業階段", "制度化階段", "規模化階段"],
      "thin_threshold": 1
    },
    {
      "axis": "client_type",
      "expected_values": ["中小企業", "大型企業", "個人品牌與服務", "自媒體"],
      "thin_threshold": 1
    },
    {
      "axis": "continuity",
      "expected_values": ["one_off", "follow_up", "continuous"],
      "thin_threshold": 1
    },
    {
      "axis": "cross_domain",
      "expected_values": [
        "legal_plus_finance",
        "operations_plus_org_people",
        "marketing_sales_plus_product_service",
        "research_plus_domain_advisory"
      ],
      "thin_threshold": 1
    }
  ],
  "categories": [
    {
      "category_id": "generalist_stage_type",
      "title": "Stage / type coverage",
      "manifest_path": "backend/app/benchmarks/manifests/g1_stage_type_coverage.json",
      "gate_mode": "advisory",
      "purpose": "Answer whether stage and type coverage is still biased toward a narrow operating band."
    },
    {
      "category_id": "generalist_continuity",
      "title": "Continuity coverage",
      "manifest_path": "backend/app/benchmarks/manifests/g1_continuity_coverage.json",
      "gate_mode": "advisory",
      "purpose": "Answer whether one-off, follow-up, and continuous lanes all have representative benchmark coverage."
    },
    {
      "category_id": "generalist_cross_domain",
      "title": "Cross-domain representative coverage",
      "manifest_path": "backend/app/benchmarks/manifests/g1_cross_domain_coverage.json",
      "gate_mode": "advisory",
      "purpose": "Answer whether key cross-domain consultant bundles have representative benchmark cases."
    }
  ]
}
```

- [ ] **Step 7: Add a small CLI convenience alias**

```python
parser.add_argument(
    "--suite",
    choices=["full", "coverage"],
    default=None,
    help="Run a named benchmark suite instead of a single manifest.",
)
```

```python
if args.suite == "coverage":
    suite = load_suite("backend/app/benchmarks/suites/generalist_coverage_proof_v1.json")
    result = run_suite(suite)
    print(json.dumps(result.model_dump(mode="json"), ensure_ascii=False, indent=2))
    return 0
```

- [ ] **Step 8: Re-run the benchmark test**

Run: `PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_benchmark_scaffolding.py -q`

Expected:
- PASS

- [ ] **Step 9: Commit the manifest/suite slice**

```bash
git add backend/app/benchmarks/manifests/g1_stage_type_coverage.json \
  backend/app/benchmarks/manifests/g1_continuity_coverage.json \
  backend/app/benchmarks/manifests/g1_cross_domain_coverage.json \
  backend/app/benchmarks/suites/generalist_coverage_proof_v1.json \
  backend/scripts/run_pack_benchmark_scaffold.py \
  backend/tests/test_benchmark_scaffolding.py
git commit -m "feat: add generalist coverage suite"
```

---

### Task 3: Docs, QA Evidence, And Full Verification

**Files:**
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/05_benchmark_and_regression.md`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/06_product_alignment_and_85_point_roadmap.md`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/04_qa_matrix.md`

- [ ] **Step 1: Update the benchmark/regression doc**

```md
### 3.3 Generalist coverage proof baseline

- `generalist_coverage_proof_v1` 與既有 `p0_full_regression_suite` 分工不同
- `p0_full_regression_suite` 仍是 hardening regression
- `generalist_coverage_proof_v1` 現在開始回答：
  - client stage coverage
  - client type coverage
  - continuity coverage
  - cross-domain representative coverage
- 第一版 gate posture 採 advisory-first，不做 hard fail platform
```

- [ ] **Step 2: Update the roadmap doc**

```md
- `7.3` 的第一刀現在也已開始正式落地：
  - 新增專屬 coverage-proof manifest/suite family
  - suite run result 現在可正式回讀 covered / thin / missing coverage
  - 但這一刀仍只是 proof baseline，不是大型 benchmark platform
```

- [ ] **Step 3: Run the full verification set**

Run:
- `PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_benchmark_scaffolding.py -q`
- `PYTHONPATH=backend .venv312/bin/python backend/scripts/run_pack_benchmark_scaffold.py --suite coverage`

Expected:
- benchmark scaffold pytest PASS
- coverage suite CLI run PASS with JSON output including `coverage_summary`

- [ ] **Step 4: Append QA matrix only after the real runs pass**

```md
## Entry: 2026-04-09 generalist coverage proof baseline v1

- Scope:
  - add a dedicated coverage-proof suite family
  - keep hardening regression and coverage proof explicitly separated
- Verification:
  - `PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_benchmark_scaffolding.py -q`
  - `PYTHONPATH=backend .venv312/bin/python backend/scripts/run_pack_benchmark_scaffold.py --suite coverage`
```

- [ ] **Step 5: Commit docs / QA alignment and push**

```bash
git add docs/05_benchmark_and_regression.md \
  docs/06_product_alignment_and_85_point_roadmap.md \
  docs/04_qa_matrix.md
git commit -m "docs: align generalist coverage proof"
git push origin codex/docs06-roadmap
```

---

### Self-Review

- [ ] Spec coverage: this plan only implements `generalist coverage proof v1`, not a full benchmark platform
- [ ] Placeholder scan: no `TODO`, `TBD`, or vague “handle edge cases” wording remains
- [ ] Type consistency: coverage metadata fields and suite coverage summary schema match across schemas, runner, manifests, and tests
- [ ] Scope safety: hardening regression and coverage proof remain separate suites
- [ ] Product safety: no task introduces dashboard UI, judge loops, or a weighted consultant score wall
