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

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function sentenceOrFallback(value: string, fallback: string[]) {
  const lines = splitLines(value);
  return lines.length > 0 ? lines : fallback;
}

const CAPABILITY_CONTEXT_FIELDS: Record<string, string[]> = {
  diagnose_assess: ["DecisionContext", "Evidence", "Goals", "Constraints"],
  decide_converge: ["DecisionContext", "Options", "Constraints", "Evidence"],
  review_challenge: ["Artifact", "DecisionContext", "Evidence"],
  synthesize_brief: ["DecisionContext", "SourceMaterial", "Evidence"],
  restructure_reframe: ["Artifact", "Audience", "DecisionContext"],
  plan_roadmap: ["Goals", "Constraints", "Timeline", "DecisionContext"],
  scenario_comparison: ["DecisionContext", "Options", "Evidence"],
  risk_surfacing: ["DecisionContext", "Evidence", "Assumptions", "Constraints"],
};

const CAPABILITY_OBJECTS: Record<string, string[]> = {
  diagnose_assess: ["Insight", "Risk", "Recommendation"],
  decide_converge: ["Option", "Recommendation", "ActionItem"],
  review_challenge: ["Risk", "Recommendation", "EvidenceGap"],
  synthesize_brief: ["Insight", "Evidence", "EvidenceGap"],
  restructure_reframe: ["Deliverable", "Recommendation"],
  plan_roadmap: ["ActionItem", "Recommendation", "Timeline"],
  scenario_comparison: ["Option", "Recommendation", "Risk"],
  risk_surfacing: ["Risk", "EvidenceGap", "Recommendation"],
};

