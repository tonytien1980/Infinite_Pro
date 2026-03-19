"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { listTasks } from "@/lib/api";
import type { TaskAggregate, TaskListItem } from "@/lib/types";
import { TaskCreateForm } from "@/components/task-create-form";
import { TaskHistoryList } from "@/components/task-history-list";

export function WorkbenchHome() {
  const router = useRouter();
  const [tasks, setTasks] = useState<TaskListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refreshTasks() {
    try {
      setLoading(true);
      setError(null);
      const response = await listTasks();
      setTasks(response);
    } catch (refreshError) {
      setError(
        refreshError instanceof Error ? refreshError.message : "Failed to load task history.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refreshTasks();
  }, []);

  function handleCreated(task: TaskAggregate) {
    void refreshTasks();
    router.push(`/tasks/${task.id}`);
  }

  return (
    <main className="page-shell">
      <section className="hero-card">
        <span className="eyebrow">AI Advisory OS · MVP specialist slice</span>
        <h1 className="page-title">Ontology-backed research workbench.</h1>
        <p className="page-subtitle">
          This first slice lets us create a task, add background text, upload source
          files, turn them into Evidence, and run a Host-routed Research Synthesis Agent
          that saves a structured Deliverable into task history.
        </p>
      </section>

      <div className="workbench-grid">
        <TaskCreateForm onCreated={handleCreated} />
        <TaskHistoryList
          tasks={tasks}
          loading={loading}
          error={error}
          onRefresh={refreshTasks}
        />
      </div>
    </main>
  );
}
