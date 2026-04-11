import test from "node:test";
import assert from "node:assert/strict";

import { buildMatterAdvanceGuide } from "../src/lib/matter-advance-guide.ts";

function buildContinuationSurface(actionId, workflowLayer) {
  return {
    title: "案件後續",
    summary: "後續摘要",
    workflow_layer: workflowLayer,
    primary_action: {
      action_id: actionId,
      label: "正式結案",
    },
  };
}

test("newly created sparse matters do not claim they are ready to close before a deliverable exists", () => {
  const guide = buildMatterAdvanceGuide({
    arrivedFromNew: true,
    focusTask: {
      id: "task-1",
      title: "焦點工作",
    },
    latestDeliverable: null,
    sourceMaterialCount: 0,
    evidenceCount: 1,
    continuationSurface: buildContinuationSurface("close_case", "closure"),
  });

  assert.equal(guide.title, "案件已建立，現在先補件或先跑第一版");
  assert.equal(guide.primaryActionLabel, "直接產出第一版交付物");
});

test("matters with a real deliverable can still show the formal closeout posture", () => {
  const guide = buildMatterAdvanceGuide({
    arrivedFromNew: false,
    focusTask: {
      id: "task-1",
      title: "焦點工作",
    },
    latestDeliverable: {
      deliverable_id: "deliverable-1",
      title: "正式交付物",
    },
    sourceMaterialCount: 2,
    evidenceCount: 3,
    continuationSurface: buildContinuationSurface("close_case", "closure"),
  });

  assert.equal(guide.title, "這案已可正式結案");
  assert.equal(guide.primaryActionLabel, "正式結案");
});
