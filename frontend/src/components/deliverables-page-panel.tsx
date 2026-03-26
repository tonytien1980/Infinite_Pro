"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { buildTaskListWorkspaceSummary } from "@/lib/advisory-workflow";
import { listTasks } from "@/lib/api";
import type { TaskListItem } from "@/lib/types";
import {
  formatDisplayDate,
  labelForDeliverableClass,
  labelForDeliverableStatus,
} from "@/lib/ui-labels";
import {
  type DeliverableLifecycleStatus,
  useDeliverableWorkspaceRecords,
  useWorkbenchSettings,
} from "@/lib/workbench-store";

type DeliverableCardView = {
  id: string;
  taskId: string;
  title: string;
  deliverableClass: string;
  matterTitle: string;
  matterId: string | null;
  status: DeliverableLifecycleStatus;
  versionTag: string;
  updatedAt: string;
  decisionContext: string;
  summary: string;
};

function defaultDeliverableStatus(task: TaskListItem): DeliverableLifecycleStatus {
  if (task.status === "completed") {
    return "final";
  }
  if (task.status === "draft") {
    return "draft";
  }
  return "pending_confirmation";
}

function sortDeliverables(
  items: DeliverableCardView[],
  sortOrder: "updated_desc" | "title_asc" | "version_desc",
) {
  if (sortOrder === "title_asc") {
    return [...items].sort((a, b) => a.title.localeCompare(b.title, "zh-Hant"));
  }

  if (sortOrder === "version_desc") {
    return [...items].sort((a, b) => b.versionTag.localeCompare(a.versionTag, "zh-Hant"));
  }

  return [...items].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export function DeliverablesPagePanel() {
  const [tasks, setTasks] = useState<TaskListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | DeliverableLifecycleStatus>("all");
  const [settings] = useWorkbenchSettings();
  const [deliverableRecords] = useDeliverableWorkspaceRecords();
  const [sortOrder, setSortOrder] = useState(settings.deliverableSortPreference);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSortOrder(settings.deliverableSortPreference);
  }, [settings.deliverableSortPreference]);

  async function refresh() {
    try {
      setLoading(true);
      setError(null);
      setTasks(await listTasks());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "載入交付物列表失敗。");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  const allDeliverables = useMemo<DeliverableCardView[]>(
    () =>
      tasks
        .filter((task) => Boolean(task.latest_deliverable_id))
        .map((task) => {
          const record = task.latest_deliverable_id
            ? deliverableRecords[task.latest_deliverable_id]
            : undefined;
          const summary = buildTaskListWorkspaceSummary(task);

          return {
            id: task.latest_deliverable_id || task.id,
            taskId: task.id,
            title: record?.title || task.latest_deliverable_title || task.title,
            deliverableClass: task.deliverable_class_hint,
            matterTitle: task.matter_workspace?.title || task.engagement_name || "未掛案件",
            matterId: task.matter_workspace?.id ?? null,
            status: record?.status || defaultDeliverableStatus(task),
            versionTag: record?.versionTag || `v${Math.max(task.deliverable_count, 1)}`,
            updatedAt: task.updated_at,
            decisionContext: task.decision_context_title || "目前未標示決策問題",
            summary: summary.workspaceState,
          };
        }),
    [deliverableRecords, tasks],
  );

  const filteredDeliverables = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const filtered = allDeliverables.filter((item) => {
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      if (!matchesStatus) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [item.title, item.matterTitle, item.decisionContext, item.summary]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });

    return sortDeliverables(filtered, sortOrder);
  }, [allDeliverables, searchQuery, sortOrder, statusFilter]);

  const draftCount = allDeliverables.filter((item) => item.status === "draft").length;
  const pendingCount = allDeliverables.filter(
    (item) => item.status === "pending_confirmation",
  ).length;
  const finalCount = allDeliverables.filter((item) => item.status === "final").length;

  return (
    <main className="page-shell">
      <section className="hero-card">
        <span className="eyebrow">交付物</span>
        <h1 className="page-title">交付物</h1>
        <p className="page-subtitle">集中管理交付物狀態、版本與所屬案件，並從這裡進到正式工作面。</p>
        <div className="workbench-overview-grid" style={{ marginTop: "20px" }}>
          <div className="section-card">
            <h3>全部交付物</h3>
            <p className="workbench-metric">{allDeliverables.length}</p>
            <p className="muted-text">目前可回看的正式交付成果。</p>
          </div>
          <div className="section-card">
            <h3>待確認</h3>
            <p className="workbench-metric">{draftCount + pendingCount}</p>
            <p className="muted-text">仍在編修或等待確認的交付物。</p>
          </div>
          <div className="section-card">
            <h3>定稿</h3>
            <p className="workbench-metric">{finalCount}</p>
            <p className="muted-text">已定稿、可持續回看的版本。</p>
          </div>
        </div>
      </section>

      {loading ? <p className="status-text">正在載入交付物頁...</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      {!loading && !error ? (
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">交付物列表</h2>
              <p className="panel-copy">先找到要續修或回看的交付物，再進到 detail workspace 處理摘要、風險、行動與版本。</p>
            </div>
          </div>

          <div className="toolbar-grid">
            <div className="field">
              <label htmlFor="deliverable-search">搜尋交付物</label>
              <input
                id="deliverable-search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="搜尋標題、案件或決策問題"
              />
            </div>

            <div className="field">
              <label htmlFor="deliverable-status-filter">狀態篩選</label>
              <select
                id="deliverable-status-filter"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as "all" | DeliverableLifecycleStatus)
                }
              >
                <option value="all">全部狀態</option>
                <option value="draft">草稿</option>
                <option value="pending_confirmation">待確認</option>
                <option value="final">定稿</option>
                <option value="archived">封存</option>
              </select>
            </div>

            <div className="field">
              <label htmlFor="deliverable-sort">排序方式</label>
              <select
                id="deliverable-sort"
                value={sortOrder}
                onChange={(event) =>
                  setSortOrder(
                    event.target.value as "updated_desc" | "title_asc" | "version_desc",
                  )
                }
              >
                <option value="updated_desc">最近更新優先</option>
                <option value="version_desc">版本較新優先</option>
                <option value="title_asc">標題排序</option>
              </select>
            </div>
          </div>

          <div className="history-list" style={{ marginTop: "18px" }}>
            {filteredDeliverables.length > 0 ? (
              filteredDeliverables.map((item) => (
                <article className="history-item management-card" key={item.id}>
                  <div className="meta-row">
                    <span className="pill">{labelForDeliverableClass(item.deliverableClass)}</span>
                    <span>{labelForDeliverableStatus(item.status)}</span>
                    <span>{item.versionTag}</span>
                    <span>{formatDisplayDate(item.updatedAt)}</span>
                  </div>
                  <h3>{item.title}</h3>
                  <p className="workspace-object-path">所屬案件：{item.matterTitle}</p>
                  <p className="muted-text">決策問題：{item.decisionContext}</p>
                  <p className="content-block">{item.summary}</p>
                  <div className="button-row" style={{ marginTop: "12px" }}>
                    <Link className="button-secondary" href={`/deliverables/${item.id}`}>
                      打開交付物工作面
                    </Link>
                    {item.matterId ? (
                      <Link className="button-secondary" href={`/matters/${item.matterId}`}>
                        返回案件工作面
                      </Link>
                    ) : null}
                  </div>
                </article>
              ))
            ) : (
              <p className="empty-text">目前沒有符合條件的交付物。</p>
            )}
          </div>
        </section>
      ) : null}
    </main>
  );
}
