# Phase 5 Demo Workspace Isolation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 讓 `demo` 帳號登入後只進入固定、共享、唯讀的 demo workspace，且完全碰不到正式 firm workspace 資料。

**Architecture:** 這份 plan 實作 phase 5 的第三個子專案：`demo workspace isolation`。後端新增 `DemoWorkspacePolicy` 與 demo workspace snapshot service，建立 `/demo/workspace` 的唯讀資料路徑，並把 `demo` 的角色權限與正式 firm route 邊界正式分開；前端新增 `/demo` 頁面、demo 專用導向與唯讀展示 shell，並讓 `/members` 可更清楚管理 demo 帳號與 demo 數量。這一刀刻意採「固定共享 sample dataset」而不是 per-user clone，避免 phase 5 過早長成 dataset orchestration 平台。

**Tech Stack:** FastAPI, SQLAlchemy 2, Pydantic 2, Next.js 15 App Router, React 19, TypeScript, node:test

---

## Scope Guard

這份 implementation plan 只處理：

- `demo` 的正式 routing / workspace gate
- fixed shared demo dataset 的 backend read model
- `/demo` 的 read-only 展示頁
- owner 在 `/members` 內對 demo 帳號的基本控管與數量可見性
- demo 與正式 firm workspace 的前後端隔離

這份 plan **不處理**：

- per-demo cloned workspace
- public anonymous demo
- demo analytics / billing / quota engine
- demo dataset editor
- client-facing public portal

---

## File Structure

### Backend

- Create: `backend/app/demo/schemas.py`
  - demo workspace read model contracts
- Create: `backend/app/services/demo_workspace.py`
  - fixed shared demo dataset builder
  - demo policy loader
- Create: `backend/app/api/routes/demo.py`
  - `GET /demo/workspace`
- Modify: `backend/app/core/auth.py`
  - add `access_demo_workspace`
  - let `owner` and `demo` access demo route
- Modify: `backend/app/domain/models.py`
  - add `DemoWorkspacePolicy`
- Modify: `backend/app/core/database.py`
  - incremental schema patch for `demo_workspace_policies`
- Modify: `backend/app/api/router.py`
  - register demo router
- Modify: `backend/app/identity/schemas.py`
  - add member-list summary for demo counts
- Modify: `backend/app/services/members.py`
  - include demo counts in member list response
- Test: `backend/tests/test_mvp_slice.py`
  - role permission
  - demo workspace snapshot
  - demo cannot read firm workspace routes

### Frontend

- Create: `frontend/src/app/demo/page.tsx`
  - demo workspace route
- Create: `frontend/src/components/demo-page-panel.tsx`
  - read-only demo shell
- Create: `frontend/src/lib/demo-workspace.ts`
  - demo snapshot mappers and helper copy
- Create: `frontend/tests/demo-workspace-isolation.test.mjs`
  - demo nav / redirect / summary helper tests
- Modify: `frontend/src/lib/types.ts`
  - add demo workspace contracts and member summary
- Modify: `frontend/src/lib/api.ts`
  - add demo workspace getter
- Modify: `frontend/src/lib/permissions.ts`
  - demo nav and redirect helpers
- Modify: `frontend/src/components/app-shell.tsx`
  - redirect demo away from non-demo app routes
- Modify: `frontend/src/components/members-page-panel.tsx`
  - show demo counts and demo controls more clearly

### Docs

- Modify: `docs/00_product_definition_and_current_state.md`
  - mark demo workspace isolation as the active in-progress slice while implementation is happening
- Modify: `docs/01_runtime_architecture_and_data_contracts.md`
  - add demo workspace boundary and data isolation contract
- Modify: `docs/03_workbench_ux_and_page_spec.md`
  - add `/demo` page and demo redirect behavior
- Modify: `docs/04_qa_matrix.md`
  - append real verification evidence after green runs only
- Modify: `docs/superpowers/specs/2026-04-06-phase-5-demo-workspace-isolation-design.md`
  - mark slice as partially shipped once landed

---

### Task 1: Backend Demo Policy and Permission Foundation

