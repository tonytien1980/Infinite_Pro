# Research Investigation Lane First Pass Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Productize the second-priority Research / Investigation lane as a simple consultant-facing guidance layer that tells the user when research is needed, what to check first, and when to stop.

**Architecture:** Reuse existing Host research-depth logic, evidence-gap signals, and research-run records to derive a low-noise `research_guidance` read model. Surface it on task, matter, and evidence workspaces without adding a new page or dashboard. Sync active docs and QA evidence in the same pass.

**Tech Stack:** FastAPI, Python, Pydantic, Next.js, TypeScript, pytest, node:test

---

### Task 1: Add backend research-guidance contract

**Files:**
- Modify: `backend/app/domain/schemas.py`
- Modify: `backend/app/services/tasks.py`
- Test: `backend/tests/test_mvp_slice.py`

- [ ] Add failing tests for sparse external-event research guidance and low-noise non-research case
- [ ] Run targeted pytest and confirm failure
- [ ] Add derived `research_guidance` schema and serialization
- [ ] Re-run targeted pytest

### Task 2: Add frontend research-guidance helper and low-noise UI

**Files:**
- Create: `frontend/src/lib/research-lane.ts`
- Modify: `frontend/src/lib/types.ts`
- Modify: `frontend/src/lib/advisory-workflow.ts`
- Modify: `frontend/src/components/task-detail-panel.tsx`
- Modify: `frontend/src/components/matter-workspace-panel.tsx`
- Modify: `frontend/src/components/artifact-evidence-workspace-panel.tsx`
- Test: `frontend/tests/intake-progress.test.mjs`

- [ ] Add failing frontend helper test
- [ ] Run node test and confirm failure
- [ ] Add helper + wire low-noise research guidance onto existing surfaces
- [ ] Re-run node test, build, and typecheck

### Task 3: Sync active docs and QA

**Files:**
- Modify: `docs/00_product_definition_and_current_state.md`
- Modify: `docs/01_runtime_architecture_and_data_contracts.md`
- Modify: `docs/02_host_agents_packs_and_extension_system.md`
- Modify: `docs/03_workbench_ux_and_page_spec.md`
- Modify: `docs/04_qa_matrix.md`

- [ ] Update active docs for first-pass Research / Investigation productization
- [ ] Add real verification evidence
- [ ] Run final verification
- [ ] Commit and push
