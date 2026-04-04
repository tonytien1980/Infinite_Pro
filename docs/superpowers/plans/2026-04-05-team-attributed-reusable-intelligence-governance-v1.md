# Team-Attributed Reusable Intelligence Governance V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 讓 precedent / reusable intelligence 開始知道是誰標記 feedback、誰建立 candidate、誰做最近一次治理動作，同時保持單人使用低噪音。

**Architecture:** frontend 以 browser-local `operator identity` 收集本機顧問署名，再把它作為 action metadata 帶進 adoption feedback 與 precedent governance request。backend 僅保存 attribution 結果，不引入 auth / RBAC / multi-user shell。

**Tech Stack:** Python, FastAPI, SQLAlchemy, Next.js, TypeScript, node:test, pytest

---

### Task 1: Add failing tests for team-attributed governance

**Files:**
- Modify: `backend/tests/test_mvp_slice.py`
- Modify: `frontend/tests/intake-progress.test.mjs`

- [ ] **Step 1: Add backend failing tests**

覆蓋：
- feedback stores operator label
- precedent candidate stores creation / governance attribution
- precedent review read model returns attribution

- [ ] **Step 2: Run backend tests to verify failure**

Run: `PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -q -k "team_attributed"`

- [ ] **Step 3: Add frontend failing tests**

覆蓋：
- adoption feedback helper exposes low-noise operator attribution
- precedent candidate / review helper expose low-noise attribution copy

- [ ] **Step 4: Run frontend tests to verify failure**

Run: `cd frontend && node --test tests/intake-progress.test.mjs`

### Task 2: Implement backend attribution contracts

**Files:**
- Modify: `backend/app/domain/models.py`
- Modify: `backend/app/core/database.py`
- Modify: `backend/app/domain/schemas.py`
- Modify: `backend/app/workbench/schemas.py`
- Modify: `backend/app/services/tasks.py`
- Modify: `backend/app/services/workbench.py`

- [ ] **Step 1: Add schema fields**

新增：
- `AdoptionFeedback.operator_label`
- `PrecedentCandidate.source_feedback_operator_label`
- `PrecedentCandidate.created_by_label`
- `PrecedentCandidate.last_status_changed_by_label`

- [ ] **Step 2: Wire write paths**

讓 feedback request 與 candidate status request 都能接受 `operator_label`。

- [ ] **Step 3: Wire read paths**

讓 deliverable / recommendation / precedent review 都能讀回 attribution。

- [ ] **Step 4: Run backend tests**

Run: `PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -q -k "team_attributed"`

### Task 3: Add browser-local operator identity and low-noise UI

**Files:**
- Modify: `frontend/src/lib/types.ts`
- Modify: `frontend/src/lib/workbench-store.ts`
- Create: `frontend/src/lib/operator-identity.ts`
- Modify: `frontend/src/lib/adoption-feedback.ts`
- Modify: `frontend/src/lib/precedent-candidates.ts`
- Modify: `frontend/src/lib/precedent-review.ts`
- Modify: `frontend/src/components/settings-page-panel.tsx`
- Modify: `frontend/src/components/task-detail-panel.tsx`
- Modify: `frontend/src/components/deliverable-workspace-panel.tsx`
- Modify: `frontend/src/components/history-page-panel.tsx`

- [ ] **Step 1: Add browser-local operator identity**

只保存在本機瀏覽器，不走正式 auth。

- [ ] **Step 2: Forward operator label on actions**

feedback / candidate governance action 都自動帶出 `operator_label`。

- [ ] **Step 3: Keep UI low-noise**

只補：
- `由 XXX 標記`
- `採納：XXX`
- `最近治理：YYY`

- [ ] **Step 4: Run frontend tests**

Run: `cd frontend && node --test tests/intake-progress.test.mjs`

### Task 4: Sync active docs

**Files:**
- Modify: `docs/00_product_definition_and_current_state.md`
- Modify: `docs/01_runtime_architecture_and_data_contracts.md`
- Modify: `docs/03_workbench_ux_and_page_spec.md`
- Modify: `docs/04_qa_matrix.md`

- [ ] **Step 1: Update docs**

把：
- browser-local operator identity
- attribution vs reason vs optimization signal
- low-noise UI posture

寫清楚。

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
git add backend/app/domain/models.py backend/app/core/database.py backend/app/domain/schemas.py backend/app/workbench/schemas.py backend/app/services/tasks.py backend/app/services/workbench.py backend/tests/test_mvp_slice.py frontend/src/lib/types.ts frontend/src/lib/workbench-store.ts frontend/src/lib/operator-identity.ts frontend/src/lib/adoption-feedback.ts frontend/src/lib/precedent-candidates.ts frontend/src/lib/precedent-review.ts frontend/src/components/settings-page-panel.tsx frontend/src/components/task-detail-panel.tsx frontend/src/components/deliverable-workspace-panel.tsx frontend/src/components/history-page-panel.tsx frontend/tests/intake-progress.test.mjs docs/00_product_definition_and_current_state.md docs/01_runtime_architecture_and_data_contracts.md docs/03_workbench_ux_and_page_spec.md docs/04_qa_matrix.md docs/superpowers/specs/2026-04-05-team-attributed-reusable-intelligence-governance-v1-design.md docs/superpowers/plans/2026-04-05-team-attributed-reusable-intelligence-governance-v1.md
git commit -m "feat: add team-attributed reusable intelligence governance"
git push origin codex/baseline-sync-and-sparse-diagnostic
```
