# Phase 6 Case-Aware Governance Runtime v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `Phase 6` 的 task / matter governance signals 從 phase-level 靜態讀法推進成真正會吃案件上下文的 case-aware runtime。

**Architecture:** 後端先新增一個 internal `PhaseSixCaseContext`，再讓既有 `guidance posture`、`reuse confidence`、`confidence calibration`、`calibration-aware weighting` builder 全部改成可吃 case context。最後由 `tasks.py` 在 task / matter response assembly 時傳入真實 `client_stage / client_type / domain_lenses / evidence / pack context`，並同步更新 active docs 與 QA。

**Tech Stack:** FastAPI, Pydantic, SQLAlchemy, pytest, Next.js existing consumers, active docs in `docs/`

---

### Task 1: Case-Aware Governance Builder

**Files:**
- Modify: `backend/app/services/phase_six_generalist_governance.py`
- Test: `backend/tests/test_phase_six_case_aware_runtime.py`

- [ ] **Step 1: Write the failing test**

```python
def test_phase_six_case_context_changes_guidance_and_reuse_confidence():
    rich = PhaseSixCaseContext(
        client_stage="制度化階段",
        client_type="中小企業",
        domain_lenses=["法務"],
        evidence_count=4,
        unresolved_evidence_gap_count=0,
        selected_domain_pack_ids=["legal_risk_pack"],
        selected_industry_pack_ids=[],
    )
    sparse = PhaseSixCaseContext(
        client_stage=None,
        client_type=None,
        domain_lenses=["綜合"],
        evidence_count=0,
        unresolved_evidence_gap_count=3,
        selected_domain_pack_ids=[],
        selected_industry_pack_ids=[],
    )

    rich_guidance = build_phase_six_generalist_guidance_posture(case_context=rich)
    sparse_guidance = build_phase_six_generalist_guidance_posture(case_context=sparse)

    assert rich_guidance.guidance_posture == "light_guidance"
    assert sparse_guidance.guidance_posture == "guarded_guidance"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `PYTHONPATH=backend .venv/bin/pytest backend/tests/test_phase_six_case_aware_runtime.py -q`
Expected: FAIL because `PhaseSixCaseContext` / `case_context` support does not exist yet.

- [ ] **Step 3: Write minimal implementation**

```python
@dataclass(frozen=True)
class PhaseSixCaseContext:
    client_stage: str | None = None
    client_type: str | None = None
    domain_lenses: list[str] = field(default_factory=list)
    evidence_count: int = 0
    unresolved_evidence_gap_count: int = 0
    selected_domain_pack_ids: list[str] = field(default_factory=list)
    selected_industry_pack_ids: list[str] = field(default_factory=list)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `PYTHONPATH=backend .venv/bin/pytest backend/tests/test_phase_six_case_aware_runtime.py -q`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/app/services/phase_six_generalist_governance.py backend/tests/test_phase_six_case_aware_runtime.py
git commit -m "feat: add case-aware phase six governance builder"
```

### Task 2: Propagate Case Context Into Task / Matter Responses

**Files:**
- Modify: `backend/app/services/tasks.py`
- Test: `backend/tests/test_phase_six_case_aware_runtime.py`

- [ ] **Step 1: Write the failing integration test**

```python
def test_task_and_matter_phase_six_signals_follow_case_context(client: TestClient):
    rich_task = client.post("/api/v1/tasks", json=rich_payload).json()
    sparse_task = client.post("/api/v1/tasks", json=sparse_payload).json()

    rich_aggregate = client.get(f"/api/v1/tasks/{rich_task['id']}").json()
    sparse_aggregate = client.get(f"/api/v1/tasks/{sparse_task['id']}").json()

    assert rich_aggregate["generalist_guidance_posture"]["guidance_posture"] == "light_guidance"
    assert sparse_aggregate["generalist_guidance_posture"]["guidance_posture"] == "guarded_guidance"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `PYTHONPATH=backend .venv/bin/pytest backend/tests/test_phase_six_case_aware_runtime.py -q`
Expected: FAIL because `tasks.py` still uses phase-level static builder outputs.

- [ ] **Step 3: Write minimal implementation**

```python
phase_six_case_context = _build_phase_six_case_context(
    client_stage=summary.client_stage,
    client_type=summary.client_type,
    domain_lenses=summary.domain_lenses,
    evidence_count=len(_usable_evidence(latest_task)),
    unresolved_evidence_gap_count=len([item for item in evidence_gap_records if item.status != "resolved"]),
    selected_domain_pack_ids=[item.pack_id for item in matter_pack_resolution.selected_domain_packs],
    selected_industry_pack_ids=[item.pack_id for item in matter_pack_resolution.selected_industry_packs],
)
generalist_guidance_posture = build_phase_six_generalist_guidance_posture(case_context=phase_six_case_context)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `PYTHONPATH=backend .venv/bin/pytest backend/tests/test_phase_six_case_aware_runtime.py -q`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/app/services/tasks.py backend/tests/test_phase_six_case_aware_runtime.py
git commit -m "feat: propagate case-aware phase six signals"
```

### Task 3: Sync Active Docs and Verification Evidence

**Files:**
- Modify: `docs/01_runtime_architecture_and_data_contracts.md`
- Modify: `docs/06_product_alignment_and_85_point_roadmap.md`
- Modify: `docs/04_qa_matrix.md`

- [ ] **Step 1: Update runtime contract doc**

```md
- task / matter work-surface Phase 6 signals 現在也會正式吃：
  - client_stage
  - client_type
  - domain_lenses
  - evidence_thickness
  - pack context
```

- [ ] **Step 2: Update roadmap alignment doc**

```md
- `7.1 case-aware governance runtime` 已進入第一刀：work-surface guidance / confidence / calibration / weighting 現在開始依案件上下文變動。
```

- [ ] **Step 3: Run verification**

Run:
- `PYTHONPATH=backend .venv/bin/pytest backend/tests/test_phase_six_case_aware_runtime.py -q`
- `PYTHONPATH=backend .venv/bin/pytest backend/tests/test_mvp_slice.py -q`
- `cd frontend && node --test tests/phase-six-governance.test.mjs tests/intake-progress.test.mjs`

Expected:
- backend targeted tests PASS
- frontend targeted tests PASS

- [ ] **Step 4: Record QA evidence**

```md
## Entry: 2026-04-08 phase-6 case-aware governance runtime v1
```

- [ ] **Step 5: Commit**

```bash
git add docs/01_runtime_architecture_and_data_contracts.md docs/06_product_alignment_and_85_point_roadmap.md docs/04_qa_matrix.md
git commit -m "docs: align case-aware phase six runtime"
```

### Self-Review

- [ ] Spec coverage: this plan only covers `docs/06` `7.1` first slice, not `7.2~7.5`
- [ ] Placeholder scan: no `TODO` / `TBD` / vague “handle edge cases”
- [ ] Type consistency: `PhaseSixCaseContext` naming must match tests and service implementation
