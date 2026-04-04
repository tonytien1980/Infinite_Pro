"use client";

import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";

import {
  applyDeliverableFeedback,
  applyMatterContinuationAction,
  downloadDeliverableArtifact,
  exportDeliverableDocx,
  exportDeliverableMarkdown,
  getDeliverableWorkspace,
  publishDeliverableRelease,
  rollbackDeliverableContentRevision,
  updateDeliverablePrecedentCandidateStatus,
} from "@/lib/api";
import {
  assessTaskReadiness,
  buildActionItemCards,
  buildCapabilityFrame,
  buildDecisionSnapshot,
  buildDeliverableBacklinkView,
  buildDeliverableWorkspaceView,
  buildExecutiveSummary,
  buildFlagshipDetailView,
  buildFlagshipLaneView,
  buildPackSelectionView,
  buildReadinessGovernance,
  buildRecommendationCards,
  buildRiskCards,
} from "@/lib/advisory-workflow";
import { AdoptionFeedbackControls } from "@/components/adoption-feedback-controls";
import {
  buildContinuationDetailView,
  buildContinuationFocusSummary,
} from "@/lib/continuation-advisory";
import { buildContinuationPostureView } from "@/lib/continuity-ux";
import { buildMaterialReviewPostureView } from "@/lib/material-review-ux";
import {
  buildPrecedentCandidateActionView,
  buildPrecedentCandidateView,
} from "@/lib/precedent-candidates";
import { buildCommonRiskLibraryView } from "@/lib/common-risk-libraries";
import { buildDeliverableTemplateView } from "@/lib/deliverable-templates";
import { buildDeliverableShapeHintView } from "@/lib/deliverable-shape-hints";
import { buildPrecedentReferenceView } from "@/lib/precedent-reference";
import { buildResearchDetailView } from "@/lib/research-lane";
import { buildReviewLensView } from "@/lib/review-lenses";
import { normalizeOperatorDisplayName } from "@/lib/operator-identity";
import { truncateText } from "@/lib/text-format";
import type {
  AdoptionFeedbackPayload,
  DeliverableContentRevision,
  DeliverableWorkspace,
  ObjectSet,
  ObjectSetMember,
  RetrievalProvenance,
} from "@/lib/types";
import {
  labelForApprovalStatus,
  labelForAuditEventType,
  formatDisplayDate,
  labelForAgentId,
  labelForAdoptionFeedbackStatus,
  labelForDeliverableEventType,
  labelForDeliverableStatus,
  labelForEngagementContinuityMode,
  labelForEvidenceType,
  labelForObjectSetCreationMode,
  labelForObjectSetLifecycleStatus,
  labelForObjectSetMembershipSource,
  labelForObjectSetScope,
  labelForObjectSetType,
  labelForRetrievalSupportKind,
  labelForSourceType,
  labelForWritebackDepth,
} from "@/lib/ui-labels";
import {
  type DeliverableLifecycleStatus,
  useOperatorIdentitySettings,
} from "@/lib/workbench-store";
import {
  buildDeliverableSaveFeedback,
  isRetriableWorkspaceError,
  persistDeliverableWorkspace,
} from "@/lib/workspace-persistence";
import { WorkspaceSectionGuide } from "@/components/workspace-section-guide";

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
      {items.map((item, index) => (
        <li key={`${item}-${index}`}>{item}</li>
      ))}
    </ul>
  );
}

function DisclosurePanel({
  id,
  title,
  description,
  children,
}: {
  id?: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <details className="panel disclosure-panel section-anchor" id={id}>
      <summary className="disclosure-summary">
        <div>
          <h2 className="section-title">{title}</h2>
          <p className="panel-copy">{description}</p>
        </div>
        <span className="pill">展開</span>
      </summary>
      <div className="disclosure-body">{children}</div>
    </details>
  );
}

function DeliverableRetrievalProvenance({
  provenance,
}: {
  provenance: RetrievalProvenance | null;
}) {
  if (!provenance) {
    return null;
  }

  return (
    <div style={{ marginTop: "10px" }}>
      <p className="muted-text">
        <strong>{labelForRetrievalSupportKind(provenance.support_kind)}：</strong>
        {[provenance.source_document_title, provenance.locator_label].filter(Boolean).join("｜") || "未標示"}
      </p>
      {provenance.excerpt_text ? (
        <p className="content-block">{provenance.excerpt_text}</p>
      ) : provenance.preview_text ? (
        <p className="muted-text">{provenance.preview_text}</p>
      ) : null}
    </div>
  );
}

function getObjectSetMemberAnchor(member: {
  member_object_type: string;
  member_object_id: string;
}) {
  return `deliverable-object-set-member-${member.member_object_type}-${member.member_object_id}`;
}

const OBJECT_SET_DEFAULT_VISIBLE_LIMITS: Record<string, number> = {
  clause_obligation_set_v1: 6,
  process_issue_set_v1: 6,
  evidence_set_v1: 4,
  risk_set_v1: 5,
};

function getObjectSetVisibleLimit(setType: string) {
  return OBJECT_SET_DEFAULT_VISIBLE_LIMITS[setType] ?? 4;
}

function buildObjectSetSummaryLine(objectSet: ObjectSet) {
  const members = objectSet.members;
  const visibleLimit = getObjectSetVisibleLimit(objectSet.set_type);
  const hiddenCount = Math.max(0, members.length - visibleLimit);

  let summary = `${objectSet.member_count} 個成員`;
  if (objectSet.set_type === "clause_obligation_set_v1") {
    const clauseCount = members.filter((item) => item.member_object_type === "clause").length;
    const obligationCount = members.filter((item) => item.member_object_type === "obligation").length;
    summary = `條款 ${clauseCount} 項 / 義務 ${obligationCount} 項`;
  }
  if (objectSet.set_type === "process_issue_set_v1") {
    const metadata = members.map((item) =>
      item.member_metadata && typeof item.member_metadata === "object" && !Array.isArray(item.member_metadata)
        ? item.member_metadata
        : {},
    );
    const issueTypeCount = (value: string) =>
      metadata.filter((item) => item.issue_type === value).length;
    summary =
      `瓶頸 ${issueTypeCount("capacity_bottleneck")} 項 / 控制缺口 ${issueTypeCount("control_gap")} 項` +
      ` / 依賴阻塞 ${issueTypeCount("dependency_block")} 項`;
  }
  if (hiddenCount > 0) {
    summary += `｜預設先看 ${visibleLimit} 項，其餘 ${hiddenCount} 項按需展開`;
  }
  return summary;
}

function buildObjectSetViewList(objectSets: ObjectSet[]) {
  return objectSets.map((item) => ({
    title: item.display_title,
    meta: `${labelForObjectSetType(item.set_type)}｜${labelForObjectSetScope(item.scope_type)}｜${buildObjectSetSummaryLine(item)}`,
  }));
}

function hasClauseObligationSet(objectSets: ObjectSet[]) {
  return objectSets.some((item) => item.set_type === "clause_obligation_set_v1");
}

function hasProcessIssueSet(objectSets: ObjectSet[]) {
  return objectSets.some((item) => item.set_type === "process_issue_set_v1");
}

function buildObjectSetSectionTitle(objectSets: ObjectSet[]) {
  const hasClause = hasClauseObligationSet(objectSets);
  const hasProcess = hasProcessIssueSet(objectSets);
  if (hasClause && hasProcess) {
    return "證據集、風險群組、條款集與流程問題集";
  }
  if (hasClause) {
    return "證據集、風險群組與條款集";
  }
  if (hasProcess) {
    return "證據集、風險群組與流程問題集";
  }
  return "證據集與風險群組";
}

function buildObjectSetSectionCopy(objectSets: ObjectSet[]) {
  const hasClause = hasClauseObligationSet(objectSets);
  const hasProcess = hasProcessIssueSet(objectSets);
  if (hasClause && hasProcess) {
    return "當你要集中查看這次交付真正採用的證據、已納入範圍的風險、正式引用的條款與義務，或這輪要優先修的流程問題時，再切進這個集合視角；平常首屏不用先看這層。";
  }
  if (hasClause) {
    return "當你要集中查看這次交付真正採用的證據、已納入範圍的風險，或這輪正式引用的條款與義務時，再切進這個集合視角；平常首屏不用先看這層。";
  }
  if (hasProcess) {
    return "當你要集中查看這次交付真正採用的證據、已納入範圍的風險，或這輪要優先修的流程瓶頸、依賴阻塞與控制缺口時，再切進這個集合視角；平常首屏不用先看這層。";
  }
  return "當你要集中查看這次交付真正採用的證據，或這輪工作已納入範圍的風險時，再切進這個集合視角；平常首屏不用先看這層。";
}

function getObjectSetPrimarySourceLabel(objectSet: ObjectSet) {
  const primarySource = objectSet.membership_source_summary?.primary_source;
  return labelForObjectSetMembershipSource(
    typeof primarySource === "string" ? primarySource : null,
  );
}

function labelForObjectSetMemberType(value: string) {
  if (value === "evidence") {
    return "證據";
  }
  if (value === "risk") {
    return "風險";
  }
  if (value === "clause") {
    return "條款";
  }
  if (value === "obligation") {
    return "義務";
  }
  if (value === "process_issue") {
    return "流程問題";
  }
  return "工作項目";
}

