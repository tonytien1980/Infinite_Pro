import test from "node:test";
import assert from "node:assert/strict";

import {
  buildOverviewUsabilityView,
  buildMatterUsabilityView,
  buildDeliverableUsabilityView,
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

  assert.equal(view.guideTitle, "總覽怎麼用最快");
  assert.equal(view.guideItems[0]?.tone, "accent");
  assert.match(view.guideDescription, /首頁只負責把你送回正確工作面/);
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

  assert.equal(view.sectionGuideTitle, "案件頁怎麼看最快");
  assert.equal(view.guideItems[0]?.href, "#matter-mainline");
  assert.match(view.mainlineCopy, /先抓主線/);
  assert.match(view.worldStateDisclosureDescription, /只有在你要確認案件世界層/);
});

test("matter usability view keeps the first guide item focused on command, not structure", () => {
  const view = buildMatterUsabilityView({
    evidenceCount: 1,
    deliverableCount: 1,
    activeTaskCount: 2,
    hasCaseWorldState: true,
    hasOpenEvidenceGaps: true,
    hasRecentDeliverable: true,
  });

  assert.equal(view.guideItems[0]?.href, "#matter-mainline");
  assert.match(view.guideItems[0]?.title, /案件主線/);
  assert.match(view.guideItems[2]?.copy, /交付物|來源與證據/);
  assert.equal(view.guideItems[0]?.title, "先看案件主線與指揮判斷");
  assert.equal(
    view.sectionGuideDescription,
    "先抓這輪主線、最大 blocker 與最值得先推的 task，再看 authority 或背景層。",
  );
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
  assert.match(view.sectionGuideDescription, /先抓這輪主線/);
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
  assert.match(view.sectionGuideDescription, /先決定你現在是在整理版本/);
});
