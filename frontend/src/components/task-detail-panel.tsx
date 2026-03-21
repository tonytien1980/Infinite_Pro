"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getTask, runTask } from "@/lib/api";
import {
  assessTaskReadiness,
  buildExecutiveSummary,
  getGoalSuccessCriteria,
  getLatestDeliverable,
  getStructuredStringList,
} from "@/lib/advisory-workflow";
import type { TaskAggregate } from "@/lib/types";
import {
  extractModeSpecificAppendix,
  getModeDefinition,
  getModeSpecificEntries,
  getModeSpecificResultSections,
  resolveWorkflowKey,
} from "@/lib/workflow-modes";
import {
  formatDisplayDate,
  labelForActionStatus,
  labelForAgentId,
  labelForEvidenceType,
  labelForFlowMode,
  labelForPriority,
  labelForRunStatus,
  labelForSourceType,
  labelForStructuredField,
  labelForTaskStatus,
  labelForTaskType,
  translateStructuredValue,
} from "@/lib/ui-labels";

function buildRunMeta(task: TaskAggregate) {
  if (task.mode === "multi_agent") {
    return {
      title: "執行多代理流程",
      copy: "Host 會協調固定的 4 個核心代理，輸出收斂後的建議、風險與下一步。",
      buttonIdle: "執行多代理流程",
      buttonRunning: "多代理流程執行中...",
    };
  }

  if (task.task_type === "contract_review") {
    return {
      title: "執行合約審閱",
      copy: "Host 會把這個任務導向合約審閱代理，回寫可供內部使用的結構化審閱結果。",
      buttonIdle: "執行合約審閱",
      buttonRunning: "合約審閱執行中...",
    };
  }

  if (task.task_type === "document_restructuring") {
    return {
      title: "執行文件重構",
      copy: "Host 會把這個任務導向文件重構代理，產出可供重寫與重組的交付建議。",
      buttonIdle: "執行文件重構",
      buttonRunning: "文件重構執行中...",
    };
  }

  return {
    title: "執行研究綜整",
    copy: "Host 會把這個任務導向研究綜整代理，整理出可供內部討論的發現、建議與行動。",
    buttonIdle: "執行研究綜整",
    buttonRunning: "研究綜整執行中...",
  };
}

function renderStructuredValue(label: string, value: unknown) {
  const displayLabel = labelForStructuredField(label);
  const translatedValue = translateStructuredValue(label, value);

  if (Array.isArray(translatedValue)) {
    return (
      <section className="section-card" key={label}>
        <h4>{displayLabel}</h4>
        <ul className="list-content">
          {translatedValue.map((item, index) => (
            <li key={`${label}-${index}`}>
              {typeof item === "string" ? item : JSON.stringify(item)}
            </li>
          ))}
        </ul>
      </section>
    );
  }

  if (translatedValue && typeof translatedValue === "object") {
    return (
      <section className="section-card" key={label}>
        <h4>{displayLabel}</h4>
        <pre className="json-block">{JSON.stringify(translatedValue, null, 2)}</pre>
      </section>
    );
  }

  return (
    <section className="section-card" key={label}>
      <h4>{displayLabel}</h4>
      <p className="content-block">{String(translatedValue ?? "")}</p>
    </section>
  );
}

