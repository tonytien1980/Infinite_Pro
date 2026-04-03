export interface ContinuationPostureView {
  modeLabel: string;
  primarySummary: string;
  boundaryNote: string;
}

export function buildContinuationPostureView(
  surface:
    | {
        workflow_layer: "closure" | "checkpoint" | "progression";
        current_state: string;
        summary: string;
      }
    | null
    | undefined,
): ContinuationPostureView {
  if (surface?.workflow_layer === "checkpoint") {
    return {
      modeLabel: "回來更新 / checkpoint",
      primarySummary:
        "這是回來更新的節奏，重點是整理這輪變化、補件與 checkpoint，不需要進入完整長期追蹤。",
      boundaryNote: "這一層應像 checkpoint / milestone 更新，不應長得像 progression 儀表板。",
    };
  }

  if (surface?.workflow_layer === "progression") {
    return {
      modeLabel: "持續推進 / outcome",
      primarySummary:
        "這是持續推進的節奏，重點是回看進度、action 狀態與 outcome 新訊號。",
      boundaryNote: "只有 continuous 案件才需要較完整的 progression / outcome 語言。",
    };
  }

  return {
    modeLabel: "一次性交付 / 結案",
    primarySummary:
      "這是一次性交付的節奏，重點是完成分析、整理版本、發布、匯出或正式結案。",
    boundaryNote: "one-off 案件不應被持續追蹤語言污染。",
  };
}
