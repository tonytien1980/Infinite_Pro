"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { IntakeMaterialPreviewList } from "@/components/intake-material-preview-list";
import { createTask, ingestTaskSources, uploadTaskFiles } from "@/lib/api";
import {
  CONSULTANT_START_OPTIONS,
  labelForConsultantStartMode,
  resolveWorkflowValueForConsultingStart,
  type ConsultantStartMode,
} from "@/lib/flagship-lane";
import {
  appendSelectedFiles,
  buildIntakePreviewItems,
  countIntakeMaterialUnits,
  describeRuntimeMaterialHandling,
  type IntakeSessionItemState,
  type IntakeItemProgressInfo,
  inferInputEntryModeFromMaterialUnits,
  latestAttemptDetailFromHandling,
  MAX_INTAKE_MATERIAL_UNITS,
  previewItemBlocksSubmit,
  progressInfoFromRuntimeHandling,
  summarizeBatchProgress,
} from "@/lib/intake";
import type {
  EngagementContinuityMode,
  ExternalDataStrategy,
  InputEntryMode,
  TaskAggregate,
  TaskCreatePayload,
  WritebackDepth,
} from "@/lib/types";

interface TaskCreateFormProps {
  onCreated: (task: TaskAggregate) => void;
}

const FLOW_OPTIONS = [
  {
    value: "research_synthesis",
    label: "研究綜整",
    mode: "specialist",
    taskType: "research_synthesis",
    description: "適合先把資料整理成摘要、關鍵發現、洞察與建議。",
  },
  {
    value: "contract_review",
    label: "合約審閱",
    mode: "specialist",
    taskType: "contract_review",
    description: "適合快速辨識高風險條款、審閱議題與修改建議方向。",
  },
  {
    value: "document_restructuring",
    label: "文件重構",
    mode: "specialist",
    taskType: "document_restructuring",
    description: "適合把草稿整理成更清楚的新版結構、改寫重點與交付骨架。",
  },
  {
    value: "multi_agent",
    label: "多代理收斂",
    mode: "multi_agent",
    taskType: "complex_convergence",
    description: "適合把複雜決策問題交給系統協調多個核心代理一起收斂。",
  },
] as const;

type FlowOption = (typeof FLOW_OPTIONS)[number];
type WorkflowPreference = "auto" | FlowOption["value"];

const EXTERNAL_DATA_STRATEGY_OPTIONS: Array<{
  value: ExternalDataStrategy;
  label: string;
  description: string;
}> = [
  {
    value: "strict",
    label: "不用，我只想用我提供的資料",
    description: "系統不會主動補外部搜尋，只使用你手動附加的內容、網址與檔案。",
  },
  {
    value: "supplemental",
    label: "可以補充資料",
    description: "由系統判斷目前證據是否不足，必要時再補外部搜尋來源。",
  },
  {
    value: "latest",
    label: "幫我找最新的資訊",
    description: "系統會優先補外部搜尋來源，適合需要最新公開資訊的研究任務。",
  },
];

const INPUT_MODE_OPTIONS: Array<{
  value: InputEntryMode;
  label: string;
  description: string;
}> = [
  {
    value: "one_line_inquiry",
    label: "一句話起手",
    description: "只有主問題、沒有材料時，系統會先用少資訊起手。",
  },
  {
    value: "single_document_intake",
    label: "單材料起手",
    description: "已有 1 份材料時，不論是檔案、URL 或補充文字，都會先以單材料起手。",
  },
  {
    value: "multi_material_case",
    label: "多來源案件",
    description: "已有 2 到 10 份材料或混合來源時，系統會先用多來源案件起手。",
  },
];

const CONTINUITY_MODE_OPTIONS: Array<{
  value: EngagementContinuityMode;
  label: string;
  description: string;
}> = [
  {
    value: "one_off",
    label: "單次案件",
    description: "適合正式結案型案件：保留最小歷史、證據基礎與交付物脈絡，不強迫持續追蹤。",
  },
  {
    value: "follow_up",
    label: "可追蹤後續案件",
    description: "適合輕量後續案件：保留決策檢查點與里程碑更新，但不要求完整的行動－結果閉環。",
  },
  {
    value: "continuous",
    label: "持續追蹤案件",
    description: "適合長期推進案件：才會保留較完整的 decision -> action -> outcome 寫回痕跡。",
  },
];

const WRITEBACK_DEPTH_OPTIONS: Array<{
  value: WritebackDepth;
  label: string;
  description: string;
}> = [
  {
    value: "minimal",
    label: "最小寫回",
    description: "保留歷史、證據基礎與交付物脈絡，適合單次案件正式結案。",
  },
  {
    value: "milestone",
    label: "里程碑寫回",
    description: "在最小寫回上再保留決策檢查點與里程碑節點，適合後續案件。",
  },
  {
    value: "full",
    label: "完整閉環寫回",
    description: "會追蹤決策、行動執行與結果紀錄，適合持續追蹤案件。",
  },
];

