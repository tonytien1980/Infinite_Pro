# Multi-Consultant Ontology Intelligence Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring Infinite Pro from a single-consultant/single-firm baseline to a private-beta-ready single firm where 3 to 5 consultants can work separate matters while safely feeding shared intelligence.

**Architecture:** This slice preserves the six-layer architecture and the Host boundary. It adds ownership metadata and access gates around raw matter/task data, adds deterministic risk gates to reusable intelligence, and changes provider resolution so consultant personal keys take priority while firm defaults cover consultants who have not configured a key. The UI work is limited to visible contract/copy surfaces needed to make those behaviors understandable.

**Tech Stack:** FastAPI, SQLAlchemy 2, Pydantic 2, PostgreSQL/SQLite incremental schema patches, Next.js 15 App Router, React 19, TypeScript, node:test, pytest

---

## Workflow Declaration

- Selected workflow: `Workflow B: Product Delivery Workflow`
- Current stage: implementation planning after approved design spec
- Primary agent: `Jocelyn (PM Agent)`
- Supporting agents for execution: `Chris (Backend Agent)`, `瑪麗亞 (Frontend Agent)`, `史嘉蕾 (UIUX Agent)`, `阿達 (Architecture & Performance Agent)`, `路易絲 (QA Agent)`, `愛咪 (Documentation Agent)`
- Deferred agents:
  - `阿熊 (Cost & FinOps Agent)` is deferred because this slice only changes provider fallback and usage-awareness copy; no billing, quota ledger, pricing calculation, or cost accounting is approved.
  - `小Git (GitHub & Release Agent)` is deferred until the implementation branch is ready to ship.
  - `潔西卡 (Security & Audit Agent)` is deferred because this slice is not a full security audit; privacy gates still receive focused backend tests.
- Required skills for execution: `superpowers:subagent-driven-development` or `superpowers:executing-plans`, `superpowers:test-driven-development`, `superpowers:verification-before-completion`, `clarify`, `harden`
- Task-level mandatory base skills: `test-driven-development`, `systematic-debugging` for failing tests or broken flows, `review` before landing, `qa` for authenticated browser verification, `document-release` for active docs sync
- Expected tools: shell, `apply_patch`, pytest, node:test, Next build/typecheck, optional browser QA after code is running
- Memory reads: project memory and active docs before execution
- Memory writes: not from this session; record stage output only through the approved memory mechanism in a later handoff
- Human approval gates: start implementation, accept data-boundary behavior for legacy records, push/merge
- Expected artifacts: backend/frontend changes, active docs sync, QA evidence entry only after real verification, final local/GitHub status report

## Scope Guard

This implementation plan handles:

- Single-firm private beta boundary for 3 to 5 consultants
- Raw case privacy by default
- Owner governance without consultant surveillance surfaces
- Shared intelligence auto-share with deterministic risk gates
- Provider precedence: personal key first, firm default fallback
- Low-noise visible labels for the new states
- Active docs alignment and real QA evidence after verification

This implementation plan does not handle:

- Public multi-tenant SaaS
- Billing, credits, invoices, subscriptions, or token ledgers
- Consultant ranking, productivity monitoring, or surveillance dashboards
- Rebuilding Shell v2 or changing the whole navigation model
- Raw cross-consultant case search
- Model fine-tuning or automatic training on user data
- A seventh architecture layer

## Approved Product Decisions

- `Single Firm Private Beta`: one firm, 3 to 5 consultants, each consultant works their own matters, shared intelligence is common.
- `Auto-Share With Risk Gates`: trusted consultant feedback creates reusable intelligence by default, while risky entries are held back or weakened.
- `Case Privacy By Default`: consultants do not see each other's raw matters, tasks, materials, deliverables, or history.
- `Owner Governance, Not Surveillance`: owner can govern quality and shared intelligence, but the product does not rank or monitor consultants.
- `Personal Key First, Firm Default Fallback`: consultant personal provider key is preferred; if absent, the firm default provider runs the task.

## File Structure

### Backend

- Create: `backend/app/services/case_access.py`
  - Current-member-aware access helpers for tasks, matters, deliverables, uploads, sources, and run paths
- Create: `backend/app/services/shared_intelligence_risk_gates.py`
  - Deterministic risk-gate evaluator for precedent candidates
- Modify: `backend/app/domain/enums.py`
  - Add `PrecedentShareStatus`
- Modify: `backend/app/domain/models.py`
  - Add `firm_id` and `created_by_user_id` to `Task`
  - Add `firm_id` and `created_by_user_id` to `MatterWorkspace`
  - Add share/risk fields to `PrecedentCandidate`
- Modify: `backend/app/core/database.py`
  - Add incremental schema patches for new columns
- Modify: `backend/app/domain/schemas.py`
  - Expose owner/read-only metadata and precedent share/risk fields
- Modify: `backend/app/services/tasks.py`
  - Pass current member through create/list/read/update/feedback/governance paths
  - Scope matter keys by firm and actor
  - Serialize share/risk metadata
- Modify: `backend/app/services/uploads.py`
  - Require task access before saving uploads
- Modify: `backend/app/services/sources.py`
  - Require task access before ingesting pasted text or URLs
- Modify: `backend/app/services/precedent_intelligence.py`
  - Exclude `needs_review` candidates from Host reference
  - Treat `provisional` candidates as weak guidance
- Modify: `backend/app/services/system_provider_settings.py`
  - Allow consultants without a personal key to use firm default
  - Keep explicit disallowed personal provider settings fail-closed
- Modify: `backend/app/api/routes/tasks.py`
  - Pass `current_member` into task services
- Modify: `backend/app/api/routes/matters.py`
  - Pass `current_member` into matter services and continuation paths
- Modify: `backend/app/api/routes/deliverables.py`
  - Pass `current_member` into deliverable read/update/export/feedback paths
- Modify: `backend/app/api/routes/uploads.py`
  - Pass `current_member` into upload/source services
- Modify: `backend/app/api/routes/runs.py`
  - Check task access before run orchestration
- Test: `backend/tests/test_mvp_slice.py`
  - Add private-beta access, shared-intelligence, and provider fallback regression tests near the existing auth/provider/precedent tests

### Frontend

- Modify: `frontend/src/lib/types.ts`
  - Add `PrecedentShareStatus`
  - Add `share_status`, `risk_flags`, `risk_summary`, signal-count fields to `PrecedentCandidate`
  - Add owner/read-only metadata fields to task/matter summaries when surfaced
- Modify: `frontend/src/lib/precedent-candidates.ts`
  - Add low-noise labels for provisional, validated, and needs-review shared intelligence
- Modify: `frontend/src/lib/provider-settings.ts`
  - Add copy helper that explains personal key first and firm fallback
- Modify: `frontend/src/components/settings-page-panel.tsx`
  - Show the provider fallback rule in consultant-readable Traditional Chinese
- Modify: `frontend/src/components/matter-workspace-panel.tsx`
  - Keep case-privacy copy low-noise; do not add monitoring widgets
- Modify: `frontend/src/components/workbench-home.tsx`
  - Owner sees governance posture, not consultant surveillance
- Test: `frontend/tests/product-language.test.mjs`
  - Guard high-visibility wording for shared intelligence and provider fallback
