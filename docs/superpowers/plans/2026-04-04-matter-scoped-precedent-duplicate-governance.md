# Matter-Scoped Precedent Duplicate Governance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在既有 precedent review family 裡補上同案 duplicate governance，先把重複候選整理乾淨，並讓 Host reference 預設去重。

**Architecture:** backend 新增 matter-scoped precedent duplicate contract 與 persistence review row；`/history` precedent review lane 補低噪音 duplicate review list；Host-safe precedent reference consult duplicate review status，避免重複模式進模型。

**Tech Stack:** FastAPI, SQLAlchemy, Pydantic, Next.js App Router, TypeScript

---

### Task 1: Lock duplicate-governance behavior with failing tests

**Files:**
- Modify: `backend/tests/test_mvp_slice.py`
- Modify: `frontend/tests/intake-progress.test.mjs`

- [ ] 補 backend failing test：
  - same matter duplicate candidates appear in precedent review response
  - summary shows pending duplicate review count
- [ ] 補 backend failing test：
  - unresolved duplicate group collapses to one Host reference candidate
  - `keep_separate` preserves all matched candidates
- [ ] 補 frontend failing test：
  - duplicate governance helper stays consultant-readable

### Task 2: Add precedent duplicate contracts and persistence

**Files:**
- Modify: `backend/app/domain/models.py`
- Modify: `backend/app/domain/schemas.py`
- Create: `backend/app/services/precedent_duplicate_governance.py`

- [ ] 新增 matter-scoped precedent duplicate review row。
- [ ] 定義 duplicate summary / candidate / review request schema。
- [ ] 實作 duplicate grouping與 default representative selection。

### Task 3: Integrate duplicate governance into review surface and Host reference

**Files:**
- Modify: `backend/app/services/workbench.py`
- Modify: `backend/app/workbench/schemas.py`
- Modify: `backend/app/api/routes/workbench.py`
- Modify: `backend/app/services/precedent_intelligence.py`
- Modify: `backend/app/services/tasks.py`

- [ ] `/workbench/precedent-candidates` 補 duplicate summary / groups。
- [ ] 補 duplicate review update route。
- [ ] Host-safe precedent reference consult duplicate review state。

### Task 4: Add low-noise `/history` duplicate review UI

**Files:**
- Modify: `frontend/src/lib/types.ts`
- Create or Modify: `frontend/src/lib/precedent-duplicates.ts`
- Modify: `frontend/src/lib/api.ts`
- Modify: `frontend/src/components/history-page-panel.tsx`

- [ ] precedents history lane 補 duplicate summary。
- [ ] 補 duplicate review list 與 item-level actions。
- [ ] action 後會 refresh current review state。

### Task 5: Sync active docs and QA

**Files:**
- Modify: `docs/00_product_definition_and_current_state.md`
- Modify: `docs/01_runtime_architecture_and_data_contracts.md`
- Modify: `docs/03_workbench_ux_and_page_spec.md`
- Modify: `docs/04_qa_matrix.md`

- [ ] 補 matter-scoped duplicate governance 的正式定位。
- [ ] 補 Host reference consult duplicate review 的規則。
- [ ] 補 `/history` 低噪音 duplicate review 規則。
- [ ] 補 live smoke evidence。

### Task 6: Verify and ship

**Files:**
- Modify: none expected

- [ ] Run: `python3 -m compileall backend/app`
- [ ] Run: `PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -q`
- [ ] Run: `cd frontend && node --test tests/intake-progress.test.mjs`
- [ ] Run: `cd frontend && npm run build`
- [ ] Run: `cd frontend && NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8010/api/v1 npm run build`
- [ ] Run: `cd frontend && rm -f .next/cache/.tsbuildinfo && npx next typegen && npm run typecheck`
- [ ] Run: `git diff --check`
- [ ] Commit and push
