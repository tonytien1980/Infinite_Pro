import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { buildTaskDetailUsabilityView } from "../src/lib/task-detail-usability.ts";

test("task detail usability view prefers matter handoff when evidence is thin", () => {
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
    hasResearchGuidance: false,
    researchSummary: "",
    hasContinuationSummary: false,
    continuationSummary: "",
  });

  assert.equal(view.handoffTarget, "matter");
  assert.equal(view.handoffHref, "#workspace-lane");
  assert.match(view.handoffSummary, /先回案件工作面補脈絡與證據/);
});

test("task detail usability view prefers deliverable handoff when a formal result exists", () => {
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

  assert.equal(view.handoffTarget, "deliverable");
  assert.equal(view.handoffHref, "#deliverable-surface");
  assert.match(view.handoffSummary, /先回正式交付物閱讀、修訂或發布/);
});

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

test("task detail usability view retains the posture signal on the first screen", () => {
  const view = buildTaskDetailUsabilityView({
    hasThinTaskEvidence: false,
    hasLatestDeliverable: false,
    latestDeliverableTitle: "",
    hasMatterWorkspace: true,
    runButtonLabel: "執行分析",
    runDestinationLabel: "執行後會先寫回正式交付結果。",
    laneTitle: "材料審閱姿態",
    laneSummary: "目前更像 review memo / assessment，不是最終決策版本。",
    readinessLabel: "可直接推進",
    readinessSummary: "目前資料已達基本可運作狀態。",
    evidenceCount: 3,
    sourceMaterialCount: 2,
  });

  assert.equal(view.primaryPostureLabel, "材料審閱姿態");
  assert.match(view.primaryPostureCopy, /review memo/);
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
  assert.equal(view.railEyebrow, "第二層回跳");
  assert.match(view.railSummary, /先回正式交付物閱讀、修訂或發布/);
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
  assert.equal(view.guideTitle, "第二層導讀");
  assert.match(view.guideDescription, /第二層/);
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

  assert.equal(view.operatingSummaryTitle, "第二層操作提示");
  assert.match(view.operatingSummaryCopy, /第二層/);
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

test("task detail usability view demotes secondary guidance into the second layer", () => {
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

  assert.equal(view.guideTitle, "第二層導讀");
  assert.match(view.guideDescription, /第二層/);
  assert.equal(view.operatingSummaryTitle, "第二層操作提示");
  assert.match(view.operatingSummaryCopy, /主線/);
});

test("task first screen no longer keeps a metrics strip under the hero", () => {
  const source = readFileSync(
    new URL("../src/components/task-detail-panel.tsx", import.meta.url),
    "utf8",
  );
  const heroBlock =
    source.match(
      /<section className="hero-card decision-hero">[\s\S]*?(?=\{taskDetailUsabilityView \? \()/,
    )?.[0] ?? "";

  assert.match(heroBlock, /hero-focus-card hero-focus-card-warm/);
  assert.doesNotMatch(heroBlock, /hero-metrics-grid/);
});

test("task detail usability view aligns the rail with the same handoff contract", () => {
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
    hasResearchGuidance: false,
    researchSummary: "",
    hasContinuationSummary: false,
    continuationSummary: "",
  });

  assert.equal(view.railEyebrow, "第二層回跳");
  assert.match(view.railTitle, /案件工作面/);
  assert.match(view.railSummary, /先回案件工作面補脈絡與證據/);
  assert.match(view.handoffReasonLabel, /脈絡/);
});

test("task detail operating notes keep the labels direct and consultant-facing", () => {
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
    hasResearchGuidance: true,
    researchSummary: "先確認第一個 research question 與 stop condition。",
    hasContinuationSummary: false,
    continuationSummary: "",
  });

  assert.equal(view.operatingNotes[0]?.label, "最有槓桿的下一步");
  assert.equal(view.operatingNotes[1]?.label, "目前最大限制");
  assert.equal(view.operatingNotes[2]?.label, "不直接跑時");
});
