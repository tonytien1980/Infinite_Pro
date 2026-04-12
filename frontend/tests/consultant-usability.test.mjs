import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  buildDeliverablePrimaryActionView,
  buildOverviewUsabilityView,
  buildMatterUsabilityView,
  buildMatterSectionGuideItems,
  buildDeliverableUsabilityView,
  buildEvidenceWorkspaceUsabilityView,
} from "../src/lib/consultant-usability.ts";

test("overview usability view promotes one primary action and two fallback paths", () => {
  const view = buildOverviewUsabilityView({
    homepageDisplayPreference: "matters",
    focusTitle: "回到案件 Alpha",
    focusCopy: "這是目前最值得接續的一件事。",
    focusHref: "/matters/matter-alpha",
    focusActionLabel: "前往案件頁",
    hasPrimaryMatter: true,
    hasPrimaryDeliverable: true,
    hasPendingEvidenceTask: true,
  });

  assert.equal(view.primaryLabel, "現在先做這件事");
  assert.equal(view.primaryHref, "/matters/matter-alpha");
  assert.equal(view.checklist.length, 3);
  assert.equal(view.guideItems.length, 3);
  assert.equal(view.guideItems[0]?.href, "/matters/matter-alpha");
});

test("overview usability view keeps homepage guidance low-noise and route-oriented", () => {
  const view = buildOverviewUsabilityView({
    homepageDisplayPreference: "deliverables",
    focusTitle: "回到交付物 Beta",
    focusCopy: "這份交付物是最近最值得回看的結果。",
    focusHref: "/deliverables/deliverable-beta",
    focusActionLabel: "回到交付物",
    hasPrimaryMatter: true,
    hasPrimaryDeliverable: true,
    hasPendingEvidenceTask: false,
  });

  assert.equal(view.guideTitle, "先回主工作");
  assert.equal(view.guideItems[0]?.tone, "accent");
  assert.match(view.guideDescription, /總覽現在只做入口/);
});

test("overview usability view keeps launcher guidance ahead of governance summaries", () => {
  const view = buildOverviewUsabilityView({
    homepageDisplayPreference: "matters",
    focusTitle: "回到案件 Alpha",
    focusCopy: "這是目前最值得接續的一件事。",
    focusHref: "/matters/matter-alpha",
    focusActionLabel: "前往案件頁",
    hasPrimaryMatter: true,
    hasPrimaryDeliverable: true,
    hasPendingEvidenceTask: true,
  });

  assert.equal(view.primaryLabel, "現在先做這件事");
  assert.equal(view.guideTitle, "先回主工作");
  assert.equal(
    view.guideDescription,
    "總覽現在只做入口：先把你送回現在最值得接續的一件事；firm operating、phase closure、generalist governance 都留到第二層再看。",
  );
  assert.equal(view.checklist[2], "治理摘要留在第二層，不在首屏搶主線。");
});

test("matter usability view keeps the mainline first and pushes world-state to second layer", () => {
  const view = buildMatterUsabilityView({
    evidenceCount: 1,
    deliverableCount: 2,
    activeTaskCount: 3,
    hasCaseWorldState: true,
    hasOpenEvidenceGaps: true,
    hasRecentDeliverable: true,
  });

  assert.equal(view.sectionGuideTitle, "頁內導覽");
  assert.equal(view.guideItems[0]?.href, "#matter-mainline");
  assert.match(view.mainlineCopy, /主線|blocker|下一步/);
  assert.match(view.worldStateDisclosureDescription, /只有在你要確認案件世界層/);
});

test("matter usability view turns the guide into a local rail instead of a second summary wall", () => {
  const view = buildMatterUsabilityView({
    evidenceCount: 1,
    deliverableCount: 1,
    activeTaskCount: 2,
    hasCaseWorldState: true,
    hasOpenEvidenceGaps: true,
    hasRecentDeliverable: true,
  });

  assert.equal(view.guideItems[0]?.href, "#matter-mainline");
  assert.equal(view.guideItems[0]?.title, "主線");
  assert.equal(view.guideItems[1]?.title, "世界層");
  assert.equal(view.guideItems[2]?.title, "背景");
  assert.equal(
    view.sectionGuideDescription,
    "這條 rail 只做頁內導覽：先看主線、需要時再核對世界層與背景，不再重講摘要。",
  );
  assert.match(view.guideItems[2]?.copy, /連續性|研究|旗艦|組織記憶/);
});

test("matter section guide assembly keeps the rail focused on page-local navigation", () => {
  const matterUsabilityView = buildMatterUsabilityView({
    evidenceCount: 1,
    deliverableCount: 1,
    activeTaskCount: 2,
    hasCaseWorldState: true,
    hasOpenEvidenceGaps: true,
    hasRecentDeliverable: true,
  });

  const items = buildMatterSectionGuideItems({
    matterId: "matter-alpha",
    latestDeliverableId: "deliverable-beta",
    matterUsabilityView,
    matterCommandView: {
      blockerCopy: "目前還卡在證據厚度不夠。",
      nextStepCopy: "先回來源與證據，再看是否直接補件。",
    },
  });

  assert.equal(items[0]?.title, "主線");
  assert.equal(items[0]?.copy, "先看這輪在判斷什麼、目前卡在哪裡，以及現在該推哪一步。");
  assert.equal(items[0]?.meta, "一進頁面先看這裡");
  assert.equal(items[1]?.href, "#matter-world-state");
  assert.equal(items[2]?.href, "#matter-background");
});

