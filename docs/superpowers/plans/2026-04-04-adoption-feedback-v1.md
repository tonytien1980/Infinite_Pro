# Adoption Feedback V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不增加主線負擔的前提下，把 adoption feedback 升級成 `status + quick-reply primary reason + optional short note` 的正式 v1。

**Architecture:** backend 先把 `AdoptionFeedback` contract 升級為 `feedback_status + reason_codes + note`，並沿用現有 incremental schema patch；frontend 則保留 one-click status，再在既有 adoption-feedback 區塊內補第二拍 reason chips 與收合式 note。precedent candidate 邏輯只做輕量 fallback 改良，不擴大治理範圍。

**Tech Stack:** Python, FastAPI, SQLAlchemy, Next.js, TypeScript, node:test, pytest

---

### Task 1: Add failing tests for structured feedback v1

**Files:**
- Modify: `backend/tests/test_mvp_slice.py`
- Modify: `frontend/tests/intake-progress.test.mjs`

- [ ] **Step 1: Add backend failing tests**

新增測試覆蓋：
- feedback API 會回 `reason_codes`
- precedence fallback reusable reason 會優先使用 reason label
- status change 會清空不相容的 `reason_codes`

- [ ] **Step 2: Run backend tests to verify failure**

Run: `PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -q`

- [ ] **Step 3: Add frontend failing tests**

新增 helper 測試覆蓋：
- reason options 依 object type + status 正確出現
- current feedback view 可讀出 primary reason label

- [ ] **Step 4: Run frontend tests to verify failure**

Run: `cd frontend && node --test tests/intake-progress.test.mjs`

### Task 2: Extend backend adoption feedback contract

**Files:**
- Modify: `backend/app/domain/models.py`
- Modify: `backend/app/domain/schemas.py`
- Modify: `backend/app/core/database.py`
- Modify: `backend/app/services/tasks.py`

- [ ] **Step 1: Add incremental column / contract**

新增 `adoption_feedback.reason_codes` JSON column，並更新 request / read schema。

- [ ] **Step 2: Implement write-path rules**

在 deliverable / recommendation feedback write path 中：
- 寫入 `reason_codes`
- status changed 時清空舊 reason codes
- 仍保留 optional note

- [ ] **Step 3: Improve reusable_reason fallback**

若 note 為空但有 reason code，candidate seed 先用 reason label 當 fallback reusable reason。

- [ ] **Step 4: Run backend tests**

Run: `PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -q`

### Task 3: Add low-noise reason-chip UX

**Files:**
- Modify: `frontend/src/lib/types.ts`
- Modify: `frontend/src/lib/adoption-feedback.ts`
- Modify: `frontend/src/components/deliverable-workspace-panel.tsx`
- Modify: `frontend/src/components/task-detail-panel.tsx`

- [ ] **Step 1: Add helper layer**

在 `adoption-feedback.ts` 補：
- status-specific reason catalogs
- object-type aware reason lookup
- current primary-reason summary

- [ ] **Step 2: Add deliverable feedback v1 UI**

保留現有四個 status button，並在已選 status 後補：
- `補一個主要原因` chips
- `補一句` 收合輸入

- [ ] **Step 3: Add recommendation feedback v1 UI**

沿用同樣 interaction pattern，避免兩邊長得不一樣。

- [ ] **Step 4: Run frontend tests**

Run: `cd frontend && node --test tests/intake-progress.test.mjs`

### Task 4: Sync active docs

**Files:**
- Modify: `docs/01_runtime_architecture_and_data_contracts.md`
- Modify: `docs/03_workbench_ux_and_page_spec.md`
- Modify: `docs/04_qa_matrix.md`

- [ ] **Step 1: Update runtime contract doc**

把 V1 feedback contract、status / reason / note 規則寫清楚。

- [ ] **Step 2: Update workbench UX doc**

把 one-click first tap、reason chips second tap、optional note third layer 的規則寫清楚。

- [ ] **Step 3: Add only fresh QA evidence**

把這輪 compile / tests / build / typecheck 寫進 QA matrix。

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
git add backend/app/domain/models.py backend/app/domain/schemas.py backend/app/core/database.py backend/app/services/tasks.py backend/tests/test_mvp_slice.py frontend/src/lib/types.ts frontend/src/lib/adoption-feedback.ts frontend/src/components/deliverable-workspace-panel.tsx frontend/src/components/task-detail-panel.tsx frontend/tests/intake-progress.test.mjs docs/01_runtime_architecture_and_data_contracts.md docs/03_workbench_ux_and_page_spec.md docs/04_qa_matrix.md docs/superpowers/specs/2026-04-04-adoption-feedback-v1-design.md docs/superpowers/plans/2026-04-04-adoption-feedback-v1.md
git commit -m "feat: deepen adoption feedback v1"
git push origin codex/baseline-sync-and-sparse-diagnostic
```
