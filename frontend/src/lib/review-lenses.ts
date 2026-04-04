import type { ReviewLensGuidance } from "@/lib/types";

function labelForLensPriority(priority: string) {
  if (priority === "high") {
    return "建議先看";
  }
  if (priority === "medium") {
    return "第二層一起看";
  }
  return "留作背景校正";
}

export function buildReviewLensView(
  guidance: ReviewLensGuidance | null | undefined,
): {
  shouldShow: boolean;
  sectionTitle: string;
  summary: string;
  cards: Array<{ title: string; summary: string; meta: string }>;
  listTitle: string;
  listItems: string[];
  boundaryNote: string;
} {
  if (!guidance || guidance.status === "none" || guidance.lenses.length === 0) {
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
    sectionTitle: guidance.label || "這輪先看哪幾點",
    summary: guidance.summary || `Host 先整理出 ${guidance.lenses.length} 個先看角度。`,
    cards: guidance.lenses.map((lens) => ({
      title: lens.title,
      summary: [lens.why_now, lens.summary].filter(Boolean).join("｜"),
      meta: [labelForLensPriority(lens.priority), lens.source_label || lens.source_kind]
        .filter(Boolean)
        .join("｜"),
    })),
    listTitle: "先從這幾個角度看",
    listItems: guidance.lenses.map((lens, index) => `${index + 1}. ${lens.title}`),
    boundaryNote: guidance.boundary_note,
  };
}
