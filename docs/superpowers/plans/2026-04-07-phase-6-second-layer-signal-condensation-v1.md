# Phase 6 Second-Layer Signal Condensation v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 second-layer cards 上已累積的 4 條 Phase 6 notes 收斂成 1 條 low-noise condensed note。

**Architecture:** 新增一個共用 frontend helper，把 guidance posture、reuse confidence、confidence calibration、Host weighting 四條 signal 收成單一 consultant-readable note。既有 `organization memory`、`domain playbook`、`deliverable template` helper 轉而讀這個 condensed note。backend contract 不改。

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, node:test

---

## Scope Guard

這份 plan 只處理：

- second-layer Phase 6 note condensation
- helper dedup
- panel rendering simplification
- docs / QA / verification

這份 plan **不處理**：

- backend schema change
- homepage redesign
- more propagation
- governance logic rewrite

## File Structure

### Frontend

- Add: `frontend/src/lib/phase-six-second-layer.ts`
- Modify: `frontend/src/lib/organization-memory.ts`
- Modify: `frontend/src/lib/domain-playbooks.ts`
- Modify: `frontend/src/lib/deliverable-templates.ts`
- Modify: `frontend/src/components/task-detail-panel.tsx`
- Modify: `frontend/src/components/matter-workspace-panel.tsx`
- Modify: `frontend/src/components/deliverable-workspace-panel.tsx`
- Test: `frontend/tests/intake-progress.test.mjs`

### Docs

- Modify: `docs/00_product_definition_and_current_state.md`
- Modify: `docs/03_workbench_ux_and_page_spec.md`
- Modify: `docs/04_qa_matrix.md`
- Modify: `docs/superpowers/specs/2026-04-07-phase-6-second-layer-signal-condensation-v1-design.md`

### Task 1: Helper Condensation

- [x] Write failing tests for condensed second-layer note behavior.
- [x] Verify the tests fail.
- [x] Add shared Phase 6 condensation helper and rewire existing helper functions.
- [x] Re-run targeted frontend tests.

### Task 2: Panel Dedup

- [x] Update task / matter / deliverable panels to render one condensed note instead of 4 lines.
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
