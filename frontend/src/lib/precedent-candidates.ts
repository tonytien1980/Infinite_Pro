import type {
  PrecedentCandidate,
  PrecedentCandidateSummary,
  PrecedentCandidateType,
} from "@/lib/types";

function labelForCandidateType(candidateType: PrecedentCandidateType) {
  if (candidateType === "deliverable_pattern") {
    return "交付物模式候選";
  }
  return "建議模式候選";
}

export function buildPrecedentCandidateView(
  candidate: PrecedentCandidate | null | undefined,
): {
  shouldShow: boolean;
  badgeLabel: string;
  summary: string;
} {
  if (!candidate) {
    return {
      shouldShow: false,
      badgeLabel: "",
      summary: "",
    };
  }

  return {
    shouldShow: true,
    badgeLabel:
      candidate.candidate_type === "deliverable_pattern"
        ? "已進入可重用候選池"
        : labelForCandidateType(candidate.candidate_type),
    summary: [candidate.summary, candidate.reusable_reason].filter(Boolean).join("｜"),
  };
}

export function buildPrecedentCandidateSummaryView(
  summary: PrecedentCandidateSummary | null | undefined,
): {
  shouldShow: boolean;
  title: string;
  summary: string;
  meta: string;
} {
  if (!summary || summary.total_candidates <= 0) {
    return {
      shouldShow: false,
      title: "",
      summary: "",
      meta: "",
    };
  }

  return {
    shouldShow: true,
    title: "可重用候選",
    summary: summary.summary,
    meta: `交付物 ${summary.deliverable_candidate_count} / 建議 ${summary.recommendation_candidate_count}`,
  };
}
