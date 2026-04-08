# Phase 6 Case-Aware Governance Runtime Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `7.1 Case-aware governance runtime` 從已完成的 `task / matter` first slice，推進到 `task / matter / deliverable` 三個工作面都正式收口的 completion pass。

**Architecture:** backend 不新增新的 `Phase 6` route family，而是沿用既有 `TaskAggregateResponse` 被 `DeliverableWorkspaceResponse.task` 引用的設計，補齊 deliverable-side parity 與 cross-surface consistency。frontend 只在既有 `deliverable workspace` / shared helper 鏈上補齊 case-aware讀法，保持 deliverable-first、low-noise workbench，不做新 dashboard family。active docs 與 QA 會同步更新，把 `7.1` 的完成邊界和之後的 `7.15` 插段分開。

**Tech Stack:** FastAPI, SQLAlchemy, Pydantic, pytest, Next.js, node test, active docs under `docs/`

---

## File Structure

- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/app/services/tasks.py`
  - Complete deliverable-side case-aware propagation and parity checks
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/app/services/phase_six_generalist_governance.py`
  - Tighten shared builder behavior only where deliverable parity or cross-surface consistency requires it
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/components/deliverable-workspace-panel.tsx`
  - Ensure deliverable workspace reads the case-aware `task` signals consistently
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/lib/phase-six-governance.ts`
  - Add any small helper needed for cross-surface consistency without growing note length
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/tests/phase-six-governance.test.mjs`
  - Cover deliverable-side low-noise parity helpers
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/tests/test_phase_six_case_aware_runtime.py`
  - Extend integration checks from `task / matter` to deliverable workspace parity
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/01_runtime_architecture_and_data_contracts.md`
  - Mark `7.1` work-surface parity / completion pass contract
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/06_product_alignment_and_85_point_roadmap.md`
  - Mark `7.1` completion status precisely, without pretending `7.15` is done
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/04_qa_matrix.md`
  - Append real verification evidence for the completion pass

---

### Task 1: Deliverable Propagation And Parity

**Files:**
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/tests/test_phase_six_case_aware_runtime.py`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/app/services/tasks.py`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/components/deliverable-workspace-panel.tsx`

- [ ] **Step 1: Write the failing backend integration test**

```python
def test_deliverable_workspace_phase_six_signals_follow_case_context(client: TestClient) -> None:
    task = _create_case_task(
        client,
        title="Deliverable parity legal task",
        client_stage="制度化階段",
        client_type="中小企業",
        domain_lenses=["法務"],
        upload_bytes=b"Termination, indemnity, and liability clauses need immediate review.",
    )

    aggregate = client.get(f"/api/v1/tasks/{task['id']}").json()
    deliverable_id = aggregate["deliverables"][0]["id"]
    workspace = client.get(f"/api/v1/deliverables/{deliverable_id}").json()

    assert workspace["task"]["generalist_guidance_posture"]["guidance_posture"] in {
        "balanced_guidance",
        "light_guidance",
    }
    assert workspace["task"]["reuse_confidence_signal"]["distance_items"]
    assert workspace["task"]["confidence_calibration_signal"]["calibration_items"]
    assert workspace["task"]["calibration_aware_weighting_signal"]["weighting_items"]
```

- [ ] **Step 2: Run test to verify it fails**

Run: `PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_phase_six_case_aware_runtime.py -q`

Expected: FAIL because deliverable workspace parity is not explicitly verified yet, or because deliverable-side serialization still exposes a drift from task / matter behavior.

- [ ] **Step 3: Write minimal implementation**

```python
task_aggregate = serialize_task(task)

return schemas.DeliverableWorkspaceResponse(
    deliverable=deliverable,
    task=task_aggregate,
    ...
)
```

```tsx
const deliverableTemplateView = task
  ? buildDeliverableTemplateView(
      task.deliverable_template_guidance,
      task.generalist_guidance_posture,
      task.reuse_confidence_signal,
      task.confidence_calibration_signal,
      task.calibration_aware_weighting_signal,
    )
  : null;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_phase_six_case_aware_runtime.py -q`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/tests/test_phase_six_case_aware_runtime.py backend/app/services/tasks.py frontend/src/components/deliverable-workspace-panel.tsx
git commit -m "feat: complete deliverable phase six parity"
```

---

### Task 2: Cross-Surface Consistency Completion Pass

**Files:**
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/tests/test_phase_six_case_aware_runtime.py`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/lib/phase-six-governance.ts`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/tests/phase-six-governance.test.mjs`

- [ ] **Step 1: Write the failing consistency test**

