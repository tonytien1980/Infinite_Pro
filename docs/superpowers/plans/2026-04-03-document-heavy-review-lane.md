# Document-Heavy Review Lane Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deepen `material_review_start` into a clearer document-heavy review workflow that better supports single-document and review-led consulting cases.

**Architecture:** Reuse the existing `flagship_lane`, `deliverable_class_hint`, readiness signals, and workbench surfaces, but sharpen the material-review summaries, first-screen focus, and upgrade guidance. Keep the lane consultant-facing and low-noise across matter, task, and deliverable surfaces, then sync active docs and QA evidence in the same pass.

**Tech Stack:** FastAPI, Python, Pydantic, Next.js App Router, TypeScript, pytest, node:test

---

### Task 1: Lock material-review lane behavior in backend tests

**Files:**
- Modify: `backend/tests/test_mvp_slice.py`
- Modify: `backend/app/services/tasks.py`

- [ ] Add failing backend assertions for `single_document_intake` / `material_review_start` cases so the contract makes the review posture and boundary clearer.
- [ ] Run targeted pytest for material-review cases and verify the new assertions fail for the expected reason.
- [ ] Adjust material-review lane summary, next-step wording, and boundary guidance in `backend/app/services/tasks.py`.
- [ ] Re-run targeted pytest and verify the updated assertions pass.

### Task 2: Clarify matter workspace for document-heavy review

**Files:**
- Modify: `frontend/src/components/matter-workspace-panel.tsx`
- Test: `frontend/tests/intake-progress.test.mjs`

- [ ] Add or extend a frontend test that locks intended material-review wording or helper behavior where practical.
- [ ] Update matter first-screen copy so `material_review_start` clearly reads as “正在審材料 / review memo posture” rather than generic case guidance.
- [ ] Keep one primary action visible and make the upgrade path toward decision convergence clearer but still secondary.
- [ ] Re-run frontend tests after the matter-page change.

### Task 3: Clarify task workspace for document-heavy review

**Files:**
- Modify: `frontend/src/components/task-detail-panel.tsx`

- [ ] Update task hero labels and supporting copy so document-heavy work clearly reads as review / assessment work.
- [ ] Make the first-screen result expectation align with review memo / assessment output instead of generic “analysis”.
- [ ] Preserve research and continuity guidance without letting them dominate the material-review posture.
- [ ] Re-run relevant frontend validation after the task-page changes.

### Task 4: Clarify deliverable workspace for document-heavy review

**Files:**
- Modify: `frontend/src/components/deliverable-workspace-panel.tsx`

- [ ] Update the deliverable hero / primary-action framing so review-led deliverables read as review memo / assessment artifacts with clear upgrade boundaries.
- [ ] Ensure single-document review output does not overclaim final decision-convergence status.
- [ ] Keep the page within the existing workbench layout and avoid turning it into a file-management interface.
- [ ] Re-run frontend validation after the deliverable-page changes.

### Task 5: Sync active docs and QA evidence

**Files:**
- Modify: `docs/00_product_definition_and_current_state.md`
- Modify: `docs/01_runtime_architecture_and_data_contracts.md`
- Modify: `docs/03_workbench_ux_and_page_spec.md`
- Modify: `docs/04_qa_matrix.md`

- [ ] Update active docs so `material_review_start` is explicitly defined as a document-heavy review lane rather than only a derived label.
- [ ] Record the UI/UX guardrails that keep the lane review-first instead of turning it into a file repository or generic workflow.
- [ ] Run final verification: `python3 -m compileall backend/app`, `PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -q`, `node --test frontend/tests/intake-progress.test.mjs`, `cd frontend && npm run build`, and `cd frontend && rm -f .next/cache/.tsbuildinfo && npx next typegen && npm run typecheck`.
- [ ] Add real verification evidence to `docs/04_qa_matrix.md`, then commit and push the aligned changes.
