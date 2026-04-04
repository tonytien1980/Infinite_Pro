# Precedent / Reusable Intelligence First Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立第一輪 precedent candidate pool，讓已被明確採納的 deliverable / recommendation 能形成可重用候選資產，而不把工作台做成新知識庫首頁。

**Architecture:** 沿用現有 adoption-feedback foundation，新增 `PrecedentCandidate` runtime object 與 read model，把 candidate summary 掛回既有 deliverable / task / matter surface。第一輪不做 automatic retrieval，只先建立可靠候選池與低噪音閱讀。

**Tech Stack:** FastAPI, SQLAlchemy, Pydantic, Next.js App Router, TypeScript

---

### Task 1: Lock runtime contract and persistence shape

**Files:**
- Modify: `backend/app/domain/models.py`
- Modify: `backend/app/domain/schemas.py`
- Modify: `docs/01_runtime_architecture_and_data_contracts.md`
- Test: `backend/tests/test_mvp_slice.py`

- [ ] 定義 `PrecedentCandidate` model 與欄位邊界。
- [ ] 補上對應 schema / read model。
- [ ] 把 candidate source、status、pattern snapshot 的 contract 寫進 active docs。
- [ ] 先寫失敗中的 backend test：
  - `adopted` deliverable 會建立 candidate
  - `template_candidate` recommendation 會建立 candidate
  - `not_adopted` 不會建立 candidate

### Task 2: Build candidate-creation service path

**Files:**
- Modify: `backend/app/services/tasks.py`
- Modify: `backend/app/api/routes/tasks.py`
- Modify: `backend/app/api/routes/deliverables.py`
- Test: `backend/tests/test_mvp_slice.py`

- [ ] 在 existing adoption feedback flow 之後接上 candidate creation / refresh。
- [ ] 只允許 explicit positive / reusable signals 進候選池。
- [ ] 把 publish / approval / revision 留在 metadata，不讓它們單獨產生 candidate。
- [ ] 跑 regression tests，確認現有 adoption-feedback 行為不被破壞。

### Task 3: Expose precedent candidate read models

**Files:**
- Modify: `backend/app/services/tasks.py`
- Modify: `frontend/src/lib/types.ts`
- Modify: `frontend/src/lib/api.ts`
- Test: `backend/tests/test_mvp_slice.py`
- Test: `frontend/tests/intake-progress.test.mjs`

- [ ] deliverable workspace read model 回出 candidate summary。
- [ ] task aggregate 在 recommendation payload 回出 candidate summary。
- [ ] matter workspace 回出低噪音 candidate count / type summary。
- [ ] 前端 type 與 test fixture 一起補上。

### Task 4: Add low-noise UI surfaces

**Files:**
- Modify: `frontend/src/components/deliverable-workspace-panel.tsx`
- Modify: `frontend/src/components/task-detail-panel.tsx`
- Modify: `frontend/src/components/matter-workspace-panel.tsx`
- Create or Modify: `frontend/src/lib/precedent-candidates.ts`
- Test: `frontend/tests/intake-progress.test.mjs`
- Modify: `docs/03_workbench_ux_and_page_spec.md`

- [ ] deliverable adoption feedback 附近補 precedent candidate 狀態。
- [ ] recommendation 卡片附近補 candidate 狀態。
- [ ] matter workspace 補一個很輕的 candidate summary，不搶 hero 主線。
- [ ] 保持 consultant-facing Traditional Chinese，不新增 precedent dashboard。

### Task 5: Update product-state docs and QA

**Files:**
- Modify: `docs/00_product_definition_and_current_state.md`
- Modify: `docs/04_qa_matrix.md`

- [ ] `docs/00` 改寫 precedent / reusable intelligence 的正式成立範圍。
- [ ] `docs/04` 追加：
  - build / typecheck / pytest
  - adoption feedback -> candidate creation
  - deliverable / task / matter live smoke evidence

### Task 6: Verification and ship

**Files:**
- Modify: none expected

- [ ] Run: `python3 -m compileall backend/app`
- [ ] Run: `PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -q`
- [ ] Run: `cd frontend && node --test tests/intake-progress.test.mjs`
- [ ] Run: `cd frontend && npm run build`
- [ ] Run: `cd frontend && rm -f .next/cache/.tsbuildinfo && npx next typegen && npm run typecheck`
- [ ] Run: `git diff --check`
- [ ] Commit and push once code, docs, and QA evidence all align
