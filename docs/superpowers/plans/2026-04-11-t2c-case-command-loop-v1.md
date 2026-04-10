# T2-C Case Command Loop V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `T2-C case command loop v1` 落成第一版可 shipped 的案件指揮鏈：讓 matter 更像案件指揮面、讓 task 與 deliverable 之間出現正式 `decision brief` 主鏈、並把 writeback 收成更自然的 approval loop。

**Architecture:** 先由 backend 產出正式的 command-loop read model，避免 UI 自己發明 workflow judgment；frontend 再用小型 view helper 把 `matter command / decision brief / writeback approval` 接到既有 matter、task、deliverable surface。整體沿用既有 workbench 頁面，不新增 dashboard family，不改六層架構，不讓 UI 取代 Host。

**Tech Stack:** FastAPI, Python, Pydantic schemas, Next.js App Router, TypeScript, node:test, pytest, active docs under `docs/`

---

## File Structure

- Create: `/Users/oldtien_base/Desktop/Infinite Pro/backend/app/services/case_command_loop.py`
  - Own the backend read-model builders for `matter_command`, `decision_brief`, and `writeback_approval`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/app/domain/schemas.py`
  - Add formal response models for the new command-loop contracts
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/app/services/tasks.py`
  - Call the new helper while building `MatterWorkspaceResponse` and `TaskAggregateResponse`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/tests/test_mvp_slice.py`
  - Add the RED/GREEN regression coverage for the command-loop contract
- Create: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/lib/case-command-loop.ts`
  - Translate backend contracts into low-noise matter/task/deliverable UI view models
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/lib/types.ts`
  - Mirror the backend command-loop contract in frontend types
- Create: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/tests/case-command-loop.test.mjs`
  - Node-test the new frontend view helper
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/components/matter-workspace-panel.tsx`
  - Render the new `matter command` readout inside the existing matter mainline/guide structure
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/components/task-detail-panel.tsx`
  - Render the new `decision brief` posture inside the existing task detail surface
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/components/deliverable-workspace-panel.tsx`
  - Render the new `decision brief` and `writeback approval` readout inside existing deliverable context / writeback sections
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/01_runtime_architecture_and_data_contracts.md`
  - Document the new backend read-model contract
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/03_workbench_ux_and_page_spec.md`
  - Document the new matter/task/deliverable command-loop reading order
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/04_qa_matrix.md`
  - Append real verification evidence after implementation passes
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/06_product_alignment_and_85_point_roadmap.md`
  - Mark `T2-C case command loop v1` as the active next deepen line and later record shipped progress

---

### Task 1: Add Backend Command-Loop Contracts

**Files:**
- Create: `/Users/oldtien_base/Desktop/Infinite Pro/backend/app/services/case_command_loop.py`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/app/domain/schemas.py`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/app/services/tasks.py`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/tests/test_mvp_slice.py`

- [ ] **Step 1: Write the failing backend regression first**

Add this test to `backend/tests/test_mvp_slice.py` near the existing matter/task continuity and writeback coverage:

