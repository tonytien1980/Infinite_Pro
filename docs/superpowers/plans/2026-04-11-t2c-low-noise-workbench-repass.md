# T2-C Low-Noise Workbench Repass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 Infinite Pro 的 `overview / matter / task / deliverable / settings` 收成更低噪音、更易懂、更好操作的 consultant-facing workbench，同時保留既有 Host / runtime 邊界與已存在的 read models。

**Architecture:** 這一輪以 frontend-first repass 為主，但在視覺 / copy 重收之前，先處理已明確觀察到的首頁 request 密度與主工作面 client-hydration 壓力。除非實作時遇到明確 blocker，否則不新增 backend slice、不發明新 workflow truth。所有行為都沿用既有 Host / matter_command / decision_brief / writeback_approval / flagship / research / continuity contracts。

**Tech Stack:** Next.js App Router, TypeScript, React, node:test, existing frontend helper modules, active docs under `docs/`

---

## File Structure

- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/components/deliverable-workspace-panel.tsx`
  - Repass the highest-density surface first; simplify first-screen rail and move lower-priority work below the fold
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/components/task-detail-panel.tsx`
  - Localize visible language and reduce first-screen competition between action, decision brief, and handoff
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/components/matter-workspace-panel.tsx`
  - Re-center the page around one command path, one blocker, and one next step
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/components/workbench-home.tsx`
  - Return the overview surface to route-back responsibility and reduce first-load request pressure
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/components/settings-page-panel.tsx`
  - Reframe first-screen hierarchy around firm vs personal settings
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/components/settings-firm-provider-panel.tsx`
  - Normalize visible language for firm/provider terms
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/components/settings-personal-provider-panel.tsx`
  - Normalize visible language for personal-provider terms
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/lib/consultant-usability.ts`
  - Keep overview/matter/deliverable guide copy aligned with the new low-noise rules
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/lib/task-detail-usability.ts`
  - Keep task guide/operating copy aligned with the new low-noise rules
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/lib/api.ts`
  - Reuse and consolidate homepage request patterns where possible, and avoid keeping everything as eager first-load fetches
- Create: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/lib/workbench-surface-labels.ts`
  - Centralize the highest-visibility English-to-Traditional-Chinese label decisions used across surfaces
- Create: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/tests/low-noise-workbench-repass.test.mjs`
  - Lock the new visible labels and first-screen copy rules with node tests
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/tests/consultant-usability.test.mjs`
  - Update overview/matter/deliverable copy expectations
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/tests/task-detail-usability.test.mjs`
  - Update task-detail first-screen expectations
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/03_workbench_ux_and_page_spec.md`
  - Sync the shipped low-noise reading order, visible-language, and disclosure rules
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/04_qa_matrix.md`
  - Append real verification evidence after the implementation is proven

---

### Task 0: Establish the performance baseline and trim homepage first-load pressure

