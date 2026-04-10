# T2-C Task Handoff Deepen V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `T2-C` 第三刀落成 `task handoff deepen v1`：在不重寫 task page、也不改 matter / deliverable surface 的前提下，讓 `/tasks/[taskId]` 更明確回答「現在應該先留在 task、回 matter，還是回 deliverable，為什麼」。

**Architecture:** 沿用既有 `buildTaskDetailUsabilityView(...)`、`TaskDetailUsabilityView`、`WorkspaceSectionGuide`、`task-detail-panel.tsx` 的 hero / guide / operating-summary 架構，不新增新頁或新的 dashboard family。frontend 只補 handoff target / handoff reason / handoff summary 的 view-model 欄位與既有 surface 接法；active docs 與 QA evidence 只在真實驗證完成後同步更新。

**Tech Stack:** Next.js, TypeScript, node:test, active docs under `docs/`

---

## File Structure

- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/lib/task-detail-usability.ts`
  - Extend the task-detail helper with explicit handoff target / reason / summary fields and richer guide/operating-note wording
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/tests/task-detail-usability.test.mjs`
  - Add targeted helper-level assertions for `stay on task / go to matter / go to deliverable` handoff logic
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/components/task-detail-panel.tsx`
  - Render the new handoff reading inside the existing task hero / guide / operating-summary surfaces
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/03_workbench_ux_and_page_spec.md`
  - Extend `/tasks/[taskId]` task-surface rules to describe the new handoff contract
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/06_product_alignment_and_85_point_roadmap.md`
  - Mark `T2-C slice 3` as landed without implying page rewrite
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/04_qa_matrix.md`
  - Append real verification evidence after frontend verification passes

---

### Task 1: Add Explicit Handoff Fields To The Task Detail Helper

**Files:**
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/lib/task-detail-usability.ts`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/tests/task-detail-usability.test.mjs`

- [ ] **Step 1: Write the failing helper tests first**

Add these tests to `frontend/tests/task-detail-usability.test.mjs`:

```javascript
test("task detail usability view prefers matter handoff when evidence is thin", () => {
  const view = buildTaskDetailUsabilityView({
    hasThinTaskEvidence: true,
    hasLatestDeliverable: false,
    latestDeliverableTitle: "",
    hasMatterWorkspace: true,
    runButtonLabel: "執行分析",
    runDestinationLabel: "分析後會先形成正式交付結果",
    laneTitle: "材料審閱姿態",
    laneSummary: "目前更像 review memo / assessment，不是最終決策版本。",
    readinessLabel: "需補強",
    readinessSummary: "目前資料仍偏薄，但不用卡住。",
    evidenceCount: 1,
    sourceMaterialCount: 1,
    hasResearchGuidance: false,
    researchSummary: "",
    hasContinuationSummary: false,
    continuationSummary: "",
  });

  assert.equal(view.handoffTarget, "matter");
  assert.equal(view.handoffHref, "#workspace-lane");
  assert.match(view.handoffSummary, /先回案件工作面補脈絡與證據/);
});


test("task detail usability view prefers deliverable handoff when a formal result exists", () => {
  const view = buildTaskDetailUsabilityView({
    hasThinTaskEvidence: false,
    hasLatestDeliverable: true,
    latestDeliverableTitle: "季度風險掃描 memo",
    hasMatterWorkspace: true,
    runButtonLabel: "執行分析",
    runDestinationLabel: "最新結果已經形成，可直接回看正式交付物。",
    laneTitle: "目前交付等級",
    laneSummary: "已形成正式交付結果。",
    readinessLabel: "可直接推進",
    readinessSummary: "這筆工作已具備基本分析條件。",
    evidenceCount: 5,
    sourceMaterialCount: 4,
    hasResearchGuidance: false,
    researchSummary: "",
    hasContinuationSummary: true,
    continuationSummary: "最近 checkpoint 已形成，可直接回看成果或續推下一輪。",
  });

  assert.equal(view.handoffTarget, "deliverable");
  assert.equal(view.handoffHref, "#deliverable-surface");
  assert.match(view.handoffSummary, /先回正式交付物閱讀、修訂或發布/);
});
```

- [ ] **Step 2: Run the helper test to verify RED**

Run:

```bash
source ~/.nvm/nvm.sh && cd frontend && node --test tests/task-detail-usability.test.mjs
```

Expected:

- FAIL because `handoffTarget / handoffHref / handoffSummary` do not exist yet

- [ ] **Step 3: Extend `TaskDetailUsabilityView` with explicit handoff fields**

