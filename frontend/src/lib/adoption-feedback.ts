import type { AdoptionFeedback, AdoptionFeedbackStatus } from "@/lib/types";

export const ADOPTION_FEEDBACK_OPTIONS: Array<{
  value: AdoptionFeedbackStatus;
  label: string;
}> = [
  { value: "adopted", label: "可直接採用" },
  { value: "needs_revision", label: "需改寫後採用" },
  { value: "not_adopted", label: "目前不採用" },
  { value: "template_candidate", label: "值得當範本" },
];

export function buildAdoptionFeedbackView(
  feedback: AdoptionFeedback | null | undefined,
): {
  currentStatus: AdoptionFeedbackStatus | null;
  currentLabel: string;
  hasFeedback: boolean;
} {
  const currentStatus = feedback?.feedback_status ?? null;
  const currentLabel =
    ADOPTION_FEEDBACK_OPTIONS.find((item) => item.value === currentStatus)?.label || "尚未提供回饋";

  return {
    currentStatus,
    currentLabel,
    hasFeedback: Boolean(currentStatus),
  };
}
