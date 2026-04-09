# T2-C Task Detail Usability V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `T2-C` 的第一刀落成 `task detail usability pass v1`：讓 `/tasks/[taskId]` 第一屏更直接回答「能不能跑、缺什麼、跑完去哪裡」，並把 flagship lane / posture / next-step 收成更清楚的 task 主線，而不把 task page 拉成 training shell 或新 dashboard family。

**Architecture:** 保留現有 `/tasks/[taskId]` route、`TaskDetailPanel`、`WorkspaceSectionGuide`、run action、deliverable backlink、extension manager 與 ontology/evidence/background disclosures。實作上新增一個純前端 helper，把 task hero / first action / section guide / right-rail summary 收成可測的 view model；`task-detail-panel.tsx` 只做接線與低噪音排版調整；active docs 與 QA evidence 在真實驗證完成後同步更新。

**Tech Stack:** Next.js App Router, React, TypeScript, node:test, active docs under `docs/`

---

## File Structure

- Create: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/lib/task-detail-usability.ts`
  - Pure helper for task-first-screen summary, first action, route-oriented section guide, and right-rail operating summary
- Create: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/tests/task-detail-usability.test.mjs`
  - Targeted node tests for the new helper
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/components/task-detail-panel.tsx`
  - Replace scattered inline first-screen strings with the new helper output
  - Keep existing run flow, deliverable surface, extension manager, and disclosures intact
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/03_workbench_ux_and_page_spec.md`
  - Record the shipped `/tasks/[taskId]` first-screen behavior
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/06_product_alignment_and_85_point_roadmap.md`
  - Mark `T2-C slice 1` as landed
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/04_qa_matrix.md`
  - Append real frontend verification evidence after tests/build/typecheck pass

---

### Task 1: Add A Pure Task-Detail Usability Helper

**Files:**
- Create: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/lib/task-detail-usability.ts`
- Create: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/tests/task-detail-usability.test.mjs`

- [ ] **Step 1: Write the failing helper tests**

Create `frontend/tests/task-detail-usability.test.mjs` with:

```javascript
import test from "node:test";
import assert from "node:assert/strict";

import { buildTaskDetailUsabilityView } from "../src/lib/task-detail-usability.ts";

test("task detail usability view makes the first action explicit when evidence is thin", () => {
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
  });

  assert.equal(view.primaryLabel, "現在先做這件事");
  assert.equal(view.primaryActionLabel, "執行分析");
  assert.equal(view.guideItems[0]?.href, "#readiness-governance");
  assert.equal(view.guideItems[1]?.href, "#run-panel");
  assert.equal(view.guideItems[2]?.href, "#workspace-lane");
  assert.match(view.primaryCopy, /資料仍偏薄/);
});

test("task detail usability view points to deliverable when a result already exists", () => {
  const view = buildTaskDetailUsabilityView({
    hasThinTaskEvidence: false,
    hasLatestDeliverable: true,
    latestDeliverableTitle: "市場風險評估 memo",
    hasMatterWorkspace: true,
    runButtonLabel: "執行分析",
    runDestinationLabel: "最新結果已經形成，可直接回看正式交付物。",
    laneTitle: "目前交付等級",
    laneSummary: "已形成正式交付結果。",
    readinessLabel: "可直接推進",
    readinessSummary: "這筆工作已具備基本分析條件。",
    evidenceCount: 4,
    sourceMaterialCount: 3,
  });

  assert.equal(view.primaryActionLabel, "打開正式交付物");
  assert.equal(view.primaryHref, "#deliverable-surface");
  assert.equal(view.guideItems[2]?.href, "#deliverable-surface");
  assert.match(view.railSummary, /市場風險評估 memo/);
});
```

- [ ] **Step 2: Run the targeted frontend test to verify RED**

Run:

```bash
cd frontend && node --test tests/task-detail-usability.test.mjs
```

Expected:

- FAIL because `buildTaskDetailUsabilityView(...)` does not exist yet

- [ ] **Step 3: Create the helper file**

Create `frontend/src/lib/task-detail-usability.ts` with:

