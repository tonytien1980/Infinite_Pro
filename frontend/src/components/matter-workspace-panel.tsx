"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useMemo, useState } from "react";

import { buildFlagshipLaneView, buildTaskListWorkspaceSummary } from "@/lib/advisory-workflow";
import {
  applyMatterContinuationAction,
  getMatterWorkspace,
  rollbackMatterContentRevision,
  runTask,
} from "@/lib/api";
import { describeRuntimeMaterialHandling } from "@/lib/intake";
import { truncateText } from "@/lib/text-format";
import type {
  ContinuationSurface,
  MatterContentRevision,
  MatterWorkspace,
  MatterWorkspaceContentSections,
  MatterDeliverableSummary,
  TaskListItem,
} from "@/lib/types";
import {
  labelForApprovalStatus,
  labelForAuditEventType,
  formatFileSize,
  formatDisplayDate,
  labelForEngagementContinuityMode,
  labelForDeliverableClass,
  labelForFileExtension,
  labelForMatterStatus,
  labelForRetentionPolicy,
  labelForRetentionState,
  labelForStorageAvailability,
  labelForTaskStatus,
  labelForWritebackDepth,
} from "@/lib/ui-labels";
import {
  type MatterLifecycleStatus,
  type MatterWorkspaceRecord,
  type MatterWorkspaceSyncState,
  useMatterWorkspaceRecords,
} from "@/lib/workbench-store";
import {
  buildMatterSaveFeedback,
  buildMatterSyncFeedback,
  isLocalFallbackMatterRecord,
  persistMatterWorkspace,
  syncMatterWorkspaceFallback,
} from "@/lib/workspace-persistence";

type MatterTab = "overview" | "decision" | "evidence" | "deliverables" | "history";

const MATTER_TABS: Array<{ key: MatterTab; label: string }> = [
  { key: "overview", label: "案件概覽" },
  { key: "decision", label: "決策問題" },
  { key: "evidence", label: "來源與證據" },
  { key: "deliverables", label: "交付物" },
  { key: "history", label: "工作紀錄" },
];

const MATTER_TAB_PANEL_IDS: Record<MatterTab, string> = {
  overview: "matter-tabpanel-overview",
  decision: "matter-tabpanel-decision",
  evidence: "matter-tabpanel-evidence",
  deliverables: "matter-tabpanel-deliverables",
  history: "matter-tabpanel-history",
};

