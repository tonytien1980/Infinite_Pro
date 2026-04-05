# Shared-Source Refresh / Reactivation V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 讓 `organization memory`、`domain playbook`、`deliverable template` 不只知道 shared source 何時該退到背景，也開始正式回答何時可重新拉回前景。

**Architecture:** 不新增資料表，直接在既有 guidance contract 補 `reactivation_summary`，並沿用現有 prompt / helper / second-layer surface。

**Tech Stack:** Python, FastAPI, TypeScript, pytest, node:test

---

### Task 1: Add failing tests

**Files:**
- Modify: `backend/tests/test_mvp_slice.py`
- Modify: `frontend/tests/intake-progress.test.mjs`

- [ ] organization memory can read recent + stale cross-matter sources as reactivated
- [ ] playbook prompt context exposes `來源回前景`
- [ ] template prompt context exposes `來源回前景`
- [ ] frontend helper views expose reactivation summary

### Task 2: Implement backend reactivation readback

**Files:**
- Modify: `backend/app/domain/schemas.py`
- Modify: `backend/app/services/organization_memory_intelligence.py`
- Modify: `backend/app/services/domain_playbook_intelligence.py`
- Modify: `backend/app/services/deliverable_template_intelligence.py`
- Modify: `backend/app/agents/base.py`

- [ ] add `reactivation_summary` to guidance contracts
- [ ] derive recent-vs-stale mixed-source reactivation messaging
- [ ] expose prompt-safe `來源回前景`

### Task 3: Sync frontend helper reads

**Files:**
- Modify: `frontend/src/lib/types.ts`
- Modify: `frontend/src/lib/organization-memory.ts`
- Modify: `frontend/src/lib/domain-playbooks.ts`
- Modify: `frontend/src/lib/deliverable-templates.ts`
- Modify: `frontend/src/components/matter-workspace-panel.tsx`
- Modify: `frontend/src/components/task-detail-panel.tsx`
- Modify: `frontend/src/components/deliverable-workspace-panel.tsx`

- [ ] helper views expose reactivation summary
- [ ] existing second-layer surfaces show reactivation as a distinct low-noise line

### Task 4: Sync docs and QA

**Files:**
- Modify: `docs/00_product_definition_and_current_state.md`
- Modify: `docs/01_runtime_architecture_and_data_contracts.md`
- Modify: `docs/03_workbench_ux_and_page_spec.md`
- Modify: `docs/04_qa_matrix.md`
- Create: `docs/superpowers/specs/2026-04-05-shared-source-refresh-reactivation-v1-design.md`
- Create: `docs/superpowers/plans/2026-04-05-shared-source-refresh-reactivation-v1.md`

### Task 5: Verify and push

- [ ] `python3 -m compileall backend/app`
- [ ] `PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -q`
- [ ] `cd frontend && node --test tests/intake-progress.test.mjs`
- [ ] `cd frontend && npm run build`
- [ ] `cd frontend && NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8010/api/v1 npm run build`
- [ ] `cd frontend && rm -f .next/cache/.tsbuildinfo && npx next typegen && npm run typecheck`
- [ ] commit and push
