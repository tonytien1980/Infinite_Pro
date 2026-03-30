"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, ReactNode, useEffect, useRef, useState } from "react";

import { IntakeMaterialPreviewList } from "@/components/intake-material-preview-list";
import {
  buildArtifactEvidenceWorkspaceView,
  buildMatterWorkspaceCard,
} from "@/lib/advisory-workflow";
import {
  getArtifactEvidenceWorkspace,
  ingestMatterSources,
  uploadMatterFiles,
} from "@/lib/api";
import {
  appendSelectedFiles,
  buildIntakePreviewItems,
  countIntakeMaterialUnits,
  describeRuntimeMaterialHandling,
  type IntakeItemProgressInfo,
  MAX_INTAKE_MATERIAL_UNITS,
  previewItemBlocksSubmit,
  progressInfoFromRuntimeHandling,
} from "@/lib/intake";
import type { ArtifactEvidenceWorkspace } from "@/lib/types";
import {
  formatFileSize,
  formatDisplayDate,
  labelForEngagementContinuityMode,
  labelForEvidenceStrength,
  labelForEvidenceType,
  labelForFileExtension,
  labelForPresenceState,
  labelForRetentionPolicy,
  labelForRetentionState,
  labelForSourceIngestStrategy,
  labelForSourceType,
  labelForStorageAvailability,
  labelForTaskStatus,
  labelForWritebackDepth,
} from "@/lib/ui-labels";
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