function getNextMatterTabKey(current: MatterTab, direction: "next" | "previous") {
  const currentIndex = MATTER_TABS.findIndex((tab) => tab.key === current);
  if (currentIndex === -1) {
    return MATTER_TABS[0].key;
  }
  const offset = direction === "next" ? 1 : -1;
  const nextIndex = (currentIndex + offset + MATTER_TABS.length) % MATTER_TABS.length;
  return MATTER_TABS[nextIndex].key;
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
    <details className="panel disclosure-panel" id={id}>
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

function defaultMatterStatus(matter: MatterWorkspace): MatterLifecycleStatus {
  return (
    (matter.summary.status as MatterLifecycleStatus) ||
    (matter.summary.active_task_count > 0 ? "active" : "paused")
  );
}

function collectNames(tasks: TaskListItem[], key: "selected_agent_names" | "selected_pack_names") {
  return Array.from(new Set(tasks.flatMap((task) => task[key]).filter(Boolean)));
}

function buildAnalysisFocus(matter: MatterWorkspace) {
  return [
    matter.current_decision_context?.title,
    matter.current_decision_context?.summary,
    matter.workstream?.name ? `工作流：${matter.workstream.name}` : null,
    matter.current_decision_context?.domain_lenses?.length
      ? `分析焦點：${matter.current_decision_context.domain_lenses.join("、")}`
      : null,
    matter.summary.client_stage ? `客戶階段：${matter.summary.client_stage}` : null,
    matter.summary.client_type ? `客戶類型：${matter.summary.client_type}` : null,
  ].filter(Boolean) as string[];
}

function buildConstraintNotes(matter: MatterWorkspace, evidenceCount: number) {
  const notes = [
    ...(matter.current_decision_context?.constraints ?? []),
    ...(matter.continuity_notes ?? []),
  ];

  if (evidenceCount < 2) {
    notes.push("目前正式證據仍偏薄，建議先補材料再擴大判斷。");
  }

  return Array.from(new Set(notes.filter(Boolean))).slice(0, 5);
}

function buildNextStepNotes(matter: MatterWorkspace, evidenceCount: number) {
  const nextSteps: string[] = [];

  if (evidenceCount < 2 || matter.summary.source_material_count === 0) {
    nextSteps.push("先進到來源與證據頁籤，補齊支撐目前判斷的材料。");
  }

  if (matter.related_deliverables[0]) {
    nextSteps.push(`回看最近交付物「${matter.related_deliverables[0].title}」，確認是否需要改版。`);
  }

  if (matter.related_tasks[0]) {
    nextSteps.push(`打開最近工作紀錄「${matter.related_tasks[0].title}」，確認主線是否已改變。`);
  }

  if (matter.summary.active_task_count > 1) {
    nextSteps.push(`目前有 ${matter.summary.active_task_count} 筆進行中工作，先聚焦同一個決策問題。`);
  }

  return Array.from(new Set(nextSteps)).slice(0, 4);
}

type MatterAdvanceGuide = {
  title: string;
  summary: string;
  checklist: string[];
  primaryActionLabel: string | null;
};

function mapContinuationActionIdToPayloadAction(actionId: string) {
  if (actionId === "close_case") {
    return "close";
  }
  if (actionId === "reopen_case") {
    return "reopen";
  }
  if (actionId === "record_checkpoint") {
    return "checkpoint";
  }
  if (actionId === "record_outcome") {
    return "record_outcome";
  }
  return null;
}

function buildMatterAdvanceGuide({
  arrivedFromNew,
  focusTask,
  latestDeliverable,
  sourceMaterialCount,
  evidenceCount,
  continuationSurface,
}: {
  arrivedFromNew: boolean;
  focusTask: TaskListItem | null;
  latestDeliverable: MatterDeliverableSummary | null;
  sourceMaterialCount: number;
  evidenceCount: number;
  continuationSurface: ContinuationSurface | null;
}): MatterAdvanceGuide {
  const checklist = [
    "先確認這個案件頁面上的「目前主線」是否就是你真正想要系統幫你收斂的判斷。",
    sourceMaterialCount === 0
      ? "如果你手上已有檔案、網址或會議摘要，先到來源與證據補件；如果還沒有，也可以直接先跑第一版骨架。"
      : evidenceCount < 2
        ? "目前已有一些材料，但證據仍偏薄；你可以先補件，也可以先產出第一版交付物再回來補強。"
        : "目前材料與證據已有基本厚度，可以直接執行分析，讓 Host 產出正式交付物。",
    latestDeliverable
      ? `最新交付物「${latestDeliverable.title}」已形成，現在可以直接回看摘要、風險與行動項目。`
      : focusTask
        ? `真正會產出結果的是工作紀錄「${focusTask.title}」的執行分析；完成後會生成正式交付物。`
        : "目前尚未找到可直接推進的工作紀錄。",
  ];

  if (
    continuationSurface?.primary_action &&
    continuationSurface.primary_action.action_id !== "run_analysis"
  ) {
    if (continuationSurface.workflow_layer === "closure") {
      return {
        title: "這案已可正式結案",
        summary:
          "這個單次案件已具備基本脈絡、證據與交付結果，下一步應偏向正式結案、發布或匯出，而不是進入持續追蹤。",
        checklist,
        primaryActionLabel: continuationSurface.primary_action.label,
      };
    }
    return {
      title: continuationSurface.title,
      summary: continuationSurface.summary,
      checklist,
      primaryActionLabel: continuationSurface.primary_action.label,
    };
  }

  if (latestDeliverable) {
    return {
      title: arrivedFromNew ? "案件已建立，現在已有可回看的結果" : "目前已有可回看的結果",
      summary: "這個案件已經形成交付物；如果要繼續推進，通常是回看交付物、補件後再改版，或切回工作紀錄重跑分析。",
      checklist,
      primaryActionLabel: null,
    };
  }

  if (!focusTask) {
    return {
      title: arrivedFromNew ? "案件已建立，下一步先回到工作紀錄" : "先回到工作紀錄",
      summary: "案件骨架已建立，但目前沒有可直接執行的焦點工作。請先打開工作紀錄，確認這輪分析的主線。",
      checklist,
      primaryActionLabel: null,
    };
  }

  if (sourceMaterialCount === 0 || evidenceCount < 2) {
    return {
      title: arrivedFromNew ? "案件已建立，現在先補件或先跑第一版" : "現在先補件或先跑第一版",
      summary: "建立案件只代表主鏈已成立，不代表結果已產出。你可以先補來源與證據，也可以直接讓系統先做一版可回看的交付物骨架。",
      checklist,
      primaryActionLabel: "直接產出第一版交付物",
    };
  }

  return {
    title: arrivedFromNew ? "案件已建立，現在可以直接產出結果" : "現在可以直接產出結果",
    summary: "這個案件已具備基本材料與證據厚度。直接執行分析後，系統會把結果寫成正式交付物並帶你進入交付物工作面。",
    checklist,
    primaryActionLabel: "執行分析並打開交付物",
  };
}

function splitMultilineContent(value: string) {
  return value
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildResolvedMatterContentSections(
  matter: MatterWorkspace,
  fallbackRecord?: MatterWorkspaceRecord | null,
): MatterWorkspaceContentSections {
  const evidenceCount = matter.related_tasks.reduce(
    (total, task) => total + task.evidence_count,
    0,
  );
  const storedSections = fallbackRecord?.contentSections || matter.content_sections;

  return {
    core_question:
      storedSections.core_question ||
      matter.current_decision_context?.judgment_to_make ||
      matter.current_decision_context?.title ||
      matter.summary.current_decision_context_title ||
      "",
    analysis_focus:
      storedSections.analysis_focus || buildAnalysisFocus(matter).join("\n"),
    constraints_and_risks:
      storedSections.constraints_and_risks ||
      buildConstraintNotes(matter, evidenceCount).join("\n"),
    next_steps:
      storedSections.next_steps || buildNextStepNotes(matter, evidenceCount).join("\n"),
  };
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

function serializeMatterContentSections(sections: MatterWorkspaceContentSections) {
  return {
    core_question: sections.core_question,
    analysis_focus: sections.analysis_focus,
    constraints_and_risks: sections.constraints_and_risks,
    next_steps: sections.next_steps,
  };
}

function buildRemoteMatterSummary(matter: MatterWorkspace) {
  return (
    matter.summary.workspace_summary ||
    matter.summary.active_work_summary ||
    matter.summary.continuity_summary ||
    ""
  );
}

function matterRecordMatchesRemote(record: MatterWorkspaceRecord, matter: MatterWorkspace) {
  const remoteSections = serializeMatterContentSections(matter.content_sections);
  return (
    record.title === matter.summary.title &&
    record.summary === buildRemoteMatterSummary(matter) &&
    record.status === defaultMatterStatus(matter) &&
    JSON.stringify(record.contentSections) === JSON.stringify(remoteSections)
  );
}

function buildMatterFallbackDiffItems(record: MatterWorkspaceRecord, matter: MatterWorkspace) {
  const remoteSections = matter.content_sections;
  const items: Array<{ label: string; remote: string; local: string }> = [];
  const pushIfDifferent = (label: string, remote: string, local: string) => {
    if (remote === local) {
      return;
    }
    items.push({
      label,
      remote: truncateText(remote || "空白", 84),
      local: truncateText(local || "空白", 84),
    });
  };

  pushIfDifferent("案件標題", matter.summary.title, record.title);
  pushIfDifferent("簡短摘要", buildRemoteMatterSummary(matter), record.summary);
  pushIfDifferent("狀態", labelForMatterStatus(defaultMatterStatus(matter)), labelForMatterStatus(record.status));
  pushIfDifferent("核心問題", remoteSections.core_question, record.contentSections.core_question);
  pushIfDifferent("分析焦點", remoteSections.analysis_focus, record.contentSections.analysis_focus);
  pushIfDifferent("限制 / 風險", remoteSections.constraints_and_risks, record.contentSections.constraints_and_risks);
  pushIfDifferent("下一步建議", remoteSections.next_steps, record.contentSections.next_steps);
  return items;
}

export function MatterWorkspacePanel({
  matterId,
  createdTaskId = null,
  arrivedFromNew = false,
}: {
  matterId: string;
  createdTaskId?: string | null;
  arrivedFromNew?: boolean;
}) {
  const router = useRouter();
  const [matter, setMatter] = useState<MatterWorkspace | null>(null);
  const [activeTab, setActiveTab] = useState<MatterTab>("overview");
  const [matterRecords, setMatterRecords] = useMatterWorkspaceRecords();
  const [draftTitle, setDraftTitle] = useState("");
  const [draftSummary, setDraftSummary] = useState("");
  const [draftStatus, setDraftStatus] = useState<MatterLifecycleStatus>("active");
  const [draftContentSections, setDraftContentSections] = useState<MatterWorkspaceContentSections>({
    core_question: "",
    analysis_focus: "",
    constraints_and_risks: "",
    next_steps: "",
  });
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveTone, setSaveTone] = useState<"success" | "warning" | "error" | null>(null);
  const [advanceMessage, setAdvanceMessage] = useState<string | null>(null);
  const [advanceTone, setAdvanceTone] = useState<"success" | "warning" | "error" | null>(null);
  const [continuationSummary, setContinuationSummary] = useState("");
  const [continuationNote, setContinuationNote] = useState("");
  const [continuationActionStatus, setContinuationActionStatus] = useState<
    "planned" | "in_progress" | "blocked" | "completed" | "review_required"
  >("in_progress");
  const [isApplyingContinuation, setIsApplyingContinuation] = useState(false);
  const [runningFocusTask, setRunningFocusTask] = useState(false);
  const [isResyncing, setIsResyncing] = useState(false);
  const [rollingBackRevisionId, setRollingBackRevisionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadMatterWorkspace() {
    try {
      setLoading(true);
      setError(null);
      setMatter(await getMatterWorkspace(matterId));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "載入案件工作台失敗。");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadMatterWorkspace();
  }, [matterId]);

  const fallbackRecord =
    matter && isLocalFallbackMatterRecord(matterRecords[matterId]) ? matterRecords[matterId] : null;
  const fallbackDiffItems =
    matter && fallbackRecord ? buildMatterFallbackDiffItems(fallbackRecord, matter) : [];
  const matterSyncState: MatterWorkspaceSyncState | null =
    matter && fallbackRecord
      ? matterRecordMatchesRemote(fallbackRecord, matter)
        ? null
        : fallbackRecord.baseRemoteUpdatedAt &&
            fallbackRecord.baseRemoteUpdatedAt !== matter.summary.latest_updated_at
          ? "needs_review"
          : fallbackRecord.syncState || "pending_sync"
      : null;

  useEffect(() => {
    if (!matter) {
      return;
    }

    setDraftTitle(fallbackRecord?.title || matter.summary.title);
    setDraftSummary(
      fallbackRecord?.summary ||
        matter.summary.workspace_summary ||
        matter.summary.active_work_summary ||
        matter.summary.continuity_summary ||
        "",
    );
    setDraftStatus(fallbackRecord?.status || defaultMatterStatus(matter));
    setDraftContentSections(buildResolvedMatterContentSections(matter, fallbackRecord));
    setContinuationSummary("");
    setContinuationNote("");
    setContinuationActionStatus("in_progress");
  }, [fallbackRecord, matter, matterId]);

  const matterStatus = matter
    ? fallbackRecord?.status || defaultMatterStatus(matter)
    : "active";
  const displayTitle = matter ? fallbackRecord?.title || matter.summary.title : "";
  const displaySummary = matter
    ? fallbackRecord?.summary ||
      matter.summary.workspace_summary ||
      matter.summary.active_work_summary ||
      matter.summary.continuity_summary ||
      "目前尚未補上案件摘要。"
    : "";
  const evidenceCount = matter
    ? matter.related_tasks.reduce((total, task) => total + task.evidence_count, 0)
    : 0;
  const agentNames = useMemo(
    () => (matter ? collectNames(matter.related_tasks, "selected_agent_names") : []),
    [matter],
  );
  const packNames = useMemo(
    () => (matter ? collectNames(matter.related_tasks, "selected_pack_names") : []),
    [matter],
  );
  const visibleHistoryItems = matter?.related_tasks.slice(0, 5) ?? [];
  const visibleMaterials = matter
    ? [...matter.related_artifacts, ...matter.related_source_materials].slice(0, 6)
    : [];
  const latestDeliverable = matter?.related_deliverables[0] ?? null;
  const continuationSurface = matter?.continuation_surface ?? null;
  const followUpLane = continuationSurface?.follow_up_lane ?? null;
  const progressionLane = continuationSurface?.progression_lane ?? null;
  const continuityMode = matter?.summary.engagement_continuity_mode ?? null;
  const remediationContext =
    continuityMode === "follow_up"
      ? {
          lane: "follow_up" as const,
          updateGoal: followUpLane?.evidence_update_goal,
          nextAction: followUpLane?.next_follow_up_actions[0],
        }
      : continuityMode === "continuous"
        ? {
            lane: "continuous" as const,
            updateGoal: progressionLane?.evidence_update_goal,
            nextAction: progressionLane?.next_progression_actions[0],
          }
        : continuityMode === "one_off"
          ? {
              lane: "one_off" as const,
            }
          : {
              lane: "workspace" as const,
            };
  const recentTask = matter?.related_tasks[0] ?? null;
  const focusTask =
    matter?.related_tasks.find((task) => task.id === createdTaskId) ?? recentTask ?? null;
  const analysisFocus = matter ? buildAnalysisFocus(matter) : [];
  const constraintNotes = matter ? buildConstraintNotes(matter, evidenceCount) : [];
  const nextStepNotes = matter ? buildNextStepNotes(matter, evidenceCount) : [];
  const recentTaskSummary = recentTask ? buildTaskListWorkspaceSummary(recentTask) : null;
  const flagshipLane = matter ? buildFlagshipLaneView(matter.summary.flagship_lane) : null;
  const resolvedContentSections = matter
    ? buildResolvedMatterContentSections(matter, fallbackRecord)
    : draftContentSections;
  const coreQuestion =
    resolvedContentSections.core_question ||
    matter?.current_decision_context?.judgment_to_make ||
    matter?.summary.current_decision_context_title ||
    "目前尚未形成清楚的決策問題。";
  const analysisFocusItems =
    splitMultilineContent(resolvedContentSections.analysis_focus).length > 0
      ? splitMultilineContent(resolvedContentSections.analysis_focus)
      : analysisFocus;
  const constraintItems =
    splitMultilineContent(resolvedContentSections.constraints_and_risks).length > 0
      ? splitMultilineContent(resolvedContentSections.constraints_and_risks)
      : constraintNotes;
  const nextStepItems =
    splitMultilineContent(resolvedContentSections.next_steps).length > 0
      ? splitMultilineContent(resolvedContentSections.next_steps)
      : nextStepNotes;
  const advanceGuide = buildMatterAdvanceGuide({
    arrivedFromNew,
    focusTask,
    latestDeliverable,
    sourceMaterialCount: matter?.summary.source_material_count ?? 0,
    evidenceCount,
    continuationSurface,
  });
  const caseWorldState = matter?.case_world_state ?? null;
  const latestCaseWorldDraft = matter?.case_world_drafts[0] ?? null;
  const openEvidenceGaps =
    matter?.evidence_gaps.filter((item) => item.status !== "resolved").slice(0, 5) ?? [];
  const recentDecisionRecords = matter?.decision_records.slice(0, 3) ?? [];
  const recentOutcomeRecords = matter?.outcome_records.slice(0, 3) ?? [];
  const pendingApprovalCount =
    (matter?.decision_records.filter((item) => item.approval_status === "pending").length ?? 0) +
    (matter?.action_plans.filter((item) => item.approval_status === "pending").length ?? 0);
  const recentAuditEvents = matter?.audit_events.slice(0, 3) ?? [];
  const canonicalizationSummary = matter?.canonicalization_summary ?? null;
  const canonicalizationCandidates = matter?.canonicalization_candidates.slice(0, 4) ?? [];
  const pendingCanonicalizationCount = canonicalizationSummary?.pending_review_count ?? 0;
  const continuityStrategySummary = matter
    ? `${labelForEngagementContinuityMode(matter.summary.engagement_continuity_mode)} / ${labelForWritebackDepth(matter.summary.writeback_depth)}`
    : "";
  const worldAuthoritySummary = caseWorldState
    ? caseWorldState.client_id &&
      caseWorldState.engagement_id &&
      caseWorldState.workstream_id &&
      caseWorldState.decision_context_id
      ? "Client / Engagement / Workstream / DecisionContext 已正式掛在案件世界層；task 在這一層只剩相容層連結與 work slice 入口，主要讀寫心智已回到同一條 world spine。"
      : "案件世界已建立，但底層 identity 仍在 bridge sync。"
    : "目前尚未形成正式案件世界 authority。";
  const sharedContinuitySummary = matter
    ? matter.summary.source_material_count > 0 || matter.summary.artifact_count > 0
      ? `目前已有 ${matter.summary.source_material_count} 份來源材料、${matter.summary.artifact_count} 份工作物件可跨工作切片回看。`
      : "目前還沒有可跨工作切片重訪的共享材料。"
    : "目前還沒有可顯示的共享材料連續性。";
  const canonicalizationSurfaceSummary = canonicalizationSummary
    ? pendingCanonicalizationCount > 0
      ? `目前有 ${pendingCanonicalizationCount} 組需確認是否同一份材料；若要處理，請到來源 / 證據工作面。`
      : canonicalizationSummary.summary
    : "目前沒有待處理的重複材料候選。";
  const heroStrategySummary = flagshipLane
    ? `起手方式：${flagshipLane.label}`
    : continuityStrategySummary
      ? `案件策略：${continuityStrategySummary}`
      : "案件策略尚未完整建立。";
  const heroStateSummary = flagshipLane?.summary || (followUpLane
    ? `最新檢查點：${followUpLane.latest_update?.summary || "尚未形成正式檢查點。"}`
    : progressionLane
      ? `最新推進狀態：${progressionLane.latest_progression?.summary || "目前還沒有新的推進更新。"}`
      : latestDeliverable
        ? `最近交付物：${latestDeliverable.title}`
        : focusTask
          ? `焦點工作紀錄：${focusTask.title}`
          : "目前還沒有焦點工作紀錄。");
  const heroNextActionSummary = flagshipLane?.nextStepSummary
    || followUpLane?.next_follow_up_actions[0]
    || progressionLane?.next_progression_actions[0]
    || advanceGuide.primaryActionLabel
    || "先確認這個案件頁面的主線是否已對準你現在真正要推進的判斷。";

  function handleMatterTabKeyDown(
    event: React.KeyboardEvent<HTMLButtonElement>,
    currentKey: MatterTab,
  ) {
    let nextKey: MatterTab | null = null;

    if (event.key === "ArrowRight") {
      nextKey = getNextMatterTabKey(currentKey, "next");
    } else if (event.key === "ArrowLeft") {
      nextKey = getNextMatterTabKey(currentKey, "previous");
    } else if (event.key === "Home") {
      nextKey = MATTER_TABS[0].key;
    } else if (event.key === "End") {
      nextKey = MATTER_TABS[MATTER_TABS.length - 1].key;
    }

    if (!nextKey) {
      return;
    }

    event.preventDefault();
    setActiveTab(nextKey);
    requestAnimationFrame(() => {
      document.getElementById(`matter-tab-${nextKey}`)?.focus();
    });
  }

  async function handleAdvanceMatter() {
    if (latestDeliverable) {
      router.push(`/deliverables/${latestDeliverable.deliverable_id}`);
      return;
    }

    if (!focusTask) {
      setAdvanceTone("warning");
      setAdvanceMessage("目前找不到可直接推進的工作紀錄，請先打開工作紀錄確認這輪主線。");
      return;
    }

    try {
      setRunningFocusTask(true);
      setAdvanceTone(null);
      setAdvanceMessage(
        evidenceCount < 2
          ? "正在先產出一版可回看的交付物骨架..."
          : "正在執行分析並產出正式交付物...",
      );
      const result = await runTask(focusTask.id);
      await loadMatterWorkspace();
      router.push(`/deliverables/${result.deliverable.id}`);
    } catch (runError) {
      setAdvanceTone("error");
      setAdvanceMessage(runError instanceof Error ? runError.message : "執行分析失敗。");
    } finally {
      setRunningFocusTask(false);
    }
  }

  async function handleApplyContinuationAction(actionId: string) {
    if (!matter) {
      return;
    }

    const payloadAction = mapContinuationActionIdToPayloadAction(actionId);
    if (!payloadAction) {
      return;
    }

    try {
      setIsApplyingContinuation(true);
      const nextWorkspace = await applyMatterContinuationAction(matterId, {
        action: payloadAction,
        summary: continuationSummary,
        note: continuationNote,
        action_status: actionId === "record_outcome" ? continuationActionStatus : undefined,
      });
      setMatter(nextWorkspace);
      setAdvanceTone("success");
      setAdvanceMessage(
        payloadAction === "close"
          ? "案件已正式結案。"
          : payloadAction === "reopen"
            ? "案件已重新開啟，可回到同一個案件世界續推。"
            : payloadAction === "checkpoint"
              ? "檢查點已寫回這個案件世界。"
              : "Outcome / 進度已寫回這個案件世界。",
      );
      setContinuationSummary("");
      setContinuationNote("");
    } catch (continuationError) {
      setAdvanceTone("error");
      setAdvanceMessage(
        continuationError instanceof Error
          ? continuationError.message
          : "執行 continuation action 失敗。",
      );
    } finally {
      setIsApplyingContinuation(false);
    }
  }

  async function handleSave() {
    if (!matter) {
      return;
    }

    try {
      const payload = {
        title: draftTitle.trim() || matter.summary.title,
        summary: draftSummary.trim(),
        status: draftStatus,
        content_sections: {
          core_question: draftContentSections.core_question.trim(),
          analysis_focus: draftContentSections.analysis_focus.trim(),
          constraints_and_risks: draftContentSections.constraints_and_risks.trim(),
          next_steps: draftContentSections.next_steps.trim(),
        },
      } as const;

      const result = await persistMatterWorkspace(matterId, payload, {
        baseRemoteUpdatedAt: matter.summary.latest_updated_at,
      });

      if (result.source === "remote") {
        setMatter(result.workspace);
        setMatterRecords((current) => {
          const next = { ...current };
          delete next[matterId];
          return next;
        });
        setSaveTone("success");
        setSaveMessage(buildMatterSaveFeedback("remote", result.workspace));
        return;
      }

      setMatterRecords((current) => ({
        ...current,
        [matterId]: result.fallbackRecord,
      }));
      setSaveTone("warning");
      setSaveMessage(buildMatterSaveFeedback("local-fallback"));
    } catch (saveError) {
      setSaveTone("error");
      setSaveMessage(
        saveError instanceof Error ? saveError.message : "儲存案件工作內容失敗。",
      );
    }
  }

  async function handleResyncMatterFallback() {
    if (!matter || !fallbackRecord) {
      return;
    }

    if (matterSyncState === "needs_review") {
      const confirmed = window.confirm(
        "遠端資料在 fallback 期間也有變更。要以本機暫存覆蓋正式資料並重新同步嗎？",
      );
      if (!confirmed) {
        return;
      }
    }

    setIsResyncing(true);
    setMatterRecords((current) => ({
      ...current,
      [matterId]: {
        ...fallbackRecord,
        syncState: "syncing",
        lastSyncAttemptAt: new Date().toISOString(),
        lastSyncError: null,
      },
    }));
    setSaveTone("warning");
    setSaveMessage(buildMatterSyncFeedback("syncing"));

    const result = await syncMatterWorkspaceFallback(matterId, fallbackRecord);
    if (result.source === "remote") {
      setMatter(result.workspace);
      setMatterRecords((current) => {
        const next = { ...current };
        delete next[matterId];
        return next;
      });
      setSaveTone("success");
      setSaveMessage("本機暫存已重新同步到正式資料。");
      setIsResyncing(false);
      return;
    }

    setMatterRecords((current) => ({
      ...current,
      [matterId]: result.nextRecord,
    }));
    setSaveTone("warning");
    setSaveMessage(result.error.message);
    setIsResyncing(false);
  }

  function handleDiscardLocalFallback() {
    if (!fallbackRecord) {
      return;
    }

    const confirmed = window.confirm("要放棄這份本機暫存，改回正式資料版本嗎？");
    if (!confirmed) {
      return;
    }

    setMatterRecords((current) => {
      const next = { ...current };
      delete next[matterId];
      return next;
    });
    setSaveTone("success");
    setSaveMessage("已放棄本機暫存，畫面改回正式資料版本。");
  }

  async function handleRollbackRevision(revision: MatterContentRevision) {
    if (fallbackRecord) {
      setSaveTone("warning");
      setSaveMessage("目前仍有待同步的本機暫存；請先同步或放棄暫存後，再回退正式修訂。");
      return;
    }

    const confirmed = window.confirm("要把案件正文回退到這筆修訂嗎？系統會留下新的回退修訂紀錄。");
    if (!confirmed) {
      return;
    }

    try {
      setRollingBackRevisionId(revision.id);
      const nextWorkspace = await rollbackMatterContentRevision(matterId, revision.id);
      setMatter(nextWorkspace);
      setSaveTone("success");
      setSaveMessage("已回退案件正文，並留下新的修訂紀錄。");
    } catch (rollbackError) {
      setSaveTone("error");
      setSaveMessage(
        rollbackError instanceof Error ? rollbackError.message : "回退案件正文失敗。",
      );
    } finally {
      setRollingBackRevisionId(null);
    }
  }

  useEffect(() => {
    if (!matter || !fallbackRecord) {
      return;
    }

    if (matterRecordMatchesRemote(fallbackRecord, matter)) {
      setMatterRecords((current) => {
        const next = { ...current };
        delete next[matterId];
        return next;
      });
      if (saveTone !== "success") {
        setSaveTone("success");
        setSaveMessage("本機暫存已與正式資料一致，已清除待同步狀態。");
      }
      return;
    }
  }, [fallbackRecord, matter, matterId, saveTone, setMatterRecords]);

  return (
    <main className="page-shell matter-workspace-shell">
      <nav className="workspace-breadcrumb" aria-label="工作面層級">
        <Link className="workspace-breadcrumb-link" href="/">
          總覽
        </Link>
        <span className="workspace-breadcrumb-separator">/</span>
        <Link className="workspace-breadcrumb-link" href="/matters">
          案件工作台
        </Link>
        <span className="workspace-breadcrumb-separator">/</span>
        <span className="workspace-breadcrumb-current">{displayTitle || "案件工作面"}</span>
      </nav>

      {loading ? (
        <p className="status-text" role="status" aria-live="polite">
          正在載入案件工作台...
        </p>
      ) : null}
      {error ? (
        <p className="error-text" role="alert" aria-live="assertive">
          {error}
        </p>
      ) : null}

      {matter ? (
        <>
          <section className="hero-card workspace-hero-card matter-hero">
            <div className="workspace-hero-grid matter-workspace-hero-grid">
              <div className="workspace-hero-main">
                <span className="eyebrow">案件工作台</span>
                <h1 className="page-title">{displayTitle}</h1>
                <p className="page-subtitle">先掌握案件現在狀態、主線與下一步，再決定往哪個工作面深入。</p>
                <p className="workspace-object-path">{matter.summary.object_path}</p>
                <div className="meta-row" style={{ marginTop: "16px" }}>
                  <span className="pill">{labelForMatterStatus(matterStatus)}</span>
                  <span>更新於 {formatDisplayDate(fallbackRecord?.updatedAt || matter.summary.latest_updated_at)}</span>
                  <span>{matter.summary.deliverable_count} 份交付物</span>
                  <span>{matter.summary.total_task_count} 筆工作紀錄</span>
                </div>

                <div className="deliverable-focus-card workspace-focus-card">
                  <span className="pill">目前主線</span>
                  <p className="deliverable-focus-lead">{coreQuestion}</p>
                </div>
              </div>

              <aside className="workspace-hero-rail">
                <div className="section-card section-anchor workspace-rail-callout" id="continuation-actions">
                  <h4>{advanceGuide.title}</h4>
                  <p className="content-block">{advanceGuide.summary}</p>
                  <p className="muted-text" style={{ marginTop: "8px" }}>
                    {heroStrategySummary}｜{matter.summary.source_material_count} 份來源 / {evidenceCount} 則證據 / {matter.summary.active_task_count} 筆進行中工作
                  </p>
                  <div className="detail-list" style={{ marginTop: "12px" }}>
                    <div className="detail-item">
                      <h3>現在最重要的變化</h3>
                      <p className="content-block">{heroStateSummary}</p>
                    </div>
                    <div className="detail-item">
                      <h3>下一步最建議做什麼</h3>
                      <p className="content-block">{heroNextActionSummary}</p>
                    </div>
                  </div>
                  {continuationSurface?.primary_action?.action_id === "record_checkpoint" ? (
                    <div className="field" style={{ marginTop: "12px" }}>
                      <label htmlFor="matter-checkpoint-note">這輪檢查點要留下什麼？</label>
                      <textarea
                        id="matter-checkpoint-note"
                        value={continuationSummary}
                        onChange={(event) => setContinuationSummary(event.target.value)}
                        placeholder={
                          followUpLane?.latest_update?.summary
                            ? `例如：延續「${followUpLane.latest_update.summary.slice(0, 36)}...」，這輪主要更新哪些建議 / 風險 / 下一步。`
                            : "例如：這輪只更新里程碑判斷、風險變化與下一步建議，不需要完整結果閉環。"
                        }
                      />
                    </div>
                  ) : null}
                  {continuationSurface?.primary_action?.action_id === "record_outcome" ? (
                    <div className="detail-stack" style={{ marginTop: "12px" }}>
                      {progressionLane ? (
                        <div className="section-card">
                          <h4>這輪推進提示</h4>
                          <p className="content-block">
                            {progressionLane.what_changed[0]
                              || progressionLane.latest_progression?.summary
                              || "先記錄這輪最重要的進度／結果變化。"}
                          </p>
                        </div>
                      ) : null}
                      <div className="form-grid">
                        <div className="field">
                          <label htmlFor="matter-outcome-status">目前行動狀態</label>
                          <select
                            id="matter-outcome-status"
                            value={continuationActionStatus}
                            onChange={(event) =>
                              setContinuationActionStatus(
                                event.target.value as
                                  | "planned"
                                  | "in_progress"
                                  | "blocked"
                                  | "completed"
                                  | "review_required",
                              )
                            }
                          >
                            <option value="planned">已規劃</option>
                            <option value="in_progress">進行中</option>
                            <option value="blocked">受阻</option>
                            <option value="completed">已完成</option>
                            <option value="review_required">待重新檢查</option>
                          </select>
                        </div>
                        <div className="field">
                          <label htmlFor="matter-outcome-summary">這輪推進／結果更新</label>
                          <textarea
                            id="matter-outcome-summary"
                            value={continuationSummary}
                            onChange={(event) => setContinuationSummary(event.target.value)}
                            placeholder={
                              progressionLane?.latest_progression?.summary
                                ? `例如：延續「${progressionLane.latest_progression.summary.slice(0, 40)}...」，這輪主要補了哪些進度訊號、阻塞點或新結果。`
                                : "例如：行動已開始推進，但目前卡在哪裡；或結果已出現新訊號，需要刷新交付物。"
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ) : null}
                  <div className="button-row" style={{ marginTop: "12px" }}>
                    {continuationSurface?.primary_action &&
                    continuationSurface.primary_action.action_id !== "run_analysis" ? (
                      <button
                        className="button-primary"
                        type="button"
                        onClick={() =>
                          void handleApplyContinuationAction(
                            continuationSurface.primary_action?.action_id ?? "",
                          )
                        }
                        disabled={isApplyingContinuation}
                      >
                        {isApplyingContinuation
                          ? "寫回中..."
                          : continuationSurface.primary_action.label}
                      </button>
                    ) : latestDeliverable ? (
                      <Link
                        className="button-primary"
                        href={`/deliverables/${latestDeliverable.deliverable_id}`}
                      >
                        打開最近交付物
                      </Link>
                    ) : advanceGuide.primaryActionLabel ? (
                      <button
                        className="button-primary"
                        type="button"
                        onClick={() => void handleAdvanceMatter()}
                        disabled={runningFocusTask}
                      >
                        {runningFocusTask ? "正在產出中..." : advanceGuide.primaryActionLabel}
                      </button>
                    ) : null}
                    <Link className="button-secondary" href={`/matters/${matterId}/evidence`}>
                      先補資料
                    </Link>
                    {focusTask ? (
                      <Link className="button-secondary" href={`/tasks/${focusTask.id}`}>
                        打開工作紀錄
                      </Link>
                    ) : null}
                  </div>
                  {advanceMessage ? (
                    <p
                      className={
                        advanceTone === "error"
                          ? "error-text"
                          : advanceTone === "success"
                            ? "success-text"
                            : "muted-text"
                      }
                      style={{ marginTop: "12px" }}
                      role={advanceTone === "error" ? "alert" : "status"}
                      aria-live={advanceTone === "error" ? "assertive" : "polite"}
                    >
                      {advanceMessage}
                    </p>
                  ) : null}
                </div>
              </aside>
            </div>

            <div className="hero-metrics-grid workspace-hero-metrics">
              <div className="section-card hero-metric-card">
                <h3>案件姿態</h3>
                <p className="workbench-metric">{labelForMatterStatus(matterStatus)}</p>
                <p className="muted-text">
                  {labelForEngagementContinuityMode(matter.summary.engagement_continuity_mode)} /{" "}
                  {labelForWritebackDepth(matter.summary.writeback_depth)}
                </p>
              </div>
              <div className="section-card hero-metric-card">
                <h3>來源與證據</h3>
                <p className="workbench-metric">{evidenceCount}</p>
                <p className="muted-text">{matter.summary.source_material_count} 份來源材料</p>
              </div>
              <div className="section-card hero-metric-card">
                <h3>交付物</h3>
                <p className="workbench-metric">{matter.summary.deliverable_count}</p>
                <p className="muted-text">{matter.summary.total_task_count} 筆工作紀錄</p>
              </div>
              <div className="section-card hero-metric-card">
                <h3>已選擴充</h3>
                <p className="workbench-metric">
                  {matter.summary.selected_agent_names.length + matter.summary.selected_pack_names.length}
                </p>
                <p className="muted-text">
                  {matter.summary.selected_agent_names.length} 個代理 / {matter.summary.selected_pack_names.length} 個模組包
                </p>
              </div>
            </div>
          </section>

          <div className="page-tabs" role="tablist" aria-label="案件工作面頁籤">
            {MATTER_TABS.map((tab) => (
              <button
                key={tab.key}
                className={`page-tab${activeTab === tab.key ? " page-tab-active" : ""}`}
                type="button"
                role="tab"
                id={`matter-tab-${tab.key}`}
                aria-selected={activeTab === tab.key}
                aria-controls={MATTER_TAB_PANEL_IDS[tab.key]}
                tabIndex={activeTab === tab.key ? 0 : -1}
                onKeyDown={(event) => handleMatterTabKeyDown(event, tab.key)}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "overview" ? (
            <div
              className="detail-stack"
              role="tabpanel"
              id={MATTER_TAB_PANEL_IDS.overview}
              aria-labelledby="matter-tab-overview"
            >
              <section className="panel">
                <div className="panel-header">
                  <div>
                    <h2 className="panel-title">主線補充</h2>
                    <p className="panel-copy">第一屏已經告訴你這個案件現在要做什麼；這裡只補充真正會影響判斷的背景、限制與工作脈絡。</p>
                  </div>
                </div>

                <div className="detail-list">
                  {continuationSurface ? (
                    <div className="detail-item">
                      <h3>案件後續模式</h3>
                      <p className="content-block">
                        {continuationSurface.workflow_layer === "closure"
                          ? "這案已可正式結案。這個單次案件已具備基本脈絡、證據與交付結果，下一步應偏向正式結案、發布或匯出，而不是進入持續追蹤。"
                          : `${continuationSurface.title}。${continuationSurface.summary}`}
                      </p>
                    </div>
                  ) : null}
                  {followUpLane ? (
                    <div className="detail-item">
                      <h3>最近檢查點與變化</h3>
                      <ul className="list-content">
                        <li>最近檢查點：{followUpLane.latest_update?.summary || "尚未形成正式檢查點。"}</li>
                        <li>上一個檢查點：{followUpLane.previous_checkpoint?.summary || "目前沒有更早的檢查點可比較。"}</li>
                        {followUpLane.what_changed.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {progressionLane ? (
                    <div className="detail-item">
                      <h3>最近推進狀態</h3>
                      <ul className="list-content">
                        <li>最新推進狀態：{progressionLane.latest_progression?.summary || "目前還沒有新的推進更新。"}</li>
                        <li>上一個推進快照：{progressionLane.previous_progression?.summary || "目前沒有更早的推進快照可比較。"}</li>
                        {progressionLane.what_changed.slice(0, 3).map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  <div className="detail-item">
                    <h3>分析焦點</h3>
                    {analysisFocusItems.length > 0 ? (
                      <ul className="list-content">
                        {analysisFocusItems.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="empty-text">目前尚未整理出分析焦點。</p>
                    )}
                  </div>
                  <div className="detail-item">
                    <h3>限制 / 風險</h3>
                    {constraintItems.length > 0 ? (
                      <ul className="list-content">
                        {constraintItems.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="empty-text">目前沒有額外限制或風險。</p>
                    )}
                  </div>
                  <div className="detail-item">
                    <h3>最近工作脈絡</h3>
                    <p className="content-block">
                      {recentTaskSummary
                        ? truncateText(recentTaskSummary.workspaceState, 120)
                        : "目前尚未顯示最近工作脈絡。"}
                    </p>
                  </div>
                  <div className="detail-item">
                    <h3>下一步建議</h3>
                    {followUpLane?.next_follow_up_actions.length ? (
                      <ul className="list-content">
                        {followUpLane.next_follow_up_actions.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    ) : progressionLane?.next_progression_actions.length ? (
                      <ul className="list-content">
                        {progressionLane.next_progression_actions.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    ) : nextStepItems.length > 0 ? (
                      <ul className="list-content">
                        {nextStepItems.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="empty-text">目前沒有額外建議。</p>
                    )}
                  </div>
                </div>
              </section>

              <DisclosurePanel
                title="案件世界狀態與寫回策略"
                description="只有在你要確認案件世界層的 identity authority、有哪些 task slices，以及會寫回到多深時，再展開這層。"
              >
                <div className="summary-grid">
                  <div className="section-card">
                    <h4>連續性策略</h4>
                    <p className="content-block">{continuityStrategySummary || "未設定"}</p>
                  </div>
                  <div className="section-card">
                    <h4>World authority / task slices</h4>
                    <p className="content-block">
                      {caseWorldState
                        ? `${caseWorldState.compiler_status}｜目前共有 ${caseWorldState.active_task_ids.length} 個 task slices`
                        : "目前尚未形成正式案件世界狀態。"}
                    </p>
                  </div>
                  <div className="section-card">
                    <h4>世界身份 authority</h4>
                    <p className="content-block">{worldAuthoritySummary}</p>
                  </div>
                  <div className="section-card">
                    <h4>Case world 主問題</h4>
                    <p className="content-block">
                      {String(
                        caseWorldState?.canonical_intake_summary.problem_statement ||
                          latestCaseWorldDraft?.canonical_intake_summary.problem_statement ||
                          coreQuestion,
                      )}
                    </p>
                  </div>
                  <div className="section-card">
                    <h4>建議下一步</h4>
                    <p className="content-block">
                      {caseWorldState?.next_best_actions[0] ||
                        latestCaseWorldDraft?.next_best_actions[0] ||
                        "目前沒有額外建議。"}
                    </p>
                  </div>
                  <div className="section-card">
                    <h4>寫回紀錄</h4>
                    <p className="content-block">
                      {matter?.decision_records.length ?? 0} 筆 decision records / {matter?.outcome_records.length ?? 0} 筆 outcome records
                    </p>
                  </div>
                  <div className="section-card">
                    <h4>正式核可 / 稽核</h4>
                    <p className="content-block">
                      {pendingApprovalCount > 0
                        ? `目前有 ${pendingApprovalCount} 筆待正式核可，另有 ${matter?.audit_events.length ?? 0} 筆稽核事件可回看。`
                        : `目前沒有待正式核可項目；已留存 ${matter?.audit_events.length ?? 0} 筆稽核事件。`}
                    </p>
                  </div>
                  <div className="section-card">
                    <h4>共享材料連續性</h4>
                    <p className="content-block">{sharedContinuitySummary}</p>
                  </div>
                  <div className="section-card">
                    <h4>重複材料確認</h4>
                    <p className="content-block">{canonicalizationSurfaceSummary}</p>
                  </div>
                </div>

                {caseWorldState || latestCaseWorldDraft ? (
                  <div className="detail-list" style={{ marginTop: "18px" }}>
                    <div className="detail-item">
                      <h3>目前已確認的 facts</h3>
                      {(caseWorldState?.facts.length ?? latestCaseWorldDraft?.facts.length ?? 0) > 0 ? (
                        <ul className="list-content">
                          {(caseWorldState?.facts ?? latestCaseWorldDraft?.facts ?? []).slice(0, 5).map((item) => (
                            <li key={`${item.title}-${item.detail}`}>{item.title}：{item.detail}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="empty-text">目前沒有額外 facts。</p>
                      )}
                    </div>
                    <div className="detail-item">
                      <h3>仍在沿用的 assumptions</h3>
                      {(caseWorldState?.assumptions.length ?? latestCaseWorldDraft?.assumptions.length ?? 0) > 0 ? (
                        <ul className="list-content">
                          {(caseWorldState?.assumptions ?? latestCaseWorldDraft?.assumptions ?? []).slice(0, 5).map((item) => (
                            <li key={`${item.title}-${item.detail}`}>{item.title}：{item.detail}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="empty-text">目前沒有額外 assumptions。</p>
                      )}
                    </div>
                    <div className="detail-item">
                      <h3>目前 evidence gaps</h3>
                      {openEvidenceGaps.length > 0 ? (
                        <ul className="list-content">
                          {openEvidenceGaps.map((item) => (
                            <li key={item.id}>
                              {item.title}：{item.description}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="empty-text">目前沒有高優先 evidence gaps。</p>
                      )}
                    </div>
                    {caseWorldState?.last_supplement_summary ? (
                      <div className="detail-item">
                        <h3>最近 world update</h3>
                        <p className="content-block">
                          這個案件世界最近一次補件先更新了 world state：{caseWorldState.last_supplement_summary}
                        </p>
                      </div>
                    ) : null}
                    <div className="detail-item">
                      <h3>最近 decision / outcome</h3>
                      {recentDecisionRecords.length > 0 || recentOutcomeRecords.length > 0 ? (
                        <ul className="list-content">
                          {recentDecisionRecords.map((item) => (
                            <li key={item.id}>Decision：{item.decision_summary}</li>
                          ))}
                          {recentOutcomeRecords.map((item) => (
                            <li key={item.id}>Outcome：{item.summary}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="empty-text">目前還沒有可回看的 writeback records。</p>
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
                    {canonicalizationCandidates.length > 0 ? (
                      <div className="detail-item">
                        <h3>需確認是否同一份材料</h3>
                        <ul className="list-content">
                          {canonicalizationCandidates.map((item) => (
                            <li key={item.review_key}>
                              {item.consultant_summary}
                              <div style={{ marginTop: "8px" }}>
                                <Link
                                  className="back-link"
                                  href={`/matters/${matterId}/artifact-evidence#evidence-duplicate-review`}
                                >
                                  到來源 / 證據工作面確認這組材料
                                </Link>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {followUpLane ? (
                      <div className="detail-item">
                        <h3>建議 / 風險 / action continuity</h3>
                        <div className="summary-grid">
                          <div className="section-card">
                            <h4>建議延續</h4>
                            {followUpLane.recommendation_changes.length > 0 ? (
                              <ul className="list-content">
                                {followUpLane.recommendation_changes.slice(0, 3).map((item) => (
                                  <li key={`${item.kind}-${item.title}`}>{item.title}：{item.summary}</li>
                                ))}
                              </ul>
                            ) : (
                              <p className="empty-text">目前沒有額外的建議延續摘要。</p>
                            )}
                          </div>
                          <div className="section-card">
                            <h4>風險變化</h4>
                            {followUpLane.risk_changes.length > 0 ? (
                              <ul className="list-content">
                                {followUpLane.risk_changes.slice(0, 3).map((item) => (
                                  <li key={`${item.kind}-${item.title}`}>{item.title}：{item.summary}</li>
                                ))}
                              </ul>
                            ) : (
                              <p className="empty-text">目前沒有額外的風險變化摘要。</p>
                            )}
                          </div>
                          <div className="section-card">
                            <h4>Action continuity</h4>
                            {followUpLane.action_changes.length > 0 ? (
                              <ul className="list-content">
                                {followUpLane.action_changes.slice(0, 3).map((item) => (
                                  <li key={`${item.kind}-${item.title}`}>{item.title}：{item.summary}</li>
                                ))}
                              </ul>
                            ) : (
                              <p className="empty-text">目前沒有額外的 action continuity 摘要。</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : null}
                    {progressionLane ? (
                      <div className="detail-item">
                        <h3>Progression continuity</h3>
                        <div className="summary-grid">
                          <div className="section-card">
                            <h4>最近 progression</h4>
                            <p className="content-block">
                              {progressionLane.latest_progression?.summary || "目前還沒有 progression update。"}
                            </p>
                          </div>
                          <div className="section-card">
                            <h4>Action / outcome 摘要</h4>
                            <ul className="list-content">
                              {progressionLane.what_changed.map((item) => (
                                <li key={item}>{item}</li>
                              ))}
                            </ul>
                          </div>
                          <div className="section-card">
                            <h4>下一步建議</h4>
                            <p className="content-block">
                              {progressionLane.next_progression_actions[0] || "回案件工作面補一筆 progression update。"}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <p className="empty-text">目前尚未形成 case world draft。</p>
                )}
              </DisclosurePanel>

              <DisclosurePanel
                title="案件設定與同步"
                description="只有在你要改案件名稱、狀態、摘要，或處理 fallback / re-sync 時再打開。"
              >
                <div className="form-grid">
                  <div className="field-grid">
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
                        <option value="closed">已結案</option>
                        <option value="archived">封存</option>
                      </select>
                    </div>
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
                      placeholder="這個案件現在的狀態、處理範圍與下一步。"
                    />
                  </div>
                </div>

                <div className="button-row" style={{ marginTop: "16px" }}>
                  <button className="button-primary" type="button" onClick={handleSave}>
                    儲存案件資訊
                  </button>
                </div>
                {saveMessage ? (
                  <p
                    className={
                      saveTone === "error"
                        ? "error-text"
                        : saveTone === "success"
                          ? "success-text"
                        : "muted-text"
                    }
                    role={saveTone === "error" ? "alert" : "status"}
                    aria-live={saveTone === "error" ? "assertive" : "polite"}
                  >
                    {saveMessage}
                  </p>
                ) : null}
                {fallbackRecord && matterSyncState ? (
                  <div className="section-card" style={{ marginTop: "12px" }}>
                    <h4>同步狀態</h4>
                    <p className="content-block">{buildMatterSyncFeedback(matterSyncState)}</p>
                    {fallbackDiffItems.length > 0 && matterSyncState === "needs_review" ? (
                      <ul className="list-content" style={{ marginTop: "12px" }}>
                        {fallbackDiffItems.slice(0, 5).map((item) => (
                          <li key={item.label}>
                            {item.label}：遠端「{item.remote}」／本機「{item.local}」
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    <div className="button-row" style={{ marginTop: "12px" }}>
                      <button
                        className="button-secondary"
                        type="button"
                        onClick={() => void handleResyncMatterFallback()}
                        disabled={isResyncing}
                      >
                        {isResyncing ? "同步中..." : matterSyncState === "needs_review" ? "以本機內容重新同步" : "重新同步正式資料"}
                      </button>
                      <button
                        className="button-secondary"
                        type="button"
                        onClick={handleDiscardLocalFallback}
                        disabled={isResyncing}
                      >
                        放棄本機暫存
                      </button>
                    </div>
                  </div>
                ) : null}
              </DisclosurePanel>

              <DisclosurePanel
                title="案件背景與連續性"
                description="當你需要核對案件路徑、最近更新、關聯代理 / 模組包與工作分布時，再展開這層。"
              >
                <div className="summary-grid">
                  <div className="section-card">
                    <h4>案件路徑</h4>
                    <p className="content-block">{matter.summary.object_path}</p>
                  </div>
                  <div className="section-card">
                    <h4>最近更新</h4>
                    <p className="content-block">
                      {formatDisplayDate(fallbackRecord?.updatedAt || matter.summary.latest_updated_at)}
                    </p>
                  </div>
                  <div className="section-card">
                    <h4>關聯代理</h4>
                    <p className="content-block">
                      {agentNames.length > 0 ? agentNames.slice(0, 5).join("、") : "目前尚未顯示代理。"}
                    </p>
                  </div>
                  <div className="section-card">
                    <h4>關聯模組包</h4>
                    <p className="content-block">
                      {packNames.length > 0 ? packNames.slice(0, 5).join("、") : "目前尚未顯示模組包。"}
                    </p>
                  </div>
                  <div className="section-card">
                    <h4>來源 / 證據</h4>
                    <p className="content-block">
                      {matter.summary.source_material_count} 份來源，{evidenceCount} 則證據。
                    </p>
                  </div>
                  <div className="section-card">
                    <h4>交付物 / 工作紀錄</h4>
                    <p className="content-block">
                      {matter.summary.deliverable_count} 份交付物，{matter.summary.total_task_count} 筆工作紀錄。
                    </p>
                  </div>
                </div>
              </DisclosurePanel>
            </div>
          ) : null}

          {activeTab === "decision" ? (
            <div
              className="detail-grid"
              role="tabpanel"
              id={MATTER_TAB_PANEL_IDS.decision}
              aria-labelledby="matter-tab-decision"
            >
              <div className="detail-stack">
                <section className="panel">
                  <div className="panel-header">
                    <div>
                      <h2 className="panel-title">核心問題</h2>
                      <p className="panel-copy">把案件正文穩定寫回正式資料，讓核心問題、分析焦點、限制與下一步不再只停在即時摘要。</p>
                    </div>
                  </div>

                  <div className="form-grid">
                    <div className="field">
                      <label htmlFor="matter-core-question">目前核心問題</label>
                      <textarea
                        id="matter-core-question"
                        value={draftContentSections.core_question}
                        onChange={(event) => {
                          setDraftContentSections((current) => ({
                            ...current,
                            core_question: event.target.value,
                          }));
                          setSaveMessage(null);
                        }}
                        placeholder="這個案件目前真正要回答的核心判斷是什麼？"
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="matter-analysis-focus">分析焦點</label>
                      <textarea
                        id="matter-analysis-focus"
                        value={draftContentSections.analysis_focus}
                        onChange={(event) => {
                          setDraftContentSections((current) => ({
                            ...current,
                            analysis_focus: event.target.value,
                          }));
                          setSaveMessage(null);
                        }}
                        placeholder="可用換行列出分析焦點、工作流與重要 lens。"
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="matter-constraints-risks">限制 / 風險</label>
                      <textarea
                        id="matter-constraints-risks"
                        value={draftContentSections.constraints_and_risks}
                        onChange={(event) => {
                          setDraftContentSections((current) => ({
                            ...current,
                            constraints_and_risks: event.target.value,
                          }));
                          setSaveMessage(null);
                        }}
                        placeholder="目前最需要留意的限制、待補與風險。"
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="matter-next-steps">下一步建議</label>
                      <textarea
                        id="matter-next-steps"
                        value={draftContentSections.next_steps}
                        onChange={(event) => {
                          setDraftContentSections((current) => ({
                            ...current,
                            next_steps: event.target.value,
                          }));
                          setSaveMessage(null);
                        }}
                        placeholder="下一步建議、補件方向、應回看的工作面。"
                      />
                    </div>
                  </div>

                  <div className="button-row" style={{ marginTop: "16px" }}>
                    <button className="button-primary" type="button" onClick={handleSave}>
                      儲存案件正文
                    </button>
                  </div>
                  {saveMessage ? (
                    <p
                      className={
                        saveTone === "error"
                          ? "error-text"
                          : saveTone === "success"
                            ? "success-text"
                            : "muted-text"
                      }
                      role={saveTone === "error" ? "alert" : "status"}
                      aria-live={saveTone === "error" ? "assertive" : "polite"}
                    >
                      {saveMessage}
                    </p>
                  ) : null}
                  {fallbackRecord && matterSyncState ? (
                    <div className="section-card" style={{ marginTop: "12px" }}>
                      <h4>待同步狀態</h4>
                      <p className="content-block">{buildMatterSyncFeedback(matterSyncState)}</p>
                      {fallbackDiffItems.length > 0 && matterSyncState === "needs_review" ? (
                        <ul className="list-content" style={{ marginTop: "12px" }}>
                          {fallbackDiffItems.slice(0, 5).map((item) => (
                            <li key={item.label}>
                              {item.label}：遠端「{item.remote}」／本機「{item.local}」
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      <div className="button-row" style={{ marginTop: "12px" }}>
                        <button
                          className="button-secondary"
                          type="button"
                          onClick={() => void handleResyncMatterFallback()}
                          disabled={isResyncing}
                        >
                          {isResyncing ? "同步中..." : matterSyncState === "needs_review" ? "以本機內容重新同步" : "重新同步正式資料"}
                        </button>
                        <button
                          className="button-secondary"
                          type="button"
                          onClick={handleDiscardLocalFallback}
                          disabled={isResyncing}
                        >
                          放棄本機暫存
                        </button>
                      </div>
                    </div>
                  ) : null}
                </section>
              </div>

              <div className="detail-stack">
                <section className="panel">
                  <div className="panel-header">
                    <div>
                      <h2 className="panel-title">決策脈絡</h2>
                      <p className="panel-copy">用最近幾筆 decision trajectory 回看這個案件是怎麼推進過來的。</p>
                    </div>
                  </div>

                  <div className="detail-list">
                    <div className="detail-item">
                      <h3>目前核心問題</h3>
                      <p className="content-block">{coreQuestion}</p>
                    </div>
                    <div className="detail-item">
                      <h3>分析焦點</h3>
                      {analysisFocusItems.length > 0 ? (
                        <ul className="list-content">
                          {analysisFocusItems.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="empty-text">目前還沒有整理好的分析焦點。</p>
                      )}
                    </div>
                    <div className="detail-item">
                      <h3>限制 / 風險</h3>
                      {constraintItems.length > 0 ? (
                        <ul className="list-content">
                          {constraintItems.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="empty-text">目前還沒有明確限制或風險。</p>
                      )}
                    </div>
                    <div className="detail-item">
                      <h3>下一步建議</h3>
                      {nextStepItems.length > 0 ? (
                        <ul className="list-content">
                          {nextStepItems.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="empty-text">目前沒有額外的下一步建議。</p>
                      )}
                    </div>
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
                          <p className="muted-text">{truncateText(item.judgment_to_make, 108)}</p>
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

                <section className="panel">
                  <div className="panel-header">
                    <div>
                      <h2 className="panel-title">正文修訂</h2>
                      <p className="panel-copy">這裡只追案件正文的演進、diff 與回退，不會和工作紀錄或發布歷史混在一起。</p>
                    </div>
                  </div>

                  {fallbackRecord ? (
                    <p className="muted-text">本機暫存尚未形成正式 revision；完成重新同步後，才會回到 backend 修訂歷史。</p>
                  ) : null}

                  {matter.content_revisions.length > 0 ? (
                    <div className="detail-list">
                      {matter.content_revisions.map((revision) => (
                        <div className="detail-item" key={revision.id}>
                          <div className="meta-row">
                            <span className="pill">{labelForContentRevisionSource(revision.source)}</span>
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
                                Boolean(fallbackRecord) ||
                                rollingBackRevisionId === revision.id ||
                                revision.id === matter.content_revisions[0]?.id
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
                </section>
              </div>
            </div>
          ) : null}

          {activeTab === "evidence" ? (
            <div
              className="detail-grid"
              role="tabpanel"
              id={MATTER_TAB_PANEL_IDS.evidence}
              aria-labelledby="matter-tab-evidence"
            >
              <div className="detail-stack">
                <section className="panel">
                  <div className="panel-header">
                    <div>
                      <h2 className="panel-title">來源與證據</h2>
                      <p className="panel-copy">先掌握目前依據厚度、材料狀態與保留期限，再決定要不要進完整的來源與證據工作面。</p>
                    </div>
                    <Link className="button-secondary" href={`/matters/${matterId}/evidence`}>
                      打開完整來源與證據工作面
                    </Link>
                  </div>

                  <div className="summary-grid">
                    <div className="section-card">
                      <h4>已掛接來源</h4>
                      <p className="content-block">{matter.summary.source_material_count} 份來源材料</p>
                    </div>
                    <div className="section-card">
                      <h4>證據摘要</h4>
                      <p className="content-block">{evidenceCount} 則正式證據</p>
                    </div>
                    <div className="section-card">
                      <h4>是否待補</h4>
                      <p className="content-block">
                        {evidenceCount < 2 || matter.summary.source_material_count === 0
                          ? "是，建議先補齊來源與證據。"
                          : "目前已有最小可用的依據厚度。"}
                      </p>
                    </div>
                    <div className="section-card">
                      <h4>補件入口</h4>
                      <p className="content-block">完整整理、補件與支撐鏈回看，請進來源與證據工作面。</p>
                    </div>
                  </div>
                </section>
              </div>

              <div className="detail-stack">
                <section className="panel">
                  <div className="panel-header">
                    <div>
                      <h2 className="panel-title">最近相關材料</h2>
                      <p className="panel-copy">保留少量最近材料，讓你不用先回整個列表才能抓到依據主線。</p>
                    </div>
                  </div>
                  <div className="detail-list">
                    {visibleMaterials.length > 0 ? (
                      visibleMaterials.map((item) => {
                        const handling = describeRuntimeMaterialHandling({
                          supportLevel: item.support_level,
                          ingestStatus: item.ingest_status,
                          ingestStrategy: item.ingest_strategy,
                          metadataOnly: item.metadata_only,
                          ingestionError: item.ingestion_error,
                          diagnosticCategory: item.diagnostic_category,
                          extractAvailability: item.extract_availability,
                          currentUsableScope: item.current_usable_scope,
                          context: remediationContext,
                        });
                        return (
                          <div className="detail-item" key={`${item.object_type}-${item.object_id}`}>
                            <div className="meta-row">
                              <span className="pill">{item.object_type === "artifact" ? "工作物件" : "來源材料"}</span>
                              {item.support_level ? (
                                <span className={`intake-status-pill intake-status-${handling.status}`}>
                                  {handling.statusLabel}
                                </span>
                              ) : null}
                              <span>{formatDisplayDate(item.created_at)}</span>
                            </div>
                            <h3>{item.title}</h3>
                            <p className="muted-text">
                              {item.task_title}
                              {item.file_extension ? `｜${labelForFileExtension(item.file_extension)}` : ""}
                              {item.file_size ? `｜${formatFileSize(item.file_size)}` : ""}
                            </p>
                            <p className="content-block">{truncateText(item.summary || "目前沒有額外摘要。", 118)}</p>
                            {item.object_type !== "artifact" ? (
                              <>
                                <p className="muted-text">
                                  <strong>問題類型：</strong>
                                  {handling.diagnosticLabel}
                                </p>
                                <p className="muted-text">
                                  <strong>可能原因：</strong>
                                  {handling.likelyCauseDetail}
                                </p>
                                <p
                                  className={
                                    handling.status === "accepted"
                                      ? "success-text"
                                      : handling.status === "limited" || handling.status === "pending"
                                        ? "muted-text"
                                        : "error-text"
                                  }
                                >
                                  {handling.statusDetail}
                                </p>
                                <p className="muted-text">
                                  <strong>目前可用範圍：</strong>
                                  {handling.usableScopeLabel}｜{handling.usableScopeDetail}
                                </p>
                                <p className="muted-text">
                                  <strong>會影響什麼：</strong>
                                  {handling.impactDetail}
                                </p>
                                <p className="muted-text">
                                  <strong>retry 判斷：</strong>
                                  {handling.retryabilityLabel}｜{handling.retryabilityDetail}
                                </p>
                                <p className="muted-text">
                                  <strong>建議下一步：</strong>
                                  {handling.recommendedNextStep}
                                </p>
                                {handling.fallbackStrategy ? (
                                  <p className="muted-text">
                                    <strong>較佳替代方式：</strong>
                                    {handling.fallbackStrategy}
                                  </p>
                                ) : null}
                                <Link className="back-link" href={`/matters/${matterId}/evidence#evidence-supplement`}>
                                  回補件入口處理這份材料
                                </Link>
                                <div className="meta-row">
                                  {item.availability_state ? (
                                    <span>{labelForStorageAvailability(item.availability_state)}</span>
                                  ) : null}
                                  {item.retention_policy ? (
                                    <span>{labelForRetentionPolicy(item.retention_policy)}</span>
                                  ) : null}
                                  {item.purge_at ? (
                                    <span>
                                      {labelForRetentionState(item.purge_at)}｜{formatDisplayDate(item.purge_at)}
                                    </span>
                                  ) : null}
                                </div>
                              </>
                            ) : null}
                          </div>
                        );
                      })
                    ) : (
                      <p className="empty-text">目前還沒有可顯示的來源或證據材料。</p>
                    )}
                  </div>
                </section>
              </div>
            </div>
          ) : null}

          {activeTab === "deliverables" ? (
            <div
              className="detail-grid"
              role="tabpanel"
              id={MATTER_TAB_PANEL_IDS.deliverables}
              aria-labelledby="matter-tab-deliverables"
            >
              <div className="detail-stack">
                <section className="panel">
                  <div className="panel-header">
                    <div>
                      <h2 className="panel-title">交付物</h2>
                      <p className="panel-copy">從這裡直接進到交付物 detail workspace，不必再回純列表頁找入口。</p>
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
                            <span className="pill">{item.status === "final" ? "定稿" : "工作中"}</span>
                            <span>{item.version_tag}</span>
                            <span>{formatDisplayDate(item.generated_at)}</span>
                          </div>
                          <h3>{item.title}</h3>
                          <p className="muted-text">{item.task_title}</p>
                          <p className="content-block">{truncateText(item.summary, 118)}</p>
                          <div className="button-row" style={{ marginTop: "12px" }}>
                            <Link className="button-secondary" href={`/deliverables/${item.deliverable_id}`}>
                              打開交付物工作面
                            </Link>
                          </div>
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
            <div
              className="detail-grid"
              role="tabpanel"
              id={MATTER_TAB_PANEL_IDS.history}
              aria-labelledby="matter-tab-history"
            >
              <div className="detail-stack">
                <section className="panel">
                  <div className="panel-header">
                    <div>
                      <h2 className="panel-title">工作紀錄</h2>
                      <p className="panel-copy">這裡只保留案件內高度相關的近端活動摘要，完整整理仍回到歷史紀錄頁。</p>
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
                          <article className="detail-item" key={task.id}>
                            <div className="meta-row">
                              <span className="pill">{labelForTaskStatus(task.status)}</span>
                              <span>{formatDisplayDate(task.updated_at)}</span>
                            </div>
                            <h3>{task.title}</h3>
                            <p className="workspace-object-path">{summary.objectPath}</p>
                            <p className="muted-text">{truncateText(summary.decisionContext, 92)}</p>
                            <p className="content-block">{truncateText(task.description, 118)}</p>
                            <div className="button-row" style={{ marginTop: "12px" }}>
                              <Link className="button-secondary" href={`/tasks/${task.id}`}>
                                打開工作紀錄
                              </Link>
                            </div>
                          </article>
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
