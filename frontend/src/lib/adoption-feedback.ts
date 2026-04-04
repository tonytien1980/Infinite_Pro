import type { AdoptionFeedback, AdoptionFeedbackStatus } from "@/lib/types";

export type AdoptionFeedbackSurface = "deliverable" | "recommendation";

export const ADOPTION_FEEDBACK_OPTIONS: Array<{
  value: AdoptionFeedbackStatus;
  label: string;
}> = [
  { value: "adopted", label: "可直接採用" },
  { value: "needs_revision", label: "需改寫後採用" },
  { value: "not_adopted", label: "目前不採用" },
  { value: "template_candidate", label: "值得當範本" },
];

export const ADOPTION_FEEDBACK_REASON_OPTIONS: Record<
  AdoptionFeedbackSurface,
  Record<AdoptionFeedbackStatus, Array<{ value: string; label: string }>>
> = {
  deliverable: {
    adopted: [
      { value: "ready_to_send", label: "已可直接交付" },
      { value: "judgment_clear", label: "判斷已很清楚" },
      { value: "structure_clear", label: "結構已很清楚" },
      { value: "fits_this_case", label: "很適合這個案件" },
    ],
    needs_revision: [
      { value: "needs_more_evidence", label: "還需要更多證據" },
      { value: "needs_tighter_logic", label: "邏輯還可以更緊" },
      { value: "needs_clearer_structure", label: "結構還可以更清楚" },
      { value: "needs_scope_adjustment", label: "適用範圍還要再調整" },
    ],
    not_adopted: [
      { value: "too_generic", label: "內容還太泛" },
      { value: "misread_context", label: "有點讀錯情境" },
      { value: "too_risky", label: "風險還太高" },
      { value: "not_actionable", label: "還不夠可執行" },
    ],
    template_candidate: [
      { value: "reusable_structure", label: "可重用的交付結構" },
      { value: "reusable_reasoning", label: "可重用的判斷方式" },
      { value: "reusable_risk_scan", label: "可重用的風險掃描" },
      { value: "reusable_deliverable_shape", label: "可重用的交付骨架" },
    ],
  },
  recommendation: {
    adopted: [
      { value: "actionable_now", label: "現在就能採行" },
      { value: "priority_is_right", label: "優先順序正確" },
      { value: "fits_constraints", label: "符合這案限制" },
      { value: "ready_to_assign", label: "已可直接指派" },
    ],
    needs_revision: [
      { value: "needs_more_support", label: "還需要更多支撐" },
      { value: "needs_owner_clarity", label: "owner 還不夠清楚" },
      { value: "needs_scope_clarity", label: "範圍還要更清楚" },
      { value: "needs_sequence_adjustment", label: "順序還要再調整" },
    ],
    not_adopted: [
      { value: "not_fit_for_case", label: "不太適合這個案子" },
      { value: "too_abstract", label: "還太抽象" },
      { value: "timing_not_right", label: "現在時機不對" },
      { value: "risk_too_high", label: "執行風險太高" },
    ],
    template_candidate: [
      { value: "reusable_action_pattern", label: "可重用的行動模式" },
      { value: "reusable_priority_judgment", label: "可重用的優先順序判斷" },
      { value: "reusable_constraint_handling", label: "可重用的限制處理" },
      { value: "reusable_client_framing", label: "可重用的客戶情境 framing" },
    ],
  },
};

export function getAdoptionFeedbackReasonOptions(
  surface: AdoptionFeedbackSurface,
  status: AdoptionFeedbackStatus | null,
) {
  if (!status) {
    return [];
  }
  return ADOPTION_FEEDBACK_REASON_OPTIONS[surface][status] || [];
}

function getAdoptionFeedbackReasonLabel(
  surface: AdoptionFeedbackSurface,
  status: AdoptionFeedbackStatus | null,
  code: string,
) {
  return getAdoptionFeedbackReasonOptions(surface, status).find((item) => item.value === code)?.label || code;
}

export function buildAdoptionFeedbackView(
  feedback: AdoptionFeedback | null | undefined,
  surface: AdoptionFeedbackSurface,
): {
  currentStatus: AdoptionFeedbackStatus | null;
  currentLabel: string;
  currentReasonCodes: string[];
  currentReasonLabels: string[];
  currentReasonSummary: string;
  currentNote: string;
  currentAttributionSummary: string;
  hasFeedback: boolean;
  shouldShowReasonStage: boolean;
  reasonPrompt: string;
} {
  const currentStatus = feedback?.feedback_status ?? null;
  const currentLabel =
    ADOPTION_FEEDBACK_OPTIONS.find((item) => item.value === currentStatus)?.label || "尚未提供回饋";
  const currentReasonCodes = feedback?.reason_codes ?? [];
  const currentReasonLabels = currentReasonCodes.map((code) =>
    getAdoptionFeedbackReasonLabel(surface, currentStatus, code),
  );

  return {
    currentStatus,
    currentLabel,
    currentReasonCodes,
    currentReasonLabels,
    currentReasonSummary: currentReasonLabels[0] || "",
    currentNote: feedback?.note || "",
    currentAttributionSummary: feedback?.operator_label ? `由 ${feedback.operator_label} 標記` : "",
    hasFeedback: Boolean(currentStatus),
    shouldShowReasonStage: Boolean(currentStatus),
    reasonPrompt: "補一個主要原因",
  };
}
