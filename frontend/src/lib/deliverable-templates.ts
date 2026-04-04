import type { DeliverableTemplateGuidance } from "@/lib/types";

function labelForTemplatePriority(priority: string) {
  if (priority === "high") {
    return "建議先用";
  }
  if (priority === "medium") {
    return "可一起參考";
  }
  return "留作背景校正";
}

export function buildDeliverableTemplateView(
  guidance: DeliverableTemplateGuidance | null | undefined,
): {
  shouldShow: boolean;
  sectionTitle: string;
  summary: string;
  templateLabel: string;
  templateFitSummary: string;
  fitSummary: string;
  sourceMixSummary: string;
  cards: Array<{ title: string; summary: string; meta: string }>;
  coreListTitle: string;
  coreSections: string[];
  optionalListTitle: string;
  optionalSections: string[];
  boundaryNote: string;
} {
  if (!guidance || guidance.status === "none") {
    return {
      shouldShow: false,
      sectionTitle: "",
      summary: "",
      templateLabel: "",
      templateFitSummary: "",
      fitSummary: "",
      sourceMixSummary: "",
      cards: [],
      coreListTitle: "",
      coreSections: [],
      optionalListTitle: "",
      optionalSections: [],
      boundaryNote: "",
    };
  }

  return {
    shouldShow: true,
    sectionTitle: guidance.label || "這份交付比較適合沿用哪種模板主線",
    summary: guidance.summary || "Host 已先整理這輪較穩的模板主線。",
    templateLabel: guidance.template_label,
    templateFitSummary: guidance.template_fit_summary,
    fitSummary: guidance.fit_summary,
    sourceMixSummary: guidance.source_mix_summary,
    cards: guidance.blocks.map((block) => ({
      title: block.title,
      summary: [block.why_fit, block.summary].filter(Boolean).join("｜"),
      meta: [labelForTemplatePriority(block.priority), block.source_label || block.source_kind]
        .filter(Boolean)
        .join("｜"),
    })),
    coreListTitle: "先守住這些核心區塊",
    coreSections: guidance.core_sections,
    optionalListTitle: "這些區塊視案件補",
    optionalSections: guidance.optional_sections,
    boundaryNote: guidance.boundary_note,
  };
}
