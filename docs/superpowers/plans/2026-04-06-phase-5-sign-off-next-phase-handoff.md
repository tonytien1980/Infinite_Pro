# Phase 5 Sign-Off and Next-Phase Handoff Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 讓 phase 5 可以在既有首頁總覽內被 owner 正式收口，並回出下一階段 handoff。

**Architecture:** 後端沿用 phase 4 的 sign-off persistence pattern，用同一種 phase-review row 記錄 sign-off state；frontend 則在既有 `總覽` 的 phase-5 closure panel 補 owner-only sign-off action 與 signed-off handoff readout。這一刀不新增新頁面，只把 closure review 推到正式收口。

**Tech Stack:** FastAPI, SQLAlchemy 2, Pydantic 2, Next.js 15 App Router, React 19, TypeScript, node:test

---

## Scope Guard

這份 implementation plan 只處理：

- phase-5 sign-off persistence
- next-phase handoff contract
- homepage sign-off UI

這份 plan **不處理**：

- phase 6 runtime implementation
- new handoff page
- audit trail center

## File Structure

### Backend

- Modify: `backend/app/workbench/schemas.py`
- Modify: `backend/app/services/phase_five_closure_review.py`
- Modify: `backend/app/services/workbench.py`
- Modify: `backend/app/api/routes/workbench.py`
- Test: `backend/tests/test_mvp_slice.py`

### Frontend

- Modify: `frontend/src/lib/types.ts`
- Modify: `frontend/src/lib/api.ts`
- Modify: `frontend/src/lib/phase-five-closure.ts`
- Modify: `frontend/src/components/workbench-home.tsx`
- Test: `frontend/tests/auth-foundation.test.mjs`

### Docs

- Modify: `docs/00_product_definition_and_current_state.md`
- Modify: `docs/01_runtime_architecture_and_data_contracts.md`
- Modify: `docs/03_workbench_ux_and_page_spec.md`
- Modify: `docs/04_qa_matrix.md`
- Modify: `docs/superpowers/specs/2026-04-06-phase-5-sign-off-next-phase-handoff-design.md`

### Task 1: Backend Sign-Off and Handoff Contract

**Files:**
- Modify: `backend/app/workbench/schemas.py`
- Modify: `backend/app/services/phase_five_closure_review.py`
- Modify: `backend/app/services/workbench.py`
- Modify: `backend/app/api/routes/workbench.py`
- Test: `backend/tests/test_mvp_slice.py`

- [ ] **Step 1: Write the failing backend tests**

```python
def test_owner_can_sign_off_phase_five(client: TestClient) -> None:
    response = client.post(
        "/api/v1/workbench/phase-5-sign-off",
        json={"operator_label": "王顧問"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["closure_status"] == "signed_off"
    assert body["signed_off_by_label"] == "王顧問"
    assert body["next_phase_label"]
    assert body["handoff_summary"]
    assert body["handoff_items"]
```

- [ ] **Step 2: Run targeted backend test to verify it fails**

Run:

```bash
PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -k "sign_off_phase_five" -q
```

- [ ] **Step 3: Write minimal backend implementation**

- [ ] **Step 4: Re-run targeted backend test to green**

- [ ] **Step 5: Commit**

```bash
git add backend/app/workbench/schemas.py backend/app/services/phase_five_closure_review.py backend/app/services/workbench.py backend/app/api/routes/workbench.py backend/tests/test_mvp_slice.py
git commit -m "feat: add phase 5 sign off"
```

### Task 2: Homepage Sign-Off UI

**Files:**
- Modify: `frontend/src/lib/types.ts`
- Modify: `frontend/src/lib/api.ts`
- Modify: `frontend/src/lib/phase-five-closure.ts`
- Modify: `frontend/src/components/workbench-home.tsx`
- Test: `frontend/tests/auth-foundation.test.mjs`

- [ ] **Step 1: Write the failing frontend tests**

```javascript
test("phase 5 closure view can expose sign-off readiness and signed-off handoff", () => {
  const ready = buildPhaseFiveClosureView({
    phase_id: "phase_5",
    phase_label: "Single-Firm Cloud Foundation",
    closure_status: "ready_to_close",
    closure_status_label: "可準備收口",
    summary: "",
    foundation_snapshot: "",
    completed_count: 6,
    remaining_count: 1,
    completed_items: [],
    asset_audits: [],
    remaining_items: ["phase 5 sign-off 與下一階段 handoff"],
    recommended_next_step: "",
    signed_off_at: null,
    signed_off_by_label: "",
    next_phase_label: "",
    handoff_summary: "",
    handoff_items: [],
  });
  assert.equal(ready.canSignOff, true);
});
```

- [ ] **Step 2: Run targeted frontend tests to verify they fail**

Run:

```bash
cd frontend && node --test tests/auth-foundation.test.mjs
```

- [ ] **Step 3: Implement sign-off button and signed-off readout**

- [ ] **Step 4: Re-run targeted frontend tests, typecheck, and build**

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/types.ts frontend/src/lib/api.ts frontend/src/lib/phase-five-closure.ts frontend/src/components/workbench-home.tsx frontend/tests/auth-foundation.test.mjs
git commit -m "feat: add phase 5 sign off surface"
```

### Task 3: Docs, QA, and Full Verification

**Files:**
- Modify: `docs/00_product_definition_and_current_state.md`
- Modify: `docs/01_runtime_architecture_and_data_contracts.md`
- Modify: `docs/03_workbench_ux_and_page_spec.md`
- Modify: `docs/04_qa_matrix.md`
- Modify: `docs/superpowers/specs/2026-04-06-phase-5-sign-off-next-phase-handoff-design.md`

- [ ] **Step 1: Update docs to mark phase-5 sign-off shipped**

- [ ] **Step 2: Run full verification**

Run:

```bash
python3 -m compileall backend/app
PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -q
cd frontend && node --test tests/auth-foundation.test.mjs tests/provider-settings-foundation.test.mjs tests/demo-workspace-isolation.test.mjs tests/intake-progress.test.mjs
cd frontend && rm -f .next/cache/.tsbuildinfo && mkdir -p .next/types && npx next typegen && npm run typecheck
cd frontend && npm run build
cd frontend && NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8010/api/v1 npm run build
```

- [ ] **Step 3: Commit**

```bash
git add docs/00_product_definition_and_current_state.md docs/01_runtime_architecture_and_data_contracts.md docs/03_workbench_ux_and_page_spec.md docs/04_qa_matrix.md docs/superpowers/specs/2026-04-06-phase-5-sign-off-next-phase-handoff-design.md
git commit -m "docs: align phase 5 sign off"
```
