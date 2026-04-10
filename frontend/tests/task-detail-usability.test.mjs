import test from "node:test";
import assert from "node:assert/strict";

import { buildTaskDetailUsabilityView } from "../src/lib/task-detail-usability.ts";

test("task detail usability view makes the first action explicit when evidence is thin", () => {
  const view = buildTaskDetailUsabilityView({
    hasThinTaskEvidence: true,
    hasLatestDeliverable: false,
    latestDeliverableTitle: "",
    hasMatterWorkspace: true,
    runButtonLabel: "執行分析",
    runDestinationLabel: "分析後會先形成正式交付結果",
    laneTitle: "材料審閱姿態",
    laneSummary: "目前更像 review memo / assessment，不是最終決策版本。",
    readinessLabel: "需補強",
    readinessSummary: "目前資料仍偏薄，但不用卡住。",
    evidenceCount: 1,
    sourceMaterialCount: 1,
  });

  assert.equal(view.primaryLabel, "現在先做這件事");
  assert.equal(view.primaryActionLabel, "執行分析");
  assert.equal(view.guideItems[0]?.href, "#readiness-governance");
  assert.equal(view.guideItems[1]?.href, "#run-panel");
  assert.equal(view.guideItems[2]?.href, "#workspace-lane");
  assert.match(view.primaryCopy, /資料仍偏薄/);
});

test("task detail usability view points to deliverable when a result already exists", () => {
  const view = buildTaskDetailUsabilityView({
    hasThinTaskEvidence: false,
    hasLatestDeliverable: true,
    latestDeliverableTitle: "市場風險評估 memo",
    hasMatterWorkspace: true,
    runButtonLabel: "執行分析",
    runDestinationLabel: "最新結果已經形成，可直接回看正式交付物。",
    laneTitle: "目前交付等級",
    laneSummary: "已形成正式交付結果。",
    readinessLabel: "可直接推進",
    readinessSummary: "這筆工作已具備基本分析條件。",
    evidenceCount: 4,
    sourceMaterialCount: 3,
  });

  assert.equal(view.primaryActionLabel, "打開正式交付物");
  assert.equal(view.primaryHref, "#deliverable-surface");
  assert.equal(view.guideItems[2]?.href, "#deliverable-surface");
  assert.match(view.railSummary, /市場風險評估 memo/);
});

test("task detail usability view keeps the guide focused on readiness, run decision, and result destination", () => {
  const view = buildTaskDetailUsabilityView({
    hasThinTaskEvidence: false,
    hasLatestDeliverable: false,
    latestDeliverableTitle: "",
    hasMatterWorkspace: true,
    runButtonLabel: "執行分析",
    runDestinationLabel: "執行後會先寫回正式交付結果。",
    laneTitle: "目前交付等級",
    laneSummary: "這筆工作已具備基本分析條件。",
    readinessLabel: "可直接推進",
    readinessSummary: "目前資料已達基本可運作狀態。",
    evidenceCount: 3,
    sourceMaterialCount: 2,
  });

  assert.equal(view.guideItems.length, 3);
  assert.equal(view.guideItems[0]?.title, "先看可直接推進");
  assert.equal(view.guideItems[1]?.href, "#run-panel");
  assert.match(view.guideDescription, /先判斷能不能跑/);
});

test("task detail usability view builds an operating summary when the best next move is to fill evidence gaps", () => {
  const view = buildTaskDetailUsabilityView({
    hasThinTaskEvidence: true,
    hasLatestDeliverable: false,
    latestDeliverableTitle: "",
    hasMatterWorkspace: true,
    runButtonLabel: "執行分析",
    runDestinationLabel: "執行後會先形成正式交付結果。",
    laneTitle: "材料審閱姿態",
    laneSummary: "目前更像 review memo / assessment，不是最終決策版本。",
    readinessLabel: "需補強",
    readinessSummary: "目前資料仍偏薄，但不用卡住。",
    evidenceCount: 1,
    sourceMaterialCount: 1,
    hasResearchGuidance: true,
    researchSummary: "先確認第一個 research question 與 stop condition。",
    hasContinuationSummary: false,
    continuationSummary: "",
  });

  assert.equal(view.operatingSummaryTitle, "這頁現在怎麼推最快");
  assert.match(view.operatingSummaryCopy, /資料仍偏薄/);
  assert.equal(view.operatingNotes[0]?.href, "#workspace-lane");
  assert.match(view.operatingNotes[0]?.copy, /先補來源與證據/);
  assert.match(view.operatingNotes[1]?.copy, /research question/);
});

test("task detail usability view builds a result-first operating summary when a deliverable already exists", () => {
  const view = buildTaskDetailUsabilityView({
    hasThinTaskEvidence: false,
    hasLatestDeliverable: true,
    latestDeliverableTitle: "季度風險掃描 memo",
    hasMatterWorkspace: true,
    runButtonLabel: "執行分析",
    runDestinationLabel: "最新結果已經形成，可直接回看正式交付物。",
    laneTitle: "目前交付等級",
    laneSummary: "已形成正式交付結果。",
    readinessLabel: "可直接推進",
    readinessSummary: "這筆工作已具備基本分析條件。",
    evidenceCount: 5,
    sourceMaterialCount: 4,
    hasResearchGuidance: false,
    researchSummary: "",
    hasContinuationSummary: true,
    continuationSummary: "最近 checkpoint 已形成，可直接回看成果或續推下一輪。",
  });

  assert.equal(view.operatingNotes.length, 3);
  assert.equal(view.operatingNotes[0]?.href, "#deliverable-surface");
  assert.match(view.operatingNotes[0]?.copy, /季度風險掃描 memo/);
  assert.match(view.operatingNotes[1]?.copy, /checkpoint/);
  assert.match(view.operatingNotes[2]?.copy, /可直接推進/);
});

test("task detail usability view condenses operating notes into three low-noise lanes", () => {
  const view = buildTaskDetailUsabilityView({
    hasThinTaskEvidence: false,
    hasLatestDeliverable: false,
    latestDeliverableTitle: "",
    hasMatterWorkspace: true,
    runButtonLabel: "執行分析",
    runDestinationLabel: "執行後會先寫回正式交付結果。",
    laneTitle: "目前交付等級",
    laneSummary: "這筆工作已具備基本分析條件。",
    readinessLabel: "可直接推進",
    readinessSummary: "目前資料已達基本可運作狀態。",
    evidenceCount: 3,
    sourceMaterialCount: 2,
    hasResearchGuidance: false,
    researchSummary: "",
    hasContinuationSummary: false,
    continuationSummary: "",
  });

  assert.equal(view.operatingNotes.length, 3);
  assert.equal(view.operatingNotes[0]?.label, "最有槓桿的下一步");
  assert.equal(view.operatingNotes[1]?.label, "主線限制");
  assert.equal(view.operatingNotes[2]?.href, "#run-panel");
});
