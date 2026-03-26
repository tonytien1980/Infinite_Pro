"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { buildTaskListWorkspaceSummary } from "@/lib/advisory-workflow";
import { listMatterWorkspaces, listTasks } from "@/lib/api";
import type { MatterWorkspaceSummary, TaskListItem } from "@/lib/types";
import {
  formatDisplayDate,
  labelForDeliverableClass,
  labelForMatterStatus,
} from "@/lib/ui-labels";
import {
  type MatterLifecycleStatus,
  useMatterWorkspaceRecords,
} from "@/lib/workbench-store";

type MatterCardView = {
  id: string;
  title: string;
  objectPath: string;
  summary: string;
  decisionContext: string;
  status: MatterLifecycleStatus;
  updatedAt: string;
  sourceCount: number;
  evidenceCount: number;
  deliverableCount: number;
  activeTaskCount: number;
  totalTaskCount: number;
  agentSummary: string;
  packSummary: string;
};

function defaultMatterStatus(matter: MatterWorkspaceSummary): MatterLifecycleStatus {
  return matter.active_task_count > 0 ? "active" : "paused";
}

function buildMatterTaskMap(tasks: TaskListItem[]) {
  const metrics = new Map<
    string,
    {
      evidenceCount: number;
      agentNames: Set<string>;
      packNames: Set<string>;
    }
  >();

  tasks.forEach((task) => {
    const matterId = task.matter_workspace?.id;
    if (!matterId) {
      return;
    }

    const entry = metrics.get(matterId) ?? {
      evidenceCount: 0,
      agentNames: new Set<string>(),
      packNames: new Set<string>(),
    };

    entry.evidenceCount += task.evidence_count;
    task.selected_agent_names.forEach((name) => entry.agentNames.add(name));
    task.selected_pack_names.forEach((name) => entry.packNames.add(name));
    metrics.set(matterId, entry);
  });

  return metrics;
}

function joinSummary(items: string[], emptyLabel: string) {
  return items.length > 0 ? items.slice(0, 4).join("、") : emptyLabel;
}