test("matter usability view points the first guide item at the mainline and keeps authority work second-layer", () => {
  const view = buildMatterUsabilityView({
    evidenceCount: 4,
    deliverableCount: 1,
    activeTaskCount: 1,
    hasCaseWorldState: true,
    hasOpenEvidenceGaps: false,
    hasRecentDeliverable: true,
  });

  assert.equal(view.guideItems[0]?.href, "#matter-mainline");
  assert.equal(view.guideItems[1]?.href, "#matter-world-state");
  assert.equal(view.guideItems[2]?.href, "#matter-background");
  assert.match(view.sectionGuideDescription, /頁內導覽/);
});

test("matter usability view keeps continuity, research, and flagship-heavy reading out of first-screen competition", () => {
  const view = buildMatterUsabilityView({
    evidenceCount: 2,
    deliverableCount: 1,
    activeTaskCount: 2,
    hasCaseWorldState: true,
    hasOpenEvidenceGaps: true,
    hasRecentDeliverable: true,
  });

  assert.equal(
    view.sectionGuideDescription,
    "這條 rail 只做頁內導覽：先看主線、需要時再核對世界層與背景，不再重講摘要。",
  );
  assert.equal(
    view.guideItems[2]?.copy,
    "連續性、研究、旗艦摘要與組織記憶都移到第二層，需要補讀時再回來。",
  );
});

test("deliverable usability view keeps publish/read/evidence paths separate and low-noise", () => {
  const view = buildDeliverableUsabilityView({
    deliverableStatus: "draft",
    hasPendingFormalSave: true,
    hasLinkedEvidence: true,
    hasHighImpactGaps: true,
    hasMatterWorkspace: true,
  });

  assert.equal(view.sectionGuideTitle, "這份交付物怎麼讀最快");
  assert.equal(view.guideItems[0]?.href, "#deliverable-publish-check");
  assert.match(
    view.contextDisclosureDescription,
    /當你要理解這份交付物在整個案件世界中的定位時/,
  );
  assert.match(
    view.writebackDisclosureDescription,
    /只有在你要確認這份交付物會怎麼寫回案件世界/,
  );
});

test("deliverable usability view keeps publish, reading, and evidence lanes separate", () => {
  const view = buildDeliverableUsabilityView({
    deliverableStatus: "final",
    hasPendingFormalSave: false,
    hasLinkedEvidence: true,
    hasHighImpactGaps: false,
    hasMatterWorkspace: true,
  });

  assert.equal(view.guideItems[0]?.href, "#deliverable-publish-check");
  assert.equal(view.guideItems[1]?.href, "#deliverable-reading");
  assert.equal(view.guideItems[2]?.href, "#deliverable-evidence");
  assert.equal(
    view.sectionGuideDescription,
    "首屏只留版本、姿態與主要動作；摘要、依據、寫回、連續性與研究都放到第二層。",
  );
});

test("deliverable usability view keeps writeback detail out of the first-screen guide", () => {
  const view = buildDeliverableUsabilityView({
    deliverableStatus: "draft",
    hasPendingFormalSave: false,
    hasLinkedEvidence: true,
    hasHighImpactGaps: true,
    hasMatterWorkspace: true,
  });

  assert.equal(
    view.sectionGuideDescription,
    "首屏只留版本、姿態與主要動作；摘要、依據、寫回、連續性與研究都放到第二層。",
  );
  assert.equal(view.guideItems[2]?.eyebrow, "需要依據時");
  assert.equal(
    view.guideItems[2]?.copy,
    "只有當你要核對依據或背景，再往下看來源、脈絡、寫回與連續性。",
  );
});

test("deliverable primary action view keeps continuity aware actions in the primary slot", () => {
  assert.deepEqual(
    buildDeliverablePrimaryActionView({
      deliverableStatus: "draft",
      hasPendingFormalSave: false,
      hasUnsavedChanges: false,
      continuityActionId: "record_checkpoint",
      continuityActionLabel: "記錄 checkpoint",
    }),
    {
      kind: "record_checkpoint",
      label: "記錄 checkpoint",
    },
  );

  assert.deepEqual(
    buildDeliverablePrimaryActionView({
      deliverableStatus: "draft",
      hasPendingFormalSave: false,
      hasUnsavedChanges: false,
      continuityActionId: "record_outcome",
      continuityActionLabel: "記錄 outcome",
    }),
    {
      kind: "record_outcome",
      label: "記錄 outcome",
    },
  );

  assert.deepEqual(
    buildDeliverablePrimaryActionView({
      deliverableStatus: "draft",
      hasPendingFormalSave: false,
      hasUnsavedChanges: false,
      continuityActionId: "close_case",
      continuityActionLabel: "正式結案",
    }),
    {
      kind: "close_case",
      label: "正式結案",
    },
  );
});

