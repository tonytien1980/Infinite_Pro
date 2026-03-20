"use client";

import Link from "next/link";

import type { TaskListItem } from "@/lib/types";

interface TaskHistoryListProps {
  tasks: TaskListItem[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
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
          <h2 className="panel-title">Task history</h2>
          <p className="panel-copy">
            Saved tasks, deliverables, and runs accumulate here so this feels like a real
            workbench instead of a disposable chat thread.
          </p>
        </div>
        <button className="button-secondary" type="button" onClick={onRefresh}>
          Refresh
        </button>
      </div>

      {loading ? <p className="status-text">Loading task history...</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      {!loading && !error && tasks.length === 0 ? (
        <p className="empty-text">No tasks yet. Create the first supported flow on the left.</p>
      ) : null}

      <div className="history-list">
        {tasks.map((task) => (
          <Link href={`/tasks/${task.id}`} key={task.id} className="history-item">
            <div className="meta-row">
              <span className="pill">{task.status}</span>
              <span>{task.task_type}</span>
              <span>{formatDate(task.updated_at)}</span>
            </div>
            <h3>{task.title}</h3>
            <p className="muted-text">{task.description || "No extra description provided."}</p>
            <div className="meta-row">
              <span>{task.evidence_count} evidence</span>
              <span>{task.deliverable_count} deliverables</span>
              <span>{task.run_count} runs</span>
            </div>
            <p className="muted-text">
              Latest deliverable: {task.latest_deliverable_title ?? "Not generated yet"}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
