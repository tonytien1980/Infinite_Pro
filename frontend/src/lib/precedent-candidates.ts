import type {
  PrecedentCandidate,
  PrecedentCandidateSummary,
  PrecedentCandidateStatus,
  PrecedentCandidateType,
} from "@/lib/types";

function buildOperatorAttributionSummary(input: {
  sourceFeedbackOperatorLabel?: string | null;
  lastStatusChangedByLabel?: string | null;
}) {
  const parts: string[] = [];
  if (input.sourceFeedbackOperatorLabel) {
    parts.push(`採納：${input.sourceFeedbackOperatorLabel}`);
  }
  if (input.lastStatusChangedByLabel) {
    parts.push(`最近治理：${input.lastStatusChangedByLabel}`);
  }
  return parts.join("｜");
}

type PrecedentCandidateLike = Pick<
  PrecedentCandidate,
  | "candidate_type"
  | "candidate_status"
  | "summary"
  | "reusable_reason"
  | "source_feedback_operator_label"
  | "created_by_label"
  | "last_status_changed_by_label"
>;

function labelForCandidateType(candidateType: PrecedentCandidateType) {
  if (candidateType === "deliverable_pattern") {
    return "交付物模式候選";
  }
  return "建議模式候選";
}

export function buildPrecedentCandidateView(
  candidate: PrecedentCandidateLike | null | undefined,
): {
  shouldShow: boolean;
  badgeLabel: string;
  summary: string;
  statusLabel: string;
  attributionSummary: string;
} {
  if (!candidate) {
    return {
      shouldShow: false,
      badgeLabel: "",
      summary: "",
      statusLabel: "",
      attributionSummary: "",
    };
  }

  const statusLabel =
    candidate.candidate_status === "promoted"
      ? "正式可重用模式"
      : candidate.candidate_status === "dismissed"
        ? "已停用"
        : "候選中";

  return {
    shouldShow: true,
    badgeLabel:
      candidate.candidate_status === "promoted"
        ? "已升格成正式可重用模式"
        : candidate.candidate_status === "dismissed"
          ? "目前已停用這個候選"
          : candidate.candidate_type === "deliverable_pattern"
            ? "已進入可重用候選池"
            : labelForCandidateType(candidate.candidate_type),
    summary: [candidate.summary, candidate.reusable_reason].filter(Boolean).join("｜"),
    statusLabel,
    attributionSummary: buildOperatorAttributionSummary({
      sourceFeedbackOperatorLabel:
        candidate.source_feedback_operator_label || candidate.created_by_label,
      lastStatusChangedByLabel: candidate.last_status_changed_by_label,
    }),
  };
}

export function buildPrecedentCandidateActionView(candidate: {
  candidate_status: PrecedentCandidateStatus;
  candidate_type: PrecedentCandidateType;
}): {
  statusLabel: string;
  actions: Array<{ nextStatus: PrecedentCandidateStatus; label: string }>;
} {
  if (candidate.candidate_status === "promoted") {
    return {
      statusLabel: "正式可重用模式",
      actions: [
        { nextStatus: "candidate", label: "降回候選" },
        { nextStatus: "dismissed", label: "停用這個模式" },
      ],
    };
  }
  if (candidate.candidate_status === "dismissed") {
    return {
      statusLabel: "已停用",
      actions: [{ nextStatus: "candidate", label: "重新列回候選" }],
    };
  }
  return {
    statusLabel: "候選中",
    actions: [
      { nextStatus: "promoted", label: "升格成正式可重用模式" },
      { nextStatus: "dismissed", label: "先停用這個候選" },
    ],
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
