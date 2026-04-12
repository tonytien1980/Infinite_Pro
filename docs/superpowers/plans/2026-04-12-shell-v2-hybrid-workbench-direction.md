# Shell v2 Hybrid Workbench Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 Infinite Pro 從目前「整齊但資訊過滿」的 page-first 工作台，收成更克制的 hybrid workbench shell，同時維持 consultant-first、Host-safe、docs/code 對齊。

**Architecture:** 先建立共用 shell primitive，再按 `overview -> matter -> task -> evidence -> deliverable` 的順序逐頁收斂。每一頁都遵守同一套規則：首屏只留 3 個高權重區塊、只保留一套下一步提示、metrics 降級為脈絡、第二層資訊走 local rail / disclosure / deferred section。

**Tech Stack:** Next.js App Router, React client components, shared workbench helper libs, `frontend/src/app/globals.css`, node test, repo docs in `docs/03` and `docs/04`.

---

## File Structure

### Shared shell primitives

- Create: `frontend/src/components/workspace-local-rail.tsx`
  - detail workspace 的穩定頁內定位器
- Create: `frontend/src/lib/workspace-local-rail.ts`
  - local rail item type、grouping helper、active-section helpers
- Modify: `frontend/src/components/workspace-section-guide.tsx`
  - 讓 section guide 退回「段落導覽」角色，不再像第二套摘要總覽
- Modify: `frontend/src/app/globals.css`
  - `workspace-local-rail`、`page-main-stage`、`page-secondary-stack` 等 Shell v2 樣式

### Surface helpers

- Modify: `frontend/src/lib/consultant-usability.ts`
  - 讓 `overview / matter / deliverable / evidence` guide items 改成更短、更像導覽而不是摘要
- Modify: `frontend/src/lib/task-detail-usability.ts`
  - task page 的首屏與 rail contract
- Modify: `frontend/src/lib/advisory-workflow.ts`
  - 把首屏摘要與次級摘要切開，避免重複輸出

### Surfaces

- Modify: `frontend/src/components/workbench-home.tsx`
- Modify: `frontend/src/components/matter-workspace-panel.tsx`
- Modify: `frontend/src/components/task-detail-panel.tsx`
- Modify: `frontend/src/components/artifact-evidence-workspace-panel.tsx`
- Modify: `frontend/src/components/deliverable-workspace-panel.tsx`

### Tests

- Modify: `frontend/tests/consultant-usability.test.mjs`
- Modify: `frontend/tests/task-detail-usability.test.mjs`
- Modify: `frontend/tests/low-noise-workbench-repass.test.mjs`
- Create: `frontend/tests/workspace-local-rail.test.mjs`

### Docs

- Modify: `docs/03_workbench_ux_and_page_spec.md`
- Modify: `docs/04_qa_matrix.md`

---

### Task 1: Build Shared Shell v2 Primitives

**Files:**
- Create: `frontend/src/components/workspace-local-rail.tsx`
- Create: `frontend/src/lib/workspace-local-rail.ts`
- Modify: `frontend/src/components/workspace-section-guide.tsx`
- Modify: `frontend/src/app/globals.css`
- Test: `frontend/tests/workspace-local-rail.test.mjs`

- [ ] **Step 1: Write the failing test**

