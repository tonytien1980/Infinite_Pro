"use client";

import Link from "next/link";

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
}

export function TaskHistoryList({
  tasks,
  loading,
  error,
  onRefresh,
}: TaskHistoryListProps) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">任務歷史</h2>
          <p className="panel-copy">
            已儲存的任務、交付物與執行紀錄會累積在這裡，讓系統更像真正的工作台，而不是一次性的聊天視窗。
          </p>
        </div>
        <button className="button-secondary" type="button" onClick={onRefresh}>
          重新整理
        </button>
      </div>

      {loading ? <p className="status-text">正在載入任務歷史...</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      {!loading && !error && tasks.length === 0 ? (
        <p className="empty-text">目前還沒有任務，請先在左側建立第一個支援的流程。</p>
      ) : null}

      <div className="history-list">
        {tasks.map((task) => (
          <Link href={`/tasks/${task.id}`} key={task.id} className="history-item">
            <div className="meta-row">
              <span className="pill">{labelForTaskStatus(task.status)}</span>
              <span>{labelForTaskType(task.task_type)}</span>
              <span>{labelForFlowMode(task.mode)}</span>
              <span>{formatDisplayDate(task.updated_at)}</span>
            </div>
            <h3>{task.title}</h3>
            <p className="muted-text">{task.description || "未提供額外說明。"}</p>
            <div className="meta-row">
              <span>{task.evidence_count} 筆證據</span>
              <span>{task.deliverable_count} 份交付物</span>
              <span>{task.run_count} 次執行</span>
            </div>
            <p className="muted-text">
              最新交付物：{task.latest_deliverable_title ?? "尚未產生"}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
