export type ConsultantGuideTone = "default" | "accent" | "warm";

export type ConsultantGuideItem = {
  href: string;
  eyebrow: string;
  title: string;
  copy: string;
  meta?: string;
  tone?: ConsultantGuideTone;
};

export type OverviewUsabilityView = {
  primaryLabel: string;
  primaryTitle: string;
  primaryCopy: string;
  primaryHref: string;
  primaryActionLabel: string;
  checklist: string[];
  guideTitle: string;
  guideDescription: string;
  guideItems: ConsultantGuideItem[];
};

export function buildOverviewUsabilityView(input: {
  homepageDisplayPreference: "matters" | "deliverables" | "evidence";
  focusTitle: string;
  focusCopy: string;
  focusHref: string;
  focusActionLabel: string;
  hasPrimaryMatter: boolean;
  hasPrimaryDeliverable: boolean;
  hasPendingEvidenceTask: boolean;
}): OverviewUsabilityView {
  const guideItems: ConsultantGuideItem[] = [
    {
      href: input.focusHref,
      eyebrow: "先接回主工作",
      title: input.focusTitle,
      copy: "先回到現在最值得接續的一件事，首頁只做入口，不先停在系統摘要。",
      tone: "accent",
    },
  ];

  if (input.hasPendingEvidenceTask) {
    guideItems.push({
      href: "/matters",
      eyebrow: "若先卡在依據",
      title: "先處理待補資料",
      copy: "當前判斷若卡在依據偏薄，先補資料通常比繼續停留在摘要更有效。",
      tone: "warm",
    });
  } else if (input.hasPrimaryDeliverable && input.homepageDisplayPreference !== "deliverables") {
    guideItems.push({
      href: "/deliverables",
      eyebrow: "若要先回結果",
      title: "看最近交付物",
      copy: "當你要先確認最近輸出站不站得住，再進最近交付物最快。",
    });
  } else if (input.hasPrimaryMatter) {
    guideItems.push({
      href: "/matters",
      eyebrow: "若要先回案件",
      title: "看案件列表",
      copy: "如果不是首頁預設的那一件事，先回案件列表重新選現在要做的工作。",
    });
  }

  guideItems.push({
    href: "/new",
    eyebrow: "若這不是現在要做的",
    title: "建立新案件",
    copy: "只有在這輪不是延續工作時，才從首頁直接建立新案件。",
  });

  return {
    primaryLabel: "現在先做這件事",
    primaryTitle: input.focusTitle,
    primaryCopy: input.focusCopy,
    primaryHref: input.focusHref,
    primaryActionLabel: input.focusActionLabel,
    checklist: [
      "先回到目前最值得接續的工作。",
      "若卡在依據偏薄，再改走補件路徑。",
      "系統摘要留在第二層，不在首屏搶現在要做的事。",
    ],
    guideTitle: "先回主工作",
    guideDescription:
      "總覽現在只做入口：先把你送回現在最值得接續的一件事；系統狀態、階段摘要和整體使用狀態都留到第二層再看。",
    guideItems: guideItems.slice(0, 3),
  };
}

export type MatterUsabilityView = {
  sectionGuideTitle: string;
  sectionGuideDescription: string;
  mainlineCopy: string;
  worldStateDisclosureDescription: string;
  guideItems: ConsultantGuideItem[];
};

export type MatterSectionGuideAssemblyInput = {
  matterUsabilityView: MatterUsabilityView | null;
};

