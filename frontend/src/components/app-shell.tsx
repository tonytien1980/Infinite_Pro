"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { hydrateWorkbenchPreferences } from "@/lib/workbench-persistence";
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
  const [settings, setSettings, hydrated] = useWorkbenchSettings();
  const [systemTheme, setSystemTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const updateTheme = () => {
      setSystemTheme(mediaQuery.matches ? "dark" : "light");
    };

    updateTheme();
    mediaQuery.addEventListener("change", updateTheme);

    return () => {
      mediaQuery.removeEventListener("change", updateTheme);
    };
  }, []);

  const resolvedTheme =
    settings.themePreference === "system" ? systemTheme : settings.themePreference;

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    let cancelled = false;

    void (async () => {
      const result = await hydrateWorkbenchPreferences();
      if (cancelled || result.source !== "remote") {
        return;
      }

      setSettings((current) => {
        if (JSON.stringify(current) === JSON.stringify(result.settings)) {
          return current;
        }
        return result.settings;
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [hydrated, setSettings]);

  useEffect(() => {
    document.documentElement.dataset.density = settings.density;
    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.lang =
      settings.interfaceLanguage === "en" ? "en" : "zh-Hant";
  }, [resolvedTheme, settings.density, settings.interfaceLanguage]);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#app-main-content">
        跳到主要內容
      </a>
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

      <div className="app-content" id="app-main-content" tabIndex={-1}>
        {children}
      </div>
    </div>
  );
}
