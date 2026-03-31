"use client";

import { useEffect, useMemo, useState } from "react";

import { getExtensionManager, listTasks } from "@/lib/api";
import {
  applyAgentFallbackState,
  buildAgentPersistenceFeedback,
  clearLocalAgentEntry,
  persistAgentCatalogEntry,
} from "@/lib/workbench-persistence";
import type { AgentCatalogEntry, ExtensionManagerSnapshot, TaskListItem } from "@/lib/types";
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

type AgentDraft = {
  agent_name: string;
  agent_type: string;
  description: string;
  supported_capabilities: string;
  relevant_domain_packs: string;
  relevant_industry_packs: string;
  primary_responsibilities: string;
  out_of_scope: string;
  defer_rules: string;
  preferred_execution_modes: string;
  input_requirements: string;
  minimum_evidence_readiness: string;
  required_context_fields: string;
  output_contract: string;
  produced_objects: string;
  deliverable_impact: string;
  writeback_expectations: string;
  invocation_rules: string;
  escalation_rules: string;
  handoff_targets: string;
  evaluation_focus: string;
  failure_modes_to_watch: string;
  trace_requirements: string;
  version: string;
  status: string;
};

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

function splitLines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinLines(values?: string[]) {
  return values?.join("\n") ?? "";
}