- Test: `frontend/tests/consultant-usability.test.mjs`
  - Guard low-noise labels on matter/workbench surfaces
- Test: `frontend/tests/provider-settings-foundation.test.mjs`
  - Update provider fallback expectations

### Docs

- Modify: `docs/00_product_definition_and_current_state.md`
  - Add the private-beta target as next-phase product posture after implementation is shipped
- Modify: `docs/06_product_alignment_and_85_point_roadmap.md`
  - Add `Multi-Consultant Ontology Intelligence Readiness` as the new decision phase after verification
- Modify: `docs/01_runtime_architecture_and_data_contracts.md`
  - Document ownership fields, access rules, provider fallback, and shared-intelligence share statuses
- Modify: `docs/02_host_agents_packs_and_extension_system.md`
  - Document Host-safe precedent usage with `share_status`
- Modify: `docs/03_workbench_ux_and_page_spec.md`
  - Document visible privacy/provider/shared-intelligence labels
- Modify: `docs/04_qa_matrix.md`
  - Append evidence only after real pytest, node, build, typecheck, and browser QA runs

---

### Task 1: Lock Private-Beta Raw Case Privacy With Failing Backend Tests

**Files:**
- Modify: `backend/tests/test_mvp_slice.py`

- [ ] **Step 1: Add the multi-consultant login helper near the existing auth helpers**

```python
def login_as_named_consultant_with_owner_invite(
    anonymous_client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
    *,
    email: str,
    full_name: str,
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
        json={"email": email, "role": "consultant"},
    )
    assert invite.status_code in {200, 409}
    assert anonymous_client.post("/api/v1/auth/logout").status_code == 200
    login_google_user(
        anonymous_client,
        monkeypatch,
        email=email,
        full_name=full_name,
    )
    return anonymous_client
```

- [ ] **Step 2: Add the failing test for task and matter isolation**

```python
def test_consultants_only_list_their_own_tasks_and_matters(
    anonymous_client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    consultant_a = login_as_named_consultant_with_owner_invite(
        anonymous_client,
        monkeypatch,
        email="consultant-a@example.com",
        full_name="Consultant A",
    )

    created_a = consultant_a.post(
        "/api/v1/tasks",
        json=create_task_payload("Consultant A private matter"),
    )
    assert created_a.status_code == 201
    task_a_id = created_a.json()["id"]
    matter_a_id = created_a.json()["matter_workspace"]["id"]

    assert consultant_a.post("/api/v1/auth/logout").status_code == 200

    consultant_b = login_as_named_consultant_with_owner_invite(
        anonymous_client,
        monkeypatch,
        email="consultant-b@example.com",
        full_name="Consultant B",
    )
    created_b = consultant_b.post(
        "/api/v1/tasks",
        json=create_task_payload("Consultant B private matter"),
    )
    assert created_b.status_code == 201
    task_b_id = created_b.json()["id"]

    task_listing = consultant_b.get("/api/v1/tasks")
    assert task_listing.status_code == 200
    visible_task_ids = {item["id"] for item in task_listing.json()}
    assert task_b_id in visible_task_ids
    assert task_a_id not in visible_task_ids

    matter_listing = consultant_b.get("/api/v1/matters")
    assert matter_listing.status_code == 200
    visible_matter_ids = {item["id"] for item in matter_listing.json()}
    assert created_b.json()["matter_workspace"]["id"] in visible_matter_ids
    assert matter_a_id not in visible_matter_ids

    blocked_task = consultant_b.get(f"/api/v1/tasks/{task_a_id}")
    assert blocked_task.status_code == 404

    blocked_matter = consultant_b.get(f"/api/v1/matters/{matter_a_id}")
    assert blocked_matter.status_code == 404
```

- [ ] **Step 3: Add the failing test for mutating another consultant's task**

```python
def test_consultant_cannot_mutate_or_run_another_consultants_task(
    anonymous_client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    consultant_a = login_as_named_consultant_with_owner_invite(
        anonymous_client,
        monkeypatch,
        email="consultant-a@example.com",
        full_name="Consultant A",
    )
    created_a = consultant_a.post(
        "/api/v1/tasks",
        json=create_task_payload("Consultant A run boundary"),
    )
    assert created_a.status_code == 201
    task_a_id = created_a.json()["id"]
    assert consultant_a.post("/api/v1/auth/logout").status_code == 200

    consultant_b = login_as_named_consultant_with_owner_invite(
        anonymous_client,
        monkeypatch,
        email="consultant-b@example.com",
        full_name="Consultant B",
    )

    extension_attempt = consultant_b.put(
        f"/api/v1/tasks/{task_a_id}/extensions",
        json={"pack_override_ids": [], "agent_override_ids": []},
    )
    assert extension_attempt.status_code == 404

    run_attempt = consultant_b.post(f"/api/v1/tasks/{task_a_id}/run")
    assert run_attempt.status_code == 404
```

- [ ] **Step 4: Run targeted tests and confirm failure**

Run:

```bash
PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -k "consultants_only_list_their_own_tasks_and_matters or consultant_cannot_mutate_or_run_another_consultants_task" -q
```

Expected:

```text
FAIL because consultant B can still see or touch consultant A raw case data
```

- [ ] **Step 5: Commit only the failing tests**

```bash
git add backend/tests/test_mvp_slice.py
git commit -m "test: lock multi-consultant case privacy boundary"
```

Do not stage `.gitignore`.

---

### Task 2: Add Ownership Model And Case Access Helpers

**Files:**
- Create: `backend/app/services/case_access.py`
- Modify: `backend/app/domain/models.py`
- Modify: `backend/app/core/database.py`

- [ ] **Step 1: Add ownership columns to SQLAlchemy models**

```python
# backend/app/domain/models.py
class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    firm_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    created_by_user_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
```

```python
# backend/app/domain/models.py
class MatterWorkspace(Base):
    __tablename__ = "matter_workspaces"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    firm_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    created_by_user_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    matter_key: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
```

- [ ] **Step 2: Add incremental schema patches**

```python
# backend/app/core/database.py
schema_patches = {
    "matter_workspaces": {
        "summary": "TEXT NOT NULL DEFAULT ''",
        "status": "VARCHAR(50)",
        "content_sections": "JSON NOT NULL DEFAULT '{}'",
        "title_override_active": "BOOLEAN NOT NULL DEFAULT FALSE",
        "engagement_continuity_mode": "VARCHAR(30) NOT NULL DEFAULT 'one_off'",
        "writeback_depth": "VARCHAR(30) NOT NULL DEFAULT 'minimal'",
        "firm_id": "VARCHAR(36)",
        "created_by_user_id": "VARCHAR(36)",
    },
    "tasks": {
        "entry_preset": "VARCHAR(50) NOT NULL DEFAULT 'one_line_inquiry'",
        "firm_id": "VARCHAR(36)",
        "created_by_user_id": "VARCHAR(36)",
    },
}
```

- [ ] **Step 3: Create the access helper**

