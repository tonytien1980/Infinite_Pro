"use client";

import { FormEvent, useMemo, useState } from "react";

import { createTask, ingestTaskSources, uploadTaskFiles } from "@/lib/api";
import type {
  EngagementContinuityMode,
  ExternalDataStrategy,
  InputEntryMode,
  TaskAggregate,
  TaskCreatePayload,
  WritebackDepth,
} from "@/lib/types";

interface TaskCreateFormProps {
  defaultInputMode: InputEntryMode;
  onCreated: (task: TaskAggregate) => void;
}

const FLOW_OPTIONS = [
  {
    value: "research_synthesis",
    label: "研究綜整",
    mode: "specialist",
    taskType: "research_synthesis",
    description: "適合先把資料整理成摘要、關鍵發現、洞察與建議。",
  },
  {
    value: "contract_review",
    label: "合約審閱",
    mode: "specialist",
    taskType: "contract_review",
    description: "適合快速辨識高風險條款、審閱議題與修改建議方向。",
  },
  {
    value: "document_restructuring",
    label: "文件重構",
    mode: "specialist",
    taskType: "document_restructuring",
    description: "適合把草稿整理成更清楚的新版結構、改寫重點與交付骨架。",
  },
  {
    value: "multi_agent",
    label: "多代理收斂",
    mode: "multi_agent",
    taskType: "complex_convergence",
    description: "適合把複雜決策問題交給 Host 協調多個核心代理一起收斂。",
  },
] as const;

type FlowOption = (typeof FLOW_OPTIONS)[number];
type WorkflowPreference = "auto" | FlowOption["value"];

const EXTERNAL_DATA_STRATEGY_OPTIONS: Array<{
  value: ExternalDataStrategy;
  label: string;
  description: string;
}> = [
  {
    value: "strict",
    label: "不用，我只想用我提供的資料",
    description: "Host 不會主動補外部搜尋，只使用你手動附加的內容、網址與檔案。",
  },
  {
    value: "supplemental",
    label: "可以補充資料",
    description: "由 Host 判斷目前證據是否不足，必要時再補外部搜尋來源。",
  },
  {
    value: "latest",
    label: "幫我找最新的資訊",
    description: "Host 會優先補外部搜尋來源，適合需要最新公開資訊的研究任務。",
  },
];

const INPUT_MODE_OPTIONS: Array<{
  value: InputEntryMode;
  label: string;
  description: string;
}> = [
  {
    value: "one_line_inquiry",
    label: "一句話問題",
    description: "先從核心問題開始，適合快速開案。",
  },
  {
    value: "single_document_intake",
    label: "單文件進件",
    description: "你已有一份主文件，先上傳或貼上內容再展開分析。",
  },
  {
    value: "multi_material_case",
    label: "多材料案件",
    description: "你有多個來源、網址或背景限制，需要一次整理進案件。",
  },
];

const CONTINUITY_MODE_OPTIONS: Array<{
  value: EngagementContinuityMode;
  label: string;
  description: string;
}> = [
  {
    value: "one_off",
    label: "單次案件",
    description: "只保留最小 history、evidence basis 與 deliverable lineage，不強迫持續追蹤。",
  },
  {
    value: "follow_up",
    label: "可追蹤 follow-up",
    description: "保留 decision checkpoints，適合之後還會補件、改版或再看一次的案件。",
  },
  {
    value: "continuous",
    label: "持續追蹤案件",
    description: "會保留 decision -> action -> outcome 的長期寫回痕跡，適合長期持續推進的案件。",
  },
];

const WRITEBACK_DEPTH_OPTIONS: Array<{
  value: WritebackDepth;
  label: string;
  description: string;
}> = [
  {
    value: "minimal",
    label: "最小寫回",
    description: "保留 history、evidence basis 與 deliverable lineage。",
  },
  {
    value: "milestone",
    label: "里程碑寫回",
    description: "在最小寫回上再保留 decision checkpoints 與 milestone 節點。",
  },
  {
    value: "full",
    label: "完整閉環寫回",
    description: "會追蹤 decision、action execution 與 outcome records，適合長期案件。",
  },
];