Add these fields to `TaskDetailUsabilityView` in `frontend/src/lib/task-detail-usability.ts`:

```ts
  handoffTarget: "task" | "matter" | "deliverable";
  handoffHref: string;
  handoffTitle: string;
  handoffSummary: string;
  handoffReasonLabel: string;
```

- [ ] **Step 4: Add the smallest possible handoff mapping**

Inside `buildTaskDetailUsabilityView(...)`, add a single explicit handoff decision:

```ts
  const handoffTarget =
    input.hasThinTaskEvidence && input.hasMatterWorkspace
      ? "matter"
      : input.hasLatestDeliverable
        ? "deliverable"
        : "task";

  const handoffHref =
    handoffTarget === "matter"
      ? "#workspace-lane"
      : handoffTarget === "deliverable"
        ? "#deliverable-surface"
        : "#run-panel";

  const handoffTitle =
    handoffTarget === "matter"
      ? "先回案件工作面"
      : handoffTarget === "deliverable"
        ? "先回正式交付物"
        : "先留在 task 判斷";

  const handoffReasonLabel =
    handoffTarget === "matter"
      ? "主因是補脈絡 / 證據 / continuity"
      : handoffTarget === "deliverable"
        ? "主因是閱讀 / 修訂 / 發布結果"
        : "主因是先決定要不要執行";

  const handoffSummary =
    handoffTarget === "matter"
      ? "先回案件工作面補脈絡與證據，再決定這輪要不要直接推進。"
      : handoffTarget === "deliverable"
        ? "先回正式交付物閱讀、修訂或發布，不要只停在 task 摘要。"
        : "現在先留在 task，先判斷是否直接執行或先補局部缺口。";
```

Return those fields from the helper and use the same decision to tighten:

```ts
  guideItems[2]
  railTitle / railSummary
  operatingNotes[0]
```

so they all speak the same handoff decision instead of parallel generic copy.

- [ ] **Step 5: Re-run the helper test to verify GREEN**

Run:

```bash
source ~/.nvm/nvm.sh && cd frontend && node --test tests/task-detail-usability.test.mjs
```

Expected:

- PASS

- [ ] **Step 6: Commit the helper handoff slice**

```bash
git add frontend/src/lib/task-detail-usability.ts \
  frontend/tests/task-detail-usability.test.mjs
git commit -m "feat: add t2c task handoff helper"
```

Expected:

- commit succeeds with helper + targeted handoff tests

---

### Task 2: Deepen The Task Detail Surface With The New Handoff Reading

**Files:**
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/components/task-detail-panel.tsx`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/tests/task-detail-usability.test.mjs`

- [ ] **Step 1: Add the failing surface-oriented test first**

Add one more test to `frontend/tests/task-detail-usability.test.mjs`:

```javascript
test("task detail usability view keeps guide and operating notes aligned with the same handoff target", () => {
  const view = buildTaskDetailUsabilityView({
    hasThinTaskEvidence: true,
    hasLatestDeliverable: false,
    latestDeliverableTitle: "",
    hasMatterWorkspace: true,
    runButtonLabel: "執行分析",
    runDestinationLabel: "分析後會先形成正式交付結果",
    laneTitle: "材料審閱姿態",
    laneSummary: "目前更像 review memo / assessment，不是最終決策版本。",
    readinessLabel: "需補強",
    readinessSummary: "目前資料仍偏薄，但不用卡住。",
    evidenceCount: 1,
    sourceMaterialCount: 1,
    hasResearchGuidance: false,
    researchSummary: "",
    hasContinuationSummary: false,
    continuationSummary: "",
  });

  assert.equal(view.guideItems[2]?.href, view.handoffHref);
  assert.match(view.guideItems[2]?.title, /案件工作面/);
  assert.match(view.operatingNotes[0]?.copy, /先回案件工作面補脈絡與證據/);
});
```

- [ ] **Step 2: Run the helper suite to verify RED**

Run:

```bash
source ~/.nvm/nvm.sh && cd frontend && node --test tests/task-detail-usability.test.mjs
```

Expected:

- FAIL because the guide / operating-note wording is not yet fully aligned with the new handoff contract

- [ ] **Step 3: Update `task-detail-panel.tsx` conservatively**

Keep the existing hero / guide / operating-summary layout, but add one explicit handoff readout in the right rail:

```tsx
                  <p className="hero-focus-copy">
                    {taskDetailUsabilityView
                      ? `${taskDetailUsabilityView.handoffTitle}｜${taskDetailUsabilityView.handoffReasonLabel}`
                      : ...}
                  </p>
```

