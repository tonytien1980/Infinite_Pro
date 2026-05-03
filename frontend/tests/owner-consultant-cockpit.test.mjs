import assert from "node:assert/strict";
import test from "node:test";

import {
  buildSparseDiagnosticCockpitView,
  isSparseDiagnosticLane,
} from "../src/lib/owner-consultant-cockpit.ts";

test("sparse diagnostic lane detection accepts diagnostic_start only", () => {
  assert.equal(isSparseDiagnosticLane("diagnostic_start"), true);
  assert.equal(isSparseDiagnosticLane("material_review_start"), false);
  assert.equal(isSparseDiagnosticLane("decision_convergence_start"), false);
  assert.equal(isSparseDiagnosticLane(""), false);
  assert.equal(isSparseDiagnosticLane(undefined), false);
});

test("sparse diagnostic cockpit view gives one owner-consultant loop", () => {
  const view = buildSparseDiagnosticCockpitView({
    laneId: "diagnostic_start",
    surface: "matter",
    evidenceCount: 0,
    hasDeliverable: false,
    canRun: true,
  });

  assert.equal(view.statusLabel, "少資料快速診斷");
  assert.equal(view.primaryActionLabel, "先跑一輪探索分析");
  assert.equal(view.primaryHref, "#task-mainline");
  assert.equal(view.secondaryActionLabel, "先補一份關鍵資料");
  assert.equal(view.secondaryHref, "#matter-evidence");
  assert.match(view.boundaryNote, /探索型判斷/);
  assert.equal(view.loopSteps.length, 5);
});

test("sparse diagnostic cockpit view points to evidence when run is blocked", () => {
  const view = buildSparseDiagnosticCockpitView({
    laneId: "diagnostic_start",
    surface: "task",
    evidenceCount: 0,
    hasDeliverable: false,
    canRun: false,
  });

  assert.equal(view.primaryActionLabel, "先補關鍵資料");
  assert.equal(view.primaryHref, "#evidence-readiness");
  assert.match(view.blockerSummary, /資料仍偏少/);
});

test("sparse diagnostic cockpit view points to result when deliverable exists", () => {
  const view = buildSparseDiagnosticCockpitView({
    laneId: "diagnostic_start",
    surface: "deliverable",
    evidenceCount: 2,
    hasDeliverable: true,
    canRun: true,
  });

  assert.equal(view.primaryActionLabel, "先看這份結果能不能用");
  assert.equal(view.primaryHref, "#deliverable-main");
  assert.equal(view.feedbackPrompt, "這份結果對你有幫助嗎？");
});
