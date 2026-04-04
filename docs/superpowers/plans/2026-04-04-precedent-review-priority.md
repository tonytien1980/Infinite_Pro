# Precedent Review Priority Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 讓 `/history` 裡的 precedent review lane 具備輕量、可解釋的建議排序，幫顧問先看最值得回看的候選。

**Architecture:** 在 backend precedent review read model 產生統一的 `review_priority` 與 `review_priority_reason`，由 frontend 低噪音讀出標籤與理由，不新增新頁面、不加入黑箱分數。

**Tech Stack:** FastAPI, SQLAlchemy, Pydantic, Next.js App Router, TypeScript

---

### Task 1: Lock priority contract with failing tests

**Files:**
- Modify: `backend/tests/test_mvp_slice.py`
- Modify: `frontend/tests/intake-progress.test.mjs`

- [ ] 補 backend failing test：
  - precedent review list 會回 `review_priority`
  - list 會依 priority 與更新時間排序
- [ ] 補 frontend failing test：
  - precedent priority helper 會輸出穩定的顧問語言標籤與理由

### Task 2: Add backend review priority read model

**Files:**
- Modify: `backend/app/workbench/schemas.py`
- Modify: `backend/app/services/workbench.py`

- [ ] 在 schema 加上 priority fields。
- [ ] 在 precedent review service 計算 `high / medium / low`。
- [ ] 讓集中 list API 預設按建議順序回傳。
- [ ] 在 summary 加上 priority counts。

### Task 3: Read priority in history UI

**Files:**
- Modify: `frontend/src/lib/types.ts`
- Modify: `frontend/src/lib/precedent-review.ts`
- Modify: `frontend/src/components/history-page-panel.tsx`

- [ ] 新增 precedent priority view helper。
- [ ] `/history` summary 補上「建議先回看」數量。
- [ ] precedent item 顯示 priority label 與 priority reason。

### Task 4: Sync active docs

**Files:**
- Modify: `docs/00_product_definition_and_current_state.md`
- Modify: `docs/01_runtime_architecture_and_data_contracts.md`
- Modify: `docs/03_workbench_ux_and_page_spec.md`
- Modify: `docs/04_qa_matrix.md`

- [ ] 補 precedent review priority 的正式定位。
- [ ] 補 runtime contract 與 UI disclosure 規則。
- [ ] 補本機驗證證據。

### Task 5: Verify and ship

**Files:**
- Modify: none expected

- [ ] Run: `python3 -m compileall backend/app`
- [ ] Run: `PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -q`
- [ ] Run: `cd frontend && node --test tests/intake-progress.test.mjs`
- [ ] Run: `cd frontend && npm run build`
- [ ] Run: `cd frontend && rm -f .next/cache/.tsbuildinfo && npx next typegen && npm run typecheck`
- [ ] Run: `git diff --check`
- [ ] Commit and push
