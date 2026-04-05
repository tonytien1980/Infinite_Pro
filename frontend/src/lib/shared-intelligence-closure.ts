import type { SharedIntelligenceClosureReview } from "@/lib/types";

export function buildSharedIntelligenceClosureView(
  review: SharedIntelligenceClosureReview | null | undefined,
): {
  shouldShow: boolean;
  title: string;
  statusLabel: string;
  summary: string;
  meta: string;
  snapshot: string;
  completedItems: string[];
  assetAudits: Array<{ title: string; auditStatusLabel: string; summary: string; nextStep: string }>;
  remainingItems: string[];
  recommendedNextStep: string;
} {
  if (!review) {
    return {
      shouldShow: false,
      title: "",
      statusLabel: "",
      summary: "",
      meta: "",
      snapshot: "",
      completedItems: [],
      assetAudits: [],
      remainingItems: [],
      recommendedNextStep: "",
    };
  }

  return {
    shouldShow: true,
    title: "第 4 階段收尾狀態",
    statusLabel: review.closure_status_label,
    summary: review.summary,
    meta: `已補 ${review.completed_count} 項｜剩 ${review.remaining_count} 項`,
    snapshot: review.candidate_snapshot,
    completedItems: review.completed_items,
    assetAudits: review.asset_audits.map((item) => ({
      title: item.asset_label,
      auditStatusLabel: item.audit_status_label,
      summary: item.summary,
      nextStep: item.next_step,
    })),
    remainingItems: review.remaining_items,
    recommendedNextStep: review.recommended_next_step,
  };
}
