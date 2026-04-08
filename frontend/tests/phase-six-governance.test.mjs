import test from "node:test";
import assert from "node:assert/strict";

import {
  labelForPhaseSixAuditStatus,
  labelForPhaseSixCalibrationStatus,
  labelForPhaseSixCompletionReviewPosture,
  labelForPhaseSixClosurePosture,
  labelForPhaseSixSignOffStatus,
  labelForPhaseSixMaturityStage,
  labelForPhaseSixContextDistance,
  labelForPhaseSixGeneralistPosture,
  labelForPhaseSixGuidancePosture,
  labelForPhaseSixGovernancePosture,
  labelForPhaseSixReuseConfidence,
  labelForPhaseSixReuseRecommendation,
  summarizePhaseSixCalibrationItems,
  summarizePhaseSixCalibrationAwareWeightingItems,
  summarizePhaseSixCompletionScorecard,
  summarizePhaseSixFeedbackLinkedScoring,
  summarizePhaseSixCloseoutAudits,
  summarizePhaseSixClosureCriteria,
  summarizePhaseSixDistanceItems,
  summarizePhaseSixGuidanceItems,
  summarizePhaseSixWorkGuidance,
  summarizePhaseSixHandoffItems,
  summarizePhaseSixHostWeighting,
  summarizePhaseSixMaturityMilestones,
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

test("phase 6 maturity review labels stay low-noise and stage-readable", () => {
  assert.equal(labelForPhaseSixMaturityStage("foundation_lane"), "仍在打基礎");
  assert.equal(labelForPhaseSixMaturityStage("refinement_lane"), "已進入收斂深化");
  assert.equal(labelForPhaseSixMaturityStage("closure_preparation"), "可準備收口判讀");
  assert.equal(
    summarizePhaseSixMaturityMilestones([
      {
        milestoneCode: "coverage_boundary",
        milestoneLabel: "coverage / anti-drift",
        milestoneStatus: "landed",
        milestoneStatusLabel: "已站穩",
        summary: "已能正式回讀 coverage 與 anti-drift posture。",
      },
      {
        milestoneCode: "guidance_propagation",
        milestoneLabel: "guidance propagation",
        milestoneStatus: "landed",
        milestoneStatusLabel: "已站穩",
        summary: "已回寫到 task / matter / deliverable。",
      },
    ]),
    "coverage / anti-drift：已站穩｜guidance propagation：已站穩",
  );
});

test("phase 6 closure criteria labels stay low-noise and readable", () => {
  assert.equal(labelForPhaseSixClosurePosture("not_ready"), "尚未接近收口");
  assert.equal(
    labelForPhaseSixClosurePosture("building_closure_basis"),
    "正在建立收口基礎",
  );
  assert.equal(
    labelForPhaseSixClosurePosture("ready_for_completion_review"),
    "可準備 completion review",
  );
  assert.equal(
    summarizePhaseSixClosureCriteria([
      {
        criterionCode: "runtime_feedback_loop",
        criterionLabel: "runtime feedback loop",
        criterionStatus: "watching",
        criterionStatusLabel: "已開始形成",
        summary: "已開始看到 adoption feedback 與 governed outcomes。",
        nextStep: "再把 feedback loop 接回 persisted scoring。",
      },
      {
        criterionCode: "completion_review_contract",
        criterionLabel: "completion review contract",
        criterionStatus: "landed",
        criterionStatusLabel: "已站穩",
        summary: "已能正式回讀 closure criteria。",
        nextStep: "",
      },
    ]),
    "runtime feedback loop：已開始形成｜completion review contract：已站穩",
  );
});

test("phase 6 completion review labels stay low-noise and readable", () => {
  assert.equal(labelForPhaseSixCompletionReviewPosture("baseline_only"), "先看基礎是否齊");
  assert.equal(
    labelForPhaseSixCompletionReviewPosture("checkpoint_recorded"),
    "已有 review checkpoint",
  );
  assert.equal(
    labelForPhaseSixCompletionReviewPosture("review_ready"),
    "可準備 completion review",
  );
  assert.equal(
    summarizePhaseSixCompletionScorecard([
      {
        dimensionCode: "governance_runtime",
        dimensionLabel: "governance runtime",
        score: 84,
        statusLabel: "已站穩",
        summary: "runtime governance layer 已成立。",
      },
      {
        dimensionCode: "feedback_loop",
        dimensionLabel: "feedback loop",
        score: 62,
        statusLabel: "仍需加深",
        summary: "feedback-linked evidence 已開始形成。",
      },
    ]),
    "governance runtime：84｜feedback loop：62",
  );
  assert.equal(
    summarizePhaseSixFeedbackLinkedScoring({
      feedbackLinkedSummary:
        "已採用 2｜需改寫 1｜不採用 1｜主要影響工作主線、審閱視角。",
      feedbackLinkedScoringSnapshot: {
        adoptedCount: 2,
        needsRevisionCount: 1,
        notAdoptedCount: 1,
        templateCandidateCount: 3,
        governedCandidateCount: 4,
        promotedCandidateCount: 2,
        dismissedCandidateCount: 1,
        overrideSignalCount: 2,
        topAssetCodes: ["domain_playbook", "review_lens"],
        topAssetLabels: ["工作主線", "審閱視角"],
        summary: "summary",
      },
    }),
    "已採用 2｜需改寫 1｜不採用 1｜主要影響工作主線、審閱視角。",
  );
});

test("phase 6 sign-off labels stay low-noise and readable", () => {
  assert.equal(labelForPhaseSixSignOffStatus("open"), "尚未正式收口");
  assert.equal(labelForPhaseSixSignOffStatus("signed_off"), "已正式收口");
  assert.equal(
    summarizePhaseSixHandoffItems([
      "先把已建立的 governance foundation 轉成顧問更直接感受到的 operating leverage。",
      "不要把下一階段拉成 admin shell 或 enterprise governance console。",
    ]),
    "先把已建立的 governance foundation 轉成顧問更直接感受到的 operating leverage。｜不要把下一階段拉成 admin shell 或 enterprise governance console。",
  );
});

test("phase 6 closeout summary stays low-noise and readable", () => {
  assert.equal(
    summarizePhaseSixCloseoutAudits([
      {
        assetCode: "governance_runtime",
        assetLabel: "governance runtime",
        auditStatus: "audited",
        auditStatusLabel: "已站穩",
        summary: "Phase 6 runtime governance 已成立。",
        nextStep: "",
      },
      {
        assetCode: "completion_review",
        assetLabel: "completion review",
        auditStatus: "audited",
        auditStatusLabel: "已站穩",
        summary: "已能正式回讀 completion / sign-off / handoff。",
        nextStep: "",
      },
    ]),
    "governance runtime：已站穩｜completion review：已站穩",
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
  assert.equal(
    summarizePhaseSixWorkGuidance({
      workGuidanceSummary:
        "目前工作 guidance 可維持低噪音，只在需要時補 reusable boundary。",
      guidanceItems: [],
    }),
    "目前工作 guidance 可維持低噪音，只在需要時補 reusable boundary。",
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
