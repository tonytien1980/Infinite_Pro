# Phase 6 Host-Aware Reuse Weighting v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 讓 Host 在 reusable asset source ordering 時，正式把 `can_expand / keep_contextual / restrict_narrow_use` 納入 weighting，而不只看 shared-intelligence weight_action。

**Architecture:** 後端在 `phase_six_generalist_governance.py` 新增 Host-aware reuse weighting helper，並把它接進 `select_weighted_precedent_reference_items`。第一波只改 precedent-driven reusable asset ordering，且讓 `domain playbook` / `deliverable template` 對 `restrict_narrow_use` 的 precedent 更保守。前端則在既有 `Generalist Governance` 補一條低噪音 `Host weighting` 摘要，讓這個 slice 不是黑箱變化。

**Tech Stack:** FastAPI, SQLAlchemy 2, Pydantic 2, Next.js 15 App Router, React 19, TypeScript, node:test

---

## Scope Guard

這份 plan 只處理：

- Host-aware reuse weighting helper
- reusable asset precedent ordering
- `Generalist Governance` 的 weighting 摘要
- docs / QA / full verification

這份 plan **不處理**：

- automatic hard blocking
- new governance page
- full Host routing rewrite

## File Structure

### Backend

- Modify: `backend/app/services/phase_six_generalist_governance.py`
- Modify: `backend/app/services/precedent_intelligence.py`
- Modify: `backend/app/services/domain_playbook_intelligence.py`
- Modify: `backend/app/services/deliverable_template_intelligence.py`
- Test: `backend/tests/test_mvp_slice.py`

### Frontend

- Modify: `frontend/src/lib/phase-six-governance.ts`
- Modify: `frontend/src/components/workbench-home.tsx`
- Modify: `frontend/tests/phase-six-governance.test.mjs`

### Docs

- Modify: `docs/00_product_definition_and_current_state.md`
- Modify: `docs/01_runtime_architecture_and_data_contracts.md`
- Modify: `docs/03_workbench_ux_and_page_spec.md`
- Modify: `docs/04_qa_matrix.md`
- Modify: `docs/superpowers/specs/2026-04-07-phase-6-host-aware-reuse-weighting-v1-design.md`

### Task 1: Backend Host-Aware Reuse Weighting

**Files:**
- Modify: `backend/app/services/phase_six_generalist_governance.py`
- Modify: `backend/app/services/precedent_intelligence.py`
- Modify: `backend/app/services/domain_playbook_intelligence.py`
- Modify: `backend/app/services/deliverable_template_intelligence.py`
- Test: `backend/tests/test_mvp_slice.py`

- [x] Write failing tests for Host-aware reuse weighting.
- [x] Verify the tests fail.
- [x] Implement minimal weighting helper and integrate it into precedent selection.
- [x] Make playbook / template guidance more conservative for `restrict_narrow_use`.
- [x] Re-run targeted backend tests.
- [ ] Commit with `feat: add host-aware reuse weighting`.

### Task 2: Homepage Weighting Summary

**Files:**
- Modify: `frontend/src/lib/phase-six-governance.ts`
- Modify: `frontend/src/components/workbench-home.tsx`
- Modify: `frontend/tests/phase-six-governance.test.mjs`

- [x] Write failing frontend tests for weighting copy.
- [x] Verify the tests fail.
- [x] Add low-noise `Host weighting` summary to `Generalist Governance`.
- [ ] Re-run node tests, typecheck, and build.
- [ ] Commit with `feat: add host weighting summary`.

### Task 3: Docs, QA, and Full Verification

**Files:**
- Modify: `docs/00_product_definition_and_current_state.md`
- Modify: `docs/01_runtime_architecture_and_data_contracts.md`
- Modify: `docs/03_workbench_ux_and_page_spec.md`
- Modify: `docs/04_qa_matrix.md`
- Modify: `docs/superpowers/specs/2026-04-07-phase-6-host-aware-reuse-weighting-v1-design.md`

- [x] Mark the slice as shipped in docs.
- [ ] Run full verification:

```bash
python3 -m compileall backend/app
PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -q
cd frontend && node --test tests/auth-foundation.test.mjs tests/provider-settings-foundation.test.mjs tests/demo-workspace-isolation.test.mjs tests/phase-six-governance.test.mjs tests/intake-progress.test.mjs
cd frontend && rm -f .next/cache/.tsbuildinfo && mkdir -p .next/types && npx next typegen && npm run typecheck
cd frontend && npm run build
cd frontend && NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8010/api/v1 npm run build
```

- [ ] Commit with `docs: align phase 6 host weighting`.
