# T2-A Continuity Density V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deepen `T2-A Coverage density and proof deepen` by adding follow-up and continuous lane diversity to `generalist_coverage_proof_v1`, so continuity proof is no longer anchored by only one representative case per lane.

**Architecture:** Keep the existing `generalist_coverage_proof_v1` suite, schema, runner, and CLI intact. Only extend `backend/app/benchmarks/manifests/g1_continuity_coverage.json` with one new follow-up case and one new continuous case that use pack combinations already validated against the resolver, then tighten the benchmark tests and sync the active docs (`docs/05`, `docs/06`, `docs/04`) to the new verified continuity posture.

**Tech Stack:** JSON manifests, Python pytest, Markdown docs, git

---

### Task 1: Add two continuity diversity cases to the continuity manifest

**Files:**
- Modify: `backend/app/benchmarks/manifests/g1_continuity_coverage.json`

- [ ] **Step 1: Add a follow-up personal-brand checkpoint case**

Insert this case immediately after `follow_up_operating_checkpoint`:

```json
{
  "case_id": "follow_up_personal_brand_checkpoint",
  "title": "Follow-up personal-brand checkpoint",
  "description": "個人品牌與服務的 follow-up checkpoint case。",
  "client_stage": "制度化階段",
  "client_type": "個人品牌與服務",
  "engagement_continuity_mode": "follow_up",
  "writeback_depth": "milestone",
  "coverage_bundle_id": "marketing_sales_plus_product_service",
  "domain_lenses": ["行銷", "產品服務"],
  "industry_hints": ["online course", "service package", "offer"],
  "decision_context_summary": "Need a follow-up personal-brand checkpoint on whether the current offer ladder, acquisition mix, and delivery scope should be tightened before the next enrollment push.",
  "source_mix_summary": ["checkpoint note", "offer revision summary", "lead-quality update"],
  "target_domain_pack_ids": ["product_service_pack", "marketing_sales_pack"],
  "target_industry_pack_ids": ["online_education_pack"],
  "expected_contract_interface_ids": ["evidence_readiness_v1", "decision_framing_v1", "deliverable_shaping_v1"],
  "expected_hint_areas": ["evidence_expectations", "decision_patterns", "readiness"]
}
```

- [ ] **Step 2: Add a continuous creator operations case**

Insert this case immediately after `continuous_progression_case`:

```json
{
  "case_id": "continuous_creator_operating_case",
  "title": "Continuous creator operating case",
  "description": "自媒體型 continuous case with full writeback expectations.",
  "client_stage": "規模化階段",
  "client_type": "自媒體",
  "engagement_continuity_mode": "continuous",
  "writeback_depth": "full",
  "coverage_bundle_id": "marketing_sales_plus_product_service",
  "domain_lenses": ["營運", "行銷"],
  "industry_hints": ["creator", "membership", "content cadence", "sponsor"],
  "decision_context_summary": "Need a continuous creator operating recommendation on sponsor load, content cadence, and whether the current delivery model can support another growth push without breaking quality.",
  "source_mix_summary": ["operating cadence note", "sponsor pipeline summary", "delivery capacity review"],
  "target_domain_pack_ids": ["operations_pack", "marketing_sales_pack"],
  "target_industry_pack_ids": ["media_creator_pack"],
  "expected_contract_interface_ids": ["evidence_readiness_v1", "decision_framing_v1", "deliverable_shaping_v1"],
  "expected_hint_areas": ["evidence_expectations", "decision_patterns", "readiness"]
}
```

- [ ] **Step 3: Verify the manifest is valid and now has 5 cases**

Run:

```bash
python3 - <<'PY'
import json
from pathlib import Path
path = Path("backend/app/benchmarks/manifests/g1_continuity_coverage.json")
data = json.loads(path.read_text())
print(data["manifest_id"], len(data["cases"]))
PY
```

Expected:

