# Shared Intelligence Stability Weighting V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 讓 shared-intelligence 不只看成熟度與權重趨勢，也開始看 precedent 是否已站穩、仍在觀察、剛恢復觀察或已退到背景。

**Architecture:** backend 擴既有 `SharedIntelligenceSignalRead`，在 `build_shared_intelligence_signal(...)` 內加上衍生 `stability`；排序邏輯則在 precedent review lane、Host-safe precedent reference，以及 reusable asset 的 weighted selection 共用這個訊號。frontend 只低噪音多讀一條 `共享穩定度`。

**Tech Stack:** Python, FastAPI, Pydantic, Next.js, TypeScript, pytest, node:test

---

### Task 1: Add failing tests

**Files:**
- Modify: `backend/tests/test_mvp_slice.py`
- Modify: `frontend/tests/intake-progress.test.mjs`

- [ ] **Step 1: Add backend failing tests**

覆蓋：
- promoted + shared precedent 會被標成 `stable`
- weighted selection 會先排 `stable`，再排 `recovering`
- API read model 會把 `stability` 露到 precedent review / reference

- [ ] **Step 2: Run targeted backend tests to verify red**

- [ ] **Step 3: Add frontend failing tests**

覆蓋：
- precedent review helper 低噪音顯示 `共享穩定度`
- precedent reference helper 低噪音顯示 `共享穩定度`

- [ ] **Step 4: Run frontend tests to verify red**

### Task 2: Implement stability signal and weighting

**Files:**
- Modify: `backend/app/domain/schemas.py`
- Modify: `backend/app/services/precedent_intelligence.py`
- Modify: `backend/app/services/workbench.py`
- Modify: `frontend/src/lib/types.ts`
- Modify: `frontend/src/lib/precedent-review.ts`
- Modify: `frontend/src/lib/precedent-reference.ts`

- [ ] **Step 1: Extend schema**

新增：
- `stability`
- `stability_reason`
- `stability_label`

- [ ] **Step 2: Build stability signal**

把 `stable / watch / recovering / retired` 的第一波規則寫進 `build_shared_intelligence_signal(...)`。

- [ ] **Step 3: Apply stability ordering**

讓 precedent review / reference 與 reusable asset weighted selection 一起吃 stability rank。

- [ ] **Step 4: Add low-noise frontend reading**

在既有 meta string 中補一條 `共享穩定度：...`，不新增新頁面。

### Task 3: Sync active docs and QA

**Files:**
- Modify: `docs/00_product_definition_and_current_state.md`
- Modify: `docs/01_runtime_architecture_and_data_contracts.md`
- Modify: `docs/03_workbench_ux_and_page_spec.md`
- Modify: `docs/04_qa_matrix.md`
- Create: `docs/superpowers/specs/2026-04-05-shared-intelligence-stability-weighting-v1-design.md`
- Create: `docs/superpowers/plans/2026-04-05-shared-intelligence-stability-weighting-v1.md`

- [ ] **Step 1: Update product/current-state wording**
- [ ] **Step 2: Update runtime contract**
- [ ] **Step 3: Update low-noise UI disclosure rule**
- [ ] **Step 4: Append QA evidence**

### Task 4: Full verification and git sync

- [ ] **Step 1: Run compile**
- [ ] **Step 2: Run full backend tests**
- [ ] **Step 3: Run frontend helper tests**
- [ ] **Step 4: Run builds and typecheck**
- [ ] **Step 5: Commit and push**
