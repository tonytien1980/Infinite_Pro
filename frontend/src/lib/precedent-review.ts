import type { PrecedentReviewItem } from "@/lib/types";

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
