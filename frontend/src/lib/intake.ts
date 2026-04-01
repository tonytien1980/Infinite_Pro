import type { InputEntryMode } from "@/lib/types";

export const MAX_INTAKE_MATERIAL_UNITS = 10;

const FULLY_SUPPORTED_EXTENSIONS = new Set([
  ".md",
  ".txt",
  ".docx",
  ".xlsx",
  ".csv",
]);
const LIMITED_SUPPORTED_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
]);
const UNSUPPORTED_EXTENSIONS = new Set([
  ".pptx",
  ".zip",
]);

export type IntakePreviewStatus =
  | "accepted"
  | "limited"
  | "pending"
  | "unsupported"
  | "issue";

export type IntakeDiagnosticCategory =
  | "accepted_full"
  | "accepted_limited_extraction"
  | "reference_only"
  | "parse_pending"
  | "format_unsupported"
  | "fetch_access_failure"
  | "empty_invalid_content"
  | "parse_failed";

interface IntakeDiagnosticInfo {
  diagnosticCategory: IntakeDiagnosticCategory;
  diagnosticLabel: string;
  likelyCauseDetail: string;
  usableScopeLabel: string;
  usableScopeDetail: string;
  retryabilityLabel: string;
  retryabilityDetail: string;
}

export interface IntakeMaterialPreviewItem extends IntakeDiagnosticInfo {
  id: string;
  kind: "file" | "url" | "text";
  kindLabel: string;
  index: number;
  title: string;
  metadata: string[];
  preview: string;
  status: IntakePreviewStatus;
  statusLabel: string;
  statusDetail: string;
  impactDetail: string;
  recommendedNextStep: string;
  fallbackStrategy: string | null;
}

export interface RuntimeMaterialHandlingSummary extends IntakeDiagnosticInfo {
  status: IntakePreviewStatus;
  statusLabel: string;
  statusDetail: string;
  impactDetail: string;
  recommendedNextStep: string;
  fallbackStrategy: string | null;
  retryable: boolean;
}

export interface MaterialRemediationContext {
  lane: "intake" | "one_off" | "follow_up" | "continuous" | "workspace";
  updateGoal?: string | null;
  nextAction?: string | null;
}

export type IntakeItemProgressPhase =
  | "ready"
  | "uploading"
  | "parsing"
  | "done"
  | "failed"
  | "blocked";

export interface IntakeItemProgressInfo {
  phase: IntakeItemProgressPhase;
  label: string;
  detail: string;
  blocksSubmit: boolean;
  retryable: boolean;
  referenceOnly?: boolean;
  attemptCount?: number;
  latestAttemptLabel?: string | null;
  latestAttemptDetail?: string | null;
  lastUpdatedAt?: number | null;
}

export interface IntakeSessionItemState {
  itemId: string;
  title: string;
  kindLabel: string;
  progress: IntakeItemProgressInfo;
}

export interface IntakeBatchProgressSummary {
  total: number;
  completed: number;
  processing: number;
  pending: number;
  failed: number;
  blocking: number;
  referenceOnly: number;
}

function extensionFromName(fileName: string) {
  const dotIndex = fileName.lastIndexOf(".");
  if (dotIndex < 0) {
    return "";
  }
  return fileName.slice(dotIndex).toLowerCase();
}

