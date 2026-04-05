import type {
  PrecedentCandidate,
  PrecedentGovernanceRecommendation,
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
  governance_recommendation?: PrecedentGovernanceRecommendation | null;
}): {
  statusLabel: string;
  governanceSummary: string;
  recommendedAction: { nextStatus: PrecedentCandidateStatus; label: string } | null;
  actions: Array<{ nextStatus: PrecedentCandidateStatus; label: string }>;
} {
  const reorderActions = (
    actions: Array<{ nextStatus: PrecedentCandidateStatus; label: string }>,
  ) => {
    const targetStatus = candidate.governance_recommendation?.target_status;
    if (!targetStatus) {
      return actions;
    }
    return [...actions].sort((left, right) => {
      const leftPreferred = left.nextStatus === targetStatus ? 0 : 1;
      const rightPreferred = right.nextStatus === targetStatus ? 0 : 1;
      return leftPreferred - rightPreferred;
    });
  };
  const governanceSummary = candidate.governance_recommendation
    ? `${candidate.governance_recommendation.action_label}｜${candidate.governance_recommendation.summary}`
    : "";
  const buildRecommendedAction = (
    actions: Array<{ nextStatus: PrecedentCandidateStatus; label: string }>,
  ) => {
    const targetStatus = candidate.governance_recommendation?.target_status;
    if (!targetStatus || targetStatus === candidate.candidate_status) {
      return null;
    }
    const match = actions.find((action) => action.nextStatus === targetStatus);
    if (!match) {
      return null;
    }
    return {
      nextStatus: match.nextStatus,
      label: `套用建議：${match.label}`,
    };
  };
  if (candidate.candidate_status === "promoted") {
    const actions = reorderActions([
      { nextStatus: "candidate", label: "降回候選" },
      { nextStatus: "dismissed", label: "停用這個模式" },
    ]);
    return {
      statusLabel: "正式可重用模式",
      governanceSummary,
      recommendedAction: buildRecommendedAction(actions),
      actions,
    };
  }
  if (candidate.candidate_status === "dismissed") {
    const actions = reorderActions([{ nextStatus: "candidate", label: "重新列回候選" }]);
    return {
      statusLabel: "已停用",
      governanceSummary,
      recommendedAction: buildRecommendedAction(actions),
      actions,
    };
  }
  const actions = reorderActions([
    { nextStatus: "promoted", label: "升格成正式可重用模式" },
    { nextStatus: "dismissed", label: "先停用這個候選" },
  ]);
  return {
    statusLabel: "候選中",
    governanceSummary,
    recommendedAction: buildRecommendedAction(actions),
    actions,
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
