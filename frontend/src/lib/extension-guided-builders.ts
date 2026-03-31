import type { AgentCatalogEntry, PackCatalogEntry } from "@/lib/types";

export type GuidedAgentDraft = {
  agent_name: string;
  agent_type: string;
  description: string;
  supported_capabilities: string[];
  relevant_domain_packs: string[];
  relevant_industry_packs: string[];
  role_focus: string;
  input_focus: string;
  output_focus: string;
  when_to_use: string;
  boundary_focus: string;
  version: string;
  status: string;
};

export type GuidedPackDraft = {
  pack_name: string;
  pack_type: "domain" | "industry";
  description: string;
  definition: string;
  domain_lenses: string[];
  routing_keywords: string;
  common_business_models: string;
  common_problem_patterns: string;
  key_signals: string;
  evidence_expectations: string;
  common_risks: string;
  version: string;
  status: string;
};

function splitLines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinLines(values?: string[]) {
  return values?.join("\n") ?? "";
}

export function buildGuidedAgentDraft(agent?: Partial<AgentCatalogEntry>): GuidedAgentDraft {
  return {
    agent_name: agent?.agent_name ?? "",
    agent_type: agent?.agent_type ?? "specialist",
    description: agent?.description ?? "",
    supported_capabilities: agent?.supported_capabilities ?? [],
    relevant_domain_packs: agent?.relevant_domain_packs ?? [],
    relevant_industry_packs: agent?.relevant_industry_packs ?? [],
    role_focus: joinLines(agent?.primary_responsibilities),
    input_focus: joinLines(agent?.input_requirements),
    output_focus: joinLines(agent?.output_contract),
    when_to_use: joinLines(agent?.invocation_rules),
    boundary_focus: joinLines(agent?.out_of_scope),
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
    domain_lenses: pack?.domain_lenses ?? [],
    routing_keywords: joinLines(pack?.routing_hints),
    common_business_models: joinLines(pack?.common_business_models),
    common_problem_patterns: joinLines(pack?.common_problem_patterns),
    key_signals: joinLines(
      pack?.key_kpis_or_operating_signals?.length ? pack.key_kpis_or_operating_signals : pack?.key_kpis,
    ),
    evidence_expectations: joinLines(pack?.evidence_expectations),
    common_risks: joinLines(pack?.common_risks),
    version: pack?.version ?? "1.0.0",
    status: pack?.status ?? "active",
  };
}
