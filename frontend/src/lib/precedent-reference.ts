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
        item.optimization_signal?.best_for_asset_labels?.length
          ? `最佳幫助：${item.optimization_signal.best_for_asset_labels.join("、")}`
          : "",
        item.optimization_signal?.strength
          ? `參考強度：${item.optimization_signal.strength === "high" ? "高" : item.optimization_signal.strength === "medium" ? "中" : "低"}`
          : "",
        item.shared_intelligence_signal?.maturity_label
          ? `共享成熟度：${item.shared_intelligence_signal.maturity_label}`
          : "",
        item.shared_intelligence_signal?.weight_action_label
          ? `權重趨勢：${item.shared_intelligence_signal.weight_action_label}`
          : "",
        item.shared_intelligence_signal?.stability_label
          ? `共享穩定度：${item.shared_intelligence_signal.stability_label}`
          : "",
      ]
        .filter(Boolean)
        .join("｜") || item.safe_use_note,
    })),
    listItems: guidance.recommended_uses,
    boundaryNote: guidance.boundary_note,
  };
}
