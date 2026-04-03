export interface ResearchGuidanceView {
  shouldShow: boolean;
  label: string;
  summary: string;
  depthLabel: string;
  firstQuestion: string;
  questions: string[];
  focusSummary: string;
  sourceQualitySummary: string;
  freshnessSummary: string;
  contradictionWatchouts: string[];
  contradictionSummary: string;
  citationReadySummary: string;
  evidenceGapClosurePlan: string[];
  stopCondition: string;
  handoffSummary: string;
  executionOwnerLabel: string;
  supplementBoundaryNote: string;
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
        source_quality_summary: string;
        freshness_summary: string;
        contradiction_watchouts: string[];
        citation_ready_summary: string;
        evidence_gap_closure_plan: string[];
        stop_condition: string;
        handoff_summary: string;
        latest_run_summary: string;
        execution_owner_label: string;
        supplement_boundary_note: string;
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
    label: guidance?.label || "系統研究建議",
    summary: guidance?.summary || "目前沒有額外研究建議。",
    depthLabel: labelForResearchDepth(guidance?.recommended_depth || ""),
    firstQuestion: questions[0] || "目前沒有額外建議子題。",
    questions,
    focusSummary: focus.join("｜"),
    sourceQualitySummary: guidance?.source_quality_summary || "",
    freshnessSummary: guidance?.freshness_summary || "",
    contradictionWatchouts: guidance?.contradiction_watchouts || [],
    contradictionSummary: (guidance?.contradiction_watchouts || []).join("｜"),
    citationReadySummary: guidance?.citation_ready_summary || "",
    evidenceGapClosurePlan: guidance?.evidence_gap_closure_plan || [],
    stopCondition: guidance?.stop_condition || "",
    handoffSummary: guidance?.handoff_summary || "",
    executionOwnerLabel: guidance?.execution_owner_label || "",
    supplementBoundaryNote: guidance?.supplement_boundary_note || "",
    boundaryNote: guidance?.boundary_note || "",
    latestRunSummary: guidance?.latest_run_summary || "",
  };
}
