# Sparse Intake Diagnostic Lane Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make sparse-start consulting matters feel like a first-class flagship workflow, with consultant-facing entry language, derived lane summaries, and synchronized docs.

**Architecture:** Reuse the existing world-first runtime and derive a consultant-facing flagship-lane summary from current task signals. Keep Host, Pack, Agent, and continuity behavior intact; only add a read-model layer plus UI wording and first-screen guidance. Update active docs in the same implementation pass.

**Tech Stack:** FastAPI, Python, Pydantic schemas, Next.js App Router, TypeScript, node:test, pytest

---

### Task 1: Add backend flagship-lane contract

**Files:**
- Modify: `backend/app/domain/schemas.py`
- Modify: `backend/app/services/tasks.py`
- Test: `backend/tests/test_mvp_slice.py`

- [ ] **Step 1: Write the failing backend tests**

Add tests covering:
- sparse one-line inquiry -> `diagnostic_start`
- single-document intake -> `material_review_start`
- multi-material decision-ready case -> `decision_convergence_start`

Also assert the label, summary, next-step summary, and upgrade note are non-empty and consultant-facing.

- [ ] **Step 2: Run backend tests to verify failure**

Run:

```bash
PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -q
```

Expected:
- FAIL on missing flagship-lane fields/helpers

- [ ] **Step 3: Add schema fields and backend derivation helpers**

Implement:
- a small schema object for the derived flagship-lane contract
- serialization wiring for `TaskAggregateResponse`, `TaskListItemResponse`, and `MatterWorkspaceSummaryRead`
- helper functions in `backend/app/services/tasks.py` that map existing runtime signals into:
  - lane id
  - lane label
  - summary
  - next-step summary
  - upgrade note

- [ ] **Step 4: Re-run backend tests**

Run:

```bash
PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -q
```

Expected:
- PASS

- [ ] **Step 5: Commit backend lane contract**

```bash
git add backend/app/domain/schemas.py backend/app/services/tasks.py backend/tests/test_mvp_slice.py
git commit -m "feat: add sparse intake flagship lane contract"
```

### Task 2: Replace intake-first workflow wording with consultant-facing start modes

**Files:**
- Create: `frontend/src/lib/flagship-lane.ts`
- Modify: `frontend/src/components/task-create-form.tsx`
- Test: `frontend/tests/intake-progress.test.mjs`

- [ ] **Step 1: Write the failing frontend tests**

Add tests for:
- consultant-facing start-mode labels
- mapping from start mode to internal workflow value
- material-review mode choosing review-oriented internal path
- decision-convergence mode choosing multi-agent path

- [ ] **Step 2: Run frontend test to verify failure**

Run:

```bash
node --test frontend/tests/intake-progress.test.mjs
```

Expected:
- FAIL on missing helper exports / wrong mapping

- [ ] **Step 3: Add minimal helper and update intake UI**

Implement:
- `frontend/src/lib/flagship-lane.ts` with helper functions for intake start modes
- update `task-create-form.tsx` so the first visible choice is consultant-facing
- keep advanced workflow override behind disclosure instead of the first visible decision

- [ ] **Step 4: Re-run frontend test**

Run:

```bash
node --test frontend/tests/intake-progress.test.mjs
```

Expected:
- PASS

- [ ] **Step 5: Commit intake wording change**

```bash
git add frontend/src/lib/flagship-lane.ts frontend/src/components/task-create-form.tsx frontend/tests/intake-progress.test.mjs
git commit -m "feat: simplify sparse intake workflow entry"
```

### Task 3: Surface the flagship-lane summary across core workspaces

**Files:**
- Modify: `frontend/src/lib/types.ts`
- Modify: `frontend/src/lib/advisory-workflow.ts`
- Modify: `frontend/src/components/matter-workspace-panel.tsx`
- Modify: `frontend/src/components/task-detail-panel.tsx`
- Modify: `frontend/src/components/artifact-evidence-workspace-panel.tsx`
- Modify: `frontend/src/components/deliverable-workspace-panel.tsx`

- [ ] **Step 1: Update frontend types for backend lane fields**

- [ ] **Step 2: Add helper views in `advisory-workflow.ts`**

Create small helpers that turn the backend lane summary into reusable first-screen copy.

- [ ] **Step 3: Update matter/task/evidence/deliverable heroes**

Each first screen should answer:
- what kind of lane this is
- what to do next
- how this can deepen later

- [ ] **Step 4: Run frontend validation**

Run:

```bash
cd frontend && npm run build
cd frontend && npm run typecheck
```

Expected:
- PASS

- [ ] **Step 5: Commit workspace surface update**

```bash
git add frontend/src/lib/types.ts frontend/src/lib/advisory-workflow.ts frontend/src/components/matter-workspace-panel.tsx frontend/src/components/task-detail-panel.tsx frontend/src/components/artifact-evidence-workspace-panel.tsx frontend/src/components/deliverable-workspace-panel.tsx
git commit -m "feat: surface flagship lane across workspaces"
```

### Task 4: Sync active docs and verification evidence

**Files:**
- Modify: `docs/00_product_definition_and_current_state.md`
- Modify: `docs/01_runtime_architecture_and_data_contracts.md`
- Modify: `docs/03_workbench_ux_and_page_spec.md`
- Modify: `docs/04_qa_matrix.md`

- [ ] **Step 1: Update product and runtime docs**

Document:
- sparse-intake diagnostic lane as a flagship productized path
- derived flagship-lane read-model behavior
- first-screen consultant-facing wording rules

- [ ] **Step 2: Run full verification**

Run:

```bash
python3 -m compileall backend/app
PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -q
cd frontend && npm run build
cd frontend && npm run typecheck
```

Expected:
- PASS across all commands

- [ ] **Step 3: Add QA evidence only after real verification**

Append a dated entry to `docs/04_qa_matrix.md` covering:
- sparse-start intake first screen
- matter first-screen lane summary
- task first-screen lane summary
- evidence and deliverable spot-checks

- [ ] **Step 4: Commit docs and verification sync**

```bash
git add docs/00_product_definition_and_current_state.md docs/01_runtime_architecture_and_data_contracts.md docs/03_workbench_ux_and_page_spec.md docs/04_qa_matrix.md
git commit -m "docs: sync sparse intake flagship lane"
```

### Task 5: Final sync

**Files:**
- Modify: git history only

- [ ] **Step 1: Verify clean working tree**

Run:

```bash
git status --short --branch
```

Expected:
- clean working tree

- [ ] **Step 2: Push branch**

Run:

```bash
git push
```

- [ ] **Step 3: Report outcome**

Include:
- changed behavior
- updated active docs
- verification results
- branch status