export function buildMatterUsabilityView(input: {
  evidenceCount: number;
  deliverableCount: number;
  activeTaskCount: number;
  hasCaseWorldState: boolean;
  hasOpenEvidenceGaps: boolean;
  hasRecentDeliverable: boolean;
}): MatterUsabilityView {
  return {
    sectionGuideTitle: "頁內導覽",
    sectionGuideDescription:
      "這條 rail 只做頁內導覽：先看現在重點、需要時再核對世界層與背景，不再重講摘要。",
    mainlineCopy:
      input.activeTaskCount > 1
        ? "這一段只補現在重點、目前卡住原因與下一步；若同時有多條工作紀錄，先抓現在最該接手的那一條。"
        : "這一段只補現在重點、目前卡住原因與下一步；其他背景先留到第二層再讀。",
    worldStateDisclosureDescription: input.hasCaseWorldState
      ? "只有在你要確認案件世界層的 identity authority、task slices 與寫回深度時，再展開這層。"
      : "只有在你要確認為何目前還沒形成穩定案件世界層時，再展開這層。",
    guideItems: [
      {
        href: "#matter-mainline",
        eyebrow: "一進頁面先看這裡",
        title: "現在重點",
        copy: "先看這輪在判斷什麼、目前卡在哪裡，以及現在該推哪一步。",
        tone: "accent",
      },
      {
        href: "#matter-world-state",
        eyebrow: "要核對結構時",
        title: "世界層",
        copy: "只有在你要確認 authority、task slices 與寫回策略時，再看這一層。",
      },
      {
        href: "#matter-background",
        eyebrow: "現在卡住再回來",
        title: "背景",
        copy:
          "連續性、研究、旗艦摘要與組織記憶都移到第二層，需要補讀時再回來。",
        tone:
          input.hasOpenEvidenceGaps || input.evidenceCount < 2 || input.hasRecentDeliverable
            ? "warm"
            : "default",
      },
    ],
  };
}

export function buildMatterSectionGuideItems(
  input: MatterSectionGuideAssemblyInput,
): ConsultantGuideItem[] {
  if (!input.matterUsabilityView) {
    return [];
  }

  const [firstItem, ...restItems] = input.matterUsabilityView.guideItems;
  if (!firstItem) {
    return [];
  }

  return [
    {
      ...firstItem,
      href: "#matter-mainline",
      eyebrow: "一進頁面先看這裡",
      title: firstItem.title,
      copy: firstItem.copy,
      meta: firstItem.eyebrow,
      tone: "accent",
    },
    ...restItems.map((item) => {
      return item;
    }),
  ];
}

export type DeliverableUsabilityView = {
  sectionGuideTitle: string;
  sectionGuideDescription: string;
  contextDisclosureDescription: string;
  writebackDisclosureDescription: string;
  guideItems: ConsultantGuideItem[];
};

export type DeliverablePrimaryActionKind =
  | "save"
  | "close_case"
  | "reopen_case"
  | "record_checkpoint"
  | "record_outcome"
  | "export_docx"
  | "publish_release"
  | "history";

export type DeliverablePrimaryActionView = {
  kind: DeliverablePrimaryActionKind;
  label: string;
};

export function buildDeliverablePrimaryActionView(input: {
  deliverableStatus: string;
  hasPendingFormalSave: boolean;
  hasUnsavedChanges: boolean;
  continuityActionId?: string | null;
  continuityActionLabel?: string | null;
}): DeliverablePrimaryActionView {
  if (input.hasPendingFormalSave || input.hasUnsavedChanges) {
    return {
      kind: "save",
      label: input.hasPendingFormalSave ? "先儲存正式草稿" : "儲存正式內容",
    };
  }

  if (input.continuityActionId === "close_case") {
    return {
      kind: "close_case",
      label: input.continuityActionLabel || "正式結案",
    };
  }

  if (input.continuityActionId === "reopen_case") {
    return {
      kind: "reopen_case",
      label: input.continuityActionLabel || "重新開啟案件",
    };
  }

  if (input.continuityActionId === "record_checkpoint") {
    return {
      kind: "record_checkpoint",
      label: input.continuityActionLabel || "記錄 checkpoint",
    };
  }

  if (input.continuityActionId === "record_outcome") {
    return {
      kind: "record_outcome",
      label: input.continuityActionLabel || "記錄 outcome",
    };
  }

  if (input.deliverableStatus === "final") {
    return {
      kind: "export_docx",
      label: "匯出 DOCX",
    };
  }

  if (input.deliverableStatus === "archived") {
    return {
      kind: "history",
      label: "回看版本紀錄",
    };
  }

  return {
    kind: "publish_release",
    label: "正式發布這個版本",
  };
}

