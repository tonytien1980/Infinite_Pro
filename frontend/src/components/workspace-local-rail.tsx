import Link from "next/link";

import type { WorkspaceLocalRailItem } from "@/lib/workspace-local-rail";

export function WorkspaceLocalRail({
  title,
  items,
}: {
  title: string;
  items: WorkspaceLocalRailItem[];
}) {
  return (
    <aside className="workspace-local-rail" aria-label={title}>
      <h2 className="workspace-local-rail-title">{title}</h2>

      <div className="workspace-local-rail-list">
        {items.map((item) => (
          <Link key={item.href} className="workspace-local-rail-item" href={item.href}>
            <strong className="workspace-local-rail-item-title">{item.title}</strong>
            <p className="workspace-local-rail-item-role">{item.role}</p>
            <span className="workspace-local-rail-item-cue">{item.cue}</span>
          </Link>
        ))}
      </div>
    </aside>
  );
}