function ModeSectionList({
  title,
  description,
  items,
  emptyText,
  translateAsAgentIds = false,
}: {
  title: string;
  description: string;
  items: string[];
  emptyText: string;
  translateAsAgentIds?: boolean;
}) {
  return (
    <section className="panel">
      <h2 className="section-title">{title}</h2>
      <p className="panel-copy" style={{ marginBottom: "16px" }}>
        {description}
      </p>
      {items.length > 0 ? (
        <div className="detail-item">
          <ul className="list-content">
            {items.map((item) => (
              <li key={item}>{translateAsAgentIds ? labelForAgentId(item) : item}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="empty-text">{emptyText}</p>
      )}
    </section>
  );
}

export function TaskDetailPanel({ taskId }: { taskId: string }) {
  const [task, setTask] = useState<TaskAggregate | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refreshTask() {
    try {
      setLoading(true);
      setError(null);
      const response = await getTask(taskId);
      setTask(response);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "載入任務失敗。");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refreshTask();
  }, [taskId]);

  async function handleRun() {
    try {
      setRunning(true);
      setError(null);
      await runTask(taskId);
      await refreshTask();
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "執行所選流程失敗。");
    } finally {
      setRunning(false);
    }
  }

  const latestDeliverable = task ? getLatestDeliverable(task) : null;
  const latestMissingInformation = getStructuredStringList(latestDeliverable, "missing_information");
  const structuredFindings = getStructuredStringList(latestDeliverable, "findings");
  const participatingAgents = getStructuredStringList(latestDeliverable, "participating_agents");
  const readiness = task ? assessTaskReadiness(task) : null;
  const executiveSummary = task ? buildExecutiveSummary(task, latestDeliverable) : null;
  const runMeta = task ? buildRunMeta(task) : null;
  const successCriteria = task ? getGoalSuccessCriteria(task.goals) : [];
  const latestContext = task?.contexts[0];
  const workflowKey = task ? resolveWorkflowKey(task.task_type, task.mode) : null;
  const workflowDefinition = workflowKey ? getModeDefinition(workflowKey) : null;
  const parsedAppendix = extractModeSpecificAppendix(latestContext?.summary ?? "");
  const modeSpecificEntries =
    workflowKey && parsedAppendix.workflowKey
      ? getModeSpecificEntries(workflowKey, parsedAppendix.values)
      : [];
  const modeSpecificSections =
    task && latestDeliverable ? getModeSpecificResultSections(task, latestDeliverable) : [];
  const sortedRecommendations = task?.recommendations
    ? [...task.recommendations].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
    : [];
  const sortedRisks = task?.risks
    ? [...task.risks].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
    : [];
  const sortedActionItems = task?.action_items
    ? [...task.action_items].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
    : [];

  return (
    <main className="page-shell">
      <Link className="back-link" href="/">
        ← 返回工作台
      </Link>

      {loading ? <p className="status-text">正在載入任務工作區...</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      {task ? (
        <>
          <section className="hero-card">
            <span className="eyebrow">顧問案件工作區</span>
            <h1 className="page-title">{task.title}</h1>
            <p className="page-subtitle">{task.description || "未提供額外說明。"}</p>
            <div className="meta-row" style={{ marginTop: "16px" }}>
              <span className="pill">{labelForTaskStatus(task.status)}</span>
              <span>{labelForTaskType(task.task_type)}</span>
              <span>{labelForFlowMode(task.mode)}</span>
              <span>更新於 {formatDisplayDate(task.updated_at)}</span>
            </div>
          </section>

          <div className="detail-grid">
            <div className="detail-stack">
              <section className="panel">
                <div className="panel-header">
                  <div>
                    <h2 className="panel-title">分析準備度與執行</h2>
                    <p className="panel-copy">
                      執行前先檢查背景、證據與待補資料，避免結果出來後才發現素材不足。
                    </p>
                  </div>
                  {readiness ? (
                    <span className={`status-badge status-${readiness.level}`}>{readiness.label}</span>
                  ) : null}
                </div>

                {readiness ? (
                  <>
                    <div className="summary-grid">
                      <div className="section-card">
                        <h4>背景是否足夠</h4>
                        <p className="content-block">{readiness.backgroundStatus}</p>
                      </div>
                      <div className="section-card">
                        <h4>證據是否足夠</h4>
                        <p className="content-block">{readiness.evidenceStatus}</p>
                      </div>
                    </div>

                    {readiness.missingItems.length > 0 ? (
                      <div className="detail-item" style={{ marginTop: "14px" }}>
                        <h3>目前缺少的關鍵資料</h3>
                        <ul className="list-content">
                          {readiness.missingItems.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {readiness.warnings.length > 0 ? (
                      <div className="detail-item" style={{ marginTop: "14px" }}>
                        <h3>建議補充</h3>
                        <ul className="list-content">
                          {readiness.warnings.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {readiness.degradedOutputLikely ? (
                      <p className="error-text">
                        目前若直接執行，系統可能會產出帶有明確缺漏註記的降級結果。
                      </p>
                    ) : null}
                  </>
                ) : null}

                <div className="panel-header" style={{ marginTop: "18px", marginBottom: 0 }}>
                  <div>
                    <h3 className="panel-title">{runMeta?.title ?? "執行任務流程"}</h3>
                    <p className="panel-copy">{runMeta?.copy}</p>
                  </div>
                  <button
                    className="button-primary"
                    type="button"
                    onClick={handleRun}
                    disabled={running}
                  >
                    {running ? runMeta?.buttonRunning ?? "執行中..." : runMeta?.buttonIdle}
                  </button>
                </div>
              </section>

              <section className="panel">
                <h2 className="section-title">決策摘要</h2>
                {executiveSummary ? (
                  <div className="section-list">
                    <div className="detail-item">
                      <p className="content-block">{executiveSummary.headline}</p>
                    </div>
                    <div className="section-card">
                      <ul className="list-content">
                        {executiveSummary.bullets.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <p className="empty-text">尚未產出可供決策閱讀的摘要。</p>
                )}
              </section>

              <section className="panel">
                <h2 className="section-title">主要建議</h2>
                <div className="detail-list">
                  {sortedRecommendations.length > 0 ? (
                    sortedRecommendations.slice(0, 3).map((recommendation) => (
                      <div className="detail-item" key={recommendation.id}>
                        <div className="meta-row">
                          <span className="pill">{labelForPriority(recommendation.priority)}</span>
                          <span>{formatDisplayDate(recommendation.created_at)}</span>
                        </div>
                        <h3>{recommendation.summary}</h3>
                        <p className="content-block">{recommendation.rationale}</p>
                      </div>
                    ))
                  ) : (
                    <p className="empty-text">尚未記錄任何建議。</p>
                  )}
                </div>
              </section>

              <section className="panel">
                <h2 className="section-title">主要風險</h2>
                <div className="detail-list">
                  {sortedRisks.length > 0 ? (
                    sortedRisks.slice(0, 3).map((risk) => (
                      <div className="detail-item" key={risk.id}>
                        <div className="meta-row">
                          <span className="pill">{risk.impact_level}</span>
                          <span>{formatDisplayDate(risk.created_at)}</span>
                        </div>
                        <h3>{risk.title}</h3>
                        <p className="content-block">{risk.description}</p>
                      </div>
                    ))
                  ) : (
                    <p className="empty-text">尚未記錄任何風險。</p>
                  )}
                </div>
              </section>

              <section className="panel">
                <h2 className="section-title">行動項目</h2>
                <div className="detail-list">
                  {sortedActionItems.length > 0 ? (
                    sortedActionItems.slice(0, 4).map((actionItem) => (
                      <div className="detail-item" key={actionItem.id}>
                        <div className="meta-row">
                          <span className="pill">{labelForPriority(actionItem.priority)}</span>
                          <span>{labelForActionStatus(actionItem.status)}</span>
                          <span>{formatDisplayDate(actionItem.created_at)}</span>
                        </div>
                        <h3>{actionItem.description}</h3>
                        <p className="muted-text">
                          建議負責人：{actionItem.suggested_owner || "任務負責人"}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="empty-text">尚未記錄任何行動項目。</p>
                  )}
                </div>
              </section>

              <section className="panel">
                <h2 className="section-title">缺漏資訊</h2>
                <div className="detail-list">
                  {latestMissingInformation.length > 0 ? (
                    <div className="detail-item">
                      <ul className="list-content">
                        {latestMissingInformation.map((item, index) => (
                          <li key={`${index}-${item}`}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="empty-text">最新交付物目前沒有明確標記缺漏資訊。</p>
                  )}
                </div>
              </section>

              {modeSpecificSections.map((section) => (
                <ModeSectionList
                  key={section.title}
                  title={section.title}
                  description={section.description}
                  items={section.items}
                  emptyText={section.emptyText}
                  translateAsAgentIds={section.translateAsAgentIds}
                />
              ))}
            </div>

            <div className="detail-stack">
              <section className="panel">
                <h2 className="section-title">附錄 / 檢查資訊</h2>
                <p className="panel-copy" style={{ marginBottom: "16px" }}>
                  往下查看案件進件摘要、完整交付物、支持證據、歷史與 ontology / 工作物件檢視。
                </p>

                <div className="detail-list">
                  <div className="detail-item">
                    <h3>案件進件摘要</h3>
                    <div className="detail-list">
                      <div className="detail-item">
                        <h3>核心問題</h3>
                        <p className="content-block">{task.description || task.title}</p>
                      </div>
                      <div className="detail-item">
                        <h3>分析對象</h3>
                        {task.subjects.length > 0 ? (
                          <ul className="list-content">
                            {task.subjects.map((subject) => (
                              <li key={subject.id}>
                                {subject.name}
                                {subject.description ? `：${subject.description}` : ""}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="muted-text">尚未設定分析對象。</p>
                        )}
                      </div>
                      <div className="detail-item">
                        <h3>交付目標</h3>
                        {task.goals.length > 0 ? (
                          <ul className="list-content">
                            {task.goals.map((goal) => (
                              <li key={goal.id}>{goal.description}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="muted-text">尚未設定明確交付目標。</p>
                        )}
                      </div>
                      <div className="detail-item">
                        <h3>成功標準 / 判斷標準</h3>
                        {successCriteria.length > 0 ? (
                          <ul className="list-content">
                            {successCriteria.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="muted-text">尚未設定明確成功標準。</p>
                        )}
                      </div>
                      <div className="detail-item">
                        <h3>已有資料</h3>
                        <p className="content-block">{latestContext?.notes || "尚未整理目前已掌握資料。"}</p>
                      </div>
                      <div className="detail-item">
                        <h3>缺少資料 / 待確認假設</h3>
                        <p className="content-block">
                          {latestContext?.assumptions || "尚未列出待補資料或待確認假設。"}
                        </p>
                      </div>
                      <div className="detail-item">
                        <h3>限制條件</h3>
                        {task.constraints.length > 0 ? (
                          <ul className="list-content">
                            {task.constraints.map((constraint) => (
                              <li key={constraint.id}>{constraint.description}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="muted-text">尚未新增明確限制條件。</p>
                        )}
                      </div>
                      <div className="detail-item">
                        <h3>背景脈絡</h3>
                        <p className="content-block">
                          {parsedAppendix.backgroundText || "尚未提供手動背景文字。"}
                        </p>
                      </div>
                      {modeSpecificEntries.length > 0 ? (
                        <div className="detail-item">
                          <h3>{workflowDefinition?.title ?? "流程補充設定"}</h3>
                          <ul className="list-content">
                            {modeSpecificEntries.map((entry) => (
                              <li key={entry.label}>
                                {entry.label}：{entry.value}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="detail-item">
                    <h3>完整交付物</h3>
                    {latestDeliverable ? (
                      <div className="section-list">
                        <div className="detail-item">
                          <h3>{latestDeliverable.title}</h3>
                          <div className="meta-row">
                            <span>版本 {latestDeliverable.version}</span>
                            <span>{formatDisplayDate(latestDeliverable.generated_at)}</span>
                          </div>
                        </div>
                        {Object.entries(latestDeliverable.content_structure).map(([label, value]) =>
                          renderStructuredValue(label, value),
                        )}
                      </div>
                    ) : (
                      <p className="empty-text">尚未產生交付物。請先執行所選流程，建立第一份結果。</p>
                    )}
                  </div>

                  <div className="detail-item">
                    <h3>支持證據 / 上傳檔案</h3>
                    <div className="detail-list">
                      {task.evidence.map((evidence) => (
                        <div className="detail-item" key={evidence.id}>
                          <div className="meta-row">
                            <span className="pill">{labelForEvidenceType(evidence.evidence_type)}</span>
                            <span>{labelForSourceType(evidence.source_type)}</span>
                          </div>
                          <h3>{evidence.title}</h3>
                          <p className="content-block">{evidence.excerpt_or_summary}</p>
                        </div>
                      ))}
                      {task.evidence.length === 0 ? (
                        <p className="empty-text">尚未附加任何證據。</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="detail-item">
                    <h3>任務歷史</h3>
                    <div className="detail-list">
                      {task.runs.length > 0 ? (
                        [...task.runs]
                          .sort(
                            (a, b) =>
                              new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
                          )
                          .map((run) => (
                            <div className="detail-item" key={run.id}>
                              <div className="meta-row">
                                <span className="pill">{labelForRunStatus(run.status)}</span>
                                <span>{labelForAgentId(run.agent_id)}</span>
                                <span>{formatDisplayDate(run.created_at)}</span>
                              </div>
                              <h3>{run.summary || "已記錄執行結果"}</h3>
                              <p className="muted-text">
                                {run.error_message || "結構化結果已寫入任務歷史。"}
                              </p>
                            </div>
                          ))
                      ) : (
                        <p className="empty-text">目前尚無執行紀錄。</p>
                      )}
                    </div>
                  </div>

                  <div className="detail-item">
                    <h3>Ontology / 工作物件檢視</h3>
                    <div className="ontology-grid">
                      <div className="ontology-card">
                        <h3>任務</h3>
                        <p className="content-block">
                          {task.title}
                          {"\n"}
                          {labelForTaskType(task.task_type)} / {labelForFlowMode(task.mode)}
                        </p>
                      </div>
                      <div className="ontology-card">
                        <h3>分析對象</h3>
                        {task.subjects.length > 0 ? (
                          <ul className="list-content">
                            {task.subjects.map((subject) => (
                              <li key={subject.id}>{subject.name}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="muted-text">尚未設定。</p>
                        )}
                      </div>
                      <div className="ontology-card">
                        <h3>交付目標</h3>
                        {task.goals.length > 0 ? (
                          <ul className="list-content">
                            {task.goals.map((goal) => (
                              <li key={goal.id}>{goal.description}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="muted-text">尚未設定。</p>
                        )}
                      </div>
                      <div className="ontology-card">
                        <h3>限制條件</h3>
                        {task.constraints.length > 0 ? (
                          <ul className="list-content">
                            {task.constraints.map((constraint) => (
                              <li key={constraint.id}>{constraint.description}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="muted-text">尚未設定。</p>
                        )}
                      </div>
                      <div className="ontology-card">
                        <h3>證據</h3>
                        {task.evidence.length > 0 ? (
                          <ul className="list-content">
                            {task.evidence.slice(0, 5).map((evidence) => (
                              <li key={evidence.id}>{evidence.title}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="muted-text">尚未附加。</p>
                        )}
                      </div>
                      <div className="ontology-card">
                        <h3>發現 / 洞察</h3>
                        {task.insights.length > 0 || structuredFindings.length > 0 ? (
                          <ul className="list-content">
                            {(task.insights.length > 0
                              ? task.insights.map((item) => item.summary)
                              : structuredFindings
                            )
                              .slice(0, 5)
                              .map((item) => (
                                <li key={item}>{item}</li>
                              ))}
                          </ul>
                        ) : (
                          <p className="muted-text">尚未產生。</p>
                        )}
                      </div>
                      <div className="ontology-card">
                        <h3>風險</h3>
                        {sortedRisks.length > 0 ? (
                          <ul className="list-content">
                            {sortedRisks.slice(0, 5).map((risk) => (
                              <li key={risk.id}>{risk.title}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="muted-text">尚未產生。</p>
                        )}
                      </div>
                      <div className="ontology-card">
                        <h3>選項</h3>
                        {task.options.length > 0 ? (
                          <ul className="list-content">
                            {task.options.slice(0, 5).map((option, index) => (
                              <li key={index}>{JSON.stringify(option)}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="muted-text">目前沒有 option 物件。</p>
                        )}
                      </div>
                      <div className="ontology-card">
                        <h3>建議</h3>
                        {sortedRecommendations.length > 0 ? (
                          <ul className="list-content">
                            {sortedRecommendations.slice(0, 5).map((recommendation) => (
                              <li key={recommendation.id}>{recommendation.summary}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="muted-text">尚未產生。</p>
                        )}
                      </div>
                      <div className="ontology-card">
                        <h3>行動項目</h3>
                        {sortedActionItems.length > 0 ? (
                          <ul className="list-content">
                            {sortedActionItems.slice(0, 5).map((actionItem) => (
                              <li key={actionItem.id}>{actionItem.description}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="muted-text">尚未產生。</p>
                        )}
                      </div>
                      <div className="ontology-card">
                        <h3>交付物</h3>
                        {latestDeliverable ? (
                          <p className="content-block">
                            {latestDeliverable.title}
                            {"\n"}版本 {latestDeliverable.version}
                          </p>
                        ) : (
                          <p className="muted-text">尚未產生。</p>
                        )}
                      </div>
                      <div className="ontology-card">
                        <h3>協調摘要</h3>
                        {task.mode === "multi_agent" || participatingAgents.length > 0 ? (
                          <>
                            <p className="content-block">由 Host 協調中心負責收斂與結果整合。</p>
                            {participatingAgents.length > 0 ? (
                              <ul className="list-content">
                                {participatingAgents.map((agentId) => (
                                  <li key={agentId}>{labelForAgentId(agentId)}</li>
                                ))}
                              </ul>
                            ) : null}
                          </>
                        ) : (
                          <p className="content-block">
                            目前由 {labelForAgentId(task.runs[0]?.agent_id ?? task.task_type)} 執行單點專家流程。
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </>
      ) : null}
    </main>
  );
}
