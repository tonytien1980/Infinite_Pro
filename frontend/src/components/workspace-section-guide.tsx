"use client";

import Link from "next/link";

type WorkspaceSectionGuideItem = {
  href: string;
  eyebrow: string;
  title: string;
  copy: string;
  meta?: string;
  tone?: "default" | "accent" | "warm";
};

export function WorkspaceSectionGuide({
  title = "先選閱讀路徑",
  description,
  items,
}: {
  title?: string;
  description: string;
  items: WorkspaceSectionGuideItem[];
}) {
  return (
    <section className="panel section-guide-panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">{title}</h2>
          <p className="panel-copy">{description}</p>
        </div>
      </div>

      <div className="section-guide-grid">
        {items.map((item) => (
          <Link
            key={`${item.href}-${item.title}`}
            className={`section-guide-card section-guide-card-${item.tone ?? "default"}`}
            href={item.href}
          >
            <span className="section-guide-eyebrow">{item.eyebrow}</span>
            <h3>{item.title}</h3>
            <p className="section-guide-copy">{item.copy}</p>
            {item.meta ? <p className="section-guide-meta">{item.meta}</p> : null}
          </Link>
        ))}
      </div>
    </section>
  );
}
