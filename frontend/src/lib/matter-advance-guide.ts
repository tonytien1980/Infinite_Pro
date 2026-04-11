import type {
  ContinuationSurface,
  MatterDeliverableSummary,
  TaskListItem,
} from "@/lib/types";

export type MatterAdvanceGuide = {
  title: string;
  summary: string;
  checklist: string[];
  primaryActionLabel: string | null;
};

function shouldHonorContinuationPrimaryAction({
  continuationSurface,
  latestDeliverable,
}: {
  continuationSurface: ContinuationSurface | null;
  latestDeliverable: Pick<MatterDeliverableSummary, "deliverable_id" | "title"> | null;
}) {
  if (!continuationSurface?.primary_action) {
    return false;
  }

  if (continuationSurface.primary_action.action_id === "run_analysis") {
    return false;
  }

  if (continuationSurface.workflow_layer === "closure") {
    return Boolean(latestDeliverable);
  }

  return true;
}

export function buildMatterAdvanceGuide({
  arrivedFromNew,
  focusTask,
  latestDeliverable,
  sourceMaterialCount,
  evidenceCount,
  continuationSurface,
}: {
  arrivedFromNew: boolean;
  focusTask: Pick<TaskListItem, "id" | "title"> | null;
  latestDeliverable: Pick<MatterDeliverableSummary, "deliverable_id" | "title"> | null;
  sourceMaterialCount: number;
  evidenceCount: number;
  continuationSurface: ContinuationSurface | null;
}): MatterAdvanceGuide {
  const checklist = [
    "先確認這個案件頁面上的「目前主線」是否就是你真正想要系統幫你收斂的判斷。",
    sourceMaterialCount === 0
      ? "如果你手上已有檔案、網址或會議摘要，先到來源與證據補件；如果還沒有，也可以直接先跑第一版骨架。"
      : evidenceCount < 2
        ? "目前已有一些材料，但證據仍偏薄；你可以先補件，也可以先產出第一版交付物再回來補強。"
        : "目前材料與證據已有基本厚度，可以直接執行分析，讓 Host 產出正式交付物。",
    latestDeliverable
      ? `最新交付物「${latestDeliverable.title}」已形成，現在可以直接回看摘要、風險與行動項目。`
      : focusTask
        ? `真正會產出結果的是工作紀錄「${focusTask.title}」的執行分析；完成後會生成正式交付物。`
        : "目前尚未找到可直接推進的工作紀錄。",
  ];

  if (
    shouldHonorContinuationPrimaryAction({
      continuationSurface,
      latestDeliverable,
    })
  ) {
    if (continuationSurface?.workflow_layer === "closure") {
      return {
        title: "這案已可正式結案",
        summary:
          "這個單次案件已具備基本脈絡、證據與交付結果，下一步應偏向正式結案、發布或匯出，而不是進入持續追蹤。",
        checklist,
        primaryActionLabel: continuationSurface.primary_action?.label ?? null,
      };
    }
    if (continuationSurface?.workflow_layer === "checkpoint") {
      return {
        title: "這案目前屬於回來更新 / checkpoint 節奏",
        summary:
          "這輪重點是回來更新、補件與 checkpoint，不是重新開新案，也不是進入完整長期追蹤。",
        checklist,
        primaryActionLabel: continuationSurface.primary_action?.label ?? null,
      };
    }
    if (continuationSurface?.workflow_layer === "progression") {
      return {
        title: "這案目前屬於持續推進 / outcome 節奏",
        summary:
          "這輪重點是沿著同一個案件世界持續回看進度、action 狀態與結果訊號，不是單次 checkpoint 更新。",
        checklist,
        primaryActionLabel: continuationSurface.primary_action?.label ?? null,
      };
    }
    return {
      title: continuationSurface?.title || "案件後續",
      summary: continuationSurface?.summary || "這個案件已有明確後續節奏。",
      checklist,
      primaryActionLabel: continuationSurface?.primary_action?.label ?? null,
    };
  }

  if (latestDeliverable) {
    return {
      title: arrivedFromNew ? "案件已建立，現在已有可回看的結果" : "目前已有可回看的結果",
      summary:
        "這個案件已經形成交付物；如果要繼續推進，通常是回看交付物、補件後再改版，或切回工作紀錄重跑分析。",
      checklist,
      primaryActionLabel: null,
    };
  }

  if (!focusTask) {
    return {
      title: arrivedFromNew ? "案件已建立，下一步先回到工作紀錄" : "先回到工作紀錄",
      summary:
        "案件骨架已建立，但目前沒有可直接執行的焦點工作。請先打開工作紀錄，確認這輪分析的主線。",
      checklist,
      primaryActionLabel: null,
    };
  }

  if (sourceMaterialCount === 0 || evidenceCount < 2) {
    if (continuationSurface?.workflow_layer === "progression") {
      return {
        title: "這案目前屬於持續推進 / outcome 節奏",
        summary:
          "這個案件後續會持續追進度與結果，但現在還缺第一輪基線。先補件或先跑分析，之後再回到持續推進節奏。",
        checklist,
        primaryActionLabel: "先建立持續推進基線",
      };
    }
    return {
      title: arrivedFromNew ? "案件已建立，現在先補件或先跑第一版" : "現在先補件或先跑第一版",
      summary:
        "建立案件只代表主鏈已成立，不代表結果已產出。你可以先補來源與證據，也可以直接讓系統先做一版可回看的交付物骨架。",
      checklist,
      primaryActionLabel: "直接產出第一版交付物",
    };
  }

  return {
    title: arrivedFromNew ? "案件已建立，現在可以直接產出結果" : "現在可以直接產出結果",
    summary:
      "這個案件已具備基本材料與證據厚度。直接執行分析後，系統會把結果寫成正式交付物並帶你進入交付物工作面。",
    checklist,
    primaryActionLabel: "執行分析並打開交付物",
  };
}
