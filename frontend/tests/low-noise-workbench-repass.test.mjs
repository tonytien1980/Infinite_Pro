import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { buildPrimaryNavForMembershipRole } from "../src/lib/permissions.ts";
import { labelForMembershipStatus } from "../src/lib/ui-labels.ts";
import { SURFACE_LABELS } from "../src/lib/workbench-surface-labels.ts";

test("surface labels use consultant-facing Traditional Chinese on high-visibility surfaces", () => {
  assert.equal(SURFACE_LABELS.decisionBrief, "判斷摘要");
  assert.equal(SURFACE_LABELS.firmOperating, "系統狀態");
  assert.equal(SURFACE_LABELS.phaseFiveClosure, "階段收尾");
  assert.equal(SURFACE_LABELS.generalistGovernance, "整體使用狀態");
  assert.equal(SURFACE_LABELS.personalProviderSettings, "個人模型設定");
  assert.equal(SURFACE_LABELS.firmSettings, "事務所設定");
  assert.equal(SURFACE_LABELS.providerAllowlist, "可用模型來源");
  assert.equal(SURFACE_LABELS.firmProviderDefault, "預設模型來源");
  assert.equal(SURFACE_LABELS.demoWorkspace, "示範工作台");
  assert.equal(SURFACE_LABELS.showcaseHighlights, "重點展示");
  assert.equal(SURFACE_LABELS.readOnlyBoundary, "唯讀範圍");
  assert.equal(SURFACE_LABELS.formalWorkspace, "正式工作台");
  assert.equal(SURFACE_LABELS.demoRules, "示範規則");
});

test("overview source keeps firm operating and governance summaries behind a second layer", () => {
  const source = readFileSync(
    new URL("../src/components/workbench-home.tsx", import.meta.url),
    "utf8",
  );
  const heroBlock = source.match(/<section className="hero-card overview-hero">[\s\S]*?<\/section>/)?.[0] ?? "";
  const governanceBlock =
    source.match(
      /<details className="panel disclosure-panel home-governance-disclosure">[\s\S]*?<\/details>/,
    )?.[0] ?? "";

  assert.match(governanceBlock, /查看低噪音系統摘要/);
  assert.match(governanceBlock, /hero-metrics-grid/);
  assert.match(governanceBlock, /error-text/);
  assert.doesNotMatch(heroBlock, /hero-metrics-grid/);
  assert.doesNotMatch(heroBlock, /error-text/);
  assert.doesNotMatch(heroBlock, /firm operating|phase closure|generalist governance|治理摘要/);
});

