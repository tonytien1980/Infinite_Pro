# Reusable Review Lenses Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 讓 Host 開始產出 reusable review lenses，並以低噪音方式回讀到 task / deliverable。

**Architecture:** backend 建立 `review_lens_guidance` read model，從 precedent reference、pack decision patterns、pack common risks 與 task heuristics 收斂 2 到 4 個 lenses；再把整理好的 `review_lens_context` 帶進 model-router request。前端只做 second-layer reading。

**Tech Stack:** FastAPI, SQLAlchemy, Pydantic, Next.js App Router, TypeScript

---

### Task 1: Lock review-lens behavior with failing tests

**Files:**
- Modify: `backend/tests/test_mvp_slice.py`
- Modify: `frontend/tests/intake-progress.test.mjs`

- [ ] 補 backend failing test：
  - `TaskAggregate` 會回 `review_lens_guidance`
  - lenses 至少包含 precedent / pack / heuristic 其中之一
- [ ] 補 backend failing test：
  - model-router prompt 會包含 review lens context
- [ ] 補 frontend failing test：
  - review lens helper 會輸出穩定 consultant-facing copy

### Task 2: Add backend review-lens guidance

**Files:**
- Create: `backend/app/services/review_lens_intelligence.py`
- Modify: `backend/app/domain/schemas.py`
- Modify: `backend/app/services/tasks.py`

- [ ] 定義 `ReviewLensItemRead` / `ReviewLensGuidanceRead`。
- [ ] 實作 lens source aggregation。
- [ ] `serialize_task` 補 review lens guidance。

### Task 3: Pass review lenses through Host boundary

**Files:**
- Modify: `backend/app/agents/base.py`
- Modify: `backend/app/model_router/base.py`
- Modify: `backend/app/model_router/structured_tasks.py`
- Modify: core / specialist agents that build model-router requests

- [ ] `AgentInputPayload` 補 review lens guidance。
- [ ] requests 補 `review_lens_context`。
- [ ] prompt 補 `這輪先看哪幾點` block。

### Task 4: Add low-noise UI reading

**Files:**
- Modify: `frontend/src/lib/types.ts`
- Create: `frontend/src/lib/review-lenses.ts`
- Modify: `frontend/src/components/task-detail-panel.tsx`
- Modify: `frontend/src/components/deliverable-workspace-panel.tsx`

- [ ] task second-layer disclosure 補 review lens reading。
- [ ] deliverable second-layer disclosure 補同一套 reading。

### Task 5: Sync docs and QA

**Files:**
- Modify: `docs/00_product_definition_and_current_state.md`
- Modify: `docs/01_runtime_architecture_and_data_contracts.md`
- Modify: `docs/02_host_agents_packs_and_extension_system.md`
- Modify: `docs/03_workbench_ux_and_page_spec.md`
- Modify: `docs/04_qa_matrix.md`

- [ ] 補 reusable review lenses 的正式定位。
- [ ] 補 Host-owned lens guidance 與 prompt boundary。
- [ ] 補 task / deliverable 低噪音回讀規則。
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
