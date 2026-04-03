import type { FlagshipLaneView } from "@/lib/flagship-lane";

export interface MaterialReviewPostureView {
  shouldShow: boolean;
  modeLabel: string;
  primarySummary: string;
  nextStepHint: string;
  boundaryNote: string;
}

export function buildMaterialReviewPostureView(
  lane: FlagshipLaneView | null | undefined,
): MaterialReviewPostureView {
  if (!lane || lane.laneId !== "material_review_start") {
    return {
      shouldShow: false,
      modeLabel: "",
      primarySummary: "",
      nextStepHint: "",
      boundaryNote: "",
    };
  }

  return {
    shouldShow: true,
    modeLabel: "材料審閱 / review memo",
    primarySummary:
      lane.currentOutputSummary ||
      "這輪主要在審手上的核心材料，先形成 review memo / assessment 結果，而不是直接跳到最終決策版本。",
    nextStepHint:
      lane.nextStepSummary ||
      "先把核心材料審完，確認高風險點與缺口，再決定是否要補更多背景材料。",
    boundaryNote:
      lane.boundaryNote || "這一輪仍屬 review memo / assessment 姿態，不等於最終決策版本。",
  };
}
