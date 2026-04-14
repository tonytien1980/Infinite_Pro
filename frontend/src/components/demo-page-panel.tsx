"use client";

import { useEffect, useState } from "react";

import { getDemoWorkspaceSnapshot } from "@/lib/api";
import {
  buildDemoEntryCopy,
  buildFormalWorkspaceExplainer,
  summarizeDemoShowcaseHighlights,
} from "@/lib/demo-workspace";
import type { DemoWorkspaceSnapshot } from "@/lib/types";
import { guardFirstLayerDemoSummary } from "@/lib/ui-labels";
import { SURFACE_LABELS } from "@/lib/workbench-surface-labels";

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
          setError(loadError instanceof Error ? loadError.message : "目前無法載入示範工作台。");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const heroSummary =
    guardFirstLayerDemoSummary(snapshot?.heroSummary) ||
    "這裡放的是固定展示內容，只能瀏覽，不能修改或送出新的分析。";

  return (
    <main className="page-shell">
      <section className="section-card">
        <p className="hero-focus-label">{SURFACE_LABELS.demoWorkspace}</p>
        <h1>{snapshot?.title || `Infinite Pro ${SURFACE_LABELS.demoWorkspace}`}</h1>
        <p className="section-copy">{buildDemoEntryCopy(snapshot)}</p>
        <p className="section-copy">{heroSummary}</p>
        <div className="hero-actions">
          <a className="button-primary" href="#demo-showcase-section">
            瀏覽示範內容
          </a>
        </div>
      </section>

      <section className="summary-grid" id="demo-showcase-section">
        <article className="section-card">
          <p className="muted-text">你會看到什麼</p>
          <strong>{SURFACE_LABELS.showcaseHighlights}</strong>
          <p className="section-copy">
            {summarizeDemoShowcaseHighlights(snapshot?.showcaseHighlights || [])}
          </p>
        </article>
        <article className="section-card">
          <p className="muted-text">為何不能操作</p>
          <strong>{SURFACE_LABELS.readOnlyBoundary}</strong>
          <p className="section-copy">
            這裡只提供瀏覽與導覽，不能修改內容，也不會送出新的分析。
          </p>
        </article>
        <article className="section-card">
          <p className="muted-text">正式版怎麼用</p>
          <strong>{SURFACE_LABELS.formalWorkspace}</strong>
          <p className="section-copy">{buildFormalWorkspaceExplainer(snapshot)}</p>
        </article>
      </section>

      {error ? <p className="error-text">{error}</p> : null}

      <section className="section-card">
        <h2>{SURFACE_LABELS.demoRules}</h2>
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
