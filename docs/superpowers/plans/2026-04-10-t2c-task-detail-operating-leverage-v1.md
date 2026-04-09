# T2-C Task Detail Operating Leverage V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `T2-C slice 2` 落成 `task detail operating leverage v1`：在既有 `/tasks/[taskId]` surface 內，補出更清楚的 operating summary 與 second-layer note condensation，讓 task page 不只更容易進場，也更容易沿著顧問工作主線往下推進。

**Architecture:** 保留既有 `/tasks/[taskId]` route、`TaskDetailPanel`、`WorkspaceSectionGuide`、run action、deliverable backlink、readiness / evidence / deliverable disclosures 與既有 helper 生態。實作上延伸現有 `task-detail-usability.ts`，新增一組可測的 operating-leverage view model，讓 `task-detail-panel.tsx` 在首屏之後補一個低噪音 operating summary，並把最容易重複的 second-layer guidance 收成較短且一致的 condensed notes；active docs 與 QA evidence 只在真實驗證完成後同步更新。

**Tech Stack:** Next.js App Router, React, TypeScript, node:test, active docs under `docs/`

---

## File Structure

- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/lib/task-detail-usability.ts`
  - Extend the existing task-detail helper instead of creating a second helper file
  - Add a typed operating-leverage view model and condensed-note outputs
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/tests/task-detail-usability.test.mjs`
  - Cover the new operating summary and note-condensation behavior
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/components/task-detail-panel.tsx`
  - Insert one low-noise operating summary block between the first-screen guide and the deeper disclosures
  - Reuse the new helper outputs to keep task posture / caution / fallback reading consistent
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/03_workbench_ux_and_page_spec.md`
  - Record the shipped task-detail second-layer operating reading and note-condensation behavior
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/06_product_alignment_and_85_point_roadmap.md`
  - Mark `T2-C slice 2` as landed under `11.3`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/04_qa_matrix.md`
  - Append real verification evidence for the task-detail operating-leverage pass

---

### Task 1: Extend The Existing Task-Detail Helper For Operating Leverage

**Files:**
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/lib/task-detail-usability.ts`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/tests/task-detail-usability.test.mjs`

- [ ] **Step 1: Add failing tests for the new operating summary output**

Append these tests to `frontend/tests/task-detail-usability.test.mjs`:

```javascript
test("task detail usability view builds an operating summary when the best next move is to fill evidence gaps", () => {
  const view = buildTaskDetailUsabilityView({
    hasThinTaskEvidence: true,
    hasLatestDeliverable: false,
    latestDeliverableTitle: "",
    hasMatterWorkspace: true,
    runButtonLabel: "執行分析",
    runDestinationLabel: "執行後會先形成正式交付結果。",
    laneTitle: "材料審閱姿態",
    laneSummary: "目前更像 review memo / assessment，不是最終決策版本。",
    readinessLabel: "需補強",
    readinessSummary: "目前資料仍偏薄，但不用卡住。",
    evidenceCount: 1,
    sourceMaterialCount: 1,
    hasResearchGuidance: true,
    researchSummary: "先確認第一個 research question 與 stop condition。",
    hasContinuationSummary: false,
    continuationSummary: "",
  });

  assert.equal(view.operatingSummaryTitle, "這頁現在怎麼推最快");
  assert.match(view.operatingSummaryCopy, /資料仍偏薄/);
  assert.equal(view.operatingNotes[0]?.href, "#workspace-lane");
  assert.match(view.operatingNotes[0]?.copy, /先補來源與證據/);
  assert.match(view.operatingNotes[1]?.copy, /research question/);
});

test("task detail usability view builds a result-first operating summary when a deliverable already exists", () => {
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

  assert.equal(view.operatingNotes.length, 3);
  assert.equal(view.operatingNotes[0]?.href, "#deliverable-surface");
  assert.match(view.operatingNotes[0]?.copy, /季度風險掃描 memo/);
  assert.match(view.operatingNotes[1]?.copy, /checkpoint/);
  assert.match(view.operatingNotes[2]?.copy, /可直接推進/);
});
```

