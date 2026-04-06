# Phase 5 Firm Operating Surfaces Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在首頁總覽補上一塊 low-noise 的 `firm operating snapshot`，讓 owner / consultant 一進來就知道這間 firm 現在能不能順利工作。

**Architecture:** 後端新增一個簡潔的 `firm operating snapshot` read model，聚合 members summary、demo policy、provider validation posture，並讓 frontend 在既有 `WorkbenchHome` 補上一塊 role-aware operating panel。這一刀不新增新頁面，避免產品長成 admin dashboard。

**Tech Stack:** FastAPI, SQLAlchemy 2, Pydantic 2, Next.js 15 App Router, React 19, TypeScript, node:test

---

## Scope Guard

這份 implementation plan 只處理：

- firm operating snapshot backend read model
- `總覽` 頁 operating panel
- owner / consultant role-aware copy

這份 plan **不處理**：

- analytics wall
- charts
- audit log center
- `/firm` 新頁面

## File Structure

### Backend

- Modify: `backend/app/workbench/schemas.py`
  - add firm operating snapshot contracts
- Create: `backend/app/services/firm_operating_snapshot.py`
  - aggregate member summary, demo policy, and provider posture
- Modify: `backend/app/api/routes/workbench.py`
  - add `GET /workbench/firm-operating-snapshot`
- Test: `backend/tests/test_mvp_slice.py`

### Frontend

- Modify: `frontend/src/lib/types.ts`
  - add firm operating snapshot types
- Modify: `frontend/src/lib/api.ts`
  - add client + payload parser
- Create: `frontend/src/lib/firm-operating.ts`
  - low-noise labels and posture helpers
- Modify: `frontend/src/components/workbench-home.tsx`
  - add operating panel
- Test: `frontend/tests/auth-foundation.test.mjs`

### Docs

- Modify: `docs/00_product_definition_and_current_state.md`
- Modify: `docs/03_workbench_ux_and_page_spec.md`
- Modify: `docs/04_qa_matrix.md`
- Modify: `docs/superpowers/specs/2026-04-06-phase-5-firm-operating-surfaces-design.md`

### Task 1: Firm Operating Snapshot Backend

**Files:**
- Modify: `backend/app/workbench/schemas.py`
- Create: `backend/app/services/firm_operating_snapshot.py`
- Modify: `backend/app/api/routes/workbench.py`
- Test: `backend/tests/test_mvp_slice.py`

- [ ] **Step 1: Write the failing backend test**

```python
def test_owner_can_read_firm_operating_snapshot(client: TestClient) -> None:
    response = client.get("/api/v1/workbench/firm-operating-snapshot")

    assert response.status_code == 200
    payload = response.json()
    assert payload["operating_posture"] in {"steady", "attention_needed"}
    assert payload["signals"]
    assert payload["action_href"]
```

- [ ] **Step 2: Run targeted backend test to verify it fails**

Run:

```bash
PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -k "firm_operating_snapshot" -q
```

- [ ] **Step 3: Write minimal backend implementation**

- [ ] **Step 4: Re-run targeted backend test to green**

- [ ] **Step 5: Commit**

```bash
git add backend/app/workbench/schemas.py backend/app/services/firm_operating_snapshot.py backend/app/api/routes/workbench.py backend/tests/test_mvp_slice.py
git commit -m "feat: add firm operating snapshot"
```

### Task 2: Homepage Operating Panel

**Files:**
- Modify: `frontend/src/lib/types.ts`
- Modify: `frontend/src/lib/api.ts`
- Create: `frontend/src/lib/firm-operating.ts`
- Modify: `frontend/src/components/workbench-home.tsx`
- Test: `frontend/tests/auth-foundation.test.mjs`

- [ ] **Step 1: Write the failing frontend tests**

```javascript
test("firm operating posture labels stay low-noise and readable", () => {
  assert.equal(labelForFirmOperatingPosture("steady"), "目前運作穩定");
  assert.equal(labelForFirmOperatingPosture("attention_needed"), "有幾個地方值得先處理");
});
```

- [ ] **Step 2: Run targeted frontend tests to verify they fail**

Run:

```bash
cd frontend && node --test tests/auth-foundation.test.mjs
```

- [ ] **Step 3: Implement operating helper and homepage panel**

- [ ] **Step 4: Re-run frontend tests, typecheck, and build**

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/types.ts frontend/src/lib/api.ts frontend/src/lib/firm-operating.ts frontend/src/components/workbench-home.tsx frontend/tests/auth-foundation.test.mjs
git commit -m "feat: add firm operating panel"
```

### Task 3: Docs, QA, and Full Verification

**Files:**
- Modify: `docs/00_product_definition_and_current_state.md`
- Modify: `docs/03_workbench_ux_and_page_spec.md`
- Modify: `docs/04_qa_matrix.md`
- Modify: `docs/superpowers/specs/2026-04-06-phase-5-firm-operating-surfaces-design.md`

- [ ] **Step 1: Update docs to mark firm operating slice shipped**

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
git add docs/00_product_definition_and_current_state.md docs/03_workbench_ux_and_page_spec.md docs/04_qa_matrix.md docs/superpowers/specs/2026-04-06-phase-5-firm-operating-surfaces-design.md
git commit -m "docs: align firm operating surfaces"
```