```python
# backend/app/services/case_access.py
from __future__ import annotations

from fastapi import HTTPException
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.core.auth import CurrentMember
from app.domain import models


def is_owner(member: CurrentMember) -> bool:
    return member.membership.role == "owner"


def _not_found() -> HTTPException:
    return HTTPException(status_code=404, detail="找不到指定案件或目前身份不可讀取。")


def stamp_task_ownership(task: models.Task, member: CurrentMember) -> None:
    task.firm_id = member.firm.id
    task.created_by_user_id = member.user.id


def stamp_matter_ownership(matter_workspace: models.MatterWorkspace, member: CurrentMember) -> None:
    matter_workspace.firm_id = member.firm.id
    matter_workspace.created_by_user_id = member.user.id


def scoped_matter_key(raw_matter_key: object, member: CurrentMember) -> str:
    owner_or_user_scope = "owner" if is_owner(member) else member.user.id
    return f"{member.firm.id}:{owner_or_user_scope}:{str(raw_matter_key)}"


def scope_matter_identity(identity: dict[str, object], member: CurrentMember) -> dict[str, object]:
    scoped = dict(identity)
    scoped["matter_key"] = scoped_matter_key(scoped["matter_key"], member)
    return scoped


def task_access_statement(member: CurrentMember):
    base = select(models.Task)
    if is_owner(member):
        return base.where(or_(models.Task.firm_id == member.firm.id, models.Task.firm_id.is_(None)))
    return base.where(
        models.Task.firm_id == member.firm.id,
        models.Task.created_by_user_id == member.user.id,
    )


def matter_access_statement(member: CurrentMember):
    base = select(models.MatterWorkspace)
    if is_owner(member):
        return base.where(
            or_(
                models.MatterWorkspace.firm_id == member.firm.id,
                models.MatterWorkspace.firm_id.is_(None),
            )
        )
    return base.where(
        models.MatterWorkspace.firm_id == member.firm.id,
        models.MatterWorkspace.created_by_user_id == member.user.id,
    )


def assert_task_access(task: models.Task | None, member: CurrentMember) -> models.Task:
    if task is None:
        raise _not_found()
    if is_owner(member):
        if task.firm_id in {None, member.firm.id}:
            return task
        raise _not_found()
    if task.firm_id == member.firm.id and task.created_by_user_id == member.user.id:
        return task
    raise _not_found()


def assert_matter_access(
    matter_workspace: models.MatterWorkspace | None,
    member: CurrentMember,
) -> models.MatterWorkspace:
    if matter_workspace is None:
        raise _not_found()
    if is_owner(member):
        if matter_workspace.firm_id in {None, member.firm.id}:
            return matter_workspace
        raise _not_found()
    if (
        matter_workspace.firm_id == member.firm.id
        and matter_workspace.created_by_user_id == member.user.id
    ):
        return matter_workspace
    raise _not_found()


def assert_deliverable_access(db: Session, deliverable_id: str, member: CurrentMember) -> models.Deliverable:
    deliverable = db.scalar(select(models.Deliverable).where(models.Deliverable.id == deliverable_id))
    if deliverable is None:
        raise _not_found()
    task = db.get(models.Task, deliverable.task_id)
    assert_task_access(task, member)
    return deliverable
```

- [ ] **Step 4: Run import and compile checks**

Run:

```bash
python3 -m compileall backend/app
```

Expected:

```text
Compile completes without SyntaxError
```

- [ ] **Step 5: Commit the model/helper foundation**

```bash
git add backend/app/domain/models.py backend/app/core/database.py backend/app/services/case_access.py
git commit -m "feat: add case ownership access foundation"
```

Do not stage `.gitignore`.

---

### Task 3: Wire Task, Matter, Upload, Source, Run, And Deliverable Access

**Files:**
- Modify: `backend/app/services/tasks.py`
- Modify: `backend/app/services/uploads.py`
- Modify: `backend/app/services/sources.py`
- Modify: `backend/app/api/routes/tasks.py`
- Modify: `backend/app/api/routes/matters.py`
- Modify: `backend/app/api/routes/deliverables.py`
- Modify: `backend/app/api/routes/uploads.py`
- Modify: `backend/app/api/routes/runs.py`

- [ ] **Step 1: Update `create_task` to accept and stamp `current_member`**

```python
# backend/app/services/tasks.py
from app.core.auth import CurrentMember
from app.services.case_access import (
    assert_matter_access,
    assert_task_access,
    matter_access_statement,
    scope_matter_identity,
    stamp_matter_ownership,
    stamp_task_ownership,
    task_access_statement,
)


def create_task(
    db: Session,
    payload: schemas.TaskCreateRequest,
    *,
    current_member: CurrentMember,
) -> models.Task:
    compiled_seed = compile_case_world_seed_from_payload(payload)
    compiled_seed.identity = scope_matter_identity(compiled_seed.identity, current_member)
    matter_workspace, _ = ensure_matter_workspace_for_seed(
        db,
        seed=compiled_seed,
        continuity_mode=payload.engagement_continuity_mode,
        writeback_depth=payload.writeback_depth,
        current_member=current_member,
    )
    stamp_matter_ownership(matter_workspace, current_member)

    task = models.Task(
        title=payload.title,
        description=payload.description,
        task_type=payload.task_type,
        mode=payload.mode.value,
        entry_preset=payload.entry_preset.value,
        status=TaskStatus.READY.value,
    )
    stamp_task_ownership(task, current_member)
```

- [ ] **Step 2: Update matter workspace helpers to preserve ownership**

```python
# backend/app/services/tasks.py
def ensure_matter_workspace_for_seed(
    db: Session,
    *,
    seed: CompiledCaseWorldSeed,
    continuity_mode: EngagementContinuityMode,
    writeback_depth: WritebackDepth,
    current_member: CurrentMember | None = None,
) -> tuple[models.MatterWorkspace, bool]:
    matter_workspace = db.scalars(
        select(models.MatterWorkspace).where(
            models.MatterWorkspace.matter_key == str(seed.identity["matter_key"])
        )
    ).one_or_none()
    if matter_workspace is None:
        matter_workspace = models.MatterWorkspace(
            **seed.identity,
            engagement_continuity_mode=continuity_mode.value,
            writeback_depth=writeback_depth.value,
        )
        if current_member is not None:
            stamp_matter_ownership(matter_workspace, current_member)
        db.add(matter_workspace)
        db.flush()
        return matter_workspace, True
```

```python
# backend/app/services/tasks.py
def ensure_matter_workspace_for_task(
    db: Session,
    task: models.Task,
    client: schemas.ClientRead | None,
    engagement: schemas.EngagementRead | None,
    workstream: schemas.WorkstreamRead | None,
    decision_context: schemas.DecisionContextRead | None,
    domain_lenses: list[str],
    continuity_mode: EngagementContinuityMode | None = None,
    writeback_depth: WritebackDepth | None = None,
    current_member: CurrentMember | None = None,
) -> tuple[models.MatterWorkspace, bool]:
    identity = _derive_matter_workspace_identity(
        task,
        client,
        engagement,
        workstream,
        decision_context,
        domain_lenses,
    )
    if current_member is not None:
        identity = scope_matter_identity(identity, current_member)
```

- [ ] **Step 3: Update task read/list services**

