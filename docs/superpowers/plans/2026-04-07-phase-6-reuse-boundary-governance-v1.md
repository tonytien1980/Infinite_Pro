# Phase 6 Reuse-Boundary Governance v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 讓 Infinite Pro 正式把 reusable intelligence 的 `generalizable / contextual / narrow_use` 轉成更明確的治理建議，而不只是 audit 信號。

**Architecture:** 後端新增一個 `phase-6 reuse-boundary governance` read model，從既有 phase-6 audit items 推導出 `can_expand / keep_contextual / restrict_narrow_use` 建議；前端則在既有 `Generalist Governance` panel 補上低噪音治理摘要，讓 owner / consultant 能快速理解哪些資產可以放大重用、哪些應被限制在局部情境。這一刀仍不做 enforcement，只做可讀治理。

**Tech Stack:** FastAPI, SQLAlchemy 2, Pydantic 2, Next.js 15 App Router, React 19, TypeScript, node:test

---

## Scope Guard

這份 plan 只處理：

- backend reuse-boundary governance read model
- homepage `Generalist Governance` 的治理摘要
- docs / QA / full verification

這份 plan **不處理**：

- 自動 gating
- approval workflow
- new governance page
- team ranking / consultant scoring

## File Structure

### Backend

- Modify: `backend/app/workbench/schemas.py`
- Modify: `backend/app/services/phase_six_generalist_governance.py`
- Modify: `backend/app/services/workbench.py`
- Modify: `backend/app/api/routes/workbench.py`
- Test: `backend/tests/test_mvp_slice.py`

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
- Modify: `docs/superpowers/specs/2026-04-07-phase-6-reuse-boundary-governance-v1-design.md`

### Task 1: Backend Reuse-Boundary Governance Read Model

**Files:**
- Modify: `backend/app/workbench/schemas.py`
- Modify: `backend/app/services/phase_six_generalist_governance.py`
- Modify: `backend/app/services/workbench.py`
- Modify: `backend/app/api/routes/workbench.py`
- Test: `backend/tests/test_mvp_slice.py`

- [ ] Write the failing backend tests.
- [ ] Run the targeted test to verify `404` / missing schema failure.
- [ ] Add reuse-boundary governance schemas and read model.
- [ ] Add `GET /workbench/phase-6-reuse-boundary-governance`.
- [ ] Re-run targeted backend tests to green.
- [ ] Commit with `feat: add phase 6 reuse boundary governance`.

### Task 2: Homepage Governance Summary

**Files:**
- Modify: `frontend/src/lib/types.ts`
- Modify: `frontend/src/lib/api.ts`
- Modify: `frontend/src/lib/phase-six-governance.ts`
- Modify: `frontend/src/components/workbench-home.tsx`
- Modify: `frontend/tests/phase-six-governance.test.mjs`

- [ ] Write the failing frontend tests for reuse-boundary governance labels.
- [ ] Run node tests to verify the helper is still missing.
- [ ] Add parser / helper / homepage low-noise governance summary.
- [ ] Re-run node tests, typecheck, and build.
- [ ] Commit with `feat: add reuse boundary governance summary`.

### Task 3: Docs, QA, and Full Verification

**Files:**
- Modify: `docs/00_product_definition_and_current_state.md`
- Modify: `docs/01_runtime_architecture_and_data_contracts.md`
- Modify: `docs/03_workbench_ux_and_page_spec.md`
- Modify: `docs/04_qa_matrix.md`
- Modify: `docs/superpowers/specs/2026-04-07-phase-6-reuse-boundary-governance-v1-design.md`

- [ ] Mark the slice as shipped in docs.
- [ ] Run full verification:

```bash
python3 -m compileall backend/app
PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -q
cd frontend && node --test tests/auth-foundation.test.mjs tests/provider-settings-foundation.test.mjs tests/demo-workspace-isolation.test.mjs tests/phase-six-governance.test.mjs tests/intake-progress.test.mjs
cd frontend && rm -f .next/cache/.tsbuildinfo && mkdir -p .next/types && npx next typegen && npm run typecheck
cd frontend && npm run build
cd frontend && NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8010/api/v1 npm run build
```

- [ ] Commit with `docs: align phase 6 reuse boundary governance`.
