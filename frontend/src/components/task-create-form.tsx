"use client";

import { FormEvent, useMemo, useState } from "react";

import { createTask, ingestTaskSources, uploadTaskFiles } from "@/lib/api";
import type { TaskAggregate, TaskCreatePayload } from "@/lib/types";

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

function buildConsultantBrief({
  flowLabel,
  title,
  description,
  subjectName,
  analysisDepth,
  assumptions,
  scopeNotes,
  targetReader,
}: {
  flowLabel: string;
  title: string;
  description: string;
  subjectName: string;
  analysisDepth: string;
  assumptions: string;
  scopeNotes: string;
  targetReader: string;
}) {
  return [
    `工作流程：${flowLabel}`,
    `任務名稱：${title.trim()}`,
    `核心問題：${description.trim()}`,
    subjectName.trim() ? `分析對象：${subjectName.trim()}` : "",
    analysisDepth.trim() ? `希望這份分析做到的程度：${analysisDepth.trim()}` : "",
    assumptions.trim() ? `已確定的假設：${assumptions.trim()}` : "",
    scopeNotes.trim() ? `研究範圍 / 排除範圍：${scopeNotes.trim()}` : "",
    targetReader.trim() ? `目標讀者：${targetReader.trim()}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function TaskCreateForm({ onCreated }: TaskCreateFormProps) {
  const [selectedFlow, setSelectedFlow] = useState<FlowOption["value"]>("research_synthesis");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [urlsText, setUrlsText] = useState("");
  const [pastedContent, setPastedContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [analysisDepth, setAnalysisDepth] = useState("");
  const [constraintInput, setConstraintInput] = useState("");
  const [assumptions, setAssumptions] = useState("");
  const [scopeNotes, setScopeNotes] = useState("");
  const [targetReader, setTargetReader] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const flow = FLOW_OPTIONS.find((item) => item.value === selectedFlow) ?? FLOW_OPTIONS[0];
  const consultantBrief = useMemo(
    () =>
      buildConsultantBrief({
        flowLabel: flow.label,
        title,
        description,
        subjectName,
        analysisDepth,
        assumptions,
        scopeNotes,
        targetReader,
      }),
    [analysisDepth, assumptions, description, flow.label, scopeNotes, subjectName, targetReader, title],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const payload: TaskCreatePayload = {
      title,
      description,
      task_type: flow.taskType,
      mode: flow.mode,
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
            預設先用最少輸入建立案件，讓系統先接手做顧問式補框；需要時再展開進階模式，補充你想干預的判斷脈絡。
          </p>
        </div>
      </div>

      <form className="form-grid" onSubmit={handleSubmit}>
        <section className="intake-section">
          <div className="section-heading">
            <h3>簡化模式</h3>
            <p>先用最少必要資訊建立任務，系統會在建立後再提供建議補充與 readiness 判讀。</p>
          </div>

          <div className="field">
            <label htmlFor="task-flow">工作流程</label>
            <select
              id="task-flow"
              value={selectedFlow}
              onChange={(event) => setSelectedFlow(event.target.value as FlowOption["value"])}
            >
              {FLOW_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <small>{flow.description}</small>
          </div>

          <div className="field">
            <label htmlFor="task-title">任務名稱</label>
            <input
              id="task-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="例如：東南亞市場切入方向的內部判斷稿"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="task-description">核心問題</label>
            <textarea
              id="task-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="把你真正想判斷的問題直接寫出來，其他框架與交付深度先交給系統補齊。"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="subject-name">分析對象（選填）</label>
            <input
              id="subject-name"
              value={subjectName}
              onChange={(event) => setSubjectName(event.target.value)}
              placeholder="例如：客戶、提案、特定市場、某份文件、某項決策主題"
            />
          </div>
        </section>

        <section className="intake-section">
          <div className="section-heading">
            <h3>資料來源</h3>
            <p>統一入口支援網址、檔案與直接貼內容。建立任務後，系統會把它們轉成 normalized text、metadata 與 evidence。</p>
          </div>

          <div className="field">
            <label htmlFor="source-urls">貼上網址</label>
            <textarea
              id="source-urls"
              value={urlsText}
              onChange={(event) => setUrlsText(event.target.value)}
              placeholder={"每行一個網址，例如：\nhttps://example.com/article\nhttps://docs.google.com/document/d/..."}
            />
            <small>支援 HTML / 新聞 / 部落格 / PDF URL / Google Docs。</small>
          </div>

          <div className="field">
            <label htmlFor="source-files">上傳檔案</label>
            <input
              id="source-files"
              type="file"
              multiple
              onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
            />
            <small>目前支援 PDF、DOCX、TXT、MD。</small>
          </div>

          <div className="field">
            <label htmlFor="source-paste">直接貼內容</label>
            <textarea
              id="source-paste"
              value={pastedContent}
              onChange={(event) => setPastedContent(event.target.value)}
              placeholder="直接貼上會議摘要、研究摘錄、內部筆記或任何可供分析的原始內容"
            />
          </div>
        </section>

        <section className="intake-section">
          <div className="panel-header">
            <div>
              <h3 className="panel-title">進階模式</h3>
              <p className="panel-copy">只有在你想干預顧問框架時再展開，否則系統會先自動補齊。</p>
            </div>
            <button
              className="button-secondary"
              type="button"
              onClick={() => setShowAdvanced((previous) => !previous)}
            >
              {showAdvanced ? "收合進階模式" : "展開進階模式"}
            </button>
          </div>

          {showAdvanced ? (
            <div className="detail-list">
              <div className="field">
                <label htmlFor="analysis-depth">你希望這份分析做到什麼程度？</label>
                <textarea
                  id="analysis-depth"
                  value={analysisDepth}
                  onChange={(event) => setAnalysisDepth(event.target.value)}
                  placeholder="例如：先形成一頁內部決策摘要，並提出三個高優先建議與風險"
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
                <label htmlFor="assumptions">有沒有已確定的假設？</label>
                <textarea
                  id="assumptions"
                  value={assumptions}
                  onChange={(event) => setAssumptions(event.target.value)}
                  placeholder="例如：先假設預算不增加、主要客群不變、時程以兩季內為主"
                />
              </div>

              <div className="field">
                <label htmlFor="scope-notes">有沒有特定研究範圍或排除範圍？</label>
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

        <div className="button-row">
          <button className="button-primary" type="submit" disabled={submitting}>
            {submitting ? "建立任務中..." : "建立任務"}
          </button>
        </div>

        {error ? <p className="error-text">{error}</p> : null}
        {success ? <p className="success-text">{success}</p> : null}
      </form>
    </section>
  );
}
