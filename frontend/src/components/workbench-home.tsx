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
        refreshError instanceof Error ? refreshError.message : "載入任務歷史失敗。",
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
        <span className="eyebrow">Infinite Pro · V1 MVP 工作台切片</span>
        <h1 className="page-title">以顧問案件工作流為核心的分析工作台。</h1>
        <p className="page-subtitle">
          這個工作台讓你先把案件定義講清楚，再補背景、上傳資料、檢查分析準備度，
          最後透過 Host 協調層執行專家流程或固定編組的多代理收斂流程，產出可供顧問內部使用的結構化結果。
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
