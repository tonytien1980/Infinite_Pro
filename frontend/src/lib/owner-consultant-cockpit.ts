export type SparseDiagnosticSurface = "matter" | "task" | "evidence" | "deliverable";

export type SparseDiagnosticCockpitInput = {
  laneId?: string | null;
  surface: SparseDiagnosticSurface;
  evidenceCount?: number | null;
  hasDeliverable?: boolean | null;
  canRun?: boolean | null;
};

export type SparseDiagnosticCockpitStep = {
  label: string;
  summary: string;
  href: string;
};

export type SparseDiagnosticCockpitView = {
  active: boolean;
  statusLabel: string;
  mainlineSummary: string;
  blockerSummary: string;
  boundaryNote: string;
  primaryActionLabel: string;
  primaryHref: string;
  secondaryActionLabel: string;
  secondaryHref: string;
  feedbackPrompt: string;
  loopSteps: SparseDiagnosticCockpitStep[];
};

export function isSparseDiagnosticLane(laneId?: string | null): boolean {
  return laneId === "diagnostic_start";
}

export function buildSparseDiagnosticCockpitView(
  input: SparseDiagnosticCockpitInput,
): SparseDiagnosticCockpitView {
  const evidenceCount = Math.max(0, input.evidenceCount ?? 0);
  const hasDeliverable = Boolean(input.hasDeliverable);
  const canRun = input.canRun !== false;
  const active = isSparseDiagnosticLane(input.laneId);
  const evidenceIsThin = evidenceCount < 1;

  let primaryActionLabel = "先跑一輪探索分析";
  let primaryHref = input.surface === "task" ? "#run-panel" : "#task-mainline";
  let secondaryActionLabel = "先補一份關鍵資料";
  let secondaryHref = input.surface === "matter" ? "#matter-evidence" : "#evidence-readiness";
  let blockerSummary = evidenceIsThin
    ? "資料仍偏少，這輪先適合釐清問題主線與下一步。"
    : "已有最小資料基礎，可以先跑探索分析，再決定是否補強。";

  if (!canRun) {
    primaryActionLabel = "先補關鍵資料";
    primaryHref = "#evidence-readiness";
    secondaryActionLabel = "回案件主控台";
    secondaryHref = "#matter-mainline";
    blockerSummary = "資料仍偏少，先補一份關鍵資料會比直接跑分析更穩。";
  }

  if (hasDeliverable) {
    primaryActionLabel = "先看這份結果能不能用";
    primaryHref = "#deliverable-main";
    secondaryActionLabel = "回到案件下一步";
    secondaryHref = "#matter-mainline";
    blockerSummary = "已形成第一版結果，現在重點是判斷能不能採用、要不要補資料或延續。";
  }

  return {
    active,
    statusLabel: "少資料快速診斷",
    mainlineSummary: "先用少量資訊看清問題主線、最大限制與下一步，不急著假裝已經能正式定案。",
    blockerSummary,
    boundaryNote: "這輪先定位為探索型判斷；若要升級成正式決策或行動交付，仍需要補強來源與證據。",
    primaryActionLabel,
    primaryHref,
    secondaryActionLabel,
    secondaryHref,
    feedbackPrompt: "這份結果對你有幫助嗎？",
    loopSteps: [
      { label: "起案", summary: "用少量文字說清目前問題。", href: "/new" },
      { label: "看主線", summary: "先看案件主控台給出的主線、限制與下一步。", href: "#matter-mainline" },
      { label: "補資料或先跑", summary: "依目前資料厚度決定先補關鍵資料或先跑探索分析。", href: primaryHref },
      { label: "看結果", summary: "用結果與報告判斷這輪是否能採用。", href: "#deliverable-main" },
      { label: "給回饋", summary: "用低負擔回饋讓系統知道這次判斷是否有用。", href: "#adoption-feedback" },
    ],
  };
}
