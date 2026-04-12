export type WorkspaceLocalRailSeed = {
  href: string;
  title: string;
  description: string;
  whenToUse: string;
};

export type WorkspaceLocalRailItem = {
  href: string;
  title: string;
  role: string;
  cue: string;
};

export type WorkspaceSectionGuideItem = {
  href: string;
  eyebrow: string;
  title: string;
  copy: string;
  meta?: string;
  tone?: "default" | "accent" | "warm";
};

export function buildWorkspaceLocalRail(items: WorkspaceLocalRailSeed[]) {
  return {
    items: items.map((item) => ({
      href: item.href,
      title: item.title,
      role: item.description,
      cue: item.whenToUse,
    })),
  };
}

function normalizeGuideText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function shouldKeepGuideMeta(item: WorkspaceSectionGuideItem) {
  if (!item.meta) {
    return false;
  }

  const normalizedMeta = normalizeGuideText(item.meta);
  const summaryFields = [item.eyebrow, item.title, item.copy].map(normalizeGuideText);

  return !summaryFields.includes(normalizedMeta);
}

export function compressGuideItemsForShellV2(items: WorkspaceSectionGuideItem[]) {
  return items.map((item) => ({
    href: item.href,
    eyebrow: item.eyebrow,
    title: item.title,
    copy: item.copy,
    meta: shouldKeepGuideMeta(item) ? item.meta : undefined,
    tone: item.tone,
  }));
}
