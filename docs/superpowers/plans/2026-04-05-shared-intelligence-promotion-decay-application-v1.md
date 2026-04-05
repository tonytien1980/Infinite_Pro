# Shared Intelligence Promotion / Decay Application V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 讓 precedent review lane 的治理建議可以被顧問一鍵套用，但仍維持人工確認與低噪音。

**Architecture:** backend 在 workbench 增加一個 `apply-governance-recommendation` route，根據 candidate 當下的 governance recommendation 決定是否寫回 target status；frontend 則在 history precedent lane 上顯示 `套用建議` 按鈕。整體仍沿用既有 candidate status update 邊界，不做自動 mutation。

**Tech Stack:** Python, FastAPI, SQLAlchemy, Next.js, TypeScript, pytest, node:test

---

### Task 1: Add failing tests for application flow

**Files:**
- Modify: `backend/tests/test_mvp_slice.py`
- Modify: `frontend/tests/intake-progress.test.mjs`

- [ ] **Step 1: Add backend failing test**

覆蓋：
- apply route promotes a candidate when recommendation is `promote`

- [ ] **Step 2: Run backend test to verify failure**

Run: `PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -q -k "apply_governance_recommendation_promotes_candidate"`

- [ ] **Step 3: Add frontend failing test**

覆蓋：
- candidate action helper exposes a low-noise `recommendedAction`

- [ ] **Step 4: Run frontend tests to verify failure**

Run: `cd frontend && node --test tests/intake-progress.test.mjs`

### Task 2: Implement backend apply route

**Files:**
- Modify: `backend/app/workbench/schemas.py`
- Modify: `backend/app/services/workbench.py`
- Modify: `backend/app/api/routes/workbench.py`

- [ ] **Step 1: Add request schema**

新增 `PrecedentGovernanceApplyRequest`。

- [ ] **Step 2: Add service helper**

只有在 governance recommendation 屬於 `promote / demote / dismiss` 時才寫回 target status。

- [ ] **Step 3: Add API route**

`POST /workbench/precedent-candidates/{candidate_id}/apply-governance-recommendation`

- [ ] **Step 4: Re-run backend tests**

Run: `PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -q -k "apply_governance_recommendation_promotes_candidate or governance_recommendation"`

### Task 3: Implement frontend one-click apply

**Files:**
- Modify: `frontend/src/lib/types.ts`
- Modify: `frontend/src/lib/api.ts`
- Modify: `frontend/src/lib/precedent-candidates.ts`
- Modify: `frontend/src/components/history-page-panel.tsx`

- [ ] **Step 1: Add API payload**

新增 `PrecedentGovernanceApplyPayload`。

- [ ] **Step 2: Add API call**

新增 `applyPrecedentGovernanceRecommendation(...)`。

- [ ] **Step 3: Expose low-noise recommended action**

讓 candidate action helper 回出：
- `recommendedAction`

- [ ] **Step 4: Wire history UI**

顯示 `套用建議：...`，並在成功後 refresh precedent review lane。

- [ ] **Step 5: Re-run frontend tests**

Run: `cd frontend && node --test tests/intake-progress.test.mjs`

### Task 4: Sync docs and QA

**Files:**
- Modify: `docs/00_product_definition_and_current_state.md`
- Modify: `docs/01_runtime_architecture_and_data_contracts.md`
- Modify: `docs/03_workbench_ux_and_page_spec.md`
- Modify: `docs/04_qa_matrix.md`
- Create: `docs/superpowers/specs/2026-04-05-shared-intelligence-promotion-decay-application-v1-design.md`
- Create: `docs/superpowers/plans/2026-04-05-shared-intelligence-promotion-decay-application-v1.md`

- [ ] **Step 1: Update docs**

把 application v1 的邊界寫清楚：人工觸發、低噪音、非 auto mutation。

- [ ] **Step 2: Add QA evidence**

把 compile / tests / build / typecheck 寫進 QA matrix。

### Task 5: Full verification and git sync

**Files:**
- Modify: `git state only`

- [ ] **Step 1: Run compile**

Run: `python3 -m compileall backend/app`

- [ ] **Step 2: Run full backend tests**

Run: `PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -q`

- [ ] **Step 3: Run frontend helper tests**

Run: `cd frontend && node --test tests/intake-progress.test.mjs`

- [ ] **Step 4: Run builds and typecheck**

Run:
- `cd frontend && npm run build`
- `cd frontend && NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8010/api/v1 npm run build`
- `cd frontend && rm -f .next/cache/.tsbuildinfo && npx next typegen && npm run typecheck`

- [ ] **Step 5: Commit and push**

Commit message:

```bash
git add backend/app/workbench/schemas.py backend/app/services/workbench.py backend/app/api/routes/workbench.py backend/tests/test_mvp_slice.py frontend/src/lib/types.ts frontend/src/lib/api.ts frontend/src/lib/precedent-candidates.ts frontend/src/components/history-page-panel.tsx frontend/tests/intake-progress.test.mjs docs/00_product_definition_and_current_state.md docs/01_runtime_architecture_and_data_contracts.md docs/03_workbench_ux_and_page_spec.md docs/04_qa_matrix.md docs/superpowers/specs/2026-04-05-shared-intelligence-promotion-decay-application-v1-design.md docs/superpowers/plans/2026-04-05-shared-intelligence-promotion-decay-application-v1.md
git commit -m "feat: add one-click application for governance recommendations"
git push origin codex/baseline-sync-and-sparse-diagnostic
```