- [ ] **Step 2: Run the targeted test to verify RED**

Run:

```bash
cd frontend && node --test tests/task-detail-usability.test.mjs
```

Expected:

- FAIL because `operatingSummaryTitle`, `operatingSummaryCopy`, and `operatingNotes` do not exist yet

- [ ] **Step 3: Extend the helper type and output shape**

Update `frontend/src/lib/task-detail-usability.ts` so `TaskDetailUsabilityView` gains a focused operating layer:

```ts
import type {
  ConsultantGuideItem,
  ConsultantGuideTone,
} from "@/lib/consultant-usability";

export type TaskOperatingNote = {
  href: string;
  label: string;
  copy: string;
  tone?: ConsultantGuideTone;
};

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
  operatingSummaryTitle: string;
  operatingSummaryCopy: string;
  operatingNotes: TaskOperatingNote[];
};
```

Also extend the input signature and return value:

```ts
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
  hasResearchGuidance: boolean;
  researchSummary: string;
  hasContinuationSummary: boolean;
  continuationSummary: string;
}): TaskDetailUsabilityView {
  const fallbackHref =
    input.hasThinTaskEvidence && input.hasMatterWorkspace ? "#workspace-lane" : "#deliverable-surface";
  const fallbackCopy =
    input.hasThinTaskEvidence && input.hasMatterWorkspace
      ? "現在最有槓桿的回退路徑是先補來源與證據，不要只停在 task 摘要。"
      : input.hasLatestDeliverable
        ? `最新結果「${input.latestDeliverableTitle}」已形成，先回正式交付物通常最快。`
        : "若不直接執行，先回正式交付結果或案件工作面確認脈絡。";

  const operatingNotes: TaskOperatingNote[] = [
    {
      href: fallbackHref,
      label: "最有槓桿的下一步",
      copy: fallbackCopy,
      tone: input.hasThinTaskEvidence ? "warm" : "accent",
    },
    {
      href: input.hasResearchGuidance ? "#readiness-governance" : "#decision-context",
      label: input.hasResearchGuidance ? "目前最大 caution" : "主線限制",
      copy: input.hasResearchGuidance
        ? input.researchSummary
        : `${input.readinessLabel}｜${input.readinessSummary}`,
    },
    {
      href: input.hasContinuationSummary ? "#deliverable-surface" : "#run-panel",
      label: "接續工作時",
      copy: input.hasContinuationSummary
        ? input.continuationSummary
        : input.runDestinationLabel,
    },
  ];

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
      input.hasThinTaskEvidence
        ? "若缺口明顯，先補來源與證據。"
        : "如果可直接推進，就不要只停在閱讀摘要。",
      input.hasLatestDeliverable
        ? "若結果已形成，先回正式交付結果。"
        : "執行後再回正式交付結果。",
    ],
    guideTitle: "這頁怎麼讀最快",
    guideDescription: "先判斷能不能跑，再決定是直接執行、先補依據，還是回看正式結果。",
    guideItems,
    railEyebrow: input.laneTitle,
    railTitle: input.hasLatestDeliverable ? "結果已形成，可先回看" : "這筆工作接下來往哪裡",
    railSummary: input.hasLatestDeliverable
      ? `最新結果是「${input.latestDeliverableTitle}」，先回正式交付結果通常最快。`
      : input.laneSummary,
    operatingSummaryTitle: "這頁現在怎麼推最快",
    operatingSummaryCopy: input.hasThinTaskEvidence
      ? "先承認目前還有缺口，再決定是先補 evidence、先讓系統跑第一版，還是先回看已形成的結果。"
      : "這頁現在不需要再重新理解整個背景，直接抓 posture、限制與下一步即可。",
    operatingNotes,
  };
}
```

