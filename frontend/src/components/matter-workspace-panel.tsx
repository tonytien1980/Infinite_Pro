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

export function MatterWorkspacePanel({ matterId }: { matterId: string }) {
  const [matter, setMatter] = useState<MatterWorkspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        setError(null);
        setMatter(await getMatterWorkspace(matterId));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "載入案件工作面失敗。");
      } finally {
        setLoading(false);
      }
    })();
  }, [matterId]);

  const matterCard = matter ? buildMatterWorkspaceCard(matter.summary) : null;
  const continuity = matter ? buildMatterWorkspaceContinuity(matter) : null;

  return (
    <main className="page-shell">
      <div className="back-link-group">
        <Link className="back-link" href="/">
          ← 返回工作台
        </Link>
      </div>

      {loading ? <p className="status-text">正在載入案件工作面...</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      {matter && matterCard && continuity ? (
        <>
          <section className="hero-card">
            <span className="eyebrow">Infinite Pro Matter / Engagement Workspace</span>
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
                <span className="pill">Decision Context</span>
                <p className="workspace-object-path" style={{ marginTop: "10px" }}>
                  {matterCard.decisionContext}
                </p>
                <p className="muted-text">{matterCard.continuity}</p>
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">案件工作面摘要</h2>
                <p className="panel-copy">
                  這裡是單人版正式的 Matter / Engagement Workspace。你不是在看單次 task，而是在看同一個 client /
                  engagement / workstream 下持續累積的案件世界。
                </p>
              </div>
            </div>
            <div className="summary-grid">
              <div className="section-card">
                <h4>連續性摘要</h4>
                <p className="content-block">{continuity.summary}</p>
              </div>
              <div className="section-card">
                <h4>Readiness / Continuity Hint</h4>
                <p className="content-block">{continuity.readinessHint}</p>
              </div>
              <div className="section-card">
                <h4>Pack Context</h4>
                <p className="content-block">{matterCard.packSummary}</p>
              </div>
              <div className="section-card">
                <h4>Agent Context</h4>
                <p className="content-block">{matterCard.agentSummary}</p>
              </div>
            </div>
            {matter.continuity_notes.length > 0 ? (
              <div className="detail-item" style={{ marginTop: "16px" }}>
                <h3>案件世界提示</h3>
                <ul className="list-content">
                  {matter.continuity_notes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>

          <div className="detail-grid">
            <div className="detail-stack">
              <section className="panel">
                <div className="panel-header">
                  <div>
                    <h2 className="panel-title">Decision Trajectory</h2>
                    <p className="panel-copy">
                      這裡回看這個案件世界最近的 decision contexts 與判斷方向，讓同一個 engagement 下的連續性不再散落在單一 task 裡。
                    </p>
                  </div>
                </div>
                <div className="detail-list">
                  {matter.decision_trajectory.length > 0 ? (
                    matter.decision_trajectory.map((item) => (
                      <div className="detail-item" key={`${item.task_id}-${item.decision_context_id ?? item.decision_context_title}`}>
                        <div className="meta-row">
                          <span className="pill">{labelForTaskStatus(item.task_status)}</span>
                          <span>{item.decision_context_title}</span>
                          <span>{formatDisplayDate(item.updated_at)}</span>
                        </div>
                        <h3>{item.task_title}</h3>
                        <p className="content-block">{item.judgment_to_make}</p>
                        <Link className="back-link" href={`/tasks/${item.task_id}`}>
                          進入這個 task 的 Decision Workspace
                        </Link>
                      </div>
                    ))
                  ) : (
                    <p className="empty-text">目前還沒有可顯示的 decision trajectory。</p>
                  )}
                </div>
              </section>

              <section className="panel">
                <div className="panel-header">
                  <div>
                    <h2 className="panel-title">Related Tasks</h2>
                    <p className="panel-copy">
                      同一個案件世界下的 task 現在已串在一起，你可以直接回到某次分析或交付生成的工作面。
                    </p>
                  </div>
                </div>
                <div className="history-list">
                  {matter.related_tasks.length > 0 ? (
                    matter.related_tasks.map((task) => {
                      const taskSummary = buildTaskListWorkspaceSummary(task);
                      return (
                        <Link href={`/tasks/${task.id}`} key={task.id} className="history-item">
                          <div className="meta-row">
                            <span className="pill">{labelForTaskStatus(task.status)}</span>
                            <span>{formatDisplayDate(task.updated_at)}</span>
                          </div>
                          <h3>{task.title}</h3>
                          <p className="workspace-object-path">{taskSummary.objectPath}</p>
                          <p className="muted-text">{taskSummary.decisionContext}</p>
                          <p className="muted-text">{taskSummary.packSummary}</p>
                          <p className="muted-text">{taskSummary.agentSummary}</p>
                        </Link>
                      );
                    })
                  ) : (
                    <p className="empty-text">目前沒有可顯示的 related tasks。</p>
                  )}
                </div>
              </section>
            </div>

            <div className="detail-stack">
              <section className="panel">
                <div className="panel-header">
                  <div>
                    <h2 className="panel-title">Recent Deliverables</h2>
                    <p className="panel-copy">
                      這些 deliverables 現在是案件世界的一部分，不再只是某個 task 內的結果 blob。
                    </p>
                  </div>
                </div>
                <div className="detail-list">
                  {matter.related_deliverables.length > 0 ? (
                    matter.related_deliverables.map((item) => (
                      <div className="detail-item" key={item.deliverable_id}>
                        <div className="meta-row">
                          <span className="pill">Deliverable</span>
                          <span>v{item.version}</span>
                          <span>{formatDisplayDate(item.generated_at)}</span>
                        </div>
                        <h3>{item.title}</h3>
                        <p className="muted-text">{item.task_title}</p>
                        <p className="content-block">
                          {item.decision_context_title || "目前沒有可顯示的 decision context。"}
                        </p>
                        <Link className="back-link" href={`/tasks/${item.task_id}`}>
                          打開來源 task
                        </Link>
                      </div>
                    ))
                  ) : (
                    <p className="empty-text">目前還沒有可顯示的 related deliverables。</p>
                  )}
                </div>
              </section>

              <section className="panel">
                <div className="panel-header">
                  <div>
                    <h2 className="panel-title">Related Artifacts / Source Materials</h2>
                    <p className="panel-copy">
                      這些材料是目前案件世界下可回看的最小工作鏈。Artifact / Evidence Workspace Completion 之後會再把這條工作面獨立做滿。
                    </p>
                  </div>
                </div>
                <div className="detail-list">
                  {[...matter.related_artifacts, ...matter.related_source_materials].length > 0 ? (
                    [...matter.related_artifacts, ...matter.related_source_materials]
                      .slice(0, 8)
                      .map((item) => (
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
                    <p className="empty-text">目前還沒有可顯示的 related artifacts 或 source materials。</p>
                  )}
                </div>
              </section>
            </div>
          </div>
        </>
      ) : null}
    </main>
  );
}
