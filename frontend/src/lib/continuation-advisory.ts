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

export interface ContinuationFocusSummary {
  shouldShow: boolean;
  label: string;
  title: string;
  copy: string;
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
  if (
    (surface?.workflow_layer !== "progression" && surface?.workflow_layer !== "checkpoint")
    || surface.health_signal == null
  ) {
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
    timelineTitle:
      surface.workflow_layer === "checkpoint" ? "最近 checkpoint 時間線" : "最近推進時間線",
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

export function buildContinuationFocusSummary(
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
): ContinuationFocusSummary {
  const view = buildContinuationAdvisoryView(surface);
  if (!view.shouldShow || surface == null) {
    return {
      shouldShow: false,
      label: "",
      title: "",
      copy: "",
    };
  }

  if (surface.workflow_layer === "checkpoint") {
    return {
      shouldShow: true,
      label: "回來更新節奏",
      title: view.timelineItems[0]?.summary || view.healthLabel || "尚未形成正式 checkpoint。",
      copy:
        [
          view.reviewRhythmLabel,
          view.nextReviewPrompt || view.reviewRhythmSummary,
          view.nextStepQueue[0] ? `下一步：${view.nextStepQueue[0]}` : "",
        ]
          .filter(Boolean)
          .join("｜") || view.healthSummary,
    };
  }

  return {
    shouldShow: true,
    label: "持續推進節奏",
    title:
      view.outcomeTrackingLabel ||
      view.latestSignalSummary ||
      view.timelineItems[0]?.summary ||
      view.healthLabel ||
      "目前還沒有新的推進更新。",
    copy:
      [
        view.reviewRhythmLabel,
        view.nextReviewPrompt || view.reviewRhythmSummary,
        view.nextStepQueue[0] ? `下一步：${view.nextStepQueue[0]}` : "",
      ]
        .filter(Boolean)
        .join("｜") || view.healthSummary,
  };
}
