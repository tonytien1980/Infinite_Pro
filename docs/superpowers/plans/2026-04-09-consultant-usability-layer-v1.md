# Consultant Usability Layer v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不新增 training shell 或 dashboard family 的前提下，讓 `overview`、`matter workspace`、`deliverable workspace` 三個既有 surface 更清楚回答先做什麼、什麼時候才要看第二層，以及哪些說明應只按需展開。

**Architecture:** 先新增一個純函式 `consultant-usability` view-model helper，讓首頁、案件頁、交付物頁都吃同一套 low-noise first-action / reading-guide / disclosure-copy contracts，而不是繼續把更多判斷分支堆回巨型元件。三個 surface 依序落地 `overview -> matter -> deliverable`，每一刀都先用 `node:test` 寫出 failing tests，再把 helper 與元件接上，最後統一補 active docs 與 QA evidence。

**Tech Stack:** Next.js 15, React 19, TypeScript, `node:test`, existing frontend section-guide/disclosure patterns, active docs under `docs/`

---

## File Structure

- Create: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/lib/consultant-usability.ts`
  - Define pure helper builders for overview first-action copy, matter reading guide, deliverable reading guide, and disclosure descriptions
- Create: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/tests/consultant-usability.test.mjs`
  - Lock low-noise copy, fallback hierarchy, and guide/disclosure outputs with pure `node:test`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/components/workbench-home.tsx`
  - Replace hard-coded first-action guidance with helper-driven view data
  - Add stable anchors and a homepage section guide without creating a new page family
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/components/matter-workspace-panel.tsx`
  - Add a calmer overview-tab section guide, stable anchors, and helper-driven second-layer descriptions
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/components/deliverable-workspace-panel.tsx`
  - Re-drive guide/disclosure copy through the helper, plus clearer “what to do now vs what is background” wording
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/03_workbench_ux_and_page_spec.md`
  - Record shipped `7.4 v1` workbench behavior for overview / matter / deliverable
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/06_product_alignment_and_85_point_roadmap.md`
  - Mark `7.4` first slice family as started/landed at honest scope
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/04_qa_matrix.md`
  - Append real verification evidence only after tests/typecheck/build pass

---

### Task 1: Add Pure Consultant-Usability View Builders And Tests

**Files:**
- Create: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/lib/consultant-usability.ts`
- Create: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/tests/consultant-usability.test.mjs`

- [ ] **Step 1: Write the failing helper tests**

```javascript
import test from "node:test";
import assert from "node:assert/strict";

import {
  buildOverviewUsabilityView,
  buildMatterUsabilityView,
  buildDeliverableUsabilityView,
} from "../src/lib/consultant-usability.ts";

test("overview usability view promotes one primary action and two fallback paths", () => {
  const view = buildOverviewUsabilityView({
    homepageDisplayPreference: "matters",
    focusTitle: "回到案件 Alpha",
    focusCopy: "這是目前最值得接續的一件事。",
    focusHref: "/matters/matter-alpha",
    focusActionLabel: "前往案件頁",
    hasPrimaryMatter: true,
    hasPrimaryDeliverable: true,
    hasPendingEvidenceTask: true,
  });

  assert.equal(view.primaryLabel, "現在先做這件事");
  assert.equal(view.primaryHref, "/matters/matter-alpha");
  assert.equal(view.checklist.length, 3);
  assert.equal(view.guideItems.length, 3);
  assert.equal(view.guideItems[0]?.href, "/matters/matter-alpha");
});

test("matter usability view keeps the mainline first and pushes world-state to second layer", () => {
  const view = buildMatterUsabilityView({
    evidenceCount: 1,
    deliverableCount: 2,
    activeTaskCount: 3,
    hasCaseWorldState: true,
    hasOpenEvidenceGaps: true,
    hasRecentDeliverable: true,
  });

  assert.equal(view.sectionGuideTitle, "案件頁怎麼看最快");
  assert.equal(view.guideItems[0]?.href, "#matter-mainline");
  assert.match(view.mainlineCopy, /先抓主線/);
  assert.match(view.worldStateDisclosureDescription, /只有在你要確認案件世界層/);
});

test("deliverable usability view keeps publish/read/evidence paths separate and low-noise", () => {
  const view = buildDeliverableUsabilityView({
    deliverableStatus: "draft",
    hasPendingFormalSave: true,
    hasLinkedEvidence: true,
    hasHighImpactGaps: true,
    hasMatterWorkspace: true,
  });

  assert.equal(view.sectionGuideTitle, "這份交付物怎麼讀最快");
  assert.equal(view.guideItems[0]?.href, "#deliverable-publish-check");
  assert.match(view.contextDisclosureDescription, /當你要理解這份交付物在整個案件世界中的定位時/);
  assert.match(view.writebackDisclosureDescription, /只有在你要確認這份交付物會怎麼寫回案件世界/);
});
```

