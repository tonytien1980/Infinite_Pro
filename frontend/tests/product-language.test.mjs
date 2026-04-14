import test from "node:test";
import assert from "node:assert/strict";

import {
  FIRST_LAYER_AVOID_TERMS,
  replaceFirstLayerTerm,
  shouldAvoidInFirstLayer,
} from "../src/lib/product-language.ts";
import {
  getAgentCatalogDisplay,
  getPackCatalogDisplay,
  guardFirstLayerDemoSummary,
} from "../src/lib/ui-labels.ts";

test("first-layer avoid list includes internal system language", () => {
  assert.equal(shouldAvoidInFirstLayer("寫回"), true);
  assert.equal(shouldAvoidInFirstLayer("治理"), true);
  assert.equal(shouldAvoidInFirstLayer("工作面"), true);
  assert.equal(shouldAvoidInFirstLayer("查看治理摘要"), true);
  assert.equal(shouldAvoidInFirstLayer("案件工作面設定"), true);
});

test("first-layer replacements prefer readable product language", () => {
  assert.equal(replaceFirstLayerTerm("工作面"), "頁面");
  assert.equal(replaceFirstLayerTerm("先補來源與證據"), "先補資料");
  assert.equal(replaceFirstLayerTerm("決策工作面"), "分析工作台");
});

test("second-layer strings stay unchanged under first-layer replacement", () => {
  assert.equal(replaceFirstLayerTerm("寫回紀錄"), "寫回紀錄");
  assert.equal(replaceFirstLayerTerm("決策寫回紀錄"), "決策寫回紀錄");
});

test("avoid-list stays explicit instead of drifting implicitly", () => {
  assert.ok(FIRST_LAYER_AVOID_TERMS.includes("decision brief"));
  assert.ok(FIRST_LAYER_AVOID_TERMS.includes("canonical"));
});

test("catalog display prefers curated first-layer descriptions over raw registry jargon", () => {
  const agentDisplay = getAgentCatalogDisplay({
    agent_id: "research_intelligence_agent",
    agent_name: "Research / Intelligence Agent",
    description: "raw registry description with citation-ready handoff and closure wording",
  });
  const packDisplay = getPackCatalogDisplay({
    pack_id: "operations_pack",
    pack_name: "Operations Pack",
    description: "raw registry description with governance and operating mechanism wording",
  });

  assert.equal(agentDisplay.primaryDescription, "負責調研規劃、來源品質、證據缺口補強與研究交接。");
  assert.equal(packDisplay.primaryDescription, "聚焦營運流程、流程瓶頸、交付能力、資源配置與執行節奏。");
  assert.doesNotMatch(agentDisplay.primaryDescription, /closure/);
  assert.doesNotMatch(agentDisplay.primaryDescription, /citation-ready handoff/);
  assert.doesNotMatch(packDisplay.primaryDescription, /營運治理/);
});

test("demo first-layer summary guard falls back when backend copy leaks old internal wording", () => {
  assert.equal(guardFirstLayerDemoSummary("這裡展示的是固定 sample dataset 的唯讀工作流。"), null);
  assert.equal(guardFirstLayerDemoSummary("這裡是固定展示內容，只能瀏覽，不能修改或送出新的分析。"), "這裡是固定展示內容，只能瀏覽，不能修改或送出新的分析。");
});

test("curated pack descriptions keep management copy readable", () => {
  const packDisplay = getPackCatalogDisplay({
    pack_id: "organization_people_pack",
    pack_name: "Organization / People Pack",
    description: "raw registry description with 管理機制治理 wording",
  });

  assert.equal(packDisplay.primaryDescription, "聚焦組織設計、權責分工、人力配置與管理機制。");
  assert.doesNotMatch(packDisplay.primaryDescription, /管理機制治理/);
});
