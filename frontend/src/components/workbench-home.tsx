"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  buildMatterWorkspaceCard,
  buildTaskListWorkspaceSummary,
} from "@/lib/advisory-workflow";
import { getExtensionManager, listMatterWorkspaces, listTasks } from "@/lib/api";
import type {
  ExtensionManagerSnapshot,
  MatterWorkspaceSummary,
  TaskListItem,
} from "@/lib/types";
import { formatDisplayDate, labelForDeliverableClass } from "@/lib/ui-labels";

function collectTopItems(items: string[], limit = 4) {
  const counts = new Map<string, number>();
  items.forEach((item) => counts.set(item, (counts.get(item) ?? 0) + 1));

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, count]) => `${label} · ${count} 次`);
}

function buildGapNote(task: TaskListItem) {
  const notes: string[] = [];

  if (task.evidence_count === 0) {
    notes.push("尚未形成正式證據鏈");
  } else if (task.evidence_count < 2) {
    notes.push("證據仍偏薄");
  }

  if (!task.latest_deliverable_id) {
    notes.push("尚未形成正式交付物");
  }

  if (task.external_research_heavy_candidate) {
    notes.push("需補外部事件脈絡");
  }

  return notes.length > 0 ? notes.join("、") : "這輪工作仍值得補強背景或來源厚度。";
}

function buildTodayFocusItems(
  matters: MatterWorkspaceSummary[],
  tasks: TaskListItem[],
  pendingTasks: TaskListItem[],
) {
  const focus: string[] = [];

  matters.slice(0, 2).forEach((matter) => {
    focus.push(
      `回到「${matter.title}」案件工作台，續推 ${
        matter.current_decision_context_title || "目前主要決策問題"
      }。`,
    );
  });

  tasks.slice(0, 1).forEach((task) => {
    focus.push(`優先處理「${task.title}」，確認本輪交付與工作流是否已收斂。`);
  });

  pendingTasks.slice(0, 1).forEach((task) => {
    focus.push(`補齊「${task.title}」的資料 / 證據缺口，避免交付物等級被迫降級。`);
  });

  if (focus.length === 0) {
    focus.push("目前還沒有進行中的案件，可從「建立新案件」開始第一個顧問工作流。");
  }

  return focus.slice(0, 3);
}