- [ ] **Step 2: Run the helper test to verify it fails**

Run: `cd frontend && node --test tests/consultant-usability.test.mjs`

Expected:
- FAIL with module-not-found because `src/lib/consultant-usability.ts` does not exist yet

- [ ] **Step 3: Write the minimal helper contract**

```typescript
export type ConsultantGuideTone = "default" | "accent" | "warm";

export type ConsultantGuideItem = {
  href: string;
  eyebrow: string;
  title: string;
  copy: string;
  meta?: string;
  tone?: ConsultantGuideTone;
};

export type OverviewUsabilityView = {
  primaryLabel: string;
  primaryTitle: string;
  primaryCopy: string;
  primaryHref: string;
  primaryActionLabel: string;
  checklist: string[];
  guideTitle: string;
  guideDescription: string;
  guideItems: ConsultantGuideItem[];
};

export function buildOverviewUsabilityView(input: {
  homepageDisplayPreference: "matters" | "deliverables" | "evidence";
  focusTitle: string;
  focusCopy: string;
  focusHref: string;
  focusActionLabel: string;
  hasPrimaryMatter: boolean;
  hasPrimaryDeliverable: boolean;
  hasPendingEvidenceTask: boolean;
}): OverviewUsabilityView {
  const fallbackItems: ConsultantGuideItem[] = [
    {
      href: input.focusHref,
      eyebrow: "先接回主工作",
      title: input.focusTitle,
      copy: "先回到現在最值得接續的一件事，不先在首頁停太久。",
      tone: "accent",
    },
  ];

  if (input.hasPendingEvidenceTask) {
    fallbackItems.push({
      href: "/matters",
      eyebrow: "若要先補件",
      title: "先處理待補資料",
      copy: "當前判斷若卡在依據偏薄，先補資料比繼續延長摘要更有效。",
      tone: "warm",
    });
  }

  fallbackItems.push({
    href: "/new",
    eyebrow: "若這不是現在要做的",
    title: "建立新案件",
    copy: "只有在這輪不是延續工作時，才從首頁直接開新案件。",
  });

  return {
    primaryLabel: "現在先做這件事",
    primaryTitle: input.focusTitle,
    primaryCopy: input.focusCopy,
    primaryHref: input.focusHref,
    primaryActionLabel: input.focusActionLabel,
    checklist: [
      "先回到目前最值得處理的一件事。",
      "若卡在依據偏薄，再改走補件路徑。",
      "只有不是延續工作時，才直接建立新案件。",
    ],
    guideTitle: "總覽怎麼用最快",
    guideDescription: "首頁只負責把你送回正確工作面，不負責承接整個案件背景。",
    guideItems: fallbackItems.slice(0, 3),
  };
}
```