const INPUT_MODE_GUIDANCE: Record<
  InputEntryMode,
  {
    requirement: string;
    workflowNote: string;
    materialHint: string;
    submitLabel: string;
  }
> = {
  one_line_inquiry: {
    requirement: "目前只有主問題，系統會先用少資訊起手。",
    workflowNote: "這輪會先建立正式案件主線，不要求你先準備材料。",
    materialHint: "你可以先空手開案，之後再到案件世界補檔案、網址或補充文字。",
    submitLabel: "建立案件",
  },
  single_document_intake: {
    requirement: "目前偵測到 1 份材料，會先以單材料起手。",
    workflowNote: "這份材料可以是檔案、URL 或補充文字；系統會先把它掛回同一個案件世界。",
    materialHint: "單材料不等於單文件；任何一種正式支援的單一材料都成立。",
    submitLabel: "建立案件",
  },
  multi_material_case: {
    requirement: `目前偵測到多份材料，會先用多來源案件起手。單次最多 ${MAX_INTAKE_MATERIAL_UNITS} 份。`,
    workflowNote: "所有材料都會進到同一個案件世界，不拆成互不相容的子流程。",
    materialHint: "可混合檔案、網址與補充文字；如果超過 10 份，請分批補件。",
    submitLabel: "建立案件並掛接材料",
  },
};

function labelForExternalDataStrategy(value: ExternalDataStrategy) {
  return (
    EXTERNAL_DATA_STRATEGY_OPTIONS.find((item) => item.value === value)?.label ??
    EXTERNAL_DATA_STRATEGY_OPTIONS[1].label
  );
}

function defaultContinuityModeForInputMode(
  inputMode: InputEntryMode,
): EngagementContinuityMode {
  return inputMode === "one_line_inquiry" ? "one_off" : "follow_up";
}

function defaultWritebackDepthForInputMode(inputMode: InputEntryMode): WritebackDepth {
  return inputMode === "one_line_inquiry" ? "minimal" : "milestone";
}

function deriveTaskTitle(description: string) {
  const normalized = description.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return "";
  }

  const headline = normalized.split(/[。！？!?]/)[0]?.trim() || normalized;
  return headline.length <= 36 ? headline : `${headline.slice(0, 36)}...`;
}

function inferClientStage(description: string) {
  const signalText = description.toLowerCase();
  if (/(創業|新創|起步|早期|驗證|pmf)/i.test(signalText)) {
    return "創業階段";
  }
  if (/(制度化|流程|sop|內控|管理|團隊)/i.test(signalText)) {
    return "制度化階段";
  }
  if (/(規模化|擴張|成長|跨部門|授權|scale)/i.test(signalText)) {
    return "規模化階段";
  }
  return undefined;
}

function inferClientType(description: string) {
  const signalText = description.toLowerCase();
  if (/(自媒體|內容|頻道|podcast|newsletter|社群)/i.test(signalText)) {
    return "自媒體";
  }
  if (/(個人品牌|教練|顧問|講師|服務型)/i.test(signalText)) {
    return "個人品牌與服務";
  }
  if (/(大型企業|集團|總部|enterprise|上市|跨國)/i.test(signalText)) {
    return "大型企業";
  }
  if (/(公司|企業|品牌|團隊|中小企業)/i.test(signalText)) {
    return "中小企業";
  }
  return undefined;
}

function inferDomainLenses({
  description,
  subjectName,
  flowValue,
}: {
  description: string;
  subjectName: string;
  flowValue: FlowOption["value"];
}) {
  const signalText = `${description} ${subjectName}`.toLowerCase();
  const lenses: string[] = [];

  if (flowValue === "contract_review" || /(合約|契約|條款|法務|責任|權利)/i.test(signalText)) {
    lenses.push("法務");
  }
  if (/(營運|流程|效率|交付|執行|供應鏈)/i.test(signalText)) {
    lenses.push("營運");
  }
  if (/(財務|現金流|預算|成本|損益)/i.test(signalText)) {
    lenses.push("財務");
  }
  if (/(募資|投資人|term sheet|融資|cap table)/i.test(signalText)) {
    lenses.push("募資");
  }
  if (/(行銷|品牌|內容|流量|社群|campaign)/i.test(signalText)) {
    lenses.push("行銷");
  }
  if (/(銷售|業務|pipeline|proposal|提案|成交)/i.test(signalText)) {
    lenses.push("銷售");
  }
  if (/(組織|人力|團隊|招募|人才|管理|ownership|org)/i.test(signalText)) {
    lenses.push("組織人力");
  }
  if (/(產品|服務|方案|定價|sku|offer|package|value proposition)/i.test(signalText)) {
    lenses.push("產品服務");
  }

  return lenses.length > 0 ? Array.from(new Set(lenses)) : ["綜合"];
}

