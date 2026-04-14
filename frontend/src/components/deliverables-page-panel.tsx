"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { buildTaskListWorkspaceSummary } from "@/lib/advisory-workflow";
import { listTasks } from "@/lib/api";
import { truncateText } from "@/lib/text-format";
import type { TaskListItem } from "@/lib/types";
import {
  formatDisplayDate,
  labelForDeliverableClass,
  labelForDeliverableStatus,
} from "@/lib/ui-labels";
import {
  type DeliverableLifecycleStatus,
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
      setError(loadError instanceof Error ? loadError.message : "載入結果與報告列表失敗。");
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
          const summary = buildTaskListWorkspaceSummary(task);

          return {
            id: task.latest_deliverable_id || task.id,
            taskId: task.id,
            title: task.latest_deliverable_title || task.title,
            deliverableClass: task.deliverable_class_hint,
            matterTitle: task.matter_workspace?.title || task.engagement_name || "未掛案件",
            matterId: task.matter_workspace?.id ?? null,
            status:
              (task.latest_deliverable_status as DeliverableLifecycleStatus | null) ||
              defaultDeliverableStatus(task),
            versionTag: task.latest_deliverable_version_tag || `v${Math.max(task.deliverable_count, 1)}`,
            updatedAt: task.updated_at,
            decisionContext: task.decision_context_title || "目前未標示決策問題",
            summary: task.latest_deliverable_summary || summary.workspaceState,
          };
        }),
    [tasks],
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
  const focusDeliverable = filteredDeliverables[0] ?? allDeliverables[0] ?? null;

  return (
    <main className="page-shell deliverables-page-shell">
      <section className="hero-card deliverables-hero">
        <div className="hero-layout">
          <div className="hero-main">
            <span className="eyebrow">結果與報告</span>
            <h1 className="page-title">結果與報告</h1>
            <p className="page-subtitle">
              從這裡找到要回看、修改或準備交付的結果。
            </p>
            <div className="hero-actions">
              {focusDeliverable ? (
                <Link className="button-primary" href={`/deliverables/${focusDeliverable.id}`}>
                  打開最新結果與報告
                </Link>
              ) : (
                <Link className="button-primary" href="/matters">
                  先回案件主控台
                </Link>
              )}
              {focusDeliverable ? (
                <Link className="button-secondary" href="/matters">
                  看案件主控台
                </Link>
              ) : (
                <Link className="button-secondary" href="/new">
                  建立新案件
                </Link>
              )}
              {focusDeliverable?.matterId ? (
                <Link className="button-secondary" href={`/matters/${focusDeliverable.matterId}`}>
                  回所屬案件
                </Link>
              ) : null}
            </div>
          </div>

          <div className="hero-aside">
            <div className="hero-focus-card">
              <p className="hero-focus-label">現在最值得先看</p>
              <h3 className="hero-focus-title">
                {focusDeliverable?.title || "先完成第一份結果與報告"}
              </h3>
              <p className="hero-focus-copy">
                {truncateText(
                  focusDeliverable?.summary || "結果與報告建立後，這裡會集中整理版本、重點與所屬案件。",
                  108,
                )}
              </p>
            </div>
            <div className="hero-focus-card hero-focus-card-warm">
              <p className="hero-focus-label">這頁先做什麼</p>
              <ul className="hero-focus-list">
                <li>先找到最近更新或待確認的結果與報告。</li>
                <li>需要補前情脈絡時，再回到它所屬的案件頁。</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="hero-metrics-grid">
          <div className="section-card hero-metric-card">
            <h3>全部結果與報告</h3>
            <p className="workbench-metric">{allDeliverables.length}</p>
            <p className="muted-text">目前可直接回看的結果與報告。</p>
          </div>
          <div className="section-card hero-metric-card">
            <h3>待確認</h3>
            <p className="workbench-metric">{draftCount + pendingCount}</p>
            <p className="muted-text">還在整理，還沒正式定稿的結果與報告。</p>
          </div>
          <div className="section-card hero-metric-card">
            <h3>定稿</h3>
            <p className="workbench-metric">{finalCount}</p>
            <p className="muted-text">已定稿、可直接使用的版本。</p>
          </div>
        </div>
      </section>

      {loading ? (
        <p className="status-text" role="status" aria-live="polite">
          正在載入結果與報告...
        </p>
      ) : null}
      {error ? (
        <p className="error-text" role="alert" aria-live="assertive">
          {error}
        </p>
      ) : null}

      {!loading && !error ? (
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">結果與報告列表</h2>
              <p className="panel-copy">先找到要處理的結果與報告，再進結果與報告頁整理內容與版本。</p>
            </div>
          </div>

          <div className="toolbar-grid">
            <div className="field">
              <label htmlFor="deliverable-search">搜尋結果與報告</label>
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
                  <p className="muted-text">決策問題：{truncateText(item.decisionContext, 72)}</p>
                  <p className="content-block">{truncateText(item.summary, 92)}</p>
                  <div className="button-row" style={{ marginTop: "12px" }}>
                    <Link className="button-secondary" href={`/deliverables/${item.id}`}>
                      前往結果與報告
                    </Link>
                    {item.matterId ? (
                      <Link className="button-secondary" href={`/matters/${item.matterId}`}>
                        回案件頁
                      </Link>
                    ) : null}
                  </div>
                </article>
              ))
            ) : (
              <p className="empty-text">目前沒有符合條件的結果與報告。</p>
            )}
          </div>
        </section>
      ) : null}
    </main>
  );
}