const INPUT_MODE_GUIDANCE: Record<
  InputEntryMode,
  {
    requirement: string;
    workflowNote: string;
    materialHint: string;
    submitLabel: string;
  }
> = {
  one_line_inquiry: {
    requirement: "只要一句核心問題就能開案，不要求先上傳材料。",
    workflowNote: "系統會先建立 task / decision context 骨架，再由 Host 決定後續補證與工作流。",
    materialHint: "可先空手開案，之後再到案件世界補檔案、網址或補充文字。",
    submitLabel: "先建立案件骨架",
  },
  single_document_intake: {
    requirement: "建立當下需附上一份主文件，作為第一份正式 source material。",
    workflowNote: "系統會先圍繞這份主文件建立案件主線，後續仍可回案件世界補件。",
    materialHint: "本模式建立時僅接受一份檔案，不混入多個網址或額外補充文字。",
    submitLabel: "用主文件建立案件",
  },
  multi_material_case: {
    requirement: "建立當下至少要掛兩份材料，可混合檔案、網址與補充文字。",
    workflowNote: "所有材料都會進到同一個案件世界，不拆成互不相容的子流程。",
    materialHint: "適合已知要一起整理多份檔案、外部網址與內部補充說明的案件。",
    submitLabel: "建立多材料案件",
  },
};

function labelForExternalDataStrategy(value: ExternalDataStrategy) {
  return (
    EXTERNAL_DATA_STRATEGY_OPTIONS.find((item) => item.value === value)?.label ??
    EXTERNAL_DATA_STRATEGY_OPTIONS[1].label
  );
}

function defaultContinuityModeForInputMode(
  inputMode: InputEntryMode,
): EngagementContinuityMode {
  return inputMode === "one_line_inquiry" ? "one_off" : "follow_up";
}

function defaultWritebackDepthForInputMode(inputMode: InputEntryMode): WritebackDepth {
  return inputMode === "one_line_inquiry" ? "minimal" : "milestone";
}

function deriveTaskTitle(description: string) {
  const normalized = description.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return "";
  }

  const headline = normalized.split(/[。！？!?]/)[0]?.trim() || normalized;
  return headline.length <= 36 ? headline : `${headline.slice(0, 36)}...`;
}

function inferFlowValue({
  description,
  files,
  urlsText,
  pastedContent,
}: {
  description: string;
  files: File[];
  urlsText: string;
  pastedContent: string;
}): FlowOption["value"] {
  const signalText = [description, urlsText, pastedContent, ...files.map((file) => file.name)]
    .join(" ")
    .toLowerCase();

  if (
    /(合約|契約|條款|redline|issue spotting|agreement|msa|nda|liability|termination|indemnity)/i.test(
      signalText,
    )
  ) {
    return "contract_review";
  }

  if (
    /(重構|重寫|改寫|重組|大綱|outline|proposal|deck|簡報|提案|structure|restructure|rewrite)/i.test(
      signalText,
    )
  ) {
    return "document_restructuring";
  }

  if (
    /(是否|值不值得|值得投入|要不要|該不該|比較|方案|決策|評估|投入|選擇|收斂|strategy|go-to-market)/i.test(
      signalText,
    )
  ) {
    return "multi_agent";
  }

  return "research_synthesis";
}

function inferClientStage(description: string) {
  const signalText = description.toLowerCase();
  if (/(創業|新創|起步|早期|驗證|pmf)/i.test(signalText)) {
    return "創業階段";
  }
  if (/(制度化|流程|sop|內控|管理|團隊)/i.test(signalText)) {
    return "制度化階段";
  }
  if (/(規模化|擴張|成長|跨部門|授權|scale)/i.test(signalText)) {
    return "規模化階段";
  }
  return undefined;
}