export function buildDeliverableUsabilityView(input: {
  deliverableStatus: string;
  hasPendingFormalSave: boolean;
  hasLinkedEvidence: boolean;
  hasHighImpactGaps: boolean;
  hasMatterWorkspace: boolean;
}): DeliverableUsabilityView {
  const firstActionTitle = input.hasPendingFormalSave
    ? "先儲存正式草稿"
    : input.deliverableStatus === "final"
      ? "先確認是否要匯出"
      : "先確認能不能發布";
  const firstActionCopy = input.hasPendingFormalSave
    ? "若正式草稿尚未落盤，先處理儲存，不要直接跳去看深層背景。"
    : input.deliverableStatus === "final"
      ? "若版本與依據都穩，這一步通常是匯出正式版本或回看是否還要補一輪依據。"
      : "若版本與依據都穩，再決定是否正式發布或匯出。";

  const thirdHref = input.hasLinkedEvidence ? "#deliverable-evidence" : "#deliverable-context";
  const thirdTitle = input.hasLinkedEvidence ? "回看依據來源" : "再看交付脈絡";

  return {
    sectionGuideTitle: "這份結果先看什麼",
    sectionGuideDescription:
      "首屏只留版本、能不能直接用與主要動作；摘要、依據、背景資訊、同步紀錄與後續狀態都放到第二層。",
    contextDisclosureDescription:
      "當你要理解這份交付物在整個案件世界中的定位時，再展開這層；平常先看版本、姿態與主動作，摘要 / 建議 / 風險 / 行動都放第二層。",
    writebackDisclosureDescription: input.hasMatterWorkspace
      ? "只有在你要確認這份交付物會怎麼寫回案件世界、研究脈絡怎麼進鏈，以及目前有哪些 decision / outcome records 時，再展開這層。"
      : "只有在你要確認這份交付物的背景脈絡、研究來源與正式紀錄時，再展開這層。",
    guideItems: [
      {
        href: "#deliverable-publish-check",
        eyebrow: "先決定這一步",
        title: firstActionTitle,
        copy: firstActionCopy,
        tone: "accent",
      },
      {
        href: "#deliverable-reading",
        eyebrow: "要先看內容時",
        title: "回看交付摘要",
        copy: "先確認結論、建議、風險與行動項目是否已經站穩。",
      },
      {
        href: thirdHref,
        eyebrow: "需要依據時",
        title: thirdTitle,
        copy: "只有當你要核對依據或背景，再往下看來源、背景資訊、同步紀錄與後續狀態。",
        tone: input.hasHighImpactGaps ? "warm" : "default",
      },
    ],
  };
}

export type EvidenceUsabilityView = {
  sectionGuideTitle: string;
  sectionGuideDescription: string;
  railEyebrow: string;
  railTitle: string;
  railCopy: string;
  guideItems: ConsultantGuideItem[];
};

export function buildEvidenceWorkspaceUsabilityView(input: {
  hasHighImpactGaps: boolean;
  hasFocusTask: boolean;
  focusTaskTitle: string;
  sourceMaterialCount: number;
  evidenceCount: number;
}): EvidenceUsabilityView {
  const returnTitle = input.hasFocusTask ? "先回這次分析" : "先回案件工作台";
  const returnCopy = input.hasFocusTask
    ? `補完後先回「${input.focusTaskTitle}」確認這次分析是否已能續推，不必先在資料頁停太久。`
    : "補完後先回案件工作台確認現在重點是否已站穩，再決定要不要往分析或結果續推。";

  return {
    sectionGuideTitle: "資料與證據先看什麼",
    sectionGuideDescription: "先看到底缺什麼，再決定補哪種資料；補完後再回案件或分析續推。",
    railEyebrow: "補完後回哪裡",
    railTitle: returnTitle,
    railCopy: returnCopy,
    guideItems: [
      {
        href: "#evidence-sufficiency",
        eyebrow: "先看缺什麼",
        title: "充分性摘要與高影響缺口",
        copy: "先判斷目前缺的是來源、證據，還是仍不夠支撐這輪判斷。",
        meta: input.hasHighImpactGaps
          ? "目前仍有高影響缺口，先補這些最有效。"
          : "目前沒有高影響缺口，可先檢查支撐鏈完整度。",
        tone: input.hasHighImpactGaps ? "warm" : "accent",
      },
      {
        href: "#evidence-supplement",
        eyebrow: "真的要補時",
        title: "補資料與新增來源",
        copy: "補檔案、網址或補充文字時，直接走正式補件主鏈，不要另開新的孤立工作。",
        meta:
          input.sourceMaterialCount === 0
            ? "目前還沒有正式來源材料。"
            : `${input.sourceMaterialCount} 份來源材料 / ${input.evidenceCount} 則證據可回看。`,
        tone: "accent",
      },
      {
        href: input.hasFocusTask ? "#evidence-related-tasks" : "#evidence-sufficiency",
        eyebrow: "補完之後",
        title: returnTitle,
        copy: returnCopy,
        tone: "default",
      },
    ],
  };
}
