# T2-A Cross-Domain Density V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deepen `T2-A Coverage density and proof deepen` by thickening the thinnest cross-domain bundle in `generalist_coverage_proof_v1`, so `legal_plus_finance` is no longer represented mostly by one SMB contract/finance pattern and one scaled-enterprise pattern.

**Architecture:** Keep the existing `generalist_coverage_proof_v1` suite, schema, runner, and CLI intact. Only extend `backend/app/benchmarks/manifests/g1_cross_domain_coverage.json` with two additional `legal_plus_finance` representative cases that use resolver-validated pack combinations, then tighten the benchmark tests and sync the active docs (`docs/05`, `docs/06`, `docs/04`) to the new verified bundle posture.

**Tech Stack:** JSON manifests, Python pytest, Markdown docs, git

---

### Task 1: Add two legal-plus-finance diversity cases to the cross-domain manifest

**Files:**
- Modify: `backend/app/benchmarks/manifests/g1_cross_domain_coverage.json`

- [ ] **Step 1: Add a startup legal/finance representative case**

Insert this case immediately after `legal_finance_bundle`:

```json
{
  "case_id": "startup_legal_finance_bundle",
  "title": "Startup legal + finance bundle",
  "description": "創業階段的法務 + 財務 bundle representative case.",
  "client_stage": "創業階段",
  "client_type": "中小企業",
  "engagement_continuity_mode": "one_off",
  "writeback_depth": "minimal",
  "coverage_bundle_id": "legal_plus_finance",
  "domain_lenses": ["法務", "財務"],
  "industry_hints": ["saas", "term sheet", "founder agreement", "runway"],
  "decision_context_summary": "Need a startup recommendation on founder agreement obligations, early financing structure, and whether to simplify the funding path before signing long-tail commitments.",
  "source_mix_summary": ["founder agreement note", "term sheet draft", "runway summary"],
  "target_domain_pack_ids": ["finance_fundraising_pack", "legal_risk_pack"],
  "target_industry_pack_ids": ["saas_pack"],
  "expected_contract_interface_ids": ["evidence_readiness_v1", "decision_framing_v1", "deliverable_shaping_v1"],
  "expected_hint_areas": ["evidence_expectations", "decision_patterns", "readiness"]
}
```

- [ ] **Step 2: Add a personal-brand legal/finance representative case**

Insert this case immediately after the startup legal/finance case:

```json
{
  "case_id": "personal_brand_legal_finance_bundle",
  "title": "Personal-brand legal + finance bundle",
  "description": "制度化階段的個人品牌與服務，需要 legal + finance bundle framing。",
  "client_stage": "制度化階段",
  "client_type": "個人品牌與服務",
  "engagement_continuity_mode": "follow_up",
  "writeback_depth": "milestone",
  "coverage_bundle_id": "legal_plus_finance",
  "domain_lenses": ["法務", "財務"],
  "industry_hints": ["education", "revshare", "contract", "cashflow"],
  "decision_context_summary": "Need a personal-brand business recommendation on partner agreement risk, revenue share obligations, and whether to simplify the current financing and contract structure before scaling programs.",
  "source_mix_summary": ["partner agreement summary", "revshare note", "cashflow tracker"],
  "target_domain_pack_ids": ["legal_risk_pack", "finance_fundraising_pack"],
  "target_industry_pack_ids": ["online_education_pack"],
  "expected_contract_interface_ids": ["evidence_readiness_v1", "decision_framing_v1", "deliverable_shaping_v1"],
  "expected_hint_areas": ["evidence_expectations", "decision_patterns", "readiness"]
}
```

- [ ] **Step 3: Verify the manifest is valid and now has 6 cases**

Run:

```bash
python3 - <<'PY'
import json
from pathlib import Path
path = Path("backend/app/benchmarks/manifests/g1_cross_domain_coverage.json")
data = json.loads(path.read_text())
print(data["manifest_id"], len(data["cases"]))
PY
```

Expected:

```text
g1_cross_domain_coverage_baseline 6
```

- [ ] **Step 4: Commit the manifest update**

Run:

```bash
git add backend/app/benchmarks/manifests/g1_cross_domain_coverage.json
git commit -m "feat: deepen t2a cross domain coverage"
```

Expected:

- commit succeeds with only the manifest change staged

### Task 2: Tighten benchmark tests around legal-plus-finance density

**Files:**
- Modify: `backend/tests/test_benchmark_scaffolding.py`

- [ ] **Step 1: Update the cross-domain manifest test**

Replace `test_generalist_cross_domain_manifest_covers_expected_bundles()` with:

```python
def test_generalist_cross_domain_manifest_covers_expected_bundles() -> None:
    manifest = load_manifest("backend/app/benchmarks/manifests/g1_cross_domain_coverage.json")

    assert manifest.manifest_id == "g1_cross_domain_coverage_baseline"
    assert len(manifest.cases) == 6
    assert {case.coverage_bundle_id for case in manifest.cases} == {
        "legal_plus_finance",
        "operations_plus_org_people",
        "marketing_sales_plus_product_service",
        "research_plus_domain_advisory",
    }
    assert sum(case.coverage_bundle_id == "legal_plus_finance" for case in manifest.cases) == 3
```

- [ ] **Step 2: Update the suite summary test**

Update `test_generalist_coverage_suite_returns_coverage_summary()` to:

```python
def test_generalist_coverage_suite_returns_coverage_summary() -> None:
    suite = load_suite("backend/app/benchmarks/suites/generalist_coverage_proof_v1.json")
    result = run_suite(suite)

    assert result.gate_status == BenchmarkStatus.PASS
    assert result.total_case_count == 20
    assert len(result.category_results) == 3
    assert result.coverage_summary
    stage_summary = next(item for item in result.coverage_summary if item.axis == "client_stage")
    type_summary = next(item for item in result.coverage_summary if item.axis == "client_type")
    continuity_summary = next(item for item in result.coverage_summary if item.axis == "continuity")
    cross_domain_summary = next(item for item in result.coverage_summary if item.axis == "cross_domain")

    assert stage_summary.counts["創業階段"] == 5
    assert stage_summary.counts["制度化階段"] == 10
    assert stage_summary.counts["規模化階段"] == 5

    assert type_summary.counts["中小企業"] == 8
    assert type_summary.counts["個人品牌與服務"] == 6
    assert type_summary.counts["自媒體"] == 4
    assert not type_summary.thin_values
    assert not type_summary.missing_values

    assert continuity_summary.counts["one_off"] == 8
    assert continuity_summary.counts["follow_up"] == 7
    assert continuity_summary.counts["continuous"] == 5
    assert not continuity_summary.thin_values
    assert not continuity_summary.missing_values

    assert cross_domain_summary.counts["legal_plus_finance"] == 5
    assert cross_domain_summary.counts["operations_plus_org_people"] == 4
    assert cross_domain_summary.counts["research_plus_domain_advisory"] == 4
    assert "legal_plus_finance" not in cross_domain_summary.thin_values
    assert not cross_domain_summary.missing_values
    assert not stage_summary.missing_values
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
git commit -m "test: tighten t2a cross domain coverage expectations"
```

Expected:

- commit succeeds with only the test change staged

### Task 3: Verify the live cross-domain posture

**Files:**
- Verify: `backend/app/benchmarks/manifests/g1_cross_domain_coverage.json`
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
  - `"total_case_count": 20`
  - `cross_domain.counts.legal_plus_finance = 5`

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
    if item["axis"] == "cross_domain":
        print("cross_domain_counts", item["counts"])
        print("cross_domain_thin", item["thin_values"])
PY
```

Expected:

- `cross_domain_counts` shows `legal_plus_finance = 5`
- `cross_domain_thin` no longer includes `legal_plus_finance`

### Task 4: Sync active docs to the shipped cross-domain change

**Files:**
- Modify: `docs/05_benchmark_and_regression.md`
- Modify: `docs/06_product_alignment_and_85_point_roadmap.md`
- Modify: `docs/04_qa_matrix.md`

- [ ] **Step 1: Update `docs/05`**

Append this paragraph after the existing `T2-A` density paragraphs in `docs/05_benchmark_and_regression.md`:

```md
`T2-A` 第四刀之後，cross-domain proof 也開始補最薄 bundle：
- `legal_plus_finance` 已從 `3` 補到 `5`
- 這條 bundle 不再主要只靠 SMB contract/finance case 與 scaled enterprise case 代表
- cross-domain counts 現在較能誠實回答 bundle density，而不只是 bundle existence

