# Retained Advisory Final-Mile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the retained-advisory final mile by aligning second-layer continuity reading across matter, task, deliverable, and evidence workspaces without expanding the backend contract.

**Architecture:** Reuse `continuation_surface` and `buildContinuationAdvisoryView`; add a shared frontend detail helper for checkpoint/progression detail blocks, then replace ad-hoc continuity detail wording across the four main work surfaces.

**Tech Stack:** Next.js App Router, TypeScript, node:test, existing workbench components

---

### Task 1: Lock the shared detail-summary behavior in tests

**Files:**
- Modify: `frontend/tests/intake-progress.test.mjs`
- Modify: `frontend/src/lib/continuation-advisory.ts`

- [ ] Add failing tests for a shared checkpoint/progression detail helper.
- [ ] Verify the failure is due to the missing helper / behavior.

### Task 2: Implement the shared continuity detail helper

**Files:**
- Modify: `frontend/src/lib/continuation-advisory.ts`

- [ ] Add a helper that turns the existing continuity contract into second-layer detail cards / lists.
- [ ] Keep checkpoint and progression wording distinct.
- [ ] Re-run the node tests and verify the helper passes.

### Task 3: Apply the helper across the main work surfaces

**Files:**
- Modify: `frontend/src/components/matter-workspace-panel.tsx`
- Modify: `frontend/src/components/task-detail-panel.tsx`
- Modify: `frontend/src/components/deliverable-workspace-panel.tsx`
- Modify: `frontend/src/components/artifact-evidence-workspace-panel.tsx`

- [ ] Replace ad-hoc continuity detail sections with the shared helper output.
- [ ] Remove visible English continuity residue in these blocks.
- [ ] Keep each surface role-specific while aligning continuity reading order.

### Task 4: Sync docs and QA evidence

**Files:**
- Modify: `docs/00_product_definition_and_current_state.md`
- Modify: `docs/03_workbench_ux_and_page_spec.md`
- Modify: `docs/04_qa_matrix.md`

- [ ] Update active docs so retained-advisory completion state reflects second-layer alignment rather than matter-first only.
- [ ] Run final verification: backend compile, targeted pytest, frontend node test, build, smoke-bundle build, and typecheck.
- [ ] Add real local smoke evidence for the updated continuity detail blocks, then commit and push.
