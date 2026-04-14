# Dual-Layer Product Language System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 Infinite Pro 的高可見度產品用字收成「第一層全民可讀、第二層顧問專業、第三層系統內部」的雙層語言系統，讓整體更容易懂、更一致，但不犧牲專業感。

**Architecture:** 先建立共享語言規則與可測的替代表，再按 `overview -> task -> evidence -> deliverable -> matter -> management surfaces` 的順序逐頁收斂。每一段都遵守同一套原則：第一層先講使用者要做什麼，第二層才補背景與專業解釋，第三層內部詞只留在 advanced / debug / admin。

**Tech Stack:** Next.js App Router, React client components, shared label helpers in `frontend/src/lib`, node test, authenticated browser QA via Playwright CLI, docs in `docs/03_workbench_ux_and_page_spec.md` and `docs/04_qa_matrix.md`.

---

## File Structure

### Shared language rules

- Create: `frontend/src/lib/product-language.ts`
  - 第一層禁用詞、替代表、layer classifier、copy compression helpers
- Modify: `frontend/src/lib/ui-labels.ts`
  - 共用 UI labels 朝第一層全民可讀語言收斂
- Modify: `frontend/src/lib/workbench-surface-labels.ts`
  - 首頁 / demo / settings 等高可見度標籤對齊雙層語言系統
- Test: `frontend/tests/product-language.test.mjs`
  - 鎖住禁用詞、替代表與第一層規則

### High-traffic work surfaces

- Modify: `frontend/src/components/workbench-home.tsx`
- Modify: `frontend/src/components/task-detail-panel.tsx`
- Modify: `frontend/src/components/artifact-evidence-workspace-panel.tsx`
- Modify: `frontend/src/components/deliverable-workspace-panel.tsx`
- Modify: `frontend/src/components/matter-workspace-panel.tsx`
- Modify: `frontend/src/lib/consultant-usability.ts`
- Modify: `frontend/src/lib/task-detail-usability.ts`
- Test: `frontend/tests/consultant-usability.test.mjs`
- Test: `frontend/tests/task-detail-usability.test.mjs`
- Test: `frontend/tests/low-noise-workbench-repass.test.mjs`

### Intake and list / management surfaces

- Modify: `frontend/src/components/task-create-form.tsx`
- Modify: `frontend/src/components/task-create-workspace.tsx`
- Modify: `frontend/src/components/matters-page-panel.tsx`
- Modify: `frontend/src/components/deliverables-page-panel.tsx`
- Modify: `frontend/src/components/history-page-panel.tsx`
- Modify: `frontend/src/components/agent-management-panel.tsx`
- Modify: `frontend/src/components/pack-management-panel.tsx`
- Modify: `frontend/src/components/settings-page-panel.tsx`
- Modify: `frontend/src/components/settings-firm-provider-panel.tsx`
- Modify: `frontend/src/components/settings-personal-provider-panel.tsx`
- Modify: `frontend/src/components/members-page-panel.tsx`
- Modify: `frontend/src/components/demo-page-panel.tsx`

### Docs

- Modify: `docs/03_workbench_ux_and_page_spec.md`
- Modify: `docs/04_qa_matrix.md`

---

### Task 1: Add Shared Product-Language Rules

**Files:**
- Create: `frontend/src/lib/product-language.ts`
- Modify: `frontend/src/lib/ui-labels.ts`
- Modify: `frontend/src/lib/workbench-surface-labels.ts`
- Test: `frontend/tests/product-language.test.mjs`
- Docs: `docs/03_workbench_ux_and_page_spec.md`

- [ ] **Step 1: Write the failing test**

```js
import test from "node:test";
import assert from "node:assert/strict";

import {
  FIRST_LAYER_AVOID_TERMS,
  replaceFirstLayerTerm,
  shouldAvoidInFirstLayer,
} from "../src/lib/product-language.ts";

test("first-layer avoid list includes internal system language", () => {
  assert.equal(shouldAvoidInFirstLayer("寫回"), true);
  assert.equal(shouldAvoidInFirstLayer("治理"), true);
  assert.equal(shouldAvoidInFirstLayer("工作面"), true);
});

test("first-layer replacements prefer readable product language", () => {
  assert.equal(replaceFirstLayerTerm("工作面"), "頁面");
  assert.equal(replaceFirstLayerTerm("先補來源與證據"), "先補資料");
  assert.equal(replaceFirstLayerTerm("決策工作面"), "分析工作台");
});

test("avoid-list stays explicit instead of drifting implicitly", () => {
  assert.ok(FIRST_LAYER_AVOID_TERMS.includes("decision brief"));
  assert.ok(FIRST_LAYER_AVOID_TERMS.includes("canonical"));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
source ~/.nvm/nvm.sh && cd frontend && node --test tests/product-language.test.mjs
```

