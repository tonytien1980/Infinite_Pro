import type {
  PhaseSixCalibrationAwareWeightingItem,
  PhaseSixClosureCriterion,
  PhaseSixCoverageArea,
  PhaseSixConfidenceCalibrationItem,
  PhaseSixContextDistanceItem,
  PhaseSixGeneralistGuidancePosture,
  PhaseSixMaturityMilestone,
  PhaseSixReuseBoundaryGovernance,
  PhaseSixReuseBoundaryGovernanceItem,
  PhaseSixReuseBoundaryItem,
} from "@/lib/types";

export function labelForPhaseSixAuditStatus(status: "balanced" | "watch_drift") {
  return status === "balanced" ? "目前覆蓋較穩" : "需持續防偏科";
}

export function labelForPhaseSixGeneralistPosture(
  posture: "broad" | "watching_bias",
) {
  return posture === "broad"
    ? "目前仍維持全面型姿態"
    : "目前仍全面，但需持續看偏移";
}

export function labelForPhaseSixMaturityStage(
  stage: "foundation_lane" | "refinement_lane" | "closure_preparation",
) {
  if (stage === "foundation_lane") {
    return "仍在打基礎";
  }
  if (stage === "closure_preparation") {
    return "可準備收口判讀";
  }
  return "已進入收斂深化";
}

export function labelForPhaseSixClosurePosture(
  posture: "not_ready" | "building_closure_basis" | "ready_for_completion_review",
) {
  if (posture === "not_ready") {
    return "尚未接近收口";
  }
  if (posture === "ready_for_completion_review") {
    return "可準備 completion review";
  }
  return "正在建立收口基礎";
}

export function summarizePhaseSixMaturityMilestones(
  milestones: PhaseSixMaturityMilestone[],
) {
  if (milestones.length === 0) {
    return "目前還沒有可讀取的 maturity signal。";
  }
  return milestones
    .slice(0, 2)
    .map((item) => `${item.milestoneLabel}：${item.milestoneStatusLabel}`)
    .join("｜");
}

export function summarizePhaseSixClosureCriteria(
  criteria: PhaseSixClosureCriterion[],
) {
  if (criteria.length === 0) {
    return "目前還沒有可讀取的 closure criteria signal。";
  }
  return criteria
    .slice(0, 2)
    .map((item) => `${item.criterionLabel}：${item.criterionStatusLabel}`)
    .join("｜");
}

export function summarizePhaseSixCoverageAreas(areas: PhaseSixCoverageArea[]) {
  if (areas.length === 0) {
    return "目前還沒有可讀取的 coverage signal。";
  }
  return areas
    .slice(0, 3)
    .map((area) => `${area.areaLabel}：${area.coverageStatusLabel}`)
    .join("｜");
}

export function summarizePhaseSixReuseBoundaryItems(items: PhaseSixReuseBoundaryItem[]) {
  if (items.length === 0) {
    return "目前還沒有可讀取的 reuse-boundary signal。";
  }
  return items
    .slice(0, 2)
    .map((item) => `${item.assetLabel}：${item.boundaryStatusLabel}`)
    .join("｜");
}

export function labelForPhaseSixGovernancePosture(
  posture: "stable" | "guardrails_needed",
) {
  return posture === "stable" ? "目前治理較穩" : "仍需治理邊界";
}

export function labelForPhaseSixReuseRecommendation(
  recommendation: "can_expand" | "keep_contextual" | "restrict_narrow_use",
) {
  if (recommendation === "can_expand") {
    return "可擴大重用";
  }
  if (recommendation === "restrict_narrow_use") {
    return "不要擴大套用";
  }
  return "維持局部參考";
}

export function summarizePhaseSixGovernanceItems(
  items: PhaseSixReuseBoundaryGovernanceItem[],
) {
  if (items.length === 0) {
    return "目前還沒有可讀取的 governance signal。";
  }
  return items
    .slice(0, 2)
    .map((item) => `${item.assetLabel}：${item.reuseRecommendationLabel}`)
    .join("｜");
}

