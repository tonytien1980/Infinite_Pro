import type {
  Constraint,
  Deliverable,
  Evidence,
  Goal,
  SourceDocument,
  TaskAggregate,
} from "@/lib/types";
import {
  extractModeSpecificAppendix,
  getModeSpecificReadinessSignals,
  resolveWorkflowKey,
  type WorkflowKey,
} from "@/lib/workflow-modes";
import {
  labelForDeliverableClass,
  labelForInputEntryMode,
  labelForPresenceState,
} from "@/lib/ui-labels";

export type ReadinessLevel = "ready" | "caution" | "degraded";

export interface ReadinessAssessment {
  level: ReadinessLevel;
  label: string;
  summary: string;
  backgroundStatus: string;
  evidenceStatus: string;
  missingItems: string[];
  warnings: string[];
  degradedOutputLikely: boolean;
}

export interface ExternalDataUsageView {
  strategy: string;
  searchUsed: boolean;
  sources: Array<{
    title: string;
    url: string;
    sourceType: string;
  }>;
  dependencyNote: string;
}

export interface RecommendationCardView {
  content: string;
  priority: string;
  rationale: string;
  expectedEffect: string;
}

export interface RiskCardView {
  content: string;
  severity: string;
  likelihood: string;
  impactExplanation: string;
}

export interface ActionItemCardView {
  content: string;
  ownerRole: string;
  priority: string;
  sequence: string;
  dependencies: string[];
}

export interface DecisionSnapshotView {
  conclusionLabel: string;
  recommendationLabel: string;
  riskLabel: string;
  missingDataLabel: string;
  conclusion: string;
  primaryRecommendation: string;
  primaryRisk: string;
  missingDataStatus: string;
}

export interface TaskFramingView {
  summary: string;
  judgmentToMake: string;
  consultingContext: string;
  decisionContextSummary: string;
  analysisFocus: string;
  sourcePriority: string;
  externalDataPolicy: string;
}

export interface WorkbenchObjectSummaryView {
  primaryEntity: string;
  engagement: string;
  workstream: string;
  decisionContext: string;
  domainLensSummary: string;
  clientContext: string;
  sourceSummary: string;
}

export interface CapabilityFrameView {
  capability: string;
  label: string;
  framingSummary: string;
  executionMode: string;
  judgmentToMake: string;
  routingRationale: string[];
  selectedAgents: string[];
  specialistAgent: string;
  prioritySources: string[];
  domainLenses: string[];
  clientStage: string;
  clientType: string;
}

export interface ReadinessGovernanceView {
  level: ReadinessLevel;
  label: string;
  summary: string;
  decisionContextStatus: string;
  domainStatus: string;
  artifactStatus: string;
  evidenceStatus: string;
  missingInformation: string[];
  conclusionImpact: string;
  assumptionSignal: string;
  constraintSignal: string;
}

export interface OntologyChainSummaryView {
  client: string;
  engagement: string;
  workstream: string;
  task: string;
  decisionContext: string;
  artifactCount: number;
  sourceMaterialCount: number;
  evidenceCount: number;
  recommendationCount: number;
  riskCount: number;
  actionItemCount: number;
}

export interface SparseInputOperatingView {
  entryModeLabel: string;
  deliverableClassLabel: string;
  summary: string;
  deliverableGuidance: string;
  externalResearchHeavy: boolean;
  presenceHighlights: string[];
}

function isExternalDataStrategyConstraint(constraint: Constraint) {
  return constraint.constraint_type === "external_data_strategy";
}

export function getVisibleConstraints(constraints: Constraint[]) {
  return constraints.filter((constraint) => !isExternalDataStrategyConstraint(constraint));
}

export function getExternalSourceDocuments(task: TaskAggregate): SourceDocument[] {
  return task.uploads.filter((item) =>
    ["external_search", "manual_url", "google_docs"].includes(item.source_type),
  );
}

export function buildExternalDataUsage(
  task: TaskAggregate,
  deliverable: Deliverable | null,
): ExternalDataUsageView {
  const usage = deliverable?.content_structure?.external_data_usage;
  const fallbackSources = getExternalSourceDocuments(task).map((item) => ({
    title: item.file_name,
    url: item.storage_path,
    sourceType: item.source_type,
  }));

  if (usage && typeof usage === "object" && !Array.isArray(usage)) {
    const usageRecord = usage as Record<string, unknown>;
    const sourceItems = Array.isArray(usageRecord.sources)
      ? usageRecord.sources
          .map((item) => {
            if (!item || typeof item !== "object") {
              return null;
            }
            const sourceRecord = item as Record<string, unknown>;
            return {
              title: String(sourceRecord.title ?? ""),
              url: String(sourceRecord.url ?? ""),
              sourceType: String(sourceRecord.source_type ?? ""),
            };
          })
          .filter(
            (
              item,
            ): item is { title: string; url: string; sourceType: string } =>
              Boolean(item?.title || item?.url),
          )
      : fallbackSources;

    return {
      strategy: String(usageRecord.strategy ?? task.external_data_strategy),
      searchUsed: Boolean(usageRecord.search_used),
      sources: sourceItems,
      dependencyNote:
        String(usageRecord.analysis_dependency_note ?? "").trim() ||
        "本輪分析對外部資料的依賴情況尚未被明確標示。",
    };
  }

  const searchUsed = fallbackSources.some((item) => item.sourceType === "external_search");
  return {
    strategy: task.external_data_strategy,
    searchUsed,
    sources: fallbackSources,
    dependencyNote: searchUsed
      ? "本輪分析已補充外部搜尋來源，背景摘要、關鍵發現與建議可能部分依賴外部資料。"
      : fallbackSources.length > 0
        ? "本輪沒有使用 Host 外部搜尋，但分析有引用你手動附加的外部來源。"
        : "本輪未使用 Host 外部搜尋，分析主要依賴你提供的資料。",
  };
}