function buildConsultantBrief({
  consultantStartLabel,
  flowLabel,
  inputModeLabel,
  title,
  description,
  subjectName,
  analysisDepth,
  assumptions,
  scopeNotes,
  targetReader,
  externalDataStrategy,
}: {
  consultantStartLabel: string;
  flowLabel: string;
  inputModeLabel: string;
  title: string;
  description: string;
  subjectName: string;
  analysisDepth: string;
  assumptions: string;
  scopeNotes: string;
  targetReader: string;
  externalDataStrategy: ExternalDataStrategy;
}) {
  return [
    `顧問起手方式：${consultantStartLabel}`,
    `正式進件模式：${inputModeLabel}`,
    `系統內部流程：${flowLabel}`,
    `任務名稱：${title.trim()}`,
    `核心問題：${description.trim()}`,
    subjectName.trim() ? `分析對象：${subjectName.trim()}` : "",
    `外部資料使用方式：${labelForExternalDataStrategy(externalDataStrategy)}`,
    analysisDepth.trim() ? `希望這份分析做到的程度：${analysisDepth.trim()}` : "",
    assumptions.trim() ? `已確定的假設：${assumptions.trim()}` : "",
    scopeNotes.trim() ? `研究範圍 / 排除範圍：${scopeNotes.trim()}` : "",
    targetReader.trim() ? `目標讀者：${targetReader.trim()}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function TaskCreateForm({ onCreated }: TaskCreateFormProps) {
  const [consultantStartMode, setConsultantStartMode] =
    useState<ConsultantStartMode>("diagnostic_start");
  const [workflowPreference, setWorkflowPreference] = useState<WorkflowPreference>("auto");
  const [description, setDescription] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [urlsText, setUrlsText] = useState("");
  const [pastedContent, setPastedContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [externalDataStrategy, setExternalDataStrategy] =
    useState<ExternalDataStrategy>("supplemental");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [continuityMode, setContinuityMode] = useState<EngagementContinuityMode>("one_off");
  const [writebackDepth, setWritebackDepth] = useState<WritebackDepth>("minimal");
  const [continuityManuallyTouched, setContinuityManuallyTouched] = useState(false);
  const [writebackManuallyTouched, setWritebackManuallyTouched] = useState(false);
  const [analysisDepth, setAnalysisDepth] = useState("");
  const [constraintInput, setConstraintInput] = useState("");
  const [assumptions, setAssumptions] = useState("");
  const [scopeNotes, setScopeNotes] = useState("");
  const [targetReader, setTargetReader] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [createdTask, setCreatedTask] = useState<TaskAggregate | null>(null);
  const [progressByItemId, setProgressByItemId] = useState<
    Record<string, IntakeItemProgressInfo>
  >({});
  const [keepAsReferenceByItemId, setKeepAsReferenceByItemId] = useState<
    Record<string, boolean>
  >({});
  const [replaceTargetId, setReplaceTargetId] = useState<string | null>(null);
  const [sessionItemStates, setSessionItemStates] = useState<IntakeSessionItemState[]>([]);
  const fileReplaceInputRef = useRef<HTMLInputElement | null>(null);
  const urlFieldRef = useRef<HTMLTextAreaElement | null>(null);
  const pastedTextFieldRef = useRef<HTMLTextAreaElement | null>(null);

  const resolvedFlowValue =
    workflowPreference === "auto"
      ? resolveWorkflowValueForConsultingStart(
          consultantStartMode,
          [description, subjectName, urlsText, pastedContent, ...files.map((file) => file.name)].join(" "),
        )
      : workflowPreference;
  const flow = FLOW_OPTIONS.find((item) => item.value === resolvedFlowValue) ?? FLOW_OPTIONS[0];
  const derivedTitle = useMemo(() => deriveTaskTitle(description), [description]);
  const normalizedUrls = useMemo(
    () =>
      urlsText
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
    [urlsText],
  );
  const hasPastedContent = Boolean(pastedContent.trim());
  const materialUnitCount = countIntakeMaterialUnits({
    fileCount: files.length,
    urlCount: normalizedUrls.length,
    hasPastedText: hasPastedContent,
  });
  const previewItems = useMemo(
    () =>
      buildIntakePreviewItems({
        files,
        urls: normalizedUrls,
        pastedText: pastedContent,
        context: { lane: "intake" },
      }),
    [files, normalizedUrls, pastedContent],
  );
  const inputMode = inferInputEntryModeFromMaterialUnits(materialUnitCount);
  const selectedInputMode =
    INPUT_MODE_OPTIONS.find((option) => option.value === inputMode) ?? INPUT_MODE_OPTIONS[0];
  const inputModeGuidance = INPUT_MODE_GUIDANCE[inputMode];
  const needsProblemStatement = !description.trim();
  const materialLimitExceeded = materialUnitCount > MAX_INTAKE_MATERIAL_UNITS;
  const blockingItems = previewItems.filter((item) => previewItemBlocksSubmit(item));
  const batchSummary = useMemo(
    () =>
      summarizeBatchProgress({
        items: previewItems,
        progressByItemId,
        keepAsReferenceByItemId,
        sessionStates: sessionItemStates,
      }),
    [keepAsReferenceByItemId, previewItems, progressByItemId, sessionItemStates],
  );
  const recentAttemptItems = useMemo(
    () =>
      [...sessionItemStates]
        .filter((item) => (item.progress.attemptCount ?? 0) > 0 || item.progress.latestAttemptLabel)
        .sort((left, right) => (right.progress.lastUpdatedAt ?? 0) - (left.progress.lastUpdatedAt ?? 0))
        .slice(0, 4),
    [sessionItemStates],
  );
  const consultantBrief = useMemo(
    () =>
      buildConsultantBrief({
        consultantStartLabel: labelForConsultantStartMode(consultantStartMode),
        flowLabel: flow.label,
        inputModeLabel: selectedInputMode.label,
        title: derivedTitle,
        description,
        subjectName,
        analysisDepth,
        assumptions,
        scopeNotes,
        targetReader,
        externalDataStrategy,
      }),
    [
      analysisDepth,
      assumptions,
      consultantStartMode,
      description,
      externalDataStrategy,
      flow.label,
      selectedInputMode.label,
      scopeNotes,
      subjectName,
      targetReader,
      derivedTitle,
    ],
  );

  useEffect(() => {
    if (!continuityManuallyTouched) {
      setContinuityMode(defaultContinuityModeForInputMode(inputMode));
    }
    if (!writebackManuallyTouched) {
      setWritebackDepth(defaultWritebackDepthForInputMode(inputMode));
    }
  }, [continuityManuallyTouched, inputMode, writebackManuallyTouched]);

  function handleRemovePreviewItem(itemId: string) {
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
    setSuccess(null);
    setError(null);
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
      setPastedContent("");
    }
  }

  function dropResolvedPreviewItems(itemIds: string[]) {
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
      setPastedContent("");
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

  function setItemProgress(itemId: string, progress: IntakeItemProgressInfo) {
    setProgressByItemId((previous) => ({
      ...previous,
      [itemId]: progress,
    }));
  }

  function rememberSessionItemState(
    item: (typeof previewItems)[number],
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
      context: { lane: "intake" },
    });
  }

  async function processPreviewItem(taskId: string, item: (typeof previewItems)[number]) {
    try {
      const nextAttemptCount =
        (progressByItemId[item.id]?.attemptCount ?? 0) + 1;
      if (item.kind === "file") {
        const index = Number(item.id.replace("file-", ""));
        const file = files[index];
        if (!file) {
          throw new Error("找不到要處理的檔案，請重新選取。");
        }
        setItemProgress(item.id, {
          phase: "uploading",
          label: "上傳中",
          detail: "這份檔案正在送出，稍後會回填最終 ingest 結果。",
          blocksSubmit: false,
          retryable: false,
          attemptCount: nextAttemptCount,
          latestAttemptLabel: `第 ${nextAttemptCount} 次處理：上傳中`,
          latestAttemptDetail: "系統正在送出這份檔案。",
          lastUpdatedAt: Date.now(),
        });
        const uploadResult = await uploadTaskFiles(taskId, [file]);
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
        const ingestResult = await ingestTaskSources(taskId, {
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
        detail: "這段補充文字正在掛回同一個案件世界。",
        blocksSubmit: false,
        retryable: false,
        attemptCount: nextAttemptCount,
        latestAttemptLabel: `第 ${nextAttemptCount} 次處理：掛接中`,
        latestAttemptDetail: "系統正在掛接這段補充文字。",
        lastUpdatedAt: Date.now(),
      });
      const ingestResult = await ingestTaskSources(taskId, {
        urls: [],
        pasted_text: pastedContent,
        pasted_title: pastedContent.trim() ? "手動貼上內容" : undefined,
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
          submitError instanceof Error ? submitError.message : "建立材料時發生未知錯誤。",
        context: { lane: "intake" },
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

  async function retryPreviewItem(item: (typeof previewItems)[number]) {
    if (!createdTask) {
      setError("案件世界尚未建立；請先建立案件，再重試這份材料。");
      return;
    }
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    const progress = await processPreviewItem(createdTask.id, item);
    if (progress.phase === "done" || progress.phase === "parsing") {
      dropResolvedPreviewItems([item.id]);
      setSuccess("這份材料已重新處理完成；你可以繼續補件，或直接打開案件工作台。");
    } else {
      setError("這份材料重試後仍未成功；建議改用替換、移除或 fallback 材料。");
    }
    setSubmitting(false);
  }

  function toggleKeepAsReference(item: (typeof previewItems)[number]) {
    setKeepAsReferenceByItemId((previous) => ({
      ...previous,
      [item.id]: !previous[item.id],
    }));
    setProgressByItemId((previous) => {
      const next = { ...previous };
      delete next[item.id];
      return next;
    });
    setError(null);
    setSuccess(
      keepAsReferenceByItemId[item.id]
        ? "已取消這份材料的參照保留標記。"
        : "已標記這份材料可先以參照層保留。",
    );
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

  function replacePreviewItem(item: (typeof previewItems)[number]) {
    if (item.kind === "file") {
      setReplaceTargetId(item.id);
      fileReplaceInputRef.current?.click();
      return;
    }
    if (item.kind === "url") {
      setError("這筆來源請直接回網址欄修正；修正後 item row 會立即刷新。");
      urlFieldRef.current?.focus();
      return;
    }
    setError("這段補充文字請直接回補充文字欄改寫；改寫後 item row 會立即刷新。");
    pastedTextFieldRef.current?.focus();
  }

  function handleReplaceFileSelection(event: React.ChangeEvent<HTMLInputElement>) {
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
    setError(null);
    setSuccess("已替換這份檔案；新的 item 會沿用同一列重新判斷狀態。");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    if (needsProblemStatement) {
      setSubmitting(false);
      setError("請至少補一句主問題，讓系統知道這批材料要幫你釐清什麼。");
      return;
    }

    if (materialLimitExceeded) {
      setSubmitting(false);
      setError(`單次建立案件最多只能帶入 ${MAX_INTAKE_MATERIAL_UNITS} 份材料；請先精簡，或建立後分批補件。`);
      return;
    }

    if (blockingItems.length > 0) {
      setSubmitting(false);
      setError("目前有無法成功進主鏈的材料；請先移除或修正，再建立案件。");
      return;
    }

    const payload: TaskCreatePayload = {
      title: derivedTitle,
      description,
      task_type: flow.taskType,
      mode: flow.mode,
      entry_preset: inputMode,
      external_data_strategy: externalDataStrategy,
      engagement_continuity_mode: continuityMode,
      writeback_depth: writebackDepth,
      client_type: inferClientType(description),
      client_stage: inferClientStage(description),
      engagement_name: derivedTitle || undefined,
      engagement_description: description || undefined,
      workstream_name: subjectName || flow.label,
      workstream_description: scopeNotes || undefined,
      domain_lenses: inferDomainLenses({
        description,
        subjectName,
        flowValue: flow.value,
      }),
      decision_title: derivedTitle ? `${derivedTitle}｜決策問題` : undefined,
      decision_summary: description || undefined,
      judgment_to_make: analysisDepth || undefined,
      background_text: consultantBrief,
      notes: [`正式進件模式：${selectedInputMode.label}`, inputModeGuidance.workflowNote]
        .filter(Boolean)
        .join("\n"),
      assumptions: assumptions || undefined,
      subject_name: subjectName || undefined,
      goal_description: analysisDepth || undefined,
      constraints: constraintInput
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => ({
          description: item,
          constraint_type: "general",
          severity: "medium",
        })),
      initial_source_urls: normalizedUrls,
      initial_pasted_text: pastedContent,
      initial_pasted_title: hasPastedContent ? "手動貼上內容" : undefined,
      initial_file_descriptors: files.map((file) => ({
        file_name: file.name,
        content_type: file.type || undefined,
        file_size: file.size,
      })),
    };

    try {
      const task = createdTask ?? (await createTask(payload));
      setCreatedTask(task);

      const itemsToProcess = previewItems.filter((item) => !previewItemBlocksSubmit(item));
      let failedCount = 0;
      const resolvedItemIds: string[] = [];

      for (const item of itemsToProcess) {
        const progress = await processPreviewItem(task.id, item);
        if (progress.phase === "failed") {
          failedCount += 1;
        } else {
          resolvedItemIds.push(item.id);
        }
      }

      dropResolvedPreviewItems(resolvedItemIds);

      if (failedCount > 0) {
        setSuccess(
          `案件世界已建立，但目前仍有 ${failedCount} 份材料待補救。你可以先逐項重試 / 替換，或直接打開案件工作台續處理。`,
        );
        return;
      }

      setSuccess("案件世界已先建立，所有材料也已逐項處理完成；接下來會直接回到案件工作台。");
      onCreated(task);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "建立任務失敗。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">統一進件入口</h2>
          <p className="panel-copy">
            先說明你要釐清的問題，再視需要補材料。系統會自動判讀這次是少資訊起手、單材料起手，還是多來源案件，全部都走同一條正式進件主線。
          </p>
        </div>
      </div>

      <form className="form-grid" onSubmit={handleSubmit}>
        <section className="intake-section">
          <div className="section-heading">
            <h3>統一進件入口</h3>
            <p>這裡只有一個可見進件入口。你先用顧問語言決定這次想怎麼開始，系統再安排較合適的分析起手方式。</p>
          </div>

          <div className="summary-grid">
            <div className="section-card">
              <h4>系統目前判讀</h4>
              <p className="content-block">
                {needsProblemStatement
                  ? "還缺一句主問題；請先說明你想釐清什麼，再建立案件。"
                  : `${selectedInputMode.label}｜${inputModeGuidance.requirement}`}
              </p>
            </div>
            <div className="section-card">
              <h4>工作流節奏</h4>
              <p className="content-block">{inputModeGuidance.workflowNote}</p>
            </div>
            <div className="section-card">
              <h4>材料規則</h4>
              <p className="content-block">
                {inputModeGuidance.materialHint} 同一批最多 {MAX_INTAKE_MATERIAL_UNITS} 份材料，之後仍可分批補件。
              </p>
            </div>
            <div className="section-card">
              <h4>案件連續性</h4>
              <p className="content-block">
                {CONTINUITY_MODE_OPTIONS.find((item) => item.value === continuityMode)?.label} /{" "}
                {WRITEBACK_DEPTH_OPTIONS.find((item) => item.value === writebackDepth)?.label}
              </p>
            </div>
          </div>

          <div className="section-heading" style={{ marginTop: "18px" }}>
            <h3>這次想怎麼開始</h3>
            <p>先選顧問工作上的起手方式，不需要先理解系統內部流程怎麼命名。</p>
          </div>

          <div className="summary-grid">
            {CONSULTANT_START_OPTIONS.map((option) => (
              <label
                key={option.value}
                className="section-card"
                style={
                  consultantStartMode === option.value
                    ? {
                        borderColor: "var(--accent-strong)",
                        boxShadow: "inset 0 0 0 1px var(--accent-strong)",
                      }
                    : undefined
                }
              >
                <input
                  type="radio"
                  name="consultant-start-mode"
                  value={option.value}
                  checked={consultantStartMode === option.value}
                  onChange={() => setConsultantStartMode(option.value)}
                  style={{ marginBottom: "12px" }}
                />
                <h4>{option.label}</h4>
                <p className="content-block">{option.description}</p>
                <p className="muted-text">{option.nextStepHint}</p>
              </label>
            ))}
          </div>
        </section>

        <section className="intake-section">
          <div className="section-heading">
            <h3>主問題</h3>
            <p>你現在要釐清什麼問題？請先描述你的疑問、案件或希望分析的事情，不要求你先有材料。</p>
          </div>

          <div className="field">
            <label htmlFor="task-description">核心問題</label>
            <textarea
              id="task-description"
              value={description}
              onChange={(event) => {
                setDescription(event.target.value);
                setError(null);
              }}
              placeholder="例如：我想釐清這份提案是否值得繼續投資、目前最大風險在哪裡、下一步應該先做什麼"
            />
            <small>系統會自動用你的問題生成任務名稱，並先用最合適的分析流程啟動。</small>
          </div>
        </section>

        <section className="intake-section">
          <div className="section-heading">
            <h3 style={{ fontSize: "1rem", marginBottom: "6px" }}>統一材料區</h3>
            <p style={{ marginTop: 0 }}>
              同一個區域可同時接收檔案、URL 與補充文字。正式支援：MD、TXT、DOCX、XLSX、CSV、可擷取文字的 PDF、URL、補充文字。XLSX / CSV 目前先做表格快照式抽取；若要判斷公式、欄位關係與脈絡，仍建議補欄位說明或文字摘要。有限支援：JPG / JPEG、PNG、WEBP、掃描型 PDF 目前只建立參照資訊，不預設 OCR。
            </p>
          </div>

          <div className="field">
            <label htmlFor="source-urls">網址</label>
            <textarea
              id="source-urls"
              value={urlsText}
              onChange={(event) => {
                setUrlsText(event.target.value);
                setProgressByItemId({});
                setSessionItemStates((previous) =>
                  previous.filter((entry) => !entry.itemId.startsWith("url-")),
                );
                setError(null);
                setSuccess(null);
              }}
              ref={urlFieldRef}
              placeholder={"每行一個網址，例如：\nhttps://example.com/article\nhttps://docs.google.com/document/d/..."}
            />
            <small>每個 URL 會算 1 份材料，可和檔案或補充文字混合成同一個案件起手。</small>
          </div>

          <div className="field">
            <label>上傳檔案</label>
            <label className="button-secondary file-input-trigger">
              選擇檔案
              <input
                id="source-files"
                className="file-input-trigger-control"
                type="file"
                multiple
                accept=".md,.txt,.docx,.xlsx,.csv,.pdf,.jpg,.jpeg,.png,.webp,text/plain,text/markdown,text/csv,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/jpeg,image/png,image/webp"
                onChange={(event) => {
                  setFiles((previous) =>
                    appendSelectedFiles(previous, Array.from(event.target.files ?? [])),
                  );
                  setProgressByItemId({});
                  setSessionItemStates((previous) =>
                    previous.filter((entry) => !entry.itemId.startsWith("file-")),
                  );
                  setError(null);
                  setSuccess(null);
                  event.currentTarget.value = "";
                }}
              />
            </label>
            <input
              ref={fileReplaceInputRef}
              className="visually-hidden-file-input"
              type="file"
              accept=".md,.txt,.docx,.xlsx,.csv,.pdf,.jpg,.jpeg,.png,.webp,text/plain,text/markdown,text/csv,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/jpeg,image/png,image/webp"
              onChange={handleReplaceFileSelection}
            />
            <small>檔案與 URL / 補充文字一起共用同一個 10 份上限；若超過，請先建立案件後再分批補件。</small>
          </div>

          <div className="field">
            <label htmlFor="source-paste">貼上內容</label>
            <textarea
              id="source-paste"
              value={pastedContent}
              onChange={(event) => {
                setPastedContent(event.target.value);
                setProgressByItemId({});
                setSessionItemStates((previous) =>
                  previous.filter((entry) => entry.itemId !== "text-0"),
                );
                setError(null);
                setSuccess(null);
              }}
              ref={pastedTextFieldRef}
              placeholder="直接貼上會議摘要、研究摘錄、內部筆記或任何可供分析的原始內容"
            />
            <small>補充文字會算 1 份材料，並作為正式來源材料掛回同一個案件。</small>
          </div>

          <div className="field">
            <label>目前待送出的材料</label>
            <IntakeMaterialPreviewList
              items={previewItems}
              progressByItemId={progressByItemId}
              keepAsReferenceByItemId={keepAsReferenceByItemId}
              onRemove={(item) => {
                handleRemovePreviewItem(item.id);
                setError(null);
                setSuccess(null);
              }}
              onRetry={createdTask ? retryPreviewItem : undefined}
              onReplace={replacePreviewItem}
              onKeepAsReference={toggleKeepAsReference}
              emptyText="你可以先只輸入一句問題；如果要帶材料，這裡會逐項列出檔案、URL 與補充文字。"
            />
            <small>每一份材料都會逐項顯示限制、影響、阻擋原因與下一步動作；若送出後有可重試失敗，也可直接在項目上重試。</small>
          </div>

          <div className="summary-grid">
            <div className="section-card">
              <h4>目前材料數</h4>
              <p className="content-block">
                {materialUnitCount} / {MAX_INTAKE_MATERIAL_UNITS} 份
              </p>
            </div>
            <div className="section-card">
              <h4>這批目前進度</h4>
              <p className="content-block">
                {batchSummary.total === 0
                  ? "尚未加入材料。"
                  : `已完成 ${batchSummary.completed} 份｜處理中/待解析 ${batchSummary.processing} 份｜失敗 ${batchSummary.failed} 份｜阻擋 ${batchSummary.blocking} 份`}
              </p>
            </div>
            <div className="section-card">
              <h4>材料組成</h4>
              <p className="content-block">
                {files.length} 份檔案 / {normalizedUrls.length} 個 URL / {hasPastedContent ? "1" : "0"} 段補充文字
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
              <h4>建立後可做什麼</h4>
              <p className="content-block">完成後會直接進入案件工作台，後續可在來源與證據工作面補檔、補網址、補文字，不會中斷同一案件脈絡。</p>
            </div>
            <div className="section-card">
              <h4>原始檔保留</h4>
              <p className="content-block">原始進件檔預設短期保存；正式工作物件保留較久，但發布與稽核紀錄不會跟著原始檔一起消失。</p>
            </div>
          </div>

          {recentAttemptItems.length > 0 ? (
            <div className="detail-list" style={{ marginTop: "16px" }}>
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

          {materialLimitExceeded ? (
            <p className="error-text" role="alert" aria-live="assertive">
              單次最多只能帶入 {MAX_INTAKE_MATERIAL_UNITS} 份材料；請先精簡，或建立後再分批補件。
            </p>
          ) : null}
          {!materialLimitExceeded && blockingItems.length > 0 ? (
            <p className="error-text" role="alert" aria-live="assertive">
              目前有 {blockingItems.length} 份材料無法成功進主鏈；請先移除或修正，再建立案件。
            </p>
          ) : null}

          <div className="field">
            <label htmlFor="external-data-strategy">需要系統幫你補充資料嗎？</label>
            <select
              id="external-data-strategy"
              value={externalDataStrategy}
              onChange={(event) =>
                setExternalDataStrategy(event.target.value as ExternalDataStrategy)
              }
            >
              {EXTERNAL_DATA_STRATEGY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <small>
              {
                EXTERNAL_DATA_STRATEGY_OPTIONS.find(
                  (option) => option.value === externalDataStrategy,
                )?.description
              }
            </small>
          </div>
        </section>

        <div className="button-row" style={{ justifyContent: "flex-start" }}>
          <button
            className="button-primary"
            type="submit"
            disabled={submitting || materialLimitExceeded || blockingItems.length > 0}
          >
            {submitting
              ? createdTask
                ? "續處理材料中..."
                : "建立案件中..."
              : createdTask
                ? "續處理剩餘材料"
                : inputModeGuidance.submitLabel}
          </button>
        </div>

        {error ? (
          <p className="error-text" role="alert" aria-live="assertive">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="success-text" role="status" aria-live="polite">
            {success}
          </p>
        ) : null}
        {createdTask ? (
          <div className="button-row" style={{ justifyContent: "flex-start" }}>
            <button
              className="button-secondary"
              type="button"
              onClick={() => onCreated(createdTask)}
            >
              打開已建立的案件工作台
            </button>
          </div>
        ) : null}

        <section className="intake-section">
          <div className="panel-header">
            <div>
              <h3 className="panel-title">進階設定（選填）</h3>
              <p className="panel-copy">只有在你想手動干預分析邏輯時再展開。預設情況下，Infinite Pro 會先自動判斷。</p>
            </div>
            <button
              className="button-secondary"
              type="button"
              onClick={() => setShowAdvanced((previous) => !previous)}
            >
              {showAdvanced ? "收合進階設定" : "展開進階設定"}
            </button>
          </div>

          {showAdvanced ? (
            <div className="detail-list">
              <div className="field">
                <label htmlFor="workflow-preference">進階執行方式</label>
                <select
                  id="workflow-preference"
                  value={workflowPreference}
                  onChange={(event) =>
                    setWorkflowPreference(event.target.value as WorkflowPreference)
                  }
                >
                  <option value="auto">自動判斷</option>
                  {FLOW_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <small>
                  {workflowPreference === "auto"
                    ? `目前顧問起手方式會自動對應為「${flow.label}」。${flow.description}`
                    : flow.description}
                </small>
              </div>

              <div className="field">
                <label htmlFor="continuity-mode">案件連續性策略</label>
                <select
                  id="continuity-mode"
                  value={continuityMode}
                  onChange={(event) => {
                    setContinuityMode(event.target.value as EngagementContinuityMode);
                    setContinuityManuallyTouched(true);
                  }}
                >
                  {CONTINUITY_MODE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <small>
                  {
                    CONTINUITY_MODE_OPTIONS.find(
                      (option) => option.value === continuityMode,
                    )?.description
                  }
                </small>
              </div>

              <div className="field">
                <label htmlFor="writeback-depth">寫回深度</label>
                <select
                  id="writeback-depth"
                  value={writebackDepth}
                  onChange={(event) => {
                    setWritebackDepth(event.target.value as WritebackDepth);
                    setWritebackManuallyTouched(true);
                  }}
                >
                  {WRITEBACK_DEPTH_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <small>
                  {
                    WRITEBACK_DEPTH_OPTIONS.find(
                      (option) => option.value === writebackDepth,
                    )?.description
                  }
                </small>
              </div>

              <div className="field">
                <label htmlFor="subject-name">分析對象（選填）</label>
                <input
                  id="subject-name"
                  value={subjectName}
                  onChange={(event) => setSubjectName(event.target.value)}
                  placeholder="例如：客戶、提案、某個市場、某份文件、某個決策主題"
                />
              </div>

              <div className="field">
                <label htmlFor="analysis-depth">你希望這份分析做到什麼程度？</label>
                <textarea
                  id="analysis-depth"
                  value={analysisDepth}
                  onChange={(event) => setAnalysisDepth(event.target.value)}
                  placeholder="例如：先形成一頁決策摘要，列出三個高優先建議、主要風險與建議下一步。"
                />
              </div>

              <div className="field">
                <label htmlFor="constraints-input">有沒有不能踩的限制或前提？</label>
                <textarea
                  id="constraints-input"
                  value={constraintInput}
                  onChange={(event) => setConstraintInput(event.target.value)}
                  placeholder={"例如：\n今天內要先交內部版本\n不能對外引用未確認數字\n法務還沒正式看過"}
                />
              </div>

              <div className="field">
                <label htmlFor="assumptions">有沒有已知假設？</label>
                <textarea
                  id="assumptions"
                  value={assumptions}
                  onChange={(event) => setAssumptions(event.target.value)}
                  placeholder="例如：先假設預算不增加、主要客群不變、時程以兩季內為主"
                />
              </div>

              <div className="field">
                <label htmlFor="scope-notes">是否有特定研究範圍或排除範圍？</label>
                <textarea
                  id="scope-notes"
                  value={scopeNotes}
                  onChange={(event) => setScopeNotes(event.target.value)}
                  placeholder="例如：只看市場訊號與競品，不含財務模型與法規細節"
                />
              </div>

              <div className="field">
                <label htmlFor="target-reader">目標讀者是誰？</label>
                <input
                  id="target-reader"
                  value={targetReader}
                  onChange={(event) => setTargetReader(event.target.value)}
                  placeholder="例如：合夥人、專案經理、客戶內部主管、法務窗口"
                />
              </div>
            </div>
          ) : null}
        </section>
      </form>
    </section>
  );
}
