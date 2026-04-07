# Phase 6 Calibration-Aware Reuse Weighting v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `confidence calibration` 正式接回 Host 的 reusable ordering，讓 mismatch 真的影響 precedent / playbook / template weighting。

**Architecture:** 後端新增一條 `phase-6 calibration-aware reuse weighting` read model，並在 precedent weighting helper 補入 `client stage / client type / domain lens` alignment signal。首頁不新增新卡牆，只把既有 `Host weighting` 摘要改讀 calibration-aware summary。文件與 QA 同步更新。

**Tech Stack:** FastAPI, Pydantic 2, Next.js 15 App Router, React 19, TypeScript, node:test

---

## Scope Guard

這份 plan 只處理：

- calibration-aware weighting contract
- Host reusable ordering calibration
- homepage low-noise Host weighting summary update
- docs / QA / verification

這份 plan **不處理**：

- policy editor
- hard blocking
- new dashboard
- new second-layer propagation

## File Structure

### Backend

- Modify: `backend/app/workbench/schemas.py`
- Modify: `backend/app/api/routes/workbench.py`
- Modify: `backend/app/services/workbench.py`
- Modify: `backend/app/services/phase_six_generalist_governance.py`
- Modify: `backend/app/domain/schemas.py`
- Modify: `backend/app/services/tasks.py`
- Modify: `backend/app/services/precedent_intelligence.py`
- Modify: `backend/app/services/domain_playbook_intelligence.py`
- Modify: `backend/app/services/deliverable_template_intelligence.py`
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
- Modify: `docs/superpowers/specs/2026-04-07-phase-6-calibration-aware-reuse-weighting-v1-design.md`

### Task 1: Backend Route and Weighting Rule

- [x] Write failing tests for the new route and calibration-aware ordering.
- [x] Verify the tests fail.
- [x] Add backend read model and route.
- [x] Pass alignment signal into reusable weighting.
- [x] Re-run targeted backend tests.

### Task 2: Homepage Host Weighting Readout

- [x] Write failing frontend test for the new low-noise weighting summary.
- [x] Verify the test fails.
- [x] Wire the new route into the existing `Host weighting` section.
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

- [ ] Commit and push the slice branch.