**Files:**
- Modify: `backend/app/core/auth.py`
- Modify: `backend/app/domain/models.py`
- Modify: `backend/app/core/database.py`
- Test: `backend/tests/test_mvp_slice.py`

- [ ] **Step 1: Write the failing backend tests for demo permission and policy persistence**

```python
def test_demo_role_permissions_include_demo_workspace_access() -> None:
    from app.core.auth import ROLE_PERMISSIONS

    assert "access_demo_workspace" in ROLE_PERMISSIONS["owner"]
    assert "access_demo_workspace" in ROLE_PERMISSIONS["demo"]
    assert "access_firm_workspace" not in ROLE_PERMISSIONS["demo"]


def test_demo_workspace_policy_row_persists(client: TestClient) -> None:
    with SessionLocal() as db:
        firm = db.scalar(select(models.Firm).where(models.Firm.slug == "test-firm"))
        assert firm is not None
        db.add(
            models.DemoWorkspacePolicy(
                firm_id=firm.id,
                status="active",
                workspace_slug="demo",
                seed_version="v1",
                max_active_demo_members=5,
            )
        )
        db.commit()

        row = db.scalar(
            select(models.DemoWorkspacePolicy).where(
                models.DemoWorkspacePolicy.firm_id == firm.id
            )
        )

        assert row is not None
        assert row.workspace_slug == "demo"
        assert row.max_active_demo_members == 5
```

- [ ] **Step 2: Run the targeted backend tests to verify they fail**

Run:

```bash
PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -k "demo_role_permissions_include_demo_workspace_access or demo_workspace_policy_row_persists" -q
```

Expected:

```text
FAIL because `access_demo_workspace` and `DemoWorkspacePolicy` do not exist yet
```

- [ ] **Step 3: Add the demo permission bundle**

```python
# backend/app/core/auth.py
Permission = Literal[
    "access_firm_workspace",
    "access_demo_workspace",
    "view_agents",
    "view_packs",
    "manage_members",
    "manage_agents",
    "manage_packs",
    "manage_firm_settings",
    "govern_shared_intelligence",
    "sign_off_phase",
]

ROLE_PERMISSIONS: dict[str, set[str]] = {
    "owner": {
        "access_firm_workspace",
        "access_demo_workspace",
        "view_agents",
        "view_packs",
        "manage_members",
        "manage_agents",
        "manage_packs",
        "manage_firm_settings",
        "govern_shared_intelligence",
        "sign_off_phase",
    },
    "consultant": {
        "access_firm_workspace",
        "view_agents",
        "view_packs",
    },
    "demo": {
        "access_demo_workspace",
    },
}
```

- [ ] **Step 4: Add the demo workspace policy model**

```python
# backend/app/domain/models.py
class DemoWorkspacePolicy(Base):
    __tablename__ = "demo_workspace_policies"
    __table_args__ = (
        UniqueConstraint("firm_id", name="uq_demo_workspace_policy_firm"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    firm_id: Mapped[str] = mapped_column(ForeignKey("firms.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="active")
    workspace_slug: Mapped[str] = mapped_column(String(60), default="demo")
    seed_version: Mapped[str] = mapped_column(String(30), default="v1")
    max_active_demo_members: Mapped[int] = mapped_column(Integer, default=5)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    firm: Mapped["Firm"] = relationship()
```

- [ ] **Step 5: Add the incremental schema patch**

```python
# backend/app/core/database.py
schema_patches = {
    ...
    "demo_workspace_policies": {
        "status": "VARCHAR(30) NOT NULL DEFAULT 'active'",
        "workspace_slug": "VARCHAR(60) NOT NULL DEFAULT 'demo'",
        "seed_version": "VARCHAR(30) NOT NULL DEFAULT 'v1'",
        "max_active_demo_members": "INTEGER NOT NULL DEFAULT 5",
    },
}
```

- [ ] **Step 6: Run the targeted backend tests to verify they pass**

Run:

```bash
PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -k "demo_role_permissions_include_demo_workspace_access or demo_workspace_policy_row_persists" -q
```

Expected:

```text
2 passed
```

- [ ] **Step 7: Commit the demo policy foundation**

