import type {
  DemoWorkspacePolicySnapshot,
  DemoWorkspaceSnapshot,
  MemberListSnapshot,
} from "@/lib/types";

const DEMO_COPY_REPLACEMENTS: ReadonlyArray<readonly [RegExp, string]> = [
  [/你目前正在示範工作台。這裡只能看，不能新增、修改、分析或治理。/g, "你目前正在示範工作台。這裡只供瀏覽，不能新增、修改、分析或管理。"],
  [/這裡展示的是 Infinite Pro 如何把案件世界、交付物與共享判讀串成同一條顧問工作流。/g, "這裡展示的是 Infinite Pro 如何把案件脈絡、結果與報告、共享判讀串成同一條工作流程。"],
  [/這裡展示的是 Infinite Pro 如何把案件脈絡、交付物與共享判讀串成同一條工作流程。/g, "這裡展示的是 Infinite Pro 如何把案件脈絡、結果與報告、共享判讀串成同一條工作流程。"],
  [/你可以先看\s+案件\s*\/\s*案件脈絡的正式工作(?:面|台)、結果與報告的收斂讀法、歷史紀錄\s*\/\s*共享判讀的唯讀展示。/g, "你可以先看 案件主控台、結果與報告的收斂讀法、歷史紀錄與共享判讀的唯讀展示。"],
  [/matter\s*\/\s*案件脈絡的正式工作面/gi, "案件主控台"],
  [/history\s*\/\s*共享判讀的唯讀展示/gi, "歷史紀錄與共享判讀的唯讀展示"],
  [/案件\s*\/\s*案件脈絡的正式工作(?:面|台)/g, "案件主控台"],
  [/歷史紀錄\s*\/\s*共享判讀的唯讀展示/g, "歷史紀錄與共享判讀的唯讀展示"],
  [/展示案件世界與主要工作台會長成什麼樣子。/g, "案件脈絡與主要工作台示範"],
  [/展示案件脈絡與主要工作台會長成什麼樣子。/g, "展示案件與主要工作台會長成什麼樣子。"],
  [/展示交付物如何從案件世界與共享判讀收斂出來。/g, "結果與報告的收斂讀法"],
  [/展示交付物如何從案件脈絡與共享判讀收斂出來。/g, "展示結果與報告如何從案件脈絡與共享判讀收斂出來。"],
  [/展示歷史紀錄、先例、共享判讀的唯讀讀法。/g, "展示歷史紀錄、可重用內容與共享判讀的唯讀讀法。"],
  [/正式版工作台會讓顧問進入自己的辦案路徑；demo\s*則只展示產品如何工作，不提供操作權限。/g, "正式版工作台會讓顧問進入自己的辦案路徑；示範工作台則只展示產品如何工作，不提供操作權限。"],
  [/Infinite Pro Demo Workspace/g, "Infinite Pro 示範工作台"],
  [/demo workspace/gi, "示範工作台"],
  [/shared intelligence/gi, "共享判讀"],
  [/case world/gi, "案件脈絡"],
  [/Sample Matters/g, "示範案件"],
  [/Sample Deliverables/g, "示範結果"],
  [/Sample History/g, "示範紀錄"],
  [/Demo Rules/g, "示範規則"],
  [/follow-up brief/gi, "後續摘要"],
  [/precedent review lane/gi, "重用檢視"],
  [/phase 4 closure review/gi, "收尾檢查示例"],
  [/deliverable shaping/gi, "結果與報告"],
  [/history/gi, "歷史紀錄"],
  [/precedent/gi, "可重用內容"],
  [/matter/gi, "案件"],
  [/workspace/gi, "工作台"],
  [/consultant/gi, "顧問"],
  [/案件世界/g, "案件脈絡"],
  [/顧問工作流/g, "工作流程"],
  [/只能看/g, "只供瀏覽"],
  [/工作面/g, "工作台"],
  [/review/gi, "檢視"],
  [/memo/gi, "備忘錄"],
  [/治理/g, "管理"],
];

const DEMO_POST_REPLACEMENTS: ReadonlyArray<readonly [RegExp, string]> = [
  [/這裡展示的是 Infinite Pro 如何把案件脈絡、交付物與共享判讀串成同一條工作流程。/g, "這裡展示的是 Infinite Pro 如何把案件脈絡、結果與報告、共享判讀串成同一條工作流程。"],
  [/案件\s*\/\s*案件脈絡\s*的正式工作台/g, "案件主控台"],
  [/歷史紀錄\s*\/\s*共享判讀\s*的唯讀展示/g, "歷史紀錄與共享判讀的唯讀展示"],
  [/展示案件脈絡與主要工作台會長成什麼樣子。/g, "展示案件與主要工作台會長成什麼樣子。"],
  [/展示交付物如何從案件脈絡與共享判讀收斂出來。/g, "展示結果與報告如何從案件脈絡與共享判讀收斂出來。"],
  [/展示歷史紀錄、可重用內容、共享判讀的唯讀讀法。/g, "展示歷史紀錄、可重用內容與共享判讀的唯讀讀法。"],
  [/正式版工作台會讓顧問進入自己的辦案路徑；demo\s*則只展示產品如何工作，不提供操作權限。/g, "正式版工作台會讓顧問進入自己的辦案路徑；示範工作台則只展示產品如何工作，不提供操作權限。"],
  [/你可以先看 案件主控台、結果與報告的收斂讀法、歷史紀錄與共享判讀的唯讀展示。/g, "你可以先看案件主控台、結果與報告的收斂讀法、歷史紀錄與共享判讀的唯讀展示。"],
];

