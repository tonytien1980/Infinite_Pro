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

const IMPACT_LEVEL_LABELS: Record<string, string> = {
  high: "高嚴重度",
  medium: "中嚴重度",
  low: "低嚴重度",
};

const LIKELIHOOD_LEVEL_LABELS: Record<string, string> = {
  high: "高可能性",
  medium: "中可能性",
  low: "低可能性",
};

const ACTION_STATUS_LABELS: Record<string, string> = {
  planned: "已規劃",
  open: "待處理",
  in_progress: "進行中",
  completed: "已完成",
  blocked: "受阻",
  review_required: "待重新檢查",
};

const AGENT_LABELS: Record<string, string> = {
  host_orchestrator: "主控協調中心",
  host_agent: "主控代理",
  strategy_business_analysis: "策略 / 商業分析代理",
  strategy_decision_agent: "策略 / 決策代理",
  finance_capital: "財務 / 資本代理",
  legal_risk: "法務 / 風險代理",
  market_research_insight: "市場 / 研究洞察代理",
  marketing_growth: "行銷 / 成長代理",
  sales_business_development: "銷售 / 商務開發代理",
  research_intelligence: "調研 / 情報代理",
  research_intelligence_agent: "調研 / 情報代理",
  operations: "營運代理",
  operations_agent: "營運代理",
  document_communication: "文件 / 溝通代理",
  risk_challenge: "風險 / 挑戰代理",
  finance_agent: "財務 / 募資代理",
  legal_risk_agent: "法務 / 風險代理",
  marketing_growth_agent: "行銷 / 成長代理",
  sales_business_development_agent: "銷售 / 商務開發代理",
  document_communication_agent: "文件 / 溝通代理",
  research_synthesis: "研究綜整代理",
  research_synthesis_specialist: "研究綜整專家代理",
  contract_review: "合約審閱代理",
  contract_review_specialist: "合約審閱專家代理",
  document_restructuring: "文件重構代理",
  document_restructuring_specialist: "文件重構專家代理",
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

const EVIDENCE_STRENGTH_LABELS: Record<string, string> = {
  strong: "支撐力強",
  moderate: "支撐力中等",
  thin: "支撐力偏薄",
};

const SOURCE_TYPE_LABELS: Record<string, string> = {
  manual_input: "手動輸入",
  manual_upload: "手動上傳",
  manual_url: "網址匯入",
  google_docs: "Google Docs",
  external_search: "外部搜尋補充",
};

const SOURCE_SUPPORT_LEVEL_LABELS: Record<string, string> = {
  full: "正式支援",
  limited: "有限支援",
  unsupported: "尚未正式支援",
};

const SOURCE_INGEST_STRATEGY_LABELS: Record<string, string> = {
  text_extract: "文字擷取",
  document_text_extract: "文件文字擷取",
  worksheet_snapshot: "工作表快照",
  table_snapshot: "表格快照",
  text_first_pdf: "PDF 文字優先擷取",
  pdf_metadata_only: "PDF 僅保留中繼資料",
  reference_image: "影像僅供參考",
  inline_text_extract: "手動文字擷取",
  remote_text_extract: "遠端文字擷取",
  unsupported: "尚未正式支援",
};

const STORAGE_AVAILABILITY_LABELS: Record<string, string> = {
  available: "可用",
  metadata_only: "只有 metadata",
  reference_only: "僅保留 reference",
  pending_purge: "待清理",
  purged: "已清理",
};

const RETENTION_POLICY_LABELS: Record<string, string> = {
  raw_default_30d: "原始檔 30 天",
  raw_active_90d: "原始檔 90 天",
  derived_180d: "衍生資料 180 天",
  release_365d: "正式 artifact 365 天",
  failed_7d: "失敗上傳 7 天",
};

const EXTERNAL_DATA_STRATEGY_LABELS: Record<string, string> = {
  strict: "僅使用我提供的資料",
  supplemental: "視需要補充外部資料",
  latest: "優先使用最新外部資料",
};

const RESEARCH_DEPTH_LABELS: Record<string, string> = {
  light_completion: "輕量補完",
  standard_investigation: "標準調研",
  deep_research: "深度調研",
};

const RESEARCH_DELEGATION_STATUS_LABELS: Record<string, string> = {
  not_needed: "本輪不需額外調研委派",
  delegated: "已正式委派調研代理",
  satisfied_by_multi_agent: "已由多代理流程內含調研視角承接",
  failed: "調研委派失敗或降級",
};

const INPUT_ENTRY_MODE_LABELS: Record<string, string> = {
  one_line_inquiry: "一句話起手",
  single_document_intake: "單材料起手",
  multi_material_case: "多來源案件",
};

const ENGAGEMENT_CONTINUITY_MODE_LABELS: Record<string, string> = {
  one_off: "單次案件",
  follow_up: "可追蹤後續案件",
  continuous: "持續追蹤案件",
};

const WRITEBACK_DEPTH_LABELS: Record<string, string> = {
  minimal: "最小寫回",
  milestone: "里程碑寫回",
  full: "完整閉環寫回",
};

const FUNCTION_TYPE_LABELS: Record<string, string> = {
  diagnose_assess: "診斷 / 評估",
  decide_converge: "決策 / 收斂",
  review_challenge: "審閱 / Challenge",
  synthesize_brief: "綜整 / Brief",
  restructure_reframe: "重構 / Reframe",
  plan_roadmap: "規劃 / Roadmap",
  scenario_comparison: "方案比較",
  risk_surfacing: "風險盤點",
  checkpoint_update: "檢查點更新",
  outcome_observation: "結果觀察",
};

const APPROVAL_POLICY_LABELS: Record<string, string> = {
  not_required: "不需另外核可",
  consultant_review: "需顧問確認",
  consultant_confirmation: "需顧問正式核可",
};

const APPROVAL_STATUS_LABELS: Record<string, string> = {
  not_required: "不需核可",
  pending: "待正式核可",
  approved: "已正式核可",
  rejected: "未通過核可",
};

const AUDIT_EVENT_TYPE_LABELS: Record<string, string> = {
  writeback_generated: "已建立正式寫回紀錄",
  approval_recorded: "已記錄正式核可",
  continuation_action_applied: "已套用後續動作",
};

const PACK_CONTRACT_INTERFACE_LABELS: Record<string, string> = {
  evidence_readiness_v1: "證據期待 gate",
  decision_framing_v1: "決策 framing hints",
  deliverable_shaping_v1: "交付 shaping hints",
};

const PACK_REQUIRED_PROPERTY_LABELS: Record<string, string> = {
  definition: "正式定義",
  common_problem_patterns: "常見問題型態",
  evidence_expectations: "證據期待",
  default_decision_context_patterns: "預設判斷情境",
  decision_patterns: "決策模式",
  deliverable_presets: "交付預設",
  routing_hints: "路由提示",
  pack_rationale: "存在理由",
};

const PACK_RULE_BINDING_LABELS: Record<string, string> = {
  readiness_gate_v1: "readiness gate",
  decision_context_hint_v1: "decision context hint",
  deliverable_hint_v1: "deliverable hint",
};

const PACK_CONTRACT_STATUS_LABELS: Record<string, string> = {
  ready: "合約基線就緒",
  missing_required_properties: "仍缺必要欄位",
};

const CANONICALIZATION_REVIEW_STATUS_LABELS: Record<string, string> = {
  pending_review: "待確認是否同一份材料",
  human_confirmed_canonical_row: "已確認掛回同一份材料",
  keep_separate: "已保留分開",
  split: "已拆回分開",
};

const CANONICALIZATION_MATCH_BASIS_LABELS: Record<string, string> = {
  content_digest_match: "內容指紋一致",
  source_ref_match: "來源相同",
  display_name_match: "名稱高度相近",
};

const RETRIEVAL_SUPPORT_KIND_LABELS: Record<string, string> = {
  chunk_object: "引用來源片段",
  media_reference: "引用媒體參照",
  source_reference: "引用來源",
};

const PRESENCE_STATE_LABELS: Record<string, string> = {
  explicit: "明確存在",
  inferred: "推定存在",
  provisional: "暫定存在",
  missing: "目前缺失",
  not_applicable: "此輪不適用",
};

const DELIVERABLE_CLASS_LABELS: Record<string, string> = {
  exploratory_brief: "探索型簡報",
  assessment_review_memo: "評估 / 審閱備忘",
  decision_action_deliverable: "決策 / 行動交付物",
};

const DELIVERABLE_TYPE_LABELS: Record<string, string> = {
  research_synthesis: "研究綜整交付物",
  contract_review: "合約審閱交付物",
  document_restructuring: "文件重構交付物",
  multi_agent_convergence: "多代理收斂交付物",
};

const DELIVERABLE_WORKSPACE_STATUS_LABELS: Record<string, string> = {
  current: "目前版本",
  superseded: "較舊版本",
};

const EXTENSION_STATUS_LABELS: Record<string, string> = {
  active: "啟用中",
  inactive: "停用中",
  draft: "草稿",
  deprecated: "已淘汰",
};

const PACK_TYPE_LABELS: Record<string, string> = {
  domain: "問題面向模組包",
  industry: "產業模組包",
};

const AGENT_TYPE_LABELS: Record<string, string> = {
  host: "主控代理",
  reasoning: "推理代理",
  specialist: "專家代理",
};

const DELIVERABLE_EVENT_LABELS: Record<string, string> = {
  draft_created: "建立草稿",
  content_updated: "更新內容",
  content_rolled_back: "回退正文",
  status_changed: "狀態切換",
  version_tag_updated: "版本標記更新",
  exported: "匯出交付物",
  published: "發布定稿",
  note_added: "版本備註",
};

const AGENT_CANONICAL_NAMES: Record<string, string> = {
  host_agent: "主控代理",
  strategy_decision_agent: "策略 / 決策代理",
  operations_agent: "營運代理",
  finance_agent: "財務 / 募資代理",
  legal_risk_agent: "法務 / 風險代理",
  marketing_growth_agent: "行銷 / 成長代理",
  sales_business_development_agent: "銷售 / 商務開發代理",
  research_intelligence_agent: "調研 / 情報代理",
  document_communication_agent: "文件 / 溝通代理",
  contract_review_specialist: "合約審閱專家代理",
  research_synthesis_specialist: "研究綜整專家代理",
  document_restructuring_specialist: "文件重構專家代理",
};

const AGENT_PRIMARY_DESCRIPTIONS: Record<string, string> = {
  host_agent: "唯一正式協調中心，負責判讀工作流、代理選擇、就緒度治理與交付收斂。",
  strategy_decision_agent: "負責 framing、選項比較、優先順序與決策收斂。",
  operations_agent: "負責可行性、流程影響、相依關係與執行順序判斷。",
  finance_capital: "負責經濟性、資本配置、現金流壓力與關鍵數字假設判讀。",
  legal_risk: "負責法務邊界、合規責任、契約影響與需升級審閱的風險盤點。",
  finance_agent: "負責經濟性、資本、現金流與募資相關推理。",
  legal_risk_agent: "負責法務邊界、法遵風險與契約影響盤點。",
  marketing_growth: "負責定位、需求生成、訊息與成長機制判讀。",
  marketing_growth_agent: "負責定位、需求生成、成長敘事與獲客分析。",
  sales_business_development: "負責管線、商務動作、夥伴結構與商機推進。",
  sales_business_development_agent: "負責商機管線、商務動作、夥伴結構與機會開發。",
  research_intelligence: "負責調研規劃、來源品質、證據缺口、新鮮度與不確定性 framing。",
  research_intelligence_agent: "負責調研規劃、來源品質、證據缺口 closure 與 citation-ready handoff。",
  document_communication: "負責受眾導向的文件結構、訊息順序與交付採納率。",
  document_communication_agent: "負責文件整理、敘事編排與溝通型交付物。",
  contract_review_specialist: "專注合約審閱、條款風險盤點與修訂建議輸出。",
  research_synthesis_specialist: "專注研究材料綜整，整理成可判讀的決策摘要。",
  document_restructuring_specialist: "專注提案、備忘錄與文件草稿重構，對齊目標受眾。",
};

const PACK_PRIMARY_NAMES: Record<string, string> = {
  operations_pack: "營運模組包",
  finance_fundraising_pack: "財務 / 募資模組包",
  legal_risk_pack: "法務 / 風險模組包",
  marketing_sales_pack: "行銷 / 銷售模組包",
  business_development_pack: "商務開發模組包",
  research_intelligence_pack: "研究 / 情報模組包",
  organization_people_pack: "組織 / 人力模組包",
  product_service_pack: "產品 / 服務模組包",
  online_education_pack: "線上教育模組包",
  ecommerce_pack: "電商模組包",
  gaming_pack: "遊戲模組包",
  funeral_services_pack: "殯葬服務模組包",
  health_supplements_pack: "保健品模組包",
  energy_pack: "能源模組包",
  saas_pack: "SaaS 模組包",
  media_creator_pack: "自媒體 / 創作者模組包",
  professional_services_pack: "專業服務模組包",
  manufacturing_pack: "製造業模組包",
  healthcare_clinic_pack: "醫療 / 診所模組包",
};

const PACK_CANONICAL_NAMES: Record<string, string> = {
  operations_pack: "營運模組包",
  finance_fundraising_pack: "財務 / 募資模組包",
  legal_risk_pack: "法務 / 風險模組包",
  marketing_sales_pack: "行銷 / 銷售模組包",
  business_development_pack: "商務開發模組包",
  research_intelligence_pack: "研究 / 情報模組包",
  organization_people_pack: "組織 / 人力模組包",
  product_service_pack: "產品 / 服務模組包",
  online_education_pack: "線上教育模組包",
  ecommerce_pack: "電商模組包",
  gaming_pack: "遊戲模組包",
  funeral_services_pack: "殯葬服務模組包",
  health_supplements_pack: "保健品模組包",
  energy_pack: "能源模組包",
  saas_pack: "SaaS 模組包",
  media_creator_pack: "自媒體 / 創作者模組包",
  professional_services_pack: "專業服務模組包",
  manufacturing_pack: "製造業模組包",
  healthcare_clinic_pack: "醫療 / 診所模組包",
};

const PACK_PRIMARY_DESCRIPTIONS: Record<string, string> = {
  operations_pack: "聚焦營運治理、流程瓶頸、交付能力、資源配置與執行節奏。",
  finance_fundraising_pack: "聚焦財務結構、現金流、單位經濟、資金規劃與募資判斷。",
  legal_risk_pack: "聚焦法務邊界、契約條款、法遵責任與正式風險挑戰。",
  marketing_sales_pack: "聚焦市場定位、需求生成、漏斗設計、成交流程與市場進入策略收斂。",
  business_development_pack: "聚焦策略合作、通路拓展、夥伴結構與商務機會開發。",
  research_intelligence_pack: "聚焦市場情報、外部訊號、競爭研究與不確定性盤點。",
  organization_people_pack: "聚焦組織設計、權責分工、人力配置與管理機制治理。",
  product_service_pack: "聚焦產品 / 服務設計、價值主張、定價與方案架構。",
  online_education_pack: "聚焦數位課程、梯次課程、會員與教育交付系統的經營脈絡。",
  ecommerce_pack: "聚焦品牌官網、平台電商、社群電商與多通路銷售模型。",
  gaming_pack: "聚焦上線準備、長線營運、留存、變現與產品組合波動。",
  funeral_services_pack: "聚焦殯葬服務中的信任、法遵、轉介紹渠道與高敏感營運節奏。",
  health_supplements_pack: "聚焦保健品場景中的宣稱合規、回購、信任與品項經濟性。",
  energy_pack: "聚焦能源、電力、儲能與能源服務裡的法規、資本密度與專案節奏。",
  saas_pack: "聚焦 SaaS / 訂閱軟體的啟用、留存、定價、商機管線與價值實現時間。",
  media_creator_pack: "聚焦內容創作者與受眾驅動商業模式的平台依賴、收入組合與受眾轉化。",
  professional_services_pack: "聚焦專業服務、顧問與代理模式的利用率、報價與客戶交付經濟性。",
  manufacturing_pack: "聚焦製造業的產能、品質、成本、供應鏈、交付與工作資本。",
  healthcare_clinic_pack: "聚焦診所與醫療服務的專業容量、排程、服務組合、法遵與病患體驗。",
};

const AGENT_NAME_LABELS = Object.fromEntries(
  Object.entries(AGENT_CANONICAL_NAMES).map(([agentId, name]) => [
    name,
    AGENT_LABELS[agentId] ?? name,
  ]),
);
Object.assign(AGENT_NAME_LABELS, {
  "Host Agent": AGENT_LABELS.host_agent,
  "Strategy / Decision Agent": AGENT_LABELS.strategy_decision_agent,
  "Operations Agent": AGENT_LABELS.operations_agent,
  "Finance Agent": AGENT_LABELS.finance_agent,
  "Legal / Risk Agent": AGENT_LABELS.legal_risk_agent,
  "Marketing / Growth Agent": AGENT_LABELS.marketing_growth_agent,
  "Sales / Business Development Agent": AGENT_LABELS.sales_business_development_agent,
  "Research / Intelligence Agent": AGENT_LABELS.research_intelligence_agent,
  "Research / Investigation Agent": AGENT_LABELS.research_intelligence_agent,
  "Document / Communication Agent": AGENT_LABELS.document_communication_agent,
  "Contract Review Specialist": AGENT_LABELS.contract_review_specialist,
  "Research Synthesis Specialist": AGENT_LABELS.research_synthesis_specialist,
  "Document Restructuring Specialist": AGENT_LABELS.document_restructuring_specialist,
});

const PACK_NAME_LABELS = Object.fromEntries(
  Object.entries(PACK_CANONICAL_NAMES).map(([packId, name]) => [
    name,
    PACK_PRIMARY_NAMES[packId] ?? name,
  ]),
);

const CAPABILITY_LABELS: Record<string, string> = {
  diagnose_assess: "診斷 / 評估",
  decide_converge: "決策 / 收斂",
  review_challenge: "審閱 / 挑戰",
  synthesize_brief: "綜整 / 簡報",
  restructure_reframe: "重構 / 重塑",
  plan_roadmap: "規劃 / 路線圖",
  scenario_comparison: "情境比較",
  risk_surfacing: "風險盤點",
};

const MATTER_STATUS_LABELS: Record<string, string> = {
  active: "進行中",
  paused: "暫停",
  closed: "已結案",
  archived: "封存",
};

const DELIVERABLE_STATUS_LABELS: Record<string, string> = {
  draft: "草稿",
  pending_confirmation: "待確認",
  final: "定稿",
  archived: "封存",
};

const STRUCTURED_FIELD_LABELS: Record<string, string> = {
  executive_summary: "執行摘要",
  core_judgment: "核心判斷",
  problem_definition: "問題定義",
  background_summary: "背景摘要",
  findings: "發現",
  key_findings: "關鍵發現",
  insights: "洞察",
  implications: "洞察 / 管理意涵",
  risks: "風險",
  risk_cards: "風險卡片",
  options: "選項",
  recommendations: "建議",
  recommendation_cards: "建議卡片",
  action_items: "行動項目",
  action_item_cards: "行動項卡片",
  missing_information: "缺漏資訊",
  research_gaps: "研究缺口",
  workflow_mode: "工作流程",
  sources_used: "使用來源",
  clauses_reviewed: "審閱條款",
  high_risk_clauses: "高風險條款",
  redline_recommendations: "修改建議",
  missing_attachments_or_clauses: "缺漏附件 / 缺漏條款",
  proposed_outline: "建議大綱",
  draft_outline: "產出草案 / 新版結構",
  rewrite_guidance: "改寫建議",
  restructuring_strategy: "重組策略",
  structure_adjustments: "結構調整重點",
  convergence_summary: "收斂摘要",
  divergent_views: "分歧觀點",
  participating_agents: "參與代理",
  orchestration_summary: "協調摘要",
  generated_by_agent: "產生代理",
  external_data_usage: "外部資料使用情況",
  external_data_strategy: "外部資料使用方式",
  external_search_used: "是否使用外部搜尋",
  analysis_dependency_note: "外部資料依賴說明",
  input_entry_mode: "進件形態",
  deliverable_class: "交付等級",
  sparse_input_operating_state: "稀疏輸入運作狀態",
  presence_state_summary: "物件存在狀態",
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

export function labelForImpactLevel(value: string) {
  return IMPACT_LEVEL_LABELS[value] ?? fallbackLabel(value);
}

export function labelForLikelihoodLevel(value: string) {
  return LIKELIHOOD_LEVEL_LABELS[value] ?? fallbackLabel(value);
}

export function labelForActionStatus(value: string) {
  return ACTION_STATUS_LABELS[value] ?? fallbackLabel(value);
}

export function labelForAgentId(value: string) {
  return AGENT_LABELS[value] ?? fallbackLabel(value);
}

export function labelForAgentName(value: string) {
  return AGENT_NAME_LABELS[value] ?? AGENT_LABELS[value] ?? value;
}

export function labelForEvidenceType(value: string) {
  return EVIDENCE_TYPE_LABELS[value] ?? fallbackLabel(value);
}

export function labelForEvidenceStrength(value: string) {
  return EVIDENCE_STRENGTH_LABELS[value] ?? fallbackLabel(value);
}

export function labelForExtensionStatus(value: string) {
  return EXTENSION_STATUS_LABELS[value] ?? fallbackLabel(value);
}

export function labelForPackType(value: string) {
  return PACK_TYPE_LABELS[value] ?? fallbackLabel(value);
}

export function labelForPackName(value: string) {
  return PACK_NAME_LABELS[value] ?? PACK_PRIMARY_NAMES[value] ?? value;
}

export function labelForAgentType(value: string) {
  return AGENT_TYPE_LABELS[value] ?? fallbackLabel(value);
}

export function labelForDeliverableEventType(value: string) {
  return DELIVERABLE_EVENT_LABELS[value] ?? fallbackLabel(value);
}

export function labelForCapability(value: string) {
  return CAPABILITY_LABELS[value] ?? fallbackLabel(value);
}

export function labelForMatterStatus(value: string) {
  return MATTER_STATUS_LABELS[value] ?? fallbackLabel(value);
}

export function labelForDeliverableStatus(value: string) {
  return DELIVERABLE_STATUS_LABELS[value] ?? fallbackLabel(value);
}

export function labelForSourceType(value: string) {
  return SOURCE_TYPE_LABELS[value] ?? fallbackLabel(value);
}

export function labelForSourceSupportLevel(value: string | null | undefined) {
  if (!value) {
    return "未標示支援層級";
  }
  return SOURCE_SUPPORT_LEVEL_LABELS[value] ?? fallbackLabel(value);
}

export function labelForSourceIngestStrategy(value: string | null | undefined) {
  if (!value) {
    return "未標示擷取策略";
  }
  return SOURCE_INGEST_STRATEGY_LABELS[value] ?? fallbackLabel(value);
}

export function labelForStorageAvailability(value: string | null | undefined) {
  if (!value) {
    return "未標示可用狀態";
  }
  return STORAGE_AVAILABILITY_LABELS[value] ?? fallbackLabel(value);
}

export function labelForRetentionPolicy(value: string | null | undefined) {
  if (!value) {
    return "未設定保留規則";
  }
  return RETENTION_POLICY_LABELS[value] ?? fallbackLabel(value);
}

export function labelForFileExtension(value: string | null | undefined) {
  if (!value) {
    return "未標示格式";
  }
  return value.replace(/^\./, "").toUpperCase();
}

export function formatFileSize(size: number | null | undefined) {
  if (!size || size <= 0) {
    return "0 B";
  }
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }
  if (size >= 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  return `${size} B`;
}

export function labelForRetentionState(purgeAt: string | null | undefined) {
  if (!purgeAt) {
    return "僅保留紀錄";
  }
  const purgeDate = new Date(purgeAt).getTime();
  const now = Date.now();
  if (purgeDate <= now) {
    return "已過期";
  }
  if (purgeDate <= now + 1000 * 60 * 60 * 24 * 3) {
    return "即將過期";
  }
  return "保留中";
}

export function labelForExternalDataStrategy(value: string) {
  return EXTERNAL_DATA_STRATEGY_LABELS[value] ?? fallbackLabel(value);
}

export function labelForResearchDepth(value: string) {
  return RESEARCH_DEPTH_LABELS[value] ?? fallbackLabel(value);
}

export function labelForResearchDelegationStatus(value: string) {
  return RESEARCH_DELEGATION_STATUS_LABELS[value] ?? fallbackLabel(value);
}

export function labelForInputEntryMode(value: string) {
  return INPUT_ENTRY_MODE_LABELS[value] ?? fallbackLabel(value);
}

export function labelForEngagementContinuityMode(value: string) {
  return ENGAGEMENT_CONTINUITY_MODE_LABELS[value] ?? fallbackLabel(value);
}

export function labelForWritebackDepth(value: string) {
  return WRITEBACK_DEPTH_LABELS[value] ?? fallbackLabel(value);
}

export function labelForFunctionType(value: string | null | undefined) {
  if (!value) {
    return "未標示";
  }
  return FUNCTION_TYPE_LABELS[value] ?? fallbackLabel(value);
}

export function labelForApprovalPolicy(value: string | null | undefined) {
  if (!value) {
    return "未標示";
  }
  return APPROVAL_POLICY_LABELS[value] ?? fallbackLabel(value);
}

export function labelForApprovalStatus(value: string | null | undefined) {
  if (!value) {
    return "未標示";
  }
  return APPROVAL_STATUS_LABELS[value] ?? fallbackLabel(value);
}

export function labelForAuditEventType(value: string | null | undefined) {
  if (!value) {
    return "未標示";
  }
  return AUDIT_EVENT_TYPE_LABELS[value] ?? fallbackLabel(value);
}

export function labelForPackContractInterface(value: string | null | undefined) {
  if (!value) {
    return "未標示";
  }
  return PACK_CONTRACT_INTERFACE_LABELS[value] ?? fallbackLabel(value);
}

export function labelForPackRequiredProperty(value: string | null | undefined) {
  if (!value) {
    return "未標示";
  }
  return PACK_REQUIRED_PROPERTY_LABELS[value] ?? fallbackLabel(value);
}

export function labelForPackRuleBinding(value: string | null | undefined) {
  if (!value) {
    return "未標示";
  }
  return PACK_RULE_BINDING_LABELS[value] ?? fallbackLabel(value);
}

export function labelForPackContractStatus(value: string | null | undefined) {
  if (!value) {
    return "未標示";
  }
  return PACK_CONTRACT_STATUS_LABELS[value] ?? fallbackLabel(value);
}

export function labelForCanonicalizationReviewStatus(value: string | null | undefined) {
  if (!value) {
    return "未標示";
  }
  return CANONICALIZATION_REVIEW_STATUS_LABELS[value] ?? fallbackLabel(value);
}

export function labelForCanonicalizationMatchBasis(value: string | null | undefined) {
  if (!value) {
    return "未標示";
  }
  return CANONICALIZATION_MATCH_BASIS_LABELS[value] ?? fallbackLabel(value);
}

export function labelForRetrievalSupportKind(value: string | null | undefined) {
  if (!value) {
    return "未標示";
  }
  return RETRIEVAL_SUPPORT_KIND_LABELS[value] ?? fallbackLabel(value);
}

export function labelForPresenceState(value: string) {
  return PRESENCE_STATE_LABELS[value] ?? fallbackLabel(value);
}

export function labelForDeliverableClass(value: string) {
  return DELIVERABLE_CLASS_LABELS[value] ?? fallbackLabel(value);
}

export function labelForDeliverableType(value: string) {
  return DELIVERABLE_TYPE_LABELS[value] ?? fallbackLabel(value);
}

export function labelForDeliverableWorkspaceStatus(value: string) {
  return DELIVERABLE_WORKSPACE_STATUS_LABELS[value] ?? fallbackLabel(value);
}

export function labelForStructuredField(value: string) {
  return STRUCTURED_FIELD_LABELS[value] ?? fallbackLabel(value);
}

export function getAgentCatalogDisplay(agent: {
  agent_id: string;
  agent_name: string;
  description: string;
}) {
  const primaryName = AGENT_LABELS[agent.agent_id] ?? labelForAgentName(agent.agent_name);
  const primaryDescription =
    agent.description || AGENT_PRIMARY_DESCRIPTIONS[agent.agent_id];
  return {
    primaryName,
    secondaryName: null,
    primaryDescription,
  };
}

export function getPackCatalogDisplay(pack: {
  pack_id: string;
  pack_name: string;
  description: string;
}) {
  const primaryName = PACK_PRIMARY_NAMES[pack.pack_id] ?? labelForPackName(pack.pack_name);
  const primaryDescription =
    pack.description || PACK_PRIMARY_DESCRIPTIONS[pack.pack_id];
  return {
    primaryName,
    secondaryName: null,
    primaryDescription,
  };
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

  if (label === "input_entry_mode" && typeof value === "string") {
    return labelForInputEntryMode(value);
  }

  if (label === "entry_preset" && typeof value === "string") {
    return labelForInputEntryMode(value);
  }

  if (label === "engagement_continuity_mode" && typeof value === "string") {
    return labelForEngagementContinuityMode(value);
  }

  if (label === "writeback_depth" && typeof value === "string") {
    return labelForWritebackDepth(value);
  }

  if (label === "deliverable_class" && typeof value === "string") {
    return labelForDeliverableClass(value);
  }

  if (label === "external_search_used" && typeof value === "boolean") {
    return value ? "是" : "否";
  }

  if (label === "deliverable_type" && typeof value === "string") {
    return labelForDeliverableType(value);
  }

  return value;
}