```python
def test_case_command_loop_contract_surfaces_matter_command_decision_brief_and_writeback(
    client: TestClient,
) -> None:
    payload = create_task_payload("Case command loop baseline")
    payload.update(
        {
            "engagement_continuity_mode": "continuous",
            "writeback_depth": "full",
            "client_name": "Atlas Advisory",
            "client_type": "中小企業",
            "client_stage": "制度化階段",
            "engagement_name": "Atlas Growth Ops",
            "workstream_name": "營運與銷售收斂",
            "decision_title": "Atlas command loop decision",
            "judgment_to_make": "先判斷這輪應先補證據、先收斂正式建議，還是直接回交付物改版。",
            "domain_lenses": ["營運", "銷售", "綜合策略"],
        }
    )
    task = client.post("/api/v1/tasks", json=payload).json()
    matter_id = task["matter_workspace"]["id"]

    upload_response = client.post(
        f"/api/v1/tasks/{task['id']}/uploads",
        files=[
            (
                "files",
                (
                    "command-loop.txt",
                    b"Need one command surface, one decision brief posture, and one writeback approval loop.",
                    "text/plain",
                ),
            )
        ],
    )
    assert upload_response.status_code == 200

    run_response = client.post(f"/api/v1/tasks/{task['id']}/run")
    assert run_response.status_code == 200

    matter_workspace = client.get(f"/api/v1/matters/{matter_id}").json()
    task_aggregate = client.get(f"/api/v1/tasks/{task['id']}").json()

    assert matter_workspace["matter_command"]["command_posture"] in {
        "push_task",
        "fill_evidence",
        "review_deliverable",
    }
    assert matter_workspace["matter_command"]["focus_summary"]
    assert matter_workspace["matter_command"]["primary_task_id"] == task["id"]
    assert matter_workspace["matter_command"]["primary_task_title"]

    assert task_aggregate["decision_brief"]["posture"] in {
        "draft",
        "decision_ready",
        "publish_ready",
    }
    assert task_aggregate["decision_brief"]["question_summary"]
    assert task_aggregate["decision_brief"]["recommendation_summary"]
    assert task_aggregate["decision_brief"]["next_action_summary"]

    assert task_aggregate["writeback_approval"]["summary"]
    assert task_aggregate["writeback_approval"]["primary_action_label"]
    assert task_aggregate["writeback_approval"]["candidate_summary"]
```

- [ ] **Step 2: Run the targeted backend test to verify RED**

Run:

```bash
PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_mvp_slice.py -q -k case_command_loop_contract_surfaces
```

Expected:

- FAIL with missing `matter_command`, `decision_brief`, or `writeback_approval` keys in the JSON responses

- [ ] **Step 3: Add the backend schema contracts**

Add these new read models to `backend/app/domain/schemas.py`:

```python
class MatterCommandRead(BaseModel):
    command_posture: Literal["push_task", "fill_evidence", "review_deliverable"] = "push_task"
    command_posture_label: str = ""
    focus_summary: str = ""
    primary_task_id: str | None = None
    primary_task_title: str = ""
    primary_task_reason: str = ""
    blocker_summary: str = ""
    deliverable_direction_summary: str = ""
    next_step_summary: str = ""


class DecisionBriefRead(BaseModel):
    posture: Literal["draft", "decision_ready", "publish_ready"] = "draft"
    posture_label: str = ""
    question_summary: str = ""
    options_summary: str = ""
    risk_summary: str = ""
    recommendation_summary: str = ""
    next_action_summary: str = ""
    boundary_note: str = ""


class WritebackApprovalRead(BaseModel):
    posture: Literal["minimal", "candidate_review", "formal_approval", "completed"] = "minimal"
    posture_label: str = ""
    summary: str = ""
    primary_action_label: str = ""
    primary_action_summary: str = ""
    candidate_summary: str = ""
    boundary_note: str = ""
```

Then add:

```python
    matter_command: MatterCommandRead = Field(default_factory=MatterCommandRead)
```

to `MatterWorkspaceResponse`, and:

```python
    decision_brief: DecisionBriefRead = Field(default_factory=DecisionBriefRead)
    writeback_approval: WritebackApprovalRead = Field(default_factory=WritebackApprovalRead)
```

to `TaskAggregateResponse`.

- [ ] **Step 4: Create one backend helper module and wire it into the aggregate builders**

Create `backend/app/services/case_command_loop.py` with three pure helper builders:

```python
from dataclasses import dataclass


@dataclass(slots=True)
class MatterCommandModel:
    command_posture: str
    command_posture_label: str
    focus_summary: str
    primary_task_id: str | None
    primary_task_title: str
    primary_task_reason: str
    blocker_summary: str
    deliverable_direction_summary: str
    next_step_summary: str


@dataclass(slots=True)
class DecisionBriefModel:
    posture: str
    posture_label: str
    question_summary: str
    options_summary: str
    risk_summary: str
    recommendation_summary: str
    next_action_summary: str
    boundary_note: str


@dataclass(slots=True)
class WritebackApprovalModel:
    posture: str
    posture_label: str
    summary: str
    primary_action_label: str
    primary_action_summary: str
    candidate_summary: str
    boundary_note: str
```

