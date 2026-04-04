# Deliverable Templates V2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 讓 deliverable templates 從 v1 的模板主線提示，升級成會明確回答這輪為何適用與來源組合，並正式吸收 deliverable shape 與 richer domain-playbook signals 的 shared-intelligence guidance。

**Architecture:** backend 在 `deliverable_template_guidance` 上新增 `fit_summary` / `source_mix_summary`，並允許 `deliverable_shape` 成為正式 block source。frontend 只在 task / deliverable second-layer disclosure 增加低噪音 readback，不新增模板殼。

**Tech Stack:** Python, FastAPI, Next.js, TypeScript, node:test, pytest

---

### Task 1: Add failing tests for deliverable templates v2

**Files:**
- Modify: `backend/tests/test_mvp_slice.py`
- Modify: `frontend/tests/intake-progress.test.mjs`

- [ ] **Step 1: Add backend failing tests**

覆蓋：
- deliverable template v2 returns `fit_summary` / `source_mix_summary`
- template blocks can include `deliverable_shape`
- prompt-safe template context includes those new lines

- [ ] **Step 2: Run backend tests to verify failure**

Run: `PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -q -k "deliverable_template_v2_uses_shape_and_source_mix or contract_review_spec_includes_deliverable_template_v2_lines"`

- [ ] **Step 3: Add frontend failing tests**

覆蓋：
- deliverable template helper reads `fitSummary` / `sourceMixSummary`
- shape-sourced block stays consultant-readable

- [ ] **Step 4: Run frontend tests to verify failure**

Run: `cd frontend && node --test tests/intake-progress.test.mjs`

### Task 2: Implement backend template v2

**Files:**
- Modify: `backend/app/domain/schemas.py`
- Modify: `backend/app/services/deliverable_template_intelligence.py`
- Modify: `backend/app/agents/base.py`

- [ ] **Step 1: Extend contract**

新增：
- `fit_summary`
- `source_mix_summary`
- `deliverable_shape` block source

- [ ] **Step 2: Add richer source absorption**

讓 template guidance 正式吸收：
- precedent
- pack preset
- deliverable shape
- domain playbook
- task heuristic

- [ ] **Step 3: Update prompt-safe payload**

讓 `deliverable_template_context` 正式帶：
- `這輪為何適用`
- `收斂依據`

- [ ] **Step 4: Run backend tests**

Run: `PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -q -k "deliverable_template_v2_uses_shape_and_source_mix or contract_review_spec_includes_deliverable_template_v2_lines"`

### Task 3: Add low-noise frontend readback

**Files:**
- Modify: `frontend/src/lib/types.ts`
- Modify: `frontend/src/lib/deliverable-templates.ts`
- Modify: `frontend/src/components/task-detail-panel.tsx`
- Modify: `frontend/src/components/deliverable-workspace-panel.tsx`

- [ ] **Step 1: Extend helper**

讀出：
- `fitSummary`
- `sourceMixSummary`

- [ ] **Step 2: Keep UI low-noise**

只補：
- `這輪為何適用`
- `收斂依據`

- [ ] **Step 3: Run frontend tests**

Run: `cd frontend && node --test tests/intake-progress.test.mjs`

### Task 4: Sync active docs

**Files:**
- Modify: `docs/00_product_definition_and_current_state.md`
- Modify: `docs/01_runtime_architecture_and_data_contracts.md`
- Modify: `docs/02_host_agents_packs_and_extension_system.md`
- Modify: `docs/03_workbench_ux_and_page_spec.md`
- Modify: `docs/04_qa_matrix.md`

- [ ] **Step 1: Update docs**

把：
- v2 role separation
- deliverable-shape absorption boundary
- low-noise UI readback

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
git add backend/app/domain/schemas.py backend/app/services/deliverable_template_intelligence.py backend/app/agents/base.py backend/tests/test_mvp_slice.py frontend/src/lib/types.ts frontend/src/lib/deliverable-templates.ts frontend/src/components/task-detail-panel.tsx frontend/src/components/deliverable-workspace-panel.tsx frontend/tests/intake-progress.test.mjs docs/00_product_definition_and_current_state.md docs/01_runtime_architecture_and_data_contracts.md docs/02_host_agents_packs_and_extension_system.md docs/03_workbench_ux_and_page_spec.md docs/04_qa_matrix.md docs/superpowers/specs/2026-04-05-deliverable-templates-v2-design.md docs/superpowers/plans/2026-04-05-deliverable-templates-v2.md
git commit -m "feat: deepen deliverable templates"
git push origin codex/baseline-sync-and-sparse-diagnostic
```
