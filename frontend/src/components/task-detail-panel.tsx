"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import {
  applyRecommendationFeedback,
  approveTaskWriteback,
  getExtensionManager,
  getTask,
  runTask,
  updateRecommendationPrecedentCandidateStatus,
  updateTaskExtensions,
} from "@/lib/api";
import {
  assessTaskReadiness,
  buildActionItemCards,
  buildCapabilityFrame,
  buildDecisionSnapshot,
  buildDeliverableBacklinkView,
  buildEvidenceWorkspaceLane,
  buildExternalDataUsage,
  buildExecutiveSummary,
  buildFlagshipDetailView,
  buildFlagshipLaneView,
  buildMatterWorkspaceCard,
  buildObjectNavigationStrip,
  buildOntologyChainSummary,
  buildPackSelectionView,
  buildRecommendationCards,
  buildReadinessGovernance,
  buildRiskCards,
  buildSparseInputOperatingView,
  buildTaskFraming,
  buildWorkbenchObjectSummary,
  getGoalSuccessCriteria,
  getLatestDeliverable,
  getVisibleConstraints,
  getStructuredStringList,
} from "@/lib/advisory-workflow";
import {
  buildContinuationDetailView,
  buildContinuationFocusSummary,
} from "@/lib/continuation-advisory";
import { buildDecisionBriefView } from "@/lib/case-command-loop";
import { buildContinuationPostureView } from "@/lib/continuity-ux";
import { buildMaterialReviewPostureView } from "@/lib/material-review-ux";
import {
  buildResearchDetailView,
  buildResearchGuidanceView,
} from "@/lib/research-lane";
import { buildTaskDetailUsabilityView } from "@/lib/task-detail-usability";
import { buildDomainPlaybookView } from "@/lib/domain-playbooks";
import { buildOrganizationMemoryView } from "@/lib/organization-memory";
import {
  buildPrecedentCandidateActionView,
  buildPrecedentCandidateView,
} from "@/lib/precedent-candidates";
import { buildCommonRiskLibraryView } from "@/lib/common-risk-libraries";
import { buildDeliverableTemplateView } from "@/lib/deliverable-templates";
import { buildDeliverableShapeHintView } from "@/lib/deliverable-shape-hints";
import { buildPrecedentReferenceView } from "@/lib/precedent-reference";
import { buildReviewLensView } from "@/lib/review-lenses";
import { normalizeOperatorDisplayName } from "@/lib/operator-identity";
import type {
  AdoptionFeedbackPayload,
  ExtensionManagerSnapshot,
  RetrievalProvenance,
  TaskAggregate,
  TaskExtensionOverridePayload,
} from "@/lib/types";
import {
  extractModeSpecificAppendix,
  getModeDefinition,
  getModeSpecificEntries,
  getModeSpecificResultSections,
  resolveWorkflowKey,
} from "@/lib/workflow-modes";
import {
  noteDisclosureOpened,
  shouldRenderDisclosureBody,
} from "@/lib/workbench-performance-gates";
import {
  labelForActionStatus,
  labelForAdoptionFeedbackStatus,
  labelForApprovalPolicy,
  labelForApprovalStatus,
  labelForAuditEventType,
  formatDisplayDate,
  labelForAgentId,
  labelForAgentName,
  labelForEngagementContinuityMode,
  labelForExternalDataStrategy,
  labelForEvidenceType,
  labelForFlowMode,
  labelForFunctionType,
  labelForImpactLevel,
  labelForResearchDelegationStatus,
  labelForResearchDepth,
  labelForLikelihoodLevel,
  labelForPackContractInterface,
  labelForPackContractStatus,
  labelForPackRuleBinding,
  labelForPriority,
  labelForRetrievalSupportKind,
  labelForRunStatus,
  labelForSourceType,
  labelForStructuredField,
  labelForTaskStatus,
  labelForTaskType,
  labelForWritebackDepth,
  translateStructuredValue,
} from "@/lib/ui-labels";
import { WorkspaceSectionGuide } from "@/components/workspace-section-guide";
import { useOperatorIdentitySettings } from "@/lib/workbench-store";

const DeferredExtensionManagerSurface = dynamic(
  () =>
    import("@/components/extension-manager-surface").then(
      (module) => module.ExtensionManagerSurface,
    ),
  {
    loading: () => <p className="muted-text">正在載入擴充管理面...</p>,
  },
);

const DeferredAdoptionFeedbackControls = dynamic(
  () =>
    import("@/components/adoption-feedback-controls").then(
      (module) => module.AdoptionFeedbackControls,
    ),
  {
    loading: () => <p className="muted-text">正在載入採納回饋...</p>,
  },
);

function buildRunMeta(task: TaskAggregate) {
  if (task.continuation_surface?.workflow_layer === "checkpoint") {
    return {
      title: "更新這輪後續分析",
      copy:
        "這筆工作屬於輕量後續／檢查點鏈。先刷新這輪判斷，再決定要不要把里程碑檢查點寫回案件世界。",
      buttonIdle: "執行後續分析",
      buttonRunning: "後續分析執行中...",
    };
  }
  if (task.continuation_surface?.workflow_layer === "progression") {
    return {
      title: "刷新這輪持續推進分析",
      copy:
        "這筆工作屬於持續推進鏈。先刷新判斷與交付結果，再回到案件工作面記錄進度與結果。",
      buttonIdle: "執行持續推進分析",
      buttonRunning: "持續推進分析執行中...",
    };
  }
  return {
    title: "啟動這輪分析",
    copy:
      task.mode === "multi_agent"
        ? "主控代理會沿用目前的多代理工作模式，把各視角收斂進同一份決策結果。"
        : "主控代理會沿用目前的專家工作模式，把這輪分析寫回同一份決策工作台。",
    buttonIdle: "執行分析",
    buttonRunning: "分析執行中...",
  };
}

function truncateText(value: string, limit = 220) {
  if (value.length <= limit) {
    return value;
  }

  return `${value.slice(0, limit).trimEnd()}...`;
}

function ExpandableText({
  text,
  emptyText,
  previewChars = 220,
}: {
  text: string;
  emptyText: string;
  previewChars?: number;
}) {
  const normalized = text.trim();

  if (!normalized) {
    return <p className="empty-text">{emptyText}</p>;
  }

  const preview = truncateText(normalized, previewChars);
  if (preview === normalized) {
    return <p className="content-block">{normalized}</p>;
  }

  return (
    <div className="expandable-copy">
      <p className="content-block">{preview}</p>
      <details className="inline-disclosure">
        <summary className="inline-disclosure-summary">展開完整內容</summary>
        <p className="content-block">{normalized}</p>
      </details>
    </div>
  );
}

