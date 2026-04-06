# Phase 5 Owner Controls Deepen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 讓 owner 在不走向 enterprise admin console 的前提下，能更成熟地管理 members、pending invites、demo policy 與 firm-level control summary。

**Architecture:** 這份 plan 只實作 phase 5 下一條主線的第一個可上線子專案：`owner controls deepen`。後端新增 invite revoke 與 demo workspace policy read/update contract，前端在 `/members` 補 revoke invite 與 summary，在 `Firm Settings` 補 demo policy panel；不新增新的 admin dashboard，也不改 multi-firm 邊界。這一刀保持 low-noise owner controls，沿用既有 `/members` + `/settings` 分工。

**Tech Stack:** FastAPI, SQLAlchemy 2, Pydantic 2, Next.js 15 App Router, React 19, TypeScript, node:test

---

## Scope Guard

這份 implementation plan 只處理：

- pending invite revoke
- owner control summary
- demo policy read / update
- `/members` 與 `Firm Settings` 的 owner control deepen

這份 plan **不處理**：

- audit log console
- billing / seat accounting
- enterprise RBAC editor
- multi-firm controls

---

## File Structure

### Backend

- Modify: `backend/app/identity/schemas.py`
  - add invite revoke and demo policy contracts
- Modify: `backend/app/services/members.py`
  - add invite revoke service
  - enrich owner summary if needed
- Modify: `backend/app/api/routes/members.py`
  - add invite revoke route
- Modify: `backend/app/services/demo_workspace.py`
  - add demo policy read / update helpers
- Modify: `backend/app/api/routes/workbench.py`
  - add `GET/PUT /workbench/demo-workspace-policy`
- Modify: `backend/app/workbench/schemas.py`
  - add demo policy request / response
- Test: `backend/tests/test_mvp_slice.py`

### Frontend

- Modify: `frontend/src/lib/types.ts`
  - add invite revoke and demo policy contracts
- Modify: `frontend/src/lib/api.ts`
  - add invite revoke and demo policy methods
- Modify: `frontend/src/components/members-page-panel.tsx`
  - add revoke invite action
  - deepen summary block
- Modify: `frontend/src/components/settings-firm-provider-panel.tsx`
  - add demo policy panel
- Modify: `frontend/tests/demo-workspace-isolation.test.mjs`
  - add summary / policy helper tests

### Docs

- Modify: `docs/00_product_definition_and_current_state.md`
- Modify: `docs/01_runtime_architecture_and_data_contracts.md`
- Modify: `docs/03_workbench_ux_and_page_spec.md`
- Modify: `docs/04_qa_matrix.md`
- Modify: `docs/superpowers/specs/2026-04-06-phase-5-owner-controls-deepen-design.md`

---

### Task 1: Pending Invite Revoke Foundation

**Files:**
- Modify: `backend/app/identity/schemas.py`
- Modify: `backend/app/services/members.py`
- Modify: `backend/app/api/routes/members.py`
- Test: `backend/tests/test_mvp_slice.py`

- [ ] **Step 1: Write the failing backend tests for invite revoke**

```python
def test_owner_can_revoke_pending_invite(client: TestClient) -> None:
    invite = client.post(
        "/api/v1/members/invites",
        json={"email": "pending@example.com", "role": "demo"},
    )
    assert invite.status_code == 200

    response = client.post(f"/api/v1/members/invites/{invite.json()['id']}/revoke")

    assert response.status_code == 200
    assert response.json()["status"] == "revoked"


def test_owner_cannot_revoke_same_invite_twice(client: TestClient) -> None:
    invite = client.post(
        "/api/v1/members/invites",
        json={"email": "pending@example.com", "role": "demo"},
    )
    assert invite.status_code == 200
    assert client.post(f"/api/v1/members/invites/{invite.json()['id']}/revoke").status_code == 200

    response = client.post(f"/api/v1/members/invites/{invite.json()['id']}/revoke")

    assert response.status_code == 400
```

- [ ] **Step 2: Run targeted backend tests to verify they fail**

Run:

```bash
PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -k "revoke_pending_invite" -q
```

- [ ] **Step 3: Implement revoke invite contract and service**

```python
# backend/app/services/members.py
def revoke_firm_invite(
    db: Session,
    *,
    current_member: CurrentMember,
    invite_id: str,
) -> identity_schemas.MemberInviteRead:
    invite = db.scalar(
        select(models.FirmInvite)
        .where(models.FirmInvite.id == invite_id)
        .where(models.FirmInvite.firm_id == current_member.firm.id)
    )
    if invite is None:
        raise HTTPException(status_code=404, detail="找不到指定邀請。")
    if invite.status != "pending":
        raise HTTPException(status_code=400, detail="只有待接受邀請可以撤回。")
    invite.status = "revoked"
    db.add(invite)
    db.commit()
    db.refresh(invite)
    return serialize_invite_row(invite)
```

- [ ] **Step 4: Re-run targeted backend tests to green**

