export function buildMatterCommandView(input: {
  command_posture: "push_task" | "fill_evidence" | "review_deliverable";
  command_posture_label: string;
  focus_summary: string;
  primary_task_id: string | null;
  primary_task_title: string;
  primary_task_reason: string;
  blocker_summary: string;
  deliverable_direction_summary: string;
  next_step_summary: string;
}) {
  return {
    eyebrow: "案件指揮",
    primaryHref: input.primary_task_id ? `/tasks/${input.primary_task_id}` : "/matters",
    primaryTitle: input.primary_task_title,
    primaryCopy: input.primary_task_reason,
    blockerTitle: input.command_posture_label,
    blockerCopy: input.blocker_summary,
    deliverableCopy: input.deliverable_direction_summary,
    nextStepCopy: input.next_step_summary,
  };
}

export function buildDecisionBriefView(input: {
  posture: "draft" | "decision_ready" | "publish_ready";
  posture_label: string;
  question_summary: string;
  options_summary: string;
  risk_summary: string;
  recommendation_summary: string;
  next_action_summary: string;
  boundary_note: string;
}) {
  const checklist = [
    input.question_summary,
    input.options_summary,
    input.risk_summary,
    input.next_action_summary,
  ].filter((item): item is string => Boolean(item));

  return {
    railEyebrow: "Decision Brief",
    railTitle: input.posture_label,
    summary: input.recommendation_summary || input.question_summary,
    checklist,
    boundaryNote: input.boundary_note,
  };
}

export function buildWritebackApprovalView(input: {
  posture: "minimal" | "candidate_review" | "formal_approval" | "completed";
  posture_label: string;
  summary: string;
  primary_action_label: string;
  primary_action_summary: string;
  candidate_summary: string;
  boundary_note: string;
}) {
  return {
    primaryTitle: input.primary_action_label,
    primaryCopy: input.primary_action_summary,
    statusLabel: input.posture_label,
    summary: input.summary,
    candidateCopy: input.candidate_summary,
    boundaryNote: input.boundary_note,
  };
}
