# Shared-Source Freshness / Retirement V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 讓 `domain playbook` 和 `deliverable template` 開始正式讀懂 shared source 的 freshness / retirement 姿態，而不只停在 authority gating。

**Architecture:** 不新增資料表，直接在現有 guidance contract 補 `freshness_summary`，並在 shared source 已偏舊 / 恢復時，把 `source_lifecycle_summary` 改得更誠實。

**Tech Stack:** Python, FastAPI, TypeScript, pytest, node:test

---

### Task 1: Add failing tests

**Files:**
- Modify: `backend/tests/test_mvp_slice.py`
- Modify: `frontend/tests/intake-progress.test.mjs`

- [ ] playbook prompt context exposes `來源新鮮度`
- [ ] template prompt context exposes `來源新鮮度`
- [ ] stale / recovering playbook sources read as retiring into background
- [ ] stale / recovering template sources read as retiring into background

### Task 2: Implement backend freshness / retirement readback

**Files:**
- Modify: `backend/app/domain/schemas.py`
- Modify: `backend/app/services/domain_playbook_intelligence.py`
- Modify: `backend/app/services/deliverable_template_intelligence.py`
- Modify: `backend/app/agents/base.py`

- [ ] add `freshness_summary` to playbook / template guidance
- [ ] derive freshness from current shared-source posture
- [ ] make retiring sources read as background-only in lifecycle summary
- [ ] include `來源新鮮度` in prompt-safe payloads

### Task 3: Sync frontend helper reads

**Files:**
- Modify: `frontend/src/lib/types.ts`
- Modify: `frontend/src/lib/domain-playbooks.ts`
- Modify: `frontend/src/lib/deliverable-templates.ts`
- Modify: `frontend/src/components/matter-workspace-panel.tsx`
- Modify: `frontend/src/components/task-detail-panel.tsx`
- Modify: `frontend/src/components/deliverable-workspace-panel.tsx`

- [ ] helper views expose freshness summary
- [ ] existing second-layer surfaces show freshness instead of duplicating lifecycle text

### Task 4: Sync docs and QA

**Files:**
- Modify: `docs/00_product_definition_and_current_state.md`
- Modify: `docs/01_runtime_architecture_and_data_contracts.md`
- Modify: `docs/03_workbench_ux_and_page_spec.md`
- Modify: `docs/04_qa_matrix.md`
- Create: `docs/superpowers/specs/2026-04-05-shared-source-freshness-retirement-v1-design.md`
- Create: `docs/superpowers/plans/2026-04-05-shared-source-freshness-retirement-v1.md`

### Task 5: Verify and push

- [ ] `python3 -m compileall backend/app`
- [ ] `PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -q`
- [ ] `cd frontend && node --test tests/intake-progress.test.mjs`
- [ ] `cd frontend && npm run build`
- [ ] `cd frontend && NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8010/api/v1 npm run build`
- [ ] `cd frontend && rm -f .next/cache/.tsbuildinfo && npx next typegen && npm run typecheck`
- [ ] commit and push
