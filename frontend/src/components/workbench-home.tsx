"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  buildMatterWorkspaceCard,
  buildTaskListWorkspaceSummary,
} from "@/lib/advisory-workflow";
import { getExtensionManager, listMatterWorkspaces, listTasks } from "@/lib/api";
import type {
  ExtensionManagerSnapshot,
  MatterWorkspaceSummary,
  TaskAggregate,
  TaskListItem,
} from "@/lib/types";
import { ExtensionManagerSurface } from "@/components/extension-manager-surface";
import { TaskCreateForm } from "@/components/task-create-form";
import { TaskHistoryList } from "@/components/task-history-list";

export function WorkbenchHome() {
  const router = useRouter();
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

  async function refreshMatters() {
    try {
      setMatterLoading(true);
      setMatterError(null);
      const response = await listMatterWorkspaces();
      setMatters(response);
    } catch (refreshError) {
      setMatterError(
        refreshError instanceof Error ? refreshError.message : "載入案件工作面失敗。",
      );
    } finally {
      setMatterLoading(false);
    }
  }

  useEffect(() => {
    void refreshTasks();
    void refreshMatters();
    void (async () => {
      try {
        setExtensionLoading(true);
        setExtensionError(null);
        setExtensionManager(await getExtensionManager());
      } catch (managerError) {
        setExtensionError(
          managerError instanceof Error
            ? managerError.message
            : "載入 Extension Manager 失敗。",
        );
      } finally {
        setExtensionLoading(false);
      }
    })();
  }, []);

  function handleCreated(task: TaskAggregate) {
    void refreshTasks();
    void refreshMatters();
    router.push(`/tasks/${task.id}`);
  }

  const sortedTasks = [...tasks].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
  );
  const activeTasks = sortedTasks.filter((task) => task.status !== "completed").slice(0, 3);
  const recentDeliverables = sortedTasks
    .filter((task) => Boolean(task.latest_deliverable_title))
    .slice(0, 3);
  const activeMatters = matters.slice(0, 4);

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
            <h3>案件工作面</h3>
            <p className="workbench-metric">{matters.length}</p>
            <p className="muted-text">已形成可回看的 matter / engagement 工作面。</p>
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
                <h2 className="panel-title">現在值得先回到哪個案件世界</h2>
                <p className="panel-copy">
                  先回到 matter / engagement workspace，再決定要沿著哪個 task、decision context 或 deliverable 繼續工作。
                </p>
              </div>
            </div>

            <div className="history-list">
              {matterLoading ? <p className="status-text">正在載入案件工作面...</p> : null}
              {matterError ? <p className="error-text">{matterError}</p> : null}
              {!matterLoading && !matterError && activeMatters.length > 0 ? (
                activeMatters.map((matter) => {
                  const workspaceCard = buildMatterWorkspaceCard(matter);
                  return (
                    <button
                      key={matter.id}
                      className="history-item history-item-button"
                      type="button"
                      onClick={() => router.push(`/matters/${matter.id}`)}
                    >
                      <div className="meta-row">
                        <span className="pill">Matter Workspace</span>
                        <span>{matter.active_task_count > 0 ? "有進行中工作" : "以回看為主"}</span>
                      </div>
                      <h3>{workspaceCard.title}</h3>
                      <p className="workspace-object-path">{workspaceCard.objectPath}</p>
                      <p className="muted-text">{workspaceCard.decisionContext}</p>
                      <p className="muted-text">{workspaceCard.continuity}</p>
                      <p className="muted-text">{workspaceCard.packSummary}</p>
                      <p className="muted-text">{workspaceCard.agentSummary}</p>
                      <div className="meta-row">
                        {workspaceCard.counts.map((count) => (
                          <span key={`${matter.id}-${count}`}>{count}</span>
                        ))}
                      </div>
                    </button>
                  );
                })
              ) : (
                !matterLoading &&
                !matterError && (
                  <p className="empty-text">
                    目前還沒有已形成的案件工作面；新的分析建立後，會自動串進對應的 matter / engagement workspace。
                  </p>
                )
              )}
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">從案件世界回到具體工作</h2>
                <p className="panel-copy">
                  這裡保留最接近當前工作的 task 與交付物，但它們現在是案件世界下的工作單元，而不是首頁主體。
                </p>
              </div>
            </div>

            <div className="history-list">
              {activeTasks.length > 0 ? (
                activeTasks.map((task) => {
                  const workspaceSummary = buildTaskListWorkspaceSummary(task);
                  return (
                    <button
                      key={task.id}
                      className="history-item history-item-button"
                      type="button"
                      onClick={() => router.push(`/tasks/${task.id}`)}
                    >
                      <div className="meta-row">
                        <span className="pill">{task.status === "running" ? "執行中" : "待回看"}</span>
                        <span>{task.latest_deliverable_title ? "已有交付物" : "待產出"}</span>
                        {task.matter_workspace ? <span>所屬案件已串接</span> : null}
                      </div>
                      <h3>{task.title}</h3>
                      <p className="workspace-object-path">{workspaceSummary.objectPath}</p>
                      <p className="muted-text">{workspaceSummary.decisionContext}</p>
                      <p className="muted-text">{workspaceSummary.packSummary}</p>
                      <p className="muted-text">{workspaceSummary.agentSummary}</p>
                      <div className="meta-row">
                        <span>{workspaceSummary.workspaceState}</span>
                      </div>
                    </button>
                  );
                })
              ) : (
                <p className="empty-text">目前沒有待處理中的案件，新的分析會直接從左側收件台開始。</p>
              )}
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">最近交付物</h2>
                <p className="panel-copy">
                  這些交付物現在有正式的 Deliverable Workspace，可直接回看交付等級、依據鏈、限制與案件脈絡。
                </p>
              </div>
            </div>

            <div className="history-list">
              {recentDeliverables.length > 0 ? (
                recentDeliverables.map((task) => {
                  const workspaceSummary = buildTaskListWorkspaceSummary(task);
                  return (
                    <button
                      key={`${task.id}-${task.latest_deliverable_id ?? "deliverable"}`}
                      className="history-item history-item-button"
                      type="button"
                      onClick={() =>
                        task.latest_deliverable_id
                          ? router.push(`/deliverables/${task.latest_deliverable_id}`)
                          : router.push(`/tasks/${task.id}`)
                      }
                    >
                      <div className="meta-row">
                        <span className="pill">Deliverable Workspace</span>
                        <span>{task.latest_deliverable_title ? "已有正式交付物" : "回到來源 task"}</span>
                      </div>
                      <h3>{task.latest_deliverable_title || task.title}</h3>
                      <p className="workspace-object-path">{workspaceSummary.objectPath}</p>
                      <p className="muted-text">{workspaceSummary.decisionContext}</p>
                      <p className="muted-text">{workspaceSummary.workspaceState}</p>
                    </button>
                  );
                })
              ) : (
                <p className="empty-text">目前還沒有最近交付物，新的 deliverable 產出後會出現在這裡。</p>
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

          <details className="panel disclosure-panel">
            <summary className="disclosure-summary">
              <div>
                <h2 className="section-title">Extension Manager</h2>
                <p className="panel-copy">
                  查看目前有哪些 Domain Packs、Industry Packs 與 Agents 可用。這是單人版最小管理面，不是 marketplace。
                </p>
              </div>
              <span className="pill">展開</span>
            </summary>
            <div className="disclosure-body">
              <ExtensionManagerSurface
                snapshot={extensionManager}
                loading={extensionLoading}
                error={extensionError}
              />
            </div>
          </details>
        </div>
      </div>
    </main>
  );
}
