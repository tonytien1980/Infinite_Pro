"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { buildTaskListWorkspaceSummary } from "@/lib/advisory-workflow";
import { getMatterWorkspace } from "@/lib/api";
import type { MatterWorkspace, TaskListItem } from "@/lib/types";
import {
  formatDisplayDate,
  labelForDeliverableClass,
  labelForMatterStatus,
  labelForTaskStatus,
} from "@/lib/ui-labels";
import {
  type MatterLifecycleStatus,
  nowIsoString,
  useMatterWorkspaceRecords,
} from "@/lib/workbench-store";

type MatterTab = "overview" | "decision" | "evidence" | "deliverables" | "history";

const MATTER_TABS: Array<{ key: MatterTab; label: string }> = [
  { key: "overview", label: "案件概覽" },
  { key: "decision", label: "決策問題" },
  { key: "evidence", label: "來源與證據" },
  { key: "deliverables", label: "交付物" },
  { key: "history", label: "工作紀錄" },
];

function defaultMatterStatus(matter: MatterWorkspace) {
  return matter.summary.active_task_count > 0 ? "active" : "paused";
}

function collectNames(tasks: TaskListItem[], key: "selected_agent_names" | "selected_pack_names") {
  return Array.from(
    new Set(
      tasks.flatMap((task) => task[key]).filter(Boolean),
    ),
  );
}