function readProcessIssueMetadata(member: ObjectSetMember) {
  const payload = member.member_metadata;
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }
  return {
    issueType:
      typeof payload.issue_type === "string" && payload.issue_type ? payload.issue_type : null,
    severity: typeof payload.severity === "string" && payload.severity ? payload.severity : null,
    affectedProcessStep:
      typeof payload.affected_process_step === "string" && payload.affected_process_step
        ? payload.affected_process_step
        : null,
    ownerState:
      typeof payload.owner_state === "string" && payload.owner_state ? payload.owner_state : null,
    dependencyHint:
      typeof payload.dependency_hint === "string" && payload.dependency_hint
        ? payload.dependency_hint
        : null,
    controlGapHint:
      typeof payload.control_gap_hint === "string" && payload.control_gap_hint
        ? payload.control_gap_hint
        : null,
  };
}

function getVisibleObjectSetMembers(objectSet: ObjectSet) {
  return objectSet.members.slice(0, getObjectSetVisibleLimit(objectSet.set_type));
}

function getHiddenObjectSetMembers(objectSet: ObjectSet) {
  return objectSet.members.slice(getObjectSetVisibleLimit(objectSet.set_type));
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
  if (event.event_type === "content_rolled_back" && changedSections.length > 0) {
    return `回退區塊：${changedSections.join("、")}`;
  }
  if (event.event_type === "content_updated" && changedSections.length > 0) {
    return `更新區塊：${changedSections.join("、")}`;
  }

  return "";
}

function labelForContentRevisionSource(source: string) {
  if (source === "rollback") {
    return "回退修訂";
  }
  if (source === "runtime_backfill") {
    return "基線回填";
  }
  return "手動編修";
}

function labelForContentDiffChangeType(changeType: string) {
  if (changeType === "added") {
    return "新增";
  }
  if (changeType === "cleared") {
    return "清空";
  }
  return "更新";
}

function revisionMatchesCurrentContent(
  revision: DeliverableContentRevision,
  workspace: DeliverableWorkspace,
) {
  return JSON.stringify(revision.snapshot) === JSON.stringify(workspace.content_sections);
}

function normalizeFormalDeliverableError(error: unknown, defaultMessage: string) {
  const status = (error as Error & { status?: number }).status;
  if (typeof status === "number" && status < 500 && error instanceof Error) {
    return error.message;
  }

  if (error instanceof Error && error.message && error.message !== "Failed to fetch") {
    return `${error.message} 這次正式操作沒有改寫本機假資料，請在後端恢復後重試。`;
  }

  return `${defaultMessage} 後端目前不可用；這次正式操作沒有改寫本機假資料，請在服務恢復後重試。`;
}

