import type {
  DecisionBrief,
  MatterCommand,
  WritebackApproval,
} from "./types";

export function buildMatterCommandView(input: MatterCommand) {
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

export function buildDecisionBriefView(input: DecisionBrief) {
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

export function buildWritebackApprovalView(input: WritebackApproval) {
  return {
    primaryTitle: input.primary_action_label,
    primaryCopy: input.primary_action_summary,
    statusLabel: input.posture_label,
    summary: input.summary,
    candidateCopy: input.candidate_summary,
    boundaryNote: input.boundary_note,
  };
}
