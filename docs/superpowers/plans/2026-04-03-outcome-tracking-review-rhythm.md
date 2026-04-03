# Outcome Tracking And Review Rhythm Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the continuous advisory MVP with explicit outcome-tracking and review-rhythm read models, then surface them in matter workspace without turning the UI into a scheduling tool.

**Architecture:** Reuse the current `ContinuationSurfaceRead` and existing `progression_lane` / `outcome_records`. Add small read-model summaries for outcome tracking and review rhythm, then expose them through the existing matter-first retained-advisory surface.

**Tech Stack:** FastAPI, Python, Pydantic, Next.js App Router, TypeScript, pytest, node:test

---

### Task 1: Lock the new contract in tests

**Files:**
- Modify: `backend/tests/test_mvp_slice.py`
- Modify: `frontend/tests/intake-progress.test.mjs`

- [ ] Add failing backend assertions so continuous surfaces must expose `outcome_tracking` and `review_rhythm`.
- [ ] Add a frontend helper test for consultant-facing outcome tracking and review rhythm copy.
- [ ] Run targeted tests and confirm they fail for the expected reason.

### Task 2: Extend the backend continuity read-model

**Files:**
- Modify: `backend/app/domain/schemas.py`
- Modify: `backend/app/services/tasks.py`

- [ ] Add formal schema types for outcome tracking and review rhythm.
- [ ] Derive low-noise summaries from existing outcome records and action states.
- [ ] Keep the new fields meaningful for `continuous`, but quiet or absent for lighter modes.
- [ ] Re-run targeted backend tests and verify the new contract passes.

### Task 3: Surface the new answers in matter workspace

**Files:**
- Modify: `frontend/src/lib/types.ts`
- Modify: `frontend/src/lib/continuation-advisory.ts`
- Modify: `frontend/src/components/matter-workspace-panel.tsx`

- [ ] Update TypeScript types and the continuity advisory helper to include outcome tracking and review rhythm.
- [ ] Surface the new answers in the existing matter-first retained-advisory UI without adding a new dashboard section.
- [ ] Keep the page readable and avoid increasing first-screen cognitive load too much.
- [ ] Re-run frontend tests after the UI changes.

### Task 4: Sync active docs and QA evidence

**Files:**
- Modify: `docs/00_product_definition_and_current_state.md`
- Modify: `docs/01_runtime_architecture_and_data_contracts.md`
- Modify: `docs/03_workbench_ux_and_page_spec.md`
- Modify: `docs/04_qa_matrix.md`

- [ ] Update active docs so the retained-advisory layer now explicitly includes outcome tracking and review rhythm.
- [ ] Keep the docs clear that this is still a low-noise MVP, not a full recurring system.
- [ ] Run final verification: `python3 -m compileall backend/app`, `PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -q`, `cd frontend && node --test tests/intake-progress.test.mjs`, `cd frontend && npm run build`, and `cd frontend && rm -f .next/cache/.tsbuildinfo && npx next typegen && npm run typecheck`.
- [ ] Add real evidence to `docs/04_qa_matrix.md`, then commit and push.