Implement the smallest honest logic:

```python
def build_matter_command(*, summary, related_tasks, related_deliverables, evidence_gap_records) -> MatterCommandModel:
    primary_task = related_tasks[0] if related_tasks else None
    has_open_gaps = any(item.status != "resolved" for item in evidence_gap_records)
    has_deliverable = bool(related_deliverables)

    if has_open_gaps:
        posture = "fill_evidence"
        label = "先補依據"
        blocker_summary = "目前高影響缺口仍在，應先補來源、證據或脈絡。"
    elif has_deliverable:
        posture = "review_deliverable"
        label = "先回交付物"
        blocker_summary = "正式結果已形成，現在應先確認結果站不站得住。"
    else:
        posture = "push_task"
        label = "先推工作紀錄"
        blocker_summary = "目前沒有結果層阻塞，應先把主工作往前推。"

    return MatterCommandModel(
        command_posture=posture,
        command_posture_label=label,
        focus_summary=summary.active_work_summary or summary.workspace_summary,
        primary_task_id=primary_task.id if primary_task else None,
        primary_task_title=primary_task.title if primary_task else "目前沒有可直接推進的工作紀錄",
        primary_task_reason=primary_task.decision_context_title or "先沿著這輪主決策往前推。",
        blocker_summary=blocker_summary,
        deliverable_direction_summary=(
            f"下一個正式結果應收斂到「{related_deliverables[0].title}」。"
            if has_deliverable
            else "目前應先把 task 收成第一版正式結果，再決定交付物版本。"
        ),
        next_step_summary=label,
    )
```

Then add similarly conservative builders:

```python
def build_decision_brief(*, task, linked_risks, linked_recommendations, linked_action_items, latest_deliverable) -> DecisionBriefModel
def build_writeback_approval(*, decision_records, action_plans, outcome_records, precedent_candidate_summary) -> WritebackApprovalModel
```

Finally wire them into:

```python
get_matter_workspace(...)
get_task_aggregate(...)
```

inside `backend/app/services/tasks.py`, converting the dataclass output into the new schema models.

- [ ] **Step 5: Re-run the targeted backend test to verify GREEN**

Run:

```bash
PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_mvp_slice.py -q -k case_command_loop_contract_surfaces
```

Expected:

- PASS

- [ ] **Step 6: Commit the backend contract slice**

```bash
git add backend/app/services/case_command_loop.py \
  backend/app/domain/schemas.py \
  backend/app/services/tasks.py \
  backend/tests/test_mvp_slice.py
git commit -m "feat: add case command loop backend contract"
```

Expected:

- commit succeeds with backend contract + regression coverage

---

### Task 2: Add Frontend Command-Loop Types And View Helpers

**Files:**
- Create: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/lib/case-command-loop.ts`
- Create: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/tests/case-command-loop.test.mjs`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/lib/types.ts`

- [ ] **Step 1: Write the failing frontend helper tests first**

Create `frontend/tests/case-command-loop.test.mjs` with these tests:

```javascript
import test from "node:test";
import assert from "node:assert/strict";

import {
  buildMatterCommandView,
  buildDecisionBriefView,
  buildWritebackApprovalView,
} from "../src/lib/case-command-loop.ts";

test("matter command view promotes one primary task and one blocker", () => {
  const view = buildMatterCommandView({
    command_posture: "fill_evidence",
    command_posture_label: "先補依據",
    focus_summary: "這案目前卡在證據厚度不夠，還不適合直接發布結論。",
    primary_task_id: "task-1",
    primary_task_title: "補齊營運與銷售證據",
    primary_task_reason: "先把這輪主決策的依據補齊。",
    blocker_summary: "目前高影響缺口仍在，應先補來源、證據或脈絡。",
    deliverable_direction_summary: "目前不要急著收成正式交付物。",
    next_step_summary: "先回來源與證據，再決定要不要重跑。",
  });

  assert.equal(view.primaryHref, "/tasks/task-1");
  assert.match(view.primaryTitle, /補齊營運與銷售證據/);
  assert.match(view.blockerCopy, /高影響缺口/);
});

