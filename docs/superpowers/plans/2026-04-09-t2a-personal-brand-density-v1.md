# T2-A Personal-Brand Density V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deepen `T2-A Coverage density and proof deepen` by spreading `個人品牌與服務` across startup and scaled stages, so `generalist_coverage_proof_v1` no longer treats that client type as a制度化-only lane while keeping the benchmark system advisory-first and lightweight.

**Architecture:** Extend only `backend/app/benchmarks/manifests/g1_stage_type_coverage.json` with two personal-brand/service representative cases that use pack combinations already shown to resolve cleanly. Then tighten the benchmark tests and sync the active docs (`docs/05`, `docs/06`, `docs/04`) to the new verified density posture.

**Tech Stack:** JSON manifests, Python pytest, Markdown docs, git

---

### Task 1: Add two personal-brand/service representative cases to the stage/type manifest

**Files:**
- Modify: `backend/app/benchmarks/manifests/g1_stage_type_coverage.json`

- [ ] **Step 1: Add a startup personal-brand/service case**

Insert this case immediately after `creator_service_growth_mix`:

```json
{
  "case_id": "startup_personal_brand_service_focus",
  "title": "Startup personal-brand service focus",
  "description": "創業階段的個人品牌與服務，需要 professional-services framing 來收斂 hero offer、報價與商務轉換方式。",
  "client_stage": "創業階段",
  "client_type": "個人品牌與服務",
  "engagement_continuity_mode": "one_off",
  "writeback_depth": "minimal",
  "coverage_bundle_id": "marketing_sales_plus_product_service",
  "domain_lenses": ["產品服務", "商務開發"],
  "industry_hints": ["consulting", "retainer", "service package", "offer"],
  "decision_context_summary": "Need a startup personal-brand services recommendation on narrowing the hero offer, clarifying packaging, and deciding whether to simplify lead capture before hiring delivery support.",
  "source_mix_summary": ["offer draft", "proposal notes", "lead-quality summary"],
  "target_domain_pack_ids": ["product_service_pack", "business_development_pack"],
  "target_industry_pack_ids": ["professional_services_pack"],
  "expected_contract_interface_ids": ["evidence_readiness_v1", "decision_framing_v1", "deliverable_shaping_v1"],
  "expected_hint_areas": ["evidence_expectations", "decision_patterns", "readiness"]
}
```

- [ ] **Step 2: Add a scaled personal-brand/service case**

Insert this case immediately after the startup personal-brand/service case:

```json
{
  "case_id": "scaled_personal_brand_learning_mix",
  "title": "Scaled personal-brand learning mix",
  "description": "規模化階段的個人品牌與服務，需要 online-education framing 來重整課程、服務與交付節奏。",
  "client_stage": "規模化階段",
  "client_type": "個人品牌與服務",
  "engagement_continuity_mode": "continuous",
  "writeback_depth": "full",
  "coverage_bundle_id": "marketing_sales_plus_product_service",
  "domain_lenses": ["行銷", "營運"],
  "industry_hints": ["online course", "cohort", "completion", "refund"],
  "decision_context_summary": "Need a scaled personal-brand education recommendation on course portfolio sprawl, completion risk, and whether to simplify delivery before scaling enrollment again.",
  "source_mix_summary": ["enrollment funnel summary", "completion and refund report", "delivery capacity notes"],
  "target_domain_pack_ids": ["marketing_sales_pack", "operations_pack"],
  "target_industry_pack_ids": ["online_education_pack"],
  "expected_contract_interface_ids": ["evidence_readiness_v1", "decision_framing_v1", "deliverable_shaping_v1"],
  "expected_hint_areas": ["evidence_expectations", "decision_patterns", "readiness"]
}
```

- [ ] **Step 3: Verify the manifest is valid and now has 9 cases**

Run:

```bash
python3 - <<'PY'
import json
from pathlib import Path
path = Path("backend/app/benchmarks/manifests/g1_stage_type_coverage.json")
data = json.loads(path.read_text())
print(data["manifest_id"], len(data["cases"]))
PY
```

Expected:

```text
g1_stage_type_coverage_baseline 9
```

- [ ] **Step 4: Commit the manifest update**

Run:

```bash
git add backend/app/benchmarks/manifests/g1_stage_type_coverage.json
git commit -m "feat: deepen t2a personal brand coverage"
```

Expected:

- commit succeeds with only the manifest change staged

### Task 2: Tighten benchmark tests around personal-brand/service density

**Files:**
- Modify: `backend/tests/test_benchmark_scaffolding.py`

- [ ] **Step 1: Update the manifest-level test**

Replace `test_generalist_stage_type_manifest_covers_representative_seed_cases()` with:

```python
def test_generalist_stage_type_manifest_covers_representative_seed_cases() -> None:
    manifest = load_manifest("backend/app/benchmarks/manifests/g1_stage_type_coverage.json")

    assert manifest.manifest_id == "g1_stage_type_coverage_baseline"
    assert len(manifest.cases) == 9
    assert {"創業階段", "制度化階段", "規模化階段"} <= {case.client_stage for case in manifest.cases}
    assert {"中小企業", "大型企業", "個人品牌與服務", "自媒體"} <= {
        case.client_type for case in manifest.cases
    }
    assert sum(case.client_type == "自媒體" for case in manifest.cases) == 3
    assert sum(case.client_type == "個人品牌與服務" for case in manifest.cases) == 4
    assert sum(case.client_stage == "創業階段" for case in manifest.cases) == 4
    assert sum(case.client_stage == "規模化階段" for case in manifest.cases) == 4
```

- [ ] **Step 2: Update the suite summary test**

Replace `test_generalist_coverage_suite_returns_coverage_summary()` with:

```python
def test_generalist_coverage_suite_returns_coverage_summary() -> None:
    suite = load_suite("backend/app/benchmarks/suites/generalist_coverage_proof_v1.json")
    result = run_suite(suite)

    assert result.gate_status == BenchmarkStatus.PASS
    assert result.total_case_count == 16
    assert len(result.category_results) == 3
    assert result.coverage_summary
    stage_summary = next(item for item in result.coverage_summary if item.axis == "client_stage")
    type_summary = next(item for item in result.coverage_summary if item.axis == "client_type")
    continuity_summary = next(item for item in result.coverage_summary if item.axis == "continuity")
    cross_domain_summary = next(item for item in result.coverage_summary if item.axis == "cross_domain")

    assert "創業階段" in stage_summary.expected_values
    assert stage_summary.counts["創業階段"] == 4
    assert stage_summary.counts["規模化階段"] == 4

    assert "個人品牌與服務" in type_summary.expected_values
    assert type_summary.counts["個人品牌與服務"] == 4
    assert type_summary.counts["自媒體"] == 3
    assert "個人品牌與服務" not in type_summary.thin_values
    assert not type_summary.missing_values

    assert "one_off" in continuity_summary.expected_values
    assert "research_plus_domain_advisory" in cross_domain_summary.expected_values
    assert not stage_summary.missing_values
    assert not continuity_summary.missing_values
    assert not cross_domain_summary.missing_values
```

- [ ] **Step 3: Run the targeted benchmark tests**

Run:

```bash
PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_benchmark_scaffolding.py -q
```

Expected:

```text
22 passed
```

- [ ] **Step 4: Commit the test update**

Run:

```bash
git add backend/tests/test_benchmark_scaffolding.py
git commit -m "test: tighten t2a personal brand coverage expectations"
```

Expected:

- commit succeeds with only the test change staged

### Task 3: Verify the live coverage-proof posture

**Files:**
- Verify: `backend/app/benchmarks/manifests/g1_stage_type_coverage.json`
- Verify: `backend/scripts/run_pack_benchmark_scaffold.py`

- [ ] **Step 1: Run the coverage suite CLI**

Run:

```bash
PYTHONPATH=backend .venv312/bin/python backend/scripts/run_pack_benchmark_scaffold.py --suite coverage
```

Expected:

- exit code `0`
- JSON output includes:
  - `"gate_status": "pass"`
  - `"total_case_count": 16`
  - `client_type.counts.個人品牌與服務 = 4`
  - `client_type.thin_values` still empty

- [ ] **Step 2: Capture the exact posture for docs**

Run:

```bash
PYTHONPATH=backend .venv312/bin/python - <<'PY'
import json
import subprocess

completed = subprocess.run(
    [
        ".venv312/bin/python",
        "backend/scripts/run_pack_benchmark_scaffold.py",
        "--suite",
        "coverage",
    ],
    check=True,
    capture_output=True,
    text=True,
)
payload = json.loads(completed.stdout)
for item in payload["coverage_summary"]:
    if item["axis"] == "client_type":
        print("client_type_counts", item["counts"])
        print("client_type_thin", item["thin_values"])
    if item["axis"] == "client_stage":
        print("client_stage_counts", item["counts"])
        print("client_stage_thin", item["thin_values"])
PY
```

Expected:

- printed counts show:
  - `client_type_counts` with `個人品牌與服務: 4`
  - `client_stage_counts` with `創業階段: 4` and `規模化階段: 4`
- printed thin lists remain empty

### Task 4: Sync active docs to the shipped density change

**Files:**
- Modify: `docs/05_benchmark_and_regression.md`
- Modify: `docs/06_product_alignment_and_85_point_roadmap.md`
- Modify: `docs/04_qa_matrix.md`