```bash
git add backend/app/core/auth.py backend/app/domain/models.py backend/app/core/database.py backend/tests/test_mvp_slice.py
git commit -m "feat: add demo workspace policy foundation"
```

---

### Task 2: Demo Workspace API and Server-Side Isolation

**Files:**
- Create: `backend/app/demo/schemas.py`
- Create: `backend/app/services/demo_workspace.py`
- Create: `backend/app/api/routes/demo.py`
- Modify: `backend/app/api/router.py`
- Modify: `backend/app/identity/schemas.py`
- Modify: `backend/app/services/members.py`
- Test: `backend/tests/test_mvp_slice.py`

- [ ] **Step 1: Write the failing backend tests for demo workspace read path**

```python
def login_as_demo_with_owner_invite(
    anonymous_client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> TestClient:
    configure_auth_settings(monkeypatch, bootstrap_owner_emails="owner@example.com")
    login_google_user(
        anonymous_client,
        monkeypatch,
        email="owner@example.com",
        full_name="Owner User",
    )
    invite = anonymous_client.post(
        "/api/v1/members/invites",
        json={"email": "demo@example.com", "role": "demo"},
    )
    assert invite.status_code == 200
    assert anonymous_client.post("/api/v1/auth/logout").status_code == 200
    login_google_user(
        anonymous_client,
        monkeypatch,
        email="demo@example.com",
        full_name="Demo User",
    )
    return anonymous_client


def test_demo_can_read_demo_workspace_snapshot(
    anonymous_client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    demo_client = login_as_demo_with_owner_invite(anonymous_client, monkeypatch)

    response = demo_client.get("/api/v1/demo/workspace")

    assert response.status_code == 200
    assert response.json()["workspace_mode"] == "demo"
    assert response.json()["sections"][0]["section_id"] == "sample_matters"


def test_demo_cannot_read_firm_workspace_routes(
    anonymous_client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    demo_client = login_as_demo_with_owner_invite(anonymous_client, monkeypatch)

    response = demo_client.get("/api/v1/tasks")

    assert response.status_code == 403


def test_member_list_includes_demo_summary_counts(client: TestClient) -> None:
    create_demo = client.post(
        "/api/v1/members/invites",
        json={"email": "demo@example.com", "role": "demo"},
    )
    assert create_demo.status_code == 200

    response = client.get("/api/v1/members")

    assert response.status_code == 200
    assert response.json()["summary"]["pending_demo_invite_count"] == 1
```

- [ ] **Step 2: Run the targeted backend tests to verify they fail**

Run:

```bash
PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -k "demo_workspace_snapshot or demo_cannot_read_firm_workspace_routes or pending_demo_invite_count" -q
```

Expected:

```text
FAIL because `/api/v1/demo/workspace` and member summary fields do not exist yet
```

- [ ] **Step 3: Add demo workspace contracts**

```python
# backend/app/demo/schemas.py
from pydantic import BaseModel, Field
from typing import Literal


class DemoWorkspaceSectionRead(BaseModel):
    section_id: Literal[
        "sample_matters",
        "sample_deliverables",
        "sample_history",
        "workspace_rules",
    ]
    title: str
    summary: str
    items: list[str] = Field(default_factory=list)


class DemoWorkspaceRead(BaseModel):
    workspace_mode: Literal["demo"] = "demo"
    title: str
    subtitle: str
    entry_message: str
    sections: list[DemoWorkspaceSectionRead] = Field(default_factory=list)
```

- [ ] **Step 4: Implement the fixed shared demo dataset service**