```typescript
export function buildMatterUsabilityView(input: {
  evidenceCount: number;
  deliverableCount: number;
  activeTaskCount: number;
  hasCaseWorldState: boolean;
  hasOpenEvidenceGaps: boolean;
  hasRecentDeliverable: boolean;
}) {
  return {
    sectionGuideTitle: "案件頁怎麼看最快",
    sectionGuideDescription:
      "先抓這輪主線，再決定要不要下鑽背景補充、案件世界 authority、來源與交付物。",
    mainlineCopy:
      "先抓主線：這一屏只回答案件目前在處理什麼、下一步做什麼，以及哪些限制最值得先看。",
    worldStateDisclosureDescription: input.hasCaseWorldState
      ? "只有在你要確認案件世界層的 identity authority、task slices 與寫回深度時，再展開這層。"
      : "只有在你要確認為何目前還沒形成穩定案件世界層時，再展開這層。",
    guideItems: [
      {
        href: "#matter-mainline",
        eyebrow: "先抓主線",
        title: "先看案件主線與下一步",
        copy: "不要先掉進 continuity、research 或 organization memory 的細節。",
        tone: "accent",
      },
      {
        href: "#matter-world-state",
        eyebrow: "需要確認 authority 時",
        title: "再看案件世界與寫回策略",
        copy: "這層只在你要確認 world authority、task slices、writeback 深度時才值得打開。",
      },
      {
        href: input.hasRecentDeliverable ? "#matter-deliverables-overview" : "#matter-evidence-overview",
        eyebrow: "要接續工作面時",
        title: input.hasRecentDeliverable ? "直接回交付物" : "先回來源與證據",
        copy: input.hasRecentDeliverable
          ? "若這輪已進入輸出整理，直接從案件頁跳回交付物最省。"
          : "若現在卡在依據偏薄，先去來源與證據工作面比較實際。",
        tone: input.hasOpenEvidenceGaps || input.evidenceCount < 2 ? "warm" : "default",
      },
    ] satisfies ConsultantGuideItem[],
  };
}
```

```typescript
export function buildDeliverableUsabilityView(input: {
  deliverableStatus: string;
  hasPendingFormalSave: boolean;
  hasLinkedEvidence: boolean;
  hasHighImpactGaps: boolean;
  hasMatterWorkspace: boolean;
}) {
  return {
    sectionGuideTitle: "這份交付物怎麼讀最快",
    sectionGuideDescription:
      "先決定你現在是在整理版本、回看交付摘要、檢查依據，還是確認這份內容怎麼回寫案件世界。",
    contextDisclosureDescription:
      "當你要理解這份交付物在整個案件世界中的定位時，再展開這層；平常先讀交付摘要與建議 / 風險 / 行動即可。",
    writebackDisclosureDescription:
      "只有在你要確認這份交付物會怎麼寫回案件世界、研究脈絡怎麼進鏈，以及目前有哪些 decision / outcome records 時，再展開這層。",
    guideItems: [
      {
        href: "#deliverable-publish-check",
        eyebrow: "先決定這一步",
        title: input.hasPendingFormalSave ? "先儲存正式草稿" : "先確認能不能發布",
        copy: input.hasPendingFormalSave
          ? "若正式草稿尚未落盤，先處理儲存，不要直接跳去看深層背景。"
          : "若版本與依據都穩，再決定是否正式發布或匯出。",
        tone: "accent",
      },
      {
        href: "#deliverable-reading",
        eyebrow: "要先看內容時",
        title: "回看交付摘要",
        copy: "先確認結論、建議、風險與行動項目是否已經站穩。",
      },
      {
        href: input.hasLinkedEvidence ? "#deliverable-evidence" : "#deliverable-context",
        eyebrow: "需要確認依據或背景時",
        title: input.hasLinkedEvidence ? "回看依據來源" : "再看交付脈絡",
        copy: input.hasHighImpactGaps
          ? "若高影響缺口仍在，先看依據與缺口，不急著下更深的 reusable guidance。"
          : "當前背景層只在你要確認適用範圍與案件定位時才值得展開。",
        tone: input.hasHighImpactGaps ? "warm" : "default",
      },
    ] satisfies ConsultantGuideItem[],
  };
}
```

- [ ] **Step 4: Run the helper test to verify it passes**

Run: `cd frontend && node --test tests/consultant-usability.test.mjs`

Expected:
- PASS

- [ ] **Step 5: Commit the helper contract**

```bash
git add frontend/src/lib/consultant-usability.ts \
  frontend/tests/consultant-usability.test.mjs
git commit -m "feat: add consultant usability view models"
```

---

### Task 2: Apply Overview First-Action Hierarchy

