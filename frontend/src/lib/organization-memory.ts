import type { OrganizationMemoryGuidance } from "@/lib/types";

export function buildOrganizationMemoryView(
  guidance: OrganizationMemoryGuidance | null | undefined,
): {
  shouldShow: boolean;
  sectionTitle: string;
  summary: string;
  organizationLabel: string;
  sourceLifecycleSummary: string;
  freshnessSummary: string;
  reactivationSummary: string;
  stableContextItems: string[];
  knownConstraints: string[];
  continuityAnchor: string;
  crossMatterSummary: string;
  crossMatterItems: Array<{ title: string; summary: string; meta: string; matterWorkspaceId: string }>;
  boundaryNote: string;
} {
  if (!guidance || guidance.status !== "available") {
    return {
      shouldShow: false,
      sectionTitle: "",
      summary: "",
      organizationLabel: "",
      sourceLifecycleSummary: "",
      freshnessSummary: "",
      reactivationSummary: "",
      stableContextItems: [],
      knownConstraints: [],
      continuityAnchor: "",
      crossMatterSummary: "",
      crossMatterItems: [],
      boundaryNote: "",
    };
  }

  return {
    shouldShow: true,
    sectionTitle: guidance.label || "這個客戶 / 組織目前已知的穩定背景",
    summary: guidance.summary,
    organizationLabel: guidance.organization_label,
    sourceLifecycleSummary: guidance.source_lifecycle_summary,
    freshnessSummary: guidance.freshness_summary,
    reactivationSummary: guidance.reactivation_summary,
    stableContextItems: guidance.stable_context_items,
    knownConstraints: guidance.known_constraints,
    continuityAnchor: guidance.continuity_anchor,
    crossMatterSummary: guidance.cross_matter_summary,
    crossMatterItems: (guidance.cross_matter_items || []).map((item) => ({
      title: item.matter_title,
      summary: item.summary,
      meta: [item.relation_reason, item.freshness_label].filter(Boolean).join("｜"),
      matterWorkspaceId: item.matter_workspace_id,
    })),
    boundaryNote: guidance.boundary_note,
  };
}
