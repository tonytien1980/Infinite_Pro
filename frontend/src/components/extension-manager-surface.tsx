"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import type {
  AgentCatalogEntry,
  ExtensionManagerSnapshot,
  PackCatalogEntry,
  SelectedAgent,
  SelectedPack,
  TaskAggregate,
  TaskExtensionOverridePayload,
} from "@/lib/types";
import {
  getAgentCatalogDisplay,
  getPackCatalogDisplay,
  labelForAgentId,
  labelForAgentName,
  labelForAgentType,
  labelForExtensionStatus,
  labelForPackName,
  labelForPackType,
} from "@/lib/ui-labels";

type PackSurfaceLike = Pick<
  SelectedPack,
  | "pack_id"
  | "pack_type"
  | "pack_name"
  | "description"
  | "domain_definition"
  | "industry_definition"
  | "common_business_models"
  | "common_problem_patterns"
  | "key_kpis_or_operating_signals"
  | "key_kpis"
  | "evidence_expectations"
  | "common_risks"
  | "decision_patterns"
  | "deliverable_presets"
  | "routing_hints"
  | "pack_notes"
  | "scope_boundaries"
  | "pack_rationale"
  | "status"
  | "version"
> & {
  reason?: string;
  selection_score?: number;
  selection_signals?: string[];
};

type AgentSurfaceLike = Pick<
  SelectedAgent,
  | "agent_id"
  | "agent_name"
  | "agent_type"
  | "description"
  | "supported_capabilities"
  | "relevant_domain_packs"
  | "relevant_industry_packs"
  | "primary_responsibilities"
  | "out_of_scope"
  | "defer_rules"
  | "preferred_execution_modes"
  | "input_requirements"
  | "minimum_evidence_readiness"
  | "required_context_fields"
  | "output_contract"
  | "produced_objects"
  | "deliverable_impact"
  | "writeback_expectations"
  | "invocation_rules"
  | "escalation_rules"
  | "handoff_targets"
  | "evaluation_focus"
  | "failure_modes_to_watch"
  | "trace_requirements"
  | "status"
  | "version"
> & {
  reason?: string;
  selection_score?: number;
  selection_signals?: string[];
  runtime_binding?: string | null;
};

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
  const agentName = agents.find((item) => item.agent_id === agentId)?.agent_name;
  return agentName ? labelForAgentName(agentName) : labelForAgentId(agentId);
}

function getPackDefinition(pack: Pick<PackSurfaceLike, "pack_type" | "domain_definition" | "industry_definition" | "description">) {
  if (pack.pack_type === "domain") {
    return pack.domain_definition || pack.description;
  }
  return pack.industry_definition || pack.description;
}

function getPackSignalItems(
  pack: Pick<PackSurfaceLike, "key_kpis_or_operating_signals" | "key_kpis">,
) {
  return pack.key_kpis_or_operating_signals.length > 0
    ? pack.key_kpis_or_operating_signals
    : pack.key_kpis;
}

function buildSelectedAgentRuntimeRows(task: TaskAggregate) {
  return [
    ...(task.agent_selection.host_agent ? [task.agent_selection.host_agent] : []),
    ...task.agent_selection.selected_reasoning_agents,
    ...task.agent_selection.selected_specialist_agents,
  ]
    .filter((agent) => agent.runtime_binding)
    .map((agent) => ({
      agentName: labelForAgentName(agent.agent_name),
      runtimeName: labelForAgentId(agent.runtime_binding ?? ""),
      reason: agent.reason,
    }));
}

