import type { AgentCatalogEntry, PackCatalogEntry } from "@/lib/types";

export type GuidedAgentDraft = {
  agent_name: string;
  description: string;
  role_focus: string;
  boundary_focus: string;
  agent_type: string;
  supported_capabilities: string[];
  relevant_domain_packs: string[];
  relevant_industry_packs: string[];
  version: string;
  status: string;
};

export type GuidedPackDraft = {
  pack_name: string;
  pack_type: "domain" | "industry";
  description: string;
  definition: string;
  additional_notes: string;
  domain_lenses: string[];
  version: string;
  status: string;
};

function joinLines(values?: string[]) {
  return values?.join("\n") ?? "";
}

export function buildGuidedAgentDraft(agent?: Partial<AgentCatalogEntry>): GuidedAgentDraft {
  return {
    agent_name: agent?.agent_name ?? "",
    description: agent?.description ?? "",
    role_focus: joinLines(agent?.primary_responsibilities),
    boundary_focus: joinLines([
      ...(agent?.invocation_rules ?? []).slice(0, 3),
      ...(agent?.out_of_scope ?? []).slice(0, 3),
    ]),
    agent_type: agent?.agent_type ?? "reasoning",
    supported_capabilities: agent?.supported_capabilities ?? [],
    relevant_domain_packs: agent?.relevant_domain_packs ?? [],
    relevant_industry_packs: agent?.relevant_industry_packs ?? [],
    version: agent?.version ?? "1.0.0",
    status: agent?.status ?? "active",
  };
}

export function buildGuidedPackDraft(pack?: Partial<PackCatalogEntry>): GuidedPackDraft {
  const packType = (pack?.pack_type as "domain" | "industry") ?? "domain";
  return {
    pack_name: pack?.pack_name ?? "",
    pack_type: packType,
    description: pack?.description ?? "",
    definition:
      packType === "domain" ? pack?.domain_definition ?? "" : pack?.industry_definition ?? "",
    additional_notes: joinLines([
      ...(pack?.common_problem_patterns ?? []).slice(0, 3),
      ...(pack?.routing_hints ?? []).slice(0, 3),
      ...(pack?.scope_boundaries ?? []).slice(0, 2),
    ]),
    domain_lenses: pack?.domain_lenses ?? [],
    version: pack?.version ?? "1.0.0",
    status: pack?.status ?? "active",
  };
}