test("decision brief view separates recommendation from publish posture", () => {
  const view = buildDecisionBriefView({
    posture: "decision_ready",
    posture_label: "可收成正式判斷",
    question_summary: "先判斷這輪應優先修營運瓶頸還是改銷售節奏。",
    options_summary: "主 option 是先修營運，再以銷售調整跟進。",
    risk_summary: "若先動銷售而不補營運，容易放大交付壓力。",
    recommendation_summary: "先用兩週修營運瓶頸，再進第二輪銷售調整。",
    next_action_summary: "把這輪判斷收成正式交付摘要。",
    boundary_note: "這仍是第一版正式判斷，不是最終 published version。",
  });

  assert.equal(view.railEyebrow, "Decision Brief");
  assert.match(view.summary, /先用兩週修營運瓶頸/);
  assert.match(view.boundaryNote, /第一版正式判斷/);
});

test("writeback approval view keeps candidate review separate from formal approval", () => {
  const view = buildWritebackApprovalView({
    posture: "formal_approval",
    posture_label: "待正式核可",
    summary: "writeback 已形成，但仍有正式核可待處理。",
    primary_action_label: "先確認正式核可",
    primary_action_summary: "先處理 pending approval，再決定哪些東西值得升成 shared intelligence。",
    candidate_summary: "目前有 2 筆 precedent candidates，1 筆適合往 template 方向看。",
    boundary_note: "不是每次案件結果都應該被泛化成共用資產。",
  });

  assert.match(view.primaryTitle, /先確認正式核可/);
  assert.match(view.candidateCopy, /precedent candidates/);
  assert.match(view.boundaryNote, /不是每次案件結果都應該被泛化/);
});
```

- [ ] **Step 2: Run the helper suite to verify RED**

Run:

```bash
source ~/.nvm/nvm.sh && cd frontend && node --test tests/case-command-loop.test.mjs
```

Expected:

- FAIL because `case-command-loop.ts` does not exist yet

- [ ] **Step 3: Mirror the backend contract in frontend types**

Add these interfaces to `frontend/src/lib/types.ts`:

```ts
export interface MatterCommand {
  command_posture: "push_task" | "fill_evidence" | "review_deliverable";
  command_posture_label: string;
  focus_summary: string;
  primary_task_id: string | null;
  primary_task_title: string;
  primary_task_reason: string;
  blocker_summary: string;
  deliverable_direction_summary: string;
  next_step_summary: string;
}

export interface DecisionBrief {
  posture: "draft" | "decision_ready" | "publish_ready";
  posture_label: string;
  question_summary: string;
  options_summary: string;
  risk_summary: string;
  recommendation_summary: string;
  next_action_summary: string;
  boundary_note: string;
}

export interface WritebackApproval {
  posture: "minimal" | "candidate_review" | "formal_approval" | "completed";
  posture_label: string;
  summary: string;
  primary_action_label: string;
  primary_action_summary: string;
  candidate_summary: string;
  boundary_note: string;
}
```

Then wire them into:

```ts
export interface MatterWorkspace { matter_command: MatterCommand; ... }
export interface TaskAggregate { decision_brief: DecisionBrief; writeback_approval: WritebackApproval; ... }
```

- [ ] **Step 4: Create a dedicated frontend view-helper file**

Create `frontend/src/lib/case-command-loop.ts` with three small pure builders:

```ts
export function buildMatterCommandView(input: MatterCommand) {
  return {
    eyebrow: "案件指揮",
    primaryHref: input.primary_task_id ? `/tasks/${input.primary_task_id}` : "/matters",
    primaryTitle: input.primary_task_title,
    primaryCopy: input.primary_task_reason,
    blockerTitle: input.command_posture_label,
    blockerCopy: input.blocker_summary,
    deliverableCopy: input.deliverable_direction_summary,
    nextStepCopy: input.next_step_summary,
  };
}

export function buildDecisionBriefView(input: DecisionBrief) {
  return {
    railEyebrow: "Decision Brief",
    railTitle: input.posture_label,
    summary: input.recommendation_summary || input.question_summary,
    checklist: [
      input.question_summary,
      input.options_summary,
      input.risk_summary,
      input.next_action_summary,
    ].filter(Boolean),
    boundaryNote: input.boundary_note,
  };
}

