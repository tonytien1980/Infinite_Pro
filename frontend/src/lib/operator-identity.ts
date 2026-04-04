export function normalizeOperatorDisplayName(value: string | null | undefined) {
  return (value || "").trim().replace(/\s+/g, " ").slice(0, 120);
}

export function buildOperatorAttributionSummary(input: {
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