Expected: FAIL because `product-language.ts` does not exist yet

- [ ] **Step 3: Write minimal implementation**

`frontend/src/lib/product-language.ts`

```ts
export const FIRST_LAYER_AVOID_TERMS = [
  "工作面",
  "寫回",
  "治理",
  "脈絡",
  "continuity",
  "decision brief",
  "canonical",
  "authority",
  "provenance",
  "work slice",
  "progression",
] as const;

const FIRST_LAYER_REPLACEMENTS: Record<string, string> = {
  工作面: "頁面",
  決策工作面: "分析工作台",
  交付物工作面: "結果與報告",
  "先補來源與證據": "先補資料",
  寫回: "同步回案件",
  脈絡: "背景資訊",
  治理: "系統檢查",
};

export function shouldAvoidInFirstLayer(value: string) {
  return FIRST_LAYER_AVOID_TERMS.includes(value as (typeof FIRST_LAYER_AVOID_TERMS)[number]);
}

export function replaceFirstLayerTerm(value: string) {
  return FIRST_LAYER_REPLACEMENTS[value] ?? value;
}
```

`frontend/src/lib/workbench-surface-labels.ts`

```ts
export const SURFACE_LABELS = {
  decisionBrief: "判斷摘要",
  firmOperating: "系統狀態",
  phaseFiveClosure: "階段收尾",
  generalistGovernance: "整體使用狀態",
  personalProviderSettings: "個人模型設定",
  firmSettings: "事務所設定",
  providerAllowlist: "可用模型來源",
  firmProviderDefault: "預設模型來源",
  demoWorkspace: "示範工作台",
  showcaseHighlights: "重點展示",
  readOnlyBoundary: "唯讀範圍",
  formalWorkspace: "正式工作台",
  demoRules: "示範規則",
} as const;
```

`docs/03_workbench_ux_and_page_spec.md`

```md
- 第一層正式禁用詞應收斂到共享 product-language helper 管理
- 若頁面是第一層高流量 surface，不應直接暴露 `工作面 / 寫回 / 治理 / decision brief / canonical` 等內部詞
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
source ~/.nvm/nvm.sh && cd frontend && node --test tests/product-language.test.mjs
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/product-language.ts frontend/src/lib/ui-labels.ts frontend/src/lib/workbench-surface-labels.ts frontend/tests/product-language.test.mjs docs/03_workbench_ux_and_page_spec.md
git commit -m "feat: add dual-layer product language rules"
```

---

### Task 2: Rewrite High-Traffic First-Layer Copy

**Files:**
- Modify: `frontend/src/components/workbench-home.tsx`
- Modify: `frontend/src/components/task-detail-panel.tsx`
- Modify: `frontend/src/components/artifact-evidence-workspace-panel.tsx`
- Modify: `frontend/src/components/deliverable-workspace-panel.tsx`
- Modify: `frontend/src/components/matter-workspace-panel.tsx`
- Modify: `frontend/src/lib/consultant-usability.ts`
- Modify: `frontend/src/lib/task-detail-usability.ts`
- Test: `frontend/tests/consultant-usability.test.mjs`
- Test: `frontend/tests/task-detail-usability.test.mjs`
- Test: `frontend/tests/low-noise-workbench-repass.test.mjs`
- Docs: `docs/03_workbench_ux_and_page_spec.md`