function inferClientType(description: string) {
  const signalText = description.toLowerCase();
  if (/(自媒體|內容|頻道|podcast|newsletter|社群)/i.test(signalText)) {
    return "自媒體";
  }
  if (/(個人品牌|教練|顧問|講師|服務型)/i.test(signalText)) {
    return "個人品牌與服務";
  }
  if (/(大型企業|集團|總部|enterprise|上市|跨國)/i.test(signalText)) {
    return "大型企業";
  }
  if (/(公司|企業|品牌|團隊|中小企業)/i.test(signalText)) {
    return "中小企業";
  }
  return undefined;
}

function inferDomainLenses({
  description,
  subjectName,
  flowValue,
}: {
  description: string;
  subjectName: string;
  flowValue: FlowOption["value"];
}) {
  const signalText = `${description} ${subjectName}`.toLowerCase();
  const lenses: string[] = [];

  if (flowValue === "contract_review" || /(合約|契約|條款|法務|責任|權利)/i.test(signalText)) {
    lenses.push("法務");
  }
  if (/(營運|流程|效率|交付|執行|供應鏈)/i.test(signalText)) {
    lenses.push("營運");
  }
  if (/(財務|現金流|預算|成本|損益)/i.test(signalText)) {
    lenses.push("財務");
  }
  if (/(募資|投資人|term sheet|融資|cap table)/i.test(signalText)) {
    lenses.push("募資");
  }
  if (/(行銷|品牌|內容|流量|社群|campaign)/i.test(signalText)) {
    lenses.push("行銷");
  }
  if (/(銷售|業務|pipeline|proposal|提案|成交)/i.test(signalText)) {
    lenses.push("銷售");
  }
  if (/(組織|人力|團隊|招募|人才|管理|ownership|org)/i.test(signalText)) {
    lenses.push("組織人力");
  }
  if (/(產品|服務|方案|定價|sku|offer|package|value proposition)/i.test(signalText)) {
    lenses.push("產品服務");
  }

  return lenses.length > 0 ? Array.from(new Set(lenses)) : ["綜合"];
}

