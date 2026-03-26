"use client";

import { useEffect, useMemo, useState } from "react";

import { getExtensionManager, listTasks } from "@/lib/api";
import {
  applyAgentFallbackState,
  buildAgentPersistenceFeedback,
  clearLocalAgentEntry,
  persistAgentCatalogEntry,
} from "@/lib/workbench-persistence";
import { truncateText } from "@/lib/text-format";
import type { AgentCatalogEntry, ExtensionManagerSnapshot, TaskListItem } from "@/lib/types";
import {
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
  version: string;
  status: string;
};

function buildUsageMap(tasks: TaskListItem[]) {
  const usage = new Map<string, { count: number; lastUsedAt: string; lastName: string }>();

  tasks.forEach((task) => {
    task.selected_agent_ids.forEach((agentId, index) => {
      const entry = usage.get(agentId) ?? {
        count: 0,
        lastUsedAt: task.updated_at,
        lastName: task.selected_agent_names[index] ?? agentId,
      };
      entry.count += 1;
      if (new Date(task.updated_at).getTime() > new Date(entry.lastUsedAt).getTime()) {
        entry.lastUsedAt = task.updated_at;
      }
      entry.lastName = task.selected_agent_names[index] ?? entry.lastName;
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

function buildDraft(agent?: AgentCatalogEntry): AgentDraft {
  return {
    agent_name: agent?.agent_name ?? "",
    agent_type: agent?.agent_type ?? "specialist",
    description: agent?.description ?? "",
    supported_capabilities: agent?.supported_capabilities.join("\n") ?? "",
    version: agent?.version ?? "1.0.0",
    status: agent?.status ?? "active",
  };
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

      return [agent.agent_name, agent.description, ...agent.supported_capabilities]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [managedAgents, searchQuery, statusFilter, typeFilter]);

  const hostCount = managedAgents.filter((agent) => agent.agent_type === "host").length;
  const activeCount = managedAgents.filter((agent) => agent.status === "active").length;
  const editingAgent =
    editingAgentId ? managedAgents.find((agent) => agent.agent_id === editingAgentId) ?? null : null;
  const editingSystemHost = editingAgent?.agent_type === "host" && editingAgent.source === "system";

  function startCreate() {
    setEditingAgentId(null);
    setDraft(buildDraft({ agent_type: "specialist" } as AgentCatalogEntry));
    setSaveMessage(null);
  }

  function startEdit(agent: AgentCatalogEntry) {
    setEditingAgentId(agent.agent_id);
    setDraft(buildDraft(agent));
    setSaveMessage(null);
  }

  async function handleSave() {
    const payload: AgentCatalogEntry = {
      agent_id: editingAgentId ?? createLocalId("local-agent"),
      agent_name: draft.agent_name.trim(),
      agent_type: draft.agent_type,
      description: draft.description.trim(),
      supported_capabilities: splitLines(draft.supported_capabilities),
      relevant_domain_packs: [],
      relevant_industry_packs: [],
      version: draft.version.trim() || "1.0.0",
      status: draft.status,
    };

    if (!payload.agent_name) {
      setSaveMessage("請先填寫代理名稱。");
      return;
    }

    if (!editingAgentId && payload.agent_type === "host") {
      setSaveMessage("Host 代理維持系統協調中心，本輪不新增第二個 Host。");
      return;
    }

    const isSystemAgent = snapshot?.agent_registry.agents.some(
      (agent) => agent.agent_id === payload.agent_id,
    ) ?? false;
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
      setSaveMessage("Host 代理維持正式協調中心，本輪不提供停用。");
      return;
    }

    const nextStatus = agent.status === "active" ? "inactive" : "active";
    const nextPayload = {
      ...agent,
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
        <p className="page-subtitle">管理代理狀態、版本、適用工作類型與最近使用情況。</p>
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
            <h3>Host</h3>
            <p className="workbench-metric">{hostCount}</p>
            <p className="muted-text">仍由 Host 代理維持正式協調中心。</p>
          </div>
        </div>
      </section>

      {loading ? <p className="status-text">正在載入代理管理頁...</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      {!loading && !error ? (
        <div className="detail-grid">
          <div className="detail-stack">
            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2 className="panel-title">代理列表</h2>
                  <p className="panel-copy">先找出當前可用代理，再決定要新增、編輯或停用哪一個。</p>
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
                    placeholder="搜尋名稱、描述或適用工作類型"
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
                    <option value="host">Host</option>
                    <option value="general">一般代理</option>
                  </select>
                </div>
              </div>

              <div className="history-list" style={{ marginTop: "18px" }}>
                {filteredAgents.length > 0 ? (
                  filteredAgents.map((agent) => (
                    <article className="history-item management-card" key={agent.agent_id}>
                      <div className="meta-row">
                        <span className="pill">{labelForAgentType(agent.agent_type)}</span>
                        <span>{labelForExtensionStatus(agent.status)}</span>
                        <span>v{agent.version}</span>
                        <span>{agent.source === "local" ? "自訂代理" : "系統代理"}</span>
                      </div>
                      <h3>{agent.agent_name}</h3>
                      <p className="content-block">{truncateText(agent.description, 98)}</p>
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
                            ? "Host 固定啟用"
                            : agent.status === "active"
                              ? "停用"
                              : "啟用"}
                        </button>
                      </div>
                    </article>
                  ))
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
                  <p className="panel-copy">版本、狀態與常改欄位會優先寫入正式 persistence；只有後端暫時不可用時才退回本機 fallback。</p>
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
                    {editingSystemHost ? <option value="host">Host 代理</option> : null}
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
                    placeholder={"每行一個 capability，例如：\ndiagnose_assess\nreview_challenge"}
                  />
                </div>

                <div className="button-row">
                  <button className="button-primary" type="button" onClick={handleSave}>
                    儲存代理
                  </button>
                </div>
                {saveMessage ? <p className="success-text">{saveMessage}</p> : null}
                {editingSystemHost ? (
                  <p className="muted-text">Host 代理維持唯一正式協調中心，本輪只允許更新說明與版本，不允許停用或改型別。</p>
                ) : null}
              </div>
            </section>
          </div>
        </div>
      ) : null}
    </main>
  );
}
