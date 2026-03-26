"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  downloadDeliverableArtifact,
  exportDeliverableDocx,
  exportDeliverableMarkdown,
  getDeliverableWorkspace,
  publishDeliverableRelease,
} from "@/lib/api";
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
  labelForDeliverableEventType,
  labelForDeliverableStatus,
  labelForEvidenceType,
  labelForSourceType,
} from "@/lib/ui-labels";
import { type DeliverableLifecycleStatus } from "@/lib/workbench-store";
import {
  buildDeliverableSaveFeedback,
  isRetriableWorkspaceError,
  persistDeliverableWorkspace,
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

function buildDeliverableStatusHint(status: DeliverableLifecycleStatus) {
  if (status === "final") {
    return "這個版本已是可正式匯出與回看的定稿版。";
  }
  if (status === "pending_confirmation") {
    return "這個版本已整理成待確認狀態，適合送審或回到案件內核對。";
  }
  if (status === "archived") {
    return "這個版本目前已封存，主要作為歷史回看與脈絡參照。";
  }
  return "這個版本仍在草稿階段，適合繼續修摘要、建議與風險。";
}

function splitLineItems(value: string) {
  return value
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinLineItems(items: string[]) {
  return items.join("\n");
}

function buildResolvedDeliverableSections(
  workspace: DeliverableWorkspace,
  derivedSummary: string,
  recommendationItems: string[],
  riskItems: string[],
  actionItemEntries: string[],
) {
  const stored = workspace.content_sections;

  return {
    executive_summary:
      stored.executive_summary ||
      workspace.deliverable.summary ||
      derivedSummary ||
      workspace.deliverable.title,
    recommendations:
      stored.recommendations.length > 0
        ? stored.recommendations
        : recommendationItems,
    risks:
      stored.risks.length > 0
        ? stored.risks
        : riskItems,
    action_items:
      stored.action_items.length > 0
        ? stored.action_items
        : actionItemEntries,
    evidence_basis:
      stored.evidence_basis.length > 0
        ? stored.evidence_basis
        : workspace.linked_evidence.map(
            (item) => `${item.title}｜${item.source_type || item.evidence_type || "evidence"}`,
          ),
  };
}

function formatArtifactFileSize(fileSize: number) {
  if (fileSize >= 1024 * 1024) {
    return `${(fileSize / (1024 * 1024)).toFixed(1)} MB`;
  }
  if (fileSize >= 1024) {
    return `${(fileSize / 1024).toFixed(1)} KB`;
  }
  return `${fileSize} B`;
}

function buildDeliverableEventDetail(
  event: DeliverableWorkspace["version_events"][number],
) {
  const payload = event.event_payload || {};
  const artifactFormat =
    typeof payload.artifact_format === "string" ? payload.artifact_format : "";
  const publishNote =
    typeof payload.publish_note === "string" ? payload.publish_note.trim() : "";
  const changedSections = Array.isArray(payload.changed_sections)
    ? payload.changed_sections.filter((item): item is string => typeof item === "string")
    : [];

  if (event.event_type === "exported" && artifactFormat) {
    return `artifact：${artifactFormat.toUpperCase()}`;
  }
  if (event.event_type === "published") {
    return publishNote || "已建立正式發布紀錄與 release artifact。";
  }
  if (event.event_type === "content_updated" && changedSections.length > 0) {
    return `更新區塊：${changedSections.join("、")}`;
  }

  return "";
}

export function DeliverableWorkspacePanel({ deliverableId }: { deliverableId: string }) {
  const [workspace, setWorkspace] = useState<DeliverableWorkspace | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftSummary, setDraftSummary] = useState("");
  const [draftStatus, setDraftStatus] = useState<DeliverableLifecycleStatus>("draft");
  const [draftVersionTag, setDraftVersionTag] = useState("");
  const [draftEventNote, setDraftEventNote] = useState("");
  const [draftPublishNote, setDraftPublishNote] = useState("");
  const [draftContentSections, setDraftContentSections] = useState({
    executive_summary: "",
    recommendations: "",
    risks: "",
    action_items: "",
    evidence_basis: "",
  });
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveTone, setSaveTone] = useState<"success" | "error" | null>(null);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [exportTone, setExportTone] = useState<"success" | "error" | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [activeExportFormat, setActiveExportFormat] = useState<"markdown" | "docx" | null>(null);
  const [activeArtifactDownloadId, setActiveArtifactDownloadId] = useState<string | null>(null);
  const [retryAction, setRetryAction] = useState<
    | null
    | { kind: "save"; status?: DeliverableLifecycleStatus }
    | { kind: "publish" }
    | { kind: "export"; format: "markdown" | "docx" }
  >(null);
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

    const defaultStatus = workspace.deliverable.status as DeliverableLifecycleStatus;
    const nextResolvedSections = buildResolvedDeliverableSections(
      workspace,
      workspace.deliverable.summary || workspace.deliverable.title,
      workspace.linked_recommendations.map((item) => item.summary),
      workspace.linked_risks.map((item) =>
        item.title ? `${item.title}：${item.description}` : item.description,
      ),
      workspace.linked_action_items.map((item) => item.description),
    );
    setDraftTitle(workspace.deliverable.title);
    setDraftSummary(workspace.deliverable.summary || "");
    setDraftStatus(defaultStatus);
    setDraftVersionTag(workspace.deliverable.version_tag || `v${workspace.deliverable.version}`);
    setDraftEventNote("");
    setDraftPublishNote("");
    setDraftContentSections({
      executive_summary: nextResolvedSections.executive_summary,
      recommendations: joinLineItems(nextResolvedSections.recommendations),
      risks: joinLineItems(nextResolvedSections.risks),
      action_items: joinLineItems(nextResolvedSections.action_items),
      evidence_basis: joinLineItems(nextResolvedSections.evidence_basis),
    });
  }, [deliverableId, workspace]);

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
  const deliverableStatus =
    ((deliverable?.status as DeliverableLifecycleStatus | undefined) ??
      (task?.status === "completed" ? "final" : "pending_confirmation"));
  const versionTag = deliverable?.version_tag || (deliverable ? `v${deliverable.version}` : "v1");
  const displayTitle = deliverable?.title || "";
  const displaySummary = deliverable?.summary || "";
  const selectedPackNames = packSelection
    ? [...packSelection.domainPacks, ...packSelection.industryPacks]
    : [];
  const resolvedSections = workspace
    ? buildResolvedDeliverableSections(
        workspace,
        executiveSummary?.summary || workspace.deliverable.summary || workspace.deliverable.title,
        recommendations.map((item) => item.content),
        risks.map((item) => item.content),
        actionItems.map((item) => item.content),
      )
    : null;
  const effectiveExecutiveSummary =
    resolvedSections?.executive_summary ||
    displaySummary ||
    executiveSummary?.summary ||
    "";
  const effectiveRecommendations = resolvedSections?.recommendations || [];
  const effectiveRisks = resolvedSections?.risks || [];
  const effectiveActionItems = resolvedSections?.action_items || [];
  const effectiveEvidenceBasis = resolvedSections?.evidence_basis || [];
  const hasUnsavedChanges = Boolean(
    workspace &&
      resolvedSections &&
      (
        draftTitle !== workspace.deliverable.title ||
        draftSummary !== (workspace.deliverable.summary || "") ||
        draftStatus !==
          (workspace.deliverable.status as DeliverableLifecycleStatus) ||
        draftVersionTag !==
          (workspace.deliverable.version_tag || `v${workspace.deliverable.version}`) ||
        draftEventNote.trim().length > 0 ||
        draftContentSections.executive_summary !== resolvedSections.executive_summary ||
        draftContentSections.recommendations !== joinLineItems(resolvedSections.recommendations) ||
        draftContentSections.risks !== joinLineItems(resolvedSections.risks) ||
        draftContentSections.action_items !== joinLineItems(resolvedSections.action_items) ||
        draftContentSections.evidence_basis !== joinLineItems(resolvedSections.evidence_basis)
      )
  );

  async function handleSaveWorkspace(nextStatus?: DeliverableLifecycleStatus) {
    if (!deliverable) {
      return;
    }

    const nextTitle = draftTitle.trim() || deliverable.title;
    const nextSummary = draftSummary.trim();
    const nextVersionTag =
      draftVersionTag.trim() || deliverable.version_tag || `v${deliverable.version}`;
    setIsSaving(true);
    setRetryAction(null);
    try {
      const result = await persistDeliverableWorkspace(deliverableId, {
        title: nextTitle,
        summary: nextSummary,
        status: nextStatus ?? draftStatus,
        version_tag: nextVersionTag,
        event_note: draftEventNote.trim(),
        content_sections: {
          executive_summary: draftContentSections.executive_summary.trim(),
          recommendations: splitLineItems(draftContentSections.recommendations),
          risks: splitLineItems(draftContentSections.risks),
          action_items: splitLineItems(draftContentSections.action_items),
          evidence_basis: splitLineItems(draftContentSections.evidence_basis),
        },
      });
      setWorkspace(result.workspace);
      setDraftStatus(result.workspace.deliverable.status as DeliverableLifecycleStatus);
      setDraftVersionTag(result.workspace.deliverable.version_tag || nextVersionTag);
      setDraftEventNote("");
      setDraftPublishNote("");
      setSaveTone("success");
      setSaveMessage(buildDeliverableSaveFeedback("remote", result.workspace));
      setRetryAction(null);
    } catch (saveError) {
      setSaveTone("error");
      setSaveMessage(saveError instanceof Error ? saveError.message : "儲存交付物資訊失敗。");
      if (isRetriableWorkspaceError(saveError)) {
        setRetryAction({ kind: "save", status: nextStatus });
      }
    } finally {
      setIsSaving(false);
    }
    setExportMessage(null);
  }

  async function handleExportEntry(format: "markdown" | "docx") {
    if (!deliverable || typeof window === "undefined") {
      return;
    }
    if (hasUnsavedChanges) {
      setExportTone("error");
      setExportMessage("請先儲存正式內容，再進行匯出或發布，避免把尚未落盤的內容誤當成正式版本。");
      return;
    }

    setActiveExportFormat(format);
    setRetryAction(null);
    try {
      const exportResult =
        format === "docx"
          ? await exportDeliverableDocx(deliverableId)
          : await exportDeliverableMarkdown(deliverableId);
      const objectUrl = window.URL.createObjectURL(exportResult.blob);
      const anchor = window.document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = exportResult.fileName;
      window.document.body.append(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 0);
      setWorkspace(await getDeliverableWorkspace(deliverableId));
      setExportTone("success");
      setExportMessage(
        `已下載 ${exportResult.fileName}；目前匯出對應 ${exportResult.versionTag || versionTag}。${
          format === "docx"
            ? "DOCX 已可作為 beta release artifact，完整 PDF 發布流程仍待後端補齊。"
            : "Markdown 匯出會保留穩定的 metadata 與 section ordering。"
        }`,
      );
    } catch (exportError) {
      setExportTone("error");
      setExportMessage(exportError instanceof Error ? exportError.message : "匯出交付物失敗。");
      if (isRetriableWorkspaceError(exportError)) {
        setRetryAction({ kind: "export", format });
      }
    } finally {
      setActiveExportFormat(null);
    }
  }

  async function handlePublishRelease() {
    if (!deliverable) {
      return;
    }

    setIsPublishing(true);
    setRetryAction(null);
    try {
      const result = await publishDeliverableRelease(deliverableId, {
        title: draftTitle.trim() || deliverable.title,
        summary: draftSummary.trim(),
        version_tag:
          draftVersionTag.trim() || deliverable.version_tag || `v${deliverable.version}`,
        publish_note: draftPublishNote.trim() || draftEventNote.trim(),
        artifact_formats: ["markdown", "docx"],
        content_sections: {
          executive_summary: draftContentSections.executive_summary.trim(),
          recommendations: splitLineItems(draftContentSections.recommendations),
          risks: splitLineItems(draftContentSections.risks),
          action_items: splitLineItems(draftContentSections.action_items),
          evidence_basis: splitLineItems(draftContentSections.evidence_basis),
        },
      });
      setWorkspace(result);
      setDraftStatus(result.deliverable.status as DeliverableLifecycleStatus);
      setDraftVersionTag(result.deliverable.version_tag || draftVersionTag);
      setDraftPublishNote("");
      setDraftEventNote("");
      setExportTone("success");
      setExportMessage(
        `已正式發布 ${result.deliverable.version_tag || draftVersionTag}，並建立 Markdown 與 DOCX release artifact。`,
      );
    } catch (publishError) {
      setExportTone("error");
      setExportMessage(
        publishError instanceof Error ? publishError.message : "正式發布交付物失敗。",
      );
      if (isRetriableWorkspaceError(publishError)) {
        setRetryAction({ kind: "publish" });
      }
    } finally {
      setIsPublishing(false);
    }
  }

  async function handleArtifactDownload(
    artifactId: string,
    fileName: string,
    artifactFormat: string,
  ) {
    if (typeof window === "undefined") {
      return;
    }

    setActiveArtifactDownloadId(artifactId);
    try {
      const result = await downloadDeliverableArtifact(deliverableId, {
        id: artifactId,
        file_name: fileName,
        artifact_format: artifactFormat,
      });
      const objectUrl = window.URL.createObjectURL(result.blob);
      const anchor = window.document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = result.fileName;
      window.document.body.append(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 0);
      setExportTone("success");
      setExportMessage(`已下載 artifact ${result.fileName}。`);
    } catch (downloadError) {
      setExportTone("error");
      setExportMessage(
        downloadError instanceof Error ? downloadError.message : "下載 artifact 失敗。",
      );
    } finally {
      setActiveArtifactDownloadId(null);
    }
  }

  function handleRetryAction() {
    if (!retryAction) {
      return;
    }

    if (retryAction.kind === "save") {
      void handleSaveWorkspace(retryAction.status);
      return;
    }
    if (retryAction.kind === "publish") {
      void handlePublishRelease();
      return;
    }
    void handleExportEntry(retryAction.format);
  }

  return (
    <main className="page-shell deliverable-page-shell">
      <nav className="workspace-breadcrumb" aria-label="工作面層級">
        <Link className="workspace-breadcrumb-link" href="/">
          總覽
        </Link>
        <span className="workspace-breadcrumb-separator">/</span>
        <Link className="workspace-breadcrumb-link" href="/deliverables">
          交付物
        </Link>
        {workspace?.matter_workspace ? (
          <>
            <span className="workspace-breadcrumb-separator">/</span>
            <Link
              className="workspace-breadcrumb-link"
              href={`/matters/${workspace.matter_workspace.id}`}
            >
              {workspace.matter_workspace.title}
            </Link>
          </>
        ) : null}
        <span className="workspace-breadcrumb-separator">/</span>
        <span className="workspace-breadcrumb-current">
          {displayTitle || workspace?.deliverable.title || "交付物工作面"}
        </span>
      </nav>

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
                        displaySummary || effectiveExecutiveSummary || decisionSnapshot?.conclusion,
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
                      {effectiveRecommendations[0] ||
                        decisionSnapshot?.primaryRecommendation ||
                        executiveSummary?.bullets[1] ||
                        "目前沒有額外的首要建議。"}
                    </p>
                  </div>
                </div>
              </div>

              <aside className="deliverable-hero-rail">
                <div className="section-card deliverable-rail-card">
                  <h4>目前檢視版本</h4>
                  <div className="detail-list">
                    <div className="detail-item">
                      <h3>版本 / 狀態</h3>
                      <p className="content-block">
                        {versionTag}｜{labelForDeliverableStatus(deliverableStatus)}
                      </p>
                    </div>
                    <div className="detail-item">
                      <h3>所屬案件</h3>
                      <p className="content-block">
                        {workspace.matter_workspace?.title || task.engagement?.name || "未掛案件"}
                      </p>
                    </div>
                    <div className="detail-item">
                      <h3>版本說明</h3>
                      <p className="content-block">{buildDeliverableStatusHint(deliverableStatus)}</p>
                    </div>
                    <div className="detail-item">
                      <h3>發布紀錄</h3>
                      <p className="content-block">
                        {workspace.publish_records[0]
                          ? `${workspace.publish_records[0].version_tag}｜${formatDisplayDate(
                              workspace.publish_records[0].created_at,
                            )}`
                          : "目前尚未建立正式發布紀錄。"}
                      </p>
                    </div>
                  </div>
                </div>

                {workspace.version_events[0] ? (
                  <div className="section-card deliverable-rail-card">
                    <h4>最新版本事件</h4>
                    <p className="content-block">{workspace.version_events[0].summary}</p>
                    <p className="muted-text">
                      {labelForDeliverableEventType(workspace.version_events[0].event_type)}｜
                      {formatDisplayDate(workspace.version_events[0].created_at)}
                    </p>
                  </div>
                ) : null}

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
                <p className="panel-copy">先把標題、版本與發布狀態整理乾淨，再繼續修摘要、建議、風險與行動項目。</p>
              </div>
            </div>
            <div className="form-grid">
              <div className="summary-grid">
                <div className="section-card">
                  <h4>目前版本</h4>
                  <p className="content-block">{versionTag}</p>
                  <p className="muted-text">{workspace.is_latest_for_task ? "這是目前 task 最新版本。" : "這份交付物已不是最新版本。"}</p>
                </div>
                <div className="section-card">
                  <h4>發布狀態</h4>
                  <p className="content-block">{labelForDeliverableStatus(deliverableStatus)}</p>
                  <p className="muted-text">{buildDeliverableStatusHint(deliverableStatus)}</p>
                </div>
              </div>

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
                  <small>草稿 → 待確認 → 定稿 → 封存，讓版本標記與發布狀態保持一致。</small>
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

              <div className="field">
                <label htmlFor="deliverable-event-note">版本備註</label>
                <textarea
                  id="deliverable-event-note"
                  value={draftEventNote}
                  onChange={(event) => {
                    setDraftEventNote(event.target.value);
                    setSaveMessage(null);
                  }}
                  placeholder="可選填：記下這次版本更新、送審說明或定稿備註。"
                />
              </div>

              <div className="summary-grid">
                <div className="field">
                  <label htmlFor="deliverable-executive-summary">摘要</label>
                  <textarea
                    id="deliverable-executive-summary"
                    value={draftContentSections.executive_summary}
                    onChange={(event) => {
                      setDraftContentSections((current) => ({
                        ...current,
                        executive_summary: event.target.value,
                      }));
                      setSaveMessage(null);
                    }}
                    placeholder="用正式交付物口徑整理這個版本的摘要。"
                  />
                </div>
                <div className="field">
                  <label htmlFor="deliverable-recommendations">建議與風險</label>
                  <textarea
                    id="deliverable-recommendations"
                    value={draftContentSections.recommendations}
                    onChange={(event) => {
                      setDraftContentSections((current) => ({
                        ...current,
                        recommendations: event.target.value,
                      }));
                      setSaveMessage(null);
                    }}
                    placeholder="每行一則建議。"
                  />
                </div>
                <div className="field">
                  <label htmlFor="deliverable-risks">缺口與風險</label>
                  <textarea
                    id="deliverable-risks"
                    value={draftContentSections.risks}
                    onChange={(event) => {
                      setDraftContentSections((current) => ({
                        ...current,
                        risks: event.target.value,
                      }));
                      setSaveMessage(null);
                    }}
                    placeholder="每行一則風險或待補缺口。"
                  />
                </div>
                <div className="field">
                  <label htmlFor="deliverable-action-items">行動項目</label>
                  <textarea
                    id="deliverable-action-items"
                    value={draftContentSections.action_items}
                    onChange={(event) => {
                      setDraftContentSections((current) => ({
                        ...current,
                        action_items: event.target.value,
                      }));
                      setSaveMessage(null);
                    }}
                    placeholder="每行一項行動建議。"
                  />
                </div>
                <div className="field">
                  <label htmlFor="deliverable-evidence-basis">依據來源</label>
                  <textarea
                    id="deliverable-evidence-basis"
                    value={draftContentSections.evidence_basis}
                    onChange={(event) => {
                      setDraftContentSections((current) => ({
                        ...current,
                        evidence_basis: event.target.value,
                      }));
                      setSaveMessage(null);
                    }}
                    placeholder="每行一則依據來源、證據或工作物件。"
                  />
                </div>
                <div className="field">
                  <label htmlFor="deliverable-publish-note">發布說明</label>
                  <textarea
                    id="deliverable-publish-note"
                    value={draftPublishNote}
                    onChange={(event) => {
                      setDraftPublishNote(event.target.value);
                      setExportMessage(null);
                    }}
                    placeholder="正式發布時要一起寫入 publish record 的說明。"
                  />
                </div>
              </div>

              <div className="button-row">
                <button
                  className="button-primary"
                  type="button"
                  onClick={() => void handleSaveWorkspace()}
                  disabled={isSaving || isPublishing}
                >
                  {isSaving ? "儲存中..." : "儲存正式內容"}
                </button>
                <button
                  className="button-secondary"
                  type="button"
                  onClick={() => void handleSaveWorkspace("pending_confirmation")}
                  disabled={isSaving || isPublishing}
                >
                  送往待確認
                </button>
                <button
                  className="button-secondary"
                  type="button"
                  onClick={() => void handlePublishRelease()}
                  disabled={isSaving || isPublishing}
                >
                  {isPublishing ? "發布中..." : "正式發布"}
                </button>
                <button
                  className="button-secondary"
                  type="button"
                  onClick={() => void handleSaveWorkspace("archived")}
                  disabled={isSaving || isPublishing}
                >
                  封存版本
                </button>
              </div>

              <div className="button-row">
                <button
                  className="button-secondary"
                  type="button"
                  onClick={() => void handleExportEntry("markdown")}
                  disabled={Boolean(activeExportFormat) || isSaving || isPublishing || hasUnsavedChanges}
                >
                  {activeExportFormat === "markdown" ? "匯出中..." : "匯出 Markdown"}
                </button>
                <button
                  className="button-secondary"
                  type="button"
                  onClick={() => void handleExportEntry("docx")}
                  disabled={Boolean(activeExportFormat) || isSaving || isPublishing || hasUnsavedChanges}
                >
                  {activeExportFormat === "docx" ? "匯出中..." : "匯出 DOCX"}
                </button>
              </div>
              <p className="muted-text">
                正式版本紀錄、artifact 與 publish record 只會寫入後端；若後端暫時不可用，這裡會直接報錯並保留目前內容，不會假裝成功。
              </p>
              {hasUnsavedChanges ? (
                <p className="muted-text">目前有未儲存變更；匯出會先要求你把內容落盤，正式發布則會直接把目前內容寫入後端並建立發布紀錄。</p>
              ) : null}
              {saveMessage ? (
                <p className={saveTone === "error" ? "error-text" : "success-text"}>
                  {saveMessage}
                </p>
              ) : null}
              {exportMessage ? (
                <p className={exportTone === "error" ? "error-text" : "success-text"}>
                  {exportMessage}
                </p>
              ) : null}
              {retryAction ? (
                <div className="button-row">
                  <button className="button-secondary" type="button" onClick={handleRetryAction}>
                    重試上一個正式操作
                  </button>
                </div>
              ) : null}
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

                {executiveSummary || effectiveExecutiveSummary ? (
                  <div className="detail-item" style={{ marginTop: "16px" }}>
                    <h3>工作摘要</h3>
                    <p className="content-block">{displaySummary || effectiveExecutiveSummary}</p>
                    <h3 style={{ marginTop: "16px" }}>正式摘要</h3>
                    <p className="content-block">{effectiveExecutiveSummary}</p>
                    {(executiveSummary?.bullets?.length || effectiveRecommendations.length) > 0 ? (
                      <>
                        <h3 style={{ marginTop: "16px" }}>重點摘要</h3>
                        <CompactList
                          items={
                            executiveSummary?.bullets?.length
                              ? executiveSummary.bullets
                              : effectiveRecommendations.slice(0, 4)
                          }
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
                    {effectiveRecommendations.length > 0 ? (
                      <CompactList
                        items={effectiveRecommendations}
                        emptyText="目前沒有可顯示的建議。"
                      />
                    ) : (
                      <p className="empty-text">目前沒有可顯示的建議。</p>
                    )}
                  </div>

                  <div className="detail-item">
                    <h3>風險</h3>
                    {effectiveRisks.length > 0 ? (
                      <CompactList
                        items={effectiveRisks}
                        emptyText="目前沒有可顯示的風險。"
                      />
                    ) : (
                      <p className="empty-text">目前沒有可顯示的風險。</p>
                    )}
                  </div>

                  <div className="detail-item">
                    <h3>行動項目</h3>
                    {effectiveActionItems.length > 0 ? (
                      <CompactList
                        items={effectiveActionItems}
                        emptyText="目前沒有可顯示的行動項目。"
                      />
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
                      <p className="content-block">
                        {effectiveEvidenceBasis[0] || deliverableBacklink.evidenceBasis}
                      </p>
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
                      <h3>正式依據來源</h3>
                      <CompactList
                        items={effectiveEvidenceBasis}
                        emptyText="目前尚未寫入正式依據來源。"
                      />
                    </div>
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
                    <p className="panel-copy">這裡直接讀正式 backend 版本事件、artifact registry 與 publish record，清楚區分內容更新、匯出與正式發布。</p>
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
                  {workspace.version_events.length ? (
                    workspace.version_events.map((item) => (
                      <div className="detail-item" key={item.id}>
                        <div className="meta-row">
                          <span className="pill">{labelForDeliverableEventType(item.event_type)}</span>
                          <span>{item.version_tag}</span>
                          {item.deliverable_status ? (
                            <span>{labelForDeliverableStatus(item.deliverable_status)}</span>
                          ) : null}
                          <span>{formatDisplayDate(item.created_at)}</span>
                        </div>
                        <h3>{item.summary}</h3>
                        {buildDeliverableEventDetail(item) ? (
                          <p className="muted-text">{buildDeliverableEventDetail(item)}</p>
                        ) : null}
                      </div>
                    ))
                  ) : null}
                  <div className="detail-item">
                    <h3>正式發布紀錄</h3>
                    {workspace.publish_records.length > 0 ? (
                      <div className="section-list">
                        {workspace.publish_records.map((record) => (
                          <div className="section-card" key={record.id}>
                            <h4>
                              {record.version_tag}｜{labelForDeliverableStatus(record.deliverable_status || "final")}
                            </h4>
                            <p className="muted-text">
                              {formatDisplayDate(record.created_at)}｜{record.artifact_formats
                                .map((item) => item.toUpperCase())
                                .join(" / ") || "未列出 artifact"}
                            </p>
                            <p className="content-block">
                              {record.publish_note || "這次發布沒有額外備註。"}
                            </p>
                            {record.artifact_records.length > 0 ? (
                              <div className="button-row" style={{ marginTop: "12px" }}>
                                {record.artifact_records.map((artifact) => (
                                  <button
                                    key={artifact.id}
                                    className="button-secondary"
                                    type="button"
                                    onClick={() =>
                                      void handleArtifactDownload(
                                        artifact.id,
                                        artifact.file_name,
                                        artifact.artifact_format,
                                      )
                                    }
                                    disabled={
                                      artifact.availability_state !== "available" ||
                                      activeArtifactDownloadId === artifact.id
                                    }
                                  >
                                    {activeArtifactDownloadId === artifact.id
                                      ? "下載中..."
                                      : `下載 ${artifact.artifact_format.toUpperCase()}`}
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <p className="muted-text">這筆舊發布紀錄目前只有 metadata backfill，尚無可下載 artifact。</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="empty-text">目前尚未建立正式發布紀錄。</p>
                    )}
                  </div>
                  <div className="detail-item">
                    <h3>Artifact Registry</h3>
                    {workspace.artifact_records.length > 0 ? (
                      <div className="section-list">
                        {workspace.artifact_records.map((artifact) => (
                          <div className="section-card" key={artifact.id}>
                            <h4>
                              {artifact.file_name}
                            </h4>
                            <p className="muted-text">
                              {artifact.artifact_kind === "release" ? "正式發布 artifact" : "匯出 artifact"}｜
                              {artifact.artifact_format.toUpperCase()}｜
                              {artifact.version_tag}｜
                              {formatDisplayDate(artifact.created_at)}
                            </p>
                            <p className="content-block">
                              {artifact.availability_state === "available"
                                ? `可下載｜${formatArtifactFileSize(artifact.file_size)}`
                                : "目前只有 metadata backfill，尚無可下載內容。"}
                            </p>
                            <div className="button-row" style={{ marginTop: "12px" }}>
                              <button
                                className="button-secondary"
                                type="button"
                                onClick={() =>
                                  void handleArtifactDownload(
                                    artifact.id,
                                    artifact.file_name,
                                    artifact.artifact_format,
                                  )
                                }
                                disabled={
                                  artifact.availability_state !== "available" ||
                                  activeArtifactDownloadId === artifact.id
                                }
                              >
                                {activeArtifactDownloadId === artifact.id
                                  ? "下載中..."
                                  : "下載 artifact"}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="empty-text">目前尚未建立 artifact registry 紀錄。</p>
                    )}
                  </div>
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
