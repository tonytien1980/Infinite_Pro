# Feedback-Linked Shared-Source Decay V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 讓 precedent 驅動的 playbook / template guidance 在遇到新的負向 feedback 時，能更明確讀成「先退到背景觀察」。

**Architecture:** 不新增資料表，沿用既有 `source_feedback_status` 與 `reactivation_summary` 路徑，補一個平行的 `decay_summary`。

**Tech Stack:** Python, FastAPI, TypeScript, pytest, node:test

---

### Task 1: Add failing tests

**Files:**
- Modify: `backend/tests/test_mvp_slice.py`
- Modify: `frontend/tests/intake-progress.test.mjs`

- [ ] playbook prompt context exposes `來源退背景`
- [ ] template prompt context exposes `來源退背景`
- [ ] needs-revision precedent can push playbook guidance back to fallback/background
- [ ] needs-revision precedent can push template guidance back to fallback/background

### Task 2: Implement backend feedback-linked decay

**Files:**
- Modify: `backend/app/domain/schemas.py`
- Modify: `backend/app/services/domain_playbook_intelligence.py`
- Modify: `backend/app/services/deliverable_template_intelligence.py`
- Modify: `backend/app/agents/base.py`

- [ ] add `decay_summary` to playbook / template guidance
- [ ] treat `needs_revision` / `downweight` precedent as background-only for guidance priority
- [ ] expose `來源退背景` in prompt-safe payloads

### Task 3: Sync docs and QA

**Files:**
- Modify: `docs/00_product_definition_and_current_state.md`
- Modify: `docs/01_runtime_architecture_and_data_contracts.md`
- Modify: `docs/03_workbench_ux_and_page_spec.md`
- Modify: `docs/04_qa_matrix.md`
- Create: `docs/superpowers/specs/2026-04-05-feedback-linked-shared-source-decay-v1-design.md`
- Create: `docs/superpowers/plans/2026-04-05-feedback-linked-shared-source-decay-v1.md`

### Task 4: Verify and push

- [ ] `python3 -m compileall backend/app`
- [ ] `PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -q`
- [ ] `cd frontend && node --test tests/intake-progress.test.mjs`
- [ ] `cd frontend && npm run build`
- [ ] `cd frontend && NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8010/api/v1 npm run build`
- [ ] `cd frontend && rm -f .next/cache/.tsbuildinfo && npx next typegen && npm run typecheck`
- [ ] commit and push