- [ ] **Step 4: Re-run the targeted helper test to verify GREEN**

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
git commit -m "feat: add t2c task operating leverage view"
```

Expected:

- commit succeeds with helper + targeted test updates

---

### Task 2: Rewire `TaskDetailPanel` To Use The Operating-Leverage View

**Files:**
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/components/task-detail-panel.tsx`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/tests/task-detail-usability.test.mjs`

- [ ] **Step 1: Add a failing test for condensed operating notes**

Append this test to `frontend/tests/task-detail-usability.test.mjs`:

```javascript
test("task detail usability view condenses operating notes into three low-noise lanes", () => {
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
    hasResearchGuidance: false,
    researchSummary: "",
    hasContinuationSummary: false,
    continuationSummary: "",
  });

  assert.equal(view.operatingNotes.length, 3);
  assert.equal(view.operatingNotes[0]?.label, "最有槓桿的下一步");
  assert.equal(view.operatingNotes[1]?.label, "主線限制");
  assert.equal(view.operatingNotes[2]?.href, "#run-panel");
});
```

- [ ] **Step 2: Run the targeted helper test to verify RED if the labels or lane count still differ**

Run:

```bash
cd frontend && node --test tests/task-detail-usability.test.mjs
```

Expected:

- FAIL if the helper output still does not match the condensed-note contract above
- If Task 1 already made it pass, treat this as a safety re-run and continue

- [ ] **Step 3: Thread the richer helper inputs through `TaskDetailPanel`**

Update the helper call in `frontend/src/components/task-detail-panel.tsx`:

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
      hasResearchGuidance: Boolean(researchGuidance?.shouldShow),
      researchSummary: researchGuidance?.shouldShow
        ? [
            researchGuidance.firstQuestion,
            researchGuidance.stopCondition,
            researchGuidance.freshnessSummary,
          ]
            .filter(Boolean)
            .join("｜")
        : "",
      hasContinuationSummary: continuationFocusSummary.shouldShow,
      continuationSummary: continuationFocusSummary.copy || "",
    })
  : null;
```

- [ ] **Step 4: Add the new low-noise operating summary block**

Insert one compact panel between `WorkspaceSectionGuide` and `DisclosurePanel title="案件世界草稿與寫回策略"`:

```tsx
{taskDetailUsabilityView ? (
  <section className="panel">
    <div className="panel-header">
      <div>
        <h2 className="panel-title">{taskDetailUsabilityView.operatingSummaryTitle}</h2>
        <p className="panel-copy">{taskDetailUsabilityView.operatingSummaryCopy}</p>
      </div>
    </div>
    <div className="summary-grid">
      {taskDetailUsabilityView.operatingNotes.map((item) => (
        <Link
          key={`${item.href}-${item.label}`}
          className={`section-guide-card section-guide-card-${item.tone ?? "default"}`}
          href={item.href}
        >
          <span className="section-guide-eyebrow">{item.label}</span>
          <p className="section-guide-copy">{item.copy}</p>
        </Link>
      ))}
    </div>
  </section>
) : null}
```

Use this block to carry the condensed operating reading instead of adding another hero wall.

- [ ] **Step 5: Shorten repeated second-layer intros instead of adding more summaries**

In `frontend/src/components/task-detail-panel.tsx`, trim the copy in these existing sections so the new operating summary carries the overview:

```tsx
<DisclosurePanel
  id="workspace-lane"
  title="工作鏈與來源 / 證據"
  description="當你要補件或追查這輪判斷憑什麼成立時，再打開這層。"
>
```

```tsx
<section className="panel section-anchor" id="readiness-governance">
  <div className="panel-header">
    <div>
      <h2 className="panel-title">判斷可信度與資料缺口</h2>
      <p className="panel-copy">這裡只回答這輪目前站不站得住，以及最大的缺口在哪裡。</p>
    </div>
  </div>
```

```tsx
<section className="panel section-anchor" id="deliverable-surface">
  <div className="panel-header">
    <div>
      <h2 className="panel-title">正式交付結果</h2>
      <p className="panel-copy">若結果已形成，這裡就是最接近正式顧問交付物的主閱讀主線。</p>
    </div>
  </div>
```

Do not add new cards to the hero. Keep the condensation in one new panel plus shorter section intros.

- [ ] **Step 6: Run the focused frontend tests to verify GREEN**

Run:

