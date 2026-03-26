"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  buildMatterWorkspaceCard,
  buildTaskListWorkspaceSummary,
} from "@/lib/advisory-workflow";
import { getExtensionManager, listMatterWorkspaces, listTasks } from "@/lib/api";
import { truncateText } from "@/lib/text-format";
import type {
  ExtensionManagerSnapshot,
  MatterWorkspaceSummary,
  TaskListItem,
} from "@/lib/types";
import { formatDisplayDate, labelForDeliverableClass } from "@/lib/ui-labels";
import {
  useDeliverableWorkspaceRecords,
  useMatterWorkspaceRecords,
  useWorkbenchSettings,
} from "@/lib/workbench-store";
import {
  isLocalFallbackDeliverableRecord,
  isLocalFallbackMatterRecord,
} from "@/lib/workspace-persistence";

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
    notes.push("需補外部脈絡");
  }

  return notes.join("、") || "目前仍值得再補一輪背景或來源厚度。";
}

function pickFocusLabel(preference: "matters" | "deliverables" | "evidence") {
  if (preference === "deliverables") {
    return "先回到最近交付物";
  }
  if (preference === "evidence") {
    return "先補待補資料";
  }
  return "先回到最近案件";
}

export function WorkbenchHome() {
  const [tasks, setTasks] = useState<TaskListItem[]>([]);
  const [matters, setMatters] = useState<MatterWorkspaceSummary[]>([]);
  const [extensionManager, setExtensionManager] = useState<ExtensionManagerSnapshot | null>(null);
  const [matterRecords] = useMatterWorkspaceRecords();
  const [deliverableRecords] = useDeliverableWorkspaceRecords();
  const [settings] = useWorkbenchSettings();
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
  const frequentAgents = collectTopItems(sortedTasks.flatMap((task) => task.selected_agent_names));
  const frequentPacks = collectTopItems(sortedTasks.flatMap((task) => task.selected_pack_names));
  const primaryMatter = visibleMatters[0] ?? null;
  const primaryDeliverable = recentDeliverables[0] ?? null;
  const primaryEvidenceTask = pendingEvidenceTasks[0] ?? null;
  const primaryMatterRecord =
    primaryMatter && isLocalFallbackMatterRecord(matterRecords[primaryMatter.id])
      ? matterRecords[primaryMatter.id]
      : null;
  const primaryDeliverableRecord =
    primaryDeliverable?.latest_deliverable_id &&
    isLocalFallbackDeliverableRecord(
      deliverableRecords[primaryDeliverable.latest_deliverable_id],
    )
      ? deliverableRecords[primaryDeliverable.latest_deliverable_id]
      : null;

  return (
    <main className="page-shell home-page-shell">
      <section className="hero-card overview-hero">
        <span className="eyebrow">總覽</span>
        <h1 className="page-title">總覽</h1>
        <p className="page-subtitle">先決定現在要回到哪個工作面，再繼續推進案件、交付物與證據整理。</p>

        <div className="summary-grid overview-summary-grid" style={{ marginTop: "20px" }}>
          <div className="section-card overview-focus-card">
            <h3>{pickFocusLabel(settings.homepageDisplayPreference)}</h3>
            <p className="content-block">
              {settings.homepageDisplayPreference === "deliverables"
                ? primaryDeliverableRecord?.title ||
                  primaryDeliverable?.latest_deliverable_title ||
                  "目前還沒有可直接回看的交付物。"
                : settings.homepageDisplayPreference === "evidence"
                  ? primaryEvidenceTask?.title || "目前沒有明顯待補資料。"
                  : primaryMatterRecord?.title ||
                    primaryMatter?.title ||
                    "目前還沒有進行中的案件。"}
            </p>
            <p className="muted-text">
              {settings.homepageDisplayPreference === "deliverables"
                ? truncateText(
                    primaryDeliverableRecord?.summary ||
                      primaryDeliverable?.latest_deliverable_summary ||
                      primaryDeliverable?.decision_context_title ||
                      "交付物 detail workspace 會顯示這次判斷的摘要與版本。",
                    88,
                  )
                : settings.homepageDisplayPreference === "evidence"
                  ? primaryEvidenceTask
                    ? buildGapNote(primaryEvidenceTask)
                    : "建立第一個案件後，待補資料入口會出現在這裡。"
                  : truncateText(
                      primaryMatterRecord?.summary ||
                        primaryMatter?.workspace_summary ||
                        primaryMatter?.current_decision_context_title ||
                        "案件 detail workspace 會承接目前的決策問題。",
                      88,
                    )}
            </p>
            <div className="button-row" style={{ marginTop: "12px" }}>
              {settings.homepageDisplayPreference === "deliverables" &&
              primaryDeliverable?.latest_deliverable_id ? (
                <Link
                  className="button-secondary"
                  href={`/deliverables/${primaryDeliverable.latest_deliverable_id}`}
                >
                  打開交付物工作面
                </Link>
              ) : null}
              {settings.homepageDisplayPreference === "evidence" && primaryEvidenceTask ? (
                <Link
                  className="button-secondary"
                  href={
                    primaryEvidenceTask.matter_workspace
                      ? `/matters/${primaryEvidenceTask.matter_workspace.id}/evidence`
                      : `/tasks/${primaryEvidenceTask.id}`
                  }
                >
                  打開待補資料
                </Link>
              ) : null}
              {settings.homepageDisplayPreference === "matters" && primaryMatter ? (
                <Link className="button-secondary" href={`/matters/${primaryMatter.id}`}>
                  打開案件工作面
                </Link>
              ) : null}
            </div>
          </div>

          <div className="section-card overview-metric-card">
            <h3>最近交付物</h3>
            <p className="workbench-metric">{recentDeliverables.length}</p>
            <p className="muted-text">
              {primaryDeliverable?.latest_deliverable_title || "目前還沒有正式交付成果。"}
            </p>
          </div>

          <div className="section-card overview-metric-card">
            <h3>待補資料</h3>
            <p className="workbench-metric">{pendingEvidenceTasks.length}</p>
            <p className="muted-text">
              {primaryEvidenceTask ? buildGapNote(primaryEvidenceTask) : "目前沒有急需補齊的資料缺口。"}
            </p>
          </div>

          <div className="section-card quick-start-card">
            <h3>建立新案件</h3>
            <p className="content-block">開始新的顧問工作流時，直接走正式進件頁，完成後會接回案件工作台。</p>
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
                  <h2 className="panel-title">繼續工作</h2>
                  <p className="panel-copy">從進行中案件直接回到工作面，先處理最接近現在的主線任務。</p>
                </div>
                <Link className="button-secondary" href="/matters">
                  查看全部案件
                </Link>
              </div>

              <div className="history-list">
                {visibleMatters.length > 0 ? (
                  visibleMatters.map((matter) => {
                    const workspaceCard = buildMatterWorkspaceCard(matter);
                    const fallbackRecord = isLocalFallbackMatterRecord(matterRecords[matter.id])
                      ? matterRecords[matter.id]
                      : null;

                    return (
                      <Link className="history-item" href={`/matters/${matter.id}`} key={matter.id}>
                        <div className="meta-row">
                          <span className="pill">{matter.active_task_count > 0 ? "進行中案件" : "回看案件"}</span>
                          <span>更新於 {formatDisplayDate(matter.latest_updated_at)}</span>
                        </div>
                        <h3>{fallbackRecord?.title || workspaceCard.title}</h3>
                        <p className="workspace-object-path">{workspaceCard.objectPath}</p>
                        <p className="content-block">
                          {truncateText(
                            fallbackRecord?.summary ||
                              matter.workspace_summary ||
                              matter.active_work_summary ||
                              workspaceCard.continuity,
                            112,
                          )}
                        </p>
                        <div className="meta-row">
                          <span>交付物 {matter.deliverable_count}</span>
                          <span>來源 {matter.source_material_count}</span>
                          <span>工作紀錄 {matter.total_task_count}</span>
                        </div>
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
                  <p className="panel-copy">保留少量最值得先回看的交付物入口，不讓首頁變成長列表。</p>
                </div>
                <Link className="button-secondary" href="/deliverables">
                  查看全部交付物
                </Link>
              </div>

              <div className="history-list">
                {recentDeliverables.length > 0 ? (
                  recentDeliverables.map((task) => {
                    const summary = buildTaskListWorkspaceSummary(task);
                    const fallbackRecord =
                      task.latest_deliverable_id &&
                      isLocalFallbackDeliverableRecord(
                        deliverableRecords[task.latest_deliverable_id],
                      )
                        ? deliverableRecords[task.latest_deliverable_id]
                        : null;

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
                        <h3>{fallbackRecord?.title || task.latest_deliverable_title || task.title}</h3>
                        <p className="workspace-object-path">{summary.objectPath}</p>
                        <p className="muted-text">
                          {truncateText(
                            fallbackRecord?.summary ||
                              task.latest_deliverable_summary ||
                              summary.decisionContext,
                            90,
                          )}
                        </p>
                      </Link>
                    );
                  })
                ) : (
                  <p className="empty-text">目前還沒有最近交付物。</p>
                )}
              </div>
            </section>

            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2 className="panel-title">待補資料 / 證據</h2>
                  <p className="panel-copy">先抓最需要補資料厚度的工作，再決定是否進到來源與證據工作面。</p>
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
                          <span>{task.evidence_count} 則證據</span>
                        </div>
                        <h3>{task.title}</h3>
                        <p className="workspace-object-path">{summary.objectPath}</p>
                        <p className="muted-text">{buildGapNote(task)}</p>
                      </Link>
                    );
                  })
                ) : (
                  <p className="empty-text">目前沒有明顯的待補資料 / 待補證據案件。</p>
                )}
              </div>
            </section>
          </div>

          <div className="detail-stack">
            {settings.showRecentActivity ? (
              <section className="panel">
                <div className="panel-header">
                  <div>
                    <h2 className="panel-title">最近活動</h2>
                    <p className="panel-copy">首頁只保留少量最近活動摘要，完整整理請到歷史紀錄頁。</p>
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
            ) : null}

            {settings.showFrequentExtensions ? (
              <section className="panel">
                <div className="panel-header">
                  <div>
                    <h2 className="panel-title">常用代理 / 模組包</h2>
                    <p className="panel-copy">高頻摘要只留在首頁；正式管理仍在代理管理與模組包管理頁。</p>
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
            ) : null}
          </div>
        </div>
      ) : null}
    </main>
  );
}
