import type { PrecedentReferenceGuidance } from "@/lib/types";

export function buildPrecedentReferenceView(
  guidance: PrecedentReferenceGuidance | null | undefined,
) {
  if (!guidance || guidance.status !== "available" || guidance.matched_items.length === 0) {
    return {
      shouldShow: false,
      sectionTitle: "",
      summary: "",
      cards: [] as Array<{ title: string; summary: string; meta: string }>,
      listItems: [] as string[],
      boundaryNote: "",
    };
  }

  return {
    shouldShow: true,
    sectionTitle: guidance.label || "可參考既有模式",
    summary: guidance.summary,
    cards: guidance.matched_items.map((item) => ({
      title: item.title || "未命名模式",
      summary: item.summary || item.reusable_reason || "目前沒有額外摘要。",
      meta: [
        item.match_reason || "",
        item.primary_reason_label ? `主要原因：${item.primary_reason_label}` : "",
      ]
        .filter(Boolean)
        .join("｜") || item.safe_use_note,
    })),
    listItems: guidance.recommended_uses,
    boundaryNote: guidance.boundary_note,
  };
}