function buildConsultantBrief({
  flowLabel,
  inputModeLabel,
  title,
  description,
  subjectName,
  analysisDepth,
  assumptions,
  scopeNotes,
  targetReader,
  externalDataStrategy,
}: {
  flowLabel: string;
  inputModeLabel: string;
  title: string;
  description: string;
  subjectName: string;
  analysisDepth: string;
  assumptions: string;
  scopeNotes: string;
  targetReader: string;
  externalDataStrategy: ExternalDataStrategy;
}) {
  return [
    `正式進件模式：${inputModeLabel}`,
    `工作流程：${flowLabel}`,
    `任務名稱：${title.trim()}`,
    `核心問題：${description.trim()}`,
    subjectName.trim() ? `分析對象：${subjectName.trim()}` : "",
    `外部資料使用方式：${labelForExternalDataStrategy(externalDataStrategy)}`,
    analysisDepth.trim() ? `希望這份分析做到的程度：${analysisDepth.trim()}` : "",
    assumptions.trim() ? `已確定的假設：${assumptions.trim()}` : "",
    scopeNotes.trim() ? `研究範圍 / 排除範圍：${scopeNotes.trim()}` : "",
    targetReader.trim() ? `目標讀者：${targetReader.trim()}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function TaskCreateForm({
  defaultInputMode,
  onCreated,
}: TaskCreateFormProps) {
  const [inputMode, setInputMode] = useState<InputEntryMode>(defaultInputMode);
  const [workflowPreference, setWorkflowPreference] = useState<WorkflowPreference>("auto");
  const [description, setDescription] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [urlsText, setUrlsText] = useState("");
  const [pastedContent, setPastedContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [externalDataStrategy, setExternalDataStrategy] =
    useState<ExternalDataStrategy>("supplemental");
  const [showAdvanced, setShowAdvanced] =
    useState(defaultInputMode === "multi_material_case");
  const [continuityMode, setContinuityMode] = useState<EngagementContinuityMode>(
    defaultContinuityModeForInputMode(defaultInputMode),
  );
  const [writebackDepth, setWritebackDepth] = useState<WritebackDepth>(
    defaultWritebackDepthForInputMode(defaultInputMode),
  );
  const [analysisDepth, setAnalysisDepth] = useState("");
  const [constraintInput, setConstraintInput] = useState("");
  const [assumptions, setAssumptions] = useState("");
  const [scopeNotes, setScopeNotes] = useState("");
  const [targetReader, setTargetReader] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const resolvedFlowValue =
    workflowPreference === "auto"
      ? inferFlowValue({ description, files, urlsText, pastedContent })
      : workflowPreference;
  const flow = FLOW_OPTIONS.find((item) => item.value === resolvedFlowValue) ?? FLOW_OPTIONS[0];
  const derivedTitle = useMemo(() => deriveTaskTitle(description), [description]);
  const selectedInputMode =
    INPUT_MODE_OPTIONS.find((option) => option.value === inputMode) ?? INPUT_MODE_OPTIONS[0];
  const consultantBrief = useMemo(
    () =>
      buildConsultantBrief({
        flowLabel: flow.label,
        inputModeLabel: selectedInputMode.label,
        title: derivedTitle,
        description,
        subjectName,
        analysisDepth,
        assumptions,
        scopeNotes,
        targetReader,
        externalDataStrategy,
      }),
    [
      analysisDepth,
      assumptions,
      description,
      externalDataStrategy,
      flow.label,
      selectedInputMode.label,
      scopeNotes,
      subjectName,
      targetReader,
      derivedTitle,
    ],
  );
  const inputModeGuidance = INPUT_MODE_GUIDANCE[inputMode];
  const normalizedUrls = useMemo(
    () =>
      urlsText
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
    [urlsText],
  );
  const hasPastedContent = Boolean(pastedContent.trim());
  const materialUnitCount = files.length + normalizedUrls.length + (hasPastedContent ? 1 : 0);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    if (inputMode === "single_document_intake") {
      if (files.length !== 1 || normalizedUrls.length > 0 || hasPastedContent) {
        setSubmitting(false);
        setError("單文件進件建立時需附上一份主文件，且不可同時混入網址或額外補充文字。");
        return;
      }
    }

    if (inputMode === "multi_material_case" && materialUnitCount < 2) {
      setSubmitting(false);
      setError("多材料案件建立時，至少要掛兩份材料，可混合檔案、網址或補充文字。");
      return;
    }

    const payload: TaskCreatePayload = {
      title: derivedTitle,
      description,
      task_type: flow.taskType,
      mode: flow.mode,
      entry_preset: inputMode,
      external_data_strategy: externalDataStrategy,
      engagement_continuity_mode: continuityMode,
      writeback_depth: writebackDepth,
      client_type: inferClientType(description),
      client_stage: inferClientStage(description),
      engagement_name: derivedTitle || undefined,
      engagement_description: description || undefined,
      workstream_name: subjectName || flow.label,
      workstream_description: scopeNotes || undefined,
      domain_lenses: inferDomainLenses({
        description,
        subjectName,
        flowValue: flow.value,
      }),
      decision_title: derivedTitle ? `${derivedTitle}｜決策問題` : undefined,
      decision_summary: description || undefined,
      judgment_to_make: analysisDepth || undefined,
      background_text: consultantBrief,
      notes: [`正式進件模式：${selectedInputMode.label}`, inputModeGuidance.workflowNote]
        .filter(Boolean)
        .join("\n"),
      assumptions: assumptions || undefined,
      subject_name: subjectName || undefined,
      goal_description: analysisDepth || undefined,
      constraints: constraintInput
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => ({
          description: item,
          constraint_type: "general",
          severity: "medium",
        })),
      initial_source_urls: normalizedUrls,
      initial_pasted_text: pastedContent,
      initial_pasted_title: hasPastedContent ? "手動貼上內容" : undefined,
      initial_file_descriptors: files.map((file) => ({
        file_name: file.name,
        content_type: file.type || undefined,
        file_size: file.size,
      })),
    };

    try {
      const task = await createTask(payload);
      if (files.length > 0) {
        await uploadTaskFiles(task.id, files);
      }

      if (normalizedUrls.length > 0 || hasPastedContent) {
        await ingestTaskSources(task.id, {
          urls: normalizedUrls,
          pasted_text: pastedContent,
          pasted_title: pastedContent.trim() ? "手動貼上內容" : undefined,
        });
      }

      setSuccess("案件世界已先建立，接下來會直接回到案件工作台；task 會作為同一個世界裡的 work slice 持續推進。");
      onCreated(task);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "建立任務失敗。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">建立任務</h2>
          <p className="panel-copy">
            先把你真正想判斷的問題寫下來，Infinite Pro 會先編譯案件世界，再把這輪工作掛成可推進的 work slice。
          </p>
        </div>
      </div>

      <form className="form-grid" onSubmit={handleSubmit}>
        <section className="intake-section">
          <div className="section-heading">
            <h3>進件入口</h3>
            <p>這三種只是進入同一條 canonical intake pipeline 的不同入口；系統會先形成案件世界，再在其中開出第一個 task work slice。</p>
          </div>

          <div className="page-tabs" role="tablist" aria-label="新案件進件入口">
            {INPUT_MODE_OPTIONS.map((option) => (
              <button
                key={option.value}
                className={`page-tab${inputMode === option.value ? " page-tab-active" : ""}`}
                type="button"
                onClick={() => {
                  setInputMode(option.value);
                  setContinuityMode((current) =>
                    current === defaultContinuityModeForInputMode(inputMode)
                      ? defaultContinuityModeForInputMode(option.value)
                      : current,
                  );
                  setWritebackDepth((current) =>
                    current === defaultWritebackDepthForInputMode(inputMode)
                      ? defaultWritebackDepthForInputMode(option.value)
                      : current,
                  );
                  if (option.value === "multi_material_case") {
                    setShowAdvanced(true);
                  }
                }}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="setting-note-card">
            <h3>{selectedInputMode.label}</h3>
            <p className="content-block">{selectedInputMode.description}</p>
            <div className="meta-row" style={{ marginTop: "12px" }}>
              <span>{inputModeGuidance.requirement}</span>
            </div>
          </div>

          <div className="summary-grid">
            <div className="section-card">
              <h4>建立要求</h4>
              <p className="content-block">{inputModeGuidance.requirement}</p>
            </div>
            <div className="section-card">
              <h4>工作流節奏</h4>
              <p className="content-block">{inputModeGuidance.workflowNote}</p>
            </div>
            <div className="section-card">
              <h4>材料規則</h4>
              <p className="content-block">{inputModeGuidance.materialHint}</p>
            </div>
            <div className="section-card">
              <h4>案件連續性</h4>
              <p className="content-block">
                {CONTINUITY_MODE_OPTIONS.find((item) => item.value === continuityMode)?.label} /{" "}
                {WRITEBACK_DEPTH_OPTIONS.find((item) => item.value === writebackDepth)?.label}
              </p>
            </div>
          </div>
        </section>

        <section className="intake-section">
          <div className="section-heading">
            <h3>從問題開始</h3>
            <p>
              {inputMode === "one_line_inquiry"
                ? "先用一句話描述你想判斷的問題，系統會自動生成任務名稱與工作流程。"
                : "先把這次要判斷的核心問題定清楚，再補上文件、網址或多份來源。"}
            </p>
          </div>

          <div className="field">
            <label htmlFor="task-description">核心問題</label>
            <textarea
              id="task-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="例如：我想評估做一個幣圈數據工具是否值得投入"
              required
            />
            <small>系統會自動用你的問題生成任務名稱，並先用最合適的分析流程啟動。</small>
          </div>

          <div className="button-row" style={{ justifyContent: "flex-start", marginTop: "12px" }}>
            <button className="button-primary" type="submit" disabled={submitting}>
              {submitting ? "建立案件中..." : inputModeGuidance.submitLabel}
            </button>
          </div>

          {error ? <p className="error-text">{error}</p> : null}
          {success ? <p className="success-text">{success}</p> : null}
        </section>

        <section className="intake-section">
          <div className="section-heading">
            <h3 style={{ fontSize: "1rem", marginBottom: "6px" }}>（選填）補充資料</h3>
            <p style={{ marginTop: 0 }}>
              正式支援：MD、TXT、DOCX、XLSX、CSV、text-based PDF、URL、補充文字。有限支援：JPG / JPEG、PNG、WEBP、掃描型 PDF 目前只建立 metadata / reference，不預設 OCR。
            </p>
          </div>

          <div className="field">
            <label htmlFor="source-urls">網址</label>
            <textarea
              id="source-urls"
              value={urlsText}
              onChange={(event) => setUrlsText(event.target.value)}
              placeholder={"每行一個網址，例如：\nhttps://example.com/article\nhttps://docs.google.com/document/d/..."}
            />
            <small>
              {inputMode === "single_document_intake"
                ? "單文件進件建立時不接受網址；若後續需要補件，請先開案後再到案件世界追加。"
                : inputMode === "multi_material_case"
                  ? "可一次整理多個來源網址，適合把外部研究、客戶文件與背景材料一起帶進來。"
                  : "支援網頁、新聞、部落格、PDF 網址與 Google Docs。"}
            </small>
          </div>

          <div className="field">
            <label htmlFor="source-files">上傳檔案</label>
            <input
              id="source-files"
              type="file"
              multiple
              accept=".md,.txt,.docx,.xlsx,.csv,.pdf,.jpg,.jpeg,.png,.webp,text/plain,text/markdown,text/csv,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/jpeg,image/png,image/webp"
              onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
            />
            <small>
              {inputMode === "single_document_intake"
                ? "單文件進件會優先把這份主文件整理成案件工作底稿，建立時請只附上一份檔案。"
                : inputMode === "multi_material_case"
                  ? "多材料案件可同時掛多份檔案，之後也能持續補件。"
                  : "若你手上已有檔案，也可一開始就一起帶進案件世界。"}
            </small>
          </div>

          <div className="field">
            <label htmlFor="source-paste">貼上內容</label>
            <textarea
              id="source-paste"
              value={pastedContent}
              onChange={(event) => setPastedContent(event.target.value)}
              placeholder="直接貼上會議摘要、研究摘錄、內部筆記或任何可供分析的原始內容"
            />
            <small>
              {inputMode === "single_document_intake"
                ? "單文件進件建立時不混用補充文字；請先用主文件開案，之後再進案件世界補件。"
                : "補充文字會被當成正式 source material 掛回同一個案件。"}
            </small>
          </div>

          <div className="summary-grid">
            <div className="section-card">
              <h4>目前材料數</h4>
              <p className="content-block">{materialUnitCount} 個材料單位</p>
            </div>
            <div className="section-card">
              <h4>原始檔保留</h4>
              <p className="content-block">原始進件檔預設短期保存；正式 artifact 保留較久，但 publish / audit record 不會跟著 raw file 一起消失。</p>
            </div>
            <div className="section-card">
              <h4>建立後可做什麼</h4>
              <p className="content-block">完成後會直接進入案件工作台，後續可在來源與證據工作面補檔、補網址、補文字，不會中斷同一案件脈絡。</p>
            </div>
          </div>

          <div className="field">
            <label htmlFor="external-data-strategy">需要系統幫你補充資料嗎？</label>
            <select
              id="external-data-strategy"
              value={externalDataStrategy}
              onChange={(event) =>
                setExternalDataStrategy(event.target.value as ExternalDataStrategy)
              }
            >
              {EXTERNAL_DATA_STRATEGY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <small>
              {
                EXTERNAL_DATA_STRATEGY_OPTIONS.find(
                  (option) => option.value === externalDataStrategy,
                )?.description
              }
            </small>
          </div>
        </section>

        <section className="intake-section">
          <div className="panel-header">
            <div>
              <h3 className="panel-title">進階設定（選填）</h3>
              <p className="panel-copy">只有在你想手動干預分析邏輯時再展開。預設情況下，Infinite Pro 會先自動判斷。</p>
            </div>
            <button
              className="button-secondary"
              type="button"
              onClick={() => setShowAdvanced((previous) => !previous)}
            >
              {showAdvanced ? "收合進階設定" : "展開進階設定"}
            </button>
          </div>

          {showAdvanced ? (
            <div className="detail-list">
              <div className="field">
                <label htmlFor="workflow-preference">工作流程</label>
                <select
                  id="workflow-preference"
                  value={workflowPreference}
                  onChange={(event) =>
                    setWorkflowPreference(event.target.value as WorkflowPreference)
                  }
                >
                  <option value="auto">自動判斷</option>
                  {FLOW_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <small>
                  {workflowPreference === "auto"
                    ? `目前會自動判斷為「${flow.label}」。${flow.description}`
                    : flow.description}
                </small>
              </div>

              <div className="field">
                <label htmlFor="continuity-mode">案件連續性策略</label>
                <select
                  id="continuity-mode"
                  value={continuityMode}
                  onChange={(event) =>
                    setContinuityMode(event.target.value as EngagementContinuityMode)
                  }
                >
                  {CONTINUITY_MODE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <small>
                  {
                    CONTINUITY_MODE_OPTIONS.find(
                      (option) => option.value === continuityMode,
                    )?.description
                  }
                </small>
              </div>

              <div className="field">
                <label htmlFor="writeback-depth">寫回深度</label>
                <select
                  id="writeback-depth"
                  value={writebackDepth}
                  onChange={(event) =>
                    setWritebackDepth(event.target.value as WritebackDepth)
                  }
                >
                  {WRITEBACK_DEPTH_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <small>
                  {
                    WRITEBACK_DEPTH_OPTIONS.find(
                      (option) => option.value === writebackDepth,
                    )?.description
                  }
                </small>
              </div>

              <div className="field">
                <label htmlFor="subject-name">分析對象（選填）</label>
                <input
                  id="subject-name"
                  value={subjectName}
                  onChange={(event) => setSubjectName(event.target.value)}
                  placeholder="例如：客戶、提案、某個市場、某份文件、某個決策主題"
                />
              </div>

              <div className="field">
                <label htmlFor="analysis-depth">你希望這份分析做到什麼程度？</label>
                <textarea
                  id="analysis-depth"
                  value={analysisDepth}
                  onChange={(event) => setAnalysisDepth(event.target.value)}
                  placeholder="例如：先形成一頁決策摘要，列出三個高優先建議、主要風險與建議下一步。"
                />
              </div>

              <div className="field">
                <label htmlFor="constraints-input">有沒有不能踩的限制或前提？</label>
                <textarea
                  id="constraints-input"
                  value={constraintInput}
                  onChange={(event) => setConstraintInput(event.target.value)}
                  placeholder={"例如：\n今天內要先交內部版本\n不能對外引用未確認數字\n法務還沒正式看過"}
                />
              </div>

              <div className="field">
                <label htmlFor="assumptions">有沒有已知假設？</label>
                <textarea
                  id="assumptions"
                  value={assumptions}
                  onChange={(event) => setAssumptions(event.target.value)}
                  placeholder="例如：先假設預算不增加、主要客群不變、時程以兩季內為主"
                />
              </div>

              <div className="field">
                <label htmlFor="scope-notes">是否有特定研究範圍或排除範圍？</label>
                <textarea
                  id="scope-notes"
                  value={scopeNotes}
                  onChange={(event) => setScopeNotes(event.target.value)}
                  placeholder="例如：只看市場訊號與競品，不含財務模型與法規細節"
                />
              </div>

              <div className="field">
                <label htmlFor="target-reader">目標讀者是誰？</label>
                <input
                  id="target-reader"
                  value={targetReader}
                  onChange={(event) => setTargetReader(event.target.value)}
                  placeholder="例如：合夥人、專案經理、客戶內部主管、法務窗口"
                />
              </div>
            </div>
          ) : null}
        </section>
      </form>
    </section>
  );
}
