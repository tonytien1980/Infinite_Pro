# Shared Source Lifecycle Filtering V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 讓 organization memory / domain playbook / deliverable template 開始分辨哪些 shared source 已較穩，哪些目前只適合作為背景校正。

**Architecture:** 不新增新表，沿用既有 guidance read model，在 `organization_memory_guidance`、`domain_playbook_guidance`、`deliverable_template_guidance` 補 `source_lifecycle_summary`；Host 在 playbook / template 收斂時，對 recovering / background-only source 採較保守的使用方式；frontend 只在既有頁面低噪音回讀 `來源狀態：...`。

**Tech Stack:** Python, FastAPI, Pydantic, Next.js, TypeScript, pytest, node:test

---

### Task 1: Add failing tests

**Files:**
- Modify: `backend/tests/test_mvp_slice.py`
- Modify: `frontend/tests/intake-progress.test.mjs`

- [ ] **Step 1: Add backend failing tests**

覆蓋：
- organization memory single cross-matter item -> background-only
- recovering precedent does not over-lead domain playbook
- recovering precedent does not override pack-driven deliverable template
- prompt-safe context lines include `來源狀態：...`

- [ ] **Step 2: Run targeted backend tests to verify red**

- [ ] **Step 3: Add frontend failing tests**

覆蓋：
- organization memory view reads source lifecycle summary
- domain playbook view reads source lifecycle summary
- deliverable template view reads source lifecycle summary

- [ ] **Step 4: Run frontend tests to verify red**

### Task 2: Implement shared source lifecycle filtering

**Files:**
- Modify: `backend/app/domain/schemas.py`
- Modify: `backend/app/services/organization_memory_intelligence.py`
- Modify: `backend/app/services/domain_playbook_intelligence.py`
- Modify: `backend/app/services/deliverable_template_intelligence.py`
- Modify: `backend/app/agents/base.py`
- Modify: `frontend/src/lib/types.ts`
- Modify: `frontend/src/lib/organization-memory.ts`
- Modify: `frontend/src/lib/domain-playbooks.ts`
- Modify: `frontend/src/lib/deliverable-templates.ts`
- Modify: `frontend/src/components/matter-workspace-panel.tsx`
- Modify: `frontend/src/components/task-detail-panel.tsx`
- Modify: `frontend/src/components/deliverable-workspace-panel.tsx`

- [ ] **Step 1: Extend guidance contracts**
- [ ] **Step 2: Add organization-memory source lifecycle reading**
- [ ] **Step 3: Apply conservative filtering in domain playbook**
- [ ] **Step 4: Apply conservative filtering in deliverable template**
- [ ] **Step 5: Surface low-noise source lifecycle reading**

### Task 3: Sync active docs and QA

**Files:**
- Modify: `docs/00_product_definition_and_current_state.md`
- Modify: `docs/01_runtime_architecture_and_data_contracts.md`
- Modify: `docs/03_workbench_ux_and_page_spec.md`
- Modify: `docs/04_qa_matrix.md`
- Create: `docs/superpowers/specs/2026-04-05-shared-source-lifecycle-filtering-v1-design.md`
- Create: `docs/superpowers/plans/2026-04-05-shared-source-lifecycle-filtering-v1.md`

### Task 4: Full verification and git sync

- [ ] **Step 1: Run compile**
- [ ] **Step 2: Run full backend tests**
- [ ] **Step 3: Run frontend helper tests**
- [ ] **Step 4: Run builds and typecheck**
- [ ] **Step 5: Commit and push**