export function MattersPagePanel() {
  const [matters, setMatters] = useState<MatterWorkspaceSummary[]>([]);
  const [tasks, setTasks] = useState<TaskListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | MatterLifecycleStatus>("all");
  const [matterRecords] = useMatterWorkspaceRecords();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      setLoading(true);
      setError(null);
      const [matterResponse, taskResponse] = await Promise.all([
        listMatterWorkspaces(),
        listTasks(),
      ]);
      setMatters(matterResponse);
      setTasks(taskResponse);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "載入案件工作台失敗。");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  const matterTaskMap = useMemo(() => buildMatterTaskMap(tasks), [tasks]);

  const allMatterCards = useMemo<MatterCardView[]>(
    () =>
      [...matters]
        .map((matter) => {
          const record = matterRecords[matter.id];
          const metrics = matterTaskMap.get(matter.id);

          return {
            id: matter.id,
            title: record?.title || matter.title,
            objectPath: matter.object_path,
            summary:
              record?.summary ||
              matter.active_work_summary ||
              matter.continuity_summary ||
              "目前尚未補上案件摘要。",
            decisionContext:
              matter.current_decision_context_title ||
              matter.current_decision_context_summary ||
              "目前尚未形成清楚的決策問題。",
            status: record?.status || defaultMatterStatus(matter),
            updatedAt: matter.latest_updated_at,
            sourceCount: matter.source_material_count,
            evidenceCount: metrics?.evidenceCount ?? 0,
            deliverableCount: matter.deliverable_count,
            activeTaskCount: matter.active_task_count,
            totalTaskCount: matter.total_task_count,
            agentSummary: joinSummary(
              [...(metrics?.agentNames ?? new Set<string>())],
              "尚未顯示代理",
            ),
            packSummary: joinSummary(
              [...(metrics?.packNames ?? new Set<string>())],
              "尚未顯示模組包",
            ),
          };
        })
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [matterRecords, matterTaskMap, matters],
  );

  const filteredMatters = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return allMatterCards.filter((matter) => {
      const matchesStatus = statusFilter === "all" || matter.status === statusFilter;
      if (!matchesStatus) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [
        matter.title,
        matter.objectPath,
        matter.summary,
        matter.decisionContext,
        matter.agentSummary,
        matter.packSummary,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [allMatterCards, searchQuery, statusFilter]);

  const activeMatters = allMatterCards.filter((matter) => matter.status === "active");
  const archivedMatters = allMatterCards.filter((matter) => matter.status === "archived");
  const recentDeliverables = [...tasks]
    .filter((task) => Boolean(task.latest_deliverable_id))
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 4);
  const recentTasks = [...tasks]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 4);

  return (
    <main className="page-shell">
      <section className="hero-card">
        <span className="eyebrow">案件工作台</span>
        <h1 className="page-title">案件工作台</h1>
        <p className="page-subtitle">管理案件基本資訊，並從這裡回到每個案件的正式工作面。</p>
        <div className="workbench-overview-grid" style={{ marginTop: "20px" }}>
          <div className="section-card">
            <h3>全部案件</h3>
            <p className="workbench-metric">{allMatterCards.length}</p>
            <p className="muted-text">目前已形成工作面的案件數量。</p>
          </div>
          <div className="section-card">
            <h3>進行中</h3>
            <p className="workbench-metric">{activeMatters.length}</p>
            <p className="muted-text">仍在持續推進的案件。</p>
          </div>
          <div className="section-card">
            <h3>封存</h3>
            <p className="workbench-metric">{archivedMatters.length}</p>
            <p className="muted-text">已收納但仍可回看的案件。</p>
          </div>
        </div>
      </section>

      {loading ? <p className="status-text">正在載入案件工作台...</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      {!loading && !error ? (
        <div className="detail-grid">
          <div className="detail-stack">
            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2 className="panel-title">案件列表</h2>
                  <p className="panel-copy">先找到要續推的案件，再進到 detail workspace 處理決策問題、來源與交付物。</p>
                </div>
                <Link className="button-primary" href="/new">
                  建立新案件
                </Link>
              </div>

              <div className="toolbar-grid">
                <div className="field">
                  <label htmlFor="matter-search">搜尋案件</label>
                  <input
                    id="matter-search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="搜尋案件名稱、決策問題、代理或模組包"
                  />
                </div>

                <div className="field">
                  <label htmlFor="matter-status-filter">狀態篩選</label>
                  <select
                    id="matter-status-filter"
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(event.target.value as "all" | MatterLifecycleStatus)
                    }
                  >
                    <option value="all">全部狀態</option>
                    <option value="active">進行中</option>
                    <option value="paused">暫停</option>
                    <option value="archived">封存</option>
                  </select>
                </div>
              </div>

              <div className="history-list" style={{ marginTop: "18px" }}>
                {filteredMatters.length > 0 ? (
                  filteredMatters.map((matter) => (
                    <article className="history-item management-card" key={matter.id}>
                      <div className="meta-row">
                        <span className="pill">{labelForMatterStatus(matter.status)}</span>
                        <span>{matter.activeTaskCount} 筆進行中工作</span>
                        <span>更新於 {formatDisplayDate(matter.updatedAt)}</span>
                      </div>
                      <h3>{matter.title}</h3>
                      <p className="workspace-object-path">{matter.objectPath}</p>
                      <p className="content-block">{matter.summary}</p>
                      <p className="muted-text">決策問題：{matter.decisionContext}</p>
                      <p className="muted-text">使用中的代理：{matter.agentSummary}</p>
                      <p className="muted-text">使用中的模組包：{matter.packSummary}</p>
                      <div className="meta-row">
                        <span>來源 {matter.sourceCount}</span>
                        <span>證據 {matter.evidenceCount}</span>
                        <span>交付物 {matter.deliverableCount}</span>
                        <span>工作紀錄 {matter.totalTaskCount}</span>
                      </div>
                      <div className="button-row" style={{ marginTop: "12px" }}>
                        <Link className="button-secondary" href={`/matters/${matter.id}`}>
                          打開案件工作面
                        </Link>
                      </div>
                    </article>
                  ))
                ) : (
                  <p className="empty-text">目前沒有符合條件的案件。</p>
                )}
              </div>
            </section>
          </div>

          <div className="detail-stack">
            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2 className="panel-title">最近交付物</h2>
                  <p className="panel-copy">從案件工作台直接回到相關交付物，不必先翻任務列表。</p>
                </div>
                <Link className="button-secondary" href="/deliverables">
                  查看全部交付物
                </Link>
              </div>

              <div className="detail-list">
                {recentDeliverables.length > 0 ? (
                  recentDeliverables.map((task) => {
                    const summary = buildTaskListWorkspaceSummary(task);

                    return (
                      <Link
                        className="detail-item"
                        href={
                          task.latest_deliverable_id
                            ? `/deliverables/${task.latest_deliverable_id}`
                            : `/tasks/${task.id}`
                        }
                        key={`${task.id}-${task.latest_deliverable_id ?? "deliverable"}`}
                      >
                        <div className="meta-row">
                          <span className="pill">{labelForDeliverableClass(task.deliverable_class_hint)}</span>
                          <span>{formatDisplayDate(task.updated_at)}</span>
                        </div>
                        <h3>{task.latest_deliverable_title || task.title}</h3>
                        <p className="workspace-object-path">{summary.objectPath}</p>
                        <p className="muted-text">{summary.decisionContext}</p>
                      </Link>
                    );
                  })
                ) : (
                  <p className="empty-text">目前還沒有正式交付物。</p>
                )}
              </div>
            </section>

            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2 className="panel-title">最近工作紀錄</h2>
                  <p className="panel-copy">需要追最近脈絡時，可以先從這裡回看，再決定是否進一步整理歷史紀錄。</p>
                </div>
                <Link className="button-secondary" href="/history">
                  查看歷史紀錄
                </Link>
              </div>

              <div className="detail-list">
                {recentTasks.length > 0 ? (
                  recentTasks.map((task) => {
                    const summary = buildTaskListWorkspaceSummary(task);

                    return (
                      <Link className="detail-item" href={`/tasks/${task.id}`} key={task.id}>
                        <div className="meta-row">
                          <span className="pill">工作紀錄</span>
                          <span>{formatDisplayDate(task.updated_at)}</span>
                        </div>
                        <h3>{task.title}</h3>
                        <p className="workspace-object-path">{summary.objectPath}</p>
                        <p className="muted-text">{summary.decisionContext}</p>
                      </Link>
                    );
                  })
                ) : (
                  <p className="empty-text">目前還沒有可回看的工作紀錄。</p>
                )}
              </div>
            </section>
          </div>
        </div>
      ) : null}
    </main>
  );
}