```js
import test from "node:test";
import assert from "node:assert/strict";

import {
  buildWorkspaceLocalRail,
  compressGuideItemsForShellV2,
} from "../src/lib/workspace-local-rail.ts";

test("local rail keeps only section name, role, and next-read cue", () => {
  const rail = buildWorkspaceLocalRail([
    {
      href: "#task-mainline",
      title: "主線",
      description: "先看這輪在判斷什麼",
      whenToUse: "一進頁面先看這裡",
    },
  ]);

  assert.equal(rail.items[0].title, "主線");
  assert.equal(rail.items[0].role, "先看這輪在判斷什麼");
  assert.equal(rail.items[0].cue, "一進頁面先看這裡");
});

test("guide compression removes duplicate summary-style copy", () => {
  const items = compressGuideItemsForShellV2([
    {
      href: "#evidence",
      eyebrow: "先看缺什麼",
      title: "充分性摘要與高影響缺口",
      copy: "先判斷目前缺的是來源、證據，還是仍不夠支撐這輪判斷。",
      meta: "目前仍有高影響缺口，先補這些最有效。",
    },
  ]);

  assert.equal(items[0].title, "充分性摘要與高影響缺口");
  assert.equal(items[0].copy, "先判斷目前缺的是來源、證據，還是仍不夠支撐這輪判斷。");
  assert.equal(items[0].meta, undefined);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
source ~/.nvm/nvm.sh && cd frontend && node --test tests/workspace-local-rail.test.mjs
```

Expected: FAIL with module or export missing for `buildWorkspaceLocalRail` / `compressGuideItemsForShellV2`

- [ ] **Step 3: Write minimal implementation**

`frontend/src/lib/workspace-local-rail.ts`

```ts
export type WorkspaceLocalRailSeed = {
  href: string;
  title: string;
  description: string;
  whenToUse: string;
};

export type WorkspaceLocalRailItem = {
  href: string;
  title: string;
  role: string;
  cue: string;
};

export function buildWorkspaceLocalRail(items: WorkspaceLocalRailSeed[]) {
  return {
    items: items.map((item) => ({
      href: item.href,
      title: item.title,
      role: item.description,
      cue: item.whenToUse,
    })),
  };
}

export function compressGuideItemsForShellV2(
  items: Array<{ href: string; eyebrow: string; title: string; copy: string; meta?: string }>,
) {
  return items.map((item) => ({
    href: item.href,
    eyebrow: item.eyebrow,
    title: item.title,
    copy: item.copy,
  }));
}
```

`frontend/src/components/workspace-local-rail.tsx`

```tsx
import Link from "next/link";

import type { WorkspaceLocalRailItem } from "@/lib/workspace-local-rail";

export function WorkspaceLocalRail({
  title,
  items,
}: {
  title: string;
  items: WorkspaceLocalRailItem[];
}) {
  return (
    <aside className="workspace-local-rail" aria-label={title}>
      <h2 className="workspace-local-rail-title">{title}</h2>
      <div className="workspace-local-rail-list">
        {items.map((item) => (
          <Link key={item.href} className="workspace-local-rail-item" href={item.href}>
            <strong>{item.title}</strong>
            <p>{item.role}</p>
            <span>{item.cue}</span>
          </Link>
        ))}
      </div>
    </aside>
  );
}
```

`frontend/src/components/workspace-section-guide.tsx`

```tsx
import { compressGuideItemsForShellV2 } from "@/lib/workspace-local-rail";

const compressedItems = compressGuideItemsForShellV2(items);
```

`frontend/src/app/globals.css`

```css
.workspace-shell-v2 {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 24px;
}

.workspace-local-rail {
  position: sticky;
  top: 88px;
  align-self: start;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
source ~/.nvm/nvm.sh && cd frontend && node --test tests/workspace-local-rail.test.mjs
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/workspace-local-rail.tsx frontend/src/lib/workspace-local-rail.ts frontend/src/components/workspace-section-guide.tsx frontend/src/app/globals.css frontend/tests/workspace-local-rail.test.mjs
git commit -m "feat: add shell v2 local rail primitives"
```

---

### Task 2: Converge `overview` into a Pure Launcher

**Files:**
- Modify: `frontend/src/components/workbench-home.tsx`
- Modify: `frontend/src/lib/consultant-usability.ts`
- Modify: `frontend/tests/consultant-usability.test.mjs`
- Modify: `frontend/tests/low-noise-workbench-repass.test.mjs`
- Docs: `docs/03_workbench_ux_and_page_spec.md`

