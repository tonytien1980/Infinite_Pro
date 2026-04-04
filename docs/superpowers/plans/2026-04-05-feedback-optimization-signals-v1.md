# Feedback Optimization Signals V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 讓 precedent 開始具備第一版 optimization signal，讓系統知道這筆人類回饋對哪類 reusable asset 最有幫助、參考強度大概多高。

**Architecture:** backend 在 precedent intelligence 上新增一層 nested `optimization_signal`，先由 feedback status、reason codes、candidate status 與 candidate type 收斂成 strength / best-for / summary；再把它帶進 precedent review 與 Host-safe precedent reference。frontend 只做既有 precedent UI 的低噪音補充。

**Tech Stack:** Python, FastAPI, SQLAlchemy, Next.js, TypeScript, node:test, pytest

---

### Task 1: Add failing tests for optimization signals v1

**Files:**
- Modify: `backend/tests/test_mvp_slice.py`
- Modify: `frontend/tests/intake-progress.test.mjs`

- [ ] **Step 1: Add backend failing tests**

覆蓋：
- precedent review returns optimization signal
- Host-safe precedent reference returns optimization signal
- reason-coded precedent generates best-for asset labels and strength

- [ ] **Step 2: Run backend tests to verify failure**

Run: `PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -q -k "optimization_signal"`

- [ ] **Step 3: Add frontend failing tests**

覆蓋：
- precedent review priority / precedent reference helpers read optimization signal in low-noise copy

- [ ] **Step 4: Run frontend tests to verify failure**

Run: `cd frontend && node --test tests/intake-progress.test.mjs`

### Task 2: Implement backend optimization signal

**Files:**
- Create: `backend/app/services/feedback_optimization_intelligence.py`
- Modify: `backend/app/domain/schemas.py`
- Modify: `backend/app/workbench/schemas.py`
- Modify: `backend/app/services/precedent_intelligence.py`
- Modify: `backend/app/services/workbench.py`
- Modify: any touched serialization path

- [ ] **Step 1: Add optimization signal schema**

新增 nested optimization signal contract。

- [ ] **Step 2: Add signal derivation**

從 feedback status、reason codes、candidate status、candidate type 收斂：
- strength
- strength_reason
- best_for_asset_codes / labels
- summary

- [ ] **Step 3: Wire to precedent review and reference**

讓 precedent review lane 與 Host-safe precedent reference 都正式帶這個 nested signal。

- [ ] **Step 4: Run backend tests**

Run: `PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -q -k "optimization_signal"`

### Task 3: Add low-noise frontend readback

**Files:**
- Modify: `frontend/src/lib/types.ts`
- Modify: `frontend/src/lib/precedent-reference.ts`
- Modify: `frontend/src/lib/precedent-review.ts`
- Modify: `frontend/src/components/history-page-panel.tsx`
- Modify: existing task / deliverable precedent readback only if needed

- [ ] **Step 1: Extend types and helpers**

讓 precedent UI helper 能把 optimization signal 讀成 consultant-readable low-noise copy。

- [ ] **Step 2: Keep UI low-noise**

只補：
- `最佳幫助：...`
- `參考強度：...`

- [ ] **Step 3: Run frontend tests**

Run: `cd frontend && node --test tests/intake-progress.test.mjs`

### Task 4: Sync active docs

**Files:**
- Modify: `docs/00_product_definition_and_current_state.md`
- Modify: `docs/01_runtime_architecture_and_data_contracts.md`
- Modify: `docs/03_workbench_ux_and_page_spec.md`
- Modify: `docs/04_qa_matrix.md`

- [ ] **Step 1: Update docs**

把 optimization signal 的角色、邊界與 UI disclosure 寫清楚。

- [ ] **Step 2: Add fresh QA evidence**

把 compile / tests / build / typecheck 寫進 QA matrix。

### Task 5: Verify and sync GitHub

**Files:**
- Modify: `git state only`

- [ ] **Step 1: Run compile**

Run: `python3 -m compileall backend/app`

- [ ] **Step 2: Run backend tests**

Run: `PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -q`

- [ ] **Step 3: Run frontend tests**

Run: `cd frontend && node --test tests/intake-progress.test.mjs`

- [ ] **Step 4: Run builds and typecheck**

Run:
- `cd frontend && npm run build`
- `cd frontend && NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8010/api/v1 npm run build`
- `cd frontend && rm -f .next/cache/.tsbuildinfo && npx next typegen && npm run typecheck`

- [ ] **Step 5: Commit and push**

Commit message:

```bash
git add backend/app/services/feedback_optimization_intelligence.py backend/app/domain/schemas.py backend/app/workbench/schemas.py backend/app/services/precedent_intelligence.py backend/app/services/workbench.py backend/tests/test_mvp_slice.py frontend/src/lib/types.ts frontend/src/lib/precedent-reference.ts frontend/src/lib/precedent-review.ts frontend/src/components/history-page-panel.tsx frontend/tests/intake-progress.test.mjs docs/00_product_definition_and_current_state.md docs/01_runtime_architecture_and_data_contracts.md docs/03_workbench_ux_and_page_spec.md docs/04_qa_matrix.md docs/superpowers/specs/2026-04-05-feedback-optimization-signals-v1-design.md docs/superpowers/plans/2026-04-05-feedback-optimization-signals-v1.md
git commit -m "feat: add feedback optimization signals"
git push origin codex/baseline-sync-and-sparse-diagnostic
```
