import test from "node:test";
import assert from "node:assert/strict";

import {
  labelForPhaseSixAuditStatus,
  labelForPhaseSixCalibrationStatus,
  labelForPhaseSixContextDistance,
  labelForPhaseSixGeneralistPosture,
  labelForPhaseSixGuidancePosture,
  labelForPhaseSixGovernancePosture,
  labelForPhaseSixReuseConfidence,
  labelForPhaseSixReuseRecommendation,
  summarizePhaseSixCalibrationItems,
  summarizePhaseSixCalibrationAwareWeightingItems,
  summarizePhaseSixDistanceItems,
  summarizePhaseSixGuidanceItems,
  summarizePhaseSixHostWeighting,
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

test("phase 6 host weighting summary stays low-noise and readable", () => {
  assert.equal(
    summarizePhaseSixHostWeighting({
      hostWeightingSummary:
        "Host 現在會先讓較可擴大重用的來源站前面，窄情境模板 / 骨架則先留背景校正。",
      hostWeightingGuardrailNote:
        "這一刀只影響 reusable asset ordering，不是硬性封鎖。",
      governanceItems: [],
    }),
    "Host 現在會先讓較可擴大重用的來源站前面，窄情境模板 / 骨架則先留背景校正。",
  );
});

test("phase 6 guidance posture labels stay low-noise and readable", () => {
  assert.equal(labelForPhaseSixGuidancePosture("light_guidance"), "維持低噪音");
  assert.equal(labelForPhaseSixGuidancePosture("balanced_guidance"), "適度明示");
  assert.equal(labelForPhaseSixGuidancePosture("guarded_guidance"), "先保守引導");
  assert.equal(
    summarizePhaseSixGuidanceItems([
      "先把 shared intelligence 當校正主線，不要直接當成定論。",
      "窄情境來源若有其他較穩替代，先留背景校正。",
    ]),
    "先把 shared intelligence 當校正主線，不要直接當成定論。｜窄情境來源若有其他較穩替代，先留背景校正。",
  );
});

test("phase 6 distance and reuse-confidence labels stay low-noise and readable", () => {
  assert.equal(labelForPhaseSixContextDistance("close"), "距離較近");
  assert.equal(labelForPhaseSixContextDistance("moderate"), "仍有距離");
  assert.equal(labelForPhaseSixContextDistance("far"), "距離偏遠");
  assert.equal(labelForPhaseSixReuseConfidence("high_confidence"), "高信心重用");
  assert.equal(labelForPhaseSixReuseConfidence("bounded_confidence"), "有邊界重用");
  assert.equal(labelForPhaseSixReuseConfidence("low_confidence"), "低信心重用");
  assert.equal(
    summarizePhaseSixDistanceItems([
      {
        assetCode: "precedent_general_pattern",
        assetLabel: "precedent general pattern",
        contextDistance: "close",
        contextDistanceLabel: "距離較近",
        reuseConfidence: "high_confidence",
        reuseConfidenceLabel: "高信心重用",
        summary: "這類 precedent 與目前案件脈絡較接近。",
        guardrailNote: "仍需由 Host 做最後收斂。",
      },
      {
        assetCode: "template_narrow_shape",
        assetLabel: "template narrow shape",
        contextDistance: "far",
        contextDistanceLabel: "距離偏遠",
        reuseConfidence: "low_confidence",
        reuseConfidenceLabel: "低信心重用",
        summary: "這類窄情境模板與目前案件距離偏遠。",
        guardrailNote: "先留背景校正。",
      },
    ]),
    "precedent general pattern：高信心重用｜template narrow shape：低信心重用",
  );
});

test("phase 6 confidence calibration labels stay low-noise and readable", () => {
  assert.equal(labelForPhaseSixCalibrationStatus("aligned"), "目前對齊");
  assert.equal(labelForPhaseSixCalibrationStatus("caution"), "需要留意");
  assert.equal(labelForPhaseSixCalibrationStatus("mismatch"), "仍有不對齊");
  assert.equal(
    summarizePhaseSixCalibrationItems([
      {
        axisKind: "client_stage",
        axisLabel: "client stage",
        calibrationStatus: "caution",
        calibrationStatusLabel: "需要留意",
        reuseConfidence: "bounded_confidence",
        reuseConfidenceLabel: "有邊界重用",
        summary: "目前 client stage 仍有距離。",
        guardrailNote: "需要明示 stage 邊界。",
      },
      {
        axisKind: "domain_lens",
        axisLabel: "domain lens",
        calibrationStatus: "mismatch",
        calibrationStatusLabel: "仍有不對齊",
        reuseConfidence: "low_confidence",
        reuseConfidenceLabel: "低信心重用",
        summary: "目前 domain lens 距離偏遠。",
        guardrailNote: "先留背景校正。",
      },
    ]),
    "client stage：需要留意｜domain lens：仍有不對齊",
  );
});

test("phase 6 calibration-aware weighting summary stays low-noise and readable", () => {
  assert.equal(
    summarizePhaseSixCalibrationAwareWeightingItems([
      {
        axisKind: "client_stage",
        axisLabel: "client stage",
        calibrationStatus: "caution",
        calibrationStatusLabel: "需要留意",
        weightingEffect: "keep_contextual",
        weightingEffectLabel: "先保留邊界",
        summary: "client stage 不同時，先不要直接視為可擴大重用。",
      },
      {
        axisKind: "domain_lens",
        axisLabel: "domain lens",
        calibrationStatus: "mismatch",
        calibrationStatusLabel: "仍有不對齊",
        weightingEffect: "background_only",
        weightingEffectLabel: "先留背景校正",
        summary: "domain lens 不對齊時，先退到背景校正。",
      },
    ]),
    "client stage：先保留邊界｜domain lens：先留背景校正",
  );
});
