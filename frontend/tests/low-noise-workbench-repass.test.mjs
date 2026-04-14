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

  assert.match(governanceBlock, /查看低噪音營運與治理摘要/);
  assert.match(governanceBlock, /hero-metrics-grid/);
  assert.match(governanceBlock, /error-text/);
  assert.doesNotMatch(heroBlock, /hero-metrics-grid/);
  assert.doesNotMatch(heroBlock, /error-text/);
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
