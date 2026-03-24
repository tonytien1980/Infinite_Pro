"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { getExtensionManager, getTask, runTask, updateTaskExtensions } from "@/lib/api";
import {
  assessTaskReadiness,
  buildActionItemCards,
  buildCapabilityFrame,
  buildDecisionSnapshot,
  buildDeliverableBacklinkView,
  buildEvidenceWorkspaceLane,
  buildExternalDataUsage,
  buildExecutiveSummary,
  buildMatterWorkspaceCard,
  buildObjectNavigationStrip,
  buildOntologyChainSummary,
  buildPackSelectionView,
  buildRecommendationCards,
  buildReadinessGovernance,
  buildRiskCards,
  buildSparseInputOperatingView,
  buildTaskFraming,
  buildWorkbenchObjectSummary,
  getGoalSuccessCriteria,
  getLatestDeliverable,
  getVisibleConstraints,
  getStructuredStringList,
} from "@/lib/advisory-workflow";
import type { ExtensionManagerSnapshot, TaskAggregate, TaskExtensionOverridePayload } from "@/lib/types";
import { ExtensionManagerSurface } from "@/components/extension-manager-surface";
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

function WorkspaceMaterialSection({
  title,
  description,
  items,
  emptyText,
}: {
  title: string;
  description: string;
  items: Array<{
    title: string;
    summary: string;
    meta: string[];
    supportNotes: string[];
  }>;
  emptyText: string;
}) {
  return (
    <div className="detail-item">
      <h3>{title}</h3>
      <p className="panel-copy" style={{ marginBottom: "16px" }}>
        {description}
      </p>
      {items.length > 0 ? (
        <div className="detail-list">
          {items.map((item) => (
            <div className="detail-item" key={`${title}-${item.title}`}>
              {item.meta.length > 0 ? (
                <div className="meta-row">
                  {item.meta.map((meta) => (
                    <span key={`${item.title}-${meta}`}>{meta}</span>
                  ))}
                </div>
              ) : null}
              <h3>{item.title}</h3>
              <ExpandableText
                text={item.summary}
                emptyText="目前沒有可顯示的摘要。"
                previewChars={220}
              />
              {item.supportNotes.length > 0 ? (
                <div style={{ marginTop: "10px" }}>
                  <ExpandableList
                    items={item.supportNotes}
                    emptyText="目前沒有額外支持說明。"
                    initialCount={3}
                  />
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="empty-text">{emptyText}</p>
      )}
    </div>
  );
}

export function TaskDetailPanel({ taskId }: { taskId: string }) {
  const [task, setTask] = useState<TaskAggregate | null>(null);
  const [extensionManager, setExtensionManager] = useState<ExtensionManagerSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [extensionLoading, setExtensionLoading] = useState(true);
  const [savingOverrides, setSavingOverrides] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extensionError, setExtensionError] = useState<string | null>(null);

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
    void (async () => {
      try {
        setExtensionLoading(true);
        setExtensionError(null);
        setExtensionManager(await getExtensionManager());
      } catch (loadError) {
        setExtensionError(
          loadError instanceof Error ? loadError.message : "載入 Extension Manager 失敗。",
        );
      } finally {
        setExtensionLoading(false);
      }
    })();
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

  async function handleSaveOverrides(payload: TaskExtensionOverridePayload) {
    try {
      setSavingOverrides(true);
      setError(null);
      const response = await updateTaskExtensions(taskId, payload);
      setTask(response);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "更新 extension overrides 失敗。");
    } finally {
      setSavingOverrides(false);
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
  const visibleModeSpecificSections = modeSpecificSections.filter((section) => section.items.length > 0);
  const visibleConstraints = task ? getVisibleConstraints(task.constraints) : [];
  const externalDataUsage = task ? buildExternalDataUsage(task, latestDeliverable) : null;
  const decisionSnapshot = task ? buildDecisionSnapshot(task, latestDeliverable) : null;
  const recommendationCards = task ? buildRecommendationCards(task, latestDeliverable) : [];
  const riskCards = task ? buildRiskCards(task, latestDeliverable) : [];
  const actionItemCards = task ? buildActionItemCards(task, latestDeliverable) : [];
  const workbenchObjectSummary = task ? buildWorkbenchObjectSummary(task, latestDeliverable) : null;
  const matterWorkspaceCard =
    task?.matter_workspace ? buildMatterWorkspaceCard(task.matter_workspace) : null;
  const objectNavigationStrip = task ? buildObjectNavigationStrip(task, latestDeliverable) : null;
  const capabilityFrame = task ? buildCapabilityFrame(task, latestDeliverable) : null;
  const packSelection = task ? buildPackSelectionView(task, latestDeliverable) : null;
  const readinessGovernance =
    task && readiness ? buildReadinessGovernance(task, latestDeliverable, readiness) : null;
  const ontologyChainSummary = task ? buildOntologyChainSummary(task, latestDeliverable) : null;
  const sparseInputOperatingView =
    task ? buildSparseInputOperatingView(task, latestDeliverable) : null;
  const evidenceWorkspaceLane =
    task ? buildEvidenceWorkspaceLane(task, latestDeliverable, readinessGovernance) : null;
  const deliverableBacklink = task ? buildDeliverableBacklinkView(task, latestDeliverable) : null;
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
  const hasBackgroundSupport = Boolean(
    task?.subjects.length ||
      task?.goals.length ||
      successCriteria.length ||
      latestContext?.notes?.trim() ||
      latestContext?.assumptions?.trim() ||
      visibleConstraints.length ||
      parsedAppendix.backgroundText.trim() ||
      modeSpecificEntries.length,
  );
  const shouldShowExternalDataContext = Boolean(
    externalDataUsage &&
      (externalDataUsage.searchUsed ||
        externalDataUsage.sources.length > 0 ||
        task?.external_data_strategy !== "strict"),
  );
  const hasSystemTrace = Boolean(task?.runs.length || task?.evidence.length || latestDeliverable);

  return (
    <main className="page-shell">
      <div className="back-link-group">
        <Link className="back-link" href="/">
          ← 返回工作台
        </Link>
        {task?.matter_workspace ? (
          <Link className="back-link" href={`/matters/${task.matter_workspace.id}`}>
            ← 返回案件工作面
          </Link>
        ) : null}
        {task?.matter_workspace ? (
          <Link className="back-link" href={`/matters/${task.matter_workspace.id}/evidence`}>
            ← 返回來源 / 證據工作面
          </Link>
        ) : null}
      </div>

      {loading ? <p className="status-text">正在載入任務工作區...</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      {task ? (
        <>
          <section className="hero-card">
            <span className="eyebrow">Infinite Pro Decision Workspace</span>
            <h1 className="page-title">{task.title}</h1>
            <p className="page-subtitle">{task.description || "未提供額外說明。"}</p>
            <div className="meta-row" style={{ marginTop: "16px" }}>
              <span className="pill">{labelForTaskStatus(task.status)}</span>
              <span>{labelForTaskType(task.task_type)}</span>
              <span>{labelForFlowMode(task.mode)}</span>
              <span>更新於 {formatDisplayDate(task.updated_at)}</span>
            </div>
            {matterWorkspaceCard ? (
              <div className="matter-hero-strip">
                <div>
                  <span className="pill">Matter / Engagement Workspace</span>
                  <p className="workspace-object-path" style={{ marginTop: "10px" }}>
                    {matterWorkspaceCard.objectPath}
                  </p>
                  <p className="muted-text">{matterWorkspaceCard.continuity}</p>
                </div>
                <Link className="button-secondary matter-hero-link" href={`/matters/${task.matter_workspace?.id}`}>
                  進入案件工作面
                </Link>
              </div>
            ) : null}
          </section>

          {matterWorkspaceCard ? (
            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2 className="panel-title">Matter / Engagement Continuity</h2>
                  <p className="panel-copy">
                    這個 task 現在已正式掛在案件世界下。你可以回到同一個 matter / engagement workspace 看跨 task 的 decision trajectory、deliverables 與材料累積。
                  </p>
                </div>
                <Link className="button-secondary" href={`/matters/${task.matter_workspace?.id}`}>
                  打開案件工作面
                </Link>
              </div>
              <div className="summary-grid">
                <div className="section-card">
                  <h4>案件世界</h4>
                  <p className="content-block">{matterWorkspaceCard.objectPath}</p>
                </div>
                <div className="section-card">
                  <h4>當前主要 DecisionContext</h4>
                  <ExpandableText
                    text={matterWorkspaceCard.decisionContext}
                    emptyText="目前沒有可顯示的案件判斷主軸。"
                    previewChars={220}
                  />
                </div>
                <div className="section-card">
                  <h4>連續性摘要</h4>
                  <ExpandableText
                    text={matterWorkspaceCard.continuity}
                    emptyText="目前沒有可顯示的連續性摘要。"
                    previewChars={220}
                  />
                </div>
                <div className="section-card">
                  <h4>目前工作狀態</h4>
                  <ExpandableText
                    text={matterWorkspaceCard.activeWork}
                    emptyText="目前沒有可顯示的工作狀態。"
                    previewChars={220}
                  />
                </div>
              </div>
              <div className="meta-row" style={{ marginTop: "16px" }}>
                {matterWorkspaceCard.counts.map((count) => (
                  <span key={count}>{count}</span>
                ))}
              </div>
              <p className="muted-text" style={{ marginTop: "12px" }}>
                {matterWorkspaceCard.packSummary}
              </p>
              <p className="muted-text">{matterWorkspaceCard.agentSummary}</p>
            </section>
          ) : null}

          {objectNavigationStrip ? (
            <section className="panel object-nav-panel">
              <div className="panel-header">
                <div>
                  <h2 className="panel-title">Object-Aware Workspace Strip</h2>
                  <p className="panel-copy">
                    先確認這輪工作掛在哪個 client / engagement / workstream / decision context 上，再決定要往哪條工作面繼續下鑽。
                  </p>
                </div>
              </div>
              <div className="meta-row" style={{ marginBottom: "16px" }}>
                <span className="pill">{objectNavigationStrip.entryModeLabel}</span>
                <span>{objectNavigationStrip.deliverableClassLabel}</span>
                {objectNavigationStrip.externalResearchHeavy ? (
                  <span>external-research-heavy sparse case</span>
                ) : null}
              </div>
              <p className="panel-copy workspace-strip-summary">
                {objectNavigationStrip.workspaceSummary}
              </p>
              <div className="object-strip">
                {objectNavigationStrip.items.map((item) => (
                  <a
                    key={item.key}
                    className="object-strip-card"
                    href={`#${item.anchorId}`}
                  >
                    <div className="meta-row">
                      <span className="pill">{item.label}</span>
                      <span>{item.stateLabel}</span>
                    </div>
                    <h3>{item.value}</h3>
                    <p className="object-strip-note">{item.note}</p>
                  </a>
                ))}
              </div>
            </section>
          ) : null}

          <div className="detail-grid">
            <div className="detail-stack">
              <section className="panel" id="workspace-lane">
                <div className="panel-header">
                  <div>
                    <h2 className="panel-title">Artifact / SourceMaterial / Evidence 工作面</h2>
                    <p className="panel-copy">
                      這裡不是單純 supporting data，而是這輪判斷真正依附的工作鏈。若要完整回看來源角色、支撐鏈與高影響缺口，現在可直接進入正式的 Artifact / Evidence Workspace。
                    </p>
                  </div>
                  {task.matter_workspace ? (
                    <Link className="button-secondary" href={`/matters/${task.matter_workspace.id}/evidence`}>
                      打開來源 / 證據工作面
                    </Link>
                  ) : null}
                </div>
                {evidenceWorkspaceLane && workbenchObjectSummary && ontologyChainSummary ? (
                  <>
                    <div className="summary-grid">
                      <div className="section-card">
                        <h4>工作面判斷</h4>
                        <ExpandableText
                          text={evidenceWorkspaceLane.summary}
                          emptyText="尚未形成可讀的工作面摘要。"
                          previewChars={220}
                        />
                      </div>
                      <div className="section-card">
                        <h4>主要案件主體</h4>
                        <p className="content-block">
                          {workbenchObjectSummary.primaryEntity}
                          {"\n"}
                          {workbenchObjectSummary.clientContext}
                        </p>
                      </div>
                      <div className="section-card">
                        <h4>Domain Lens / Workstream</h4>
                        <p className="content-block">
                          {workbenchObjectSummary.domainLensSummary}
                          {"\n"}
                          {workbenchObjectSummary.workstream}
                        </p>
                      </div>
                      <div className="section-card">
                        <h4>物件鏈密度</h4>
                        <p className="content-block">
                          {ontologyChainSummary.sourceMaterialCount} 份 source material /{" "}
                          {ontologyChainSummary.artifactCount} 份 artifact /{" "}
                          {ontologyChainSummary.evidenceCount} 則 evidence
                        </p>
                      </div>
                    </div>

                    <div className="detail-list" style={{ marginTop: "16px" }}>
                      <WorkspaceMaterialSection
                        title="關鍵 Artifacts"
                        description="這些是目前已進入工作鏈的核心 artifact。若沒有 artifact，不代表不能工作，但代表這輪仍偏 exploratory 或 provisional。"
                        items={evidenceWorkspaceLane.artifactCards}
                        emptyText="目前還沒有可直接瀏覽的 artifact；這輪工作鏈仍較依賴原始問題、背景或 source material。"
                      />
                      <WorkspaceMaterialSection
                        title="Source Materials"
                        description="這些來源材料提供背景、引用內容與 supporting context，是 Host 形成 evidence 的主要材料基底。"
                        items={evidenceWorkspaceLane.sourceMaterialCards}
                        emptyText="目前還沒有可直接瀏覽的 source material。"
                      />
                      <WorkspaceMaterialSection
                        title="Evidence Lane"
                        description="這些 evidence 是目前最接近 recommendation / risk 判斷基礎的工作單元。若 support note 很薄，代表這輪還沒有完整 evidence-to-decision 鏈。"
                        items={evidenceWorkspaceLane.evidenceCards}
                        emptyText="目前還沒有形成可讀的 evidence lane。"
                      />
                    </div>

                    {evidenceWorkspaceLane.missingSignals.length > 0 ? (
                      <div className="detail-item" style={{ marginTop: "14px" }}>
                        <h3>目前工作鏈缺口</h3>
                        <ExpandableList
                          items={evidenceWorkspaceLane.missingSignals}
                          emptyText="目前沒有可顯示的工作鏈缺口。"
                          initialCount={5}
                        />
                      </div>
                    ) : null}
                  </>
                ) : (
                  <p className="empty-text">尚未形成可讀的 Artifact / SourceMaterial / Evidence 工作面。</p>
                )}
              </section>

              <section className="panel" id="decision-context">
                <div className="panel-header">
                  <div>
                    <h2 className="panel-title">原始問題與 Decision Context</h2>
                    <p className="panel-copy">
                      先確認你原本問了什麼，以及系統理解這次到底要幫你做哪一個判斷。
                    </p>
                  </div>
                </div>

                {taskFraming && capabilityFrame ? (
                  <div className="summary-grid">
                    <div className="section-card">
                      <h4>原始問題</h4>
                      <ExpandableText
                        text={originalProblem}
                        emptyText="尚未提供可供分析的原始問題。"
                        previewChars={240}
                      />
                    </div>
                    <div className="section-card">
                      <h4>Decision Context</h4>
                      <ExpandableText
                        text={taskFraming.decisionContextSummary}
                        emptyText="尚未整理本輪 decision context。"
                        previewChars={200}
                      />
                    </div>
                    <div className="section-card">
                      <h4>這次要幫你做什麼判斷</h4>
                      <ExpandableText
                        text={capabilityFrame.judgmentToMake}
                        emptyText="尚未明確整理本輪判斷目標。"
                        previewChars={200}
                      />
                    </div>
                    <div className="section-card">
                      <h4>這次分析重點</h4>
                      <ExpandableText
                        text={taskFraming.analysisFocus}
                        emptyText="尚未整理本輪分析重點。"
                        previewChars={200}
                      />
                    </div>
                  </div>
                ) : (
                  <p className="empty-text">尚未形成可讀的任務 framing。</p>
                )}
              </section>

              <section className="panel">
                <div className="panel-header">
                  <div>
                    <h2 className="panel-title">這輪分析框架</h2>
                    <p className="panel-copy">
                      這裡對齊 Host 已採用的 capability frame，確認這輪是用什麼顧問能力原型、資料優先順序與執行方式在推進。
                    </p>
                  </div>
                </div>

                {capabilityFrame ? (
                  <>
                    <div className="summary-grid">
                      <div className="section-card">
                        <h4>Capability Archetype</h4>
                        <p className="content-block">{capabilityFrame.label}</p>
                      </div>
                      <div className="section-card">
                        <h4>執行方式</h4>
                        <p className="content-block">{labelForFlowMode(capabilityFrame.executionMode)}</p>
                      </div>
                      <div className="section-card">
                        <h4>Framing Summary</h4>
                        <ExpandableText
                          text={capabilityFrame.framingSummary}
                          emptyText="尚未形成可讀的 capability frame。"
                          previewChars={180}
                        />
                      </div>
                      <div className="section-card">
                        <h4>優先資料</h4>
                        <ExpandableList
                          items={capabilityFrame.prioritySources}
                          emptyText="尚未整理這輪優先資料。"
                        />
                      </div>
                      {capabilityFrame.selectedDomainPacks.length > 0 ? (
                        <div className="section-card">
                          <h4>Domain Packs</h4>
                          <ExpandableList
                            items={capabilityFrame.selectedDomainPacks}
                            emptyText="這輪目前沒有選到 Domain / Functional Packs。"
                          />
                        </div>
                      ) : null}
                      {capabilityFrame.selectedIndustryPacks.length > 0 ? (
                        <div className="section-card">
                          <h4>Industry Packs</h4>
                          <ExpandableList
                            items={capabilityFrame.selectedIndustryPacks}
                            emptyText="這輪目前沒有選到 Industry Packs。"
                          />
                        </div>
                      ) : null}
                    </div>

                    {capabilityFrame.routingRationale.length > 0 ? (
                      <div className="detail-item" style={{ marginTop: "14px" }}>
                        <h3>Routing rationale</h3>
                        <ExpandableList
                          items={capabilityFrame.routingRationale}
                          emptyText="目前沒有可顯示的 routing 說明。"
                        />
                      </div>
                    ) : null}

                    {packSelection && packSelection.resolverNotes.length > 0 ? (
                      <div className="detail-item" style={{ marginTop: "14px" }}>
                        <h3>Pack resolver notes</h3>
                        <ExpandableList
                          items={packSelection.resolverNotes}
                          emptyText="目前沒有可顯示的 pack resolver notes。"
                        />
                      </div>
                    ) : null}

                    {capabilityFrame.packDeliverablePresets.length > 0 ? (
                      <div className="detail-item" style={{ marginTop: "14px" }}>
                        <h3>Pack deliverable 傾向</h3>
                        <ExpandableList
                          items={capabilityFrame.packDeliverablePresets}
                          emptyText="目前沒有可顯示的 pack deliverable 傾向。"
                        />
                      </div>
                    ) : null}

                    {packSelection && packSelection.domainPackCards.length > 0 ? (
                      <div className="detail-item" style={{ marginTop: "14px" }}>
                        <h3>Domain pack context</h3>
                        <div className="detail-list">
                          {packSelection.domainPackCards.map((pack) => (
                            <div className="detail-item" key={pack.packName}>
                              <h3>{pack.packName}</h3>
                              <ExpandableText
                                text={`${pack.definition}${pack.reason ? `\n\n選擇原因：${pack.reason}` : ""}`}
                                emptyText="目前沒有可顯示的 pack 說明。"
                                previewChars={220}
                              />
                              {pack.problemPatterns.length > 0 ? (
                                <div style={{ marginTop: "10px" }}>
                                  <h4>常見企業問題型態</h4>
                                  <ExpandableList
                                    items={pack.problemPatterns}
                                    emptyText="目前沒有可顯示的問題型態。"
                                    initialCount={4}
                                  />
                                </div>
                              ) : null}
                              {pack.keySignals.length > 0 ? (
                                <div style={{ marginTop: "10px" }}>
                                  <h4>關鍵 KPI / Operating Signals</h4>
                                  <ExpandableList
                                    items={pack.keySignals}
                                    emptyText="目前沒有可顯示的關鍵指標。"
                                    initialCount={4}
                                  />
                                </div>
                              ) : null}
                              {pack.boundaries.length > 0 ? (
                                <div style={{ marginTop: "10px" }}>
                                  <h4>Pack 邊界</h4>
                                  <ExpandableList
                                    items={pack.boundaries}
                                    emptyText="目前沒有可顯示的邊界說明。"
                                    initialCount={3}
                                  />
                                </div>
                              ) : null}
                              {pack.rationale.length > 0 ? (
                                <div style={{ marginTop: "10px" }}>
                                  <h4>治理 rationale</h4>
                                  <ExpandableList
                                    items={pack.rationale}
                                    emptyText="目前沒有額外 rationale。"
                                    initialCount={4}
                                  />
                                </div>
                              ) : null}
                              {pack.packNotes.length > 0 ? (
                                <div style={{ marginTop: "10px" }}>
                                  <h4>Pack notes</h4>
                                  <ExpandableList
                                    items={pack.packNotes}
                                    emptyText="目前沒有額外 pack notes。"
                                    initialCount={3}
                                  />
                                </div>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {packSelection && packSelection.industryPackCards.length > 0 ? (
                      <div className="detail-item" style={{ marginTop: "14px" }}>
                        <h3>Industry pack context</h3>
                        <div className="detail-list">
                          {packSelection.industryPackCards.map((pack) => (
                            <div className="detail-item" key={pack.packName}>
                              <h3>{pack.packName}</h3>
                              <ExpandableText
                                text={`${pack.definition}${pack.reason ? `\n\n選擇原因：${pack.reason}` : ""}`}
                                emptyText="目前沒有可顯示的 pack 說明。"
                                previewChars={220}
                              />
                              {pack.businessModels.length > 0 ? (
                                <div style={{ marginTop: "10px" }}>
                                  <h4>常見商業模式</h4>
                                  <ExpandableList
                                    items={pack.businessModels}
                                    emptyText="目前沒有可顯示的商業模式。"
                                    initialCount={4}
                                  />
                                </div>
                              ) : null}
                              {pack.decisionPatterns.length > 0 ? (
                                <div style={{ marginTop: "10px" }}>
                                  <h4>常見判斷模式</h4>
                                  <ExpandableList
                                    items={pack.decisionPatterns}
                                    emptyText="目前沒有可顯示的判斷模式。"
                                    initialCount={4}
                                  />
                                </div>
                              ) : null}
                              {pack.packNotes.length > 0 ? (
                                <div style={{ marginTop: "10px" }}>
                                  <h4>Pack notes</h4>
                                  <ExpandableList
                                    items={pack.packNotes}
                                    emptyText="目前沒有額外 pack notes。"
                                    initialCount={3}
                                  />
                                </div>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {capabilityFrame.selectedAgents.length > 0 || capabilityFrame.hostAgent ? (
                      <div className="detail-item" style={{ marginTop: "14px" }}>
                        <h3>Agent selection</h3>
                        <div className="detail-list">
                          <div className="detail-item">
                            <h4>Host</h4>
                            <p className="content-block">{labelForAgentId(capabilityFrame.hostAgent)}</p>
                          </div>
                          {capabilityFrame.selectedAgentDetails.length > 0 ? (
                            capabilityFrame.selectedAgentDetails.map((agent) => (
                              <div className="detail-item" key={agent.agentId}>
                                <div className="meta-row">
                                  <span className="pill">{agent.agentType}</span>
                                  {agent.runtimeBinding ? (
                                    <span>runtime：{labelForAgentId(agent.runtimeBinding)}</span>
                                  ) : null}
                                </div>
                                <h4>{agent.agentName}</h4>
                                <ExpandableText
                                  text={agent.reason}
                                  emptyText="目前沒有可顯示的 selection reason。"
                                  previewChars={200}
                                />
                              </div>
                            ))
                          ) : (
                            <ExpandableList
                              items={capabilityFrame.selectedAgents}
                              emptyText="目前沒有可顯示的代理。"
                              translateAsAgentIds
                            />
                          )}
                        </div>
                      </div>
                    ) : null}

                    {capabilityFrame.agentSelectionRationale.length > 0 ? (
                      <div className="detail-item" style={{ marginTop: "14px" }}>
                        <h3>Agent selection rationale</h3>
                        <ExpandableList
                          items={capabilityFrame.agentSelectionRationale}
                          emptyText="目前沒有可顯示的 agent selection rationale。"
                        />
                      </div>
                    ) : null}

                    {capabilityFrame.agentResolverNotes.length > 0 ? (
                      <div className="detail-item" style={{ marginTop: "14px" }}>
                        <h3>Agent resolver notes</h3>
                        <ExpandableList
                          items={capabilityFrame.agentResolverNotes}
                          emptyText="目前沒有可顯示的 agent resolver notes。"
                        />
                      </div>
                    ) : null}

                    {capabilityFrame.omittedAgentNotes.length > 0 ? (
                      <div className="detail-item" style={{ marginTop: "14px" }}>
                        <h3>本輪未啟用的相關 agents</h3>
                        <ExpandableList
                          items={capabilityFrame.omittedAgentNotes}
                          emptyText="目前沒有可顯示的 omitted agent notes。"
                        />
                      </div>
                    ) : null}

                    {capabilityFrame.deferredAgentNotes.length > 0 ? (
                      <div className="detail-item" style={{ marginTop: "14px" }}>
                        <h3>本輪 deferred agents</h3>
                        <ExpandableList
                          items={capabilityFrame.deferredAgentNotes}
                          emptyText="目前沒有可顯示的 deferred agent notes。"
                        />
                      </div>
                    ) : null}

                    {capabilityFrame.escalationNotes.length > 0 ? (
                      <div className="detail-item" style={{ marginTop: "14px" }}>
                        <h3>本輪 escalation notes</h3>
                        <ExpandableList
                          items={capabilityFrame.escalationNotes}
                          emptyText="目前沒有可顯示的 escalation notes。"
                        />
                      </div>
                    ) : null}

                    {capabilityFrame.runtimeAgents.length > 0 ? (
                      <div className="detail-item" style={{ marginTop: "14px" }}>
                        <h3>目前實際 runtime agents</h3>
                        <ExpandableList
                          items={capabilityFrame.runtimeAgents}
                          emptyText="目前沒有可顯示的 runtime agents。"
                          translateAsAgentIds
                        />
                      </div>
                    ) : null}

                    {capabilityFrame.selectedSupportingAgents.length > 0 ? (
                      <div className="detail-item" style={{ marginTop: "14px" }}>
                        <h3>Supporting runtime agents</h3>
                        <ExpandableList
                          items={capabilityFrame.selectedSupportingAgents}
                          emptyText="目前沒有額外 supporting runtime agents。"
                          translateAsAgentIds
                        />
                      </div>
                    ) : null}
                  </>
                ) : null}
              </section>

              <section className="panel">
                <div className="panel-header">
                  <div>
                    <h2 className="panel-title">判斷可信度與資料缺口</h2>
                    <p className="panel-copy">
                      先看這輪判斷目前有多穩、還缺哪些資料，以及這些缺口會怎麼影響結論可信度。
                    </p>
                  </div>
                  {readinessGovernance ? (
                    <span className={`status-badge status-${readinessGovernance.level}`}>
                      {readinessGovernance.label}
                    </span>
                  ) : null}
                </div>

                {readinessGovernance ? (
                  <>
                    <div className="summary-grid">
                      <div className="section-card">
                        <h4>Decision Context 清晰度</h4>
                        <p className="content-block">{readinessGovernance.decisionContextStatus}</p>
                      </div>
                      <div className="section-card">
                        <h4>Domain Context 成立度</h4>
                        <p className="content-block">{readinessGovernance.domainStatus}</p>
                      </div>
                      <div className="section-card">
                        <h4>Artifact / SourceMaterial 覆蓋度</h4>
                        <p className="content-block">{readinessGovernance.artifactStatus}</p>
                      </div>
                      <div className="section-card">
                        <h4>Evidence 覆蓋度</h4>
                        <p className="content-block">{readinessGovernance.evidenceStatus}</p>
                      </div>
                    </div>

                    {readinessGovernance.missingInformation.length > 0 ? (
                      <div className="detail-item" style={{ marginTop: "14px" }}>
                        <h3>目前缺少的關鍵資料</h3>
                        <ExpandableList
                          items={readinessGovernance.missingInformation}
                          emptyText="目前沒有額外缺漏資訊。"
                        />
                      </div>
                    ) : null}

                    <div className="summary-grid" style={{ marginTop: "14px" }}>
                      <div className="section-card">
                        <h4>目前可支撐的交付層級</h4>
                        <ExpandableText
                          text={
                            sparseInputOperatingView
                              ? `${sparseInputOperatingView.deliverableClassLabel}。${sparseInputOperatingView.deliverableGuidance}`
                              : ""
                          }
                          emptyText="尚未整理本輪可支撐的交付層級。"
                          previewChars={220}
                        />
                      </div>
                      <div className="section-card">
                        <h4>對目前結論的影響</h4>
                        <ExpandableText
                          text={readinessGovernance.conclusionImpact}
                          emptyText="尚未整理結論影響。"
                          previewChars={180}
                        />
                      </div>
                      <div className="section-card">
                        <h4>限制與假設訊號</h4>
                        <p className="content-block">
                          {readinessGovernance.constraintSignal}
                          {"\n"}
                          {readinessGovernance.assumptionSignal}
                        </p>
                      </div>
                      {readinessGovernance.packEvidenceExpectations.length > 0 ? (
                        <div className="section-card">
                          <h4>Pack evidence expectations</h4>
                          <ExpandableList
                            items={readinessGovernance.packEvidenceExpectations}
                            emptyText="目前沒有額外的 pack evidence expectations。"
                            initialCount={4}
                          />
                        </div>
                      ) : null}
                      {packSelection && packSelection.keyKpis.length > 0 ? (
                        <div className="section-card">
                          <h4>Pack 關鍵指標</h4>
                          <ExpandableList
                            items={packSelection.keyKpis}
                            emptyText="目前沒有額外的 pack 關鍵指標。"
                            initialCount={4}
                          />
                        </div>
                      ) : null}
                      {packSelection && packSelection.commonRisks.length > 0 ? (
                        <div className="section-card">
                          <h4>Pack 常見風險</h4>
                          <ExpandableList
                            items={packSelection.commonRisks}
                            emptyText="目前沒有額外的 pack 常見風險。"
                            initialCount={4}
                          />
                        </div>
                      ) : null}
                      {sparseInputOperatingView?.externalResearchHeavy ? (
                        <div className="section-card">
                          <h4>外部事件導向提醒</h4>
                          <ExpandableText
                            text="這輪屬於 external-research-heavy sparse case。系統會優先形成外部態勢判斷與待驗證事項，避免假裝已具備 company-specific certainty。"
                            emptyText="目前沒有額外提醒。"
                            previewChars={220}
                          />
                        </div>
                      ) : null}
                    </div>

                    {readinessGovernance.packHighImpactGaps.length > 0 ? (
                      <div className="detail-item" style={{ marginTop: "14px" }}>
                        <h3>Pack-aware 高影響缺口</h3>
                        <ExpandableList
                          items={readinessGovernance.packHighImpactGaps}
                          emptyText="目前沒有額外的 pack-aware 高影響缺口。"
                        />
                      </div>
                    ) : null}

                    {readinessGovernance.agentSelectionImplications.length > 0 ? (
                      <div className="detail-item" style={{ marginTop: "14px" }}>
                        <h3>Agent orchestration 對交付物的影響</h3>
                        <ExpandableList
                          items={readinessGovernance.agentSelectionImplications}
                          emptyText="目前沒有額外的 orchestration impact 說明。"
                        />
                      </div>
                    ) : null}

                    {readinessGovernance.level === "degraded" ? (
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

              <section className="panel" id="deliverable-surface">
                <div className="panel-header">
                  <div>
                    <h2 className="panel-title">正式交付結果</h2>
                    <p className="panel-copy">
                      這是目前最接近正式顧問交付物的主閱讀主線：先看 Decision Snapshot，再往下讀執行摘要、核心判斷與後續建議。
                    </p>
                  </div>
                </div>
                <div className="section-list">
                  {deliverableBacklink ? (
                    <div className="summary-grid">
                      <div className="section-card">
                        <h4>交付物掛載位置</h4>
                        <ExpandableText
                          text={deliverableBacklink.workspacePath}
                          emptyText="尚未整理這份交付物掛載的工作鏈位置。"
                          previewChars={180}
                        />
                      </div>
                      <div className="section-card">
                        <h4>對應 Decision Context</h4>
                        <ExpandableText
                          text={deliverableBacklink.decisionContext}
                          emptyText="尚未整理這份交付物的 decision context。"
                          previewChars={180}
                        />
                      </div>
                      <div className="section-card">
                        <h4>Evidence Basis</h4>
                        <ExpandableText
                          text={deliverableBacklink.evidenceBasis}
                          emptyText="尚未整理這份交付物的 evidence basis。"
                          previewChars={180}
                        />
                      </div>
                      <div className="section-card">
                        <h4>寫回的決策鏈</h4>
                        <ExpandableList
                          items={deliverableBacklink.linkedOutputs}
                          emptyText="尚未整理這份交付物寫回的決策鏈。"
                        />
                      </div>
                    </div>
                  ) : null}

                  {deliverableBacklink ? (
                    <div className="section-card">
                      <h4>交付物回鏈摘要</h4>
                      <ExpandableText
                        text={deliverableBacklink.summary}
                        emptyText="尚未整理這份交付物如何掛回 ontology chain。"
                        previewChars={240}
                      />
                    </div>
                  ) : null}

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

                  <div className="summary-grid">
                    <div className="section-card">
                      <h4>執行摘要</h4>
                      <ExpandableText
                        text={executiveSummary?.summary ?? ""}
                        emptyText="尚未產出可供決策閱讀的執行摘要。"
                        previewChars={240}
                      />
                    </div>
                    <div className="section-card">
                      <h4>核心判斷</h4>
                      <ExpandableText
                        text={executiveSummary?.coreJudgment ?? ""}
                        emptyText="尚未產出可供顧問式討論的核心判斷。"
                        previewChars={240}
                      />
                    </div>
                  </div>

                  {executiveSummary?.bullets.length ? (
                    <div className="section-card">
                      <h4>摘要重點</h4>
                      <ExpandableList
                        items={executiveSummary.bullets}
                        emptyText="尚未整理出可供快速閱讀的摘要重點。"
                      />
                    </div>
                  ) : null}
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

              {visibleModeSpecificSections.length > 0 ? (
                <div className="workspace-section-intro">
                  <h2 className="section-title">場景專業區塊</h2>
                  <p className="panel-copy">
                    以下內容只補這個 workflow mode 的專業重點，用來承接場景差異，不改變上面的共通決策骨架。
                  </p>
                </div>
              ) : null}

              {visibleModeSpecificSections.map((section) => (
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
                    <h2 className="panel-title">Extension Manager</h2>
                    <p className="panel-copy">
                      這裡用最小正式管理面承接本次任務的 pack / agent context。你可以查看 catalog、理解這輪 selected extensions，並對單一任務覆寫 packs 或 agent hints。
                    </p>
                  </div>
                </div>
                <ExtensionManagerSurface
                  snapshot={extensionManager}
                  loading={extensionLoading}
                  error={extensionError}
                  task={task}
                  saving={savingOverrides}
                  onSaveOverrides={handleSaveOverrides}
                />
              </section>

              <section className="panel">
                <div className="panel-header">
                  <div>
                    <h2 className="panel-title">Supporting Context</h2>
                    <p className="panel-copy">
                      這一欄只保留幫助你理解結論來源的補充內容，不讓 supporting info 抢走主交付主線。
                    </p>
                  </div>
                </div>
                {ontologyChainSummary ? (
                  <div className="summary-grid">
                    <div className="section-card">
                      <h4>Decision Context</h4>
                      <ExpandableText
                        text={ontologyChainSummary.decisionContext}
                        emptyText="尚未形成可讀的 decision context。"
                        previewChars={160}
                      />
                    </div>
                    <div className="section-card">
                      <h4>物件鏈摘要</h4>
                      <p className="content-block">
                        {ontologyChainSummary.artifactCount} artifact /{" "}
                        {ontologyChainSummary.sourceMaterialCount} source material /{" "}
                        {ontologyChainSummary.evidenceCount} evidence
                        {"\n"}
                        {ontologyChainSummary.recommendationCount} recommendation /{" "}
                        {ontologyChainSummary.riskCount} risk /{" "}
                        {ontologyChainSummary.actionItemCount} action item
                      </p>
                    </div>
                  </div>
                ) : null}
              </section>

              {latestDeliverable ? (
                <DisclosurePanel
                  title="完整交付物"
                  description="查看這次 structured deliverable 的完整欄位與原始內容。"
                >
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
                </DisclosurePanel>
              ) : null}

              {task.evidence.length > 0 ? (
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
                  </div>
                </DisclosurePanel>
              ) : null}

              {hasBackgroundSupport ? (
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
              ) : null}

              {shouldShowExternalDataContext && externalDataUsage ? (
                <DisclosurePanel
                  title="外部資料使用情況"
                  description="確認這輪判斷是否引用了外部來源，以及哪些結論依賴這些補充資料。"
                >
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
                </DisclosurePanel>
              ) : null}

              {hasSystemTrace ? (
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

                    {task.runs.length > 0 ? (
                      <div className="detail-item">
                        <h3>任務歷史</h3>
                        <p className="panel-copy" style={{ marginBottom: "16px" }}>
                          回看這個案件的執行紀錄、寫回摘要與歷程狀態。
                        </p>
                        <div className="detail-list">
                          {[...task.runs]
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
                            ))}
                        </div>
                      </div>
                    ) : null}

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
              ) : null}

            </div>
          </div>
        </>
      ) : null}
    </main>
  );
}
