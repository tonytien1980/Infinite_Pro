import test from "node:test";
import assert from "node:assert/strict";

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
