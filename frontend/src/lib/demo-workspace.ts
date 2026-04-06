import type {
  DemoWorkspacePolicySnapshot,
  DemoWorkspaceSnapshot,
  MemberListSnapshot,
} from "@/lib/types";

export function buildDemoEntryCopy(snapshot: DemoWorkspaceSnapshot | null) {
  if (!snapshot) {
    return "這裡是固定展示資料的唯讀 demo workspace。";
  }
  return snapshot.entryMessage;
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
    return "尚未載入 demo workspace policy。";
  }
  if (policy.maxActiveDemoMembers <= 0) {
    return "目前不開放啟用 demo 帳號。";
  }
  return `最多可啟用 ${policy.maxActiveDemoMembers} 個 demo 帳號。`;
}
