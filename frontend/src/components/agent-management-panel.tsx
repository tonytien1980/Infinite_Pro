"use client";

import { useEffect, useMemo, useState } from "react";

import { draftAgentContract, getExtensionManager, listTasks } from "@/lib/api";
import {
  buildGuidedAgentDraft,
  type GuidedAgentDraft,
} from "@/lib/extension-guided-builders";
import {
  applyAgentFallbackState,
  buildAgentPersistenceFeedback,
  clearLocalAgentEntry,
  persistAgentCatalogEntry,
} from "@/lib/workbench-persistence";
import type {
  AgentCatalogEntry,
  AgentContractDraftResult,
  ExtensionManagerSnapshot,
  TaskListItem,
} from "@/lib/types";
import {
  getAgentCatalogDisplay,
  labelForAgentType,
  labelForCapability,
  labelForExtensionStatus,
} from "@/lib/ui-labels";
import {
  createLocalId,
  mergeManagedAgents,
  useAgentManagerState,
} from "@/lib/workbench-store";

type AgentFilterStatus = "all" | "active" | "inactive";
type AgentFilterType = "all" | "host" | "general";

type AgentQualityCheck = {
  label: string;
  ready: boolean;
};

function buildUsageMap(tasks: TaskListItem[]) {
  const usage = new Map<string, { count: number; lastUsedAt: string }>();

  tasks.forEach((task) => {
    task.selected_agent_ids.forEach((agentId) => {
      const entry = usage.get(agentId) ?? { count: 0, lastUsedAt: task.updated_at };
      entry.count += 1;
      if (new Date(task.updated_at).getTime() > new Date(entry.lastUsedAt).getTime()) {
        entry.lastUsedAt = task.updated_at;
      }
      usage.set(agentId, entry);
    });
  });

  return usage;
}

function toAgentCatalogEntry(
  agent: AgentCatalogEntry & {
    source?: "system" | "local";
    usageCount?: number;
    lastUsedAt?: string | null;
  },
): AgentCatalogEntry {
  return {
    agent_id: agent.agent_id,
    agent_name: agent.agent_name,
    agent_type: agent.agent_type,
    description: agent.description,
    supported_capabilities: agent.supported_capabilities,
    relevant_domain_packs: agent.relevant_domain_packs,
    relevant_industry_packs: agent.relevant_industry_packs,
    primary_responsibilities: agent.primary_responsibilities,
    out_of_scope: agent.out_of_scope,
    defer_rules: agent.defer_rules,
    preferred_execution_modes: agent.preferred_execution_modes,
    input_requirements: agent.input_requirements,
    minimum_evidence_readiness: agent.minimum_evidence_readiness,
    required_context_fields: agent.required_context_fields,
    output_contract: agent.output_contract,
    produced_objects: agent.produced_objects,
    deliverable_impact: agent.deliverable_impact,
    writeback_expectations: agent.writeback_expectations,
    invocation_rules: agent.invocation_rules,
    escalation_rules: agent.escalation_rules,
    handoff_targets: agent.handoff_targets,
    evaluation_focus: agent.evaluation_focus,
    failure_modes_to_watch: agent.failure_modes_to_watch,
    trace_requirements: agent.trace_requirements,
    version: agent.version,
    status: agent.status,
  };
}

function getAgentQualityChecks(agent: AgentCatalogEntry): AgentQualityCheck[] {
  return [
    { label: "責任", ready: agent.primary_responsibilities.length > 0 },
    { label: "非責任範圍", ready: agent.out_of_scope.length > 0 },
    { label: "啟動模式", ready: agent.preferred_execution_modes.length > 0 },
    { label: "輸入條件", ready: agent.input_requirements.length > 0 },
    { label: "輸出契約", ready: agent.output_contract.length > 0 },
    { label: "handoff", ready: agent.handoff_targets.length > 0 },
    { label: "評估焦點", ready: agent.evaluation_focus.length > 0 },
    { label: "追溯要求", ready: agent.trace_requirements.length > 0 },
  ];
}

function hasCoreContract(agent: AgentCatalogEntry) {
  return getAgentQualityChecks(agent).every((check) => check.ready);
}

function summarizeMissingChecks(checks: AgentQualityCheck[]) {
  const missing = checks.filter((check) => !check.ready).map((check) => check.label);
  return missing.length > 0 ? missing.join("、") : null;
}

