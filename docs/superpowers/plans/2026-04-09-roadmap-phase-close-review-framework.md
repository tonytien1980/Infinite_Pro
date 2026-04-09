# Roadmap Phase Close Review Framework Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land a durable phase-close review framework for the current `docs/06` roadmap so future sessions can distinguish `v1 completion`, `current-phase completion`, and `next decision phase` eligibility without drifting.

**Architecture:** Keep the canonical authority in `docs/06`, add one supporting clarification in `docs/00`, and store the deeper reasoning in a companion spec under `docs/superpowers/specs/`. This is a docs-only delivery, so verification focuses on placeholder scans, heading integrity, and clean git diff checks.

**Tech Stack:** Markdown, git, ripgrep, diff verification

---

### Task 1: Write the companion spec

**Files:**
- Create: `docs/superpowers/specs/2026-04-09-roadmap-phase-close-review-framework-design.md`

- [ ] **Step 1: Write the design doc**

Add a new spec that defines:
- the difference between roadmap close and 85-point maturity
- allowed line statuses
- phase-close gates
- closeout outcomes
- the current-phase rule for `7.1` to `7.5`

- [ ] **Step 2: Run a placeholder scan on the new spec**

Run: `rg -n "TBD|TODO|FIXME" docs/superpowers/specs/2026-04-09-roadmap-phase-close-review-framework-design.md`
Expected: no output

### Task 2: Land the canonical framework in `docs/06`

**Files:**
- Modify: `docs/06_product_alignment_and_85_point_roadmap.md`

- [ ] **Step 1: Add a formal phase-close framework section**

Insert a new section that formally defines:
- why `phase close` and `85-point target` are different questions
- allowed line statuses
- phase-close gates
- closeout outcomes
- the rule that a new decision phase may start only after a passed close review

- [ ] **Step 2: Update downstream section numbering and future-session usage text**

Make sure later sections are renumbered cleanly and future sessions are told to use the new framework before declaring the current phase closed.

### Task 3: Clarify runtime closeout vs repo/product closeout

**Files:**
- Modify: `docs/00_product_definition_and_current_state.md`

- [ ] **Step 1: Add one clarification near the existing Phase 6 closeout bullets**

State explicitly that:
- `phase-6 closeout review` is a system runtime read model
- repo / product close authority for the current `7.1` to `7.5` phase lives in `docs/06`

### Task 4: Verify, commit, and sync

**Files:**
- Verify: `docs/superpowers/specs/2026-04-09-roadmap-phase-close-review-framework-design.md`
- Verify: `docs/06_product_alignment_and_85_point_roadmap.md`
- Verify: `docs/00_product_definition_and_current_state.md`

- [ ] **Step 1: Run placeholder scans**

Run:
- `rg -n "TBD|TODO|FIXME" docs/superpowers/specs/2026-04-09-roadmap-phase-close-review-framework-design.md docs/06_product_alignment_and_85_point_roadmap.md docs/00_product_definition_and_current_state.md`

Expected: no output

- [ ] **Step 2: Check diff integrity**

Run: `git diff --check`
Expected: no output

- [ ] **Step 3: Review git state**

Run: `git status --short --branch`
Expected: only the intended doc files changed on the working branch

- [ ] **Step 4: Commit and push**

Run:
- `git add docs/superpowers/specs/2026-04-09-roadmap-phase-close-review-framework-design.md docs/superpowers/plans/2026-04-09-roadmap-phase-close-review-framework.md docs/06_product_alignment_and_85_point_roadmap.md docs/00_product_definition_and_current_state.md`
- `git commit -m "docs: add roadmap close review framework"`
- `git push`

Expected:
- commit succeeds
- remote is updated
- local and GitHub stay aligned
