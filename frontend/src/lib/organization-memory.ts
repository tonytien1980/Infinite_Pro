import type {
  ConfidenceCalibrationSignal,
  GeneralistGuidancePosture,
  OrganizationMemoryGuidance,
  ReuseConfidenceSignal,
} from "@/lib/types";

export function buildOrganizationMemoryView(
  guidance: OrganizationMemoryGuidance | null | undefined,
  generalistGuidancePosture?: GeneralistGuidancePosture | null,
  reuseConfidenceSignal?: ReuseConfidenceSignal | null,
  confidenceCalibrationSignal?: ConfidenceCalibrationSignal | null,
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
  generalistGuidanceNote: string;
  reuseConfidenceNote: string;
  confidenceCalibrationNote: string;
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
      generalistGuidanceNote: "",
      reuseConfidenceNote: "",
      confidenceCalibrationNote: "",
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
    generalistGuidanceNote:
      generalistGuidancePosture?.guidance_posture_label && generalistGuidancePosture?.work_guidance_summary
        ? `Phase 6 guidance：${generalistGuidancePosture.guidance_posture_label}｜${generalistGuidancePosture.work_guidance_summary}`
        : "",
    reuseConfidenceNote:
      reuseConfidenceSignal?.confidence_posture_label && reuseConfidenceSignal.distance_items?.length
        ? `Phase 6 reuse confidence：${reuseConfidenceSignal.confidence_posture_label}｜${reuseConfidenceSignal.distance_items
            .slice(0, 2)
            .map((item) => `${item.asset_label}：${item.reuse_confidence_label}`)
            .join("｜")}`
        : "",
    confidenceCalibrationNote:
      confidenceCalibrationSignal?.calibration_posture_label &&
      confidenceCalibrationSignal.calibration_items?.length
        ? `Phase 6 confidence calibration：${confidenceCalibrationSignal.calibration_posture_label}｜${confidenceCalibrationSignal.calibration_items
            .slice(0, 2)
            .map((item) => `${item.axis_label}：${item.calibration_status_label}`)
            .join("｜")}`
        : "",
    boundaryNote: guidance.boundary_note,
  };
}
