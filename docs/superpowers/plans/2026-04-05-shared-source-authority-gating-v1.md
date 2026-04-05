# Shared Source Authority Gating V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 讓 background-only shared source 不再把 playbook / template guidance 誤抬成 `available`。

**Architecture:** 不新增新表，直接在 `domain_playbook_guidance` 與 `deliverable_template_guidance` 的 status 決策處加入 authority gate。若只有 background-only shared source，則維持 `fallback`。

**Tech Stack:** Python, FastAPI, pytest

---

### Task 1: Add failing tests

**Files:**
- Modify: `backend/tests/test_mvp_slice.py`

- [ ] playbook with only background-only sources stays `fallback`
- [ ] template with only background-only precedent stays `fallback`

### Task 2: Implement authority gating

**Files:**
- Modify: `backend/app/services/domain_playbook_intelligence.py`
- Modify: `backend/app/services/deliverable_template_intelligence.py`

- [ ] track whether a source is authoritative enough to count as `available`
- [ ] keep background-only sources useful for calibration, but not for `available`

### Task 3: Sync docs and QA

**Files:**
- Modify: `docs/00_product_definition_and_current_state.md`
- Modify: `docs/01_runtime_architecture_and_data_contracts.md`
- Modify: `docs/04_qa_matrix.md`
- Create: `docs/superpowers/specs/2026-04-05-shared-source-authority-gating-v1-design.md`
- Create: `docs/superpowers/plans/2026-04-05-shared-source-authority-gating-v1.md`

### Task 4: Verify and push

- [ ] `python3 -m compileall backend/app`
- [ ] `PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -q`
- [ ] frontend helper tests / build / typecheck
- [ ] commit and push