**Files:**
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/components/workbench-home.tsx`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/lib/api.ts`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/04_qa_matrix.md`

- [ ] **Step 1: Write down the current measurable baseline before changing code**

Run:

```bash
source ~/.nvm/nvm.sh && cd frontend && npm run build
```

Record the current route output in working notes before editing. The known baseline at planning time is:

```text
/                         First Load JS 152 kB
/matters/[matterId]       First Load JS 174 kB
/tasks/[taskId]           First Load JS 174 kB
/deliverables/[id]        First Load JS 172 kB
/matters/[id]/evidence    First Load JS 164 kB
```

- [ ] **Step 2: Verify the homepage is eagerly firing too many requests**

Read `frontend/src/components/workbench-home.tsx` and confirm the first `useEffect` is triggering all of these on first load:

```tsx
void refreshTasks();
void refreshMatters();
void refreshExtensionManager();
void refreshFirmOperating();
void refreshPhaseFiveClosureReview();
void refreshPhaseSixAudit();
void refreshPhaseSixCloseoutReview();
void refreshPhaseSixCompletionReview();
void refreshPhaseSixClosureCriteria();
void refreshPhaseSixMaturity();
void refreshPhaseSixCalibrationWeighting();
void refreshPhaseSixCalibration();
void refreshPhaseSixDistance();
void refreshPhaseSixGovernance();
void refreshPhaseSixGuidance();
```

Expected:

- this confirms the homepage is trying to do too much work on mount

- [ ] **Step 3: Collapse the homepage into one primary load lane plus deferred secondary lanes**

Refactor `frontend/src/components/workbench-home.tsx` so the first effect eagerly loads only the truly route-defining data:

```tsx
useEffect(() => {
  void refreshTasks();
  void refreshMatters();
  void refreshExtensionManager();
}, []);
```

Then move `firm operating` and the `phase` / `governance` summaries into a second, lower-priority effect:

```tsx
useEffect(() => {
  void refreshFirmOperating();
  void refreshPhaseFiveClosureReview();
  void refreshPhaseSixAudit();
  void refreshPhaseSixCloseoutReview();
  void refreshPhaseSixCompletionReview();
  void refreshPhaseSixClosureCriteria();
  void refreshPhaseSixMaturity();
  void refreshPhaseSixCalibrationWeighting();
  void refreshPhaseSixCalibration();
  void refreshPhaseSixDistance();
  void refreshPhaseSixGovernance();
  void refreshPhaseSixGuidance();
}, []);
```

During implementation, prefer one of these two honest strategies:

- simplest: defer these panels visually and load them after the route-defining content
- stronger: gate some of them behind disclosure or tab open state so they do not all count as first-screen work

- [ ] **Step 4: Keep the homepage loading message tied to route-defining content only**

Adjust the overview loading logic so the page stops feeling blocked by secondary summaries. The main loading gate should track:

```tsx
loading || matterLoading
```

and not wait on every governance-related loading flag before the main overview can be used.

- [ ] **Step 5: Rebuild and compare the route baseline**

Run:

```bash
source ~/.nvm/nvm.sh && cd frontend && npm run build
source ~/.nvm/nvm.sh && cd frontend && npm run typecheck
```

Expected:

- build PASS
- typecheck PASS
- homepage remains on `/`
- the route still works, but the first usable screen is no longer blocked by all secondary summaries loading

- [ ] **Step 6: Append QA evidence only after the build succeeds**

Add a new `docs/04_qa_matrix.md` entry that records:

- the baseline route-size output
- that homepage first-load request pressure was reduced
- what remained deferred or secondary

Then commit:

```bash
git add frontend/src/components/workbench-home.tsx frontend/src/lib/api.ts docs/04_qa_matrix.md
git commit -m "perf: reduce homepage first-load pressure"
```

---

### Task 1: Lock the new visible language and low-noise rules in pure tests

**Files:**
- Create: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/lib/workbench-surface-labels.ts`
- Create: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/tests/low-noise-workbench-repass.test.mjs`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/tests/consultant-usability.test.mjs`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/tests/task-detail-usability.test.mjs`

- [ ] **Step 1: Write the failing label-map test first**

Create `frontend/tests/low-noise-workbench-repass.test.mjs` with:

```javascript
import test from "node:test";
import assert from "node:assert/strict";

import {
  SURFACE_LABELS,
  compressSurfaceCopy,
} from "../src/lib/workbench-surface-labels.ts";

test("surface labels use consultant-facing Traditional Chinese on high-visibility surfaces", () => {
  assert.equal(SURFACE_LABELS.decisionBrief, "決策摘要");
  assert.equal(SURFACE_LABELS.firmOperating, "營運狀態");
  assert.equal(SURFACE_LABELS.phaseFiveClosure, "第五階段收尾");
  assert.equal(SURFACE_LABELS.generalistGovernance, "全面型顧問治理");
  assert.equal(SURFACE_LABELS.personalProviderSettings, "個人模型設定");
  assert.equal(SURFACE_LABELS.firmSettings, "事務所設定");
  assert.equal(SURFACE_LABELS.providerAllowlist, "可用模型來源清單");
  assert.equal(SURFACE_LABELS.firmProviderDefault, "預設模型來源");
  assert.equal(SURFACE_LABELS.demoWorkspace, "示範工作台");
});

test("compressSurfaceCopy keeps first-screen summaries short and single-purpose", () => {
  const result = compressSurfaceCopy(
    "這一頁現在同時在講版本、交付狀態、可信度、限制、採納回饋與寫回流程，容易讓人第一眼抓不到主線。",
  );

  assert.ok(result.length <= 48);
  assert.ok(result.endsWith("..."));
});
```

- [ ] **Step 2: Run the new test to verify RED**

Run:

```bash
source ~/.nvm/nvm.sh && cd frontend && node --test tests/low-noise-workbench-repass.test.mjs
```

Expected:

- FAIL because `workbench-surface-labels.ts` does not exist yet

- [ ] **Step 3: Create the shared visible-label module**

Create `frontend/src/lib/workbench-surface-labels.ts`:

```typescript
export const SURFACE_LABELS = {
  decisionBrief: "決策摘要",
  firmOperating: "營運狀態",
  phaseFiveClosure: "第五階段收尾",
  generalistGovernance: "全面型顧問治理",
  personalProviderSettings: "個人模型設定",
  firmSettings: "事務所設定",
  providerAllowlist: "可用模型來源清單",
  firmProviderDefault: "預設模型來源",
  demoWorkspace: "示範工作台",
} as const;

