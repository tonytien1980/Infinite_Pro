import type { PhaseFiveClosureReview } from "@/lib/types";

export function buildPhaseFiveClosureView(
  review: PhaseFiveClosureReview | null | undefined,
) {
  if (!review) {
    return {
      shouldShow: false,
      title: "",
      statusLabel: "",
      summary: "",
      meta: "",
      snapshot: "",
      completedItems: [] as string[],
      assetAudits: [] as Array<{ title: string; auditStatusLabel: string; summary: string }>,
      remainingItems: [] as string[],
      recommendedNextStep: "",
    };
  }

  return {
    shouldShow: true,
    title: "第 5 階段收尾狀態",
    statusLabel: review.closure_status_label,
    summary: review.summary,
    meta: `已補 ${review.completed_count} 項｜剩 ${review.remaining_count} 項`,
    snapshot: review.foundation_snapshot,
    completedItems: review.completed_items,
    assetAudits: review.asset_audits.map((item) => ({
      title: item.asset_label,
      auditStatusLabel: item.audit_status_label,
      summary: item.summary,
    })),
    remainingItems: review.remaining_items,
    recommendedNextStep: review.recommended_next_step,
  };
}
