import test from "node:test";
import assert from "node:assert/strict";

import {
  buildEvidenceOnDemandPanelPlan,
  buildMatterDeferredTabPlan,
  buildMatterOnDemandPanelPlan,
} from "../src/lib/workbench-lazy-surface-plan.ts";

test("matter on-demand panel plan keeps second-layer panels in a stable order", () => {
  const plan = buildMatterOnDemandPanelPlan();

  assert.deepEqual(
    plan.map((item) => item.key),
    ["worldState", "settings", "background"],
  );
  assert.equal(plan[0]?.title, "案件世界狀態與寫回策略");
  assert.ok(plan.every((item) => item.lazy));
});

test("evidence on-demand panel plan hides duplicate review when there are no candidates", () => {
  const plan = buildEvidenceOnDemandPanelPlan({
    hasCanonicalizationCandidates: false,
  });

  assert.deepEqual(
    plan.map((item) => item.key),
    ["materials", "artifacts", "chains", "relatedTasks"],
  );
});

test("evidence on-demand panel plan restores duplicate review ahead of deep evidence reading", () => {
  const plan = buildEvidenceOnDemandPanelPlan({
    hasCanonicalizationCandidates: true,
  });

  assert.deepEqual(
    plan.map((item) => item.key),
    ["duplicateReview", "materials", "artifacts", "chains", "relatedTasks"],
  );
  assert.equal(plan[0]?.title, "需確認是否同一份材料");
  assert.ok(plan.every((item) => item.lazy));
});

test("matter deferred tab plan keeps overview eager and defers non-overview tabs", () => {
  const plan = buildMatterDeferredTabPlan();

  assert.deepEqual(
    plan.map((item) => [item.key, item.lazy]),
    [
      ["overview", false],
      ["decision", true],
      ["evidence", true],
      ["deliverables", true],
      ["history", true],
    ],
  );
});