**Files:**
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/components/workbench-home.tsx`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/lib/consultant-usability.ts`
- Test: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/tests/consultant-usability.test.mjs`

- [ ] **Step 1: Extend the failing overview test for homepage guide output**

```javascript
test("overview usability view keeps homepage guidance low-noise and route-oriented", () => {
  const view = buildOverviewUsabilityView({
    homepageDisplayPreference: "deliverables",
    focusTitle: "回到交付物 Beta",
    focusCopy: "這份交付物是最近最值得回看的結果。",
    focusHref: "/deliverables/deliverable-beta",
    focusActionLabel: "回到交付物",
    hasPrimaryMatter: true,
    hasPrimaryDeliverable: true,
    hasPendingEvidenceTask: false,
  });

  assert.equal(view.guideTitle, "總覽怎麼用最快");
  assert.equal(view.guideItems[0]?.tone, "accent");
  assert.match(view.guideDescription, /首頁只負責把你送回正確工作面/);
});
```

- [ ] **Step 2: Run the helper test to verify it fails**

Run: `cd frontend && node --test tests/consultant-usability.test.mjs`

Expected:
- FAIL if the helper output is still missing the final homepage wording or route hierarchy

- [ ] **Step 3: Use the helper in `workbench-home.tsx`**

```typescript
import { WorkspaceSectionGuide } from "@/components/workspace-section-guide";
import { buildOverviewUsabilityView } from "@/lib/consultant-usability";
```

```typescript
const overviewUsabilityView = buildOverviewUsabilityView({
  homepageDisplayPreference: settings.homepageDisplayPreference,
  focusTitle,
  focusCopy,
  focusHref,
  focusActionLabel,
  hasPrimaryMatter: Boolean(primaryMatter),
  hasPrimaryDeliverable: Boolean(primaryDeliverable?.latest_deliverable_id),
  hasPendingEvidenceTask: Boolean(primaryEvidenceTask),
});
```

```tsx
<div className="hero-focus-card hero-focus-card-warm">
  <p className="hero-focus-label">這頁先做什麼</p>
  <ul className="hero-focus-list">
    {overviewUsabilityView.checklist.map((item) => (
      <li key={item}>{item}</li>
    ))}
  </ul>
</div>
```

```tsx
<section className="panel" id="home-primary-focus">
  <div className="panel-header">
    <div>
      <h2 className="panel-title">現在先做什麼</h2>
      <p className="panel-copy">{overviewUsabilityView.primaryCopy}</p>
    </div>
  </div>
  <div className="button-row">
    <Link className="button-primary" href={overviewUsabilityView.primaryHref}>
      {overviewUsabilityView.primaryActionLabel}
    </Link>
  </div>
</section>

<WorkspaceSectionGuide
  title={overviewUsabilityView.guideTitle}
  description={overviewUsabilityView.guideDescription}
  items={overviewUsabilityView.guideItems}
/>
```

```tsx
<section className="panel" id="home-matters">
  ...
</section>
<section className="panel" id="home-deliverables">
  ...
</section>
<section className="panel" id="home-evidence">
  ...
</section>
```

- [ ] **Step 4: Re-run the helper test**

Run: `cd frontend && node --test tests/consultant-usability.test.mjs`

Expected:
- PASS

- [ ] **Step 5: Commit the overview slice**

```bash
git add frontend/src/components/workbench-home.tsx \
  frontend/src/lib/consultant-usability.ts \
  frontend/tests/consultant-usability.test.mjs
git commit -m "feat: clarify overview first action"
```

---

### Task 3: Add A Calmer Matter-Workspace Reading Path

**Files:**
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/components/matter-workspace-panel.tsx`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/lib/consultant-usability.ts`
- Test: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/tests/consultant-usability.test.mjs`

- [ ] **Step 1: Extend the failing matter test**

```javascript
test("matter usability view points the first guide item at the mainline and keeps authority work second-layer", () => {
  const view = buildMatterUsabilityView({
    evidenceCount: 4,
    deliverableCount: 1,
    activeTaskCount: 1,
    hasCaseWorldState: true,
    hasOpenEvidenceGaps: false,
    hasRecentDeliverable: true,
  });

  assert.equal(view.guideItems[0]?.href, "#matter-mainline");
  assert.equal(view.guideItems[1]?.href, "#matter-world-state");
  assert.match(view.sectionGuideDescription, /先抓這輪主線/);
});
```

- [ ] **Step 2: Run the helper test to verify it fails**

Run: `cd frontend && node --test tests/consultant-usability.test.mjs`

Expected:
- FAIL if the helper or guide order still does not match the agreed matter-reading hierarchy

- [ ] **Step 3: Integrate the helper into the matter workspace**

```typescript
import { WorkspaceSectionGuide } from "@/components/workspace-section-guide";
import { buildMatterUsabilityView } from "@/lib/consultant-usability";
```

