"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { ChangeEvent, FormEvent, ReactNode, useEffect, useRef, useState } from "react";

import {
  buildArtifactEvidenceWorkspaceView,
  buildFlagshipDetailView,
  buildFlagshipLaneView,
  buildMatterWorkspaceCard,
} from "@/lib/advisory-workflow";
import {
  getArtifactEvidenceWorkspace,
  ingestMatterSources,
  resolveMatterCanonicalizationReview,
  uploadMatterFiles,
} from "@/lib/api";
import { buildContinuationDetailView } from "@/lib/continuation-advisory";
import {
  appendSelectedFiles,
  buildIntakePreviewItems,
  countIntakeMaterialUnits,
  describeRuntimeMaterialHandling,
  type IntakeSessionItemState,
  type IntakeItemProgressInfo,
  latestAttemptDetailFromHandling,
  MAX_INTAKE_MATERIAL_UNITS,
  previewItemBlocksSubmit,
  progressInfoFromRuntimeHandling,
  summarizeBatchProgress,
} from "@/lib/intake";
import {
  buildResearchDetailView,
  buildResearchGuidanceView,
} from "@/lib/research-lane";
import { buildEvidenceWorkspaceUsabilityView } from "@/lib/consultant-usability";
import { buildEvidenceOnDemandPanelPlan } from "@/lib/workbench-lazy-surface-plan";
import type { ArtifactEvidenceWorkspace } from "@/lib/types";
import {
  formatDisplayDate,
  labelForEngagementContinuityMode,
  labelForWritebackDepth,
} from "@/lib/ui-labels";
import { WorkspaceSectionGuide } from "@/components/workspace-section-guide";
import {
  noteDisclosureOpened,
  shouldRenderDisclosureBody,
  shouldRenderPendingIntakePreviewList,
} from "@/lib/workbench-performance-gates";

const DeferredIntakeMaterialPreviewList = dynamic(
  () =>
    import("@/components/intake-material-preview-list").then(
      (module) => module.IntakeMaterialPreviewList,
    ),
  {
    loading: () => <p className="muted-text">正在整理待補材料列表...</p>,
  },
);

const DeferredEvidenceDuplicateReviewPanelBody = dynamic(
  () =>
    import("@/components/evidence-secondary-panel-bodies").then(
      (module) => module.EvidenceDuplicateReviewPanelBody,
    ),
  {
    loading: () => <p className="muted-text">正在載入重複材料確認...</p>,
  },
);

const DeferredEvidenceMaterialsPanelBody = dynamic(
  () =>
    import("@/components/evidence-secondary-panel-bodies").then(
      (module) => module.EvidenceMaterialsPanelBody,
    ),
  {
    loading: () => <p className="muted-text">正在載入來源材料...</p>,
  },
);

const DeferredEvidenceArtifactsPanelBody = dynamic(
  () =>
    import("@/components/evidence-secondary-panel-bodies").then(
      (module) => module.EvidenceArtifactsPanelBody,
    ),
  {
    loading: () => <p className="muted-text">正在載入工作物件...</p>,
  },
);

const DeferredEvidenceChainsPanelBody = dynamic(
  () =>
    import("@/components/evidence-secondary-panel-bodies").then(
      (module) => module.EvidenceChainsPanelBody,
    ),
  {
    loading: () => <p className="muted-text">正在載入證據支撐鏈...</p>,
  },
);

const DeferredEvidenceRelatedTasksPanelBody = dynamic(
  () =>
    import("@/components/evidence-secondary-panel-bodies").then(
      (module) => module.EvidenceRelatedTasksPanelBody,
    ),
  {
    loading: () => <p className="muted-text">正在載入相關工作紀錄...</p>,
  },
);

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
      className="panel disclosure-panel section-anchor"
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

