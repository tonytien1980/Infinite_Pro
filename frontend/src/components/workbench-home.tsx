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

  const sortedTasks = [...tasks].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
  );
  const activeTasks = sortedTasks.filter((task) => task.status !== "completed").slice(0, 3);
  const recentDeliverables = sortedTasks
    .filter((task) => Boolean(task.latest_deliverable_title))
    .slice(0, 3);

  return (
    <main className="page-shell">
      <section className="hero-card">
        <span className="eyebrow">Infinite Pro 顧問工作台</span>
        <h1 className="page-title">從收件、判斷到交付，都在同一個顧問工作面完成。</h1>
        <p className="page-subtitle">
          這裡不是一般表單入口，而是你的顧問收件台。先清楚定義這次要判斷的問題，再把資料、Decision
          Context 與交付要求收進同一條工作脈絡，最後由 Host 協調出可直接採用的顧問交付結果。
        </p>
        <div className="workbench-overview-grid" style={{ marginTop: "20px" }}>
          <div className="section-card">
            <h3>目前案件數</h3>
            <p className="workbench-metric">{tasks.length}</p>
            <p className="muted-text">所有已建立並可回看的顧問案件。</p>
          </div>
          <div className="section-card">
            <h3>進行中工作</h3>
            <p className="workbench-metric">{activeTasks.length}</p>
            <p className="muted-text">這幾個案件最值得優先回到工作面處理。</p>
          </div>
          <div className="section-card">
            <h3>最近交付物</h3>
            <p className="workbench-metric">{recentDeliverables.length}</p>
            <p className="muted-text">可直接回到最近產出的顧問交付結果。</p>
          </div>
        </div>
      </section>

      <div className="workbench-grid workbench-home-grid">
        <div className="detail-stack">
          <TaskCreateForm onCreated={handleCreated} />
        </div>

        <div className="detail-stack">
          <section className="panel">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">現在值得先回到哪裡</h2>
                <p className="panel-copy">
                  這一欄只保留最接近當前工作的案件與交付物，避免首頁被歷史清單主導。
                </p>
              </div>
            </div>

            <div className="history-list">
              {activeTasks.length > 0 ? (
                activeTasks.map((task) => (
                  <button
                    key={task.id}
                    className="history-item history-item-button"
                    type="button"
                    onClick={() => router.push(`/tasks/${task.id}`)}
                  >
                    <div className="meta-row">
                      <span className="pill">{task.status === "running" ? "執行中" : "待回看"}</span>
                      <span>{task.latest_deliverable_title ? "已有交付物" : "待產出"}</span>
                    </div>
                    <h3>{task.title}</h3>
                    <p className="muted-text">{task.description || "未提供額外說明。"}</p>
                  </button>
                ))
              ) : (
                <p className="empty-text">目前沒有待處理中的案件，新的分析會直接從左側收件台開始。</p>
              )}
            </div>
          </section>

          <TaskHistoryList
            tasks={tasks}
            loading={loading}
            error={error}
            onRefresh={refreshTasks}
            title="最近工作"
            description="回到最近更新的案件與交付物；完整歷史仍保留，但不再佔據主工作面。"
            emptyText="目前還沒有任務，先從左側啟動第一個顧問案件。"
            limit={6}
          />
        </div>
      </div>
    </main>
  );
}
