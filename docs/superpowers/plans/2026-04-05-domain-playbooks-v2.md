# Domain Playbooks V2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 讓 domain playbook 從 v1 的工作主線提示，升級成會吸收 cross-matter organization memory，並明確說出這輪為何適用與來源組合的 shared-intelligence guidance。

**Architecture:** backend 在 `domain_playbook_guidance` 上新增 `fit_summary` / `source_mix_summary`，並允許 `organization_memory` 成為 playbook stage source。frontend 只在 matter / task second-layer disclosure 增加低噪音 readback，不新增 playbook shell。

**Tech Stack:** Python, FastAPI, Next.js, TypeScript, node:test, pytest

---

### Task 1: Add failing tests for domain playbooks v2

**Files:**
- Modify: `backend/tests/test_mvp_slice.py`
- Modify: `frontend/tests/intake-progress.test.mjs`

- [ ] **Step 1: Add backend failing tests**

覆蓋：
- same-client cross-matter memory can influence playbook guidance
- domain playbook returns `fit_summary` / `source_mix_summary`
- prompt-safe playbook context includes those lines

- [ ] **Step 2: Run backend tests to verify failure**

Run: `PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -q -k "domain_playbook_v2_uses_cross_matter_memory_and_source_mix or build_payload_domain_playbook_context_keeps_prompt_safe_lines"`

- [ ] **Step 3: Add frontend failing tests**

覆蓋：
- domain playbook helper reads `fitSummary` / `sourceMixSummary`
- organization-memory sourced stage stays consultant-readable

- [ ] **Step 4: Run frontend tests to verify failure**

Run: `cd frontend && node --test tests/intake-progress.test.mjs`

### Task 2: Implement backend playbook v2

**Files:**
- Modify: `backend/app/domain/schemas.py`
- Modify: `backend/app/services/domain_playbook_intelligence.py`
- Modify: `backend/app/agents/base.py`

- [ ] **Step 1: Extend contract**

新增：
- `fit_summary`
- `source_mix_summary`
- `organization_memory` stage source

- [ ] **Step 2: Add cross-matter absorption**

讓 playbook 在 organization memory 有跨案件摘要時，可低風險吸收成 stage 與 fit signal。

- [ ] **Step 3: Update prompt-safe payload**

讓 `domain_playbook_context` 正式帶：
- `這輪為何適用`
- `收斂依據`

- [ ] **Step 4: Run backend tests**

Run: `PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -q -k "domain_playbook_v2_uses_cross_matter_memory_and_source_mix or build_payload_domain_playbook_context_keeps_prompt_safe_lines"`

### Task 3: Add low-noise frontend readback

**Files:**
- Modify: `frontend/src/lib/types.ts`
- Modify: `frontend/src/lib/domain-playbooks.ts`
- Modify: `frontend/src/components/matter-workspace-panel.tsx`
- Modify: `frontend/src/components/task-detail-panel.tsx`

- [ ] **Step 1: Extend helper**

讀出：
- `fitSummary`
- `sourceMixSummary`

- [ ] **Step 2: Keep UI low-noise**

只補：
- `這輪為何適用`
- `收斂依據`

- [ ] **Step 3: Run frontend tests**

Run: `cd frontend && node --test tests/intake-progress.test.mjs`

### Task 4: Sync active docs

**Files:**
- Modify: `docs/00_product_definition_and_current_state.md`
- Modify: `docs/01_runtime_architecture_and_data_contracts.md`
- Modify: `docs/02_host_agents_packs_and_extension_system.md`
- Modify: `docs/03_workbench_ux_and_page_spec.md`
- Modify: `docs/04_qa_matrix.md`

- [ ] **Step 1: Update docs**

把：
- v2 role separation
- organization-memory absorption boundary
- low-noise UI readback

寫清楚。

- [ ] **Step 2: Add fresh QA evidence**

把 compile / tests / build / typecheck 寫進 QA matrix。

### Task 5: Verify and sync GitHub

**Files:**
- Modify: `git state only`

- [ ] **Step 1: Run compile**

Run: `python3 -m compileall backend/app`

- [ ] **Step 2: Run backend tests**

Run: `PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -q`

- [ ] **Step 3: Run frontend tests**

Run: `cd frontend && node --test tests/intake-progress.test.mjs`

- [ ] **Step 4: Run builds and typecheck**

Run:
- `cd frontend && npm run build`
- `cd frontend && NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8010/api/v1 npm run build`
- `cd frontend && rm -f .next/cache/.tsbuildinfo && npx next typegen && npm run typecheck`

- [ ] **Step 5: Commit and push**

Commit message:

```bash
git add backend/app/domain/schemas.py backend/app/services/domain_playbook_intelligence.py backend/app/agents/base.py backend/tests/test_mvp_slice.py frontend/src/lib/types.ts frontend/src/lib/domain-playbooks.ts frontend/src/components/matter-workspace-panel.tsx frontend/src/components/task-detail-panel.tsx frontend/tests/intake-progress.test.mjs docs/00_product_definition_and_current_state.md docs/01_runtime_architecture_and_data_contracts.md docs/02_host_agents_packs_and_extension_system.md docs/03_workbench_ux_and_page_spec.md docs/04_qa_matrix.md docs/superpowers/specs/2026-04-05-domain-playbooks-v2-design.md docs/superpowers/plans/2026-04-05-domain-playbooks-v2.md
git commit -m "feat: deepen domain playbooks"
git push origin codex/baseline-sync-and-sparse-diagnostic
```
