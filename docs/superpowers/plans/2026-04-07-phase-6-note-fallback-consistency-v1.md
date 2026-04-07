# Phase 6 Note Fallback Consistency v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 讓 condensed `Phase 6` note 在主要 lifecycle 訊號缺失時，仍能穩定退回一致、簡短、可預期的次要訊號。

**Architecture:** 只改 frontend shared helper 與 tests。把 weighting / calibration / reuse-confidence 三層 fallback 的短標籤正式定死，避免不同缺訊號情境下又長回臨時文案。backend contract 不變。

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, node:test

---

## Scope Guard

這份 plan 只處理：

- condensed-note fallback order
- fallback short labels
- docs / QA / verification

這份 plan **不處理**：

- backend schema change
- homepage redesign
- new signal
- copy overhaul

## File Structure

### Frontend

- Modify: `frontend/src/lib/phase-six-second-layer.js`
- Modify: `frontend/src/lib/phase-six-second-layer.d.ts`
- Modify: `frontend/tests/intake-progress.test.mjs`

### Docs

- Modify: `docs/00_product_definition_and_current_state.md`
- Modify: `docs/03_workbench_ux_and_page_spec.md`
- Modify: `docs/04_qa_matrix.md`
- Modify: `docs/superpowers/specs/2026-04-07-phase-6-note-fallback-consistency-v1-design.md`

### Task 1: Failing Tests and Shared Helper

- [x] Write failing tests for fallback order and short-label output.
- [x] Verify the tests fail.
- [x] Implement fallback short-label consistency.
- [x] Re-run targeted frontend tests.

### Task 2: Docs, QA, and Full Verification

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