export function ArtifactEvidenceWorkspacePanel({ matterId }: { matterId: string }) {
  const [workspace, setWorkspace] = useState<ArtifactEvidenceWorkspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [urlsText, setUrlsText] = useState("");
  const [pastedText, setPastedText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [supplementMessage, setSupplementMessage] = useState<string | null>(null);
  const [supplementError, setSupplementError] = useState<string | null>(null);
  const [progressByItemId, setProgressByItemId] = useState<
    Record<string, IntakeItemProgressInfo>
  >({});
  const [keepAsReferenceByItemId, setKeepAsReferenceByItemId] = useState<
    Record<string, boolean>
  >({});
  const [sessionItemStates, setSessionItemStates] = useState<IntakeSessionItemState[]>([]);
  const [replaceTargetId, setReplaceTargetId] = useState<string | null>(null);
  const [resolvingCanonicalizationKey, setResolvingCanonicalizationKey] = useState<string | null>(null);
  const [canonicalizationMessage, setCanonicalizationMessage] = useState<string | null>(null);
  const [canonicalizationError, setCanonicalizationError] = useState<string | null>(null);
  const fileReplaceInputRef = useRef<HTMLInputElement | null>(null);
  const urlFieldRef = useRef<HTMLTextAreaElement | null>(null);
  const pastedTextFieldRef = useRef<HTMLTextAreaElement | null>(null);

  async function loadWorkspace() {
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
  }

  useEffect(() => {
    void loadWorkspace();
  }, [matterId]);

  async function handleResolveCanonicalization(
    reviewKey: string,
    resolution: "human_confirmed_canonical_row" | "keep_separate" | "split",
    successMessage: string,
  ) {
    try {
      setResolvingCanonicalizationKey(reviewKey);
      setCanonicalizationMessage(null);
      setCanonicalizationError(null);
      setWorkspace(
        await resolveMatterCanonicalizationReview(matterId, {
          review_key: reviewKey,
          resolution,
        }),
      );
      setCanonicalizationMessage(successMessage);
    } catch (resolveError) {
      setCanonicalizationError(
        resolveError instanceof Error ? resolveError.message : "更新重複材料判斷失敗。",
      );
    } finally {
      setResolvingCanonicalizationKey(null);
    }
  }

  const matterCard = workspace ? buildMatterWorkspaceCard(workspace.matter_summary) : null;
  const workspaceView = workspace ? buildArtifactEvidenceWorkspaceView(workspace) : null;
  const continuationSurface = workspace?.continuation_surface ?? null;
  const followUpLane = continuationSurface?.follow_up_lane ?? null;
  const progressionLane = continuationSurface?.progression_lane ?? null;
  const continuationDetailView = buildContinuationDetailView(continuationSurface);
  const canonicalizationSummary = workspace?.canonicalization_summary ?? null;
  const canonicalizationCandidates = workspace?.canonicalization_candidates ?? [];
  const evidenceOnDemandPanelPlan = buildEvidenceOnDemandPanelPlan({
    hasCanonicalizationCandidates: canonicalizationCandidates.length > 0,
  });
  const evidenceDuplicateReviewPanel = evidenceOnDemandPanelPlan.find(
    (item) => item.key === "duplicateReview",
  );
  const evidenceMaterialsPanel = evidenceOnDemandPanelPlan.find((item) => item.key === "materials");
  const evidenceArtifactsPanel = evidenceOnDemandPanelPlan.find((item) => item.key === "artifacts");
  const evidenceChainsPanel = evidenceOnDemandPanelPlan.find((item) => item.key === "chains");
  const evidenceRelatedTasksPanel = evidenceOnDemandPanelPlan.find(
    (item) => item.key === "relatedTasks",
  );
  const focusTask = workspace?.related_tasks[0] ?? null;
  const evidenceActionTitle =
    workspace?.matter_summary.engagement_continuity_mode === "one_off" &&
    workspace.matter_summary.status === "closed"
      ? "這案已正式結案，補件前請先 reopen"
      : workspace?.matter_summary.engagement_continuity_mode === "follow_up"
        ? followUpLane?.evidence_update_goal
          ? "先補齊這輪更新需要的支撐鏈"
          : "先補齊支撐鏈，再決定檢查點要怎麼更新"
        : workspace?.matter_summary.engagement_continuity_mode === "continuous"
          ? progressionLane?.evidence_update_goal
            ? "先補齊這輪推進需要的支撐鏈"
            : "先補齊支撐鏈，再決定要不要更新推進狀態 / 結果"
          : workspace && workspace.high_impact_gaps.length > 0
            ? "先補件，再回到主線判斷"
          : "先檢查支撐鏈，再決定往哪裡推進";
  const evidenceActionSummary =
    workspace?.matter_summary.engagement_continuity_mode === "one_off" &&
    workspace.matter_summary.status === "closed"
      ? "這個單次案件目前已正式結案；如果後續又有新資料，請先回案件工作台重新開啟，再把材料掛回同一個案件世界。"
      : workspace?.matter_summary.engagement_continuity_mode === "follow_up"
        ? followUpLane?.evidence_update_goal
          ? `這一頁現在更偏向後續補件與檢查點更新。${followUpLane.evidence_update_goal}`
          : "這一頁現在更偏向後續補件與檢查點更新，不需要把所有後續都做成完整的持續追蹤。"
        : workspace?.matter_summary.engagement_continuity_mode === "continuous"
          ? progressionLane?.evidence_update_goal
            ? `這一頁現在更偏向持續推進補件。${progressionLane.evidence_update_goal}`
            : "這一頁現在更偏向持續推進案件：先補資料與證據，再回案件工作台記錄推進狀態 / 結果。"
          : workspace && workspace.high_impact_gaps.length > 0
            ? "這裡最重要的不是把資料看完，而是先補齊高影響缺口，避免案件主控台或結果與報告在證據不足下失真。"
          : "這一頁負責釐清來源、工作物件與證據支撐鏈。先確認支撐鏈完整度，再回案件或分析會更有效率。";
  const evidenceSectionGuideItems = workspace
    ? buildEvidenceWorkspaceUsabilityView({
        hasHighImpactGaps: workspace.high_impact_gaps.length > 0,
        hasFocusTask: Boolean(focusTask),
        focusTaskTitle: focusTask?.title || "",
        sourceMaterialCount: workspace.source_material_cards.length,
        evidenceCount: workspace.evidence_chains.length,
      }).guideItems
    : [];
  const evidenceUsabilityView = workspace
    ? buildEvidenceWorkspaceUsabilityView({
        hasHighImpactGaps: workspace.high_impact_gaps.length > 0,
        hasFocusTask: Boolean(focusTask),
        focusTaskTitle: focusTask?.title || "",
        sourceMaterialCount: workspace.source_material_cards.length,
        evidenceCount: workspace.evidence_chains.length,
      })
    : null;
  const normalizedUrls = urlsText
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
  const pendingMaterialUnitCount = countIntakeMaterialUnits({
    fileCount: files.length,
    urlCount: normalizedUrls.length,
    hasPastedText: Boolean(pastedText.trim()),
  });
  const remediationContext =
    workspace?.matter_summary.engagement_continuity_mode === "follow_up"
      ? {
          lane: "follow_up" as const,
          updateGoal: followUpLane?.evidence_update_goal,
          nextAction: followUpLane?.next_follow_up_actions[0],
        }
      : workspace?.matter_summary.engagement_continuity_mode === "continuous"
        ? {
            lane: "continuous" as const,
            updateGoal: progressionLane?.evidence_update_goal,
            nextAction: progressionLane?.next_progression_actions[0],
          }
        : workspace?.matter_summary.engagement_continuity_mode === "one_off"
          ? {
              lane: "one_off" as const,
            }
          : {
              lane: "workspace" as const,
            };
  const pendingPreviewItems = buildIntakePreviewItems({
    files,
    urls: normalizedUrls,
    pastedText,
    context: remediationContext,
  });
  const blockingPendingItems = pendingPreviewItems.filter((item) =>
    previewItemBlocksSubmit(item),
  );
  const batchSummary = summarizeBatchProgress({
    items: pendingPreviewItems,
    progressByItemId,
    keepAsReferenceByItemId,
    sessionStates: sessionItemStates,
  });
  const evidencePrimaryActionHref =
    workspace?.matter_summary.engagement_continuity_mode === "one_off" &&
    workspace.matter_summary.status === "closed"
      ? `/matters/${matterId}#continuation-actions`
      : "#evidence-supplement";
  const evidencePrimaryActionLabel =
    workspace?.matter_summary.engagement_continuity_mode === "one_off" &&
    workspace.matter_summary.status === "closed"
      ? "先重新開啟案件"
      : "先補件";
  const evidenceHeroSummary = workspace
    ? `${workspace.source_material_cards.length} 份來源材料、${workspace.artifact_cards.length} 份工作物件與 ${workspace.evidence_chains.length} 則證據已掛回同一個案件世界。${
        workspace.high_impact_gaps.length > 0
          ? ` 目前還有 ${workspace.high_impact_gaps.length} 個高影響缺口需要先補。`
          : " 目前已具備基本支撐鏈，可回到分析項目或結果與報告續推。"
      }`
    : "";
  const flagshipLane = workspace ? buildFlagshipLaneView(workspace.matter_summary.flagship_lane) : null;
  const researchGuidance = workspace ? buildResearchGuidanceView(workspace.research_guidance) : null;
  const researchDetailView = workspace
    ? buildResearchDetailView(researchGuidance, workspace.research_runs[0] ?? null)
    : null;
  const evidenceSurfaceSummary = flagshipLane
    ? `${flagshipLane.currentOutputSummary} ${workspaceView?.summary || evidenceHeroSummary}`
    : workspaceView?.summary || evidenceHeroSummary;
  const flagshipDetailView = buildFlagshipDetailView(flagshipLane);
  const recentAttemptItems = [...sessionItemStates]
    .filter((item) => (item.progress.attemptCount ?? 0) > 0 || item.progress.latestAttemptLabel)
    .sort((left, right) => (right.progress.lastUpdatedAt ?? 0) - (left.progress.lastUpdatedAt ?? 0))
    .slice(0, 4);

  function setItemProgress(itemId: string, progress: IntakeItemProgressInfo) {
    setProgressByItemId((previous) => ({
      ...previous,
      [itemId]: progress,
    }));
  }

  function rememberSessionItemState(
    item: (typeof pendingPreviewItems)[number],
    progress: IntakeItemProgressInfo,
  ) {
    setSessionItemStates((previous) => {
      const next = previous.filter((entry) => entry.itemId !== item.id);
      next.push({
        itemId: item.id,
        title: item.title,
        kindLabel: item.kindLabel,
        progress,
      });
      return next;
    });
  }

  function buildHandlingFromRuntimeItem(runtimeItem: {
    source_document: {
      support_level: string;
      ingest_status: string;
      ingest_strategy: string;
      metadata_only: boolean;
      ingestion_error: string | null;
      diagnostic_category?: string | null;
      extract_availability?: string | null;
      current_usable_scope?: string | null;
    };
    source_material?: {
      support_level: string;
      ingest_status: string;
      ingest_strategy: string;
      metadata_only: boolean;
      ingestion_error?: string | null;
      diagnostic_category?: string | null;
      extract_availability?: string | null;
      current_usable_scope?: string | null;
    } | null;
  }) {
    return describeRuntimeMaterialHandling({
      supportLevel:
        runtimeItem.source_material?.support_level ?? runtimeItem.source_document.support_level,
      ingestStatus:
        runtimeItem.source_material?.ingest_status ?? runtimeItem.source_document.ingest_status,
      ingestStrategy:
        runtimeItem.source_material?.ingest_strategy ?? runtimeItem.source_document.ingest_strategy,
      metadataOnly:
        runtimeItem.source_material?.metadata_only ?? runtimeItem.source_document.metadata_only,
      ingestionError:
        runtimeItem.source_material?.ingestion_error ??
        runtimeItem.source_document.ingestion_error,
      diagnosticCategory:
        runtimeItem.source_material?.diagnostic_category ??
        runtimeItem.source_document.diagnostic_category,
      extractAvailability:
        runtimeItem.source_material?.extract_availability ??
        runtimeItem.source_document.extract_availability,
      currentUsableScope:
        runtimeItem.source_material?.current_usable_scope ??
        runtimeItem.source_document.current_usable_scope,
      context: remediationContext,
    });
  }

  async function processPendingPreviewItem(
    item: (typeof pendingPreviewItems)[number],
  ) {
    try {
      const nextAttemptCount = (progressByItemId[item.id]?.attemptCount ?? 0) + 1;
      if (item.kind === "file") {
        const index = Number(item.id.replace("file-", ""));
        const file = files[index];
        if (!file) {
          throw new Error("找不到要處理的檔案，請重新選取。");
        }
        setItemProgress(item.id, {
          phase: "uploading",
          label: "上傳中",
          detail: "這份檔案正在掛回目前案件世界。",
          blocksSubmit: false,
          retryable: false,
          attemptCount: nextAttemptCount,
          latestAttemptLabel: `第 ${nextAttemptCount} 次處理：上傳中`,
          latestAttemptDetail: "系統正在送出這份檔案。",
          lastUpdatedAt: Date.now(),
        });
        const uploadResult = await uploadMatterFiles(matterId, [file]);
        const runtimeItem = uploadResult.uploaded[0];
        if (!runtimeItem) {
          throw new Error("這份檔案沒有收到可用的 upload result。");
        }
        const handling = buildHandlingFromRuntimeItem(runtimeItem);
        const progress = progressInfoFromRuntimeHandling(handling, {
          keepAsReference: Boolean(keepAsReferenceByItemId[item.id]),
        });
        const nextProgress = {
          ...progress,
          attemptCount: nextAttemptCount,
          latestAttemptLabel: `第 ${nextAttemptCount} 次結果：${progress.label}`,
          latestAttemptDetail: latestAttemptDetailFromHandling(handling),
          lastUpdatedAt: Date.now(),
        } satisfies IntakeItemProgressInfo;
        setItemProgress(item.id, nextProgress);
        rememberSessionItemState(item, nextProgress);
        return nextProgress;
      }

      if (item.kind === "url") {
        const index = Number(item.id.replace("url-", ""));
        const url = normalizedUrls[index];
        if (!url) {
          throw new Error("找不到要處理的網址，請先回網址欄確認。");
        }
        setItemProgress(item.id, {
          phase: "parsing",
          label: "解析中",
          detail: "系統正在抓取這個 URL 的正文與標題。",
          blocksSubmit: false,
          retryable: false,
          attemptCount: nextAttemptCount,
          latestAttemptLabel: `第 ${nextAttemptCount} 次處理：解析中`,
          latestAttemptDetail: "系統正在抓取這個網址。",
          lastUpdatedAt: Date.now(),
        });
        const ingestResult = await ingestMatterSources(matterId, {
          urls: [url],
          pasted_text: "",
        });
        const runtimeItem = ingestResult.ingested[0];
        if (!runtimeItem) {
          throw new Error("這個網址沒有收到可用的 ingest result。");
        }
        const handling = buildHandlingFromRuntimeItem(runtimeItem);
        const progress = progressInfoFromRuntimeHandling(handling, {
          keepAsReference: Boolean(keepAsReferenceByItemId[item.id]),
        });
        const nextProgress = {
          ...progress,
          attemptCount: nextAttemptCount,
          latestAttemptLabel: `第 ${nextAttemptCount} 次結果：${progress.label}`,
          latestAttemptDetail: latestAttemptDetailFromHandling(handling),
          lastUpdatedAt: Date.now(),
        } satisfies IntakeItemProgressInfo;
        setItemProgress(item.id, nextProgress);
        rememberSessionItemState(item, nextProgress);
        return nextProgress;
      }

      setItemProgress(item.id, {
        phase: "uploading",
        label: "掛接中",
        detail: "這段補充文字正在掛回目前案件世界。",
        blocksSubmit: false,
        retryable: false,
        attemptCount: nextAttemptCount,
        latestAttemptLabel: `第 ${nextAttemptCount} 次處理：掛接中`,
        latestAttemptDetail: "系統正在掛接這段補充文字。",
        lastUpdatedAt: Date.now(),
      });
      const ingestResult = await ingestMatterSources(matterId, {
        urls: [],
        pasted_text: pastedText,
        pasted_title: pastedText.trim() ? "案件補充說明" : undefined,
      });
      const runtimeItem = ingestResult.ingested[0];
      if (!runtimeItem) {
        throw new Error("這段補充文字沒有收到可用的 ingest result。");
      }
      const handling = buildHandlingFromRuntimeItem(runtimeItem);
      const progress = progressInfoFromRuntimeHandling(handling, {
        keepAsReference: Boolean(keepAsReferenceByItemId[item.id]),
      });
      const nextProgress = {
        ...progress,
        attemptCount: nextAttemptCount,
        latestAttemptLabel: `第 ${nextAttemptCount} 次結果：${progress.label}`,
        latestAttemptDetail: latestAttemptDetailFromHandling(handling),
        lastUpdatedAt: Date.now(),
      } satisfies IntakeItemProgressInfo;
      setItemProgress(item.id, nextProgress);
      rememberSessionItemState(item, nextProgress);
      return nextProgress;
    } catch (submitError) {
      const handling = describeRuntimeMaterialHandling({
        supportLevel: "unsupported",
        ingestStatus: "failed",
        ingestStrategy: "unsupported",
        metadataOnly: true,
        ingestionError:
          submitError instanceof Error ? submitError.message : "補件時發生未知錯誤。",
        context: remediationContext,
      });
      const progress = {
        ...progressInfoFromRuntimeHandling(handling),
        attemptCount: (progressByItemId[item.id]?.attemptCount ?? 0) + 1,
        latestAttemptLabel: `第 ${(progressByItemId[item.id]?.attemptCount ?? 0) + 1} 次結果：處理失敗`,
        latestAttemptDetail: latestAttemptDetailFromHandling(handling),
        lastUpdatedAt: Date.now(),
      } satisfies IntakeItemProgressInfo;
      setItemProgress(item.id, progress);
      rememberSessionItemState(item, progress);
      return progress;
    }
  }

  async function retryPendingPreviewItem(item: (typeof pendingPreviewItems)[number]) {
    setSubmitting(true);
    setSupplementMessage(null);
    setSupplementError(null);
    const progress = await processPendingPreviewItem(item);
    if (progress.phase === "done" || progress.phase === "parsing") {
      dropResolvedPendingItems([item.id]);
      setSupplementMessage("這份材料已重新處理完成；你可以繼續補其他材料，或回主線續推。");
      await loadWorkspace();
    } else {
      setSupplementError("這份材料重試後仍未成功；建議改用替換、移除或 fallback 材料。");
    }
    setSubmitting(false);
  }

  function toggleKeepAsReference(item: (typeof pendingPreviewItems)[number]) {
    setKeepAsReferenceByItemId((previous) => ({
      ...previous,
      [item.id]: !previous[item.id],
    }));
    setProgressByItemId((previous) => {
      const next = { ...previous };
      delete next[item.id];
      return next;
    });
    setSupplementMessage(
      keepAsReferenceByItemId[item.id]
        ? "已取消這份材料的參照保留標記。"
        : "已標記這份材料可先以參照層保留。",
    );
    setSupplementError(null);
    const progress = {
      ...progressByItemId[item.id],
      ...(progressByItemId[item.id] ?? {
        phase: "ready" as const,
        label: "將保留參照",
        detail: "這份材料不擋送出，會以參照層方式保留。",
        blocksSubmit: false,
        retryable: false,
      }),
      referenceOnly: !keepAsReferenceByItemId[item.id],
      latestAttemptLabel: !keepAsReferenceByItemId[item.id] ? "已標記保留為參照" : "已取消保留為參照",
      latestAttemptDetail: !keepAsReferenceByItemId[item.id]
        ? "這份材料這輪會先保留為參照層。"
        : "這份材料已取消參照標記，將回到一般處理判斷。",
      lastUpdatedAt: Date.now(),
    } satisfies IntakeItemProgressInfo;
    rememberSessionItemState(item, progress);
  }

  function replacePendingPreviewItem(item: (typeof pendingPreviewItems)[number]) {
    if (item.kind === "file") {
      setReplaceTargetId(item.id);
      fileReplaceInputRef.current?.click();
      return;
    }
    if (item.kind === "url") {
      setSupplementError("這筆來源請直接回網址欄修正；修正後 item row 會立即刷新。");
      urlFieldRef.current?.focus();
      return;
    }
    setSupplementError("這段補充文字請直接回補充文字欄改寫；改寫後 item row 會立即刷新。");
    pastedTextFieldRef.current?.focus();
  }

  function handleReplaceFileSelection(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0];
    if (!replaceTargetId || !nextFile) {
      event.currentTarget.value = "";
      return;
    }
    const index = Number(replaceTargetId.replace("file-", ""));
    setFiles((previous) =>
      previous.map((file, fileIndex) => (fileIndex === index ? nextFile : file)),
    );
    setProgressByItemId((previous) => {
      const next = { ...previous };
      delete next[replaceTargetId];
      return next;
    });
    setSessionItemStates((previous) =>
      previous.filter((entry) => entry.itemId !== replaceTargetId),
    );
    setReplaceTargetId(null);
    event.currentTarget.value = "";
    setSupplementError(null);
    setSupplementMessage("已替換這份檔案；新的 item 會沿用同一列重新判斷狀態。");
  }

  async function handleSupplementSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setSupplementMessage(null);
    setSupplementError(null);

    if (files.length === 0 && normalizedUrls.length === 0 && !pastedText.trim()) {
      setSupplementError("請至少補上一份檔案、一個網址或一段補充文字。");
      setSubmitting(false);
      return;
    }

    if (pendingMaterialUnitCount > MAX_INTAKE_MATERIAL_UNITS) {
      setSupplementError(
        `單次最多只能補 ${MAX_INTAKE_MATERIAL_UNITS} 份材料；請先精簡，或分批補件。`,
      );
      setSubmitting(false);
      return;
    }

    if (blockingPendingItems.length > 0) {
      setSupplementError("目前有無法成功進主鏈的材料；請先移除或修正，再補件。");
      setSubmitting(false);
      return;
    }

    try {
      let failedCount = 0;
      const resolvedItemIds: string[] = [];
      for (const item of pendingPreviewItems.filter((entry) => !previewItemBlocksSubmit(entry))) {
        const progress = await processPendingPreviewItem(item);
        if (progress.phase === "failed") {
          failedCount += 1;
        } else {
          resolvedItemIds.push(item.id);
        }
      }
      dropResolvedPendingItems(resolvedItemIds);
      if (failedCount > 0) {
        setSupplementMessage(
          `這輪補件已掛回案件世界，但仍有 ${failedCount} 份材料待補救；你可以先逐項重試 / 替換，再回主線續推。`,
        );
        await loadWorkspace();
        return;
      }
      setProgressByItemId({});
      setKeepAsReferenceByItemId({});
      setSupplementMessage("這輪補件已逐項處理完成，案件來源世界已更新。");
      await loadWorkspace();
    } catch (submitError) {
      setSupplementError(
        submitError instanceof Error ? submitError.message : "補件失敗，請稍後重試。",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setFiles((previous) =>
      appendSelectedFiles(previous, Array.from(event.target.files ?? [])),
    );
    setProgressByItemId({});
    setSessionItemStates((previous) =>
      previous.filter((entry) => !entry.itemId.startsWith("file-")),
    );
    setSupplementMessage(null);
    setSupplementError(null);
    event.currentTarget.value = "";
  }

  function handleRemovePendingPreviewItem(itemId: string) {
    setSessionItemStates((previous) => previous.filter((entry) => entry.itemId !== itemId));
    setProgressByItemId((previous) => {
      const next = { ...previous };
      delete next[itemId];
      return next;
    });
    setKeepAsReferenceByItemId((previous) => {
      const next = { ...previous };
      delete next[itemId];
      return next;
    });
    setSupplementMessage(null);
    setSupplementError(null);
    if (itemId.startsWith("file-")) {
      const index = Number(itemId.replace("file-", ""));
      setFiles((previous) => previous.filter((_, itemIndex) => itemIndex !== index));
      return;
    }
    if (itemId.startsWith("url-")) {
      const index = Number(itemId.replace("url-", ""));
      setUrlsText(normalizedUrls.filter((_, itemIndex) => itemIndex !== index).join("\n"));
      return;
    }
    if (itemId === "text-0") {
      setPastedText("");
    }
  }

  function dropResolvedPendingItems(itemIds: string[]) {
    if (itemIds.length === 0) {
      return;
    }
    const fileIndexes = new Set(
      itemIds
        .filter((itemId) => itemId.startsWith("file-"))
        .map((itemId) => Number(itemId.replace("file-", ""))),
    );
    const urlIndexes = new Set(
      itemIds
        .filter((itemId) => itemId.startsWith("url-"))
        .map((itemId) => Number(itemId.replace("url-", ""))),
    );
    const clearPastedText = itemIds.includes("text-0");

    if (fileIndexes.size > 0) {
      setFiles((previous) => previous.filter((_, itemIndex) => !fileIndexes.has(itemIndex)));
    }
    if (urlIndexes.size > 0) {
      setUrlsText(normalizedUrls.filter((_, itemIndex) => !urlIndexes.has(itemIndex)).join("\n"));
    }
    if (clearPastedText) {
      setPastedText("");
    }
    setProgressByItemId((previous) => {
      const next = { ...previous };
      itemIds.forEach((itemId) => {
        delete next[itemId];
      });
      return next;
    });
    setKeepAsReferenceByItemId((previous) => {
      const next = { ...previous };
      itemIds.forEach((itemId) => {
        delete next[itemId];
      });
      return next;
    });
  }

  return (
    <main className="page-shell evidence-page-shell">
      <div className="back-link-group">
        <Link className="back-link" href="/">
          ← 返回工作台
        </Link>
        <Link className="back-link" href={`/matters/${matterId}`}>
          ← 返回案件工作台
        </Link>
      </div>

      {loading ? <p className="status-text">正在載入資料與證據...</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      {workspace && matterCard && workspaceView ? (
        <>
          <section className="hero-card evidence-hero">
            <div className="hero-layout">
              <div className="hero-main">
                <span className="eyebrow">資料與證據</span>
                <h1 className="page-title">{matterCard.title}</h1>
                <p className="page-subtitle">{matterCard.objectPath}</p>
                <div className="hero-focus-card">
                  <p className="hero-focus-label">{evidenceActionTitle}</p>
                  <h3 className="hero-focus-title">先判斷夠不夠，再決定要不要補</h3>
                  <p className="hero-focus-copy">{evidenceActionSummary}</p>
                </div>
                <div className="button-row" style={{ marginTop: "4px" }}>
                  <Link className="button-primary" href={evidencePrimaryActionHref}>
                    {evidencePrimaryActionLabel}
                  </Link>
                </div>
              </div>

              <div className="hero-aside">
                <div className="hero-focus-card">
                  <p className="hero-focus-label">
                    {evidenceUsabilityView?.railEyebrow || "補完後回哪裡"}
                  </p>
                  <h3 className="hero-focus-title">
                    {evidenceUsabilityView?.railTitle || (focusTask ? "先回這次分析" : "先回案件工作台")}
                  </h3>
                  <p className="hero-focus-copy">
                    {evidenceUsabilityView?.railCopy ||
                      (focusTask
                        ? `補完後先回「${focusTask.title}」確認這次分析是否已能續推。`
                        : "補完後先回案件工作台確認現在重點是否已站穩。")}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <WorkspaceSectionGuide
            title={evidenceUsabilityView?.sectionGuideTitle || "資料與證據先看什麼"}
            description={
              evidenceUsabilityView?.sectionGuideDescription ||
              "先看到底缺什麼，再決定補哪種資料；補完後再回案件或分析續推。"
            }
            items={evidenceSectionGuideItems}
          />

          <section className="panel section-anchor" id="evidence-sufficiency">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">補件判斷</h2>
                <p className="panel-copy">
                  第一屏已經告訴你這頁該先補什麼；這裡只補充更完整的充分性、交付限制與缺口脈絡。
                </p>
              </div>
            </div>
            <div className="summary-grid">
              <div className="section-card">
                <h4>充分性摘要</h4>
                <p className="content-block">{evidenceSurfaceSummary}</p>
              </div>
              <div className="section-card">
                <h4>高影響缺口</h4>
                <CompactList
                  items={workspaceView.highImpactGaps}
                  emptyText="目前沒有額外的高影響缺口。"
                />
              </div>
              <div className="section-card">
                <h4>交付限制</h4>
                <CompactList
                  items={workspaceView.deliverableLimitations}
                  emptyText="目前沒有額外的交付限制提示。"
                />
              </div>
            </div>
            {flagshipDetailView.shouldShow ? (
              <div className="detail-item" style={{ marginTop: "18px" }}>
                <h3>{flagshipDetailView.sectionTitle}</h3>
                <div className="summary-grid">
                  {flagshipDetailView.cards.map((card) => (
                    <div className="section-card" key={`evidence-flagship-${card.title}`}>
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
            <DisclosurePanel
              title="詳細補件判斷"
              description="當你要深入確認證據期待、限制脈絡或連續性提示時，再展開這層。"
            >
              <div className="summary-grid">
                <div className="section-card">
                  <h4>證據期待</h4>
                  <CompactList
                    items={workspaceView.evidenceExpectations}
                    emptyText="目前沒有額外的證據期待。"
                  />
                </div>
                <div className="section-card">
                  <h4>連續性提示</h4>
                  <CompactList
                    items={workspace.continuity_notes}
                    emptyText="目前沒有額外的連續性提示。"
                  />
                </div>
              </div>
            </DisclosurePanel>
          </section>

          <DisclosurePanel
            title="研究來源脈絡與證據缺口紀錄"
            description="只有在你要追查這輪外部補完是怎麼進入證據鏈，或確認哪些缺口已被正式記錄時，再展開這層。"
          >
            <div className="summary-grid">
              {researchDetailView?.shouldShow
                ? researchDetailView.cards.map((card) => (
                    <div className="section-card" key={`evidence-research-${card.title}`}>
                      <h4>{card.title}</h4>
                      <p className="content-block">{card.summary}</p>
                    </div>
                  ))
                : null}
              <div className="section-card">
                <h4>研究執行紀錄</h4>
                <CompactList
                  items={workspace.research_runs.map(
                    (item) =>
                      `${item.research_depth}｜${item.query}｜${item.result_summary || item.status}${
                        item.citation_handoff_summary ? `｜${item.citation_handoff_summary}` : ""
                      }`,
                  )}
                  emptyText="目前沒有研究來源脈絡。"
                />
              </div>
              <div className="section-card">
                <h4>證據缺口紀錄</h4>
                <CompactList
                  items={workspace.evidence_gaps.map((item) => `${item.title}：${item.description}`)}
                  emptyText="目前沒有已記錄的證據缺口。"
                />
              </div>
            </div>
            {researchDetailView?.listItems.length ? (
              <div className="detail-item" style={{ marginTop: "18px" }}>
                <h3>{researchDetailView.listTitle}</h3>
                <CompactList
                  items={researchDetailView.listItems}
                  emptyText="目前沒有額外的研究收斂提示。"
                />
              </div>
            ) : null}
          </DisclosurePanel>

          <section className="panel section-anchor" id="evidence-supplement">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">補件與新增來源</h2>
                <p className="panel-copy">
                  這裡承接同一個案件的正式補件主鏈。你可以補檔案、網址或補充文字，系統會把它們掛回同一個案件世界，而不是拆成新的孤立流程。
                </p>
              </div>
            </div>

            <form className="detail-stack" onSubmit={handleSupplementSubmit}>
              <div className="summary-grid">
                <div className="section-card">
                  <h4>這裡適合補什麼</h4>
                  <p className="content-block">
                    客戶內部資料、合約附件、會議紀錄、訪談摘要與你手上的原始材料都走這裡；公開來源與外部事實查找則交給系統研究主線。
                  </p>
                </div>
                {researchGuidance?.supplementBoundaryNote ? (
                  <div className="section-card">
                    <h4>系統研究與補件分工</h4>
                    <p className="content-block">{researchGuidance.supplementBoundaryNote}</p>
                  </div>
                ) : null}
              </div>
              {continuationDetailView.shouldShow ? (
                <div className="summary-grid">
                  {continuationDetailView.cards.map((card) => (
                    <div className="section-card" key={`evidence-continuity-${card.title}`}>
                      <h4>{card.title}</h4>
                      <p className="content-block">{card.summary}</p>
                    </div>
                  ))}
                  {followUpLane ? (
                    <>
                      <div className="section-card">
                        <h4>這次補件要補哪個缺口</h4>
                        <p className="content-block">
                          {followUpLane.evidence_update_goal || "這次補件主要是為了補強最新後續更新的判斷基礎。"}
                        </p>
                      </div>
                      <div className="section-card">
                        <h4>目前最顯著的證據缺口</h4>
                        <p className="content-block">
                          {workspace.high_impact_gaps[0] || "目前沒有額外高影響缺口，補件可先圍繞最近更新做精修。"}
                        </p>
                      </div>
                    </>
                  ) : null}
                  {progressionLane ? (
                    <>
                      <div className="section-card">
                        <h4>這次補件要驗證什麼</h4>
                        <p className="content-block">
                          {progressionLane.evidence_update_goal || "這次補件主要是為了補強持續推進的下一步判斷基礎。"}
                        </p>
                      </div>
                      <div className="section-card">
                        <h4>會影響哪個行動 / 結果</h4>
                        <p className="content-block">
                          {progressionLane.action_states[0]?.summary || progressionLane.outcome_signals[0] || "目前還沒有可顯示的行動 / 結果影響摘要。"}
                        </p>
                      </div>
                    </>
                  ) : null}
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

              <div className="field">
                <label>上傳檔案</label>
                <label className="button-secondary file-input-trigger">
                  選擇檔案
                  <input
                    id="matter-files"
                    className="file-input-trigger-control"
                    type="file"
                    multiple
                    accept=".md,.txt,.docx,.xlsx,.csv,.pdf,.jpg,.jpeg,.png,.webp,text/plain,text/markdown,text/csv,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                  />
                </label>
                <input
                  ref={fileReplaceInputRef}
                  className="visually-hidden-file-input"
                  type="file"
                  accept=".md,.txt,.docx,.xlsx,.csv,.pdf,.jpg,.jpeg,.png,.webp,text/plain,text/markdown,text/csv,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/jpeg,image/png,image/webp"
                  onChange={handleReplaceFileSelection}
                />
                <small>支援一次掛多份材料；若同一內容重複上傳，系統會先用內容指紋判斷是否重複。</small>
              </div>

              <div className="field">
                <label htmlFor="matter-urls">網址</label>
                <textarea
                  id="matter-urls"
                  value={urlsText}
                  onChange={(event) => {
                    setUrlsText(event.target.value);
                    setProgressByItemId({});
                    setSessionItemStates((previous) =>
                      previous.filter((entry) => !entry.itemId.startsWith("url-")),
                    );
                    setSupplementMessage(null);
                    setSupplementError(null);
                  }}
                  ref={urlFieldRef}
                  placeholder={"每行一個網址，例如：\nhttps://example.com/report\nhttps://docs.google.com/document/d/..."}
                />
              </div>

              <div className="field">
                <label htmlFor="matter-text">補充文字</label>
                <textarea
                  id="matter-text"
                  value={pastedText}
                  onChange={(event) => {
                    setPastedText(event.target.value);
                    setProgressByItemId({});
                    setSessionItemStates((previous) =>
                      previous.filter((entry) => entry.itemId !== "text-0"),
                    );
                    setSupplementMessage(null);
                    setSupplementError(null);
                  }}
                  ref={pastedTextFieldRef}
                  placeholder="可直接貼上會議摘要、客戶補充說明、原始筆記或任何需要掛回案件的文字材料。"
                />
                {followUpLane ? (
                  <small>
                    {followUpLane.evidence_update_goal}
                    {followUpLane.previous_checkpoint?.summary
                      ? ` 上一個 checkpoint 是「${followUpLane.previous_checkpoint.summary}」。`
                      : ""}
                  </small>
                ) : null}
              </div>

              <div className="field">
                <label>這次待補的材料</label>
                {shouldRenderPendingIntakePreviewList(pendingPreviewItems.length) ? (
                  <DeferredIntakeMaterialPreviewList
                    items={pendingPreviewItems}
                    progressByItemId={progressByItemId}
                    keepAsReferenceByItemId={keepAsReferenceByItemId}
                    onRemove={(item) => {
                      handleRemovePendingPreviewItem(item.id);
                      setSupplementError(null);
                      setSupplementMessage(null);
                    }}
                    onRetry={retryPendingPreviewItem}
                    onReplace={replacePendingPreviewItem}
                    onKeepAsReference={toggleKeepAsReference}
                    emptyText="先補一句明確材料就夠了；這裡會逐項列出待補檔案、URL 與補充文字。"
                  />
                ) : (
                  <p className="empty-text">
                    先補一句明確材料就夠了；這裡會逐項列出待補檔案、URL 與補充文字。
                  </p>
                )}
                <small>
                  補件材料會逐項顯示限制、影響、阻擋原因與下一步動作；若這輪有可重試失敗，也可直接在項目上重試。
                </small>
              </div>

              <div className="summary-grid">
                <div className="section-card">
                  <h4>這輪補件目前進度</h4>
                  <p className="content-block">
                    {batchSummary.total === 0
                      ? "尚未加入待補材料。"
                      : `已完成 ${batchSummary.completed} 份｜處理中/待解析 ${batchSummary.processing} 份｜失敗 ${batchSummary.failed} 份｜阻擋 ${batchSummary.blocking} 份`}
                  </p>
                </div>
                <div className="section-card">
                  <h4>參照保留</h4>
                  <p className="content-block">
                    {batchSummary.referenceOnly > 0
                      ? `${batchSummary.referenceOnly} 份目前會以參照層保留`
                      : "目前沒有僅保留參照的材料。"}
                  </p>
                </div>
                <div className="section-card">
                  <h4>這輪是否可送出</h4>
                  <p className="content-block">
                    {batchSummary.blocking > 0
                      ? `還不行，仍有 ${batchSummary.blocking} 份阻擋材料。`
                      : "可以，這輪目前沒有阻擋材料。"}
                  </p>
                </div>
              </div>

              {recentAttemptItems.length > 0 ? (
                <div className="detail-list">
                  {recentAttemptItems.map((item) => (
                    <div className="detail-item" key={`${item.itemId}-${item.progress.lastUpdatedAt ?? 0}`}>
                      <div className="meta-row">
                        <span className="pill">{item.kindLabel}</span>
                        <span>{item.progress.latestAttemptLabel || "最近一次結果未標示"}</span>
                      </div>
                      <p className="content-block">
                        {item.title}
                        {"｜"}
                        {item.progress.latestAttemptDetail || item.progress.detail}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="button-row">
                <button
                  className="button-primary"
                  type="submit"
                  disabled={
                    submitting ||
                    pendingMaterialUnitCount > MAX_INTAKE_MATERIAL_UNITS ||
                    blockingPendingItems.length > 0
                  }
                >
                  {submitting ? "補件中..." : "掛接到目前案件"}
                </button>
              </div>
              <p className="muted-text">
                目前待補 {pendingMaterialUnitCount} / {MAX_INTAKE_MATERIAL_UNITS} 份；檔案、URL 與補充文字都一起計算。超過時請分批補件。
              </p>
              {pendingMaterialUnitCount > MAX_INTAKE_MATERIAL_UNITS ? (
                <p className="error-text">
                  單次最多只能補 {MAX_INTAKE_MATERIAL_UNITS} 份材料；請先精簡，或拆成兩批補件。
                </p>
              ) : null}
              {pendingMaterialUnitCount <= MAX_INTAKE_MATERIAL_UNITS &&
              blockingPendingItems.length > 0 ? (
                <p className="error-text">
                  目前有 {blockingPendingItems.length} 份材料無法成功進主鏈；請先移除或修正，再補件。
                </p>
              ) : null}

              <DisclosurePanel
                title="進件規則與保留邊界"
                description="只有在你要確認支援格式、有限支援範圍與原始檔保留規則時，再展開。"
              >
                <div className="summary-grid">
                  <div className="section-card">
                    <h4>正式支援</h4>
                    <p className="content-block">
                      MD、TXT、DOCX、XLSX、CSV、可擷取文字的 PDF、URL、補充文字。XLSX / CSV 目前先做表格快照式抽取；若要判斷公式、欄位關係與脈絡，仍建議補欄位說明或文字摘要。
                    </p>
                  </div>
                  <div className="section-card">
                    <h4>有限支援</h4>
                    <p className="content-block">
                      JPG / JPEG、PNG、WEBP、掃描型 PDF 目前只建立參照資訊，不預設 OCR。
                    </p>
                  </div>
                  <div className="section-card">
                    <h4>原始檔保留</h4>
                    <p className="content-block">
                      原始進件檔預設短期保存；正式工作物件保留較久，但發布與稽核紀錄不會跟著原始檔一起消失。
                    </p>
                  </div>
                </div>
              </DisclosurePanel>

              {supplementMessage ? <p className="success-text">{supplementMessage}</p> : null}
              {supplementError ? <p className="error-text">{supplementError}</p> : null}
            </form>
          </section>

          <div className="detail-grid">
            <div className="detail-stack">
              {canonicalizationCandidates.length > 0 ? (
              <DisclosurePanel
                id="evidence-duplicate-review"
                title={evidenceDuplicateReviewPanel?.title || "需確認是否同一份材料"}
                description="只有在系統懷疑同一案件世界裡可能長出近似重複材料時，再展開這層。平常不用先處理。"
              >
                <DeferredEvidenceDuplicateReviewPanelBody
                  canonicalizationSummary={canonicalizationSummary}
                  canonicalizationCandidates={canonicalizationCandidates}
                  canonicalizationMessage={canonicalizationMessage}
                  canonicalizationError={canonicalizationError}
                  resolvingCanonicalizationKey={resolvingCanonicalizationKey}
                  onResolveCanonicalization={handleResolveCanonicalization}
                />
              </DisclosurePanel>
              ) : null}

              <DisclosurePanel
                id="evidence-materials"
                title={evidenceMaterialsPanel?.title || "來源材料"}
                description="這裡列出目前案件世界內可直接回看的來源材料。平常先看上方摘要，需要核對材料角色、保留狀態與支撐數量時再展開。"
              >
                <DeferredEvidenceMaterialsPanelBody
                  sourceMaterialCards={workspace.source_material_cards}
                  remediationContext={remediationContext}
                />
              </DisclosurePanel>

              <DisclosurePanel
                title={evidenceArtifactsPanel?.title || "工作物件"}
                description="這些是已正式進入來源 / 證據工作面的工作物件，不是原始附件清單。需要核對工作物件角色時再展開。"
              >
                <DeferredEvidenceArtifactsPanelBody artifactCards={workspace.artifact_cards} />
              </DisclosurePanel>
            </div>

            <div className="detail-stack">
              <DisclosurePanel
                id="evidence-chains"
                title={evidenceChainsPanel?.title || "證據支撐鏈"}
                description="這裡正式顯示證據對建議 / 風險 / 行動的支撐鏈。平常先看上方摘要，需要逐條核對支撐關係時再展開。"
              >
                <DeferredEvidenceChainsPanelBody
                  evidenceChains={workspace.evidence_chains}
                  continuationSurface={continuationSurface}
                  updateGoal={progressionLane?.evidence_update_goal || followUpLane?.evidence_update_goal}
                />
              </DisclosurePanel>

              <DisclosurePanel
                id="evidence-related-tasks"
                title={evidenceRelatedTasksPanel?.title || "這個工作面中的相關工作紀錄"}
                description="這些工作紀錄共同構成目前的來源 / 證據世界。需要回主線推進或對照哪筆工作產出了哪些證據時，再展開。"
              >
                <DeferredEvidenceRelatedTasksPanelBody relatedTasks={workspace.related_tasks} />
              </DisclosurePanel>
            </div>
          </div>
        </>
      ) : null}
    </main>
  );
}