- [ ] **Step 1: Write the failing tests**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("overview first layer avoids internal system wording", () => {
  const source = readFileSync(
    new URL("../src/components/workbench-home.tsx", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(source, /治理姿態|治理摘要|reuse-boundary governance/);
});

test("task first layer avoids direct workbench jargon", () => {
  const source = readFileSync(
    new URL("../src/components/task-detail-panel.tsx", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(source, /決策工作面|決策摘要/);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
source ~/.nvm/nvm.sh && cd frontend && node --test tests/consultant-usability.test.mjs tests/task-detail-usability.test.mjs tests/low-noise-workbench-repass.test.mjs
```

Expected: FAIL because high-traffic surfaces still use semi-internal product language

- [ ] **Step 3: Write minimal implementation**

`frontend/src/components/workbench-home.tsx`

```tsx
<p className="hero-focus-label">這頁先看什麼</p>
// becomes
<p className="hero-focus-label">現在先做什麼</p>
```

`frontend/src/components/task-detail-panel.tsx`

```tsx
<span className="eyebrow">決策工作面</span>
// becomes
<span className="eyebrow">分析工作台</span>
```

`frontend/src/components/artifact-evidence-workspace-panel.tsx`

```tsx
<span className="eyebrow">來源與證據工作面</span>
// becomes
<span className="eyebrow">資料與證據</span>
```

`frontend/src/components/deliverable-workspace-panel.tsx`

```tsx
<span className="eyebrow">交付物工作面</span>
// becomes
<span className="eyebrow">結果與報告</span>
```

`frontend/src/components/matter-workspace-panel.tsx`

```tsx
<span className="eyebrow">案件工作台</span>
// keep
// but tighten supporting first-layer copy so it reads as a case control page, not an internal workspace model
```

- [ ] **Step 4: Run verification**

Run:

```bash
source ~/.nvm/nvm.sh && cd frontend && node --test tests/consultant-usability.test.mjs tests/task-detail-usability.test.mjs tests/low-noise-workbench-repass.test.mjs
source ~/.nvm/nvm.sh && cd frontend && npm run build
source ~/.nvm/nvm.sh && cd frontend && npm run typecheck
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/workbench-home.tsx frontend/src/components/task-detail-panel.tsx frontend/src/components/artifact-evidence-workspace-panel.tsx frontend/src/components/deliverable-workspace-panel.tsx frontend/src/components/matter-workspace-panel.tsx frontend/src/lib/consultant-usability.ts frontend/src/lib/task-detail-usability.ts frontend/tests/consultant-usability.test.mjs frontend/tests/task-detail-usability.test.mjs frontend/tests/low-noise-workbench-repass.test.mjs docs/03_workbench_ux_and_page_spec.md
git commit -m "feat: rewrite first-layer workbench copy"
```

---

### Task 3: Rewrite Intake, Lists, and Return Paths

**Files:**
- Modify: `frontend/src/components/task-create-form.tsx`
- Modify: `frontend/src/components/task-create-workspace.tsx`
- Modify: `frontend/src/components/matters-page-panel.tsx`
- Modify: `frontend/src/components/deliverables-page-panel.tsx`
- Modify: `frontend/src/components/history-page-panel.tsx`
- Test: `frontend/tests/low-noise-workbench-repass.test.mjs`
- Docs: `docs/03_workbench_ux_and_page_spec.md`

- [ ] **Step 1: Write the failing test**

```js
test("intake and list surfaces avoid first-layer internal terminology", () => {
  const taskCreateSource = readFileSync(
    new URL("../src/components/task-create-form.tsx", import.meta.url),
    "utf8",
  );
  const historySource = readFileSync(
    new URL("../src/components/history-page-panel.tsx", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(taskCreateSource, /正式進件主線|寫回深度/);
  assert.doesNotMatch(historySource, /precedent candidates|治理建議/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
source ~/.nvm/nvm.sh && cd frontend && node --test tests/low-noise-workbench-repass.test.mjs
```

Expected: FAIL because intake/list surfaces still expose specialist or system-heavy wording in first-layer text

- [ ] **Step 3: Write minimal implementation**

`frontend/src/components/task-create-form.tsx`

```tsx
// first-layer helper text should say:
// "先說明你要查什麼，材料之後再補"
// not:
// "全部都走同一條正式進件主線"
```

`frontend/src/components/history-page-panel.tsx`

```tsx
// first-layer titles should say:
// "可重用內容回看"
// not:
// "precedent candidates" or "治理建議"
```

`frontend/src/components/matters-page-panel.tsx`

```tsx
// emphasize:
// "回案件繼續"
// "回看結果"
// "找最近做過的事"
```

- [ ] **Step 4: Run verification**

Run:

```bash
source ~/.nvm/nvm.sh && cd frontend && node --test tests/low-noise-workbench-repass.test.mjs
source ~/.nvm/nvm.sh && cd frontend && npm run build
source ~/.nvm/nvm.sh && cd frontend && npm run typecheck
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/task-create-form.tsx frontend/src/components/task-create-workspace.tsx frontend/src/components/matters-page-panel.tsx frontend/src/components/deliverables-page-panel.tsx frontend/src/components/history-page-panel.tsx frontend/tests/low-noise-workbench-repass.test.mjs docs/03_workbench_ux_and_page_spec.md
git commit -m "feat: simplify intake and list surface language"
```

---

### Task 4: Rewrite Management and Settings Copy

**Files:**
- Modify: `frontend/src/components/agent-management-panel.tsx`
- Modify: `frontend/src/components/pack-management-panel.tsx`
- Modify: `frontend/src/components/settings-page-panel.tsx`
- Modify: `frontend/src/components/settings-firm-provider-panel.tsx`
- Modify: `frontend/src/components/settings-personal-provider-panel.tsx`
- Modify: `frontend/src/components/members-page-panel.tsx`
- Modify: `frontend/src/components/demo-page-panel.tsx`
- Modify: `frontend/src/lib/ui-labels.ts`
- Docs: `docs/03_workbench_ux_and_page_spec.md`

- [ ] **Step 1: Write the failing test**

```js
test("management surfaces use readable product language before specialist language", () => {
  const source = readFileSync(
    new URL("../src/components/agent-management-panel.tsx", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(source, /系統代號|寫回要求|guidedDraft|contract/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
source ~/.nvm/nvm.sh && cd frontend && node --test tests/product-language.test.mjs tests/low-noise-workbench-repass.test.mjs
```

Expected: FAIL because management surfaces still expose system-heavy nouns in first-layer copy

- [ ] **Step 3: Write minimal implementation**

`frontend/src/components/agent-management-panel.tsx`

```tsx
// first layer:
// "代理列表"
// "這個代理主要在做什麼"
// second layer only:
// internal ids, contracts, writeback requirements
```

`frontend/src/components/settings-page-panel.tsx`

```tsx
// prefer:
// "這台電腦目前用誰的身份記錄判斷"
// over:
// browser-local operator attribution governance wording
```

`frontend/src/components/members-page-panel.tsx`

```tsx
// prefer:
// "已加入成員"
// "待接受邀請"
// "目前角色"
```

- [ ] **Step 4: Run verification**

Run:

```bash
source ~/.nvm/nvm.sh && cd frontend && node --test tests/product-language.test.mjs tests/low-noise-workbench-repass.test.mjs
source ~/.nvm/nvm.sh && cd frontend && npm run build
source ~/.nvm/nvm.sh && cd frontend && npm run typecheck
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/agent-management-panel.tsx frontend/src/components/pack-management-panel.tsx frontend/src/components/settings-page-panel.tsx frontend/src/components/settings-firm-provider-panel.tsx frontend/src/components/settings-personal-provider-panel.tsx frontend/src/components/members-page-panel.tsx frontend/src/components/demo-page-panel.tsx frontend/src/lib/ui-labels.ts docs/03_workbench_ux_and_page_spec.md
git commit -m "feat: clarify management and settings language"
```

---

### Task 5: Browser QA, Docs Sync, and Closure

**Files:**
- Verify only: `frontend/src/components/workbench-home.tsx`, `frontend/src/components/matter-workspace-panel.tsx`, `frontend/src/components/task-detail-panel.tsx`, `frontend/src/components/artifact-evidence-workspace-panel.tsx`, `frontend/src/components/deliverable-workspace-panel.tsx`, `frontend/src/components/task-create-form.tsx`, `frontend/src/components/history-page-panel.tsx`, `frontend/src/components/agent-management-panel.tsx`, `frontend/src/components/settings-page-panel.tsx`
- Modify: `docs/04_qa_matrix.md`

- [ ] **Step 1: Run authenticated browser walkthrough**

Run:

```bash
# use Playwright CLI headed browser with a real logged-in operator session
```

Verify:

- `overview` first layer no longer opens with specialist/system-heavy wording
- `task` first layer reads as plain action language
- `evidence` first layer reads as `缺什麼 / 補什麼 / 補完回哪裡`
- `deliverable` first layer still feels professional but readable to a non-specialist
- `history / agents / settings` first layers no longer feel like admin/debug shells

- [ ] **Step 2: Append honest QA evidence to `docs/04_qa_matrix.md`**

```md
## Entry: 2026-04-14 dual-layer language pass

- record exact test command outputs
- record exact authenticated browser pages checked
- separate verified browser observations from source-level copy assertions
```

- [ ] **Step 3: Run final verification**

Run:

```bash
source ~/.nvm/nvm.sh && cd frontend && node --test tests/product-language.test.mjs tests/consultant-usability.test.mjs tests/task-detail-usability.test.mjs tests/low-noise-workbench-repass.test.mjs
source ~/.nvm/nvm.sh && cd frontend && npm run build
source ~/.nvm/nvm.sh && cd frontend && npm run typecheck
git diff --check
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add docs/04_qa_matrix.md
git commit -m "docs: record dual-layer language verification"
```

---

## Self-Review

### Spec coverage

- Layer rules: covered by Task 1
- First-layer forbidden language and replacements: covered by Task 1
- Page priority order: covered by Tasks 2 to 4
- Docs and QA evidence alignment: covered by Task 5

No spec gaps found.

### Placeholder scan

- No `TBD`, `TODO`, or deferred implementation placeholders remain
- Every task includes exact file paths, concrete commands, and expected outcomes

### Type and naming consistency

- Shared language helper consistently named `product-language.ts`
- QA evidence file consistently points to `docs/04_qa_matrix.md`
- High-traffic and management surfaces stay separated by task boundary

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-14-dual-layer-product-language-system.md`. Two execution options:

1. Subagent-Driven (recommended) - 我依 task 拆開逐段施工、每段 review 後再往下
2. Inline Execution - 我在這個 session 直接照 plan 一路做下去，但用 checkpoint 控制節奏

Which approach?