function buildEmptyAgentEntry(agentType: string, agentId: string): AgentCatalogEntry {
  return {
    agent_id: agentId,
    agent_name: "",
    agent_type: agentType,
    description: "",
    supported_capabilities: [],
    relevant_domain_packs: [],
    relevant_industry_packs: [],
    primary_responsibilities: [],
    out_of_scope: [],
    defer_rules: [],
    preferred_execution_modes: [],
    input_requirements: [],
    minimum_evidence_readiness: [],
    required_context_fields: [],
    output_contract: [],
    produced_objects: [],
    deliverable_impact: [],
    writeback_expectations: [],
    invocation_rules: [],
    escalation_rules: [],
    handoff_targets: [],
    evaluation_focus: [],
    failure_modes_to_watch: [],
    trace_requirements: [],
    version: "1.0.0",
    status: "active",
  };
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

function buildDraft(agent?: Partial<AgentCatalogEntry>): AgentDraft {
  return {
    agent_name: agent?.agent_name ?? "",
    agent_type: agent?.agent_type ?? "specialist",
    description: agent?.description ?? "",
    supported_capabilities: joinLines(agent?.supported_capabilities),
    relevant_domain_packs: joinLines(agent?.relevant_domain_packs),
    relevant_industry_packs: joinLines(agent?.relevant_industry_packs),
    primary_responsibilities: joinLines(agent?.primary_responsibilities),
    out_of_scope: joinLines(agent?.out_of_scope),
    defer_rules: joinLines(agent?.defer_rules),
    preferred_execution_modes: joinLines(agent?.preferred_execution_modes),
    input_requirements: joinLines(agent?.input_requirements),
    minimum_evidence_readiness: joinLines(agent?.minimum_evidence_readiness),
    required_context_fields: joinLines(agent?.required_context_fields),
    output_contract: joinLines(agent?.output_contract),
    produced_objects: joinLines(agent?.produced_objects),
    deliverable_impact: joinLines(agent?.deliverable_impact),
    writeback_expectations: joinLines(agent?.writeback_expectations),
    invocation_rules: joinLines(agent?.invocation_rules),
    escalation_rules: joinLines(agent?.escalation_rules),
    handoff_targets: joinLines(agent?.handoff_targets),
    evaluation_focus: joinLines(agent?.evaluation_focus),
    failure_modes_to_watch: joinLines(agent?.failure_modes_to_watch),
    trace_requirements: joinLines(agent?.trace_requirements),
    version: agent?.version ?? "1.0.0",
    status: agent?.status ?? "active",
  };
}

function buildPayloadFromDraft(
  draft: AgentDraft,
  agentId: string,
  baseAgent?: AgentCatalogEntry,
): AgentCatalogEntry {
  return {
    ...(baseAgent ?? buildEmptyAgentEntry(draft.agent_type, agentId)),
    agent_id: agentId,
    agent_name: draft.agent_name.trim(),
    agent_type: draft.agent_type,
    description: draft.description.trim(),
    supported_capabilities: splitLines(draft.supported_capabilities),
    relevant_domain_packs: splitLines(draft.relevant_domain_packs),
    relevant_industry_packs: splitLines(draft.relevant_industry_packs),
    primary_responsibilities: splitLines(draft.primary_responsibilities),
    out_of_scope: splitLines(draft.out_of_scope),
    defer_rules: splitLines(draft.defer_rules),
    preferred_execution_modes: splitLines(draft.preferred_execution_modes),
    input_requirements: splitLines(draft.input_requirements),
    minimum_evidence_readiness: splitLines(draft.minimum_evidence_readiness),
    required_context_fields: splitLines(draft.required_context_fields),
    output_contract: splitLines(draft.output_contract),
    produced_objects: splitLines(draft.produced_objects),
    deliverable_impact: splitLines(draft.deliverable_impact),
    writeback_expectations: splitLines(draft.writeback_expectations),
    invocation_rules: splitLines(draft.invocation_rules),
    escalation_rules: splitLines(draft.escalation_rules),
    handoff_targets: splitLines(draft.handoff_targets),
    evaluation_focus: splitLines(draft.evaluation_focus),
    failure_modes_to_watch: splitLines(draft.failure_modes_to_watch),
    trace_requirements: splitLines(draft.trace_requirements),
    version: draft.version.trim() || "1.0.0",
    status: draft.status,
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
    { label: "trace 要求", ready: agent.trace_requirements.length > 0 },
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
  const [draft, setDraft] = useState<AgentDraft>(buildDraft());
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [agentState, setAgentState] = useAgentManagerState();
  const [loading, setLoading] = useState(true);
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
  const editingSystemHost = editingAgent?.agent_type === "host" && editingAgent.source === "system";
  const agentActionTitle =
    editingAgentId ? "現在正處於代理編輯模式" : "先看 agent contract 是否真的完整";
  const agentActionSummary = editingAgentId
    ? "這一輪會直接編輯 agent 的正式規格，而不是只改名稱與版本。儲存前請確認責任、邊界、handoff 與 trace 要求是否一致。"
    : "先確認現有代理是否已經具備足夠完整的 contract，再決定是否新增。這頁的重點不是 catalog 數量，而是 agent spec 是否扎實。";
  const agentActionChecklist = [
    `目前共有 ${managedAgents.length} 個代理，其中 ${activeCount} 個啟用中，${hostCount} 個主控代理。`,
    `其中 ${completeSpecCount} 個代理已補齊核心 contract。`,
    editingAgent
      ? `正在編輯「${getAgentCatalogDisplay(editingAgent).primaryName}」。`
      : "若只是查看現況，先搜尋與篩選縮小列表，不要直接進入新增。",
  ];

  function startCreate() {
    setEditingAgentId(null);
    setDraft(buildDraft(buildEmptyAgentEntry("specialist", createLocalId("local-agent-draft"))));
    setSaveMessage(null);
  }

  function startEdit(agent: AgentCatalogEntry) {
    setEditingAgentId(agent.agent_id);
    setDraft(buildDraft(agent));
    setSaveMessage(null);
  }

  async function handleSave() {
    const agentId = editingAgentId ?? createLocalId("local-agent");
    const baseAgentRow = managedAgents.find((agent) => agent.agent_id === agentId);
    const baseAgent = baseAgentRow ? toAgentCatalogEntry(baseAgentRow) : undefined;
    const payload = buildPayloadFromDraft(draft, agentId, baseAgent);

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
      setSaveMessage(buildAgentPersistenceFeedback(result.source, payload.agent_name));
    } catch (saveError) {
      setSaveMessage(saveError instanceof Error ? saveError.message : "保存代理失敗。");
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
    <main className="page-shell">
      <section className="hero-card">
        <span className="eyebrow">代理管理</span>
        <h1 className="page-title">代理管理</h1>
        <p className="page-subtitle">
          管理代理狀態、版本、責任邊界、輸入輸出契約與交接方式，避免 agents 只剩 catalog 名稱而沒有正式規格。
        </p>
        <div className="workbench-overview-grid" style={{ marginTop: "20px" }}>
          <div className="section-card">
            <h3>全部代理</h3>
            <p className="workbench-metric">{managedAgents.length}</p>
            <p className="muted-text">目前已在工作台管理中的代理。</p>
          </div>
          <div className="section-card">
            <h3>啟用中</h3>
            <p className="workbench-metric">{activeCount}</p>
            <p className="muted-text">目前可被工作流選入的代理。</p>
          </div>
          <div className="section-card">
            <h3>主控代理</h3>
            <p className="workbench-metric">{hostCount}</p>
            <p className="muted-text">仍由主控代理維持正式協調中心。</p>
          </div>
          <div className="section-card">
            <h3>核心定義完整</h3>
            <p className="workbench-metric">{completeSpecCount}</p>
            <p className="muted-text">已補齊責任、邊界、handoff、評估與 trace 要求的代理。</p>
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
            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2 className="panel-title">代理列表</h2>
                  <p className="panel-copy">先判斷 agent contract 是否完整，再決定要新增、編輯或停用哪一個。</p>
                </div>
                <button className="button-primary" type="button" onClick={startCreate}>
                  新增代理
                </button>
              </div>

              <div className="summary-grid" style={{ marginBottom: "18px" }}>
                <div className="section-card">
                  <h4>{agentActionTitle}</h4>
                  <p className="content-block">{agentActionSummary}</p>
                </div>
                <div className="section-card">
                  <h4>這頁現在先看什麼</h4>
                  <ul className="list-content">
                    {agentActionChecklist.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="toolbar-grid">
                <div className="field">
                  <label htmlFor="agent-search">搜尋代理</label>
                  <input
                    id="agent-search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="搜尋名稱、責任、handoff 或適用工作類型"
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
                        <p className="muted-text">系統代號：{agent.agent_id}</p>
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
                          {missingChecks ? `；尚待補強：${missingChecks}` : "；目前已可作為完整 agent contract 使用"}
                        </p>
                        <details className="inline-disclosure">
                          <summary className="inline-disclosure-summary">查看 agent contract</summary>
                          <div className="detail-list" style={{ marginTop: "12px" }}>
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
                    這裡編輯的是 agent 的正式 contract。除了名稱、狀態與版本，也要一起維護責任邊界、handoff、評估與 trace 要求。
                  </p>
                  {editingAgent ? (
                    <p className="muted-text">
                      顯示名稱：{getAgentCatalogDisplay(editingAgent).primaryName}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="form-grid">
                <div className="field">
                  <label htmlFor="agent-name">代理名稱</label>
                  <input
                    id="agent-name"
                    value={draft.agent_name}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, agent_name: event.target.value }))
                    }
                  />
                </div>

                <div className="field">
                  <label htmlFor="agent-type">代理類型</label>
                  <select
                    id="agent-type"
                    value={draft.agent_type}
                    disabled={editingSystemHost}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, agent_type: event.target.value }))
                    }
                  >
                    {editingSystemHost ? <option value="host">主控代理</option> : null}
                    <option value="reasoning">推理代理</option>
                    <option value="specialist">專家代理</option>
                  </select>
                </div>

                <div className="field">
                  <label htmlFor="agent-version">版本</label>
                  <input
                    id="agent-version"
                    value={draft.version}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, version: event.target.value }))
                    }
                  />
                </div>

                <div className="field">
                  <label htmlFor="agent-status">狀態</label>
                  <select
                    id="agent-status"
                    value={draft.status}
                    disabled={editingSystemHost}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, status: event.target.value }))
                    }
                  >
                    <option value="active">啟用中</option>
                    {!editingSystemHost ? <option value="inactive">停用中</option> : null}
                    <option value="draft">草稿</option>
                  </select>
                </div>

                <div className="field">
                  <label htmlFor="agent-description">代理說明</label>
                  <textarea
                    id="agent-description"
                    value={draft.description}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, description: event.target.value }))
                    }
                    placeholder="描述這個代理負責的工作範圍與角色。"
                  />
                </div>

                <div className="field">
                  <label htmlFor="agent-capabilities">適用工作類型</label>
                  <textarea
                    id="agent-capabilities"
                    value={draft.supported_capabilities}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        supported_capabilities: event.target.value,
                      }))
                    }
                    placeholder={"每行一個 capability，例如：\ndiagnose_assess\nsynthesize_brief"}
                  />
                </div>

                <div className="field">
                  <label htmlFor="agent-domain-packs">相關問題面向模組包</label>
                  <textarea
                    id="agent-domain-packs"
                    value={draft.relevant_domain_packs}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        relevant_domain_packs: event.target.value,
                      }))
                    }
                    placeholder={"每行一個 pack id，例如：\noperations_pack\nresearch_intelligence_pack"}
                  />
                </div>

                <div className="field">
                  <label htmlFor="agent-industry-packs">相關產業模組包</label>
                  <textarea
                    id="agent-industry-packs"
                    value={draft.relevant_industry_packs}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        relevant_industry_packs: event.target.value,
                      }))
                    }
                    placeholder={"每行一個 pack id，例如：\necommerce_pack\nsaas_pack"}
                  />
                </div>

                <div className="field">
                  <label htmlFor="agent-responsibilities">主要責任</label>
                  <textarea
                    id="agent-responsibilities"
                    value={draft.primary_responsibilities}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        primary_responsibilities: event.target.value,
                      }))
                    }
                    placeholder={"每行一個責任，例如：\n拆解決策問題\n整理 trade-off"}
                  />
                </div>

                <div className="field">
                  <label htmlFor="agent-out-of-scope">非責任範圍</label>
                  <textarea
                    id="agent-out-of-scope"
                    value={draft.out_of_scope}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, out_of_scope: event.target.value }))
                    }
                    placeholder={"每行一個邊界，例如：\n不取代正式法律意見\n不直接拍板最終結論"}
                  />
                </div>

                <div className="field">
                  <label htmlFor="agent-defer-rules">延後 / defer 規則</label>
                  <textarea
                    id="agent-defer-rules"
                    value={draft.defer_rules}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, defer_rules: event.target.value }))
                    }
                    placeholder={"每行一個規則，例如：\n資料太薄時先 defer 精細結論"}
                  />
                </div>

                <div className="field">
                  <label htmlFor="agent-execution-modes">偏好執行模式</label>
                  <textarea
                    id="agent-execution-modes"
                    value={draft.preferred_execution_modes}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        preferred_execution_modes: event.target.value,
                      }))
                    }
                    placeholder={"每行一個模式，例如：\nmulti_agent\nspecialist"}
                  />
                </div>

                <div className="field">
                  <label htmlFor="agent-inputs">輸入要求</label>
                  <textarea
                    id="agent-inputs"
                    value={draft.input_requirements}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, input_requirements: event.target.value }))
                    }
                    placeholder={"每行一個輸入，例如：\nDecisionContext\nEvidence"}
                  />
                </div>

                <div className="field">
                  <label htmlFor="agent-readiness">最小證據就緒條件</label>
                  <textarea
                    id="agent-readiness"
                    value={draft.minimum_evidence_readiness}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        minimum_evidence_readiness: event.target.value,
                      }))
                    }
                    placeholder={"每行一個條件，例如：\n至少要有明確的 decision question"}
                  />
                </div>

                <div className="field">
                  <label htmlFor="agent-context-fields">必要 context 欄位</label>
                  <textarea
                    id="agent-context-fields"
                    value={draft.required_context_fields}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        required_context_fields: event.target.value,
                      }))
                    }
                    placeholder={"每行一個欄位，例如：\nDecisionContext\nGoals"}
                  />
                </div>

                <div className="field">
                  <label htmlFor="agent-output-contract">輸出契約</label>
                  <textarea
                    id="agent-output-contract"
                    value={draft.output_contract}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, output_contract: event.target.value }))
                    }
                    placeholder={"每行一個輸出，例如：\nInsights\nRecommendations"}
                  />
                </div>

                <div className="field">
                  <label htmlFor="agent-produced-objects">產出物件</label>
                  <textarea
                    id="agent-produced-objects"
                    value={draft.produced_objects}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, produced_objects: event.target.value }))
                    }
                    placeholder={"每行一個物件，例如：\nInsight\nEvidenceGap"}
                  />
                </div>

                <div className="field">
                  <label htmlFor="agent-deliverable-impact">對交付物的影響</label>
                  <textarea
                    id="agent-deliverable-impact"
                    value={draft.deliverable_impact}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, deliverable_impact: event.target.value }))
                    }
                    placeholder={"每行一個影響，例如：\n決定主結論的 framing"}
                  />
                </div>

                <div className="field">
                  <label htmlFor="agent-writeback">寫回要求</label>
                  <textarea
                    id="agent-writeback"
                    value={draft.writeback_expectations}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        writeback_expectations: event.target.value,
                      }))
                    }
                    placeholder={"每行一個要求，例如：\n保留信心邊界與來源依據"}
                  />
                </div>

                <div className="field">
                  <label htmlFor="agent-invocation">啟動規則</label>
                  <textarea
                    id="agent-invocation"
                    value={draft.invocation_rules}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, invocation_rules: event.target.value }))
                    }
                    placeholder={"每行一個規則，例如：\n適合用在 evidence-gap-heavy case"}
                  />
                </div>

                <div className="field">
                  <label htmlFor="agent-escalation">升級 / escalation 規則</label>
                  <textarea
                    id="agent-escalation"
                    value={draft.escalation_rules}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, escalation_rules: event.target.value }))
                    }
                    placeholder={"每行一個規則，例如：\n當缺少關鍵文件時要升級"}
                  />
                </div>

                <div className="field">
                  <label htmlFor="agent-handoffs">交接對象</label>
                  <textarea
                    id="agent-handoffs"
                    value={draft.handoff_targets}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, handoff_targets: event.target.value }))
                    }
                    placeholder={"每行一個對象，例如：\nHost Agent\nResearch Synthesis Specialist"}
                  />
                </div>

                <div className="field">
                  <label htmlFor="agent-evaluation">評估焦點</label>
                  <textarea
                    id="agent-evaluation"
                    value={draft.evaluation_focus}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, evaluation_focus: event.target.value }))
                    }
                    placeholder={"每行一個焦點，例如：\n來源品質分級品質"}
                  />
                </div>

                <div className="field">
                  <label htmlFor="agent-failure-modes">常見失敗模式</label>
                  <textarea
                    id="agent-failure-modes"
                    value={draft.failure_modes_to_watch}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        failure_modes_to_watch: event.target.value,
                      }))
                    }
                    placeholder={"每行一個失敗模式，例如：\n把弱訊號誤當成已驗證事實"}
                  />
                </div>

                <div className="field">
                  <label htmlFor="agent-trace">Trace 要求</label>
                  <textarea
                    id="agent-trace"
                    value={draft.trace_requirements}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, trace_requirements: event.target.value }))
                    }
                    placeholder={"每行一個要求，例如：\n要保留推理依據與 handoff 線索"}
                  />
                </div>

                <div className="button-row">
                  <button className="button-primary" type="button" onClick={handleSave}>
                    儲存代理
                  </button>
                </div>
                {saveMessage ? (
                  <p className="success-text" role="status" aria-live="polite">
                    {saveMessage}
                  </p>
                ) : null}
              </div>
            </section>
          </div>
        </div>
      ) : null}
    </main>
  );
}
