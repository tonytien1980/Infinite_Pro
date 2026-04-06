import type {
  PhaseSixCoverageArea,
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
