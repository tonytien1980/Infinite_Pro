# Shared Intelligence Governance Recommendation V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 讓 precedent review lane 開始根據 shared-intelligence 訊號，正式回出低噪音治理建議與建議動作排序。

**Architecture:** backend 在 precedent intelligence 上新增 `governance_recommendation` helper，根據 candidate status 與 shared-intelligence signal 收斂出 promote / keep / demote / dismiss 類建議；再把它帶進 precedent review read model。frontend 則只調整既有 candidate action helper 與 history lane 顯示，不新增新頁面。

**Tech Stack:** Python, FastAPI, SQLAlchemy, Next.js, TypeScript, pytest, node:test

---

### Task 1: Add failing tests for governance recommendation

**Files:**
- Modify: `backend/tests/test_mvp_slice.py`
- Modify: `frontend/tests/intake-progress.test.mjs`

- [ ] **Step 1: Add backend failing tests**

覆蓋：
- helper returns promote for shared upweighted candidate
- helper returns dismiss for downweighted promoted candidate
- precedent review JSON exposes governance recommendation

- [ ] **Step 2: Run backend tests to verify failure**

Run: `PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -q -k "governance_recommendation"`

- [ ] **Step 3: Add frontend failing tests**

覆蓋：
- candidate action helper surfaces governance summary
- recommended action is sorted first

- [ ] **Step 4: Run frontend tests to verify failure**

Run: `cd frontend && node --test tests/intake-progress.test.mjs`

### Task 2: Implement backend governance recommendation

**Files:**
- Modify: `backend/app/domain/schemas.py`
- Modify: `backend/app/workbench/schemas.py`
- Modify: `backend/app/services/precedent_intelligence.py`
- Modify: `backend/app/services/workbench.py`

- [ ] **Step 1: Add schema**

新增 `PrecedentGovernanceRecommendationRead`。

- [ ] **Step 2: Add helper**

從 candidate status 與 shared-intelligence signal 收斂治理建議。

- [ ] **Step 3: Wire to review lane**

讓 precedent review item 正式帶出 `governance_recommendation`。

- [ ] **Step 4: Re-run targeted backend tests**

Run: `PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -q -k "governance_recommendation"`

### Task 3: Implement low-noise frontend readback

**Files:**
- Modify: `frontend/src/lib/types.ts`
- Modify: `frontend/src/lib/precedent-candidates.ts`
- Modify: `frontend/src/components/history-page-panel.tsx`

- [ ] **Step 1: Extend types**

加入 `governance_recommendation` 型別。

- [ ] **Step 2: Update helper**

讓 action helper 回出：
- `governanceSummary`
- recommended action first ordering

- [ ] **Step 3: Show low-noise summary in history lane**

只顯示一行 `治理建議：...`，不新增 page family。

- [ ] **Step 4: Re-run frontend tests**

Run: `cd frontend && node --test tests/intake-progress.test.mjs`

### Task 4: Sync active docs and QA

**Files:**
- Modify: `docs/00_product_definition_and_current_state.md`
- Modify: `docs/01_runtime_architecture_and_data_contracts.md`
- Modify: `docs/03_workbench_ux_and_page_spec.md`
- Modify: `docs/04_qa_matrix.md`
- Create: `docs/superpowers/specs/2026-04-05-shared-intelligence-governance-recommendation-v1-design.md`
- Create: `docs/superpowers/plans/2026-04-05-shared-intelligence-governance-recommendation-v1.md`

- [ ] **Step 1: Update docs**

把治理建議的角色、邊界與 UI disclosure 寫清楚。

- [ ] **Step 2: Add QA evidence**

把 compile / tests / build / typecheck 補進 QA matrix。

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
git add backend/app/domain/schemas.py backend/app/workbench/schemas.py backend/app/services/precedent_intelligence.py backend/app/services/workbench.py backend/tests/test_mvp_slice.py frontend/src/lib/types.ts frontend/src/lib/precedent-candidates.ts frontend/src/components/history-page-panel.tsx frontend/tests/intake-progress.test.mjs docs/00_product_definition_and_current_state.md docs/01_runtime_architecture_and_data_contracts.md docs/03_workbench_ux_and_page_spec.md docs/04_qa_matrix.md docs/superpowers/specs/2026-04-05-shared-intelligence-governance-recommendation-v1-design.md docs/superpowers/plans/2026-04-05-shared-intelligence-governance-recommendation-v1.md
git commit -m "feat: add governance recommendations for precedent review"
git push origin codex/baseline-sync-and-sparse-diagnostic
```
