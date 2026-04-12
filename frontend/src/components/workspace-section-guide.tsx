import Link from "next/link";

import {
  buildWorkspaceLocalRail,
  compressGuideItemsForShellV2,
  type WorkspaceSectionGuideItem,
} from "@/lib/workspace-local-rail";
import { WorkspaceLocalRail } from "@/components/workspace-local-rail";

export function WorkspaceSectionGuide({
  title = "先選閱讀路徑",
  description,
  items,
  variant = "cards",
}: {
  title?: string;
  description: string;
  items: WorkspaceSectionGuideItem[];
  variant?: "cards" | "rail";
}) {
  const compressedItems = compressGuideItemsForShellV2(items);
  const localRail = buildWorkspaceLocalRail(
    compressedItems.map((item) => ({
      href: item.href,
      title: item.title,
      description: item.copy,
      whenToUse: item.meta || item.eyebrow,
    })),
  );

  if (variant === "rail") {
    return (
      <div className="workspace-section-rail">
        <div className="workspace-section-rail-header">
          <p className="panel-copy">{description}</p>
        </div>
        <WorkspaceLocalRail title={title} items={localRail.items} />
      </div>
    );
  }

  return (
    <section className="panel section-guide-panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">{title}</h2>
          <p className="panel-copy">{description}</p>
        </div>
      </div>

      <div className="section-guide-grid">
        {compressedItems.map((item) => (
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