export function DeliverableWorkspacePanel({ deliverableId }: { deliverableId: string }) {
  const [operatorIdentity] = useOperatorIdentitySettings();
  const [workspace, setWorkspace] = useState<DeliverableWorkspace | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftSummary, setDraftSummary] = useState("");
  const [draftStatus, setDraftStatus] = useState<DeliverableLifecycleStatus>("draft");
  const [draftVersionTag, setDraftVersionTag] = useState("");
  const [draftEventNote, setDraftEventNote] = useState("");
  const [draftPublishNote, setDraftPublishNote] = useState("");
  const [draftInitialized, setDraftInitialized] = useState(false);
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
  const [isApplyingContinuation, setIsApplyingContinuation] = useState(false);
  const [isApplyingDeliverableFeedback, setIsApplyingDeliverableFeedback] = useState(false);
  const [activeExportFormat, setActiveExportFormat] = useState<"markdown" | "docx" | null>(null);
  const [activeArtifactDownloadId, setActiveArtifactDownloadId] = useState<string | null>(null);
  const [retryAction, setRetryAction] = useState<
    | null
    | { kind: "save"; status?: DeliverableLifecycleStatus }
    | { kind: "publish" }
    | { kind: "export"; format: "markdown" | "docx" }
    | { kind: "rollback"; revisionId: string }
  >(null);
  const [rollingBackRevisionId, setRollingBackRevisionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deliverableFeedbackMessage, setDeliverableFeedbackMessage] = useState<string | null>(null);
  const [deliverableCandidateMessage, setDeliverableCandidateMessage] = useState<string | null>(null);
  const [activeDeliverableCandidateStatus, setActiveDeliverableCandidateStatus] = useState<
    "candidate" | "promoted" | "dismissed" | null
  >(null);

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
    setDraftPublishNote("");
  }, [deliverableId]);

  useEffect(() => {
    if (!workspace) {
      setDraftInitialized(false);
      return;
    }

    setDraftInitialized(false);
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
    setDraftContentSections({
      executive_summary: nextResolvedSections.executive_summary,
      recommendations: joinLineItems(nextResolvedSections.recommendations),
      risks: joinLineItems(nextResolvedSections.risks),
      action_items: joinLineItems(nextResolvedSections.action_items),
      evidence_basis: joinLineItems(nextResolvedSections.evidence_basis),
    });
    setDraftInitialized(true);
  }, [deliverableId, workspace]);

  const task = workspace?.task ?? null;
  const deliverable = workspace?.deliverable ?? null;
  const deliverableCandidateView = buildPrecedentCandidateView(deliverable?.precedent_candidate);
  const deliverableCandidateActions = deliverable?.precedent_candidate
    ? buildPrecedentCandidateActionView(deliverable.precedent_candidate)
    : null;
  const continuationSurface = workspace?.continuation_surface ?? null;
  const followUpLane = continuationSurface?.follow_up_lane ?? null;
  const progressionLane = continuationSurface?.progression_lane ?? null;
  const continuationFocusSummary = buildContinuationFocusSummary(continuationSurface);
  const continuationDetailView = buildContinuationDetailView(continuationSurface);
  const researchDetailView = buildResearchDetailView(null, workspace?.research_runs[0] ?? null);
  const precedentReferenceView = task
    ? buildPrecedentReferenceView(task.precedent_reference_guidance)
    : null;
  const reviewLensView = task ? buildReviewLensView(task.review_lens_guidance) : null;
  const commonRiskLibraryView = task
    ? buildCommonRiskLibraryView(task.common_risk_guidance)
    : null;
  const deliverableShapeHintView = task
    ? buildDeliverableShapeHintView(task.deliverable_shape_guidance)
    : null;
  const deliverableTemplateView = task
    ? buildDeliverableTemplateView(task.deliverable_template_guidance)
    : null;
  const continuityPosture = buildContinuationPostureView(continuationSurface);
  const workspaceView = workspace ? buildDeliverableWorkspaceView(workspace) : null;
  const flagshipLane = task ? buildFlagshipLaneView(task.flagship_lane) : null;
  const flagshipDetailView = buildFlagshipDetailView(flagshipLane);
  const materialReviewPosture = buildMaterialReviewPostureView(flagshipLane);
  const readiness = task ? assessTaskReadiness(task) : null;
  const readinessGovernance =
    task && deliverable && readiness ? buildReadinessGovernance(task, deliverable, readiness) : null;
  const executiveSummary = task && deliverable ? buildExecutiveSummary(task, deliverable) : null;
  const decisionSnapshot = task && deliverable ? buildDecisionSnapshot(task, deliverable) : null;
  const preferredWorldDecisionContext = task?.world_decision_context || task?.decision_context || null;
  const sliceDecisionContext = task?.slice_decision_context || null;
  const sharedEvidenceParticipationCount = workspace
    ? new Set(
        [
          ...workspace.linked_source_materials
            .filter((item) => (item.participation?.participation_task_count ?? 0) > 1)
            .map((item) => item.id),
          ...workspace.linked_evidence
            .filter((item) => (item.participation?.participation_task_count ?? 0) > 1)
            .map((item) => item.id),
        ],
      ).size
    : 0;
  const pendingApprovalCount =
    (workspace?.decision_records.filter((item) => item.approval_status === "pending").length ?? 0) +
    (workspace?.action_plans.filter((item) => item.approval_status === "pending").length ?? 0);
  const recentAuditEvents = workspace?.audit_events.slice(0, 4) ?? [];
  const canonicalizationSummary = task?.canonicalization_summary ?? null;
  const canonicalizationCandidates = task?.canonicalization_candidates.slice(0, 3) ?? [];
  const canonicalizationMatterId = task?.matter_workspace?.id ?? workspace?.matter_workspace?.id ?? null;
  const recommendations = task && deliverable ? buildRecommendationCards(task, deliverable) : [];
  const risks = task && deliverable ? buildRiskCards(task, deliverable) : [];
  const actionItems = task && deliverable ? buildActionItemCards(task, deliverable) : [];
  const capabilityFrame = task && deliverable ? buildCapabilityFrame(task, deliverable) : null;
  const packSelection = task && deliverable ? buildPackSelectionView(task, deliverable) : null;
  const deliverableBacklink = task && deliverable ? buildDeliverableBacklinkView(task, deliverable) : null;
  const objectSets = workspace?.object_sets ?? [];
  const objectSetHighlights = buildObjectSetViewList(objectSets);
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
  const latestContentRevision = workspace?.content_revisions[0] ?? null;
  const latestPublishRecord = workspace?.publish_records[0] ?? null;
  const hasUnpublishedContentChanges = Boolean(
    latestContentRevision &&
      latestPublishRecord &&
      new Date(latestContentRevision.created_at).getTime() >
      new Date(latestPublishRecord.created_at).getTime(),
  );
  const hasPendingFormalSave = Boolean(
    workspace &&
      resolvedSections &&
      (
        (workspace.content_sections.executive_summary || "") !== resolvedSections.executive_summary ||
        joinLineItems(workspace.content_sections.recommendations) !==
          joinLineItems(resolvedSections.recommendations) ||
        joinLineItems(workspace.content_sections.risks) !==
          joinLineItems(resolvedSections.risks) ||
        joinLineItems(workspace.content_sections.action_items) !==
          joinLineItems(resolvedSections.action_items) ||
        joinLineItems(workspace.content_sections.evidence_basis) !==
          joinLineItems(resolvedSections.evidence_basis)
      ),
  );
  const hasUnsavedChanges = Boolean(
    draftInitialized &&
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
  const requiresSaveBeforeFormalActions = hasPendingFormalSave || hasUnsavedChanges;
  const deliverableActionTitle =
    requiresSaveBeforeFormalActions
      ? "先把正式內容落盤，再匯出或發布"
      : continuationSurface?.workflow_layer === "checkpoint"
      ? "這份交付物屬於回來更新 / checkpoint 版本"
      : continuationSurface?.workflow_layer === "progression"
        ? "這份交付物承接持續推進 / outcome 節奏"
      : materialReviewPosture.shouldShow
        ? "這份交付物屬於材料審閱 / review memo"
      : deliverableStatus === "final"
      ? "這份交付物已可匯出與回看"
      : deliverableStatus === "archived"
        ? "這是歷史版本，主要用來回看"
        : "先整理版本，再決定是否正式發布";
  const deliverableActionSummary =
    requiresSaveBeforeFormalActions
      ? hasPendingFormalSave
        ? "系統已先幫你整理出一版可用的正式草稿，但這些內容還沒正式寫回交付物工作面。先儲存，之後再匯出或發布會比較安全。"
        : "你目前有尚未儲存的修改。先把正式內容落盤，再做匯出、發布或版本比對，整體工作流會更穩。"
      : continuationSurface?.workflow_layer === "closure"
        ? continuationSurface.summary
      : continuationSurface?.workflow_layer === "checkpoint"
        ? followUpLane?.latest_update?.summary
            ? `${continuityPosture.primarySummary} 這份交付物目前對應這輪 checkpoint「${followUpLane.latest_update.summary}」。先確認這輪更新重點，再決定是回案件工作面補 checkpoint，還是先補件重跑。`
            : `${continuityPosture.primarySummary} 先回看結果，再決定要不要回案件工作面補一筆 checkpoint。`
          : continuationSurface?.workflow_layer === "progression"
            ? progressionLane?.latest_progression?.summary
              ? `${continuityPosture.primarySummary} 這份交付物目前承接持續推進狀態「${progressionLane.latest_progression.summary}」。先確認進度與 outcome 的最新變化，再決定要不要刷新交付物。`
              : `${continuityPosture.primarySummary} 先回看結論與依據，再回案件工作面記錄進度或結果。`
      : materialReviewPosture.shouldShow
        ? `${materialReviewPosture.primarySummary} 這份交付物目前更像 review memo / assessment 結果。若要升級成決策 / 行動交付，先補更多背景、來源或決策條件。`
      : deliverableStatus === "final"
        ? "現在最有效率的做法是匯出正式版本，或回到下方檢查依據來源、版本紀錄與連續性。"
      : deliverableStatus === "archived"
        ? "這份交付物目前以歷史回看為主；若要繼續推進，通常會回到較新的版本或原始工作紀錄。"
        : "先把版本標記、摘要與正文整理乾淨，再做正式發布；這樣會比直接在長頁面裡來回找區塊順手很多。";
  const deliverableActionChecklist = [
    "先確認這份交付物的標題、版本標記與狀態，避免在未整理版本時就直接發布。",
    hasPendingFormalSave
      ? "系統已先幫你整理出正式草稿，但還沒寫回正式內容；先儲存，再考慮匯出或發布。"
      : hasUnsavedChanges
        ? "你目前有尚未儲存的修改；先儲存，再考慮發布或匯出。"
        : "目前沒有尚未儲存的修改，可以直接回看依據來源、版本紀錄或做發布動作。",
    workspace
      ? `目前關聯 ${workspace.linked_evidence.length} 則證據、${workspace.high_impact_gaps.length} 個高影響缺口；發布前最好先看一眼依據鏈與限制。`
      : "目前沒有可讀的交付脈絡。",
  ];
  const deliverableSectionGuideItems = workspace
    ? [
        {
          href: "#deliverable-management",
          eyebrow: "先整理版本",
          title: "管理版本與正式內容",
          copy: "先把標題、版本標記、摘要與正文整理乾淨，再做發布或匯出。",
          meta: hasPendingFormalSave
            ? "系統已整理正式草稿，尚未落盤。"
            : hasUnsavedChanges
              ? "目前有未儲存修改。"
              : "目前沒有未儲存修改。",
          tone: requiresSaveBeforeFormalActions ? ("warm" as const) : ("accent" as const),
        },
        {
          href: "#deliverable-reading",
          eyebrow: "先看結果",
          title: "交付摘要",
          copy: "用正式交付物口徑回看結論、建議、風險與行動，而不是只看原任務結果。",
          meta: decisionSnapshot?.conclusion || effectiveExecutiveSummary || "先看這份交付物的核心結論。",
          tone: "accent" as const,
        },
        {
          href: "#deliverable-evidence",
          eyebrow: "回看依據",
          title: "依據來源與工作回鏈",
          copy: "當你要確認這份交付物憑什麼成立，就回到這裡看來源、工作物件與證據。",
          meta: `${workspace.linked_source_materials.length} 份來源材料 / ${workspace.linked_evidence.length} 則證據`,
          tone: "default" as const,
        },
        ...(objectSetHighlights.length > 0
          ? [
              {
                href: "#deliverable-object-sets",
                eyebrow: "整理範圍",
                title: "證據集與風險群組",
                copy: "需要集中查看這次交付真正採用的證據或已納入範圍的風險時，從這裡進入集合視角。",
                meta: objectSetHighlights.map((item) => item.meta).join("｜"),
                tone: "default" as const,
              },
            ]
          : []),
        {
          href: "#deliverable-confidence",
          eyebrow: "核對適用範圍",
          title: "可信度、限制與缺口",
          copy: "發布前先檢查這份交付物目前能支撐到什麼程度，以及還有哪些高影響缺口。",
          meta:
            workspaceView?.confidenceSummary ||
            "先確認這份交付物目前憑什麼成立，以及還有哪些限制與缺口。",
          tone: workspace.high_impact_gaps.length > 0 ? ("warm" as const) : ("default" as const),
        },
        {
          href: "#deliverable-history",
          eyebrow: "需要回看時",
          title: "修訂與版本紀錄",
          copy: "只有在你要比較版本、rollback 或確認發布 artifact 時，再往下看這層歷史。",
          meta: workspace.version_events[0]?.summary || "可回看正文修訂與正式發布紀錄。",
          tone: "default" as const,
        },
      ]
    : [];
  const deliverableVersionSummary = latestPublishRecord
    ? `最近正式發布：${latestPublishRecord.version_tag}｜${formatDisplayDate(latestPublishRecord.created_at)}`
    : "目前尚未建立正式發布紀錄。";
  const deliverableConfidenceSurfaceSummary =
    workspaceView?.confidenceSummary ||
    "先確認這份交付物目前憑什麼成立，以及還有哪些限制與缺口。";
  const deliverableContinuitySummary = followUpLane?.latest_update?.summary
    ? `回來更新 / checkpoint｜${followUpLane.latest_update.summary}`
    : progressionLane?.latest_progression?.summary
      ? `持續推進 / outcome｜${progressionLane.latest_progression.summary}`
      : materialReviewPosture.shouldShow
        ? `材料審閱 / review memo｜${materialReviewPosture.boundaryNote}`
      : continuationSurface?.workflow_layer === "closure"
        ? "這個單次案件已具備基本脈絡、證據與交付結果，下一步應偏向正式結案、發布或匯出。"
      : continuationSurface?.summary
        || "這份交付物目前沒有額外的連續性提示。";

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

  async function handleDeliverableFeedback(payload: AdoptionFeedbackPayload) {
    if (!deliverable) {
      return;
    }
    const operatorLabel = normalizeOperatorDisplayName(operatorIdentity.operatorDisplayName);

    try {
      setIsApplyingDeliverableFeedback(true);
      setDeliverableFeedbackMessage(null);
      setError(null);
      const response = await applyDeliverableFeedback(deliverable.id, {
        ...payload,
        operator_label: operatorLabel || undefined,
      });
      setWorkspace(response);
      const feedbackStatus = payload.feedback_status;
      setDeliverableFeedbackMessage(
        `已記錄這份交付物的回饋：${labelForAdoptionFeedbackStatus(feedbackStatus)}`,
      );
    } catch (feedbackError) {
      setError(feedbackError instanceof Error ? feedbackError.message : "記錄交付物回饋失敗。");
    } finally {
      setIsApplyingDeliverableFeedback(false);
    }
  }

  async function handleDeliverableCandidateStatus(
    candidateStatus: "candidate" | "promoted" | "dismissed",
  ) {
    if (!deliverable) {
      return;
    }
    const operatorLabel = normalizeOperatorDisplayName(operatorIdentity.operatorDisplayName);

    try {
      setActiveDeliverableCandidateStatus(candidateStatus);
      setDeliverableCandidateMessage(null);
      setError(null);
      const response = await updateDeliverablePrecedentCandidateStatus(deliverable.id, {
        candidate_status: candidateStatus,
        operator_label: operatorLabel || undefined,
      });
      setWorkspace(response);
      setDeliverableCandidateMessage(
        candidateStatus === "promoted"
          ? "這份交付物已升格成正式可重用模式。"
          : candidateStatus === "dismissed"
            ? "這份交付物已先停用，不列入 active 候選。"
            : "這份交付物已重新列回候選。"
      );
    } catch (candidateError) {
      setError(candidateError instanceof Error ? candidateError.message : "更新可重用候選狀態失敗。");
    } finally {
      setActiveDeliverableCandidateStatus(null);
    }
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
      setExportMessage(normalizeFormalDeliverableError(exportError, "匯出交付物失敗。"));
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
      setExportMessage(normalizeFormalDeliverableError(publishError, "正式發布交付物失敗。"));
      if (isRetriableWorkspaceError(publishError)) {
        setRetryAction({ kind: "publish" });
      }
    } finally {
      setIsPublishing(false);
    }
  }

  async function handleMatterContinuationAction(action: "close" | "reopen") {
    if (!workspace?.matter_workspace) {
      return;
    }

    try {
      setIsApplyingContinuation(true);
      await applyMatterContinuationAction(workspace.matter_workspace.id, { action });
      setWorkspace(await getDeliverableWorkspace(deliverableId));
      setSaveTone("success");
      setSaveMessage(
        action === "close"
          ? "案件已正式結案。"
          : "案件已重新開啟，可回到同一個案件世界續推。",
      );
    } catch (continuationError) {
      setSaveTone("error");
      setSaveMessage(
        continuationError instanceof Error
          ? continuationError.message
          : "執行 continuation action 失敗。",
      );
    } finally {
      setIsApplyingContinuation(false);
    }
  }

  async function handleRollbackRevision(revision: DeliverableContentRevision) {
    if (hasUnsavedChanges) {
      setSaveTone("error");
      setSaveMessage("目前仍有未儲存變更；請先儲存正式內容，再進行 rollback。");
      return;
    }

    const confirmed = window.confirm(
      "要把交付物正文回退到這筆修訂嗎？系統會留下新的 rollback revision 與版本事件，既有發布紀錄不會消失。",
    );
    if (!confirmed) {
      return;
    }

    setRollingBackRevisionId(revision.id);
    setRetryAction(null);
    try {
      const result = await rollbackDeliverableContentRevision(deliverableId, revision.id);
      setWorkspace(result);
      setDraftStatus(result.deliverable.status as DeliverableLifecycleStatus);
      setDraftVersionTag(result.deliverable.version_tag || draftVersionTag);
      setDraftPublishNote("");
      setDraftEventNote("");
      setSaveTone("success");
      setSaveMessage("已回退交付物正文，並留下新的 rollback revision 與版本事件。");
    } catch (rollbackError) {
      setSaveTone("error");
      setSaveMessage(normalizeFormalDeliverableError(rollbackError, "回退交付物正文失敗。"));
      if (isRetriableWorkspaceError(rollbackError)) {
        setRetryAction({ kind: "rollback", revisionId: revision.id });
      }
    } finally {
      setRollingBackRevisionId(null);
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
      setExportMessage(normalizeFormalDeliverableError(downloadError, "下載 artifact 失敗。"));
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
    if (retryAction.kind === "rollback") {
      const revision = workspace?.content_revisions.find((item) => item.id === retryAction.revisionId);
      if (revision) {
        void handleRollbackRevision(revision);
      }
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

      {loading ? (
        <p className="status-text" role="status" aria-live="polite">
          正在載入交付物工作面...
        </p>
      ) : null}
      {error ? (
        <p className="error-text" role="alert" aria-live="assertive">
          {error}
        </p>
      ) : null}

      {workspace && workspaceView && task && deliverable ? (
        <>
          <section className="hero-card deliverable-hero deliverable-workspace-hero">
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
                  {flagshipLane ? <span>{flagshipLane.currentOutputLabel}</span> : null}
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

                <div className="hero-focus-card">
                  <p className="hero-focus-label">{flagshipLane?.label || "這份交付物在回答什麼"}</p>
                  <h3 className="hero-focus-title">
                    {preferredWorldDecisionContext?.judgment_to_make ||
                      preferredWorldDecisionContext?.title ||
                      "目前尚未形成清楚的決策問題。"}
                  </h3>
                  <p className="hero-focus-copy">
                    {truncateText(
                      displaySummary ||
                        effectiveExecutiveSummary ||
                        flagshipLane?.currentOutputSummary ||
                        flagshipLane?.summary ||
                        decisionSnapshot?.conclusion ||
                        "目前沒有額外摘要。",
                      188,
                    )}
                  </p>
                </div>
              </div>

              <aside className="deliverable-hero-rail">
                <div className="hero-focus-card">
                  <p className="hero-focus-label">{deliverableActionTitle}</p>
                  <h3 className="hero-focus-title">先決定是整理版本，還是正式發布</h3>
                  <p className="hero-focus-copy">
                    {deliverableActionSummary}
                    {flagshipLane?.boundaryNote ? ` ${flagshipLane.boundaryNote}` : ""}
                  </p>
                  <div className="button-row" style={{ marginTop: "6px" }}>
                    {continuationSurface?.primary_action?.action_id === "close_case" &&
                    workspace?.matter_workspace ? (
                      <button
                        className="button-primary"
                        type="button"
                        onClick={() => void handleMatterContinuationAction("close")}
                        disabled={isApplyingContinuation}
                      >
                        {isApplyingContinuation ? "結案中..." : continuationSurface.primary_action.label}
                      </button>
                    ) : continuationSurface?.primary_action?.action_id === "reopen_case" &&
                      workspace?.matter_workspace ? (
                      <button
                        className="button-primary"
                        type="button"
                        onClick={() => void handleMatterContinuationAction("reopen")}
                        disabled={isApplyingContinuation}
                      >
                        {isApplyingContinuation ? "重新開啟中..." : continuationSurface.primary_action.label}
                      </button>
                    ) : continuationSurface?.primary_action?.action_id === "record_checkpoint" &&
                      workspace?.matter_workspace ? (
                      <Link
                        className="button-primary"
                        href={`/matters/${workspace.matter_workspace.id}#continuation-actions`}
                      >
                        {continuationSurface.primary_action.label}
                      </Link>
                    ) : continuationSurface?.primary_action?.action_id === "record_outcome" &&
                      workspace?.matter_workspace ? (
                      <Link
                        className="button-primary"
                        href={`/matters/${workspace.matter_workspace.id}#continuation-actions`}
                      >
                        {continuationSurface.primary_action.label}
                      </Link>
                    ) : requiresSaveBeforeFormalActions ? (
                      <button
                        className="button-primary"
                        type="button"
                        onClick={() => void handleSaveWorkspace()}
                        disabled={isSaving || isPublishing}
                      >
                        {isSaving
                          ? "儲存中..."
                          : hasPendingFormalSave
                            ? "先儲存正式草稿"
                            : "儲存正式內容"}
                      </button>
                    ) : deliverableStatus === "final" ? (
                      <button
                        className="button-primary"
                        type="button"
                        onClick={() => void handleExportEntry("docx")}
                        disabled={activeExportFormat === "docx"}
                      >
                        {activeExportFormat === "docx" ? "匯出中..." : "匯出 DOCX"}
                      </button>
                    ) : deliverableStatus !== "archived" ? (
                      <button
                        className="button-primary"
                        type="button"
                        onClick={() => void handlePublishRelease()}
                        disabled={isPublishing}
                      >
                        {isPublishing ? "發布中..." : "正式發布這個版本"}
                      </button>
                    ) : null}
                    <Link className="button-secondary" href="#deliverable-management">
                      整理版本與摘要
                    </Link>
                    {workspace?.matter_workspace ? (
                      <Link
                        className="button-secondary"
                        href={`/matters/${workspace.matter_workspace.id}#continuation-actions`}
                      >
                        回案件工作面續推
                      </Link>
                    ) : null}
                  </div>
                </div>

                <div className="section-card deliverable-rail-card">
                  <h4>採納回饋</h4>
                  <AdoptionFeedbackControls
                    surface="deliverable"
                    feedback={deliverable?.adoption_feedback}
                    description="先用很輕的方式標記這份交付物是否可直接採用；若願意再補半拍，系統會更知道這次為什麼可用。"
                    instanceId={`deliverable-${deliverable?.id ?? deliverableId}`}
                    isSubmitting={isApplyingDeliverableFeedback}
                    message={deliverableFeedbackMessage}
                    onApply={handleDeliverableFeedback}
                  />
                  {deliverableCandidateView.shouldShow ? (
                    <div style={{ marginTop: "12px" }}>
                      <p className="content-block">{deliverableCandidateView.badgeLabel}</p>
                      <p className="muted-text">目前狀態：{deliverableCandidateView.statusLabel}</p>
                      <p className="muted-text">{deliverableCandidateView.summary}</p>
                      {deliverableCandidateView.attributionSummary ? (
                        <p className="muted-text">{deliverableCandidateView.attributionSummary}</p>
                      ) : null}
                      {deliverableCandidateActions ? (
                        <div className="button-row" style={{ marginTop: "10px" }}>
                          {deliverableCandidateActions.actions.map((action) => (
                            <button
                              key={`deliverable-candidate-${action.nextStatus}`}
                              className="button-secondary"
                              type="button"
                              disabled={activeDeliverableCandidateStatus === action.nextStatus}
                              onClick={() => void handleDeliverableCandidateStatus(action.nextStatus)}
                            >
                              {activeDeliverableCandidateStatus === action.nextStatus
                                ? "處理中..."
                                : action.label}
                            </button>
                          ))}
                        </div>
                      ) : null}
                      {deliverableCandidateMessage ? (
                        <p className="success-text" role="status" aria-live="polite">
                          {deliverableCandidateMessage}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                <div className="section-card deliverable-rail-card workspace-rail-callout">
                  <h4>目前檢視版本</h4>
                  <div className="detail-list">
                    <div className="detail-item">
                      <h3>版本 / 狀態</h3>
                      <p className="content-block">
                        {versionTag}｜{labelForDeliverableStatus(deliverableStatus)}
                      </p>
                    </div>
                    <div className="detail-item">
                      <h3>版本說明</h3>
                      <p className="content-block">{buildDeliverableStatusHint(deliverableStatus)}</p>
                    </div>
                    <div className="detail-item">
                      <h3>正式性狀態</h3>
                      <p className="content-block">
                        {hasUnpublishedContentChanges
                          ? "最新正文修訂晚於最近一次正式發布；若要形成新的正式版，需再次發布。"
                          : "目前正文與最近一次正式發布沒有額外的未發布差異。"}
                      </p>
                      <p className="muted-text">{deliverableVersionSummary}</p>
                    </div>
                  </div>
                </div>

                <div className="section-card deliverable-rail-card">
                  <h4>可信度與適用範圍</h4>
                  <p className="content-block">{deliverableConfidenceSurfaceSummary}</p>
                  <p className="muted-text" style={{ marginTop: "12px" }}>
                    {workspace.linked_evidence.length} 則證據 / {workspace.linked_source_materials.length} 份來源材料 / {workspace.high_impact_gaps.length} 個高影響缺口
                  </p>
                </div>

                <div className="section-card deliverable-rail-card">
                  <h4>連續性與下一個限制</h4>
                  <p className="content-block">
                    {continuationFocusSummary.shouldShow
                      ? `${continuationFocusSummary.label}｜${continuationFocusSummary.title}`
                      : deliverableContinuitySummary}
                  </p>
                  <p className="muted-text" style={{ marginTop: "12px" }}>
                    {continuationFocusSummary.shouldShow
                      ? continuationFocusSummary.copy
                      : workspace.high_impact_gaps[0] || "目前沒有額外高影響缺口。"}
                  </p>
                  {readinessGovernance ? (
                    <p className="muted-text" style={{ marginTop: "8px" }}>
                      {readinessGovernance.summary}
                    </p>
                  ) : null}
                </div>
              </aside>
            </div>
            <div className="hero-metrics-grid">
              <div className="section-card hero-metric-card">
                <h3>目前版本</h3>
                <p className="workbench-metric">{versionTag}</p>
                <p className="muted-text">{labelForDeliverableStatus(deliverableStatus)}</p>
              </div>
              <div className="section-card hero-metric-card">
                <h3>證據與缺口</h3>
                <p className="workbench-metric">{workspace.linked_evidence.length}</p>
                <p className="muted-text">{workspace.high_impact_gaps.length} 個高影響缺口</p>
              </div>
              <div className="section-card hero-metric-card">
                <h3>儲存狀態</h3>
                <p className="workbench-metric">
                  {hasPendingFormalSave ? "待儲存" : hasUnsavedChanges ? "未儲存" : "已同步"}
                </p>
                <p className="muted-text">
                  {hasPendingFormalSave
                    ? "系統已整理正式草稿，尚未落盤"
                    : hasUnsavedChanges
                      ? "目前仍有未儲存修改"
                      : "目前沒有未儲存修改"}
                </p>
              </div>
              <div className="section-card hero-metric-card">
                <h3>案件姿態</h3>
                <p className="workbench-metric">
                  {workspace.matter_workspace
                    ? labelForEngagementContinuityMode(workspace.matter_workspace.engagement_continuity_mode)
                    : "未連結"}
                </p>
                <p className="muted-text">
                  {workspace.matter_workspace
                    ? labelForWritebackDepth(workspace.matter_workspace.writeback_depth)
                    : "目前沒有案件連結"}
                </p>
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">發布前快速檢查</h2>
                <p className="panel-copy">
                  第一屏已經告訴你這份交付物現在怎麼處理；這裡只保留發布前最需要再看一眼的提醒。
                </p>
              </div>
            </div>
            <ul className="list-content">
              {deliverableActionChecklist.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className="button-row" style={{ marginTop: "16px" }}>
              <Link className="button-secondary" href="#deliverable-reading">
                查看交付摘要
              </Link>
              <Link className="button-secondary" href="#deliverable-evidence">
                回看依據來源
              </Link>
            </div>
          </section>

          <WorkspaceSectionGuide
            title="這份交付物怎麼讀最快"
            description="先決定你現在要整理版本、回看結果、檢查依據，還是確認可發布程度。歷史與 artifact registry 放在較後面，需要時再下鑽。"
            items={deliverableSectionGuideItems}
          />

          <DisclosurePanel
            title="連續性、研究與寫回紀錄"
            description="只有在你要確認這份交付物會怎麼寫回案件世界、外部研究怎麼進鏈，以及目前有哪些決策／結果紀錄時，再展開這層。"
          >
            <div className="summary-grid">
              <div className="section-card">
                <h4>案件策略</h4>
                <p className="content-block">
                  {labelForEngagementContinuityMode(task.engagement_continuity_mode)} /{" "}
                  {labelForWritebackDepth(task.writeback_depth)}
                </p>
              </div>
              {continuationSurface ? (
                <div className="section-card">
                  <h4>後續工作流</h4>
                  <p className="content-block">
                    {continuationSurface.title}。{continuationSurface.summary}
                  </p>
                </div>
              ) : null}
              <div className="section-card">
                <h4>研究來源脈絡</h4>
                <p className="content-block">
                  {workspace.research_runs.length > 0
                    ? `已留存 ${workspace.research_runs.length} 筆研究執行紀錄。`
                    : "目前沒有研究來源脈絡。"}
                </p>
              </div>
              <div className="section-card">
                <h4>決策權威</h4>
                <p className="content-block">
                  {sliceDecisionContext
                    ? `交付物目前優先依案件世界的 canonical decision context 呈現；slice-local overlay 只保留 ${sliceDecisionContext.changed_fields.length} 項差異給在途工作，core/context authority 不再以 task-local row 為主。`
                    : "交付物目前直接依 canonical world decision context 呈現，core/context authority 已優先站穩案件世界。"}
                </p>
              </div>
              <div className="section-card">
                <h4>共享參與鏈</h4>
                <p className="content-block">
                  {sharedEvidenceParticipationCount > 0
                    ? `這份交付物目前至少回鏈到 ${sharedEvidenceParticipationCount} 條被多個工作切片共用的正式材料／證據鏈。`
                    : "目前沒有顯示被多個工作切片共用的正式材料／證據鏈。"}
                </p>
              </div>
              <div className="section-card">
                <h4>決策紀錄</h4>
                <p className="content-block">{workspace.decision_records.length} 筆</p>
              </div>
              <div className="section-card">
                <h4>結果紀錄</h4>
                <p className="content-block">{workspace.outcome_records.length} 筆</p>
              </div>
              <div className="section-card">
                <h4>正式核可 / 稽核</h4>
                <p className="content-block">
                  {pendingApprovalCount > 0
                    ? `目前有 ${pendingApprovalCount} 筆待正式核可；若要處理，請回決策工作面。`
                    : `目前沒有待正式核可項目；已留存 ${workspace.audit_events.length} 筆稽核事件。`}
                </p>
              </div>
              <div className="section-card">
                <h4>重複材料確認</h4>
                <p className="content-block">
                  {canonicalizationSummary?.current_task_pending_count
                    ? `目前有 ${canonicalizationSummary.current_task_pending_count} 組近似重複材料和這份交付物的依據鏈有關；若要處理，請回來源 / 證據工作面。`
                    : canonicalizationSummary?.summary || "目前沒有待處理的重複材料候選。"}
                </p>
              </div>
            </div>
            {continuationDetailView.shouldShow ? (
              <div className="detail-list" style={{ marginTop: "18px" }}>
                <div className="detail-item">
                  <h3>{continuationDetailView.sectionTitle}</h3>
                  <div className="summary-grid">
                    {continuationDetailView.cards.map((card) => (
                      <div className="section-card" key={`deliverable-continuity-${card.title}`}>
                        <h4>{card.title}</h4>
                        <p className="content-block">{card.summary}</p>
                      </div>
                    ))}
                  </div>
                </div>
                {continuationDetailView.listItems.length > 0 ? (
                  <div className="detail-item">
                    <h3>{continuationDetailView.listTitle}</h3>
                    <ul className="list-content">
                      {continuationDetailView.listItems.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : null}
            {flagshipDetailView.shouldShow ? (
              <div className="detail-list" style={{ marginTop: "18px" }}>
                <div className="detail-item">
                  <h3>{flagshipDetailView.sectionTitle}</h3>
                  <div className="summary-grid">
                    {flagshipDetailView.cards.map((card) => (
                      <div className="section-card" key={`deliverable-flagship-${card.title}`}>
                        <h4>{card.title}</h4>
                        <p className="content-block">{card.summary}</p>
                      </div>
                    ))}
                  </div>
                </div>
                {flagshipDetailView.listItems.length > 0 ? (
                  <div className="detail-item">
                    <h3>{flagshipDetailView.listTitle}</h3>
                    <ul className="list-content">
                      {flagshipDetailView.listItems.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : null}
            {precedentReferenceView?.shouldShow ? (
              <div className="detail-list" style={{ marginTop: "18px" }}>
                <div className="detail-item">
                  <h3>{precedentReferenceView.sectionTitle}</h3>
                  <p className="content-block">{precedentReferenceView.summary}</p>
                  <div className="summary-grid" style={{ marginTop: "16px" }}>
                    {precedentReferenceView.cards.map((card) => (
                      <div className="section-card" key={`deliverable-precedent-reference-${card.title}`}>
                        <h4>{card.title}</h4>
                        <p className="content-block">{card.summary}</p>
                        <p className="muted-text">{card.meta}</p>
                      </div>
                    ))}
                  </div>
                  {precedentReferenceView.listItems.length > 0 ? (
                    <>
                      <h4 style={{ marginTop: "16px" }}>這層怎麼安全使用</h4>
                      <ul className="list-content">
                        {precedentReferenceView.listItems.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                  <p className="muted-text" style={{ marginTop: "12px" }}>
                    {precedentReferenceView.boundaryNote}
                  </p>
                </div>
              </div>
            ) : null}
            {reviewLensView?.shouldShow ? (
              <div className="detail-list" style={{ marginTop: "18px" }}>
                <div className="detail-item">
                  <h3>{reviewLensView.sectionTitle}</h3>
                  <p className="content-block">{reviewLensView.summary}</p>
                  <div className="summary-grid" style={{ marginTop: "16px" }}>
                    {reviewLensView.cards.map((card) => (
                      <div className="section-card" key={`deliverable-review-lens-${card.title}`}>
                        <h4>{card.title}</h4>
                        <p className="content-block">{card.summary}</p>
                        <p className="muted-text">{card.meta}</p>
                      </div>
                    ))}
                  </div>
                  {reviewLensView.listItems.length > 0 ? (
                    <>
                      <h4 style={{ marginTop: "16px" }}>{reviewLensView.listTitle}</h4>
                      <ul className="list-content">
                        {reviewLensView.listItems.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                  <p className="muted-text" style={{ marginTop: "12px" }}>
                    {reviewLensView.boundaryNote}
                  </p>
                </div>
              </div>
            ) : null}
            {commonRiskLibraryView?.shouldShow ? (
              <div className="detail-list" style={{ marginTop: "18px" }}>
                <div className="detail-item">
                  <h3>{commonRiskLibraryView.sectionTitle}</h3>
                  <p className="content-block">{commonRiskLibraryView.summary}</p>
                  <div className="summary-grid" style={{ marginTop: "16px" }}>
                    {commonRiskLibraryView.cards.map((card) => (
                      <div className="section-card" key={`deliverable-common-risk-${card.title}`}>
                        <h4>{card.title}</h4>
                        <p className="content-block">{card.summary}</p>
                        <p className="muted-text">{card.meta}</p>
                      </div>
                    ))}
                  </div>
                  {commonRiskLibraryView.listItems.length > 0 ? (
                    <>
                      <h4 style={{ marginTop: "16px" }}>{commonRiskLibraryView.listTitle}</h4>
                      <ul className="list-content">
                        {commonRiskLibraryView.listItems.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                  <p className="muted-text" style={{ marginTop: "12px" }}>
                    {commonRiskLibraryView.boundaryNote}
                  </p>
                </div>
              </div>
            ) : null}
            {deliverableTemplateView?.shouldShow ? (
              <div className="detail-list" style={{ marginTop: "18px" }}>
                <div className="detail-item">
                  <h3>{deliverableTemplateView.sectionTitle}</h3>
                  <p className="content-block">{deliverableTemplateView.summary}</p>
                  {deliverableTemplateView.templateLabel ? (
                    <p className="content-block" style={{ marginTop: "12px" }}>
                      模板主線：{deliverableTemplateView.templateLabel}
                    </p>
                  ) : null}
                  {deliverableTemplateView.templateFitSummary ? (
                    <p className="muted-text">{deliverableTemplateView.templateFitSummary}</p>
                  ) : null}
                  {deliverableTemplateView.fitSummary ? (
                    <p className="muted-text">{deliverableTemplateView.fitSummary}</p>
                  ) : null}
                  {deliverableTemplateView.sourceMixSummary ? (
                    <p className="muted-text">{deliverableTemplateView.sourceMixSummary}</p>
                  ) : null}
                  <div className="summary-grid" style={{ marginTop: "16px" }}>
                    {deliverableTemplateView.cards.map((card) => (
                      <div className="section-card" key={`deliverable-template-${card.title}`}>
                        <h4>{card.title}</h4>
                        <p className="content-block">{card.summary}</p>
                        <p className="muted-text">{card.meta}</p>
                      </div>
                    ))}
                  </div>
                  {deliverableTemplateView.coreSections.length > 0 ? (
                    <>
                      <h4 style={{ marginTop: "16px" }}>{deliverableTemplateView.coreListTitle}</h4>
                      <ul className="list-content">
                        {deliverableTemplateView.coreSections.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                  {deliverableTemplateView.optionalSections.length > 0 ? (
                    <>
                      <h4 style={{ marginTop: "16px" }}>{deliverableTemplateView.optionalListTitle}</h4>
                      <ul className="list-content">
                        {deliverableTemplateView.optionalSections.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                  <p className="muted-text" style={{ marginTop: "12px" }}>
                    {deliverableTemplateView.boundaryNote}
                  </p>
                </div>
              </div>
            ) : null}
            {deliverableShapeHintView?.shouldShow ? (
              <div className="detail-list" style={{ marginTop: "18px" }}>
                <div className="detail-item">
                  <h3>{deliverableShapeHintView.sectionTitle}</h3>
                  <p className="content-block">{deliverableShapeHintView.summary}</p>
                  {deliverableShapeHintView.primaryShapeLabel ? (
                    <p className="content-block" style={{ marginTop: "12px" }}>
                      建議交付形態：{deliverableShapeHintView.primaryShapeLabel}
                    </p>
                  ) : null}
                  <div className="summary-grid" style={{ marginTop: "16px" }}>
                    {deliverableShapeHintView.cards.map((card) => (
                      <div className="section-card" key={`deliverable-shape-${card.title}`}>
                        <h4>{card.title}</h4>
                        <p className="content-block">{card.summary}</p>
                        <p className="muted-text">{card.meta}</p>
                      </div>
                    ))}
                  </div>
                  {deliverableShapeHintView.listItems.length > 0 ? (
                    <>
                      <h4 style={{ marginTop: "16px" }}>{deliverableShapeHintView.listTitle}</h4>
                      <ul className="list-content">
                        {deliverableShapeHintView.listItems.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                  <p className="muted-text" style={{ marginTop: "12px" }}>
                    {deliverableShapeHintView.boundaryNote}
                  </p>
                </div>
              </div>
            ) : null}
            <div className="detail-list" style={{ marginTop: "18px" }}>
              <div className="detail-item">
                <h3>最近 decision / outcome</h3>
                {workspace.decision_records.length > 0 || workspace.outcome_records.length > 0 ? (
                  <ul className="list-content">
                    {workspace.decision_records.slice(0, 3).map((item) => (
                      <li key={item.id}>Decision：{item.decision_summary}</li>
                    ))}
                    {workspace.outcome_records.slice(0, 3).map((item) => (
                      <li key={item.id}>Outcome：{item.summary}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="empty-text">目前還沒有可回看的 writeback records。</p>
                )}
              </div>
              <div className="detail-item">
                <h3>{researchDetailView.shouldShow ? researchDetailView.sectionTitle : "最近系統研究交接"}</h3>
                {researchDetailView.shouldShow ? (
                  <>
                    <div className="summary-grid">
                      {researchDetailView.cards.map((card) => (
                        <div className="section-card" key={`deliverable-research-${card.title}`}>
                          <h4>{card.title}</h4>
                          <p className="content-block">{card.summary}</p>
                        </div>
                      ))}
                    </div>
                    {researchDetailView.listItems.length > 0 ? (
                      <>
                        <h4 style={{ marginTop: "16px" }}>{researchDetailView.listTitle}</h4>
                        <ul className="list-content">
                          {researchDetailView.listItems.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </>
                    ) : null}
                  </>
                ) : (
                  <p className="empty-text">目前沒有系統研究交接可回看。</p>
                )}
              </div>
              <div className="detail-item">
                <h3>最近正式核可 / 稽核</h3>
                {recentAuditEvents.length > 0 ? (
                  <ul className="list-content">
                    {recentAuditEvents.map((item) => (
                      <li key={item.id}>
                        {labelForAuditEventType(item.event_type)}｜{item.summary}
                        {item.approval_status ? `｜${labelForApprovalStatus(item.approval_status)}` : ""}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="empty-text">目前還沒有額外的 writeback / approval 稽核事件。</p>
                )}
              </div>
              {canonicalizationCandidates.length > 0 && canonicalizationMatterId ? (
                <div className="detail-item">
                  <h3>需確認是否同一份材料</h3>
                  <ul className="list-content">
                    {canonicalizationCandidates.map((item) => (
                      <li key={item.review_key}>
                        {item.consultant_summary}
                        <div style={{ marginTop: "8px" }}>
                          <Link
                            className="back-link"
                            href={`/matters/${canonicalizationMatterId}/artifact-evidence#evidence-duplicate-review`}
                          >
                            到來源 / 證據工作面確認這組材料
                          </Link>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </DisclosurePanel>

          <DisclosurePanel
            id="deliverable-management"
            title="整理版本與發布"
            description="平常先看交付結果；只有在你要改標題、正文、版本或正式發布時，再展開這層。"
          >
            <div className="panel-header">
              <div>
                <h3 className="panel-title">交付物管理</h3>
                <p className="panel-copy">先把標題、版本與發布狀態整理乾淨，再繼續修摘要、建議、風險與行動項目。</p>
              </div>
            </div>
            <div className="form-grid deliverable-management-grid">
              <div className="deliverable-management-section">
                <div className="deliverable-management-section-header">
                  <div>
                    <span className="eyebrow">版本狀態</span>
                    <h3>先確認這個版本現在的位置</h3>
                    <p className="muted-text">先看版本身份、發布狀態與所屬案件，避免在還沒搞清楚這份交付物的角色前就直接改正文。</p>
                  </div>
                </div>
                <div className="deliverable-management-meta-grid">
                  <div className="deliverable-management-meta">
                    <span className="deliverable-management-meta-label">目前版本</span>
                    <strong>{versionTag}</strong>
                    <p className="muted-text">{workspace.is_latest_for_task ? "這是目前 task 最新版本。" : "這份交付物已不是最新版本。"}</p>
                  </div>
                  <div className="deliverable-management-meta">
                    <span className="deliverable-management-meta-label">發布狀態</span>
                    <strong>{labelForDeliverableStatus(deliverableStatus)}</strong>
                    <p className="muted-text">{buildDeliverableStatusHint(deliverableStatus)}</p>
                  </div>
                  <div className="deliverable-management-meta">
                    <span className="deliverable-management-meta-label">所屬案件</span>
                    <strong>{workspace.matter_workspace?.title || task.engagement?.name || "未掛案件"}</strong>
                    <p className="muted-text">這裡是唯讀定位資訊，不是在這裡改案件歸屬。</p>
                  </div>
                  <div className="deliverable-management-meta">
                    <span className="deliverable-management-meta-label">最近更新</span>
                    <strong>{formatDisplayDate(task.updated_at)}</strong>
                    <p className="muted-text">用來快速判斷這份版本是不是剛剛才被更新過。</p>
                  </div>
                </div>
              </div>

              <div className="deliverable-management-section">
                <div className="deliverable-management-section-header">
                  <div>
                    <span className="eyebrow">封面資訊</span>
                    <h3>整理標題、短摘要與版本標記</h3>
                    <p className="muted-text">這一層處理使用者最先看到的交付身份，不要把它和正文編修混成同一堆欄位。</p>
                  </div>
                </div>
                <div className="deliverable-management-cover-grid">
                  <div className="field field-wide">
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
                  <div className="field field-wide field-editor field-editor-note">
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
                  <div className="field field-wide field-editor field-editor-note">
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
                </div>
              </div>

              <div className="deliverable-management-section">
                <div className="deliverable-management-section-header">
                  <div>
                    <span className="eyebrow">正式內容</span>
                    <h3>用編修工作面的方式整理正文</h3>
                    <p className="muted-text">摘要應該先完整展開，再分別編建議、風險、行動與依據來源，不要把長內容壓成一排窄小欄位。</p>
                  </div>
                </div>
                <div className="field field-editor field-wide field-editor-hero">
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
                <div className="deliverable-editor-grid">
                  <div className="field field-editor">
                    <label htmlFor="deliverable-recommendations">建議</label>
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
                  <div className="field field-editor">
                    <label htmlFor="deliverable-risks">風險與缺口</label>
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
                  <div className="field field-editor">
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
                  <div className="field field-editor">
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
                </div>
              </div>

              <div className="deliverable-management-section">
                <div className="deliverable-management-section-header">
                  <div>
                    <span className="eyebrow">發布與動作</span>
                    <h3>先落盤，再決定送審、發布或匯出</h3>
                    <p className="muted-text">這裡只放版本動作，不再把編修欄位和所有按鈕塞在同一層，避免像控制台而不是交付物工作面。</p>
                  </div>
                </div>
                <div className="field field-wide field-editor field-editor-note">
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

                <div className="deliverable-management-actions">
                  <div className="deliverable-action-group">
                    <p className="deliverable-action-group-label">先落盤</p>
                    <div className="button-row">
                      <button
                        className="button-primary"
                        type="button"
                        onClick={() => void handleSaveWorkspace()}
                        disabled={isSaving || isPublishing}
                      >
                        {isSaving
                          ? "儲存中..."
                          : hasPendingFormalSave
                            ? "先儲存正式草稿"
                            : "儲存正式內容"}
                      </button>
                      <button
                        className="button-secondary"
                        type="button"
                        onClick={() => void handleSaveWorkspace("pending_confirmation")}
                        disabled={isSaving || isPublishing}
                      >
                        送往待確認
                      </button>
                    </div>
                  </div>

                  <div className="deliverable-action-group">
                    <p className="deliverable-action-group-label">正式版本</p>
                    <div className="button-row">
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
                  </div>

                  <div className="deliverable-action-group">
                    <p className="deliverable-action-group-label">匯出</p>
                    <div className="button-row">
                      <button
                        className="button-secondary"
                        type="button"
                        onClick={() => void handleExportEntry("markdown")}
                        disabled={
                          Boolean(activeExportFormat) ||
                          isSaving ||
                          isPublishing ||
                          requiresSaveBeforeFormalActions
                        }
                      >
                        {activeExportFormat === "markdown" ? "匯出中..." : "匯出 Markdown"}
                      </button>
                      <button
                        className="button-secondary"
                        type="button"
                        onClick={() => void handleExportEntry("docx")}
                        disabled={
                          Boolean(activeExportFormat) ||
                          isSaving ||
                          isPublishing ||
                          requiresSaveBeforeFormalActions
                        }
                      >
                        {activeExportFormat === "docx" ? "匯出中..." : "匯出 DOCX"}
                      </button>
                    </div>
                  </div>
                </div>

              <p className="muted-text">
                正式版本紀錄、artifact 與 publish record 只會寫入後端；若後端暫時不可用，這裡會直接報錯並保留目前內容，不會假裝成功。
              </p>
              {hasPendingFormalSave ? (
                <p className="muted-text">目前系統已整理出可寫入的正式草稿，但還沒正式落盤；請先儲存，再進行匯出或版本回退。</p>
              ) : hasUnsavedChanges ? (
                <p className="muted-text">目前有未儲存變更；匯出會先要求你把內容落盤，正式發布則會直接把目前內容寫入後端並建立發布紀錄。</p>
              ) : null}
              {hasUnpublishedContentChanges ? (
                <p className="muted-text">最新正文修訂晚於最近一次正式發布；若要形成新的正式版本，請再次正式發布。</p>
              ) : null}
              {saveMessage ? (
                <p
                  className={saveTone === "error" ? "error-text" : "success-text"}
                  role={saveTone === "error" ? "alert" : "status"}
                  aria-live={saveTone === "error" ? "assertive" : "polite"}
                >
                  {saveMessage}
                </p>
              ) : null}
              {exportMessage ? (
                <p
                  className={exportTone === "error" ? "error-text" : "success-text"}
                  role={exportTone === "error" ? "alert" : "status"}
                  aria-live={exportTone === "error" ? "assertive" : "polite"}
                >
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
            </div>
          </DisclosurePanel>

          <DisclosurePanel
            title="交付脈絡與工作面背景"
            description="當你要理解這份交付物在整個案件世界中的定位時，再展開這層；日常閱讀先看結論本身。"
          >
            <div className="summary-grid">
              <div className="section-card">
                <h4>交付層級與定位</h4>
                <p className="content-block">{workspaceView.summary}</p>
              </div>
              <div className="section-card">
                <h4>可信度與適用範圍</h4>
                <p className="content-block">{deliverableConfidenceSurfaceSummary}</p>
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
          </DisclosurePanel>

          <div className="detail-grid">
            <div className="detail-stack">
              <section className="panel section-anchor" id="deliverable-reading">
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

              <section className="panel section-anchor" id="deliverable-evidence">
                <div className="panel-header">
                  <div>
                    <h2 className="panel-title">依據來源與工作回鏈</h2>
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

                <DisclosurePanel
                  title="完整回鏈與支撐明細"
                  description="只有在你要逐條核對來源、追查結論依據，或確認完整證據鏈時，再展開這層。"
                >
                  <div className="detail-grid" style={{ marginTop: "4px" }}>
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
                              <div
                                className="section-card section-anchor"
                                id={`deliverable-evidence-entry-${item.id}`}
                                key={item.id}
                              >
                                <h4>{item.title}</h4>
                                <p className="muted-text">
                                  {labelForEvidenceType(item.evidence_type)}｜{item.reliability_level}
                                </p>
                                <p className="content-block">{item.excerpt_or_summary}</p>
                                <DeliverableRetrievalProvenance provenance={item.retrieval_provenance} />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="empty-text">目前沒有可顯示的證據。</p>
                        )}
                      </div>
                    </div>
                  </div>
                </DisclosurePanel>
              </section>

              {objectSets.length > 0 ? (
                <section className="panel section-anchor" id="deliverable-object-sets">
                  <div className="panel-header">
                    <div>
                      <h2 className="panel-title">
                        {buildObjectSetSectionTitle(objectSets)}
                      </h2>
                      <p className="panel-copy">
                        {buildObjectSetSectionCopy(objectSets)}
                      </p>
                    </div>
                  </div>
                  <div className="section-list">
                    {objectSets.map((item) => (
                      <div className="section-card" key={item.id}>
                        <div className="meta-row">
                          <span className="pill">{labelForObjectSetType(item.set_type)}</span>
                          <span>{labelForObjectSetScope(item.scope_type)}</span>
                          <span>{labelForObjectSetCreationMode(item.creation_mode)}</span>
                          <span>{labelForObjectSetLifecycleStatus(item.lifecycle_status)}</span>
                        </div>
                        <h3>{item.display_title}</h3>
                        <p className="content-block">
                          {item.description || item.intent || "這組集合目前沒有額外的說明。"}
                        </p>
                        <p className="muted-text" style={{ marginTop: "8px" }}>
                          {item.member_count} 個成員｜主要來源：
                          {getObjectSetPrimarySourceLabel(item)}
                          {item.continuity_scope ? `｜工作範圍：${item.continuity_scope}` : ""}
                        </p>
                        <p className="muted-text" style={{ marginTop: "6px" }}>
                          {buildObjectSetSummaryLine(item)}
                        </p>

                        {item.members.length > 0 ? (
                          <>
                            <ul className="list-content" style={{ marginTop: "16px" }}>
                              {getVisibleObjectSetMembers(item).map((member) => (
                                <li key={member.id}>
                                  <a
                                    className="back-link"
                                    href={`#${getObjectSetMemberAnchor(member)}`}
                                  >
                                    {member.member_label}
                                  </a>
                                  {`｜${member.included_reason}`}
                                </li>
                              ))}
                            </ul>

                            <div className="detail-list" style={{ marginTop: "16px" }}>
                              {getVisibleObjectSetMembers(item).map((member) => (
                                <div
                                  className="detail-item section-anchor"
                                  id={getObjectSetMemberAnchor(member)}
                                  key={member.id}
                                >
                                  {(() => {
                                    const processIssueMeta =
                                      member.member_object_type === "process_issue"
                                        ? readProcessIssueMetadata(member)
                                        : null;
                                    return (
                                      <>
                                  <div className="meta-row">
                                    <span className="pill">
                                      {labelForObjectSetMemberType(member.member_object_type)}
                                    </span>
                                    <span>
                                      {labelForObjectSetMembershipSource(member.membership_source)}
                                    </span>
                                    {member.support_label ? <span>{member.support_label}</span> : null}
                                  </div>
                                  <h4>{member.member_label}</h4>
                                  <p className="content-block">{member.included_reason}</p>
                                  {processIssueMeta ? (
                                    <p className="muted-text">
                                      {[
                                        processIssueMeta.affectedProcessStep,
                                        processIssueMeta.ownerState,
                                        processIssueMeta.dependencyHint,
                                        processIssueMeta.controlGapHint,
                                      ]
                                        .filter(Boolean)
                                        .join("｜") || "目前尚未補齊流程問題細節。"}
                                    </p>
                                  ) : null}
                                  {member.derivation_hint ? (
                                    <p className="muted-text">來源線索：{member.derivation_hint}</p>
                                  ) : null}
                                  <div className="button-row" style={{ marginTop: "12px" }}>
                                    {member.member_object_type === "evidence" ? (
                                      <a
                                        className="back-link"
                                        href={`#deliverable-evidence-entry-${member.member_object_id}`}
                                      >
                                        回到這則證據
                                      </a>
                                    ) : member.support_evidence_id ? (
                                      <a
                                        className="back-link"
                                        href={`#deliverable-evidence-entry-${member.support_evidence_id}`}
                                      >
                                        回到支撐這條的證據
                                      </a>
                                    ) : (
                                      <a className="back-link" href="#deliverable-reading">
                                        回交付摘要看這項風險的整體脈絡
                                      </a>
                                    )}
                                    <a className="back-link" href="#deliverable-object-sets">
                                      回到這組集合
                                    </a>
                                  </div>
                                      </>
                                    );
                                  })()}
                                </div>
                              ))}
                            </div>

                            {getHiddenObjectSetMembers(item).length > 0 ? (
                              <details className="detail-item" style={{ marginTop: "16px" }}>
                                <summary className="disclosure-summary">
                                  <div>
                                    <h4 style={{ margin: 0 }}>
                                      顯示其餘 {getHiddenObjectSetMembers(item).length} 項
                                    </h4>
                                    <p className="muted-text">
                                      其餘成員保留在同一組集合裡，需要時再展開回看。
                                    </p>
                                  </div>
                                  <span className="pill">展開</span>
                                </summary>
                                <div className="detail-list" style={{ marginTop: "16px" }}>
                                  {getHiddenObjectSetMembers(item).map((member) => (
                                    <div
                                      className="detail-item section-anchor"
                                      id={getObjectSetMemberAnchor(member)}
                                      key={member.id}
                                    >
                                      {(() => {
                                        const processIssueMeta =
                                          member.member_object_type === "process_issue"
                                            ? readProcessIssueMetadata(member)
                                            : null;
                                        return (
                                          <>
                                      <div className="meta-row">
                                        <span className="pill">
                                          {labelForObjectSetMemberType(member.member_object_type)}
                                        </span>
                                        <span>
                                          {labelForObjectSetMembershipSource(member.membership_source)}
                                        </span>
                                        {member.support_label ? <span>{member.support_label}</span> : null}
                                      </div>
                                      <h4>{member.member_label}</h4>
                                      <p className="content-block">{member.included_reason}</p>
                                      {processIssueMeta ? (
                                        <p className="muted-text">
                                          {[
                                            processIssueMeta.affectedProcessStep,
                                            processIssueMeta.ownerState,
                                            processIssueMeta.dependencyHint,
                                            processIssueMeta.controlGapHint,
                                          ]
                                            .filter(Boolean)
                                            .join("｜") || "目前尚未補齊流程問題細節。"}
                                        </p>
                                      ) : null}
                                      {member.derivation_hint ? (
                                        <p className="muted-text">來源線索：{member.derivation_hint}</p>
                                      ) : null}
                                      <div className="button-row" style={{ marginTop: "12px" }}>
                                        {member.member_object_type === "evidence" ? (
                                          <a
                                            className="back-link"
                                            href={`#deliverable-evidence-entry-${member.member_object_id}`}
                                          >
                                            回到這則證據
                                          </a>
                                        ) : member.support_evidence_id ? (
                                          <a
                                            className="back-link"
                                            href={`#deliverable-evidence-entry-${member.support_evidence_id}`}
                                          >
                                            回到支撐這條的證據
                                          </a>
                                        ) : (
                                          <a className="back-link" href="#deliverable-reading">
                                            回交付摘要看這項脈絡
                                          </a>
                                        )}
                                        <a className="back-link" href="#deliverable-object-sets">
                                          回到這組集合
                                        </a>
                                      </div>
                                          </>
                                        );
                                      })()}
                                    </div>
                                  ))}
                                </div>
                              </details>
                            ) : null}
                          </>
                        ) : (
                          <p className="empty-text" style={{ marginTop: "16px" }}>
                            這組集合目前還沒有可顯示的成員。
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>

            <div className="detail-stack">
              <section className="panel section-anchor" id="deliverable-confidence">
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

              <DisclosurePanel
                id="deliverable-history"
                title="正文修訂"
                description="這裡只追摘要、建議、風險、行動項目與依據來源的正文演進。平常不用先讀，只有在你要比較版本或 rollback 時再展開。"
              >
                {workspace.content_revisions.length > 0 ? (
                  <div className="detail-list">
                    {workspace.content_revisions.map((revision) => (
                      <div className="detail-item" key={revision.id}>
                        <div className="meta-row">
                          <span className="pill">{labelForContentRevisionSource(revision.source)}</span>
                          <span>{revision.version_tag}</span>
                          {revision.deliverable_status ? (
                            <span>{labelForDeliverableStatus(revision.deliverable_status)}</span>
                          ) : null}
                          <span>{formatDisplayDate(revision.created_at)}</span>
                        </div>
                        <h3>{revision.revision_summary}</h3>
                        {revision.diff_summary.length > 0 ? (
                          <ul className="list-content">
                            {revision.diff_summary.map((item) => (
                              <li key={`${revision.id}-${item.section_key}`}>
                                {labelForContentDiffChangeType(item.change_type)} {item.section_label}
                                ：{item.previous_preview || "空白"} → {item.current_preview || "空白"}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="muted-text">這筆修訂目前沒有額外的 diff 摘要。</p>
                        )}
                        <div className="button-row" style={{ marginTop: "12px" }}>
                          <button
                            className="button-secondary"
                            type="button"
                            onClick={() => void handleRollbackRevision(revision)}
                            disabled={
                              hasUnsavedChanges ||
                              rollingBackRevisionId === revision.id ||
                              revisionMatchesCurrentContent(revision, workspace)
                            }
                          >
                            {rollingBackRevisionId === revision.id ? "回退中..." : "回退到這一版"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="empty-text">目前尚未建立正式正文修訂紀錄。</p>
                )}
              </DisclosurePanel>

              <DisclosurePanel
                title="版本紀錄"
                description="這裡直接讀正式 backend 版本事件、artifact registry 與 publish record。平常先看上方交付主線，需要追歷史時再展開。"
              >
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
              </DisclosurePanel>

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
