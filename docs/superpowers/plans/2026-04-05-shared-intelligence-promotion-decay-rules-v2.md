# Shared Intelligence Promotion / Decay Rules V2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 讓 precedent candidate 在 feedback 更新後保留 lifecycle，而不是被粗暴刪除或重設。

**Architecture:** backend 仍沿用既有 adoption feedback 與 precedent candidate 邊界，但在 feedback sync 階段引入更成熟的 next-status 規則：新 positive feedback 不重設已升格模式，negative feedback 對既有模式走 decay / dismiss，dismissed 之後收到新的正向 feedback 可恢復回 candidate。

**Tech Stack:** Python, FastAPI, SQLAlchemy, pytest

---

### Task 1: Add failing lifecycle tests

**Files:**
- Modify: `backend/tests/test_mvp_slice.py`

- [ ] **Step 1: Add failing tests**

覆蓋：
- candidate 遇到 `not_adopted` 不再被刪除
- promoted 遇到 `not_adopted` 先 decay 回 candidate
- dismissed 遇到新的正向 feedback 可恢復回 candidate
- promoted 遇到新的正向 feedback 不被重設

- [ ] **Step 2: Run targeted tests to verify red state**

Run:
`PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -q -k "candidate_is_dismissed_instead_of_deleted_when_feedback_becomes_not_adopted or promoted_precedent_decays_to_candidate_when_feedback_becomes_not_adopted or dismissed_precedent_restores_to_candidate_when_positive_feedback_returns or promoted_precedent_keeps_status_when_feedback_stays_positive"`

### Task 2: Implement feedback-linked lifecycle preservation

**Files:**
- Modify: `backend/app/services/tasks.py`

- [ ] **Step 1: Add next-status helper**

把 feedback-driven lifecycle 規則集中成一個 helper，避免 `_sync_precedent_candidate_for_feedback(...)` 內再次散落 if/else。

- [ ] **Step 2: Preserve candidate rows**

移除既有 `not_adopted` 對 existing candidate 的 hard delete。

- [ ] **Step 3: Preserve promoted status on qualifying feedback**

避免 `promoted` 因新的正向 feedback 被 reset 成 `candidate`。

- [ ] **Step 4: Update attribution on lifecycle-changing feedback**

若 feedback 實際改變 candidate status，且有 `operator_label`，則更新 `last_status_changed_by_label`。

- [ ] **Step 5: Re-run targeted tests**

Run the same targeted pytest command and confirm green。

### Task 3: Sync active docs

**Files:**
- Modify: `docs/00_product_definition_and_current_state.md`
- Modify: `docs/01_runtime_architecture_and_data_contracts.md`
- Modify: `docs/03_workbench_ux_and_page_spec.md`
- Create: `docs/superpowers/specs/2026-04-05-shared-intelligence-promotion-decay-rules-v2-design.md`
- Create: `docs/superpowers/plans/2026-04-05-shared-intelligence-promotion-decay-rules-v2.md`

- [ ] **Step 1: Update product/current-state wording**

把 lifecycle preservation / decay v2 寫進 precedent / reusable intelligence 現況。

- [ ] **Step 2: Update runtime contract**

把 feedback-driven next-status 規則寫清楚。

- [ ] **Step 3: Update workbench disclosure rule**

把 `candidate / promoted / dismissed` 在 feedback 更新後的低噪音 surface 行為寫清楚。

### Task 4: Full verification and QA sync

**Files:**
- Modify: `docs/04_qa_matrix.md`

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

- [ ] **Step 5: Append QA evidence**

把 compile / pytest / node:test / build / typecheck evidence 寫進 `docs/04_qa_matrix.md`。