- [ ] **Step 1: Update `docs/05`**

Append this paragraph after the existing `T2-A` first-slice density paragraph in `docs/05_benchmark_and_regression.md`:

```md
`T2-A` 第二刀之後，`個人品牌與服務` 也從 stage-concentrated baseline 往跨 stage density 推進：
- 補上 `創業階段 + 個人品牌與服務`
- 補上 `規模化階段 + 個人品牌與服務`
- 讓 `個人品牌與服務` 不再幾乎只被制度化階段代表

正式規則仍維持：
- 這一刀仍是 density patch，不是 pair-level summary platform
- 大型企業 density、continuity density 與 cross-domain density 仍留待後續 slices
```

- [ ] **Step 2: Update `docs/06` T2-A progress**

Append this under the existing `目前進度` block in `### 11.1 T2-A Coverage density and proof deepen`:

```md
- 第二刀也已正式落地成 `personal-brand density v1`
- `個人品牌與服務` 現在已不再只由制度化階段代表
- `創業階段 + 個人品牌與服務` 與 `規模化階段 + 個人品牌與服務` 都已有正式 seed cases
```

- [ ] **Step 3: Add a new `docs/04` QA entry**

Append this new entry immediately after the existing `## Entry: 2026-04-09 T2-A stage/type density v1` section:

```md
## Entry: 2026-04-09 T2-A personal-brand density v1

Scope:
- deepen `T2-A` by spreading `個人品牌與服務` across startup and scaled stages
- keep the same `generalist_coverage_proof_v1` suite instead of introducing a pair-level summary platform
- make personal-brand/service coverage look less制度化-only

Environment used:
- local backend verification only

### Build / Typecheck / Compile

| Check | Result |
| --- | --- |
| `PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_benchmark_scaffolding.py -q` | Passed (`22 passed`) |
| `PYTHONPATH=backend .venv312/bin/python backend/scripts/run_pack_benchmark_scaffold.py --suite coverage` | Passed |

### T2-A personal-brand density verification

| Area | Page / Flow | Action | Status | Notes |
| --- | --- | --- | --- | --- |
| Backend | `backend/app/benchmarks/manifests/g1_stage_type_coverage.json` | Add startup and scaled `個人品牌與服務` representative cases | Verified | stage/type manifest now carries `9` cases, and personal-brand/service no longer stays制度化-only |
| Backend | `backend/tests/test_benchmark_scaffolding.py` | Tighten manifest and suite-level count expectations around personal-brand/service density | Verified | pytest now asserts `個人品牌與服務 = 4`, `創業階段 = 4`, and `規模化階段 = 4` |
| CLI | `backend/scripts/run_pack_benchmark_scaffold.py --suite coverage` | Re-run live coverage suite after the density patch | Verified | live output now returns `total_case_count = 16` and keeps `client_type.thin_values = []` |
| Coverage posture | personal-brand/service stage spread | Confirm the suite stays advisory-first while making `個人品牌與服務` less stage-concentrated | Verified | `個人品牌與服務` now spans startup,制度化, and scaled stages without adding a new suite family or pair-level score wall |

### Explicitly not shipped in this pass

- large-enterprise density deepen
- continuity density deepen
- cross-domain density deepen
- pair-level summary schema
```

- [ ] **Step 4: Commit the docs update**

Run:

```bash
git add docs/05_benchmark_and_regression.md docs/06_product_alignment_and_85_point_roadmap.md docs/04_qa_matrix.md
git commit -m "docs: align t2a personal brand density"
```

Expected:

- commit succeeds with the three doc updates staged

### Task 5: Final verification and sync

**Files:**
- Verify: `backend/app/benchmarks/manifests/g1_stage_type_coverage.json`
- Verify: `backend/tests/test_benchmark_scaffolding.py`
- Verify: `docs/05_benchmark_and_regression.md`
- Verify: `docs/06_product_alignment_and_85_point_roadmap.md`
- Verify: `docs/04_qa_matrix.md`

- [ ] **Step 1: Run placeholder scans**

Run:

```bash
rg -n "TBD|TODO|FIXME" \
  docs/superpowers/specs/2026-04-09-t2a-personal-brand-density-v1-design.md \
  docs/05_benchmark_and_regression.md \
  docs/06_product_alignment_and_85_point_roadmap.md \
  docs/04_qa_matrix.md
```

Expected:

- no output

- [ ] **Step 2: Check diff integrity**

Run:

```bash
git diff --check
```

Expected:

- no output

- [ ] **Step 3: Review git state**

Run:

```bash
git status -sb
```

Expected:

- branch is only ahead with the intended manifest, tests, and doc files

- [ ] **Step 4: Push all commits**

Run:

```bash
git push
```

Expected:

- remote branch updates
- local and GitHub remain aligned
