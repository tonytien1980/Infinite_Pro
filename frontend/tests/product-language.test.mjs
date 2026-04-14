import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  FIRST_LAYER_AVOID_TERMS,
  replaceFirstLayerTerm,
  shouldAvoidInFirstLayer,
} from "../src/lib/product-language.ts";
import {
  labelForAgentName,
  labelForPackName,
  getAgentCatalogDisplay,
  getPackCatalogDisplay,
  guardFirstLayerDemoSummary,
} from "../src/lib/ui-labels.ts";
import {
  buildDemoEntryCopy,
  buildFormalWorkspaceExplainer,
  normalizeDemoWorkspaceCopy,
  summarizeDemoShowcaseHighlights,
} from "../src/lib/demo-workspace.ts";

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

test("high-visibility agent and pack names map English registry labels to readable Chinese", () => {
  assert.equal(labelForAgentName("Research / Intelligence Agent"), "調研 / 情報代理");
  assert.equal(labelForPackName("Research / Intelligence Pack"), "研究 / 情報模組包");
});

test("login and demo source copy avoid first-layer mixed-language wording", () => {
  const loginSource = readFileSync(
    new URL("../src/components/login-page-panel.tsx", import.meta.url),
    "utf8",
  );
  const demoBackendSource = readFileSync(
    new URL("../../backend/app/services/demo_workspace.py", import.meta.url),
    "utf8",
  );

  assert.match(loginSource, /共享判讀/);
  assert.doesNotMatch(loginSource, /shared intelligence/);

  assert.match(demoBackendSource, /Infinite Pro 示範工作台/);
  assert.match(demoBackendSource, /案件主控台/);
  assert.match(demoBackendSource, /結果與報告/);
  assert.doesNotMatch(demoBackendSource, /Infinite Pro Demo Workspace/);
  assert.doesNotMatch(demoBackendSource, /shared intelligence/);
  assert.doesNotMatch(demoBackendSource, /Sample Matters|Sample Deliverables|Sample History/);
  assert.doesNotMatch(demoBackendSource, /follow-up brief|precedent review lane|phase 4 closure review/);
});

test("demo runtime-fed helpers normalize English and internal wording before rendering", () => {
  assert.equal(
    buildDemoEntryCopy({
      workspaceMode: "demo",
      title: "Infinite Pro Demo Workspace",
      subtitle: "demo workspace",
      entryMessage: "這個 demo workspace 只會帶你快速看 shared intelligence 的讀法。",
      heroSummary: "這裡是固定展示內容，只能瀏覽，不能修改或送出新的分析。",
      showcaseHighlights: [],
      readOnlyRules: [],
      formalWorkspaceExplainer: "正式版會回到 case world 主線。",
      sections: [],
    }),
    "這個示範工作台只會帶你快速看共享判讀的讀法。",
  );
  assert.equal(
    summarizeDemoShowcaseHighlights(["Sample Matters", "Sample Deliverables", "Sample History"]),
    "你可以先看示範案件、示範結果、示範紀錄。",
  );
  assert.equal(
    buildFormalWorkspaceExplainer({
      workspaceMode: "demo",
      title: "Infinite Pro Demo Workspace",
      subtitle: "demo workspace",
      entryMessage: "entry",
      heroSummary: "這裡是固定展示內容，只能瀏覽，不能修改或送出新的分析。",
      showcaseHighlights: [],
      readOnlyRules: [],
      formalWorkspaceExplainer: "正式版會沿著 case world、follow-up brief 與 precedent review lane 繼續往前。",
      sections: [
        {
          sectionId: "demo-history",
          title: "Sample History",
          summary: "用來示範 phase 4 closure review。",
          items: ["shared intelligence", "case world"],
        },
      ],
    }),
    "正式版會沿著案件脈絡、後續摘要與重用檢視繼續往前。",
  );
});

