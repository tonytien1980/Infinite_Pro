import type { Deliverable, TaskAggregate, TaskType } from "@/lib/types";

export type WorkflowKey =
  | "research_synthesis"
  | "contract_review"
  | "document_restructuring"
  | "multi_agent";

type WorkflowInputType = "input" | "textarea" | "select";

interface WorkflowOption {
  value: string;
  label: string;
}

export interface WorkflowFieldDefinition {
  key: string;
  label: string;
  inputType: WorkflowInputType;
  placeholder?: string;
  options?: WorkflowOption[];
  requiredForReadiness?: boolean;
}

interface WorkflowModeDefinition {
  title: string;
  description: string;
  fields: WorkflowFieldDefinition[];
}

export interface WorkflowModeSection {
  title: string;
  description: string;
  items: string[];
  emptyText: string;
  translateAsAgentIds?: boolean;
}

export interface WorkflowModeAppendix {
  workflowKey: WorkflowKey | null;
  backgroundText: string;
  values: Record<string, string>;
}

const APPENDIX_START = "【工作流進件補充｜";
const APPENDIX_END = "【/工作流進件補充】";

export const WORKFLOW_MODE_DEFINITIONS: Record<WorkflowKey, WorkflowModeDefinition> = {
  contract_review: {
    title: "合約審閱補充設定",
    description: "把審閱目的、我方立場與期望輸出講清楚，Host 與 specialist 才能更像真實顧問 / 法務協作。",
    fields: [
      {
        key: "review_purpose",
        label: "審閱目的",
        inputType: "textarea",
        placeholder: "例如：快速找出不可接受風險、支援內部談判、先做管理層 issue spotting",
        requiredForReadiness: true,
      },
      {
        key: "party_position",
        label: "我方身份 / 立場",
        inputType: "input",
        placeholder: "例如：供應商、採購方、合作提案方、投資方",
        requiredForReadiness: true,
      },
      {
        key: "priority_clauses",
        label: "最在意條款",
        inputType: "textarea",
        placeholder: "例如：付款條件、責任限制、解約權、保密、IP 歸屬",
        requiredForReadiness: true,
      },
      {
        key: "review_output_mode",
        label: "這次要 issue spotting 還是 redline 建議",
        inputType: "select",
        requiredForReadiness: true,
        options: [
          { value: "", label: "請選擇" },
          { value: "issue_spotting", label: "Issue spotting" },
          { value: "redline", label: "Redline 建議" },
          { value: "both", label: "兩者都要" },
        ],
      },
      {
        key: "attachment_completeness",
        label: "附件是否完整",
        inputType: "select",
        requiredForReadiness: true,
        options: [
          { value: "", label: "請選擇" },
          { value: "complete", label: "看起來完整" },
          { value: "partial", label: "可能有缺漏" },
          { value: "unknown", label: "目前不確定" },
        ],
      },
    ],
  },
  research_synthesis: {
    title: "研究綜整補充設定",
    description: "把研究主題、輸出偏好與讀者講清楚，讓綜整更符合顧問交付邏輯。",
    fields: [
      {
        key: "research_topic",
        label: "研究主題",
        inputType: "input",
        placeholder: "例如：東南亞中型企業 SaaS 切入機會",
        requiredForReadiness: true,
      },
      {
        key: "output_preference",
        label: "想得到摘要 / 洞察 / 建議哪一類輸出",
        inputType: "textarea",
        placeholder: "例如：先要一頁摘要，再要三點洞察與可行建議",
        requiredForReadiness: true,
      },
      {
        key: "target_reader",
        label: "目標讀者",
        inputType: "input",
        placeholder: "例如：合夥人、專案經理、客戶內部主管",
        requiredForReadiness: true,
      },
      {
        key: "scope_and_exclusions",
        label: "研究範圍 / 排除範圍",
        inputType: "textarea",
        placeholder: "例如：聚焦市場訊號與競品，不含財務模型與法規細節",
      },
    ],
  },
  document_restructuring: {
    title: "文件重構補充設定",
    description: "把原文件用途、目標受眾與改寫要求說清楚，系統才知道如何重組。",
    fields: [
      {
        key: "source_document_purpose",
        label: "原文件用途",
        inputType: "input",
        placeholder: "例如：內部提案、客戶簡報、董事會備忘錄",
        requiredForReadiness: true,
      },
      {
        key: "target_audience",
        label: "目標受眾",
        inputType: "input",
        placeholder: "例如：高階主管、跨部門團隊、客戶決策者",
        requiredForReadiness: true,
      },
      {
        key: "target_format",
        label: "目標格式",
        inputType: "input",
        placeholder: "例如：一頁摘要、簡報大綱、書面提案",
        requiredForReadiness: true,
      },
      {
        key: "writing_requirements",
        label: "語氣 / 長度 / 結構要求",
        inputType: "textarea",
        placeholder: "例如：高階主管可快速閱讀、三層結構、控制在兩頁內",
      },
    ],
  },
  multi_agent: {
    title: "多代理收斂補充設定",
    description: "把這次要探索、評估還是收斂決策講清楚，讓 Host 協調更貼近顧問式案件判斷。",
    fields: [
      {
        key: "decision_question",
        label: "核心決策問題",
        inputType: "textarea",
        placeholder: "例如：要不要在兩季內切入新市場，還是先深化既有客群",
        requiredForReadiness: true,
      },
      {
        key: "decision_criteria",
        label: "判斷標準",
        inputType: "textarea",
        placeholder: "例如：市場潛力、可執行性、風險可控程度、投資回收期",
        requiredForReadiness: true,
      },
      {
        key: "option_comparison",
        label: "是否要方案比較",
        inputType: "select",
        requiredForReadiness: true,
        options: [
          { value: "", label: "請選擇" },
          { value: "yes", label: "要，比較多個方案" },
          { value: "no", label: "不要，先聚焦單一路徑" },
        ],
      },
      {
        key: "priority_risks",
        label: "最在意的風險",
        inputType: "textarea",
        placeholder: "例如：執行複雜度、價格戰、組織承接能力、法規風險",
        requiredForReadiness: true,
      },
      {
        key: "decision_stage",
        label: "本次是探索 / 評估 / 收斂決策",
        inputType: "select",
        requiredForReadiness: true,
        options: [
          { value: "", label: "請選擇" },
          { value: "explore", label: "探索" },
          { value: "evaluate", label: "評估" },
          { value: "converge", label: "收斂決策" },
        ],
      },
    ],
  },
};

