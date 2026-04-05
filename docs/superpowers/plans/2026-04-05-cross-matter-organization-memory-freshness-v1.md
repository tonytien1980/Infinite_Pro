# Cross-Matter Organization Memory Freshness V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 讓 cross-matter organization memory 開始區分最近更新、近期可參考、較舊背景，並把偏舊背景留在背景校正層。

**Architecture:** 不新增新表，沿用既有 `organization_memory_guidance` 與 `cross_matter_items`，補 `freshness_summary` 和 `freshness_label`；Host prompt context 與既有頁面一起低噪音回讀；domain playbook 若吃到偏舊 cross-matter background，會更保守地把它留在背景校正層。

**Tech Stack:** Python, FastAPI, Pydantic, Next.js, TypeScript, pytest, node:test

---

### Task 1: Add failing tests

**Files:**
- Modify: `backend/tests/test_mvp_slice.py`
- Modify: `frontend/tests/intake-progress.test.mjs`

- [ ] organization-memory freshness read model
- [ ] prompt context includes `背景新鮮度：...`
- [ ] stale cross-matter background stays background-only in domain playbook
- [ ] organization-memory helper reads freshness summary and item freshness label

### Task 2: Implement freshness v1

**Files:**
- Modify: `backend/app/domain/schemas.py`
- Modify: `backend/app/services/organization_memory_intelligence.py`
- Modify: `backend/app/services/domain_playbook_intelligence.py`
- Modify: `backend/app/agents/base.py`
- Modify: `frontend/src/lib/types.ts`
- Modify: `frontend/src/lib/organization-memory.ts`
- Modify: `frontend/src/components/matter-workspace-panel.tsx`
- Modify: `frontend/src/components/task-detail-panel.tsx`

### Task 3: Sync active docs and QA

**Files:**
- Modify: `docs/00_product_definition_and_current_state.md`
- Modify: `docs/01_runtime_architecture_and_data_contracts.md`
- Modify: `docs/03_workbench_ux_and_page_spec.md`
- Modify: `docs/04_qa_matrix.md`
- Create: `docs/superpowers/specs/2026-04-05-cross-matter-organization-memory-freshness-v1-design.md`
- Create: `docs/superpowers/plans/2026-04-05-cross-matter-organization-memory-freshness-v1.md`

### Task 4: Full verification and git sync

- [ ] `python3 -m compileall backend/app`
- [ ] `PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -q`
- [ ] `cd frontend && node --test tests/intake-progress.test.mjs`
- [ ] frontend builds + typecheck
- [ ] commit and push
