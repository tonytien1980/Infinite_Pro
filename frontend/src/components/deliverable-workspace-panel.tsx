"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getDeliverableWorkspace } from "@/lib/api";
import {
  assessTaskReadiness,
  buildActionItemCards,
  buildCapabilityFrame,
  buildDecisionSnapshot,
  buildDeliverableBacklinkView,
  buildDeliverableWorkspaceView,
  buildExecutiveSummary,
  buildPackSelectionView,
  buildReadinessGovernance,
  buildRecommendationCards,
  buildRiskCards,
} from "@/lib/advisory-workflow";
import type { DeliverableWorkspace } from "@/lib/types";
import {
  formatDisplayDate,
  labelForAgentId,
  labelForEvidenceType,
  labelForPriority,
  labelForSourceType,
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

export function DeliverableWorkspacePanel({ deliverableId }: { deliverableId: string }) {
  const [workspace, setWorkspace] = useState<DeliverableWorkspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        setError(null);
        setWorkspace(await getDeliverableWorkspace(deliverableId));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "載入交付物工作面失敗。");
      } finally {
        setLoading(false);
      }
    })();
  }, [deliverableId]);

  const task = workspace?.task ?? null;
  const deliverable = workspace?.deliverable ?? null;
  const workspaceView = workspace ? buildDeliverableWorkspaceView(workspace) : null;
  const readiness = task ? assessTaskReadiness(task) : null;
  const readinessGovernance =
    task && deliverable && readiness ? buildReadinessGovernance(task, deliverable, readiness) : null;
  const executiveSummary = task && deliverable ? buildExecutiveSummary(task, deliverable) : null;
  const decisionSnapshot = task && deliverable ? buildDecisionSnapshot(task, deliverable) : null;
  const recommendations = task && deliverable ? buildRecommendationCards(task, deliverable) : [];
  const risks = task && deliverable ? buildRiskCards(task, deliverable) : [];
  const actionItems = task && deliverable ? buildActionItemCards(task, deliverable) : [];
  const capabilityFrame = task && deliverable ? buildCapabilityFrame(task, deliverable) : null;
  const packSelection = task && deliverable ? buildPackSelectionView(task, deliverable) : null;
  const deliverableBacklink = task && deliverable ? buildDeliverableBacklinkView(task, deliverable) : null;

  return (
    <main className="page-shell">
      <div className="back-link-group">
        <Link className="back-link" href="/">
          ← 返回總覽
        </Link>
        <Link className="back-link" href="/deliverables">
          ← 返回交付物
        </Link>
        {workspace?.matter_workspace ? (
          <Link className="back-link" href={`/matters/${workspace.matter_workspace.id}`}>
            ← 返回案件工作面
          </Link>
        ) : null}
        {task ? (
          <Link className="back-link" href={`/tasks/${task.id}`}>
            ← 返回來源工作紀錄
          </Link>
        ) : null}
        {workspace?.matter_workspace ? (
          <Link className="back-link" href={`/matters/${workspace.matter_workspace.id}/evidence`}>
            ← 返回來源 / 證據工作面
          </Link>
        ) : null}
      </div>

      {loading ? <p className="status-text">正在載入交付物工作面...</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      {workspace && workspaceView && task && deliverable ? (
        <>
          <section className="hero-card">
            <span className="eyebrow">交付物工作面</span>
            <h1 className="page-title">{workspaceView.title}</h1>
            <p className="page-subtitle">
              {workspace.matter_workspace?.object_path ||
                [task.client?.name, task.engagement?.name, task.workstream?.name].filter(Boolean).join(" / ")}
            </p>
            <div className="meta-row" style={{ marginTop: "16px" }}>
              <span className="pill">{workspaceView.deliverableClassLabel}</span>
              <span>{workspaceView.deliverableTypeLabel}</span>
              <span>{workspaceView.workspaceStatusLabel}</span>
              <span>版本 {deliverable.version}</span>
              <span>{formatDisplayDate(deliverable.generated_at)}</span>
            </div>
            <div className="matter-hero-strip">
              <div>
                <span className="pill">決策問題</span>
                <p className="workspace-object-path" style={{ marginTop: "10px" }}>
                  {task.decision_context?.judgment_to_make ||
                    task.decision_context?.title ||
                    "目前尚未形成清楚的決策問題。"}
                </p>
                <p className="muted-text">{workspaceView.summary}</p>
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">交付物工作面摘要</h2>
                <p className="panel-copy">
                  這裡是正式的交付物工作面，不是一般結果頁。你可以在這裡回看這份交付物的類型、依據鏈、限制、適用範圍與相關工作脈絡。
                </p>
              </div>
            </div>
            <div className="summary-grid">
              <div className="section-card">
                <h4>交付層級與定位</h4>
                <p className="content-block">{workspaceView.summary}</p>
              </div>
              <div className="section-card">
                <h4>可信度與適用範圍</h4>
                <p className="content-block">{workspaceView.confidenceSummary}</p>
              </div>
              <div className="section-card">
                <h4>依據來源</h4>
                <p className="content-block">{workspaceView.evidenceBasisSummary}</p>
              </div>
              <div className="section-card">
                <h4>決策鏈寫回</h4>
                <CompactList
                  items={workspaceView.linkedOutputSummary}
                  emptyText="目前沒有可顯示的 decision chain 寫回項目。"
                />
              </div>
            </div>
          </section>

          <div className="detail-grid">
            <div className="detail-stack">
              <section className="panel">
                <div className="panel-header">
                  <div>
                    <h2 className="panel-title">交付摘要</h2>
                    <p className="panel-copy">
                      用正式交付物視角回看這次判斷、摘要與可採行重點，而不是只看工作結果區塊。
                    </p>
                  </div>
                </div>

                {decisionSnapshot ? (
                  <div className="snapshot-grid">
                    <div className="section-card">
                      <h4>{decisionSnapshot.conclusionLabel}</h4>
                      <p className="content-block">{decisionSnapshot.conclusion}</p>
                    </div>
                    <div className="section-card">
                      <h4>{decisionSnapshot.recommendationLabel}</h4>
                      <p className="content-block">{decisionSnapshot.primaryRecommendation}</p>
                    </div>
                    <div className="section-card">
                      <h4>{decisionSnapshot.riskLabel}</h4>
                      <p className="content-block">{decisionSnapshot.primaryRisk}</p>
                    </div>
                    <div className="section-card">
                      <h4>{decisionSnapshot.missingDataLabel}</h4>
                      <p className="content-block">{decisionSnapshot.missingDataStatus}</p>
                    </div>
                  </div>
                ) : null}

                {executiveSummary ? (
                  <div className="detail-item" style={{ marginTop: "16px" }}>
                    <h3>執行摘要</h3>
                    <p className="content-block">{executiveSummary.summary}</p>
                    {executiveSummary.bullets.length > 0 ? (
                      <>
                        <h3 style={{ marginTop: "16px" }}>重點摘要</h3>
                        <CompactList
                          items={executiveSummary.bullets}
                          emptyText="目前沒有額外的執行摘要重點。"
                        />
                      </>
                    ) : null}
                  </div>
                ) : null}
              </section>

              <section className="panel">
                <div className="panel-header">
                  <div>
                    <h2 className="panel-title">建議、風險與行動</h2>
                    <p className="panel-copy">
                      這裡正式呈現建議 / 風險 / 行動，不再讓它們只散落在工作細節頁的結果卡片中。
                    </p>
                  </div>
                </div>
                <div className="detail-list">
                  <div className="detail-item">
                    <h3>建議</h3>
                    {recommendations.length > 0 ? (
                      <div className="section-list">
                        {recommendations.map((item) => (
                          <div className="section-card" key={item.content}>
                            <h4>{item.content}</h4>
                            <p className="muted-text">
                              {labelForPriority(item.priority)}｜{item.expectedEffect}
                            </p>
                            <p className="content-block">{item.rationale}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="empty-text">目前沒有可顯示的建議。</p>
                    )}
                  </div>

                  <div className="detail-item">
                    <h3>風險</h3>
                    {risks.length > 0 ? (
                      <div className="section-list">
                        {risks.map((item) => (
                          <div className="section-card" key={item.content}>
                            <h4>{item.content}</h4>
                            <p className="muted-text">
                              {item.severity}｜{item.likelihood}
                            </p>
                            <p className="content-block">{item.impactExplanation}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="empty-text">目前沒有可顯示的風險。</p>
                    )}
                  </div>

                  <div className="detail-item">
                    <h3>行動項目</h3>
                    {actionItems.length > 0 ? (
                      <div className="section-list">
                        {actionItems.map((item) => (
                          <div className="section-card" key={item.content}>
                            <h4>{item.content}</h4>
                            <p className="muted-text">
                              {labelForPriority(item.priority)}｜{item.ownerRole}｜{item.sequence}
                            </p>
                            {item.dependencies.length > 0 ? (
                              <CompactList
                                items={item.dependencies}
                                emptyText="目前沒有額外的相依條件。"
                              />
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="empty-text">目前沒有可顯示的行動項目。</p>
                    )}
                  </div>
                </div>
              </section>

              <section className="panel">
                <div className="panel-header">
                  <div>
                    <h2 className="panel-title">依據來源與 ontology 回鏈</h2>
                    <p className="panel-copy">
                      這裡正式回看交付物對決策問題、來源、證據與決策鏈的回鏈，而不是把這些資訊藏在資料結構裡。
                    </p>
                  </div>
                </div>
                {deliverableBacklink ? (
                  <div className="summary-grid">
                    <div className="section-card">
                      <h4>交付物掛載位置</h4>
                      <p className="content-block">{deliverableBacklink.workspacePath}</p>
                    </div>
                    <div className="section-card">
                      <h4>決策問題</h4>
                      <p className="content-block">{deliverableBacklink.decisionContext}</p>
                    </div>
                    <div className="section-card">
                      <h4>依據來源</h4>
                      <p className="content-block">{deliverableBacklink.evidenceBasis}</p>
                    </div>
                    <div className="section-card">
                      <h4>寫回的決策鏈</h4>
                      <CompactList
                        items={deliverableBacklink.linkedOutputs}
                        emptyText="目前沒有可顯示的寫回決策鏈。"
                      />
                    </div>
                  </div>
                ) : null}

                <div className="detail-grid" style={{ marginTop: "20px" }}>
                  <div className="detail-stack">
                    <div className="detail-item">
                      <h3>已連結來源材料</h3>
                      {workspace.linked_source_materials.length > 0 ? (
                        <div className="section-list">
                          {workspace.linked_source_materials.map((item) => (
                            <div className="section-card" key={item.id}>
                              <h4>{item.title}</h4>
                              <p className="muted-text">
                                {labelForSourceType(item.source_type)}{item.source_ref ? `｜${item.source_ref}` : ""}
                              </p>
                              <p className="content-block">{item.summary || "目前沒有可顯示的來源摘要。"}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="empty-text">目前沒有可顯示的來源材料。</p>
                      )}
                    </div>

                    <div className="detail-item">
                      <h3>已連結工作物件</h3>
                      {workspace.linked_artifacts.length > 0 ? (
                        <div className="section-list">
                          {workspace.linked_artifacts.map((item) => (
                            <div className="section-card" key={item.id}>
                              <h4>{item.title}</h4>
                              <p className="muted-text">{item.artifact_type || "未分類工作物件"}</p>
                              <p className="content-block">{item.description || "目前沒有工作物件摘要。"}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="empty-text">目前沒有可顯示的工作物件。</p>
                      )}
                    </div>
                  </div>

                  <div className="detail-stack">
                    <div className="detail-item">
                      <h3>已連結證據</h3>
                      {workspace.linked_evidence.length > 0 ? (
                        <div className="section-list">
                          {workspace.linked_evidence.map((item) => (
                            <div className="section-card" key={item.id}>
                              <h4>{item.title}</h4>
                              <p className="muted-text">
                                {labelForEvidenceType(item.evidence_type)}｜{item.reliability_level}
                              </p>
                              <p className="content-block">{item.excerpt_or_summary}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="empty-text">目前沒有可顯示的證據。</p>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <div className="detail-stack">
              <section className="panel">
                <div className="panel-header">
                  <div>
                    <h2 className="panel-title">可信度、限制與缺口</h2>
                    <p className="panel-copy">
                      這裡正式表達交付等級、可信度、限制與高影響缺口，不讓探索型 / 審閱型 / 決策型交付物混成同一種語氣。
                    </p>
                  </div>
                </div>
                <div className="section-list">
                  <div className="section-card">
                    <h4>可信度摘要</h4>
                    <p className="content-block">{workspace.confidence_summary}</p>
                  </div>
                  <div className="section-card">
                    <h4>交付指引</h4>
                    <p className="content-block">
                      {workspace.deliverable_guidance || "目前沒有額外的交付指引。"}
                    </p>
                  </div>
                  <div className="section-card">
                    <h4>高影響缺口</h4>
                    <CompactList
                      items={workspace.high_impact_gaps}
                      emptyText="目前沒有額外高影響缺口。"
                    />
                  </div>
                  <div className="section-card">
                    <h4>限制說明</h4>
                    <CompactList
                      items={workspace.limitation_notes}
                      emptyText="目前沒有額外限制說明。"
                    />
                  </div>
                </div>
                {readinessGovernance ? (
                  <div className="detail-item" style={{ marginTop: "16px" }}>
                    <h3>就緒度治理</h3>
                    <p className="content-block">{readinessGovernance.summary}</p>
                  </div>
                ) : null}
              </section>

              <section className="panel">
                <div className="panel-header">
                  <div>
                    <h2 className="panel-title">模組包 / 代理脈絡</h2>
                    <p className="panel-copy">
                      這份交付物不是脫離執行脈絡的孤立報告；它仍然回鏈到 Host、模組包與已選代理。
                    </p>
                  </div>
                </div>
                <div className="section-list">
                  {packSelection ? (
                    <div className="section-card">
                      <h4>模組包</h4>
                      <CompactList
                        items={[...packSelection.domainPacks, ...packSelection.industryPacks]}
                        emptyText="目前沒有可顯示的模組包脈絡。"
                      />
                    </div>
                  ) : null}
                  {capabilityFrame ? (
                    <div className="section-card">
                      <h4>已選代理</h4>
                      <CompactList
                        items={capabilityFrame.selectedAgentDetails.map(
                          (item) => `${item.agentName}｜${item.reason || labelForAgentId(item.agentId)}`,
                        )}
                        emptyText="目前沒有可顯示的代理脈絡。"
                      />
                    </div>
                  ) : null}
                </div>
              </section>

              <section className="panel">
                <div className="panel-header">
                  <div>
                    <h2 className="panel-title">交付連續性</h2>
                    <p className="panel-copy">
                      交付物現在已正式掛在案件世界中，可回到同一個案件下的其他交付物、工作紀錄與來源 / 證據工作面。
                    </p>
                  </div>
                  <Link className="button-secondary" href="/deliverables">
                    查看全部交付物
                  </Link>
                </div>
                <div className="detail-item">
                  <h3>連續性提示</h3>
                  <CompactList
                    items={workspaceView.continuityHighlights}
                    emptyText="目前沒有額外連續性提示。"
                  />
                </div>
                <div className="detail-item" style={{ marginTop: "16px" }}>
                  <h3>最近相關交付物</h3>
                  {workspace.related_deliverables.length > 0 ? (
                    <div className="section-list">
                      {workspace.related_deliverables.slice(0, 3).map((item) => (
                        <div className="section-card" key={item.deliverable_id}>
                          <h4>{item.title}</h4>
                          <p className="muted-text">
                            {item.task_title}｜{item.decision_context_title || "未標示決策問題"}
                          </p>
                          <div className="meta-row">
                            <span>v{item.version}</span>
                            <span>{formatDisplayDate(item.generated_at)}</span>
                          </div>
                          <Link className="back-link" href={`/deliverables/${item.deliverable_id}`}>
                            打開這份交付物
                          </Link>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="empty-text">目前沒有其他相關交付物。</p>
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