```ts
import type { ConsultantGuideItem } from "@/lib/consultant-usability";

export type TaskDetailUsabilityView = {
  primaryLabel: string;
  primaryTitle: string;
  primaryCopy: string;
  primaryHref: string;
  primaryActionLabel: string;
  checklist: string[];
  guideTitle: string;
  guideDescription: string;
  guideItems: ConsultantGuideItem[];
  railEyebrow: string;
  railTitle: string;
  railSummary: string;
};

export function buildTaskDetailUsabilityView(input: {
  hasThinTaskEvidence: boolean;
  hasLatestDeliverable: boolean;
  latestDeliverableTitle: string;
  hasMatterWorkspace: boolean;
  runButtonLabel: string;
  runDestinationLabel: string;
  laneTitle: string;
  laneSummary: string;
  readinessLabel: string;
  readinessSummary: string;
  evidenceCount: number;
  sourceMaterialCount: number;
}): TaskDetailUsabilityView {
  const primaryActionLabel = input.hasLatestDeliverable ? "打開正式交付物" : input.runButtonLabel;
  const primaryHref = input.hasLatestDeliverable ? "#deliverable-surface" : "#run-panel";
  const thirdHref =
    input.hasThinTaskEvidence && input.hasMatterWorkspace ? "#workspace-lane" : "#deliverable-surface";
  const thirdTitle =
    input.hasThinTaskEvidence && input.hasMatterWorkspace ? "先補來源與證據" : "直接回正式交付結果";
  const thirdCopy =
    input.hasThinTaskEvidence && input.hasMatterWorkspace
      ? "若現在卡在依據偏薄，先回來源與證據工作面通常比空看頁面更有效。"
      : "如果最新結果已形成，先回正式交付結果最快。";

  return {
    primaryLabel: "現在先做這件事",
    primaryTitle: input.hasLatestDeliverable ? "先回看目前結果" : "先判斷要不要直接跑",
    primaryCopy: input.hasThinTaskEvidence
      ? `${input.readinessSummary} 先補來源與證據，或直接先跑第一版都可以。`
      : input.runDestinationLabel,
    primaryHref,
    primaryActionLabel,
    checklist: [
      "先確認這輪到底在判斷什麼。",
      input.hasThinTaskEvidence ? "若缺口明顯，先補來源與證據。" : "如果可直接推進，就不要只停在閱讀摘要。",
      input.hasLatestDeliverable ? "若結果已形成，先回正式交付結果。" : "執行後再回正式交付結果。 ",
    ],
    guideTitle: "這頁怎麼讀最快",
    guideDescription: "先判斷能不能跑，再決定是直接執行、先補依據，還是回看正式結果。",
    guideItems: [
      {
        href: "#readiness-governance",
        eyebrow: "先看能不能跑",
        title: `先看${input.readinessLabel}`,
        copy: "先確認現在最缺的是決策問題、來源材料，還是證據厚度。",
        meta: input.readinessSummary,
        tone: input.hasThinTaskEvidence ? "warm" : "accent",
      },
      {
        href: "#run-panel",
        eyebrow: "現在先做這件事",
        title: input.hasLatestDeliverable ? "先決定還要不要重跑" : "先決定要不要直接執行",
        copy: input.hasLatestDeliverable
          ? "如果只是要回看結果，不一定要再重跑。"
          : "這一格應只回答現在先執行，還是先補缺口。",
        meta: input.runDestinationLabel,
        tone: "accent",
      },
      {
        href: thirdHref,
        eyebrow: "要接續工作時",
        title: thirdTitle,
        copy: thirdCopy,
        meta: `${input.sourceMaterialCount} 份來源材料 / ${input.evidenceCount} 則證據`,
        tone: input.hasThinTaskEvidence ? "warm" : "default",
      },
    ],
    railEyebrow: input.laneTitle,
    railTitle: input.hasLatestDeliverable ? "結果已形成，可先回看" : "這筆工作接下來往哪裡",
    railSummary: input.hasLatestDeliverable
      ? `最新結果是「${input.latestDeliverableTitle}」，先回正式交付結果通常最快。`
      : input.laneSummary,
  };
}
```

- [ ] **Step 4: Re-run the targeted frontend test to verify GREEN**

Run:

```bash
cd frontend && node --test tests/task-detail-usability.test.mjs
```

Expected:

- PASS

- [ ] **Step 5: Commit the helper slice**

```bash
git add frontend/src/lib/task-detail-usability.ts \
  frontend/tests/task-detail-usability.test.mjs
git commit -m "feat: add t2c task detail usability view"
```

Expected:

- commit succeeds with helper + targeted frontend test changes

---