export function buildWritebackApprovalView(input: WritebackApproval) {
  return {
    primaryTitle: input.primary_action_label,
    primaryCopy: input.primary_action_summary,
    statusLabel: input.posture_label,
    summary: input.summary,
    candidateCopy: input.candidate_summary,
    boundaryNote: input.boundary_note,
  };
}
```

- [ ] **Step 5: Re-run the helper suite to verify GREEN**

Run:

```bash
source ~/.nvm/nvm.sh && cd frontend && node --test tests/case-command-loop.test.mjs
```

Expected:

- PASS

- [ ] **Step 6: Commit the frontend helper slice**

```bash
git add frontend/src/lib/case-command-loop.ts \
  frontend/src/lib/types.ts \
  frontend/tests/case-command-loop.test.mjs
git commit -m "feat: add case command loop frontend helpers"
```

Expected:

- commit succeeds with the mirrored contract and node-testable helper logic

---

### Task 3: Turn The Matter Page Into A Clearer Command Surface

**Files:**
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/components/matter-workspace-panel.tsx`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/lib/consultant-usability.ts`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/tests/consultant-usability.test.mjs`

- [ ] **Step 1: Add the failing matter-usability test first**

Add this test to `frontend/tests/consultant-usability.test.mjs`:

```javascript
test("matter usability view keeps the first guide item focused on command, not structure", () => {
  const view = buildMatterUsabilityView({
    evidenceCount: 1,
    deliverableCount: 1,
    activeTaskCount: 2,
    hasCaseWorldState: true,
    hasOpenEvidenceGaps: true,
    hasRecentDeliverable: true,
  });

  assert.equal(view.guideItems[0]?.href, "#matter-mainline");
  assert.match(view.guideItems[0]?.title, /案件主線/);
  assert.match(view.guideItems[2]?.copy, /交付物|來源與證據/);
});
```

- [ ] **Step 2: Run the frontend tests to verify RED**

Run:

```bash
source ~/.nvm/nvm.sh && cd frontend && node --test tests/consultant-usability.test.mjs tests/case-command-loop.test.mjs
```

Expected:

- FAIL because the matter surface is not yet using the new command-loop view consistently

- [ ] **Step 3: Wire `matter_command` into the existing matter surface**

In `frontend/src/components/matter-workspace-panel.tsx`, import the new helper:

```ts
import { buildMatterCommandView } from "@/lib/case-command-loop";
```

Build it once:

```ts
  const matterCommandView = matter ? buildMatterCommandView(matter.matter_command) : null;
```

Then use it in three existing places instead of creating a new dashboard:

```tsx
<p className="hero-focus-copy">
  {matterCommandView ? matterCommandView.primaryCopy : matterAdvanceGuide.summary}
</p>
```

```tsx
<WorkspaceSectionGuide
  title={matterUsabilityView.sectionGuideTitle}
  description={matterUsabilityView.sectionGuideDescription}
  items={[
    {
      href: "#matter-mainline",
      eyebrow: "先抓案件指揮",
      title: matterCommandView ? matterCommandView.primaryTitle : "先看案件主線與下一步",
      copy: matterCommandView ? matterCommandView.blockerCopy : matterUsabilityView.guideItems[0]?.copy ?? "",
      meta: matterCommandView?.nextStepCopy,
      tone: "accent",
    },
    ...matterUsabilityView.guideItems.slice(1),
  ]}
/>
```

```tsx
<div className="section-card" id="matter-command-surface">
  <h3>{matterCommandView?.blockerTitle ?? "這案目前最卡的地方"}</h3>
  <p className="content-block">{matterCommandView?.blockerCopy}</p>
  <p className="muted-text">{matterCommandView?.deliverableCopy}</p>
</div>
```

Also tighten `buildMatterUsabilityView(...)` so the first guide item title becomes:

```ts
title: "先看案件主線與指揮判斷"
```

and the description explicitly says:

