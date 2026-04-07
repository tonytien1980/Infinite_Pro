# Phase 6 Confidence Calibration Propagation v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `confidence calibration` 從首頁 `Generalist Governance` 正式 propagation 到 task / matter / deliverable 的 second-layer guidance。

**Architecture:** 後端在既有 `TaskAggregateResponse` / `MatterWorkspaceResponse` 補 calibration signal。前端讓 `organization memory` / `domain playbook` / `deliverable template` helper 讀這條 signal，並在既有卡片內多一條 low-noise calibration note。文件與 QA 同步更新。

**Tech Stack:** FastAPI, Pydantic 2, Next.js 15 App Router, React 19, TypeScript, node:test

---

## Scope Guard

這份 plan 只處理：

- calibration propagation contract
- second-layer low-noise calibration note
- docs / QA / verification

這份 plan **不處理**：

- new governance page
- consultant ranking
- Host weighting rewrite
- propagation to every guidance card

## File Structure

### Backend

- Modify: `backend/app/domain/schemas.py`
- Modify: `backend/app/services/tasks.py`
- Test: `backend/tests/test_mvp_slice.py`

### Frontend

- Modify: `frontend/src/lib/types.ts`
- Modify: `frontend/src/lib/organization-memory.ts`
- Modify: `frontend/src/lib/domain-playbooks.ts`
- Modify: `frontend/src/lib/deliverable-templates.ts`
- Modify: `frontend/src/components/task-detail-panel.tsx`
- Modify: `frontend/src/components/matter-workspace-panel.tsx`
- Modify: `frontend/src/components/deliverable-workspace-panel.tsx`
- Test: `frontend/tests/intake-progress.test.mjs`

### Docs

- Modify: `docs/00_product_definition_and_current_state.md`
- Modify: `docs/01_runtime_architecture_and_data_contracts.md`
- Modify: `docs/03_workbench_ux_and_page_spec.md`
- Modify: `docs/04_qa_matrix.md`
- Modify: `docs/superpowers/specs/2026-04-07-phase-6-confidence-calibration-propagation-v1-design.md`

### Task 1: Backend Propagation

- [x] Write failing tests for task / matter propagation.
- [x] Verify the tests fail.
- [x] Add low-noise calibration contract to task / matter responses.
- [x] Re-run targeted backend tests.

### Task 2: Frontend Second-Layer Note

- [x] Write failing helper tests for second-layer calibration note.
- [x] Verify the tests fail.
- [x] Add low-noise `Phase 6 confidence calibration` note to existing helper / panel chain.
- [x] Re-run targeted frontend tests.

### Task 3: Docs, QA, and Full Verification

- [x] Mark the slice as shipped in docs.
- [x] Run full verification:

```bash
python3 -m compileall backend/app
PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -q
cd frontend && node --test tests/auth-foundation.test.mjs tests/provider-settings-foundation.test.mjs tests/demo-workspace-isolation.test.mjs tests/phase-six-governance.test.mjs tests/intake-progress.test.mjs
cd frontend && rm -f .next/cache/.tsbuildinfo && mkdir -p .next/types && npx next typegen && npm run typecheck
cd frontend && npm run build
cd frontend && NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8010/api/v1 npm run build
```

- [x] Commit and push the slice branch.
