"use client";

import { useEffect, useState } from "react";

import { getDemoWorkspaceSnapshot } from "@/lib/api";
import { buildDemoEntryCopy } from "@/lib/demo-workspace";
import type { DemoWorkspaceSnapshot } from "@/lib/types";

export function DemoPagePanel() {
  const [snapshot, setSnapshot] = useState<DemoWorkspaceSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const result = await getDemoWorkspaceSnapshot();
        if (!cancelled) {
          setSnapshot(result);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "目前無法載入 demo workspace。");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="page-shell">
      <section className="section-card">
        <p className="hero-focus-label">Demo Workspace</p>
        <h1>{snapshot?.title || "Infinite Pro Demo Workspace"}</h1>
        <p className="section-copy">{buildDemoEntryCopy(snapshot)}</p>
      </section>
      {error ? <p className="error-text">{error}</p> : null}
      {(snapshot?.sections || []).map((section) => (
        <section key={section.sectionId} className="section-card">
          <h2>{section.title}</h2>
          <p className="section-copy">{section.summary}</p>
          <ul className="detail-list">
            {section.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
