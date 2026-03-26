"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { buildTaskListWorkspaceSummary } from "@/lib/advisory-workflow";
import { listTasks } from "@/lib/api";
import { truncateText } from "@/lib/text-format";
import type { TaskListItem } from "@/lib/types";
import {
  formatDisplayDate,
  labelForTaskStatus,
  labelForTaskType,
} from "@/lib/ui-labels";
import {
  useHistoryManagerState,
  useWorkbenchSettings,
} from "@/lib/workbench-store";

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50];

export function HistoryPagePanel() {
  const [tasks, setTasks] = useState<TaskListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [matterFilter, setMatterFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [settings] = useWorkbenchSettings();
  const [historyState, setHistoryState] = useHistoryManagerState();
  const [pageSize, setPageSize] = useState(settings.historyDefaultPageSize);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPageSize(settings.historyDefaultPageSize);
  }, [settings.historyDefaultPageSize]);

  async function refresh() {
    try {
      setLoading(true);
      setError(null);
      setTasks(await listTasks());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "載入歷史紀錄失敗。");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  const visibleTasks = useMemo(
    () => tasks.filter((task) => !historyState.hiddenTaskIds.includes(task.id)),
    [historyState.hiddenTaskIds, tasks],
  );

  const matterOptions = useMemo(
    () =>
      Array.from(
        new Map(
          visibleTasks
            .filter((task) => task.matter_workspace?.id)
            .map((task) => [task.matter_workspace?.id ?? "", task.matter_workspace?.title ?? "未命名案件"]),
        ).entries(),
      ),
    [visibleTasks],
  );

  const filteredTasks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return [...visibleTasks]
      .filter((task) => {
        const matchesMatter =
          matterFilter === "all" || task.matter_workspace?.id === matterFilter;
        const matchesType = typeFilter === "all" || task.task_type === typeFilter;
        const updatedDate = new Date(task.updated_at);
        const matchesFrom = dateFrom ? updatedDate >= new Date(`${dateFrom}T00:00:00`) : true;
        const matchesTo = dateTo ? updatedDate <= new Date(`${dateTo}T23:59:59`) : true;

        if (!matchesMatter || !matchesType || !matchesFrom || !matchesTo) {
          return false;
        }

        if (!query) {
          return true;
        }

        return [
          task.title,
          task.description,
          task.matter_workspace?.title,
          task.client_name,
          task.engagement_name,
          task.workstream_name,
          task.latest_deliverable_title,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);
      })
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }, [dateFrom, dateTo, matterFilter, searchQuery, typeFilter, visibleTasks]);

  useEffect(() => {
    setPage(1);
  }, [dateFrom, dateTo, matterFilter, pageSize, searchQuery, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / pageSize));
  const pagedTasks = filteredTasks.slice((page - 1) * pageSize, page * pageSize);

  function toggleSelection(taskId: string) {
    setSelectedIds((current) =>
      current.includes(taskId)
        ? current.filter((id) => id !== taskId)
        : [...current, taskId],
    );
  }

  function hideTasks(taskIds: string[]) {
    if (taskIds.length === 0) {
      return;
    }

    setHistoryState((current) => ({
      ...current,
      hiddenTaskIds: Array.from(new Set([...current.hiddenTaskIds, ...taskIds])),
    }));
    setSelectedIds((current) => current.filter((id) => !taskIds.includes(id)));
  }

  function handleClearAll() {
    if (typeof window !== "undefined") {
      const confirmed = window.confirm(
        "這會把目前所有歷史紀錄先從前端工作台隱藏，確定要繼續嗎？",
      );

      if (!confirmed) {
        return;
      }
    }

    hideTasks(tasks.map((task) => task.id));
  }

  return (
    <main className="page-shell">
      <section className="hero-card">
        <span className="eyebrow">歷史紀錄</span>
        <h1 className="page-title">歷史紀錄</h1>
        <p className="page-subtitle">查找、整理並收納工作歷史，快速找回某段案件脈絡。</p>
        <div className="workbench-overview-grid" style={{ marginTop: "20px" }}>
          <div className="section-card">
            <h3>可回看紀錄</h3>
            <p className="workbench-metric">{visibleTasks.length}</p>
            <p className="muted-text">目前仍顯示在工作台中的歷史紀錄。</p>
          </div>
          <div className="section-card">
            <h3>已隱藏</h3>
            <p className="workbench-metric">{historyState.hiddenTaskIds.length}</p>
            <p className="muted-text">這一輪先以前端隱藏方式清理歷史。</p>
          </div>
          <div className="section-card">
            <h3>案件數</h3>
            <p className="workbench-metric">{matterOptions.length}</p>
            <p className="muted-text">可依案件回看歷史脈絡。</p>
          </div>
        </div>
      </section>

      {loading ? <p className="status-text">正在載入歷史紀錄...</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      {!loading && !error ? (
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">歷史整理工具</h2>
              <p className="panel-copy">先用搜尋與篩選縮小範圍，再決定要隱藏單筆、批次清理或打開原始工作紀錄。</p>
            </div>
          </div>

          <div className="toolbar-grid toolbar-grid-wide">
            <div className="field">
              <label htmlFor="history-search">搜尋</label>
              <input
                id="history-search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="搜尋任務、案件、交付物或描述"
              />
            </div>

            <div className="field">
              <label htmlFor="history-matter-filter">案件</label>
              <select
                id="history-matter-filter"
                value={matterFilter}
                onChange={(event) => setMatterFilter(event.target.value)}
              >
                <option value="all">全部案件</option>
                {matterOptions.map(([id, title]) => (
                  <option key={id} value={id}>
                    {title}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="history-type-filter">類型</label>
              <select
                id="history-type-filter"
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
              >
                <option value="all">全部類型</option>
                <option value="research_synthesis">研究綜整</option>
                <option value="contract_review">合約審閱</option>
                <option value="document_restructuring">文件重構</option>
                <option value="complex_convergence">複雜議題收斂</option>
              </select>
            </div>

            <div className="field">
              <label htmlFor="history-date-from">起始日期</label>
              <input
                id="history-date-from"
                type="date"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="history-date-to">結束日期</label>
              <input
                id="history-date-to"
                type="date"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="history-page-size">每頁筆數</label>
              <select
                id="history-page-size"
                value={pageSize}
                onChange={(event) => setPageSize(Number(event.target.value))}
              >
                {PAGE_SIZE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option} 筆
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="button-row" style={{ marginTop: "18px" }}>
            <button
              className="button-secondary"
              type="button"
              onClick={() => hideTasks(selectedIds)}
              disabled={selectedIds.length === 0}
            >
              隱藏已選項目
            </button>
            <button
              className="button-secondary"
              type="button"
              onClick={() => hideTasks(pagedTasks.map((task) => task.id))}
              disabled={pagedTasks.length === 0}
            >
              清理本頁
            </button>
            <button className="button-secondary" type="button" onClick={handleClearAll}>
              清空全部歷史入口
            </button>
          </div>

          <div className="meta-row" style={{ marginTop: "12px" }}>
            <span>目前顯示 {filteredTasks.length} 筆</span>
            <span>第 {page} / {totalPages} 頁</span>
          </div>

          <div className="history-list" style={{ marginTop: "18px" }}>
            {pagedTasks.length > 0 ? (
              pagedTasks.map((task) => {
                const summary = buildTaskListWorkspaceSummary(task);

                return (
                  <article className="history-item management-card" key={task.id}>
                    <label className="checkbox-row">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(task.id)}
                        onChange={() => toggleSelection(task.id)}
                      />
                      <span>選取這筆紀錄</span>
                    </label>
                    <div className="meta-row">
                      <span className="pill">{labelForTaskType(task.task_type)}</span>
                      <span>{labelForTaskStatus(task.status)}</span>
                      <span>{formatDisplayDate(task.updated_at)}</span>
                    </div>
                    <h3>{task.title}</h3>
                    <p className="workspace-object-path">{summary.objectPath}</p>
                    <p className="muted-text">案件：{task.matter_workspace?.title || "未掛案件"}</p>
                    <p className="muted-text">
                      決策問題：{truncateText(summary.decisionContext, 84)}
                    </p>
                    <p className="content-block">{truncateText(task.description, 118)}</p>
                    <div className="button-row" style={{ marginTop: "12px" }}>
                      <Link className="button-secondary" href={`/tasks/${task.id}`}>
                        打開工作紀錄
                      </Link>
                      {task.matter_workspace?.id ? (
                        <Link
                          className="button-secondary"
                          href={`/matters/${task.matter_workspace.id}`}
                        >
                          打開案件工作面
                        </Link>
                      ) : null}
                      <button
                        className="button-secondary"
                        type="button"
                        onClick={() => hideTasks([task.id])}
                      >
                        隱藏這筆
                      </button>
                    </div>
                  </article>
                );
              })
            ) : (
              <p className="empty-text">目前沒有符合條件的歷史紀錄。</p>
            )}
          </div>

          <div className="pagination-row">
            <button
              className="button-secondary"
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page <= 1}
            >
              上一頁
            </button>
            <button
              className="button-secondary"
              type="button"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={page >= totalPages}
            >
              下一頁
            </button>
          </div>
        </section>
      ) : null}
    </main>
  );
}
