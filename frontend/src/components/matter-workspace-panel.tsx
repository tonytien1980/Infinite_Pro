"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  buildMatterWorkspaceCard,
  buildMatterWorkspaceContinuity,
  buildTaskListWorkspaceSummary,
} from "@/lib/advisory-workflow";
import { getMatterWorkspace } from "@/lib/api";
import type { MatterWorkspace } from "@/lib/types";
import { formatDisplayDate, labelForTaskStatus } from "@/lib/ui-labels";

type MatterTab = "overview" | "decision" | "evidence" | "deliverables" | "history";

const MATTER_TABS: Array<{ key: MatterTab; label: string }> = [
  { key: "overview", label: "案件概覽" },
  { key: "decision", label: "決策問題" },
  { key: "evidence", label: "來源與證據" },
  { key: "deliverables", label: "交付物" },
  { key: "history", label: "工作紀錄" },
];

export function MatterWorkspacePanel({ matterId }: { matterId: string }) {
  const [matter, setMatter] = useState<MatterWorkspace | null>(null);
  const [activeTab, setActiveTab] = useState<MatterTab>("overview");
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

  const matterCard = matter ? buildMatterWorkspaceCard(matter.summary) : null;
  const continuity = matter ? buildMatterWorkspaceContinuity(matter) : null;
  const visibleHistoryItems = matter?.related_tasks.slice(0, 3) ?? [];
  const visibleMaterials = matter
    ? [...matter.related_artifacts, ...matter.related_source_materials].slice(0, 6)
    : [];

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

      {matter && matterCard && continuity ? (
        <>
          <section className="hero-card">
            <span className="eyebrow">案件工作台</span>
            <h1 className="page-title">{matterCard.title}</h1>
            <p className="page-subtitle">{matterCard.objectPath}</p>
            <div className="meta-row" style={{ marginTop: "16px" }}>
              {matterCard.counts.map((count) => (
                <span key={count}>{count}</span>
              ))}
              <span>更新於 {formatDisplayDate(matter.summary.latest_updated_at)}</span>
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
                <p className="muted-text">{matter.summary.active_work_summary}</p>
              </div>
              <div className="button-row">
                <Link className="button-secondary matter-hero-link" href={`/matters/${matterId}/evidence`}>
                  打開來源與證據
                </Link>
                <Link className="button-secondary matter-hero-link" href="/deliverables">
                  查看交付物
                </Link>
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
                      <h2 className="panel-title">案件概覽</h2>
                      <p className="panel-copy">
                        這裡承接客戶、案件委託、工作流與目前案件世界的主判斷脈絡，讓你先抓到整體工作位置，再決定要進哪個子工作面。
                      </p>
                    </div>
                  </div>
                  <div className="summary-grid">
                    <div className="section-card">
                      <h4>客戶</h4>
                      <p className="content-block">{matter.client?.name ?? "尚未明確標示"}</p>
                    </div>
                    <div className="section-card">
                      <h4>案件委託</h4>
                      <p className="content-block">{matter.engagement?.name ?? "尚未明確標示"}</p>
                    </div>
                    <div className="section-card">
                      <h4>工作流</h4>
                      <p className="content-block">{matter.workstream?.name ?? "尚未明確標示"}</p>
                    </div>
                    <div className="section-card">
                      <h4>目前主要決策問題</h4>
                      <p className="content-block">
                        {matter.current_decision_context?.title ||
                          matter.summary.current_decision_context_title ||
                          "尚未形成明確標題"}
                      </p>
                    </div>
                    <div className="section-card">
                      <h4>連續性摘要</h4>
                      <p className="content-block">{continuity.summary}</p>
                    </div>
                    <div className="section-card">
                      <h4>當前工作提示</h4>
                      <p className="content-block">{continuity.readinessHint}</p>
                    </div>
                    <div className="section-card">
                      <h4>模組包脈絡</h4>
                      <p className="content-block">{matterCard.packSummary}</p>
                    </div>
                    <div className="section-card">
                      <h4>代理脈絡</h4>
                      <p className="content-block">{matterCard.agentSummary}</p>
                    </div>
                  </div>
                </section>
              </div>

              <div className="detail-stack">
                <section className="panel">
                  <div className="panel-header">
                    <div>
                      <h2 className="panel-title">案件世界提示</h2>
                      <p className="panel-copy">這些提示幫你理解這個案件目前的工作連續性與主要壓力點。</p>
                    </div>
                  </div>
                  <div className="detail-item">
                    {matter.continuity_notes.length > 0 ? (
                      <ul className="list-content">
                        {matter.continuity_notes.map((note) => (
                          <li key={note}>{note}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="empty-text">目前沒有額外的案件世界提示。</p>
                    )}
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
                      <p className="panel-copy">這裡集中回看目前案件世界最重要的判斷問題、目標與限制，不讓它只散落在單一工作細節裡。</p>
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
                      <p className="panel-copy">回看這個案件世界最近的決策脈絡，理解不同工作紀錄如何沿著同一條問題主線推進。</p>
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
                      <h2 className="panel-title">來源與證據摘要</h2>
                      <p className="panel-copy">案件工作台只保留來源與證據的主摘要；完整來源角色、支撐鏈與缺口治理由獨立工作面承接。</p>
                    </div>
                    <Link className="button-secondary" href={`/matters/${matterId}/evidence`}>
                      打開來源與證據工作面
                    </Link>
                  </div>
                  <div className="summary-grid">
                    <div className="section-card">
                      <h4>工作物件</h4>
                      <p className="content-block">{matter.related_artifacts.length} 份</p>
                    </div>
                    <div className="section-card">
                      <h4>來源材料</h4>
                      <p className="content-block">{matter.related_source_materials.length} 份</p>
                    </div>
                    <div className="section-card">
                      <h4>就緒度 / 連續性提示</h4>
                      <p className="content-block">{matter.readiness_hint}</p>
                    </div>
                    <div className="section-card">
                      <h4>當前判斷脈絡</h4>
                      <p className="content-block">
                        {continuity.materialHighlights.length > 0
                          ? continuity.materialHighlights.join("、")
                          : "目前還沒有可顯示的來源與證據脈絡。"}
                      </p>
                    </div>
                  </div>
                </section>
              </div>

              <div className="detail-stack">
                <section className="panel">
                  <div className="panel-header">
                    <div>
                      <h2 className="panel-title">最近相關來源</h2>
                      <p className="panel-copy">這裡只保留最近 6 筆相關 materials，幫你快速定位案件世界中的主要來源工作物件。</p>
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
                      <p className="panel-copy">交付物已有獨立正式頁；案件工作台只保留與此案件世界有關的最近交付入口與脈絡。</p>
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
                          <Link className="back-link" href={`/deliverables/${item.deliverable_id}`}>
                            打開這份交付物
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
                      <h2 className="panel-title">最近 3 筆工作紀錄</h2>
                      <p className="panel-copy">案件頁只保留少量最近工作紀錄，完整回看已抽離到正式歷史紀錄頁。</p>
                    </div>
                    <Link className="button-secondary" href="/history">
                      查看全部
                    </Link>
                  </div>
                  <div className="detail-list">
                    {visibleHistoryItems.length > 0 ? (
                      visibleHistoryItems.map((task) => {
                        const taskSummary = buildTaskListWorkspaceSummary(task);
                        return (
                          <Link className="detail-item" href={`/tasks/${task.id}`} key={task.id}>
                            <div className="meta-row">
                              <span className="pill">{labelForTaskStatus(task.status)}</span>
                              <span>{formatDisplayDate(task.updated_at)}</span>
                            </div>
                            <h3>{task.title}</h3>
                            <p className="workspace-object-path">{taskSummary.objectPath}</p>
                            <p className="muted-text">{taskSummary.decisionContext}</p>
                            <p className="muted-text">{taskSummary.packSummary}</p>
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