```python
# backend/app/services/demo_workspace.py
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.demo import schemas as demo_schemas
from app.domain import models


def get_demo_workspace_snapshot(
    db: Session,
    *,
    firm_id: str,
) -> demo_schemas.DemoWorkspaceRead:
    policy = db.scalar(
        select(models.DemoWorkspacePolicy).where(
            models.DemoWorkspacePolicy.firm_id == firm_id
        )
    )
    if policy is None:
        policy = models.DemoWorkspacePolicy(firm_id=firm_id)
        db.add(policy)
        db.commit()

    return demo_schemas.DemoWorkspaceRead(
        title="Infinite Pro Demo Workspace",
        subtitle="固定展示資料｜唯讀｜不連到正式案件資料",
        entry_message="你目前正在 demo workspace。這裡只能看，不能新增、修改、分析或治理。",
        sections=[
            demo_schemas.DemoWorkspaceSectionRead(
                section_id="sample_matters",
                title="Sample Matters",
                summary="展示案件世界與主工作面會長成什麼樣子。",
                items=[
                    "創業階段成長診斷",
                    "制度化階段營運 review",
                ],
            ),
            demo_schemas.DemoWorkspaceSectionRead(
                section_id="sample_deliverables",
                title="Sample Deliverables",
                summary="展示交付物如何從案件世界與 shared intelligence 收斂出來。",
                items=[
                    "旗艦診斷 memo",
                    "持續顧問 follow-up brief",
                ],
            ),
            demo_schemas.DemoWorkspaceSectionRead(
                section_id="sample_history",
                title="Sample History",
                summary="展示 shared intelligence 與 precedent family 的唯讀讀法。",
                items=[
                    "precedent review lane",
                    "phase 4 closure review",
                ],
            ),
            demo_schemas.DemoWorkspaceSectionRead(
                section_id="workspace_rules",
                title="Demo Rules",
                summary="說明 demo 的使用邊界。",
                items=[
                    "不能新增案件",
                    "不能上傳材料",
                    "不能執行分析",
                    "不能碰正式資料",
                ],
            ),
        ],
    )
```

- [ ] **Step 5: Add demo route and member summary**

```python
# backend/app/api/routes/demo.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.auth import require_permission
from app.core.database import get_db
from app.demo.schemas import DemoWorkspaceRead
from app.services.demo_workspace import get_demo_workspace_snapshot

router = APIRouter(prefix="/demo", tags=["demo"])


@router.get("/workspace", response_model=DemoWorkspaceRead)
def get_demo_workspace_route(
    current_member=Depends(require_permission("access_demo_workspace")),
    db: Session = Depends(get_db),
) -> DemoWorkspaceRead:
    return get_demo_workspace_snapshot(db, firm_id=current_member.firm.id)
```

```python
# backend/app/identity/schemas.py
class MemberListSummary(BaseModel):
    active_demo_member_count: int = 0
    pending_demo_invite_count: int = 0


class MemberListResponse(BaseModel):
    members: list[MemberRead] = Field(default_factory=list)
    pending_invites: list[MemberInviteRead] = Field(default_factory=list)
    summary: MemberListSummary = Field(default_factory=MemberListSummary)
```

```python
# backend/app/services/members.py
return identity_schemas.MemberListResponse(
    members=[serialize_member_row(item) for item in memberships],
    pending_invites=[serialize_invite_row(item) for item in invites],
    summary=identity_schemas.MemberListSummary(
        active_demo_member_count=sum(1 for item in memberships if item.role == "demo" and item.status == "active"),
        pending_demo_invite_count=sum(1 for item in invites if item.role == "demo" and item.status == "pending"),
    ),
)
```

```python
# backend/app/api/router.py
from app.api.routes import auth, deliverables, demo, extensions, health, matters, members, runs, tasks, uploads, workbench

api_router.include_router(demo.router)
```

- [ ] **Step 6: Run the targeted backend tests to verify they pass**

Run:

```bash
PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -k "demo_workspace_snapshot or demo_cannot_read_firm_workspace_routes or pending_demo_invite_count" -q
```

Expected:

```text
3 passed
```

- [ ] **Step 7: Commit the demo backend slice**

```bash
git add backend/app/demo/schemas.py backend/app/services/demo_workspace.py backend/app/api/routes/demo.py backend/app/api/router.py backend/app/identity/schemas.py backend/app/services/members.py backend/tests/test_mvp_slice.py
git commit -m "feat: add demo workspace backend"
```

---

### Task 3: Frontend Demo Route, Nav, and Redirect Shell

