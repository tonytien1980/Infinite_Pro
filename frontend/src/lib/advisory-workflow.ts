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
  const workflowKey = resolveWorkflowKey(task.task_type, task.mode);

  const labelsByMode: Record<WorkflowKey, Omit<DecisionSnapshotView, "conclusion" | "primaryRecommendation" | "primaryRisk" | "missingDataStatus">> = {
    research_synthesis: {
      conclusionLabel: "一句話研究結論",
      recommendationLabel: "最重要建議",
      riskLabel: "最主要風險",
      missingDataLabel: "是否仍有重大研究缺口",
    },
    contract_review: {
      conclusionLabel: "一句話審閱結論",
      recommendationLabel: "最重要 redline 建議",
      riskLabel: "最主要高風險議題",
      missingDataLabel: "是否仍缺關鍵附件 / 條款",
    },
    document_restructuring: {
      conclusionLabel: "一句話重組判斷",
      recommendationLabel: "最重要重組建議",
      riskLabel: "最主要重構風險",
      missingDataLabel: "是否仍有重大缺稿或缺資訊",
    },
    multi_agent: {
      conclusionLabel: "一句話收斂結論",
      recommendationLabel: "最重要建議 / 優先路徑",
      riskLabel: "最主要決策風險",
      missingDataLabel: "是否仍缺重大決策資料",
    },
  };

  const labels = labelsByMode[workflowKey];

  return {
    ...labels,
    conclusion: executiveSummary.coreJudgment || "目前尚未形成可供決策的核心判斷。",
    primaryRecommendation:
      recommendations[0]?.content || "目前尚未形成可直接採用的建議，建議先查看完整交付物。",
    primaryRisk: risks[0]?.content || "目前尚未標記明確的主要風險。",
    missingDataStatus: buildMissingDataStatus(missingInformation),
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
