# Owner-Consultant Sparse Diagnostic Cockpit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把既有少資料診斷能力收成第一版 owner-consultant cockpit loop，讓老田能從少量輸入一路走到主線判斷、補資料或執行分析、結果閱讀與 feedback。

**Architecture:** 第一批只做 frontend view-model 與既有 surface 的 first-action tightening，避免重開 backend contract 或 UI 大改。若後續驗收證明需要 backend 補欄位，再另開第二批 backend read-model slice。

**Tech Stack:** Next.js App Router, React/TypeScript, node:test, existing frontend view helpers, active docs under `docs/`

---

## File Structure

- Create: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/lib/owner-consultant-cockpit.ts`
  - Own the sparse diagnostic cockpit loop view model.
- Create: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/tests/owner-consultant-cockpit.test.mjs`
  - Verify the cockpit loop labels, primary actions, fallback actions, and destinations.
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/components/matter-workspace-panel.tsx`
  - Use the cockpit helper when the matter is in sparse diagnostic posture.
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/components/task-detail-panel.tsx`
  - Use the cockpit helper to make sparse diagnostic first action and boundary clearer.
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/components/deliverable-workspace-panel.tsx`
  - Use sparse diagnostic result wording when the deliverable is exploratory.
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/tests/consultant-usability.test.mjs`
  - Add source-level guardrails for first-action wording.
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/tests/low-noise-workbench-repass.test.mjs`
  - Ensure the cockpit loop does not reintroduce noisy first-screen copy.
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/03_workbench_ux_and_page_spec.md`
  - Document the owner-consultant sparse diagnostic cockpit loop.
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/04_qa_matrix.md`
  - Append evidence only after tests/build/browser checks actually run.
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/06_product_alignment_and_85_point_roadmap.md`
  - Record this as the first `Owner-Consultant 85-Point Readiness Push` slice after implementation passes.

---

## Task 1: Add Sparse Diagnostic Cockpit Helper

**Files:**
- Create: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/lib/owner-consultant-cockpit.ts`
- Create: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/tests/owner-consultant-cockpit.test.mjs`

- [ ] **Step 1: Write the failing helper test**

Create `frontend/tests/owner-consultant-cockpit.test.mjs`:

```js
import assert from "node:assert/strict";
import test from "node:test";

import {
  buildSparseDiagnosticCockpitView,
  isSparseDiagnosticLane,
} from "../src/lib/owner-consultant-cockpit.ts";

test("sparse diagnostic lane detection accepts diagnostic_start only", () => {
  assert.equal(isSparseDiagnosticLane("diagnostic_start"), true);
  assert.equal(isSparseDiagnosticLane("material_review_start"), false);
  assert.equal(isSparseDiagnosticLane("decision_convergence_start"), false);
  assert.equal(isSparseDiagnosticLane(""), false);
  assert.equal(isSparseDiagnosticLane(undefined), false);
});

test("sparse diagnostic cockpit view gives one owner-consultant loop", () => {
  const view = buildSparseDiagnosticCockpitView({
    laneId: "diagnostic_start",
    surface: "matter",
    evidenceCount: 0,
    hasDeliverable: false,
    canRun: true,
  });

  assert.equal(view.statusLabel, "少資料快速診斷");
  assert.equal(view.primaryActionLabel, "先跑一輪探索分析");
  assert.equal(view.primaryHref, "#task-mainline");
  assert.equal(view.secondaryActionLabel, "先補一份關鍵資料");
  assert.equal(view.secondaryHref, "#matter-evidence");
  assert.match(view.boundaryNote, /探索型判斷/);
  assert.equal(view.loopSteps.length, 5);
});

test("sparse diagnostic cockpit view points to evidence when run is blocked", () => {
  const view = buildSparseDiagnosticCockpitView({
    laneId: "diagnostic_start",
    surface: "task",
    evidenceCount: 0,
    hasDeliverable: false,
    canRun: false,
  });

  assert.equal(view.primaryActionLabel, "先補關鍵資料");
  assert.equal(view.primaryHref, "#evidence-readiness");
  assert.match(view.blockerSummary, /資料仍偏少/);
});

test("sparse diagnostic cockpit view points to result when deliverable exists", () => {
  const view = buildSparseDiagnosticCockpitView({
    laneId: "diagnostic_start",
    surface: "deliverable",
    evidenceCount: 2,
    hasDeliverable: true,
    canRun: true,
  });

  assert.equal(view.primaryActionLabel, "先看這份結果能不能用");
  assert.equal(view.primaryHref, "#deliverable-main");
  assert.equal(view.feedbackPrompt, "這份結果對你有幫助嗎？");
});
```

