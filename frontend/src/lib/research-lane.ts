import type { ResearchRun } from "@/lib/types";

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

export interface ResearchDetailCard {
  title: string;
  summary: string;
}

export interface ResearchDetailView {
  shouldShow: boolean;
  sectionTitle: string;
  cards: ResearchDetailCard[];
  listTitle: string;
  listItems: string[];
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

export function buildResearchDetailView(
  guidance: ResearchGuidanceView | null | undefined,
  latestRun:
    | Pick<
        ResearchRun,
        | "query"
        | "research_depth"
        | "freshness_policy"
        | "confidence_note"
        | "source_trace_summary"
        | "sub_questions"
        | "evidence_gap_focus"
        | "source_quality_summary"
        | "contradiction_summary"
        | "citation_handoff_summary"
        | "result_summary"
        | "source_count"
      >
    | null
    | undefined,
): ResearchDetailView {
  if (guidance?.shouldShow) {
    return {
      shouldShow: true,
      sectionTitle: "系統研究主線",
      cards: [
        {
          title: "這輪先查什麼",
          summary: [guidance.depthLabel, guidance.firstQuestion].filter(Boolean).join("｜"),
        },
        {
          title: "來源品質怎麼看",
          summary:
            guidance.sourceQualitySummary ||
            guidance.executionOwnerLabel ||
            "目前沒有額外的來源品質提示。",
        },
        {
          title: "時效性與矛盾",
          summary:
            [
              guidance.freshnessSummary,
              guidance.contradictionWatchouts[0]
                ? `矛盾訊號：${guidance.contradictionWatchouts[0]}`
                : "",
            ]
              .filter(Boolean)
              .join("｜") || "目前沒有額外的時效性或矛盾提示。",
        },
        {
          title: "研究交接",
          summary:
            [
              guidance.citationReadySummary || guidance.handoffSummary,
              guidance.boundaryNote,
            ]
              .filter(Boolean)
              .join("｜") || "目前沒有額外的研究交接提示。",
        },
      ],
      listTitle: "研究子題 / 缺口收斂",
      listItems: [
        guidance.questions[1] || "",
        guidance.focusSummary ? `研究聚焦：${guidance.focusSummary}` : "",
        guidance.evidenceGapClosurePlan[0]
          ? `缺口收斂：${guidance.evidenceGapClosurePlan[0]}`
          : guidance.stopCondition
            ? `先停條件：${guidance.stopCondition}`
            : "",
      ].filter(Boolean),
    };
  }

  if (!latestRun) {
    return {
      shouldShow: false,
      sectionTitle: "",
      cards: [],
      listTitle: "",
      listItems: [],
    };
  }

  return {
    shouldShow: true,
    sectionTitle: "最近系統研究交接",
    cards: [
      {
        title: "最近研究交接",
        summary:
          [
            labelForResearchDepth(latestRun.research_depth),
            latestRun.query,
            latestRun.result_summary,
          ]
            .filter(Boolean)
            .join("｜") || "目前沒有額外的研究交接摘要。",
      },
      {
        title: "來源品質怎麼看",
        summary:
          latestRun.source_quality_summary ||
          latestRun.source_trace_summary ||
          "目前沒有額外的來源品質提示。",
      },
      {
        title: "時效性與矛盾",
        summary:
          [
            latestRun.freshness_policy,
            latestRun.confidence_note || latestRun.contradiction_summary,
          ]
            .filter(Boolean)
            .join("｜") || "目前沒有額外的時效性或矛盾提示。",
      },
      {
        title: "研究交接",
        summary:
          [
            latestRun.citation_handoff_summary,
            latestRun.source_trace_summary
              ? `來源線索：${latestRun.source_trace_summary}`
              : latestRun.source_count
                ? `來源數量：${latestRun.source_count}`
                : "",
          ]
            .filter(Boolean)
            .join("｜") || "目前沒有額外的研究交接提示。",
      },
    ],
    listTitle: "研究子題 / 來源線索",
    listItems: [
      latestRun.sub_questions[0] || "",
      latestRun.sub_questions[1] || "",
      latestRun.evidence_gap_focus.length > 0
        ? `研究聚焦：${latestRun.evidence_gap_focus.join("｜")}`
        : latestRun.source_trace_summary
          ? `來源線索：${latestRun.source_trace_summary}`
          : "",
    ].filter(Boolean),
  };
}
