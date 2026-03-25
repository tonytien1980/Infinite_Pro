import type {
  ArtifactEvidenceWorkspace,
  Constraint,
  Deliverable,
  DeliverableWorkspace,
  Evidence,
  Goal,
  MatterWorkspace,
  MatterWorkspaceSummary,
  SelectedAgent,
  SourceDocument,
  TaskAggregate,
  TaskListItem,
  PresenceStateItem,
} from "@/lib/types";
import {
  extractModeSpecificAppendix,
  getModeSpecificReadinessSignals,
  resolveWorkflowKey,
  type WorkflowKey,
} from "@/lib/workflow-modes";
import {
  labelForDeliverableClass,
  labelForDeliverableType,
  labelForDeliverableWorkspaceStatus,
  labelForEvidenceType,
  labelForInputEntryMode,
  labelForPresenceState,
  labelForSourceType,
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

export interface ObjectNavigationStripItemView {
  key: string;
  label: string;
  value: string;
  stateLabel: string;
  note: string;
  anchorId: string;
}

export interface ObjectNavigationStripView {
  items: ObjectNavigationStripItemView[];
  entryModeLabel: string;
  deliverableClassLabel: string;
  workspaceSummary: string;
  externalResearchHeavy: boolean;
  workspaceTone: "exploratory" | "review" | "decision";
}

export interface CapabilityFrameView {
  capability: string;
  label: string;
  framingSummary: string;
  executionMode: string;
  judgmentToMake: string;
  routingRationale: string[];
  hostAgent: string;
  selectedAgents: string[];
  selectedAgentDetails: Array<{
    agentId: string;
    agentName: string;
    agentType: string;
    reason: string;
    runtimeBinding: string | null;
  }>;
  agentResolverNotes: string[];
  agentSelectionRationale: string[];
  omittedAgentNotes: string[];
  deferredAgentNotes: string[];
  escalationNotes: string[];
  runtimeAgents: string[];
  selectedSupportingAgents: string[];
  specialistAgent: string;
  prioritySources: string[];
  domainLenses: string[];
  clientStage: string;
  clientType: string;
  selectedDomainPacks: string[];
  selectedIndustryPacks: string[];
  packResolverNotes: string[];
  packDeliverablePresets: string[];
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
  packEvidenceExpectations: string[];
  packHighImpactGaps: string[];
  packDeliverablePresets: string[];
  agentSelectionImplications: string[];
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

export interface WorkspaceMaterialCardView {
  title: string;
  summary: string;
  meta: string[];
  supportNotes: string[];
}

export interface EvidenceWorkspaceLaneView {
  summary: string;
  artifactCards: WorkspaceMaterialCardView[];
  sourceMaterialCards: WorkspaceMaterialCardView[];
  evidenceCards: WorkspaceMaterialCardView[];
  missingSignals: string[];
}

export interface DeliverableBacklinkView {
  summary: string;
  workspacePath: string;
  decisionContext: string;
  evidenceBasis: string;
  linkedOutputs: string[];
}

export interface TaskListWorkspaceSummaryView {
  objectPath: string;
  decisionContext: string;
  workspaceState: string;
  packSummary: string;
  agentSummary: string;
}

export interface MatterWorkspaceCardView {
  title: string;
  objectPath: string;
  decisionContext: string;
  continuity: string;
  activeWork: string;
  packSummary: string;
  agentSummary: string;
  counts: string[];
}

export interface MatterWorkspaceContinuityView {
  summary: string;
  readinessHint: string;
  decisionTrajectory: string[];
  relatedTaskHighlights: string[];
  deliverableHighlights: string[];
  materialHighlights: string[];
}

export interface ArtifactEvidenceWorkspaceView {
  summary: string;
  evidenceExpectations: string[];
  highImpactGaps: string[];
  deliverableLimitations: string[];
  artifactHighlights: string[];
  sourceMaterialHighlights: string[];
  evidenceHighlights: string[];
}

export interface DeliverableWorkspaceView {
  title: string;
  deliverableClassLabel: string;
  deliverableTypeLabel: string;
  workspaceStatusLabel: string;
  summary: string;
  confidenceSummary: string;
  limitations: string[];
  highImpactGaps: string[];
  evidenceBasisSummary: string;
  linkedOutputSummary: string[];
  continuityHighlights: string[];
  relatedDeliverableHighlights: string[];
}

export interface PackSelectionView {
  summary: string;
  domainPacks: string[];
  industryPacks: string[];
  resolverNotes: string[];
  evidenceExpectations: string[];
  keyKpis: string[];
  commonRisks: string[];
  decisionPatterns: string[];
  deliverablePresets: string[];
  domainPackCards: Array<{
    packName: string;
    definition: string;
    reason: string;
    problemPatterns: string[];
    keySignals: string[];
    commonRisks: string[];
    boundaries: string[];
    rationale: string[];
    packNotes: string[];
  }>;
  industryPackCards: Array<{
    packName: string;
    definition: string;
    reason: string;
    businessModels: string[];
    keyKpis: string[];
    decisionPatterns: string[];
    commonRisks: string[];
    packNotes: string[];
  }>;
}

function isExternalDataStrategyConstraint(constraint: Constraint) {
  return constraint.constraint_type === "external_data_strategy";
}

function isExtensionOverrideConstraint(constraint: Constraint) {
  return ["pack_override", "agent_override"].includes(constraint.constraint_type);
}

export function getVisibleConstraints(constraints: Constraint[]) {
  return constraints.filter(
    (constraint) =>
      !isExternalDataStrategyConstraint(constraint) && !isExtensionOverrideConstraint(constraint),
  );
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

function uniqueStrings(items: string[]) {
  return Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));
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

function asSelectedAgentArray(value: unknown): SelectedAgent[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is SelectedAgent =>
      Boolean(
        item &&
          typeof item === "object" &&
          "agent_id" in item &&
          typeof (item as { agent_id?: unknown }).agent_id === "string",
      ),
  );
}

function buildPackSummary(domainPacks: string[], industryPacks: string[]) {
  if (domainPacks.length === 0 && industryPacks.length === 0) {
    return "目前尚未選到任何模組包，這輪仍以通用工作鏈為主。";
  }

  const parts: string[] = [];
  if (domainPacks.length > 0) {
    parts.push(`問題面向模組包：${joinNaturalList(domainPacks)}`);
  }
  if (industryPacks.length > 0) {
    parts.push(`產業模組包：${joinNaturalList(industryPacks)}`);
  }
  return parts.join("；");
}

function getPackResolutionRecord(task: TaskAggregate, deliverable: Deliverable | null) {
  const selectedPacks = asRecord(deliverable?.content_structure?.selected_packs);
  const fromDeliverable = selectedPacks
      ? {
        selected_domain_packs: Array.isArray(selectedPacks.selected_domain_packs)
          ? selectedPacks.selected_domain_packs
          : [],
        selected_industry_packs: Array.isArray(selectedPacks.selected_industry_packs)
          ? selectedPacks.selected_industry_packs
          : [],
        resolver_notes: asStringArray(selectedPacks.resolver_notes),
        evidence_expectations: asStringArray(selectedPacks.evidence_expectations),
        key_kpis_or_operating_signals: asStringArray(
          selectedPacks.key_kpis_or_operating_signals,
        ),
        key_kpis: asStringArray(selectedPacks.key_kpis),
        common_risks: asStringArray(selectedPacks.common_risks),
        decision_patterns: asStringArray(selectedPacks.decision_patterns),
        deliverable_presets: asStringArray(selectedPacks.deliverable_presets),
      }
    : null;

  return (
    fromDeliverable ?? {
      selected_domain_packs: task.pack_resolution.selected_domain_packs,
      selected_industry_packs: task.pack_resolution.selected_industry_packs,
      resolver_notes: task.pack_resolution.resolver_notes,
      evidence_expectations: task.pack_resolution.evidence_expectations,
      key_kpis_or_operating_signals: task.pack_resolution.key_kpis_or_operating_signals,
      key_kpis: task.pack_resolution.key_kpis,
      common_risks: task.pack_resolution.common_risks,
      decision_patterns: task.pack_resolution.decision_patterns,
      deliverable_presets: task.pack_resolution.deliverable_presets,
    }
  );
}

export function buildPackSelectionView(
  task: TaskAggregate,
  deliverable: Deliverable | null,
): PackSelectionView {
  const packResolution = getPackResolutionRecord(task, deliverable);
  const domainPacks = (packResolution.selected_domain_packs as Array<Record<string, unknown>>)
    .map((item) => asString(item.pack_name))
    .filter(Boolean);
  const industryPacks = (packResolution.selected_industry_packs as Array<Record<string, unknown>>)
    .map((item) => asString(item.pack_name))
    .filter(Boolean);
  const domainPackCards = (packResolution.selected_domain_packs as Array<Record<string, unknown>>)
    .map((item) => ({
      packName: asString(item.pack_name),
      definition:
        asString(item.domain_definition) || asString(item.industry_definition) || asString(item.description),
      reason: asString(item.reason),
      problemPatterns: asStringArray(item.common_problem_patterns),
      keySignals:
        asStringArray(item.key_kpis_or_operating_signals).length > 0
          ? asStringArray(item.key_kpis_or_operating_signals)
          : asStringArray(item.key_kpis),
      commonRisks: asStringArray(item.common_risks),
      boundaries: asStringArray(item.scope_boundaries),
      rationale: asStringArray(item.pack_rationale),
      packNotes: asStringArray(item.pack_notes),
    }))
    .filter((item) => item.packName);
  const industryPackCards = (packResolution.selected_industry_packs as Array<Record<string, unknown>>)
    .map((item) => ({
      packName: asString(item.pack_name),
      definition: asString(item.industry_definition) || asString(item.description),
      reason: asString(item.reason),
      businessModels: asStringArray(item.common_business_models),
      keyKpis: asStringArray(item.key_kpis),
      decisionPatterns: asStringArray(item.decision_patterns),
      commonRisks: asStringArray(item.common_risks),
      packNotes: asStringArray(item.pack_notes),
    }))
    .filter((item) => item.packName);

  return {
    summary: buildPackSummary(domainPacks, industryPacks),
    domainPacks,
    industryPacks,
    resolverNotes: packResolution.resolver_notes,
    evidenceExpectations: packResolution.evidence_expectations,
    keyKpis:
      asStringArray(packResolution.key_kpis_or_operating_signals).length > 0
        ? asStringArray(packResolution.key_kpis_or_operating_signals)
        : packResolution.key_kpis,
    commonRisks: packResolution.common_risks,
    decisionPatterns: packResolution.decision_patterns,
    deliverablePresets: packResolution.deliverable_presets,
    domainPackCards,
    industryPackCards,
  };
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
      const label = key === "decision_context" ? "決策問題" : key.replaceAll("_", " ");
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
        ? `${task.source_materials.length} 份來源材料、${task.artifacts.length} 份工作物件、${task.evidence.length} 則證據`
        : "目前仍主要依賴原始問題與背景脈絡。",
  };
}