export function normalizeDemoWorkspaceCopy(value: string) {
  const normalizedText = DEMO_COPY_REPLACEMENTS
    .reduce((text, [pattern, replacement]) => {
      return text.replace(pattern, replacement);
    }, value)
    .replace(/\s*\/\s*/g, " / ");

  return DEMO_POST_REPLACEMENTS
    .reduce((text, [pattern, replacement]) => {
      return text.replace(pattern, replacement);
    }, normalizedText)
    .replace(/([A-Za-z0-9])([\u4e00-\u9fff])/g, "$1 $2")
    .replace(/([\u4e00-\u9fff])([A-Za-z0-9])/g, "$1 $2")
    .replace(/([\u4e00-\u9fff])\s+([\u4e00-\u9fff])/g, "$1$2")
    .replace(/([\u4e00-\u9fff])\s+([\u4e00-\u9fff])/g, "$1$2")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function normalizeDemoWorkspaceSnapshot(snapshot: DemoWorkspaceSnapshot | null) {
  if (!snapshot) {
    return null;
  }

  return {
    ...snapshot,
    title: normalizeDemoWorkspaceCopy(snapshot.title),
    subtitle: normalizeDemoWorkspaceCopy(snapshot.subtitle),
    entryMessage: normalizeDemoWorkspaceCopy(snapshot.entryMessage),
    heroSummary: normalizeDemoWorkspaceCopy(snapshot.heroSummary),
    showcaseHighlights: snapshot.showcaseHighlights.map(normalizeDemoWorkspaceCopy),
    readOnlyRules: snapshot.readOnlyRules.map(normalizeDemoWorkspaceCopy),
    formalWorkspaceExplainer: normalizeDemoWorkspaceCopy(snapshot.formalWorkspaceExplainer),
    sections: snapshot.sections.map((section) => ({
      ...section,
      title: normalizeDemoWorkspaceCopy(section.title),
      summary: normalizeDemoWorkspaceCopy(section.summary),
      items: section.items.map(normalizeDemoWorkspaceCopy),
    })),
  };
}

export function buildDemoEntryCopy(snapshot: DemoWorkspaceSnapshot | null) {
  if (!snapshot) {
    return "這裡是固定展示資料的唯讀示範工作台。";
  }
  return normalizeDemoWorkspaceCopy(snapshot.entryMessage);
}

export function summarizeDemoShowcaseHighlights(highlights: string[]) {
  if (highlights.length === 0) {
    return "這裡會展示 Infinite Pro 的典型案件、結果與報告，以及共享判讀的方式。";
  }
  const normalizedHighlights = highlights.map((highlight) => {
    return normalizeDemoWorkspaceCopy(highlight).replace(/。+$/u, "");
  });
  return `你可以先看${normalizedHighlights.join("、")}。`;
}

export function buildFormalWorkspaceExplainer(snapshot: DemoWorkspaceSnapshot | null) {
  if (!snapshot?.formalWorkspaceExplainer) {
    return "正式版工作台會讓顧問進入自己的辦案路徑；示範工作台只展示產品如何工作，不提供操作權限。";
  }
  return normalizeDemoWorkspaceCopy(snapshot.formalWorkspaceExplainer);
}

export function buildDemoMemberSummary(snapshot: MemberListSnapshot | null) {
  return {
    activeCount: snapshot?.summary.activeDemoMemberCount || 0,
    pendingCount: snapshot?.summary.pendingDemoInviteCount || 0,
  };
}

export function canRevokeInvite(status: "pending" | "accepted" | "revoked") {
  return status === "pending";
}

export function labelForDemoWorkspacePolicyStatus(status: "active" | "inactive") {
  return status === "active" ? "啟用中" : "已停用";
}

export function summarizeDemoWorkspaceCapacity(policy: DemoWorkspacePolicySnapshot | null) {
  if (!policy) {
    return "尚未載入示範工作台規則。";
  }
  if (policy.maxActiveDemoMembers <= 0) {
    return "目前不開放啟用示範帳號。";
  }
  return `最多可啟用 ${policy.maxActiveDemoMembers} 個示範帳號。`;
}
