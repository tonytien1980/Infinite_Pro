# Cross-Matter Organization Memory V2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 讓 organization memory 從同案世界背景，進一步補上同客戶跨案件的少量穩定背景摘要，同時保持 Host-owned、低噪音、非 CRM。

**Architecture:** backend 先從既有 `MatterWorkspaceSummaryRead` 收斂同客戶跨案件摘要，再把結果寫進 `organization_memory_guidance` 的 `cross_matter_summary` / `cross_matter_items`。Host payload 只帶 prompt-safe lines。frontend 只在 matter / task second-layer 低噪音回讀。

**Tech Stack:** Python, FastAPI, SQLAlchemy, Next.js, TypeScript, node:test, pytest

---

### Task 1: Add failing tests for cross-matter memory

**Files:**
- Modify: `backend/tests/test_mvp_slice.py`
- Modify: `frontend/tests/intake-progress.test.mjs`

- [ ] **Step 1: Add backend failing tests**

覆蓋：
- 同客戶不同案件會回出 cross-matter summary
- matter / task 都能讀到 cross-matter items
- prompt-safe organization-memory context 會補上跨案件行

- [ ] **Step 2: Run backend tests to verify failure**

Run: `PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -q -k "cross_matter_organization_memory or build_payload_organization_memory_context_keeps_prompt_safe_lines"`

- [ ] **Step 3: Add frontend failing tests**

覆蓋：
- organization memory helper 會把 cross-matter summary / items 轉成低噪音 view

- [ ] **Step 4: Run frontend tests to verify failure**

Run: `cd frontend && node --test tests/intake-progress.test.mjs`

### Task 2: Implement backend cross-matter memory

**Files:**
- Modify: `backend/app/domain/schemas.py`
- Modify: `backend/app/services/organization_memory_intelligence.py`
- Modify: `backend/app/services/tasks.py`
- Modify: `backend/app/agents/base.py`

- [ ] **Step 1: Extend organization-memory contract**

新增：
- `cross_matter_summary`
- `cross_matter_items`

- [ ] **Step 2: Derive related matter summaries**

只允許：
- 同客戶
- 名稱高度相近
- 少量 related matters

- [ ] **Step 3: Wire Host payload**

讓 prompt-safe `organization_memory_context` 能讀到少量跨案件背景。

- [ ] **Step 4: Run backend tests**

Run: `PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -q -k "cross_matter_organization_memory or build_payload_organization_memory_context_keeps_prompt_safe_lines"`

### Task 3: Add low-noise frontend reading

**Files:**
- Modify: `frontend/src/lib/types.ts`
- Modify: `frontend/src/lib/organization-memory.ts`
- Modify: `frontend/src/components/matter-workspace-panel.tsx`
- Modify: `frontend/src/components/task-detail-panel.tsx`

- [ ] **Step 1: Extend view helper**

讓 organization-memory helper 能回出跨案件摘要與少量卡片。

- [ ] **Step 2: Keep UI low-noise**

只補：
- `另有 N 個同客戶案件可回看其穩定背景`
- 1 到 3 張相關案件摘要卡

- [ ] **Step 3: Run frontend tests**

Run: `cd frontend && node --test tests/intake-progress.test.mjs`

### Task 4: Sync active docs

**Files:**
- Modify: `docs/00_product_definition_and_current_state.md`
- Modify: `docs/01_runtime_architecture_and_data_contracts.md`
- Modify: `docs/02_host_agents_packs_and_extension_system.md`
- Modify: `docs/03_workbench_ux_and_page_spec.md`
- Modify: `docs/04_qa_matrix.md`

- [ ] **Step 1: Update docs**

把：
- cross-matter memory boundary
- Host-owned prompt-safe usage
- low-noise UI posture

寫清楚。

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
git add backend/app/domain/schemas.py backend/app/services/organization_memory_intelligence.py backend/app/services/tasks.py backend/app/agents/base.py backend/tests/test_mvp_slice.py frontend/src/lib/types.ts frontend/src/lib/organization-memory.ts frontend/src/components/matter-workspace-panel.tsx frontend/src/components/task-detail-panel.tsx frontend/tests/intake-progress.test.mjs docs/00_product_definition_and_current_state.md docs/01_runtime_architecture_and_data_contracts.md docs/02_host_agents_packs_and_extension_system.md docs/03_workbench_ux_and_page_spec.md docs/04_qa_matrix.md docs/superpowers/specs/2026-04-05-cross-matter-organization-memory-v2-design.md docs/superpowers/plans/2026-04-05-cross-matter-organization-memory-v2.md
git commit -m "feat: add cross-matter organization memory"
git push origin codex/baseline-sync-and-sparse-diagnostic
```
