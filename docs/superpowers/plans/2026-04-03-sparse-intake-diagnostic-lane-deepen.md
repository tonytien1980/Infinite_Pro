# Sparse Intake Diagnostic Lane Deepening Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deepen the flagship sparse-intake flow so the product explains the current output level, confidence boundary, and upgrade requirements instead of only showing the lane name.

**Architecture:** Extend the existing `flagship_lane` read model with progression guidance derived from current runtime signals. Reuse existing counts, presence-state summary, deliverable class hint, and continuity mode. Surface the new guidance on task, matter, evidence, and deliverable first screens, then sync active docs and QA evidence.

**Tech Stack:** FastAPI, Python, Pydantic, Next.js App Router, TypeScript, pytest, node:test

---

### Task 1: Add flagship-lane progression contract

**Files:**
- Modify: `backend/app/domain/schemas.py`
- Modify: `backend/app/services/tasks.py`
- Test: `backend/tests/test_mvp_slice.py`

- [ ] **Step 1: Write failing backend tests**
- [ ] **Step 2: Verify backend tests fail**
- [ ] **Step 3: Add fields for current output level, upgrade target, upgrade requirements, and boundary note**
- [ ] **Step 4: Re-run backend tests**

### Task 2: Surface the deeper guidance on core workspaces

**Files:**
- Modify: `frontend/src/lib/types.ts`
- Modify: `frontend/src/lib/advisory-workflow.ts`
- Modify: `frontend/src/components/matter-workspace-panel.tsx`
- Modify: `frontend/src/components/task-detail-panel.tsx`
- Modify: `frontend/src/components/artifact-evidence-workspace-panel.tsx`
- Modify: `frontend/src/components/deliverable-workspace-panel.tsx`

- [ ] **Step 1: Update frontend types**
- [ ] **Step 2: Add helper view mapping for deeper flagship guidance**
- [ ] **Step 3: Show current output level, upgrade target, and upgrade checklist on core surfaces**
- [ ] **Step 4: Run frontend validation**

### Task 3: Sync docs and QA

**Files:**
- Modify: `docs/00_product_definition_and_current_state.md`
- Modify: `docs/01_runtime_architecture_and_data_contracts.md`
- Modify: `docs/03_workbench_ux_and_page_spec.md`
- Modify: `docs/04_qa_matrix.md`

- [ ] **Step 1: Update active docs with the deeper flagship-lane contract**
- [ ] **Step 2: Re-run verification**
- [ ] **Step 3: Add real QA evidence**
- [ ] **Step 4: Commit and push**