**Files:**
- Create: `frontend/src/app/demo/page.tsx`
- Create: `frontend/src/components/demo-page-panel.tsx`
- Create: `frontend/src/lib/demo-workspace.ts`
- Modify: `frontend/src/lib/types.ts`
- Modify: `frontend/src/lib/api.ts`
- Modify: `frontend/src/lib/permissions.ts`
- Modify: `frontend/src/components/app-shell.tsx`
- Test: `frontend/tests/demo-workspace-isolation.test.mjs`

- [ ] **Step 1: Write the failing frontend tests for demo nav and redirect rules**

```javascript
import test from "node:test";
import assert from "node:assert/strict";

import {
  buildPrimaryNavForMembershipRole,
  resolveProtectedPathForMembershipRole,
} from "../src/lib/permissions.ts";

test("demo sees only the demo nav entry", () => {
  const nav = buildPrimaryNavForMembershipRole("demo");
  assert.deepEqual(nav, [{ href: "/demo", label: "Demo Workspace" }]);
});

test("demo is redirected away from firm workspace paths", () => {
  assert.equal(resolveProtectedPathForMembershipRole("demo", "/matters"), "/demo");
  assert.equal(resolveProtectedPathForMembershipRole("demo", "/deliverables"), "/demo");
  assert.equal(resolveProtectedPathForMembershipRole("owner", "/matters"), null);
});
```

- [ ] **Step 2: Run the frontend tests to verify they fail**

Run:

```bash
cd frontend && node --test tests/demo-workspace-isolation.test.mjs
```

Expected:

```text
FAIL because demo nav / redirect helper does not exist yet
```

- [ ] **Step 3: Add demo contracts and API client**

```typescript
// frontend/src/lib/types.ts
export interface DemoWorkspaceSection {
  sectionId: "sample_matters" | "sample_deliverables" | "sample_history" | "workspace_rules";
  title: string;
  summary: string;
  items: string[];
}

export interface DemoWorkspaceSnapshot {
  workspaceMode: "demo";
  title: string;
  subtitle: string;
  entryMessage: string;
  sections: DemoWorkspaceSection[];
}
```

```typescript
// frontend/src/lib/api.ts
export async function getDemoWorkspaceSnapshot(): Promise<DemoWorkspaceSnapshot> {
  const response = await apiFetch(`${getApiBaseUrl()}/demo/workspace`, {
    cache: "no-store",
  });
  const payload = await parseResponse<any>(response);
  return {
    workspaceMode: payload.workspace_mode,
    title: payload.title,
    subtitle: payload.subtitle,
    entryMessage: payload.entry_message,
    sections: (payload.sections || []).map((section: any) => ({
      sectionId: section.section_id,
      title: section.title,
      summary: section.summary,
      items: Array.isArray(section.items) ? section.items : [],
    })),
  };
}
```

- [ ] **Step 4: Add demo nav / redirect helper and page shell**

```typescript
// frontend/src/lib/permissions.ts
export function resolveProtectedPathForMembershipRole(
  role: MembershipRole,
  pathname: string,
) {
  if (role !== "demo") {
    return null;
  }
  if (pathname === "/demo") {
    return null;
  }
  return "/demo";
}

export function buildPrimaryNavForMembershipRole(role: MembershipRole) {
  ...
  if (role === "demo") {
    return [{ href: "/demo", label: "Demo Workspace" }];
  }
  return [];
}
```

```tsx
// frontend/src/app/demo/page.tsx
import { DemoPagePanel } from "@/components/demo-page-panel";

export default function DemoPage() {
  return <DemoPagePanel />;
}
```

```tsx
// frontend/src/components/demo-page-panel.tsx
"use client";

import { useEffect, useState } from "react";

import { getDemoWorkspaceSnapshot } from "@/lib/api";
import type { DemoWorkspaceSnapshot } from "@/lib/types";

export function DemoPagePanel() {
  const [snapshot, setSnapshot] = useState<DemoWorkspaceSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const result = await getDemoWorkspaceSnapshot();
        if (!cancelled) {
          setSnapshot(result);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "目前無法載入 demo workspace。");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="page-shell">
      <section className="section-card">
        <p className="hero-focus-label">Demo Workspace</p>
        <h1>{snapshot?.title || "Infinite Pro Demo Workspace"}</h1>
        <p className="section-copy">
          {snapshot?.entryMessage || "這裡是唯讀展示環境，不是正式辦案 workspace。"}
        </p>
      </section>
      {error ? <p className="error-text">{error}</p> : null}
      {(snapshot?.sections || []).map((section) => (
        <section key={section.sectionId} className="section-card">
          <h2>{section.title}</h2>
          <p className="section-copy">{section.summary}</p>
          <ul className="detail-list">
            {section.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
```

