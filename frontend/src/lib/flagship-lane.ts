export type ConsultantStartMode =
  | "diagnostic_start"
  | "material_review_start"
  | "decision_convergence_start";

export type InternalWorkflowValue =
  | "research_synthesis"
  | "contract_review"
  | "document_restructuring"
  | "multi_agent";

export interface FlagshipLaneView {
  laneId: ConsultantStartMode;
  label: string;
  summary: string;
  nextStepSummary: string;
  upgradeNote: string;
  currentOutputLabel: string;
  currentOutputSummary: string;
  upgradeTargetLabel: string;
  upgradeRequirements: string[];
  upgradeReady: boolean;
  boundaryNote: string;
}

export interface FlagshipDetailCard {
  title: string;
  summary: string;
}

export interface FlagshipDetailView {
  shouldShow: boolean;
  sectionTitle: string;
  cards: FlagshipDetailCard[];
  listTitle: string;
  listItems: string[];
}

export const CONSULTANT_START_OPTIONS: Array<{
  value: ConsultantStartMode;
  label: string;
  description: string;
}> = [
  {
    value: "diagnostic_start",
    label: "先快速看清問題與下一步",
    description: "適合少資訊起手，先形成第一輪診斷、主要缺口與建議下一步。",
  },
  {
    value: "material_review_start",
    label: "先審閱手上已有材料",
    description: "適合你已經有文件、合約、提案或草稿，先圍繞材料做審閱、評估或重整。",
  },
  {
    value: "decision_convergence_start",
    label: "先比較方案並收斂決策",
    description: "適合材料與問題已相對完整，要直接收斂判斷、比較方案與整理建議。",
  },
];

function normalizeSignalText(signalText: string) {
  return signalText.trim().toLowerCase();
}

export function resolveWorkflowValueForConsultingStart(
  startMode: ConsultantStartMode,
  signalText: string,
): InternalWorkflowValue {
  const normalizedSignalText = normalizeSignalText(signalText);

  if (startMode === "decision_convergence_start") {
    return "multi_agent";
  }

  if (startMode === "material_review_start") {
    if (
      /(合約|契約|條款|redline|agreement|msa|nda|liability|termination|indemnity)/i.test(
        normalizedSignalText,
      )
    ) {
      return "contract_review";
    }
    return "document_restructuring";
  }

  return "research_synthesis";
}

export function labelForConsultantStartMode(startMode: ConsultantStartMode) {
  return (
    CONSULTANT_START_OPTIONS.find((item) => item.value === startMode)?.label ??
    CONSULTANT_START_OPTIONS[0].label
  );
}

export function buildFlagshipLaneView(
  lane:
    | {
        lane_id?: string;
        label: string;
        summary: string;
        next_step_summary: string;
        upgrade_note: string;
        current_output_label?: string;
        current_output_summary?: string;
        upgrade_target_label?: string;
        upgrade_requirements?: string[];
        upgrade_ready?: boolean;
        boundary_note?: string;
      }
    | null
    | undefined,
): FlagshipLaneView {
  return {
    laneId: (lane?.lane_id as ConsultantStartMode) || "diagnostic_start",
    label: lane?.label || "先快速看清問題與下一步",
    summary: lane?.summary || "目前先以少資訊起手，形成第一輪可回看的顧問判斷。",
    nextStepSummary:
      lane?.next_step_summary || "先確認主問題，再補最少但最有用的來源或直接先跑第一版。",
    upgradeNote:
      lane?.upgrade_note || "等補進更多來源與證據後，再把案件升級成更完整的判斷主線。",
    currentOutputLabel: lane?.current_output_label || "探索型簡報",
    currentOutputSummary: lane?.current_output_summary || "目前先形成探索級第一版交付。",
    upgradeTargetLabel: lane?.upgrade_target_label || "評估 / 審閱備忘",
    upgradeRequirements: lane?.upgrade_requirements || [],
    upgradeReady: lane?.upgrade_ready || false,
    boundaryNote: lane?.boundary_note || "這一輪仍有邊界，不應被誤讀成完整定論。",
  };
}

export function buildFlagshipDetailView(
  lane: FlagshipLaneView | null | undefined,
): FlagshipDetailView {
  if (!lane) {
    return {
      shouldShow: false,
      sectionTitle: "",
      cards: [],
      listTitle: "",
      listItems: [],
    };
  }

  return {
    shouldShow: true,
    sectionTitle: "這條旗艦主線現在怎麼讀",
    cards: [
      {
        title: "目前工作姿態",
        summary: [lane.label, lane.summary].filter(Boolean).join("｜"),
      },
      {
        title: "目前交付等級",
        summary: [lane.currentOutputLabel, lane.currentOutputSummary].filter(Boolean).join("｜"),
      },
      {
        title: "適用邊界",
        summary: lane.boundaryNote,
      },
      {
        title: "下一步要升級到哪裡",
        summary: [lane.upgradeTargetLabel, lane.upgradeNote].filter(Boolean).join("｜"),
      },
      {
        title: "升級前最該補什麼",
        summary:
          [lane.upgradeRequirements[0], lane.nextStepSummary]
            .filter(Boolean)
            .join("｜") || lane.upgradeNote,
      },
    ],
    listTitle: "升級條件",
    listItems:
      lane.upgradeRequirements.length > 0
        ? lane.upgradeRequirements
        : [lane.nextStepSummary, lane.boundaryNote].filter(Boolean),
  };
}