function PackContractBlock({
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

function PackContractCard({
  pack,
  reason,
}: {
  pack: PackSurfaceLike;
  reason?: string;
}) {
  const display = getPackCatalogDisplay(pack);
  const signalItems = getPackSignalItems(pack);
  const influenceSummary = [
    ...pack.evidence_expectations,
    ...pack.decision_patterns,
    ...pack.deliverable_presets,
  ];

  return (
    <div className="detail-item">
      <div className="meta-row">
        <span className="pill">{labelForPackType(pack.pack_type)}</span>
        <span>{labelForExtensionStatus(pack.status)}</span>
        <span>v{pack.version}</span>
      </div>
      <h3>{display.primaryName}</h3>
      <p className="content-block">{getPackDefinition(pack) || display.primaryDescription}</p>
      {reason ? <p className="muted-text">選用原因：{reason}</p> : null}
      {typeof pack.selection_score === "number" && pack.selection_score > 0 ? (
        <p className="muted-text">Host 選擇分數：{pack.selection_score}</p>
      ) : null}
      {pack.selection_signals && pack.selection_signals.length > 0 ? (
        <p className="muted-text">命中訊號：{summarizeList(pack.selection_signals, 2)}</p>
      ) : null}
      <p className="muted-text">
        證據 / 決策 / 交付影響：{summarizeList(influenceSummary, 4)}
      </p>
      <p className="muted-text">
        存在理由：{summarizeList(pack.pack_rationale, 2)}
      </p>
      <details className="inline-disclosure" style={{ marginTop: "10px" }}>
        <summary className="inline-disclosure-summary">查看完整 pack contract</summary>
        <div className="detail-list" style={{ marginTop: "12px" }}>
          {pack.pack_type === "industry" ? (
            <PackContractBlock
              title="常見商業模式"
              items={pack.common_business_models}
              emptyText="目前沒有標示商業模式。"
            />
          ) : (
            <PackContractBlock
              title="範圍邊界"
              items={pack.scope_boundaries}
              emptyText="目前沒有標示邊界。"
            />
          )}
          <PackContractBlock
            title="常見問題型態"
            items={pack.common_problem_patterns}
            emptyText="目前沒有整理常見問題型態。"
          />
          <PackContractBlock
            title={pack.pack_type === "domain" ? "關鍵指標／經營訊號" : "關鍵指標"}
            items={signalItems}
            emptyText="目前沒有整理關鍵指標或訊號。"
          />
          <PackContractBlock
            title="證據期待"
            items={pack.evidence_expectations}
            emptyText="目前沒有整理證據期待。"
          />
          <PackContractBlock
            title="常見風險"
            items={pack.common_risks}
            emptyText="目前沒有整理常見風險。"
          />
          <PackContractBlock
            title="決策模式"
            items={pack.decision_patterns}
            emptyText="目前沒有整理決策模式。"
          />
          <PackContractBlock
            title="交付預設"
            items={pack.deliverable_presets}
            emptyText="目前沒有整理交付預設。"
          />
          <PackContractBlock
            title="路由提示"
            items={pack.routing_hints}
            emptyText="目前沒有額外路由提示。"
          />
          <PackContractBlock
            title="備註"
            items={pack.pack_notes}
            emptyText="目前沒有額外備註。"
          />
        </div>
      </details>
    </div>
  );
}

function AgentContractCard({
  agent,
  reason,
}: {
  agent: AgentSurfaceLike;
  reason?: string;
}) {
  const display = getAgentCatalogDisplay(agent);
  const relatedPacks = [...agent.relevant_domain_packs, ...agent.relevant_industry_packs];

  return (
    <div className="detail-item">
      <div className="meta-row">
        <span className="pill">{labelForAgentType(agent.agent_type)}</span>
        <span>{labelForExtensionStatus(agent.status)}</span>
        <span>v{agent.version}</span>
      </div>
      <h3>{display.primaryName}</h3>
      <p className="content-block">{display.primaryDescription}</p>
      {reason ? <p className="muted-text">選用原因：{reason}</p> : null}
      {typeof agent.selection_score === "number" && agent.selection_score > 0 ? (
        <p className="muted-text">Host 選擇分數：{agent.selection_score}</p>
      ) : null}
      {agent.selection_signals && agent.selection_signals.length > 0 ? (
        <p className="muted-text">命中訊號：{summarizeList(agent.selection_signals, 2)}</p>
      ) : null}
      <p className="muted-text">
        執行綁定：{agent.runtime_binding ? labelForAgentId(agent.runtime_binding) : "目前沒有額外 runtime 綁定"}
      </p>
      <p className="muted-text">
        相關模組包：{summarizeList(relatedPacks, 4)}
      </p>
      <details className="inline-disclosure" style={{ marginTop: "10px" }}>
        <summary className="inline-disclosure-summary">查看完整 agent contract</summary>
        <div className="detail-list" style={{ marginTop: "12px" }}>
          <PackContractBlock
            title="主要責任"
            items={agent.primary_responsibilities}
            emptyText="目前沒有整理主要責任。"
          />
          <PackContractBlock
            title="非責任範圍"
            items={agent.out_of_scope}
            emptyText="目前沒有整理 out-of-scope。"
          />
          <PackContractBlock
            title="延後 / defer 規則"
            items={agent.defer_rules}
            emptyText="目前沒有整理 defer 規則。"
          />
          <PackContractBlock
            title="偏好執行模式"
            items={agent.preferred_execution_modes}
            emptyText="目前沒有標示偏好執行模式。"
          />
          <PackContractBlock
            title="輸入要求"
            items={agent.input_requirements}
            emptyText="目前沒有整理輸入要求。"
          />
          <PackContractBlock
            title="最小證據就緒條件"
            items={agent.minimum_evidence_readiness}
            emptyText="目前沒有整理最小證據就緒條件。"
          />
          <PackContractBlock
            title="必要 context 欄位"
            items={agent.required_context_fields}
            emptyText="目前沒有整理必要 context 欄位。"
          />
          <PackContractBlock
            title="輸出契約"
            items={agent.output_contract}
            emptyText="目前沒有整理輸出契約。"
          />
          <PackContractBlock
            title="產出物件"
            items={agent.produced_objects}
            emptyText="目前沒有整理產出物件。"
          />
          <PackContractBlock
            title="對交付物的影響"
            items={agent.deliverable_impact}
            emptyText="目前沒有整理 deliverable impact。"
          />
          <PackContractBlock
            title="寫回要求"
            items={agent.writeback_expectations}
            emptyText="目前沒有整理 writeback expectations。"
          />
          <PackContractBlock
            title="啟動規則"
            items={agent.invocation_rules}
            emptyText="目前沒有整理 invocation rules。"
          />
          <PackContractBlock
            title="升級 / escalation 規則"
            items={agent.escalation_rules}
            emptyText="目前沒有整理 escalation rules。"
          />
          <PackContractBlock
            title="交接對象"
            items={agent.handoff_targets}
            emptyText="目前沒有整理 handoff targets。"
          />
          <PackContractBlock
            title="評估焦點"
            items={agent.evaluation_focus}
            emptyText="目前沒有整理 evaluation focus。"
          />
          <PackContractBlock
            title="常見失敗模式"
            items={agent.failure_modes_to_watch}
            emptyText="目前沒有整理 failure modes。"
          />
          <PackContractBlock
            title="Trace 要求"
            items={agent.trace_requirements}
            emptyText="目前沒有整理 trace requirements。"
          />
        </div>
      </details>
    </div>
  );
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

  const selectedDomainPacks = task?.pack_resolution.selected_domain_packs ?? [];
  const selectedIndustryPacks = task?.pack_resolution.selected_industry_packs ?? [];
  const selectedDomainPackNames = selectedDomainPacks.map((item) => item.pack_name);
  const selectedIndustryPackNames = selectedIndustryPacks.map((item) => item.pack_name);
  const selectedAgentNames = (task?.agent_selection.selected_agent_names ?? []).map((item) =>
    labelForAgentName(item),
  );
  const selectedAgentRuntimeRows = task ? buildSelectedAgentRuntimeRows(task) : [];
  const runtimePathSummary =
    selectedAgentRuntimeRows.length > 0
      ? Array.from(new Set(selectedAgentRuntimeRows.map((item) => item.runtimeName)))
      : [];

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
              主控代理：{findAgentName(agents, snapshot.agent_registry.host_agent_id)}
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
              問題面向：
              {selectedDomainPackNames.length > 0
                ? selectedDomainPackNames.map((item) => labelForPackName(item)).join("、")
                : "未選用"}
            </p>
            <p className="muted-text">
              產業：
              {selectedIndustryPackNames.length > 0
                ? selectedIndustryPackNames.map((item) => labelForPackName(item)).join("、")
                : "未選用"}
            </p>
            {task.pack_resolution.resolver_notes.length > 0 ? (
              <p className="muted-text">
                解析註記：{summarizeList(task.pack_resolution.resolver_notes, 2)}
              </p>
            ) : null}
            {(selectedDomainPacks.length > 0 || selectedIndustryPacks.length > 0) ? (
              <details className="inline-disclosure" style={{ marginTop: "10px" }}>
                <summary className="inline-disclosure-summary">
                  查看 pack 如何影響這次任務
                </summary>
                <div className="detail-list" style={{ marginTop: "12px" }}>
                  {selectedDomainPacks.map((pack) => (
                    <PackContractCard
                      key={`selected-domain-${pack.pack_id}`}
                      pack={pack}
                      reason={pack.reason}
                    />
                  ))}
                  {selectedIndustryPacks.map((pack) => (
                    <PackContractCard
                      key={`selected-industry-${pack.pack_id}`}
                      pack={pack}
                      reason={pack.reason}
                    />
                  ))}
                </div>
              </details>
            ) : null}
          </div>

          <div className="detail-item">
            <h3>本次選用的代理</h3>
            <p className="muted-text">
              主控代理：
              {task.agent_selection.host_agent?.agent_name
                ? labelForAgentName(task.agent_selection.host_agent.agent_name)
                : "主控代理"}
            </p>
            <p className="muted-text">
              代理：
              {selectedAgentNames.length > 0
                ? selectedAgentNames.join("、")
                : "目前僅由主控代理最小介入"}
            </p>
            <p className="muted-text">
              執行路徑：
              {runtimePathSummary.length > 0
                ? runtimePathSummary.join("、")
                : "目前沒有額外的 runtime 綁定顯示"}
            </p>
            {task.agent_selection.rationale.length > 0 ? (
              <p className="muted-text">
                選用理由：{summarizeList(task.agent_selection.rationale, 2)}
              </p>
            ) : null}
            {task.agent_selection.omitted_agent_notes.length > 0 ? (
              <p className="muted-text">
                省略代理：{summarizeList(task.agent_selection.omitted_agent_notes, 1)}
              </p>
            ) : null}
            {selectedAgentRuntimeRows.length > 0 ? (
              <details className="inline-disclosure" style={{ marginTop: "10px" }}>
                <summary className="inline-disclosure-summary">查看代理與執行綁定</summary>
                <div className="detail-list" style={{ marginTop: "12px" }}>
                  {selectedAgentRuntimeRows.map((item) => (
                    <div className="detail-item" key={`${item.agentName}-${item.runtimeName}`}>
                      <h4>{item.agentName}</h4>
                      <p className="muted-text">執行綁定：{item.runtimeName}</p>
                      <p className="content-block">{item.reason}</p>
                    </div>
                  ))}
                </div>
              </details>
            ) : null}
            {task.agent_selection.host_agent ||
            task.agent_selection.selected_reasoning_agents.length > 0 ||
            task.agent_selection.selected_specialist_agents.length > 0 ? (
              <details className="inline-disclosure" style={{ marginTop: "10px" }}>
                <summary className="inline-disclosure-summary">查看代理責任與交接</summary>
                <div className="detail-list" style={{ marginTop: "12px" }}>
                  {task.agent_selection.host_agent ? (
                    <AgentContractCard
                      agent={task.agent_selection.host_agent}
                      reason={task.agent_selection.host_agent.reason}
                    />
                  ) : null}
                  {task.agent_selection.selected_reasoning_agents.map((agent) => (
                    <AgentContractCard
                      key={`selected-reasoning-${agent.agent_id}`}
                      agent={agent}
                      reason={agent.reason}
                    />
                  ))}
                  {task.agent_selection.selected_specialist_agents.map((agent) => (
                    <AgentContractCard
                      key={`selected-specialist-${agent.agent_id}`}
                      agent={agent}
                      reason={agent.reason}
                    />
                  ))}
                </div>
              </details>
            ) : null}
          </div>

          <div className="detail-item">
            <h3>目前覆寫狀態</h3>
            <p className="muted-text">
              模組包覆寫：
              {task.pack_resolution.override_pack_ids.length > 0
                ? task.pack_resolution.override_pack_ids.join("、")
                : "未設定"}
            </p>
            <p className="muted-text">
              代理覆寫：
              {task.agent_selection.override_agent_ids.length > 0
                ? task.agent_selection.override_agent_ids.join("、")
                : "未設定"}
            </p>
            {(task.pack_resolution.deliverable_presets.length > 0 ||
              task.pack_resolution.evidence_expectations.length > 0 ||
              task.pack_resolution.decision_patterns.length > 0) ? (
              <p className="muted-text">
                Pack 影響摘要：
                {summarizeList(
                  [
                    ...task.pack_resolution.evidence_expectations,
                    ...task.pack_resolution.decision_patterns,
                    ...task.pack_resolution.deliverable_presets,
                  ],
                  4,
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
            <button
              className="button-secondary"
              type="button"
              disabled={saving}
              onClick={() => void handleClear()}
            >
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
                <PackContractCard key={`catalog-domain-${pack.pack_id}`} pack={pack as PackCatalogEntry} />
              ))}
            </div>
          </details>

          <details className="inline-disclosure">
            <summary className="inline-disclosure-summary">
              查看可用產業模組包（{industryPacks.length}）
            </summary>
            <div className="detail-list" style={{ marginTop: "12px" }}>
              {industryPacks.map((pack) => (
                <PackContractCard key={`catalog-industry-${pack.pack_id}`} pack={pack as PackCatalogEntry} />
              ))}
            </div>
          </details>

          <details className="inline-disclosure">
            <summary className="inline-disclosure-summary">查看可用代理（{agents.length}）</summary>
            <div className="detail-list" style={{ marginTop: "12px" }}>
              {agents.map((agent) => (
                <AgentContractCard key={`catalog-agent-${agent.agent_id}`} agent={agent as AgentCatalogEntry} />
              ))}
            </div>
          </details>
        </div>
      ) : null}
    </div>
  );
}