正式規則仍維持：
- 這一刀仍是 bundle density patch，不是 cross-domain matrix platform
- 其他 bundle 的更細緻 density 與 summary contract 留待後續 slices
```

- [ ] **Step 2: Update `docs/06` T2-A progress**

Append this under the existing `目前進度` block in `### 11.1 T2-A Coverage density and proof deepen`:

```md
- 第四刀也已正式落地成 `cross-domain density v1`
- `legal_plus_finance` 已不再是明顯最薄的單一 bundle
- `創業階段 + 中小企業` 與 `制度化階段 + 個人品牌與服務` 都已補入這條 bundle 的正式 representative cases
```

- [ ] **Step 3: Add a new `docs/04` QA entry**

Append this new entry immediately after the existing `## Entry: 2026-04-09 T2-A continuity density v1` section:

```md
## Entry: 2026-04-10 T2-A cross-domain density v1

Scope:
- deepen `T2-A` by thickening the thinnest cross-domain bundle
- keep the same `generalist_coverage_proof_v1` suite instead of introducing a cross-domain matrix platform
- make `legal_plus_finance` less dependent on one SMB pattern and one scaled-enterprise pattern

Environment used:
- local backend verification only

### Build / Typecheck / Compile

| Check | Result |
| --- | --- |
| `PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_benchmark_scaffolding.py -q` | Passed (`22 passed`) |
| `PYTHONPATH=backend .venv312/bin/python backend/scripts/run_pack_benchmark_scaffold.py --suite coverage` | Passed |

### T2-A cross-domain density verification

| Area | Page / Flow | Action | Status | Notes |
| --- | --- | --- | --- | --- |
| Backend | `backend/app/benchmarks/manifests/g1_cross_domain_coverage.json` | Add two new `legal_plus_finance` representative cases | Verified | cross-domain manifest now carries `6` cases, and `legal_plus_finance` grows from `3` to `5` |
| Backend | `backend/tests/test_benchmark_scaffolding.py` | Tighten bundle-level and suite-level cross-domain density expectations | Verified | pytest now asserts `cross_domain.legal_plus_finance = 5` while keeping the benchmark scaffold advisory-first |
| CLI | `backend/scripts/run_pack_benchmark_scaffold.py --suite coverage` | Re-run live coverage suite after the cross-domain patch | Verified | live output now returns `total_case_count = 20` and `cross_domain_thin_values = []` |
| Coverage posture | legal-plus-finance bundle diversity | Confirm the thinnest bundle is no longer anchored by only one SMB pattern and one enterprise pattern | Verified | `legal_plus_finance` now includes startup, institutional personal-brand, and scaled-enterprise representatives without adding a new suite family |

### Explicitly not shipped in this pass

- other bundle density deepen
- cross-domain summary schema
- weighted bundle score wall
- new suite family
```

- [ ] **Step 4: Commit the docs update**

Run:

```bash
git add docs/05_benchmark_and_regression.md docs/06_product_alignment_and_85_point_roadmap.md docs/04_qa_matrix.md
git commit -m "docs: align t2a cross domain density"
```

Expected:

- commit succeeds with the three doc updates staged

### Task 5: Final verification and sync

**Files:**
- Verify: `backend/app/benchmarks/manifests/g1_cross_domain_coverage.json`
- Verify: `backend/tests/test_benchmark_scaffolding.py`
- Verify: `docs/05_benchmark_and_regression.md`
- Verify: `docs/06_product_alignment_and_85_point_roadmap.md`
- Verify: `docs/04_qa_matrix.md`

- [ ] **Step 1: Run placeholder scans**

Run:

```bash
rg -n "TBD|TODO|FIXME" \
  docs/superpowers/specs/2026-04-10-t2a-cross-domain-density-v1-design.md \
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
