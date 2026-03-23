"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { getTask, runTask } from "@/lib/api";
import {
  assessTaskReadiness,
  buildActionItemCards,
  buildDecisionSnapshot,
  buildExternalDataUsage,
  buildExecutiveSummary,
  buildRecommendationCards,
  buildRiskCards,
  buildTaskFraming,
  getGoalSuccessCriteria,
  getLatestDeliverable,
  getVisibleConstraints,
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
  labelForAgentId,
  labelForExternalDataStrategy,
  labelForEvidenceType,
  labelForFlowMode,
  labelForImpactLevel,
  labelForLikelihoodLevel,
  labelForPriority,
  labelForRunStatus,
  labelForSourceType,
  labelForStructuredField,
  labelForTaskStatus,
  labelForTaskType,
  translateStructuredValue,
} from "@/lib/ui-labels";

function buildRunMeta(task: TaskAggregate) {
  return {
    title: "啟動這輪分析",
    copy:
      task.mode === "multi_agent"
        ? "Host 會沿用目前的多代理工作模式，把各視角收斂進同一份決策結果。"
        : "Host 會沿用目前的專家工作模式，把這輪分析寫回同一份決策工作台。",
    buttonIdle: "執行分析",
    buttonRunning: "分析執行中...",
  };
}

function truncateText(value: string, limit = 220) {
  if (value.length <= limit) {
    return value;
  }

  return `${value.slice(0, limit).trimEnd()}...`;
}

function ExpandableText({
  text,
  emptyText,
  previewChars = 220,
}: {
  text: string;
  emptyText: string;
  previewChars?: number;
}) {
  const normalized = text.trim();

  if (!normalized) {
    return <p className="empty-text">{emptyText}</p>;
  }

  const preview = truncateText(normalized, previewChars);
  if (preview === normalized) {
    return <p className="content-block">{normalized}</p>;
  }

  return (
    <div className="expandable-copy">
      <p className="content-block">{preview}</p>
      <details className="inline-disclosure">
        <summary className="inline-disclosure-summary">展開完整內容</summary>
        <p className="content-block">{normalized}</p>
      </details>
    </div>
  );
}

