import type {
  DomainPlaybookGuidance,
  GeneralistGuidancePosture,
} from "@/lib/types";

export function buildDomainPlaybookView(
  guidance: DomainPlaybookGuidance | null | undefined,
  generalistGuidancePosture?: GeneralistGuidancePosture | null,
): {
  shouldShow: boolean;
  sectionTitle: string;
  summary: string;
  playbookLabel: string;
  currentStageLabel: string;
  nextStageLabel: string;
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
  listTitle: string;
  listItems: string[];
  generalistGuidanceNote: string;
  boundaryNote: string;
} {
  if (!guidance || guidance.status === "none" || guidance.stages.length === 0) {
    return {
      shouldShow: false,
      sectionTitle: "",
      summary: "",
      playbookLabel: "",
      currentStageLabel: "",
      nextStageLabel: "",
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
      listTitle: "",
      listItems: [],
      generalistGuidanceNote: "",
      boundaryNote: "",
    };
  }

  return {
    shouldShow: true,
    sectionTitle: guidance.label || "這類案子通常怎麼走",
    summary: guidance.summary,
    playbookLabel: guidance.playbook_label,
    currentStageLabel: guidance.current_stage_label,
    nextStageLabel: guidance.next_stage_label,
    fitSummary: guidance.fit_summary,
    sourceMixSummary: guidance.source_mix_summary,
    sourceLifecycleSummary: guidance.source_lifecycle_summary,
    lifecyclePosture: guidance.lifecycle_posture,
    lifecyclePostureLabel: guidance.lifecycle_posture_label,
    freshnessSummary: guidance.freshness_summary,
    recoveryBalanceSummary: guidance.recovery_balance_summary,
    reactivationSummary: guidance.recovery_balance_summary ? "" : guidance.reactivation_summary,
    decaySummary: guidance.recovery_balance_summary ? "" : guidance.decay_summary,
    cards: guidance.stages.slice(0, 3).map((item) => ({
      title: item.title,
      summary: item.why_now || item.summary,
      meta: item.source_label || item.source_kind,
    })),
    listTitle: "這類案子通常這樣推進",
    listItems: guidance.stages.map((item) => item.title),
    generalistGuidanceNote:
      generalistGuidancePosture?.guidance_posture_label && generalistGuidancePosture?.work_guidance_summary
        ? `Phase 6 guidance：${generalistGuidancePosture.guidance_posture_label}｜${generalistGuidancePosture.work_guidance_summary}`
        : "",
    boundaryNote: guidance.boundary_note,
  };
}
