import type { DemoWorkspaceSnapshot, MemberListSnapshot } from "@/lib/types";

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
