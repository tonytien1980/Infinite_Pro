export interface ResearchGuidanceView {
  shouldShow: boolean;
  label: string;
  summary: string;
  depthLabel: string;
  firstQuestion: string;
  questions: string[];
  focusSummary: string;
  stopCondition: string;
  handoffSummary: string;
  boundaryNote: string;
  latestRunSummary: string;
}

function labelForResearchDepth(value: string) {
  if (value === "deep_research") {
    return "深度研究";
  }
  if (value === "standard_investigation") {
    return "標準研究";
  }
  if (value === "light_completion") {
    return "輕量研究";
  }
  return value || "未標示";
}

export function buildResearchGuidanceView(
  guidance:
    | {
        status: string;
        label: string;
        summary: string;
        recommended_depth: string;
        suggested_questions: string[];
        evidence_gap_focus: string[];
        stop_condition: string;
        handoff_summary: string;
        latest_run_summary: string;
        boundary_note: string;
      }
    | null
    | undefined,
): ResearchGuidanceView {
  const questions = guidance?.suggested_questions || [];
  const focus = guidance?.evidence_gap_focus || [];
  const status = guidance?.status || "not_needed";

  return {
    shouldShow: status !== "not_needed",
    label: guidance?.label || "如果要補研究",
    summary: guidance?.summary || "目前沒有額外研究建議。",
    depthLabel: labelForResearchDepth(guidance?.recommended_depth || ""),
    firstQuestion: questions[0] || "目前沒有額外建議子題。",
    questions,
    focusSummary: focus.join("｜"),
    stopCondition: guidance?.stop_condition || "",
    handoffSummary: guidance?.handoff_summary || "",
    boundaryNote: guidance?.boundary_note || "",
    latestRunSummary: guidance?.latest_run_summary || "",
  };
}
