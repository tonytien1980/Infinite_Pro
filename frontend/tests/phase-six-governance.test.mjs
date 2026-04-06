import test from "node:test";
import assert from "node:assert/strict";

import {
  labelForPhaseSixAuditStatus,
  labelForPhaseSixGeneralistPosture,
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
