# Phase 6 Next-Phase Handoff Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 讓 Phase 6 signed-off 後，system 能正式回出 low-noise next-phase handoff，而不是只停在 `signed_off`。

**Architecture:** 沿用既有 `phase-6 completion review` contract，在 signed-off state 補 handoff fields；首頁仍在 `Generalist Governance` 中顯示 handoff readout，不新增新 route family。

**Tech Stack:** FastAPI, SQLAlchemy, Pydantic, Next.js 15 App Router, React 19, TypeScript, node:test, pytest

---

## Scope Guard

這份 plan 只處理：

- signed-off handoff fields
- homepage low-noise handoff readout
- docs / QA / verification

這份 plan **不處理**：

- phase 7 implementation
- roadmap shell
- new dashboard page
- release workflow engine

## File Structure

### Backend

- Modify: `backend/app/workbench/schemas.py`
- Modify: `backend/app/services/phase_six_generalist_governance.py`
- Modify: `backend/app/services/workbench.py`
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
- Modify: `docs/superpowers/specs/2026-04-07-phase-6-next-phase-handoff-foundation-design.md`

### Task 1: Backend handoff contract tests

- [x] Add failing backend tests for phase-6 signed-off handoff fields.
- [x] Implement signed-off handoff fields.
- [x] Re-run targeted backend tests.

### Task 2: Frontend signed-off handoff readout

- [x] Add failing frontend helper tests for low-noise phase-6 handoff wording.
- [x] Implement type / parse / homepage handoff readout.
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