export function compressSurfaceCopy(copy: string): string {
  const normalized = copy.replace(/\s+/g, " ").trim();
  if (normalized.length <= 48) {
    return normalized;
  }
  return `${normalized.slice(0, 45)}...`;
}
```

- [ ] **Step 4: Update the existing helper tests to the new wording**

Add or update the strongest visible assertions in `frontend/tests/consultant-usability.test.mjs`:

```javascript
assert.equal(view.primaryLabel, "現在先做這件事");
assert.equal(view.sectionGuideTitle, "案件頁怎麼看最快");
assert.match(view.guideDescription, /正確工作面/);
```

Add or update the strongest visible assertions in `frontend/tests/task-detail-usability.test.mjs`:

```javascript
assert.equal(view.primaryLabel, "現在先做這件事");
assert.equal(view.guideTitle, "這頁怎麼讀最快");
assert.match(view.railSummary, /先回/);
```

- [ ] **Step 5: Run the focused frontend helper suite to verify GREEN**

Run:

```bash
source ~/.nvm/nvm.sh && cd frontend && node --test tests/low-noise-workbench-repass.test.mjs tests/consultant-usability.test.mjs tests/task-detail-usability.test.mjs
```

Expected:

- PASS

- [ ] **Step 6: Commit**

```bash
git add frontend/src/lib/workbench-surface-labels.ts frontend/tests/low-noise-workbench-repass.test.mjs frontend/tests/consultant-usability.test.mjs frontend/tests/task-detail-usability.test.mjs
git commit -m "test: lock low-noise workbench wording"
```

---

### Task 2: Repass the deliverable surface first

**Files:**
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/components/deliverable-workspace-panel.tsx`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/lib/consultant-usability.ts`

- [ ] **Step 1: Write the failing test for deliverable first-screen hierarchy**

Extend `frontend/tests/consultant-usability.test.mjs` with:

```javascript
test("deliverable usability guide keeps publish decision ahead of context and evidence", () => {
  const view = buildDeliverableUsabilityView({
    deliverableStatus: "draft",
    hasPendingFormalSave: false,
    hasLinkedEvidence: true,
    hasHighImpactGaps: true,
    hasMatterWorkspace: true,
  });

  assert.equal(view.sectionGuideTitle, "這份交付物怎麼讀最快");
  assert.equal(view.guideItems[0]?.title, "先確認能不能發布");
  assert.equal(view.guideItems[1]?.title, "回看交付摘要");
  assert.equal(view.guideItems[2]?.title, "回看依據來源");
});
```

- [ ] **Step 2: Run the targeted helper suite to verify RED**

Run:

```bash
source ~/.nvm/nvm.sh && cd frontend && node --test tests/consultant-usability.test.mjs
```

Expected:

- FAIL if the current deliverable guide wording or order no longer matches the desired first-screen rule

- [ ] **Step 3: Update the deliverable helper copy to the new low-noise posture**

Adjust `buildDeliverableUsabilityView(...)` in `frontend/src/lib/consultant-usability.ts` so the first three guide items stay:

```typescript
guideItems: [
  {
    href: "#deliverable-publish-check",
    eyebrow: "先決定這一步",
    title: firstActionTitle,
    copy: firstActionCopy,
    tone: "accent",
  },
  {
    href: "#deliverable-reading",
    eyebrow: "要先看內容時",
    title: "回看交付摘要",
    copy: "先確認結論、建議、風險與行動項目是否已經站穩。",
  },
  {
    href: thirdHref,
    eyebrow: "需要依據時",
    title: thirdTitle,
    copy: "只有當你要核對依據或背景，再往下看來源與脈絡。",
  },
];
```

- [ ] **Step 4: Slim down the deliverable first screen in the component**

In `frontend/src/components/deliverable-workspace-panel.tsx`, make these structural edits:

```tsx
<aside className="deliverable-hero-rail">
  <div className="hero-focus-card">
    <p className="hero-focus-label">{deliverableActionTitle}</p>
    <h3 className="hero-focus-title">先決定是整理版本，還是正式發布</h3>
    <p className="hero-focus-copy">{deliverableActionSummary}</p>
  </div>

  <div className="section-card deliverable-rail-card">
    <h4>可信度與適用範圍</h4>
    <p className="content-block">{deliverableConfidenceSurfaceSummary}</p>
  </div>