```typescript
const matterUsabilityView = buildMatterUsabilityView({
  evidenceCount,
  deliverableCount: matter.summary.deliverable_count,
  activeTaskCount: matter.summary.active_task_count,
  hasCaseWorldState: Boolean(caseWorldState || latestCaseWorldDraft),
  hasOpenEvidenceGaps: openEvidenceGaps.length > 0,
  hasRecentDeliverable: Boolean(matter.related_deliverables[0]),
});
```

```tsx
<section className="panel section-anchor" id="matter-mainline">
  <div className="panel-header">
    <div>
      <h2 className="panel-title">主線補充</h2>
      <p className="panel-copy">{matterUsabilityView.mainlineCopy}</p>
    </div>
  </div>
  ...
</section>

<WorkspaceSectionGuide
  title={matterUsabilityView.sectionGuideTitle}
  description={matterUsabilityView.sectionGuideDescription}
  items={matterUsabilityView.guideItems}
/>
```

```tsx
<DisclosurePanel
  id="matter-world-state"
  title="案件世界狀態與寫回策略"
  description={matterUsabilityView.worldStateDisclosureDescription}
>
  ...
</DisclosurePanel>
```

```tsx
<section className="panel" id="matter-evidence-overview">
  ...
</section>

<section className="panel" id="matter-deliverables-overview">
  ...
</section>
```

- [ ] **Step 4: Re-run the helper test**

Run: `cd frontend && node --test tests/consultant-usability.test.mjs`

Expected:
- PASS

- [ ] **Step 5: Commit the matter slice**

```bash
git add frontend/src/components/matter-workspace-panel.tsx \
  frontend/src/lib/consultant-usability.ts \
  frontend/tests/consultant-usability.test.mjs
git commit -m "feat: calm matter workspace reading path"
```

---

### Task 4: Clean Up Deliverable Explanation-On-Demand

**Files:**
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/components/deliverable-workspace-panel.tsx`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/lib/consultant-usability.ts`
- Test: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/tests/consultant-usability.test.mjs`

- [ ] **Step 1: Extend the failing deliverable test**

```javascript
test("deliverable usability view keeps publish, reading, and evidence lanes separate", () => {
  const view = buildDeliverableUsabilityView({
    deliverableStatus: "final",
    hasPendingFormalSave: false,
    hasLinkedEvidence: true,
    hasHighImpactGaps: false,
    hasMatterWorkspace: true,
  });

  assert.equal(view.guideItems[0]?.href, "#deliverable-publish-check");
  assert.equal(view.guideItems[1]?.href, "#deliverable-reading");
  assert.equal(view.guideItems[2]?.href, "#deliverable-evidence");
  assert.match(view.sectionGuideDescription, /先決定你現在是在整理版本/);
});
```

- [ ] **Step 2: Run the helper test to verify it fails**

Run: `cd frontend && node --test tests/consultant-usability.test.mjs`

Expected:
- FAIL if the deliverable helper still does not return the agreed section order or disclosure wording

- [ ] **Step 3: Integrate the helper into the deliverable workspace**

```typescript
import { buildDeliverableUsabilityView } from "@/lib/consultant-usability";
```

```typescript
const deliverableUsabilityView = buildDeliverableUsabilityView({
  deliverableStatus,
  hasPendingFormalSave,
  hasLinkedEvidence: workspace.linked_evidence.length > 0,
  hasHighImpactGaps: workspace.high_impact_gaps.length > 0,
  hasMatterWorkspace: Boolean(workspace.matter_workspace),
});
```

```tsx
<section className="panel" id="deliverable-publish-check">
  <div className="panel-header">
    <div>
      <h2 className="panel-title">發布前快速檢查</h2>
      <p className="panel-copy">
        第一屏已經告訴你這份交付物現在怎麼處理；這裡只保留發布前最需要再看一眼的提醒。
      </p>
    </div>
  </div>
  ...
</section>
```

```tsx
<WorkspaceSectionGuide
  title={deliverableUsabilityView.sectionGuideTitle}
  description={deliverableUsabilityView.sectionGuideDescription}
  items={deliverableUsabilityView.guideItems}
