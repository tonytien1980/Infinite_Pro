# Follow-Up Middle Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `follow_up` a clear middle-layer product posture that separates one-off work from true continuous tracking without adding UI complexity.

**Architecture:** Reuse the existing `continuation_surface` and `follow_up_lane` runtime shape, but tighten their consultant-facing summaries and workspace presentation rules. Prioritize first-screen wording and action hierarchy on matter, task, and deliverable surfaces, then sync active docs and QA evidence in the same pass.

**Tech Stack:** FastAPI, Python, Pydantic, Next.js App Router, TypeScript, pytest, node:test

---

### Task 1: Lock follow-up surface behavior in backend tests

**Files:**
- Modify: `backend/tests/test_mvp_slice.py`
- Modify: `backend/app/services/tasks.py`

- [ ] Add failing backend assertions for `follow_up` cases so the matter/task/deliverable surfaces clearly emphasize checkpoint updates rather than progression tracking.
- [ ] Run targeted pytest for follow-up continuity cases and verify the new assertions fail for the expected reason.
- [ ] Adjust read-model summaries and continuation wording in `backend/app/services/tasks.py` using the existing `continuation_surface` and `follow_up_lane` paths.
- [ ] Re-run targeted pytest and verify the `follow_up` assertions pass.

### Task 2: Simplify matter workspace follow-up first screen

**Files:**
- Modify: `frontend/src/components/matter-workspace-panel.tsx`
- Test: `frontend/tests/intake-progress.test.mjs`

- [ ] Add or extend a frontend test that locks the intended follow-up wording or helper behavior where practical.
- [ ] Update the hero rail and next-step copy so `follow_up` reads as “回來更新 / checkpoint” rather than a lighter `continuous`.
- [ ] Keep one primary action visible for follow-up and ensure `one_off` / `continuous` do not inherit the same copy.
- [ ] Run frontend tests and confirm the updated matter copy behavior stays consistent.

### Task 3: Simplify task workspace follow-up first screen

**Files:**
- Modify: `frontend/src/components/task-detail-panel.tsx`

- [ ] Update the task hero labels and supporting copy so follow-up tasks clearly read as checkpoint-linked work.
- [ ] Remove or demote any follow-up phrasing that feels like progression tracking on the first screen.
- [ ] Preserve the existing low-noise research guidance behavior without letting it override follow-up clarity.
- [ ] Re-run relevant frontend validation after the task-page changes.

### Task 4: Simplify deliverable workspace follow-up first screen

**Files:**
- Modify: `frontend/src/components/deliverable-workspace-panel.tsx`

- [ ] Update the deliverable hero / primary-action framing so follow-up versions point back toward checkpoint-style continuation.
- [ ] Ensure one-off deliverables still feel like publish/export/close flows, and continuous deliverables still preserve stronger progression language.
- [ ] Keep the page within the existing workbench layout and avoid adding any new continuity dashboard UI.
- [ ] Re-run frontend validation after the deliverable-page changes.

### Task 5: Sync active docs and QA evidence

**Files:**
- Modify: `docs/00_product_definition_and_current_state.md`
- Modify: `docs/01_runtime_architecture_and_data_contracts.md`
- Modify: `docs/03_workbench_ux_and_page_spec.md`
- Modify: `docs/04_qa_matrix.md`

- [ ] Update active docs so `follow_up` is explicitly defined as the checkpoint / milestone middle layer between `one_off` and `continuous`.
- [ ] Record the UI/UX guardrails that prevent follow-up from drifting into continuous-style complexity.
- [ ] Run final verification: `python3 -m compileall backend/app`, `PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -q`, `node --test frontend/tests/intake-progress.test.mjs`, `cd frontend && npm run build`, and `cd frontend && rm -f .next/cache/.tsbuildinfo && npx next typegen && npm run typecheck`.
- [ ] Add real verification evidence to `docs/04_qa_matrix.md`, then commit and push the aligned changes.
