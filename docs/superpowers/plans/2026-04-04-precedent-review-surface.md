# Precedent Review Surface Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在既有 `/history` 工作面補上一條 precedent review lane，讓顧問可以集中回看與篩選 precedent candidates，而不新增 precedent 新頁面。

**Architecture:** 新增 focused precedent list API 與 frontend history panel 內的 precedent review section。維持同頁雙 lane：task history 與 precedent review 並存，但不互相取代。

**Tech Stack:** FastAPI, SQLAlchemy, Pydantic, Next.js App Router, TypeScript

---

### Task 1: Lock review-surface contract with failing tests

**Files:**
- Modify: `backend/tests/test_mvp_slice.py`
- Modify: `frontend/tests/intake-progress.test.mjs`

- [ ] 補 backend failing test：
  - precedent list API 可回 candidate / promoted / dismissed
  - list row 帶 matter / task / source label
- [ ] 補 frontend failing test：
  - history precedent filter view 能正確過濾狀態與類型

### Task 2: Add focused precedent list endpoint

**Files:**
- Modify: `backend/app/domain/schemas.py`
- Modify: `backend/app/services/tasks.py`
- Modify: `backend/app/api/routes/workbench.py` or add a focused route in the existing workbench family

- [ ] 定義 precedent review row schema。
- [ ] 補集中查詢 service。
- [ ] 補 precedent list route。

### Task 3: Add history-panel precedent section

**Files:**
- Modify: `frontend/src/lib/types.ts`
- Modify: `frontend/src/lib/api.ts`
- Create or Modify: `frontend/src/lib/precedent-review.ts`
- Modify: `frontend/src/components/history-page-panel.tsx`

- [ ] 前端拉 precedent review list。
- [ ] 加 status / type filter。
- [ ] 在 `/history` 中加 precedents panel，不取代原本 history list。

### Task 4: Reuse governance actions in review surface

**Files:**
- Modify: `frontend/src/components/history-page-panel.tsx`
- Reuse: `frontend/src/lib/precedent-candidates.ts`
- Reuse: existing precedent governance APIs

- [ ] precedent list item 可直接升格 / 降回 / 停用 / 恢復。
- [ ] action 後 list 與 filter 會重新整理。

### Task 5: Sync docs and QA

**Files:**
- Modify: `docs/00_product_definition_and_current_state.md`
- Modify: `docs/03_workbench_ux_and_page_spec.md`
- Modify: `docs/04_qa_matrix.md`

- [ ] 把 precedent review surface 正式寫進 active docs。
- [ ] 補本機 smoke 證據。

### Task 6: Verify and ship

**Files:**
- Modify: none expected

- [ ] Run: `python3 -m compileall backend/app`
- [ ] Run: `PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -q`
- [ ] Run: `cd frontend && node --test tests/intake-progress.test.mjs`
- [ ] Run: `cd frontend && npm run build`
- [ ] Run: `cd frontend && rm -f .next/cache/.tsbuildinfo && npx next typegen && npm run typecheck`
- [ ] Run: `git diff --check`
- [ ] Commit and push