- [ ] **Step 2: Run the helper test and confirm RED**

Run:

```bash
source ~/.nvm/nvm.sh && cd frontend && node --test tests/owner-consultant-cockpit.test.mjs
```

Expected:

```text
not ok
ERR_MODULE_NOT_FOUND
```

- [ ] **Step 3: Implement the helper**

Create `frontend/src/lib/owner-consultant-cockpit.ts`:

```ts
export type SparseDiagnosticSurface = "matter" | "task" | "evidence" | "deliverable";

export type SparseDiagnosticCockpitInput = {
  laneId?: string | null;
  surface: SparseDiagnosticSurface;
  evidenceCount?: number | null;
  hasDeliverable?: boolean | null;
  canRun?: boolean | null;
};

export type SparseDiagnosticCockpitStep = {
  label: string;
  summary: string;
  href: string;
};

export type SparseDiagnosticCockpitView = {
  active: boolean;
  statusLabel: string;
  mainlineSummary: string;
  blockerSummary: string;
  boundaryNote: string;
  primaryActionLabel: string;
  primaryHref: string;
  secondaryActionLabel: string;
  secondaryHref: string;
  feedbackPrompt: string;
  loopSteps: SparseDiagnosticCockpitStep[];
};

export function isSparseDiagnosticLane(laneId?: string | null): boolean {
  return laneId === "diagnostic_start";
}

export function buildSparseDiagnosticCockpitView(
  input: SparseDiagnosticCockpitInput,
): SparseDiagnosticCockpitView {
  const evidenceCount = Math.max(0, input.evidenceCount ?? 0);
  const hasDeliverable = Boolean(input.hasDeliverable);
  const canRun = input.canRun !== false;
  const active = isSparseDiagnosticLane(input.laneId);
  const evidenceIsThin = evidenceCount < 1;

  let primaryActionLabel = "先跑一輪探索分析";
  let primaryHref = input.surface === "task" ? "#run-panel" : "#task-mainline";
  let secondaryActionLabel = "先補一份關鍵資料";
  let secondaryHref = input.surface === "matter" ? "#matter-evidence" : "#evidence-readiness";
  let blockerSummary = evidenceIsThin
    ? "資料仍偏少，這輪先適合釐清問題主線與下一步。"
    : "已有最小資料基礎，可以先跑探索分析，再決定是否補強。";

  if (!canRun) {
    primaryActionLabel = "先補關鍵資料";
    primaryHref = "#evidence-readiness";
    secondaryActionLabel = "回案件主控台";
    secondaryHref = "#matter-mainline";
    blockerSummary = "資料仍偏少，先補一份關鍵資料會比直接跑分析更穩。";
  }

  if (hasDeliverable) {
    primaryActionLabel = "先看這份結果能不能用";
    primaryHref = "#deliverable-main";
    secondaryActionLabel = "回到案件下一步";
    secondaryHref = "#matter-mainline";
    blockerSummary = "已形成第一版結果，現在重點是判斷能不能採用、要不要補資料或延續。";
  }

  return {
    active,
    statusLabel: "少資料快速診斷",
    mainlineSummary: "先用少量資訊看清問題主線、最大限制與下一步，不急著假裝已經能正式定案。",
    blockerSummary,
    boundaryNote: "這輪先定位為探索型判斷；若要升級成正式決策或行動交付，仍需要補強來源與證據。",
    primaryActionLabel,
    primaryHref,
    secondaryActionLabel,
    secondaryHref,
    feedbackPrompt: "這份結果對你有幫助嗎？",
    loopSteps: [
      { label: "起案", summary: "用少量文字說清目前問題。", href: "/new" },
      { label: "看主線", summary: "先看案件主控台給出的主線、限制與下一步。", href: "#matter-mainline" },
      { label: "補資料或先跑", summary: "依目前資料厚度決定先補關鍵資料或先跑探索分析。", href: primaryHref },
      { label: "看結果", summary: "用結果與報告判斷這輪是否能採用。", href: "#deliverable-main" },
      { label: "給回饋", summary: "用低負擔回饋讓系統知道這次判斷是否有用。", href: "#adoption-feedback" },
    ],
  };
}
```

