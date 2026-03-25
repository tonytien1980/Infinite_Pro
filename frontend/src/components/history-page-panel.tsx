"use client";

import { useEffect, useState } from "react";

import { TaskHistoryList } from "@/components/task-history-list";
import { listTasks } from "@/lib/api";
import type { TaskListItem } from "@/lib/types";

export function HistoryPagePanel() {
  const [tasks, setTasks] = useState<TaskListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <main className="page-shell">
      <section className="hero-card">
        <span className="eyebrow">歷史紀錄</span>
        <h1 className="page-title">歷史紀錄是正式回看頁，不再常駐佔據主骨架。</h1>
        <p className="page-subtitle">
          這裡集中回看最近任務、交付物與工作進展。主工作流仍在總覽、案件工作台、交付物與來源 / 證據工作面中完成。
        </p>
      </section>

      <TaskHistoryList
        tasks={tasks}
        loading={loading}
        error={error}
        onRefresh={refresh}
        title="全部歷史紀錄"
        description="集中回看最近任務、交付物與工作進度，不再讓歷史紀錄長駐在全站側欄。"
        emptyText="目前還沒有可回看的歷史紀錄。"
      />
    </main>
  );
}