export function summarizePhaseSixHostWeighting(
  governance: Pick<
    PhaseSixReuseBoundaryGovernance,
    "hostWeightingSummary" | "governanceItems"
  >,
) {
  if (governance.hostWeightingSummary) {
    return governance.hostWeightingSummary;
  }

  const hasExpandable = governance.governanceItems.some(
    (item) => item.reuseRecommendation === "can_expand",
  );
  const hasRestricted = governance.governanceItems.some(
    (item) => item.reuseRecommendation === "restrict_narrow_use",
  );

  if (hasExpandable && hasRestricted) {
    return "Host 現在會先讓較可擴大重用的來源站前面，窄情境模板 / 骨架則先留背景校正。";
  }
  if (hasExpandable) {
    return "Host 現在會先讓較可擴大重用的來源站前面。";
  }
  if (hasRestricted) {
    return "Host 現在會先讓窄情境來源留在背景校正，不讓它單獨帶主線。";
  }
  return "Host 現在仍以局部參考排序為主，避免把來源過度放大。";
}

export function labelForPhaseSixGuidancePosture(
  posture: "light_guidance" | "balanced_guidance" | "guarded_guidance",
) {
  if (posture === "light_guidance") {
    return "維持低噪音";
  }
  if (posture === "guarded_guidance") {
    return "先保守引導";
  }
  return "適度明示";
}

export function summarizePhaseSixGuidanceItems(items: string[]) {
  if (items.length === 0) {
    return "目前還沒有可讀取的 guidance signal。";
  }
  return items.slice(0, 2).join("｜");
}

export function summarizePhaseSixWorkGuidance(
  posture: Pick<
    PhaseSixGeneralistGuidancePosture,
    "workGuidanceSummary" | "guidanceItems"
  >,
) {
  if (posture.workGuidanceSummary) {
    return posture.workGuidanceSummary;
  }
  return summarizePhaseSixGuidanceItems(posture.guidanceItems);
}

export function labelForPhaseSixContextDistance(
  distance: "close" | "moderate" | "far",
) {
  if (distance === "close") {
    return "距離較近";
  }
  if (distance === "far") {
    return "距離偏遠";
  }
  return "仍有距離";
}

export function labelForPhaseSixReuseConfidence(
  confidence: "high_confidence" | "bounded_confidence" | "low_confidence",
) {
  if (confidence === "high_confidence") {
    return "高信心重用";
  }
  if (confidence === "low_confidence") {
    return "低信心重用";
  }
  return "有邊界重用";
}

export function summarizePhaseSixDistanceItems(
  items: PhaseSixContextDistanceItem[],
) {
  if (items.length === 0) {
    return "目前還沒有可讀取的 reuse-confidence signal。";
  }
  return items
    .slice(0, 2)
    .map((item) => `${item.assetLabel}：${item.reuseConfidenceLabel}`)
    .join("｜");
}

export function labelForPhaseSixCalibrationStatus(
  status: "aligned" | "caution" | "mismatch",
) {
  if (status === "aligned") {
    return "目前對齊";
  }
  if (status === "mismatch") {
    return "仍有不對齊";
  }
  return "需要留意";
}

export function summarizePhaseSixCalibrationItems(
  items: PhaseSixConfidenceCalibrationItem[],
) {
  if (items.length === 0) {
    return "目前還沒有可讀取的 calibration signal。";
  }
  return items
    .slice(0, 2)
    .map((item) => `${item.axisLabel}：${item.calibrationStatusLabel}`)
    .join("｜");
}

export function summarizePhaseSixCalibrationAwareWeightingItems(
  items: PhaseSixCalibrationAwareWeightingItem[],
) {
  if (items.length === 0) {
    return "目前還沒有可讀取的 calibration-aware weighting signal。";
  }
  return items
    .slice(0, 2)
    .map((item) => `${item.axisLabel}：${item.weightingEffectLabel}`)
    .join("｜");
}
