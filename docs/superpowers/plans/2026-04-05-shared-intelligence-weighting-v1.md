# Shared Intelligence Weighting V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 讓 Host 在組 reusable assets 時，開始優先使用 shared-intelligence 較成熟的 precedent，而不是只把 shared signal 留在 explainability。

**Architecture:** 在 precedent intelligence 補一個 reusable weighted-selection helper，根據 `shared_intelligence_signal`、`optimization_signal` 和既有 review priority 為 matched precedent 排序；再把這個排序接進 `review_lens_guidance`、`common_risk_guidance`、`domain_playbook_guidance`、`deliverable_template_guidance`。前台維持低噪音，不新增新頁面。

**Tech Stack:** Python, FastAPI, SQLAlchemy, Next.js, TypeScript, pytest, node:test

---

### Task 1: Add failing tests for shared-intelligence weighting

**Files:**
- Modify: `backend/tests/test_mvp_slice.py`

- [ ] **Step 1: Add backend failing tests**

覆蓋：
- reusable weighted-selection helper prefers `upweight` / `shared` / `emerging`
- review lenses prefer the stronger shared precedent
- domain playbooks prefer the stronger shared precedent
- deliverable templates prefer the stronger shared precedent

- [ ] **Step 2: Run targeted backend tests to verify failure**

Run: `PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -q -k "shared_intelligence_weighting or weighted_precedent or review_lens or domain_playbook or deliverable_template"`

### Task 2: Implement weighted precedent selection

**Files:**
- Modify: `backend/app/services/precedent_intelligence.py`
- Modify: `backend/app/services/review_lens_intelligence.py`
- Modify: `backend/app/services/common_risk_intelligence.py`
- Modify: `backend/app/services/domain_playbook_intelligence.py`
- Modify: `backend/app/services/deliverable_template_intelligence.py`

- [ ] **Step 1: Add weighted selection helper**

在 precedent intelligence 中新增共用 helper，根據：
- `weight_action`
- `maturity`
- `optimization strength`
- `review priority`

挑出最適合某個 reusable asset 的 precedent rows。

- [ ] **Step 2: Wire review lenses / common risks**

讓 review lenses 與 common risks 不再只看第一筆 matched precedent，而是正式吃 weighted helper。

- [ ] **Step 3: Wire domain playbooks / deliverable templates**

讓 playbook 與 template 在 precedence 同時存在時，也改成 shared-intelligence 較成熟的 precedent 優先。

- [ ] **Step 4: Re-run targeted backend tests**

Run: `PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -q -k "shared_intelligence_weighting or weighted_precedent or review_lens or domain_playbook or deliverable_template"`

### Task 3: Sync active docs

**Files:**
- Modify: `docs/00_product_definition_and_current_state.md`
- Modify: `docs/01_runtime_architecture_and_data_contracts.md`
- Modify: `docs/02_host_agents_packs_and_extension_system.md`
- Modify: `docs/03_workbench_ux_and_page_spec.md`
- Modify: `docs/04_qa_matrix.md`
- Create: `docs/superpowers/specs/2026-04-05-shared-intelligence-weighting-v1-design.md`
- Create: `docs/superpowers/plans/2026-04-05-shared-intelligence-weighting-v1.md`

- [ ] **Step 1: Update docs**

把 shared-intelligence weighting 的角色、邊界與 Host-only rule 寫清楚。

- [ ] **Step 2: Add fresh QA evidence**

把 compile / tests / build / typecheck 寫進 QA matrix。

### Task 4: Full verification and git sync

**Files:**
- Modify: `git state only`

- [ ] **Step 1: Run compile**

Run: `python3 -m compileall backend/app`

- [ ] **Step 2: Run full backend tests**

Run: `PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -q`

- [ ] **Step 3: Run frontend helper tests**

Run: `cd frontend && node --test tests/intake-progress.test.mjs`

- [ ] **Step 4: Run builds and typecheck**

Run:
- `cd frontend && npm run build`
- `cd frontend && NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8010/api/v1 npm run build`
- `cd frontend && rm -f .next/cache/.tsbuildinfo && npx next typegen && npm run typecheck`

- [ ] **Step 5: Commit and push**

Commit message:

```bash
git add backend/app/services/precedent_intelligence.py backend/app/services/review_lens_intelligence.py backend/app/services/common_risk_intelligence.py backend/app/services/domain_playbook_intelligence.py backend/app/services/deliverable_template_intelligence.py backend/tests/test_mvp_slice.py docs/00_product_definition_and_current_state.md docs/01_runtime_architecture_and_data_contracts.md docs/02_host_agents_packs_and_extension_system.md docs/03_workbench_ux_and_page_spec.md docs/04_qa_matrix.md docs/superpowers/specs/2026-04-05-shared-intelligence-weighting-v1-design.md docs/superpowers/plans/2026-04-05-shared-intelligence-weighting-v1.md
git commit -m "feat: add shared intelligence weighting"
git push origin codex/baseline-sync-and-sparse-diagnostic
```
