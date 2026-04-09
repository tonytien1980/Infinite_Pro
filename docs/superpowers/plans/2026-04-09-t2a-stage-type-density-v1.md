# T2-A Stage/Type Density V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deepen `T2-A Coverage density and proof deepen` by patching the thinnest `stage/type` lane in `generalist_coverage_proof_v1`, so `自媒體` is no longer represented by a single case and the stage/type proof becomes more credible without expanding into a full matrix platform.

**Architecture:** Keep the existing `generalist_coverage_proof_v1` suite, schema, runner, and CLI intact. Only extend `backend/app/benchmarks/manifests/g1_stage_type_coverage.json` with two additional self-media representative cases, then update the benchmark tests and the active docs (`docs/05`, `docs/06`, `docs/04`) to match the new verified posture.

**Tech Stack:** JSON manifests, Python pytest, Markdown docs, git

---

### Task 1: Patch the stage/type manifest with two self-media representative cases

**Files:**
- Modify: `backend/app/benchmarks/manifests/g1_stage_type_coverage.json`

- [ ] **Step 1: Add a startup-stage self-media representative case**

Insert this case object immediately after the existing `media_creator_audience_dependency` case, keeping valid JSON commas:

```json
{
  "case_id": "startup_media_creator_offer_reset",
  "title": "Startup media creator offer reset",
  "description": "創業階段的自媒體，需要 research + product/service framing 來決定先收斂哪種內容與服務組合。",
  "client_stage": "創業階段",
  "client_type": "自媒體",
  "engagement_continuity_mode": "one_off",
  "writeback_depth": "minimal",
  "coverage_bundle_id": "research_plus_domain_advisory",
  "domain_lenses": ["研究", "產品服務"],
  "industry_hints": ["creator"],
  "decision_context_summary": "Need a startup creator recommendation on whether to narrow the current content-plus-service mix before scaling more channels or sponsors.",
  "source_mix_summary": ["content performance note", "audience question log", "offer draft"],
  "target_domain_pack_ids": ["research_intelligence_pack", "product_service_pack"],
  "target_industry_pack_ids": ["media_creator_pack"],
  "expected_contract_interface_ids": ["evidence_readiness_v1", "decision_framing_v1", "deliverable_shaping_v1"],
  "expected_hint_areas": ["evidence_expectations", "decision_patterns", "readiness"]
}
```

- [ ] **Step 2: Add a scaled-stage self-media representative case**

Insert this second case immediately after the startup self-media case:

```json
{
  "case_id": "scaled_media_creator_revenue_mix_reset",
  "title": "Scaled media creator revenue-mix reset",
  "description": "規模化階段的自媒體，需要 marketing + product/service framing 來重整多收入線組合。",
  "client_stage": "規模化階段",
  "client_type": "自媒體",
  "engagement_continuity_mode": "continuous",
  "writeback_depth": "full",
  "coverage_bundle_id": "marketing_sales_plus_product_service",
  "domain_lenses": ["行銷", "產品服務"],
  "industry_hints": ["creator"],
  "decision_context_summary": "Need a scaled creator recommendation on sponsor dependence, owned audience leverage, and whether to rebalance productized revenue before further expansion.",
  "source_mix_summary": ["revenue mix review", "sponsor dependence note", "audience retention summary"],
  "target_domain_pack_ids": ["marketing_sales_pack", "product_service_pack"],
  "target_industry_pack_ids": ["media_creator_pack"],
  "expected_contract_interface_ids": ["evidence_readiness_v1", "decision_framing_v1", "deliverable_shaping_v1"],
  "expected_hint_areas": ["evidence_expectations", "decision_patterns", "readiness"]
}
```

- [ ] **Step 3: Check the manifest is valid JSON and has 7 cases**

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
g1_stage_type_coverage_baseline 7
```

- [ ] **Step 4: Commit the manifest change**

Run:

```bash
git add backend/app/benchmarks/manifests/g1_stage_type_coverage.json
git commit -m "feat: deepen t2a stage type coverage"
```

Expected:

- commit succeeds with only the manifest change staged

### Task 2: Tighten benchmark tests around the new density posture

**Files:**
- Modify: `backend/tests/test_benchmark_scaffolding.py`

- [ ] **Step 1: Strengthen the stage/type manifest test**

Replace `test_generalist_stage_type_manifest_covers_representative_seed_cases()` with:

```python
def test_generalist_stage_type_manifest_covers_representative_seed_cases() -> None:
    manifest = load_manifest("backend/app/benchmarks/manifests/g1_stage_type_coverage.json")

    assert manifest.manifest_id == "g1_stage_type_coverage_baseline"
    assert len(manifest.cases) == 7
    assert {"創業階段", "制度化階段", "規模化階段"} <= {case.client_stage for case in manifest.cases}
    assert {"中小企業", "大型企業", "個人品牌與服務", "自媒體"} <= {
        case.client_type for case in manifest.cases
    }
    assert sum(case.client_type == "自媒體" for case in manifest.cases) == 3
    assert sum(case.client_stage == "創業階段" for case in manifest.cases) == 2
    assert sum(case.client_stage == "規模化階段" for case in manifest.cases) == 2