</aside>
```

Move the adoption / candidate / writeback-heavy content below the first-screen hero:

```tsx
<section className="panel" id="deliverable-adoption-loop">
  <div className="panel-header">
    <div>
      <h2 className="panel-title">採納與寫回</h2>
      <p className="panel-copy">這一層才處理採納回饋、候選狀態與正式寫回，不把它們擠回第一屏主線。</p>
    </div>
  </div>
  {/* keep existing AdoptionFeedbackControls and candidate actions here */}
</section>
```

- [ ] **Step 5: Run the focused frontend suite plus build/typecheck**

Run:

```bash
source ~/.nvm/nvm.sh && cd frontend && node --test tests/consultant-usability.test.mjs tests/low-noise-workbench-repass.test.mjs
source ~/.nvm/nvm.sh && cd frontend && npm run build
source ~/.nvm/nvm.sh && cd frontend && npm run typecheck
```

Expected:

- all tests PASS
- build PASS
- typecheck PASS

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/deliverable-workspace-panel.tsx frontend/src/lib/consultant-usability.ts frontend/tests/consultant-usability.test.mjs frontend/tests/low-noise-workbench-repass.test.mjs
git commit -m "feat: repass deliverable surface hierarchy"
```

---

### Task 3: Repass task and matter around one command path

**Files:**
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/components/task-detail-panel.tsx`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/components/matter-workspace-panel.tsx`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/lib/task-detail-usability.ts`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/lib/consultant-usability.ts`

- [ ] **Step 1: Write the failing task-detail wording test first**

Extend `frontend/tests/task-detail-usability.test.mjs` with:

```javascript
test("task detail keeps one primary question and one handoff reason on the first screen", () => {
  const view = buildTaskDetailUsabilityView({
    hasThinTaskEvidence: false,
    hasLatestDeliverable: true,
    latestDeliverableTitle: "營運收斂版",
    hasMatterWorkspace: true,
    runButtonLabel: "執行分析",
    runDestinationLabel: "執行後回正式交付物。",
    laneTitle: "決策摘要",
    laneSummary: "先把這輪判斷收斂成可核對的決策摘要。",
    readinessLabel: "可直接推進",
    readinessSummary: "目前沒有明顯阻塞。",
    evidenceCount: 3,
    sourceMaterialCount: 2,
    hasResearchGuidance: false,
    researchSummary: "",
    hasContinuationSummary: false,
    continuationSummary: "",
  });

  assert.equal(view.railEyebrow, "決策摘要");
  assert.equal(view.handoffTitle, "先回正式交付物");
  assert.match(view.operatingSummaryTitle, /怎麼推最快/);
});
```

- [ ] **Step 2: Run the targeted task helper suite to verify RED**

Run:

```bash
source ~/.nvm/nvm.sh && cd frontend && node --test tests/task-detail-usability.test.mjs
```

Expected:

- FAIL because the current wording still uses older labels or mixed emphasis

- [ ] **Step 3: Update the task helper and visible wording**

In `frontend/src/lib/task-detail-usability.ts`, change the visible label:

```typescript
railEyebrow: SURFACE_LABELS.decisionBrief,
```

and make the rail/operating summary more direct:

```typescript
guideDescription: "先判斷能不能跑，再決定是直接執行、先補依據，還是回看正式結果。",
operatingSummaryTitle: "這頁現在怎麼推最快",
```

Then in `frontend/src/components/task-detail-panel.tsx`, replace the current visible English:

```tsx
<h3>{decisionBriefView.railEyebrow}</h3>
```

so the surface shows `決策摘要` instead of `Decision Brief`.

- [ ] **Step 4: Re-center the matter first screen on command / blocker / next step**

In `frontend/src/components/matter-workspace-panel.tsx`, keep the hero mainline but trim the rail so the first screen emphasizes:

```tsx
<div className="detail-list" style={{ marginTop: "12px" }}>
  <div className="detail-item">
    <h3>目前最大 blocker</h3>
    <p className="content-block">{heroStateSummary}</p>
  </div>
  <div className="detail-item">
    <h3>下一步最建議做什麼</h3>
    <p className="content-block">{heroNextActionSummary}</p>
  </div>
</div>
```

Move the more explanatory flagship / research / organization-memory blocks down into second-layer sections instead of keeping all of them in the first-screen rail.

- [ ] **Step 5: Run the focused frontend suite plus build/typecheck**

Run:

```bash
source ~/.nvm/nvm.sh && cd frontend && node --test tests/task-detail-usability.test.mjs tests/consultant-usability.test.mjs tests/low-noise-workbench-repass.test.mjs
source ~/.nvm/nvm.sh && cd frontend && npm run build
source ~/.nvm/nvm.sh && cd frontend && npm run typecheck
```

Expected:

