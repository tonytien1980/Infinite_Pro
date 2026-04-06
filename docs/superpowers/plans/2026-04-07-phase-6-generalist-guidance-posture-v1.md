# Phase 6 Generalist Guidance Posture v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 phase-6 audit / governance / host-weighting 訊號收成一條正式的 consultant-facing `generalist guidance posture`，回答 system 現在應維持多低噪音、多明示邊界、多保守引導。

**Architecture:** 後端在 `phase_six_generalist_governance.py` 新增 guidance posture builder，並透過新的 `/workbench/phase-6-generalist-guidance-posture` route 回出結構化 contract。前端在既有 `Generalist Governance` 內補一個 low-noise `guidance posture` block，不新增新頁。文件與 QA 同步更新。

**Tech Stack:** FastAPI, Pydantic 2, Next.js 15 App Router, React 19, TypeScript, node:test

---

## Scope Guard

這份 plan 只處理：

- phase-6 guidance posture read model
- homepage low-noise guidance posture summary
- docs / QA / full verification

這份 plan **不處理**：

- consultant ranking
- user maturity preference
- new dashboard / console
- task / matter / deliverable 全面改寫

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
- Modify: `docs/superpowers/specs/2026-04-07-phase-6-generalist-guidance-posture-v1-design.md`

### Task 1: Backend Guidance Posture Read Model

**Files:**
- Modify: `backend/app/services/phase_six_generalist_governance.py`
- Modify: `backend/app/services/workbench.py`
- Modify: `backend/app/api/routes/workbench.py`
- Modify: `backend/app/workbench/schemas.py`
- Test: `backend/tests/test_mvp_slice.py`

- [x] Write failing tests for the new guidance posture route and posture state.
- [x] Verify the tests fail.
- [x] Implement minimal builder / schema / route.
- [x] Re-run targeted backend tests.

### Task 2: Homepage Guidance Posture Summary

**Files:**
- Modify: `frontend/src/lib/types.ts`
- Modify: `frontend/src/lib/api.ts`
- Modify: `frontend/src/lib/phase-six-governance.ts`
- Modify: `frontend/src/components/workbench-home.tsx`
- Test: `frontend/tests/phase-six-governance.test.mjs`

- [x] Write failing frontend tests for guidance posture labels / summary.
- [x] Verify the tests fail.
- [x] Add low-noise `guidance posture` summary into existing `Generalist Governance`.
- [x] Re-run node tests, typecheck, and build.

### Task 3: Docs, QA, and Full Verification

**Files:**
- Modify: `docs/00_product_definition_and_current_state.md`
- Modify: `docs/01_runtime_architecture_and_data_contracts.md`
- Modify: `docs/03_workbench_ux_and_page_spec.md`
- Modify: `docs/04_qa_matrix.md`
- Modify: `docs/superpowers/specs/2026-04-07-phase-6-generalist-guidance-posture-v1-design.md`

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