```

- [ ] **Step 2: Strengthen the suite coverage-summary test**

Update `test_generalist_coverage_suite_returns_coverage_summary()` to this version:

```python
def test_generalist_coverage_suite_returns_coverage_summary() -> None:
    suite = load_suite("backend/app/benchmarks/suites/generalist_coverage_proof_v1.json")
    result = run_suite(suite)

    assert result.gate_status == BenchmarkStatus.PASS
    assert result.total_case_count == 14
    assert len(result.category_results) == 3
    assert result.coverage_summary
    stage_summary = next(item for item in result.coverage_summary if item.axis == "client_stage")
    type_summary = next(item for item in result.coverage_summary if item.axis == "client_type")
    continuity_summary = next(item for item in result.coverage_summary if item.axis == "continuity")
    cross_domain_summary = next(item for item in result.coverage_summary if item.axis == "cross_domain")

    assert "創業階段" in stage_summary.expected_values
    assert stage_summary.counts["創業階段"] == 3
    assert stage_summary.counts["規模化階段"] == 3

    assert "自媒體" in type_summary.expected_values
    assert type_summary.counts["自媒體"] == 3
    assert "自媒體" not in type_summary.thin_values
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
git commit -m "test: tighten t2a stage type coverage expectations"
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
  - `"suite_id": "generalist_coverage_proof_v1"`
  - `"total_case_count": 14`
  - `client_type.counts.自媒體 = 3`
  - `client_type.thin_values` no longer includes `自媒體`

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
  - `client_type_counts` with `自媒體: 3`
  - `client_stage_counts` with `創業階段: 3` and `規模化階段: 3`
- printed thin lists do not include `自媒體`

### Task 4: Sync active docs to the shipped density change

**Files:**
- Modify: `docs/05_benchmark_and_regression.md`
- Modify: `docs/06_product_alignment_and_85_point_roadmap.md`
- Modify: `docs/04_qa_matrix.md`

- [ ] **Step 1: Update `docs/05` benchmark baseline wording**

Add this paragraph immediately after the existing `7.3` first-slice coverage-proof baseline block in `docs/05_benchmark_and_regression.md`:

```md
`T2-A` 第一刀之後，`g1_stage_type_coverage` 已從 existence baseline 往 density baseline 推進：
- 補上兩個 `自媒體` representative cases
- 讓 `自媒體` 不再只是單點 thin lane
- 同時微幅改善 `創業階段 / 規模化階段` 相對於 `制度化階段` 的不對稱

正式規則仍維持：
- 這一刀是 density patch，不是 full matrix expansion
- continuity 與 cross-domain density 留待後續 slices
```

- [ ] **Step 2: Update `docs/06` T2-A progress**

Under `### 11.1 T2-A Coverage density and proof deepen` in `docs/06_product_alignment_and_85_point_roadmap.md`, append:

```md
目前進度：

- 第一刀已正式落地成 `stage/type density v1`
- `g1_stage_type_coverage` 已補上兩個 `自媒體` representative cases
- `generalist_coverage_proof_v1` 的 `client_type=self_media` 不再只靠單點代表
- `創業階段 / 規模化階段` 的 suite-level counts 也較 baseline 略為改善
- 但 continuity density 與 cross-domain density 仍未進入這一刀
```

- [ ] **Step 3: Append a new `docs/04` QA entry**

Add a new QA matrix entry immediately after `## Entry: 2026-04-09 generalist coverage proof baseline v1` and its `Explicitly not shipped` list:

```md
## Entry: 2026-04-09 T2-A stage/type density v1

Scope:
- start `T2-A` with a narrow stage/type density patch
- deepen `g1_stage_type_coverage` without introducing a new suite family
- remove the single-case `自媒體` thin-lane posture from live coverage-proof output

Environment used:
- local backend verification only

### Build / Typecheck / Compile

| Check | Result |
| --- | --- |
| `PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_benchmark_scaffolding.py -q` | Passed (`22 passed`) |
| `PYTHONPATH=backend .venv312/bin/python backend/scripts/run_pack_benchmark_scaffold.py --suite coverage` | Passed |

### T2-A stage/type density verification

| Area | Page / Flow | Action | Status | Notes |
| --- | --- | --- | --- | --- |
| Backend | `backend/app/benchmarks/manifests/g1_stage_type_coverage.json` | Add two new `自媒體` representative cases across startup and scaled stages | Verified | stage/type manifest now carries `7` cases instead of `5` without creating a new suite family |
| Backend | `backend/tests/test_benchmark_scaffolding.py` | Tighten manifest and suite-level count expectations around self-media density | Verified | pytest now asserts `自媒體 = 3`, while `創業階段` and `規模化階段` each rise to `3` at suite level |
| CLI | `backend/scripts/run_pack_benchmark_scaffold.py --suite coverage` | Re-run live coverage suite after the density patch | Verified | live output now returns `total_case_count = 14` and no longer flags `自媒體` as a thin client-type lane |
| Coverage posture | stage/type density readout | Confirm the suite still stays advisory-first while becoming less thin | Verified | no missing values were introduced, and the pass remains a density deepen rather than a hard-gate expansion |

### Explicitly not shipped in this pass

- continuity density deepen
- cross-domain density deepen
- weighted score wall
- new benchmark suite family
```

- [ ] **Step 4: Commit the docs update**

Run:

```bash
git add docs/05_benchmark_and_regression.md docs/06_product_alignment_and_85_point_roadmap.md docs/04_qa_matrix.md
git commit -m "docs: align t2a stage type density"
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
  docs/superpowers/specs/2026-04-09-t2a-stage-type-density-v1-design.md \
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
