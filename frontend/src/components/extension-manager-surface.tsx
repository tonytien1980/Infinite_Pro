"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import type {
  AgentCatalogEntry,
  ExtensionManagerSnapshot,
  TaskAggregate,
  TaskExtensionOverridePayload,
} from "@/lib/types";
import {
  labelForAgentId,
  labelForAgentType,
  labelForExtensionStatus,
  labelForPackType,
} from "@/lib/ui-labels";

function parseOverrideInput(value: string) {
  return Array.from(
    new Set(
      value
        .split(/[\n,，]+/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

function summarizeList(items: string[], limit = 3) {
  if (items.length === 0) {
    return "目前沒有額外摘要。";
  }
  if (items.length <= limit) {
    return items.join("、");
  }
  return `${items.slice(0, limit).join("、")} 等 ${items.length} 項`;
}

function findAgentName(agents: AgentCatalogEntry[], agentId: string) {
  return agents.find((item) => item.agent_id === agentId)?.agent_name ?? labelForAgentId(agentId);
}

interface ExtensionManagerSurfaceProps {
  snapshot: ExtensionManagerSnapshot | null;
  loading?: boolean;
  error?: string | null;
  task?: TaskAggregate | null;
  saving?: boolean;
  onSaveOverrides?: (payload: TaskExtensionOverridePayload) => Promise<void> | void;
}

export function ExtensionManagerSurface({
  snapshot,
  loading = false,
  error = null,
  task = null,
  saving = false,
  onSaveOverrides,
}: ExtensionManagerSurfaceProps) {
  const [packOverrideInput, setPackOverrideInput] = useState("");
  const [agentOverrideInput, setAgentOverrideInput] = useState("");

  useEffect(() => {
    if (!task) {
      setPackOverrideInput("");
      setAgentOverrideInput("");
      return;
    }
    setPackOverrideInput(task.pack_resolution.override_pack_ids.join("\n"));
    setAgentOverrideInput(task.agent_selection.override_agent_ids.join("\n"));
  }, [task]);

  const domainPacks = useMemo(
    () => snapshot?.pack_registry.packs.filter((item) => item.pack_type === "domain") ?? [],
    [snapshot],
  );
  const industryPacks = useMemo(
    () => snapshot?.pack_registry.packs.filter((item) => item.pack_type === "industry") ?? [],
    [snapshot],
  );
  const agents = snapshot?.agent_registry.agents ?? [];

  const selectedDomainPackNames = task?.pack_resolution.selected_domain_packs.map((item) => item.pack_name) ?? [];
  const selectedIndustryPackNames =
    task?.pack_resolution.selected_industry_packs.map((item) => item.pack_name) ?? [];
  const selectedAgentNames = task?.agent_selection.selected_agent_names ?? [];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!onSaveOverrides) {
      return;
    }
    await onSaveOverrides({
      pack_override_ids: parseOverrideInput(packOverrideInput),
      agent_override_ids: parseOverrideInput(agentOverrideInput),
    });
  }

  async function handleClear() {
    if (!onSaveOverrides) {
      return;
    }
    setPackOverrideInput("");
    setAgentOverrideInput("");
    await onSaveOverrides({
      pack_override_ids: [],
      agent_override_ids: [],
    });
  }

  return (
    <div className="section-list">
      {loading ? <p className="status-text">正在載入擴充管理面…</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      {snapshot ? (
        <div className="summary-grid">
          <div className="section-card">
            <h4>可用問題面向模組包</h4>
            <p className="content-block">
              {domainPacks.length} 項
              {"\n"}
              已啟用：
              {snapshot.pack_registry.active_pack_ids.filter((id) =>
                domainPacks.some((pack) => pack.pack_id === id),
              ).length}
            </p>
          </div>
          <div className="section-card">
            <h4>可用產業模組包</h4>
            <p className="content-block">
              {industryPacks.length} 項
              {"\n"}
              已啟用：
              {snapshot.pack_registry.active_pack_ids.filter((id) =>
                industryPacks.some((pack) => pack.pack_id === id),
              ).length}
            </p>
          </div>
          <div className="section-card">
            <h4>可用代理</h4>
            <p className="content-block">
              {agents.length} 項
              {"\n"}
              Host 代理：{findAgentName(agents, snapshot.agent_registry.host_agent_id)}
            </p>
          </div>
          {task ? (
            <div className="section-card">
              <h4>本次任務使用中的擴充</h4>
              <p className="content-block">
                模組包：{selectedDomainPackNames.length + selectedIndustryPackNames.length}
                {"\n"}
                代理：{selectedAgentNames.length}
              </p>
            </div>
          ) : null}
        </div>
      ) : null}

      {task ? (
        <div className="detail-list">
          <div className="detail-item">
            <h3>本次選用的模組包</h3>
            <p className="muted-text">
              問題面向：{selectedDomainPackNames.length > 0 ? selectedDomainPackNames.join("、") : "未選用"}
            </p>
            <p className="muted-text">
              產業：{selectedIndustryPackNames.length > 0 ? selectedIndustryPackNames.join("、") : "未選用"}
            </p>
            {task.pack_resolution.resolver_notes.length > 0 ? (
              <p className="muted-text">解析註記：{summarizeList(task.pack_resolution.resolver_notes, 2)}</p>
            ) : null}
          </div>

          <div className="detail-item">
            <h3>本次選用的代理</h3>
            <p className="muted-text">
              Host：{task.agent_selection.host_agent?.agent_name ?? "Host 代理"}
            </p>
            <p className="muted-text">
              代理：{selectedAgentNames.length > 0 ? selectedAgentNames.join("、") : "目前僅由 Host 最小介入"}
            </p>
            {task.agent_selection.rationale.length > 0 ? (
              <p className="muted-text">選用理由：{summarizeList(task.agent_selection.rationale, 2)}</p>
            ) : null}
            {task.agent_selection.omitted_agent_notes.length > 0 ? (
              <p className="muted-text">
                省略代理：{summarizeList(task.agent_selection.omitted_agent_notes, 1)}
              </p>
            ) : null}
          </div>

          <div className="detail-item">
            <h3>目前覆寫狀態</h3>
            <p className="muted-text">
              模組包覆寫：{task.pack_resolution.override_pack_ids.length > 0 ? task.pack_resolution.override_pack_ids.join("、") : "未設定"}
            </p>
            <p className="muted-text">
              代理覆寫：{task.agent_selection.override_agent_ids.length > 0 ? task.agent_selection.override_agent_ids.join("、") : "未設定"}
            </p>
            {(task.pack_resolution.deliverable_presets.length > 0 ||
              task.pack_resolution.evidence_expectations.length > 0) ? (
              <p className="muted-text">
                交付 / 證據提示：
                {summarizeList(
                  [
                    ...task.pack_resolution.deliverable_presets,
                    ...task.pack_resolution.evidence_expectations,
                  ],
                  3,
                )}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {task && onSaveOverrides ? (
        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="field-grid">
            <div className="field">
              <label htmlFor={`pack-overrides-${task.id}`}>本次任務模組包覆寫</label>
              <textarea
                id={`pack-overrides-${task.id}`}
                value={packOverrideInput}
                onChange={(event) => setPackOverrideInput(event.target.value)}
                placeholder="例如：operations_pack&#10;ecommerce_pack"
              />
              <small>一行一個，或用逗號分隔。會寫入本次任務的覆寫約束。</small>
            </div>
            <div className="field">
              <label htmlFor={`agent-overrides-${task.id}`}>本次任務代理覆寫</label>
              <textarea
                id={`agent-overrides-${task.id}`}
                value={agentOverrideInput}
                onChange={(event) => setAgentOverrideInput(event.target.value)}
                placeholder="例如：strategy_decision_agent&#10;research_intelligence_agent"
              />
              <small>用來指定這輪任務的代理提示；不是全域市集控制。</small>
            </div>
          </div>
          <div className="meta-row">
            <button className="button-primary" type="submit" disabled={saving}>
              {saving ? "儲存中..." : "套用本次覆寫"}
            </button>
            <button className="button-secondary" type="button" disabled={saving} onClick={() => void handleClear()}>
              清除覆寫
            </button>
          </div>
        </form>
      ) : null}

      {snapshot ? (
        <div className="detail-list">
          <details className="inline-disclosure">
            <summary className="inline-disclosure-summary">
              查看可用問題面向模組包（{domainPacks.length}）
            </summary>
            <div className="detail-list" style={{ marginTop: "12px" }}>
              {domainPacks.map((pack) => (
                <div className="detail-item" key={pack.pack_id}>
                  <div className="meta-row">
                    <span className="pill">{labelForPackType(pack.pack_type)}</span>
                    <span>{labelForExtensionStatus(pack.status)}</span>
                    <span>v{pack.version}</span>
                  </div>
                  <h3>{pack.pack_name}</h3>
                  <p className="muted-text">{pack.description}</p>
                  <p className="muted-text">
                    問題型態：{summarizeList(pack.common_problem_patterns, 2)}
                  </p>
                  <p className="muted-text">
                    指標 / 訊號：{summarizeList(pack.key_kpis_or_operating_signals, 3)}
                  </p>
                </div>
              ))}
            </div>
          </details>

          <details className="inline-disclosure">
            <summary className="inline-disclosure-summary">
              查看可用產業模組包（{industryPacks.length}）
            </summary>
            <div className="detail-list" style={{ marginTop: "12px" }}>
              {industryPacks.map((pack) => (
                <div className="detail-item" key={pack.pack_id}>
                  <div className="meta-row">
                    <span className="pill">{labelForPackType(pack.pack_type)}</span>
                    <span>{labelForExtensionStatus(pack.status)}</span>
                    <span>v{pack.version}</span>
                  </div>
                  <h3>{pack.pack_name}</h3>
                  <p className="muted-text">{pack.description}</p>
                  <p className="muted-text">
                    商業模式：{summarizeList(pack.common_business_models, 3)}
                  </p>
                  <p className="muted-text">關鍵 KPI：{summarizeList(pack.key_kpis, 3)}</p>
                </div>
              ))}
            </div>
          </details>

          <details className="inline-disclosure">
            <summary className="inline-disclosure-summary">查看可用代理（{agents.length}）</summary>
            <div className="detail-list" style={{ marginTop: "12px" }}>
              {agents.map((agent) => (
                <div className="detail-item" key={agent.agent_id}>
                  <div className="meta-row">
                    <span className="pill">{labelForAgentType(agent.agent_type)}</span>
                    <span>{labelForExtensionStatus(agent.status)}</span>
                    <span>v{agent.version}</span>
                  </div>
                  <h3>{agent.agent_name}</h3>
                  <p className="muted-text">{agent.description}</p>
                  <p className="muted-text">
                    可支援工作類型：{summarizeList(agent.supported_capabilities, 3)}
                  </p>
                  <p className="muted-text">
                    相關模組包：
                    {summarizeList([
                      ...agent.relevant_domain_packs,
                      ...agent.relevant_industry_packs,
                    ], 4)}
                  </p>
                </div>
              ))}
            </div>
          </details>
        </div>
      ) : null}
    </div>
  );
}
