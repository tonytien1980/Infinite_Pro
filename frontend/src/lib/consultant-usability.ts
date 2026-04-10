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
      copy: "先回到現在最值得接續的一件事，不先在首頁停太久。",
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
      eyebrow: "若要先回主線",
      title: "看案件列表",
      copy: "如果不是首頁預設那一條主線，先回案件列表重新選工作面。",
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
      "先回到目前最值得處理的一件事。",
      "若卡在依據偏薄，再改走補件路徑。",
      "只有不是延續工作時，才直接建立新案件。",
    ],
    guideTitle: "總覽怎麼用最快",
    guideDescription: "首頁只負責把你送回正確工作面，不負責承接整個案件背景。",
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

export function buildMatterUsabilityView(input: {
  evidenceCount: number;
  deliverableCount: number;
  activeTaskCount: number;
  hasCaseWorldState: boolean;
  hasOpenEvidenceGaps: boolean;
  hasRecentDeliverable: boolean;
}): MatterUsabilityView {
  const nextPathHref =
    input.hasRecentDeliverable || input.deliverableCount > 0
      ? "#matter-deliverables-overview"
      : "#matter-evidence-overview";
  const nextPathTitle =
    input.hasRecentDeliverable || input.deliverableCount > 0 ? "直接回交付物" : "先回來源與證據";
  const nextPathCopy =
    input.hasRecentDeliverable || input.deliverableCount > 0
      ? "若這輪已進入輸出整理，直接從案件頁跳回交付物最省。"
      : "若現在卡在依據偏薄，先去來源與證據工作面比較實際。";

  return {
    sectionGuideTitle: "案件頁怎麼看最快",
    sectionGuideDescription:
      "先抓這輪主線、最大 blocker 與最值得先推的 task，再看 authority 或背景層。",
    mainlineCopy:
      input.activeTaskCount > 1
        ? "先抓主線：這一屏只回答案件目前在處理什麼、下一步做什麼，以及多條工作紀錄中現在最該先看的那一條。"
        : "先抓主線：這一屏只回答案件目前在處理什麼、下一步做什麼，以及哪些限制最值得先看。",
    worldStateDisclosureDescription: input.hasCaseWorldState
      ? "只有在你要確認案件世界層的 identity authority、task slices 與寫回深度時，再展開這層。"
      : "只有在你要確認為何目前還沒形成穩定案件世界層時，再展開這層。",
    guideItems: [
      {
        href: "#matter-mainline",
        eyebrow: "先抓主線",
        title: "先看案件主線與指揮判斷",
        copy: "不要先掉進 continuity、research 或 organization memory 的細節。",
        tone: "accent",
      },
      {
        href: "#matter-world-state",
        eyebrow: "需要確認 authority 時",
        title: "再看案件世界與寫回策略",
        copy: "這層只在你要確認 world authority、task slices、writeback 深度時才值得打開。",
      },
      {
        href: nextPathHref,
        eyebrow: "要接續工作面時",
        title: nextPathTitle,
        copy: nextPathCopy,
        tone: input.hasOpenEvidenceGaps || input.evidenceCount < 2 ? "warm" : "default",
      },
    ],
  };
}

export type DeliverableUsabilityView = {
  sectionGuideTitle: string;
  sectionGuideDescription: string;
  contextDisclosureDescription: string;
  writebackDisclosureDescription: string;
  guideItems: ConsultantGuideItem[];
};

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
    sectionGuideTitle: "這份交付物怎麼讀最快",
    sectionGuideDescription:
      "先決定你現在是在整理版本、回看交付摘要、檢查依據，還是確認這份內容怎麼回寫案件世界。",
    contextDisclosureDescription:
      "當你要理解這份交付物在整個案件世界中的定位時，再展開這層；平常先讀交付摘要與建議 / 風險 / 行動即可。",
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
        eyebrow: "需要確認依據或背景時",
        title: thirdTitle,
        copy: input.hasHighImpactGaps
          ? "若高影響缺口仍在，先看依據與缺口，不急著下更深的 reusable guidance。"
          : "當前背景層只在你要確認適用範圍與案件定位時才值得展開。",
        tone: input.hasHighImpactGaps ? "warm" : "default",
      },
    ],
  };
}
