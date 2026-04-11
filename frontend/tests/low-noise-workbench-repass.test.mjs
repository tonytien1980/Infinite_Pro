import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { SURFACE_LABELS } from "../src/lib/workbench-surface-labels.ts";

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
  assert.equal(SURFACE_LABELS.showcaseHighlights, "重點展示");
  assert.equal(SURFACE_LABELS.readOnlyBoundary, "唯讀邊界");
  assert.equal(SURFACE_LABELS.formalWorkspace, "正式工作台");
  assert.equal(SURFACE_LABELS.demoRules, "示範工作台規則");
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