### Task 2: Rewire `TaskDetailPanel` To Use The Helper

**Files:**
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/components/task-detail-panel.tsx`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/tests/task-detail-usability.test.mjs`

- [ ] **Step 1: Add a failing test for the low-noise first-screen emphasis**

Append this test to `frontend/tests/task-detail-usability.test.mjs`:

```javascript
test("task detail usability view keeps the guide focused on readiness, run decision, and result destination", () => {
  const view = buildTaskDetailUsabilityView({
    hasThinTaskEvidence: false,
    hasLatestDeliverable: false,
    latestDeliverableTitle: "",
    hasMatterWorkspace: true,
    runButtonLabel: "執行分析",
    runDestinationLabel: "執行後會先寫回正式交付結果。",
    laneTitle: "目前交付等級",
    laneSummary: "這筆工作已具備基本分析條件。",
    readinessLabel: "可直接推進",
    readinessSummary: "目前資料已達基本可運作狀態。",
    evidenceCount: 3,
    sourceMaterialCount: 2,
  });

  assert.equal(view.guideItems.length, 3);
  assert.equal(view.guideItems[0]?.title, "先看可直接推進");
  assert.equal(view.guideItems[1]?.href, "#run-panel");
  assert.match(view.guideDescription, /先判斷能不能跑/);
});
```

- [ ] **Step 2: Run the targeted frontend test**

Run:

```bash
cd frontend && node --test tests/task-detail-usability.test.mjs
```

Expected:

- PASS

- [ ] **Step 3: Import and build the helper view inside `task-detail-panel.tsx`**

Add:

```ts
import { buildTaskDetailUsabilityView } from "@/lib/task-detail-usability";
```

Then replace the scattered inline `taskActionSummary`, `taskActionChecklist`, `taskSectionGuideItems`, `taskHeroActionTitle`, and `taskHeroLaneSummary` usage with:

```ts
  const taskDetailUsabilityView = task
    ? buildTaskDetailUsabilityView({
        hasThinTaskEvidence,
        hasLatestDeliverable: Boolean(latestDeliverable),
        latestDeliverableTitle: latestDeliverable?.title || "",
        hasMatterWorkspace: Boolean(task.matter_workspace),
        runButtonLabel: runMeta?.buttonIdle ?? "執行分析",
        runDestinationLabel: latestDeliverable
          ? `最新結果已整理成「${latestDeliverable.title}」，可以直接回看正式交付結果。`
          : taskActionSummary,
        laneTitle: taskHeroLaneTitle,
        laneSummary: taskHeroLaneSummary,
        readinessLabel: readinessGovernance?.label || "待確認",
        readinessSummary: readinessGovernance?.summary || "先判斷這輪工作的就緒度。",
        evidenceCount: task.evidence.length,
        sourceMaterialCount: task.source_materials.length,
      })
    : null;
```

- [ ] **Step 4: Rewire the hero / section guide / right rail to the helper output**

Replace the task hero second and third cards plus section guide with the new view:

```tsx
                <div className="hero-focus-card hero-focus-card-warm">
                  <p className="hero-focus-label">
                    {taskDetailUsabilityView?.primaryLabel || "現在先做這件事"}
                  </p>
                  <h3 className="hero-focus-title">
                    {taskDetailUsabilityView?.primaryTitle || taskHeroActionTitle}
                  </h3>
                  <p className="hero-focus-copy">
                    {taskDetailUsabilityView?.primaryCopy || taskActionSummary}
                  </p>
                  <ul className="hero-focus-list">
                    {(taskDetailUsabilityView?.checklist || taskActionChecklist).slice(0, 3).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="hero-focus-card">
                  <p className="hero-focus-label">
                    {taskDetailUsabilityView?.railEyebrow || taskHeroLaneTitle}
                  </p>
                  <h3 className="hero-focus-title">
                    {taskDetailUsabilityView?.railTitle || taskHeroActionTitle}
                  </h3>
                  <p className="hero-focus-copy">
                    {taskDetailUsabilityView?.railSummary || taskHeroLaneSummary}
                  </p>
                </div>
```

and:

```tsx
          <WorkspaceSectionGuide
            title={taskDetailUsabilityView?.guideTitle || "這頁怎麼讀最快"}
            description={
              taskDetailUsabilityView?.guideDescription ||
              "不要整頁一路往下刷。先選你現在要做的是對齊判斷、確認能不能跑、還是直接回看結果。"
            }
            items={taskDetailUsabilityView?.guideItems || taskSectionGuideItems}
          />
```