```python
# backend/app/services/tasks.py
def get_loaded_task(
    db: Session,
    task_id: str,
    *,
    current_member: CurrentMember | None = None,
) -> models.Task:
    statement = select(models.Task).options(*task_load_options()).where(models.Task.id == task_id)
    task = db.scalars(statement).unique().one_or_none()
    if current_member is not None:
        return assert_task_access(task, current_member)
    if task is None:
        raise HTTPException(status_code=404, detail="找不到指定任務。")
    return task


def list_tasks(
    db: Session,
    *,
    current_member: CurrentMember,
) -> list[schemas.TaskListItemResponse]:
    statement = (
        task_access_statement(current_member)
        .options(*task_load_options())
        .order_by(models.Task.updated_at.desc())
    )
    tasks = db.scalars(statement).unique().all()
```

- [ ] **Step 4: Update matter read/list services**

```python
# backend/app/services/tasks.py
def list_matter_workspaces(
    db: Session,
    *,
    current_member: CurrentMember,
) -> list[schemas.MatterWorkspaceSummaryRead]:
    visible_tasks = db.scalars(
        task_access_statement(current_member)
        .options(*task_load_options())
        .order_by(models.Task.updated_at.desc())
    ).unique().all()
    for task in visible_tasks:
        client, engagement, workstream, decision_context, domain_lenses, _, _ = (
            _build_world_preferred_ontology_spine_for_task(task)
        )
        ensure_matter_workspace_for_task(
            db,
            task,
            client,
            engagement,
            workstream,
            decision_context,
            domain_lenses,
            current_member=current_member,
        )
    matter_workspaces = db.scalars(
        matter_access_statement(current_member).order_by(models.MatterWorkspace.updated_at.desc())
    ).all()
```

```python
# backend/app/services/tasks.py
def get_matter_workspace(
    db: Session,
    matter_id: str,
    *,
    current_member: CurrentMember | None = None,
) -> schemas.MatterWorkspaceResponse:
    matter_workspace = db.scalars(
        select(models.MatterWorkspace)
        .options(selectinload(models.MatterWorkspace.case_world_state))
        .where(models.MatterWorkspace.id == matter_id)
    ).one_or_none()
    if current_member is not None:
        matter_workspace = assert_matter_access(matter_workspace, current_member)
```

- [ ] **Step 5: Pass `current_member` through API routes**

```python
# backend/app/api/routes/tasks.py
task = create_task(db, payload, current_member=current_member)
return list_tasks(db, current_member=current_member)
task = get_loaded_task(db, task_id, current_member=current_member)
task = update_task_extension_overrides(db, task_id, payload, current_member=current_member)
return approve_task_writeback_record(db, task_id, payload, current_member=current_member)
return apply_recommendation_adoption_feedback(
    db,
    task_id,
    recommendation_id,
    payload,
    current_member=current_member,
)
```

```python
# backend/app/api/routes/matters.py
return list_matter_workspaces(db, current_member=current_member)
return get_matter_workspace(db, matter_id, current_member=current_member)
return update_matter_workspace_metadata(db, matter_id, payload, current_member=current_member)
return update_matter_workspace(db, matter_id, payload, current_member=current_member)
return apply_matter_continuation_action(db, matter_id, payload, current_member=current_member)
```

```python
# backend/app/api/routes/runs.py
task = get_loaded_task(db, task_id, current_member=current_member)
ensure_task_allows_continuation_activity(task)
```

```python
# backend/app/api/routes/uploads.py
task = get_loaded_task(db, task_id, current_member=current_member)
ensure_task_allows_continuation_activity(task)
return save_uploads_for_task(db=db, task_id=task_id, files=files, current_member=current_member)
return ingest_sources_for_task(db=db, task_id=task_id, payload=payload, current_member=current_member)
```

- [ ] **Step 6: Gate deliverable routes through the source task**

```python
# backend/app/api/routes/deliverables.py
return get_deliverable_workspace(db, deliverable_id, current_member=current_member)
return update_deliverable_metadata(db, deliverable_id, payload, current_member=current_member)
return update_deliverable_workspace(db, deliverable_id, payload, current_member=current_member)
return publish_deliverable_release(db, deliverable_id, payload, current_member=current_member)
return apply_deliverable_adoption_feedback(db, deliverable_id, payload, current_member=current_member)
return update_deliverable_precedent_candidate_status(
    db,
    deliverable_id,
    payload,
    current_member=current_member,
)
```

Inside each deliverable service, call:

```python
deliverable = assert_deliverable_access(db, deliverable_id, current_member)
```

- [ ] **Step 7: Run privacy tests**

Run:

```bash
PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -k "consultants_only_list_their_own_tasks_and_matters or consultant_cannot_mutate_or_run_another_consultants_task" -q
```

Expected:

```text
2 passed
```

- [ ] **Step 8: Run affected backend regression tests**

Run:

```bash
PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -k "demo or provider or precedent or task" -q
```

Expected:

```text
All selected tests pass
```

- [ ] **Step 9: Commit the access wiring**

```bash
git add backend/app/services/tasks.py backend/app/services/uploads.py backend/app/services/sources.py backend/app/api/routes/tasks.py backend/app/api/routes/matters.py backend/app/api/routes/deliverables.py backend/app/api/routes/uploads.py backend/app/api/routes/runs.py backend/tests/test_mvp_slice.py
git commit -m "feat: enforce consultant case privacy"
```

Do not stage `.gitignore`.

---

### Task 4: Add Shared Intelligence Auto-Share Risk Gates

**Files:**
- Create: `backend/app/services/shared_intelligence_risk_gates.py`
- Modify: `backend/app/domain/enums.py`
- Modify: `backend/app/domain/models.py`
- Modify: `backend/app/core/database.py`
- Modify: `backend/app/domain/schemas.py`
- Modify: `backend/app/services/tasks.py`
- Modify: `backend/app/services/precedent_intelligence.py`
- Modify: `backend/tests/test_mvp_slice.py`

- [ ] **Step 1: Add failing tests for share status and Host eligibility**

```python
def test_adopted_low_risk_feedback_creates_provisional_shared_intelligence(
    client: TestClient,
) -> None:
    created = client.post("/api/v1/tasks", json=create_task_payload("Low risk reusable pattern"))
    assert created.status_code == 201
    task_id = created.json()["id"]

    run = client.post(f"/api/v1/tasks/{task_id}/run")
    assert run.status_code == 200
    deliverable_id = run.json()["deliverable"]["id"]

    feedback = client.post(
        f"/api/v1/deliverables/{deliverable_id}/feedback",
        json={
            "feedback_status": "adopted",
            "reason_codes": ["clear_structure"],
            "note": "這份交付骨架可以重用在一般營運診斷。",
            "operator_label": "Owner User",
        },
    )

    assert feedback.status_code == 200
    candidate = feedback.json()["deliverable"]["precedent_candidate"]
    assert candidate["share_status"] == "provisional"
    assert candidate["risk_flags"] == []
```

```python
def test_sensitive_feedback_creates_needs_review_shared_intelligence(
    client: TestClient,
) -> None:
    created = client.post("/api/v1/tasks", json=create_task_payload("Sensitive reusable pattern"))
    assert created.status_code == 201
    task_id = created.json()["id"]

    run = client.post(f"/api/v1/tasks/{task_id}/run")
    assert run.status_code == 200
    deliverable_id = run.json()["deliverable"]["id"]

    feedback = client.post(
        f"/api/v1/deliverables/{deliverable_id}/feedback",
        json={
            "feedback_status": "adopted",
            "reason_codes": ["clear_structure"],
            "note": "這裡含有客戶名稱、報價、合約第 3 條與個資，不能直接共享。",
            "operator_label": "Owner User",
        },
    )

    assert feedback.status_code == 200
    candidate = feedback.json()["deliverable"]["precedent_candidate"]
    assert candidate["share_status"] == "needs_review"
    assert "sensitive_detail" in candidate["risk_flags"]
```

