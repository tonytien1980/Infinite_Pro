import type { CommonRiskGuidance } from "@/lib/types";

function labelForRiskPriority(priority: string) {
  if (priority === "high") {
    return "建議先掃";
  }
  if (priority === "medium") {
    return "第二層一起掃";
  }
  return "留作背景提醒";
}

export function buildCommonRiskLibraryView(
  guidance: CommonRiskGuidance | null | undefined,
): {
  shouldShow: boolean;
  sectionTitle: string;
  summary: string;
  cards: Array<{ title: string; summary: string; meta: string }>;
  listTitle: string;
  listItems: string[];
  boundaryNote: string;
} {
  if (!guidance || guidance.status === "none" || guidance.risks.length === 0) {
    return {
      shouldShow: false,
      sectionTitle: "",
      summary: "",
      cards: [],
      listTitle: "",
      listItems: [],
      boundaryNote: "",
    };
  }

  return {
    shouldShow: true,
    sectionTitle: guidance.label || "這類案件常漏哪些風險",
    summary:
      guidance.summary || `Host 先整理出 ${guidance.risks.length} 個漏看提醒。`,
    cards: guidance.risks.map((risk) => ({
      title: risk.title,
      summary: [risk.why_watch, risk.summary].filter(Boolean).join("｜"),
      meta: [labelForRiskPriority(risk.priority), risk.source_label || risk.source_kind]
        .filter(Boolean)
        .join("｜"),
    })),
    listTitle: "先掃這些漏看點",
    listItems: guidance.risks.map((risk, index) => `${index + 1}. ${risk.title}`),
    boundaryNote: guidance.boundary_note,
  };
}