```ts
"先抓這輪主線、最大 blocker 與最值得先推的 task，再看 authority 或背景層。"
```

- [ ] **Step 4: Re-run the frontend tests to verify GREEN**

Run:

```bash
source ~/.nvm/nvm.sh && cd frontend && node --test tests/consultant-usability.test.mjs tests/case-command-loop.test.mjs
```

Expected:

- PASS

- [ ] **Step 5: Commit the matter-command slice**

```bash
git add frontend/src/components/matter-workspace-panel.tsx \
  frontend/src/lib/consultant-usability.ts \
  frontend/tests/consultant-usability.test.mjs
git commit -m "feat: add matter command surface"
```

Expected:

- commit succeeds with the matter page reading more like a command surface without adding a new dashboard family

---

### Task 4: Add Decision-Brief And Writeback-Approval Readouts To Task And Deliverable Surfaces

**Files:**
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/components/task-detail-panel.tsx`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/components/deliverable-workspace-panel.tsx`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/tests/case-command-loop.test.mjs`

- [ ] **Step 1: Add the failing helper expectations first**

Extend `frontend/tests/case-command-loop.test.mjs` with these assertions:

```javascript
test("decision brief view keeps one formal recommendation summary", () => {
  const view = buildDecisionBriefView({
    posture: "publish_ready",
    posture_label: "可收成正式交付結果",
    question_summary: "先判斷要不要把這輪結論發布給客戶。",
    options_summary: "主 option 是直接發布，次 option 是先補一輪風險說明。",
    risk_summary: "若直接發布而未補邊界，容易被過度解讀。",
    recommendation_summary: "先補邊界說明後發布正式版本。",
    next_action_summary: "回交付物完成最後修訂與發布。",
    boundary_note: "這份 brief 不等於 admin approval console。",
  });

  assert.equal(view.checklist.length, 4);
  assert.match(view.summary, /先補邊界說明後發布正式版本/);
});

test("writeback approval view keeps approval and candidate review in the same loop", () => {
  const view = buildWritebackApprovalView({
    posture: "candidate_review",
    posture_label: "先看哪些值得留下",
    summary: "目前正式核可不是唯一重點，這輪更重要的是先分辨哪些東西值得寫回。",
    primary_action_label: "先做 writeback 判斷",
    primary_action_summary: "先看這次結果哪些值得留 precedent、哪些適合 playbook 或 template。",
    candidate_summary: "目前有 3 筆候選，其中 1 筆更適合 template。",
    boundary_note: "個案成功不等於一定適合變成共享規則。",
  });

  assert.match(view.primaryCopy, /prece.*template/i);
  assert.match(view.boundaryNote, /個案成功不等於一定適合變成共享規則/);
});
```

- [ ] **Step 2: Run the frontend helper suite to verify RED**

Run:

```bash
source ~/.nvm/nvm.sh && cd frontend && node --test tests/case-command-loop.test.mjs
```

Expected:

- FAIL until the helper output is fully wired and stable

- [ ] **Step 3: Wire `decision_brief` into the existing task and deliverable surfaces**

In `frontend/src/components/task-detail-panel.tsx`, add:

```ts
import { buildDecisionBriefView } from "@/lib/case-command-loop";
```

Build once:

```ts
  const decisionBriefView = task ? buildDecisionBriefView(task.decision_brief) : null;
```

Then reuse the existing task rail / second-layer posture instead of creating a new section wall:

```tsx
<p className="hero-focus-copy">
  {decisionBriefView
    ? `${decisionBriefView.railTitle}｜${decisionBriefView.summary}`
    : taskDetailUsabilityView?.railSummary}