interface DraftReadinessInput {
  workflowKey: WorkflowKey;
  coreProblem: string;
  subjectName: string;
  goalDescription: string;
  successCriteria: string;
  backgroundText: string;
  availableData: string;
  missingData: string;
  constraintText: string;
  fileCount: number;
  modeSpecificValues: Record<string, string>;
}

function splitNotes(value: string | null | undefined) {
  return (value ?? "")
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getUsableEvidence(evidence: Evidence[]) {
  return evidence.filter(
    (item) =>
      !item.evidence_type.endsWith("ingestion_issue") &&
      !item.evidence_type.endsWith("unparsed") &&
      item.excerpt_or_summary.trim(),
  );
}

function resolveLevel({
  hasCoreProblem,
  hasGoal,
  backgroundSufficient,
  evidenceSufficient,
  hasSuccessCriteria,
}: {
  hasCoreProblem: boolean;
  hasGoal: boolean;
  backgroundSufficient: boolean;
  evidenceSufficient: boolean;
  hasSuccessCriteria: boolean;
}): ReadinessLevel {
  if (!hasCoreProblem || !hasGoal || (!backgroundSufficient && !evidenceSufficient)) {
    return "degraded";
  }

  if (!hasSuccessCriteria || !evidenceSufficient || !backgroundSufficient) {
    return "caution";
  }

  return "ready";
}

function getLevelLabel(level: ReadinessLevel) {
  if (level === "ready") {
    return "可直接分析";
  }
  if (level === "caution") {
    return "可執行但需留意";
  }
  return "高機率降級";
}

function buildSummary(level: ReadinessLevel) {
  if (level === "ready") {
    return "目前的案件定義、背景與證據已足夠支撐第一輪分析，可直接進入執行。";
  }
  if (level === "caution") {
    return "目前可以先跑第一輪分析，但結論仍可能因資料厚度不足而偏向工作草稿。";
  }
  return "目前若直接執行，系統很可能只能產出帶有明確缺漏註記的降級結果。";
}

function buildBackgroundStatus({
  backgroundLength,
  hasAvailableData,
}: {
  backgroundLength: number;
  hasAvailableData: boolean;
}) {
  if (backgroundLength >= 320 || (backgroundLength >= 180 && hasAvailableData)) {
    return "背景完整度偏高，已具備任務脈絡。";
  }
  if (backgroundLength >= 140) {
    return "背景可用，但仍建議補充脈絡或現況描述。";
  }
  return "背景偏薄，可能不足以支撐高品質分析。";
}

function buildEvidenceStatus({
  usableEvidenceCount,
  fileCount,
  availableDataLength,
}: {
  usableEvidenceCount: number;
  fileCount: number;
  availableDataLength: number;
}) {
  if (usableEvidenceCount >= 2 || fileCount >= 2) {
    return "證據基礎充足，已具備至少一輪收斂分析所需材料。";
  }
  if (usableEvidenceCount >= 1 || fileCount >= 1 || availableDataLength >= 180) {
    return "證據基礎勉強可用，但仍建議補更多原始資料或關鍵摘錄。";
  }
  return "證據不足，系統可能只能依賴背景文字產出降級結果。";
}

export function assessDraftReadiness(input: DraftReadinessInput): ReadinessAssessment {
  const hasCoreProblem = Boolean(input.coreProblem.trim());
  const hasSubject = Boolean(input.subjectName.trim());
  const hasGoal = Boolean(input.goalDescription.trim());
  const hasSuccessCriteria = Boolean(input.successCriteria.trim());
  const backgroundLength = [
    input.coreProblem,
    input.backgroundText,
    input.availableData,
    input.constraintText,
  ]
    .join(" ")
    .trim().length;
  const backgroundSufficient = backgroundLength >= 180;
  const evidenceSufficient =
    input.fileCount >= 1 ||
    input.availableData.trim().length >= 180 ||
    input.backgroundText.trim().length >= 220;
  const missingItems: string[] = [];
  const warnings: string[] = [];

  if (!hasCoreProblem) {
    missingItems.push("尚未清楚定義核心問題。");
  }
  if (!hasSubject) {
    missingItems.push("尚未標示分析對象。");
  }
  if (!hasGoal) {
    missingItems.push("尚未寫明交付目標。");
  }
  if (!hasSuccessCriteria) {
    missingItems.push("尚未定義判斷標準 / 成功標準。");
  }
  if (!evidenceSufficient) {
    missingItems.push("可用資料偏少，建議補上附件或已知資料摘要。");
  }
  if (!input.missingData.trim()) {
    warnings.push("尚未列出待補資料或待確認假設，Host 執行前較難先提醒你有哪些盲點。");
  }
  if (!backgroundSufficient) {
    warnings.push("背景脈絡仍偏短，第一輪輸出可能偏向整理草稿而非完整分析。");
  }

  const modeSpecificSignals = getModeSpecificReadinessSignals(
    input.workflowKey,
    input.modeSpecificValues,
  );
  missingItems.push(...modeSpecificSignals.missingItems);
  warnings.push(...modeSpecificSignals.warnings);

  const level = resolveLevel({
    hasCoreProblem,
    hasGoal,
    backgroundSufficient,
    evidenceSufficient,
    hasSuccessCriteria,
  });

  return {
    level,
    label: getLevelLabel(level),
    summary: buildSummary(level),
    backgroundStatus: buildBackgroundStatus({
      backgroundLength,
      hasAvailableData: Boolean(input.availableData.trim()),
    }),
    evidenceStatus: buildEvidenceStatus({
      usableEvidenceCount: input.fileCount,
      fileCount: input.fileCount,
      availableDataLength: input.availableData.trim().length,
    }),
    missingItems,
    warnings,
    degradedOutputLikely: level === "degraded",
  };
}

export function assessTaskReadiness(task: TaskAggregate): ReadinessAssessment {
  const latestContext = task.contexts[0];
  const availableData = latestContext?.notes ?? "";
  const workflowKey = resolveWorkflowKey(task.task_type, task.mode);
  const parsedAppendix = extractModeSpecificAppendix(latestContext?.summary ?? "");
  const backgroundText = parsedAppendix.backgroundText;
  const usableEvidence = getUsableEvidence(task.evidence);
  const visibleConstraints = getVisibleConstraints(task.constraints);
  const missingItems: string[] = [];
  const warnings: string[] = [];
  const hasCoreProblem = Boolean(task.description.trim() || task.title.trim());
  const hasSubject = task.subjects.length > 0;
  const hasGoal = task.goals.some((item) => Boolean(item.description.trim()));
  const hasSuccessCriteria = task.goals.some((item) => Boolean(item.success_criteria?.trim()));
  const backgroundLength = [task.description, backgroundText, availableData].join(" ").trim().length;
  const backgroundSufficient = backgroundLength >= 180;
  const evidenceSufficient =
    usableEvidence.length >= 2 ||
    (usableEvidence.length >= 1 && backgroundLength >= 120) ||
    availableData.trim().length >= 200;

  if (!hasCoreProblem) {
    missingItems.push("核心問題尚未定義完整。");
  }
  if (!hasSubject) {
    missingItems.push("分析對象尚未明確標示。");
  }
  if (!hasGoal) {
    missingItems.push("交付目標尚未寫清楚。");
  }
  if (!hasSuccessCriteria) {
    missingItems.push("判斷標準 / 成功標準尚未設定。");
  }
  if (!backgroundSufficient) {
    missingItems.push("背景脈絡仍偏薄，Host 可能只能用有限上下文推論。");
  }
  if (!evidenceSufficient) {
    missingItems.push("可用證據仍不足，分析結果可能帶有明確降級註記。");
  }

  const missingDataNotes = splitNotes(latestContext?.assumptions);
  if (missingDataNotes.length > 0) {
    warnings.push(`目前已標記 ${missingDataNotes.length} 項待補資料 / 待確認假設。`);
  } else {
    warnings.push("尚未明確列出待補資料，執行前較難判斷盲點是否已被補齊。");
  }
  if (visibleConstraints.length > 0) {
    warnings.push(`目前有 ${visibleConstraints.length} 項限制條件，建議先確認是否會影響交付深度。`);
  }
  if (!backgroundText.includes("目標讀者：")) {
    warnings.push("尚未明確標示目標讀者，輸出語氣與摘要層次可能仍需要你再收斂。");
  }
  if (!backgroundText.includes("研究範圍 / 排除範圍：")) {
    warnings.push("尚未清楚界定研究範圍 / 排除範圍，結果可能會偏廣。");
  }
  if (!backgroundText.includes("希望這份分析做到的程度：")) {
    warnings.push("這次分析深度目前由系統自動推測；若你有特定交付期待，建議回頭補充。");
  }
  if (visibleConstraints.some((item) => item.constraint_type === "system_inferred")) {
    warnings.push("目前限制條件包含系統自動推測內容，若有不能踩的前提，建議再手動補充。");
  }

  const modeSpecificSignals = getModeSpecificReadinessSignals(
    workflowKey,
    parsedAppendix.values,
  );
  missingItems.push(...modeSpecificSignals.missingItems);
  warnings.push(...modeSpecificSignals.warnings);

  const level = resolveLevel({
    hasCoreProblem,
    hasGoal,
    backgroundSufficient,
    evidenceSufficient,
    hasSuccessCriteria,
  });

  return {
    level,
    label: getLevelLabel(level),
    summary: buildSummary(level),
    backgroundStatus: buildBackgroundStatus({
      backgroundLength,
      hasAvailableData: Boolean(availableData.trim()),
    }),
    evidenceStatus: buildEvidenceStatus({
      usableEvidenceCount: usableEvidence.length,
      fileCount: task.uploads.length,
      availableDataLength: availableData.trim().length,
    }),
    missingItems,
    warnings,
    degradedOutputLikely: level === "degraded",
  };
}

export function getLatestDeliverable(task: TaskAggregate): Deliverable | null {
  return task.deliverables.length > 0
    ? [...task.deliverables].sort((a, b) => b.version - a.version)[0] ?? null
    : null;
}

export function getStructuredString(deliverable: Deliverable | null, key: string) {
  const value = deliverable?.content_structure?.[key];
  return typeof value === "string" ? value : "";
}

export function getStructuredStringList(deliverable: Deliverable | null, key: string) {
  const value = deliverable?.content_structure?.[key];
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function takeFirst(items: string[], fallback = "") {
  return items.find((item) => item.trim()) ?? fallback;
}

function joinNaturalList(items: string[]) {
  const normalized = items.map((item) => item.trim()).filter(Boolean);
  if (normalized.length === 0) {
    return "";
  }
  if (normalized.length === 1) {
    return normalized[0];
  }
  return `${normalized.slice(0, -1).join("、")} 與 ${normalized.at(-1)}`;
}

function buildDefaultJudgment(task: TaskAggregate) {
  if (task.decision_context?.judgment_to_make?.trim()) {
    return task.decision_context.judgment_to_make.trim();
  }

  if (task.mode === "multi_agent") {
    return "把這個複雜問題收斂成可採用的決策方向、主要風險與下一步。";
  }

  if (task.task_type === "contract_review") {
    return "先判斷這份合約中最需要優先處理的風險、修改方向與缺口。";
  }

  if (task.task_type === "document_restructuring") {
    return "先判斷如何把現有內容重組成更清楚、可直接交付的版本。";
  }

  return "先把現有資料整理成可供判斷的發現、洞察與建議。";
}

function buildExternalDataPolicyDescription(task: TaskAggregate) {
  if (task.decision_context?.external_data_policy?.trim()) {
    return task.decision_context.external_data_policy.trim();
  }

  if (task.external_data_strategy === "strict") {
    return "這輪分析只使用你提供的背景、來源與附件，不主動補外部資料。";
  }

  if (task.external_data_strategy === "latest") {
    return "這輪分析會優先補充最新外部資訊，再與你提供的材料一起判斷。";
  }

  return "這輪分析會先使用你提供的資料；若證據不足，Host 可視需要補充外部資料。";
}

function buildSourcePriority(task: TaskAggregate) {
  if (task.decision_context?.source_priority?.trim()) {
    return task.decision_context.source_priority.trim();
  }

  const latestContext = task.contexts[0];
  const sourcePhrases: string[] = [];

  if (task.description.trim()) {
    sourcePhrases.push("你的原始問題");
  }
  if (latestContext?.summary?.trim()) {
    sourcePhrases.push("背景脈絡");
  }
  if (latestContext?.notes?.trim()) {
    sourcePhrases.push("已知資料整理");
  }
  if (task.uploads.length > 0) {
    sourcePhrases.push(`${task.uploads.length} 份來源 / 附件`);
  }
  if (task.evidence.length > 0) {
    sourcePhrases.push(`${task.evidence.length} 則已整理證據`);
  }

  if (sourcePhrases.length === 0) {
    return "目前主要只能依賴你的問題描述做第一輪判斷，建議補一些背景或原始資料。";
  }

  return `系統會優先使用 ${joinNaturalList(sourcePhrases)}，再把可用材料整理進同一份案件脈絡中。`;
}

function buildAnalysisFocus(task: TaskAggregate) {
  const subjectNames = task.subjects.map((subject) => subject.name).filter(Boolean);
  const successCriteria = getGoalSuccessCriteria(task.goals);
  const visibleConstraints = getVisibleConstraints(task.constraints);
  const focusParts: string[] = [];
  const domainLenses = task.domain_lenses.filter(Boolean);

  if (subjectNames.length > 0) {
    focusParts.push(`優先聚焦 ${joinNaturalList(subjectNames)}`);
  }
  if (domainLenses.length > 0) {
    focusParts.push(`並以 ${joinNaturalList(domainLenses)} 視角做第一輪判斷`);
  }

  if (successCriteria.length > 0) {
    focusParts.push(`並以 ${joinNaturalList(successCriteria.slice(0, 2))} 作為主要判斷標準`);
  }

  if (visibleConstraints.length > 0) {
    focusParts.push(`同時納入 ${visibleConstraints.length} 項限制條件`);
  }

  if (focusParts.length === 0) {
    return "這輪會先把問題定義、現有證據與缺漏資訊收斂成可採用的判斷骨架。";
  }

  return `${focusParts.join("，")}。`;
}

function buildConsultingContext(task: TaskAggregate) {
  const parts: string[] = [];
  const clientName = task.client?.name?.trim();
  const clientType = task.client?.client_type?.trim() || task.client_type?.trim() || "";
  const clientStage = task.client?.client_stage?.trim() || task.client_stage?.trim() || "";
  const workstreamName = task.workstream?.name?.trim();
  const engagementName = task.engagement?.name?.trim();
  const domainLenses = task.domain_lenses.filter(Boolean);

  if (clientName && clientName !== "尚未明確標示客戶") {
    parts.push(`目前案件主體是「${clientName}」`)
  } else if (clientType || clientStage) {
    parts.push("目前案件尚未明確標示客戶名稱")
  }
  if (clientType && clientType !== "未指定") {
    parts.push(`客戶型態偏向「${clientType}」`)
  }
  if (clientStage && clientStage !== "未指定") {
    parts.push(`目前落在「${clientStage}」`)
  }
  if (engagementName) {
    parts.push(`這輪工作隸屬於「${engagementName}」`)
  }
  if (workstreamName) {
    parts.push(`主要工作流聚焦在「${workstreamName}」`)
  }
  if (domainLenses.length > 0) {
    parts.push(`會優先用 ${joinNaturalList(domainLenses)} 視角來判斷`)
  }

  if (parts.length === 0) {
    return "目前案件尚未完整標示 client / engagement / workstream，系統仍先以任務與證據形成第一輪判斷脈絡。";
  }

  return `${parts.join("，")}。`;
}

function buildDecisionContextSummary(task: TaskAggregate) {
  if (task.decision_context?.summary?.trim()) {
    return task.decision_context.summary.trim();
  }

  const judgment = buildDefaultJudgment(task);
  const subjectNames = task.subjects.map((subject) => subject.name).filter(Boolean);
  const subjectText = subjectNames.length > 0 ? `圍繞 ${joinNaturalList(subjectNames)} ` : "";
  return `這次系統會先${subjectText}形成「${judgment}」的顧問判斷脈絡。`;
}

export function buildTaskFraming(
  task: TaskAggregate,
  readiness: ReadinessAssessment,
): TaskFramingView {
  const primaryGoal = task.decision_context?.judgment_to_make?.trim()
    ? task.decision_context.judgment_to_make.trim()
    : takeFirst(task.goals.map((goal) => goal.description), buildDefaultJudgment(task));
  const summarySegments = [
    buildConsultingContext(task),
    buildDecisionContextSummary(task),
    readiness.level === "ready"
      ? "目前資料厚度足以支撐第一輪決策判斷。"
      : readiness.level === "caution"
        ? "目前可以先形成第一輪判斷，但部分結論仍需補證。"
        : "目前只能先形成帶缺漏註記的第一輪判斷。",
  ].filter(Boolean);

  return {
    summary: summarySegments.join(" "),
    judgmentToMake: primaryGoal,
    consultingContext: buildConsultingContext(task),
    decisionContextSummary: buildDecisionContextSummary(task),
    analysisFocus: buildAnalysisFocus(task),
    sourcePriority: buildSourcePriority(task),
    externalDataPolicy: task.uploads.length > 0 || task.evidence.length > 0
      ? buildExternalDataPolicyDescription(task)
      : `${buildExternalDataPolicyDescription(task)} 目前可用資料仍偏少，建議先補上至少一份可引用材料。`,
  };
}

function getStructuredObjectList(deliverable: Deliverable | null, key: string) {
  const value = deliverable?.content_structure?.[key];
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is Record<string, unknown> =>
      Boolean(item) && typeof item === "object" && !Array.isArray(item),
  );
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function asRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function getPresenceHighlights(task: TaskAggregate, deliverable: Deliverable | null) {
  const operatingState = asRecord(deliverable?.content_structure?.sparse_input_operating_state);
  const deliverableSummary = asRecord(operatingState?.presence_state_summary);
  const fallbackSummary = task.presence_state_summary as unknown as Record<string, unknown>;
  const orderedKeys = [
    "client",
    "engagement",
    "workstream",
    "decision_context",
    "artifact",
    "source_material",
    "domain_lens",
    "client_stage",
    "client_type",
  ];

  return orderedKeys
    .map((key) => {
      const source = asRecord(deliverableSummary?.[key]) ?? asRecord(fallbackSummary[key]);
      if (!source) {
        return null;
      }
      const state = typeof source.state === "string" ? source.state : "";
      const reason = typeof source.reason === "string" ? source.reason : "";
      const displayValue = typeof source.display_value === "string" && source.display_value.trim()
        ? `（${source.display_value.trim()}）`
        : "";
      if (!state && !reason) {
        return null;
      }
      const label = key === "decision_context" ? "Decision Context" : key.replaceAll("_", " ");
      return `${label}：${labelForPresenceState(state)}${displayValue}${reason ? `｜${reason}` : ""}`;
    })
    .filter((item): item is string => Boolean(item));
}

function inferRecommendationExpectedEffect(summary: string, rationale: string) {
  const combinedText = `${summary} ${rationale}`.trim();

  if (/(補|資料|證據|來源)/.test(combinedText)) {
    return "可補齊關鍵證據，降低下一輪判斷的不確定性。";
  }
  if (/(對齊|確認|釐清)/.test(combinedText)) {
    return "可降低團隊理解落差，讓後續執行與決策更一致。";
  }
  if (/(重組|改寫|結構)/.test(combinedText)) {
    return "可提升交付物可讀性與採納率，減少後續重工。";
  }
  if (/(優先|排序|決策)/.test(combinedText)) {
    return "可加快決策收斂，讓資源更快投入最值得處理的方向。";
  }

  return "可讓下一輪判斷與執行更具可操作性。";
}

function inferActionSequence(priority: string, dueHint: string | null | undefined) {
  if (dueHint?.trim()) {
    return dueHint.trim();
  }
  if (priority === "high") {
    return "建議立即啟動，並在下一個工作迭代前完成。";
  }
  if (priority === "medium") {
    return "建議排入本輪工作，於主要建議確認後執行。";
  }
  return "可在下一輪規劃或補證後再處理。";
}

export function buildRecommendationCards(
  task: TaskAggregate,
  deliverable: Deliverable | null,
): RecommendationCardView[] {
  const cards = getStructuredObjectList(deliverable, "recommendation_cards");
  if (cards.length > 0) {
    return cards.map((item) => ({
      content: asString(item.content),
      priority: asString(item.priority, "medium"),
      rationale: asString(item.rationale),
      expectedEffect: asString(item.expected_effect),
    }));
  }

  return [...task.recommendations]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map((item) => ({
      content: item.summary,
      priority: item.priority,
      rationale: item.rationale,
      expectedEffect: inferRecommendationExpectedEffect(item.summary, item.rationale),
    }));
}

export function buildRiskCards(task: TaskAggregate, deliverable: Deliverable | null): RiskCardView[] {
  const cards = getStructuredObjectList(deliverable, "risk_cards");
  if (cards.length > 0) {
    return cards.map((item) => ({
      content: asString(item.content),
      severity: asString(item.severity, "medium"),
      likelihood: asString(item.likelihood, "medium"),
      impactExplanation: asString(item.impact_explanation),
    }));
  }

  return [...task.risks]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map((item) => ({
      content: item.title || item.description,
      severity: item.impact_level,
      likelihood: item.likelihood_level,
      impactExplanation: item.description,
    }));
}

export function buildActionItemCards(
  task: TaskAggregate,
  deliverable: Deliverable | null,
): ActionItemCardView[] {
  const cards = getStructuredObjectList(deliverable, "action_item_cards");
  if (cards.length > 0) {
    return cards.map((item) => ({
      content: asString(item.content),
      ownerRole: asString(item.owner_role, "任務負責人"),
      priority: asString(item.priority, "medium"),
      sequence: asString(item.sequence),
      dependencies: asStringArray(item.dependencies),
    }));
  }

  return [...task.action_items]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map((item) => ({
      content: item.description,
      ownerRole: item.suggested_owner || "任務負責人",
      priority: item.priority,
      sequence: inferActionSequence(item.priority, item.due_hint),
      dependencies: item.dependency_refs,
    }));
}

function buildMissingDataStatus(missingInformation: string[]) {
  if (missingInformation.length === 0) {
    return "否，目前沒有被明確標記的重大缺漏資料。";
  }

  return `是，目前仍有 ${missingInformation.length} 項缺漏；優先補充：${missingInformation[0]}`;
}

export function buildDecisionSnapshot(
  task: TaskAggregate,
  deliverable: Deliverable | null,
): DecisionSnapshotView {
  const executiveSummary = buildExecutiveSummary(task, deliverable);
  const recommendations = buildRecommendationCards(task, deliverable);
  const risks = buildRiskCards(task, deliverable);
  const missingInformation = getStructuredStringList(deliverable, "missing_information");

  return {
    conclusionLabel: "一句話結論",
    recommendationLabel: "最重要建議",
    riskLabel: "最主要風險",
    missingDataLabel: "是否仍有重大缺漏資料",
    conclusion: executiveSummary.coreJudgment || "目前尚未形成可供決策的核心判斷。",
    primaryRecommendation:
      recommendations[0]?.content || "目前尚未形成可直接採用的建議，建議先查看完整交付物。",
    primaryRisk: risks[0]?.content || "目前尚未標記明確的主要風險。",
    missingDataStatus: buildMissingDataStatus(missingInformation),
  };
}

export function buildWorkbenchObjectSummary(
  task: TaskAggregate,
  deliverable: Deliverable | null,
): WorkbenchObjectSummaryView {
  const ontologyContext = asRecord(deliverable?.content_structure?.ontology_context);
  const primaryEntity =
    task.client?.name?.trim() ||
    (typeof ontologyContext?.client_name === "string" ? ontologyContext.client_name : "") ||
    "尚未明確標示客戶";
  const engagement =
    task.engagement?.name?.trim() ||
    (typeof ontologyContext?.engagement_name === "string" ? ontologyContext.engagement_name : "") ||
    "尚未建立 engagement";
  const workstream =
    task.workstream?.name?.trim() ||
    (typeof ontologyContext?.workstream_name === "string" ? ontologyContext.workstream_name : "") ||
    "尚未建立 workstream";
  const decisionContext =
    task.decision_context?.title?.trim() ||
    task.decision_context?.judgment_to_make?.trim() ||
    buildDecisionContextSummary(task);
  const domainLensSummary =
    task.domain_lenses.length > 0 ? joinNaturalList(task.domain_lenses) : "綜合視角";
  const clientStage = task.client?.client_stage?.trim() || task.client_stage?.trim() || "未指定階段";
  const clientType = task.client?.client_type?.trim() || task.client_type?.trim() || "未指定型態";

  return {
    primaryEntity,
    engagement,
    workstream,
    decisionContext,
    domainLensSummary,
    clientContext: `${clientType} / ${clientStage}`,
    sourceSummary:
      task.source_materials.length > 0 || task.artifacts.length > 0 || task.evidence.length > 0
        ? `${task.source_materials.length} 份 source material、${task.artifacts.length} 份 artifact、${task.evidence.length} 則證據`
        : "目前仍主要依賴原始問題與背景脈絡。",
  };
}

export function buildSparseInputOperatingView(
  task: TaskAggregate,
  deliverable: Deliverable | null,
): SparseInputOperatingView {
  const operatingState = asRecord(deliverable?.content_structure?.sparse_input_operating_state);
  const readinessGovernance = asRecord(deliverable?.content_structure?.readiness_governance);
  const entryMode =
    (typeof operatingState?.input_entry_mode === "string" && operatingState.input_entry_mode) ||
    task.input_entry_mode;
  const deliverableClass =
    (typeof operatingState?.deliverable_class === "string" && operatingState.deliverable_class) ||
    (typeof readinessGovernance?.supported_deliverable_class === "string"
      ? readinessGovernance.supported_deliverable_class
      : task.deliverable_class_hint);
  const deliverableGuidance =
    (typeof operatingState?.summary === "string" && operatingState.summary) ||
    (typeof readinessGovernance?.deliverable_guidance === "string" && readinessGovernance.deliverable_guidance) ||
    task.sparse_input_summary;
  const externalResearchHeavy =
    Boolean(operatingState?.external_research_heavy_case) || task.external_research_heavy_candidate;

  return {
    entryModeLabel: labelForInputEntryMode(entryMode),
    deliverableClassLabel: labelForDeliverableClass(deliverableClass),
    summary:
      (typeof operatingState?.summary === "string" && operatingState.summary) ||
      task.sparse_input_summary,
    deliverableGuidance,
    externalResearchHeavy,
    presenceHighlights: getPresenceHighlights(task, deliverable),
  };
}

export function buildCapabilityFrame(
  task: TaskAggregate,
  deliverable: Deliverable | null,
): CapabilityFrameView {
  const capability = asRecord(deliverable?.content_structure?.capability_frame);
  const workflowMode = typeof capability?.execution_mode === "string" ? capability.execution_mode : task.mode;
  const selectedAgents = asStringArray(capability?.selected_agents);
  const prioritySources = asStringArray(capability?.priority_sources);

  return {
    capability:
      (typeof capability?.capability === "string" && capability.capability) || task.task_type,
    label:
      (typeof capability?.label === "string" && capability.label) ||
      (task.mode === "multi_agent" ? "收斂判斷" : "專家工作流"),
    framingSummary:
      (typeof capability?.framing_summary === "string" && capability.framing_summary) ||
      buildTaskFraming(task, assessTaskReadiness(task)).summary,
    executionMode: workflowMode,
    judgmentToMake:
      (typeof capability?.judgment_to_make === "string" && capability.judgment_to_make) ||
      buildDefaultJudgment(task),
    routingRationale: asStringArray(capability?.routing_rationale),
    selectedAgents,
    specialistAgent:
      (typeof capability?.specialist_agent === "string" && capability.specialist_agent) || "",
    prioritySources:
      prioritySources.length > 0
        ? prioritySources
        : [buildSourcePriority(task)],
    domainLenses:
      asStringArray(capability?.domain_lenses).length > 0
        ? asStringArray(capability?.domain_lenses)
        : task.domain_lenses,
    clientStage:
      (typeof capability?.client_stage === "string" && capability.client_stage) ||
      task.client_stage ||
      "未指定",
    clientType:
      (typeof capability?.client_type === "string" && capability.client_type) ||
      task.client_type ||
      "未指定",
  };
}

export function buildReadinessGovernance(
  task: TaskAggregate,
  deliverable: Deliverable | null,
  fallbackReadiness?: ReadinessAssessment,
): ReadinessGovernanceView {
  const readiness = fallbackReadiness ?? assessTaskReadiness(task);
  const governance = asRecord(deliverable?.content_structure?.readiness_governance);
  const missingInformation = asStringArray(governance?.missing_information);
  const visibleConstraints = getVisibleConstraints(task.constraints);
  const assumptions = task.assumptions.filter(Boolean);

  const level =
    (typeof governance?.level === "string" &&
      (governance.level === "ready" || governance.level === "caution" || governance.level === "degraded")
      ? governance.level
      : readiness.level) as ReadinessLevel;

  const decisionContextClear = Boolean(governance?.decision_context_clear);
  const domainContextClear = Boolean(governance?.domain_context_clear);
  const artifactCoverage =
    (typeof governance?.artifact_coverage === "string" && governance.artifact_coverage) ||
    (task.artifacts.length > 0 || task.source_materials.length > 0
      ? "已具備可引用的 artifacts / source materials，可支撐本輪判斷。"
      : "Artifacts / source materials 仍偏少，本輪較依賴問題描述與背景整理。");
  const evidenceCoverage =
    (typeof governance?.evidence_coverage === "string" && governance.evidence_coverage) ||
    readiness.evidenceStatus;
  const conclusionImpact = Array.isArray(governance?.conclusion_impact)
    ? governance.conclusion_impact
        .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
        .join(" ")
    : (typeof governance?.conclusion_impact === "string" && governance.conclusion_impact) ||
      (typeof governance?.deliverable_guidance === "string" && governance.deliverable_guidance) ||
      readiness.summary;

  return {
    level,
    label: getLevelLabel(level),
    summary: readiness.summary,
    decisionContextStatus: decisionContextClear
      ? "Decision context 已明確，可直接支撐本輪判斷。"
      : "Decision context 仍偏模糊，部分結論只能以暫定 framing 形成。",
    domainStatus: domainContextClear
      ? "Domain lens 已具備，系統知道應以哪些顧問視角優先判斷。"
      : "Domain lens 仍偏鬆散，部分結論仍可能偏向綜合性整理。",
    artifactStatus: artifactCoverage,
    evidenceStatus: evidenceCoverage,
    missingInformation:
      missingInformation.length > 0 ? missingInformation : readiness.missingItems,
    conclusionImpact,
    assumptionSignal:
      assumptions.length > 0
        ? `目前有 ${assumptions.length} 項假設會影響本輪結論的適用範圍。`
        : "目前沒有額外假設被明確寫入 shared state。",
    constraintSignal:
      visibleConstraints.length > 0
        ? `目前有 ${visibleConstraints.length} 項限制條件正在收斂這輪建議與風險判斷。`
        : "目前沒有明確限制條件在壓縮本輪結論。",
  };
}

export function buildOntologyChainSummary(
  task: TaskAggregate,
  deliverable: Deliverable | null,
): OntologyChainSummaryView {
  const summary = asRecord(deliverable?.content_structure?.ontology_chain_summary);

  return {
    client:
      (typeof summary?.client === "string" && summary.client) ||
      task.client?.name ||
      "尚未明確標示客戶",
    engagement:
      (typeof summary?.engagement === "string" && summary.engagement) ||
      task.engagement?.name ||
      "尚未建立 engagement",
    workstream:
      (typeof summary?.workstream === "string" && summary.workstream) ||
      task.workstream?.name ||
      "尚未建立 workstream",
    task:
      (typeof summary?.task === "string" && summary.task) || task.title,
    decisionContext:
      (typeof summary?.decision_context === "string" && summary.decision_context) ||
      task.decision_context?.title ||
      "尚未形成可讀的 decision context",
    artifactCount:
      typeof summary?.artifact_count === "number" ? summary.artifact_count : task.artifacts.length,
    sourceMaterialCount:
      typeof summary?.source_material_count === "number"
        ? summary.source_material_count
        : task.source_materials.length,
    evidenceCount:
      typeof summary?.evidence_count === "number" ? summary.evidence_count : task.evidence.length,
    recommendationCount:
      typeof summary?.recommendation_count === "number"
        ? summary.recommendation_count
        : task.recommendations.length,
    riskCount:
      typeof summary?.risk_count === "number" ? summary.risk_count : task.risks.length,
    actionItemCount:
      typeof summary?.action_item_count === "number"
        ? summary.action_item_count
        : task.action_items.length,
  };
}

export function buildExecutiveSummary(task: TaskAggregate, deliverable: Deliverable | null) {
  if (!deliverable) {
    return {
      summary: "尚未執行分析，請先檢查資料準備度，再啟動第一輪工作流。",
      coreJudgment: "系統尚未產出可供顧問閱讀的核心判斷。",
      bullets: [task.description || task.title, "系統尚未產出可供顧問閱讀的執行摘要。"].filter(Boolean),
    };
  }

  const explicitSummary = getStructuredString(deliverable, "executive_summary");
  const explicitJudgment = getStructuredString(deliverable, "core_judgment");
  const backgroundSummary =
    getStructuredString(deliverable, "background_summary") ||
    task.contexts[0]?.summary ||
    "目前尚未有可供引用的背景摘要。";
  const findings = getStructuredStringList(deliverable, "findings");
  const recommendations =
    task.recommendations.length > 0
      ? task.recommendations.map((item) => item.summary)
      : getStructuredStringList(deliverable, "recommendations");
  const risks =
    task.risks.length > 0
      ? task.risks.map((item) => item.description)
      : getStructuredStringList(deliverable, "risks");

  return {
    summary:
      explicitSummary ||
      "以下內容是目前最值得先讀的顧問式摘要，可直接用於內部討論與下一步判斷。",
    coreJudgment:
      explicitJudgment ||
      findings[0] ||
      recommendations[0] ||
      risks[0] ||
      "目前證據仍不足以形成高信心判斷。",
    bullets: [
      backgroundSummary,
      findings[0] ? `主要發現：${findings[0]}` : "",
      recommendations[0] ? `優先建議：${recommendations[0]}` : "",
      risks[0] ? `關鍵風險：${risks[0]}` : "",
    ].filter(Boolean),
  };
}

export function getGoalSuccessCriteria(goals: Goal[]) {
  return goals
    .map((item) => item.success_criteria?.trim())
    .filter((item): item is string => Boolean(item));
}