```tsx
// frontend/src/components/app-shell.tsx
const redirectTarget =
  session && !publicPath
    ? resolveProtectedPathForMembershipRole(session.membership.role, pathname)
    : null;

useEffect(() => {
  if (redirectTarget) {
    window.location.href = redirectTarget;
  }
}, [redirectTarget]);
```

- [ ] **Step 5: Run the frontend tests and build checks**

Run:

```bash
cd frontend && node --test tests/demo-workspace-isolation.test.mjs
cd frontend && rm -f .next/cache/.tsbuildinfo && npx next typegen && npm run typecheck
cd frontend && npm run build
```

Expected:

```text
demo workspace tests pass
typecheck passes
build passes and includes /demo
```

- [ ] **Step 6: Commit the demo frontend shell**

```bash
git add frontend/src/app/demo/page.tsx frontend/src/components/demo-page-panel.tsx frontend/src/lib/demo-workspace.ts frontend/src/lib/types.ts frontend/src/lib/api.ts frontend/src/lib/permissions.ts frontend/src/components/app-shell.tsx frontend/tests/demo-workspace-isolation.test.mjs
git commit -m "feat: add demo workspace shell"
```

---

### Task 4: Members Demo Controls and Owner Visibility

**Files:**
- Modify: `frontend/src/components/members-page-panel.tsx`
- Modify: `frontend/src/lib/demo-workspace.ts`
- Test: `frontend/tests/demo-workspace-isolation.test.mjs`

- [ ] **Step 1: Write the failing frontend test for demo seat summary**

```javascript
import { buildDemoMemberSummary } from "../src/lib/demo-workspace.ts";

test("demo member summary counts active and pending demo seats", () => {
  const summary = buildDemoMemberSummary({
    members: [
      { id: "1", email: "owner@example.com", fullName: "Owner", role: "owner", status: "active" },
      { id: "2", email: "demo1@example.com", fullName: "Demo 1", role: "demo", status: "active" },
      { id: "3", email: "demo2@example.com", fullName: "Demo 2", role: "demo", status: "disabled" },
    ],
    pendingInvites: [
      { id: "i1", email: "demo3@example.com", role: "demo", status: "pending" },
    ],
    summary: { activeDemoMemberCount: 1, pendingDemoInviteCount: 1 },
  });

  assert.equal(summary.activeCount, 1);
  assert.equal(summary.pendingCount, 1);
});
```

- [ ] **Step 2: Run the frontend test to verify it fails**

Run:

```bash
cd frontend && node --test tests/demo-workspace-isolation.test.mjs
```

Expected:

```text
FAIL because buildDemoMemberSummary does not exist yet
```

- [ ] **Step 3: Add demo summary helper**

```typescript
// frontend/src/lib/demo-workspace.ts
import type { MemberListSnapshot } from "@/lib/types";

export function buildDemoMemberSummary(snapshot: MemberListSnapshot | null) {
  return {
    activeCount: snapshot?.summary.activeDemoMemberCount || 0,
    pendingCount: snapshot?.summary.pendingDemoInviteCount || 0,
  };
}
```

- [ ] **Step 4: Surface demo control visibility inside Members**

```tsx
// frontend/src/components/members-page-panel.tsx
const demoSummary = buildDemoMemberSummary(snapshot);

...

<section className="section-card">
  <h2>Demo 帳號概況</h2>
  <p className="section-copy">
    owner 可以在這裡控管 demo 帳號數量與啟停；demo 角色只會進入唯讀 demo workspace。
  </p>
  <div className="summary-grid">
    <div className="section-card">
      <p className="muted-text">已啟用 demo</p>
      <strong>{demoSummary.activeCount}</strong>
    </div>
    <div className="section-card">
      <p className="muted-text">待接受 demo 邀請</p>
      <strong>{demoSummary.pendingCount}</strong>
    </div>
  </div>
</section>
```

