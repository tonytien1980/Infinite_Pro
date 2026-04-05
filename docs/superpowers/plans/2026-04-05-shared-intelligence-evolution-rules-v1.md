# Shared Intelligence Evolution Rules V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 讓 precedent / reusable intelligence 開始知道哪些模式仍偏個別經驗、哪些開始形成共享模式，以及下一案應提高參考、持平觀察，還是降低參考。

**Architecture:** backend 在 precedent review 與 Host-safe precedent reference 上新增 nested `shared_intelligence_signal`，根據既有 precedent rows、reason-coded signal、candidate status 與 attribution 收斂成熟度與權重趨勢；再把這層帶進 Host precedent context 與 frontend 的低噪音 readback。frontend 只補既有 precedent surface，不新增 collaboration shell。

**Tech Stack:** Python, FastAPI, SQLAlchemy, Next.js, TypeScript, node:test, pytest

---

### Task 1: Add failing tests for shared intelligence evolution rules v1

**Files:**
- Modify: `backend/tests/test_mvp_slice.py`
- Modify: `frontend/tests/intake-progress.test.mjs`

- [ ] **Step 1: Add backend failing tests**

覆蓋：
- Host-safe precedent reference exposes `shared_intelligence_signal`
- precedent payload context includes `共享成熟度 / 權重趨勢`
- review lane exposes the same signal on precedent items

- [ ] **Step 2: Run backend tests to verify failure**

Run: `PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -q -k "shared_intelligence or host_safe_precedent_reference_guidance or precedent_context_includes_optimization_signal_lines"`

- [ ] **Step 3: Add frontend failing tests**

覆蓋：
- precedent review helper renders `共享成熟度 / 權重趨勢`
- precedent reference helper renders the same low-noise copy

- [ ] **Step 4: Run frontend tests to verify failure**

Run: `cd frontend && node --test tests/intake-progress.test.mjs`

### Task 2: Implement backend shared-intelligence signal

**Files:**
- Modify: `backend/app/domain/schemas.py`
- Modify: `backend/app/workbench/schemas.py`
- Modify: `backend/app/services/precedent_intelligence.py`
- Modify: `backend/app/services/workbench.py`
- Modify: `backend/app/services/tasks.py`
- Modify: `backend/app/agents/base.py`

- [ ] **Step 1: Add shared-intelligence schema**

新增 nested `shared_intelligence_signal` contract。

- [ ] **Step 2: Add signal derivation**

從既有 precedent rows 收斂：
- `maturity`
- `weight_action`
- supporting / operator / promoted / dismissed counts
- readable summary

- [ ] **Step 3: Wire to review, reference, and Host context**

讓 precedent review、Host-safe precedent reference 與 prompt-safe precedent context 都正式帶這層訊號。

- [ ] **Step 4: Re-run targeted backend tests**

Run: `PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -q -k "shared_intelligence or host_safe_precedent_reference_guidance or precedent_context_includes_optimization_signal_lines"`

### Task 3: Add low-noise frontend readback

**Files:**
- Modify: `frontend/src/lib/types.ts`
- Modify: `frontend/src/lib/precedent-review.ts`
- Modify: `frontend/src/lib/precedent-reference.ts`
- Modify: `frontend/src/components/history-page-panel.tsx`

- [ ] **Step 1: Extend types and helpers**

讓 precedent UI helper 能把 `shared_intelligence_signal` 讀成 consultant-readable copy。

- [ ] **Step 2: Keep UI low-noise**

只補：
- `共享成熟度：...`
- `權重趨勢：...`

- [ ] **Step 3: Re-run frontend tests**

Run: `cd frontend && node --test tests/intake-progress.test.mjs`

### Task 4: Sync active docs

**Files:**
- Modify: `docs/00_product_definition_and_current_state.md`
- Modify: `docs/01_runtime_architecture_and_data_contracts.md`
- Modify: `docs/02_host_agents_packs_and_extension_system.md`
- Modify: `docs/03_workbench_ux_and_page_spec.md`
- Modify: `docs/04_qa_matrix.md`
- Create: `docs/superpowers/specs/2026-04-05-shared-intelligence-evolution-rules-v1-design.md`
- Create: `docs/superpowers/plans/2026-04-05-shared-intelligence-evolution-rules-v1.md`

- [ ] **Step 1: Update docs**

把 shared-intelligence evolution rules 的角色、邊界與 Host/UI disclosure 寫清楚。

- [ ] **Step 2: Add fresh QA evidence**

把 compile / tests / build / typecheck 寫進 QA matrix。

### Task 5: Verify and sync GitHub

**Files:**
- Modify: `git state only`

- [ ] **Step 1: Run compile**

Run: `python3 -m compileall backend/app`

- [ ] **Step 2: Run backend tests**

Run: `PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -q`

- [ ] **Step 3: Run frontend tests**

Run: `cd frontend && node --test tests/intake-progress.test.mjs`

- [ ] **Step 4: Run builds and typecheck**

Run:
- `cd frontend && npm run build`
- `cd frontend && NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8010/api/v1 npm run build`
- `cd frontend && rm -f .next/cache/.tsbuildinfo && npx next typegen && npm run typecheck`

- [ ] **Step 5: Commit and push**

Commit message:

```bash
git add backend/app/domain/schemas.py backend/app/workbench/schemas.py backend/app/services/precedent_intelligence.py backend/app/services/workbench.py backend/app/services/tasks.py backend/app/agents/base.py backend/tests/test_mvp_slice.py frontend/src/lib/types.ts frontend/src/lib/precedent-review.ts frontend/src/lib/precedent-reference.ts frontend/src/components/history-page-panel.tsx frontend/tests/intake-progress.test.mjs docs/00_product_definition_and_current_state.md docs/01_runtime_architecture_and_data_contracts.md docs/02_host_agents_packs_and_extension_system.md docs/03_workbench_ux_and_page_spec.md docs/04_qa_matrix.md docs/superpowers/specs/2026-04-05-shared-intelligence-evolution-rules-v1-design.md docs/superpowers/plans/2026-04-05-shared-intelligence-evolution-rules-v1.md
git commit -m "feat: add shared intelligence evolution rules"
git push origin codex/baseline-sync-and-sparse-diagnostic
```