function resolveWorkspaceTone(deliverableClass: string): "exploratory" | "review" | "decision" {
  if (deliverableClass === "decision_action_deliverable") {
    return "decision";
  }
  if (deliverableClass === "assessment_review_memo") {
    return "review";
  }
  return "exploratory";
}

function buildPresenceNote(item: PresenceStateItem, fallback: string) {
  return item.reason.trim() || fallback;
}

function buildObjectNavigationItem({
  key,
  label,
  value,
  item,
  anchorId,
  fallbackNote,
}: {
  key: string;
  label: string;
  value: string;
  item: PresenceStateItem;
  anchorId: string;
  fallbackNote: string;
}): ObjectNavigationStripItemView {
  return {
    key,
    label,
    value: value.trim() || "尚未建立",
    stateLabel: labelForPresenceState(item.state),
    note: buildPresenceNote(item, fallbackNote),
    anchorId,
  };
}

export function buildObjectNavigationStrip(
  task: TaskAggregate,
  deliverable: Deliverable | null,
): ObjectNavigationStripView {
  const operatingState = asRecord(deliverable?.content_structure?.sparse_input_operating_state);
  const sparseInput = buildSparseInputOperatingView(task, deliverable);
  const workbenchSummary = buildWorkbenchObjectSummary(task, deliverable);
  const tone = resolveWorkspaceTone(
    (typeof operatingState?.deliverable_class === "string" && operatingState.deliverable_class) ||
      task.deliverable_class_hint,
  );
  const client = task.presence_state_summary.client;
  const engagement = task.presence_state_summary.engagement;
  const workstream = task.presence_state_summary.workstream;
  const decisionContext = task.presence_state_summary.decision_context;

  return {
    items: [
      buildObjectNavigationItem({
        key: "client",
        label: "Client",
        value: workbenchSummary.primaryEntity,
        item: client,
        anchorId: "workspace-lane",
        fallbackNote: "這個工作面目前的 client 主體。",
      }),
      buildObjectNavigationItem({
        key: "engagement",
        label: "案件委託",
        value: workbenchSummary.engagement,
        item: engagement,
        anchorId: "workspace-lane",
        fallbackNote: "這個工作面目前的 engagement 層。",
      }),
      buildObjectNavigationItem({
        key: "workstream",
        label: "工作流",
        value: workbenchSummary.workstream,
        item: workstream,
        anchorId: "workspace-lane",
        fallbackNote: "這個工作面目前聚焦的 workstream。",
      }),
      buildObjectNavigationItem({
        key: "decision_context",
        label: "決策問題",
        value: workbenchSummary.decisionContext,
        item: decisionContext,
        anchorId: "decision-context",
        fallbackNote: "這一輪要形成的判斷主軸。",
      }),
      {
        key: "deliverable",
        label: "交付等級",
        value: sparseInput.deliverableClassLabel,
        stateLabel: sparseInput.entryModeLabel,
        note: sparseInput.deliverableGuidance,
        anchorId: "deliverable-surface",
      },
    ],
    entryModeLabel: sparseInput.entryModeLabel,
    deliverableClassLabel: sparseInput.deliverableClassLabel,
    workspaceSummary: sparseInput.externalResearchHeavy
      ? "目前是外部研究導向的探索級工作面。系統會先建立暫定案件世界，優先形成外部態勢判斷與待驗證事項，而不是假裝已有公司內部確定性。"
      : tone === "exploratory"
        ? "目前這是一個探索級工作面。Host 會先把稀疏輸入收斂成暫定案件世界，再形成第一輪探索型交付。"
        : tone === "review"
          ? "目前這是一個文件中心的審閱 / 評估工作面。系統會先圍繞現有工作物件與來源材料形成可採用的審閱或評估結果。"
          : "目前這是一個決策 / 行動級工作面。Client、workstream、decision context 與 evidence 鏈已足以支撐較完整的 decision deliverable。",
    externalResearchHeavy: sparseInput.externalResearchHeavy,
    workspaceTone: tone,
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

function normalizeReference(value: string) {
  return value.trim().toLowerCase();
}

function matchesEvidenceRef(evidence: Evidence, ref: string) {
  const normalizedRef = normalizeReference(ref);
  if (!normalizedRef) {
    return false;
  }

  const candidates = [
    evidence.id,
    evidence.title,
    evidence.source_ref ?? "",
    evidence.source_document_id ?? "",
  ]
    .map(normalizeReference)
    .filter(Boolean);

  return candidates.some(
    (candidate) =>
      candidate === normalizedRef ||
      candidate.includes(normalizedRef) ||
      normalizedRef.includes(candidate),
  );
}

function buildEvidenceSupportCounts(task: TaskAggregate) {
  const usableEvidence = getUsableEvidence(task.evidence);
  const counts = new Map<
    string,
    {
      recommendations: number;
      risks: number;
      actionItems: number;
    }
  >();

  usableEvidence.forEach((item) => {
    counts.set(item.id, { recommendations: 0, risks: 0, actionItems: 0 });
  });

  task.recommendations.forEach((recommendation) => {
    usableEvidence
      .filter((evidence) =>
        (
          recommendation.supporting_evidence_ids.length > 0
            ? recommendation.supporting_evidence_ids.includes(evidence.id)
            : recommendation.based_on_refs.some((ref) => matchesEvidenceRef(evidence, ref))
        ),
      )
      .forEach((evidence) => {
        const bucket = counts.get(evidence.id);
        if (bucket) {
          bucket.recommendations += 1;
        }
      });
  });

  task.risks.forEach((risk) => {
    usableEvidence
      .filter((evidence) =>
        (
          risk.supporting_evidence_ids.length > 0
            ? risk.supporting_evidence_ids.includes(evidence.id)
            : risk.evidence_refs.some((ref) => matchesEvidenceRef(evidence, ref))
        ),
      )
      .forEach((evidence) => {
        const bucket = counts.get(evidence.id);
        if (bucket) {
          bucket.risks += 1;
        }
      });
  });

  task.action_items.forEach((actionItem) => {
    usableEvidence
      .filter((evidence) =>
        (
          actionItem.supporting_evidence_ids.length > 0
            ? actionItem.supporting_evidence_ids.includes(evidence.id)
            : actionItem.dependency_refs.some((ref) => matchesEvidenceRef(evidence, ref))
        ),
      )
      .forEach((evidence) => {
        const bucket = counts.get(evidence.id);
        if (bucket) {
          bucket.actionItems += 1;
        }
      });
  });

  return counts;
}

function buildEvidenceSupportNote(
  task: TaskAggregate,
  evidence: Evidence,
  counts: Map<string, { recommendations: number; risks: number; actionItems: number }>,
) {
  const bucket = counts.get(evidence.id);
  if (!bucket || (!bucket.recommendations && !bucket.risks && !bucket.actionItems)) {
    return ["目前主要作為背景或 supporting evidence 使用。"];
  }

  const notes: string[] = [];
  if (bucket.recommendations > 0) {
    notes.push(`支撐 ${bucket.recommendations} 項建議`);
  }
  if (bucket.risks > 0) {
    notes.push(`支撐 ${bucket.risks} 項風險`);
  }
  if (bucket.actionItems > 0) {
    notes.push(`支撐 ${bucket.actionItems} 項行動`);
  }
  return [notes.join(" / ")];
}

export function buildEvidenceWorkspaceLane(
  task: TaskAggregate,
  deliverable: Deliverable | null,
  readiness: ReadinessGovernanceView | null,
): EvidenceWorkspaceLaneView {
  const sparseInput = buildSparseInputOperatingView(task, deliverable);
  const supportCounts = buildEvidenceSupportCounts(task);
  const usableEvidence = getUsableEvidence(task.evidence);
  const artifactPresence = task.presence_state_summary.artifact;
  const sourcePresence = task.presence_state_summary.source_material;
  const decisionPresence = task.presence_state_summary.decision_context;
  const missingSignals = [
    artifactPresence.state !== "explicit" ? `工作物件：${artifactPresence.reason}` : "",
    sourcePresence.state !== "explicit" ? `SourceMaterial：${sourcePresence.reason}` : "",
    decisionPresence.state !== "explicit" ? `DecisionContext：${decisionPresence.reason}` : "",
    ...(readiness?.packHighImpactGaps.slice(0, 2) ?? []),
    ...(readiness?.missingInformation.slice(0, 3) ?? []),
  ].filter(Boolean);

  return {
    summary: sparseInput.externalResearchHeavy
      ? "目前這條工作面以外部研究與補充證據為主，尚未進入公司情境主導的工作物件分析鏈。"
      : task.artifacts.length > 0 || task.source_materials.length > 0 || usableEvidence.length > 0
        ? `目前這輪判斷依附於 ${task.artifacts.length} 份工作物件、${task.source_materials.length} 份來源材料與 ${usableEvidence.length} 則可用證據。`
        : "目前仍主要依賴原始問題與背景脈絡，尚未形成厚實的工作物件 / 來源材料 / 證據工作鏈。",
    artifactCards:
      task.artifacts.length > 0
        ? task.artifacts.slice(0, 4).map((artifact) => ({
            title: artifact.title || "未命名工作物件",
            summary:
              artifact.description.trim() ||
              "目前沒有額外工作物件說明，後續可再補這份材料的角色與用途。",
            meta: ["工作物件", artifact.artifact_type || "未分類"],
            supportNotes: [
              artifact.source_material_id
                ? "已連回來源材料"
                : artifact.source_document_id
                  ? "由原始來源文件建立"
                  : "目前仍是獨立工作物件",
            ],
          }))
        : [],
    sourceMaterialCards:
      task.source_materials.length > 0
        ? task.source_materials.slice(0, 4).map((material) => ({
            title: material.title || "未命名 SourceMaterial",
            summary:
              material.summary.trim() ||
              "目前沒有可顯示的來源材料摘要，後續可補更完整的來源摘要。",
            meta: [labelForSourceType(material.source_type), material.ingest_status || "未標示狀態"],
            supportNotes: [material.source_ref ? `來源：${material.source_ref}` : "目前沒有來源參照"],
          }))
        : [],
    evidenceCards:
      usableEvidence.length > 0
        ? usableEvidence.slice(0, 5).map((evidence) => ({
            title: evidence.title,
            summary: evidence.excerpt_or_summary,
            meta: [
              labelForEvidenceType(evidence.evidence_type),
              labelForSourceType(evidence.source_type),
              evidence.reliability_level || "未標示可靠度",
            ],
            supportNotes: buildEvidenceSupportNote(task, evidence, supportCounts),
          }))
        : [],
    missingSignals: uniqueStrings(missingSignals),
  };
}

export function buildDeliverableBacklinkView(
  task: TaskAggregate,
  deliverable: Deliverable | null,
): DeliverableBacklinkView {
  const workbenchSummary = buildWorkbenchObjectSummary(task, deliverable);
  const ontologyChain = buildOntologyChainSummary(task, deliverable);
  const sparseInput = buildSparseInputOperatingView(task, deliverable);
  const linkedObjects = deliverable?.linked_objects ?? [];
  const linkedEvidence = linkedObjects.filter((item) => item.object_type === "evidence");
  const linkedRecommendations = linkedObjects.filter((item) => item.object_type === "recommendation");
  const linkedRisks = linkedObjects.filter((item) => item.object_type === "risk");
  const linkedActionItems = linkedObjects.filter((item) => item.object_type === "action_item");
  const linkedWorkstream = linkedObjects.find((item) => item.object_type === "workstream");
  const linkedEngagement = linkedObjects.find((item) => item.object_type === "engagement");
  const linkedClient = linkedObjects.find((item) => item.object_type === "client");
  const linkedDecisionContext = linkedObjects.find((item) => item.object_type === "decision_context");
  const workspacePath = [
    linkedClient?.object_label || workbenchSummary.primaryEntity,
    linkedEngagement?.object_label || workbenchSummary.engagement,
    linkedWorkstream?.object_label || workbenchSummary.workstream,
  ].join(" / ");

  return {
    summary: sparseInput.externalResearchHeavy
      ? `這份 ${sparseInput.deliverableClassLabel} 先對應到「${workbenchSummary.decisionContext}」的外部態勢判斷，尚未聲稱已完整對齊公司情境工作世界。`
      : `這份 ${sparseInput.deliverableClassLabel} 目前掛在「${workbenchSummary.workstream}」工作鏈上，圍繞「${workbenchSummary.decisionContext}」形成交付結果。`,
    workspacePath,
    decisionContext: linkedDecisionContext?.object_label || workbenchSummary.decisionContext,
    evidenceBasis:
      linkedEvidence.length > 0
        ? `目前有 ${linkedEvidence.length} 則正式回鏈的證據支撐這份交付物，來源來自 ${ontologyChain.sourceMaterialCount} 份來源材料與 ${ontologyChain.artifactCount} 份工作物件。`
        : ontologyChain.evidenceCount > 0
          ? `目前有 ${ontologyChain.evidenceCount} 則證據支撐這份交付物，來源來自 ${ontologyChain.sourceMaterialCount} 份來源材料與 ${ontologyChain.artifactCount} 份工作物件。`
        : "目前證據鏈仍偏薄，這份交付物較依賴問題 framing、背景脈絡與暫定工作世界。",
    linkedOutputs: [
      `${linkedRecommendations.length || ontologyChain.recommendationCount} 項建議`,
      `${linkedRisks.length || ontologyChain.riskCount} 項風險`,
      `${linkedActionItems.length || ontologyChain.actionItemCount} 項行動項目`,
    ],
  };
}

export function buildTaskListWorkspaceSummary(task: TaskListItem): TaskListWorkspaceSummaryView {
  const clientLabel =
    task.client_name ||
    [task.client_type, task.client_stage].filter(Boolean).join(" / ") ||
    "未明示客戶";
  const path = [
    clientLabel,
    task.engagement_name || "暫定案件委託",
    task.workstream_name || "暫定工作流",
  ].join(" / ");

  const stateParts = [
    labelForInputEntryMode(task.input_entry_mode),
    labelForDeliverableClass(task.deliverable_class_hint),
  ];
  if (task.external_research_heavy_candidate) {
    stateParts.push("外部研究主導");
  }

  return {
    objectPath: path,
    decisionContext:
      task.decision_context_title || task.description || task.title,
    workspaceState: stateParts.join("｜"),
    packSummary:
      task.pack_summary?.trim() ||
      (task.selected_pack_names.length > 0
        ? `模組包：${joinNaturalList(task.selected_pack_names.slice(0, 3))}`
        : "目前尚未選到模組包"),
    agentSummary:
      task.agent_summary?.trim() ||
      (task.selected_agent_names.length > 0
        ? `代理：${joinNaturalList(task.selected_agent_names.slice(0, 3))}`
        : "目前仍以 Host 的最小協調脈絡為主"),
  };
}

export function buildMatterWorkspaceCard(
  matter: MatterWorkspaceSummary,
): MatterWorkspaceCardView {
  return {
    title: matter.title,
    objectPath: matter.object_path,
    decisionContext:
      matter.current_decision_context_title ||
      matter.current_decision_context_summary ||
      "目前尚未形成清楚的決策問題。",
    continuity: matter.continuity_summary,
    activeWork: matter.active_work_summary,
    packSummary:
      matter.selected_pack_names.length > 0
        ? `模組包：${joinNaturalList(matter.selected_pack_names.slice(0, 4))}`
        : "目前尚未形成可顯示的模組包脈絡。",
    agentSummary:
      matter.selected_agent_names.length > 0
        ? `代理：${joinNaturalList(matter.selected_agent_names.slice(0, 4))}`
        : "目前尚未形成可顯示的代理脈絡。",
    counts: [
      `${matter.total_task_count} 筆工作紀錄`,
      `${matter.deliverable_count} 份交付物`,
      `${matter.artifact_count} 份工作物件`,
      `${matter.source_material_count} 份來源材料`,
    ],
  };
}

export function buildMatterWorkspaceContinuity(
  matter: MatterWorkspace,
): MatterWorkspaceContinuityView {
  const summary = matter.summary;
  return {
    summary: `${summary.continuity_summary} ${summary.active_work_summary}`.trim(),
    readinessHint: matter.readiness_hint,
    decisionTrajectory: matter.decision_trajectory
      .slice(0, 5)
      .map(
        (item) =>
          `${item.decision_context_title}｜${item.judgment_to_make}｜${labelForDeliverableClass(item.deliverable_class_hint)}`,
      ),
    relatedTaskHighlights: matter.related_tasks
      .slice(0, 5)
      .map((item) => `${item.title}｜${item.latest_deliverable_title ?? "尚未產生交付物"}`),
    deliverableHighlights: matter.related_deliverables
      .slice(0, 5)
      .map((item) => `${item.title}｜${item.task_title}`),
    materialHighlights: [
      ...matter.related_artifacts
        .slice(0, 3)
        .map((item) => `工作物件｜${item.title}｜${item.task_title}`),
      ...matter.related_source_materials
        .slice(0, 3)
        .map((item) => `來源材料｜${item.title}｜${item.task_title}`),
    ],
  };
}

export function buildArtifactEvidenceWorkspaceView(
  workspace: ArtifactEvidenceWorkspace,
): ArtifactEvidenceWorkspaceView {
  return {
    summary: workspace.sufficiency_summary,
    evidenceExpectations: workspace.evidence_expectations,
    highImpactGaps: workspace.high_impact_gaps,
    deliverableLimitations: workspace.deliverable_limitations,
    artifactHighlights: workspace.artifact_cards
      .slice(0, 5)
      .map(
        (item) =>
          `${item.title}｜${item.role_label}｜${item.linked_evidence_count} 則證據 / ${item.linked_output_count} 項輸出`,
      ),
    sourceMaterialHighlights: workspace.source_material_cards
      .slice(0, 5)
      .map(
        (item) =>
          `${item.title}｜${item.role_label}｜${item.linked_evidence_count} 則證據 / ${item.linked_output_count} 項輸出`,
      ),
    evidenceHighlights: workspace.evidence_chains
      .slice(0, 6)
      .map((item) => {
        const supportCount =
          item.linked_recommendations.length +
          item.linked_risks.length +
          item.linked_action_items.length;
        return `${item.evidence.title}｜${item.strength_label}｜支撐 ${supportCount} 項決策輸出`;
      }),
  };
}

export function buildDeliverableWorkspaceView(
  workspace: DeliverableWorkspace,
): DeliverableWorkspaceView {
  const deliverable = workspace.deliverable;
  const task = workspace.task;
  const workbenchSummary = buildWorkbenchObjectSummary(task, deliverable);
  const linkedOutputSummary = [
    `${workspace.linked_recommendations.length} 項建議`,
    `${workspace.linked_risks.length} 項風險`,
    `${workspace.linked_action_items.length} 項行動項目`,
  ];

  const summary =
    getStructuredString(deliverable, "executive_summary") ||
    getStructuredString(deliverable, "core_judgment") ||
    getStructuredString(deliverable, "background_summary") ||
    `這份交付物目前圍繞「${workbenchSummary.decisionContext}」形成正式交付物。`;

  const evidenceBasisSummary =
    workspace.linked_evidence.length > 0
      ? `目前已正式回鏈 ${workspace.linked_evidence.length} 則證據、${workspace.linked_source_materials.length} 份來源材料、${workspace.linked_artifacts.length} 份工作物件。`
      : "目前依據來源仍偏薄，建議回到來源 / 證據工作面補齊主要依據。";

  return {
    title: deliverable.title,
    deliverableClassLabel: labelForDeliverableClass(workspace.deliverable_class),
    deliverableTypeLabel: labelForDeliverableType(deliverable.deliverable_type),
    workspaceStatusLabel: labelForDeliverableWorkspaceStatus(workspace.workspace_status),
    summary,
    confidenceSummary: workspace.confidence_summary,
    limitations: workspace.limitation_notes,
    highImpactGaps: workspace.high_impact_gaps,
    evidenceBasisSummary,
    linkedOutputSummary,
    continuityHighlights: workspace.continuity_notes,
    relatedDeliverableHighlights: workspace.related_deliverables.map(
      (item) => `${item.title}｜${item.task_title}`,
    ),
  };
}

export function buildCapabilityFrame(
  task: TaskAggregate,
  deliverable: Deliverable | null,
): CapabilityFrameView {
  const capability = asRecord(deliverable?.content_structure?.capability_frame);
  const packSelection = buildPackSelectionView(task, deliverable);
  const workflowMode = typeof capability?.execution_mode === "string" ? capability.execution_mode : task.mode;
  const selectedAgents = asStringArray(capability?.selected_agents);
  const selectedAgentDetails = asSelectedAgentArray(capability?.selected_agent_details);
  const prioritySources = asStringArray(capability?.priority_sources);
  const aggregateAgentSelection = task.agent_selection;
  const selectedAgentIds =
    selectedAgents.length > 0 ? selectedAgents : aggregateAgentSelection.selected_agent_ids;
  const selectedAgentDetailViews =
    selectedAgentDetails.length > 0
      ? selectedAgentDetails.map((item) => ({
          agentId: item.agent_id,
          agentName: item.agent_name,
          agentType: item.agent_type,
          reason: item.reason,
          runtimeBinding: item.runtime_binding,
        }))
      : [
          ...aggregateAgentSelection.selected_reasoning_agents,
          ...aggregateAgentSelection.selected_specialist_agents,
        ].map((item) => ({
          agentId: item.agent_id,
          agentName: item.agent_name,
          agentType: item.agent_type,
          reason: item.reason,
          runtimeBinding: item.runtime_binding,
        }));
  const agentResolverNotes = asStringArray(capability?.agent_resolver_notes);
  const agentSelectionRationale = asStringArray(capability?.agent_selection_rationale);
  const omittedAgentNotes = asStringArray(capability?.omitted_agent_notes);
  const deferredAgentNotes = asStringArray(capability?.deferred_agent_notes);
  const escalationNotes = asStringArray(capability?.escalation_notes);
  const runtimeAgents =
    asStringArray(capability?.runtime_agents).length > 0
      ? asStringArray(capability?.runtime_agents)
      : Array.from(
          new Set(
            selectedAgentDetailViews
              .map((item) => item.runtimeBinding)
              .filter((item): item is string => Boolean(item)),
          ),
        );
  const selectedSupportingAgents =
    asStringArray(capability?.selected_supporting_agents).length > 0
      ? asStringArray(capability?.selected_supporting_agents)
      : runtimeAgents.slice(1);
  const hostAgent =
    (typeof capability?.host_agent === "string" && capability.host_agent) ||
    aggregateAgentSelection.host_agent?.agent_id ||
    "host_agent";

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
    hostAgent,
    selectedAgents: selectedAgentIds,
    selectedAgentDetails: selectedAgentDetailViews,
    agentResolverNotes:
      agentResolverNotes.length > 0
        ? agentResolverNotes
        : aggregateAgentSelection.resolver_notes,
    agentSelectionRationale:
      agentSelectionRationale.length > 0
        ? agentSelectionRationale
        : aggregateAgentSelection.rationale,
    omittedAgentNotes:
      omittedAgentNotes.length > 0
        ? omittedAgentNotes
        : aggregateAgentSelection.omitted_agent_notes,
    deferredAgentNotes:
      deferredAgentNotes.length > 0
        ? deferredAgentNotes
        : aggregateAgentSelection.deferred_agent_notes,
    escalationNotes:
      escalationNotes.length > 0
        ? escalationNotes
        : aggregateAgentSelection.escalation_notes,
    runtimeAgents,
    selectedSupportingAgents,
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
    selectedDomainPacks:
      asStringArray(capability?.selected_domain_pack_ids).length > 0
        ? packSelection.domainPacks
        : packSelection.domainPacks,
    selectedIndustryPacks:
      asStringArray(capability?.selected_industry_pack_ids).length > 0
        ? packSelection.industryPacks
        : packSelection.industryPacks,
    packResolverNotes:
      asStringArray(capability?.pack_resolver_notes).length > 0
        ? asStringArray(capability?.pack_resolver_notes)
        : packSelection.resolverNotes,
    packDeliverablePresets:
      asStringArray(capability?.pack_deliverable_presets).length > 0
        ? asStringArray(capability?.pack_deliverable_presets)
        : packSelection.deliverablePresets,
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
  const packSelection = buildPackSelectionView(task, deliverable);
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
      ? "已具備可引用的工作物件 / 來源材料，可支撐本輪判斷。"
      : "可引用的工作物件 / 來源材料仍偏少，本輪較依賴問題描述與背景整理。");
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
  const agentSelectionImplications = asStringArray(governance?.agent_selection_implications);

  return {
    level,
    label: getLevelLabel(level),
    summary: readiness.summary,
    decisionContextStatus: decisionContextClear
      ? "決策問題已明確，可直接支撐本輪判斷。"
      : "決策問題仍偏模糊，部分結論只能以暫定 framing 形成。",
    domainStatus: domainContextClear
      ? "問題面向已具備，系統知道應以哪些顧問視角優先判斷。"
      : "問題面向仍偏鬆散，部分結論仍可能偏向綜合性整理。",
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
    packEvidenceExpectations:
      asStringArray(governance?.pack_evidence_expectations).length > 0
        ? asStringArray(governance?.pack_evidence_expectations)
        : packSelection.evidenceExpectations,
    packHighImpactGaps: asStringArray(governance?.pack_high_impact_gaps),
    packDeliverablePresets:
      asStringArray(governance?.pack_deliverable_presets).length > 0
        ? asStringArray(governance?.pack_deliverable_presets)
        : packSelection.deliverablePresets,
    agentSelectionImplications,
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