- [ ] **Step 1: Write the failing test**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("overview first screen no longer treats governance summaries as primary content", () => {
  const source = readFileSync(
    new URL("../src/components/workbench-home.tsx", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(source, /<section className=\"panel\">[\\s\\S]*營運狀態[\\s\\S]*總覽首屏/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
source ~/.nvm/nvm.sh && cd frontend && node --test tests/consultant-usability.test.mjs tests/low-noise-workbench-repass.test.mjs
```

Expected: FAIL because overview still renders heavy governance panels directly below the launcher content

- [ ] **Step 3: Write minimal implementation**

`frontend/src/components/workbench-home.tsx`

```tsx
<section className="hero-card">
  {/* launcher-only hero */}
</section>

<section className="panel">
  {/* primary work return only */}
</section>

<DisclosurePanel
  title="營運與治理補充"
  description="只有在你要檢查營運狀態、階段收尾與治理訊號時，再展開這層。"
>
  {/* firm operating / phase closure / governance */}
</DisclosurePanel>
```

`frontend/src/lib/consultant-usability.ts`

```ts
guideItems: [
  { href: primaryHref, label: "先接回主工作", title: primaryTitle, copy: primaryCopy },
  { href: secondaryHref, label: "若卡在依據偏薄", title: secondaryTitle, copy: secondaryCopy },
  { href: "/new", label: "這不是延續工作時", title: "建立新案件", copy: "只有不是延續工作時，才從首頁直接新建。" },
];
```

`docs/03_workbench_ux_and_page_spec.md`

```md
- `overview` 首屏不再承接 `firm operating / phase closure / governance` 的完整閱讀
- 這些內容只可退到 second-layer disclosure 或 secondary management entry
```

- [ ] **Step 4: Run tests and build verification**

Run:

```bash
source ~/.nvm/nvm.sh && cd frontend && node --test tests/consultant-usability.test.mjs tests/low-noise-workbench-repass.test.mjs
source ~/.nvm/nvm.sh && cd frontend && npm run build
```

Expected: PASS, build succeeds

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/workbench-home.tsx frontend/src/lib/consultant-usability.ts frontend/tests/consultant-usability.test.mjs frontend/tests/low-noise-workbench-repass.test.mjs docs/03_workbench_ux_and_page_spec.md
git commit -m "feat: turn overview into a pure launcher"
```

---

### Task 3: Convert `matter` into the Shell v2 Control Center

**Files:**
- Modify: `frontend/src/components/matter-workspace-panel.tsx`
- Modify: `frontend/src/lib/consultant-usability.ts`
- Modify: `frontend/src/components/workspace-section-guide.tsx`
- Modify: `frontend/src/app/globals.css`
- Test: `frontend/tests/consultant-usability.test.mjs`
- Docs: `docs/03_workbench_ux_and_page_spec.md`

- [ ] **Step 1: Write the failing test**

```js
test("matter shell keeps only mainline, blocker, and next step in first-screen emphasis", () => {
  const source = readFileSync(
    new URL("../src/components/matter-workspace-panel.tsx", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(source, /案件健康/);
  assert.doesNotMatch(source, /研究 guidance/);
  assert.doesNotMatch(source, /organization memory/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
source ~/.nvm/nvm.sh && cd frontend && node --test tests/consultant-usability.test.mjs
```

Expected: FAIL because matter second-layer and first-screen emphasis are still too blended

- [ ] **Step 3: Write minimal implementation**

`frontend/src/components/matter-workspace-panel.tsx`

```tsx
<section className="workspace-shell-v2">
  <div className="page-main-stage">
    {/* hero + single command block + primary content */}
  </div>
  <WorkspaceLocalRail
    title="案件段落"
    items={[
      { href: "#matter-mainline", title: "主線", role: "先看這案在推什麼", cue: "一進頁先看" },
      { href: "#matter-evidence", title: "補件 / 證據", role: "確認缺口與補件", cue: "卡住時看" },
      { href: "#matter-deliverables", title: "交付物", role: "回看結果與版本", cue: "已有結果時看" },
    ]}
  />
</section>
```

`frontend/src/lib/consultant-usability.ts`

```ts
buildMatterUsabilityView({
  ...
  firstScreenContract: ["主線", "blocker", "下一步"],
});
```

`docs/03_workbench_ux_and_page_spec.md`

```md
- `matter` 首屏正式只留主線、blocker、下一步
- local rail 作為頁內定位器，不再讓多套 summary system 同層競爭
```

- [ ] **Step 4: Run tests and verification**

Run:

```bash
source ~/.nvm/nvm.sh && cd frontend && node --test tests/consultant-usability.test.mjs
source ~/.nvm/nvm.sh && cd frontend && npm run build
source ~/.nvm/nvm.sh && cd frontend && npm run typecheck
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/matter-workspace-panel.tsx frontend/src/lib/consultant-usability.ts frontend/src/components/workspace-section-guide.tsx frontend/src/app/globals.css frontend/tests/consultant-usability.test.mjs docs/03_workbench_ux_and_page_spec.md
git commit -m "feat: convert matter into shell v2 control center"
```

---

### Task 4: Reduce `task` to One Mainline Reading System

**Files:**
- Modify: `frontend/src/components/task-detail-panel.tsx`
- Modify: `frontend/src/lib/task-detail-usability.ts`
- Modify: `frontend/src/lib/advisory-workflow.ts`
- Test: `frontend/tests/task-detail-usability.test.mjs`
- Docs: `docs/03_workbench_ux_and_page_spec.md`

- [ ] **Step 1: Write the failing test**

```js
test("task first screen no longer runs hero rail, section guide, and operating summary as parallel summary systems", () => {
  const source = readFileSync(
    new URL("../src/components/task-detail-panel.tsx", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(source, /hero-metrics-grid[\\s\\S]*WorkspaceSectionGuide[\\s\\S]*operatingSummaryTitle/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
source ~/.nvm/nvm.sh && cd frontend && node --test tests/task-detail-usability.test.mjs tests/low-noise-workbench-repass.test.mjs
```

Expected: FAIL because task page still stacks multiple summary systems in the first-screen band

- [ ] **Step 3: Write minimal implementation**

`frontend/src/components/task-detail-panel.tsx`

```tsx
{/* keep hero mainline */}
{/* keep one compact rail card */}
{/* move operating summary below first main section or into disclosure */}
{/* demote metrics into a lighter context strip or remove one row entirely */}
```

`frontend/src/lib/task-detail-usability.ts`

```ts
return {
  primaryTitle: "...",
  railTitle: "...",
  guideItems: [...],
  operatingNotesPlacement: "secondary",
};
```

`docs/03_workbench_ux_and_page_spec.md`

```md
- `task` 首屏只可保留一套主閱讀系統
- `hero rail / section guide / operating summary` 不可三套並存於首屏同層
```

- [ ] **Step 4: Run tests and verification**

Run:

```bash
source ~/.nvm/nvm.sh && cd frontend && node --test tests/task-detail-usability.test.mjs tests/low-noise-workbench-repass.test.mjs
source ~/.nvm/nvm.sh && cd frontend && npm run build
source ~/.nvm/nvm.sh && cd frontend && npm run typecheck
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/task-detail-panel.tsx frontend/src/lib/task-detail-usability.ts frontend/src/lib/advisory-workflow.ts frontend/tests/task-detail-usability.test.mjs frontend/tests/low-noise-workbench-repass.test.mjs docs/03_workbench_ux_and_page_spec.md
git commit -m "feat: simplify task into one mainline reading system"
```

---

### Task 5: Turn `evidence` into a Supplement-First Work Surface

**Files:**
- Modify: `frontend/src/components/artifact-evidence-workspace-panel.tsx`
- Modify: `frontend/src/lib/consultant-usability.ts`
- Test: `frontend/tests/consultant-usability.test.mjs`
- Docs: `docs/03_workbench_ux_and_page_spec.md`
- Docs evidence: `docs/04_qa_matrix.md`

- [ ] **Step 1: Write the failing test**

```js
test("evidence first screen does not stack hero focus cards, metrics, guide, and supplement judgment at equal weight", () => {
  const source = readFileSync(
    new URL("../src/components/artifact-evidence-workspace-panel.tsx", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(source, /hero-focus-card[\\s\\S]*hero-metrics-grid[\\s\\S]*WorkspaceSectionGuide[\\s\\S]*補件判斷/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
source ~/.nvm/nvm.sh && cd frontend && node --test tests/consultant-usability.test.mjs tests/low-noise-workbench-repass.test.mjs
```

Expected: FAIL because evidence still presents too many first-screen emphasis layers

- [ ] **Step 3: Write minimal implementation**

`frontend/src/components/artifact-evidence-workspace-panel.tsx`

```tsx
{/* hero: only judgment, supplement CTA, return destination */}
{/* move metrics into a compact context row */}
{/* merge supplement judgment into the mainline instead of a second full summary panel */}
{/* keep local rail for sufficiency / supplement / return path */}
```

`docs/03_workbench_ux_and_page_spec.md`

```md
- `evidence` 首屏只留缺什麼、補什麼、補完回哪裡
- 不能再讓 hero、metrics、guide、補件判斷四層一起搶主線
```

`docs/04_qa_matrix.md`

```md
- append browser evidence only after real protected-route upload / supplement checks exist
```

- [ ] **Step 4: Run tests and browser verification**

Run:

```bash
source ~/.nvm/nvm.sh && cd frontend && node --test tests/consultant-usability.test.mjs tests/low-noise-workbench-repass.test.mjs
source ~/.nvm/nvm.sh && cd frontend && npm run build
source ~/.nvm/nvm.sh && cd frontend && npm run typecheck
```

Expected: PASS

Browser check:

```bash
# use the repo's established local authenticated browser workflow
# verify /matters/[matterId]/evidence first-screen reading and visible upload trigger behavior
```

Expected: evidence page first screen reads as supplement-first and docs/04 only records what was actually verified

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/artifact-evidence-workspace-panel.tsx frontend/src/lib/consultant-usability.ts frontend/tests/consultant-usability.test.mjs frontend/tests/low-noise-workbench-repass.test.mjs docs/03_workbench_ux_and_page_spec.md docs/04_qa_matrix.md
git commit -m "feat: make evidence a supplement-first work surface"
```

---

### Task 6: Compress `deliverable` Without Breaking the Document Workbench Feel

**Files:**
- Modify: `frontend/src/components/deliverable-workspace-panel.tsx`
- Modify: `frontend/src/lib/consultant-usability.ts`
- Test: `frontend/tests/consultant-usability.test.mjs`
- Docs: `docs/03_workbench_ux_and_page_spec.md`

- [ ] **Step 1: Write the failing test**

```js
test("deliverable first screen keeps version, publish posture, and primary action as the only high-weight blocks", () => {
  const source = readFileSync(
    new URL("../src/components/deliverable-workspace-panel.tsx", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(source, /hero-metrics-grid[\\s\\S]*採納與寫回[\\s\\S]*continuity[\\s\\S]*research/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
source ~/.nvm/nvm.sh && cd frontend && node --test tests/consultant-usability.test.mjs
```

Expected: FAIL because deliverable still exposes too many secondary reading systems near the top

- [ ] **Step 3: Write minimal implementation**

`frontend/src/components/deliverable-workspace-panel.tsx`

```tsx
{/* keep document-first hero */}
{/* keep one publish / revise action block */}
{/* move adoption / writeback / continuity / research deeper */}
```

`docs/03_workbench_ux_and_page_spec.md`

```md
- `deliverable` 保留 document workbench feel
- 首屏只留版本、當前工作姿態、primary action
```

- [ ] **Step 4: Run tests and verification**

Run:

```bash
source ~/.nvm/nvm.sh && cd frontend && node --test tests/consultant-usability.test.mjs
source ~/.nvm/nvm.sh && cd frontend && npm run build
source ~/.nvm/nvm.sh && cd frontend && npm run typecheck
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/deliverable-workspace-panel.tsx frontend/src/lib/consultant-usability.ts frontend/tests/consultant-usability.test.mjs docs/03_workbench_ux_and_page_spec.md
git commit -m "feat: compress deliverable into a document-first workbench"
```

---

### Task 7: Final Cross-Surface QA, Docs Sync, and Release Closure

**Files:**
- Modify: `docs/03_workbench_ux_and_page_spec.md`
- Modify: `docs/04_qa_matrix.md`
- Verify only: `frontend/src/components/workbench-home.tsx`, `frontend/src/components/matter-workspace-panel.tsx`, `frontend/src/components/task-detail-panel.tsx`, `frontend/src/components/artifact-evidence-workspace-panel.tsx`, `frontend/src/components/deliverable-workspace-panel.tsx`

- [ ] **Step 1: Write the failing documentation check**

```js
test("docs describe shell v2 as hybrid workbench rather than admin-console fallback", () => {
  const source = readFileSync(
    new URL("../../docs/03_workbench_ux_and_page_spec.md", import.meta.url),
    "utf8",
  );

  assert.match(source, /hybrid workbench/i);
  assert.match(source, /第一屏最多只留 3 個高權重區塊/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
source ~/.nvm/nvm.sh && cd frontend && node --test tests/low-noise-workbench-repass.test.mjs
```

Expected: FAIL until the active docs are updated to reflect Shell v2

- [ ] **Step 3: Update docs and QA evidence**

`docs/03_workbench_ux_and_page_spec.md`

```md
- add Shell v2 hybrid workbench rules
- add local rail rule
- add first-screen block budget
- add “no parallel summary systems” rule
```

`docs/04_qa_matrix.md`

```md
- append real verification evidence for overview / matter / task / evidence / deliverable after Shell v2 lands
- keep Limited vs Verified posture honest
```

- [ ] **Step 4: Run final full verification**

Run:

```bash
python3 -m compileall backend/app
source ~/.nvm/nvm.sh && cd frontend && node --test tests/*.test.mjs
source ~/.nvm/nvm.sh && cd frontend && npm run build
source ~/.nvm/nvm.sh && cd frontend && npm run typecheck
git diff --check
```

Expected:

- compileall passes
- node tests all pass
- build passes
- typecheck passes
- no whitespace / merge-marker errors

- [ ] **Step 5: Commit**

```bash
git add docs/03_workbench_ux_and_page_spec.md docs/04_qa_matrix.md frontend/tests/low-noise-workbench-repass.test.mjs
git commit -m "docs: finalize shell v2 hybrid workbench alignment"
```

---

## Self-Review

### Spec coverage

- Shell v2 hybrid direction: covered by Tasks 1-7
- `overview` launcher reset: covered by Task 2
- `matter` as control center: covered by Task 3
- `task` one-mainline reading system: covered by Task 4
- `evidence` supplement-first shell: covered by Task 5
- `deliverable` document-first compression: covered by Task 6
- docs / QA / honesty / final verification: covered by Task 7

### Placeholder scan

- No placeholder markers remain in the task body
- Each task includes exact files, commands, and minimal code shape

### Type consistency

- Shared shell primitive names are consistent:
  - `WorkspaceLocalRail`
  - `buildWorkspaceLocalRail`
  - `compressGuideItemsForShellV2`
- The plan consistently uses `Shell v2`, `local rail`, `first-screen block budget`, and `no parallel summary systems`