- [ ] **Step 4: Run the helper test and confirm GREEN**

Run:

```bash
source ~/.nvm/nvm.sh && cd frontend && node --test tests/owner-consultant-cockpit.test.mjs
```

Expected:

```text
# tests 4
# pass 4
```

- [ ] **Step 5: Commit Task 1**

Run:

```bash
git add frontend/src/lib/owner-consultant-cockpit.ts frontend/tests/owner-consultant-cockpit.test.mjs
git commit -m "feat: add sparse diagnostic cockpit helper"
```

---

## Task 2: Tighten Matter And Task First Actions

**Files:**
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/components/matter-workspace-panel.tsx`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/components/task-detail-panel.tsx`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/tests/consultant-usability.test.mjs`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/tests/low-noise-workbench-repass.test.mjs`

- [ ] **Step 1: Add source-level tests for sparse diagnostic cockpit copy**

Add this test to `frontend/tests/consultant-usability.test.mjs`:

```js
test("owner-consultant sparse diagnostic cockpit copy stays action-first", () => {
  const matterSource = readFileSync(
    new URL("../src/components/matter-workspace-panel.tsx", import.meta.url),
    "utf8",
  );
  const taskSource = readFileSync(
    new URL("../src/components/task-detail-panel.tsx", import.meta.url),
    "utf8",
  );

  assert.match(matterSource, /少資料快速診斷/);
  assert.match(matterSource, /先用少量資訊看清問題主線/);
  assert.match(taskSource, /探索型判斷/);
  assert.match(taskSource, /先補關鍵資料|先跑一輪探索分析/);
  assert.doesNotMatch(matterSource, /sparse inquiry|diagnostic_start/);
  assert.doesNotMatch(taskSource, /sparse inquiry|diagnostic_start/);
});
```

- [ ] **Step 2: Run the source test and confirm RED**

Run:

```bash
source ~/.nvm/nvm.sh && cd frontend && node --test tests/consultant-usability.test.mjs
```

Expected:

```text
not ok
```

because the source does not yet render the new cockpit copy.

- [ ] **Step 3: Wire matter first-screen copy to the helper**

In `frontend/src/components/matter-workspace-panel.tsx`, import the helper:

```ts
import { buildSparseDiagnosticCockpitView } from "@/lib/owner-consultant-cockpit";
```

Near the existing matter command / flagship lane view model setup, create:

```ts
const sparseDiagnosticCockpit = buildSparseDiagnosticCockpitView({
  laneId: matter.flagship_lane?.lane_id,
  surface: "matter",
  evidenceCount: evidenceCount,
  hasDeliverable: deliverableCount > 0,
  canRun: true,
});
```

Then in the existing first-screen mainline area, render a small low-noise block only when active:

```tsx
{sparseDiagnosticCockpit.active ? (
  <div className="surface-highlight-card">
    <span className="eyebrow">{sparseDiagnosticCockpit.statusLabel}</span>
    <h3>{sparseDiagnosticCockpit.mainlineSummary}</h3>
    <p>{sparseDiagnosticCockpit.blockerSummary}</p>
    <div className="button-row">
      <a className="button button-primary" href={sparseDiagnosticCockpit.primaryHref}>
        {sparseDiagnosticCockpit.primaryActionLabel}
      </a>
      <a className="button button-secondary" href={sparseDiagnosticCockpit.secondaryHref}>
        {sparseDiagnosticCockpit.secondaryActionLabel}
      </a>
    </div>
  </div>
) : null}
```

Use existing class names if the surrounding component already has more appropriate card/button classes; do not introduce a new visual system.

- [ ] **Step 4: Wire task first-screen copy to the helper**

In `frontend/src/components/task-detail-panel.tsx`, import:

```ts
import { buildSparseDiagnosticCockpitView } from "@/lib/owner-consultant-cockpit";
```

Near existing `sparseInputOperatingView` / usability view setup, create:

```ts
const sparseDiagnosticCockpit = buildSparseDiagnosticCockpitView({
  laneId: task.flagship_lane?.lane_id,
  surface: "task",
  evidenceCount: evidenceCount,
  hasDeliverable: Boolean(latestDeliverable),
  canRun: canRunTask,
});
```

In the first-screen / operating summary area, render:

```tsx
{sparseDiagnosticCockpit.active ? (
  <div className="surface-highlight-card">
    <span className="eyebrow">{sparseDiagnosticCockpit.statusLabel}</span>
    <h3>{sparseDiagnosticCockpit.primaryActionLabel}</h3>
    <p>{sparseDiagnosticCockpit.boundaryNote}</p>
  </div>
) : null}
```

Keep this block low-noise. If the page already has a better place for sparse diagnostic guidance, place it there instead of creating duplicate first-screen guidance.

- [ ] **Step 5: Run focused frontend tests**

Run:

```bash
source ~/.nvm/nvm.sh && cd frontend && node --test tests/owner-consultant-cockpit.test.mjs tests/consultant-usability.test.mjs tests/low-noise-workbench-repass.test.mjs tests/task-detail-usability.test.mjs
```

Expected:

```text
# fail 0
```

- [ ] **Step 6: Commit Task 2**

Run:

```bash
git add frontend/src/components/matter-workspace-panel.tsx frontend/src/components/task-detail-panel.tsx frontend/tests/consultant-usability.test.mjs frontend/tests/low-noise-workbench-repass.test.mjs
git commit -m "feat: tighten sparse diagnostic first actions"
```

---

## Task 3: Tighten Result And Feedback Loop

**Files:**
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/components/deliverable-workspace-panel.tsx`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/tests/consultant-usability.test.mjs`

- [ ] **Step 1: Add source-level test for sparse diagnostic result copy**

Add this test to `frontend/tests/consultant-usability.test.mjs`:

```js
test("sparse diagnostic result copy keeps result boundary and feedback close to reading", () => {
  const source = readFileSync(
    new URL("../src/components/deliverable-workspace-panel.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /這份結果能不能用|這份結果對你有幫助嗎/);
  assert.match(source, /探索型判斷/);
  assert.doesNotMatch(source, /diagnostic_start|sparse inquiry/);
});
```

- [ ] **Step 2: Run and confirm RED**

Run:

```bash
source ~/.nvm/nvm.sh && cd frontend && node --test tests/consultant-usability.test.mjs
```

Expected:

```text
not ok
```

- [ ] **Step 3: Add sparse diagnostic result copy**

In `frontend/src/components/deliverable-workspace-panel.tsx`, import:

```ts
import { buildSparseDiagnosticCockpitView } from "@/lib/owner-consultant-cockpit";
```

Near existing deliverable usability / task aggregate setup, create:

```ts
const sparseDiagnosticCockpit = buildSparseDiagnosticCockpitView({
  laneId: task?.flagship_lane?.lane_id,
  surface: "deliverable",
  evidenceCount: task?.evidence?.length ?? 0,
  hasDeliverable: true,
  canRun: true,
});
```

Near the existing result summary or adoption feedback area, render:

```tsx
{sparseDiagnosticCockpit.active ? (
  <div className="surface-highlight-card">
    <span className="eyebrow">{sparseDiagnosticCockpit.statusLabel}</span>
    <h3>先判斷這份結果能不能用</h3>
    <p>{sparseDiagnosticCockpit.boundaryNote}</p>
    <p>{sparseDiagnosticCockpit.feedbackPrompt}</p>
  </div>
) : null}
```

Do not add a second feedback form. This is only copy / guidance near the existing adoption feedback controls.

- [ ] **Step 4: Run focused frontend tests**

Run:

```bash
source ~/.nvm/nvm.sh && cd frontend && node --test tests/owner-consultant-cockpit.test.mjs tests/consultant-usability.test.mjs tests/low-noise-workbench-repass.test.mjs
```

Expected:

```text
# fail 0
```

- [ ] **Step 5: Commit Task 3**

Run:

```bash
git add frontend/src/components/deliverable-workspace-panel.tsx frontend/tests/consultant-usability.test.mjs
git commit -m "feat: clarify sparse diagnostic result feedback loop"
```

---

## Task 4: Docs And Verification Closure

