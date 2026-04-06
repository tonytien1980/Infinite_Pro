import test from "node:test";
import assert from "node:assert/strict";

import {
  labelForPhaseSixAuditStatus,
  labelForPhaseSixGeneralistPosture,
  labelForPhaseSixGovernancePosture,
  labelForPhaseSixReuseRecommendation,
} from "../src/lib/phase-six-governance.ts";

test("phase 6 audit labels stay low-noise and consultant-readable", () => {
  assert.equal(labelForPhaseSixAuditStatus("balanced"), "目前覆蓋較穩");
  assert.equal(labelForPhaseSixAuditStatus("watch_drift"), "需持續防偏科");
  assert.equal(labelForPhaseSixGeneralistPosture("broad"), "目前仍維持全面型姿態");
  assert.equal(
    labelForPhaseSixGeneralistPosture("watching_bias"),
    "目前仍全面，但需持續看偏移",
  );
});

test("phase 6 reuse-boundary governance labels stay low-noise and readable", () => {
  assert.equal(labelForPhaseSixGovernancePosture("stable"), "目前治理較穩");
  assert.equal(labelForPhaseSixGovernancePosture("guardrails_needed"), "仍需治理邊界");
  assert.equal(labelForPhaseSixReuseRecommendation("can_expand"), "可擴大重用");
  assert.equal(labelForPhaseSixReuseRecommendation("keep_contextual"), "維持局部參考");
  assert.equal(
    labelForPhaseSixReuseRecommendation("restrict_narrow_use"),
    "不要擴大套用",
  );
});
