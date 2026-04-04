import type { DomainPlaybookGuidance } from "@/lib/types";

export function buildDomainPlaybookView(
  guidance: DomainPlaybookGuidance | null | undefined,
): {
  shouldShow: boolean;
  sectionTitle: string;
  summary: string;
  playbookLabel: string;
  currentStageLabel: string;
  nextStageLabel: string;
  fitSummary: string;
  sourceMixSummary: string;
  cards: Array<{ title: string; summary: string; meta: string }>;
  listTitle: string;
  listItems: string[];
  boundaryNote: string;
} {
  if (!guidance || guidance.status === "none" || guidance.stages.length === 0) {
    return {
      shouldShow: false,
      sectionTitle: "",
      summary: "",
      playbookLabel: "",
      currentStageLabel: "",
      nextStageLabel: "",
      fitSummary: "",
      sourceMixSummary: "",
      cards: [],
      listTitle: "",
      listItems: [],
      boundaryNote: "",
    };
  }

  return {
    shouldShow: true,
    sectionTitle: guidance.label || "這類案子通常怎麼走",
    summary: guidance.summary,
    playbookLabel: guidance.playbook_label,
    currentStageLabel: guidance.current_stage_label,
    nextStageLabel: guidance.next_stage_label,
    fitSummary: guidance.fit_summary,
    sourceMixSummary: guidance.source_mix_summary,
    cards: guidance.stages.slice(0, 3).map((item) => ({
      title: item.title,
      summary: item.why_now || item.summary,
      meta: item.source_label || item.source_kind,
    })),
    listTitle: "這類案子通常這樣推進",
    listItems: guidance.stages.map((item) => item.title),
    boundaryNote: guidance.boundary_note,
  };
}
