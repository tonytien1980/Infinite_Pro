# Reusable Intelligence Convergence Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 reusable review lenses、common risk libraries、deliverable shape hints 收斂成更清楚的三層分工，減少重疊並讓交付骨架更像成熟顧問輸出。

**Architecture:** backend 先收斂 Host-owned guidance sources 與 section normalization，確保 `review_lens_guidance` 不再直接吃 `pack common risks`，並讓 `deliverable_shape_guidance` 的 section hints 經過顧問語言映射與排序。frontend 只調整 helper 與 second-layer copy，維持低噪音 disclosure。active docs 與 QA matrix 同步更新。

**Tech Stack:** Python, FastAPI, SQLAlchemy, Next.js, TypeScript, node:test, pytest

---

### Task 1: Add failing tests for three-layer convergence

**Files:**
- Modify: `backend/tests/test_mvp_slice.py`
- Modify: `frontend/tests/intake-progress.test.mjs`

- [ ] **Step 1: Write the failing backend expectations**

新增測試覆蓋：
- `review_lens_guidance` 不再回 `pack_common_risk`
- `deliverable_shape_guidance.section_hints` 會輸出 consultant-facing 順序

- [ ] **Step 2: Run backend tests to verify failure**

Run: `PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -q`

- [ ] **Step 3: Write the failing frontend expectations**

新增 helper 測試覆蓋：
- `buildReviewLensView` 的 list title / summary 更像「先看角度」
- `buildCommonRiskLibraryView` 更像「漏看提醒」
- `buildDeliverableShapeHintView` 顯示更像「交付骨架」

- [ ] **Step 4: Run frontend tests to verify failure**

Run: `cd frontend && node --test tests/intake-progress.test.mjs`

### Task 2: Converge backend guidance sources and shape ordering

**Files:**
- Modify: `backend/app/services/review_lens_intelligence.py`
- Modify: `backend/app/services/deliverable_shape_intelligence.py`
- Modify: `backend/app/services/tasks.py` (only if snapshot shaping needs adjustment)

- [ ] **Step 1: Remove risk-layer overlap from review lenses**

讓 `review_lens_guidance` 只使用 precedent / decision-pattern / heuristic sources，不再直接加入 `pack common risks`。

- [ ] **Step 2: Normalize deliverable shape sections**

在 deliverable shape intelligence 中加入：
- section label normalization
- consultant-facing section ordering
- duplicate removal

- [ ] **Step 3: Run targeted backend tests**

Run: `PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -q`

### Task 3: Converge frontend second-layer copy

**Files:**
- Modify: `frontend/src/lib/review-lenses.ts`
- Modify: `frontend/src/lib/common-risk-libraries.ts`
- Modify: `frontend/src/lib/deliverable-shape-hints.ts`

- [ ] **Step 1: Adjust layer-specific copy**

讓三個 helper 的 section title / list title / summary 更容易一眼區分。

- [ ] **Step 2: Run frontend tests**

Run: `cd frontend && node --test tests/intake-progress.test.mjs`

### Task 4: Sync active docs and QA evidence

**Files:**
- Modify: `docs/01_runtime_architecture_and_data_contracts.md`
- Modify: `docs/02_host_agents_packs_and_extension_system.md`
- Modify: `docs/03_workbench_ux_and_page_spec.md`
- Modify: `docs/04_qa_matrix.md`

- [ ] **Step 1: Update active docs**

補齊三層邊界與 UI disclosure 規則，避免後續維運再把三層混回去。

- [ ] **Step 2: Add only fresh verification evidence**

把這輪 compile / pytest / frontend tests / build / typecheck 寫進 QA matrix。

### Task 5: Full verification and Git sync

**Files:**
- Modify: `git state only`

- [ ] **Step 1: Run compile**

Run: `python3 -m compileall backend/app`

- [ ] **Step 2: Run backend tests**

Run: `PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -q`

- [ ] **Step 3: Run frontend tests**

Run: `cd frontend && node --test tests/intake-progress.test.mjs`

- [ ] **Step 4: Run build and typecheck**

Run:
- `cd frontend && npm run build`
- `cd frontend && NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8010/api/v1 npm run build`
- `cd frontend && rm -f .next/cache/.tsbuildinfo && npx next typegen && npm run typecheck`

- [ ] **Step 5: Commit and push**

Commit message:

```bash
git add docs/superpowers/specs/2026-04-04-reusable-intelligence-convergence-pass-design.md docs/superpowers/plans/2026-04-04-reusable-intelligence-convergence-pass.md backend/app/services/review_lens_intelligence.py backend/app/services/deliverable_shape_intelligence.py backend/tests/test_mvp_slice.py frontend/src/lib/review-lenses.ts frontend/src/lib/common-risk-libraries.ts frontend/src/lib/deliverable-shape-hints.ts frontend/tests/intake-progress.test.mjs docs/01_runtime_architecture_and_data_contracts.md docs/02_host_agents_packs_and_extension_system.md docs/03_workbench_ux_and_page_spec.md docs/04_qa_matrix.md
git commit -m "feat: converge reusable intelligence layers"
git push origin codex/baseline-sync-and-sparse-diagnostic
```
