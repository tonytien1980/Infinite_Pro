import type { PrecedentDuplicateCandidate, PrecedentDuplicateSummary } from "@/lib/types";

export function buildPrecedentDuplicateSummaryView(
  summary: PrecedentDuplicateSummary | null | undefined,
) {
  if (!summary) {
    return {
      shouldShow: false,
      title: "",
      summary: "",
      meta: "",
    };
  }

  return {
    shouldShow:
      summary.pending_review_count > 0 ||
      summary.human_confirmed_count > 0 ||
      summary.kept_separate_count > 0 ||
      summary.split_count > 0,
    title: "同案重複候選整理",
    summary: summary.summary,
    meta: `待確認 ${summary.pending_review_count} / 已確認同一模式 ${summary.human_confirmed_count} / 保留分開 ${summary.kept_separate_count} / 已拆分 ${summary.split_count}`,
  };
}

export function buildPrecedentDuplicateActionView(candidate: PrecedentDuplicateCandidate) {
  const actions = [
    { nextResolution: "human_confirmed_canonical_row" as const, label: "確認同一模式" },
    { nextResolution: "keep_separate" as const, label: "保留分開" },
    { nextResolution: "split" as const, label: "拆成不同模式" },
  ].filter((item) => item.nextResolution !== candidate.review_status);

  return {
    statusLabel:
      candidate.review_status === "human_confirmed_canonical_row"
        ? "已確認同一模式"
        : candidate.review_status === "keep_separate"
          ? "保留分開"
          : candidate.review_status === "split"
            ? "已拆分"
            : "待確認",
    actions,
  };
}