**Files:**
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/03_workbench_ux_and_page_spec.md`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/04_qa_matrix.md`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/06_product_alignment_and_85_point_roadmap.md`

- [ ] **Step 1: Update UX spec**

In `docs/03_workbench_ux_and_page_spec.md`, add a short subsection under sparse-start / first-screen rules:

```md
### Owner-consultant sparse diagnostic cockpit

For `diagnostic_start`, the first owner-consultant readiness slice treats `/new -> matter -> task -> evidence -> deliverable -> feedback` as one loop.

The first layer must answer:

- this is a sparse diagnostic, not a formal decision yet
- the current mainline and biggest blocker
- whether to run exploratory analysis or fill one key evidence gap first
- what the result can safely be used for
- how feedback returns to the system without adding governance burden
```

- [ ] **Step 2: Update roadmap**

In `docs/06_product_alignment_and_85_point_roadmap.md`, under the owner-consultant 85-point direction, add:

```md
The first approved owner-consultant cockpit slice is `sparse diagnostic cockpit`.

It targets:

- `G consultant usability`
- `F product maturity`

It does not claim all G/F gaps are closed. It only proves the first owner-consultant real-work loop for sparse diagnostic cases.
```

- [ ] **Step 3: Run full frontend gates**

Run:

```bash
source ~/.nvm/nvm.sh && cd frontend && node --test tests/*.test.mjs
source ~/.nvm/nvm.sh && cd frontend && npm run build
source ~/.nvm/nvm.sh && cd frontend && npm run typecheck
```

Expected:

```text
all node tests pass
build succeeds
typecheck succeeds
```

- [ ] **Step 4: Run backend smoke if backend was untouched**

Because this plan does not modify backend, run the narrow existing sparse diagnostic backend test only as confidence proof:

```bash
PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -k "sparse_input or consulting_scaffold or diagnostic_start" -q
```

Expected:

```text
passed
```

- [ ] **Step 5: Append QA evidence**

Append one entry to `docs/04_qa_matrix.md` only after the commands above actually run:

```md
## Entry: 2026-05-03 owner-consultant sparse diagnostic cockpit

Scope:
- first owner-consultant 85-point readiness slice
- sparse diagnostic cockpit loop
- frontend first-action tightening across matter / task / deliverable

### Verification

| Check | Result |
| --- | --- |
| `source ~/.nvm/nvm.sh && cd frontend && node --test tests/*.test.mjs` | Passed |
| `source ~/.nvm/nvm.sh && cd frontend && npm run build` | Passed |
| `source ~/.nvm/nvm.sh && cd frontend && npm run typecheck` | Passed |
| `PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -k "sparse_input or consulting_scaffold or diagnostic_start" -q` | Passed |

### Verified outcomes

- sparse diagnostic owner-consultant loop now has a shared frontend view helper
- matter / task / deliverable first-action copy is aligned to one loop
- sparse diagnostic result reading keeps exploratory boundary visible

### Verification boundary

- this entry does not claim G or F reached 85
- authenticated browser walkthrough remains a separate owner-confirmed gate
```

- [ ] **Step 6: Commit Task 4**

Run:

```bash
git add docs/03_workbench_ux_and_page_spec.md docs/04_qa_matrix.md docs/06_product_alignment_and_85_point_roadmap.md
git commit -m "docs: record sparse diagnostic cockpit slice"
```

---

## Self-Review Checklist

- [x] Spec coverage: Tasks 1-4 cover loop helper, matter/task action tightening, result/feedback close loop, docs/QA closure.
- [x] Scope control: no backend contract changes in first slice.
- [x] Architecture guardrails: no new dashboard family, no new architecture layer, no UI-owned workflow orchestration.
- [x] Testing: focused node tests first, then full frontend gates, then backend sparse confidence test.
- [x] QA honesty: QA matrix only updated after real commands run.

---

## Execution Options

Plan complete and saved to `docs/superpowers/plans/2026-05-03-owner-consultant-sparse-diagnostic-cockpit.md`.

Two execution options:

1. **Subagent-Driven (recommended)** - dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** - execute tasks in this session using executing-plans, batch execution with checkpoints.

Because this plan touches shared first-screen UX surfaces, the recommended path is Subagent-Driven with human review before code execution.