</p>
```

and in the existing decision-context or operating-summary area:

```tsx
{decisionBriefView ? (
  <div className="section-card" id="task-decision-brief">
    <h3>{decisionBriefView.railEyebrow}</h3>
    <p className="content-block">{decisionBriefView.summary}</p>
    <ul className="list-content">
      {decisionBriefView.checklist.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
    <p className="muted-text">{decisionBriefView.boundaryNote}</p>
  </div>
) : null}
```

In `frontend/src/components/deliverable-workspace-panel.tsx`, reuse the same helper on:

```ts
  const decisionBriefView = buildDecisionBriefView(workspace.task.decision_brief);
  const writebackApprovalView = buildWritebackApprovalView(workspace.task.writeback_approval);
```

Then deepen two existing surfaces only:

1. the current `最近 decision / outcome` block
2. the current `deliverable-writeback-context` disclosure

with:

```tsx
<h3>Decision Brief</h3>
<p className="content-block">{decisionBriefView.summary}</p>
<p className="muted-text">{decisionBriefView.boundaryNote}</p>
```

and:

```tsx
<div className="section-card">
  <h4>{writebackApprovalView.primaryTitle}</h4>
  <p className="content-block">{writebackApprovalView.primaryCopy}</p>
  <p className="muted-text">{writebackApprovalView.candidateCopy}</p>
  <p className="muted-text">{writebackApprovalView.boundaryNote}</p>
</div>
```

- [ ] **Step 4: Re-run the frontend suite to verify GREEN**

Run:

```bash
source ~/.nvm/nvm.sh && cd frontend && node --test tests/case-command-loop.test.mjs tests/task-detail-usability.test.mjs tests/consultant-usability.test.mjs tests/phase-six-governance.test.mjs
```

Expected:

- PASS

- [ ] **Step 5: Run build and typecheck after the surface changes**

Run:

```bash
source ~/.nvm/nvm.sh && cd frontend && npm run build
source ~/.nvm/nvm.sh && cd frontend && npm run typecheck
```

Expected:

- both PASS

- [ ] **Step 6: Commit the decision-brief and writeback-approval slice**

```bash
git add frontend/src/components/task-detail-panel.tsx \
  frontend/src/components/deliverable-workspace-panel.tsx \
  frontend/tests/case-command-loop.test.mjs
git commit -m "feat: add case command loop surfaces"
```

Expected:

- commit succeeds with the new decision-brief and writeback-approval readout

---

### Task 5: Sync Active Docs And Run Final Verification

**Files:**
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/01_runtime_architecture_and_data_contracts.md`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/03_workbench_ux_and_page_spec.md`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/04_qa_matrix.md`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/06_product_alignment_and_85_point_roadmap.md`

- [ ] **Step 1: Update the runtime contract doc**

Add a short subsection to `docs/01_runtime_architecture_and_data_contracts.md` under the shipped read-model/runtime discussion that explicitly records:

```md
- `MatterWorkspaceResponse.matter_command`
  - tells the workbench what the current case command posture is
- `TaskAggregateResponse.decision_brief`
  - tells task and deliverable surfaces what the current formal decision posture is
- `TaskAggregateResponse.writeback_approval`
  - tells task and deliverable surfaces whether this round is mainly about formal approval, candidate review, or minimal writeback
```

and explicitly state that these are:

```md
consultant-facing runtime read models inside the existing Host-governed boundary,
not a new architecture layer and not UI-only orchestration.
```

- [ ] **Step 2: Update the workbench UX doc**

Add concrete wording to `docs/03_workbench_ux_and_page_spec.md`:

```md
- `matter workspace` first-screen should answer the current case command:
  - 主目標
  - 最大 blocker
  - 最值得先推的 task
  - 正式結果收斂方向
- `task workspace` should expose one low-noise `Decision Brief` reading, not only readiness and handoff
- `deliverable workspace` should expose one low-noise `writeback approval` reading inside the existing writeback/context layer
```

- [ ] **Step 3: Update the roadmap doc**

Add a new progress bullet under `11.3 T2-C Consultant operating leverage and task-surface usability` in `docs/06_product_alignment_and_85_point_roadmap.md`:

```md
- 第四刀已正式落地成 `case command loop v1`
- matter 現在更清楚回答案件目前最值得推的主線、最大 blocker 與交付方向
- task / deliverable 之間現在已有較正式的 `Decision Brief` 主鏈
- writeback 也開始從 background record 走向較自然的 approval / candidate review loop
```

- [ ] **Step 4: Run the final verification set before touching `docs/04`**

Run:

```bash
PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_mvp_slice.py -q
source ~/.nvm/nvm.sh && cd frontend && node --test tests/case-command-loop.test.mjs tests/task-detail-usability.test.mjs tests/consultant-usability.test.mjs tests/phase-six-governance.test.mjs
source ~/.nvm/nvm.sh && cd frontend && npm run build
source ~/.nvm/nvm.sh && cd frontend && npm run typecheck
git diff --check
```

Expected:

- backend regression PASS
- frontend node tests PASS
- frontend build PASS
- frontend typecheck PASS
- `git diff --check` PASS

- [ ] **Step 5: Only after the commands pass, append QA evidence**

Append a new dated entry to `docs/04_qa_matrix.md` with:

```md
## Entry: 2026-04-11 T2-C case command loop v1

Scope:
- matter command surface
- decision brief posture
- writeback approval loop

Environment used:
- frontend: `http://127.0.0.1:3000`
- backend: `http://127.0.0.1:8000/api/v1`
- runtime database: current local runtime

### Build / Typecheck / Runtime checks

| Check | Result |
| --- | --- |
| `PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_mvp_slice.py -q` | Passed |
| `source ~/.nvm/nvm.sh && cd frontend && node --test tests/case-command-loop.test.mjs tests/task-detail-usability.test.mjs tests/consultant-usability.test.mjs tests/phase-six-governance.test.mjs` | Passed |
| `source ~/.nvm/nvm.sh && cd frontend && npm run build` | Passed |
| `source ~/.nvm/nvm.sh && cd frontend && npm run typecheck` | Passed |

### Case command loop verification

| Area | Page / Flow | Action | Status | Notes |
| --- | --- | --- | --- | --- |
| Matter | `/matters/[matterId]` | Verify the first screen now surfaces one command posture, one blocker, and one primary task | Verified | Case command stays low-noise and does not turn into a dashboard wall |
| Task | `/tasks/[taskId]` | Verify the task surface now exposes one `Decision Brief` reading | Verified | Recommendation / risk / next action are readable as one formal decision posture |
| Deliverable | `/deliverables/[deliverableId]` | Verify the writeback/context layer now surfaces one approval-loop summary | Verified | Approval and candidate review live in one low-noise loop |
```

- [ ] **Step 6: Commit the docs + verification slice**

```bash
git add docs/01_runtime_architecture_and_data_contracts.md \
  docs/03_workbench_ux_and_page_spec.md \
  docs/04_qa_matrix.md \
  docs/06_product_alignment_and_85_point_roadmap.md
git commit -m "docs: sync t2c case command loop"
```

Expected:

- commit succeeds with active docs and QA evidence aligned to shipped behavior

---

## Self-Review

### Spec coverage

- `matter command`
  - covered by Task 1 backend contract + Task 2 frontend helper + Task 3 matter surface
- `decision brief`
  - covered by Task 1 backend contract + Task 2 frontend helper + Task 4 task/deliverable surfaces
- `writeback approval`
  - covered by Task 1 backend contract + Task 2 frontend helper + Task 4 deliverable surface
- docs / QA alignment
  - covered by Task 5

### Placeholder scan

- No unresolved placeholder markers remain
- Every task contains concrete files, code snippets, commands, and expected outcomes

### Type consistency

- Backend names stay consistent across plan:
  - `MatterCommandRead`
  - `DecisionBriefRead`
  - `WritebackApprovalRead`
- Frontend names mirror backend names:
  - `MatterCommand`
  - `DecisionBrief`
  - `WritebackApproval`
- View-helper names stay consistent:
  - `buildMatterCommandView`
  - `buildDecisionBriefView`
  - `buildWritebackApprovalView`

## Execution Handoff

Plan complete and saved to `/Users/oldtien_base/Desktop/Infinite Pro/docs/superpowers/plans/2026-04-11-t2c-case-command-loop-v1.md`.

Two execution options:

**1. Subagent-Driven (recommended)** - 我為每個 task 派一個新的 subagent，逐 task review，速度快、邊界也更清楚

**2. Inline Execution** - 我在這個 session 直接照 plan 用 `executing-plans` 一路做下去，分 checkpoint 驗收

你想走哪一個？
