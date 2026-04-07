# Phase 6 Governance Scorecard / Completion Review Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 讓 system 能回讀 Phase 6 的治理分數與 completion review readiness，並允許 owner 記錄低噪音 checkpoint。

**Architecture:** backend 以既有 phase-review state 與 closure-criteria evidence 為基礎，補上一個 `phase-6 completion review` read model 與 owner-only checkpoint action；frontend 在既有 `Generalist Governance` 裡補一塊 completion review 摘要與 checkpoint action。這一刀只建立 foundation，不做 sign-off。

**Tech Stack:** FastAPI, SQLAlchemy, Pydantic, Next.js 15 App Router, React 19, TypeScript, node:test, pytest

---

## Scope Guard

這份 plan 只處理：

- phase-6 governance scorecard
- completion review read model
- owner-only checkpoint action
- docs / QA / verification

這份 plan **不處理**：

- phase-6 sign-off
- release / handoff flow
- scoring dashboard
- persisted governance scoring rewrite

## File Structure

### Backend

- Modify: `backend/app/workbench/schemas.py`
- Modify: `backend/app/services/phase_six_generalist_governance.py`
- Modify: `backend/app/services/workbench.py`
- Modify: `backend/app/api/routes/workbench.py`
- Modify: `backend/tests/test_mvp_slice.py`

### Frontend

- Modify: `frontend/src/lib/types.ts`
- Modify: `frontend/src/lib/api.ts`
- Modify: `frontend/src/lib/phase-six-governance.ts`
- Modify: `frontend/src/components/workbench-home.tsx`
- Modify: `frontend/tests/phase-six-governance.test.mjs`

### Docs

- Modify: `docs/00_product_definition_and_current_state.md`
- Modify: `docs/01_runtime_architecture_and_data_contracts.md`
- Modify: `docs/03_workbench_ux_and_page_spec.md`
- Modify: `docs/04_qa_matrix.md`
- Modify: `docs/superpowers/specs/2026-04-07-phase-6-governance-scorecard-completion-review-foundation-design.md`

### Task 1: Backend contract and checkpoint tests

- [x] Add failing backend tests for `/workbench/phase-6-completion-review`.
- [x] Add failing backend tests for owner checkpoint / consultant forbidden path.
- [x] Implement schema / service / route / checkpoint persistence.
- [x] Re-run targeted backend tests.

### Task 2: Frontend summary and action

- [x] Add failing frontend helper tests for completion review labels / scorecard summary.
- [x] Implement type / api / helper / homepage low-noise completion review block.
- [x] Re-run targeted frontend tests.

### Task 3: Docs, QA, and full verification

- [x] Mark the slice as shipped in active docs and spec.
- [x] Add fresh evidence to QA matrix.
- [x] Run full verification:

```bash
python3 -m compileall backend/app
PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -q
cd frontend && node --test tests/auth-foundation.test.mjs tests/provider-settings-foundation.test.mjs tests/demo-workspace-isolation.test.mjs tests/phase-six-governance.test.mjs tests/intake-progress.test.mjs
cd frontend && rm -f .next/cache/.tsbuildinfo && mkdir -p .next/types && npx next typegen && npm run typecheck
cd frontend && npm run build
cd frontend && NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8010/api/v1 npm run build
```

- [ ] Commit and push the slice branch.