test("demo runtime normalization cleans up the known residual snapshot strings", () => {
  assert.equal(normalizeDemoWorkspaceCopy("Infinite Pro示範工作台"), "Infinite Pro 示範工作台");
  assert.equal(
    normalizeDemoWorkspaceCopy("正式版workspace會讓consultant進入自己的辦案路徑"),
    "正式版工作台會讓顧問進入自己的辦案路徑",
  );
  assert.equal(
    normalizeDemoWorkspaceCopy("展示history、precedent、共享判讀的唯讀讀法"),
    "展示歷史紀錄、可重用內容、共享判讀的唯讀讀法",
  );
  assert.equal(
    normalizeDemoWorkspaceCopy("制度化階段營運review"),
    "制度化階段營運檢視",
  );
  assert.equal(
    normalizeDemoWorkspaceCopy("旗艦診斷memo"),
    "旗艦診斷備忘錄",
  );
  assert.equal(
    normalizeDemoWorkspaceCopy("你目前正在示範工作台。這裡只能看，不能新增、修改、分析或治理。"),
    "你目前正在示範工作台。這裡只供瀏覽，不能新增、修改、分析或管理。",
  );
  assert.equal(
    normalizeDemoWorkspaceCopy("這裡展示的是 Infinite Pro 如何把案件世界、交付物與共享判讀串成同一條顧問工作流。"),
    "這裡展示的是 Infinite Pro 如何把案件脈絡、結果與報告、共享判讀串成同一條工作流程。",
  );
  assert.equal(
    normalizeDemoWorkspaceCopy("展示案件脈絡與主要工作台會長成什麼樣子。"),
    "展示案件與主要工作台會長成什麼樣子。",
  );
  assert.equal(
    normalizeDemoWorkspaceCopy("展示交付物如何從案件脈絡與共享判讀收斂出來。"),
    "展示結果與報告如何從案件脈絡與共享判讀收斂出來。",
  );
  assert.equal(
    normalizeDemoWorkspaceCopy("展示歷史紀錄、先例、共享判讀的唯讀讀法。"),
    "展示歷史紀錄、可重用內容與共享判讀的唯讀讀法。",
  );
});

test("demo runtime normalization keeps mixed English and Chinese spacing natural", () => {
  assert.equal(
    buildDemoEntryCopy({
      workspaceMode: "demo",
      title: "Infinite Pro示範工作台",
      subtitle: "demo workspace",
      entryMessage: "你目前正在示範工作台。這裡只能看，不能新增、修改、分析或治理。",
      heroSummary: "這裡是固定展示內容，只能瀏覽，不能修改或送出新的分析。",
      showcaseHighlights: [],
      readOnlyRules: [],
      formalWorkspaceExplainer: "正式版workspace會讓consultant進入自己的辦案路徑",
      sections: [],
    }),
    "你目前正在示範工作台。這裡只供瀏覽，不能新增、修改、分析或管理。",
  );
  assert.equal(
    summarizeDemoShowcaseHighlights([
      "matter /案件脈絡的正式工作面",
      "deliverable shaping的收斂讀法",
      "history /共享判讀的唯讀展示",
    ]),
    "你可以先看案件主控台、結果與報告的收斂讀法、歷史紀錄與共享判讀的唯讀展示。",
  );
  assert.equal(
    summarizeDemoShowcaseHighlights([
      "展示案件脈絡與主要工作台會長成什麼樣子。",
      "展示交付物如何從案件脈絡與共享判讀收斂出來。",
    ]),
    "你可以先看展示案件與主要工作台會長成什麼樣子、展示結果與報告如何從案件脈絡與共享判讀收斂出來。",
  );
  assert.equal(
    buildFormalWorkspaceExplainer({
      workspaceMode: "demo",
      title: "Infinite Pro示範工作台",
      subtitle: "demo workspace",
      entryMessage: "entry",
      heroSummary: "這裡是固定展示內容，只能瀏覽，不能修改或送出新的分析。",
      showcaseHighlights: [],
      readOnlyRules: [],
      formalWorkspaceExplainer: "正式版workspace會讓consultant進入自己的辦案路徑；demo 則只展示產品如何工作，不提供操作權限。",
      sections: [],
    }),
    "正式版工作台會讓顧問進入自己的辦案路徑；示範工作台則只展示產品如何工作，不提供操作權限。",
  );
  assert.equal(
    buildDemoEntryCopy({
      workspaceMode: "demo",
      title: "Infinite Pro示範工作台",
      subtitle: "demo workspace",
      entryMessage:
        "你可以先看 案件 /案件脈絡的正式工作台、結果與報告的收斂讀法、歷史紀錄 /共享判讀的唯讀展示。",
      heroSummary: "這裡是固定展示內容，只能瀏覽，不能修改或送出新的分析。",
      showcaseHighlights: [],
      readOnlyRules: [],
      formalWorkspaceExplainer: "正式版workspace會讓consultant進入自己的辦案路徑",
      sections: [],
    }),
    "你可以先看案件主控台、結果與報告的收斂讀法、歷史紀錄與共享判讀的唯讀展示。",
  );
});