export function MatterWorkspacePanel({ matterId }: { matterId: string }) {
  const [matter, setMatter] = useState<MatterWorkspace | null>(null);
  const [activeTab, setActiveTab] = useState<MatterTab>("overview");
  const [matterRecords, setMatterRecords] = useMatterWorkspaceRecords();
  const [draftTitle, setDraftTitle] = useState("");
  const [draftSummary, setDraftSummary] = useState("");
  const [draftStatus, setDraftStatus] = useState<MatterLifecycleStatus>("active");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        setError(null);
        setMatter(await getMatterWorkspace(matterId));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "載入案件工作台失敗。");
      } finally {
        setLoading(false);
      }
    })();
  }, [matterId]);

  useEffect(() => {
    if (!matter) {
      return;
    }

    const record = matterRecords[matterId];
    setDraftTitle(record?.title || matter.summary.title);
    setDraftSummary(
      record?.summary ||
        matter.summary.active_work_summary ||
        matter.summary.continuity_summary ||
        "",
    );
    setDraftStatus(record?.status || defaultMatterStatus(matter));
  }, [matter, matterId, matterRecords]);

  const matterStatus = matter
    ? matterRecords[matterId]?.status || defaultMatterStatus(matter)
    : "active";
  const displayTitle = matter ? matterRecords[matterId]?.title || matter.summary.title : "";
  const displaySummary = matter
    ? matterRecords[matterId]?.summary ||
      matter.summary.active_work_summary ||
      matter.summary.continuity_summary ||
      "目前尚未補上案件摘要。"
    : "";
  const evidenceCount = matter
    ? matter.related_tasks.reduce((total, task) => total + task.evidence_count, 0)
    : 0;
  const agentNames = matter ? collectNames(matter.related_tasks, "selected_agent_names") : [];
  const packNames = matter ? collectNames(matter.related_tasks, "selected_pack_names") : [];
  const visibleHistoryItems = matter?.related_tasks.slice(0, 5) ?? [];
  const visibleMaterials = matter
    ? [...matter.related_artifacts, ...matter.related_source_materials].slice(0, 6)
    : [];
  const latestDeliverable = matter?.related_deliverables[0] ?? null;

  function handleSave() {
    if (!matter) {
      return;
    }

    setMatterRecords((current) => ({
      ...current,
      [matterId]: {
        title: draftTitle.trim() || matter.summary.title,
        summary: draftSummary.trim() || matter.summary.active_work_summary,
        status: draftStatus,
        updatedAt: nowIsoString(),
      },
    }));
    setSaveMessage("案件基本資訊已更新。");
  }

  return (
    <main className="page-shell">
      <div className="back-link-group">
        <Link className="back-link" href="/matters">
          ← 返回案件工作台
        </Link>
        <Link className="back-link" href="/">
          ← 返回總覽
        </Link>
      </div>

      {loading ? <p className="status-text">正在載入案件工作台...</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      {matter ? (
        <>
          <section className="hero-card">
            <span className="eyebrow">案件工作台</span>
            <h1 className="page-title">{displayTitle}</h1>
            <p className="page-subtitle">管理這個案件的決策問題、來源與證據、交付物與工作紀錄。</p>
            <div className="meta-row" style={{ marginTop: "16px" }}>
              <span className="pill">{labelForMatterStatus(matterStatus)}</span>
              <span>更新於 {formatDisplayDate(matter.summary.latest_updated_at)}</span>
              <span>來源 {matter.summary.source_material_count}</span>
              <span>證據 {evidenceCount}</span>
              <span>交付物 {matter.summary.deliverable_count}</span>
              <span>工作紀錄 {matter.summary.total_task_count}</span>
            </div>

            <div className="matter-hero-strip">
              <div>
                <span className="pill">目前主要決策問題</span>
                <p className="workspace-object-path" style={{ marginTop: "10px" }}>
                  {matter.current_decision_context?.judgment_to_make ||
                    matter.current_decision_context?.title ||
                    matter.summary.current_decision_context_title ||
                    "目前尚未形成清楚的決策問題。"}
                </p>
                <p className="muted-text">{displaySummary}</p>
              </div>
              <div className="button-row">
                <Link className="button-secondary matter-hero-link" href={`/matters/${matterId}/evidence`}>
                  打開來源與證據
                </Link>
                {latestDeliverable ? (
                  <Link
                    className="button-secondary matter-hero-link"
                    href={`/deliverables/${latestDeliverable.deliverable_id}`}
                  >
                    打開最近交付物
                  </Link>
                ) : (
                  <Link className="button-secondary matter-hero-link" href="/deliverables">
                    查看交付物
                  </Link>
                )}
              </div>
            </div>
          </section>

          <div className="page-tabs" role="tablist" aria-label="案件工作面頁籤">
            {MATTER_TABS.map((tab) => (
              <button
                key={tab.key}
                className={`page-tab${activeTab === tab.key ? " page-tab-active" : ""}`}
                type="button"
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "overview" ? (
            <div className="detail-grid">
              <div className="detail-stack">
                <section className="panel">
                  <div className="panel-header">
                    <div>
                      <h2 className="panel-title">案件基本資訊</h2>
                      <p className="panel-copy">先把案件名稱、摘要與狀態維持乾淨，之後再沿著各個工作面往下做。</p>
                    </div>
                  </div>

                  <div className="form-grid">
                    <div className="field">
                      <label htmlFor="matter-title">案件名稱</label>
                      <input
                        id="matter-title"
                        value={draftTitle}
                        onChange={(event) => {
                          setDraftTitle(event.target.value);
                          setSaveMessage(null);
                        }}
                      />
                    </div>

                    <div className="field">
                      <label htmlFor="matter-status">狀態</label>
                      <select
                        id="matter-status"
                        value={draftStatus}
                        onChange={(event) => {
                          setDraftStatus(event.target.value as MatterLifecycleStatus);
                          setSaveMessage(null);
                        }}
                      >
                        <option value="active">進行中</option>
                        <option value="paused">暫停</option>
                        <option value="archived">封存</option>
                      </select>
                    </div>

                    <div className="field">
                      <label htmlFor="matter-summary">簡短摘要</label>
                      <textarea
                        id="matter-summary"
                        value={draftSummary}
                        onChange={(event) => {
                          setDraftSummary(event.target.value);
                          setSaveMessage(null);
                        }}
                        placeholder="這個案件目前正在處理的核心狀況、範圍或下一步。"
                      />
                    </div>
                  </div>

                  <div className="button-row" style={{ marginTop: "16px" }}>
                    <button className="button-primary" type="button" onClick={handleSave}>
                      儲存案件資訊
                    </button>
                  </div>
                  {saveMessage ? <p className="success-text">{saveMessage}</p> : null}
                </section>

                <section className="panel">
                  <div className="panel-header">
                    <div>
                      <h2 className="panel-title">工作面摘要</h2>
                      <p className="panel-copy">用一眼可掃的骨架確認現在這個案件有哪些可直接進入的工作面。</p>
                    </div>
                  </div>

                  <div className="summary-grid">
                    <div className="section-card">
                      <h4>決策問題</h4>
                      <p className="content-block">
                        {matter.current_decision_context?.title ||
                          matter.summary.current_decision_context_title ||
                          "尚未形成明確標題"}
                      </p>
                    </div>
                    <div className="section-card">
                      <h4>客戶 / 案件路徑</h4>
                      <p className="content-block">{matter.summary.object_path}</p>
                    </div>
                    <div className="section-card">
                      <h4>使用中的代理</h4>
                      <p className="content-block">
                        {agentNames.length > 0 ? agentNames.slice(0, 5).join("、") : "目前尚未顯示代理。"}
                      </p>
                    </div>
                    <div className="section-card">
                      <h4>使用中的模組包</h4>
                      <p className="content-block">
                        {packNames.length > 0 ? packNames.slice(0, 5).join("、") : "目前尚未顯示模組包。"}
                      </p>
                    </div>
                    <div className="section-card">
                      <h4>來源與證據</h4>
                      <p className="content-block">
                        {matter.summary.source_material_count} 份來源材料，{evidenceCount} 則證據。
                      </p>
                    </div>
                    <div className="section-card">
                      <h4>交付物與紀錄</h4>
                      <p className="content-block">
                        {matter.summary.deliverable_count} 份交付物，{matter.summary.total_task_count} 筆工作紀錄。
                      </p>
                    </div>
                  </div>
                </section>
              </div>

              <div className="detail-stack">
                <section className="panel">
                  <div className="panel-header">
                    <div>
                      <h2 className="panel-title">案件概覽</h2>
                      <p className="panel-copy">先掌握這個案件現在卡在哪裡，再決定往哪個頁籤深入。</p>
                    </div>
                  </div>

                  <div className="detail-list">
                    <div className="detail-item">
                      <h3>客戶</h3>
                      <p className="content-block">{matter.client?.name ?? "尚未明確標示"}</p>
                    </div>
                    <div className="detail-item">
                      <h3>案件委託</h3>
                      <p className="content-block">{matter.engagement?.name ?? "尚未明確標示"}</p>
                    </div>
                    <div className="detail-item">
                      <h3>工作流</h3>
                      <p className="content-block">{matter.workstream?.name ?? "尚未明確標示"}</p>
                    </div>
                    <div className="detail-item">
                      <h3>工作提示</h3>
                      <p className="content-block">{matter.readiness_hint}</p>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          ) : null}

          {activeTab === "decision" ? (
            <div className="detail-grid">
              <div className="detail-stack">
                <section className="panel">
                  <div className="panel-header">
                    <div>
                      <h2 className="panel-title">當前決策問題</h2>
                      <p className="panel-copy">這個區塊用來穩定承接案件目前的判斷主線。</p>
                    </div>
                  </div>
                  <div className="detail-item">
                    <div className="meta-row">
                      <span className="pill">決策問題</span>
                    </div>
                    <h3>{matter.current_decision_context?.title || "尚未形成標題"}</h3>
                    <p className="content-block">
                      {matter.current_decision_context?.judgment_to_make ||
                        matter.current_decision_context?.summary ||
                        "目前還沒有足夠資料形成清楚的決策問題。"}
                    </p>
                  </div>
                </section>
              </div>

              <div className="detail-stack">
                <section className="panel">
                  <div className="panel-header">
                    <div>
                      <h2 className="panel-title">決策脈絡</h2>
                      <p className="panel-copy">用最近幾筆 decision trajectory 回看這個案件是怎麼一路推進過來的。</p>
                    </div>
                  </div>
                  <div className="detail-list">
                    {matter.decision_trajectory.length > 0 ? (
                      matter.decision_trajectory.map((item) => (
                        <div
                          className="detail-item"
                          key={`${item.task_id}-${item.decision_context_id ?? item.decision_context_title}`}
                        >
                          <div className="meta-row">
                            <span className="pill">{labelForTaskStatus(item.task_status)}</span>
                            <span>{labelForDeliverableClass(item.deliverable_class_hint)}</span>
                            <span>{formatDisplayDate(item.updated_at)}</span>
                          </div>
                          <h3>{item.decision_context_title}</h3>
                          <p className="muted-text">{item.task_title}</p>
                          <p className="content-block">{item.judgment_to_make}</p>
                          <Link className="back-link" href={`/tasks/${item.task_id}`}>
                            進入這筆工作紀錄
                          </Link>
                        </div>
                      ))
                    ) : (
                      <p className="empty-text">目前還沒有可顯示的決策脈絡。</p>
                    )}
                  </div>
                </section>
              </div>
            </div>
          ) : null}

          {activeTab === "evidence" ? (
            <div className="detail-grid">
              <div className="detail-stack">
                <section className="panel">
                  <div className="panel-header">
                    <div>
                      <h2 className="panel-title">來源與證據</h2>
                      <p className="panel-copy">先看總量與最近材料，再決定要不要進完整的來源與證據工作面整理。</p>
                    </div>
                    <Link className="button-secondary" href={`/matters/${matterId}/evidence`}>
                      打開來源與證據工作面
                    </Link>
                  </div>

                  <div className="summary-grid">
                    <div className="section-card">
                      <h4>來源材料</h4>
                      <p className="content-block">{matter.summary.source_material_count} 份</p>
                    </div>
                    <div className="section-card">
                      <h4>工作物件</h4>
                      <p className="content-block">{matter.summary.artifact_count} 份</p>
                    </div>
                    <div className="section-card">
                      <h4>證據</h4>
                      <p className="content-block">{evidenceCount} 則</p>
                    </div>
                    <div className="section-card">
                      <h4>目前提醒</h4>
                      <p className="content-block">{matter.readiness_hint}</p>
                    </div>
                  </div>
                </section>
              </div>

              <div className="detail-stack">
                <section className="panel">
                  <div className="panel-header">
                    <div>
                      <h2 className="panel-title">最近相關材料</h2>
                      <p className="panel-copy">保留少量最近材料，讓你快速回到案件的主依據。</p>
                    </div>
                  </div>
                  <div className="detail-list">
                    {visibleMaterials.length > 0 ? (
                      visibleMaterials.map((item) => (
                        <div className="detail-item" key={`${item.object_type}-${item.object_id}`}>
                          <div className="meta-row">
                            <span className="pill">{item.object_type}</span>
                            <span>{formatDisplayDate(item.created_at)}</span>
                          </div>
                          <h3>{item.title}</h3>
                          <p className="muted-text">{item.task_title}</p>
                          <p className="content-block">{item.summary || "目前沒有額外摘要。"}</p>
                        </div>
                      ))
                    ) : (
                      <p className="empty-text">目前還沒有可顯示的來源或證據材料。</p>
                    )}
                  </div>
                </section>
              </div>
            </div>
          ) : null}

          {activeTab === "deliverables" ? (
            <div className="detail-grid">
              <div className="detail-stack">
                <section className="panel">
                  <div className="panel-header">
                    <div>
                      <h2 className="panel-title">交付物</h2>
                      <p className="panel-copy">從這裡直接進到交付物 detail workspace，繼續編修狀態、版本與內容判讀。</p>
                    </div>
                    <Link className="button-secondary" href="/deliverables">
                      查看全部交付物
                    </Link>
                  </div>
                  <div className="detail-list">
                    {matter.related_deliverables.length > 0 ? (
                      matter.related_deliverables.map((item) => (
                        <div className="detail-item" key={item.deliverable_id}>
                          <div className="meta-row">
                            <span className="pill">交付物</span>
                            <span>v{item.version}</span>
                            <span>{formatDisplayDate(item.generated_at)}</span>
                          </div>
                          <h3>{item.title}</h3>
                          <p className="muted-text">{item.task_title}</p>
                          <p className="content-block">
                            {item.decision_context_title || "目前沒有可顯示的決策問題摘要。"}
                          </p>
                          <Link className="button-secondary" href={`/deliverables/${item.deliverable_id}`}>
                            打開交付物工作面
                          </Link>
                        </div>
                      ))
                    ) : (
                      <p className="empty-text">目前還沒有可顯示的交付物。</p>
                    )}
                  </div>
                </section>
              </div>
            </div>
          ) : null}

          {activeTab === "history" ? (
            <div className="detail-grid">
              <div className="detail-stack">
                <section className="panel">
                  <div className="panel-header">
                    <div>
                      <h2 className="panel-title">工作紀錄</h2>
                      <p className="panel-copy">案件 detail 先保留最近幾筆工作紀錄，完整整理仍回到歷史紀錄頁進行。</p>
                    </div>
                    <Link className="button-secondary" href="/history">
                      查看全部歷史紀錄
                    </Link>
                  </div>
                  <div className="detail-list">
                    {visibleHistoryItems.length > 0 ? (
                      visibleHistoryItems.map((task) => {
                        const summary = buildTaskListWorkspaceSummary(task);

                        return (
                          <Link className="detail-item" href={`/tasks/${task.id}`} key={task.id}>
                            <div className="meta-row">
                              <span className="pill">{labelForTaskStatus(task.status)}</span>
                              <span>{formatDisplayDate(task.updated_at)}</span>
                            </div>
                            <h3>{task.title}</h3>
                            <p className="workspace-object-path">{summary.objectPath}</p>
                            <p className="muted-text">{summary.decisionContext}</p>
                            <p className="muted-text">{summary.packSummary}</p>
                          </Link>
                        );
                      })
                    ) : (
                      <p className="empty-text">目前沒有可顯示的工作紀錄。</p>
                    )}
                  </div>
                </section>
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </main>
  );
}
