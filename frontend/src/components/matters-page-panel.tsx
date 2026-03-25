"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  buildMatterWorkspaceCard,
  buildTaskListWorkspaceSummary,
} from "@/lib/advisory-workflow";
import { listMatterWorkspaces, listTasks } from "@/lib/api";
import type { MatterWorkspaceSummary, TaskListItem } from "@/lib/types";
import { formatDisplayDate, labelForDeliverableClass } from "@/lib/ui-labels";

export function MattersPagePanel() {
  const [matters, setMatters] = useState<MatterWorkspaceSummary[]>([]);
  const [tasks, setTasks] = useState<TaskListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      setLoading(true);
      setError(null);
      const [matterResponse, taskResponse] = await Promise.all([
        listMatterWorkspaces(),
        listTasks(),
      ]);
      setMatters(matterResponse);
      setTasks(taskResponse);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "載入案件工作台失敗。");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  const sortedMatters = useMemo(
    () =>
      [...matters].sort(
        (a, b) =>
          new Date(b.latest_updated_at).getTime() - new Date(a.latest_updated_at).getTime(),
      ),
    [matters],
  );
  const activeMatters = sortedMatters.filter((item) => item.active_task_count > 0);
  const recentTasks = [...tasks]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 3);
  const recentDeliverables = [...tasks]
    .filter((task) => Boolean(task.latest_deliverable_id))
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 4);

  return (
    <main className="page-shell">
      <section className="hero-card">
        <span className="eyebrow">案件工作台</span>
        <h1 className="page-title">以案件世界為主體，而不是零散任務清單。</h1>
        <p className="page-subtitle">
          這裡集中回看客戶、案件委託、工作流與目前主要的決策問題。每一個案件工作台都應承接持續中的判斷、交付物與工作連續性。
        </p>
        <div className="workbench-overview-grid" style={{ marginTop: "20px" }}>
          <div className="section-card">
            <h3>案件總數</h3>
            <p className="workbench-metric">{matters.length}</p>
            <p className="muted-text">已形成正式案件工作面的 matter 數量。</p>
          </div>
          <div className="section-card">
            <h3>進行中案件</h3>
            <p className="workbench-metric">{activeMatters.length}</p>
            <p className="muted-text">目前仍有持續進行工作中的案件工作台。</p>
          </div>
          <div className="section-card">
            <h3>最近交付物</h3>
            <p className="workbench-metric">{recentDeliverables.length}</p>
            <p className="muted-text">可直接打開的最近正式交付物。</p>
          </div>
        </div>
      </section>

      {loading ? <p className="status-text">正在載入案件工作台...</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      {!loading && !error ? (
        <div className="detail-grid">
          <div className="detail-stack">
            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2 className="panel-title">進行中案件</h2>
                  <p className="panel-copy">
                    先從有持續進行工作的案件回到正式工作面，再決定要沿著哪一條決策脈絡繼續推進。
                  </p>
                </div>
                <Link className="button-secondary" href="/new">
                  建立新案件
                </Link>
              </div>

              <div className="history-list">
                {(activeMatters.length > 0 ? activeMatters : sortedMatters).map((matter) => {
                  const card = buildMatterWorkspaceCard(matter);

                  return (
                    <Link className="history-item" href={`/matters/${matter.id}`} key={matter.id}>
                      <div className="meta-row">
                        <span className="pill">{matter.active_task_count > 0 ? "進行中案件" : "回看案件"}</span>
                        <span>更新於 {formatDisplayDate(matter.latest_updated_at)}</span>
                      </div>
                      <h3>{card.title}</h3>
                      <p className="workspace-object-path">{card.objectPath}</p>
                      <p className="muted-text">{card.decisionContext}</p>
                      <p className="muted-text">{card.continuity}</p>
                      <p className="muted-text">{card.packSummary}</p>
                      <div className="meta-row">
                        {card.counts.map((count) => (
                          <span key={`${matter.id}-${count}`}>{count}</span>
                        ))}
                      </div>
                    </Link>
                  );
                })}

                {sortedMatters.length === 0 ? (
                  <p className="empty-text">
                    目前還沒有案件工作台；建立第一個案件後，Infinite Pro 會自動把相關工作串成正式案件世界。
                  </p>
                ) : null}
              </div>
            </section>
          </div>

          <div className="detail-stack">
            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2 className="panel-title">最近工作紀錄</h2>
                  <p className="panel-copy">案件頁只保留最近 3 筆工作回看；完整歷史已抽離到正式歷史紀錄頁。</p>
                </div>
                <Link className="button-secondary" href="/history">
                  查看全部
                </Link>
              </div>
              <div className="detail-list">
                {recentTasks.length > 0 ? (
                  recentTasks.map((task) => {
                    const summary = buildTaskListWorkspaceSummary(task);

                    return (
                      <Link className="detail-item" href={`/tasks/${task.id}`} key={task.id}>
                        <div className="meta-row">
                          <span className="pill">工作紀錄</span>
                          <span>{formatDisplayDate(task.updated_at)}</span>
                        </div>
                        <h3>{task.title}</h3>
                        <p className="workspace-object-path">{summary.objectPath}</p>
                        <p className="muted-text">{summary.decisionContext}</p>
                      </Link>
                    );
                  })
                ) : (
                  <p className="empty-text">目前還沒有可回看的工作紀錄。</p>
                )}
              </div>
            </section>

            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2 className="panel-title">最近交付物</h2>
                  <p className="panel-copy">從案件工作台直接打開最近交付成果，不必先回到單一工作結果頁。</p>
                </div>
                <Link className="button-secondary" href="/deliverables">
                  查看全部交付物
                </Link>
              </div>
              <div className="detail-list">
                {recentDeliverables.length > 0 ? (
                  recentDeliverables.map((task) => {
                    const summary = buildTaskListWorkspaceSummary(task);

                    return (
                      <Link
                        className="detail-item"
                        href={
                          task.latest_deliverable_id
                            ? `/deliverables/${task.latest_deliverable_id}`
                            : `/tasks/${task.id}`
                        }
                        key={`${task.id}-${task.latest_deliverable_id ?? "deliverable"}`}
                      >
                        <div className="meta-row">
                          <span className="pill">{labelForDeliverableClass(task.deliverable_class_hint)}</span>
                          <span>{formatDisplayDate(task.updated_at)}</span>
                        </div>
                        <h3>{task.latest_deliverable_title || task.title}</h3>
                        <p className="workspace-object-path">{summary.objectPath}</p>
                        <p className="muted-text">{summary.decisionContext}</p>
                      </Link>
                    );
                  })
                ) : (
                  <p className="empty-text">目前還沒有正式交付物。</p>
                )}
              </div>
            </section>
          </div>
        </div>
      ) : null}
    </main>
  );
}
