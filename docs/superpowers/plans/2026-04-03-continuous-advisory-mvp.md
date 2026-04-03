# Continuous Advisory MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `continuous` into a clearer retained advisory MVP by adding a formal health signal, timeline, and next-step queue to `continuation_surface`, then surface those answers in the matter workspace without creating a heavy dashboard.

**Architecture:** Reuse the existing continuity stack, especially `ContinuationSurfaceRead`, `FollowUpLaneRead`, and `ProgressionLaneRead`. Extend the read-model instead of inventing new ontology objects or workbench layers, then wire the matter workspace to the new contract and keep `follow_up` / `one_off` guardrails intact.

**Tech Stack:** FastAPI, Python, Pydantic, Next.js App Router, TypeScript, pytest, node:test

---

### Task 1: Lock the retained-advisory MVP contract in tests

**Files:**
- Modify: `backend/tests/test_mvp_slice.py`
- Modify: `frontend/tests/intake-progress.test.mjs`

- [ ] Add failing backend assertions for `continuous` surfaces so `continuation_surface` must expose `health_signal`, `timeline_items`, and `next_step_queue`.
- [ ] Add a frontend helper test that locks the consultant-facing health / timeline / queue view for `continuous`.
- [ ] Run targeted tests and verify the new assertions fail for the expected reason before implementation.

### Task 2: Extend the continuity read-model in backend

**Files:**
- Modify: `backend/app/domain/schemas.py`
- Modify: `backend/app/services/tasks.py`

- [ ] Add formal schema types for continuity health and timeline items.
- [ ] Build low-noise `health_signal`, `timeline_items`, and `next_step_queue` from existing follow-up / progression data.
- [ ] Keep `continuous` as the main beneficiary while preserving `follow_up` and `one_off` guardrails.
- [ ] Re-run targeted backend tests and verify the contract passes.

### Task 3: Surface the retained-advisory MVP in matter workspace

**Files:**
- Modify: `frontend/src/lib/types.ts`
- Modify: `frontend/src/lib/continuity-ux.ts`
- Modify: `frontend/src/components/matter-workspace-panel.tsx`

- [ ] Update TypeScript types and add a helper that turns the continuity contract into clear consultant-facing copy.
- [ ] Adjust the matter workspace hero / first-screen area to show health, recent progression timeline, and next-step queue without adding a dashboard shell.
- [ ] Keep one primary action and ensure the page still reads quickly for non-continuous cases.
- [ ] Re-run frontend tests after the UI changes.

### Task 4: Sync active docs and QA evidence

**Files:**
- Modify: `docs/00_product_definition_and_current_state.md`
- Modify: `docs/01_runtime_architecture_and_data_contracts.md`
- Modify: `docs/03_workbench_ux_and_page_spec.md`
- Modify: `docs/04_qa_matrix.md`

- [ ] Update active docs so `continuous` is explicitly described as a retained-advisory MVP surface with health, timeline, and next-step answers.
- [ ] Record the UI/UX guardrails that keep this lane simple and matter-first.
- [ ] Run final verification: `python3 -m compileall backend/app`, `PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -q`, `cd frontend && node --test tests/intake-progress.test.mjs`, `cd frontend && npm run build`, and `cd frontend && rm -f .next/cache/.tsbuildinfo && npx next typegen && npm run typecheck`.
- [ ] Add real verification evidence to `docs/04_qa_matrix.md`, then commit and push the aligned changes.
