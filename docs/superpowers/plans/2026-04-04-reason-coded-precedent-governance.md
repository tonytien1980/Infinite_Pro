# Reason-Coded Precedent Governance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 讓 `reason_codes` 正式進入 precedent review 與 Host-safe reference，讓 precedent 不只知道「有沒有被採納」，也知道「為什麼被採納」。

**Architecture:** backend 先把 `source_feedback_reason_codes` 帶進 precedent candidate 與 read models，再把 reason-aware priority / recommended uses / safe-use note 接進 precedent intelligence；frontend 只低噪音回讀 primary reason，不新增頁面或複雜操作。

**Tech Stack:** Python, FastAPI, SQLAlchemy, Next.js, TypeScript, node:test, pytest

---

### Task 1: Add failing tests for reason-coded precedent behavior

**Files:**
- Modify: `backend/tests/test_mvp_slice.py`
- Modify: `frontend/tests/intake-progress.test.mjs`

- [ ] **Step 1: Add backend failing tests**

覆蓋：
- precedent review state 會回 `primary_reason_label`
- review priority reason 會吃到 human reason
- Host-safe precedent reference 的 `recommended_uses` / `safe_use_note` 會吃到 human reason

- [ ] **Step 2: Run backend tests to verify failure**

Run: `PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -q`

- [ ] **Step 3: Add frontend failing tests**

覆蓋：
- precedent review priority view remains consultant-readable with reason-coded copy
- precedent reference view remains low-noise while surfacing reason-aware usage

- [ ] **Step 4: Run frontend tests to verify failure**

Run: `cd frontend && node --test tests/intake-progress.test.mjs`

### Task 2: Persist reason-coded source signal on candidate

**Files:**
- Modify: `backend/app/domain/models.py`
- Modify: `backend/app/domain/schemas.py`
- Modify: `backend/app/core/database.py`
- Modify: `backend/app/services/tasks.py`

- [ ] **Step 1: Add candidate field**

新增 `source_feedback_reason_codes` 到 precedent candidate。

- [ ] **Step 2: Sync candidate seed / updates**

當 feedback sync precedent candidate 時，把 normalized reason codes 寫進 candidate。

- [ ] **Step 3: Run backend tests**

Run: `PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -q`

### Task 3: Make precedent intelligence reason-aware

**Files:**
- Modify: `backend/app/services/precedent_intelligence.py`
- Modify: `backend/app/services/workbench.py`
- Modify: `backend/app/workbench/schemas.py`
- Modify: `frontend/src/lib/types.ts`
- Modify: `frontend/src/lib/precedent-review.ts`
- Modify: `frontend/src/lib/precedent-reference.ts`
- Modify: `frontend/src/components/history-page-panel.tsx`

- [ ] **Step 1: Add reason-aware helpers**

在 precedent intelligence 中補：
- reason label extraction
- reason-aware review-priority wording
- reason-aware safe-use note
- reason-aware recommended uses

- [ ] **Step 2: Extend read models**

補上：
- `primary_reason_label`
- `source_feedback_reason_labels`

- [ ] **Step 3: Low-noise UI readback**

history 與 precedent reference 只低噪音露出主要原因與更精準用途，不新增操作。

- [ ] **Step 4: Run frontend tests**

Run: `cd frontend && node --test tests/intake-progress.test.mjs`

### Task 4: Sync active docs

**Files:**
- Modify: `docs/00_product_definition_and_current_state.md`
- Modify: `docs/01_runtime_architecture_and_data_contracts.md`
- Modify: `docs/03_workbench_ux_and_page_spec.md`
- Modify: `docs/04_qa_matrix.md`

- [ ] **Step 1: Update product/runtime docs**

寫清楚 reason-coded precedent governance 的目的與邊界。

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
git add backend/app/domain/models.py backend/app/domain/schemas.py backend/app/core/database.py backend/app/services/tasks.py backend/app/services/precedent_intelligence.py backend/app/services/workbench.py backend/app/workbench/schemas.py backend/tests/test_mvp_slice.py frontend/src/lib/types.ts frontend/src/lib/precedent-review.ts frontend/src/lib/precedent-reference.ts frontend/src/components/history-page-panel.tsx frontend/tests/intake-progress.test.mjs docs/00_product_definition_and_current_state.md docs/01_runtime_architecture_and_data_contracts.md docs/03_workbench_ux_and_page_spec.md docs/04_qa_matrix.md docs/superpowers/specs/2026-04-04-reason-coded-precedent-governance-design.md docs/superpowers/plans/2026-04-04-reason-coded-precedent-governance.md
git commit -m "feat: add reason-coded precedent governance"
git push origin codex/baseline-sync-and-sparse-diagnostic
```
