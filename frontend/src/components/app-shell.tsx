"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { getCurrentSession, logoutCurrentSession } from "@/lib/api";
import {
  buildPrimaryNavForMembershipRole,
  isPublicAppPath,
  resolveProtectedPathForMembershipRole,
} from "@/lib/permissions";
import {
  getLoginPath,
  getSessionDisplayName,
  isAuthError,
  shouldRedirectToLoginAfterLogout,
} from "@/lib/session";
import { hydrateWorkbenchPreferences } from "@/lib/workbench-persistence";
import { useWorkbenchSettings } from "@/lib/workbench-store";
import type { SessionState } from "@/lib/types";

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const publicPath = isPublicAppPath(pathname);
  const [settings, setSettings, hydrated] = useWorkbenchSettings();
  const [systemTheme, setSystemTheme] = useState<"light" | "dark">("light");
  const [session, setSession] = useState<SessionState | null>(null);
  const [authResolved, setAuthResolved] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

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
    let cancelled = false;

    if (publicPath) {
      setAuthResolved(true);
      return () => {
        cancelled = true;
      };
    }

    void (async () => {
      try {
        const currentSession = await getCurrentSession();
        if (!cancelled) {
          setSession(currentSession);
        }
      } catch (error) {
        if (!cancelled && isAuthError(error)) {
          window.location.href = getLoginPath(pathname);
          return;
        }
      } finally {
        if (!cancelled) {
          setAuthResolved(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname, publicPath]);

  useEffect(() => {
    if (!hydrated || !authResolved || publicPath || (!publicPath && !session)) {
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
  }, [authResolved, hydrated, publicPath, session, setSettings]);

  useEffect(() => {
    document.documentElement.dataset.density = settings.density;
    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.lang =
      settings.interfaceLanguage === "en" ? "en" : "zh-Hant";
  }, [resolvedTheme, settings.density, settings.interfaceLanguage]);

  const primaryNavItems = session
    ? buildPrimaryNavForMembershipRole(session.membership.role)
    : [];
  const redirectTarget =
    session && !publicPath
      ? resolveProtectedPathForMembershipRole(session.membership.role, pathname)
      : null;

  useEffect(() => {
    if (!redirectTarget) {
      return;
    }
    window.location.href = redirectTarget;
  }, [redirectTarget]);

  async function handleLogout() {
    let logoutError: unknown = null;

    try {
      setLoggingOut(true);
      setLogoutError(null);
      await logoutCurrentSession();
    } catch (error) {
      logoutError = error;
      if (!isAuthError(error)) {
        console.error("logout failed", error);
        setLogoutError(error instanceof Error ? error.message : "目前無法登出，請稍後再試。");
      }
    } finally {
      if (shouldRedirectToLoginAfterLogout(logoutError)) {
        setSession(null);
        setAuthResolved(true);
        window.location.href = "/login";
        return;
      }
      setLoggingOut(false);
    }
  }

  if (!publicPath && !authResolved) {
    return (
      <div className="app-shell">
        <header className="app-header">
          <div className="app-header-inner">
            <div className="app-brand-block">
              <Link className="app-brand-link" href="/">
                Infinite Pro
              </Link>
              <p className="app-brand-copy">雲端顧問工作台</p>
            </div>
          </div>
        </header>
        <div className="app-content">
          <main className="page-shell">
            <section className="section-card">
              <p>正在確認登入狀態...</p>
            </section>
          </main>
        </div>
      </div>
    );
  }

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
            <p className="app-brand-copy">
              {session ? `${getSessionDisplayName(session)}｜${session.firm.name}` : "雲端顧問工作台"}
            </p>
          </div>

          {!publicPath ? (
            <nav className="primary-nav" aria-label="主要導覽">
              {primaryNavItems.map((item) => {
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
          ) : (
            <div />
          )}

          <div className="app-header-actions">
            {!publicPath && session ? (
              <>
                <button
                  className="button-secondary app-header-action"
                  type="button"
                  onClick={() => void handleLogout()}
                  disabled={loggingOut}
                >
                  {loggingOut ? "登出中..." : "登出"}
                </button>
                <Link className="button-primary app-header-action" href="/new">
                  建立新案件
                </Link>
              </>
            ) : null}
          </div>
        </div>
        {!publicPath && logoutError ? (
          <div className="app-header-inner" style={{ paddingTop: 0 }}>
            <p className="error-text" role="alert" style={{ margin: 0, width: "100%" }}>
              {logoutError}
            </p>
          </div>
        ) : null}
      </header>

      <div className="app-content" id="app-main-content" tabIndex={-1}>
        {children}
      </div>
    </div>
  );
}
