# Precedent Candidate Governance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 為 precedent candidate pool 補上最小治理能力，讓候選可以被升格、降回候選或停用，且保持 consultant-first、低噪音。

**Architecture:** 在既有 `PrecedentCandidate` object 上新增狀態更新 path 與低噪音 UI action，不改 adoption feedback contract，不做 automatic retrieval。

**Tech Stack:** FastAPI, SQLAlchemy, Pydantic, Next.js App Router, TypeScript

---

### Task 1: Lock governance contract with failing tests

**Files:**
- Modify: `backend/tests/test_mvp_slice.py`
- Modify: `frontend/tests/intake-progress.test.mjs`

- [ ] 補 failing backend tests：
  - deliverable candidate 可升格成 `promoted`
  - promoted candidate 可降回 `candidate`
  - candidate 可改成 `dismissed`
- [ ] 補 failing frontend helper tests：
  - 三態文案與按鈕對應正確

### Task 2: Add backend governance endpoints

**Files:**
- Modify: `backend/app/domain/schemas.py`
- Modify: `backend/app/services/tasks.py`
- Modify: `backend/app/api/routes/deliverables.py`
- Modify: `backend/app/api/routes/tasks.py`

- [ ] 補 precedent candidate status update request schema。
- [ ] 補 deliverable / recommendation candidate status update service。
- [ ] 保持 `dismissed` 仍可回到 source surface，但不列入 matter summary。

### Task 3: Add frontend actions

**Files:**
- Modify: `frontend/src/lib/types.ts`
- Modify: `frontend/src/lib/api.ts`
- Modify: `frontend/src/lib/precedent-candidates.ts`
- Modify: `frontend/src/components/deliverable-workspace-panel.tsx`
- Modify: `frontend/src/components/task-detail-panel.tsx`

- [ ] 補 precedent governance API call。
- [ ] helper 回出三態 label 與 action。
- [ ] deliverable / recommendation UI 補上低噪音治理按鈕。

### Task 4: Sync docs and QA

**Files:**
- Modify: `docs/00_product_definition_and_current_state.md`
- Modify: `docs/01_runtime_architecture_and_data_contracts.md`
- Modify: `docs/03_workbench_ux_and_page_spec.md`
- Modify: `docs/04_qa_matrix.md`

- [ ] 把 precedent 從單純 candidate pool，更新成含 governance 的 first managed pass。
- [ ] 補實跑 QA 證據。

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
