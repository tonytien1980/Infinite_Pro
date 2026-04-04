import type { OrganizationMemoryGuidance } from "@/lib/types";

export function buildOrganizationMemoryView(
  guidance: OrganizationMemoryGuidance | null | undefined,
): {
  shouldShow: boolean;
  sectionTitle: string;
  summary: string;
  organizationLabel: string;
  stableContextItems: string[];
  knownConstraints: string[];
  continuityAnchor: string;
  boundaryNote: string;
} {
  if (!guidance || guidance.status !== "available") {
    return {
      shouldShow: false,
      sectionTitle: "",
      summary: "",
      organizationLabel: "",
      stableContextItems: [],
      knownConstraints: [],
      continuityAnchor: "",
      boundaryNote: "",
    };
  }

  return {
    shouldShow: true,
    sectionTitle: guidance.label || "這個客戶 / 組織目前已知的穩定背景",
    summary: guidance.summary,
    organizationLabel: guidance.organization_label,
    stableContextItems: guidance.stable_context_items,
    knownConstraints: guidance.known_constraints,
    continuityAnchor: guidance.continuity_anchor,
    boundaryNote: guidance.boundary_note,
  };
}