function buildAgentDefaults(draft: GuidedAgentDraft) {
  const capabilities = draft.supported_capabilities;
  const requiredContextFields = unique(
    capabilities.flatMap((item) => CAPABILITY_CONTEXT_FIELDS[item] ?? ["DecisionContext", "Evidence"]),
  );
  const producedObjects = unique(
    capabilities.flatMap((item) => CAPABILITY_OBJECTS[item] ?? ["Insight", "Recommendation"]),
  );
  const roleLines = sentenceOrFallback(draft.role_focus, [
    `${draft.agent_name || "這個代理"}負責處理與自身專業責任直接相關的問題。`,
  ]);
  const inputLines = sentenceOrFallback(draft.input_focus, [
    "至少要有清楚的 DecisionContext 與可引用材料。",
  ]);
  const outputLines = sentenceOrFallback(draft.output_focus, [
    "需要形成可被 Host 採用的 findings、recommendations 與 missing information。",
  ]);
  const usageLines = sentenceOrFallback(draft.when_to_use, [
    "當這輪案件需要這個專業視角時啟用。",
  ]);
  const boundaryLines = sentenceOrFallback(draft.boundary_focus, [
    "不直接取代 Host 做最終收斂與拍板。",
    "不假裝超出自身證據基礎的高確定性結論。",
  ]);
  const preferredExecutionModes =
    draft.agent_type === "specialist"
      ? ["specialist", "multi_agent"]
      : draft.agent_type === "host"
        ? ["host"]
        : ["multi_agent", "specialist"];
  const handoffTargets =
    draft.agent_type === "host"
      ? ["Host Agent"]
      : capabilities.includes("synthesize_brief")
        ? ["Host Agent", "Research Synthesis Specialist"]
        : ["Host Agent"];

  return {
    roleLines,
    inputLines,
    outputLines,
    usageLines,
    boundaryLines,
    requiredContextFields,
    producedObjects,
    preferredExecutionModes,
    handoffTargets,
  };
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

export function buildAgentPayloadFromGuidedDraft(
  draft: GuidedAgentDraft,
  agentId: string,
  baseAgent: AgentCatalogEntry,
): AgentCatalogEntry {
  const defaults = buildAgentDefaults(draft);
  return {
    ...baseAgent,
    agent_id: agentId,
    agent_name: draft.agent_name.trim(),
    agent_type: draft.agent_type,
    description: draft.description.trim(),
    supported_capabilities: draft.supported_capabilities,
    relevant_domain_packs: draft.relevant_domain_packs,
    relevant_industry_packs: draft.relevant_industry_packs,
    primary_responsibilities: defaults.roleLines,
    out_of_scope: defaults.boundaryLines,
    defer_rules: [
      "當 DecisionContext 或證據仍偏薄時，先降級成較保守的判斷。",
      "若缺少自己依賴的核心輸入，應先回報 evidence gap，而不是硬做結論。",
    ],
    preferred_execution_modes: defaults.preferredExecutionModes,
    input_requirements: defaults.inputLines,
    minimum_evidence_readiness: [
      "至少要能說清楚這輪要判斷什麼。",
      "至少要有一份可引用的材料、背景描述或 evidence chain。",
    ],
    required_context_fields: defaults.requiredContextFields,
    output_contract: defaults.outputLines,
    produced_objects: defaults.producedObjects,
    deliverable_impact: [
      `${draft.agent_name || "這個代理"}會直接影響 Host 對交付物 framing 與取捨重點的選擇。`,
    ],
    writeback_expectations: [
      "需要保留判斷依據、信心邊界與仍待補完的缺口。",
    ],
    invocation_rules: defaults.usageLines,
    escalation_rules: [
      "若缺少關鍵材料、權威來源或必要上下文，應先升級回 Host 做治理決定。",
    ],
    handoff_targets: defaults.handoffTargets,
    evaluation_focus: [
      "是否真的幫 Host 補到這個代理應負責的專業判斷。",
      "輸出是否足夠可採用，而不是只停在空泛摘要。",
    ],
    failure_modes_to_watch: [
      "把弱訊號誤包裝成高確定性結論。",
      "輸出看起來完整，但沒有真正支撐 Host 做更好判斷。",
    ],
    trace_requirements: [
      "需保留這個代理為何被選用，以及它具體補了哪些判斷。",
    ],
    version: draft.version.trim() || "1.0.0",
    status: draft.status,
  };
}

function buildPackDefaults(draft: GuidedPackDraft) {
  const problemPatterns = sentenceOrFallback(draft.common_problem_patterns, [
    `${draft.pack_name || "這個模組包"}目前尚待整理更具體的常見問題型態。`,
  ]);
  const signalLines = sentenceOrFallback(draft.key_signals, [
    "至少要有一組能反映這類案件健康度或風險的經營訊號。",
  ]);
  const evidenceLines = sentenceOrFallback(draft.evidence_expectations, [
    "至少要有可引用材料、背景說明與支撐判斷的 evidence chain。",
  ]);
  const riskLines = sentenceOrFallback(draft.common_risks, [
    "若問題定義與材料都太薄，容易把這類案件誤判成通用案例。",
  ]);
  const routingKeywords = unique([
    draft.pack_name.trim(),
    ...splitLines(draft.routing_keywords),
    ...draft.domain_lenses,
  ]).filter(Boolean);
  const definition = draft.definition.trim() || draft.description.trim();
  const decisionPatterns = problemPatterns.slice(0, 4).map((item) => `是否該優先處理：${item}`);
  const deliverablePresets = [
    `${draft.pack_name || "模組包"}評估備忘`,
    `${draft.pack_name || "模組包"}決策簡報`,
  ];
  const rationale = [
    `${draft.pack_name || "這個模組包"}需要獨立存在，因為它的 evidence、decision 與 deliverable pattern 不應被一般案件混掉。`,
    "若只留下名稱而沒有明確 contract，Host 很難把它當成真正可用的 context module。",
  ];
  return {
    problemPatterns,
    signalLines,
    evidenceLines,
    riskLines,
    routingKeywords,
    definition,
    decisionPatterns,
    deliverablePresets,
    rationale,
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

export function buildPackPayloadFromGuidedDraft(
  draft: GuidedPackDraft,
  packId: string,
  basePack: PackCatalogEntry,
): PackCatalogEntry {
  const defaults = buildPackDefaults(draft);
  return {
    ...basePack,
    pack_id: packId,
    pack_type: draft.pack_type,
    pack_name: draft.pack_name.trim(),
    description: draft.description.trim(),
    domain_definition: draft.pack_type === "domain" ? defaults.definition : "",
    industry_definition: draft.pack_type === "industry" ? defaults.definition : "",
    common_business_models:
      draft.pack_type === "industry"
        ? sentenceOrFallback(draft.common_business_models, [
            "主要商業模式待補充，但目前已先建立這個產業脈絡。",
          ])
        : [],
    common_problem_patterns: defaults.problemPatterns,
    key_kpis_or_operating_signals: defaults.signalLines,
    key_kpis: defaults.signalLines,
    domain_lenses: draft.pack_type === "domain" ? draft.domain_lenses : basePack.domain_lenses,
    evidence_expectations: defaults.evidenceLines,
    common_risks: defaults.riskLines,
    decision_patterns: defaults.decisionPatterns,
    deliverable_presets: defaults.deliverablePresets,
    routing_hints: defaults.routingKeywords,
    scope_boundaries:
      draft.pack_type === "domain"
        ? [
            "不取代 Host 對跨 pack 收斂與最終取捨的主判斷。",
            `這個 pack 應聚焦在 ${draft.pack_name || "這類問題"} 的專屬 context，而不是把所有案件都包進來。`,
          ]
        : [],
    pack_rationale: defaults.rationale,
    pack_notes: [
      "精簡模式建立後，系統已先自動補齊 pack contract；若要微調，再切到完整模式。",
    ],
    version: draft.version.trim() || "1.0.0",
    status: draft.status,
  };
}