```text
g1_continuity_coverage_baseline 5
```

- [ ] **Step 4: Commit the manifest update**

Run:

```bash
git add backend/app/benchmarks/manifests/g1_continuity_coverage.json
git commit -m "feat: deepen t2a continuity coverage"
```

Expected:

- commit succeeds with only the manifest change staged

### Task 2: Tighten benchmark tests around continuity density

**Files:**
- Modify: `backend/tests/test_benchmark_scaffolding.py`

- [ ] **Step 1: Update the continuity manifest test**

Replace `test_generalist_continuity_manifest_covers_expected_lanes()` with:

```python
def test_generalist_continuity_manifest_covers_expected_lanes() -> None:
    manifest = load_manifest("backend/app/benchmarks/manifests/g1_continuity_coverage.json")

    assert manifest.manifest_id == "g1_continuity_coverage_baseline"
    assert len(manifest.cases) == 5
    assert {case.engagement_continuity_mode for case in manifest.cases} == {
        "one_off",
        "follow_up",
        "continuous",
    }
    assert sum(case.engagement_continuity_mode == "follow_up" for case in manifest.cases) == 2
    assert sum(case.engagement_continuity_mode == "continuous" for case in manifest.cases) == 2
```

- [ ] **Step 2: Update the suite summary test**

Update `test_generalist_coverage_suite_returns_coverage_summary()` to:

```python
def test_generalist_coverage_suite_returns_coverage_summary() -> None:
    suite = load_suite("backend/app/benchmarks/suites/generalist_coverage_proof_v1.json")
    result = run_suite(suite)

    assert result.gate_status == BenchmarkStatus.PASS
    assert result.total_case_count == 18
    assert len(result.category_results) == 3
    assert result.coverage_summary
    stage_summary = next(item for item in result.coverage_summary if item.axis == "client_stage")
    type_summary = next(item for item in result.coverage_summary if item.axis == "client_type")
    continuity_summary = next(item for item in result.coverage_summary if item.axis == "continuity")
    cross_domain_summary = next(item for item in result.coverage_summary if item.axis == "cross_domain")

    assert stage_summary.counts["創業階段"] == 4
    assert stage_summary.counts["規模化階段"] == 5

    assert type_summary.counts["個人品牌與服務"] == 5
    assert type_summary.counts["自媒體"] == 4
    assert not type_summary.thin_values
    assert not type_summary.missing_values

    assert continuity_summary.counts["one_off"] == 7
    assert continuity_summary.counts["follow_up"] == 6
    assert continuity_summary.counts["continuous"] == 5
    assert not continuity_summary.thin_values
    assert not continuity_summary.missing_values

    assert "research_plus_domain_advisory" in cross_domain_summary.expected_values
    assert not stage_summary.missing_values
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
git commit -m "test: tighten t2a continuity coverage expectations"
```

Expected:

- commit succeeds with only the test change staged

### Task 3: Verify the live continuity posture

**Files:**
- Verify: `backend/app/benchmarks/manifests/g1_continuity_coverage.json`
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
  - `"total_case_count": 18`
  - `continuity.counts = {"one_off": 7, "follow_up": 6, "continuous": 5}`

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
    if item["axis"] == "continuity":
        print("continuity_counts", item["counts"])
        print("continuity_thin", item["thin_values"])
PY
```

Expected:

- `continuity_counts` shows `one_off = 7`, `follow_up = 6`, `continuous = 5`
- `continuity_thin` is empty

### Task 4: Sync active docs to the shipped continuity change

**Files:**
- Modify: `docs/05_benchmark_and_regression.md`
- Modify: `docs/06_product_alignment_and_85_point_roadmap.md`
- Modify: `docs/04_qa_matrix.md`

- [ ] **Step 1: Update `docs/05`**

Append this paragraph after the existing `T2-A` density paragraphs in `docs/05_benchmark_and_regression.md`:

```md
`T2-A` 第三刀之後，continuity proof 也從單點 lane baseline 往 lane diversity 推進：
- `follow_up` 不再只由 SMB operations checkpoint 代表
- `continuous` 不再只由 scaled enterprise operations case 代表
- continuity counts 現在已能更誠實回答 `one_off / follow_up / continuous` 的 representative depth