```bash
cd frontend && node --test tests/task-detail-usability.test.mjs tests/consultant-usability.test.mjs
```

Expected:

- PASS

- [ ] **Step 7: Commit the task-panel slice**

```bash
git add frontend/src/components/task-detail-panel.tsx \
  frontend/src/lib/task-detail-usability.ts \
  frontend/tests/task-detail-usability.test.mjs
git commit -m "feat: deepen t2c task operating leverage"
```

Expected:

- commit succeeds with the task-panel operating summary and note-condensation changes

---

### Task 3: Sync Active Docs And Capture Verification Evidence

**Files:**
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/03_workbench_ux_and_page_spec.md`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/06_product_alignment_and_85_point_roadmap.md`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/04_qa_matrix.md`

- [ ] **Step 1: Update `docs/03` for the shipped task-detail operating reading**

In `docs/03_workbench_ux_and_page_spec.md` section `7.5 \`/tasks/[taskId]\``, add the shipped second-slice behavior:

```md
`T2-C slice 2` 之後，task detail 還應正式成立：

- 第一屏下方可補一層低噪音 operating summary，只回答：
  - 現在這頁怎麼推最快
  - 目前最大的限制在哪裡
  - 若不直接執行，最有槓桿的回退路徑是什麼
- 這層應優先使用 condensed notes，不可重新長成第二條 hero summary 牆
- `工作鏈與來源 / 證據`、`判斷可信度與資料缺口`、`正式交付結果` 的區塊文案應縮短，避免每區都重講一次主線
```

- [ ] **Step 2: Update `docs/06` progress under `11.3 T2-C`**

Append this progress note to `/Users/oldtien_base/Desktop/Infinite Pro/docs/06_product_alignment_and_85_point_roadmap.md`:

```md
- 第二刀已正式落地成 `task detail operating leverage v1`
- `/tasks/[taskId]` 現在在首屏之後會補一層低噪音 operating summary，回答這頁怎麼推最快、最大的限制在哪裡、以及不直接執行時最有槓桿的回退路徑
- task detail 的 second-layer notes 已開始做 condensation，而不是讓 readiness / evidence / deliverable 各自重講一遍主線
```

- [ ] **Step 3: Add a new `docs/04` QA entry only after real verification succeeds**

Append a new entry to `/Users/oldtien_base/Desktop/Infinite Pro/docs/04_qa_matrix.md` in this format:

```md
## Entry: 2026-04-10 T2-C task detail operating leverage v1

Scope:
- deepen `T2-C` from first-screen clarity into task-detail operating leverage
- add one low-noise operating summary block instead of a second hero wall
- condense repeated second-layer task notes without rewriting the full task page

Environment used:
- local frontend and backend verification

### Build / Typecheck / Compile

| Check | Result |
| --- | --- |
| `cd frontend && node --test tests/task-detail-usability.test.mjs tests/consultant-usability.test.mjs tests/intake-progress.test.mjs tests/phase-six-governance.test.mjs` | Passed |
| `cd frontend && npm run build` | Passed |
| `cd frontend && npm run typecheck` | Passed |
| `PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_mvp_slice.py -q` | Passed |
```

- [ ] **Step 4: Run the full verification set before claiming completion**

Run:

```bash
cd frontend && node --test tests/task-detail-usability.test.mjs tests/consultant-usability.test.mjs tests/intake-progress.test.mjs tests/phase-six-governance.test.mjs
cd frontend && npm run build
cd frontend && npm run typecheck
PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_mvp_slice.py -q
git diff --check
```

Expected:

- frontend node tests PASS
- frontend build PASS
- frontend typecheck PASS
- backend regression PASS
- `git diff --check` PASS

- [ ] **Step 5: Commit the docs-and-verification slice**

```bash
git add docs/03_workbench_ux_and_page_spec.md \
  docs/06_product_alignment_and_85_point_roadmap.md \
  docs/04_qa_matrix.md
git commit -m "docs: align t2c task operating leverage"
```

Expected:

- commit succeeds with active docs + QA evidence aligned to the shipped behavior
