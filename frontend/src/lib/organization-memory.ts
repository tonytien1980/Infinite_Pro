import type {
  CalibrationAwareWeightingSignal,
  ConfidenceCalibrationSignal,
  GeneralistGuidancePosture,
  OrganizationMemoryGuidance,
  ReuseConfidenceSignal,
} from "@/lib/types";
import { buildPhaseSixSecondLayerSignalNote } from "./phase-six-second-layer.js";

export function buildOrganizationMemoryView(
  guidance: OrganizationMemoryGuidance | null | undefined,
  generalistGuidancePosture?: GeneralistGuidancePosture | null,
  reuseConfidenceSignal?: ReuseConfidenceSignal | null,
  confidenceCalibrationSignal?: ConfidenceCalibrationSignal | null,
  calibrationAwareWeightingSignal?: CalibrationAwareWeightingSignal | null,
): {
  shouldShow: boolean;
  sectionTitle: string;
  summary: string;
  organizationLabel: string;
  sourceLifecycleSummary: string;
  lifecyclePosture: string;
  lifecyclePostureLabel: string;
  freshnessSummary: string;
  reactivationSummary: string;
  stableContextItems: string[];
  knownConstraints: string[];
  continuityAnchor: string;
  crossMatterSummary: string;
  crossMatterItems: Array<{ title: string; summary: string; meta: string; matterWorkspaceId: string }>;
  phaseSixSignalNote: string;
  boundaryNote: string;
} {
  if (!guidance || guidance.status !== "available") {
    return {
      shouldShow: false,
      sectionTitle: "",
      summary: "",
      organizationLabel: "",
      sourceLifecycleSummary: "",
      lifecyclePosture: "",
      lifecyclePostureLabel: "",
      freshnessSummary: "",
      reactivationSummary: "",
      stableContextItems: [],
      knownConstraints: [],
      continuityAnchor: "",
      crossMatterSummary: "",
      crossMatterItems: [],
      phaseSixSignalNote: "",
      boundaryNote: "",
    };
  }

  return {
    shouldShow: true,
    sectionTitle: guidance.label || "這個客戶 / 組織目前已知的穩定背景",
    summary: guidance.summary,
    organizationLabel: guidance.organization_label,
    sourceLifecycleSummary: guidance.source_lifecycle_summary,
    lifecyclePosture: guidance.lifecycle_posture,
    lifecyclePostureLabel: guidance.lifecycle_posture_label,
    freshnessSummary: guidance.freshness_summary,
    reactivationSummary: guidance.reactivation_summary,
    stableContextItems: guidance.stable_context_items,
    knownConstraints: guidance.known_constraints,
    continuityAnchor: guidance.continuity_anchor,
    crossMatterSummary: guidance.cross_matter_summary,
    crossMatterItems: (guidance.cross_matter_items || []).map((item) => ({
      title: item.matter_title,
      summary: item.summary,
      meta: [item.relation_reason, item.freshness_label].filter(Boolean).join("｜"),
      matterWorkspaceId: item.matter_workspace_id,
    })),
    phaseSixSignalNote: buildPhaseSixSecondLayerSignalNote({
      generalistGuidancePosture,
      reuseConfidenceSignal,
      confidenceCalibrationSignal,
      calibrationAwareWeightingSignal,
      lifecyclePrioritySummary:
        guidance.reactivation_summary ||
        guidance.freshness_summary ||
        guidance.source_lifecycle_summary ||
        "",
    }),
    boundaryNote: guidance.boundary_note,
  };
}