正式規則仍維持：
- 這一刀仍是 continuity density patch，不是 writeback-depth platform
- cross-domain density 與其他更細的 summary contract 留待後續 slices
```

- [ ] **Step 2: Update `docs/06` T2-A progress**

Append this under the existing `目前進度` block in `### 11.1 T2-A Coverage density and proof deepen`:

```md
- 第三刀也已正式落地成 `continuity density v1`
- `follow_up` 現在不再只由 SMB operations checkpoint 代表
- `continuous` 現在不再只由 scaled enterprise operations case 代表
```

- [ ] **Step 3: Add a new `docs/04` QA entry**

Append this new entry immediately after the existing `## Entry: 2026-04-09 T2-A personal-brand density v1` section:

```md
## Entry: 2026-04-09 T2-A continuity density v1

Scope:
- deepen `T2-A` by adding follow-up and continuous lane diversity
- keep the same `generalist_coverage_proof_v1` suite instead of introducing a continuity platform
- make continuity proof less dependent on single representative cases

Environment used:
- local backend verification only

### Build / Typecheck / Compile

| Check | Result |
| --- | --- |
| `PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_benchmark_scaffolding.py -q` | Passed (`22 passed`) |
| `PYTHONPATH=backend .venv312/bin/python backend/scripts/run_pack_benchmark_scaffold.py --suite coverage` | Passed |

### T2-A continuity density verification

| Area | Page / Flow | Action | Status | Notes |
| --- | --- | --- | --- | --- |
| Backend | `backend/app/benchmarks/manifests/g1_continuity_coverage.json` | Add one new `follow_up` case and one new `continuous` case | Verified | continuity manifest now carries `5` cases and no longer leaves those lanes with only one representative case each |
| Backend | `backend/tests/test_benchmark_scaffolding.py` | Tighten continuity manifest and suite-level count expectations | Verified | pytest now asserts `follow_up = 6` and `continuous = 5` at suite level while keeping the benchmark scaffold advisory-first |
| CLI | `backend/scripts/run_pack_benchmark_scaffold.py --suite coverage` | Re-run live coverage suite after the continuity patch | Verified | live output now returns `total_case_count = 18` and `continuity_thin_values = []` |
| Coverage posture | continuity lane diversity | Confirm `follow_up` and `continuous` are no longer anchored by single representative cases | Verified | continuity proof now covers both SMB/personal-brand follow-up and enterprise/creator-style continuous work without adding a new suite family |

### Explicitly not shipped in this pass

- one_off density deepen
- cross-domain density deepen
- writeback-depth platform
- pair-level summary schema
```

- [ ] **Step 4: Commit the docs update**

Run:

```bash
git add docs/05_benchmark_and_regression.md docs/06_product_alignment_and_85_point_roadmap.md docs/04_qa_matrix.md
git commit -m "docs: align t2a continuity density"
```

Expected:

- commit succeeds with the three doc updates staged

### Task 5: Final verification and sync

**Files:**
- Verify: `backend/app/benchmarks/manifests/g1_continuity_coverage.json`
- Verify: `backend/tests/test_benchmark_scaffolding.py`
- Verify: `docs/05_benchmark_and_regression.md`
- Verify: `docs/06_product_alignment_and_85_point_roadmap.md`
- Verify: `docs/04_qa_matrix.md`

- [ ] **Step 1: Run placeholder scans**

Run:

```bash
rg -n "TBD|TODO|FIXME" \
  docs/superpowers/specs/2026-04-09-t2a-continuity-density-v1-design.md \
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
