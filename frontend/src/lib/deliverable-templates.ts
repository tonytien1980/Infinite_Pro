import type {
  CalibrationAwareWeightingSignal,
  ConfidenceCalibrationSignal,
  DeliverableTemplateGuidance,
  GeneralistGuidancePosture,
  ReuseConfidenceSignal,
} from "@/lib/types";
import { buildPhaseSixSecondLayerSignalNote } from "./phase-six-second-layer.js";

function labelForTemplatePriority(priority: string) {
  if (priority === "high") {
    return "建議先用";
  }
  if (priority === "medium") {
    return "可一起參考";
  }
  return "留作背景校正";
}

export function buildDeliverableTemplateView(
  guidance: DeliverableTemplateGuidance | null | undefined,
  generalistGuidancePosture?: GeneralistGuidancePosture | null,
  reuseConfidenceSignal?: ReuseConfidenceSignal | null,
  confidenceCalibrationSignal?: ConfidenceCalibrationSignal | null,
  calibrationAwareWeightingSignal?: CalibrationAwareWeightingSignal | null,
): {
  shouldShow: boolean;
  sectionTitle: string;
  summary: string;
  templateLabel: string;
  templateFitSummary: string;
  fitSummary: string;
  sourceMixSummary: string;
  sourceLifecycleSummary: string;
  lifecyclePosture: string;
  lifecyclePostureLabel: string;
  freshnessSummary: string;
  recoveryBalanceSummary: string;
  reactivationSummary: string;
  decaySummary: string;
  cards: Array<{ title: string; summary: string; meta: string }>;
  coreListTitle: string;
  coreSections: string[];
  optionalListTitle: string;
  optionalSections: string[];
  phaseSixSignalNote: string;
  boundaryNote: string;
} {
  if (!guidance || guidance.status === "none") {
    return {
      shouldShow: false,
      sectionTitle: "",
      summary: "",
      templateLabel: "",
      templateFitSummary: "",
      fitSummary: "",
      sourceMixSummary: "",
      sourceLifecycleSummary: "",
      lifecyclePosture: "",
      lifecyclePostureLabel: "",
      freshnessSummary: "",
      recoveryBalanceSummary: "",
      reactivationSummary: "",
      decaySummary: "",
      cards: [],
      coreListTitle: "",
      coreSections: [],
      optionalListTitle: "",
      optionalSections: [],
      phaseSixSignalNote: "",
      boundaryNote: "",
    };
  }

  return {
    shouldShow: true,
    sectionTitle: guidance.label || "這份交付比較適合沿用哪種模板主線",
    summary: guidance.summary || "Host 已先整理這輪較穩的模板主線。",
    templateLabel: guidance.template_label,
    templateFitSummary: guidance.template_fit_summary,
    fitSummary: guidance.fit_summary,
    sourceMixSummary: guidance.source_mix_summary,
    sourceLifecycleSummary: guidance.source_lifecycle_summary,
    lifecyclePosture: guidance.lifecycle_posture,
    lifecyclePostureLabel: guidance.lifecycle_posture_label,
    freshnessSummary: guidance.freshness_summary,
    recoveryBalanceSummary: guidance.recovery_balance_summary,
    reactivationSummary: guidance.recovery_balance_summary ? "" : guidance.reactivation_summary,
    decaySummary: guidance.recovery_balance_summary ? "" : guidance.decay_summary,
    cards: guidance.blocks.map((block) => ({
      title: block.title,
      summary: [block.why_fit, block.summary].filter(Boolean).join("｜"),
      meta: [labelForTemplatePriority(block.priority), block.source_label || block.source_kind]
        .filter(Boolean)
        .join("｜"),
    })),
    coreListTitle: "先守住這些核心區塊",
    coreSections: guidance.core_sections,
    optionalListTitle: "這些區塊視案件補",
    optionalSections: guidance.optional_sections,
    phaseSixSignalNote: buildPhaseSixSecondLayerSignalNote({
      surfaceKind: "deliverable_template",
      generalistGuidancePosture,
      reuseConfidenceSignal,
      confidenceCalibrationSignal,
      calibrationAwareWeightingSignal,
      lifecyclePrioritySummary:
        guidance.recovery_balance_summary ||
        guidance.reactivation_summary ||
        guidance.decay_summary ||
        guidance.freshness_summary ||
        guidance.source_lifecycle_summary ||
        "",
    }),
    boundaryNote: guidance.boundary_note,
  };
}
