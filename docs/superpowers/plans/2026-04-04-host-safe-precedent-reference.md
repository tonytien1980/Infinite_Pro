# Host-Safe Precedent Reference Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 讓 Host 開始能安全參考 precedent patterns，並把這層以低噪音方式回讀到 task / deliverable，而不做 auto-apply。

**Architecture:** 在 backend 建立 `precedent_reference_guidance` read model，先從 precedent candidates 中挑出少量、可解釋的 matched patterns，再把整理好的 `precedent_context` 帶進 specialist / core analysis request。前端只負責回讀，不新增新頁面。

**Tech Stack:** FastAPI, SQLAlchemy, Pydantic, Next.js App Router, TypeScript

---

### Task 1: Lock the retrieval boundary with failing tests

**Files:**
- Modify: `backend/tests/test_mvp_slice.py`
- Modify: `frontend/tests/intake-progress.test.mjs`

- [ ] 補 backend failing test：
  - `TaskAggregate` 會回 `precedent_reference_guidance`
  - 只匹配 eligible precedent
  - `dismissed` 不可被 reference
  - same-task candidate 不可被 reference
- [ ] 補 backend failing test：
  - model-router request context 會包含 precedent context block
- [ ] 補 frontend failing test：
  - precedent reference helper 會輸出穩定 consultant-facing copy

### Task 2: Add backend precedent-reference guidance

**Files:**
- Create: `backend/app/services/precedent_intelligence.py`
- Modify: `backend/app/domain/schemas.py`
- Modify: `backend/app/services/tasks.py`
- Modify: `backend/app/workbench/schemas.py` only if shared types become useful

- [ ] 抽出 precedent priority / eligibility / matching helper。
- [ ] 定義 `PrecedentReferenceItemRead` / `PrecedentReferenceGuidanceRead`。
- [ ] `serialize_task` 補 precedent reference guidance。

### Task 3: Pass precedent context through the Host boundary

**Files:**
- Modify: `backend/app/agents/base.py`
- Modify: `backend/app/agents/host.py`
- Modify: `backend/app/model_router/base.py`
- Modify: `backend/app/model_router/structured_tasks.py`
- Modify: `backend/app/agents/specialists/research_synthesis.py`
- Modify: `backend/app/agents/specialists/document_restructuring.py`
- Modify: `backend/app/agents/specialists/contract_review.py`
- Modify: `backend/app/agents/core/strategy_business_analysis.py`
- Modify: `backend/app/agents/core/operations.py`
- Modify other core agents that call `generate_core_analysis`

- [ ] `AgentInputPayload` 補 precedent reference guidance。
- [ ] Host build payload 時帶入這層 guidance。
- [ ] core / specialist requests 補 `precedent_context`。
- [ ] structured task prompt 補 precedent pattern block。

### Task 4: Add low-noise UI reading

**Files:**
- Modify: `frontend/src/lib/types.ts`
- Create: `frontend/src/lib/precedent-reference.ts`
- Modify: `frontend/src/components/task-detail-panel.tsx`
- Modify: `frontend/src/components/deliverable-workspace-panel.tsx`

- [ ] 前端型別補 precedent reference guidance。
- [ ] 新增 precedent reference helper。
- [ ] task detail disclosure 補 `可參考既有模式`。
- [ ] deliverable disclosure 補同一套 reading。

### Task 5: Sync active docs and QA

**Files:**
- Modify: `docs/00_product_definition_and_current_state.md`
- Modify: `docs/01_runtime_architecture_and_data_contracts.md`
- Modify: `docs/03_workbench_ux_and_page_spec.md`
- Modify: `docs/04_qa_matrix.md`

- [ ] 補 precedent retrieval 的正式邊界。
- [ ] 補 Host-owned reference contract。
- [ ] 補 task / deliverable 的低噪音回讀規則。
- [ ] 補 live smoke evidence。

### Task 6: Verify and ship

**Files:**
- Modify: none expected

- [ ] Run: `python3 -m compileall backend/app`
- [ ] Run: `PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -q`
- [ ] Run: `cd frontend && node --test tests/intake-progress.test.mjs`
- [ ] Run: `cd frontend && npm run build`
- [ ] Run: `cd frontend && NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8010/api/v1 npm run build`
- [ ] Run: `cd frontend && rm -f .next/cache/.tsbuildinfo && npx next typegen && npm run typecheck`
- [ ] Run: `git diff --check`
- [ ] Commit and push
