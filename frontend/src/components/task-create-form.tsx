"use client";

import { FormEvent, useMemo, useState } from "react";

import { createTask, ingestTaskSources, uploadTaskFiles } from "@/lib/api";
import type {
  ExternalDataStrategy,
  TaskAggregate,
  TaskCreatePayload,
} from "@/lib/types";

interface TaskCreateFormProps {
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
    description: "適合快速辨識高風險條款、審閱議題與 redline / issue spotting 方向。",
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

function labelForExternalDataStrategy(value: ExternalDataStrategy) {
  return (
    EXTERNAL_DATA_STRATEGY_OPTIONS.find((item) => item.value === value)?.label ??
    EXTERNAL_DATA_STRATEGY_OPTIONS[1].label
  );
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

export function TaskCreateForm({ onCreated }: TaskCreateFormProps) {
  const [workflowPreference, setWorkflowPreference] = useState<WorkflowPreference>("auto");
  const [description, setDescription] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [urlsText, setUrlsText] = useState("");
  const [pastedContent, setPastedContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [externalDataStrategy, setExternalDataStrategy] =
    useState<ExternalDataStrategy>("supplemental");
  const [showAdvanced, setShowAdvanced] = useState(false);
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
  const consultantBrief = useMemo(
    () =>
      buildConsultantBrief({
        flowLabel: flow.label,
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
      scopeNotes,
      subjectName,
      targetReader,
      derivedTitle,
    ],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const payload: TaskCreatePayload = {
      title: derivedTitle,
      description,
      task_type: flow.taskType,
      mode: flow.mode,
      external_data_strategy: externalDataStrategy,
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
      decision_title: derivedTitle ? `${derivedTitle}｜Decision Context` : undefined,
      decision_summary: description || undefined,
      judgment_to_make: analysisDepth || undefined,
      background_text: consultantBrief,
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
    };

    try {
      const task = await createTask(payload);
      if (files.length > 0) {
        await uploadTaskFiles(task.id, files);
      }

      const urls = urlsText
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);
      if (urls.length > 0 || pastedContent.trim()) {
        await ingestTaskSources(task.id, {
          urls,
          pasted_text: pastedContent,
          pasted_title: pastedContent.trim() ? "手動貼上內容" : undefined,
        });
      }

      setSuccess("任務已建立。接下來可在任務頁查看建議補充、來源 ingestion 與分析結果。");
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
            先把你真正想判斷的問題寫下來，Infinite Pro 會先幫你補框，再把資料整理成可分析的案件。
          </p>
        </div>
      </div>

      <form className="form-grid" onSubmit={handleSubmit}>
        <section className="intake-section">
          <div className="section-heading">
            <h3>從問題開始</h3>
            <p>先用一句話描述你想判斷的問題。系統會自動產生任務名稱，並預設自動判斷工作流程。</p>
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
              {submitting ? "開始分析中..." : "開始分析"}
            </button>
          </div>

          {error ? <p className="error-text">{error}</p> : null}
          {success ? <p className="success-text">{success}</p> : null}
        </section>

        <section className="intake-section">
          <div className="section-heading">
            <h3 style={{ fontSize: "1rem", marginBottom: "6px" }}>（選填）補充資料</h3>
            <p style={{ marginTop: 0 }}>如果你手上已有資料，可直接貼網址、上傳檔案或貼上原始內容。</p>
          </div>

          <div className="field">
            <label htmlFor="source-urls">URL</label>
            <textarea
              id="source-urls"
              value={urlsText}
              onChange={(event) => setUrlsText(event.target.value)}
              placeholder={"每行一個網址，例如：\nhttps://example.com/article\nhttps://docs.google.com/document/d/..."}
            />
            <small>支援網頁、新聞、部落格、PDF URL、Google Docs。</small>
          </div>

          <div className="field">
            <label htmlFor="source-files">upload</label>
            <input
              id="source-files"
              type="file"
              multiple
              accept=".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown"
              onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
            />
            <small>目前支援 PDF、DOCX、TXT、MD。</small>
          </div>

          <div className="field">
            <label htmlFor="source-paste">paste</label>
            <textarea
              id="source-paste"
              value={pastedContent}
              onChange={(event) => setPastedContent(event.target.value)}
              placeholder="直接貼上會議摘要、研究摘錄、內部筆記或任何可供分析的原始內容"
            />
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
