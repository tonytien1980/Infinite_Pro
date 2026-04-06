# Phase 5 Closure Review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 phase 5 目前做到哪、還差什麼，做成 system 內正式可讀的 closure review，並低噪音放進首頁總覽。

**Architecture:** 後端新增一條 `phase_5_closure_review` read model route，沿用 phase 4 的 closure-review 結構但改成 phase-5 asset audits；前端在既有 `總覽` 補一塊 closure panel，回答目前完成度與下一步，而不是再開新頁或直接做 sign-off。

**Tech Stack:** FastAPI, Pydantic 2, Next.js 15 App Router, React 19, TypeScript, node:test

---

## Scope Guard

這份 implementation plan 只處理：

- phase 5 closure review backend contract
- homepage closure review panel
- docs / QA / full verification

這份 plan **不處理**：

- sign-off action
- handoff persistence
- phase 6 planning

## File Structure

### Backend

- Modify: `backend/app/workbench/schemas.py`
  - add phase-5 closure review contracts
- Create: `backend/app/services/phase_five_closure_review.py`
  - build phase-5 closure review snapshot
- Modify: `backend/app/api/routes/workbench.py`
  - add `GET /workbench/phase-5-closure-review`
- Test: `backend/tests/test_mvp_slice.py`

### Frontend

- Modify: `frontend/src/lib/types.ts`
  - add phase-5 closure review types
- Modify: `frontend/src/lib/api.ts`
  - add client + parser
- Create: `frontend/src/lib/phase-five-closure.ts`
  - low-noise view helper
- Modify: `frontend/src/components/workbench-home.tsx`
  - add phase-5 closure panel
- Test: `frontend/tests/auth-foundation.test.mjs`

### Docs

- Modify: `docs/00_product_definition_and_current_state.md`
- Modify: `docs/01_runtime_architecture_and_data_contracts.md`
- Modify: `docs/03_workbench_ux_and_page_spec.md`
- Modify: `docs/04_qa_matrix.md`
- Modify: `docs/superpowers/specs/2026-04-06-phase-5-closure-review-design.md`

### Task 1: Phase 5 Closure Review Backend

**Files:**
- Modify: `backend/app/workbench/schemas.py`
- Create: `backend/app/services/phase_five_closure_review.py`
- Modify: `backend/app/api/routes/workbench.py`
- Test: `backend/tests/test_mvp_slice.py`

- [ ] **Step 1: Write the failing backend test**

```python
def test_owner_can_read_phase_five_closure_review(client: TestClient) -> None:
    response = client.get("/api/v1/workbench/phase-5-closure-review")

    assert response.status_code == 200
    body = response.json()
    assert body["phase_id"] == "phase_5"
    assert body["asset_audits"]
    assert body["remaining_items"]
```

- [ ] **Step 2: Run targeted backend test to verify it fails**

Run:

```bash
PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -k "phase_five_closure_review" -q
```

- [ ] **Step 3: Write minimal backend implementation**

- [ ] **Step 4: Re-run targeted backend test to green**

- [ ] **Step 5: Commit**

```bash
git add backend/app/workbench/schemas.py backend/app/services/phase_five_closure_review.py backend/app/api/routes/workbench.py backend/tests/test_mvp_slice.py
git commit -m "feat: add phase 5 closure review"
```

### Task 2: Homepage Closure Review Panel

**Files:**
- Modify: `frontend/src/lib/types.ts`
- Modify: `frontend/src/lib/api.ts`
- Create: `frontend/src/lib/phase-five-closure.ts`
- Modify: `frontend/src/components/workbench-home.tsx`
- Test: `frontend/tests/auth-foundation.test.mjs`

- [ ] **Step 1: Write the failing frontend tests**

```javascript
test("phase 5 closure view stays consultant-readable", () => {
  const view = buildPhaseFiveClosureView({
    phaseId: "phase_5",
    phaseLabel: "Single-Firm Cloud Foundation",
    closureStatus: "ready_to_close",
    closureStatusLabel: "可準備收口",
    summary: "phase 5 六條主線已站穩。",
    foundationSnapshot: "已補 6 項｜剩 1 項",
    completedCount: 6,
    remainingCount: 1,
    completedItems: [],
    assetAudits: [],
    remainingItems: ["phase 5 sign-off 與下一階段 handoff"],
    recommendedNextStep: "準備 sign-off。",
  });
  assert.equal(view.title, "第 5 階段收尾狀態");
});
```

- [ ] **Step 2: Run targeted frontend tests to verify they fail**

Run:

```bash
cd frontend && node --test tests/auth-foundation.test.mjs
```

- [ ] **Step 3: Implement helper and homepage panel**

- [ ] **Step 4: Re-run targeted frontend tests, typecheck, and build**

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/types.ts frontend/src/lib/api.ts frontend/src/lib/phase-five-closure.ts frontend/src/components/workbench-home.tsx frontend/tests/auth-foundation.test.mjs
git commit -m "feat: add phase 5 closure panel"
```

### Task 3: Docs, QA, and Full Verification

**Files:**
- Modify: `docs/00_product_definition_and_current_state.md`
- Modify: `docs/01_runtime_architecture_and_data_contracts.md`
- Modify: `docs/03_workbench_ux_and_page_spec.md`
- Modify: `docs/04_qa_matrix.md`
- Modify: `docs/superpowers/specs/2026-04-06-phase-5-closure-review-design.md`

- [ ] **Step 1: Update docs to mark closure review shipped**

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
git add docs/00_product_definition_and_current_state.md docs/01_runtime_architecture_and_data_contracts.md docs/03_workbench_ux_and_page_spec.md docs/04_qa_matrix.md docs/superpowers/specs/2026-04-06-phase-5-closure-review-design.md
git commit -m "docs: align phase 5 closure review"
```
