# Research / Investigation Complete Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade `Research / Investigation` from a first pass to a more mature read-model by enriching `research_guidance` with source-quality, freshness, contradiction, citation-ready, and evidence-gap-closure answers, then surface them in the existing workbench without creating a new research UI.

**Architecture:** Reuse `ResearchGuidanceRead` and the current matter / task / evidence work surfaces. Extend the research contract rather than inventing a new research layer, and keep the visible UI low-noise by enriching the existing research guidance cards and disclosures.

**Tech Stack:** FastAPI, Python, Pydantic, Next.js App Router, TypeScript, pytest, node:test

---

### Task 1: Lock the mature research contract in tests

**Files:**
- Modify: `backend/tests/test_mvp_slice.py`
- Modify: `frontend/tests/intake-progress.test.mjs`

- [ ] Add failing backend assertions so research guidance must expose source-quality, freshness, contradiction, citation-ready, and gap-closure fields.
- [ ] Keep the strict / not-needed path covered so the new fields do not create noisy junk output.
- [ ] Add a frontend helper test for the richer research-guidance view.
- [ ] Run targeted tests and confirm they fail for the expected reason.

### Task 2: Extend backend `research_guidance`

**Files:**
- Modify: `backend/app/domain/schemas.py`
- Modify: `backend/app/services/tasks.py`

- [ ] Add the new research-guidance fields to the schema.
- [ ] Derive low-noise summaries from existing depth, evidence expectations, gap titles, and latest research-run information.
- [ ] Keep `suggested_questions` as the visible sub-question decomposition.
- [ ] Re-run targeted backend tests and verify the contract passes.

### Task 3: Enrich the existing research guidance UI

**Files:**
- Modify: `frontend/src/lib/types.ts`
- Modify: `frontend/src/lib/research-lane.ts`
- Modify: `frontend/src/components/matter-workspace-panel.tsx`
- Modify: `frontend/src/components/task-detail-panel.tsx`
- Modify: `frontend/src/components/artifact-evidence-workspace-panel.tsx`

- [ ] Update TypeScript types and the research-guidance helper.
- [ ] Add low-noise summaries for the richer research contract to the existing work surfaces.
- [ ] Avoid turning the pages into a research dashboard; keep the first visible line compact and push detail into existing secondary areas.
- [ ] Re-run frontend tests after the UI changes.

### Task 4: Sync active docs and QA evidence

**Files:**
- Modify: `docs/00_product_definition_and_current_state.md`
- Modify: `docs/01_runtime_architecture_and_data_contracts.md`
- Modify: `docs/02_host_agents_packs_and_extension_system.md`
- Modify: `docs/03_workbench_ux_and_page_spec.md`
- Modify: `docs/04_qa_matrix.md`

- [ ] Update active docs so `Research / Investigation` is now described as a fuller lane rather than only depth + first-question guidance.
- [ ] Keep the docs clear that this is still low-noise and Host-owned, not a new research console.
- [ ] Run final verification: `python3 -m compileall backend/app`, `PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -q`, `cd frontend && node --test tests/intake-progress.test.mjs`, `cd frontend && npm run build`, and `cd frontend && rm -f .next/cache/.tsbuildinfo && npx next typegen && npm run typecheck`.
- [ ] Add real evidence to `docs/04_qa_matrix.md`, then commit and push.