- all tests PASS
- build PASS
- typecheck PASS

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/task-detail-panel.tsx frontend/src/components/matter-workspace-panel.tsx frontend/src/lib/task-detail-usability.ts frontend/src/lib/consultant-usability.ts frontend/tests/task-detail-usability.test.mjs frontend/tests/consultant-usability.test.mjs
git commit -m "feat: repass task and matter command surfaces"
```

---

### Task 4: Return overview and settings to simpler route-first surfaces

**Files:**
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/components/workbench-home.tsx`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/components/settings-page-panel.tsx`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/components/settings-firm-provider-panel.tsx`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/components/settings-personal-provider-panel.tsx`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/03_workbench_ux_and_page_spec.md`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/04_qa_matrix.md`

- [ ] **Step 1: Write the failing overview/settings wording test first**

Add this test to `frontend/tests/low-noise-workbench-repass.test.mjs`:

```javascript
test("surface labels expose Chinese settings and governance titles", () => {
  assert.equal(SURFACE_LABELS.firmOperating, "營運狀態");
  assert.equal(SURFACE_LABELS.phaseFiveClosure, "第五階段收尾");
  assert.equal(SURFACE_LABELS.generalistGovernance, "全面型顧問治理");
  assert.equal(SURFACE_LABELS.firmSettings, "事務所設定");
  assert.equal(SURFACE_LABELS.personalProviderSettings, "個人模型設定");
});
```

- [ ] **Step 2: Run the targeted helper suite to verify RED**

Run:

```bash
source ~/.nvm/nvm.sh && cd frontend && node --test tests/low-noise-workbench-repass.test.mjs
```

Expected:

- FAIL if any of the visible labels have not yet been normalized

- [ ] **Step 3: Replace high-visibility English labels in overview and settings**

In `frontend/src/components/workbench-home.tsx`, replace:

```tsx
<h2 className="panel-title">Firm Operating</h2>
<h2 className="panel-title">Phase 5 Closure Review</h2>
<h2 className="panel-title">Generalist Governance</h2>
```

with:

```tsx
<h2 className="panel-title">{SURFACE_LABELS.firmOperating}</h2>
<h2 className="panel-title">{SURFACE_LABELS.phaseFiveClosure}</h2>
<h2 className="panel-title">{SURFACE_LABELS.generalistGovernance}</h2>
```

In settings-related components, replace:

```tsx
<h2 className="panel-title">Firm Settings</h2>
<h2 className="panel-title">Personal Provider Settings</h2>
<h3 className="panel-title">firm provider default</h3>
<h3 className="panel-title">provider allowlist</h3>
```

with:

```tsx
<h2 className="panel-title">{SURFACE_LABELS.firmSettings}</h2>
<h2 className="panel-title">{SURFACE_LABELS.personalProviderSettings}</h2>
<h3 className="panel-title">{SURFACE_LABELS.firmProviderDefault}</h3>
<h3 className="panel-title">{SURFACE_LABELS.providerAllowlist}</h3>
```

- [ ] **Step 4: Update docs before final verification claims**

In `docs/03_workbench_ux_and_page_spec.md`, add or adjust the active rules so they explicitly state:

```md
- high-visibility workbench titles should default to Traditional Chinese on consultant-facing surfaces
- overview should remain route-first and must not drift into a dashboard wall
- deliverable first-screen priority is publish / revise / evidence-check before adoption / governance detail
```

Do not update `docs/04_qa_matrix.md` yet in this step.

- [ ] **Step 5: Run the full planned verification set**

Run:

```bash
source ~/.nvm/nvm.sh && cd frontend && node --test tests/low-noise-workbench-repass.test.mjs tests/consultant-usability.test.mjs tests/task-detail-usability.test.mjs tests/case-command-loop.test.mjs tests/phase-six-governance.test.mjs
source ~/.nvm/nvm.sh && cd frontend && npm run build
source ~/.nvm/nvm.sh && cd frontend && npm run typecheck
git diff --check
```

Expected:

- all tests PASS
- build PASS
- typecheck PASS
- `git diff --check` PASS

- [ ] **Step 6: Append QA evidence and commit**

Append a new entry to `docs/04_qa_matrix.md` only after the commands above succeed. Then commit:

```bash
git add frontend/src/components/workbench-home.tsx frontend/src/components/settings-page-panel.tsx frontend/src/components/settings-firm-provider-panel.tsx frontend/src/components/settings-personal-provider-panel.tsx docs/03_workbench_ux_and_page_spec.md docs/04_qa_matrix.md frontend/tests/low-noise-workbench-repass.test.mjs
git commit -m "feat: repass overview and settings surfaces"
```