and keep the existing `WorkspaceSectionGuide` / operating-summary blocks wired to the helper so the new handoff fields are the source of truth instead of ad-hoc panel copy.

- [ ] **Step 4: Re-run the helper suite to verify GREEN**

Run:

```bash
source ~/.nvm/nvm.sh && cd frontend && node --test tests/task-detail-usability.test.mjs
```

Expected:

- PASS

- [ ] **Step 5: Run the broader frontend verification**

Run:

```bash
source ~/.nvm/nvm.sh && cd frontend && node --test tests/task-detail-usability.test.mjs tests/consultant-usability.test.mjs tests/intake-progress.test.mjs tests/phase-six-governance.test.mjs
source ~/.nvm/nvm.sh && cd frontend && npm run build
source ~/.nvm/nvm.sh && cd frontend && npm run typecheck
```

Expected:

- all commands PASS

- [ ] **Step 6: Commit the task-surface handoff readout**

```bash
git add frontend/src/components/task-detail-panel.tsx \
  frontend/tests/task-detail-usability.test.mjs
git commit -m "feat: deepen t2c task handoff surface"
```

Expected:

- commit succeeds with task-detail surface changes + frontend verification already green

---

### Task 3: Sync Active Docs And QA Evidence After Real Verification

**Files:**
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/03_workbench_ux_and_page_spec.md`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/06_product_alignment_and_85_point_roadmap.md`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/04_qa_matrix.md`

- [ ] **Step 1: Update `docs/03` for the task handoff contract**

Extend the `/tasks/[taskId]` section in `docs/03_workbench_ux_and_page_spec.md` with:

```md
- `T2-C slice 3` 之後，task detail 還應正式回答：
  - 現在應先留在 task、回 matter，還是回 deliverable
  - 這次 handoff 的主因是補脈絡 / continuity，還是回正式交付結果
- `WorkspaceSectionGuide` 的第三條主線不應再只是 generic destination
  - 應更清楚回答現在為什麼要回 `matter` 或 `deliverable`
- 右側 rail 與 operating summary 也應沿用同一個 handoff contract，不可各自講不同下一步
```

- [ ] **Step 2: Update `docs/06` to record the shipped roadmap status**

Add a short landed note under `11.3 T2-C Consultant operating leverage and task-surface usability`:

```md
- 第三刀已正式落地成 `task handoff deepen v1`
- `/tasks/[taskId]` 現在不只會回答這頁怎麼看，也開始正式回讀：
  - 現在先留 task、回 matter，還是回 deliverable
  - 這次 handoff 的主因是什麼
```

- [ ] **Step 3: Run the final verification set for `docs/04` evidence**

Run:

```bash
source ~/.nvm/nvm.sh && cd frontend && node --test tests/task-detail-usability.test.mjs tests/consultant-usability.test.mjs tests/intake-progress.test.mjs tests/phase-six-governance.test.mjs
source ~/.nvm/nvm.sh && cd frontend && npm run build
source ~/.nvm/nvm.sh && cd frontend && npm run typecheck
PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_mvp_slice.py -q
git diff --check
```

Expected:

- all commands PASS

- [ ] **Step 4: Append a real QA evidence entry to `docs/04`**

Add a new entry to `docs/04_qa_matrix.md` with this structure:

```md
## Entry: 2026-04-10 T2-C task handoff deepen v1

Scope:
- deepen `T2-C` by turning task detail into a clearer task-to-matter / deliverable operating handoff

### Verification
| Layer | Surface | Expectation | Result | Evidence |
| --- | --- | --- | --- | --- |
| Frontend | `buildTaskDetailUsabilityView(...)` | Add explicit `stay on task / go to matter / go to deliverable` handoff reading | Verified | node tests confirm the helper now distinguishes handoff target, reason, and summary without creating a new page family |
| Frontend | `/tasks/[taskId]` hero / guide / operating summary | Keep the same surface while making the next formal work surface clearer | Verified | node tests, build, and typecheck confirm the task page now aligns its guide and operating notes around the same handoff contract |
| Regression | broader frontend + backend verification | Preserve current task surface, consultant usability, intake progress, phase-6 homepage, and MVP behavior | Verified | targeted frontend node tests, build, typecheck, backend regression, and `git diff --check` remain green after the handoff pass |
```

- [ ] **Step 5: Commit the docs + QA sync**

```bash
git add docs/03_workbench_ux_and_page_spec.md \
  docs/06_product_alignment_and_85_point_roadmap.md \
  docs/04_qa_matrix.md
git commit -m "docs: align t2c task handoff"
```

Expected:

- commit succeeds with active-doc sync and real QA evidence
