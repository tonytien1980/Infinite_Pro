"use client";

import { useEffect, useMemo, useState } from "react";

import { getExtensionManager, listTasks } from "@/lib/api";
import type { ExtensionManagerSnapshot, TaskListItem } from "@/lib/types";
import {
  labelForAgentType,
  labelForExtensionStatus,
} from "@/lib/ui-labels";

function summarizeUsage(tasks: TaskListItem[]) {
  const usage = new Map<string, { name: string; count: number }>();

  tasks.forEach((task) => {
    task.selected_agent_ids.forEach((agentId, index) => {
      const name = task.selected_agent_names[index] ?? agentId;
      const entry = usage.get(agentId) ?? { name, count: 0 };
      entry.count += 1;
      usage.set(agentId, entry);
    });
  });

  return Array.from(usage.entries())
    .map(([agentId, value]) => ({ agentId, ...value }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
}

export function AgentManagementPanel() {
  const [snapshot, setSnapshot] = useState<ExtensionManagerSnapshot | null>(null);
  const [tasks, setTasks] = useState<TaskListItem[]>([]);
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

  const agents = snapshot?.agent_registry.agents ?? [];
  const activeCount = snapshot?.agent_registry.active_agent_ids.length ?? 0;
  const usage = useMemo(() => summarizeUsage(tasks), [tasks]);

  return (
    <main className="page-shell">
      <section className="hero-card">
        <span className="eyebrow">代理管理</span>
        <h1 className="page-title">代理管理是正式工作面，不是附屬小功能。</h1>
        <p className="page-subtitle">
          這裡集中查看目前可用代理、版本、狀態與基本職責。單人版先承接可視化與理解，不做多人治理或代理市集。
        </p>
        <div className="workbench-overview-grid" style={{ marginTop: "20px" }}>
          <div className="section-card">
            <h3>可用代理</h3>
            <p className="workbench-metric">{agents.length}</p>
            <p className="muted-text">已進入 registry 的正式代理數量。</p>
          </div>
          <div className="section-card">
            <h3>啟用中</h3>
            <p className="workbench-metric">{activeCount}</p>
            <p className="muted-text">目前狀態為可用的代理。</p>
          </div>
          <div className="section-card">
            <h3>Host 代理</h3>
            <p className="workbench-metric">1</p>
            <p className="muted-text">Host 仍是唯一正式協調中心。</p>
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
                  <p className="panel-copy">這裡以正式管理面查看代理類型、版本、狀態與職責，避免它們只藏在任務資料層裡。</p>
                </div>
              </div>
              <div className="detail-list">
                {agents.map((agent) => (
                  <div className="detail-item" key={agent.agent_id}>
                    <div className="meta-row">
                      <span className="pill">{labelForAgentType(agent.agent_type)}</span>
                      <span>{labelForExtensionStatus(agent.status)}</span>
                      <span>v{agent.version}</span>
                    </div>
                    <h3>{agent.agent_name}</h3>
                    <p className="content-block">{agent.description}</p>
                    <p className="muted-text">
                      可支援工作類型：
                      {agent.supported_capabilities.length > 0
                        ? agent.supported_capabilities.join("、")
                        : "目前未標示"}
                    </p>
                    <p className="muted-text">
                      相關模組包：
                      {[...agent.relevant_domain_packs, ...agent.relevant_industry_packs].length > 0
                        ? [...agent.relevant_domain_packs, ...agent.relevant_industry_packs].join("、")
                        : "目前未標示"}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="detail-stack">
            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2 className="panel-title">最近常用代理</h2>
                  <p className="panel-copy">依目前案件工作紀錄回看最近較常被 Host 選入的代理。</p>
                </div>
              </div>
              <div className="detail-list">
                {usage.length > 0 ? (
                  usage.map((item) => (
                    <div className="detail-item" key={item.agentId}>
                      <div className="meta-row">
                        <span className="pill">近期使用</span>
                        <span>{item.count} 次</span>
                      </div>
                      <h3>{item.name}</h3>
                      <p className="muted-text">{item.agentId}</p>
                    </div>
                  ))
                ) : (
                  <p className="empty-text">目前還沒有足夠的使用紀錄可回看。</p>
                )}
              </div>
            </section>

            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2 className="panel-title">管理面邊界</h2>
                  <p className="panel-copy">單人版先處理理解、回看與可視狀態，不提前擴成代理市集或多人治理後台。</p>
                </div>
              </div>
              <div className="detail-item">
                <ul className="list-content">
                  <li>這裡是正式工作台內的管理面，不是第七層架構。</li>
                  <li>任務層覆寫仍留在各工作紀錄的擴充管理面處理。</li>
                  <li>多人權限、核准與發布流程屬於後續系統層。</li>
                </ul>
              </div>
            </section>
          </div>
        </div>
      ) : null}
    </main>
  );
}
