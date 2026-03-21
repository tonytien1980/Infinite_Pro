const TASK_STATUS_LABELS: Record<string, string> = {
  draft: "草稿",
  ready: "就緒",
  running: "執行中",
  completed: "已完成",
  failed: "失敗",
};

const RUN_STATUS_LABELS: Record<string, string> = {
  running: "執行中",
  completed: "已完成",
  failed: "失敗",
};

const TASK_TYPE_LABELS: Record<string, string> = {
  research_synthesis: "研究綜整",
  contract_review: "合約審閱",
  document_restructuring: "文件重構",
  complex_convergence: "複雜議題收斂",
};

const FLOW_MODE_LABELS: Record<string, string> = {
  specialist: "專家流程",
  multi_agent: "多代理流程",
};

const PRIORITY_LABELS: Record<string, string> = {
  high: "高優先",
  medium: "中優先",
  low: "低優先",
};

const ACTION_STATUS_LABELS: Record<string, string> = {
  open: "待處理",
  in_progress: "進行中",
  completed: "已完成",
  blocked: "受阻",
};

const AGENT_LABELS: Record<string, string> = {
  host_orchestrator: "Host 協調中心",
  strategy_business_analysis: "策略 / 商業分析代理",
  market_research_insight: "市場 / 研究洞察代理",
  operations: "營運代理",
  risk_challenge: "風險 / 挑戰代理",
  research_synthesis: "研究綜整代理",
  contract_review: "合約審閱代理",
  document_restructuring: "文件重構代理",
};

const EVIDENCE_TYPE_LABELS: Record<string, string> = {
  background_text: "背景文字",
  source_excerpt: "來源節錄",
  source_chunk: "來源片段",
  source_ingestion_issue: "來源擷取異常",
  source_unparsed: "來源未完成解析",
  uploaded_file_excerpt: "上傳檔案節錄",
  uploaded_file_ingestion_issue: "檔案擷取異常",
  uploaded_file_unparsed: "檔案未完成解析",
};

const SOURCE_TYPE_LABELS: Record<string, string> = {
  manual_input: "手動輸入",
  manual_upload: "手動上傳",
  manual_url: "網址匯入",
  google_docs: "Google Docs",
  external_search: "外部搜尋補充",
};

const EXTERNAL_DATA_STRATEGY_LABELS: Record<string, string> = {
  strict: "僅使用我提供的資料",
  supplemental: "視需要補充外部資料",
  latest: "優先使用最新外部資料",
};

const DELIVERABLE_TYPE_LABELS: Record<string, string> = {
  research_synthesis: "研究綜整交付物",
  contract_review: "合約審閱交付物",
  document_restructuring: "文件重構交付物",
  multi_agent_convergence: "多代理收斂交付物",
};

const STRUCTURED_FIELD_LABELS: Record<string, string> = {
  problem_definition: "問題定義",
  background_summary: "背景摘要",
  findings: "發現",
  insights: "洞察",
  risks: "風險",
  options: "選項",
  recommendations: "建議",
  action_items: "行動項目",
  missing_information: "缺漏資訊",
  workflow_mode: "工作流程",
  sources_used: "使用來源",
  clauses_reviewed: "審閱條款",
  proposed_outline: "建議大綱",
  rewrite_guidance: "改寫建議",
  participating_agents: "參與代理",
  generated_by_agent: "產生代理",
  external_data_usage: "外部資料使用情況",
  external_data_strategy: "外部資料使用方式",
  external_search_used: "是否使用外部搜尋",
  analysis_dependency_note: "外部資料依賴說明",
};

function fallbackLabel(value: string) {
  return value.replaceAll("_", " ");
}

export function formatDisplayDate(value: string) {
  return new Intl.DateTimeFormat("zh-TW", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function labelForTaskStatus(value: string) {
  return TASK_STATUS_LABELS[value] ?? fallbackLabel(value);
}

export function labelForRunStatus(value: string) {
  return RUN_STATUS_LABELS[value] ?? fallbackLabel(value);
}

export function labelForTaskType(value: string) {
  return TASK_TYPE_LABELS[value] ?? fallbackLabel(value);
}

export function labelForFlowMode(value: string) {
  return FLOW_MODE_LABELS[value] ?? fallbackLabel(value);
}

export function labelForPriority(value: string) {
  return PRIORITY_LABELS[value] ?? fallbackLabel(value);
}

export function labelForActionStatus(value: string) {
  return ACTION_STATUS_LABELS[value] ?? fallbackLabel(value);
}

export function labelForAgentId(value: string) {
  return AGENT_LABELS[value] ?? fallbackLabel(value);
}

export function labelForEvidenceType(value: string) {
  return EVIDENCE_TYPE_LABELS[value] ?? fallbackLabel(value);
}

export function labelForSourceType(value: string) {
  return SOURCE_TYPE_LABELS[value] ?? fallbackLabel(value);
}

export function labelForExternalDataStrategy(value: string) {
  return EXTERNAL_DATA_STRATEGY_LABELS[value] ?? fallbackLabel(value);
}

export function labelForDeliverableType(value: string) {
  return DELIVERABLE_TYPE_LABELS[value] ?? fallbackLabel(value);
}

export function labelForStructuredField(value: string) {
  return STRUCTURED_FIELD_LABELS[value] ?? fallbackLabel(value);
}

export function translateStructuredValue(label: string, value: unknown) {
  if (label === "participating_agents" && Array.isArray(value)) {
    return value.map((item) =>
      typeof item === "string" ? labelForAgentId(item) : item,
    );
  }

  if (label === "generated_by_agent" && typeof value === "string") {
    return labelForAgentId(value);
  }

  if (label === "external_data_strategy" && typeof value === "string") {
    return labelForExternalDataStrategy(value);
  }

  if (label === "external_search_used" && typeof value === "boolean") {
    return value ? "是" : "否";
  }

  if (label === "deliverable_type" && typeof value === "string") {
    return labelForDeliverableType(value);
  }

  return value;
}
