export type ConsultantStartMode =
  | "diagnostic_start"
  | "material_review_start"
  | "decision_convergence_start";

export type InternalWorkflowValue =
  | "research_synthesis"
  | "contract_review"
  | "document_restructuring"
  | "multi_agent";

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