```python
def test_needs_review_precedent_is_not_host_reference_eligible() -> None:
    from app.services.precedent_intelligence import is_precedent_candidate_reference_eligible

    assert (
        is_precedent_candidate_reference_eligible(
            candidate_status="candidate",
            source_feedback_status="adopted",
            share_status="needs_review",
        )
        is False
    )
    assert (
        is_precedent_candidate_reference_eligible(
            candidate_status="candidate",
            source_feedback_status="adopted",
            share_status="provisional",
        )
        is True
    )
```

- [ ] **Step 2: Run targeted tests and confirm failure**

Run:

```bash
PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -k "shared_intelligence or reference_eligible" -q
```

Expected:

```text
FAIL because share_status fields and the share_status-aware eligibility signature do not exist yet
```

- [ ] **Step 3: Add enum, model fields, and schema fields**

```python
# backend/app/domain/enums.py
class PrecedentShareStatus(str, Enum):
    PROVISIONAL = "provisional"
    VALIDATED = "validated"
    NEEDS_REVIEW = "needs_review"
```

```python
# backend/app/domain/models.py
class PrecedentCandidate(Base):
    share_status: Mapped[str] = mapped_column(String(50), default="provisional")
    risk_flags: Mapped[list[str]] = mapped_column(JSON, default=list)
    risk_summary: Mapped[str] = mapped_column(Text, default="")
    positive_signal_count: Mapped[int] = mapped_column(Integer, default=0)
    negative_signal_count: Mapped[int] = mapped_column(Integer, default=0)
```

```python
# backend/app/core/database.py
"precedent_candidates": {
    "source_feedback_reason_codes": "JSON NOT NULL DEFAULT '[]'",
    "source_feedback_operator_label": "VARCHAR(120) NOT NULL DEFAULT ''",
    "created_by_label": "VARCHAR(120) NOT NULL DEFAULT ''",
    "last_status_changed_by_label": "VARCHAR(120) NOT NULL DEFAULT ''",
    "share_status": "VARCHAR(50) NOT NULL DEFAULT 'provisional'",
    "risk_flags": "JSON NOT NULL DEFAULT '[]'",
    "risk_summary": "TEXT NOT NULL DEFAULT ''",
    "positive_signal_count": "INTEGER NOT NULL DEFAULT 0",
    "negative_signal_count": "INTEGER NOT NULL DEFAULT 0",
}
```

```python
# backend/app/domain/schemas.py
class PrecedentCandidateRead(ORMModel):
    share_status: PrecedentShareStatus = PrecedentShareStatus.PROVISIONAL
    risk_flags: list[str] = Field(default_factory=list)
    risk_summary: str = ""
    positive_signal_count: int = 0
    negative_signal_count: int = 0
```

- [ ] **Step 4: Add deterministic risk-gate evaluator**

```python
# backend/app/services/shared_intelligence_risk_gates.py
from __future__ import annotations

from dataclasses import dataclass

from app.domain.enums import AdoptionFeedbackStatus, PrecedentShareStatus

HIGH_RISK_DOMAIN_LENSES = {"法務", "財務", "募資", "合規", "Legal", "Finance", "Fundraising"}
SENSITIVE_DETAIL_TERMS = {
    "客戶名稱",
    "個資",
    "報價",
    "價格",
    "合約第",
    "保密",
    "NDA",
    "身分證",
    "電話",
    "email",
}
LOW_CONFIDENCE_REASON_CODES = {"too_specific", "insufficient_evidence", "needs_more_context"}


@dataclass(frozen=True)
class ShareGateDecision:
    share_status: PrecedentShareStatus
    risk_flags: list[str]
    risk_summary: str
    positive_signal_count: int
    negative_signal_count: int


def evaluate_precedent_share_gate(
    *,
    feedback_status: AdoptionFeedbackStatus,
    reason_codes: list[str],
    note: str,
    domain_lenses: list[str],
    summary: str,
    reusable_reason: str,
) -> ShareGateDecision:
    risk_flags: list[str] = []
    positive_signal_count = 0
    negative_signal_count = 0

    combined_text = " ".join([note, summary, reusable_reason])
    if any(term in combined_text for term in SENSITIVE_DETAIL_TERMS):
        risk_flags.append("sensitive_detail")
    if set(domain_lenses).intersection(HIGH_RISK_DOMAIN_LENSES):
        risk_flags.append("high_risk_domain")
    if feedback_status == AdoptionFeedbackStatus.NEEDS_REVISION:
        risk_flags.append("needs_revision")
        negative_signal_count += 1
    if feedback_status == AdoptionFeedbackStatus.NOT_ADOPTED:
        risk_flags.append("not_adopted")
        negative_signal_count += 1
    if set(reason_codes).intersection(LOW_CONFIDENCE_REASON_CODES):
        risk_flags.append("low_reuse_confidence")
        negative_signal_count += 1
    if feedback_status in {
        AdoptionFeedbackStatus.ADOPTED,
        AdoptionFeedbackStatus.TEMPLATE_CANDIDATE,
    }:
        positive_signal_count += 1

    if risk_flags:
        return ShareGateDecision(
            share_status=PrecedentShareStatus.NEEDS_REVIEW,
            risk_flags=sorted(set(risk_flags)),
            risk_summary="這筆可重用內容含有敏感、特殊或高風險訊號，先不自動進入強參考。",
            positive_signal_count=positive_signal_count,
            negative_signal_count=negative_signal_count,
        )

    return ShareGateDecision(
        share_status=PrecedentShareStatus.PROVISIONAL,
        risk_flags=[],
        risk_summary="已自動進入共享判讀，但目前只作為弱訊號參考。",
        positive_signal_count=positive_signal_count,
        negative_signal_count=negative_signal_count,
    )
```

- [ ] **Step 5: Wire risk gates into precedent candidate sync**

```python
# backend/app/services/tasks.py
from app.services.shared_intelligence_risk_gates import evaluate_precedent_share_gate


gate = evaluate_precedent_share_gate(
    feedback_status=feedback_status,
    reason_codes=list(feedback.reason_codes or []),
    note=feedback.note or "",
    domain_lenses=list(seed["domain_lenses"]),
    summary=str(seed["summary"]),
    reusable_reason=str(seed["reusable_reason"]),
)
candidate.share_status = gate.share_status.value
candidate.risk_flags = gate.risk_flags
candidate.risk_summary = gate.risk_summary
candidate.positive_signal_count = gate.positive_signal_count
candidate.negative_signal_count = gate.negative_signal_count
```

Add the same fields in `_serialize_precedent_candidate`.

- [ ] **Step 6: Make Host reference eligibility share-status-aware**

