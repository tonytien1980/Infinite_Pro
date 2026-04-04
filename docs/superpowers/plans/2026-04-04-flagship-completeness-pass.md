# Flagship Workflow Completeness Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the flagship workflow pass by aligning second-layer flagship-lane reading across the main work surfaces without adding new backend contract fields.

**Architecture:** Reuse `flagship_lane` and `buildFlagshipLaneView`; add a shared frontend detail helper that turns the existing lane contract into a consistent second-layer reading structure, then apply it to matter, task, deliverable, and evidence workspaces.

**Tech Stack:** Next.js App Router, TypeScript, node:test, existing workbench components

---

### Task 1: Lock the shared flagship-detail behavior in tests

**Files:**
- Modify: `frontend/tests/intake-progress.test.mjs`
- Modify: `frontend/src/lib/flagship-lane.ts`

- [ ] Add failing tests for a shared flagship detail helper.
- [ ] Verify the tests fail because the helper does not exist yet.

### Task 2: Implement the shared flagship detail helper

**Files:**
- Modify: `frontend/src/lib/flagship-lane.ts`

- [ ] Add a helper that turns the existing flagship lane contract into second-layer cards and list items.
- [ ] Keep diagnostic / material-review / decision-convergence reading distinct while sharing structure.
- [ ] Re-run the node tests and verify the helper passes.

### Task 3: Apply the helper across the main work surfaces

**Files:**
- Modify: `frontend/src/components/matter-workspace-panel.tsx`
- Modify: `frontend/src/components/task-detail-panel.tsx`
- Modify: `frontend/src/components/deliverable-workspace-panel.tsx`
- Modify: `frontend/src/components/artifact-evidence-workspace-panel.tsx`

- [ ] Replace ad-hoc second-layer flagship wording with the shared helper.
- [ ] Keep each surface role-specific while aligning the flagship reading order.
- [ ] Remove leftover low-signal flagship fallback copy where the new helper supersedes it.

### Task 4: Sync docs and QA evidence

**Files:**
- Modify: `docs/00_product_definition_and_current_state.md`
- Modify: `docs/03_workbench_ux_and_page_spec.md`
- Modify: `docs/04_qa_matrix.md`

- [ ] Update active docs so flagship maturity reflects second-layer alignment rather than first-screen-only productization.
- [ ] Run final verification: backend compile, targeted pytest, frontend node test, build, smoke-bundle build, and typecheck.
- [ ] Add real local smoke evidence for the updated flagship second-layer reading, then commit and push.
