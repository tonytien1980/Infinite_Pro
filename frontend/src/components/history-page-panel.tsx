"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { buildTaskListWorkspaceSummary } from "@/lib/advisory-workflow";
import { listTasks } from "@/lib/api";
import {
  applyHistoryFallbackState,
  buildHistoryVisibilityFeedback,
  hydrateHistoryVisibility,
  persistHistoryVisibility,
  syncHistoryStateFromRemote,
} from "@/lib/workbench-persistence";
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
  const [historyMessage, setHistoryMessage] = useState<string | null>(null);

  useEffect(() => {
    setPageSize(settings.historyDefaultPageSize);
  }, [settings.historyDefaultPageSize]);

  async function refresh() {
    try {
      setLoading(true);
      setError(null);
      const [taskResponse, visibilityResponse] = await Promise.all([
        listTasks(),
        hydrateHistoryVisibility(),
      ]);
      setTasks(taskResponse);
      if (visibilityResponse.source === "remote") {
        setHistoryState((current) => syncHistoryStateFromRemote(current, visibilityResponse.state));
      }
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
  const historyActionTitle =
    selectedIds.length > 0 ? "你已選取歷史紀錄，可以直接整理" : "先縮小範圍，再決定是否整理";
  const historyActionSummary =
    selectedIds.length > 0
      ? "這一頁的主操作是整理與收納歷史入口，而不是推進案件主線。你已經選了紀錄，可以直接做批次清理。"
      : "先用搜尋與篩選把範圍縮小，再決定要打開原始工作紀錄，或把不需要的入口收起來。";
  const historyActionChecklist = [
    "先確認你現在是在回看歷史，還是在試圖推進主線；若要推進主線，應回案件或交付物工作面。",
    selectedIds.length > 0
      ? `目前已選取 ${selectedIds.length} 筆紀錄，可直接做批次隱藏。`
      : "目前尚未選取任何紀錄；若你只是要找資料，先搜尋與篩選會比直接逐頁翻更快。",
    filteredTasks.length > 0
      ? `目前篩出 ${filteredTasks.length} 筆紀錄，正在看第 ${page} / ${totalPages} 頁。`
      : "目前沒有符合條件的歷史紀錄，可先調整搜尋或篩選條件。",
  ];

  function toggleSelection(taskId: string) {
    setSelectedIds((current) =>
      current.includes(taskId)
        ? current.filter((id) => id !== taskId)
        : [...current, taskId],
    );
  }

  async function hideTasks(taskIds: string[], visibilityState: "hidden" | "visible" = "hidden") {
    if (taskIds.length === 0) {
      return;
    }

    try {
      const result = await persistHistoryVisibility(taskIds, visibilityState);
      if (result.source === "remote") {
        const nextState = syncHistoryStateFromRemote(historyState, result.state);
        setHistoryState(nextState);
        setHistoryMessage(
          buildHistoryVisibilityFeedback(result.source, nextState.hiddenTaskIds.length),
        );
      } else {
        const nextState = applyHistoryFallbackState(historyState, taskIds, visibilityState);
        setHistoryState(nextState);
        setHistoryMessage(
          buildHistoryVisibilityFeedback(result.source, nextState.hiddenTaskIds.length),
        );
      }
    } catch (visibilityError) {
      setHistoryMessage(
        visibilityError instanceof Error ? visibilityError.message : "更新歷史可見性失敗。",
      );
    }
    setSelectedIds((current) => current.filter((id) => !taskIds.includes(id)));
  }

  async function handleClearAll() {
    if (typeof window !== "undefined") {
      const confirmed = window.confirm(
        "這會把目前所有歷史入口標記為隱藏，不會硬刪除正式工作紀錄，確定要繼續嗎？",
      );

      if (!confirmed) {
        return;
      }
    }

    await hideTasks(tasks.map((task) => task.id));
  }

  return (
    <main className="page-shell history-page-shell">
      <section className="hero-card history-hero">
        <div className="hero-layout">
          <div className="hero-main">
            <span className="eyebrow">歷史紀錄</span>
            <h1 className="page-title">歷史紀錄</h1>
            <p className="page-subtitle">用來找回過去做過的工作，快速回到你要接續的脈絡。</p>
            <div className="hero-actions">
              <a className="button-primary" href="#history-tools-panel">
                整理這一頁
              </a>
              <Link className="button-secondary" href="/matters">
                回案件工作台
              </Link>
            </div>
          </div>

          <div className="hero-aside">
            <div className="hero-focus-card">
              <p className="hero-focus-label">{historyActionTitle}</p>
              <h3 className="hero-focus-title">先縮小範圍，再決定是回看還是收起來</h3>
              <p className="hero-focus-copy">{historyActionSummary}</p>
            </div>
            <div className="hero-focus-card hero-focus-card-warm">
              <p className="hero-focus-label">這頁先看什麼</p>
              <ul className="hero-focus-list">
                {historyActionChecklist.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="hero-metrics-grid">
          <div className="section-card hero-metric-card">
            <h3>可回看紀錄</h3>
            <p className="workbench-metric">{visibleTasks.length}</p>
            <p className="muted-text">目前仍會顯示在系統裡的工作紀錄。</p>
          </div>
          <div className="section-card hero-metric-card">
            <h3>已隱藏</h3>
            <p className="workbench-metric">{historyState.hiddenTaskIds.length}</p>
            <p className="muted-text">已先隱藏，但沒有真的刪掉。</p>
          </div>
          <div className="section-card hero-metric-card">
            <h3>案件數</h3>
            <p className="workbench-metric">{matterOptions.length}</p>
            <p className="muted-text">可依案件回看過去做過的內容。</p>
          </div>
        </div>
      </section>

      {loading ? (
        <p className="status-text" role="status" aria-live="polite">
          正在載入歷史紀錄...
        </p>
      ) : null}
      {error ? (
        <p className="error-text" role="alert" aria-live="assertive">
          {error}
        </p>
      ) : null}

      {!loading && !error ? (
        <section className="panel" id="history-tools-panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">歷史整理工具</h2>
              <p className="panel-copy">先用搜尋和篩選找出你要的紀錄，再決定是打開、隱藏，還是整理這一頁。</p>
            </div>
          </div>

          <div className="summary-grid">
            <div className="section-card">
              <h4>{historyActionTitle}</h4>
              <p className="content-block">{historyActionSummary}</p>
            </div>
            <div className="section-card">
              <h4>目前可操作範圍</h4>
              <ul className="list-content">
                {historyActionChecklist.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
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
              onClick={() => void hideTasks(selectedIds)}
              disabled={selectedIds.length === 0}
            >
              隱藏已選項目
            </button>
            <button
              className="button-secondary"
              type="button"
              onClick={() => void hideTasks(pagedTasks.map((task) => task.id))}
              disabled={pagedTasks.length === 0}
            >
              清理本頁
            </button>
            <button className="button-secondary" type="button" onClick={() => void handleClearAll()}>
              清空全部歷史入口
            </button>
          </div>
          {historyMessage ? (
            <p className="success-text" role="status" aria-live="polite">
              {historyMessage}
            </p>
          ) : null}

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
                      決策問題：{truncateText(summary.decisionContext, 72)}
                    </p>
                    <p className="content-block">{truncateText(task.description, 90)}</p>
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
                        onClick={() => void hideTasks([task.id])}
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
