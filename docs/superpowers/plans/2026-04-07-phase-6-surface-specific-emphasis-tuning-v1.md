# Phase 6 Surface-Specific Emphasis Tuning v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 讓 condensed `Phase 6` note 在保持一致骨架的同時，再更清楚回答這條 reusable signal 現在主要拿來校正哪一塊。

**Architecture:** 只改 frontend 的 shared condensed-note helper 與 3 個 reusable guidance helper。新增一段很短的 emphasis label，讓 `organization memory`、`domain playbook`、`deliverable template` 各自帶出不同的行動焦點。backend contract 不變。

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, node:test

---

## Scope Guard

這份 plan 只處理：

- condensed-note emphasis tuning
- helper wiring
- docs / QA / verification

這份 plan **不處理**：

- backend schema change
- homepage redesign
- new signal
- governance logic rewrite

## File Structure

### Frontend

- Modify: `frontend/src/lib/phase-six-second-layer.js`
- Modify: `frontend/src/lib/phase-six-second-layer.d.ts`
- Modify: `frontend/src/lib/organization-memory.ts`
- Modify: `frontend/src/lib/domain-playbooks.ts`
- Modify: `frontend/src/lib/deliverable-templates.ts`
- Test: `frontend/tests/intake-progress.test.mjs`

### Docs

- Modify: `docs/00_product_definition_and_current_state.md`
- Modify: `docs/03_workbench_ux_and_page_spec.md`
- Modify: `docs/04_qa_matrix.md`
- Modify: `docs/superpowers/specs/2026-04-07-phase-6-surface-specific-emphasis-tuning-v1-design.md`

### Task 1: Failing Tests and Shared Helper

- [x] Write failing tests that expect a short surface-specific emphasis segment.
- [x] Verify the tests fail.
- [x] Update the shared condensed-note helper.
- [x] Re-run targeted frontend tests.

### Task 2: Helper Wiring

- [x] Pass emphasis labels from the three reusable guidance helpers into the shared helper.
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
