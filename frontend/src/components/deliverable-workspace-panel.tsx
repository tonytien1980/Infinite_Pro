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
import { truncateText } from "@/lib/text-format";
import type { DeliverableWorkspace } from "@/lib/types";
import {
  formatDisplayDate,
  labelForAgentId,
  labelForDeliverableStatus,
  labelForEvidenceType,
  labelForPriority,
  labelForSourceType,
} from "@/lib/ui-labels";
import {
  type DeliverableLifecycleStatus,
  nowIsoString,
  useDeliverableWorkspaceRecords,
} from "@/lib/workbench-store";
import {
  buildDeliverableSaveFeedback,
  isLocalFallbackDeliverableRecord,
  persistDeliverableMetadata,
} from "@/lib/workspace-persistence";

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
  const [deliverableRecords, setDeliverableRecords] = useDeliverableWorkspaceRecords();
  const [draftTitle, setDraftTitle] = useState("");
  const [draftSummary, setDraftSummary] = useState("");
  const [draftStatus, setDraftStatus] = useState<DeliverableLifecycleStatus>("draft");
  const [draftVersionTag, setDraftVersionTag] = useState("");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveMode, setSaveMode] = useState<"remote" | "local-fallback" | null>(null);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
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

  useEffect(() => {
    if (!workspace) {
      return;
    }

    const record = isLocalFallbackDeliverableRecord(deliverableRecords[deliverableId])
      ? deliverableRecords[deliverableId]
      : null;
    const defaultStatus = workspace.deliverable.status as DeliverableLifecycleStatus;
    setDraftTitle(record?.title || workspace.deliverable.title);
    setDraftSummary(record?.summary || workspace.deliverable.summary || "");
    setDraftStatus(record?.status || defaultStatus);
    setDraftVersionTag(record?.versionTag || workspace.deliverable.version_tag || `v${workspace.deliverable.version}`);
  }, [deliverableId, deliverableRecords, workspace]);

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
  const deliverableRecord = deliverableRecords[deliverableId];
  const fallbackRecord = isLocalFallbackDeliverableRecord(deliverableRecord)
    ? deliverableRecord
    : null;
  const deliverableStatus =
    fallbackRecord?.status ||
    ((deliverable?.status as DeliverableLifecycleStatus | undefined) ??
      (task?.status === "completed" ? "final" : "pending_confirmation"));
  const versionTag = fallbackRecord?.versionTag || deliverable?.version_tag || (deliverable ? `v${deliverable.version}` : "v1");
  const displayTitle = fallbackRecord?.title || deliverable?.title || "";
  const displaySummary = fallbackRecord?.summary || deliverable?.summary || "";
  const selectedPackNames = packSelection
    ? [...packSelection.domainPacks, ...packSelection.industryPacks]
    : [];

  async function handleSaveMetadata() {
    if (!deliverable) {
      return;
    }

    const timestamp = nowIsoString();
    const nextTitle = draftTitle.trim() || deliverable.title;
    const nextSummary = draftSummary.trim();
    const nextVersionTag = draftVersionTag.trim() || deliverable.version_tag || `v${deliverable.version}`;
    const previousVersions = deliverableRecord?.versions ?? [];
    const shouldAddVersion =
      nextVersionTag !== (deliverable.version_tag || `v${deliverable.version}`) ||
      nextTitle !== deliverable.title ||
      nextSummary !== (deliverable.summary || "");
    const nextVersions = shouldAddVersion
      ? [
          {
            id: `${deliverableId}-${timestamp}`,
            versionTag: nextVersionTag,
            timestamp,
            note: `更新為「${nextTitle}」`,
          },
          ...previousVersions,
        ].slice(0, 12)
      : previousVersions;

    const result = await persistDeliverableMetadata(deliverableId, {
      title: nextTitle,
      summary: nextSummary,
      status: draftStatus,
      version_tag: nextVersionTag,
    });

    if (result.source === "remote") {
      setWorkspace(result.workspace);
      setDeliverableRecords((current) => ({
        ...current,
        [deliverableId]: {
          title: result.workspace.deliverable.title,
          summary: result.workspace.deliverable.summary,
          status: result.workspace.deliverable.status as DeliverableLifecycleStatus,
          versionTag: result.workspace.deliverable.version_tag,
          updatedAt: timestamp,
          versions: nextVersions,
        },
      }));
      setSaveMode("remote");
      setSaveMessage(buildDeliverableSaveFeedback("remote", result.workspace));
    } else {
      setDeliverableRecords((current) => ({
        ...current,
        [deliverableId]: {
          ...result.fallbackRecord,
          versions: nextVersions,
        },
      }));
      setSaveMode("local-fallback");
      setSaveMessage(buildDeliverableSaveFeedback("local-fallback"));
    }
    setExportMessage(null);
  }

  function handleExportEntry() {
    setExportMessage("匯出入口已保留；本輪先完成前端入口與狀態說明，完整檔案輸出仍待後端串接。");
  }

  return (
    <main className="page-shell deliverable-page-shell">
      <div className="back-link-group deliverable-backtrack">
        <span className="eyebrow deliverable-backtrack-label">工作鏈返回</span>
        <div className="deliverable-backtrack-links">
          <Link className="back-link deliverable-back-link" href="/">
            ← 返回總覽
          </Link>
          <Link className="back-link deliverable-back-link" href="/deliverables">
            ← 返回交付物
          </Link>
          {workspace?.matter_workspace ? (
            <Link
              className="back-link deliverable-back-link"
              href={`/matters/${workspace.matter_workspace.id}`}
            >
              ← 返回案件工作面
            </Link>
          ) : null}
          {task ? (
            <Link className="back-link deliverable-back-link" href={`/tasks/${task.id}`}>
              ← 返回來源工作紀錄
            </Link>
          ) : null}
          {workspace?.matter_workspace ? (
            <Link
              className="back-link deliverable-back-link"
              href={`/matters/${workspace.matter_workspace.id}/evidence`}
            >
              ← 返回來源 / 證據工作面
            </Link>
          ) : null}
        </div>
      </div>

      {loading ? <p className="status-text">正在載入交付物工作面...</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      {workspace && workspaceView && task && deliverable ? (
        <>
          <section className="hero-card deliverable-hero">
            <div className="deliverable-hero-grid">
              <div className="deliverable-hero-main">
                <span className="eyebrow">交付物工作面</span>
                <h1 className="page-title deliverable-title">{displayTitle || workspaceView.title}</h1>
                <p className="page-subtitle deliverable-subtitle">
                  {workspace.matter_workspace?.object_path ||
                    [task.client?.name, task.engagement?.name, task.workstream?.name]
                      .filter(Boolean)
                      .join(" / ")}
                </p>
                <div className="meta-row deliverable-meta-row" style={{ marginTop: "16px" }}>
                  <span className="pill">{workspaceView.deliverableClassLabel}</span>
                  <span>{workspaceView.deliverableTypeLabel}</span>
                  <span>{labelForDeliverableStatus(deliverableStatus)}</span>
                  <span>{workspaceView.workspaceStatusLabel}</span>
                  <span>{versionTag}</span>
                  <span>更新於 {formatDisplayDate(task.updated_at)}</span>
                </div>

                {decisionSnapshot ? (
                  <div className="deliverable-focus-card">
                    <span className="pill">一句話結論</span>
                    <p className="deliverable-focus-lead">{decisionSnapshot.conclusion}</p>
                  </div>
                ) : null}

                <div className="deliverable-focus-grid">
                  <div className="section-card deliverable-focus-panel">
                    <h4>簡短摘要</h4>
                    <p className="content-block">
                      {truncateText(
                        displaySummary || executiveSummary?.summary || decisionSnapshot?.conclusion,
                        156,
                      )}
                    </p>
                  </div>
                  <div className="section-card deliverable-focus-panel">
                    <h4>決策問題</h4>
                    <p className="content-block">
                      {task.decision_context?.judgment_to_make ||
                        task.decision_context?.title ||
                        "目前尚未形成清楚的決策問題。"}
                    </p>
                  </div>
                  <div className="section-card deliverable-focus-panel">
                    <h4>最重要建議</h4>
                    <p className="content-block">
                      {decisionSnapshot?.primaryRecommendation ||
                        executiveSummary?.bullets[1] ||
                        "目前沒有額外的首要建議。"}
                    </p>
                  </div>
                </div>
              </div>

              <aside className="deliverable-hero-rail">
                <div className="section-card deliverable-rail-card">
                  <h4>工作面快讀</h4>
                  <div className="deliverable-metric-grid">
                    <div className="deliverable-metric-card">
                      <span className="deliverable-metric-label">證據</span>
                      <strong className="deliverable-metric-value">
                        {workspace.linked_evidence.length}
                      </strong>
                    </div>
                    <div className="deliverable-metric-card">
                      <span className="deliverable-metric-label">來源材料</span>
                      <strong className="deliverable-metric-value">
                        {workspace.linked_source_materials.length}
                      </strong>
                    </div>
                    <div className="deliverable-metric-card">
                      <span className="deliverable-metric-label">建議</span>
                      <strong className="deliverable-metric-value">{recommendations.length}</strong>
                    </div>
                    <div className="deliverable-metric-card">
                      <span className="deliverable-metric-label">高影響缺口</span>
                      <strong className="deliverable-metric-value">
                        {workspace.high_impact_gaps.length}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="section-card deliverable-rail-card">
                  <h4>可信度與適用範圍</h4>
                  <p className="content-block">{workspaceView.confidenceSummary}</p>
                </div>

                <div className="section-card deliverable-rail-card">
                  <h4>下一個高影響缺口</h4>
                  <p className="content-block">
                    {workspace.high_impact_gaps[0] || "目前沒有額外高影響缺口。"}
                  </p>
                  {readinessGovernance ? (
                    <p className="muted-text" style={{ marginTop: "12px" }}>
                      {readinessGovernance.summary}
                    </p>
                  ) : null}
                </div>

                <div className="section-card deliverable-rail-card">
                  <h4>關聯脈絡</h4>
                  <div className="detail-list">
                    <div className="detail-item">
                      <h3>所屬案件</h3>
                      <p className="content-block">
                        {workspace.matter_workspace?.title || task.engagement?.name || "未掛案件"}
                      </p>
                    </div>
                    <div className="detail-item">
                      <h3>關聯代理</h3>
                      <p className="content-block">
                        {capabilityFrame?.selectedAgentDetails.length
                          ? capabilityFrame.selectedAgentDetails
                              .map((item) => item.agentName)
                              .slice(0, 4)
                              .join("、")
                          : "目前沒有可顯示的代理脈絡。"}
                      </p>
                    </div>
                    <div className="detail-item">
                      <h3>關聯模組包</h3>
                      <p className="content-block">
                        {selectedPackNames.length > 0
                          ? selectedPackNames.slice(0, 4).join("、")
                          : "目前沒有可顯示的模組包脈絡。"}
                      </p>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">交付物管理</h2>
                <p className="panel-copy">先把標題、狀態與版本標記整理乾淨，再繼續修摘要、風險與行動項目。</p>
              </div>
            </div>
            <div className="form-grid">
              <div className="field-grid">
                <div className="field">
                  <label htmlFor="deliverable-title">交付物標題</label>
                  <input
                    id="deliverable-title"
                    value={draftTitle}
                    onChange={(event) => {
                      setDraftTitle(event.target.value);
                      setSaveMessage(null);
                    }}
                  />
                </div>
                <div className="field">
                  <label htmlFor="deliverable-summary">簡短摘要</label>
                  <textarea
                    id="deliverable-summary"
                    value={draftSummary}
                    onChange={(event) => {
                      setDraftSummary(event.target.value);
                      setSaveMessage(null);
                    }}
                    placeholder="用一句短摘要說明這份交付物目前的主要結論或用途。"
                  />
                </div>
                <div className="field">
                  <label htmlFor="deliverable-status">狀態</label>
                  <select
                    id="deliverable-status"
                    value={draftStatus}
                    onChange={(event) => {
                      setDraftStatus(event.target.value as DeliverableLifecycleStatus);
                      setSaveMessage(null);
                    }}
                  >
                    <option value="draft">草稿</option>
                    <option value="pending_confirmation">待確認</option>
                    <option value="final">定稿</option>
                    <option value="archived">封存</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="deliverable-version-tag">版本標記</label>
                  <input
                    id="deliverable-version-tag"
                    value={draftVersionTag}
                    onChange={(event) => {
                      setDraftVersionTag(event.target.value);
                      setSaveMessage(null);
                    }}
                    placeholder="例如：v2.1"
                  />
                </div>
                <div className="field">
                  <label htmlFor="deliverable-matter">所屬案件</label>
                  <input
                    id="deliverable-matter"
                    value={workspace.matter_workspace?.title || task.engagement?.name || "未掛案件"}
                    readOnly
                  />
                </div>
                <div className="field">
                  <label htmlFor="deliverable-updated-at">最近更新</label>
                  <input
                    id="deliverable-updated-at"
                    value={formatDisplayDate(task.updated_at)}
                    readOnly
                  />
                </div>
              </div>

              <div className="button-row">
                <button className="button-primary" type="button" onClick={handleSaveMetadata}>
                  儲存交付物資訊
                </button>
                <button className="button-secondary" type="button" onClick={handleExportEntry}>
                  匯出入口
                </button>
              </div>
              {saveMessage ? <p className="success-text">{saveMessage}</p> : null}
              {saveMessage && saveMode === "local-fallback" ? (
                <p className="muted-text">目前顯示的是本機暫存版本，待後端可用後再寫回正式資料。</p>
              ) : null}
              {exportMessage ? <p className="muted-text">{exportMessage}</p> : null}
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
                    <h3>工作摘要</h3>
                    <p className="content-block">
                      {displaySummary || executiveSummary.summary}
                    </p>
                    <h3 style={{ marginTop: "16px" }}>執行摘要</h3>
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
                ) : displaySummary ? (
                  <div className="detail-item" style={{ marginTop: "16px" }}>
                    <h3>執行摘要</h3>
                    <p className="content-block">{displaySummary}</p>
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
                    <h2 className="panel-title">版本紀錄</h2>
                    <p className="panel-copy">先保留最小可用的版本管理與編修痕跡，完整匯出與版本發布流程留待後端接手。</p>
                  </div>
                </div>
                <div className="detail-list">
                  <div className="detail-item">
                    <div className="meta-row">
                      <span className="pill">{labelForDeliverableStatus(deliverableStatus)}</span>
                      <span>{versionTag}</span>
                      <span>{formatDisplayDate(deliverable.generated_at)}</span>
                    </div>
                    <h3>{displayTitle || deliverable.title}</h3>
                    <p className="muted-text">目前版本</p>
                  </div>
                  {deliverableRecord?.versions.length ? (
                    deliverableRecord.versions.map((item) => (
                      <div className="detail-item" key={item.id}>
                        <div className="meta-row">
                          <span className="pill">{item.versionTag}</span>
                          <span>{formatDisplayDate(item.timestamp)}</span>
                        </div>
                        <h3>{item.note}</h3>
                      </div>
                    ))
                  ) : null}
                  {workspace.related_deliverables.length > 0 ? (
                    workspace.related_deliverables.slice(0, 4).map((item) => (
                      <div className="detail-item" key={`related-${item.deliverable_id}`}>
                        <div className="meta-row">
                          <span className="pill">歷史版本參考</span>
                          <span>v{item.version}</span>
                          <span>{formatDisplayDate(item.generated_at)}</span>
                        </div>
                        <h3>{item.title}</h3>
                        <p className="muted-text">{item.task_title}</p>
                        <Link className="back-link" href={`/deliverables/${item.deliverable_id}`}>
                          打開這份交付物
                        </Link>
                      </div>
                    ))
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