```python
# backend/app/services/precedent_intelligence.py
def is_precedent_candidate_reference_eligible(
    *,
    candidate_status: str,
    source_feedback_status: str,
    share_status: str = "provisional",
) -> bool:
    if share_status == PrecedentShareStatus.NEEDS_REVIEW.value:
        return False
    if candidate_status == PrecedentCandidateStatus.DISMISSED.value:
        return False
    if candidate_status == PrecedentCandidateStatus.PROMOTED.value:
        return True
    return source_feedback_status in {
        AdoptionFeedbackStatus.ADOPTED.value,
        AdoptionFeedbackStatus.TEMPLATE_CANDIDATE.value,
    }
```

Update the call site in `select_precedent_reference_matches`:

```python
if not is_precedent_candidate_reference_eligible(
    candidate_status=candidate.candidate_status,
    source_feedback_status=candidate.source_feedback_status,
    share_status=getattr(candidate, "share_status", "provisional"),
):
    continue
```

- [ ] **Step 7: Run targeted shared-intelligence tests**

Run:

```bash
PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -k "shared_intelligence or reference_eligible or precedent" -q
```

Expected:

```text
All selected tests pass
```

- [ ] **Step 8: Commit shared-intelligence risk gates**

```bash
git add backend/app/services/shared_intelligence_risk_gates.py backend/app/domain/enums.py backend/app/domain/models.py backend/app/core/database.py backend/app/domain/schemas.py backend/app/services/tasks.py backend/app/services/precedent_intelligence.py backend/tests/test_mvp_slice.py
git commit -m "feat: add shared intelligence risk gates"
```

Do not stage `.gitignore`.

---

### Task 5: Change Provider Resolution To Personal Key First And Firm Fallback

**Files:**
- Modify: `backend/app/services/system_provider_settings.py`
- Modify: `backend/tests/test_mvp_slice.py`

- [ ] **Step 1: Replace the old consultant fail-closed test**

Remove the old expectation:

```python
def test_consultant_run_fails_closed_without_personal_provider_settings(...)
```

Add the new approved behavior:

```python
def test_consultant_run_uses_firm_default_when_no_personal_provider_settings(
    anonymous_client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    consultant_client = login_as_consultant_with_owner_invite(anonymous_client, monkeypatch)

    created = consultant_client.post("/api/v1/tasks", json=create_task_payload("Provider fallback"))
    assert created.status_code == 201

    run = consultant_client.post(f"/api/v1/tasks/{created.json()['id']}/run")

    assert run.status_code == 200
    assert run.json()["status"] in {"completed", "succeeded"}
```

- [ ] **Step 2: Add a regression test for explicit disallowed personal settings**

```python
def test_consultant_run_with_disallowed_personal_provider_still_fails_closed(
    anonymous_client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.core.config import settings
    from app.services.provider_secret_crypto import encrypt_provider_secret

    monkeypatch.setattr(settings, "provider_secret_encryption_key", "phase5-fernet-test-key")
    consultant_client = login_as_consultant_with_owner_invite(anonymous_client, monkeypatch)

    with SessionLocal() as db:
        user = db.scalar(select(models.User).where(models.User.email == "consultant@example.com"))
        assert user is not None
        db.add(
            models.PersonalProviderCredential(
                user_id=user.id,
                provider_id="openai",
                model_level="balanced",
                model_id="gpt-5.4-mini",
                custom_model_id=None,
                base_url="https://api.openai.com/v1",
                timeout_seconds=60,
                api_key_ciphertext=encrypt_provider_secret("sk-personal-123"),
                api_key_masked="••••-123",
                last_validation_status="success",
                last_validation_message="validated",
            )
        )
        db.commit()

    created = consultant_client.post("/api/v1/tasks", json=create_task_payload("Provider fail closed"))
    assert created.status_code == 201

    run = consultant_client.post(f"/api/v1/tasks/{created.json()['id']}/run")

    assert run.status_code == 403
    assert "firm 尚未允許" in run.json()["detail"]
```

- [ ] **Step 3: Run targeted tests and confirm failure**

Run:

```bash
PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -k "provider_fallback or disallowed_personal_provider or consultant_run_uses_firm_default" -q
```

Expected:

```text
FAIL because consultants without personal settings still fail closed
```

- [ ] **Step 4: Change consultant provider resolution**

```python
# backend/app/services/system_provider_settings.py
def resolve_effective_provider_config_for_member(
    db: Session,
    *,
    user_id: str,
    role: str,
    firm_id: str,
) -> ResolvedProviderConfig:
    if role == "demo":
        raise ModelProviderAccessError("示範帳號不可執行分析。")

    credential = db.scalar(
        select(models.PersonalProviderCredential).where(
            models.PersonalProviderCredential.user_id == user_id
        )
    )

    if role == "consultant":
        if credential is not None and credential.api_key_ciphertext:
            allowlist = get_allowlist_entry(
                db,
                firm_id=firm_id,
                provider_id=credential.provider_id,
                model_level=credential.model_level,
            )
            if allowlist is None or allowlist.status != "active":
                raise ModelProviderAccessError("目前 firm 尚未允許這組 provider / model。")
            actual_model_id = credential.custom_model_id or credential.model_id
            if credential.custom_model_id and not allowlist.allow_custom_model:
                raise ModelProviderAccessError("目前 firm 尚未允許這個模型。")
            if allowlist.allowed_model_ids and actual_model_id not in allowlist.allowed_model_ids:
                raise ModelProviderAccessError("目前 firm 尚未允許這個模型。")
            return _build_resolved_config_from_personal_credential(credential)

        return resolve_effective_provider_config(db)

    if credential is not None and credential.api_key_ciphertext:
        return _build_resolved_config_from_personal_credential(credential)

    return resolve_effective_provider_config(db)
```

- [ ] **Step 5: Run provider tests**

Run:

```bash
PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -k "provider" -q
```

Expected:

```text
All selected provider tests pass
```

- [ ] **Step 6: Commit provider fallback**

```bash
git add backend/app/services/system_provider_settings.py backend/tests/test_mvp_slice.py
git commit -m "feat: allow consultant firm provider fallback"
```

Do not stage `.gitignore`.

---

### Task 6: Update Frontend Types And Low-Noise Copy

**Files:**
- Modify: `frontend/src/lib/types.ts`
- Modify: `frontend/src/lib/precedent-candidates.ts`
- Modify: `frontend/src/lib/provider-settings.ts`
- Modify: `frontend/src/components/settings-page-panel.tsx`
- Modify: `frontend/src/components/matter-workspace-panel.tsx`
- Modify: `frontend/src/components/workbench-home.tsx`
- Modify: `frontend/tests/product-language.test.mjs`
- Modify: `frontend/tests/consultant-usability.test.mjs`
- Modify: `frontend/tests/provider-settings-foundation.test.mjs`

- [ ] **Step 1: Add frontend tests for the new visible language**

```javascript
test("precedent candidate view explains shared intelligence status without internal jargon", () => {
  const view = buildPrecedentCandidateView({
    candidate_type: "deliverable_pattern",
    candidate_status: "candidate",
    share_status: "needs_review",
    risk_flags: ["sensitive_detail"],
    risk_summary: "這筆可重用內容含有敏感、特殊或高風險訊號，先不自動進入強參考。",
    summary: "可重用交付骨架",
    reusable_reason: "適合一般營運診斷。",
    source_feedback_operator_label: "Consultant A",
    created_by_label: "Consultant A",
    last_status_changed_by_label: "",
  });

  assert.equal(view.shareStatusLabel, "需檢查");
  assert.match(view.shareStatusSummary, /先不自動進入強參考/);
  assert.doesNotMatch(view.shareStatusSummary, /candidate_status|share_status|surveillance/);
});
```

