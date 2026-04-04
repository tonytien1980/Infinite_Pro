# Deliverable Templates V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 讓 Host 與 workbench 先具備第一版 `deliverable_template_guidance`，低噪音回答這份交付物比較適合沿用哪一型模板主線。

**Architecture:** backend 建立 `deliverable_template_guidance` read model，從 precedent deliverable patterns、pack deliverable presets、deliverable shape guidance、domain playbook guidance 與 task heuristics 收斂少量 template guidance，再把 prompt-safe `deliverable_template_context` 帶進 model-router request。frontend 只在 `task detail` 與 `deliverable workspace` 做 second-layer reading。

**Tech Stack:** Python, FastAPI, SQLAlchemy, Next.js, TypeScript, node:test, pytest

---

### Task 1: Add failing tests for deliverable templates v1

**Files:**
- Modify: `backend/tests/test_mvp_slice.py`
- Modify: `frontend/tests/intake-progress.test.mjs`

- [ ] **Step 1: Add backend failing tests**

覆蓋：
- task aggregate returns `deliverable_template_guidance`
- Host payload includes deliverable-template context
- contract-review prompt includes deliverable-template block

- [ ] **Step 2: Run backend tests to verify failure**

Run: `PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -q -k "deliverable_template"`

- [ ] **Step 3: Add frontend failing tests**

覆蓋：
- helper keeps deliverable-template reading low-noise and consultant-readable

- [ ] **Step 4: Run frontend tests to verify failure**

Run: `cd frontend && node --test tests/intake-progress.test.mjs`

### Task 2: Implement backend deliverable template guidance

**Files:**
- Create: `backend/app/services/deliverable_template_intelligence.py`
- Modify: `backend/app/domain/schemas.py`
- Modify: `backend/app/services/tasks.py`
- Modify: `backend/app/agents/base.py`
- Modify: `backend/app/model_router/base.py`
- Modify: `backend/app/model_router/structured_tasks.py`
- Modify: affected core/specialist agent request wiring if needed

- [ ] **Step 1: Add read model**

新增 `DeliverableTemplateGuidanceRead` 與 template block schema。

- [ ] **Step 2: Build Host-owned template synthesis**

從 precedent / pack / shape / playbook / heuristic 收斂：
- template label
- fit summary
- core sections
- optional sections
- 2 到 4 個 template blocks

- [ ] **Step 3: Add prompt-safe context**

把 `deliverable_template_context` 帶進 request payload。

- [ ] **Step 4: Run backend tests**

Run: `PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -q -k "deliverable_template"`

### Task 3: Add low-noise frontend reading

**Files:**
- Create: `frontend/src/lib/deliverable-templates.ts`
- Modify: `frontend/src/lib/types.ts`
- Modify: `frontend/src/components/task-detail-panel.tsx`
- Modify: `frontend/src/components/deliverable-workspace-panel.tsx`

- [ ] **Step 1: Add helper**

把 deliverable template guidance 讀成 consultant-readable second-layer view。

- [ ] **Step 2: Task detail readback**

在 task detail 補低噪音 template 區塊。

- [ ] **Step 3: Deliverable workspace readback**

在 deliverable workspace 補更輕的第二層 template 回讀。

- [ ] **Step 4: Run frontend tests**

Run: `cd frontend && node --test tests/intake-progress.test.mjs`

### Task 4: Sync active docs

**Files:**
- Modify: `docs/00_product_definition_and_current_state.md`
- Modify: `docs/01_runtime_architecture_and_data_contracts.md`
- Modify: `docs/02_host_agents_packs_and_extension_system.md`
- Modify: `docs/03_workbench_ux_and_page_spec.md`
- Modify: `docs/04_qa_matrix.md`

- [ ] **Step 1: Update docs**

把 deliverable templates v1 的目的、邊界、Host ownership 與 UI disclosure 補清楚。

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
git add backend/app/services/deliverable_template_intelligence.py backend/app/domain/schemas.py backend/app/services/tasks.py backend/app/agents/base.py backend/app/model_router/base.py backend/app/model_router/structured_tasks.py frontend/src/lib/deliverable-templates.ts frontend/src/lib/types.ts frontend/src/components/task-detail-panel.tsx frontend/src/components/deliverable-workspace-panel.tsx backend/tests/test_mvp_slice.py frontend/tests/intake-progress.test.mjs docs/00_product_definition_and_current_state.md docs/01_runtime_architecture_and_data_contracts.md docs/02_host_agents_packs_and_extension_system.md docs/03_workbench_ux_and_page_spec.md docs/04_qa_matrix.md docs/superpowers/specs/2026-04-05-deliverable-templates-v1-design.md docs/superpowers/plans/2026-04-05-deliverable-templates-v1.md
git commit -m "feat: add deliverable template guidance"
git push origin codex/baseline-sync-and-sparse-diagnostic
```