function asStringList(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function normalizeValue(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function getFieldValue(values: Record<string, string>, key: string, label: string) {
  return values[key] ?? values[label] ?? "";
}

function formatOption(option: Record<string, unknown>, index: number) {
  if (typeof option.title === "string" && option.title.trim()) {
    return option.title;
  }
  if (typeof option.description === "string" && option.description.trim()) {
    return `方案 ${index + 1}：${option.description}`;
  }
  return `方案 ${index + 1}`;
}

export function resolveWorkflowKey(taskType: TaskType, flowMode?: string): WorkflowKey {
  if (flowMode === "multi_agent" || taskType === "complex_convergence") {
    return "multi_agent";
  }

  return taskType;
}

export function getModeDefinition(workflowKey: WorkflowKey) {
  return WORKFLOW_MODE_DEFINITIONS[workflowKey];
}

export function createModeSpecificValues(workflowKey: WorkflowKey) {
  return Object.fromEntries(
    WORKFLOW_MODE_DEFINITIONS[workflowKey].fields.map((field) => [field.key, ""]),
  ) as Record<string, string>;
}

export function buildModeSpecificAppendix(
  workflowKey: WorkflowKey,
  values: Record<string, string>,
) {
  const lines = WORKFLOW_MODE_DEFINITIONS[workflowKey].fields
    .map((field) => {
      const value = normalizeValue(values[field.key] ?? "");
      return value ? `${field.label}:: ${value}` : "";
    })
    .filter(Boolean);

  if (lines.length === 0) {
    return "";
  }

  return `${APPENDIX_START}${workflowKey}】\n${lines.join("\n")}\n${APPENDIX_END}`;
}

export function composeBackgroundText(
  backgroundText: string,
  workflowKey: WorkflowKey,
  values: Record<string, string>,
) {
  const appendix = buildModeSpecificAppendix(workflowKey, values);
  const trimmedBackground = stripModeSpecificAppendix(backgroundText).trim();
  return [trimmedBackground, appendix].filter(Boolean).join("\n\n");
}

export function stripModeSpecificAppendix(value: string) {
  const appendix = extractModeSpecificAppendix(value);
  return appendix.backgroundText;
}

export function extractModeSpecificAppendix(value: string): WorkflowModeAppendix {
  const startIndex = value.lastIndexOf(APPENDIX_START);
  if (startIndex === -1) {
    return {
      workflowKey: null,
      backgroundText: value.trim(),
      values: {},
    };
  }

  const endIndex = value.indexOf(APPENDIX_END, startIndex);
  if (endIndex === -1) {
    return {
      workflowKey: null,
      backgroundText: value.trim(),
      values: {},
    };
  }

  const markerLineEnd = value.indexOf("\n", startIndex);
  const header = value.slice(startIndex, markerLineEnd === -1 ? endIndex : markerLineEnd).trim();
  const workflowKey = header
    .replace(APPENDIX_START, "")
    .replace("】", "")
    .trim() as WorkflowKey;

  const blockBodyStart = markerLineEnd === -1 ? endIndex : markerLineEnd + 1;
  const blockBody = value.slice(blockBodyStart, endIndex).trim();
  const values = Object.fromEntries(
    blockBody
      .split(/\n+/)
      .map((line) => {
        const [label, rawValue] = line.split("::");
        return [label?.trim() ?? "", rawValue?.trim() ?? ""];
      })
      .filter(([label, rawValue]) => label && rawValue),
  );

  const backgroundText = `${value.slice(0, startIndex)}${value.slice(endIndex + APPENDIX_END.length)}`.trim();

  return {
    workflowKey:
      workflowKey in WORKFLOW_MODE_DEFINITIONS ? workflowKey : null,
    backgroundText,
    values,
  };
}

export function getModeSpecificEntries(
  workflowKey: WorkflowKey,
  values: Record<string, string>,
) {
  return WORKFLOW_MODE_DEFINITIONS[workflowKey].fields
    .map((field) => ({
      label: field.label,
      value: getFieldValue(values, field.key, field.label),
    }))
    .filter((entry) => entry.value.trim().length > 0);
}

export function getModeSpecificReadinessSignals(
  workflowKey: WorkflowKey,
  values: Record<string, string>,
) {
  const definition = WORKFLOW_MODE_DEFINITIONS[workflowKey];
  const missingItems = definition.fields
    .filter((field) => field.requiredForReadiness)
    .filter((field) => !getFieldValue(values, field.key, field.label).trim())
    .map((field) => `尚未補充「${field.label}」。`);
  const warnings: string[] = [];

  if (workflowKey === "contract_review") {
    const attachmentStatus = getFieldValue(values, "attachment_completeness", "附件是否完整");
    if (attachmentStatus === "partial" || attachmentStatus === "unknown") {
      warnings.push("合約附件可能不完整，審閱輸出應視為 issue spotting 草稿，而非完整定稿意見。");
    }
  }

  if (
    workflowKey === "research_synthesis" &&
    !getFieldValue(values, "scope_and_exclusions", "研究範圍 / 排除範圍").trim()
  ) {
    warnings.push("尚未清楚標示研究範圍 / 排除範圍，輸出可能會過廣或混入非重點內容。");
  }

  if (
    workflowKey === "document_restructuring" &&
    !getFieldValue(values, "writing_requirements", "語氣 / 長度 / 結構要求").trim()
  ) {
    warnings.push("尚未定義語氣 / 長度 / 結構要求，重構後的版本可能仍需要人工大幅調整。");
  }

  if (workflowKey === "multi_agent") {
    if (getFieldValue(values, "option_comparison", "是否要方案比較") === "yes") {
      warnings.push("本次要求方案比較，若現有 evidence 過薄，options 區塊可能仍只會形成初步骨架。");
    }
    if (!getFieldValue(values, "priority_risks", "最在意的風險").trim()) {
      warnings.push("尚未標示最在意的風險，多代理流程的風險權重可能會偏向平均處理。");
    }
  }

  return { missingItems, warnings };
}

export function getModeSpecificResultSections(
  task: TaskAggregate,
  deliverable: Deliverable | null,
): WorkflowModeSection[] {
  const workflowKey = resolveWorkflowKey(task.task_type, task.mode);
  const findings = asStringList(deliverable?.content_structure?.findings);
  const insights = task.insights.map((item) => item.summary);
  const recommendations = task.recommendations.map((item) => item.summary);
  const risks = task.risks.map((item) => item.title || item.description);
  const missingInformation = asStringList(deliverable?.content_structure?.missing_information);
  const participatingAgents = asStringList(deliverable?.content_structure?.participating_agents);

  if (workflowKey === "contract_review") {
    const clausesReviewed = asStringList(deliverable?.content_structure?.clauses_reviewed);
    return [
      {
        title: "高風險條款",
        description: "優先檢查這些條款或高風險議題，確認是否需要升級處理。",
        items: clausesReviewed.length > 0 ? clausesReviewed : risks,
        emptyText: "目前尚未產生明確的高風險條款清單。",
      },
      {
        title: "Redline / 修改建議",
        description: "這些建議可作為下一輪 redline 或談判條件調整的起點。",
        items: recommendations,
        emptyText: "目前尚未產生可供 redline 的修改建議。",
      },
      {
        title: "缺漏附件 / 缺漏條款",
        description: "這些缺口可能影響審閱完整性，應在對外使用前優先補齊。",
        items: missingInformation,
        emptyText: "目前沒有明確標記缺漏附件或缺漏條款。",
      },
    ];
  }

  if (workflowKey === "document_restructuring") {
    const proposedOutline = asStringList(deliverable?.content_structure?.proposed_outline);
    const rewriteGuidance = asStringList(deliverable?.content_structure?.rewrite_guidance);
    return [
      {
        title: "重組策略",
        description: "先抓重組方向，再決定下一輪是否要直接進入改寫。",
        items: recommendations.length > 0 ? recommendations : rewriteGuidance,
        emptyText: "目前尚未產生明確的重組策略。",
      },
      {
        title: "結構調整重點",
        description: "這些是應優先調整的結構問題與編排重點。",
        items: rewriteGuidance.length > 0 ? rewriteGuidance : findings,
        emptyText: "目前尚未標出明確的結構調整重點。",
      },
      {
        title: "產出草案 / 新版結構",
        description: "這是目前最接近新版骨架的提案，可直接作為下一版改寫起點。",
        items: proposedOutline,
        emptyText: "目前尚未產出可直接使用的新版結構草案。",
      },
    ];
  }

  if (workflowKey === "multi_agent") {
    const disagreements = missingInformation.filter((item) =>
      item.includes(":") || item.includes("："),
    );
    return [
      {
        title: "收斂摘要",
        description: "這裡聚焦多代理已經收斂出的主要觀點與判斷。",
        items: insights.length > 0 ? insights : findings,
        emptyText: "目前尚未形成可供決策的收斂摘要。",
      },
      {
        title: "方案 / Options",
        description: "若本輪有形成方案比較，會優先呈現在這裡。",
        items: task.options.map((option, index) => formatOption(option, index)),
        emptyText: "目前 shared task model 尚未產生獨立的方案物件。",
      },
      {
        title: "分歧觀點",
        description: "這些是尚未完全收斂、仍需補證或再判斷的觀點。",
        items: disagreements,
        emptyText: "目前沒有被明確標記的分歧觀點。",
      },
      {
        title: "參與代理",
        description: "本輪由 Host 協調以下核心代理共同參與分析。",
        items: participatingAgents,
        emptyText: "目前沒有可顯示的參與代理資訊。",
        translateAsAgentIds: true,
      },
      {
        title: "協調摘要",
        description: "確認 Host 是否仍是唯一的 orchestration center。",
        items: [
          "由 Host 協調中心統一啟動、收斂並寫回任務歷史。",
          participatingAgents.length > 0
            ? `本輪共協調 ${participatingAgents.length} 個核心代理。`
            : "本輪未回傳參與代理清單。",
        ],
        emptyText: "目前尚未建立 orchestration 摘要。",
      },
    ];
  }

  return [
    {
      title: "關鍵發現",
      description: "這些是目前最值得先讀的研究發現。",
      items: findings,
      emptyText: "目前尚未產生明確的關鍵發現。",
    },
    {
      title: "洞察 / 管理意涵",
      description: "這些內容更接近管理意涵與後續判斷方向。",
      items: insights.length > 0 ? insights : recommendations,
      emptyText: "目前尚未產生可獨立閱讀的洞察。",
    },
    {
      title: "研究缺口",
      description: "這些是本輪研究綜整仍明確缺少的資訊。",
      items: missingInformation,
      emptyText: "目前沒有明確標記研究缺口。",
    },
  ];
}
