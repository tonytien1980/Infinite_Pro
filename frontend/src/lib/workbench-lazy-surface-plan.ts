export type LazySurfacePanelPlanItem = {
  key: string;
  title: string;
  lazy: true;
};

export type DeferredTabPlanItem = {
  key: "overview" | "decision" | "evidence" | "deliverables" | "history";
  lazy: boolean;
};

export function buildMatterOnDemandPanelPlan(): LazySurfacePanelPlanItem[] {
  return [
    {
      key: "worldState",
      title: "案件世界狀態與寫回策略",
      lazy: true,
    },
    {
      key: "settings",
      title: "案件設定與同步",
      lazy: true,
    },
    {
      key: "background",
      title: "案件背景與連續性",
      lazy: true,
    },
  ];
}

export function buildMatterDeferredTabPlan(): DeferredTabPlanItem[] {
  return [
    {
      key: "overview",
      lazy: false,
    },
    {
      key: "decision",
      lazy: true,
    },
    {
      key: "evidence",
      lazy: true,
    },
    {
      key: "deliverables",
      lazy: true,
    },
    {
      key: "history",
      lazy: true,
    },
  ];
}

export function buildEvidenceOnDemandPanelPlan({
  hasCanonicalizationCandidates,
}: {
  hasCanonicalizationCandidates: boolean;
}): LazySurfacePanelPlanItem[] {
  return [
    ...(hasCanonicalizationCandidates
      ? [
          {
            key: "duplicateReview",
            title: "需確認是否同一份材料",
            lazy: true as const,
          },
        ]
      : []),
    {
      key: "materials",
      title: "來源材料",
      lazy: true,
    },
    {
      key: "artifacts",
      title: "工作物件",
      lazy: true,
    },
    {
      key: "chains",
      title: "證據支撐鏈",
      lazy: true,
    },
    {
      key: "relatedTasks",
      title: "這個工作面中的相關工作紀錄",
      lazy: true,
    },
  ];
}