function clampPreview(text: string, maxLength = 120) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return "";
  }
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, maxLength).trimEnd()}...`;
}

function urlHost(value: string) {
  try {
    return new URL(value).host;
  } catch {
    return "網址格式待確認";
  }
}

function isValidUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function appendLaneGoal(
  text: string,
  context: MaterialRemediationContext | undefined,
) {
  const goal = context?.updateGoal?.trim();
  if (!goal) {
    return text;
  }
  if (context?.lane === "follow_up") {
    return `${text} 這輪 checkpoint 想補的是：${goal}`;
  }
  if (context?.lane === "continuous") {
    return `${text} 這輪 progression 想驗證的是：${goal}`;
  }
  if (context?.lane === "one_off") {
    return `${text} 這次交付物目前最需要的是：${goal}`;
  }
  return text;
}

function appendLaneNextAction(
  text: string,
  context: MaterialRemediationContext | undefined,
) {
  const nextAction = context?.nextAction?.trim();
  if (!nextAction) {
    return text;
  }
  return `${text} 補完後，建議直接：${nextAction}`;
}

function appendLaneImpact(
  text: string,
  context: MaterialRemediationContext | undefined,
) {
  const goal = context?.updateGoal?.trim();
  if (context?.lane === "follow_up") {
    return goal
      ? `${text} 這會直接影響這輪 checkpoint 想補的缺口：${goal}`
      : `${text} 這會直接影響這輪 checkpoint 能不能站穩。`;
  }
  if (context?.lane === "continuous") {
    return goal
      ? `${text} 這會直接影響這輪 progression 想驗證的 action / outcome：${goal}`
      : `${text} 這會直接影響這輪 progression 判斷能不能續推。`;
  }
  if (context?.lane === "one_off") {
    return `${text} 這會直接影響這次交付物能不能以正式依據站穩。`;
  }
  if (context?.lane === "workspace") {
    return `${text} 這會直接影響你回主線時能不能把它當成正式依據。`;
  }
  return text;
}

function laneAwareNextStep(
  context: MaterialRemediationContext | undefined,
  {
    intake,
    oneOff,
    followUp,
    continuous,
    workspace,
  }: {
    intake: string;
    oneOff?: string;
    followUp?: string;
    continuous?: string;
    workspace?: string;
  },
) {
  if (context?.lane === "follow_up") {
    return appendLaneNextAction(
      appendLaneGoal(followUp || intake, context),
      context,
    );
  }
  if (context?.lane === "continuous") {
    return appendLaneNextAction(
      appendLaneGoal(continuous || intake, context),
      context,
    );
  }
  if (context?.lane === "one_off") {
    return appendLaneNextAction(
      appendLaneGoal(oneOff || intake, context),
      context,
    );
  }
  if (context?.lane === "workspace") {
    return appendLaneNextAction(
      appendLaneGoal(workspace || intake, context),
      context,
    );
  }
  return appendLaneNextAction(appendLaneGoal(intake, context), context);
}

function classifyFailedIngest(errorText: string | null | undefined) {
  const normalized = (errorText || "").trim().toLowerCase();
  if (!normalized) {
    return {
      diagnosticCategory: "parse_failed" as const,
      diagnosticLabel: "解析失敗",
      likelyCauseDetail: "目前只知道這次匯入沒有穩定完成，原因仍偏保守未知。",
      usableScopeLabel: "目前不可直接用",
      usableScopeDetail: "現在不能直接進正式文字 evidence chain，最多只保留最小失敗紀錄。",
      retryabilityLabel: "可先重試一次",
      retryabilityDetail: "這類失敗比較像暫時性執行失敗，先 retry 一次是合理的。",
      statusDetail: "這份材料實際匯入失敗，目前沒有形成穩定可用的解析結果。",
      impactDetail: "目前無法直接進正式文字分析或 evidence chain，只能保留最小失敗紀錄。",
      recommendedNextStep:
        "先重新補件；若急著分析，改提供更乾淨的文字版、可讀 URL 或手動摘要。",
      fallbackStrategy:
        "最穩定的替代方式是補 text-first PDF、DOCX、TXT、可公開讀取的 URL，或直接貼純文字摘要。",
      retryable: true,
    };
  }
  if (normalized.includes("空白") || normalized.includes("empty")) {
    return {
      diagnosticCategory: "empty_invalid_content" as const,
      diagnosticLabel: "空白或無效內容",
      likelyCauseDetail: "材料本身沒有可讀內容，或內容太薄，無法形成正式來源。",
      usableScopeLabel: "目前不可直接用",
      usableScopeDetail: "不能當正式內容證據；若真的要留，只能保留最小失敗痕跡。",
      retryabilityLabel: "重試幫助有限",
      retryabilityDetail: "同一份空白內容重試通常不會改善，較適合換檔或直接補摘要。",
      statusDetail: "這份材料實際匯入失敗，因為檔案本身沒有可用內容。",
      impactDetail: "系統無法抽出任何可分析內容，最多只會留下失敗紀錄或最小 metadata。",
      recommendedNextStep:
        "請改上傳有內容的版本；如果暫時只有口頭資訊，先貼純文字摘要也可以。",
      fallbackStrategy: "若原檔還在整理中，先補一段可讀摘要，之後再補正式檔案。",
      retryable: false,
    };
  }
  if (
    normalized.includes("權限") ||
    normalized.includes("forbidden") ||
    normalized.includes("unauthorized") ||
    normalized.includes("401") ||
    normalized.includes("403")
  ) {
    return {
      diagnosticCategory: "fetch_access_failure" as const,
      diagnosticLabel: "抓取 / 存取受阻",
      likelyCauseDetail: "來源正文目前不可讀，常見原因是權限不足、連結受限或來源不允許抓取。",
      usableScopeLabel: "目前不可直接抓文",
      usableScopeDetail: "現在不能穩定形成正式可解析來源；若不補替代材料，這份依據很難進 evidence chain。",
      retryabilityLabel: "不建議直接重試",
      retryabilityDetail: "這類失敗通常不是暫時性 worker 抖動，而是來源權限或存取條件本身有問題。",
      statusDetail: "這份材料匯入失敗，因為目前拿不到可讀正文或存取權限不足。",
      impactDetail: "系統無法穩定抓取內容，也不能把它當成正式可解析來源。",
      recommendedNextStep:
        "請改用可公開讀取的 URL、可下載檔案，或直接補貼文字版內容。",
      fallbackStrategy: "如果只能用受限來源，請至少補一段人工摘要，避免這筆材料完全無法參與分析。",
      retryable: false,
    };
  }
  if (
    normalized.includes("unsupported") ||
    normalized.includes("尚未正式支援") ||
    normalized.includes("format")
  ) {
    return {
      diagnosticCategory: "format_unsupported" as const,
      diagnosticLabel: "格式尚未正式支援",
      likelyCauseDetail: "目前格式不在正式 intake 邊界內，因此系統不會繼續做完整解析。",
      usableScopeLabel: "目前不可直接用",
      usableScopeDetail: "不能直接進主鏈做正式文字分析，也不應被當成已成功接受的來源。",
      retryabilityLabel: "重試通常沒有幫助",
      retryabilityDetail: "問題在格式邊界，不是暫時性執行失敗；較適合換格式或補替代材料。",
      statusDetail: "這份材料匯入失敗，主要原因是格式目前不在正式支援邊界內。",
      impactDetail: "它不能直接進主鏈做正式文字分析，也不應被當成已成功接受的來源。",
      recommendedNextStep:
        "請改成正式支援格式，或直接貼文字摘要 / 改用可讀 URL。",
      fallbackStrategy: "常見替代方式是匯出成 PDF、DOCX、TXT、CSV，或直接整理成條列摘要。",
      retryable: false,
    };
  }
  if (
    normalized.includes("timeout") ||
    normalized.includes("network") ||
    normalized.includes("dns") ||
    normalized.includes("連線")
  ) {
    return {
      diagnosticCategory: "fetch_access_failure" as const,
      diagnosticLabel: "抓取流程受阻",
      likelyCauseDetail: "這次失敗比較像遠端抓取、連線或來源回應不穩，流程沒有順利跑完。",
      usableScopeLabel: "目前不可直接用",
      usableScopeDetail: "現在還不能視為正式可用來源；若不補救，這份材料不會穩定進 evidence chain。",
      retryabilityLabel: "可先重試一次",
      retryabilityDetail: "這類問題可能是暫時性連線或抓取抖動，先 retry 一次通常值得。",
      statusDetail: "這份材料匯入失敗，這次更像是抓取或解析流程沒有成功跑完。",
      impactDetail: "目前還不能視為正式可用來源；若不補救，這份材料不會穩定進 evidence chain。",
      recommendedNextStep:
        "可以先重試一次；若急著推進，請改補更穩定的文字版、摘要或替代來源。",
      fallbackStrategy: "若外部抓取不穩，最保守的替代方式是直接貼純文字內容或上傳文字版文件。",
      retryable: true,
    };
  }
  return {
    diagnosticCategory: "parse_failed" as const,
    diagnosticLabel: "解析失敗",
    likelyCauseDetail: "系統拿到材料後，仍沒能穩定抽出可用內容，通常比單純 pending 更偏結構性失敗。",
    usableScopeLabel: "目前不可直接用",
    usableScopeDetail: "目前無法直接進正式文字分析，也不能假裝它已正常形成可用 evidence。",
    retryabilityLabel: "重試幫助有限",
    retryabilityDetail: "若同一份材料已多次卡在解析失敗，通常更值得改補文字版、摘要或替代來源。",
    statusDetail: "這份材料實際匯入失敗，系統沒能穩定抽出可用內容。",
    impactDetail: "目前無法直接進正式文字分析，也不能假裝它已正常形成可用 evidence。",
    recommendedNextStep:
      "請優先換成更乾淨的文字版、補純文字摘要，或改用可讀 URL 後再補件。",
    fallbackStrategy:
      "如果同一份原始材料仍然重要，建議另外準備 text-first PDF、DOCX 或手動整理重點摘要。",
    retryable: false,
  };
}

export function previewItemBlocksSubmit(item: IntakeMaterialPreviewItem) {
  return item.status === "unsupported" || item.status === "issue";
}

export function previewItemCanKeepAsReference(item: IntakeMaterialPreviewItem) {
  return item.status === "limited";
}

export function defaultProgressInfoForPreviewItem(
  item: IntakeMaterialPreviewItem,
  options?: {
    keepAsReference?: boolean;
  },
): IntakeItemProgressInfo {
  const isLimitedExtract = item.diagnosticCategory === "accepted_limited_extraction";
  if (previewItemBlocksSubmit(item)) {
    return {
      phase: "blocked",
      label: "阻擋送出",
      detail: `這份材料目前屬「${item.diagnosticLabel}」，要先移除、修正或替換，否則這批不能送出。`,
      blocksSubmit: true,
      retryable: false,
      referenceOnly: false,
    };
  }
  if (item.status === "limited" && options?.keepAsReference) {
    return {
      phase: "ready",
      label: isLimitedExtract ? "將保留有限抽取" : "將保留 reference",
      detail: isLimitedExtract
        ? `這份材料目前屬「${item.usableScopeLabel}」，不擋送出，會先保留有限抽取結果與補充提示。`
        : `這份材料目前屬「${item.usableScopeLabel}」，不擋送出，會以 metadata / reference-level 方式保留。`,
      blocksSubmit: false,
      retryable: false,
      referenceOnly: !isLimitedExtract,
    };
  }
  if (item.status === "pending") {
    return {
      phase: "ready",
      label: "待送出 / 待解析",
      detail: `這份材料目前屬「${item.diagnosticLabel}」，不擋送出，但建立後仍要看最終解析結果。`,
      blocksSubmit: false,
      retryable: false,
      referenceOnly: false,
    };
  }
  if (item.status === "limited") {
    return {
      phase: "ready",
      label: isLimitedExtract ? "可保留有限抽取" : "可保留 reference",
      detail: isLimitedExtract
        ? `這份材料目前屬「${item.usableScopeLabel}」，不擋送出，但後續判讀最適合同時補欄位說明或摘要。`
        : `這份材料目前屬「${item.usableScopeLabel}」，不擋送出，但最適合先當 reference-level 來源。`,
      blocksSubmit: false,
      retryable: false,
      referenceOnly: !isLimitedExtract,
    };
  }
  return {
    phase: "ready",
    label: "待送出",
    detail: `這份材料目前屬「${item.usableScopeLabel}」，可沿正式主鏈處理。`,
    blocksSubmit: false,
    retryable: false,
    referenceOnly: false,
  };
}

export function progressInfoFromRuntimeHandling(
  handling: RuntimeMaterialHandlingSummary,
  options?: {
    keepAsReference?: boolean;
  },
): IntakeItemProgressInfo {
  const isLimitedExtract = handling.diagnosticCategory === "accepted_limited_extraction";
  if (handling.status === "issue") {
    return {
      phase: "failed",
      label: handling.retryable ? "失敗，可重試" : "失敗，需替換",
      detail: handling.retryable
        ? `這次更像「${handling.diagnosticLabel}」，可先直接重試。`
        : `這次更像「${handling.diagnosticLabel}」，較適合改用替換、移除或 fallback 材料。`,
      blocksSubmit: false,
      retryable: handling.retryable,
      referenceOnly: false,
    };
  }
  if (handling.status === "unsupported") {
    return {
      phase: "blocked",
      label: "尚未正式支援",
      detail: `這份材料目前屬「${handling.diagnosticLabel}」，不能當成正式可解析來源，需替換或移除。`,
      blocksSubmit: true,
      retryable: false,
      referenceOnly: false,
    };
  }
  if (handling.status === "limited") {
    return {
      phase: "done",
      label:
        options?.keepAsReference && !isLimitedExtract
          ? "已保留 reference"
          : isLimitedExtract
            ? "有限抽取 / 已保留"
            : "有限支援 / 已保留",
      detail: `這份材料已被保留，目前屬「${handling.usableScopeLabel}」。`,
      blocksSubmit: false,
      retryable: false,
      referenceOnly: !isLimitedExtract,
    };
  }
  if (handling.status === "pending") {
    return {
      phase: "parsing",
      label: "待解析",
      detail: `這份材料已送出，但目前仍屬「${handling.usableScopeLabel}」，最終解析層級仍待確認。`,
      blocksSubmit: false,
      retryable: false,
      referenceOnly: false,
    };
  }
  return {
    phase: "done",
    label: "已接受",
    detail: `這份材料已正式進主鏈，目前屬「${handling.usableScopeLabel}」。`,
    blocksSubmit: false,
    retryable: false,
    referenceOnly: false,
  };
}

export function summarizeBatchProgress({
  items,
  progressByItemId,
  keepAsReferenceByItemId,
  sessionStates = [],
}: {
  items: IntakeMaterialPreviewItem[];
  progressByItemId?: Record<string, IntakeItemProgressInfo>;
  keepAsReferenceByItemId?: Record<string, boolean>;
  sessionStates?: IntakeSessionItemState[];
}): IntakeBatchProgressSummary {
  const currentIds = new Set(items.map((item) => item.id));
  const currentStates = items.map((item) => ({
    itemId: item.id,
    progress:
      progressByItemId?.[item.id] ??
      defaultProgressInfoForPreviewItem(item, {
        keepAsReference: Boolean(keepAsReferenceByItemId?.[item.id]),
      }),
  }));
  const combinedStates = [
    ...sessionStates.filter((entry) => !currentIds.has(entry.itemId)),
    ...currentStates,
  ];

  const summary: IntakeBatchProgressSummary = {
    total: combinedStates.length,
    completed: 0,
    processing: 0,
    pending: 0,
    failed: 0,
    blocking: 0,
    referenceOnly: 0,
  };

  combinedStates.forEach(({ progress }) => {
    if (progress.referenceOnly) {
      summary.referenceOnly += 1;
    }
    if (progress.phase === "done") {
      summary.completed += 1;
      return;
    }
    if (progress.phase === "uploading" || progress.phase === "parsing") {
      summary.processing += 1;
      return;
    }
    if (progress.phase === "failed") {
      summary.failed += 1;
      return;
    }
    if (progress.phase === "blocked") {
      summary.blocking += 1;
      return;
    }
    summary.pending += 1;
  });

  return summary;
}

function buildFilePreviewItem(
  file: File,
  index: number,
  context?: MaterialRemediationContext,
): IntakeMaterialPreviewItem {
  const extension = extensionFromName(file.name);
  const metadata = [
    extension ? extension.slice(1).toUpperCase() : "未知格式",
    file.type || "未提供 MIME",
    `${Math.max(1, Math.round(file.size / 1024))} KB`,
  ];

  if (file.size <= 0) {
    return {
      id: `file-${index}`,
      kind: "file",
      kindLabel: "檔案",
      index,
      title: file.name,
      metadata,
      preview: "",
      diagnosticCategory: "empty_invalid_content",
      diagnosticLabel: "空白或無效內容",
      likelyCauseDetail: "這份檔案目前看起來沒有可讀內容，因此很難形成正式可用來源。",
      usableScopeLabel: "目前不可直接用",
      usableScopeDetail: "不能直接進正式分析主鏈，也無法形成可用文字 evidence。",
      retryabilityLabel: "重試幫助有限",
      retryabilityDetail: "同一份空白檔重試通常不會改善，較適合換檔或直接補摘要。",
      status: "issue",
      statusLabel: "匯入會失敗",
      statusDetail: "這份檔案目前看起來是空白內容，建立後很可能只留下失敗紀錄。",
      impactDetail: appendLaneImpact(
        "它不能穩定進正式分析主鏈，也無法形成可用文字 evidence。",
        context,
      ),
      recommendedNextStep: laneAwareNextStep(context, {
        intake: "先移除這份空白檔案，改上傳有內容的版本；若暫時只有口頭資訊，先貼文字摘要。",
        oneOff: "若這份材料是本次交付依據，請先補一份有內容的文字版或重點摘要。",
        followUp: "先補一份有內容的文字版或摘要，避免這輪 checkpoint 缺口停在空白檔。",
        continuous: "先補能支撐這輪 progression 的實際內容，避免卡在空白附件。",
        workspace: "先改上傳有內容的版本，或直接補一段可讀摘要。",
      }),
      fallbackStrategy: "最穩定的替代方式是補 TXT、DOCX、text-first PDF，或直接貼純文字摘要。",
    };
  }

  if (LIMITED_SUPPORTED_EXTENSIONS.has(extension)) {
    return {
      id: `file-${index}`,
      kind: "file",
      kindLabel: "檔案",
      index,
      title: file.name,
      metadata,
      preview: "",
      diagnosticCategory: "reference_only",
      diagnosticLabel: "有限支援 / reference-only",
      likelyCauseDetail: "目前只做 metadata / reference-level intake，不預設 OCR 或完整全文理解。",
      usableScopeLabel: "僅可 reference-level 保留",
      usableScopeDetail: "可保留為 metadata / reference-level 材料，但不能直接當成完整文字證據。",
      retryabilityLabel: "重試通常沒有幫助",
      retryabilityDetail: "這不是暫時性失敗；若要做文字分析，較適合改補文字版、OCR 後文字或摘要。",
      status: "limited",
      statusLabel: "有限支援",
      statusDetail: "目前只會建立 metadata / reference-level 記錄，不預設 OCR 或完整全文理解。",
      impactDetail: appendLaneImpact(
        "這份材料可被保留為 reference，但不能直接假裝成完整文字證據或完整抽文來源。",
        context,
      ),
      recommendedNextStep: laneAwareNextStep(context, {
        intake: "若你需要正式文字分析，建議補文字版、OCR 後文字、可讀 URL，或至少貼重點摘要。",
        oneOff: "若這份材料要支撐這次交付物，建議補文字版或人工摘要，避免只剩 reference-level 依據。",
        followUp: "若這份材料要支撐這輪 checkpoint，建議補文字版、OCR 後文字或人工摘要。",
        continuous: "若這份材料要支撐這輪 progression 判斷，建議補文字版、OCR 後文字或人工摘要。",
        workspace: "若你希望它真的進 evidence chain，建議補文字版、OCR 後文字或手動摘要。",
      }),
      fallbackStrategy: "較佳替代方式是 text-first PDF、DOCX、TXT、可讀 URL，或直接補貼文字重點。",
    };
  }

  if (extension === ".csv" || extension === ".xlsx") {
    return {
      id: `file-${index}`,
      kind: "file",
      kindLabel: "檔案",
      index,
      title: file.name,
      metadata,
      preview: "",
      diagnosticCategory: "accepted_limited_extraction",
      diagnosticLabel: "已接受，但表格抽取有限",
      likelyCauseDetail:
        extension === ".xlsx"
          ? "這份工作表會先以 worksheet snapshot 方式擷取，公式、跨表關聯與深層結構仍需人工補充判讀。"
          : "這份表格會先以 row snapshot 方式擷取，欄位關係、公式與上下文仍需人工補充判讀。",
      usableScopeLabel: "可先做文字摘錄，但表格抽取有限",
      usableScopeDetail:
        "可先沿正式主鏈使用已抽出的列 / 工作表快照，但不能假裝已完整理解表格結構、公式或跨表脈絡。",
      retryabilityLabel: "不需要先重試",
      retryabilityDetail: "這不是暫時性失敗；若要提高可信度，較適合補欄位說明、重點摘要或文字版解釋。",
      status: "limited",
      statusLabel: "抽取有限",
      statusDetail:
        "建立案件後會保留可用的表格快照，但關鍵欄位、公式與表格脈絡仍需人工補充判讀。",
      impactDetail: appendLaneImpact(
        "它可先沿正式主鏈使用已抽出的表格快照，但不能假裝已完整理解欄位關係、公式或跨表脈絡。",
        context,
      ),
      recommendedNextStep: laneAwareNextStep(context, {
        intake: "可以先建立案件；若這份表格很重要，建議同時補欄位說明、重點摘要或更易讀的文字版說明。",
        oneOff: "若這份表格是交付物主依據，請補欄位解釋、重點摘要或更易讀的文字版說明。",
        followUp: "若這份表格要支撐這輪 checkpoint，請補欄位解釋、重點摘要或更易讀的文字版說明。",
        continuous: "若這份表格要支撐這輪 progression，請補欄位解釋、重點摘要或更易讀的文字版說明。",
        workspace: "可先保留表格快照，但若要做正式判斷，建議補欄位定義、重點摘要或文字版說明。",
      }),
      fallbackStrategy: "較佳替代方式是補欄位定義、重點摘要、text-first PDF / DOCX，或直接貼出關鍵表格解讀。",
    };
  }

  if (extension === ".pdf") {
    return {
      id: `file-${index}`,
      kind: "file",
      kindLabel: "檔案",
      index,
      title: file.name,
      metadata,
      preview: "",
      diagnosticCategory: "parse_pending",
      diagnosticLabel: "解析尚未完成",
      likelyCauseDetail: "PDF 要等實際判斷是否為 text-first；若是掃描型 PDF，後續會降成 reference-level。",
      usableScopeLabel: "暫不可先當正文引用",
      usableScopeDetail: "建立前不能先假設一定能抽出可用正文；最終可用範圍要看實際解析結果。",
      retryabilityLabel: "先等解析，不必先重試",
      retryabilityDetail: "這不是失敗；先看最終解析結果，比立刻 retry 更合理。",
      status: "pending",
      statusLabel: "待解析",
      statusDetail: "PDF 會在匯入時判斷是否為 text-first；若是掃描型 PDF，會降成 metadata / reference-level，不預設 OCR。",
      impactDetail: appendLaneImpact(
        "建立前不能先假設它一定能抽出可用正文；最終可用範圍要看實際解析結果。",
        context,
      ),
      recommendedNextStep: laneAwareNextStep(context, {
        intake: "可以先建立案件，但建立後要回工作面確認最終解析結果；若降成 metadata-only，請補文字版或摘要。",
        oneOff: "若這份 PDF 是交付物主依據，建立後請先確認是否成功抽文；若沒有，請立刻補文字版或重點摘要。",
        followUp: "可先補進來，但若這輪 checkpoint 需要引用內容，請在解析後確認是否成功抽文；若沒有，補文字版或摘要。",
        continuous: "可先補進來，但若這輪 progression 要靠它驗證 action / outcome，請在解析後確認是否成功抽文；若沒有，補文字版或摘要。",
        workspace: "先等實際解析結果；若最後只有 metadata-only，請補文字版、OCR 後文字或摘要。",
      }),
      fallbackStrategy: "最保守的替代方式是提供 text-first PDF、DOCX、TXT，或直接整理一段可讀摘要。",
    };
  }

  if (UNSUPPORTED_EXTENSIONS.has(extension) || !FULLY_SUPPORTED_EXTENSIONS.has(extension)) {
    return {
      id: `file-${index}`,
      kind: "file",
      kindLabel: "檔案",
      index,
      title: file.name,
      metadata,
      preview: "",
      diagnosticCategory: "format_unsupported",
      diagnosticLabel: "格式尚未正式支援",
      likelyCauseDetail: "目前格式不在正式 intake 邊界內，因此不會繼續走完整解析。",
      usableScopeLabel: "目前不可直接用",
      usableScopeDetail: "它不會進正常分析主鏈，建立按鈕也會 fail-closed。",
      retryabilityLabel: "重試通常沒有幫助",
      retryabilityDetail: "問題在格式邊界，不是暫時性執行失敗；較適合換格式或補替代材料。",
      status: "unsupported",
      statusLabel: "尚未正式支援",
      statusDetail: "這份材料目前不在正式 intake 邊界內，不能直接當成正式可解析來源。",
      impactDetail: appendLaneImpact(
        "它不會進正常分析主鏈，建立按鈕也會 fail-closed，避免把 unsupported 材料誤當成已接受。",
        context,
      ),
      recommendedNextStep: laneAwareNextStep(context, {
        intake: "請先移除；若內容重要，請改成正式支援格式，或直接貼文字摘要 / 可讀 URL。",
        oneOff: "若它是這次交付物的重要依據，請先轉成正式支援格式或補貼文字摘要，再繼續。",
        followUp: "若它是這輪 checkpoint 需要的依據，請改成正式支援格式或補文字摘要，再回主線更新。",
        continuous: "若它是這輪 progression 要驗證的依據，請改成正式支援格式或補文字摘要，再回主線續推。",
        workspace: "先移除 unsupported 材料，改補正式支援格式、公開可讀 URL，或手動整理摘要。",
      }),
      fallbackStrategy: "常見替代是匯出成 PDF / DOCX / TXT / CSV，或直接貼關鍵條列與摘要。",
    };
  }

  return {
    id: `file-${index}`,
    kind: "file",
    kindLabel: "檔案",
    index,
    title: file.name,
    metadata,
    preview: "",
    diagnosticCategory: "accepted_full",
    diagnosticLabel: "正式可用",
    likelyCauseDetail: "這份材料落在正式支援邊界內，會沿正式內容擷取流程進主鏈。",
    usableScopeLabel: "可直接進正式主鏈",
    usableScopeDetail: "可直接進來源、證據與交付物主鏈，不需要另外降成 metadata-only。",
    retryabilityLabel: "不需要重試",
    retryabilityDetail: "目前沒有 ingest 問題，直接沿正式主鏈使用即可。",
    status: "accepted",
    statusLabel: "已接受",
    statusDetail: "建立案件後會走正式文字或表格擷取流程，並掛回同一個案件世界。",
    impactDetail: appendLaneImpact(
      "可直接進來源、證據與交付物主鏈，不需要另外降級成 metadata-only。",
      context,
    ),
    recommendedNextStep: laneAwareNextStep(context, {
      intake: "直接建立案件即可；若後續還有材料，之後再分批補件。",
      oneOff: "這份材料可直接作為本次交付物的正式依據，接著可回工作面完成分析與交付。",
      followUp: "這份材料可直接用來補這輪 checkpoint；補完後就可回案件工作面更新 follow-up。",
      continuous: "這份材料可直接用來驗證這輪 progression；補完後就可回案件工作面更新 action / outcome。",
      workspace: "可直接沿著同一案件世界回看來源、證據與交付物，不需要另外轉格式。",
    }),
    fallbackStrategy: null,
  };
}

function buildUrlPreviewItem(
  url: string,
  index: number,
  context?: MaterialRemediationContext,
): IntakeMaterialPreviewItem {
  if (!isValidUrl(url)) {
    return {
      id: `url-${index}`,
      kind: "url",
      kindLabel: "網址",
      index,
      title: url,
      metadata: [urlHost(url), "網址格式待修正"],
      preview: clampPreview(url, 96),
      diagnosticCategory: "empty_invalid_content",
      diagnosticLabel: "網址格式不完整",
      likelyCauseDetail: "目前不是完整可讀的 http(s) 網址，所以系統無法可靠判斷要抓哪個來源。",
      usableScopeLabel: "目前不可直接用",
      usableScopeDetail: "若直接送出，後續很可能無法抓取正文，也無法穩定形成可用 source material。",
      retryabilityLabel: "重試沒有意義",
      retryabilityDetail: "這不是暫時性失敗；先把網址修正完整，比直接 retry 更有幫助。",
      status: "issue",
      statusLabel: "待修正",
      statusDetail: "這個網址格式目前不完整，系統無法可靠判斷要抓哪個來源。",
      impactDetail: appendLaneImpact(
        "若直接送出，後續很可能無法抓取正文，也無法穩定形成可用 source material。",
        context,
      ),
      recommendedNextStep: laneAwareNextStep(context, {
        intake: "請補成完整的 http(s) 網址；若來源受限，也可以直接貼文字摘要。",
        oneOff: "若這是本次交付依據，請補成完整網址，或直接貼摘要避免交付依據斷掉。",
        followUp: "若這是這輪 checkpoint 需要的依據，請補成完整網址，或直接貼摘要再回主線更新。",
        continuous: "若這是這輪 progression 需要驗證的依據，請補成完整網址，或直接貼摘要再回主線續推。",
        workspace: "先把網址補完整；若仍不好抓，改用可下載檔案或貼文字摘要。",
      }),
      fallbackStrategy: "若來源本身不方便直接抓，最穩定的替代方式是貼出摘要、重點段落，或補可下載文件。",
    };
  }
  return {
    id: `url-${index}`,
    kind: "url",
    kindLabel: "網址",
    index,
    title: url,
    metadata: [urlHost(url), "遠端來源"],
    preview: clampPreview(url, 96),
    diagnosticCategory: "parse_pending",
    diagnosticLabel: "等待抓取與解析",
    likelyCauseDetail: "URL 屬正式支援來源，但仍要等實際抓取標題與正文結果。",
    usableScopeLabel: "暫不可先當正文引用",
    usableScopeDetail: "目前還不能先假設已成功抽到正文；最終可用範圍要看抓取結果。",
    retryabilityLabel: "先等解析，不必先重試",
    retryabilityDetail: "這不是失敗；先看抓取結果，再決定是否要改補公開版 URL、檔案或摘要。",
    status: "pending",
    statusLabel: "待解析",
    statusDetail: "URL 屬正式支援來源；建立後會實際嘗試抓取標題與文字內容。",
    impactDetail: appendLaneImpact(
      "目前還不能先假設已成功抽到正文；若來源沒有可讀內容或受權限限制，後續會轉成 ingestion issue。",
      context,
    ),
    recommendedNextStep: laneAwareNextStep(context, {
      intake: "可以先建立案件；若後續抓不到正文，請改補公開版 URL、可下載文件，或直接貼文字摘要。",
      oneOff: "可先建立，但若這是本次交付依據，建立後請盡快確認是否成功抓文；若沒有，補摘要或可下載版本。",
      followUp: "可先補進來，但若這輪 checkpoint 需要引用內容，建立後請確認最終抓取結果；若沒有，改補摘要或可讀版本。",
      continuous: "可先補進來，但若這輪 progression 需要拿它驗證 action / outcome，建立後請確認抓取結果；若沒有，改補摘要或可讀版本。",
      workspace: "先等待實際抓取結果；若抓不到正文，請改補可下載文件、公開版 URL，或直接貼摘要。",
    }),
    fallbackStrategy: "若來源權限不穩或正文太薄，最穩定的替代方式是貼出重點摘錄、會議摘要，或補正式文件版。",
  };
}

function buildTextPreviewItem(
  text: string,
  context?: MaterialRemediationContext,
): IntakeMaterialPreviewItem | null {
  const normalized = text.trim();
  if (!normalized) {
    return null;
  }
  return {
    id: "text-0",
    kind: "text",
    kindLabel: "補充文字",
    index: 0,
    title: "補充文字",
    metadata: [`${normalized.length} 字元`, "手動補充"],
    preview: clampPreview(normalized, 160),
    diagnosticCategory: "accepted_full",
    diagnosticLabel: "正式可用",
    likelyCauseDetail: "這段內容本身就是可讀文字，所以不需要再經過格式轉換才能進主鏈。",
    usableScopeLabel: "可直接進正式主鏈",
    usableScopeDetail: "可直接進來源與證據主鏈，通常是最穩定的 fallback material strategy。",
    retryabilityLabel: "不需要重試",
    retryabilityDetail: "目前沒有 ingest 問題，直接沿正式主鏈使用即可。",
    status: "accepted",
    statusLabel: "已接受",
    statusDetail: "這段內容會直接作為正式 source material 掛回同一個案件，不需另外轉格式。",
    impactDetail: appendLaneImpact(
      "它可直接進來源與證據主鏈，通常是最穩定的 fallback material strategy。",
      context,
    ),
    recommendedNextStep: laneAwareNextStep(context, {
      intake: "可直接建立案件；若其他附件格式不穩，至少先保留這段文字讓分析能起跑。",
      oneOff: "這段文字可直接撐住這次交付物的最小依據，後續再視需要補正式附件。",
      followUp: "這段文字可直接補進這輪 checkpoint 脈絡，讓你先回主線更新，再慢慢補正式附件。",
      continuous: "這段文字可直接補進這輪 progression 驗證，讓你先回主線續推，再慢慢補正式附件。",
      workspace: "如果附件格式不穩，這段文字通常就是最穩定的可分析替代材料。",
    }),
    fallbackStrategy: null,
  };
}

export function countIntakeMaterialUnits({
  fileCount,
  urlCount,
  hasPastedText,
}: {
  fileCount: number;
  urlCount: number;
  hasPastedText: boolean;
}) {
  return fileCount + urlCount + (hasPastedText ? 1 : 0);
}

export function inferInputEntryModeFromMaterialUnits(
  materialUnitCount: number,
): InputEntryMode {
  if (materialUnitCount >= 2) {
    return "multi_material_case";
  }
  if (materialUnitCount === 1) {
    return "single_document_intake";
  }
  return "one_line_inquiry";
}

export function appendSelectedFiles(existing: File[], incoming: File[]) {
  return [...existing, ...incoming];
}

export function buildIntakePreviewItems({
  files,
  urls,
  pastedText,
  context,
}: {
  files: File[];
  urls: string[];
  pastedText: string;
  context?: MaterialRemediationContext;
}) {
  const items: IntakeMaterialPreviewItem[] = [];
  files.forEach((file, index) => {
    items.push(buildFilePreviewItem(file, index, context));
  });
  urls.forEach((url, index) => {
    items.push(buildUrlPreviewItem(url, index, context));
  });
  const textItem = buildTextPreviewItem(pastedText, context);
  if (textItem) {
    items.push(textItem);
  }
  return items;
}

export function describeRuntimeMaterialHandling({
  supportLevel,
  ingestStatus,
  ingestStrategy,
  metadataOnly,
  ingestionError,
  diagnosticCategory,
  extractAvailability,
  currentUsableScope,
  context,
}: {
  supportLevel: string | null;
  ingestStatus: string | null;
  ingestStrategy: string | null;
  metadataOnly: boolean;
  ingestionError?: string | null;
  diagnosticCategory?: string | null;
  extractAvailability?: string | null;
  currentUsableScope?: string | null;
  context?: MaterialRemediationContext;
}): RuntimeMaterialHandlingSummary {
  if (ingestStatus === "failed") {
    const failed = classifyFailedIngest(ingestionError);
    return {
      status: "issue",
      statusLabel: "處理失敗",
      diagnosticCategory: failed.diagnosticCategory,
      diagnosticLabel: failed.diagnosticLabel,
      likelyCauseDetail: failed.likelyCauseDetail,
      usableScopeLabel: failed.usableScopeLabel,
      usableScopeDetail: failed.usableScopeDetail,
      retryabilityLabel: failed.retryabilityLabel,
      retryabilityDetail: failed.retryabilityDetail,
      statusDetail: failed.statusDetail,
      impactDetail: appendLaneImpact(failed.impactDetail, context),
      recommendedNextStep: laneAwareNextStep(context, {
        intake: failed.recommendedNextStep,
        oneOff: "若這份材料是這次交付依據，請優先換成可讀文字版、摘要或替代來源，再繼續。",
        followUp: "若這份材料是這輪 checkpoint 要補的依據，請優先補文字版、摘要或替代來源，再回主線更新。",
        continuous: "若這份材料是這輪 progression 要驗證的依據，請優先補文字版、摘要或替代來源，再回主線續推。",
        workspace: failed.recommendedNextStep,
      }),
      fallbackStrategy: failed.fallbackStrategy,
      retryable: failed.retryable,
    };
  }

  if (supportLevel === "unsupported" || ingestStatus === "unsupported") {
    return {
      status: "unsupported",
      statusLabel: "尚未正式支援",
      diagnosticCategory: "format_unsupported",
      diagnosticLabel: "格式尚未正式支援",
      likelyCauseDetail: "目前材料格式超出正式 intake 邊界，因此系統不會把它當成正式可解析來源。",
      usableScopeLabel: "目前不可直接用",
      usableScopeDetail: "它不會進正常文字分析或 evidence extraction，也不應被當成只要等等就會自動成功。",
      retryabilityLabel: "重試通常沒有幫助",
      retryabilityDetail: "問題在格式邊界，不是暫時性 worker 抖動；較適合換格式或補替代材料。",
      statusDetail: "目前不會把這份材料當成正式可解析來源；它只會保留最小記錄或直接被拒絕。",
      impactDetail: appendLaneImpact(
        "它不會進正常文字分析或 evidence extraction，也不應被當成只要等等就會自動成功。",
        context,
      ),
      recommendedNextStep: laneAwareNextStep(context, {
        intake: "請先移除，改成正式支援格式，或直接補文字摘要 / 可讀 URL。",
        oneOff: "若這份材料會影響這次交付物，請先改成正式支援格式或補文字摘要。",
        followUp: "若這份材料是這輪 checkpoint 需要的依據，請先改成正式支援格式或補文字摘要。",
        continuous: "若這份材料是這輪 progression 需要的依據，請先改成正式支援格式或補文字摘要。",
        workspace: "請改補正式支援格式、公開可讀來源，或直接貼出文字摘要。",
      }),
      fallbackStrategy: "常見替代是 PDF、DOCX、TXT、CSV、可讀 URL，或直接補重點摘要。",
      retryable: false,
    };
  }

  if (
    diagnosticCategory === "accepted_limited_table_extract" ||
    currentUsableScope === "limited_extract" ||
    extractAvailability === "partial_extract_ready" ||
    ingestStrategy === "table_snapshot" ||
    ingestStrategy === "worksheet_snapshot"
  ) {
    return {
      status: "limited",
      statusLabel: "抽取有限",
      diagnosticCategory: "accepted_limited_extraction",
      diagnosticLabel: "已接受，但表格抽取有限",
      likelyCauseDetail:
        ingestStrategy === "worksheet_snapshot"
          ? "這份工作表目前先以 worksheet snapshot 方式擷取，公式、跨表關聯與深層結構仍需人工補充判讀。"
          : "這份表格目前先以 row snapshot 方式擷取，欄位關係、公式與上下文仍需人工補充判讀。",
      usableScopeLabel: "可先做文字摘錄，但表格抽取有限",
      usableScopeDetail:
        "目前可先沿 evidence chain 使用已抽出的列 / 工作表快照，但不能假裝已完整理解表格結構、公式或跨表脈絡。",
      retryabilityLabel: "重試通常沒有幫助",
      retryabilityDetail: "這不是暫時性錯誤；若要提高可信度，較適合補文字說明、重點摘要或更適合閱讀的文字版材料。",
      statusDetail:
        "這份材料已被接收並形成有限抽取；現在可先用抽出的重點，但關鍵欄位、公式與表格脈絡仍需人工補充判讀。",
      impactDetail: appendLaneImpact(
        "它可先沿 evidence chain 使用已抽出的表格快照，但不能假裝已完整理解欄位關係、公式或跨表脈絡。",
        context,
      ),
      recommendedNextStep: laneAwareNextStep(context, {
        intake: "若你需要更穩的判讀，建議同時補一段欄位說明、重點摘要，或補能直接解釋表格意義的文字版材料。",
        oneOff: "若這份表格要支撐本次交付物，建議補欄位說明、重點摘要，或補一份更易讀的文字版說明。",
        followUp: "若這份表格要支撐這輪 checkpoint，建議補欄位解釋、重點摘要，或補一份更易讀的文字版說明。",
        continuous: "若這份表格要支撐這輪 progression 判斷，建議補欄位解釋、重點摘要，或補一份更易讀的文字版說明。",
        workspace: "可先用已抽出的快照，但若要做正式判斷，建議補欄位定義、重點摘要或文字版說明。",
      }),
      fallbackStrategy: "較佳替代方式是補欄位定義、重點摘要、text-first PDF / DOCX，或直接貼出關鍵表格解讀。",
      retryable: false,
    };
  }

  if (
    supportLevel === "limited" ||
    metadataOnly ||
    ingestStatus === "metadata_only" ||
    ingestStrategy === "reference_image" ||
    ingestStrategy === "image_reference" ||
    ingestStrategy === "pdf_metadata_only" ||
    ingestStrategy === "scanned_pdf_reference" ||
    currentUsableScope === "reference_only" ||
    extractAvailability === "reference_only"
  ) {
    return {
      status: "limited",
      statusLabel: "有限支援",
      diagnosticCategory:
        ingestStrategy === "reference_image" ||
        ingestStrategy === "image_reference" ||
        ingestStrategy === "pdf_metadata_only" ||
        ingestStrategy === "scanned_pdf_reference" ||
        metadataOnly
          ? "reference_only"
          : "accepted_limited_extraction",
      diagnosticLabel:
        ingestStrategy === "reference_image" ||
        ingestStrategy === "image_reference" ||
        ingestStrategy === "pdf_metadata_only" ||
        ingestStrategy === "scanned_pdf_reference" ||
        metadataOnly
          ? "有限支援 / reference-only"
          : "已接受，但擷取受限",
      likelyCauseDetail:
        ingestStrategy === "reference_image" || ingestStrategy === "image_reference"
          ? "這類來源目前只做影像 reference / metadata intake，不預設 OCR 或完整全文理解。"
          : ingestStrategy === "pdf_metadata_only" || ingestStrategy === "scanned_pdf_reference"
            ? "這份 PDF 目前更接近掃描 / 圖像來源，只保留 reference-level 回鏈，不預設 OCR。"
          : "來源已被接收，但目前擷取層級受限，不能把它當成完整正文來源。",
      usableScopeLabel: "僅可 reference-level 保留",
      usableScopeDetail:
        ingestStrategy === "reference_image" || ingestStrategy === "image_reference"
          ? "這份材料可作 reference，但不能直接當成完整文字證據或完整全文來源。"
          : ingestStrategy === "pdf_metadata_only" || ingestStrategy === "scanned_pdf_reference"
            ? "這份掃描 / 圖像型 PDF 目前只能作來源層級引用，不能直接當成完整文字證據。"
          : "這份材料可保留在案件世界內，但不能假裝已完整抽文，也不應直接當成穩定 evidence extraction 來源。",
      retryabilityLabel: "重試通常沒有幫助",
      retryabilityDetail: "這不是暫時性失敗；若要升級成文字可用，較適合補文字版、OCR 後文字或摘要。",
      statusDetail:
        ingestStrategy === "reference_image" || ingestStrategy === "image_reference"
          ? "目前只建立影像 reference / metadata，不預設 OCR 或完整全文理解。"
          : ingestStrategy === "pdf_metadata_only" || ingestStrategy === "scanned_pdf_reference"
            ? "目前只建立掃描 / 圖像型 PDF 的 reference-level 記錄，不預設 OCR 或完整全文抽取。"
          : "目前只建立 metadata / reference-level 記錄；若是掃描型 PDF 或低文字密度來源，不會假裝成完整全文支援。",
      impactDetail: appendLaneImpact(
        ingestStrategy === "reference_image" || ingestStrategy === "image_reference"
          ? "這份材料可作 reference，但不能直接當成完整文字證據或完整全文來源。"
          : ingestStrategy === "pdf_metadata_only" || ingestStrategy === "scanned_pdf_reference"
            ? "這份材料目前只能作來源層級引用，不能直接假裝成已可正文引用的文字證據。"
          : "這份材料可保留在案件世界內，但不能假裝已完整抽文，也不應直接當成穩定 evidence extraction 來源。",
        context,
      ),
      recommendedNextStep: laneAwareNextStep(context, {
        intake: "若你需要正式文字分析，建議補文字版、OCR 後文字、可讀 URL，或至少貼重點摘要。",
        oneOff: "若這份材料是本次交付依據，建議補文字版或摘要，避免交付物只剩 reference-level 依據。",
        followUp: "若這份材料要支撐這輪 checkpoint，建議補文字版、OCR 後文字或人工摘要。",
        continuous: "若這份材料要支撐這輪 progression 判斷，建議補文字版、OCR 後文字或人工摘要。",
        workspace: "若你希望它真的參與 evidence chain，請補文字版、OCR 後文字或人工摘要。",
      }),
      fallbackStrategy: "較佳替代方式是 text-first PDF、DOCX、TXT、可讀 URL，或直接補貼文字重點。",
      retryable: false,
    };
  }

  if (
    ingestStatus === "pending" ||
    ingestStatus === "processing" ||
    ingestStatus === "queued"
  ) {
    return {
      status: "pending",
      statusLabel: "待處理",
      diagnosticCategory: "parse_pending",
      diagnosticLabel: "解析尚未完成",
      likelyCauseDetail: "材料已被接收，但系統仍待確認最終解析層級與可用範圍。",
      usableScopeLabel: "暫不可先當正文引用",
      usableScopeDetail: "現在還不能先假設它已成功抽出正文或已穩定進 evidence chain；最終可用範圍要看實際解析結果。",
      retryabilityLabel: "先等解析，不必先重試",
      retryabilityDetail: "這不是失敗；先看最終解析結果，再決定是否改補文字版、摘要或替代來源。",
      statusDetail: "這份材料已被接收，但仍待系統確認最終解析層級。",
      impactDetail: appendLaneImpact(
        "現在還不能先假設它已成功抽出正文或已穩定進 evidence chain；最終可用範圍要看實際解析結果。",
        context,
      ),
      recommendedNextStep: laneAwareNextStep(context, {
        intake: "可先建立案件，但建立後請回工作面確認最終解析結果；若最後沒能抽文，請補文字版或摘要。",
        oneOff: "若這份材料是本次交付依據，請優先確認最終解析結果；若沒有正文，補文字版或摘要。",
        followUp: "若這份材料是這輪 checkpoint 依據，請先確認最終解析結果；若沒有正文，補文字版或摘要。",
        continuous: "若這份材料是這輪 progression 依據，請先確認最終解析結果；若沒有正文，補文字版或摘要。",
        workspace: "先確認最終解析結果；若最後只有 metadata-only 或失敗，請補文字版、摘要或替代來源。",
      }),
      fallbackStrategy: "最保守的替代方式是 text-first PDF、DOCX、TXT、可讀 URL，或直接補文字摘要。",
      retryable: false,
    };
  }

  if (ingestStrategy === "remote_text_extract" || ingestStrategy === "text_first_pdf") {
    return {
      status: "accepted",
      statusLabel: "已接受",
      diagnosticCategory: "accepted_full",
      diagnosticLabel: "正式可用",
      likelyCauseDetail: "這份材料已走正式內容擷取流程，擷取邊界目前足以直接參與主鏈。",
      usableScopeLabel: "可直接進正式主鏈",
      usableScopeDetail: "可直接進來源、證據與交付物主鏈，不需要另外降成 metadata-only。",
      retryabilityLabel: "不需要重試",
      retryabilityDetail: "目前沒有 ingest 問題，直接沿正式主鏈使用即可。",
      statusDetail: "這份材料已走正式內容擷取流程，後續會以正式來源與證據鏈回看。",
      impactDetail: appendLaneImpact(
        "它可直接進來源、證據與交付物主鏈，不需要另外降成 metadata-only。",
        context,
      ),
      recommendedNextStep: laneAwareNextStep(context, {
        intake: "可直接沿正式主鏈使用；若還有材料，後續再分批補件。",
        oneOff: "這份材料已可直接支撐這次交付物，接著可回主線完成分析與交付。",
        followUp: "這份材料已可直接支撐這輪 checkpoint，補完後就可回主線更新。",
        continuous: "這份材料已可直接支撐這輪 progression，補完後就可回主線續推。",
        workspace: "可直接回看 evidence chain，確認它實際支撐了哪些 recommendation / risk / action。",
      }),
      fallbackStrategy: null,
      retryable: false,
    };
  }

  if (ingestStatus === "processed" && supportLevel === "full") {
    return {
      status: "accepted",
      statusLabel: "已接受",
      diagnosticCategory: "accepted_full",
      diagnosticLabel: "正式可用",
      likelyCauseDetail: "這份材料已正式進入案件世界，目前擷取層級足以直接參與主鏈。",
      usableScopeLabel: "可直接進正式主鏈",
      usableScopeDetail: "它現在就是正式可用來源，不需要再用 fallback material strategy 才能啟動分析。",
      retryabilityLabel: "不需要重試",
      retryabilityDetail: "目前沒有 ingest 問題，直接沿正式主鏈使用即可。",
      statusDetail: "這份材料已正式進入案件世界，可直接參與來源、證據與交付物主鏈。",
      impactDetail: appendLaneImpact(
        "它現在就是正式可用來源，不需要再用 fallback material strategy 補它才能啟動分析。",
        context,
      ),
      recommendedNextStep: laneAwareNextStep(context, {
        intake: "可直接走正式主鏈；若還有其他材料，再分批補件即可。",
        oneOff: "可直接拿來支撐這次交付物，再視需要補更多依據。",
        followUp: "可直接拿來補這輪 checkpoint，再回案件工作面更新結論。",
        continuous: "可直接拿來補這輪 progression，再回案件工作面更新 action / outcome。",
        workspace: "可直接回看它目前支撐了哪些證據與輸出，不需要先做 remediation。",
      }),
      fallbackStrategy: null,
      retryable: false,
    };
  }

  return {
    status: "pending",
    statusLabel: "待處理",
    diagnosticCategory: "parse_pending",
    diagnosticLabel: "解析尚未完成",
    likelyCauseDetail: "材料已被接收，但目前仍缺少足夠訊號來確認最終解析層級。",
    usableScopeLabel: "暫不可先當正文引用",
    usableScopeDetail: "現在還不能先假設它已成功抽出正文或已穩定進 evidence chain；最終可用範圍仍待 runtime 確認。",
    retryabilityLabel: "先等解析，不必先重試",
    retryabilityDetail: "這不是失敗；先等最終解析結果，比直接 retry 更合理。",
    statusDetail: "這份材料已被接收，但仍待系統確認最終解析層級。",
    impactDetail: appendLaneImpact(
      "現在還不能先假設它已成功抽出正文或已穩定進 evidence chain；最終可用範圍要看實際解析結果。",
      context,
    ),
    recommendedNextStep: laneAwareNextStep(context, {
      intake: "可先建立案件，但建立後請回工作面確認最終解析結果；若最後沒能抽文，請補文字版或摘要。",
      oneOff: "若這份材料是本次交付依據，請優先確認最終解析結果；若沒有正文，補文字版或摘要。",
      followUp: "若這份材料是這輪 checkpoint 依據，請先確認最終解析結果；若沒有正文，補文字版或摘要。",
      continuous: "若這份材料是這輪 progression 依據，請先確認最終解析結果；若沒有正文，補文字版或摘要。",
      workspace: "先確認最終解析結果；若最後只有 metadata-only 或失敗，請補文字版、摘要或替代來源。",
    }),
    fallbackStrategy: "最保守的替代方式是 text-first PDF、DOCX、TXT、可讀 URL，或直接補文字摘要。",
    retryable: false,
  };
}

export function latestAttemptDetailFromHandling(
  handling: RuntimeMaterialHandlingSummary,
) {
  if (handling.status === "issue") {
    return `${handling.diagnosticLabel}｜${handling.retryabilityDetail}`;
  }
  return `${handling.diagnosticLabel}｜${handling.usableScopeDetail}`;
}
