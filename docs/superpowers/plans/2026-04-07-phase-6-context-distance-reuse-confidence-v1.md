# Phase 6 Context-Distance Reuse Confidence v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 讓 system 正式回答 reusable assets 與目前案件脈絡的距離，以及目前比較像高信心重用、有限邊界重用，或低信心重用。

**Architecture:** 後端新增 `phase-6 context-distance audit` read model 與 route，前端將其掛回首頁既有 `Generalist Governance`，作為 low-noise `reuse confidence` 摘要。文件與 QA 同步更新。

**Tech Stack:** FastAPI, Pydantic 2, Next.js 15 App Router, React 19, TypeScript, node:test

---

## Scope Guard

這份 plan 只處理：

- context-distance / reuse-confidence read model
- homepage low-noise reuse-confidence summary
- docs / QA / verification

這份 plan **不處理**：

- Host weighting rewrite
- automatic gating
- new dashboard
- task / matter / deliverable propagation

## File Structure

### Backend

- Modify: `backend/app/services/phase_six_generalist_governance.py`
- Modify: `backend/app/services/workbench.py`
- Modify: `backend/app/api/routes/workbench.py`
- Modify: `backend/app/workbench/schemas.py`
- Test: `backend/tests/test_mvp_slice.py`

### Frontend

- Modify: `frontend/src/lib/types.ts`
- Modify: `frontend/src/lib/api.ts`
- Modify: `frontend/src/lib/phase-six-governance.ts`
- Modify: `frontend/src/components/workbench-home.tsx`
- Test: `frontend/tests/phase-six-governance.test.mjs`

### Docs

- Modify: `docs/00_product_definition_and_current_state.md`
- Modify: `docs/01_runtime_architecture_and_data_contracts.md`
- Modify: `docs/03_workbench_ux_and_page_spec.md`
- Modify: `docs/04_qa_matrix.md`
- Modify: `docs/superpowers/specs/2026-04-07-phase-6-context-distance-reuse-confidence-v1-design.md`

### Task 1: Backend Read Model

- [x] Write failing tests for context-distance route and confidence states.
- [x] Verify the tests fail.
- [x] Implement minimal schema / builder / route.
- [x] Re-run targeted backend tests.

### Task 2: Homepage Reuse Confidence Summary

- [x] Write failing frontend tests for distance / confidence labels.
- [x] Verify the tests fail.
- [x] Add low-noise `reuse confidence` summary into existing `Generalist Governance`.
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
