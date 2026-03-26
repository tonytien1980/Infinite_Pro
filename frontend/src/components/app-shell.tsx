"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useWorkbenchSettings } from "@/lib/workbench-store";

const PRIMARY_NAV_ITEMS = [
  { href: "/", label: "總覽" },
  { href: "/matters", label: "案件工作台" },
  { href: "/deliverables", label: "交付物" },
  { href: "/agents", label: "代理管理" },
  { href: "/packs", label: "模組包管理" },
  { href: "/history", label: "歷史紀錄" },
  { href: "/settings", label: "系統設定" },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [settings] = useWorkbenchSettings();

  useEffect(() => {
    document.documentElement.dataset.density = settings.density;
    document.documentElement.lang =
      settings.interfaceLanguage === "en" ? "en" : "zh-Hant";
  }, [settings.density, settings.interfaceLanguage]);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-inner">
          <div className="app-brand-block">
            <Link className="app-brand-link" href="/">
              Infinite Pro
            </Link>
            <p className="app-brand-copy">單人顧問完整工作台</p>
          </div>

          <nav className="primary-nav" aria-label="主要導覽">
            {PRIMARY_NAV_ITEMS.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  className={`primary-nav-link${active ? " primary-nav-link-active" : ""}`}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="app-header-actions">
            <Link className="button-primary app-header-action" href="/new">
              建立新案件
            </Link>
          </div>
        </div>
      </header>

      <div className="app-content">{children}</div>
    </div>
  );
}