test("high-traffic first-layer surfaces use the approved readable workspace names", () => {
  const taskSource = readFileSync(
    new URL("../src/components/task-detail-panel.tsx", import.meta.url),
    "utf8",
  );
  const evidenceSource = readFileSync(
    new URL("../src/components/artifact-evidence-workspace-panel.tsx", import.meta.url),
    "utf8",
  );
  const deliverableSource = readFileSync(
    new URL("../src/components/deliverable-workspace-panel.tsx", import.meta.url),
    "utf8",
  );
  const matterSource = readFileSync(
    new URL("../src/components/matter-workspace-panel.tsx", import.meta.url),
    "utf8",
  );
  const taskHeroBlock =
    taskSource.match(
      /<section className="hero-card decision-hero">[\s\S]*?(?=\{taskDetailUsabilityView \? \()/,
    )?.[0] ?? "";
  const evidenceHeroBlock =
    evidenceSource.match(/<section className="hero-card evidence-hero">[\s\S]*?<\/section>/)?.[0] ?? "";
  const deliverableHeroBlock =
    deliverableSource.match(
      /<section className="hero-card deliverable-hero deliverable-workspace-hero">[\s\S]*?(?=<WorkspaceSectionGuide)/,
    )?.[0] ?? "";
  const matterHeroBlock =
    matterSource.match(
      /<section className="hero-card workspace-hero-card matter-hero">[\s\S]*?(?=<WorkspaceSectionGuide)/,
    )?.[0] ?? "";
  const taskHeroCopySource =
    taskSource.match(/const taskActionTitle[\s\S]*?const taskActionChecklist = \[/)?.[0] ?? "";
  const deliverableHeroCopySource =
    deliverableSource.match(/const deliverableActionTitle[\s\S]*?const deliverableUsabilityView = /)?.[0] ?? "";

  assert.match(taskHeroBlock, /分析工作台/);
  assert.doesNotMatch(taskHeroBlock, /決策工作面/);
  assert.match(evidenceHeroBlock, /資料與證據/);
  assert.doesNotMatch(evidenceHeroBlock, /來源與證據工作面|證據工作面/);
  assert.match(deliverableHeroBlock, /結果與報告/);
  assert.doesNotMatch(deliverableHeroBlock, /交付物工作面/);
  assert.match(matterHeroBlock, /案件主控台|現在重點|目前卡住原因/);
  assert.doesNotMatch(matterHeroBlock, /最大 blocker/);
  assert.match(matterHeroBlock, /結果與報告/);
  assert.match(matterHeroBlock, /分析項目/);
  assert.doesNotMatch(matterHeroBlock, /<h3>交付物<\/h3>/);
  assert.doesNotMatch(matterHeroBlock, /工作紀錄/);
  assert.doesNotMatch(matterHeroBlock, /代理 \/ 模組包/);
  assert.doesNotMatch(taskHeroCopySource, /回來更新 \/ checkpoint|outcome 鏈|review memo|正式 checkpoint/);
  assert.doesNotMatch(deliverableHeroCopySource, /checkpoint 版本|outcome 節奏|收斂成 checkpoint/);
});

test("first-screen chrome uses the same readable labels on matter task evidence and deliverable surfaces", () => {
  const taskSource = readFileSync(
    new URL("../src/components/task-detail-panel.tsx", import.meta.url),
    "utf8",
  );
  const evidenceSource = readFileSync(
    new URL("../src/components/artifact-evidence-workspace-panel.tsx", import.meta.url),
    "utf8",
  );
  const deliverableSource = readFileSync(
    new URL("../src/components/deliverable-workspace-panel.tsx", import.meta.url),
    "utf8",
  );
  const matterSource = readFileSync(
    new URL("../src/components/matter-workspace-panel.tsx", import.meta.url),
    "utf8",
  );
  const deliverableChromeBlock =
    deliverableSource.match(
      /<nav className="workspace-breadcrumb"[\s\S]*?正在載入結果與報告[\s\S]*?\) : null}/,
    )?.[0] ?? "";
  const matterChromeBlock =
    matterSource.match(
      /<nav className="workspace-breadcrumb"[\s\S]*?\{loading \? \(/,
    )?.[0] ?? "";
  const matterMainlineBlock =
    matterSource.match(
      /<section className="panel section-anchor" id="matter-mainline">[\s\S]*?(?=<DisclosurePanel)/,
    )?.[0] ?? "";

  assert.match(taskSource, /← 返回案件工作台/);
  assert.match(taskSource, /← 返回資料與證據/);
  assert.doesNotMatch(taskSource, /← 返回案件工作面/);
  assert.doesNotMatch(taskSource, /← 返回來源 \/ 證據工作面/);
  assert.match(evidenceSource, /← 返回案件工作台/);
  assert.doesNotMatch(evidenceSource, /← 返回案件工作面/);
  assert.match(deliverableChromeBlock, /結果與報告/);
  assert.match(deliverableChromeBlock, /aria-label="頁面層級"/);
  assert.match(deliverableChromeBlock, /正在載入結果與報告/);
  assert.doesNotMatch(deliverableChromeBlock, />\s*交付物\s*</);
  assert.doesNotMatch(deliverableChromeBlock, /交付物工作面/);
  assert.match(matterChromeBlock, /案件主控台/);
  assert.match(matterChromeBlock, /aria-label="頁面層級"/);
  assert.doesNotMatch(matterChromeBlock, /案件工作面/);
  assert.match(matterMainlineBlock, /案件主控台摘要|現在重點|目前卡住原因/);
  assert.doesNotMatch(matterMainlineBlock, /<h3>最大 blocker<\/h3>/);
});

test("new matter intake first screen avoids leaking internal workflow jargon", () => {
  const source = readFileSync(
    new URL("../src/components/task-create-form.tsx", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(source, /目前會對應到系統內部流程/);
  assert.doesNotMatch(source, /workflow 名稱/);
  assert.doesNotMatch(source, /sparse inquiry/);
  assert.doesNotMatch(source, /multi-source case/);
  assert.doesNotMatch(source, /canonical intake pipeline/);
  assert.doesNotMatch(source, /intake surface/);
  assert.doesNotMatch(source, /source material 掛回/);
  assert.doesNotMatch(source, /reference-only 材料/);
  assert.doesNotMatch(source, /metadata \/ reference/);
});

test("task 3 keeps intake lists and return paths on first-layer consultant language", () => {
  const taskCreateFormSource = readFileSync(
    new URL("../src/components/task-create-form.tsx", import.meta.url),
    "utf8",
  );
  const taskCreateWorkspaceSource = readFileSync(
    new URL("../src/components/task-create-workspace.tsx", import.meta.url),
    "utf8",
  );
  const mattersSource = readFileSync(
    new URL("../src/components/matters-page-panel.tsx", import.meta.url),
    "utf8",
  );
  const deliverablesSource = readFileSync(
    new URL("../src/components/deliverables-page-panel.tsx", import.meta.url),
    "utf8",
  );
  const historySource = readFileSync(
    new URL("../src/components/history-page-panel.tsx", import.meta.url),
    "utf8",
  );
  const docsSource = readFileSync(
    new URL("../../docs/03_workbench_ux_and_page_spec.md", import.meta.url),
    "utf8",
  );
  const docsConsultantLanguageBlock =
    docsSource.match(
      /### 3\.4 Consultant language, not platform jargon[\s\S]*?(?=\n### 3\.5 Progressive disclosure)/,
    )?.[0] ?? "";

  assert.match(taskCreateFormSource, /不用先選模式，先說明問題就能開始/);
  assert.doesNotMatch(taskCreateFormSource, /正式進件主線/);
  assert.doesNotMatch(taskCreateFormSource, /來源與證據工作面/);

  assert.match(taskCreateWorkspaceSource, /不用先選模式，先說明問題就能開始/);
  assert.match(taskCreateWorkspaceSource, /資料與證據/);
  assert.match(taskCreateWorkspaceSource, /結果與報告/);
  assert.doesNotMatch(taskCreateWorkspaceSource, /正式工作鏈上掛好骨架/);
  assert.doesNotMatch(taskCreateWorkspaceSource, /正式進件主線/);
  assert.doesNotMatch(taskCreateWorkspaceSource, /主工作面/);
  assert.doesNotMatch(taskCreateWorkspaceSource, /來源與證據工作面/);
  assert.doesNotMatch(taskCreateWorkspaceSource, /正式交付物工作面/);

  assert.match(mattersSource, /案件主控台/);
  assert.match(mattersSource, /分析項目/);
  assert.doesNotMatch(mattersSource, /看重點、資料和交付物/);
  assert.doesNotMatch(mattersSource, /案件工作台/);
  assert.doesNotMatch(mattersSource, /工作紀錄/);

  assert.match(deliverablesSource, /結果與報告/);
  assert.doesNotMatch(deliverablesSource, /<span className="eyebrow">交付物<\/span>/);
  assert.doesNotMatch(deliverablesSource, /<h1 className="page-title">交付物<\/h1>/);

  assert.match(historySource, /分析項目/);
  assert.match(historySource, /回案件頁/);
  assert.match(historySource, /回結果與報告/);
  assert.doesNotMatch(historySource, /工作紀錄/);
  assert.doesNotMatch(historySource, /案件工作面/);
  assert.doesNotMatch(historySource, /交付物工作面/);

  assert.match(docsSource, /intake\/list\/return-path 的第一層命名規則/);
  assert.match(docsSource, /不用先選模式，先說明問題就能開始/);
  assert.match(docsSource, /分析項目/);
  assert.match(docsSource, /結果與報告/);
  assert.match(docsSource, /案件頁|案件主控台/);
  assert.doesNotMatch(docsSource, /正式進件主線說明/);
  assert.doesNotMatch(docsSource, /打開工作紀錄/);
  assert.doesNotMatch(docsConsultantLanguageBlock, /- 案件工作台/);
  assert.doesNotMatch(docsConsultantLanguageBlock, /- 來源與證據/);
  assert.doesNotMatch(docsConsultantLanguageBlock, /- 交付物/);
});

test("task 4 keeps management, settings, members, and demo first-layer copy readable", () => {
  const settingsPageSource = readFileSync(
    new URL("../src/components/settings-page-panel.tsx", import.meta.url),
    "utf8",
  );
  const settingsFirmSource = readFileSync(
    new URL("../src/components/settings-firm-provider-panel.tsx", import.meta.url),
    "utf8",
  );
  const settingsPersonalSource = readFileSync(
    new URL("../src/components/settings-personal-provider-panel.tsx", import.meta.url),
    "utf8",
  );
  const agentSource = readFileSync(
    new URL("../src/components/agent-management-panel.tsx", import.meta.url),
    "utf8",
  );
  const packSource = readFileSync(
    new URL("../src/components/pack-management-panel.tsx", import.meta.url),
    "utf8",
  );
  const membersSource = readFileSync(
    new URL("../src/components/members-page-panel.tsx", import.meta.url),
    "utf8",
  );
  const demoSource = readFileSync(
    new URL("../src/components/demo-page-panel.tsx", import.meta.url),
    "utf8",
  );
  const docsSource = readFileSync(
    new URL("../../docs/03_workbench_ux_and_page_spec.md", import.meta.url),
    "utf8",
  );
  const settingsHeroBlock =
    settingsPageSource.match(/<section className="hero-card settings-hero">[\s\S]*?<\/section>/)?.[0] ?? "";
  const agentHeroBlock =
    agentSource.match(/<section className="hero-card governance-hero agents-hero">[\s\S]*?<\/section>/)?.[0] ?? "";
  const agentCardPreviewBlock =
    agentSource.match(
      /<article className="history-item management-card" key={agent\.agent_id}>[\s\S]*?(?=<details className="inline-disclosure">)/,
    )?.[0] ?? "";
  const packCardPreviewBlock =
    packSource.match(
      /<article className="history-item management-card" key={pack\.pack_id}>[\s\S]*?(?=<details className="inline-disclosure">)/,
    )?.[0] ?? "";
  const membersHeroBlock =
    membersSource.match(/<section className="hero-card[\s\S]*?<\/section>/)?.[0] ?? "";
  const demoHeroBlock =
    demoSource.match(/<section className="section-card">[\s\S]*?<\/section>/)?.[0] ?? "";

  assert.doesNotMatch(settingsHeroBlock, /第五階段之後/);
  assert.match(settingsHeroBlock, /先決定你要調哪一類設定/);
  assert.match(settingsHeroBlock, /這裡分成事務所設定、個人模型設定與工作台偏好/);

  assert.doesNotMatch(agentHeroBlock, /責任邊界/);
  assert.match(agentHeroBlock, /先看哪些代理已經整理好、可以直接用/);
  assert.doesNotMatch(agentSource, /搜尋名稱、責任、handoff 或適用工作類型/);
  assert.doesNotMatch(agentCardPreviewBlock, /系統代號：/);
  assert.doesNotMatch(agentCardPreviewBlock, /寫回要求|handoff|Trace 要求|trace requirements/);

  assert.doesNotMatch(packCardPreviewBlock, /系統代號：/);
  assert.doesNotMatch(packCardPreviewBlock, /正式合約：/);
  assert.doesNotMatch(packCardPreviewBlock, /interface|Rule binding|API 名稱/);
  assert.match(packSource, /先看哪一類模組包比較適合現在的工作/);

  assert.doesNotMatch(settingsFirmSource, /env baseline/);
  assert.doesNotMatch(settingsFirmSource, /儲存 demo policy/);
  assert.match(settingsFirmSource, /目前系統預設/);
  assert.match(settingsFirmSource, /儲存示範工作台規則/);

  assert.doesNotMatch(settingsPersonalSource, /這次會實際使用的 provider/);
  assert.match(settingsPersonalSource, /目前會用哪個模型來源/);

  assert.doesNotMatch(membersHeroBlock, /管理事務所成員與邀請/);
  assert.doesNotMatch(membersHeroBlock, /只有負責人可以/);
  assert.match(membersHeroBlock, /成員與邀請/);
  assert.match(membersHeroBlock, /邀請新成員、查看目前名單，或調整帳號身份/);

  assert.doesNotMatch(demoHeroBlock, /sample dataset/);
  assert.doesNotMatch(demoHeroBlock, /唯讀工作流/);
  assert.match(demoHeroBlock, /heroSummary/);
  assert.match(demoSource, /guardFirstLayerDemoSummary\(snapshot\?\.heroSummary\)/);

  assert.match(docsSource, /management \/ settings 第一層語言規則/);
  assert.match(docsSource, /不要把 `系統代號`、`正式合約`、`Rule binding`、`API 名稱` 放在管理卡片第一層/);
  assert.match(docsSource, /members hero 應先說明成員與邀請能做什麼/);
  assert.match(docsSource, /demo hero 第一層不要再說 `sample dataset`、`唯讀工作流`/);
});

test("task 4 underbuild follow-up keeps settings body members hero and demo browse CTA aligned", () => {
  const settingsPageSource = readFileSync(
    new URL("../src/components/settings-page-panel.tsx", import.meta.url),
    "utf8",
  );
  const membersSource = readFileSync(
    new URL("../src/components/members-page-panel.tsx", import.meta.url),
    "utf8",
  );
  const demoSource = readFileSync(
    new URL("../src/components/demo-page-panel.tsx", import.meta.url),
    "utf8",
  );
  const docsSource = readFileSync(
    new URL("../../docs/03_workbench_ux_and_page_spec.md", import.meta.url),
    "utf8",
  );
  const settingsGuideBlock =
    settingsPageSource.match(
      /<section className="panel" style=\{\{ marginBottom: "24px" }} id="settings-guide-panel">[\s\S]*?<\/section>/,
    )?.[0] ?? "";
  const membersHeroBlock =
    membersSource.match(/<section className="hero-card[\s\S]*?<\/section>/)?.[0] ?? "";
  const demoHeroBlock =
    demoSource.match(/<section className="section-card">[\s\S]*?<\/section>/)?.[0] ?? "";

  assert.doesNotMatch(settingsGuideBlock, /settingsActionChecklist\.map/);
  assert.doesNotMatch(settingsGuideBlock, /\{settingsActionTitle\}/);
  assert.match(settingsGuideBlock, /這裡不會替你處理什麼/);
  assert.match(settingsGuideBlock, /不會在這一頁直接送出分析或補件/);

  assert.match(membersHeroBlock, /hero-layout/);
  assert.match(membersHeroBlock, /href="#member-invite-panel"/);
  assert.match(membersHeroBlock, /送出新邀請/);
  assert.match(membersHeroBlock, /hero-focus-card/);
  assert.match(membersHeroBlock, /這頁先看什麼/);

  assert.match(demoHeroBlock, /href="#demo-showcase-section"/);
  assert.match(demoHeroBlock, /瀏覽示範內容/);

  assert.match(docsSource, /列表頁與管理頁第一屏正式採下列編排/);
  assert.match(docsSource, /一個 primary action/);
  assert.match(docsSource, /右側焦點卡/);
  assert.match(docsSource, /瀏覽示範內容/);
});

test("task 4 final polish keeps hero focus labels shorter than their titles", () => {
  const settingsPageSource = readFileSync(
    new URL("../src/components/settings-page-panel.tsx", import.meta.url),
    "utf8",
  );
  const agentSource = readFileSync(
    new URL("../src/components/agent-management-panel.tsx", import.meta.url),
    "utf8",
  );
  const packSource = readFileSync(
    new URL("../src/components/pack-management-panel.tsx", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(
    settingsPageSource,
    /<p className="hero-focus-label">先決定你要調哪一類設定<\/p>[\s\S]*?<h3 className="hero-focus-title">先決定你要調哪一類設定<\/h3>/,
  );
  assert.doesNotMatch(
    agentSource,
    /<p className="hero-focus-label">先看哪些代理已經整理好、可以直接用<\/p>[\s\S]*?<h3 className="hero-focus-title">先看哪些代理已經整理好、可以直接用<\/h3>/,
  );
  assert.doesNotMatch(
    packSource,
    /<p className="hero-focus-label">先看哪一類模組包比較適合現在的工作<\/p>[\s\S]*?<h3 className="hero-focus-title">先看哪一類模組包比較適合現在的工作<\/h3>/,
  );
});

test("cross-surface visible copy avoids mixed-language contract and membership labels", () => {
  const settingsPageSource = readFileSync(
    new URL("../src/components/settings-page-panel.tsx", import.meta.url),
    "utf8",
  );
  const settingsFirmSource = readFileSync(
    new URL("../src/components/settings-firm-provider-panel.tsx", import.meta.url),
    "utf8",
  );
  const settingsPersonalSource = readFileSync(
    new URL("../src/components/settings-personal-provider-panel.tsx", import.meta.url),
    "utf8",
  );
  const agentSource = readFileSync(
    new URL("../src/components/agent-management-panel.tsx", import.meta.url),
    "utf8",
  );
  const packSource = readFileSync(
    new URL("../src/components/pack-management-panel.tsx", import.meta.url),
    "utf8",
  );
  const memberSource = readFileSync(
    new URL("../src/components/members-page-panel.tsx", import.meta.url),
    "utf8",
  );
  const evidenceSource = readFileSync(
    new URL("../src/components/artifact-evidence-workspace-panel.tsx", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(settingsPageSource, /firm-level provider/);
  assert.doesNotMatch(settingsPageSource, /workbench preferences/);
  assert.doesNotMatch(settingsPageSource, /owner 需要/);
  assert.doesNotMatch(settingsPageSource, /consultant 主要/);
  assert.doesNotMatch(settingsPageSource, /light \/ dark mode/);
  assert.doesNotMatch(settingsPageSource, /English（測試中）/);
  assert.doesNotMatch(settingsFirmSource, /API key/);
  assert.doesNotMatch(settingsFirmSource, /firm fallback API key/);
  assert.doesNotMatch(settingsPersonalSource, /個人 key/);
  assert.doesNotMatch(settingsPersonalSource, /provider \/ model \/ key/);
  assert.doesNotMatch(settingsPersonalSource, /請 owner 先補上 allowlist/);
  assert.doesNotMatch(agentSource, /agent contract/);
  assert.doesNotMatch(agentSource, /agent spec/);
  assert.doesNotMatch(agentSource, /catalog 數量/);
  assert.doesNotMatch(agentSource, /trace 要求/);
  assert.doesNotMatch(packSource, /pack contract/);
  assert.doesNotMatch(packSource, /切換 tab/);
  assert.doesNotMatch(memberSource, /管理 Firm 成員與邀請/);
  assert.doesNotMatch(memberSource, /只有 owner 可以/);
  assert.doesNotMatch(memberSource, /<option value="consultant">Consultant<\/option>/);
  assert.doesNotMatch(memberSource, /<option value="demo">Demo<\/option>/);
  assert.doesNotMatch(memberSource, /狀態：active/);
  assert.doesNotMatch(evidenceSource, /reference-only 材料/);
  assert.doesNotMatch(evidenceSource, /blocking item/);
  assert.doesNotMatch(evidenceSource, /retryable failure/);
  assert.doesNotMatch(evidenceSource, /artifact 角色/);
  assert.doesNotMatch(evidenceSource, /metadata \/ reference/);
});

test("history cleanup copy makes hiding separate from deleting", () => {
  const historySource = readFileSync(
    new URL("../src/components/history-page-panel.tsx", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(historySource, /清空全部歷史入口/);
  assert.doesNotMatch(historySource, /不會硬刪除正式工作紀錄/);
  assert.match(historySource, /隱藏全部歷史入口/);
  assert.match(historySource, /只會把目前所有歷史入口標記為隱藏/);
});

test("membership status labels cover invite rows as well as active members", () => {
  assert.equal(labelForMembershipStatus("pending"), "待接受");
  assert.equal(labelForMembershipStatus("accepted"), "已接受");
  assert.equal(labelForMembershipStatus("revoked"), "已撤回");
});

test("task 5 closure keeps nav and overview first-layer labels on approved visible names", () => {
  const nav = buildPrimaryNavForMembershipRole("consultant");
  const homeSource = readFileSync(
    new URL("../src/components/workbench-home.tsx", import.meta.url),
    "utf8",
  );
  const deliverableSectionBlock =
    homeSource.match(
      /<section className="panel section-anchor" id="home-deliverables">[\s\S]*?<\/section>/,
    )?.[0] ?? "";
  const recentActivityBlock =
    homeSource.match(
      /<section className="panel">[\s\S]*?<h2 className="panel-title">最近活動<\/h2>[\s\S]*?<\/section>/,
    )?.[0] ?? "";

  assert.deepEqual(nav.slice(0, 5), [
    { href: "/", label: "總覽" },
    { href: "/matters", label: "案件主控台" },
    { href: "/deliverables", label: "結果與報告" },
    { href: "/history", label: "歷史紀錄" },
    { href: "/settings", label: "系統設定" },
  ]);

  assert.doesNotMatch(homeSource, /看最近交付物/);
  assert.doesNotMatch(deliverableSectionBlock, /最近交付物/);
  assert.doesNotMatch(deliverableSectionBlock, /看全部交付物/);
  assert.doesNotMatch(homeSource, /工作紀錄/);
  assert.doesNotMatch(recentActivityBlock, /工作更新/);
  assert.match(deliverableSectionBlock, /最近結果與報告/);
  assert.match(deliverableSectionBlock, /看全部結果與報告/);
  assert.match(recentActivityBlock, /分析更新/);
});

test("task 5 closure routes demo page rendering through normalized runtime-fed copy", () => {
  const demoSource = readFileSync(
    new URL("../src/components/demo-page-panel.tsx", import.meta.url),
    "utf8",
  );

  assert.match(demoSource, /normalizeDemoWorkspaceSnapshot/);
  assert.match(demoSource, /normalizedSnapshot/);
  assert.doesNotMatch(demoSource, /snapshot\?\.title \|\| `Infinite Pro \$\{SURFACE_LABELS\.demoWorkspace\}`/);
  assert.doesNotMatch(demoSource, /section\.title/);
  assert.doesNotMatch(demoSource, /section\.summary/);
  assert.doesNotMatch(demoSource, /key=\{item\}>\{item\}/);
});

test("second-layer continuity copy avoids raw internal ontology English", () => {
  const matterSecondarySource = readFileSync(
    new URL("../src/components/matter-secondary-panel-bodies.tsx", import.meta.url),
    "utf8",
  );
  const taskDetailSource = readFileSync(
    new URL("../src/components/task-detail-panel.tsx", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(matterSecondarySource, /目前已確認的 facts/);
  assert.doesNotMatch(matterSecondarySource, /目前沒有額外 facts/);
  assert.doesNotMatch(matterSecondarySource, /仍在沿用的 assumptions/);
  assert.doesNotMatch(matterSecondarySource, /目前沒有額外 assumptions/);
  assert.doesNotMatch(taskDetailSource, /DecisionContext 與工作鏈/);
  assert.doesNotMatch(taskDetailSource, /當前主要 DecisionContext/);
});

test("docs clarify visible first-layer labels versus formal contract names", () => {
  const docsSource = readFileSync(
    new URL("../../docs/03_workbench_ux_and_page_spec.md", import.meta.url),
    "utf8",
  );

  assert.match(docsSource, /可見第一層名稱/);
  assert.match(docsSource, /formal\/internal contract names|formal contract name|formal contract|internal contract/);
  assert.match(docsSource, /案件主控台/);
  assert.match(docsSource, /資料與證據/);
  assert.match(docsSource, /分析工作台/);
  assert.match(docsSource, /結果與報告/);
});

test("qa matrix keeps evidence upload claims aligned with actual verification depth", () => {
  const qaMatrixSource = readFileSync(
    new URL("../../docs/04_qa_matrix.md", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(
    qaMatrixSource,
    /\| Evidence supplement UI \| source verification \+ mirrored implementation \| .* \| Verified \|/,
  );
});
