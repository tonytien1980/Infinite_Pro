import test from "node:test";
import assert from "node:assert/strict";

import {
  buildWorkbenchHomeLoadPlan,
  runWorkbenchHomeLoadLane,
  WORKBENCH_HOME_PRIMARY_LOAD_KEYS,
  WORKBENCH_HOME_SECONDARY_LOAD_KEYS,
} from "../src/lib/workbench-home-load-plan.ts";

test("workbench home load plan keeps only route-defining data in the primary lane", () => {
  const plan = buildWorkbenchHomeLoadPlan();

  assert.deepEqual(plan.primary, [
    "tasks",
    "matters",
    "extensions",
  ]);
  assert.equal(plan.primary.length, 3);
  assert.ok(!plan.primary.includes("firmOperating"));
  assert.ok(!plan.primary.includes("phaseSixAudit"));
});

test("workbench home load plan moves governance and operating summaries to the secondary lane", () => {
  const plan = buildWorkbenchHomeLoadPlan();

  assert.ok(plan.secondary.includes("firmOperating"));
  assert.ok(plan.secondary.includes("phaseFiveClosure"));
  assert.ok(plan.secondary.includes("phaseSixAudit"));
  assert.ok(plan.secondary.includes("phaseSixCompletionReview"));
  assert.ok(plan.secondary.includes("phaseSixGuidance"));
  assert.equal(
    new Set([...WORKBENCH_HOME_PRIMARY_LOAD_KEYS, ...WORKBENCH_HOME_SECONDARY_LOAD_KEYS]).size,
    WORKBENCH_HOME_PRIMARY_LOAD_KEYS.length + WORKBENCH_HOME_SECONDARY_LOAD_KEYS.length,
  );
});

test("workbench home load lanes settle primary work before secondary work starts", async () => {
  const events = [];
  const loaders = {
    tasks: async () => {
      events.push("tasks:start");
      await Promise.resolve();
      events.push("tasks:end");
    },
    matters: async () => {
      events.push("matters:start");
      await Promise.resolve();
      events.push("matters:end");
    },
    extensions: async () => {
      events.push("extensions:start");
      await Promise.resolve();
      events.push("extensions:end");
    },
    firmOperating: async () => {
      events.push("firmOperating:start");
      await Promise.resolve();
      events.push("firmOperating:end");
    },
  };

  await runWorkbenchHomeLoadLane(["tasks", "matters", "extensions"], loaders);
  await runWorkbenchHomeLoadLane(["firmOperating"], loaders);

  assert.deepEqual(events.slice(0, 6), [
    "tasks:start",
    "matters:start",
    "extensions:start",
    "tasks:end",
    "matters:end",
    "extensions:end",
  ]);
  assert.deepEqual(events.slice(6), ["firmOperating:start", "firmOperating:end"]);
});
