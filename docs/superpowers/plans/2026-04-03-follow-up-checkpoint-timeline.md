# Follow-Up Checkpoint Timeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `follow_up` into a clearer checkpoint-timeline surface by reusing `timeline_items`, adding a lightweight follow-up review rhythm, and surfacing both in matter workspace without drifting into continuous-style progression UI.

**Architecture:** Reuse the existing `ContinuationSurfaceRead`, `FollowUpLaneRead`, and shared `timeline_items`. Extend `review_rhythm` to support `follow_up`, then generalize the matter advisory helper so it can render checkpoint timeline guidance for follow-up cases as well as progression guidance for continuous cases.

**Tech Stack:** FastAPI, Python, Pydantic, Next.js App Router, TypeScript, pytest, node:test

---

### Task 1: Lock the follow-up contract in tests

**Files:**
- Modify: `backend/tests/test_mvp_slice.py`
- Modify: `frontend/tests/intake-progress.test.mjs`

- [ ] Add failing backend assertions so `follow_up` continuation surfaces must expose `timeline_items` and `review_rhythm`.
- [ ] Add a frontend helper test for consultant-facing follow-up advisory copy.
- [ ] Run targeted tests and confirm they fail for the expected reason.

### Task 2: Extend backend review rhythm for follow-up

**Files:**
- Modify: `backend/app/domain/schemas.py`
- Modify: `backend/app/services/tasks.py`

- [ ] Reuse the shared review-rhythm contract so `follow_up` gets a low-noise “come back when” answer.
- [ ] Keep `follow_up` cadence language checkpoint-first rather than outcome-first.
- [ ] Re-run targeted backend tests and verify the contract passes.

### Task 3: Surface the checkpoint timeline in matter workspace

**Files:**
- Modify: `frontend/src/lib/types.ts`
- Modify: `frontend/src/lib/continuation-advisory.ts`
- Modify: `frontend/src/components/matter-workspace-panel.tsx`

- [ ] Generalize the advisory helper so it can render both follow-up checkpoint timeline and continuous progression timeline.
- [ ] Surface follow-up timeline and review rhythm in the existing matter-first layout.
- [ ] Keep the UI low-noise and clearly distinct from `continuous`.
- [ ] Re-run frontend tests after the UI changes.

### Task 4: Sync active docs and QA evidence

**Files:**
- Modify: `docs/00_product_definition_and_current_state.md`
- Modify: `docs/01_runtime_architecture_and_data_contracts.md`
- Modify: `docs/03_workbench_ux_and_page_spec.md`
- Modify: `docs/04_qa_matrix.md`

- [ ] Update active docs so `follow_up` explicitly includes checkpoint timeline plus lightweight review rhythm.
- [ ] Keep the docs clear that `follow_up` remains the middle layer, not a reduced `continuous`.
- [ ] Run final verification: `python3 -m compileall backend/app`, `PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -q`, `cd frontend && node --test tests/intake-progress.test.mjs`, `cd frontend && npm run build`, and `cd frontend && rm -f .next/cache/.tsbuildinfo && npx next typegen && npm run typecheck`.
- [ ] Add real evidence to `docs/04_qa_matrix.md`, then commit and push.