export function WorkbenchHome() {
  const [tasks, setTasks] = useState<TaskListItem[]>([]);
  const [matters, setMatters] = useState<MatterWorkspaceSummary[]>([]);
  const [extensionManager, setExtensionManager] = useState<ExtensionManagerSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [matterLoading, setMatterLoading] = useState(true);
  const [extensionLoading, setExtensionLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [matterError, setMatterError] = useState<string | null>(null);
  const [extensionError, setExtensionError] = useState<string | null>(null);

  async function refreshTasks() {
    try {
      setLoading(true);
      setError(null);
      setTasks(await listTasks());
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : "載入工作總覽失敗。");
    } finally {
      setLoading(false);
    }
  }

  async function refreshMatters() {
    try {
      setMatterLoading(true);
      setMatterError(null);
      setMatters(await listMatterWorkspaces());
    } catch (refreshError) {
      setMatterError(
        refreshError instanceof Error ? refreshError.message : "載入案件工作台失敗。",
      );
    } finally {
      setMatterLoading(false);
    }
  }

  async function refreshExtensionManager() {
    try {
      setExtensionLoading(true);
      setExtensionError(null);
      setExtensionManager(await getExtensionManager());
    } catch (managerError) {
      setExtensionError(
        managerError instanceof Error ? managerError.message : "載入模組包與代理摘要失敗。",
      );
    } finally {
      setExtensionLoading(false);
    }
  }

  useEffect(() => {
    void refreshTasks();
    void refreshMatters();
    void refreshExtensionManager();
  }, []);

  const sortedTasks = useMemo(
    () =>
      [...tasks].sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
      ),
    [tasks],
  );
  const sortedMatters = useMemo(
    () =>
      [...matters].sort(
        (a, b) =>
          new Date(b.latest_updated_at).getTime() - new Date(a.latest_updated_at).getTime(),
      ),
    [matters],
  );

  const activeMatters = sortedMatters.filter((matter) => matter.active_task_count > 0);
  const visibleMatters = (activeMatters.length > 0 ? activeMatters : sortedMatters).slice(0, 4);
  const recentDeliverables = sortedTasks
    .filter((task) => Boolean(task.latest_deliverable_id))
    .slice(0, 4);
  const pendingEvidenceTasks = sortedTasks
    .filter(
      (task) =>
        task.evidence_count < 2 ||
        !task.latest_deliverable_id ||
        task.external_research_heavy_candidate,
    )
    .slice(0, 4);
  const recentActivities = sortedTasks.slice(0, 4);
  const frequentAgents = collectTopItems(
    sortedTasks.flatMap((task) => task.selected_agent_names),
    4,
  );
  const frequentPacks = collectTopItems(
    sortedTasks.flatMap((task) => task.selected_pack_names),
    4,
  );
  const todayFocusItems = buildTodayFocusItems(
    visibleMatters,
    recentActivities,
    pendingEvidenceTasks,
  );

  return (
    <main className="page-shell">
      <section className="hero-card">
        <span className="eyebrow">總覽</span>
        <h1 className="page-title">今天先回到這些正式工作面。</h1>
        <p className="page-subtitle">
          首頁只負責總覽目前最值得先處理的工作：進行中案件、最近交付物、待補資料 / 待補證據、最近活動與常用代理 / 模組包。建立新案件已獨立成正式入口，不再佔據首頁主體。
        </p>

        <div className="summary-grid overview-summary-grid" style={{ marginTop: "20px" }}>
          <div className="section-card">
            <h3>今日工作總覽</h3>
            <ul className="list-content">
              {todayFocusItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="section-card quick-start-card">
            <h3>快速開始</h3>
            <p className="content-block">
              建立新案件 / 新任務現在是獨立工作頁。若你要開始新的顧問問題，請直接走正式進件入口，而不是從首頁大表單往下填。
            </p>
            <div className="button-row" style={{ marginTop: "12px" }}>
              <Link className="button-primary" href="/new">
                建立新案件
              </Link>
              <Link className="button-secondary" href="/matters">
                打開案件工作台
              </Link>
            </div>
          </div>
        </div>

        <div className="workbench-overview-grid" style={{ marginTop: "20px" }}>
          <div className="section-card">
            <h3>進行中案件</h3>
            <p className="workbench-metric">{activeMatters.length}</p>
            <p className="muted-text">目前仍有持續進行工作中的案件工作台。</p>
          </div>
          <div className="section-card">
            <h3>最近交付物</h3>
            <p className="workbench-metric">{recentDeliverables.length}</p>
            <p className="muted-text">最近可直接回看的正式交付成果。</p>
          </div>
          <div className="section-card">
            <h3>待補資料 / 證據</h3>
            <p className="workbench-metric">{pendingEvidenceTasks.length}</p>
            <p className="muted-text">目前最需要補齊資料厚度的工作項目。</p>
          </div>
        </div>
      </section>

      {loading || matterLoading ? <p className="status-text">正在載入總覽...</p> : null}
      {error ? <p className="error-text">{error}</p> : null}
      {matterError ? <p className="error-text">{matterError}</p> : null}
      {extensionError ? <p className="error-text">{extensionError}</p> : null}

      {!loading && !matterLoading ? (
        <div className="detail-grid">
          <div className="detail-stack">
            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2 className="panel-title">進行中案件</h2>
                  <p className="panel-copy">
                    先回到案件世界，再決定要沿著哪個決策問題、哪份交付物或哪條來源 / 證據鏈繼續推進。
                  </p>
                </div>
                <Link className="button-secondary" href="/matters">
                  查看全部案件
                </Link>
              </div>

              <div className="history-list">
                {visibleMatters.length > 0 ? (
                  visibleMatters.map((matter) => {
                    const workspaceCard = buildMatterWorkspaceCard(matter);

                    return (
                      <Link className="history-item" href={`/matters/${matter.id}`} key={matter.id}>
                        <div className="meta-row">
                          <span className="pill">{matter.active_task_count > 0 ? "進行中案件" : "回看案件"}</span>
                          <span>更新於 {formatDisplayDate(matter.latest_updated_at)}</span>
                        </div>
                        <h3>{workspaceCard.title}</h3>
                        <p className="workspace-object-path">{workspaceCard.objectPath}</p>
                        <p className="muted-text">{workspaceCard.decisionContext}</p>
                        <p className="muted-text">{workspaceCard.continuity}</p>
                        <p className="muted-text">{workspaceCard.packSummary}</p>
                        <p className="muted-text">{workspaceCard.agentSummary}</p>
                      </Link>
                    );
                  })
                ) : (
                  <p className="empty-text">目前還沒有已形成的案件工作台。</p>
                )}
              </div>
            </section>

            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2 className="panel-title">最近交付物</h2>
                  <p className="panel-copy">交付物已是正式獨立頁。這裡只保留最近最值得回看的成果入口。</p>
                </div>
                <Link className="button-secondary" href="/deliverables">
                  查看全部交付物
                </Link>
              </div>

              <div className="history-list">
                {recentDeliverables.length > 0 ? (
                  recentDeliverables.map((task) => {
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
                          <span>{formatDisplayDate(task.updated_at)}</span>
                        </div>
                        <h3>{task.latest_deliverable_title || task.title}</h3>
                        <p className="workspace-object-path">{summary.objectPath}</p>
                        <p className="muted-text">{summary.decisionContext}</p>
                        <p className="muted-text">{summary.workspaceState}</p>
                      </Link>
                    );
                  })
                ) : (
                  <p className="empty-text">目前還沒有最近交付物，新的正式交付成果會出現在這裡。</p>
                )}
              </div>
            </section>
          </div>

          <div className="detail-stack">
            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2 className="panel-title">待補資料 / 待補證據</h2>
                  <p className="panel-copy">這裡只抓最需要先補資料厚度的工作，不讓證據缺口被埋在任務細節裡。</p>
                </div>
              </div>

              <div className="detail-list">
                {pendingEvidenceTasks.length > 0 ? (
                  pendingEvidenceTasks.map((task) => {
                    const summary = buildTaskListWorkspaceSummary(task);
                    const href = task.matter_workspace
                      ? `/matters/${task.matter_workspace.id}/evidence`
                      : `/tasks/${task.id}`;

                    return (
                      <Link className="detail-item" href={href} key={`gap-${task.id}`}>
                        <div className="meta-row">
                          <span className="pill">待補資料</span>
                          <span>{task.evidence_count} 筆證據</span>
                        </div>
                        <h3>{task.title}</h3>
                        <p className="workspace-object-path">{summary.objectPath}</p>
                        <p className="content-block">{buildGapNote(task)}</p>
                      </Link>
                    );
                  })
                ) : (
                  <p className="empty-text">目前沒有明顯的待補資料 / 待補證據案件。</p>
                )}
              </div>
            </section>

            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2 className="panel-title">最近活動</h2>
                  <p className="panel-copy">首頁只保留少量最近活動摘要；完整回看已抽離為正式歷史紀錄頁。</p>
                </div>
                <Link className="button-secondary" href="/history">
                  查看全部歷史紀錄
                </Link>
              </div>

              <div className="detail-list">
                {recentActivities.length > 0 ? (
                  recentActivities.map((task) => {
                    const summary = buildTaskListWorkspaceSummary(task);

                    return (
                      <Link className="detail-item" href={`/tasks/${task.id}`} key={`activity-${task.id}`}>
                        <div className="meta-row">
                          <span className="pill">工作更新</span>
                          <span>{formatDisplayDate(task.updated_at)}</span>
                        </div>
                        <h3>{task.title}</h3>
                        <p className="workspace-object-path">{summary.objectPath}</p>
                        <p className="muted-text">{summary.decisionContext}</p>
                      </Link>
                    );
                  })
                ) : (
                  <p className="empty-text">目前還沒有最近活動可顯示。</p>
                )}
              </div>
            </section>

            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2 className="panel-title">常用代理 / 模組包</h2>
                  <p className="panel-copy">首頁只顯示高頻使用摘要；正式目錄與狀態可到代理管理、模組包管理頁查看。</p>
                </div>
              </div>

              <div className="summary-grid">
                <div className="section-card">
                  <h4>常用代理</h4>
                  {frequentAgents.length > 0 ? (
                    <ul className="list-content">
                      {frequentAgents.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="empty-text">目前還沒有常用代理摘要。</p>
                  )}
                  <div className="button-row" style={{ marginTop: "12px" }}>
                    <Link className="button-secondary" href="/agents">
                      進入代理管理
                    </Link>
                  </div>
                </div>
                <div className="section-card">
                  <h4>常用模組包</h4>
                  {frequentPacks.length > 0 ? (
                    <ul className="list-content">
                      {frequentPacks.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="empty-text">目前還沒有常用模組包摘要。</p>
                  )}
                  <div className="button-row" style={{ marginTop: "12px" }}>
                    <Link className="button-secondary" href="/packs">
                      進入模組包管理
                    </Link>
                  </div>
                </div>
              </div>

              {extensionLoading ? <p className="status-text">正在整理代理與模組包摘要...</p> : null}
              {!extensionLoading && extensionManager ? (
                <div className="meta-row" style={{ marginTop: "16px" }}>
                  <span>{extensionManager.agent_registry.active_agent_ids.length} 個可用代理</span>
                  <span>{extensionManager.pack_registry.active_pack_ids.length} 個啟用中模組包</span>
                </div>
              ) : null}
            </section>
          </div>
        </div>
      ) : null}
    </main>
  );
}