function ExpandableList({
  items,
  emptyText,
  initialCount = 4,
  translateAsAgentIds = false,
}: {
  items: string[];
  emptyText: string;
  initialCount?: number;
  translateAsAgentIds?: boolean;
}) {
  if (items.length === 0) {
    return <p className="empty-text">{emptyText}</p>;
  }

  const visibleItems = items.slice(0, initialCount);
  const hiddenItems = items.slice(initialCount);
  const renderItem = (item: string) => (translateAsAgentIds ? labelForAgentId(item) : item);

  return (
    <div className="section-list">
      <ul className="list-content">
        {visibleItems.map((item, index) => (
          <li key={`${item}-${index}`}>{renderItem(item)}</li>
        ))}
      </ul>
      {hiddenItems.length > 0 ? (
        <details className="inline-disclosure">
          <summary className="inline-disclosure-summary">展開其餘 {hiddenItems.length} 項</summary>
          <ul className="list-content">
            {hiddenItems.map((item, index) => (
              <li key={`${item}-${initialCount + index}`}>{renderItem(item)}</li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}

function renderStructuredValue(label: string, value: unknown) {
  const displayLabel = labelForStructuredField(label);
  const translatedValue = translateStructuredValue(label, value);

  if (Array.isArray(translatedValue)) {
    const items = translatedValue.map((item) =>
      typeof item === "string" ? item : JSON.stringify(item),
    );
    return (
      <section className="section-card" key={label}>
        <h4>{displayLabel}</h4>
        <ExpandableList items={items} emptyText={`目前沒有可顯示的「${displayLabel}」。`} />
      </section>
    );
  }

  if (translatedValue && typeof translatedValue === "object") {
    return (
      <section className="section-card" key={label}>
        <h4>{displayLabel}</h4>
        <details className="inline-disclosure">
          <summary className="inline-disclosure-summary">展開完整結構</summary>
          <pre className="json-block">{JSON.stringify(translatedValue, null, 2)}</pre>
        </details>
      </section>
    );
  }

  return (
    <section className="section-card" key={label}>
      <h4>{displayLabel}</h4>
      <ExpandableText
        text={String(translatedValue ?? "")}
        emptyText={`目前沒有可顯示的「${displayLabel}」。`}
      />
    </section>
  );
}

function ModeSectionList({
  title,
  description,
  items,
  emptyText,
  translateAsAgentIds = false,
}: {
  title: string;
  description: string;
  items: string[];
  emptyText: string;
  translateAsAgentIds?: boolean;
}) {
  return (
    <section className="panel">
      <h2 className="section-title">{title}</h2>
      <p className="panel-copy" style={{ marginBottom: "16px" }}>
        {description}
      </p>
      <div className="detail-item">
        <ExpandableList
          items={items}
          emptyText={emptyText}
          translateAsAgentIds={translateAsAgentIds}
        />
      </div>
    </section>
  );
}

function DisclosurePanel({
  id,
  title,
  description,
  children,
  lazy = true,
}: {
  id?: string;
  title: string;
  description: string;
  children: ReactNode;
  lazy?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasOpenedOnce, setHasOpenedOnce] = useState(false);
  const shouldRenderBody = shouldRenderDisclosureBody({
    lazy,
    isOpen,
    hasOpenedOnce,
  });

  return (
    <details
      className="panel disclosure-panel"
      id={id}
      onToggle={(event) => {
        const nextOpen = event.currentTarget.open;
        setIsOpen(nextOpen);
        setHasOpenedOnce((current) =>
          noteDisclosureOpened({
            nextOpen,
            hasOpenedOnce: current,
          }),
        );
      }}
    >
      <summary className="disclosure-summary">
        <div>
          <h2 className="section-title">{title}</h2>
          <p className="panel-copy">{description}</p>
        </div>
        <span className="pill">展開</span>
      </summary>
      {shouldRenderBody ? <div className="disclosure-body">{children}</div> : null}
    </details>
  );
}

function TaskRetrievalProvenance({
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

function WorkspaceMaterialSection({
  title,
  description,
  items,
  emptyText,
}: {
  title: string;
  description: string;
  items: Array<{
    title: string;
    summary: string;
    meta: string[];
    supportNotes: string[];
  }>;
  emptyText: string;
}) {
  return (
    <div className="detail-item">
      <h3>{title}</h3>
      <p className="panel-copy" style={{ marginBottom: "16px" }}>
        {description}
      </p>
      {items.length > 0 ? (
        <div className="detail-list">
          {items.map((item) => (
            <div className="detail-item" key={`${title}-${item.title}`}>
              {item.meta.length > 0 ? (
                <div className="meta-row">
                  {item.meta.map((meta) => (
                    <span key={`${item.title}-${meta}`}>{meta}</span>
                  ))}
                </div>
              ) : null}
              <h3>{item.title}</h3>
              <ExpandableText
                text={item.summary}
                emptyText="目前沒有可顯示的摘要。"
                previewChars={220}
              />
              {item.supportNotes.length > 0 ? (
                <div style={{ marginTop: "10px" }}>
                  <ExpandableList
                    items={item.supportNotes}
                    emptyText="目前沒有額外支持說明。"
                    initialCount={3}
                  />
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="empty-text">{emptyText}</p>
      )}
    </div>
  );
}

export function TaskDetailPanel({ taskId }: { taskId: string }) {
  const [operatorIdentity] = useOperatorIdentitySettings();
  const [task, setTask] = useState<TaskAggregate | null>(null);
  const [extensionManager, setExtensionManager] = useState<ExtensionManagerSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [extensionLoading, setExtensionLoading] = useState(true);
  const [savingOverrides, setSavingOverrides] = useState(false);
  const [approvingTargetId, setApprovingTargetId] = useState<string | null>(null);
  const [approvalFeedback, setApprovalFeedback] = useState<string | null>(null);
  const [recommendationFeedbackMessage, setRecommendationFeedbackMessage] = useState<string | null>(null);
  const [feedbackRecommendationId, setFeedbackRecommendationId] = useState<string | null>(null);
  const [candidateRecommendationId, setCandidateRecommendationId] = useState<string | null>(null);
  const [recommendationCandidateMessage, setRecommendationCandidateMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [extensionError, setExtensionError] = useState<string | null>(null);

  async function refreshTask() {
    try {
      setLoading(true);
      setError(null);
      const response = await getTask(taskId);
      setTask(response);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "載入任務失敗。");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refreshTask();
    void (async () => {
      try {
        setExtensionLoading(true);
        setExtensionError(null);
        setExtensionManager(await getExtensionManager());
      } catch (loadError) {
        setExtensionError(
          loadError instanceof Error ? loadError.message : "載入擴充管理面失敗。",
        );
      } finally {
        setExtensionLoading(false);
      }
    })();
  }, [taskId]);

  async function handleRun() {
    try {
      setRunning(true);
      setError(null);
      await runTask(taskId);
      await refreshTask();
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "執行所選流程失敗。");
    } finally {
      setRunning(false);
    }
  }

  async function handleSaveOverrides(payload: TaskExtensionOverridePayload) {
    try {
      setSavingOverrides(true);
      setError(null);
      const response = await updateTaskExtensions(taskId, payload);
      setTask(response);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "更新擴充覆寫失敗。");
    } finally {
      setSavingOverrides(false);
    }
  }

  async function handleApproveWriteback(
    targetType: "decision_record" | "action_plan",
    targetId: string,
  ) {
    try {
      setApprovingTargetId(targetId);
      setApprovalFeedback(null);
      setError(null);
      const response = await approveTaskWriteback(taskId, {
        target_type: targetType,
        target_id: targetId,
        note: "",
      });
      setTask(response);
      setApprovalFeedback(
        targetType === "decision_record"
          ? "這筆 decision record 已標記為正式核可。"
          : "這份 action plan 已標記為正式核可。",
      );
    } catch (approveError) {
      setError(approveError instanceof Error ? approveError.message : "標記正式核可失敗。");
    } finally {
      setApprovingTargetId(null);
    }
  }

  async function handleRecommendationFeedback(
    recommendationId: string,
    payload: AdoptionFeedbackPayload,
  ) {
    const operatorLabel = normalizeOperatorDisplayName(operatorIdentity.operatorDisplayName);
    try {
      setFeedbackRecommendationId(recommendationId);
      setRecommendationFeedbackMessage(null);
      setError(null);
      const response = await applyRecommendationFeedback(taskId, recommendationId, {
        ...payload,
        operator_label: operatorLabel || undefined,
      });
      setTask(response);
      const feedbackStatus = payload.feedback_status;
      setRecommendationFeedbackMessage(
        `已記錄這則建議的回饋：${labelForAdoptionFeedbackStatus(feedbackStatus)}`,
      );
    } catch (feedbackError) {
      setError(feedbackError instanceof Error ? feedbackError.message : "記錄建議回饋失敗。");
    } finally {
      setFeedbackRecommendationId(null);
    }
  }

  async function handleRecommendationCandidateStatus(
    recommendationId: string,
    candidateStatus: "candidate" | "promoted" | "dismissed",
  ) {
    const operatorLabel = normalizeOperatorDisplayName(operatorIdentity.operatorDisplayName);
    try {
      setCandidateRecommendationId(recommendationId);
      setRecommendationCandidateMessage(null);
      setError(null);
      const response = await updateRecommendationPrecedentCandidateStatus(
        taskId,
        recommendationId,
        {
          candidate_status: candidateStatus,
          operator_label: operatorLabel || undefined,
        },
      );
      setTask(response);
      setRecommendationCandidateMessage(
        candidateStatus === "promoted"
          ? "這條建議已升格成正式可重用模式。"
          : candidateStatus === "dismissed"
            ? "這條建議已先停用，不列入 active 候選。"
            : "這條建議已重新列回候選。"
      );
    } catch (candidateError) {
      setError(candidateError instanceof Error ? candidateError.message : "更新建議候選狀態失敗。");
    } finally {
      setCandidateRecommendationId(null);
    }
  }

  const latestDeliverable = task ? getLatestDeliverable(task) : null;
  const latestMissingInformation = getStructuredStringList(latestDeliverable, "missing_information");
  const structuredFindings = getStructuredStringList(latestDeliverable, "findings");
  const participatingAgents = getStructuredStringList(latestDeliverable, "participating_agents");
  const readiness = task ? assessTaskReadiness(task) : null;
  const decisionBriefView = task ? buildDecisionBriefView(task.decision_brief) : null;
  const originalProblem = task
    ? [task.description.trim(), task.title.trim()].filter(Boolean).join("\n\n")
    : "";
  const taskFraming = task && readiness ? buildTaskFraming(task, readiness) : null;
  const executiveSummary = task ? buildExecutiveSummary(task, latestDeliverable) : null;
  const runMeta = task ? buildRunMeta(task) : null;
  const continuationSurface = task?.continuation_surface ?? null;
  const followUpLane = continuationSurface?.follow_up_lane ?? null;
  const progressionLane = continuationSurface?.progression_lane ?? null;
  const continuationFocusSummary = buildContinuationFocusSummary(continuationSurface);
  const continuationDetailView = buildContinuationDetailView(continuationSurface);
  const continuityPosture = buildContinuationPostureView(continuationSurface);
  const successCriteria = task ? getGoalSuccessCriteria(task.goals) : [];
  const latestContext = task?.contexts[0];
  const workflowKey = task ? resolveWorkflowKey(task.task_type, task.mode) : null;
  const workflowDefinition = workflowKey ? getModeDefinition(workflowKey) : null;
  const parsedAppendix = extractModeSpecificAppendix(latestContext?.summary ?? "");
  const modeSpecificEntries =
    workflowKey && parsedAppendix.workflowKey
      ? getModeSpecificEntries(workflowKey, parsedAppendix.values)
      : [];
  const modeSpecificSections =
    task && latestDeliverable ? getModeSpecificResultSections(task, latestDeliverable) : [];
  const visibleModeSpecificSections = modeSpecificSections.filter((section) => section.items.length > 0);
  const visibleConstraints = task ? getVisibleConstraints(task.constraints) : [];
  const externalDataUsage = task ? buildExternalDataUsage(task, latestDeliverable) : null;
  const decisionSnapshot = task ? buildDecisionSnapshot(task, latestDeliverable) : null;
  const recommendationCards = task ? buildRecommendationCards(task, latestDeliverable) : [];
  const riskCards = task ? buildRiskCards(task, latestDeliverable) : [];
  const actionItemCards = task ? buildActionItemCards(task, latestDeliverable) : [];
  const workbenchObjectSummary = task ? buildWorkbenchObjectSummary(task, latestDeliverable) : null;
  const matterWorkspaceCard =
    task?.matter_workspace ? buildMatterWorkspaceCard(task.matter_workspace) : null;
  const objectNavigationStrip = task ? buildObjectNavigationStrip(task, latestDeliverable) : null;
  const capabilityFrame = task ? buildCapabilityFrame(task, latestDeliverable) : null;
  const packSelection = task ? buildPackSelectionView(task, latestDeliverable) : null;
  const readinessGovernance =
    task && readiness ? buildReadinessGovernance(task, latestDeliverable, readiness) : null;
  const ontologyChainSummary = task ? buildOntologyChainSummary(task, latestDeliverable) : null;
  const sparseInputOperatingView =
    task ? buildSparseInputOperatingView(task, latestDeliverable) : null;
  const flagshipLane = task ? buildFlagshipLaneView(task.flagship_lane) : null;
  const flagshipDetailView = buildFlagshipDetailView(flagshipLane);
  const materialReviewPosture = buildMaterialReviewPostureView(flagshipLane);
  const researchGuidance = task ? buildResearchGuidanceView(task.research_guidance) : null;
  const organizationMemoryView = task
    ? buildOrganizationMemoryView(
        task.organization_memory_guidance,
        task.generalist_guidance_posture,
        task.reuse_confidence_signal,
        task.confidence_calibration_signal,
        task.calibration_aware_weighting_signal,
      )
    : null;
  const domainPlaybookView = task
    ? buildDomainPlaybookView(
        task.domain_playbook_guidance,
        task.generalist_guidance_posture,
        task.reuse_confidence_signal,
        task.confidence_calibration_signal,
        task.calibration_aware_weighting_signal,
      )
    : null;
  const researchDetailView = task
    ? buildResearchDetailView(researchGuidance, task.research_runs[0] ?? null)
    : null;
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
    ? buildDeliverableTemplateView(
        task.deliverable_template_guidance,
        task.generalist_guidance_posture,
        task.reuse_confidence_signal,
        task.confidence_calibration_signal,
        task.calibration_aware_weighting_signal,
      )
    : null;
  const evidenceWorkspaceLane =
    task ? buildEvidenceWorkspaceLane(task, latestDeliverable, readinessGovernance) : null;
  const deliverableBacklink = task ? buildDeliverableBacklinkView(task, latestDeliverable) : null;
  const latestCaseWorldDraft = task?.case_world_draft ?? null;
  const caseWorldState = task?.case_world_state ?? null;
  const sliceDecisionContext = task?.slice_decision_context ?? null;
  const sharedParticipationCount = task
    ? new Set(
        [
          ...task.uploads
            .filter((item) => (item.participation?.participation_task_count ?? 0) > 1)
            .map((item) => item.id),
          ...task.source_materials
            .filter((item) => (item.participation?.participation_task_count ?? 0) > 1)
            .map((item) => item.id),
          ...task.evidence
            .filter((item) => (item.participation?.participation_task_count ?? 0) > 1)
            .map((item) => item.id),
        ],
      ).size
    : 0;
  const sliceOverlayFieldCount = sliceDecisionContext?.changed_fields.length ?? 0;
  const openEvidenceGaps = task?.evidence_gaps.filter((item) => item.status !== "resolved") ?? [];
  const recentDecisionRecords = task?.decision_records.slice(0, 3) ?? [];
  const recentOutcomeRecords = task?.outcome_records.slice(0, 3) ?? [];
  const pendingDecisionApprovals =
    task?.decision_records.filter((item) => item.approval_status === "pending").slice(0, 2) ?? [];
  const pendingActionPlanApprovals =
    task?.action_plans.filter((item) => item.approval_status === "pending").slice(0, 2) ?? [];
  const pendingApprovalCount = pendingDecisionApprovals.length + pendingActionPlanApprovals.length;
  const recentAuditEvents = task?.audit_events.slice(0, 4) ?? [];
  const canonicalizationSummary = task?.canonicalization_summary ?? null;
  const taskCanonicalizationCandidates = task?.canonicalization_candidates.slice(0, 4) ?? [];
  const currentTaskPendingCanonicalizationCount =
    canonicalizationSummary?.current_task_pending_count ?? 0;
  const worldAuthoritySummary = caseWorldState
    ? caseWorldState.client_id &&
      caseWorldState.engagement_id &&
      caseWorldState.workstream_id &&
      caseWorldState.decision_context_id
      ? "這筆工作只是案件世界裡的一個工作切片；核心客戶 / 委託 / 工作流 / 決策脈絡已掛在案件世界主脈絡上，工作參照只作相容層入口，主控代理與主要讀取路徑都優先回到這條主脈絡。"
      : "案件世界已建立，但底層身份仍在橋接同步。"
    : "目前尚未形成正式案件世界權威。";
  const sharedContinuitySummary = task
    ? task.uploads.some((item) => item.continuity_scope === "world_shared") ||
      task.source_materials.some((item) => item.continuity_scope === "world_shared") ||
      task.evidence.some((item) => item.continuity_scope === "world_shared")
      ? sharedParticipationCount > 0
        ? `這筆工作已可回看同一案件世界下共享的來源／材料／證據鏈；目前至少有 ${sharedParticipationCount} 條共享鏈透過正式參與映射被多個工作切片共同使用。`
        : "這筆工作已可回看同一案件世界下共享的來源／材料／證據鏈，不必把補件再拆成孤立流程。"
      : "目前這筆工作還沒有顯示可跨工作切片共用的來源／材料／證據鏈。"
    : "目前這筆工作還沒有顯示可跨工作切片共用的來源／材料／證據鏈。";
  const localOverlaySummary = sliceDecisionContext
    ? `目前這筆工作仍保留 ${sliceOverlayFieldCount} 項本地決策差異，供在途工作與相容層使用；正式核心／脈絡權威與主讀取路徑已優先回到案件世界。`
    : "目前沒有額外的本地決策覆層。";
  const canonicalizationSurfaceSummary = canonicalizationSummary
    ? currentTaskPendingCanonicalizationCount > 0
      ? `目前有 ${currentTaskPendingCanonicalizationCount} 組近似重複材料和這筆工作有關；若要處理，請到來源 / 證據工作面確認。`
      : canonicalizationSummary.summary
    : "目前沒有和這筆工作直接相關的重複材料候選。";
  const sortedRecommendations = task?.recommendations
    ? [...task.recommendations].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
    : [];
  const sortedRisks = task?.risks
    ? [...task.risks].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
    : [];
  const sortedActionItems = task?.action_items
    ? [...task.action_items].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
    : [];
  const hasBackgroundSupport = Boolean(
    task?.subjects.length ||
      task?.goals.length ||
      successCriteria.length ||
      latestContext?.notes?.trim() ||
      latestContext?.assumptions?.trim() ||
      visibleConstraints.length ||
      parsedAppendix.backgroundText.trim() ||
      modeSpecificEntries.length,
  );
  const shouldShowExternalDataContext = Boolean(
    externalDataUsage &&
      (externalDataUsage.searchUsed ||
        externalDataUsage.sources.length > 0 ||
        task?.external_data_strategy !== "strict"),
  );
  const hasSystemTrace = Boolean(task?.runs.length || task?.evidence.length || latestDeliverable);
  const hasThinTaskEvidence = Boolean(
    task && task.evidence.length < 2 && task.source_materials.length < 2,
  );
  const taskActionTitle = latestDeliverable
    ? continuationSurface?.workflow_layer === "checkpoint"
      ? "這筆工作屬於回來更新 / checkpoint 鏈"
      : continuationSurface?.workflow_layer === "progression"
        ? "這筆工作屬於持續推進 / outcome 鏈"
        : materialReviewPosture.shouldShow
          ? "這筆工作已有可回看的材料審閱結果"
          : "這筆工作已有可回看的正式交付物"
    : hasThinTaskEvidence
      ? "先補資料，或直接先跑第一版"
      : materialReviewPosture.shouldShow
        ? "這筆工作屬於材料審閱 / review memo 主線"
      : "這筆工作可以直接執行分析";
  const taskActionSummary = latestDeliverable
    ? continuationSurface?.workflow_layer === "checkpoint"
      ? `${continuityPosture.primarySummary} 你現在可以回看最新交付物、補件後重跑，或回到案件工作面把這輪結果寫成 checkpoint。`
      : continuationSurface?.workflow_layer === "progression"
        ? progressionLane?.what_changed[0]
          ? `${continuityPosture.primarySummary} ${progressionLane.what_changed[0]} 你現在可以回看最新交付物，或回到案件工作面更新進度與 outcome。`
          : `${continuityPosture.primarySummary} 你現在可以回看最新交付物，或回到案件工作面更新進度與 outcome。`
        : materialReviewPosture.shouldShow
          ? `${materialReviewPosture.primarySummary} 你現在可以直接打開交付物工作面，或先回看來源 / 證據，再決定是否補更多背景材料。`
          : "你現在可以直接打開交付物工作面，也可以先回看來源 / 證據與執行框架，再決定要不要重跑。"
    : hasThinTaskEvidence
      ? "目前資料仍偏薄，但不用卡住。你可以先補來源與證據，或直接讓主控代理先產出一版可回看的工作成果。"
      : materialReviewPosture.shouldShow
        ? `${materialReviewPosture.primarySummary} 執行分析後，結果會先落到 review memo / assessment 交付。`
      : "這筆工作已具備基本資料厚度，現在最有效率的做法是直接執行分析，再回到交付物工作面整理版本。";
  const taskActionChecklist = [
    "先確認上方的原始問題與決策問題是否對準你現在真正要判斷的事。",
    hasThinTaskEvidence
      ? "如果你手上有文件、網址或摘要，先補到來源 / 證據工作面；如果沒有，也可以直接先跑第一版。"
      : "目前資料已達基本可運作狀態，執行分析會比繼續空看頁面更有幫助。",
    latestDeliverable
      ? continuationSurface?.workflow_layer === "checkpoint"
        ? `最新結果已整理成「${latestDeliverable.title}」，接下來更像是回來更新 / checkpoint，不是完整長期追蹤。`
        : continuationSurface?.workflow_layer === "progression"
          ? `最新結果已整理成「${latestDeliverable.title}」，接下來更像是在延續持續推進節奏；${progressionLane?.next_progression_actions[0] || "可回案件工作面補記進度／結果。"}`
          : materialReviewPosture.shouldShow
            ? `最新結果已整理成「${latestDeliverable.title}」，目前更像 review memo / assessment 結果，不是最終決策版本。`
            : `最新結果已整理成「${latestDeliverable.title}」，可以直接進入正式交付物工作面。`
      : "真正會產出結果的是這頁的執行分析，不是只停在閱讀摘要。",
  ];
  const taskSectionGuideItems = task
    ? [
        {
          href: "#decision-context",
          eyebrow: "先對齊判斷",
          title: "原始問題與決策問題",
          copy: "先確認這輪到底要判斷什麼，避免把後面的摘要與建議看成另一個問題的答案。",
          meta: taskFraming?.analysisFocus || "先對齊這輪工作真正的主問題。",
          tone: "accent" as const,
        },
        {
          href: "#readiness-governance",
          eyebrow: "先看能不能跑",
          title: "可信度與資料缺口",
          copy: "確認目前資料厚度、主要缺口與執行風險，再決定是先補件還是直接跑。",
          meta: readinessGovernance?.summary || "先判斷這輪工作的就緒度。",
          tone:
            readinessGovernance?.level === "degraded" || hasThinTaskEvidence
              ? ("warm" as const)
              : ("default" as const),
        },
        {
          href: "#deliverable-surface",
          eyebrow: "先看結果",
          title: latestDeliverable ? "正式交付結果" : "結果會寫到哪裡",
          copy: latestDeliverable
            ? "這裡是最接近正式顧問交付物的閱讀主線，先看結論、建議與風險。"
            : "執行分析後，結果會先寫回這個交付結果區，再往正式交付物工作面延伸。",
          meta: latestDeliverable ? latestDeliverable.title : "目前尚未形成正式交付物。",
          tone: "accent" as const,
        },
        {
          href: "#workspace-lane",
          eyebrow: "要補資料時",
          title: "工作鏈與來源 / 證據",
          copy: "當你想確認這輪憑什麼得出結論，或需要補件時，這裡是回到證據主鏈的入口。",
          meta: `${task.source_materials.length} 份來源材料 / ${task.evidence.length} 則證據`,
          tone: "default" as const,
        },
      ]
    : [];
  const taskHeroContextPath =
    matterWorkspaceCard?.objectPath || "目前尚未掛回完整案件路徑。";
  const taskHeroQuestion =
    taskFraming?.judgmentToMake ||
    decisionSnapshot?.conclusion ||
    task?.title ||
    "目前尚未形成清楚的判斷主題。";
  const taskHeroFocusCopy =
    (materialReviewPosture.shouldShow ? materialReviewPosture.primarySummary : "") ||
    flagshipLane?.summary ||
    taskFraming?.analysisFocus ||
    taskActionSummary;
  const taskHeroLaneTitle = followUpLane
    ? "最近 checkpoint"
    : progressionLane
      ? "最近推進狀態"
      : materialReviewPosture.shouldShow
        ? "材料審閱姿態"
      : flagshipLane
        ? `目前交付等級｜${flagshipLane.currentOutputLabel}`
        : "目前狀態";
  const taskHeroLaneSummary = followUpLane
    ? followUpLane.latest_update?.summary || "尚未形成正式 checkpoint。"
    : progressionLane
      ? progressionLane.latest_progression?.summary || "目前還沒有新的推進更新。"
      : materialReviewPosture.shouldShow
        ? materialReviewPosture.nextStepHint
      : flagshipLane?.nextStepSummary || (latestDeliverable
        ? `已形成交付物「${latestDeliverable.title}」`
        : hasThinTaskEvidence
          ? "資料仍偏薄，建議補件或先跑第一版。"
          : "這筆工作已具備基本分析條件。");
  const taskHeroActionTitle = latestDeliverable
    ? "結果已形成，可先回看"
    : hasThinTaskEvidence
      ? "資料偏薄，但不用卡住"
      : "這筆工作可以直接推進";
  const selectedPackCount =
    task?.pack_resolution
      ? task.pack_resolution.selected_domain_packs.length +
        task.pack_resolution.selected_industry_packs.length
      : 0;
  const selectedAgentCount = task?.agent_selection.selected_agent_names.length ?? 0;
  const taskDetailUsabilityView = task
    ? buildTaskDetailUsabilityView({
        hasThinTaskEvidence,
        hasLatestDeliverable: Boolean(latestDeliverable),
        latestDeliverableTitle: latestDeliverable?.title || "",
        hasMatterWorkspace: Boolean(task.matter_workspace),
        runButtonLabel: runMeta?.buttonIdle ?? "執行分析",
        runDestinationLabel: latestDeliverable
          ? `最新結果已整理成「${latestDeliverable.title}」，可以直接回看正式交付結果。`
          : taskActionSummary,
        laneTitle: taskHeroLaneTitle,
        laneSummary: taskHeroLaneSummary,
        readinessLabel: readinessGovernance?.label || "待確認",
        readinessSummary: readinessGovernance?.summary || "先判斷這輪工作的就緒度。",
        evidenceCount: task.evidence.length,
        sourceMaterialCount: task.source_materials.length,
        hasResearchGuidance: Boolean(researchGuidance?.shouldShow),
        researchSummary: researchGuidance?.shouldShow
          ? [
              researchGuidance.firstQuestion,
              researchGuidance.stopCondition,
              researchGuidance.freshnessSummary,
            ]
              .filter(Boolean)
              .join("｜")
          : "",
        hasContinuationSummary: continuationFocusSummary.shouldShow,
        continuationSummary: continuationFocusSummary.copy || "",
      })
    : null;

  return (
    <main className="page-shell decision-page-shell">
      <div className="back-link-group">
        <Link className="back-link" href="/">
          ← 返回工作台
        </Link>
        {task?.matter_workspace ? (
          <Link className="back-link" href={`/matters/${task.matter_workspace.id}`}>
            ← 返回案件工作面
          </Link>
        ) : null}
        {task?.matter_workspace ? (
          <Link className="back-link" href={`/matters/${task.matter_workspace.id}/evidence`}>
            ← 返回來源 / 證據工作面
          </Link>
        ) : null}
      </div>

      {loading ? <p className="status-text">正在載入任務工作區...</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      {task ? (
        <>
          <section className="hero-card decision-hero">
            <div className="hero-layout">
              <div className="hero-main">
                <span className="eyebrow">決策工作面</span>
                <h1 className="page-title">{task.title}</h1>
                <p className="page-subtitle">{task.description || "未提供額外說明。"}</p>
                <p className="workspace-object-path">{taskHeroContextPath}</p>
                <div className="meta-row" style={{ marginTop: "16px" }}>
                  <span className="pill">{labelForTaskStatus(task.status)}</span>
                  <span>{labelForTaskType(task.task_type)}</span>
                  <span>{labelForFlowMode(task.mode)}</span>
                  <span>更新於 {formatDisplayDate(task.updated_at)}</span>
                </div>
                <div className="hero-focus-card">
                  <p className="hero-focus-label">這輪要判斷什麼</p>
                  <h3 className="hero-focus-title">{taskHeroQuestion}</h3>
                  <p className="hero-focus-copy">{taskHeroFocusCopy}</p>
                </div>
                <div className="button-row" style={{ marginTop: "4px" }}>
                  {latestDeliverable ? (
                    <Link className="button-primary" href={`/deliverables/${latestDeliverable.id}`}>
                      打開正式交付物
                    </Link>
                  ) : (
                    <button
                      className="button-primary"
                      type="button"
                      onClick={handleRun}
                      disabled={running}
                    >
                      {running ? runMeta?.buttonRunning ?? "執行中..." : runMeta?.buttonIdle}
                    </button>
                  )}
                  {task.matter_workspace ? (
                    <Link
                      className="button-secondary"
                      href={`/matters/${task.matter_workspace.id}/evidence`}
                    >
                      先補來源與證據
                    </Link>
                  ) : null}
                  {task.matter_workspace ? (
                    <Link className="button-secondary" href={`/matters/${task.matter_workspace.id}`}>
                      回案件工作面
                    </Link>
                  ) : null}
                </div>
              </div>

              <div className="hero-aside">
                <div className="hero-focus-card hero-focus-card-warm">
                  <p className="hero-focus-label">
                    {taskDetailUsabilityView?.primaryLabel || "現在先做這件事"}
                  </p>
                  <h3 className="hero-focus-title">
                    {taskDetailUsabilityView?.primaryTitle || taskHeroActionTitle}
                  </h3>
                  <p className="hero-focus-copy">
                    {taskDetailUsabilityView?.primaryCopy || taskActionSummary}
                  </p>
                  <ul className="hero-focus-list">
                    {(taskDetailUsabilityView?.checklist || taskActionChecklist)
                      .slice(0, 3)
                      .map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="hero-focus-card">
                  <p className="hero-focus-label">
                    {taskDetailUsabilityView?.railEyebrow ||
                      (researchGuidance?.shouldShow
                        ? researchGuidance.label
                        : continuationFocusSummary.shouldShow
                          ? continuationFocusSummary.label
                          : taskHeroLaneTitle)}
                  </p>
                  <h3 className="hero-focus-title">
                    {taskDetailUsabilityView?.railTitle ||
                      (researchGuidance?.shouldShow
                        ? `${researchGuidance.depthLabel}｜${researchGuidance.firstQuestion}`
                        : continuationFocusSummary.shouldShow
                          ? continuationFocusSummary.title
                          : taskHeroActionTitle)}
                  </h3>
                  {taskDetailUsabilityView ? (
                    <p className="hero-focus-copy">{taskDetailUsabilityView.railSummary}</p>
                  ) : researchGuidance?.shouldShow ? (
                    <p className="hero-focus-copy">
                      {researchGuidance.executionOwnerLabel}｜
                      {researchGuidance.sourceQualitySummary || researchGuidance.stopCondition || researchGuidance.handoffSummary}
                      {researchGuidance.freshnessSummary ? `｜${researchGuidance.freshnessSummary}` : ""}
                    </p>
                  ) : continuationFocusSummary.shouldShow ? (
                    <p className="hero-focus-copy">{continuationFocusSummary.copy}</p>
                  ) : followUpLane ? (
                    <p className="hero-focus-copy">
                      上一個檢查點：
                      {followUpLane.previous_checkpoint?.summary || "目前沒有更早的檢查點可比較。"}
                    </p>
                  ) : progressionLane ? (
                    <p className="hero-focus-copy">
                      下一步：
                      {progressionLane.next_progression_actions[0] || "回案件工作面更新推進狀態。"}
                    </p>
                  ) : flagshipLane ? (
                    <p className="hero-focus-copy">
                      {flagshipLane.upgradeRequirements[0] || flagshipLane.boundaryNote}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="hero-metrics-grid">
              <div className="section-card hero-metric-card">
                <h3>目前狀態</h3>
                <p className="workbench-metric">{labelForTaskStatus(task.status)}</p>
                <p className="muted-text">{labelForFlowMode(task.mode)} / {labelForTaskType(task.task_type)}</p>
              </div>
              <div className="section-card hero-metric-card">
                <h3>來源與證據</h3>
                <p className="workbench-metric">{task.evidence.length}</p>
                <p className="muted-text">{task.source_materials.length} 份來源材料</p>
              </div>
              <div className="section-card hero-metric-card">
                <h3>交付狀態</h3>
                <p className="workbench-metric">{latestDeliverable ? "已形成" : "未形成"}</p>
                <p className="muted-text">
                  {latestDeliverable ? latestDeliverable.title : "目前尚未形成正式交付物。"}
                </p>
              </div>
              <div className="section-card hero-metric-card">
                <h3>已選代理</h3>
                <p className="workbench-metric">{selectedAgentCount}</p>
                <p className="muted-text">
                  {selectedPackCount} 個模組包 / {selectedAgentCount > 0 ? "已形成代理路徑" : "目前仍偏向最小路徑"}
                </p>
              </div>
            </div>
          </section>

          <WorkspaceSectionGuide
            title={taskDetailUsabilityView?.guideTitle || "這頁怎麼讀最快"}
            description={
              taskDetailUsabilityView?.guideDescription ||
              "不要整頁一路往下刷。先選你現在要做的是對齊判斷、確認能不能跑、還是直接回看結果。"
            }
            items={taskDetailUsabilityView?.guideItems || taskSectionGuideItems}
          />

          {taskDetailUsabilityView ? (
            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2 className="panel-title">{taskDetailUsabilityView.operatingSummaryTitle}</h2>
                  <p className="panel-copy">{taskDetailUsabilityView.operatingSummaryCopy}</p>
                </div>
              </div>
              <div className="section-guide-grid">
                {taskDetailUsabilityView.operatingNotes.map((item) => (
                  <Link
                    key={`${item.href}-${item.label}`}
                    className={`section-guide-card section-guide-card-${item.tone ?? "default"}`}
                    href={item.href}
                  >
                    <span className="section-guide-eyebrow">{item.label}</span>
                    <p className="section-guide-copy">{item.copy}</p>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          <DisclosurePanel
            title="案件世界草稿與寫回策略"
            description="只有在你要檢查主控代理目前怎麼理解這筆工作、這個工作在案件世界裡屬於哪個工作切片、以及世界權威目前掛在哪裡時，再展開這層。"
          >
            <div className="summary-grid">
              <div className="section-card">
                <h4>連續性策略</h4>
                <p className="content-block">
                  {labelForEngagementContinuityMode(task.engagement_continuity_mode)} /{" "}
                  {labelForWritebackDepth(task.writeback_depth)}
                </p>
              </div>
              <div className="section-card">
                <h4>世界優先狀態</h4>
                <p className="content-block">
                  {caseWorldState
                    ? `${caseWorldState.compiler_status}｜${task.world_work_slice_summary}`
                    : task.world_work_slice_summary || "目前尚未形成正式案件世界狀態。"}
                </p>
              </div>
              <div className="section-card">
                <h4>世界身份權威</h4>
                <p className="content-block">{worldAuthoritySummary}</p>
              </div>
              <div className="section-card">
                <h4>進件入口 / 解析狀態</h4>
                <p className="content-block">
                  {caseWorldState || latestCaseWorldDraft
                    ? `${(caseWorldState?.compiler_status || latestCaseWorldDraft?.compiler_status) ?? "compiled"}｜${
                        (caseWorldState?.canonical_intake_summary.problem_statement ||
                          latestCaseWorldDraft?.canonical_intake_summary.problem_statement ||
                          "未顯示")
                      }`
                    : "目前尚未形成案件世界草稿。"}
                </p>
              </div>
              <div className="section-card">
                <h4>最近寫回</h4>
                <p className="content-block">
                  {task.decision_records.length} 筆決策紀錄 / {task.outcome_records.length} 筆結果紀錄
                </p>
              </div>
              <div className="section-card">
                <h4>正式核可狀態</h4>
                <p className="content-block">
                  {pendingApprovalCount > 0
                    ? `目前有 ${pendingApprovalCount} 筆待正式核可的 decision / action 記錄。`
                    : "目前沒有待正式核可的 writeback 記錄。"}
                </p>
              </div>
              <div className="section-card">
                <h4>稽核事件</h4>
                <p className="content-block">
                  {task.audit_events.length > 0
                    ? `目前已留存 ${task.audit_events.length} 筆 writeback / approval 稽核事件。`
                    : "目前還沒有額外的 writeback / approval 稽核事件。"}
                </p>
              </div>
              <div className="section-card">
                <h4>研究來源脈絡</h4>
                <p className="content-block">
                  {task.research_runs.length > 0
                    ? `已留存 ${task.research_runs.length} 筆研究執行紀錄；最近一筆為 ${labelForResearchDepth(task.research_runs[0].research_depth)}。`
                    : "目前沒有研究來源脈絡。"}
                </p>
                {researchDetailView?.shouldShow ? (
                  <p className="muted-text">
                    {researchDetailView.cards[3]?.summary || researchDetailView.cards[0]?.summary}
                  </p>
                ) : null}
              </div>
              <div className="section-card">
                <h4>共享材料連續性</h4>
                <p className="content-block">{sharedContinuitySummary}</p>
              </div>
              <div className="section-card">
                <h4>重複材料確認</h4>
                <p className="content-block">{canonicalizationSurfaceSummary}</p>
              </div>
              <div className="section-card">
                <h4>本地覆層</h4>
                <p className="content-block">{localOverlaySummary}</p>
              </div>
            </div>

                {caseWorldState || latestCaseWorldDraft ? (
              <div className="detail-list" style={{ marginTop: "18px" }}>
                <div className="detail-item">
                  <h3>已知事實</h3>
                  <ExpandableList
                    items={(caseWorldState?.facts ?? latestCaseWorldDraft?.facts ?? []).map(
                      (item) => `${item.title}：${item.detail}`,
                    )}
                    emptyText="目前沒有額外已知事實。"
                  />
                </div>
                <div className="detail-item">
                  <h3>假設</h3>
                  <ExpandableList
                    items={(caseWorldState?.assumptions ?? latestCaseWorldDraft?.assumptions ?? []).map(
                      (item) => `${item.title}：${item.detail}`,
                    )}
                    emptyText="目前沒有額外假設。"
                  />
                </div>
                <div className="detail-item">
                  <h3>證據缺口</h3>
                  <ExpandableList
                    items={openEvidenceGaps.map((item) => `${item.title}：${item.description}`)}
                    emptyText="目前沒有高優先證據缺口。"
                  />
                </div>
                {sliceDecisionContext ? (
                  <div className="detail-item">
                    <h3>工作切片在地決策覆層</h3>
                    <ExpandableList
                      items={[
                        sliceDecisionContext.judgment_to_make,
                        sliceDecisionContext.title,
                        sliceDecisionContext.summary,
                        ...sliceDecisionContext.goals.map((item) => `目標差異：${item}`),
                        ...sliceDecisionContext.constraints.map((item) => `限制差異：${item}`),
                        ...sliceDecisionContext.assumptions.map((item) => `假設差異：${item}`),
                      ].filter((item): item is string => Boolean(item))}
                      emptyText="目前沒有額外的工作切片覆層。"
                    />
                  </div>
                ) : null}
                {caseWorldState?.last_supplement_summary ? (
                  <div className="detail-item">
                    <h3>最近案件世界更新</h3>
                    <p className="content-block">
                      後續補件已先更新案件世界，再回到這個工作切片：{caseWorldState.last_supplement_summary}
                    </p>
                  </div>
                ) : null}
                <div className="detail-item">
                  <h3>最近決策 / 結果</h3>
                  <ExpandableList
                    items={[
                      ...recentDecisionRecords.map((item) => `決策：${item.decision_summary}`),
                      ...recentOutcomeRecords.map((item) => `結果：${item.summary}`),
                    ]}
                    emptyText="目前還沒有可回看的寫回紀錄。"
                  />
                </div>
                {taskCanonicalizationCandidates.length > 0 ? (
                  <div className="detail-item">
                    <h3>需確認是否同一份材料</h3>
                    <ul className="list-content">
                      {taskCanonicalizationCandidates.map((item) => (
                        <li key={item.review_key}>
                          {item.consultant_summary}
                          {task.matter_workspace ? (
                            <div style={{ marginTop: "8px" }}>
                              <Link
                                className="back-link"
                                href={`/matters/${task.matter_workspace.id}/artifact-evidence#evidence-duplicate-review`}
                              >
                                到來源 / 證據工作面確認這組材料
                              </Link>
                            </div>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <div className="detail-item">
                  <h3>正式核可 / 稽核</h3>
                  {approvalFeedback ? <p className="success-text">{approvalFeedback}</p> : null}
                  <div className="summary-grid">
                    <div className="section-card">
                      <h4>待正式核可</h4>
                      {pendingApprovalCount > 0 ? (
                        <ul className="list-content">
                          {pendingDecisionApprovals.map((item) => (
                            <li key={item.id}>
                              Decision｜{labelForFunctionType(item.function_type)}｜{labelForApprovalPolicy(item.approval_policy)}
                              <div className="button-row" style={{ marginTop: "8px" }}>
                                <button
                                  className="button-secondary"
                                  type="button"
                                  disabled={approvingTargetId === item.id}
                                  onClick={() => void handleApproveWriteback("decision_record", item.id)}
                                >
                                  {approvingTargetId === item.id ? "處理中..." : "標記為正式核可"}
                                </button>
                              </div>
                            </li>
                          ))}
                          {pendingActionPlanApprovals.map((item) => (
                            <li key={item.id}>
                              Action plan｜{labelForActionStatus(item.status)}｜{labelForApprovalPolicy(item.approval_policy)}
                              <div className="button-row" style={{ marginTop: "8px" }}>
                                <button
                                  className="button-secondary"
                                  type="button"
                                  disabled={approvingTargetId === item.id}
                                  onClick={() => void handleApproveWriteback("action_plan", item.id)}
                                >
                                  {approvingTargetId === item.id ? "處理中..." : "標記為正式核可"}
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="empty-text">目前沒有待處理的正式核可項目。</p>
                      )}
                    </div>
                    <div className="section-card">
                      <h4>最近稽核事件</h4>
                      {recentAuditEvents.length > 0 ? (
                        <ul className="list-content">
                          {recentAuditEvents.map((item) => (
                            <li key={item.id}>
                              {labelForAuditEventType(item.event_type)}｜{item.actor_label}｜{item.summary}
                              {item.approval_status ? `｜${labelForApprovalStatus(item.approval_status)}` : ""}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="empty-text">目前還沒有額外的 writeback / approval 稽核事件。</p>
                      )}
                    </div>
                  </div>
                </div>
                {continuationDetailView.shouldShow ? (
                  <div className="detail-item">
                    <h3>{continuationDetailView.sectionTitle}</h3>
                    <div className="summary-grid">
                      {continuationDetailView.cards.map((card) => (
                        <div className="section-card" key={`task-continuity-${card.title}`}>
                          <h4>{card.title}</h4>
                          <p className="content-block">{card.summary}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
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
                {flagshipDetailView.shouldShow ? (
                  <div className="detail-item">
                    <h3>{flagshipDetailView.sectionTitle}</h3>
                    <div className="summary-grid">
                      {flagshipDetailView.cards.map((card) => (
                        <div className="section-card" key={`task-flagship-${card.title}`}>
                          <h4>{card.title}</h4>
                          <p className="content-block">{card.summary}</p>
                        </div>
                      ))}
                    </div>
                    {flagshipDetailView.listItems.length > 0 ? (
                      <>
                        <h4 style={{ marginTop: "16px" }}>{flagshipDetailView.listTitle}</h4>
                        <ul className="list-content" style={{ marginTop: "12px" }}>
                          {flagshipDetailView.listItems.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </>
                    ) : null}
                  </div>
                ) : null}
                {researchDetailView?.shouldShow ? (
                  <div className="detail-item">
                    <h3>{researchDetailView.sectionTitle}</h3>
                    <div className="summary-grid">
                      {researchDetailView.cards.map((card) => (
                        <div className="section-card" key={`task-research-${card.title}`}>
                          <h4>{card.title}</h4>
                          <p className="content-block">{card.summary}</p>
                        </div>
                      ))}
                    </div>
                    {researchDetailView.listItems.length > 0 ? (
                      <>
                        <h4 style={{ marginTop: "16px" }}>{researchDetailView.listTitle}</h4>
                        <ul className="list-content" style={{ marginTop: "12px" }}>
                          {researchDetailView.listItems.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </>
                    ) : null}
                  </div>
                ) : null}
                {precedentReferenceView?.shouldShow ? (
                  <div className="detail-item">
                    <h3>{precedentReferenceView.sectionTitle}</h3>
                    <p className="content-block">{precedentReferenceView.summary}</p>
                    <div className="summary-grid" style={{ marginTop: "16px" }}>
                      {precedentReferenceView.cards.map((card) => (
                        <div className="section-card" key={`task-precedent-reference-${card.title}`}>
                          <h4>{card.title}</h4>
                          <p className="content-block">{card.summary}</p>
                          <p className="muted-text">{card.meta}</p>
                        </div>
                      ))}
                    </div>
                    {precedentReferenceView.listItems.length > 0 ? (
                      <>
                        <h4 style={{ marginTop: "16px" }}>這層怎麼安全使用</h4>
                        <ul className="list-content" style={{ marginTop: "12px" }}>
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
                ) : null}
                {organizationMemoryView?.shouldShow ? (
                  <div className="detail-item">
                    <h3>{organizationMemoryView.sectionTitle}</h3>
                    <p className="content-block">{organizationMemoryView.summary}</p>
                    {organizationMemoryView.organizationLabel ? (
                      <p className="muted-text">{organizationMemoryView.organizationLabel}</p>
                    ) : null}
                    {organizationMemoryView.sourceLifecycleSummary ? (
                      <p className="muted-text">{organizationMemoryView.sourceLifecycleSummary}</p>
                    ) : null}
                    {organizationMemoryView.lifecyclePostureLabel ? (
                      <p className="muted-text">來源姿態：{organizationMemoryView.lifecyclePostureLabel}</p>
                    ) : null}
                    {organizationMemoryView.freshnessSummary ? (
                      <p className="muted-text">{organizationMemoryView.freshnessSummary}</p>
                    ) : null}
                    {organizationMemoryView.reactivationSummary ? (
                      <p className="muted-text">{organizationMemoryView.reactivationSummary}</p>
                    ) : null}
                    {organizationMemoryView.stableContextItems.length > 0 ? (
                      <ul className="list-content" style={{ marginTop: "12px" }}>
                        {organizationMemoryView.stableContextItems.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    ) : null}
                    {organizationMemoryView.crossMatterSummary ? (
                      <p className="muted-text" style={{ marginTop: "12px" }}>
                        {organizationMemoryView.crossMatterSummary}
                      </p>
                    ) : null}
                    {organizationMemoryView.crossMatterItems.length > 0 ? (
                      <div className="summary-grid" style={{ marginTop: "16px" }}>
                        {organizationMemoryView.crossMatterItems.map((item) => (
                          <div
                            className="section-card"
                            key={`task-cross-memory-${item.matterWorkspaceId}`}
                          >
                            <h4>{item.title}</h4>
                            <p className="content-block">{item.summary}</p>
                            <p className="muted-text">{item.meta}</p>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    {organizationMemoryView.knownConstraints.length > 0 ? (
                      <>
                        <h4 style={{ marginTop: "16px" }}>已知限制</h4>
                        <ul className="list-content" style={{ marginTop: "12px" }}>
                          {organizationMemoryView.knownConstraints.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </>
                    ) : null}
                    {organizationMemoryView.continuityAnchor ? (
                      <p className="muted-text" style={{ marginTop: "12px" }}>
                        {organizationMemoryView.continuityAnchor}
                      </p>
                    ) : null}
                    {organizationMemoryView.phaseSixSignalNote ? (
                      <p className="muted-text" style={{ marginTop: "12px" }}>
                        {organizationMemoryView.phaseSixSignalNote}
                      </p>
                    ) : null}
                    <p className="muted-text" style={{ marginTop: "12px" }}>
                      {organizationMemoryView.boundaryNote}
                    </p>
                  </div>
                ) : null}
                {domainPlaybookView?.shouldShow ? (
                  <div className="detail-item">
                    <h3>{domainPlaybookView.sectionTitle}</h3>
                    <p className="content-block">{domainPlaybookView.summary}</p>
                    {domainPlaybookView.playbookLabel ? (
                      <p className="muted-text">{domainPlaybookView.playbookLabel}</p>
                    ) : null}
                    {domainPlaybookView.fitSummary ? (
                      <p className="muted-text">{domainPlaybookView.fitSummary}</p>
                    ) : null}
                    {domainPlaybookView.sourceMixSummary ? (
                      <p className="muted-text">{domainPlaybookView.sourceMixSummary}</p>
                    ) : null}
                    {domainPlaybookView.sourceLifecycleSummary ? (
                      <p className="muted-text">{domainPlaybookView.sourceLifecycleSummary}</p>
                    ) : null}
                    {domainPlaybookView.lifecyclePostureLabel ? (
                      <p className="muted-text">來源姿態：{domainPlaybookView.lifecyclePostureLabel}</p>
                    ) : null}
                    {domainPlaybookView.freshnessSummary ? (
                      <p className="muted-text">{domainPlaybookView.freshnessSummary}</p>
                    ) : null}
                    {domainPlaybookView.recoveryBalanceSummary ? (
                      <p className="muted-text">{domainPlaybookView.recoveryBalanceSummary}</p>
                    ) : null}
                    {domainPlaybookView.reactivationSummary ? (
                      <p className="muted-text">{domainPlaybookView.reactivationSummary}</p>
                    ) : null}
                    {domainPlaybookView.decaySummary ? (
                      <p className="muted-text">{domainPlaybookView.decaySummary}</p>
                    ) : null}
                    {domainPlaybookView.currentStageLabel ? (
                      <p className="muted-text">
                        目前這輪：{domainPlaybookView.currentStageLabel}
                      </p>
                    ) : null}
                    {domainPlaybookView.nextStageLabel ? (
                      <p className="muted-text">
                        下一步通常接：{domainPlaybookView.nextStageLabel}
                      </p>
                    ) : null}
                    <div className="summary-grid" style={{ marginTop: "16px" }}>
                      {domainPlaybookView.cards.map((card) => (
                        <div className="section-card" key={`task-domain-playbook-${card.title}`}>
                          <h4>{card.title}</h4>
                          <p className="content-block">{card.summary}</p>
                          <p className="muted-text">{card.meta}</p>
                        </div>
                      ))}
                    </div>
                    {domainPlaybookView.listItems.length > 0 ? (
                      <>
                        <h4 style={{ marginTop: "16px" }}>{domainPlaybookView.listTitle}</h4>
                        <ul className="list-content" style={{ marginTop: "12px" }}>
                          {domainPlaybookView.listItems.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </>
                    ) : null}
                    {domainPlaybookView.phaseSixSignalNote ? (
                      <p className="muted-text" style={{ marginTop: "12px" }}>
                        {domainPlaybookView.phaseSixSignalNote}
                      </p>
                    ) : null}
                    <p className="muted-text" style={{ marginTop: "12px" }}>
                      {domainPlaybookView.boundaryNote}
                    </p>
                  </div>
                ) : null}
                {reviewLensView?.shouldShow ? (
                  <div className="detail-item">
                    <h3>{reviewLensView.sectionTitle}</h3>
                    <p className="content-block">{reviewLensView.summary}</p>
                    <div className="summary-grid" style={{ marginTop: "16px" }}>
                      {reviewLensView.cards.map((card) => (
                        <div className="section-card" key={`task-review-lens-${card.title}`}>
                          <h4>{card.title}</h4>
                          <p className="content-block">{card.summary}</p>
                          <p className="muted-text">{card.meta}</p>
                        </div>
                      ))}
                    </div>
                    {reviewLensView.listItems.length > 0 ? (
                      <>
                        <h4 style={{ marginTop: "16px" }}>{reviewLensView.listTitle}</h4>
                        <ul className="list-content" style={{ marginTop: "12px" }}>
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
                ) : null}
                {commonRiskLibraryView?.shouldShow ? (
                  <div className="detail-item">
                    <h3>{commonRiskLibraryView.sectionTitle}</h3>
                    <p className="content-block">{commonRiskLibraryView.summary}</p>
                    <div className="summary-grid" style={{ marginTop: "16px" }}>
                      {commonRiskLibraryView.cards.map((card) => (
                        <div className="section-card" key={`task-common-risk-${card.title}`}>
                          <h4>{card.title}</h4>
                          <p className="content-block">{card.summary}</p>
                          <p className="muted-text">{card.meta}</p>
                        </div>
                      ))}
                    </div>
                    {commonRiskLibraryView.listItems.length > 0 ? (
                      <>
                        <h4 style={{ marginTop: "16px" }}>{commonRiskLibraryView.listTitle}</h4>
                        <ul className="list-content" style={{ marginTop: "12px" }}>
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
                ) : null}
                {deliverableTemplateView?.shouldShow ? (
                  <div className="detail-item">
                    <h3>{deliverableTemplateView.sectionTitle}</h3>
                    <p className="content-block">{deliverableTemplateView.summary}</p>
                    {deliverableTemplateView.templateLabel ? (
                      <p className="muted-text">{deliverableTemplateView.templateLabel}</p>
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
                    {deliverableTemplateView.sourceLifecycleSummary ? (
                      <p className="muted-text">{deliverableTemplateView.sourceLifecycleSummary}</p>
                    ) : null}
                    {deliverableTemplateView.lifecyclePostureLabel ? (
                      <p className="muted-text">來源姿態：{deliverableTemplateView.lifecyclePostureLabel}</p>
                    ) : null}
                    {deliverableTemplateView.freshnessSummary ? (
                      <p className="muted-text">{deliverableTemplateView.freshnessSummary}</p>
                    ) : null}
                    {deliverableTemplateView.recoveryBalanceSummary ? (
                      <p className="muted-text">{deliverableTemplateView.recoveryBalanceSummary}</p>
                    ) : null}
                    {deliverableTemplateView.reactivationSummary ? (
                      <p className="muted-text">{deliverableTemplateView.reactivationSummary}</p>
                    ) : null}
                    {deliverableTemplateView.decaySummary ? (
                      <p className="muted-text">{deliverableTemplateView.decaySummary}</p>
                    ) : null}
                    <div className="summary-grid" style={{ marginTop: "16px" }}>
                      {deliverableTemplateView.cards.map((card) => (
                        <div className="section-card" key={`task-deliverable-template-${card.title}`}>
                          <h4>{card.title}</h4>
                          <p className="content-block">{card.summary}</p>
                          <p className="muted-text">{card.meta}</p>
                        </div>
                      ))}
                    </div>
                    {deliverableTemplateView.coreSections.length > 0 ? (
                      <>
                        <h4 style={{ marginTop: "16px" }}>{deliverableTemplateView.coreListTitle}</h4>
                        <ul className="list-content" style={{ marginTop: "12px" }}>
                          {deliverableTemplateView.coreSections.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </>
                    ) : null}
                    {deliverableTemplateView.optionalSections.length > 0 ? (
                      <>
                        <h4 style={{ marginTop: "16px" }}>{deliverableTemplateView.optionalListTitle}</h4>
                        <ul className="list-content" style={{ marginTop: "12px" }}>
                          {deliverableTemplateView.optionalSections.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </>
                    ) : null}
                    {deliverableTemplateView.phaseSixSignalNote ? (
                      <p className="muted-text" style={{ marginTop: "12px" }}>
                        {deliverableTemplateView.phaseSixSignalNote}
                      </p>
                    ) : null}
                    <p className="muted-text" style={{ marginTop: "12px" }}>
                      {deliverableTemplateView.boundaryNote}
                    </p>
                  </div>
                ) : null}
                {deliverableShapeHintView?.shouldShow ? (
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
                        <div className="section-card" key={`task-deliverable-shape-${card.title}`}>
                          <h4>{card.title}</h4>
                          <p className="content-block">{card.summary}</p>
                          <p className="muted-text">{card.meta}</p>
                        </div>
                      ))}
                    </div>
                    {deliverableShapeHintView.listItems.length > 0 ? (
                      <>
                        <h4 style={{ marginTop: "16px" }}>{deliverableShapeHintView.listTitle}</h4>
                        <ul className="list-content" style={{ marginTop: "12px" }}>
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
                ) : null}
              </div>
            ) : null}
          </DisclosurePanel>

          {matterWorkspaceCard ? (
            <DisclosurePanel
              title="案件世界連續性"
              description="只有在你要確認這筆工作掛在哪個案件、DecisionContext 與工作鏈上時，再展開這層。"
            >
              <div className="panel-header">
                <div>
                  <h3 className="panel-title">案件世界連續性</h3>
                  <p className="panel-copy">
                    這筆工作現在已正式掛在案件世界下。你可以回到同一個案件工作台，看跨工作紀錄的決策脈絡、交付物與材料累積。
                  </p>
                </div>
                <Link className="button-secondary" href={`/matters/${task.matter_workspace?.id}`}>
                  打開案件工作面
                </Link>
              </div>
              <div className="summary-grid">
                <div className="section-card">
                  <h4>案件世界</h4>
                  <p className="content-block">{matterWorkspaceCard.objectPath}</p>
                </div>
                <div className="section-card">
                  <h4>當前主要 DecisionContext</h4>
                  <ExpandableText
                    text={matterWorkspaceCard.decisionContext}
                    emptyText="目前沒有可顯示的案件判斷主軸。"
                    previewChars={220}
                  />
                </div>
                <div className="section-card">
                  <h4>連續性摘要</h4>
                  <ExpandableText
                    text={matterWorkspaceCard.continuity}
                    emptyText="目前沒有可顯示的連續性摘要。"
                    previewChars={220}
                  />
                </div>
                <div className="section-card">
                  <h4>目前工作狀態</h4>
                  <ExpandableText
                    text={matterWorkspaceCard.activeWork}
                    emptyText="目前沒有可顯示的工作狀態。"
                    previewChars={220}
                  />
                </div>
              </div>
              <div className="meta-row" style={{ marginTop: "16px" }}>
                {matterWorkspaceCard.counts.map((count) => (
                  <span key={count}>{count}</span>
                ))}
              </div>
              <p className="muted-text" style={{ marginTop: "12px" }}>
                {matterWorkspaceCard.packSummary}
              </p>
              <p className="muted-text">{matterWorkspaceCard.agentSummary}</p>
            </DisclosurePanel>
          ) : null}

          {objectNavigationStrip ? (
            <DisclosurePanel
              id="object-navigation"
              title="完整物件導覽列"
              description="只有在你要核對完整物件路徑、進件模式與掛載關係時，再展開這一層；主線閱讀可先看下方段落導覽。"
            >
              <div className="panel-header">
                <div>
                  <h3 className="panel-title">物件導覽列</h3>
                  <p className="panel-copy">
                    先確認這輪工作掛在哪個客戶 / 案件委託 / 工作流 / 決策問題上，再決定要往哪條工作面繼續下鑽。
                  </p>
                </div>
              </div>
              <div className="meta-row" style={{ marginBottom: "16px" }}>
                <span className="pill">{objectNavigationStrip.entryModeLabel}</span>
                <span>{objectNavigationStrip.deliverableClassLabel}</span>
                {objectNavigationStrip.externalResearchHeavy ? (
                  <span>外部研究導向的稀疏輸入案件</span>
                ) : null}
              </div>
              <p className="panel-copy workspace-strip-summary">
                {objectNavigationStrip.workspaceSummary}
              </p>
              <div className="object-strip">
                {objectNavigationStrip.items.map((item) => (
                  <a
                    key={item.key}
                    className="object-strip-card"
                    href={`#${item.anchorId}`}
                  >
                    <div className="meta-row">
                      <span className="pill">{item.label}</span>
                      <span>{item.stateLabel}</span>
                    </div>
                    <h3>{item.value}</h3>
                    <p className="object-strip-note">{item.note}</p>
                  </a>
                ))}
              </div>
            </DisclosurePanel>
          ) : null}

          <div className="detail-grid">
            <div className="detail-stack">
              <DisclosurePanel
                id="workspace-lane"
                title="工作鏈與來源 / 證據"
                description="當你要補件或追查這輪判斷憑什麼成立時，再打開這層。"
              >
                <div className="panel-header">
                  <div>
                    <h3 className="panel-title">工作物件 / 來源材料 / 證據工作面</h3>
                    <p className="panel-copy">
                      這裡不是單純補充資料，而是這輪判斷真正依附的工作鏈。若要完整回看來源角色、支撐鏈與高影響缺口，現在可直接進入正式的來源 / 證據工作面。
                    </p>
                  </div>
                  {task.matter_workspace ? (
                    <Link className="button-secondary" href={`/matters/${task.matter_workspace.id}/evidence`}>
                      打開來源 / 證據工作面
                    </Link>
                  ) : null}
                </div>
                {evidenceWorkspaceLane && workbenchObjectSummary && ontologyChainSummary ? (
                  <>
                    <div className="summary-grid">
                      <div className="section-card">
                        <h4>工作面判斷</h4>
                        <ExpandableText
                          text={evidenceWorkspaceLane.summary}
                          emptyText="尚未形成可讀的工作面摘要。"
                          previewChars={220}
                        />
                      </div>
                      <div className="section-card">
                        <h4>主要案件主體</h4>
                        <p className="content-block">
                          {workbenchObjectSummary.primaryEntity}
                          {"\n"}
                          {workbenchObjectSummary.clientContext}
                        </p>
                      </div>
                      <div className="section-card">
                        <h4>問題面向 / 工作流</h4>
                        <p className="content-block">
                          {workbenchObjectSummary.domainLensSummary}
                          {"\n"}
                          {workbenchObjectSummary.workstream}
                        </p>
                      </div>
                      <div className="section-card">
                        <h4>物件鏈密度</h4>
                        <p className="content-block">
                          {ontologyChainSummary.sourceMaterialCount} 份 source material /{" "}
                          {ontologyChainSummary.artifactCount} 份 artifact /{" "}
                          {ontologyChainSummary.evidenceCount} 則 evidence
                        </p>
                      </div>
                    </div>

                    <div className="detail-list" style={{ marginTop: "16px" }}>
                      <WorkspaceMaterialSection
                        title="關鍵工作物件"
                        description="這些是目前已進入工作鏈的核心 artifact。若沒有 artifact，不代表不能工作，但代表這輪仍偏 exploratory 或 provisional。"
                        items={evidenceWorkspaceLane.artifactCards}
                        emptyText="目前還沒有可直接瀏覽的 artifact；這輪工作鏈仍較依賴原始問題、背景或 source material。"
                      />
                      <WorkspaceMaterialSection
                        title="來源材料"
                        description="這些來源材料提供背景、引用內容與補充脈絡，是 Host 形成證據的主要材料基底。"
                        items={evidenceWorkspaceLane.sourceMaterialCards}
                        emptyText="目前還沒有可直接瀏覽的 source material。"
                      />
                      <WorkspaceMaterialSection
                        title="Evidence Lane"
                        description="這些 evidence 是目前最接近 recommendation / risk 判斷基礎的工作單元。若 support note 很薄，代表這輪還沒有完整 evidence-to-decision 鏈。"
                        items={evidenceWorkspaceLane.evidenceCards}
                        emptyText="目前還沒有形成可讀的 evidence lane。"
                      />
                    </div>

                    {evidenceWorkspaceLane.missingSignals.length > 0 ? (
                      <div className="detail-item" style={{ marginTop: "14px" }}>
                        <h3>目前工作鏈缺口</h3>
                        <ExpandableList
                          items={evidenceWorkspaceLane.missingSignals}
                          emptyText="目前沒有可顯示的工作鏈缺口。"
                          initialCount={5}
                        />
                      </div>
                    ) : null}
                  </>
                ) : (
                  <p className="empty-text">尚未形成可讀的工作物件 / 來源材料 / 證據工作面。</p>
                )}
              </DisclosurePanel>

              <section className="panel section-anchor" id="decision-context">
                <div className="panel-header">
                  <div>
                    <h2 className="panel-title">原始問題與決策問題</h2>
                    <p className="panel-copy">
                      先確認你原本問了什麼，以及系統理解這次到底要幫你做哪一個判斷。
                    </p>
                  </div>
                </div>

                {taskFraming && capabilityFrame ? (
                  <>
                    <div className="summary-grid">
                      <div className="section-card">
                        <h4>原始問題</h4>
                        <ExpandableText
                          text={originalProblem}
                          emptyText="尚未提供可供分析的原始問題。"
                          previewChars={240}
                        />
                      </div>
                      <div className="section-card">
                        <h4>決策問題</h4>
                        <ExpandableText
                          text={taskFraming.decisionContextSummary}
                          emptyText="尚未整理本輪決策問題。"
                          previewChars={200}
                        />
                      </div>
                      <div className="section-card">
                        <h4>這次要幫你做什麼判斷</h4>
                        <ExpandableText
                          text={capabilityFrame.judgmentToMake}
                          emptyText="尚未明確整理本輪判斷目標。"
                          previewChars={200}
                        />
                      </div>
                      <div className="section-card">
                        <h4>這次分析重點</h4>
                        <ExpandableText
                          text={taskFraming.analysisFocus}
                          emptyText="尚未整理本輪分析重點。"
                          previewChars={200}
                        />
                      </div>
                    </div>
                    {decisionBriefView ? (
                      <div className="section-card" id="task-decision-brief">
                        <h3>{decisionBriefView.railEyebrow}</h3>
                        <p className="content-block">{decisionBriefView.summary}</p>
                        <ul className="list-content">
                          {decisionBriefView.checklist.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                        <p className="muted-text">{decisionBriefView.boundaryNote}</p>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <p className="empty-text">尚未形成可讀的任務 framing。</p>
                )}
              </section>

              <DisclosurePanel
                id="capability-frame"
                title="分析框架、代理與模組包"
                description="這些是系統如何決定這輪要怎麼跑的治理資訊。需要核對 routing / packs / agents 時再展開。"
              >
                <div className="panel-header">
                  <div>
                    <h3 className="panel-title">這輪分析框架</h3>
                    <p className="panel-copy">
                      這裡對齊 Host 已採用的 capability frame，確認這輪是用什麼顧問能力原型、資料優先順序與執行方式在推進。
                    </p>
                  </div>
                </div>

                {capabilityFrame ? (
                  <>
                    <div className="summary-grid">
                      <div className="section-card">
                        <h4>顧問工作類型</h4>
                        <p className="content-block">{capabilityFrame.label}</p>
                      </div>
                      <div className="section-card">
                        <h4>執行方式</h4>
                        <p className="content-block">{labelForFlowMode(capabilityFrame.executionMode)}</p>
                      </div>
                      <div className="section-card">
                        <h4>工作框架摘要</h4>
                        <ExpandableText
                          text={capabilityFrame.framingSummary}
                          emptyText="尚未形成可讀的分析框架。"
                          previewChars={180}
                        />
                      </div>
                      <div className="section-card">
                        <h4>優先資料</h4>
                        <ExpandableList
                          items={capabilityFrame.prioritySources}
                          emptyText="尚未整理這輪優先資料。"
                        />
                      </div>
                      {capabilityFrame.selectedDomainPacks.length > 0 ? (
                        <div className="section-card">
                          <h4>問題面向模組包</h4>
                          <ExpandableList
                            items={capabilityFrame.selectedDomainPacks}
                            emptyText="這輪目前沒有選到問題面向模組包。"
                          />
                        </div>
                      ) : null}
                      {capabilityFrame.selectedIndustryPacks.length > 0 ? (
                        <div className="section-card">
                          <h4>產業模組包</h4>
                          <ExpandableList
                            items={capabilityFrame.selectedIndustryPacks}
                            emptyText="這輪目前沒有選到產業模組包。"
                          />
                        </div>
                      ) : null}
                    </div>

                    {capabilityFrame.routingRationale.length > 0 ? (
                      <div className="detail-item" style={{ marginTop: "14px" }}>
                        <h3>路由理由</h3>
                        <ExpandableList
                          items={capabilityFrame.routingRationale}
                          emptyText="目前沒有可顯示的路由說明。"
                        />
                      </div>
                    ) : null}

                    {packSelection && packSelection.resolverNotes.length > 0 ? (
                      <div className="detail-item" style={{ marginTop: "14px" }}>
                        <h3>模組包解析註記</h3>
                        <ExpandableList
                          items={packSelection.resolverNotes}
                          emptyText="目前沒有可顯示的模組包解析註記。"
                        />
                      </div>
                    ) : null}

                    {packSelection &&
                    (packSelection.readyInterfaceIds.length > 0 ||
                      packSelection.readyRuleBindingIds.length > 0 ||
                      packSelection.decisionContextPatterns.length > 0) ? (
                      <div className="detail-item" style={{ marginTop: "14px" }}>
                        <h3>模組合約摘要</h3>
                        <p className="muted-text">
                          目前狀態：{labelForPackContractStatus(packSelection.contractStatus)}
                        </p>
                        {packSelection.readyInterfaceIds.length > 0 ? (
                          <div style={{ marginTop: "10px" }}>
                            <h4>已啟用的正式 interface</h4>
                            <ExpandableList
                              items={packSelection.readyInterfaceIds.map((item) =>
                                labelForPackContractInterface(item),
                              )}
                              emptyText="目前沒有正式 interface。"
                            />
                          </div>
                        ) : null}
                        {packSelection.readyRuleBindingIds.length > 0 ? (
                          <div style={{ marginTop: "10px" }}>
                            <h4>已啟用的 rule binding</h4>
                            <ExpandableList
                              items={packSelection.readyRuleBindingIds.map((item) =>
                                labelForPackRuleBinding(item),
                              )}
                              emptyText="目前沒有可顯示的 rule binding。"
                            />
                          </div>
                        ) : null}
                        {packSelection.decisionContextPatterns.length > 0 ? (
                          <div style={{ marginTop: "10px" }}>
                            <h4>這輪判斷 framing hints</h4>
                            <ExpandableList
                              items={packSelection.decisionContextPatterns}
                              emptyText="目前沒有可顯示的判斷 hints。"
                            />
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    {capabilityFrame.packDeliverablePresets.length > 0 ? (
                      <div className="detail-item" style={{ marginTop: "14px" }}>
                        <h3>模組包交付傾向</h3>
                        <ExpandableList
                          items={capabilityFrame.packDeliverablePresets}
                          emptyText="目前沒有可顯示的模組包交付傾向。"
                        />
                      </div>
                    ) : null}

                    {packSelection && packSelection.domainPackCards.length > 0 ? (
                      <div className="detail-item" style={{ marginTop: "14px" }}>
                        <h3>問題面向模組包脈絡</h3>
                        <div className="detail-list">
                          {packSelection.domainPackCards.map((pack) => (
                            <div className="detail-item" key={pack.packName}>
                              <h3>{pack.packName}</h3>
                              <ExpandableText
                                text={`${pack.definition}${pack.reason ? `\n\n選擇原因：${pack.reason}` : ""}`}
                                emptyText="目前沒有可顯示的模組包說明。"
                                previewChars={220}
                              />
                              {pack.problemPatterns.length > 0 ? (
                                <div style={{ marginTop: "10px" }}>
                                  <h4>常見企業問題型態</h4>
                                  <ExpandableList
                                    items={pack.problemPatterns}
                                    emptyText="目前沒有可顯示的問題型態。"
                                    initialCount={4}
                                  />
                                </div>
                              ) : null}
                              {pack.keySignals.length > 0 ? (
                                <div style={{ marginTop: "10px" }}>
                                  <h4>關鍵 KPI / 經營訊號</h4>
                                  <ExpandableList
                                    items={pack.keySignals}
                                    emptyText="目前沒有可顯示的關鍵指標。"
                                    initialCount={4}
                                  />
                                </div>
                              ) : null}
                              {pack.boundaries.length > 0 ? (
                                <div style={{ marginTop: "10px" }}>
                                  <h4>模組包邊界</h4>
                                  <ExpandableList
                                    items={pack.boundaries}
                                    emptyText="目前沒有可顯示的邊界說明。"
                                    initialCount={3}
                                  />
                                </div>
                              ) : null}
                              {pack.rationale.length > 0 ? (
                                <div style={{ marginTop: "10px" }}>
                                  <h4>治理理由</h4>
                                  <ExpandableList
                                    items={pack.rationale}
                                    emptyText="目前沒有額外治理理由。"
                                    initialCount={4}
                                  />
                                </div>
                              ) : null}
                              {pack.packNotes.length > 0 ? (
                                <div style={{ marginTop: "10px" }}>
                                  <h4>模組包備註</h4>
                                  <ExpandableList
                                    items={pack.packNotes}
                                    emptyText="目前沒有額外模組包備註。"
                                    initialCount={3}
                                  />
                                </div>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {packSelection && packSelection.industryPackCards.length > 0 ? (
                      <div className="detail-item" style={{ marginTop: "14px" }}>
                        <h3>產業模組包脈絡</h3>
                        <div className="detail-list">
                          {packSelection.industryPackCards.map((pack) => (
                            <div className="detail-item" key={pack.packName}>
                              <h3>{pack.packName}</h3>
                              <ExpandableText
                                text={`${pack.definition}${pack.reason ? `\n\n選擇原因：${pack.reason}` : ""}`}
                                emptyText="目前沒有可顯示的模組包說明。"
                                previewChars={220}
                              />
                              {pack.businessModels.length > 0 ? (
                                <div style={{ marginTop: "10px" }}>
                                  <h4>常見商業模式</h4>
                                  <ExpandableList
                                    items={pack.businessModels}
                                    emptyText="目前沒有可顯示的商業模式。"
                                    initialCount={4}
                                  />
                                </div>
                              ) : null}
                              {pack.decisionPatterns.length > 0 ? (
                                <div style={{ marginTop: "10px" }}>
                                  <h4>常見判斷模式</h4>
                                  <ExpandableList
                                    items={pack.decisionPatterns}
                                    emptyText="目前沒有可顯示的判斷模式。"
                                    initialCount={4}
                                  />
                                </div>
                              ) : null}
                              {pack.packNotes.length > 0 ? (
                                <div style={{ marginTop: "10px" }}>
                                  <h4>模組包備註</h4>
                                  <ExpandableList
                                    items={pack.packNotes}
                                    emptyText="目前沒有額外模組包備註。"
                                    initialCount={3}
                                  />
                                </div>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {capabilityFrame.selectedAgents.length > 0 || capabilityFrame.hostAgent ? (
                      <div className="detail-item" style={{ marginTop: "14px" }}>
                        <h3>代理選用</h3>
                        <div className="detail-list">
                          <div className="detail-item">
                            <h4>主控代理</h4>
                            <p className="content-block">{labelForAgentId(capabilityFrame.hostAgent)}</p>
                          </div>
                          {capabilityFrame.selectedAgentDetails.length > 0 ? (
                            capabilityFrame.selectedAgentDetails.map((agent) => (
                              <div className="detail-item" key={agent.agentId}>
                                <div className="meta-row">
                                  <span className="pill">{agent.agentType}</span>
                                  {agent.runtimeBinding ? (
                                    <span>執行綁定：{labelForAgentId(agent.runtimeBinding)}</span>
                                  ) : null}
                                </div>
                                <h4>{agent.agentName}</h4>
                                <ExpandableText
                                  text={agent.reason}
                                  emptyText="目前沒有可顯示的選用理由。"
                                  previewChars={200}
                                />
                              </div>
                            ))
                          ) : (
                            <ExpandableList
                              items={capabilityFrame.selectedAgents}
                              emptyText="目前沒有可顯示的代理。"
                              translateAsAgentIds
                            />
                          )}
                        </div>
                      </div>
                    ) : null}

                    {capabilityFrame.agentSelectionRationale.length > 0 ? (
                      <div className="detail-item" style={{ marginTop: "14px" }}>
                        <h3>代理選用理由</h3>
                        <ExpandableList
                          items={capabilityFrame.agentSelectionRationale}
                          emptyText="目前沒有可顯示的代理選用理由。"
                        />
                      </div>
                    ) : null}

                    {capabilityFrame.agentResolverNotes.length > 0 ? (
                      <div className="detail-item" style={{ marginTop: "14px" }}>
                        <h3>代理解析註記</h3>
                        <ExpandableList
                          items={capabilityFrame.agentResolverNotes}
                          emptyText="目前沒有可顯示的代理解析註記。"
                        />
                      </div>
                    ) : null}

                    {capabilityFrame.omittedAgentNotes.length > 0 ? (
                      <div className="detail-item" style={{ marginTop: "14px" }}>
                        <h3>本輪未啟用的相關代理</h3>
                        <ExpandableList
                          items={capabilityFrame.omittedAgentNotes}
                          emptyText="目前沒有可顯示的未啟用代理說明。"
                        />
                      </div>
                    ) : null}

                    {capabilityFrame.deferredAgentNotes.length > 0 ? (
                      <div className="detail-item" style={{ marginTop: "14px" }}>
                        <h3>本輪延後啟用的代理</h3>
                        <ExpandableList
                          items={capabilityFrame.deferredAgentNotes}
                          emptyText="目前沒有可顯示的延後啟用代理說明。"
                        />
                      </div>
                    ) : null}

                    {capabilityFrame.escalationNotes.length > 0 ? (
                      <div className="detail-item" style={{ marginTop: "14px" }}>
                        <h3>本輪升級提示</h3>
                        <ExpandableList
                          items={capabilityFrame.escalationNotes}
                          emptyText="目前沒有可顯示的升級提示。"
                        />
                      </div>
                    ) : null}

                    {capabilityFrame.runtimeAgents.length > 0 ? (
                      <div className="detail-item" style={{ marginTop: "14px" }}>
                        <h3>目前實際參與的代理</h3>
                        <ExpandableList
                          items={capabilityFrame.runtimeAgents}
                          emptyText="目前沒有可顯示的實際參與代理。"
                          translateAsAgentIds
                        />
                      </div>
                    ) : null}

                    {capabilityFrame.selectedSupportingAgents.length > 0 ? (
                      <div className="detail-item" style={{ marginTop: "14px" }}>
                        <h3>支援代理</h3>
                        <ExpandableList
                          items={capabilityFrame.selectedSupportingAgents}
                          emptyText="目前沒有額外支援代理。"
                          translateAsAgentIds
                        />
                      </div>
                    ) : null}
                  </>
                ) : null}
              </DisclosurePanel>

              <section className="panel section-anchor" id="readiness-governance">
                <div className="panel-header">
                  <div>
                    <h2 className="panel-title">判斷可信度與資料缺口</h2>
                    <p className="panel-copy">這裡只回答這輪目前站不站得住，以及最大的缺口在哪裡。</p>
                  </div>
                  {readinessGovernance ? (
                    <span className={`status-badge status-${readinessGovernance.level}`}>
                      {readinessGovernance.label}
                    </span>
                  ) : null}
                </div>

                {readinessGovernance ? (
                  <>
                    <div className="summary-grid">
                      <div className="section-card">
                        <h4>決策問題清晰度</h4>
                        <p className="content-block">{readinessGovernance.decisionContextStatus}</p>
                      </div>
                      <div className="section-card">
                        <h4>問題面向成立度</h4>
                        <p className="content-block">{readinessGovernance.domainStatus}</p>
                      </div>
                      <div className="section-card">
                        <h4>工作物件 / 來源材料覆蓋度</h4>
                        <p className="content-block">{readinessGovernance.artifactStatus}</p>
                      </div>
                      <div className="section-card">
                        <h4>證據覆蓋度</h4>
                        <p className="content-block">{readinessGovernance.evidenceStatus}</p>
                      </div>
                    </div>

                    {readinessGovernance.missingInformation.length > 0 ? (
                      <div className="detail-item" style={{ marginTop: "14px" }}>
                        <h3>目前缺少的關鍵資料</h3>
                        <ExpandableList
                          items={readinessGovernance.missingInformation}
                          emptyText="目前沒有額外缺漏資訊。"
                        />
                      </div>
                    ) : null}

                    <div className="summary-grid" style={{ marginTop: "14px" }}>
                      <div className="section-card">
                        <h4>目前可支撐的交付層級</h4>
                        <ExpandableText
                          text={
                            sparseInputOperatingView
                              ? `${sparseInputOperatingView.deliverableClassLabel}。${sparseInputOperatingView.deliverableGuidance}`
                              : ""
                          }
                          emptyText="尚未整理本輪可支撐的交付層級。"
                          previewChars={220}
                        />
                      </div>
                      <div className="section-card">
                        <h4>對目前結論的影響</h4>
                        <ExpandableText
                          text={readinessGovernance.conclusionImpact}
                          emptyText="尚未整理結論影響。"
                          previewChars={180}
                        />
                      </div>
                      <div className="section-card">
                        <h4>限制與假設訊號</h4>
                        <p className="content-block">
                          {readinessGovernance.constraintSignal}
                          {"\n"}
                          {readinessGovernance.assumptionSignal}
                        </p>
                      </div>
                      {readinessGovernance.packEvidenceExpectations.length > 0 ? (
                        <div className="section-card">
                          <h4>模組包證據期待</h4>
                          <ExpandableList
                            items={readinessGovernance.packEvidenceExpectations}
                            emptyText="目前沒有額外的模組包證據期待。"
                            initialCount={4}
                          />
                        </div>
                      ) : null}
                      {packSelection && packSelection.keyKpis.length > 0 ? (
                        <div className="section-card">
                          <h4>模組包關鍵指標</h4>
                          <ExpandableList
                            items={packSelection.keyKpis}
                            emptyText="目前沒有額外的 pack 關鍵指標。"
                            initialCount={4}
                          />
                        </div>
                      ) : null}
                      {packSelection && packSelection.commonRisks.length > 0 ? (
                        <div className="section-card">
                          <h4>模組包常見風險</h4>
                          <ExpandableList
                            items={packSelection.commonRisks}
                            emptyText="目前沒有額外的 pack 常見風險。"
                            initialCount={4}
                          />
                        </div>
                      ) : null}
                      {sparseInputOperatingView?.externalResearchHeavy ? (
                        <div className="section-card">
                          <h4>外部事件導向提醒</h4>
                          <ExpandableText
                            text="這輪屬於外部研究導向的稀疏輸入案件。系統會優先形成外部態勢判斷與待驗證事項，避免假裝已具備公司內部確定性。"
                            emptyText="目前沒有額外提醒。"
                            previewChars={220}
                          />
                        </div>
                      ) : null}
                      {readinessGovernance.researchDepthRecommendation ? (
                        <div className="section-card">
                          <h4>調研委派建議</h4>
                          <ExpandableText
                            text={[
                              `Host 建議這輪至少採用 ${labelForResearchDepth(readinessGovernance.researchDepthRecommendation)}。`,
                              readinessGovernance.researchHandoffTarget
                                ? `研究結果完成後，應先交回 ${labelForAgentName(readinessGovernance.researchHandoffTarget)} 收斂。`
                                : "",
                            ]
                              .filter(Boolean)
                              .join(" ")}
                            emptyText="目前沒有額外的調研委派建議。"
                            previewChars={220}
                          />
                        </div>
                      ) : null}
                      {readinessGovernance.researchStopCondition ? (
                        <div className="section-card">
                          <h4>調研停止條件</h4>
                          <ExpandableText
                            text={readinessGovernance.researchStopCondition}
                            emptyText="目前沒有額外的調研停止條件。"
                            previewChars={220}
                          />
                        </div>
                      ) : null}
                    </div>

                    {readinessGovernance.packHighImpactGaps.length > 0 ? (
                      <div className="detail-item" style={{ marginTop: "14px" }}>
                        <h3>模組包感知的高影響缺口</h3>
                        <ExpandableList
                          items={readinessGovernance.packHighImpactGaps}
                          emptyText="目前沒有額外的模組包高影響缺口。"
                        />
                      </div>
                    ) : null}

                    {readinessGovernance.researchDelegationNotes.length > 0 ? (
                      <div className="detail-item" style={{ marginTop: "14px" }}>
                        <h3>調研委派備註</h3>
                        <ExpandableList
                          items={readinessGovernance.researchDelegationNotes}
                          emptyText="目前沒有額外的調研委派備註。"
                        />
                      </div>
                    ) : null}

                    {readinessGovernance.agentSelectionImplications.length > 0 ? (
                      <div className="detail-item" style={{ marginTop: "14px" }}>
                        <h3>代理協調對交付物的影響</h3>
                        <ExpandableList
                          items={readinessGovernance.agentSelectionImplications}
                          emptyText="目前沒有額外的代理協調影響說明。"
                        />
                      </div>
                    ) : null}

                    {readinessGovernance.level === "degraded" ? (
                      <p className="error-text">
                        目前若直接執行，系統可能會產出帶有明確缺漏註記的降級結果。
                      </p>
                    ) : null}
                  </>
                ) : null}

                <div
                  className="panel-header"
                  id="run-panel"
                  style={{ marginTop: "18px", marginBottom: 0 }}
                >
                  <div>
                    <h3 className="panel-title">{runMeta?.title ?? "執行任務流程"}</h3>
                    <p className="panel-copy">{runMeta?.copy}</p>
                  </div>
                  <button
                    className="button-primary"
                    type="button"
                    onClick={handleRun}
                    disabled={running}
                  >
                    {running ? runMeta?.buttonRunning ?? "執行中..." : runMeta?.buttonIdle}
                  </button>
                </div>
              </section>

              <section className="panel section-anchor" id="deliverable-surface">
                <div className="panel-header">
                  <div>
                    <h2 className="panel-title">正式交付結果</h2>
                    <p className="panel-copy">若結果已形成，這裡就是最接近正式顧問交付物的主閱讀主線。</p>
                  </div>
                  {latestDeliverable ? (
                    <Link className="button-secondary" href={`/deliverables/${latestDeliverable.id}`}>
                      打開交付物工作面
                    </Link>
                  ) : null}
                </div>
                <div className="section-list">
                  {deliverableBacklink ? (
                    <div className="summary-grid">
                      <div className="section-card">
                        <h4>交付物掛載位置</h4>
                        <ExpandableText
                          text={deliverableBacklink.workspacePath}
                          emptyText="尚未整理這份交付物掛載的工作鏈位置。"
                          previewChars={180}
                        />
                      </div>
                      <div className="section-card">
                        <h4>對應決策問題</h4>
                        <ExpandableText
                          text={deliverableBacklink.decisionContext}
                          emptyText="尚未整理這份交付物的決策問題。"
                          previewChars={180}
                        />
                      </div>
                      <div className="section-card">
                        <h4>依據來源</h4>
                        <ExpandableText
                          text={deliverableBacklink.evidenceBasis}
                          emptyText="尚未整理這份交付物的依據來源。"
                          previewChars={180}
                        />
                      </div>
                      <div className="section-card">
                        <h4>寫回的決策鏈</h4>
                        <ExpandableList
                          items={deliverableBacklink.linkedOutputs}
                          emptyText="尚未整理這份交付物寫回的決策鏈。"
                        />
                      </div>
                    </div>
                  ) : null}

                  {deliverableBacklink ? (
                    <div className="section-card">
                      <h4>交付物回鏈摘要</h4>
                      <ExpandableText
                        text={deliverableBacklink.summary}
                        emptyText="尚未整理這份交付物如何掛回 ontology chain。"
                        previewChars={240}
                      />
                    </div>
                  ) : null}

                  {decisionSnapshot ? (
                    <div className="snapshot-grid">
                      <div className="section-card">
                        <h4>{decisionSnapshot.conclusionLabel}</h4>
                        <ExpandableText
                          text={decisionSnapshot.conclusion}
                          emptyText="尚未產生一句話結論。"
                          previewChars={180}
                        />
                      </div>
                      <div className="section-card">
                        <h4>{decisionSnapshot.recommendationLabel}</h4>
                        <ExpandableText
                          text={decisionSnapshot.primaryRecommendation}
                          emptyText="尚未產生最重要建議。"
                          previewChars={180}
                        />
                      </div>
                      <div className="section-card">
                        <h4>{decisionSnapshot.riskLabel}</h4>
                        <ExpandableText
                          text={decisionSnapshot.primaryRisk}
                          emptyText="尚未標記主要風險。"
                          previewChars={180}
                        />
                      </div>
                      <div className="section-card">
                        <h4>{decisionSnapshot.missingDataLabel}</h4>
                        <ExpandableText
                          text={decisionSnapshot.missingDataStatus}
                          emptyText="目前沒有重大缺漏資料狀態。"
                          previewChars={180}
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="empty-text">尚未產生 Decision Snapshot。</p>
                  )}

                  <div className="summary-grid">
                    <div className="section-card">
                      <h4>執行摘要</h4>
                      <ExpandableText
                        text={executiveSummary?.summary ?? ""}
                        emptyText="尚未產出可供決策閱讀的執行摘要。"
                        previewChars={240}
                      />
                    </div>
                    <div className="section-card">
                      <h4>核心判斷</h4>
                      <ExpandableText
                        text={executiveSummary?.coreJudgment ?? ""}
                        emptyText="尚未產出可供顧問式討論的核心判斷。"
                        previewChars={240}
                      />
                    </div>
                  </div>

                  {executiveSummary?.bullets.length ? (
                    <div className="section-card">
                      <h4>摘要重點</h4>
                      <ExpandableList
                        items={executiveSummary.bullets}
                        emptyText="尚未整理出可供快速閱讀的摘要重點。"
                      />
                    </div>
                  ) : null}
                </div>
              </section>

              <DisclosurePanel
                title="交付細節與場景延伸"
                description="如果你已經看完上方正式交付結果，只有在你要細讀建議卡、風險卡、行動項與場景專業區塊時，再展開。"
              >
              <section className="panel">
                <h2 className="section-title">主要建議</h2>
                <p className="muted-text">
                  用很輕的方式標記這則建議目前是否可直接採用、需改寫、目前不採用，或值得當範本。
                </p>
                {recommendationFeedbackMessage ? (
                  <p className="success-text" role="status" aria-live="polite">
                    {recommendationFeedbackMessage}
                  </p>
                ) : null}
                {recommendationCandidateMessage ? (
                  <p className="success-text" role="status" aria-live="polite">
                    {recommendationCandidateMessage}
                  </p>
                ) : null}
                <div className="detail-list">
                  {sortedRecommendations.length > 0 ? (
                    sortedRecommendations.slice(0, 3).map((recommendation, index) => {
                      const precedentCandidateView = buildPrecedentCandidateView(
                        recommendation.precedent_candidate,
                      );
                      const precedentCandidateActions = recommendation.precedent_candidate
                        ? buildPrecedentCandidateActionView(recommendation.precedent_candidate)
                        : null;
                      const expectedEffect =
                        recommendationCards[index]?.expectedEffect || "可讓下一輪判斷與執行更具可操作性。";
                      return (
                      <div className="detail-item" key={recommendation.id}>
                        <div className="meta-row">
                          <span className="pill">{labelForPriority(recommendation.priority)}</span>
                          <span>
                            {recommendation.adoption_feedback
                              ? labelForAdoptionFeedbackStatus(
                                  recommendation.adoption_feedback.feedback_status,
                                )
                              : "尚未提供回饋"}
                          </span>
                        </div>
                        <h3>{recommendation.summary}</h3>
                        <ExpandableText
                          text={recommendation.rationale}
                          emptyText="目前沒有額外建議說明。"
                        />
                        <p className="muted-text">預期效果：{expectedEffect}</p>
                        {precedentCandidateView.shouldShow ? (
                          <div className="section-card" style={{ marginTop: "12px" }}>
                            <h4>{precedentCandidateView.badgeLabel}</h4>
                            <p className="muted-text">目前狀態：{precedentCandidateView.statusLabel}</p>
                            <p className="muted-text">{precedentCandidateView.summary}</p>
                            {precedentCandidateView.attributionSummary ? (
                              <p className="muted-text">{precedentCandidateView.attributionSummary}</p>
                            ) : null}
                            {precedentCandidateActions ? (
                              <div className="button-row" style={{ marginTop: "10px" }}>
                                {precedentCandidateActions.actions.map((action) => (
                                  <button
                                    key={`${recommendation.id}-candidate-${action.nextStatus}`}
                                    className="button-secondary"
                                    type="button"
                                    disabled={candidateRecommendationId === recommendation.id}
                                    onClick={() =>
                                      void handleRecommendationCandidateStatus(
                                        recommendation.id,
                                        action.nextStatus,
                                      )
                                    }
                                  >
                                    {candidateRecommendationId === recommendation.id
                                      ? "處理中..."
                                      : action.label}
                                  </button>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                        <div style={{ marginTop: "12px" }}>
                          <DeferredAdoptionFeedbackControls
                            surface="recommendation"
                            feedback={recommendation.adoption_feedback}
                            description="先快速標記這則建議是否真的可用；若再補一個主要原因，系統會更知道這條建議為什麼值得保留。"
                            instanceId={`recommendation-${recommendation.id}`}
                            isSubmitting={feedbackRecommendationId === recommendation.id}
                            message={null}
                            onApply={(payload) =>
                              handleRecommendationFeedback(recommendation.id, payload)
                            }
                          />
                        </div>
                      </div>
                    )})
                  ) : (
                    <p className="empty-text">尚未記錄任何建議。</p>
                  )}
                </div>
              </section>

              <section className="panel">
                <h2 className="section-title">主要風險與取捨</h2>
                <div className="detail-list">
                  {riskCards.length > 0 ? (
                    riskCards.slice(0, 3).map((risk, index) => (
                      <div className="detail-item" key={`${risk.content}-${index}`}>
                        <div className="meta-row">
                          <span className="pill">{labelForImpactLevel(risk.severity)}</span>
                          <span>{labelForLikelihoodLevel(risk.likelihood)}</span>
                        </div>
                        <h3>{risk.content}</h3>
                        <ExpandableText
                          text={risk.impactExplanation}
                          emptyText="目前沒有額外風險說明。"
                        />
                      </div>
                    ))
                  ) : (
                    <p className="empty-text">尚未記錄任何風險。</p>
                  )}
                </div>
              </section>

              <section className="panel">
                <h2 className="section-title">行動項目</h2>
                <div className="detail-list">
                  {actionItemCards.length > 0 ? (
                    actionItemCards.slice(0, 4).map((actionItem, index) => (
                      <div className="detail-item" key={`${actionItem.content}-${index}`}>
                        <div className="meta-row">
                          <span className="pill">{labelForPriority(actionItem.priority)}</span>
                        </div>
                        <h3>{actionItem.content}</h3>
                        <p className="muted-text">建議責任角色：{actionItem.ownerRole}</p>
                        <p className="muted-text">建議時序：{actionItem.sequence}</p>
                        {actionItem.dependencies.length > 0 ? (
                          <div style={{ marginTop: "10px" }}>
                            <h3 style={{ fontSize: "0.98rem" }}>前置依賴</h3>
                            <ExpandableList
                              items={actionItem.dependencies}
                              emptyText="目前沒有額外前置依賴。"
                              initialCount={3}
                            />
                          </div>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <p className="empty-text">尚未記錄任何行動項目。</p>
                  )}
                </div>
              </section>

              <section className="panel">
                <h2 className="section-title">缺漏資訊</h2>
                <div className="detail-item">
                  <ExpandableList
                    items={latestMissingInformation}
                    emptyText="最新交付物目前沒有明確標記缺漏資訊。"
                  />
                </div>
              </section>

              {visibleModeSpecificSections.length > 0 ? (
                <div className="workspace-section-intro">
                  <h2 className="section-title">場景專業區塊</h2>
                  <p className="panel-copy">
                    以下內容只補這個 workflow mode 的專業重點，用來承接場景差異，不改變上面的共通決策骨架。
                  </p>
                </div>
              ) : null}

              {visibleModeSpecificSections.map((section) => (
                <ModeSectionList
                  key={section.title}
                  title={section.title}
                  description={section.description}
                  items={section.items}
                  emptyText={section.emptyText}
                  translateAsAgentIds={section.translateAsAgentIds}
                />
              ))}
              </DisclosurePanel>
            </div>

            <div className="detail-stack">
              <DisclosurePanel
                id="extension-manager"
                title="擴充管理面"
                description="這裡承接本次任務的模組包 / 代理覆寫與目錄查看。主線閱讀先看左側決策內容，需要調整 extension 時再展開。"
              >
                <div className="panel-header">
                  <div>
                    <h3 className="panel-title">任務層級擴充管理</h3>
                    <p className="panel-copy">
                      你可以查看這輪選用的擴充，並對單一任務覆寫模組包或代理提示。
                    </p>
                  </div>
                  <div className="button-row">
                    <Link className="button-secondary" href="/agents">
                      代理管理
                    </Link>
                    <Link className="button-secondary" href="/packs">
                      模組包管理
                    </Link>
                  </div>
                </div>
                <DeferredExtensionManagerSurface
                  snapshot={extensionManager}
                  loading={extensionLoading}
                  error={extensionError}
                  task={task}
                  saving={savingOverrides}
                  onSaveOverrides={handleSaveOverrides}
                />
              </DisclosurePanel>

              <DisclosurePanel
                title="補充脈絡"
                description="只有在你要回看物件鏈摘要或再次核對決策問題時，再展開這層補充脈絡。"
              >
                {ontologyChainSummary ? (
                  <div className="summary-grid">
                    <div className="section-card">
                      <h4>決策問題</h4>
                      <ExpandableText
                        text={ontologyChainSummary.decisionContext}
                        emptyText="尚未形成可讀的決策問題。"
                        previewChars={160}
                      />
                    </div>
                    <div className="section-card">
                      <h4>物件鏈摘要</h4>
                      <p className="content-block">
                        {ontologyChainSummary.artifactCount} artifact /{" "}
                        {ontologyChainSummary.sourceMaterialCount} source material /{" "}
                        {ontologyChainSummary.evidenceCount} evidence
                        {"\n"}
                        {ontologyChainSummary.recommendationCount} recommendation /{" "}
                        {ontologyChainSummary.riskCount} risk /{" "}
                        {ontologyChainSummary.actionItemCount} action item
                      </p>
                    </div>
                  </div>
                ) : null}
              </DisclosurePanel>

              {latestDeliverable ? (
                <DisclosurePanel
                  title="完整交付物"
                  description="查看這次 structured deliverable 的完整欄位與原始內容。"
                >
                  <div className="section-list">
                    <div className="detail-item">
                      <h3>{latestDeliverable.title}</h3>
                      <div className="meta-row">
                        <span>版本 {latestDeliverable.version}</span>
                        <span>{formatDisplayDate(latestDeliverable.generated_at)}</span>
                      </div>
                      <Link className="back-link" href={`/deliverables/${latestDeliverable.id}`}>
                        進入正式交付物工作面
                      </Link>
                    </div>
                    {Object.entries(latestDeliverable.content_structure).map(([label, value]) =>
                      renderStructuredValue(label, value),
                    )}
                  </div>
                </DisclosurePanel>
              ) : null}

              {task.evidence.length > 0 ? (
                <DisclosurePanel
                  title="證據與補充資料"
                  description="查看本輪分析依賴的證據、來源摘錄與可支持結論的補充內容。"
                >
                  <div className="detail-list">
                    {task.evidence.map((evidence) => (
                      <div className="detail-item" key={evidence.id}>
                        <div className="meta-row">
                          <span className="pill">{labelForEvidenceType(evidence.evidence_type)}</span>
                          <span>{labelForSourceType(evidence.source_type)}</span>
                        </div>
                        <h3>{evidence.title}</h3>
                        <ExpandableText
                          text={evidence.excerpt_or_summary}
                          emptyText="這筆證據目前沒有可顯示的內容摘要。"
                          previewChars={240}
                        />
                        <TaskRetrievalProvenance provenance={evidence.retrieval_provenance} />
                      </div>
                    ))}
                  </div>
                </DisclosurePanel>
              ) : null}

              {hasBackgroundSupport ? (
                <DisclosurePanel
                  title="任務背景與補充脈絡"
                  description="回看你當時提供的背景、目標、限制與其他補充說明。"
                >
                  <div className="detail-list">
                    <div className="detail-item">
                      <h3>分析對象</h3>
                      {task.subjects.length > 0 ? (
                        <ul className="list-content">
                          {task.subjects.map((subject) => (
                            <li key={subject.id}>
                              {subject.name}
                              {subject.description ? `：${subject.description}` : ""}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="muted-text">尚未設定分析對象。</p>
                      )}
                    </div>
                    <div className="detail-item">
                      <h3>交付目標</h3>
                      {task.goals.length > 0 ? (
                        <ul className="list-content">
                          {task.goals.map((goal) => (
                            <li key={goal.id}>{goal.description}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="muted-text">尚未設定明確交付目標。</p>
                      )}
                    </div>
                    <div className="detail-item">
                      <h3>成功標準 / 判斷標準</h3>
                      <ExpandableList items={successCriteria} emptyText="尚未設定明確成功標準。" />
                    </div>
                    <div className="detail-item">
                      <h3>已有資料</h3>
                      <ExpandableText
                        text={latestContext?.notes || ""}
                        emptyText="尚未整理目前已掌握資料。"
                      />
                    </div>
                    <div className="detail-item">
                      <h3>缺少資料 / 待確認假設</h3>
                      <ExpandableText
                        text={latestContext?.assumptions || ""}
                        emptyText="尚未列出待補資料或待確認假設。"
                      />
                    </div>
                    <div className="detail-item">
                      <h3>限制條件</h3>
                      {visibleConstraints.length > 0 ? (
                        <ul className="list-content">
                          {visibleConstraints.map((constraint) => (
                            <li key={constraint.id}>{constraint.description}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="muted-text">尚未新增明確限制條件。</p>
                      )}
                    </div>
                    <div className="detail-item">
                      <h3>背景脈絡</h3>
                      <ExpandableText
                        text={parsedAppendix.backgroundText || ""}
                        emptyText="尚未提供手動背景文字。"
                        previewChars={260}
                      />
                    </div>
                    {modeSpecificEntries.length > 0 ? (
                      <div className="detail-item">
                        <h3>{workflowDefinition?.title ?? "流程補充設定"}</h3>
                        <ul className="list-content">
                          {modeSpecificEntries.map((entry) => (
                            <li key={entry.label}>
                              {entry.label}：{entry.value}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                </DisclosurePanel>
              ) : null}

              {shouldShowExternalDataContext && externalDataUsage ? (
                <DisclosurePanel
                  title="外部資料使用情況"
                  description="確認這輪判斷是否引用了外部來源，以及哪些結論依賴這些補充資料。"
                >
                  <div className="detail-list">
                    <div className="detail-item">
                      <h3>外部資料使用方式</h3>
                      <p className="content-block">
                        {labelForExternalDataStrategy(task.external_data_strategy)}
                      </p>
                    </div>
                    <div className="detail-item">
                      <h3>是否使用外部搜尋</h3>
                      <p className="content-block">
                        {externalDataUsage.searchUsed
                          ? "有，Host 已補充外部搜尋來源。"
                          : "沒有，本輪未使用 Host 外部搜尋。"}
                      </p>
                    </div>
                    {(externalDataUsage.delegationStatus || externalDataUsage.delegationReason) ? (
                      <div className="detail-item">
                        <h3>調研委派狀態</h3>
                        <ExpandableText
                          text={[
                            externalDataUsage.delegationStatus
                              ? labelForResearchDelegationStatus(externalDataUsage.delegationStatus)
                              : "",
                            externalDataUsage.delegatedAgentId
                              ? `主要委派對象：${labelForAgentId(externalDataUsage.delegatedAgentId)}。`
                              : "",
                            externalDataUsage.delegationReason,
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          emptyText="目前沒有額外的調研委派說明。"
                          previewChars={220}
                        />
                      </div>
                    ) : null}
                    {(externalDataUsage.researchDepth ||
                      externalDataUsage.sourceQualitySummary ||
                      externalDataUsage.citationHandoffSummary) ? (
                      <div className="detail-item">
                        <h3>調研深度與交接摘要</h3>
                        <ExpandableText
                          text={[
                            externalDataUsage.researchDepth
                              ? `這輪以 ${labelForResearchDepth(externalDataUsage.researchDepth)} 為主要研究深度。`
                              : "",
                            externalDataUsage.sourceQualitySummary
                              ? `來源品質：${externalDataUsage.sourceQualitySummary}`
                              : "",
                            externalDataUsage.citationHandoffSummary
                              ? `引用交接：${externalDataUsage.citationHandoffSummary}`
                              : "",
                            externalDataUsage.contradictionSummary
                              ? `矛盾訊號：${externalDataUsage.contradictionSummary}`
                              : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          emptyText="目前沒有額外的調研深度與交接摘要。"
                          previewChars={240}
                        />
                      </div>
                    ) : null}
                    {externalDataUsage.researchSubQuestions.length > 0 ? (
                      <div className="detail-item">
                        <h3>這輪調研主要回答哪些子問題</h3>
                        <ExpandableList
                          items={externalDataUsage.researchSubQuestions}
                          emptyText="目前沒有額外的調研子問題。"
                        />
                      </div>
                    ) : null}
                    {externalDataUsage.evidenceGapFocus.length > 0 ? (
                      <div className="detail-item">
                        <h3>本輪優先補的證據缺口</h3>
                        <ExpandableList
                          items={externalDataUsage.evidenceGapFocus}
                          emptyText="目前沒有額外的證據缺口補完焦點。"
                        />
                      </div>
                    ) : null}
                    <div className="detail-item">
                      <h3>使用了哪些來源</h3>
                      {externalDataUsage.sources.length > 0 ? (
                        <ul className="list-content">
                          {externalDataUsage.sources.map((source) => (
                            <li key={`${source.sourceType}-${source.url}-${source.title}`}>
                              {source.title}
                              {source.url ? `｜${source.url}` : ""}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="muted-text">目前沒有記錄可顯示的外部來源。</p>
                      )}
                    </div>
                    <div className="detail-item">
                      <h3>哪些分析依賴外部資料</h3>
                      <ExpandableText
                        text={externalDataUsage.dependencyNote}
                        emptyText="目前尚未記錄外部資料依賴說明。"
                      />
                    </div>
                    {externalDataUsage.delegationFindings.length > 0 ? (
                      <div className="detail-item">
                        <h3>調研回交重點</h3>
                        <ExpandableList
                          items={externalDataUsage.delegationFindings}
                          emptyText="目前沒有額外的調研回交重點。"
                        />
                      </div>
                    ) : null}
                    {externalDataUsage.delegationMissingInformation.length > 0 ? (
                      <div className="detail-item">
                        <h3>調研後仍保留的不確定性</h3>
                        <ExpandableList
                          items={externalDataUsage.delegationMissingInformation}
                          emptyText="目前沒有額外的不確定性。"
                        />
                      </div>
                    ) : null}
                  </div>
                </DisclosurePanel>
              ) : null}

              {hasSystemTrace ? (
                <DisclosurePanel
                  title="系統追蹤"
                  description="只有在你想檢查系統如何理解、協調與寫回這個任務時，再展開這一層。"
                >
                  <div className="detail-list">
                    <div className="detail-item">
                      <h3>世界模型 / 工作物件檢視</h3>
                      <p className="panel-copy" style={{ marginBottom: "16px" }}>
                        檢查共享工作模型目前承載了哪些工作物件與結果。
                      </p>
                      <div className="ontology-grid">
                      <div className="ontology-card">
                        <h3>客戶</h3>
                        <p className="content-block">
                          {task.client?.name || "尚未明確標示客戶"}
                          {"\n"}
                          {(task.client?.client_type || task.client_type || "未指定")}
                          {" / "}
                          {(task.client?.client_stage || task.client_stage || "未指定")}
                        </p>
                      </div>
                      <div className="ontology-card">
                        <h3>案件委託</h3>
                        <p className="content-block">
                          {task.engagement?.name || "尚未建立案件委託名稱"}
                          {task.engagement?.description ? `\n${task.engagement.description}` : ""}
                        </p>
                      </div>
                      <div className="ontology-card">
                        <h3>工作流</h3>
                        <p className="content-block">
                          {task.workstream?.name || "尚未建立工作流"}
                          {"\n"}
                          {task.domain_lenses.length > 0 ? task.domain_lenses.join(" / ") : "綜合"}
                        </p>
                      </div>
                      <div className="ontology-card">
                        <h3>決策問題</h3>
                        <ExpandableText
                          text={
                            task.decision_context?.judgment_to_make ||
                            task.decision_context?.summary ||
                            ""
                          }
                          emptyText="尚未形成可讀的決策問題。"
                          previewChars={180}
                        />
                      </div>
                      <div className="ontology-card">
                        <h3>任務</h3>
                        <p className="content-block">
                          {task.title}
                          {"\n"}
                          {labelForTaskType(task.task_type)} / {labelForFlowMode(task.mode)}
                        </p>
                      </div>
                      <div className="ontology-card">
                        <h3>分析對象</h3>
                        {task.subjects.length > 0 ? (
                          <ul className="list-content">
                            {task.subjects.map((subject) => (
                              <li key={subject.id}>{subject.name}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="muted-text">尚未設定。</p>
                        )}
                      </div>
                      <div className="ontology-card">
                        <h3>交付目標</h3>
                        {task.goals.length > 0 ? (
                          <ul className="list-content">
                            {task.goals.map((goal) => (
                              <li key={goal.id}>{goal.description}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="muted-text">尚未設定。</p>
                        )}
                      </div>
                      <div className="ontology-card">
                        <h3>限制條件</h3>
                        {visibleConstraints.length > 0 ? (
                          <ul className="list-content">
                            {visibleConstraints.map((constraint) => (
                              <li key={constraint.id}>{constraint.description}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="muted-text">尚未設定。</p>
                        )}
                      </div>
                      <div className="ontology-card">
                        <h3>來源材料</h3>
                        {task.source_materials.length > 0 ? (
                          <ul className="list-content">
                            {task.source_materials.slice(0, 5).map((sourceMaterial) => (
                              <li key={sourceMaterial.id}>{sourceMaterial.title}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="muted-text">尚未建立。</p>
                        )}
                      </div>
                      <div className="ontology-card">
                        <h3>工作物件</h3>
                        {task.artifacts.length > 0 ? (
                          <ul className="list-content">
                            {task.artifacts.slice(0, 5).map((artifact) => (
                              <li key={artifact.id}>{artifact.title}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="muted-text">尚未建立。</p>
                        )}
                      </div>
                      <div className="ontology-card">
                        <h3>證據</h3>
                        {task.evidence.length > 0 ? (
                          <ul className="list-content">
                            {task.evidence.slice(0, 5).map((evidence) => (
                              <li key={evidence.id}>{evidence.title}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="muted-text">尚未附加。</p>
                        )}
                      </div>
                      <div className="ontology-card">
                        <h3>發現 / 洞察</h3>
                        {task.insights.length > 0 || structuredFindings.length > 0 ? (
                          <ul className="list-content">
                            {(task.insights.length > 0
                              ? task.insights.map((item) => item.summary)
                              : structuredFindings
                            )
                              .slice(0, 5)
                              .map((item) => (
                                <li key={item}>{item}</li>
                              ))}
                          </ul>
                        ) : (
                          <p className="muted-text">尚未產生。</p>
                        )}
                      </div>
                      <div className="ontology-card">
                        <h3>風險</h3>
                        {sortedRisks.length > 0 ? (
                          <ul className="list-content">
                            {sortedRisks.slice(0, 5).map((risk) => (
                              <li key={risk.id}>{risk.title}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="muted-text">尚未產生。</p>
                        )}
                      </div>
                      <div className="ontology-card">
                        <h3>選項</h3>
                        {task.options.length > 0 ? (
                          <ul className="list-content">
                            {task.options.slice(0, 5).map((option, index) => (
                              <li key={index}>{JSON.stringify(option)}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="muted-text">目前沒有 option 物件。</p>
                        )}
                      </div>
                      <div className="ontology-card">
                        <h3>建議</h3>
                        {sortedRecommendations.length > 0 ? (
                          <ul className="list-content">
                            {sortedRecommendations.slice(0, 5).map((recommendation) => (
                              <li key={recommendation.id}>{recommendation.summary}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="muted-text">尚未產生。</p>
                        )}
                      </div>
                      <div className="ontology-card">
                        <h3>行動項目</h3>
                        {sortedActionItems.length > 0 ? (
                          <ul className="list-content">
                            {sortedActionItems.slice(0, 5).map((actionItem) => (
                              <li key={actionItem.id}>{actionItem.description}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="muted-text">尚未產生。</p>
                        )}
                      </div>
                      <div className="ontology-card">
                        <h3>交付物</h3>
                        {latestDeliverable ? (
                          <p className="content-block">
                            {latestDeliverable.title}
                            {"\n"}版本 {latestDeliverable.version}
                          </p>
                        ) : (
                          <p className="muted-text">尚未產生。</p>
                        )}
                      </div>
                      <div className="ontology-card">
                        <h3>協調摘要</h3>
                        {task.mode === "multi_agent" || participatingAgents.length > 0 ? (
                          <>
                            <p className="content-block">由 Host 協調中心負責收斂與結果整合。</p>
                            {participatingAgents.length > 0 ? (
                              <ul className="list-content">
                                {participatingAgents.map((agentId) => (
                                  <li key={agentId}>{labelForAgentId(agentId)}</li>
                                ))}
                              </ul>
                            ) : null}
                          </>
                        ) : (
                          <p className="content-block">
                            目前由 {labelForAgentId(task.runs[0]?.agent_id ?? task.task_type)} 執行單點專家流程。
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                    {task.runs.length > 0 ? (
                      <div className="detail-item">
                        <h3>任務歷史</h3>
                        <p className="panel-copy" style={{ marginBottom: "16px" }}>
                          回看這個案件的執行紀錄、寫回摘要與歷程狀態。
                        </p>
                        <div className="detail-list">
                          {[...task.runs]
                            .sort(
                              (a, b) =>
                                new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
                            )
                            .map((run) => (
                              <div className="detail-item" key={run.id}>
                                <div className="meta-row">
                                  <span className="pill">{labelForRunStatus(run.status)}</span>
                                  <span>{labelForAgentId(run.agent_id)}</span>
                                  <span>{formatDisplayDate(run.created_at)}</span>
                                </div>
                                <h3>{run.summary || "已記錄執行結果"}</h3>
                                <ExpandableText
                                  text={run.error_message || "結構化結果已寫入任務歷史。"}
                                  emptyText="目前沒有額外執行說明。"
                                />
                              </div>
                            ))}
                        </div>
                      </div>
                    ) : null}

                    <div className="detail-item">
                      <h3>流程與協調資訊</h3>
                      <p className="panel-copy" style={{ marginBottom: "16px" }}>
                        檢查目前工作流程、最新執行代理與 Host 的協調狀態。
                      </p>
                      <div className="detail-list">
                        <div className="detail-item">
                          <h3>工作流程</h3>
                          <p className="content-block">{labelForFlowMode(task.mode)}</p>
                        </div>
                        <div className="detail-item">
                          <h3>最新執行代理</h3>
                          <p className="content-block">
                            {labelForAgentId(task.runs[0]?.agent_id ?? task.task_type)}
                          </p>
                        </div>
                        <div className="detail-item">
                          <h3>參與代理</h3>
                          <ExpandableList
                            items={participatingAgents}
                            emptyText="目前沒有可顯示的參與代理。"
                            translateAsAgentIds
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </DisclosurePanel>
              ) : null}

            </div>
          </div>
        </>
      ) : null}
    </main>
  );
}
