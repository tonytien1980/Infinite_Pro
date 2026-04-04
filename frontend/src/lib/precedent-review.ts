import type { PrecedentReviewItem } from "@/lib/types";

export function buildPrecedentReviewPriorityView(item: {
  review_priority: "high" | "medium" | "low";
  review_priority_reason: string;
  optimization_signal:
    | {
        strength: "high" | "medium" | "low";
        best_for_asset_labels: string[];
      }
    | null
    | undefined;
}) {
  return {
    label:
      item.review_priority === "high"
        ? "建議先看"
        : item.review_priority === "medium"
          ? "可安排下一輪"
          : "先放背景",
    reason: item.review_priority_reason,
    optimizationMeta:
      item.optimization_signal && item.optimization_signal.best_for_asset_labels.length > 0
        ? `最佳幫助：${item.optimization_signal.best_for_asset_labels.join("、")}｜參考強度：${
            item.optimization_signal.strength === "high"
              ? "高"
              : item.optimization_signal.strength === "medium"
                ? "中"
                : "低"
          }`
        : "",
  };
}

export function filterPrecedentReviewItems(
  items: PrecedentReviewItem[],
  filters: {
    query: string;
    status: "all" | "candidate" | "promoted" | "dismissed";
    type: "all" | "deliverable_pattern" | "recommendation_pattern";
  },
) {
  const query = filters.query.trim().toLowerCase();

  return items.filter((item) => {
    const matchesStatus = filters.status === "all" || item.candidate_status === filters.status;
    const matchesType = filters.type === "all" || item.candidate_type === filters.type;
    if (!matchesStatus || !matchesType) {
      return false;
    }
    if (!query) {
      return true;
    }
    return [
      item.title,
      item.summary,
      item.reusable_reason,
      item.matter_title,
      item.task_title,
      item.deliverable_title,
      item.recommendation_summary,
    ]
      .join(" ")
      .toLowerCase()
      .includes(query);
  });
}