function AgentListSection({
  title,
  items,
  emptyText,
}: {
  title: string;
  items: string[];
  emptyText: string;
}) {
  return (
    <div className="detail-item">
      <h4>{title}</h4>
      {items.length > 0 ? (
        <ul className="list-content">
          {items.map((item) => (
            <li key={`${title}-${item}`}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="muted-text">{emptyText}</p>
      )}
    </div>
  );
}

export function AgentManagementPanel() {
  const [snapshot, setSnapshot] = useState<ExtensionManagerSnapshot | null>(null);
  const [tasks, setTasks] = useState<TaskListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<AgentFilterStatus>("all");
  const [typeFilter, setTypeFilter] = useState<AgentFilterType>("all");
  const [editingAgentId, setEditingAgentId] = useState<string | null>(null);
  const [guidedDraft, setGuidedDraft] = useState<GuidedAgentDraft>(buildGuidedAgentDraft());
  const [guidedResult, setGuidedResult] = useState<AgentContractDraftResult | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [agentState, setAgentState] = useAgentManagerState();
  const [loading, setLoading] = useState(true);
  const [guidedSaving, setGuidedSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      setLoading(true);
      setError(null);
      const [snapshotResponse, taskResponse] = await Promise.all([
        getExtensionManager(),
        listTasks(),
      ]);
      setSnapshot(snapshotResponse);
      setTasks(taskResponse);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "載入代理管理頁失敗。");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  const usageMap = useMemo(() => buildUsageMap(tasks), [tasks]);
  const managedAgents = useMemo(
    () =>
      mergeManagedAgents(snapshot?.agent_registry.agents ?? [], agentState).map((agent) => ({
        ...agent,
        usageCount: usageMap.get(agent.agent_id)?.count ?? 0,
        lastUsedAt: usageMap.get(agent.agent_id)?.lastUsedAt ?? null,
      })),
    [agentState, snapshot?.agent_registry.agents, usageMap],
  );

  const filteredAgents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return managedAgents.filter((agent) => {
      const matchesStatus = statusFilter === "all" || agent.status === statusFilter;
      const matchesType =
        typeFilter === "all" ||
        (typeFilter === "host" ? agent.agent_type === "host" : agent.agent_type !== "host");

      if (!matchesStatus || !matchesType) {
        return false;
      }

      if (!query) {
        return true;
      }

      const display = getAgentCatalogDisplay(agent);
      return [
        agent.agent_name,
        display.primaryName,
        display.primaryDescription,
        ...agent.supported_capabilities,
        ...agent.primary_responsibilities,
        ...agent.out_of_scope,
        ...agent.input_requirements,
        ...agent.output_contract,
        ...agent.handoff_targets,
        ...agent.evaluation_focus,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [managedAgents, searchQuery, statusFilter, typeFilter]);

  const hostCount = managedAgents.filter((agent) => agent.agent_type === "host").length;
  const activeCount = managedAgents.filter((agent) => agent.status === "active").length;
  const completeSpecCount = managedAgents.filter((agent) => hasCoreContract(agent)).length;
  const editingAgent =
    editingAgentId ? managedAgents.find((agent) => agent.agent_id === editingAgentId) ?? null : null;
  const agentActionTitle =
    editingAgentId ? "目前編輯中" : "這頁先看什麼";
  const agentActionSummary = editingAgentId
    ? "這一輪會用最少必要資訊重新整理代理內容，而不是要求你逐欄微調技術規格。"
    : "先確認現有代理誰適合現在的工作、誰還缺重要內容，再決定要不要新增。這頁的重點不是數量，而是能不能放心使用。";
  const agentActionChecklist = [
    `目前共有 ${managedAgents.length} 個代理，其中 ${activeCount} 個啟用中，${hostCount} 個主控代理。`,
    `其中 ${completeSpecCount} 個代理已補齊主要工作、使用方式與注意事項。`,
    editingAgent
      ? `正在編輯「${getAgentCatalogDisplay(editingAgent).primaryName}」。`
      : "若只是查看現況，先搜尋與篩選縮小列表，不要直接進入新增。",
  ];

  function startCreate() {
    setEditingAgentId(null);
    setGuidedDraft(buildGuidedAgentDraft());
    setGuidedResult(null);
    setSaveMessage(null);
  }

  function startEdit(agent: AgentCatalogEntry) {
    setEditingAgentId(agent.agent_id);
    setGuidedDraft(buildGuidedAgentDraft(agent));
    setGuidedResult(null);
    setSaveMessage(null);
  }

  async function saveAgentPayload(payload: AgentCatalogEntry) {
    if (!payload.agent_name) {
      setSaveMessage("請先填寫代理名稱。");
      return;
    }

    if (!editingAgentId && payload.agent_type === "host") {
      setSaveMessage("主控代理維持系統協調中心，本輪不新增第二個主控代理。");
      return;
    }

    const isSystemAgent =
      snapshot?.agent_registry.agents.some((agent) => agent.agent_id === payload.agent_id) ?? false;
    try {
      const result = await persistAgentCatalogEntry(payload, !isSystemAgent);

      if (result.source === "remote") {
        setSnapshot(result.snapshot);
        setAgentState((current) => clearLocalAgentEntry(current, payload.agent_id));
      } else {
        setAgentState((current) => applyAgentFallbackState(current, payload, isSystemAgent));
      }

      setEditingAgentId(payload.agent_id);
      setGuidedDraft(buildGuidedAgentDraft(payload));
      setSaveMessage(buildAgentPersistenceFeedback(result.source, payload.agent_name));
    } catch (saveError) {
      setSaveMessage(saveError instanceof Error ? saveError.message : "保存代理失敗。");
    }
  }

  async function handleGuidedSave() {
    const agentId = editingAgentId ?? createLocalId("local-agent");
    setGuidedSaving(true);
    setSaveMessage(null);
    try {
      const result = await draftAgentContract({
        agent_id: agentId,
        agent_name: guidedDraft.agent_name.trim(),
        agent_type: guidedDraft.agent_type,
        description: guidedDraft.description.trim(),
        supported_capabilities: guidedDraft.supported_capabilities,
        relevant_domain_packs: guidedDraft.relevant_domain_packs,
        relevant_industry_packs: guidedDraft.relevant_industry_packs,
        role_focus: guidedDraft.role_focus,
        input_focus: "",
        output_focus: "",
        when_to_use: "",
        boundary_focus: guidedDraft.boundary_focus,
        version: guidedDraft.version.trim() || "1.0.0",
        status: guidedDraft.status,
      });
      setGuidedResult(result);
      await saveAgentPayload(result.draft);
      setSaveMessage(
        `已用目前系統模型與 ${result.sources.length} 筆外部來源補完「${result.draft.agent_name}」的正式代理定義，並寫入管理狀態。`,
      );
    } catch (saveError) {
      setSaveMessage(
        saveError instanceof Error ? saveError.message : "目前無法用 AI 補完正式代理規格。",
      );
    } finally {
      setGuidedSaving(false);
    }
  }

  async function handleToggle(agent: AgentCatalogEntry & { source: "system" | "local" }) {
    if (agent.agent_type === "host") {
      setSaveMessage("主控代理維持正式協調中心，本輪不提供停用。");
      return;
    }

    const nextStatus = agent.status === "active" ? "inactive" : "active";
    const nextPayload = {
      ...toAgentCatalogEntry(agent),
      status: nextStatus,
    };

    try {
      const result = await persistAgentCatalogEntry(nextPayload, agent.source === "local");

      if (result.source === "remote") {
        setSnapshot(result.snapshot);
        setAgentState((current) => clearLocalAgentEntry(current, agent.agent_id));
      } else {
        setAgentState((current) =>
          applyAgentFallbackState(current, nextPayload, agent.source === "system"),
        );
      }

      setSaveMessage(buildAgentPersistenceFeedback(result.source, nextPayload.agent_name));
    } catch (saveError) {
      setSaveMessage(saveError instanceof Error ? saveError.message : "更新代理狀態失敗。");
    }
  }

  return (
    <main className="page-shell management-page-shell agents-page-shell">
      <section className="hero-card governance-hero agents-hero">
        <div className="hero-layout">
          <div className="hero-main">
            <span className="eyebrow">代理管理</span>
            <h1 className="page-title">代理管理</h1>
            <p className="page-subtitle">
              這裡用來查看代理是否啟用、各自擅長什麼，以及哪些內容還沒補齊。
            </p>
            <div className="hero-actions">
              <button className="button-primary" type="button" onClick={startCreate}>
                新增代理
              </button>
              <a className="button-secondary" href="#agent-catalog-panel">
                看代理列表
              </a>
            </div>
          </div>

          <div className="hero-aside">
            <div className="hero-focus-card">
              <p className="hero-focus-label">{agentActionTitle}</p>
              <h3 className="hero-focus-title">先看哪些代理已經整理好、可以直接用</h3>
              <p className="hero-focus-copy">{agentActionSummary}</p>
            </div>
            <div className="hero-focus-card hero-focus-card-warm">
              <p className="hero-focus-label">這頁先看什麼</p>
              <ul className="hero-focus-list">
                {agentActionChecklist.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="hero-metrics-grid">
          <div className="section-card hero-metric-card">
            <h3>全部代理</h3>
            <p className="workbench-metric">{managedAgents.length}</p>
            <p className="muted-text">目前已在工作台管理中的代理。</p>
          </div>
          <div className="section-card hero-metric-card">
            <h3>啟用中</h3>
            <p className="workbench-metric">{activeCount}</p>
            <p className="muted-text">目前可被工作流選入的代理。</p>
          </div>
          <div className="section-card hero-metric-card">
            <h3>主控代理</h3>
            <p className="workbench-metric">{hostCount}</p>
            <p className="muted-text">仍由主控代理維持正式協調中心。</p>
          </div>
          <div className="section-card hero-metric-card">
            <h3>核心定義完整</h3>
            <p className="workbench-metric">{completeSpecCount}</p>
            <p className="muted-text">已補齊主要工作、使用方式與注意事項的代理。</p>
          </div>
        </div>
      </section>

      {loading ? (
        <p className="status-text" role="status" aria-live="polite">
          正在載入代理管理頁...
        </p>
      ) : null}
      {error ? (
        <p className="error-text" role="alert" aria-live="assertive">
          {error}
        </p>
      ) : null}

      {!loading && !error ? (
        <div className="detail-grid">
          <div className="detail-stack">
            <section className="panel" id="agent-catalog-panel">
              <div className="panel-header">
                <div>
                  <h2 className="panel-title">代理列表</h2>
                  <p className="panel-copy">先判斷代理定義是否完整，再決定要新增、編輯或停用哪一個。</p>
                </div>
                <button className="button-primary" type="button" onClick={startCreate}>
                  新增代理
                </button>
              </div>

              <div className="toolbar-grid">
                <div className="field">
                  <label htmlFor="agent-search">搜尋代理</label>
                  <input
                    id="agent-search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="搜尋名稱、主要工作或適用工作類型"
                  />
                </div>

                <div className="field">
                  <label htmlFor="agent-status-filter">狀態篩選</label>
                  <select
                    id="agent-status-filter"
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(event.target.value as AgentFilterStatus)
                    }
                  >
                    <option value="all">全部狀態</option>
                    <option value="active">啟用中</option>
                    <option value="inactive">已停用</option>
                  </select>
                </div>

                <div className="field">
                  <label htmlFor="agent-type-filter">類型篩選</label>
                  <select
                    id="agent-type-filter"
                    value={typeFilter}
                    onChange={(event) => setTypeFilter(event.target.value as AgentFilterType)}
                  >
                    <option value="all">全部代理</option>
                    <option value="host">主控代理</option>
                    <option value="general">一般代理</option>
                  </select>
                </div>
              </div>

              <div className="history-list" style={{ marginTop: "18px" }}>
                {filteredAgents.length > 0 ? (
                  filteredAgents.map((agent) => {
                    const display = getAgentCatalogDisplay(agent);
                    const qualityChecks = getAgentQualityChecks(agent);
                    const readyCount = qualityChecks.filter((check) => check.ready).length;
                    const missingChecks = summarizeMissingChecks(qualityChecks);

                    return (
                      <article className="history-item management-card" key={agent.agent_id}>
                        <div className="meta-row">
                          <span className="pill">{labelForAgentType(agent.agent_type)}</span>
                          <span>{labelForExtensionStatus(agent.status)}</span>
                          <span>v{agent.version}</span>
                          <span>{agent.source === "local" ? "自訂代理" : "系統代理"}</span>
                        </div>
                        <h3>{display.primaryName}</h3>
                        <p className="content-block">{display.primaryDescription}</p>
                        <p className="muted-text">
                          適用工作類型：
                          {agent.supported_capabilities.length > 0
                            ? agent.supported_capabilities
                                .slice(0, 4)
                                .map((item) => labelForCapability(item))
                                .join("、")
                            : "目前未標示"}
                        </p>
                        <p className="muted-text">
                          最近使用：
                          {agent.usageCount > 0 && agent.lastUsedAt
                            ? `${agent.usageCount} 次，最近於 ${new Intl.DateTimeFormat("zh-TW", {
                                dateStyle: "medium",
                              }).format(new Date(agent.lastUsedAt))}`
                            : "目前沒有使用紀錄"}
                        </p>
                        <p className="muted-text">
                          核心定義：{readyCount}/{qualityChecks.length} 已補齊
                          {missingChecks ? `；尚待補強：${missingChecks}` : "；目前已可作為完整代理定義使用"}
                        </p>
                        <details className="inline-disclosure">
                          <summary className="inline-disclosure-summary">查看代理定義</summary>
                          <div className="detail-list" style={{ marginTop: "12px" }}>
                            <div className="detail-item">
                              <h4>系統資料</h4>
                              <p className="content-block">
                                顯示代號：{agent.agent_id}
                                {"\n"}
                                版本：v{agent.version}
                              </p>
                            </div>
                            <AgentListSection
                              title="主要責任"
                              items={agent.primary_responsibilities}
                              emptyText="目前沒有整理主要責任。"
                            />
                            <AgentListSection
                              title="非責任範圍"
                              items={agent.out_of_scope}
                              emptyText="目前沒有整理 out-of-scope。"
                            />
                            <AgentListSection
                              title="延後 / defer 規則"
                              items={agent.defer_rules}
                              emptyText="目前沒有整理 defer 規則。"
                            />
                            <AgentListSection
                              title="偏好執行模式"
                              items={agent.preferred_execution_modes}
                              emptyText="目前沒有標示偏好執行模式。"
                            />
                            <AgentListSection
                              title="輸入要求"
                              items={agent.input_requirements}
                              emptyText="目前沒有整理輸入要求。"
                            />
                            <AgentListSection
                              title="最小證據就緒條件"
                              items={agent.minimum_evidence_readiness}
                              emptyText="目前沒有整理最小證據就緒條件。"
                            />
                            <AgentListSection
                              title="必要 context 欄位"
                              items={agent.required_context_fields}
                              emptyText="目前沒有整理必要 context 欄位。"
                            />
                            <AgentListSection
                              title="輸出契約"
                              items={agent.output_contract}
                              emptyText="目前沒有整理輸出契約。"
                            />
                            <AgentListSection
                              title="產出物件"
                              items={agent.produced_objects}
                              emptyText="目前沒有整理產出物件。"
                            />
                            <AgentListSection
                              title="對交付物的影響"
                              items={agent.deliverable_impact}
                              emptyText="目前沒有整理 deliverable impact。"
                            />
                            <AgentListSection
                              title="寫回要求"
                              items={agent.writeback_expectations}
                              emptyText="目前沒有整理 writeback expectations。"
                            />
                            <AgentListSection
                              title="啟動規則"
                              items={agent.invocation_rules}
                              emptyText="目前沒有整理 invocation rules。"
                            />
                            <AgentListSection
                              title="升級 / escalation 規則"
                              items={agent.escalation_rules}
                              emptyText="目前沒有整理 escalation rules。"
                            />
                            <AgentListSection
                              title="交接對象"
                              items={agent.handoff_targets}
                              emptyText="目前沒有整理 handoff targets。"
                            />
                            <AgentListSection
                              title="評估焦點"
                              items={agent.evaluation_focus}
                              emptyText="目前沒有整理 evaluation focus。"
                            />
                            <AgentListSection
                              title="常見失敗模式"
                              items={agent.failure_modes_to_watch}
                              emptyText="目前沒有整理 failure modes。"
                            />
                            <AgentListSection
                              title="Trace 要求"
                              items={agent.trace_requirements}
                              emptyText="目前沒有整理 trace requirements。"
                            />
                          </div>
                        </details>
                        <div className="button-row" style={{ marginTop: "12px" }}>
                          <button
                            className="button-secondary"
                            type="button"
                            onClick={() => startEdit(agent)}
                          >
                            編輯
                          </button>
                          <button
                            className="button-secondary"
                            type="button"
                            disabled={agent.agent_type === "host"}
                            onClick={() => handleToggle(agent)}
                          >
                            {agent.agent_type === "host"
                              ? "主控代理固定啟用"
                              : agent.status === "active"
                                ? "停用"
                                : "啟用"}
                          </button>
                        </div>
                      </article>
                    );
                  })
                ) : (
                  <p className="empty-text">目前沒有符合條件的代理。</p>
                )}
              </div>
            </section>
          </div>

          <div className="detail-stack">
            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2 className="panel-title">{editingAgentId ? "編輯代理" : "新增代理"}</h2>
                  <p className="panel-copy">
                    這裡只收最少必要資訊。你不用先決定能力面、模組包綁定或技術欄位，系統會用目前啟用的 AI 模型搭配外部搜尋補成正式代理定義，再交給主控代理之後判斷要不要拉進案件流程。
                  </p>
                  {editingAgent ? (
                    <p className="muted-text">
                      顯示名稱：{getAgentCatalogDisplay(editingAgent).primaryName}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="summary-grid" style={{ marginBottom: "18px" }}>
                <div className="section-card">
                  <h4>現在只需要你提供</h4>
                  <p className="content-block">
                    代理名稱、它大致在做什麼，以及你最希望它幫你補哪一種判斷或工作。若你有特別限制或禁區，再補一句就夠。
                  </p>
                </div>
                <div className="section-card">
                  <h4>系統會自己推導</h4>
                  <ul className="list-content">
                    <li>這個代理比較像推理代理還是專家代理</li>
                    <li>適合處理哪些工作、主要分工、輸出形式與注意事項</li>
                    <li>必要時才補 pack hints；若它應該是通用型代理，就不會先綁死在特定 pack</li>
                  </ul>
                </div>
              </div>

              <div className="form-grid">
                <div className="field">
                  <label htmlFor="agent-guided-name">代理名稱</label>
                  <input
                    id="agent-guided-name"
                    value={guidedDraft.agent_name}
                    onChange={(event) =>
                      setGuidedDraft((current) => ({ ...current, agent_name: event.target.value }))
                    }
                    placeholder="例如：市場觀察代理、商務提案代理"
                  />
                </div>

                <div className="field">
                  <label htmlFor="agent-guided-description">這個代理大致是做什麼的</label>
                  <textarea
                    id="agent-guided-description"
                    value={guidedDraft.description}
                    onChange={(event) =>
                      setGuidedDraft((current) => ({ ...current, description: event.target.value }))
                    }
                    placeholder="用一句話或一小段描述它主要想補哪一種判斷。"
                  />
                </div>

                <div className="field">
                  <label htmlFor="agent-guided-role-focus">你最希望它幫你補哪一種判斷或工作</label>
                  <textarea
                    id="agent-guided-role-focus"
                    value={guidedDraft.role_focus}
                    onChange={(event) =>
                      setGuidedDraft((current) => ({ ...current, role_focus: event.target.value }))
                    }
                    placeholder={"例如：\n幫我把外部市場變化整理成可引用重點\n幫我補商務開發上的機會與阻力"}
                  />
                </div>

                <div className="field">
                  <label htmlFor="agent-guided-boundaries">可選：若有特別限制、禁區或提醒再補充</label>
                  <textarea
                    id="agent-guided-boundaries"
                    value={guidedDraft.boundary_focus}
                    onChange={(event) =>
                      setGuidedDraft((current) => ({ ...current, boundary_focus: event.target.value }))
                    }
                    placeholder={"例如：\n不要把它當成最終拍板者\n不要輸出像正式法律意見的內容"}
                  />
                </div>

                <div className="button-row">
                  <button
                    className="button-primary"
                    type="button"
                    disabled={guidedSaving}
                    onClick={handleGuidedSave}
                  >
                    {guidedSaving ? "正在用 AI 補完代理..." : "建立代理，並讓系統自動補完正式定義"}
                  </button>
                </div>
                {saveMessage ? (
                  <p className="success-text" role="status" aria-live="polite">
                    {saveMessage}
                  </p>
                ) : null}
              </div>

              {guidedResult ? (
                <section className="summary-grid" style={{ marginTop: "18px" }}>
                  <div className="section-card">
                    <h4>AI 補完摘要</h4>
                    <p className="content-block">{guidedResult.synthesis_summary}</p>
                    <p className="muted-text">搜尋查詢：{guidedResult.search_query}</p>
                  </div>
                  <div className="section-card">
                    <h4>外部來源與生成備註</h4>
                    <ul className="list-content">
                      {guidedResult.sources.map((source) => (
                        <li key={source.url}>
                          <a href={source.url} target="_blank" rel="noreferrer">
                            {source.title}
                          </a>
                        </li>
                      ))}
                      {guidedResult.generation_notes.map((note) => (
                        <li key={note}>{note}</li>
                      ))}
                    </ul>
                  </div>
                </section>
              ) : null}
            </section>
          </div>
        </div>
      ) : null}
    </main>
  );
}
