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
  const thirdHref =
    input.hasThinTaskEvidence && input.hasMatterWorkspace
      ? "#workspace-lane"
      : "#deliverable-surface";
  const thirdTitle =
    input.hasThinTaskEvidence && input.hasMatterWorkspace
      ? "先補來源與證據"
      : "直接回正式交付結果";
  const thirdCopy =
    input.hasThinTaskEvidence && input.hasMatterWorkspace
      ? "若現在卡在依據偏薄，先回來源與證據工作面通常比空看頁面更有效。"
      : "如果最新結果已形成，先回正式交付結果最快。";
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
      href: thirdHref,
      eyebrow: "要接續工作時",
      title: thirdTitle,
      copy: thirdCopy,
      meta: `${input.sourceMaterialCount} 份來源材料 / ${input.evidenceCount} 則證據`,
      tone: input.hasThinTaskEvidence ? "warm" : "default",
    },
  ];
  const fallbackHref =
    input.hasThinTaskEvidence && input.hasMatterWorkspace
      ? "#workspace-lane"
      : "#deliverable-surface";
  const fallbackCopy =
    input.hasThinTaskEvidence && input.hasMatterWorkspace
      ? "現在最有槓桿的回退路徑是先補來源與證據，不要只停在 task 摘要。"
      : input.hasLatestDeliverable
        ? `最新結果「${input.latestDeliverableTitle}」已形成，先回正式交付物通常最快。`
        : "若不直接執行，先回正式交付結果或案件工作面確認脈絡。";
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
          ? "目前最大 caution"
          : "主線限制",
      copy: input.hasContinuationSummary
        ? input.continuationSummary
        : input.hasResearchGuidance
          ? input.researchSummary
          : `${input.readinessLabel}｜${input.readinessSummary}`,
    },
    {
      href: input.hasContinuationSummary ? "#readiness-governance" : "#run-panel",
      label: input.hasContinuationSummary ? "主線限制" : "接續工作時",
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
    checklist: [
      "先確認這輪到底在判斷什麼。",
      input.hasThinTaskEvidence
        ? "若缺口明顯，先補來源與證據。"
        : "如果可直接推進，就不要只停在閱讀摘要。",
      input.hasLatestDeliverable
        ? "若結果已形成，先回正式交付結果。"
        : "執行後再回正式交付結果。",
    ],
    guideTitle: "這頁怎麼讀最快",
    guideDescription: "先判斷能不能跑，再決定是直接執行、先補依據，還是回看正式結果。",
    guideItems,
    railEyebrow: input.laneTitle,
    railTitle: input.hasLatestDeliverable ? "結果已形成，可先回看" : "這筆工作接下來往哪裡",
    railSummary: input.hasLatestDeliverable
      ? `最新結果是「${input.latestDeliverableTitle}」，先回正式交付結果通常最快。`
      : input.laneSummary,
    operatingSummaryTitle: "這頁現在怎麼推最快",
    operatingSummaryCopy: input.hasThinTaskEvidence
      ? `${input.readinessSummary} 先承認目前還有缺口，再決定是先補 evidence、先讓系統跑第一版，還是先回看已形成的結果。`
      : "這頁現在不需要再重新理解整個背景，直接抓 posture、限制與下一步即可。",
    operatingNotes,
  };
}
