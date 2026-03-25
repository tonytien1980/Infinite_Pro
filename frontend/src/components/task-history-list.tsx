"use client";

import Link from "next/link";

import { buildTaskListWorkspaceSummary } from "@/lib/advisory-workflow";
import type { TaskListItem } from "@/lib/types";
import {
  formatDisplayDate,
  labelForFlowMode,
  labelForTaskStatus,
  labelForTaskType,
} from "@/lib/ui-labels";

interface TaskHistoryListProps {
  tasks: TaskListItem[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  title?: string;
  description?: string;
  emptyText?: string;
  limit?: number;
  viewAllHref?: string;
  viewAllLabel?: string;
}

export function TaskHistoryList({
  tasks,
  loading,
  error,
  onRefresh,
  title = "最近工作",
  description = "回到最近更新的案件、交付物與分析紀錄，讓工作進度不會散落在不同工具裡。",
  emptyText = "目前還沒有任務，先從「建立新案件」開始第一個顧問工作流。",
  limit,
  viewAllHref,
  viewAllLabel = "查看全部",
}: TaskHistoryListProps) {
  const visibleTasks = limit ? tasks.slice(0, limit) : tasks;

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">{title}</h2>
          <p className="panel-copy">{description}</p>
        </div>
        <button className="button-secondary" type="button" onClick={onRefresh}>
          重新整理
        </button>
      </div>

      {loading ? <p className="status-text">正在載入任務歷史...</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      {!loading && !error && tasks.length === 0 ? (
        <p className="empty-text">{emptyText}</p>
      ) : null}

      <div className="history-list">
        {visibleTasks.map((task) => {
          const workspaceSummary = buildTaskListWorkspaceSummary(task);
          return (
            <Link href={`/tasks/${task.id}`} key={task.id} className="history-item">
              <div className="meta-row">
                <span className="pill">{labelForTaskStatus(task.status)}</span>
                <span>{labelForTaskType(task.task_type)}</span>
                <span>{labelForFlowMode(task.mode)}</span>
                <span>{formatDisplayDate(task.updated_at)}</span>
              </div>
              <h3>{task.title}</h3>
              <p className="workspace-object-path">{workspaceSummary.objectPath}</p>
              <p className="muted-text">{workspaceSummary.decisionContext}</p>
              <div className="meta-row">
                <span>{workspaceSummary.workspaceState}</span>
                <span>{task.evidence_count} 筆證據</span>
                <span>{task.deliverable_count} 份交付物</span>
                <span>{task.run_count} 次執行</span>
              </div>
              <p className="muted-text">{workspaceSummary.packSummary}</p>
              <p className="muted-text">{workspaceSummary.agentSummary}</p>
              <p className="muted-text">
                最新交付物：{task.latest_deliverable_title ?? "尚未產生"}
              </p>
            </Link>
          );
        })}
      </div>

      {limit || viewAllHref ? (
        <div className="panel-footer">
          {limit && tasks.length > limit ? (
            <p className="muted-text">還有 {tasks.length - limit} 筆工作可從完整歷史紀錄回看。</p>
          ) : (
            <span />
          )}
          {viewAllHref ? (
            <Link className="back-link" href={viewAllHref}>
              {viewAllLabel}
            </Link>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