- [ ] **Step 5: Re-run frontend tests to verify they pass**

Run:

```bash
cd frontend && node --test tests/demo-workspace-isolation.test.mjs
```

Expected:

```text
all demo workspace frontend tests pass
```

- [ ] **Step 6: Commit the members demo controls**

```bash
git add frontend/src/components/members-page-panel.tsx frontend/src/lib/demo-workspace.ts frontend/tests/demo-workspace-isolation.test.mjs
git commit -m "feat: add demo member controls"
```

---

### Task 5: Docs, QA, and Full Verification

**Files:**
- Modify: `docs/00_product_definition_and_current_state.md`
- Modify: `docs/01_runtime_architecture_and_data_contracts.md`
- Modify: `docs/03_workbench_ux_and_page_spec.md`
- Modify: `docs/04_qa_matrix.md`
- Modify: `docs/superpowers/specs/2026-04-06-phase-5-demo-workspace-isolation-design.md`

- [ ] **Step 1: Update active docs to reflect shipped demo isolation behavior**

```markdown
<!-- docs/00_product_definition_and_current_state.md -->
- phase 5 第三個 slice `demo workspace isolation` 已正式落地：
  - demo 只進 `/demo`
  - demo 只讀固定 sample dataset
  - demo 不可進正式 firm workspace
  - owner 可在 members 面板看到 demo 帳號概況
```

```markdown
<!-- docs/01_runtime_architecture_and_data_contracts.md -->
- `demo` 現在正式有 `access_demo_workspace`
- demo data source 與正式 firm workspace data source 分離
- demo route 不得回讀正式 matter / deliverable / history objects
```

```markdown
<!-- docs/03_workbench_ux_and_page_spec.md -->
### `/demo`

- 主要任務：展示 Infinite Pro 的固定 sample workspace
- 第一屏必答：你在 demo workspace、這不是正式辦案 workspace、這裡只能看不能操作
```

- [ ] **Step 2: Run full verification**

Run:

```bash
python3 -m compileall backend/app
PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -q
cd frontend && node --test tests/auth-foundation.test.mjs tests/provider-settings-foundation.test.mjs tests/demo-workspace-isolation.test.mjs tests/intake-progress.test.mjs
cd frontend && rm -f .next/cache/.tsbuildinfo && npx next typegen && npm run typecheck
cd frontend && npm run build
cd frontend && NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8010/api/v1 npm run build
```

Expected:

```text
backend compileall passes
backend MVP slice tests all pass
frontend node tests pass
typecheck passes
both Next builds pass
```

- [ ] **Step 3: Update QA matrix with real evidence only**

```markdown
## Entry: 2026-04-06 phase-5 demo workspace isolation pass

Scope:
- demo workspace route and isolation
- fixed shared demo dataset
- owner demo account controls
- frontend /demo shell and redirect behavior

### Build / Typecheck / Compile

| Check | Result |
| --- | --- |
| `python3 -m compileall backend/app` | Passed |
| `PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -q` | Passed |
| `cd frontend && node --test tests/auth-foundation.test.mjs tests/provider-settings-foundation.test.mjs tests/demo-workspace-isolation.test.mjs tests/intake-progress.test.mjs` | Passed |
| `cd frontend && rm -f .next/cache/.tsbuildinfo && npx next typegen && npm run typecheck` | Passed |
| `cd frontend && npm run build` | Passed |
| `cd frontend && NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8010/api/v1 npm run build` | Passed |
```

- [ ] **Step 4: Commit the docs / QA closeout**

```bash
git add docs/00_product_definition_and_current_state.md docs/01_runtime_architecture_and_data_contracts.md docs/03_workbench_ux_and_page_spec.md docs/04_qa_matrix.md docs/superpowers/specs/2026-04-06-phase-5-demo-workspace-isolation-design.md
git commit -m "docs: align demo workspace isolation"
```
