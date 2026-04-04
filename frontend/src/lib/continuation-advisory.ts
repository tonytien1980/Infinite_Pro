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

export interface ContinuationDetailCard {
  title: string;
  summary: string;
}

export interface ContinuationDetailView {
  shouldShow: boolean;
  sectionTitle: string;
  cards: ContinuationDetailCard[];
  timelineItems: ContinuationTimelineItem[];
  listTitle: string;
  listItems: string[];
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

export function buildContinuationDetailView(
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
        | "follow_up_lane"
        | "progression_lane"
      >
    | null
    | undefined,
): ContinuationDetailView {
  const view = buildContinuationAdvisoryView(surface);
  if (!view.shouldShow || surface == null) {
    return {
      shouldShow: false,
      sectionTitle: "",
      cards: [],
      timelineItems: [],
      listTitle: "",
      listItems: [],
    };
  }

  if (surface.workflow_layer === "checkpoint") {
    const followUpLane = surface.follow_up_lane;
    return {
      shouldShow: true,
      sectionTitle: "checkpoint 時間線與變化",
      cards: [
        {
          title: "最近 checkpoint",
          summary:
            followUpLane?.latest_update?.summary ||
            view.timelineItems[0]?.summary ||
            "尚未形成正式檢查點。",
        },
        {
          title: "上一個 checkpoint",
          summary:
            followUpLane?.previous_checkpoint?.summary ||
            view.timelineItems[1]?.summary ||
            "目前沒有更早的檢查點可比較。",
        },
        {
          title: "這次變化",
          summary:
            followUpLane?.what_changed[0] ||
            view.healthSummary ||
            "這輪主要是在延續既有檢查點。",
        },
        {
          title: "回來更新節奏",
          summary:
            [view.reviewRhythmLabel, view.nextReviewPrompt || view.reviewRhythmSummary]
              .filter(Boolean)
              .join("｜") || "目前還沒有額外的回看節奏。",
        },
        {
          title: "下一步建議",
          summary:
            view.nextStepQueue[0] ||
            followUpLane?.next_follow_up_actions[0] ||
            "補完之後回案件工作面更新檢查點。",
        },
      ],
      timelineItems: view.timelineItems,
      listTitle: "建議 / 風險 / 行動延續",
      listItems: [
        ...(followUpLane?.recommendation_changes.map((item) => `${item.title}：${item.summary}`) || []),
        ...(followUpLane?.risk_changes.map((item) => `${item.title}：${item.summary}`) || []),
        ...(followUpLane?.action_changes.map((item) => `${item.title}：${item.summary}`) || []),
      ].slice(0, 5),
    };
  }

  const progressionLane = surface.progression_lane;
  return {
    shouldShow: true,
    sectionTitle: "推進健康、結果與時間線",
    cards: [
      {
        title: "推進健康",
        summary:
          [view.healthLabel, view.healthSummary].filter(Boolean).join("｜") ||
          "目前還沒有額外的推進健康摘要。",
      },
      {
        title: "結果追蹤",
        summary:
          [
            view.outcomeTrackingLabel,
            view.outcomeTrackingSummary || view.latestSignalSummary,
          ]
            .filter(Boolean)
            .join("｜") || "目前還沒有新的結果追蹤摘要。",
      },
      {
        title: "最近推進",
        summary:
          progressionLane?.latest_progression?.summary ||
          view.timelineItems[0]?.summary ||
          "目前還沒有新的推進更新。",
      },
      {
        title: "下次回看節奏",
        summary:
          [view.reviewRhythmLabel, view.nextReviewPrompt || view.reviewRhythmSummary]
            .filter(Boolean)
            .join("｜") || "目前還沒有額外的回看節奏。",
      },
      {
        title: "下一步建議",
        summary:
          view.nextStepQueue[0] ||
          progressionLane?.next_progression_actions[0] ||
          "回案件工作面更新推進狀態。",
      },
    ],
    timelineItems: view.timelineItems,
    listTitle: "建議採納 / 行動 / 結果",
    listItems: [
      ...(progressionLane?.recommendation_states.map((item) => `${item.title}：${item.summary}`) || []),
      ...(progressionLane?.action_states.map((item) => `${item.title}：${item.summary}`) || []),
      ...(progressionLane?.outcome_signals || []),
    ].slice(0, 6),
  };
}
