import type {
  ConsultantGuideItem,
  ConsultantGuideTone,
} from "@/lib/consultant-usability";

export type TaskOperatingNote = {
  href: string;
  label: string;
  copy: string;
  tone?: ConsultantGuideTone;
};

export type TaskDetailUsabilityView = {
  primaryLabel: string;
  primaryTitle: string;
  primaryCopy: string;
  primaryHref: string;
  primaryActionLabel: string;
  primaryPostureLabel: string;
  primaryPostureCopy: string;
  handoffTarget: "task" | "matter" | "deliverable";
  handoffHref: string;
  handoffTitle: string;
  handoffSummary: string;
  handoffReasonLabel: string;
  checklist: string[];
  guideTitle: string;
  guideDescription: string;
  guideItems: ConsultantGuideItem[];
  railEyebrow: string;
  railTitle: string;
  railSummary: string;
  operatingSummaryTitle: string;
  operatingSummaryCopy: string;
  operatingNotes: TaskOperatingNote[];
};

export function buildTaskDetailUsabilityView(input: {
  hasThinTaskEvidence: boolean;
  hasLatestDeliverable: boolean;
  latestDeliverableTitle: string;
  hasMatterWorkspace: boolean;
  runButtonLabel: string;
  runDestinationLabel: string;
  laneTitle: string;
  laneSummary: string;
  readinessLabel: string;
  readinessSummary: string;
  evidenceCount: number;
  sourceMaterialCount: number;
  hasResearchGuidance: boolean;
  researchSummary: string;
  hasContinuationSummary: boolean;
  continuationSummary: string;
}): TaskDetailUsabilityView {
  const primaryActionLabel = input.hasLatestDeliverable ? "打開正式交付物" : input.runButtonLabel;
  const primaryHref = input.hasLatestDeliverable ? "#deliverable-surface" : "#run-panel";
  const handoffTarget =
    input.hasThinTaskEvidence && input.hasMatterWorkspace
      ? "matter"
      : input.hasLatestDeliverable
        ? "deliverable"
        : "task";
  const handoffHref =
    handoffTarget === "matter"
      ? "#workspace-lane"
      : handoffTarget === "deliverable"
        ? "#deliverable-surface"
        : "#run-panel";
  const handoffTitle =
    handoffTarget === "matter"
      ? "先回案件工作面"
      : handoffTarget === "deliverable"
        ? "先回正式交付物"
        : "先留在 task 判斷";
  const handoffReasonLabel =
    handoffTarget === "matter"
      ? "主因是補脈絡 / 證據 / continuity"
      : handoffTarget === "deliverable"
        ? "主因是閱讀 / 修訂 / 發布結果"
        : "主因是先決定要不要執行";
  const handoffSummary =
    handoffTarget === "matter"
      ? "先回案件工作面補脈絡與證據，再決定這輪要不要直接推進。"
      : handoffTarget === "deliverable"
        ? "先回正式交付物閱讀、修訂或發布，不要只停在 task 摘要。"
        : "現在先留在 task，先判斷是否直接執行或先補局部缺口。";
  const guideItems: ConsultantGuideItem[] = [
    {
      href: "#readiness-governance",
      eyebrow: "先看能不能跑",
      title: `先看${input.readinessLabel}`,
      copy: "先確認現在最缺的是決策問題、來源材料，還是證據厚度。",
      meta: input.readinessSummary,
      tone: input.hasThinTaskEvidence ? "warm" : "accent",
    },
    {
      href: "#run-panel",
      eyebrow: "現在先做這件事",
      title: input.hasLatestDeliverable ? "先決定還要不要重跑" : "先決定要不要直接執行",
      copy: input.hasLatestDeliverable
        ? "如果只是要回看結果，不一定要再重跑。"
        : "這一格應只回答現在先執行，還是先補缺口。",
      meta: input.runDestinationLabel,
      tone: "accent",
    },
    {
      href: handoffHref,
      eyebrow: "要接續工作時",
      title: handoffTitle,
      copy: handoffSummary,
      meta: `${input.sourceMaterialCount} 份來源材料 / ${input.evidenceCount} 則證據`,
      tone: input.hasThinTaskEvidence ? "warm" : "default",
    },
  ];
  const fallbackHref = handoffHref;
  const fallbackCopy =
    handoffTarget === "matter"
      ? "現在最有槓桿的回退路徑是先補來源與證據，並回案件工作面補脈絡，不要只停在 task 摘要。"
      : handoffTarget === "deliverable"
        ? input.hasLatestDeliverable
          ? `最新結果「${input.latestDeliverableTitle}」已形成，先回正式交付物通常最快。`
          : "若這輪已接近正式結果閱讀，先回正式交付物比繼續停在 task 更有效。"
        : "現在最有槓桿的是先留在 task，先決定要不要直接執行。";
  const operatingNotes: TaskOperatingNote[] = [
    {
      href: fallbackHref,
      label: "最有槓桿的下一步",
      copy: fallbackCopy,
      tone: input.hasThinTaskEvidence ? "warm" : "accent",
    },
    {
      href: input.hasContinuationSummary
        ? "#deliverable-surface"
        : input.hasResearchGuidance
          ? "#readiness-governance"
          : "#decision-context",
      label: input.hasContinuationSummary
        ? "接續工作時"
        : input.hasResearchGuidance
          ? "目前最大限制"
          : "主線限制",
      copy: input.hasContinuationSummary
        ? input.continuationSummary
        : input.hasResearchGuidance
          ? input.researchSummary
          : `${input.readinessLabel}｜${input.readinessSummary}`,
    },
    {
      href: input.hasContinuationSummary ? "#readiness-governance" : "#run-panel",
      label: input.hasContinuationSummary ? "目前最大限制" : "不直接跑時",
      copy: input.hasContinuationSummary
        ? `${input.readinessLabel}｜${input.readinessSummary}`
        : input.runDestinationLabel,
    },
  ];

  return {
    primaryLabel: "現在先做這件事",
    primaryTitle: input.hasLatestDeliverable ? "先回看目前結果" : "先判斷要不要直接跑",
    primaryCopy: input.hasThinTaskEvidence
      ? `${input.readinessSummary} 先補來源與證據，或直接先跑第一版都可以。`
      : input.runDestinationLabel,
    primaryHref,
    primaryActionLabel,
    primaryPostureLabel: input.laneTitle,
    primaryPostureCopy: input.laneSummary,
    handoffTarget,
    handoffHref,
    handoffTitle,
    handoffSummary,
    handoffReasonLabel,
    checklist: [
      "先確認這輪到底在判斷什麼。",
      input.hasThinTaskEvidence
        ? "若缺口明顯，先補來源與證據。"
        : "如果可直接推進，就不要只停在閱讀摘要。",
      input.hasLatestDeliverable
        ? "若結果已形成，先回正式交付結果。"
        : "執行後再回正式交付結果。",
    ],
    guideTitle: "第二層導讀",
    guideDescription: "第二層只看主線與現在這一步；導讀只補頁內路徑，不再和首屏並排。",
    guideItems,
    railEyebrow: "第二層回跳",
    railTitle: handoffTitle,
    railSummary:
      handoffTarget === "deliverable" && input.latestDeliverableTitle
        ? `最新結果「${input.latestDeliverableTitle}」已形成，先回正式交付物閱讀、修訂或發布。`
        : handoffTarget === "task"
        ? "這輪還不需要離開 task，先決定要不要直接執行。"
        : "先回案件工作面補脈絡與證據，再決定這輪要不要直接推進。",
    operatingSummaryTitle: "第二層操作提示",
    operatingSummaryCopy: input.hasThinTaskEvidence
      ? `${input.readinessSummary} 第二層只保留補來源、先跑第一版，或先回看結果的回跳提示。`
      : "第二層只保留最小必要的回跳提示，不再重講一次主線。",
    operatingNotes,
  };
}
