# Phase 5 Demo Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `/demo` 從 raw sample dataset list 補成更像正式產品展示入口的 guided read-only workspace。

**Architecture:** 沿用既有 `demo workspace isolation` 邊界，不新增新 route 或新 demo shell。後端只擴充 `DemoWorkspaceRead` 的 narrative contract，前端用既有 `/demo` route 補成更清楚的 hero、highlight、read-only rule、與正式版工作流說明。

**Tech Stack:** FastAPI, Pydantic 2, Next.js 15 App Router, React 19, TypeScript, node:test

---

## Scope Guard

這份 implementation plan 只處理：

- demo narrative read model
- `/demo` guided shell polish
- consultant-facing demo copy alignment

這份 plan **不處理**：

- demo analytics
- interactive tour
- demo dataset editor
- firm operating surfaces

## File Structure

### Backend

- Modify: `backend/app/demo/schemas.py`
  - add narrative fields to `DemoWorkspaceRead`
- Modify: `backend/app/services/demo_workspace.py`
  - populate guided demo narrative contract
- Test: `backend/tests/test_mvp_slice.py`

### Frontend

- Modify: `frontend/src/lib/types.ts`
  - add demo narrative snapshot types
- Modify: `frontend/src/lib/api.ts`
  - parse enriched demo workspace payload
- Modify: `frontend/src/lib/demo-workspace.ts`
  - add small helper labels for demo highlights and rule copy
- Modify: `frontend/src/components/demo-page-panel.tsx`
  - replace raw list-only shell with guided showcase shell
- Test: `frontend/tests/demo-workspace-isolation.test.mjs`

### Docs

- Modify: `docs/00_product_definition_and_current_state.md`
- Modify: `docs/03_workbench_ux_and_page_spec.md`
- Modify: `docs/04_qa_matrix.md`
- Modify: `docs/superpowers/specs/2026-04-06-phase-5-demo-polish-design.md`

### Task 1: Demo Narrative Contract

**Files:**
- Modify: `backend/app/demo/schemas.py`
- Modify: `backend/app/services/demo_workspace.py`
- Test: `backend/tests/test_mvp_slice.py`

- [ ] **Step 1: Write the failing backend test**

```python
def test_demo_workspace_snapshot_includes_guided_narrative(client: TestClient) -> None:
    response = client.get("/api/v1/demo/workspace")
    assert response.status_code == 200

    payload = response.json()
    assert payload["hero_summary"]
    assert len(payload["showcase_highlights"]) >= 3
    assert "不能執行分析" in payload["read_only_rules"]
    assert payload["formal_workspace_explainer"]
```

- [ ] **Step 2: Run targeted backend test to verify it fails**

Run:

```bash
PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -k "guided_narrative" -q
```

- [ ] **Step 3: Write minimal backend implementation**

- [ ] **Step 4: Re-run targeted backend test to green**

- [ ] **Step 5: Commit**

```bash
git add backend/app/demo/schemas.py backend/app/services/demo_workspace.py backend/tests/test_mvp_slice.py
git commit -m "feat: add demo narrative contract"
```

### Task 2: Guided Demo Shell

**Files:**
- Modify: `frontend/src/lib/types.ts`
- Modify: `frontend/src/lib/api.ts`
- Modify: `frontend/src/lib/demo-workspace.ts`
- Modify: `frontend/src/components/demo-page-panel.tsx`
- Test: `frontend/tests/demo-workspace-isolation.test.mjs`

- [ ] **Step 1: Write the failing frontend tests**

```javascript
test("demo workspace helper exposes guided highlight copy", () => {
  const copy = summarizeDemoShowcaseHighlights([
    "matter / case world",
    "deliverable shaping",
    "history / shared intelligence",
  ]);
  assert.match(copy, /case world/);
});
```

- [ ] **Step 2: Run targeted frontend tests to verify they fail**

Run:

```bash
cd frontend && node --test tests/demo-workspace-isolation.test.mjs
```

- [ ] **Step 3: Implement guided `/demo` shell**

- [ ] **Step 4: Re-run frontend targeted tests, typecheck, and build**

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/types.ts frontend/src/lib/api.ts frontend/src/lib/demo-workspace.ts frontend/src/components/demo-page-panel.tsx frontend/tests/demo-workspace-isolation.test.mjs
git commit -m "feat: polish demo workspace shell"
```

### Task 3: Docs, QA, and Full Verification

**Files:**
- Modify: `docs/00_product_definition_and_current_state.md`
- Modify: `docs/03_workbench_ux_and_page_spec.md`
- Modify: `docs/04_qa_matrix.md`
- Modify: `docs/superpowers/specs/2026-04-06-phase-5-demo-polish-design.md`

- [ ] **Step 1: Update docs to mark demo polish shipped**

- [ ] **Step 2: Run full verification**

Run:

```bash
python3 -m compileall backend/app
PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -q
cd frontend && node --test tests/auth-foundation.test.mjs tests/provider-settings-foundation.test.mjs tests/demo-workspace-isolation.test.mjs tests/intake-progress.test.mjs
cd frontend && rm -f .next/cache/.tsbuildinfo && mkdir -p .next/types && npx next typegen && npm run typecheck
cd frontend && npm run build
cd frontend && NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8010/api/v1 npm run build
```

- [ ] **Step 3: Commit**

```bash
git add docs/00_product_definition_and_current_state.md docs/03_workbench_ux_and_page_spec.md docs/04_qa_matrix.md docs/superpowers/specs/2026-04-06-phase-5-demo-polish-design.md
git commit -m "docs: align demo polish"
```
