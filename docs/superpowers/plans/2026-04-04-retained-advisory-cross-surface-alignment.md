# Retained Advisory Cross-Surface Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align retained-advisory continuity summaries across task, deliverable, and evidence workspaces by reusing the existing continuity contract and a new shared frontend helper, without adding new pages or dashboard UI.

**Architecture:** Reuse `continuation_surface` and `buildContinuationAdvisoryView`; add a focus-summary helper on the frontend, then apply it to `task-detail-panel`, `deliverable-workspace-panel`, and `artifact-evidence-workspace-panel`. Keep backend unchanged unless verification reveals drift.

**Tech Stack:** Next.js App Router, TypeScript, node:test, existing workbench components

---

### Task 1: Lock the shared focus-summary behavior in tests

**Files:**
- Modify: `frontend/tests/intake-progress.test.mjs`
- Modify: `frontend/src/lib/continuation-advisory.ts`

- [ ] Add failing tests for checkpoint and progression cross-surface focus summaries.
- [ ] Verify the tests fail for the expected missing-helper reason.

### Task 2: Implement the shared continuity focus helper

**Files:**
- Modify: `frontend/src/lib/continuation-advisory.ts`

- [ ] Add a helper that turns the existing advisory contract into a compact label / title / copy summary for non-matter surfaces.
- [ ] Keep checkpoint and progression wording distinct.
- [ ] Re-run the node tests and verify the helper passes.

### Task 3: Apply the helper to task / deliverable / evidence

**Files:**
- Modify: `frontend/src/components/task-detail-panel.tsx`
- Modify: `frontend/src/components/deliverable-workspace-panel.tsx`
- Modify: `frontend/src/components/artifact-evidence-workspace-panel.tsx`

- [ ] Replace ad-hoc continuity wording in the most prominent hero / first-screen slots with the shared helper output.
- [ ] Keep each surface role-specific, but continuity-consistent.
- [ ] Re-run frontend validation after the UI changes.

### Task 4: Sync docs and QA evidence

**Files:**
- Modify: `docs/00_product_definition_and_current_state.md`
- Modify: `docs/03_workbench_ux_and_page_spec.md`
- Modify: `docs/04_qa_matrix.md`

- [ ] Update docs to reflect that retained-advisory continuity is now aligned across the main work surfaces.
- [ ] Run final verification: `cd frontend && node --test tests/intake-progress.test.mjs`, `cd frontend && npm run build`, and `cd frontend && rm -f .next/cache/.tsbuildinfo && npx next typegen && npm run typecheck`.
- [ ] Add local smoke evidence for task / deliverable / evidence routes, then commit and push.