/>
```

```tsx
<DisclosurePanel
  id="deliverable-writeback-context"
  title="連續性、研究與寫回紀錄"
  description={deliverableUsabilityView.writebackDisclosureDescription}
>
  ...
</DisclosurePanel>

<DisclosurePanel
  id="deliverable-context"
  title="交付脈絡與工作面背景"
  description={deliverableUsabilityView.contextDisclosureDescription}
>
  ...
</DisclosurePanel>
```

- [ ] **Step 4: Re-run the helper test**

Run: `cd frontend && node --test tests/consultant-usability.test.mjs`

Expected:
- PASS

- [ ] **Step 5: Commit the deliverable slice**

```bash
git add frontend/src/components/deliverable-workspace-panel.tsx \
  frontend/src/lib/consultant-usability.ts \
  frontend/tests/consultant-usability.test.mjs
git commit -m "feat: clarify deliverable explanation on demand"
```

---

### Task 5: Sync Active Docs And Verification Evidence

**Files:**
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/03_workbench_ux_and_page_spec.md`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/06_product_alignment_and_85_point_roadmap.md`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/04_qa_matrix.md`

- [ ] **Step 1: Update the active UX doc**

```md
### 7.4 consultant usability layer v1

- `overview` 現在用更明確的 primary-action + reading-guide hierarchy 回答「現在先做什麼」
- `matter workspace` 現在把主線、authority / writeback second layer、以及 evidence / deliverable fallback path 分得更清楚
- `deliverable workspace` 現在把 publish / reading / evidence / context 幾條閱讀路徑分開，不把 reusable guidance 讀成能力牆
- 這一刀仍維持 low-noise default，不新增 onboarding shell 或 dashboard family
```

- [ ] **Step 2: Update the roadmap doc**

```md
- `7.4` 的第一刀現在已正式開始落地：
  - overview first-action hierarchy 更清楚
  - matter workspace 的 second-layer reading 更穩
  - deliverable workspace 的 explanation-on-demand 更一致
- 但這一刀仍只處理 `overview / matter / deliverable` 三個 surface
- `task detail` 與 training-like guidance shell 仍不在這一刀範圍內
```

- [ ] **Step 3: Run the full verification set**

Run:
- `cd frontend && node --test tests/consultant-usability.test.mjs tests/intake-progress.test.mjs tests/phase-six-governance.test.mjs`
- `cd frontend && rm -f .next/cache/.tsbuildinfo && mkdir -p .next/types && npx next typegen && npm run typecheck`
- `cd frontend && npm run build`
- `PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_mvp_slice.py -q`

Expected:
- all targeted frontend tests PASS
- typecheck PASS
- production build PASS
- backend regression PASS

- [ ] **Step 4: Append QA matrix only after the real runs pass**

```md
## Entry: 2026-04-09 consultant usability layer v1

- Scope:
  - clarify first-action hierarchy on `overview`
  - calm second-layer reading on `matter workspace`
  - clarify explanation-on-demand on `deliverable workspace`
- Verification:
  - `cd frontend && node --test tests/consultant-usability.test.mjs tests/intake-progress.test.mjs tests/phase-six-governance.test.mjs`
  - `cd frontend && rm -f .next/cache/.tsbuildinfo && mkdir -p .next/types && npx next typegen && npm run typecheck`
  - `cd frontend && npm run build`
  - `PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_mvp_slice.py -q`
```

- [ ] **Step 5: Commit docs / QA alignment and push**

```bash
git add docs/03_workbench_ux_and_page_spec.md \
  docs/06_product_alignment_and_85_point_roadmap.md \
  docs/04_qa_matrix.md
git commit -m "docs: align consultant usability layer"
git push origin codex/docs06-roadmap
```

---

### Self-Review

- [ ] Spec coverage: overview / matter / deliverable 三個 surface 都有獨立 task，`task detail` 明確不在本輪
- [ ] Placeholder scan: plan 內沒有 `TODO`、`TBD`、或模糊的「之後補上」
- [ ] Type consistency: `buildOverviewUsabilityView`、`buildMatterUsabilityView`、`buildDeliverableUsabilityView` 的輸出欄位在 test 與 component snippets 中一致
- [ ] Scope safety: 沒有新增 training shell、dashboard family、consultant mode switch、或新的 page family
- [ ] Product safety: docs / QA update 明確只在 real verification 通過後追加
