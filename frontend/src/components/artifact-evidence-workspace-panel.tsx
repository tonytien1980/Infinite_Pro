"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  buildArtifactEvidenceWorkspaceView,
  buildMatterWorkspaceCard,
} from "@/lib/advisory-workflow";
import { getArtifactEvidenceWorkspace } from "@/lib/api";
import type { ArtifactEvidenceWorkspace } from "@/lib/types";
import {
  formatDisplayDate,
  labelForEvidenceStrength,
  labelForEvidenceType,
  labelForPresenceState,
  labelForSourceType,
  labelForTaskStatus,
} from "@/lib/ui-labels";

function CompactList({
  items,
  emptyText,
}: {
  items: string[];
  emptyText: string;
}) {
  if (items.length === 0) {
    return <p className="empty-text">{emptyText}</p>;
  }

  return (
    <ul className="list-content">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export function ArtifactEvidenceWorkspacePanel({ matterId }: { matterId: string }) {
  const [workspace, setWorkspace] = useState<ArtifactEvidenceWorkspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        setError(null);
        setWorkspace(await getArtifactEvidenceWorkspace(matterId));
      } catch (loadError) {
        setError(
          loadError instanceof Error ? loadError.message : "載入來源 / 證據工作面失敗。",
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [matterId]);

  const matterCard = workspace ? buildMatterWorkspaceCard(workspace.matter_summary) : null;
  const workspaceView = workspace ? buildArtifactEvidenceWorkspaceView(workspace) : null;

  return (
    <main className="page-shell">
      <div className="back-link-group">
        <Link className="back-link" href="/">
          ← 返回工作台
        </Link>
        <Link className="back-link" href={`/matters/${matterId}`}>
          ← 返回案件工作面
        </Link>
      </div>

      {loading ? <p className="status-text">正在載入來源 / 證據工作面...</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      {workspace && matterCard && workspaceView ? (
        <>
          <section className="hero-card">
            <span className="eyebrow">Infinite Pro Artifact / Evidence Workspace</span>
            <h1 className="page-title">{matterCard.title}</h1>
            <p className="page-subtitle">{matterCard.objectPath}</p>
            <div className="meta-row" style={{ marginTop: "16px" }}>
              <span>{workspace.source_material_cards.length} 份 source materials</span>
              <span>{workspace.artifact_cards.length} 份 artifacts</span>
              <span>{workspace.evidence_chains.length} 則 evidence chains</span>
            </div>
            <div className="matter-hero-strip">
              <div>
                <span className="pill">Decision Context</span>
                <p className="workspace-object-path" style={{ marginTop: "10px" }}>
                  {workspace.current_decision_context?.judgment_to_make ||
                    workspace.current_decision_context?.title ||
                    "目前尚未形成清楚的 DecisionContext。"}
                </p>
                <p className="muted-text">{workspaceView.summary}</p>
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">來源 / 證據工作面摘要</h2>
                <p className="panel-copy">
                  這裡已是正式的 Artifact / Evidence Workspace，不再只是 supporting context。你可以在這裡回看來源、Evidence
                  支撐鏈、以及目前限制更高等級 deliverable 的高影響缺口。
                </p>
              </div>
            </div>
            <div className="summary-grid">
              <div className="section-card">
                <h4>Sufficiency Summary</h4>
                <p className="content-block">{workspace.sufficiency_summary}</p>
              </div>
              <div className="section-card">
                <h4>Evidence Expectations</h4>
                <CompactList
                  items={workspaceView.evidenceExpectations}
                  emptyText="目前沒有額外 evidence expectations。"
                />
              </div>
              <div className="section-card">
                <h4>High-Impact Gaps</h4>
                <CompactList
                  items={workspaceView.highImpactGaps}
                  emptyText="目前沒有額外的高影響缺口。"
                />
              </div>
              <div className="section-card">
                <h4>Deliverable Limits</h4>
                <CompactList
                  items={workspaceView.deliverableLimitations}
                  emptyText="目前沒有額外的 deliverable 限制提示。"
                />
              </div>
            </div>
            {workspace.continuity_notes.length > 0 ? (
              <div className="detail-item" style={{ marginTop: "16px" }}>
                <h3>Continuity Notes</h3>
                <CompactList
                  items={workspace.continuity_notes}
                  emptyText="目前沒有額外 continuity notes。"
                />
              </div>
            ) : null}
          </section>

          <div className="detail-grid">
            <div className="detail-stack">
              <section className="panel">
                <div className="panel-header">
                  <div>
                    <h2 className="panel-title">Source Materials</h2>
                    <p className="panel-copy">
                      這些是目前案件世界內可直接回看的來源材料。你可以看到哪些是主要來源、哪些仍待補強，以及它們已連出多少 evidence / outputs。
                    </p>
                  </div>
                </div>
                <div className="detail-list">
                  {workspace.source_material_cards.length > 0 ? (
                    workspace.source_material_cards.map((item) => (
                      <div className="detail-item" key={item.object_id}>
                        <div className="meta-row">
                          <span className="pill">{item.role_label}</span>
                          <span>{labelForPresenceState(item.presence_state)}</span>
                          <span>{item.ingest_status || "未標示 ingest 狀態"}</span>
                          <span>{formatDisplayDate(item.created_at)}</span>
                        </div>
                        <h3>{item.title}</h3>
                        <p className="muted-text">
                          {labelForSourceType(item.source_type || "manual_input")}
                          {item.source_ref ? `｜${item.source_ref}` : ""}
                        </p>
                        <p className="content-block">{item.summary || "目前沒有可顯示的來源摘要。"}</p>
                        <div className="meta-row">
                          <span>{item.linked_evidence_count} 則 linked evidence</span>
                          <span>{item.linked_output_count} 項 linked outputs</span>
                        </div>
                        <Link className="back-link" href={`/tasks/${item.task_id}`}>
                          打開來源 task：{item.task_title}
                        </Link>
                      </div>
                    ))
                  ) : (
                    <p className="empty-text">目前還沒有可顯示的 source materials。</p>
                  )}
                </div>
              </section>

              <section className="panel">
                <div className="panel-header">
                  <div>
                    <h2 className="panel-title">Artifacts</h2>
                    <p className="panel-copy">
                      這些是目前案件世界中的可回看 artifact。它們不是 raw 附件清單，而是已正式進入來源 / 證據工作面的工作物件。
                    </p>
                  </div>
                </div>
                <div className="detail-list">
                  {workspace.artifact_cards.length > 0 ? (
                    workspace.artifact_cards.map((item) => (
                      <div className="detail-item" key={item.object_id}>
                        <div className="meta-row">
                          <span className="pill">{item.role_label}</span>
                          <span>{labelForPresenceState(item.presence_state)}</span>
                          <span>{formatDisplayDate(item.created_at)}</span>
                        </div>
                        <h3>{item.title}</h3>
                        <p className="content-block">{item.summary || "目前沒有額外 artifact 摘要。"}</p>
                        <div className="meta-row">
                          <span>{item.linked_evidence_count} 則 linked evidence</span>
                          <span>{item.linked_output_count} 項 linked outputs</span>
                        </div>
                        <Link className="back-link" href={`/tasks/${item.task_id}`}>
                          打開來源 task：{item.task_title}
                        </Link>
                      </div>
                    ))
                  ) : (
                    <p className="empty-text">目前還沒有可顯示的 artifacts。</p>
                  )}
                </div>
              </section>
            </div>

            <div className="detail-stack">
              <section className="panel">
                <div className="panel-header">
                  <div>
                    <h2 className="panel-title">Evidence Support Chains</h2>
                    <p className="panel-copy">
                      這裡正式顯示 evidence 對 recommendation / risk / action 的支撐鏈，不再只是 payload 裡的 refs。
                    </p>
                  </div>
                </div>
                <div className="detail-list">
                  {workspace.evidence_chains.length > 0 ? (
                    workspace.evidence_chains.map((item) => (
                      <div className="detail-item" key={item.evidence.id}>
                        <div className="meta-row">
                          <span className="pill">{labelForEvidenceType(item.evidence.evidence_type)}</span>
                          <span>{labelForEvidenceStrength(item.strength_label)}</span>
                          <span>{item.evidence.reliability_level}</span>
                          <span>{formatDisplayDate(item.evidence.created_at)}</span>
                        </div>
                        <h3>{item.evidence.title}</h3>
                        <p className="muted-text">
                          {item.source_material_title ? `SourceMaterial：${item.source_material_title}` : "尚未連到 SourceMaterial"}
                          {"｜"}
                          {item.artifact_title ? `Artifact：${item.artifact_title}` : "尚未連到 Artifact"}
                        </p>
                        <p className="content-block">{item.evidence.excerpt_or_summary}</p>
                        <p className="muted-text">{item.sufficiency_note}</p>

                        {item.linked_recommendations.length > 0 ? (
                          <div style={{ marginTop: "12px" }}>
                            <h3>Recommendations</h3>
                            <ul className="list-content">
                              {item.linked_recommendations.map((target) => (
                                <li key={`${item.evidence.id}-recommendation-${target.target_id}`}>
                                  {target.title}
                                  {target.note ? `｜${target.note}` : ""}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}

                        {item.linked_risks.length > 0 ? (
                          <div style={{ marginTop: "12px" }}>
                            <h3>Risks</h3>
                            <ul className="list-content">
                              {item.linked_risks.map((target) => (
                                <li key={`${item.evidence.id}-risk-${target.target_id}`}>
                                  {target.title}
                                  {target.note ? `｜${target.note}` : ""}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}

                        {item.linked_action_items.length > 0 ? (
                          <div style={{ marginTop: "12px" }}>
                            <h3>Action Items</h3>
                            <ul className="list-content">
                              {item.linked_action_items.map((target) => (
                                <li key={`${item.evidence.id}-action-${target.target_id}`}>
                                  {target.title}
                                  {target.note ? `｜${target.note}` : ""}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}

                        {item.linked_deliverables.length > 0 ? (
                          <div style={{ marginTop: "12px" }}>
                            <h3>Used in Deliverables</h3>
                            <ul className="list-content">
                              {item.linked_deliverables.map((target) => (
                                <li key={`${item.evidence.id}-deliverable-${target.target_id}`}>
                                  {target.title}
                                  {target.note ? `｜${target.note}` : ""}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}

                        <Link className="back-link" href={`/tasks/${item.evidence.task_id}`}>
                          打開來源 task：{item.task_title}
                        </Link>
                      </div>
                    ))
                  ) : (
                    <p className="empty-text">目前還沒有可顯示的 evidence support chains。</p>
                  )}
                </div>
              </section>

              <section className="panel">
                <div className="panel-header">
                  <div>
                    <h2 className="panel-title">Related Tasks in This Workspace</h2>
                    <p className="panel-copy">
                      這些 task 共同構成目前的來源 / 證據世界，讓同一個案件下的 evidence 累積不再散落在單一 task detail。
                    </p>
                  </div>
                </div>
                <div className="history-list">
                  {workspace.related_tasks.length > 0 ? (
                    workspace.related_tasks.map((task) => (
                      <Link href={`/tasks/${task.id}`} key={task.id} className="history-item">
                        <div className="meta-row">
                          <span className="pill">{labelForTaskStatus(task.status)}</span>
                          <span>{task.evidence_count} 則 evidence</span>
                          <span>{task.deliverable_count} 份 deliverables</span>
                        </div>
                        <h3>{task.title}</h3>
                        <p className="muted-text">
                          {task.decision_context_title || task.description || "目前沒有可顯示的 DecisionContext。"}
                        </p>
                      </Link>
                    ))
                  ) : (
                    <p className="empty-text">目前沒有可顯示的 related tasks。</p>
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