function buildEvidenceIssueGuidance({
  evidenceType,
  workflowLayer,
  updateGoal,
}: {
  evidenceType: string;
  workflowLayer: string | null | undefined;
  updateGoal?: string | null;
}) {
  const isIngestIssue = evidenceType === "source_ingestion_issue" || evidenceType === "uploaded_file_ingestion_issue";
  const isUnparsed = evidenceType === "source_unparsed" || evidenceType === "uploaded_file_unparsed";

  if (!isIngestIssue && !isUnparsed) {
    return null;
  }

  const laneSpecificTail =
    workflowLayer === "checkpoint"
      ? updateGoal
        ? ` 這輪 follow-up 主要想補的是：${updateGoal}`
        : " 這輪 follow-up 不應把它誤當成已可直接引用的正文。"
      : workflowLayer === "progression"
        ? updateGoal
          ? ` 這輪 continuous 主要想驗證的是：${updateGoal}`
          : " 這輪 continuous 不應把它誤當成已可直接引用的正文。"
        : " 先把它當成限制提示，而不是正式內容證據。";

  if (isIngestIssue) {
    return `這則 evidence 代表來源匯入異常，不等於可直接採用的內容證據。若你還需要它，建議補文字版、可讀 URL 或人工摘要，再回主線續推。${laneSpecificTail}`;
  }

  return `這則 evidence 代表來源仍待解析，現在不能先假設已成功抽出正文。若後續仍只停在 pending / metadata-only，建議補文字版、可讀 URL 或摘要。${laneSpecificTail}`;
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
  const [replaceTargetId, setReplaceTargetId] = useState<string | null>(null);
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

  const matterCard = workspace ? buildMatterWorkspaceCard(workspace.matter_summary) : null;
  const workspaceView = workspace ? buildArtifactEvidenceWorkspaceView(workspace) : null;
  const continuationSurface = workspace?.continuation_surface ?? null;
  const followUpLane = continuationSurface?.follow_up_lane ?? null;
  const progressionLane = continuationSurface?.progression_lane ?? null;
  const focusTask = workspace?.related_tasks[0] ?? null;
  const evidenceActionTitle =
    workspace?.matter_summary.engagement_continuity_mode === "one_off" &&
    workspace.matter_summary.status === "closed"
      ? "這案已正式結案，補件前請先 reopen"
      : workspace?.matter_summary.engagement_continuity_mode === "follow_up"
        ? followUpLane?.evidence_update_goal
          ? "先補齊這輪更新需要的支撐鏈"
          : "先補齊支撐鏈，再決定 checkpoint 要怎麼更新"
        : workspace?.matter_summary.engagement_continuity_mode === "continuous"
          ? progressionLane?.evidence_update_goal
            ? "先補齊這輪 progression 需要的支撐鏈"
            : "先補齊支撐鏈，再決定要不要更新 progression / outcome"
          : workspace && workspace.high_impact_gaps.length > 0
            ? "先補件，再回到主線判斷"
          : "先檢查支撐鏈，再決定往哪裡推進";
  const evidenceActionSummary =
    workspace?.matter_summary.engagement_continuity_mode === "one_off" &&
    workspace.matter_summary.status === "closed"
      ? "這個 one_off 案件目前已正式結案；如果後續又有新資料，請先回案件工作面重新開啟，再把材料掛回同一個案件世界。"
      : workspace?.matter_summary.engagement_continuity_mode === "follow_up"
        ? followUpLane?.evidence_update_goal
          ? `這個工作面現在更偏向 follow-up 補件與 checkpoint 更新。${followUpLane.evidence_update_goal}`
          : "這個工作面現在更偏向 follow-up 補件與 checkpoint 更新，不需要把所有後續都做成完整 continuous tracking。"
        : workspace?.matter_summary.engagement_continuity_mode === "continuous"
          ? progressionLane?.evidence_update_goal
            ? `這個工作面現在更偏向 continuous progression 補件。${progressionLane.evidence_update_goal}`
            : "這個工作面現在更偏向持續推進案件：先補來源與證據，再回案件工作面記錄 progression / outcome。"
          : workspace && workspace.high_impact_gaps.length > 0
            ? "這裡最重要的不是把資料看完，而是先補齊高影響缺口，避免案件工作台或交付物在證據不足下失真。"
          : "這個工作面負責釐清來源、工作物件與證據支撐鏈。先確認支撐鏈完整度，再回案件或工作紀錄會更有效率。";
  const evidenceActionChecklist = [
    "先看充分性摘要與高影響缺口，確認這個案件現在缺的是什麼。",
    focusTask
      ? `如果要回到主線推進，焦點工作紀錄是「${focusTask.title}」。`
      : "如果要回到主線推進，先回案件工作台確認目前最重要的工作紀錄。",
    workspace && workspace.source_material_cards.length === 0
      ? "目前還沒有正式來源材料，建議先補檔案、網址或補充文字。"
      : "目前已有來源材料，接著可回看證據支撐鏈是否真的支撐得住判斷。",
    progressionLane?.next_progression_actions[0]
      ? `補完之後，下一步建議是：${progressionLane.next_progression_actions[0]}`
      : followUpLane?.next_follow_up_actions[0]
      ? `補完之後，下一步建議是：${followUpLane.next_follow_up_actions[0]}`
      : "補完之後再回案件工作面，確認這輪案件主線要怎麼續推。",
  ];
  const sharedContinuitySummary =
    workspace && (workspace.source_material_cards.length > 0 || workspace.evidence_chains.length > 0)
      ? (() => {
          const sharedCount = new Set(
            [
              ...workspace.source_material_cards
                .filter((item) => item.participation_task_count > 1)
                .map((item) => item.object_id),
              ...workspace.evidence_chains
                .filter((item) => (item.evidence.participation?.participation_task_count ?? 0) > 1)
                .map((item) => item.evidence.id),
            ],
          ).size;
          return sharedCount > 0
            ? `補進來的材料與證據會優先掛回同一個案件世界；目前至少有 ${sharedCount} 條 shared chains 已透過正式 participation mapping 被多個 task slices 共用，task 連結只作相容層入口。`
            : "補進來的材料與證據會優先掛回同一個案件世界，後續 task slices 可直接回看，不必再各自重傳。";
        })()
      : "目前還沒有可跨 task slices 連續使用的正式材料 / 證據。";
  const evidenceSectionGuideItems = workspace
    ? [
        {
          href: "#evidence-sufficiency",
          eyebrow: "先看缺什麼",
          title: "充分性摘要與高影響缺口",
          copy: "先判斷目前案件缺的是什麼，再決定要補件、回工作紀錄，還是去看交付物。",
          meta: workspace.sufficiency_summary,
          tone: workspace.high_impact_gaps.length > 0 ? ("warm" as const) : ("accent" as const),
        },
        {
          href: "#evidence-supplement",
          eyebrow: "真的要補時",
          title: "補件與新增來源",
          copy: "需要補檔案、網址或補充文字時，直接走這條正式補件主鏈，不要另開新的孤立工作。",
          meta:
            progressionLane?.evidence_update_goal ||
            followUpLane?.evidence_update_goal ||
            (workspace.source_material_cards.length === 0
              ? "目前尚無正式來源材料。"
              : "補件後會直接掛回同一個案件世界。"),
          tone: "accent" as const,
        },
        {
          href: "#evidence-materials",
          eyebrow: "回看原始材料",
          title: "來源材料與工作物件",
          copy: "要核對材料角色、保留狀態與已連結輸出時，再展開這層詳細列表。",
          meta: `${workspace.source_material_cards.length} 份來源材料 / ${workspace.artifact_cards.length} 份工作物件`,
          tone: "default" as const,
        },
        {
          href: "#evidence-chains",
          eyebrow: "檢查支撐鏈",
          title: "證據支撐鏈",
          copy: "當你要確認某個建議、風險或交付物到底由哪些證據支撐，就往這裡下鑽。",
          meta: `${workspace.evidence_chains.length} 則證據支撐鏈`,
          tone: "default" as const,
        },
        {
          href: "#evidence-related-tasks",
          eyebrow: "回主線前",
          title: "相關工作紀錄",
          copy: "這些工作紀錄共同構成目前案件的證據世界，需要回主線推進時再回來對照。",
          meta: `${workspace.related_tasks.length} 筆相關工作紀錄`,
          tone: "default" as const,
        },
      ]
    : [];
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

  function setItemProgress(itemId: string, progress: IntakeItemProgressInfo) {
    setProgressByItemId((previous) => ({
      ...previous,
      [itemId]: progress,
    }));
  }

  function buildHandlingFromRuntimeItem(runtimeItem: {
    source_document: {
      support_level: string;
      ingest_status: string;
      ingest_strategy: string;
      metadata_only: boolean;
      ingestion_error: string | null;
    };
    source_material?: {
      support_level: string;
      ingest_status: string;
      ingest_strategy: string;
      metadata_only: boolean;
      ingestion_error?: string | null;
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
      context: remediationContext,
    });
  }

  async function processPendingPreviewItem(
    item: (typeof pendingPreviewItems)[number],
  ) {
    try {
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
        setItemProgress(item.id, progress);
        return progress;
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
        setItemProgress(item.id, progress);
        return progress;
      }

      setItemProgress(item.id, {
        phase: "uploading",
        label: "掛接中",
        detail: "這段補充文字正在掛回目前案件世界。",
        blocksSubmit: false,
        retryable: false,
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
      setItemProgress(item.id, progress);
      return progress;
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
      const progress = progressInfoFromRuntimeHandling(handling);
      setItemProgress(item.id, progress);
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
        ? "已取消這份材料的 reference 保留標記。"
        : "已標記這份材料可先以 reference-level 保留。",
    );
    setSupplementError(null);
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
    setSupplementMessage(null);
    setSupplementError(null);
    event.currentTarget.value = "";
  }

  function handleRemovePendingPreviewItem(itemId: string) {
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
    setSupplementMessage(null);
    setSupplementError(null);
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
            <span className="eyebrow">來源與證據工作面</span>
            <h1 className="page-title">{matterCard.title}</h1>
            <p className="page-subtitle">{matterCard.objectPath}</p>
            <div className="meta-row" style={{ marginTop: "16px" }}>
              <span>{workspace.source_material_cards.length} 份來源材料</span>
              <span>{workspace.artifact_cards.length} 份工作物件</span>
              <span>{workspace.evidence_chains.length} 則證據支撐鏈</span>
              <span>
                {labelForEngagementContinuityMode(workspace.matter_summary.engagement_continuity_mode)} /{" "}
                {labelForWritebackDepth(workspace.matter_summary.writeback_depth)}
              </span>
            </div>
            <div className="matter-hero-strip">
              <div>
                <span className="pill">決策問題</span>
                <p className="workspace-object-path" style={{ marginTop: "10px" }}>
                  {workspace.current_decision_context?.judgment_to_make ||
                    workspace.current_decision_context?.title ||
                    "目前尚未形成清楚的決策問題。"}
                </p>
                <p className="muted-text">{workspaceView.summary}</p>
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">{evidenceActionTitle}</h2>
                <p className="panel-copy">{evidenceActionSummary}</p>
              </div>
            </div>
            <div className="summary-grid">
              <div className="section-card">
                <h4>來源材料</h4>
                <p className="content-block">{workspace.source_material_cards.length} 份</p>
              </div>
              <div className="section-card">
                <h4>證據支撐鏈</h4>
                <p className="content-block">{workspace.evidence_chains.length} 則</p>
              </div>
              <div className="section-card">
                <h4>高影響缺口</h4>
                <p className="content-block">{workspace.high_impact_gaps.length} 個</p>
              </div>
              <div className="section-card">
                <h4>跨 slice 共享鏈</h4>
                <p className="content-block">{sharedContinuitySummary}</p>
              </div>
              {followUpLane ? (
                <>
                  <div className="section-card">
                    <h4>最新 checkpoint</h4>
                    <p className="content-block">
                      {followUpLane.latest_update?.summary || "尚未形成正式 checkpoint。"}
                    </p>
                  </div>
                  <div className="section-card">
                    <h4>上一個 checkpoint</h4>
                    <p className="content-block">
                      {followUpLane.previous_checkpoint?.summary || "目前還沒有上一輪 checkpoint 可對照。"}
                    </p>
                  </div>
                  <div className="section-card">
                    <h4>這次補件主要影響</h4>
                    <p className="content-block">
                      {followUpLane.evidence_update_goal || "先補齊這輪 follow-up 要更新的支撐鏈。"}
                    </p>
                  </div>
                  <div className="section-card">
                    <h4>下一步最建議做什麼</h4>
                    <p className="content-block">
                      {followUpLane.next_follow_up_actions[0] || "補完後回案件工作面更新這輪 checkpoint。"}
                    </p>
                  </div>
                </>
              ) : null}
              {progressionLane ? (
                <>
                  <div className="section-card">
                    <h4>最新 progression</h4>
                    <p className="content-block">
                      {progressionLane.latest_progression?.summary || "目前還沒有 progression update。"}
                    </p>
                  </div>
                  <div className="section-card">
                    <h4>下一步最建議做什麼</h4>
                    <p className="content-block">
                      {progressionLane.next_progression_actions[0] || "回案件工作面更新 progression。"}
                    </p>
                  </div>
                </>
              ) : null}
            </div>
            <ul className="list-content" style={{ marginTop: "16px" }}>
              {evidenceActionChecklist.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className="button-row" style={{ marginTop: "16px" }}>
              {workspace?.matter_summary.engagement_continuity_mode === "one_off" &&
              workspace.matter_summary.status === "closed" ? (
                <Link className="button-primary" href={`/matters/${matterId}#continuation-actions`}>
                  先重新開啟案件
                </Link>
              ) : (
                <Link className="button-primary" href="#evidence-supplement">
                  先補件
                </Link>
              )}
              {focusTask ? (
                <Link className="button-secondary" href={`/tasks/${focusTask.id}`}>
                  打開焦點工作紀錄
                </Link>
              ) : null}
              {focusTask?.latest_deliverable_id ? (
                <Link
                  className="button-secondary"
                  href={`/deliverables/${focusTask.latest_deliverable_id}`}
                >
                  打開最新交付物
                </Link>
              ) : null}
              <Link className="button-secondary" href={`/matters/${matterId}`}>
                返回案件工作面
              </Link>
            </div>
          </section>

          <WorkspaceSectionGuide
            title="這個證據工作面怎麼讀最快"
            description="先看充分性與缺口，再決定是否補件。全量來源清單、證據支撐鏈與相關工作紀錄都放在後面，需要時再展開。"
            items={evidenceSectionGuideItems}
          />

          <section className="panel section-anchor" id="evidence-sufficiency">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">補件判斷</h2>
                <p className="panel-copy">
                  日常使用先只看目前夠不夠、缺什麼、會影響什麼；證據期待、限制與連續性都改成需要時再展開。
                </p>
              </div>
            </div>
            <div className="summary-grid">
              <div className="section-card">
                <h4>充分性摘要</h4>
                <p className="content-block">{workspace.sufficiency_summary}</p>
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
            title="Research provenance 與 evidence gap records"
            description="只有在你要 debug 這輪外部補完是怎麼進入 evidence chain、或確認哪些 gaps 已被正式記錄時，再展開這層。"
          >
            <div className="summary-grid">
              <div className="section-card">
                <h4>Research runs</h4>
                <CompactList
                  items={workspace.research_runs.map((item) => `${item.query}｜${item.result_summary || item.status}`)}
                  emptyText="目前沒有 research provenance。"
                />
              </div>
              <div className="section-card">
                <h4>Evidence gap records</h4>
                <CompactList
                  items={workspace.evidence_gaps.map((item) => `${item.title}：${item.description}`)}
                  emptyText="目前沒有已記錄的 evidence gaps。"
                />
              </div>
            </div>
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
              {followUpLane ? (
                <div className="summary-grid">
                  <div className="section-card">
                    <h4>最新更新（latest update）</h4>
                    <p className="content-block">
                      {followUpLane.latest_update?.summary || "目前還沒有正式 latest update。"}
                    </p>
                  </div>
                  <div className="section-card">
                    <h4>上一個 checkpoint</h4>
                    <p className="content-block">
                      {followUpLane.previous_checkpoint?.summary || "目前還沒有 previous checkpoint 可比較。"}
                    </p>
                  </div>
                  <div className="section-card">
                    <h4>這次差異（what changed）</h4>
                    <p className="content-block">
                      {followUpLane.what_changed[0] || "這輪主要是在延續既有 checkpoint，補強判斷基礎。"}
                    </p>
                  </div>
                  <div className="section-card">
                    <h4>下一步建議（next follow-up action）</h4>
                    <p className="content-block">
                      {followUpLane.next_follow_up_actions[0] || "補完之後回案件工作面更新 checkpoint。"}
                    </p>
                  </div>
                  <div className="section-card">
                    <h4>這次補件要補哪個缺口</h4>
                    <p className="content-block">
                      {followUpLane.evidence_update_goal || "這次補件主要是為了補強最新 follow-up 更新的判斷基礎。"}
                    </p>
                  </div>
                  <div className="section-card">
                    <h4>目前最顯著的 evidence gap</h4>
                    <p className="content-block">
                      {workspace.high_impact_gaps[0] || "目前沒有額外高影響缺口，補件可先圍繞最近更新做精修。"}
                    </p>
                  </div>
                </div>
              ) : null}
              {progressionLane ? (
                <div className="summary-grid">
                  <div className="section-card">
                    <h4>最新 progression（latest progression）</h4>
                    <p className="content-block">
                      {progressionLane.latest_progression?.summary || "目前還沒有 progression update。"}
                    </p>
                  </div>
                  <div className="section-card">
                    <h4>上一個 progression snapshot</h4>
                    <p className="content-block">
                      {progressionLane.previous_progression?.summary || "目前還沒有更早的 progression snapshot。"}
                    </p>
                  </div>
                  <div className="section-card">
                    <h4>這次差異（what changed）</h4>
                    <p className="content-block">
                      {progressionLane.what_changed[0] || "這輪主要是在延續既有 progression 基線。"}
                    </p>
                  </div>
                  <div className="section-card">
                    <h4>下一步建議（next progression action）</h4>
                    <p className="content-block">
                      {progressionLane.next_progression_actions[0] || "回案件工作面更新 progression。"}
                    </p>
                  </div>
                  <div className="section-card">
                    <h4>這次補件要驗證什麼</h4>
                    <p className="content-block">
                      {progressionLane.evidence_update_goal || "這次補件主要是為了補強 continuous progression 的下一步判斷基礎。"}
                    </p>
                  </div>
                  <div className="section-card">
                    <h4>會影響哪個 action / outcome</h4>
                    <p className="content-block">
                      {progressionLane.action_states[0]?.summary || progressionLane.outcome_signals[0] || "目前還沒有可顯示的 action / outcome 影響摘要。"}
                    </p>
                  </div>
                </div>
              ) : null}

              <div className="field">
                <label htmlFor="matter-files">上傳檔案</label>
                <input
                  id="matter-files"
                  type="file"
                  multiple
                  accept=".md,.txt,.docx,.xlsx,.csv,.pdf,.jpg,.jpeg,.png,.webp,text/plain,text/markdown,text/csv,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                />
                <input
                  ref={fileReplaceInputRef}
                  type="file"
                  accept=".md,.txt,.docx,.xlsx,.csv,.pdf,.jpg,.jpeg,.png,.webp,text/plain,text/markdown,text/csv,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/jpeg,image/png,image/webp"
                  style={{ display: "none" }}
                  onChange={handleReplaceFileSelection}
                />
                <small>支援一次掛多份材料；若同一內容重複上傳，storage 會先走 digest 邊界。</small>
              </div>

              <div className="field">
                <label htmlFor="matter-urls">網址</label>
                <textarea
                  id="matter-urls"
                  value={urlsText}
                  onChange={(event) => {
                    setUrlsText(event.target.value);
                    setProgressByItemId({});
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
                <IntakeMaterialPreviewList
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
                <small>
                  補件材料會逐項顯示限制、影響、blocking 與下一步動作；若這輪有 retryable failure，也可直接在 item 上重試。
                </small>
              </div>

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
                      MD、TXT、DOCX、XLSX、CSV、text-based PDF、URL、補充文字
                    </p>
                  </div>
                  <div className="section-card">
                    <h4>有限支援</h4>
                    <p className="content-block">
                      JPG / JPEG、PNG、WEBP、掃描型 PDF 目前只建立 metadata / reference，不預設 OCR。
                    </p>
                  </div>
                  <div className="section-card">
                    <h4>原始檔保留</h4>
                    <p className="content-block">
                      原始進件檔預設短期保存；正式 artifact 保留較久，但 publish / audit record 不會跟著 raw file 一起消失。
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
              <DisclosurePanel
                id="evidence-materials"
                title="來源材料"
                description="這裡列出目前案件世界內可直接回看的來源材料。平常先看上方摘要，需要核對材料角色、保留狀態與支撐數量時再展開。"
              >
                <p className="panel-copy" style={{ marginBottom: "16px" }}>
                  若卡片上仍顯示某筆 task 連結，那是相容層入口，方便你回到相關工作紀錄；不代表這份材料只屬於那筆 task。
                </p>
                <div className="detail-list">
                  {workspace.source_material_cards.length > 0 ? (
                    workspace.source_material_cards.map((item) => {
                      const handling = describeRuntimeMaterialHandling({
                        supportLevel: item.support_level,
                        ingestStatus: item.ingest_status,
                        ingestStrategy: item.ingest_strategy,
                        metadataOnly: item.metadata_only,
                        ingestionError: item.ingestion_error,
                        context: remediationContext,
                      });
                      return (
                        <div className="detail-item" key={item.object_id}>
                          <div className="meta-row">
                            <span className="pill">{item.role_label}</span>
                            <span>{labelForPresenceState(item.presence_state)}</span>
                            <span className={`intake-status-pill intake-status-${handling.status}`}>
                              {handling.statusLabel}
                            </span>
                            <span>{formatDisplayDate(item.created_at)}</span>
                          </div>
                          <h3>{item.title}</h3>
                          <p className="muted-text">
                            {labelForSourceType(item.source_type || "manual_input")}
                            {item.file_extension ? `｜${labelForFileExtension(item.file_extension)}` : ""}
                            {item.file_size ? `｜${formatFileSize(item.file_size)}` : ""}
                            {item.source_ref ? `｜${item.source_ref}` : ""}
                          </p>
                          <p className="content-block">{item.summary || "目前沒有可顯示的來源摘要。"}</p>
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
                            <strong>會影響什麼：</strong>
                            {handling.impactDetail}
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
                          <Link className="back-link" href="#evidence-supplement">
                            回補件入口處理這份材料
                          </Link>
                          <div className="meta-row">
                            <span>{item.linked_evidence_count} 則已連結證據</span>
                            <span>{item.linked_output_count} 項已連結輸出</span>
                            {item.participation_task_count > 1 ? (
                              <span>共享於 {item.participation_task_count} 個 work slices</span>
                            ) : null}
                            {item.mapping_mode === "explicit_mapping" &&
                            item.canonical_owner_scope === "world_canonical" ? (
                              <span>案件世界正式鏈</span>
                            ) : null}
                            {item.mapping_mode === "compatibility_task_ref" ? (
                              <span>相容層 task ref</span>
                            ) : null}
                            <span>{labelForSourceIngestStrategy(item.ingest_strategy)}</span>
                            <span>{labelForStorageAvailability(item.availability_state)}</span>
                          </div>
                          <div className="meta-row">
                            <span>{labelForRetentionPolicy(item.retention_policy)}</span>
                            <span>{labelForRetentionState(item.purge_at)}</span>
                            {item.purge_at ? <span>預計清理：{formatDisplayDate(item.purge_at)}</span> : null}
                          </div>
                          <Link className="back-link" href={`/tasks/${item.task_id}`}>
                            打開來源工作紀錄：{item.task_title}
                          </Link>
                        </div>
                      );
                    })
                  ) : (
                    <p className="empty-text">目前還沒有可顯示的來源材料。</p>
                  )}
                </div>
              </DisclosurePanel>

              <DisclosurePanel
                title="工作物件"
                description="這些是已正式進入來源 / 證據工作面的工作物件，不是原始附件清單。需要核對 artifact 角色時再展開。"
              >
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
                        <p className="content-block">{item.summary || "目前沒有額外工作物件摘要。"}</p>
                        <div className="meta-row">
                          <span>{item.linked_evidence_count} 則已連結證據</span>
                          <span>{item.linked_output_count} 項已連結輸出</span>
                          {item.participation_task_count > 1 ? (
                            <span>共享於 {item.participation_task_count} 個 work slices</span>
                          ) : null}
                          {item.mapping_mode === "explicit_mapping" &&
                          item.canonical_owner_scope === "world_canonical" ? (
                            <span>案件世界正式鏈</span>
                          ) : null}
                          {item.mapping_mode === "compatibility_task_ref" ? (
                            <span>相容層 task ref</span>
                          ) : null}
                        </div>
                        <Link className="back-link" href={`/tasks/${item.task_id}`}>
                          打開來源工作紀錄：{item.task_title}
                        </Link>
                      </div>
                    ))
                  ) : (
                    <p className="empty-text">目前還沒有可顯示的工作物件。</p>
                  )}
                </div>
              </DisclosurePanel>
            </div>

            <div className="detail-stack">
              <DisclosurePanel
                id="evidence-chains"
                title="證據支撐鏈"
                description="這裡正式顯示證據對建議 / 風險 / 行動的支撐鏈。平常先看上方摘要，需要逐條核對支撐關係時再展開。"
              >
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
                          {item.source_material_title ? `來源材料：${item.source_material_title}` : "尚未連到來源材料"}
                          {"｜"}
                          {item.artifact_title ? `工作物件：${item.artifact_title}` : "尚未連到工作物件"}
                        </p>
                        <p className="content-block">{item.evidence.excerpt_or_summary}</p>
                        <p className="muted-text">{item.sufficiency_note}</p>
                        {buildEvidenceIssueGuidance({
                          evidenceType: item.evidence.evidence_type,
                          workflowLayer: continuationSurface?.workflow_layer,
                          updateGoal:
                            progressionLane?.evidence_update_goal ||
                            followUpLane?.evidence_update_goal,
                        }) ? (
                          <p className="muted-text">
                            <strong>補救導引：</strong>
                            {buildEvidenceIssueGuidance({
                              evidenceType: item.evidence.evidence_type,
                              workflowLayer: continuationSurface?.workflow_layer,
                              updateGoal:
                                progressionLane?.evidence_update_goal ||
                                followUpLane?.evidence_update_goal,
                            })}
                          </p>
                        ) : null}

                        {item.linked_recommendations.length > 0 ? (
                          <div style={{ marginTop: "12px" }}>
                            <h3>支撐的建議</h3>
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
                            <h3>支撐的風險</h3>
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
                            <h3>支撐的行動項目</h3>
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
                            <h3>用於交付物</h3>
                            <ul className="list-content">
                              {item.linked_deliverables.map((target) => (
                                <li key={`${item.evidence.id}-deliverable-${target.target_id}`}>
                                  {target.target_id ? (
                                    <Link className="back-link" href={`/deliverables/${target.target_id}`}>
                                      {target.title}
                                    </Link>
                                  ) : (
                                    target.title
                                  )}
                                  {target.note ? `｜${target.note}` : ""}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}

                        <Link className="back-link" href={`/tasks/${item.evidence.task_id}`}>
                          打開來源工作紀錄：{item.task_title}
                        </Link>
                      </div>
                    ))
                  ) : (
                    <p className="empty-text">目前還沒有可顯示的證據支撐鏈。</p>
                  )}
                </div>
              </DisclosurePanel>

              <DisclosurePanel
                id="evidence-related-tasks"
                title="這個工作面中的相關工作紀錄"
                description="這些工作紀錄共同構成目前的來源 / 證據世界。需要回主線推進或對照哪筆工作產出了哪些證據時，再展開。"
              >
                <div className="history-list">
                  {workspace.related_tasks.length > 0 ? (
                    workspace.related_tasks.map((task) => (
                      <Link href={`/tasks/${task.id}`} key={task.id} className="history-item">
                        <div className="meta-row">
                          <span className="pill">{labelForTaskStatus(task.status)}</span>
                          <span>{task.evidence_count} 則證據</span>
                          <span>{task.deliverable_count} 份交付物</span>
                        </div>
                        <h3>{task.title}</h3>
                        <p className="muted-text">
                          {task.decision_context_title || task.description || "目前沒有可顯示的決策問題。"}
                        </p>
                      </Link>
                    ))
                  ) : (
                    <p className="empty-text">目前沒有可顯示的相關工作紀錄。</p>
                  )}
                </div>
              </DisclosurePanel>
            </div>
          </div>
        </>
      ) : null}
    </main>
  );
}
