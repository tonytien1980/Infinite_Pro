import type { ContinuationSurface, ContinuationTimelineItem } from "@/lib/types";

export interface ContinuationAdvisoryView {
  shouldShow: boolean;
  healthLabel: string;
  healthSummary: string;
  timelineTitle: string;
  timelineItems: ContinuationTimelineItem[];
  nextStepQueue: string[];
}

export function buildContinuationAdvisoryView(
  surface:
    | Pick<
        ContinuationSurface,
        "workflow_layer" | "current_state" | "health_signal" | "timeline_items" | "next_step_queue"
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
    };
  }

  return {
    shouldShow: true,
    healthLabel: surface.health_signal.label,
    healthSummary: surface.health_signal.summary,
    timelineTitle: "最近推進時間線",
    timelineItems: surface.timeline_items.slice(0, 3),
    nextStepQueue: surface.next_step_queue.slice(0, 4),
  };
}
