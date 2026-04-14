"use client";

import { useEffect, useState } from "react";

import { getCurrentSession, startGoogleLogin } from "@/lib/api";
import { isAuthError, resolveLoginNextPath } from "@/lib/session";

export function LoginPagePanel() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        await getCurrentSession();
        if (!cancelled) {
          window.location.href = "/";
        }
      } catch (loadError) {
        if (!cancelled && !isAuthError(loadError)) {
          setError(loadError instanceof Error ? loadError.message : "目前無法確認登入狀態。");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleGoogleLogin() {
    try {
      const nextPath =
        typeof window === "undefined" ? null : resolveLoginNextPath(window.location.search);
      const result = await startGoogleLogin(nextPath || undefined);
      window.location.href = result.authorizationUrl;
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "目前無法開始 Google 登入。");
    }
  }

  return (
    <main className="page-shell">
      <section className="section-card" style={{ maxWidth: "560px", margin: "0 auto" }}>
        <p className="hero-focus-label">雲端登入</p>
        <h1>登入 Infinite Pro</h1>
        <p className="section-copy">
          請使用已受邀的 Google 帳號登入。正式案件、共享判讀與成員權限，都會以目前登入身份為準。
        </p>
        <div className="form-actions">
          <button className="button-primary" type="button" onClick={handleGoogleLogin}>
            使用 Google 登入
          </button>
        </div>
        {error ? (
          <p className="error-text" role="alert">
            {error}
          </p>
        ) : null}
      </section>
    </main>
  );
}
