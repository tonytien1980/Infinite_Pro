import type { ContinuationSurface, ContinuationTimelineItem } from "@/lib/types";

export interface ContinuationAdvisoryView {
  shouldShow: boolean;
  healthLabel: string;
  healthSummary: string;
  timelineTitle: string;
  timelineItems: ContinuationTimelineItem[];
  nextStepQueue: string[];
  outcomeTrackingLabel: string;
  outcomeTrackingSummary: string;
  latestSignalSummary: string;
  needsDeliverableRefresh: boolean;
  reviewRhythmLabel: string;
  reviewRhythmSummary: string;
  nextReviewPrompt: string;
}

export function buildContinuationAdvisoryView(
  surface:
    | Pick<
        ContinuationSurface,
        | "workflow_layer"
        | "current_state"
        | "health_signal"
        | "timeline_items"
        | "next_step_queue"
        | "outcome_tracking"
        | "review_rhythm"
      >
    | null
    | undefined,
): ContinuationAdvisoryView {
  if (surface?.workflow_layer !== "progression" || surface.health_signal == null) {
    return {
      shouldShow: false,
      healthLabel: "",
      healthSummary: "",
      timelineTitle: "最近推進時間線",
      timelineItems: [],
      nextStepQueue: [],
      outcomeTrackingLabel: "",
      outcomeTrackingSummary: "",
      latestSignalSummary: "",
      needsDeliverableRefresh: false,
      reviewRhythmLabel: "",
      reviewRhythmSummary: "",
      nextReviewPrompt: "",
    };
  }

  return {
    shouldShow: true,
    healthLabel: surface.health_signal.label,
    healthSummary: surface.health_signal.summary,
    timelineTitle: "最近推進時間線",
    timelineItems: surface.timeline_items.slice(0, 3),
    nextStepQueue: surface.next_step_queue.slice(0, 4),
    outcomeTrackingLabel: surface.outcome_tracking?.label || "",
    outcomeTrackingSummary: surface.outcome_tracking?.summary || "",
    latestSignalSummary: surface.outcome_tracking?.latest_signal_summary || "",
    needsDeliverableRefresh: surface.outcome_tracking?.needs_deliverable_refresh || false,
    reviewRhythmLabel: surface.review_rhythm?.label || "",
    reviewRhythmSummary: surface.review_rhythm?.summary || "",
    nextReviewPrompt: surface.review_rhythm?.next_review_prompt || "",
  };
}