- [ ] **Step 5: Commit**

```bash
git add backend/app/identity/schemas.py backend/app/services/members.py backend/app/api/routes/members.py backend/tests/test_mvp_slice.py
git commit -m "feat: add invite revoke controls"
```

---

### Task 2: Demo Policy Backend Controls

**Files:**
- Modify: `backend/app/services/demo_workspace.py`
- Modify: `backend/app/workbench/schemas.py`
- Modify: `backend/app/api/routes/workbench.py`
- Test: `backend/tests/test_mvp_slice.py`

- [ ] **Step 1: Write the failing backend tests for demo policy read / update**

```python
def test_owner_can_read_and_update_demo_workspace_policy(client: TestClient) -> None:
    initial = client.get("/api/v1/workbench/demo-workspace-policy")
    assert initial.status_code == 200

    updated = client.put(
        "/api/v1/workbench/demo-workspace-policy",
        json={"status": "inactive", "max_active_demo_members": 3},
    )

    assert updated.status_code == 200
    assert updated.json()["status"] == "inactive"
    assert updated.json()["max_active_demo_members"] == 3
```

- [ ] **Step 2: Run targeted backend tests to verify they fail**

- [ ] **Step 3: Implement demo policy read / update contract**

- [ ] **Step 4: Re-run targeted backend tests to green**

- [ ] **Step 5: Commit**

```bash
git add backend/app/services/demo_workspace.py backend/app/workbench/schemas.py backend/app/api/routes/workbench.py backend/tests/test_mvp_slice.py
git commit -m "feat: add demo policy controls"
```

---

### Task 3: Members UI Revoke and Owner Summary

**Files:**
- Modify: `frontend/src/lib/types.ts`
- Modify: `frontend/src/lib/api.ts`
- Modify: `frontend/src/components/members-page-panel.tsx`
- Modify: `frontend/tests/demo-workspace-isolation.test.mjs`

- [ ] **Step 1: Write the failing frontend tests for demo summary / invite revoke**

```javascript
test("demo member summary stays stable when pending demo invites exist", () => {
  const summary = buildDemoMemberSummary({
    members: [],
    pendingInvites: [{ id: "1", email: "demo@example.com", role: "demo", status: "pending" }],
    summary: { activeDemoMemberCount: 0, pendingDemoInviteCount: 1 },
  });
  assert.equal(summary.pendingCount, 1);
});
```

- [ ] **Step 2: Add API client and UI action for revoke**

- [ ] **Step 3: Re-run frontend tests**

- [ ] **Step 4: Commit**

```bash
git add frontend/src/lib/types.ts frontend/src/lib/api.ts frontend/src/components/members-page-panel.tsx frontend/tests/demo-workspace-isolation.test.mjs
git commit -m "feat: deepen owner member controls"
```

---

### Task 4: Firm Settings Demo Policy Panel

**Files:**
- Modify: `frontend/src/components/settings-firm-provider-panel.tsx`
- Modify: `frontend/src/lib/api.ts`
- Modify: `frontend/src/lib/types.ts`
- Test: `frontend/tests/provider-settings-foundation.test.mjs`

- [ ] **Step 1: Write the failing frontend tests for demo policy read model**

- [ ] **Step 2: Add demo policy panel to `Firm Settings`**

- [ ] **Step 3: Re-run frontend tests and build checks**

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/settings-firm-provider-panel.tsx frontend/src/lib/api.ts frontend/src/lib/types.ts frontend/tests/provider-settings-foundation.test.mjs
git commit -m "feat: add demo policy panel"
```

---

### Task 5: Docs, QA, and Full Verification

**Files:**
- Modify: `docs/00_product_definition_and_current_state.md`
- Modify: `docs/01_runtime_architecture_and_data_contracts.md`
- Modify: `docs/03_workbench_ux_and_page_spec.md`
- Modify: `docs/04_qa_matrix.md`
- Modify: `docs/superpowers/specs/2026-04-06-phase-5-owner-controls-deepen-design.md`

- [ ] **Step 1: Update active docs to reflect shipped owner controls deepen behavior**

- [ ] **Step 2: Run full verification**

```bash
python3 -m compileall backend/app
PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -q
cd frontend && node --test tests/auth-foundation.test.mjs tests/provider-settings-foundation.test.mjs tests/demo-workspace-isolation.test.mjs tests/intake-progress.test.mjs
cd frontend && mkdir -p .next/types && npx next typegen && npm run typecheck
cd frontend && npm run build
cd frontend && NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8010/api/v1 npm run build
```

- [ ] **Step 3: Update QA matrix with real evidence only**

- [ ] **Step 4: Commit**

```bash
git add docs/00_product_definition_and_current_state.md docs/01_runtime_architecture_and_data_contracts.md docs/03_workbench_ux_and_page_spec.md docs/04_qa_matrix.md docs/superpowers/specs/2026-04-06-phase-5-owner-controls-deepen-design.md
git commit -m "docs: align owner controls deepen"
```
