import type { MembershipRole } from "@/lib/types";

export function isPublicAppPath(pathname: string) {
  return pathname === "/login";
}

export function canManageMembers(role: MembershipRole) {
  return role === "owner";
}

export function canManageExtensions(role: MembershipRole) {
  return role === "owner";
}

export function buildPrimaryNavForMembershipRole(role: MembershipRole) {
  const common = [
    { href: "/", label: "總覽" },
    { href: "/matters", label: "案件工作台" },
    { href: "/deliverables", label: "交付物" },
    { href: "/history", label: "歷史紀錄" },
    { href: "/settings", label: "系統設定" },
  ];

  if (role === "owner") {
    return common.concat([
      { href: "/agents", label: "代理管理" },
      { href: "/packs", label: "模組包管理" },
      { href: "/members", label: "成員管理" },
    ]);
  }

  if (role === "consultant") {
    return common.concat([
      { href: "/agents", label: "代理一覽" },
      { href: "/packs", label: "模組包一覽" },
    ]);
  }

  return [];
}
