# Deliverable Shape Hints Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 讓 Host 開始產出 reusable deliverable shape hints，並以低噪音方式回讀到 task / deliverable。

**Architecture:** backend 建立 `deliverable_shape_guidance` read model，從 precedent deliverable pattern、pack deliverable presets 與 task heuristics 收斂 1 個 primary shape、3 到 5 個 section hints 與少量 supporting hints；再把整理好的 `deliverable_shape_context` 帶進 model-router request。前端只做 second-layer reading，不新增 template shell。

**Tech Stack:** FastAPI, SQLAlchemy, Pydantic, Next.js App Router, TypeScript

---

### Task 1: Lock deliverable-shape behavior with failing tests

**Files:**
- Modify: `backend/tests/test_mvp_slice.py`
- Modify: `frontend/tests/intake-progress.test.mjs`

- [ ] 補 backend failing test：
  - `TaskAggregate` 會回 `deliverable_shape_guidance`
  - primary shape 與 section hints 至少包含 precedent / pack / heuristic 其中之一
- [ ] 補 backend failing test：
  - model-router prompt 會包含 deliverable shape context
- [ ] 補 frontend failing test：
  - deliverable-shape helper 會輸出穩定 consultant-facing copy

### Task 2: Add backend deliverable-shape guidance

**Files:**
- Create: `backend/app/services/deliverable_shape_intelligence.py`
- Modify: `backend/app/domain/schemas.py`
- Modify: `backend/app/services/tasks.py`

- [ ] 定義 `DeliverableShapeHintRead` / `DeliverableShapeGuidanceRead`。
- [ ] 實作 shape source aggregation。
- [ ] `serialize_task` 補 deliverable shape guidance。
- [ ] 必要時補 precedent candidate seed snapshot，讓 promoted precedent 可提供 shape sections。

### Task 3: Pass deliverable-shape guidance through Host boundary

**Files:**
- Modify: `backend/app/agents/base.py`
- Modify: `backend/app/model_router/base.py`
- Modify: `backend/app/model_router/structured_tasks.py`
- Modify: core / specialist agents that build model-router requests

- [ ] `AgentInputPayload` 補 deliverable shape guidance。
- [ ] requests 補 `deliverable_shape_context`。
- [ ] prompt 補 `這份交付物通常怎麼收比較穩` block。

### Task 4: Add low-noise UI reading

**Files:**
- Modify: `frontend/src/lib/types.ts`
- Create: `frontend/src/lib/deliverable-shape-hints.ts`
- Modify: `frontend/src/components/task-detail-panel.tsx`
- Modify: `frontend/src/components/deliverable-workspace-panel.tsx`

- [ ] task second-layer disclosure 補 deliverable-shape reading。
- [ ] deliverable second-layer disclosure 補同一套 reading。

### Task 5: Sync docs and QA

**Files:**
- Modify: `docs/00_product_definition_and_current_state.md`
- Modify: `docs/01_runtime_architecture_and_data_contracts.md`
- Modify: `docs/02_host_agents_packs_and_extension_system.md`
- Modify: `docs/03_workbench_ux_and_page_spec.md`
- Modify: `docs/04_qa_matrix.md`

- [ ] 補 deliverable shape hints 的正式定位。
- [ ] 補 Host-owned shape guidance 與 prompt boundary。
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