test("deliverable primary action view keeps save precedence without collapsing continuity states", () => {
  assert.deepEqual(
    buildDeliverablePrimaryActionView({
      deliverableStatus: "draft",
      hasPendingFormalSave: true,
      hasUnsavedChanges: false,
      continuityActionId: "record_checkpoint",
      continuityActionLabel: "記錄 checkpoint",
    }),
    {
      kind: "save",
      label: "先儲存正式草稿",
    },
  );

  assert.deepEqual(
    buildDeliverablePrimaryActionView({
      deliverableStatus: "draft",
      hasPendingFormalSave: false,
      hasUnsavedChanges: true,
      continuityActionId: "record_outcome",
      continuityActionLabel: "記錄 outcome",
    }),
    {
      kind: "save",
      label: "儲存正式內容",
    },
  );

  assert.deepEqual(
    buildDeliverablePrimaryActionView({
      deliverableStatus: "final",
      hasPendingFormalSave: false,
      hasUnsavedChanges: false,
      continuityActionId: null,
      continuityActionLabel: null,
    }),
    {
      kind: "export_docx",
      label: "匯出 DOCX",
    },
  );
});

test("deliverable workspace first screen keeps version context posture and primary action without high-weight counts", () => {
  const source = readFileSync(
    new URL("../src/components/deliverable-workspace-panel.tsx", import.meta.url),
    "utf8",
  );
  const heroBlock =
    source.match(
      /<section className="hero-card deliverable-hero deliverable-workspace-hero">[\s\S]*?(?=<section className="panel section-anchor" id="deliverable-publish-check">)/,
    )?.[0] ?? "";
  const publishCheckBlock =
    source.match(/<section className="panel section-anchor" id="deliverable-publish-check">[\s\S]*?<\/section>/)?.[0] ?? "";
  const guideItemsBlock =
    source.match(/const deliverableSectionGuideItems = workspace[\s\S]*?const deliverableVersionSummary =/)?.[0] ?? "";

  assert.match(heroBlock, /deliverable-hero-main/);
  assert.match(heroBlock, /deliverable-hero-rail/);
  assert.match(heroBlock, /目前版本/);
  assert.match(heroBlock, /目前姿態/);
  assert.match(heroBlock, /deliverablePrimaryActionView/);
  assert.match(publishCheckBlock, /發布前快速檢查/);
  assert.match(guideItemsBlock, /const deliverableSectionGuideItems = workspace/);
  assert.doesNotMatch(publishCheckBlock, /linked_evidence|high_impact_gaps|source_materials\.length/);
  assert.doesNotMatch(guideItemsBlock, /linked_evidence|high_impact_gaps|source_materials\.length|objectSetHighlights/);
});

test("evidence usability view keeps the first screen focused on gap, supplement path, and return destination", () => {
  const view = buildEvidenceWorkspaceUsabilityView({
    hasHighImpactGaps: true,
    hasFocusTask: true,
    focusTaskTitle: "補齊營運與銷售證據",
    sourceMaterialCount: 2,
    evidenceCount: 3,
  });

  assert.equal(view.sectionGuideTitle, "這個證據工作面怎麼讀最快");
  assert.equal(
    view.sectionGuideDescription,
    "先看到底缺什麼，再決定補哪種材料；補完後再回主線續推。",
  );
  assert.equal(view.guideItems.length, 3);
  assert.equal(view.guideItems[0]?.title, "充分性摘要與高影響缺口");
  assert.equal(view.guideItems[1]?.title, "補件與新增來源");
  assert.equal(view.guideItems[2]?.title, "先回焦點工作紀錄");
  assert.equal(view.railEyebrow, "補完後回哪裡");
  assert.match(view.railCopy, /補齊營運與銷售證據/);
});

test("evidence first screen stays supplement-first instead of stacking a dashboard wall", () => {
  const source = readFileSync(
    new URL("../src/components/artifact-evidence-workspace-panel.tsx", import.meta.url),
    "utf8",
  );
  const heroBlock =
    source.match(/<section className="hero-card evidence-hero">[\s\S]*?<\/section>/)?.[0] ?? "";

  assert.match(heroBlock, /先判斷夠不夠，再決定要不要補/);
  assert.match(heroBlock, /補完後回哪裡/);
  assert.doesNotMatch(heroBlock, /meta-row/);
  assert.doesNotMatch(heroBlock, /hero-metrics-grid/);
  assert.doesNotMatch(heroBlock, /這頁先做什麼/);
  assert.doesNotMatch(heroBlock, /hero-focus-card-warm/);
  assert.doesNotMatch(heroBlock, /button-secondary/);
  assert.equal((heroBlock.match(/button-primary/g) ?? []).length, 1);
  assert.equal((heroBlock.match(/hero-focus-card/g) ?? []).length, 2);
});
