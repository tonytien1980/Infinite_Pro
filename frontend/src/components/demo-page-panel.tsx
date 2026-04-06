"use client";

import { useEffect, useState } from "react";

import { getDemoWorkspaceSnapshot } from "@/lib/api";
import {
  buildDemoEntryCopy,
  buildFormalWorkspaceExplainer,
  summarizeDemoShowcaseHighlights,
} from "@/lib/demo-workspace";
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
        <p className="section-copy">{snapshot?.heroSummary || "這裡展示的是固定 sample dataset 的唯讀工作流。"}</p>
      </section>

      <section className="summary-grid">
        <article className="section-card">
          <p className="muted-text">你會看到什麼</p>
          <strong>固定 showcase highlights</strong>
          <p className="section-copy">
            {summarizeDemoShowcaseHighlights(snapshot?.showcaseHighlights || [])}
          </p>
        </article>
        <article className="section-card">
          <p className="muted-text">為何不能操作</p>
          <strong>read-only boundary</strong>
          <p className="section-copy">
            這個 demo 只用來展示產品工作流，不是正式辦案 workspace。
          </p>
        </article>
        <article className="section-card">
          <p className="muted-text">正式版怎麼用</p>
          <strong>formal workspace</strong>
          <p className="section-copy">{buildFormalWorkspaceExplainer(snapshot)}</p>
        </article>
      </section>

      {error ? <p className="error-text">{error}</p> : null}

      <section className="section-card">
        <h2>Demo 規則</h2>
        <ul className="detail-list">
          {(snapshot?.readOnlyRules || []).map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </section>

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
