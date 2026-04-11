import type {
  DemoWorkspacePolicySnapshot,
  DemoWorkspaceSnapshot,
  MemberListSnapshot,
} from "@/lib/types";

export function buildDemoEntryCopy(snapshot: DemoWorkspaceSnapshot | null) {
  if (!snapshot) {
    return "這裡是固定展示資料的唯讀示範工作台。";
  }
  return snapshot.entryMessage;
}

export function summarizeDemoShowcaseHighlights(highlights: string[]) {
  if (highlights.length === 0) {
    return "這裡會展示 Infinite Pro 的典型案件、交付物與共享判斷讀法。";
  }
  return `你可以先看 ${highlights.join("、")}。`;
}

export function buildFormalWorkspaceExplainer(snapshot: DemoWorkspaceSnapshot | null) {
  if (!snapshot?.formalWorkspaceExplainer) {
    return "正式版工作台會讓顧問進入自己的辦案路徑；示範工作台只展示產品如何工作，不提供操作權限。";
  }
  return snapshot.formalWorkspaceExplainer;
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
