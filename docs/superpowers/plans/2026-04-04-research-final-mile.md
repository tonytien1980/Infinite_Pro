# Research Final-Mile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the Research / Investigation final mile by aligning second-layer research reading across the main work surfaces without introducing a separate research console.

**Architecture:** Reuse `research_guidance` and `research_runs`; add a shared frontend helper that turns guidance and the latest research run into consultant-facing detail cards / lists, then apply it to matter, task, evidence, and deliverable workspaces.

**Tech Stack:** Next.js App Router, TypeScript, node:test, existing workbench components

---

### Task 1: Lock the shared research-detail behavior in tests

**Files:**
- Modify: `frontend/tests/intake-progress.test.mjs`
- Modify: `frontend/src/lib/research-lane.ts`

- [ ] Add failing tests for a shared research detail helper.
- [ ] Verify the tests fail because the helper does not exist yet.

### Task 2: Implement the shared research detail helper

**Files:**
- Modify: `frontend/src/lib/research-lane.ts`

- [ ] Add a helper that turns research guidance and/or the latest research run into second-layer cards and list items.
- [ ] Keep the output consultant-facing and system-owned.
- [ ] Re-run the node tests and verify the helper passes.

### Task 3: Apply the helper across the main work surfaces

**Files:**
- Modify: `frontend/src/components/matter-workspace-panel.tsx`
- Modify: `frontend/src/components/task-detail-panel.tsx`
- Modify: `frontend/src/components/artifact-evidence-workspace-panel.tsx`
- Modify: `frontend/src/components/deliverable-workspace-panel.tsx`

- [ ] Replace ad-hoc second-layer research wording with the shared helper.
- [ ] Upgrade deliverable `research runs` from raw list output into consultant-facing research handoff reading.
- [ ] Keep each surface role-specific while aligning the research reading order.

### Task 4: Sync docs and QA evidence

**Files:**
- Modify: `docs/00_product_definition_and_current_state.md`
- Modify: `docs/03_workbench_ux_and_page_spec.md`
- Modify: `docs/04_qa_matrix.md`

- [ ] Update active docs so research completion state reflects second-layer alignment rather than guidance-only maturity.
- [ ] Run final verification: backend compile, targeted pytest, frontend node test, build, smoke-bundle build, and typecheck.
- [ ] Add real local smoke evidence for the updated research second-layer reading, then commit and push.
