import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

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