```javascript
test("provider settings copy explains personal key priority and firm fallback", () => {
  assert.equal(
    buildProviderFallbackExplanation("consultant"),
    "你可以使用自己的模型金鑰；沒有設定時，系統會使用事務所預設模型。",
  );
  assert.equal(
    buildProviderFallbackExplanation("owner"),
    "事務所預設模型會作為沒有個人金鑰時的備援。",
  );
});
```

- [ ] **Step 2: Run frontend tests and confirm failure**

Run:

```bash
source ~/.nvm/nvm.sh && cd frontend && node --test tests/product-language.test.mjs tests/provider-settings-foundation.test.mjs tests/consultant-usability.test.mjs
```

Expected:

```text
FAIL because shareStatusLabel/shareStatusSummary and buildProviderFallbackExplanation are not implemented
```

- [ ] **Step 3: Update frontend types**

```typescript
// frontend/src/lib/types.ts
export type PrecedentShareStatus = "provisional" | "validated" | "needs_review";

export interface PrecedentCandidate {
  id: string;
  candidate_type: PrecedentCandidateType;
  candidate_status: PrecedentCandidateStatus;
  share_status: PrecedentShareStatus;
  risk_flags: string[];
  risk_summary: string;
  positive_signal_count: number;
  negative_signal_count: number;
  source_feedback_status: AdoptionFeedbackStatus;
}
```

- [ ] **Step 4: Add low-noise shared-intelligence labels**

```typescript
// frontend/src/lib/precedent-candidates.ts
function labelForShareStatus(shareStatus: PrecedentCandidate["share_status"]) {
  if (shareStatus === "validated") {
    return "已驗證";
  }
  if (shareStatus === "needs_review") {
    return "需檢查";
  }
  return "暫時可用";
}

function summarizeShareStatus(candidate: Pick<PrecedentCandidate, "share_status" | "risk_summary">) {
  if (candidate.risk_summary) {
    return candidate.risk_summary;
  }
  if (candidate.share_status === "validated") {
    return "這個模式已被多次正向使用，可以作為較強參考。";
  }
  if (candidate.share_status === "needs_review") {
    return "這筆內容先留在治理視圖，不會直接成為強參考。";
  }
  return "這筆內容已進入共享判讀，但目前只作為弱訊號參考。";
}
```

Add these fields to `buildPrecedentCandidateView` return:

```typescript
shareStatusLabel: labelForShareStatus(candidate.share_status ?? "provisional"),
shareStatusSummary: summarizeShareStatus({
  share_status: candidate.share_status ?? "provisional",
  risk_summary: candidate.risk_summary ?? "",
}),
```

- [ ] **Step 5: Add provider fallback explanation helper**

```typescript
// frontend/src/lib/provider-settings.ts
export function buildProviderFallbackExplanation(role: MembershipRole) {
  if (role === "consultant") {
    return "你可以使用自己的模型金鑰；沒有設定時，系統會使用事務所預設模型。";
  }
  if (role === "owner") {
    return "事務所預設模型會作為沒有個人金鑰時的備援。";
  }
  return "示範帳號不能執行正式分析。";
}
```

Use this helper in `settings-page-panel.tsx` near the personal provider settings intro.

- [ ] **Step 6: Keep owner governance wording away from surveillance**

Add assertions to `frontend/tests/product-language.test.mjs`:

```javascript
test("owner governance copy does not introduce surveillance wording", () => {
  const workbenchHomeSource = readFileSync(
    new URL("../src/components/workbench-home.tsx", import.meta.url),
    "utf8",
  );
  const matterWorkspaceSource = readFileSync(
    new URL("../src/components/matter-workspace-panel.tsx", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(workbenchHomeSource, /顧問排名|績效排名|監控後台|產能監控/);
  assert.doesNotMatch(matterWorkspaceSource, /顧問排名|績效排名|監控後台|產能監控/);
});
```

- [ ] **Step 7: Run frontend tests**

Run:

```bash
source ~/.nvm/nvm.sh && cd frontend && node --test tests/product-language.test.mjs tests/provider-settings-foundation.test.mjs tests/consultant-usability.test.mjs
```

Expected:

```text
All selected frontend tests pass
```

- [ ] **Step 8: Commit frontend copy and type updates**

```bash
git add frontend/src/lib/types.ts frontend/src/lib/precedent-candidates.ts frontend/src/lib/provider-settings.ts frontend/src/components/settings-page-panel.tsx frontend/src/components/matter-workspace-panel.tsx frontend/src/components/workbench-home.tsx frontend/tests/product-language.test.mjs frontend/tests/consultant-usability.test.mjs frontend/tests/provider-settings-foundation.test.mjs
git commit -m "feat: clarify private beta shared intelligence copy"
```

Do not stage `.gitignore`.

---

### Task 7: Sync Active Docs After Behavior Is Implemented

**Files:**
- Modify: `docs/00_product_definition_and_current_state.md`
- Modify: `docs/06_product_alignment_and_85_point_roadmap.md`
- Modify: `docs/01_runtime_architecture_and_data_contracts.md`
- Modify: `docs/02_host_agents_packs_and_extension_system.md`
- Modify: `docs/03_workbench_ux_and_page_spec.md`
- Modify: `docs/04_qa_matrix.md`

- [ ] **Step 1: Update product/current-state docs**

In `docs/00_product_definition_and_current_state.md`, add a current-state note under the commercial posture section:

```markdown
### 2.2 Single-Firm Private Beta Readiness

Infinite Pro 的下一個正式成熟度目標是 `Single Firm Private Beta`：

- 單一 firm 內 3 到 5 位顧問各自辦案
- raw matter / task / material / deliverable 預設只讓建立者與 owner 可讀
- shared intelligence 只共享抽象後的判斷模式、模板、風險提醒與可重用經驗
- owner 負責治理品質、provider、安全與 shared intelligence，不做顧問排名或監控後台
```

In `docs/06_product_alignment_and_85_point_roadmap.md`, add a new decision-phase note after the current second tranche section:

```markdown
## 12. Multi-Consultant Ontology Intelligence Readiness

本階段不是 public multi-tenant SaaS，而是把 Infinite Pro 推到單一 firm private beta：

- 3 到 5 位受信任顧問可各自辦案
- 每位顧問的 raw case data 預設隔離
- shared intelligence 以 auto-share + risk gates 的方式累積
- Host 只引用 prompt-safe reusable guidance，不回灌其他顧問 raw case content
- provider 採個人 key 優先、事務所預設備援，不做計費系統
```

- [ ] **Step 2: Update runtime docs**

In `docs/01_runtime_architecture_and_data_contracts.md`, add a section under persistence/history contracts:

```markdown
### Consultant Ownership Boundary

`Task` and `MatterWorkspace` now carry:

- `firm_id`
- `created_by_user_id`

Formal read rule:

- owner can read the firm's case records and legacy unowned records
- consultant can read only records created by that consultant within the firm
- demo cannot read firm workspace records
- blocked raw case reads return `404` to avoid leaking existence
```

