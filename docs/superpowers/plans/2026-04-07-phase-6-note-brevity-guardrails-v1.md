# Phase 6 Note Brevity Guardrails v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 condensed `Phase 6` note 的字句長度正式鎖住，維持單行、短標籤、低噪音。

**Architecture:** 只改 frontend shared helper。把目前可顯示的 reusable lifecycle 與 emphasis 句子改成更短的 canonical labels，並用測試釘住單行與三段結構。backend contract 不變。

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, node:test

---

## Scope Guard

這份 plan 只處理：

- condensed-note short labels
- note shape guardrails
- docs / QA / verification

這份 plan **不處理**：

- backend schema change
- homepage redesign
- new signal
- broader copy rewrite

## File Structure

### Frontend

- Modify: `frontend/src/lib/phase-six-second-layer.js`
- Modify: `frontend/src/lib/phase-six-second-layer.d.ts`
- Modify: `frontend/tests/intake-progress.test.mjs`

### Docs

- Modify: `docs/00_product_definition_and_current_state.md`
- Modify: `docs/03_workbench_ux_and_page_spec.md`
- Modify: `docs/04_qa_matrix.md`
- Modify: `docs/superpowers/specs/2026-04-07-phase-6-note-brevity-guardrails-v1-design.md`

### Task 1: Failing Tests and Helper Guardrails

- [x] Write failing tests that expect shorter labels and a stable three-part note shape.
- [x] Verify the tests fail.
- [x] Implement short-label normalization and note-shape guardrails.
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
