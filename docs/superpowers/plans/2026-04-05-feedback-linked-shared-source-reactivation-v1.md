# Feedback-Linked Shared-Source Reactivation V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 讓 playbook / template 的 `reactivation_summary` 不只停在 generic freshness wording，而是能更直接讀出新的 adoption feedback 是否把 shared source 拉回前景。

**Architecture:** 延用既有 `reactivation_summary`，補 `PrecedentReferenceItem.source_feedback_status`，再由 playbook / template guidance 根據 precedent feedback status 決定 summary wording。

**Tech Stack:** Python, FastAPI, TypeScript, pytest

---

### Task 1: Add failing tests

**Files:**
- Modify: `backend/tests/test_mvp_slice.py`

- [ ] playbook reactivation can explicitly read adopted feedback
- [ ] template reactivation can explicitly read template-candidate feedback

### Task 2: Implement backend feedback-linked reactivation

**Files:**
- Modify: `backend/app/domain/schemas.py`
- Modify: `backend/app/services/tasks.py`
- Modify: `backend/app/services/domain_playbook_intelligence.py`
- Modify: `backend/app/services/deliverable_template_intelligence.py`

- [ ] expose `source_feedback_status` on precedent reference items
- [ ] use positive feedback status to specialize reactivation wording
- [ ] preserve generic wording when no explicit feedback link exists

### Task 3: Sync docs and QA

**Files:**
- Modify: `docs/00_product_definition_and_current_state.md`
- Modify: `docs/01_runtime_architecture_and_data_contracts.md`
- Modify: `docs/03_workbench_ux_and_page_spec.md`
- Modify: `docs/04_qa_matrix.md`
- Create: `docs/superpowers/specs/2026-04-05-feedback-linked-shared-source-reactivation-v1-design.md`
- Create: `docs/superpowers/plans/2026-04-05-feedback-linked-shared-source-reactivation-v1.md`

### Task 4: Verify and push

- [ ] `python3 -m compileall backend/app`
- [ ] `PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -q`
- [ ] `cd frontend && node --test tests/intake-progress.test.mjs`
- [ ] `cd frontend && npm run build`
- [ ] `cd frontend && NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8010/api/v1 npm run build`
- [ ] `cd frontend && rm -f .next/cache/.tsbuildinfo && npx next typegen && npm run typecheck`
- [ ] commit and push