```python
def test_phase_six_case_aware_runtime_keeps_task_matter_deliverable_consultant_reading_consistent(
    client: TestClient,
) -> None:
    task = _create_case_task(
        client,
        title="Cross-surface consistency task",
        client_stage="制度化階段",
        client_type="中小企業",
        domain_lenses=["法務"],
        upload_bytes=b"Termination, indemnity, and liability clauses need immediate review.",
    )
    aggregate = client.get(f"/api/v1/tasks/{task['id']}").json()
    matter = client.get(f"/api/v1/matters/{aggregate['matter_workspace']['id']}").json()
    deliverable = client.get(f"/api/v1/deliverables/{aggregate['deliverables'][0]['id']}").json()

    assert aggregate["generalist_guidance_posture"]["summary"]
    assert matter["generalist_guidance_posture"]["summary"]
    assert deliverable["task"]["generalist_guidance_posture"]["summary"]
```

- [ ] **Step 2: Run test to verify it fails**

Run:
- `PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_phase_six_case_aware_runtime.py -q`
- `cd frontend && node --test tests/phase-six-governance.test.mjs`

Expected: FAIL because one or more surfaces still read the same data with inconsistent low-noise helper wording or missing parity assumptions.

- [ ] **Step 3: Write minimal implementation**

```typescript
export function summarizePhaseSixWorkGuidance(
  posture: Pick<PhaseSixGeneralistGuidancePosture, "workGuidanceSummary" | "guidanceItems">,
) {
  if (posture.workGuidanceSummary) {
    return posture.workGuidanceSummary;
  }
  return summarizePhaseSixGuidanceItems(posture.guidanceItems);
}
```

```javascript
test("phase 6 work-surface guidance summary stays low-noise and reusable", () => {
  assert.equal(
    summarizePhaseSixWorkGuidance({
      workGuidanceSummary: "目前工作 guidance 可維持低噪音，只在需要時補 reusable boundary。",
      guidanceItems: [],
    }),
    "目前工作 guidance 可維持低噪音，只在需要時補 reusable boundary。",
  );
});
```

- [ ] **Step 4: Run test to verify it passes**

Run:
- `PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_phase_six_case_aware_runtime.py -q`
- `cd frontend && node --test tests/phase-six-governance.test.mjs tests/intake-progress.test.mjs`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/tests/test_phase_six_case_aware_runtime.py frontend/src/lib/phase-six-governance.ts frontend/tests/phase-six-governance.test.mjs
git commit -m "feat: complete phase six cross-surface consistency"
```

---

### Task 3: Active Docs And QA Completion Pass

**Files:**
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/01_runtime_architecture_and_data_contracts.md`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/06_product_alignment_and_85_point_roadmap.md`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/04_qa_matrix.md`

- [ ] **Step 1: Update runtime contract doc**

```md
- `DeliverableWorkspaceResponse` 可沿用既有 `task: TaskAggregateResponse`
  正式回讀 case-aware `guidance / confidence / calibration / weighting`
- `7.1` 的工作面 completion pass 現在已覆蓋：
  - task
  - matter
  - deliverable
```

- [ ] **Step 2: Update roadmap alignment doc**

```md
- `7.1 case-aware governance runtime` 的 work-surface completion pass 已收口於：
  - task / matter / deliverable
- phase-level governance 補強改由後續 `7.15` 處理，不算 `7.1` blocker
```

- [ ] **Step 3: Run full verification**

Run:
- `PYTHONPATH=backend .venv312/bin/python -m compileall backend/app`
- `PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_phase_six_case_aware_runtime.py -q`
- `PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_mvp_slice.py -q`
- `cd frontend && node --test tests/phase-six-governance.test.mjs tests/intake-progress.test.mjs`
- `cd frontend && rm -f .next/cache/.tsbuildinfo && mkdir -p .next/types && npx next typegen && npm run typecheck`
- `cd frontend && npm run build`

Expected:
- backend compile PASS
- targeted case-aware tests PASS
- full backend regression PASS
- frontend targeted tests PASS
- frontend typecheck PASS
- frontend build PASS

- [ ] **Step 4: Append QA matrix**

```md
## Entry: 2026-04-08 phase-6 case-aware governance runtime completion pass
```

- [ ] **Step 5: Commit**

```bash
git add docs/01_runtime_architecture_and_data_contracts.md docs/06_product_alignment_and_85_point_roadmap.md docs/04_qa_matrix.md
git commit -m "docs: close phase six case-aware runtime"
```

---

### Self-Review

- [ ] Spec coverage: this plan covers only `7.1` remaining work-surface slices and explicitly leaves `7.15` / `7.2` untouched
- [ ] Placeholder scan: no `TODO`, `TBD`, or vague “handle edge cases”
- [ ] Type consistency: deliverable workspace must continue to read `Phase 6` signals through `task: TaskAggregateResponse`, not a second ad-hoc contract