Add shared-intelligence status contract:

```markdown
### Shared Intelligence Share Status

`PrecedentCandidate` now carries:

- `share_status`: `provisional`, `validated`, or `needs_review`
- `risk_flags`
- `risk_summary`
- `positive_signal_count`
- `negative_signal_count`

Host may reference `provisional` as weak guidance and `validated` as stronger reusable guidance. Host must not reference `needs_review` as reusable guidance until it is cleared or promoted through governance.
```

- [ ] **Step 3: Update Host and UX docs**

In `docs/02_host_agents_packs_and_extension_system.md`, add:

```markdown
Host-safe precedent usage now also respects `share_status`:

- `needs_review` is excluded from Host reference
- `provisional` can only be used as weak guidance
- `validated` can be used as stronger guidance
- no raw case content from another consultant may enter model context
```

In `docs/03_workbench_ux_and_page_spec.md`, add visible-language rules:

```markdown
Private beta visible language:

- use `共享判讀` for first-layer shared intelligence copy
- use `暫時可用`, `已驗證`, `需檢查` for visible share-status labels
- explain provider fallback as `你可以使用自己的模型金鑰；沒有設定時，系統會使用事務所預設模型`
- do not introduce `顧問排名`, `績效排名`, `監控後台`, or `產能監控`
```

- [ ] **Step 4: Update QA matrix only with real evidence**

After the verification commands in Task 8 pass, append one entry to `docs/04_qa_matrix.md`:

```markdown
## Entry: 2026-05-01 Multi-consultant ontology intelligence readiness

### Scope

- enforce consultant raw case privacy
- add shared-intelligence auto-share risk gates
- change provider resolution to personal key first and firm default fallback
- update low-noise visible language for private beta readiness

### Commands

| Command | Result |
| --- | --- |
| `python3 -m compileall backend/app` | Passed |
| `PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -q` | Passed |
| `source ~/.nvm/nvm.sh && cd frontend && node --test tests/product-language.test.mjs tests/provider-settings-foundation.test.mjs tests/consultant-usability.test.mjs` | Passed |
| `source ~/.nvm/nvm.sh && cd frontend && npm run build` | Passed |
| `source ~/.nvm/nvm.sh && cd frontend && npm run typecheck` | Passed |

### Evidence

| Layer | Surface | Verification | Result |
| --- | --- | --- | --- |
| Backend | task/matter access | consultant B cannot list/read/run consultant A raw case | Verified |
| Backend | shared intelligence | sensitive feedback becomes `needs_review`; low-risk adopted feedback becomes `provisional` | Verified |
| Backend | provider resolution | consultant with no personal key can use firm default; disallowed personal provider remains fail-closed | Verified |
| Frontend | visible language | share-status and provider fallback labels use consultant-readable Traditional Chinese | Verified |

### Not Verified

- authenticated browser smoke has not run yet
- production deployment has not run yet
```

Replace the `Not Verified` section after browser or deploy checks actually run.

- [ ] **Step 5: Commit active docs sync**

```bash
git add docs/00_product_definition_and_current_state.md docs/06_product_alignment_and_85_point_roadmap.md docs/01_runtime_architecture_and_data_contracts.md docs/02_host_agents_packs_and_extension_system.md docs/03_workbench_ux_and_page_spec.md docs/04_qa_matrix.md
git commit -m "docs: align multi-consultant readiness behavior"
```

Do not stage `.gitignore`.

---

### Task 8: Full Verification, Review, And Ship Readiness

**Files:**
- Modify: none expected except fixes required by failing verification

- [ ] **Step 1: Run backend compile**

Run:

```bash
python3 -m compileall backend/app
```

Expected:

```text
Compile completes without SyntaxError
```

- [ ] **Step 2: Run backend regression tests**

Run:

```bash
PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -q
```

Expected:

```text
All tests pass
```

- [ ] **Step 3: Run shared-intelligence scoring regression tests**

Run:

```bash
PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_phase_six_feedback_scoring.py -q
```

Expected:

```text
All tests pass
```

- [ ] **Step 4: Run frontend helper tests**

Run:

```bash
source ~/.nvm/nvm.sh && cd frontend && node --test tests/product-language.test.mjs tests/provider-settings-foundation.test.mjs tests/consultant-usability.test.mjs tests/task-detail-usability.test.mjs tests/low-noise-workbench-repass.test.mjs
```

Expected:

```text
All selected frontend tests pass
```

- [ ] **Step 5: Run frontend build before typecheck**

Run:

```bash
source ~/.nvm/nvm.sh && cd frontend && npm run build
```

Expected:

```text
Build succeeds and route sizes are reported
```

- [ ] **Step 6: Run frontend typecheck after build**

Run:

```bash
source ~/.nvm/nvm.sh && cd frontend && npm run typecheck
```

Expected:

```text
Typecheck succeeds
```

- [ ] **Step 7: Run authenticated browser QA**

Use the existing local authenticated QA path. Verify:

- owner can see overview, matters, settings, shared-intelligence governance posture
- consultant A can create a task and see it in tasks/matters
- consultant B cannot see consultant A task or matter
- consultant without personal key can run with firm default
- demo still cannot run firm analysis
- provider and shared-intelligence labels remain readable Traditional Chinese

Record exact browser target, auth method, and results in `docs/04_qa_matrix.md`.

- [ ] **Step 8: Run diff hygiene**

Run:

```bash
git diff --check
git status --short --branch
git rev-list --left-right --count HEAD...origin/main
```

Expected:

```text
git diff --check returns no output
branch divergence is explicitly reported
only intended files are staged or committed; .gitignore remains untouched unless 老田 separately approves
```

- [ ] **Step 9: Run code review before landing**

Review focus:

- raw case data leakage across consultants
- Host boundary and provider abstraction are preserved
- shared-intelligence `needs_review` cannot enter Host reference context
- visible UI does not become a surveillance dashboard
- active docs describe only verified behavior

- [ ] **Step 10: Push only after verification and review**

Run:

```bash
git status --short --branch
git push origin HEAD
```

Expected:

```text
remote branch receives the verified commits
local/remote sync status is reported to 老田
```

---

## Self-Review

- Spec coverage: this plan covers the approved first implementation scope: multi-consultant permissions and case isolation, shared-intelligence auto-share and risk gates, and provider personal-key-first with firm fallback.
- Architecture guard: the plan does not add a seventh layer, bypass Host, bypass provider abstraction, or turn the product into public SaaS.
- UX guard: owner governance stays separate from surveillance; visible labels stay low-noise and Traditional Chinese.
- Data guard: raw case privacy is enforced through backend tests and route/service gates, not only frontend hiding.
- QA guard: `docs/04_qa_matrix.md` is updated only after real verification.
- Git guard: implementation tasks repeatedly state that `.gitignore` must not be staged with product work.

## Execution Options

Plan complete and saved to `docs/superpowers/plans/2026-05-01-multi-consultant-ontology-intelligence-readiness.md`.

1. `Subagent-Driven` recommended: dispatch a fresh worker per backend privacy, shared-intelligence, provider, frontend copy, and docs/QA slice; review between slices.
2. `Inline Execution`: execute tasks in this session using `superpowers:executing-plans`, with checkpoints after each task.