function ExpandableList({
  items,
  emptyText,
  initialCount = 4,
  translateAsAgentIds = false,
}: {
  items: string[];
  emptyText: string;
  initialCount?: number;
  translateAsAgentIds?: boolean;
}) {
  if (items.length === 0) {
    return <p className="empty-text">{emptyText}</p>;
  }

  const visibleItems = items.slice(0, initialCount);
  const hiddenItems = items.slice(initialCount);
  const renderItem = (item: string) => (translateAsAgentIds ? labelForAgentId(item) : item);

  return (
    <div className="section-list">
      <ul className="list-content">
        {visibleItems.map((item) => (
          <li key={item}>{renderItem(item)}</li>
        ))}
      </ul>
      {hiddenItems.length > 0 ? (
        <details className="inline-disclosure">
          <summary className="inline-disclosure-summary">展開其餘 {hiddenItems.length} 項</summary>
          <ul className="list-content">
            {hiddenItems.map((item) => (
              <li key={item}>{renderItem(item)}</li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}

function renderStructuredValue(label: string, value: unknown) {
  const displayLabel = labelForStructuredField(label);
  const translatedValue = translateStructuredValue(label, value);

  if (Array.isArray(translatedValue)) {
    const items = translatedValue.map((item) =>
      typeof item === "string" ? item : JSON.stringify(item),
    );
    return (
      <section className="section-card" key={label}>
        <h4>{displayLabel}</h4>
        <ExpandableList items={items} emptyText={`目前沒有可顯示的「${displayLabel}」。`} />
      </section>
    );
  }

  if (translatedValue && typeof translatedValue === "object") {
    return (
      <section className="section-card" key={label}>
        <h4>{displayLabel}</h4>
        <details className="inline-disclosure">
          <summary className="inline-disclosure-summary">展開完整結構</summary>
          <pre className="json-block">{JSON.stringify(translatedValue, null, 2)}</pre>
        </details>
      </section>
    );
  }

  return (
    <section className="section-card" key={label}>
      <h4>{displayLabel}</h4>
      <ExpandableText
        text={String(translatedValue ?? "")}
        emptyText={`目前沒有可顯示的「${displayLabel}」。`}
      />
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
      <div className="detail-item">
        <ExpandableList
          items={items}
          emptyText={emptyText}
          translateAsAgentIds={translateAsAgentIds}
        />
      </div>
    </section>
  );
}

function DisclosurePanel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <details className="panel disclosure-panel">
      <summary className="disclosure-summary">
        <div>
          <h2 className="section-title">{title}</h2>
          <p className="panel-copy">{description}</p>
        </div>
        <span className="pill">展開</span>
      </summary>
      <div className="disclosure-body">{children}</div>
    </details>
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
  const originalProblem = task
    ? [task.description.trim(), task.title.trim()].filter(Boolean).join("\n\n")
    : "";
  const taskFraming = task && readiness ? buildTaskFraming(task, readiness) : null;
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
  const visibleConstraints = task ? getVisibleConstraints(task.constraints) : [];
  const externalDataUsage = task ? buildExternalDataUsage(task, latestDeliverable) : null;
  const decisionSnapshot = task ? buildDecisionSnapshot(task, latestDeliverable) : null;
  const recommendationCards = task ? buildRecommendationCards(task, latestDeliverable) : [];
  const riskCards = task ? buildRiskCards(task, latestDeliverable) : [];
  const actionItemCards = task ? buildActionItemCards(task, latestDeliverable) : [];
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
            <span className="eyebrow">Infinite Pro 顧問交付工作區</span>
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
                    <h2 className="panel-title">原始問題</h2>
                    <p className="panel-copy">
                      這是你最初交給 Infinite Pro 的問題，後續 framing、判斷與建議都以這裡為起點。
                    </p>
                  </div>
                </div>
                <div className="detail-item">
                  <ExpandableText
                    text={originalProblem}
                    emptyText="尚未提供可供分析的原始問題。"
                    previewChars={280}
                  />
                </div>
              </section>

              <section className="panel">
                <div className="panel-header">
                  <div>
                    <h2 className="panel-title">系統理解的任務</h2>
                    <p className="panel-copy">
                      這一層回答的是：系統理解你要做什麼判斷、會優先看哪些資料，以及是否允許補充外部資料。
                    </p>
                  </div>
                </div>

                {taskFraming ? (
                  <div className="section-list">
                    <div className="detail-item">
                      <ExpandableText
                        text={taskFraming.summary}
                        emptyText="尚未形成可讀的任務 framing。"
                        previewChars={240}
                      />
                    </div>
                    <div className="summary-grid">
                      <div className="section-card">
                        <h4>目前案件脈絡</h4>
                        <ExpandableText
                          text={taskFraming.consultingContext}
                          emptyText="尚未整理可讀的顧問案件脈絡。"
                          previewChars={180}
                        />
                      </div>
                      <div className="section-card">
                        <h4>這次的 Decision Context</h4>
                        <ExpandableText
                          text={taskFraming.decisionContextSummary}
                          emptyText="尚未整理本輪 decision context。"
                          previewChars={180}
                        />
                      </div>
                      <div className="section-card">
                        <h4>這次要幫你做什麼判斷</h4>
                        <ExpandableText
                          text={taskFraming.judgmentToMake}
                          emptyText="尚未明確整理本輪判斷目標。"
                          previewChars={180}
                        />
                      </div>
                      <div className="section-card">
                        <h4>這次分析重點是什麼</h4>
                        <ExpandableText
                          text={taskFraming.analysisFocus}
                          emptyText="尚未整理本輪分析重點。"
                          previewChars={180}
                        />
                      </div>
                      <div className="section-card">
                        <h4>會優先用哪些資料</h4>
                        <ExpandableText
                          text={taskFraming.sourcePriority}
                          emptyText="尚未整理本輪資料優先順序。"
                          previewChars={180}
                        />
                      </div>
                      <div className="section-card">
                        <h4>是否允許補充外部資料</h4>
                        <ExpandableText
                          text={taskFraming.externalDataPolicy}
                          emptyText="尚未整理外部資料使用策略。"
                          previewChars={180}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="empty-text">尚未形成可讀的任務 framing。</p>
                )}
              </section>

              <section className="panel">
                <div className="panel-header">
                  <div>
                    <h2 className="panel-title">判斷可信度與資料缺口</h2>
                    <p className="panel-copy">
                      先看這輪判斷目前有多穩、還缺哪些資料，以及這些缺口會怎麼影響結論可信度。
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
                        <ExpandableList
                          items={readiness.missingItems}
                          emptyText="目前沒有額外缺漏資訊。"
                        />
                      </div>
                    ) : null}

                    {readiness.warnings.length > 0 ? (
                      <div className="detail-item" style={{ marginTop: "14px" }}>
                        <h3>建議補充</h3>
                        <ExpandableList
                          items={readiness.warnings}
                          emptyText="目前沒有額外建議補充。"
                        />
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
                <div className="panel-header">
                  <div>
                    <h2 className="panel-title">Decision Snapshot</h2>
                    <p className="panel-copy">
                      先用 10 秒掌握這次分析的核心結論，再決定是否往下看完整交付內容。
                    </p>
                  </div>
                </div>
                {decisionSnapshot ? (
                  <div className="snapshot-grid">
                    <div className="section-card">
                      <h4>{decisionSnapshot.conclusionLabel}</h4>
                      <ExpandableText
                        text={decisionSnapshot.conclusion}
                        emptyText="尚未產生一句話結論。"
                        previewChars={180}
                      />
                    </div>
                    <div className="section-card">
                      <h4>{decisionSnapshot.recommendationLabel}</h4>
                      <ExpandableText
                        text={decisionSnapshot.primaryRecommendation}
                        emptyText="尚未產生最重要建議。"
                        previewChars={180}
                      />
                    </div>
                    <div className="section-card">
                      <h4>{decisionSnapshot.riskLabel}</h4>
                      <ExpandableText
                        text={decisionSnapshot.primaryRisk}
                        emptyText="尚未標記主要風險。"
                        previewChars={180}
                      />
                    </div>
                    <div className="section-card">
                      <h4>{decisionSnapshot.missingDataLabel}</h4>
                      <ExpandableText
                        text={decisionSnapshot.missingDataStatus}
                        emptyText="目前沒有重大缺漏資料狀態。"
                        previewChars={180}
                      />
                    </div>
                  </div>
                ) : (
                  <p className="empty-text">尚未產生 Decision Snapshot。</p>
                )}
              </section>

              <section className="panel">
                <div className="panel-header">
                  <div>
                    <h2 className="panel-title">核心判斷與建議</h2>
                    <p className="panel-copy">
                      先看這輪最值得採用的判斷、建議、風險與下一步，再往下讀各場景的專業內容。
                    </p>
                  </div>
                </div>
              </section>

              <section className="panel">
                <h2 className="section-title">執行摘要</h2>
                {executiveSummary ? (
                  <div className="section-list">
                    <div className="detail-item">
                      <ExpandableText
                        text={executiveSummary.summary}
                        emptyText="尚未產出可供決策閱讀的執行摘要。"
                        previewChars={260}
                      />
                    </div>
                    <div className="section-card">
                      <h4>摘要重點</h4>
                      <ExpandableList
                        items={executiveSummary.bullets}
                        emptyText="尚未整理出可供快速閱讀的摘要重點。"
                      />
                    </div>
                  </div>
                ) : (
                  <p className="empty-text">尚未產出可供決策閱讀的摘要。</p>
                )}
              </section>

              <section className="panel">
                <h2 className="section-title">核心判斷</h2>
                <div className="detail-item">
                  <ExpandableText
                    text={executiveSummary?.coreJudgment ?? ""}
                    emptyText="尚未產出可供顧問式討論的核心判斷。"
                    previewChars={260}
                  />
                </div>
              </section>

              <section className="panel">
                <h2 className="section-title">主要建議</h2>
                <div className="detail-list">
                  {recommendationCards.length > 0 ? (
                    recommendationCards.slice(0, 3).map((recommendation, index) => (
                      <div className="detail-item" key={`${recommendation.content}-${index}`}>
                        <div className="meta-row">
                          <span className="pill">{labelForPriority(recommendation.priority)}</span>
                        </div>
                        <h3>{recommendation.content}</h3>
                        <ExpandableText
                          text={recommendation.rationale}
                          emptyText="目前沒有額外建議說明。"
                        />
                        <p className="muted-text">預期效果：{recommendation.expectedEffect}</p>
                      </div>
                    ))
                  ) : (
                    <p className="empty-text">尚未記錄任何建議。</p>
                  )}
                </div>
              </section>

              <section className="panel">
                <h2 className="section-title">主要風險與取捨</h2>
                <div className="detail-list">
                  {riskCards.length > 0 ? (
                    riskCards.slice(0, 3).map((risk, index) => (
                      <div className="detail-item" key={`${risk.content}-${index}`}>
                        <div className="meta-row">
                          <span className="pill">{labelForImpactLevel(risk.severity)}</span>
                          <span>{labelForLikelihoodLevel(risk.likelihood)}</span>
                        </div>
                        <h3>{risk.content}</h3>
                        <ExpandableText
                          text={risk.impactExplanation}
                          emptyText="目前沒有額外風險說明。"
                        />
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
                  {actionItemCards.length > 0 ? (
                    actionItemCards.slice(0, 4).map((actionItem, index) => (
                      <div className="detail-item" key={`${actionItem.content}-${index}`}>
                        <div className="meta-row">
                          <span className="pill">{labelForPriority(actionItem.priority)}</span>
                        </div>
                        <h3>{actionItem.content}</h3>
                        <p className="muted-text">建議責任角色：{actionItem.ownerRole}</p>
                        <p className="muted-text">建議時序：{actionItem.sequence}</p>
                        {actionItem.dependencies.length > 0 ? (
                          <div style={{ marginTop: "10px" }}>
                            <h3 style={{ fontSize: "0.98rem" }}>前置依賴</h3>
                            <ExpandableList
                              items={actionItem.dependencies}
                              emptyText="目前沒有額外前置依賴。"
                              initialCount={3}
                            />
                          </div>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <p className="empty-text">尚未記錄任何行動項目。</p>
                  )}
                </div>
              </section>

              <section className="panel">
                <h2 className="section-title">缺漏資訊</h2>
                <div className="detail-item">
                  <ExpandableList
                    items={latestMissingInformation}
                    emptyText="最新交付物目前沒有明確標記缺漏資訊。"
                  />
                </div>
              </section>

              {modeSpecificSections.length > 0 ? (
                <section className="panel">
                  <div className="panel-header">
                    <div>
                      <h2 className="panel-title">場景專業區塊</h2>
                      <p className="panel-copy">
                        以下內容只補這個 workflow mode 的專業重點，用來承接場景差異，不改變上面的共通決策骨架。
                      </p>
                    </div>
                  </div>
                </section>
              ) : null}

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
                <div className="panel-header">
                  <div>
                    <h2 className="panel-title">Supporting Context</h2>
                    <p className="panel-copy">
                      如果你想追問這次判斷是根據哪些材料形成的，可以先從這些補充內容往下看。
                    </p>
                  </div>
                </div>
              </section>

              <DisclosurePanel
                title="完整交付物"
                description="查看這次 structured deliverable 的完整欄位與原始內容。"
              >
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
              </DisclosurePanel>

              <DisclosurePanel
                title="證據與補充資料"
                description="查看本輪分析依賴的證據、來源摘錄與可支持結論的補充內容。"
              >
                <div className="detail-list">
                  {task.evidence.map((evidence) => (
                    <div className="detail-item" key={evidence.id}>
                      <div className="meta-row">
                        <span className="pill">{labelForEvidenceType(evidence.evidence_type)}</span>
                        <span>{labelForSourceType(evidence.source_type)}</span>
                      </div>
                      <h3>{evidence.title}</h3>
                      <ExpandableText
                        text={evidence.excerpt_or_summary}
                        emptyText="這筆證據目前沒有可顯示的內容摘要。"
                        previewChars={240}
                      />
                    </div>
                  ))}
                  {task.evidence.length === 0 ? (
                    <p className="empty-text">尚未附加任何證據。</p>
                  ) : null}
                </div>
              </DisclosurePanel>

              <DisclosurePanel
                title="任務背景與補充脈絡"
                description="回看你當時提供的背景、目標、限制與其他補充說明。"
              >
                <div className="detail-list">
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
                    <ExpandableList items={successCriteria} emptyText="尚未設定明確成功標準。" />
                  </div>
                  <div className="detail-item">
                    <h3>已有資料</h3>
                    <ExpandableText
                      text={latestContext?.notes || ""}
                      emptyText="尚未整理目前已掌握資料。"
                    />
                  </div>
                  <div className="detail-item">
                    <h3>缺少資料 / 待確認假設</h3>
                    <ExpandableText
                      text={latestContext?.assumptions || ""}
                      emptyText="尚未列出待補資料或待確認假設。"
                    />
                  </div>
                  <div className="detail-item">
                    <h3>限制條件</h3>
                    {visibleConstraints.length > 0 ? (
                      <ul className="list-content">
                        {visibleConstraints.map((constraint) => (
                          <li key={constraint.id}>{constraint.description}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="muted-text">尚未新增明確限制條件。</p>
                    )}
                  </div>
                  <div className="detail-item">
                    <h3>背景脈絡</h3>
                    <ExpandableText
                      text={parsedAppendix.backgroundText || ""}
                      emptyText="尚未提供手動背景文字。"
                      previewChars={260}
                    />
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
              </DisclosurePanel>

              <DisclosurePanel
                title="外部資料使用情況"
                description="確認這輪判斷是否引用了外部來源，以及哪些結論依賴這些補充資料。"
              >
                {externalDataUsage ? (
                  <div className="detail-list">
                    <div className="detail-item">
                      <h3>外部資料使用方式</h3>
                      <p className="content-block">
                        {labelForExternalDataStrategy(task.external_data_strategy)}
                      </p>
                    </div>
                    <div className="detail-item">
                      <h3>是否使用外部搜尋</h3>
                      <p className="content-block">
                        {externalDataUsage.searchUsed
                          ? "有，Host 已補充外部搜尋來源。"
                          : "沒有，本輪未使用 Host 外部搜尋。"}
                      </p>
                    </div>
                    <div className="detail-item">
                      <h3>使用了哪些來源</h3>
                      {externalDataUsage.sources.length > 0 ? (
                        <ul className="list-content">
                          {externalDataUsage.sources.map((source) => (
                            <li key={`${source.sourceType}-${source.url}-${source.title}`}>
                              {source.title}
                              {source.url ? `｜${source.url}` : ""}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="muted-text">目前沒有記錄可顯示的外部來源。</p>
                      )}
                    </div>
                    <div className="detail-item">
                      <h3>哪些分析依賴外部資料</h3>
                      <ExpandableText
                        text={externalDataUsage.dependencyNote}
                        emptyText="目前尚未記錄外部資料依賴說明。"
                      />
                    </div>
                  </div>
                ) : (
                  <p className="empty-text">目前尚未記錄外部資料使用情況。</p>
                )}
              </DisclosurePanel>

              <DisclosurePanel
                title="System Trace"
                description="只有在你想檢查系統如何理解、協調與寫回這個任務時，再展開這一層。"
              >
                <div className="detail-list">
                  <div className="detail-item">
                    <h3>Ontology / 工作物件檢視</h3>
                    <p className="panel-copy" style={{ marginBottom: "16px" }}>
                      檢查 shared task model 目前承載了哪些工作物件與結果。
                    </p>
                    <div className="ontology-grid">
                      <div className="ontology-card">
                        <h3>客戶</h3>
                        <p className="content-block">
                          {task.client?.name || "尚未明確標示客戶"}
                          {"\n"}
                          {(task.client?.client_type || task.client_type || "未指定")}
                          {" / "}
                          {(task.client?.client_stage || task.client_stage || "未指定")}
                        </p>
                      </div>
                      <div className="ontology-card">
                        <h3>Engagement</h3>
                        <p className="content-block">
                          {task.engagement?.name || "尚未建立 engagement 名稱"}
                          {task.engagement?.description ? `\n${task.engagement.description}` : ""}
                        </p>
                      </div>
                      <div className="ontology-card">
                        <h3>Workstream</h3>
                        <p className="content-block">
                          {task.workstream?.name || "尚未建立 workstream"}
                          {"\n"}
                          {task.domain_lenses.length > 0 ? task.domain_lenses.join(" / ") : "綜合"}
                        </p>
                      </div>
                      <div className="ontology-card">
                        <h3>Decision Context</h3>
                        <ExpandableText
                          text={
                            task.decision_context?.judgment_to_make ||
                            task.decision_context?.summary ||
                            ""
                          }
                          emptyText="尚未形成可讀的 decision context。"
                          previewChars={180}
                        />
                      </div>
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
                        {visibleConstraints.length > 0 ? (
                          <ul className="list-content">
                            {visibleConstraints.map((constraint) => (
                              <li key={constraint.id}>{constraint.description}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="muted-text">尚未設定。</p>
                        )}
                      </div>
                      <div className="ontology-card">
                        <h3>Source Materials</h3>
                        {task.source_materials.length > 0 ? (
                          <ul className="list-content">
                            {task.source_materials.slice(0, 5).map((sourceMaterial) => (
                              <li key={sourceMaterial.id}>{sourceMaterial.title}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="muted-text">尚未建立。</p>
                        )}
                      </div>
                      <div className="ontology-card">
                        <h3>Artifacts</h3>
                        {task.artifacts.length > 0 ? (
                          <ul className="list-content">
                            {task.artifacts.slice(0, 5).map((artifact) => (
                              <li key={artifact.id}>{artifact.title}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="muted-text">尚未建立。</p>
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

                  <div className="detail-item">
                    <h3>任務歷史</h3>
                    <p className="panel-copy" style={{ marginBottom: "16px" }}>
                      回看這個案件的執行紀錄、寫回摘要與歷程狀態。
                    </p>
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
                              <ExpandableText
                                text={run.error_message || "結構化結果已寫入任務歷史。"}
                                emptyText="目前沒有額外執行說明。"
                              />
                            </div>
                          ))
                      ) : (
                        <p className="empty-text">目前尚無執行紀錄。</p>
                      )}
                    </div>
                  </div>

                  <div className="detail-item">
                    <h3>流程與協調資訊</h3>
                    <p className="panel-copy" style={{ marginBottom: "16px" }}>
                      檢查目前工作流程、最新執行代理與 Host 的協調狀態。
                    </p>
                    <div className="detail-list">
                      <div className="detail-item">
                        <h3>工作流程</h3>
                        <p className="content-block">{labelForFlowMode(task.mode)}</p>
                      </div>
                      <div className="detail-item">
                        <h3>最新執行代理</h3>
                        <p className="content-block">
                          {labelForAgentId(task.runs[0]?.agent_id ?? task.task_type)}
                        </p>
                      </div>
                      <div className="detail-item">
                        <h3>參與代理</h3>
                        <ExpandableList
                          items={participatingAgents}
                          emptyText="目前沒有可顯示的參與代理。"
                          translateAsAgentIds
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </DisclosurePanel>

            </div>
          </div>
        </>
      ) : null}
    </main>
  );
}