- [ ] **Step 5: Re-run targeted frontend tests**

Run:

```bash
cd frontend && node --test tests/task-detail-usability.test.mjs tests/intake-progress.test.mjs tests/phase-six-governance.test.mjs
```

Expected:

- PASS

- [ ] **Step 6: Commit the panel rewiring slice**

```bash
git add frontend/src/components/task-detail-panel.tsx \
  frontend/tests/task-detail-usability.test.mjs
git commit -m "feat: improve t2c task detail first screen"
```

Expected:

- commit succeeds with task panel rewiring + task-detail helper tests

---

### Task 3: Sync Active Docs And Run Final Verification

**Files:**
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/03_workbench_ux_and_page_spec.md`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/06_product_alignment_and_85_point_roadmap.md`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/04_qa_matrix.md`

- [ ] **Step 1: Update `docs/03` to describe the shipped task first-screen behavior**

In `7.5 /tasks/[taskId]`, add wording like:

```md
- 第一刀現在正式把 task hero / first-screen summary 收成：
  - 先看能不能跑
  - 若不能跑，最缺什麼
  - 若能跑，跑完去哪裡
- `WorkspaceSectionGuide` 第一波只保留三條主線：
  - readiness
  - run decision
  - result / evidence destination
- 右側 hero 卡片現在應優先承接：
  - 現在先做這件事
  - 目前工作姿態 / 下一步
```

- [ ] **Step 2: Update `docs/06` to mark `T2-C slice 1` as landed**

Under `11.3 T2-C Consultant operating leverage and task-surface usability`, append:

```md
- 第一刀已正式落地成 `task detail usability pass v1`
- `/tasks/[taskId]` 第一屏現在更直接回答：能不能跑、缺什麼、跑完去哪裡
- task detail 目前已開始更像 consultant operating surface，而不是只有資訊堆疊頁
```

- [ ] **Step 3: Append a QA entry in `docs/04` after real verification**

Add a new entry like:

```md
## Entry: 2026-04-10 T2-C task detail usability v1

Scope:
- start `T2-C` with a task-detail first-screen usability pass
- keep the same `/tasks/[taskId]` surface instead of creating a new dashboard family
- keep extension manager, deliverable surface, and supporting disclosures intact
```

and record the real verification commands and results.

- [ ] **Step 4: Run final verification**

Run:

```bash
cd frontend && node --test tests/task-detail-usability.test.mjs tests/consultant-usability.test.mjs tests/intake-progress.test.mjs tests/phase-six-governance.test.mjs
cd frontend && npm run build
cd frontend && npm run typecheck
PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_mvp_slice.py -q
```

Expected:

- task-detail helper tests pass
- existing usability and phase-six helper tests stay green
- frontend build passes
- frontend typecheck passes
- backend regression still passes

- [ ] **Step 5: Run final hygiene checks**

Run:

```bash
python3 - <<'PY'
from pathlib import Path
paths = [
    Path("docs/03_workbench_ux_and_page_spec.md"),
    Path("docs/04_qa_matrix.md"),
    Path("docs/06_product_alignment_and_85_point_roadmap.md"),
    Path("docs/superpowers/specs/2026-04-10-t2c-task-detail-usability-v1-design.md"),
    Path("docs/superpowers/plans/2026-04-10-t2c-task-detail-usability-v1.md"),
]
for path in paths:
    for lineno, line in enumerate(path.read_text().splitlines(), start=1):
        if any(token in line for token in ("TODO", "TBD", "FIXME")):
            if path.name == "04_qa_matrix.md" and "conversation-only TODO" in line:
                continue
            if path.name.endswith(".md") and 'if any(token in line for token in (' in line:
                continue
            print(f"{path}:{lineno}:{line}")
PY
git diff --check
```

Expected:

- no new placeholders
- no whitespace / patch-formatting issues

- [ ] **Step 6: Commit docs and verification alignment**

```bash
git add docs/03_workbench_ux_and_page_spec.md \
  docs/04_qa_matrix.md \
  docs/06_product_alignment_and_85_point_roadmap.md
git commit -m "docs: align t2c task detail usability"
```

Expected:

- commit succeeds with active docs aligned to shipped behavior and verification evidence
