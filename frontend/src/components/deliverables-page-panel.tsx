"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { buildTaskListWorkspaceSummary } from "@/lib/advisory-workflow";
import { listTasks } from "@/lib/api";
import type { TaskListItem } from "@/lib/types";
import {
  formatDisplayDate,
  labelForDeliverableClass,
  labelForTaskStatus,
} from "@/lib/ui-labels";

export function DeliverablesPagePanel() {
  const [tasks, setTasks] = useState<TaskListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      setLoading(true);
      setError(null);
      setTasks(await listTasks());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "載入交付物列表失敗。");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  const deliverableTasks = useMemo(
    () =>
      tasks
        .filter((task) => Boolean(task.latest_deliverable_id))
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()),
    [tasks],
  );

  const exploratoryCount = deliverableTasks.filter(
    (item) => item.deliverable_class_hint === "exploratory_brief",
  ).length;
  const reviewCount = deliverableTasks.filter(
    (item) => item.deliverable_class_hint === "assessment_review_memo",
  ).length;
  const decisionCount = deliverableTasks.filter(
    (item) => item.deliverable_class_hint === "decision_action_deliverable",
  ).length;

  return (
    <main className="page-shell">
      <section className="hero-card">
        <span className="eyebrow">交付物</span>
        <h1 className="page-title">正式交付物應有自己的工作面，而不是結果區塊。</h1>
        <p className="page-subtitle">
          這裡集中管理與回看目前已產生的交付物。你可以直接從交付物視角判讀等級、依據來源、限制與案件脈絡，再決定是否回到案件或來源工作面。
        </p>
        <div className="workbench-overview-grid" style={{ marginTop: "20px" }}>
          <div className="section-card">
            <h3>探索型交付</h3>
            <p className="workbench-metric">{exploratoryCount}</p>
            <p className="muted-text">適合資料稀疏或外部事件導向的探索性輸出。</p>
          </div>
          <div className="section-card">
            <h3>評估 / 審閱</h3>
            <p className="workbench-metric">{reviewCount}</p>
            <p className="muted-text">偏文件中心或問題聚焦的判斷型交付物。</p>
          </div>
          <div className="section-card">
            <h3>決策 / 行動</h3>
            <p className="workbench-metric">{decisionCount}</p>
            <p className="muted-text">已較接近決策與行動層的正式交付成果。</p>
          </div>
        </div>
      </section>

      {loading ? <p className="status-text">正在載入交付物頁...</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      {!loading && !error ? (
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">最近交付物</h2>
              <p className="panel-copy">
                交付物已是正式頁面。這裡不是一般結果檢視頁，而是你回看判斷、風險、行動與依據來源的主入口。
              </p>
            </div>
          </div>

          <div className="history-list">
            {deliverableTasks.length > 0 ? (
              deliverableTasks.map((task) => {
                const summary = buildTaskListWorkspaceSummary(task);

                return (
                  <Link
                    className="history-item"
                    href={
                      task.latest_deliverable_id
                        ? `/deliverables/${task.latest_deliverable_id}`
                        : `/tasks/${task.id}`
                    }
                    key={`${task.id}-${task.latest_deliverable_id ?? "deliverable"}`}
                  >
                    <div className="meta-row">
                      <span className="pill">{labelForDeliverableClass(task.deliverable_class_hint)}</span>
                      <span>{labelForTaskStatus(task.status)}</span>
                      <span>{formatDisplayDate(task.updated_at)}</span>
                    </div>
                    <h3>{task.latest_deliverable_title || task.title}</h3>
                    <p className="workspace-object-path">{summary.objectPath}</p>
                    <p className="muted-text">{summary.decisionContext}</p>
                    <p className="muted-text">{summary.packSummary}</p>
                    <p className="muted-text">{summary.agentSummary}</p>
                  </Link>
                );
              })
            ) : (
              <p className="empty-text">
                目前還沒有正式交付物。完成第一輪案件分析後，這裡會承接最近交付成果。
              </p>
            )}
          </div>
        </section>
      ) : null}
    </main>
  );
}
