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

export interface IntakeMaterialPreviewItem {
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

export interface RuntimeMaterialHandlingSummary {
  status: IntakePreviewStatus;
  statusLabel: string;
  statusDetail: string;
  impactDetail: string;
  recommendedNextStep: string;
  fallbackStrategy: string | null;
}

export interface MaterialRemediationContext {
  lane: "intake" | "one_off" | "follow_up" | "continuous" | "workspace";
  updateGoal?: string | null;
  nextAction?: string | null;
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
      statusDetail: "這份材料實際匯入失敗，目前沒有形成穩定可用的解析結果。",
      impactDetail: "目前無法直接進正式文字分析或 evidence chain，只能保留最小失敗紀錄。",
      recommendedNextStep:
        "先重新補件；若急著分析，改提供更乾淨的文字版、可讀 URL 或手動摘要。",
      fallbackStrategy:
        "最穩定的替代方式是補 text-first PDF、DOCX、TXT、可公開讀取的 URL，或直接貼純文字摘要。",
    };
  }
  if (normalized.includes("空白") || normalized.includes("empty")) {
    return {
      statusDetail: "這份材料實際匯入失敗，因為檔案本身沒有可用內容。",
      impactDetail: "系統無法抽出任何可分析內容，最多只會留下失敗紀錄或最小 metadata。",
      recommendedNextStep:
        "請改上傳有內容的版本；如果暫時只有口頭資訊，先貼純文字摘要也可以。",
      fallbackStrategy: "若原檔還在整理中，先補一段可讀摘要，之後再補正式檔案。",
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
      statusDetail: "這份材料匯入失敗，因為目前拿不到可讀正文或存取權限不足。",
      impactDetail: "系統無法穩定抓取內容，也不能把它當成正式可解析來源。",
      recommendedNextStep:
        "請改用可公開讀取的 URL、可下載檔案，或直接補貼文字版內容。",
      fallbackStrategy: "如果只能用受限來源，請至少補一段人工摘要，避免這筆材料完全無法參與分析。",
    };
  }
  if (
    normalized.includes("unsupported") ||
    normalized.includes("尚未正式支援") ||
    normalized.includes("format")
  ) {
    return {
      statusDetail: "這份材料匯入失敗，主要原因是格式目前不在正式支援邊界內。",
      impactDetail: "它不能直接進主鏈做正式文字分析，也不應被當成已成功接受的來源。",
      recommendedNextStep:
        "請改成正式支援格式，或直接貼文字摘要 / 改用可讀 URL。",
      fallbackStrategy: "常見替代方式是匯出成 PDF、DOCX、TXT、CSV，或直接整理成條列摘要。",
    };
  }
  if (
    normalized.includes("timeout") ||
    normalized.includes("network") ||
    normalized.includes("dns") ||
    normalized.includes("連線")
  ) {
    return {
      statusDetail: "這份材料匯入失敗，這次更像是抓取或解析流程沒有成功跑完。",
      impactDetail: "目前還不能視為正式可用來源；若不補救，這份材料不會穩定進 evidence chain。",
      recommendedNextStep:
        "可以先重試一次；若急著推進，請改補更穩定的文字版、摘要或替代來源。",
      fallbackStrategy: "若外部抓取不穩，最保守的替代方式是直接貼純文字內容或上傳文字版文件。",
    };
  }
  return {
    statusDetail: "這份材料實際匯入失敗，系統沒能穩定抽出可用內容。",
    impactDetail: "目前無法直接進正式文字分析，也不能假裝它已正常形成可用 evidence。",
    recommendedNextStep:
      "請優先換成更乾淨的文字版、補純文字摘要，或改用可讀 URL 後再補件。",
    fallbackStrategy:
      "如果同一份原始材料仍然重要，建議另外準備 text-first PDF、DOCX 或手動整理重點摘要。",
  };
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
      status: "issue",
      statusLabel: "匯入會失敗",
      statusDetail: "這份檔案目前看起來是空白內容，建立後很可能只留下失敗紀錄。",
      impactDetail: "它不能穩定進正式分析主鏈，也無法形成可用文字 evidence。",
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
      status: "limited",
      statusLabel: "有限支援",
      statusDetail: "目前只會建立 metadata / reference-level 記錄，不預設 OCR 或完整全文理解。",
      impactDetail: "這份材料可被保留為 reference，但不能直接假裝成完整文字證據或完整抽文來源。",
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

  if (extension === ".pdf") {
    return {
      id: `file-${index}`,
      kind: "file",
      kindLabel: "檔案",
      index,
      title: file.name,
      metadata,
      preview: "",
      status: "pending",
      statusLabel: "待解析",
      statusDetail: "PDF 會在匯入時判斷是否為 text-first；若是掃描型 PDF，會降成 metadata / reference-level，不預設 OCR。",
      impactDetail: "建立前不能先假設它一定能抽出可用正文；最終可用範圍要看實際解析結果。",
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
      status: "unsupported",
      statusLabel: "尚未正式支援",
      statusDetail: "這份材料目前不在正式 intake 邊界內，不能直接當成正式可解析來源。",
      impactDetail: "它不會進正常分析主鏈，建立按鈕也會 fail-closed，避免把 unsupported 材料誤當成已接受。",
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
    status: "accepted",
    statusLabel: "已接受",
    statusDetail: "建立案件後會走正式文字或表格擷取流程，並掛回同一個案件世界。",
    impactDetail: "可直接進來源、證據與交付物主鏈，不需要另外降級成 metadata-only。",
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
      status: "issue",
      statusLabel: "待修正",
      statusDetail: "這個網址格式目前不完整，系統無法可靠判斷要抓哪個來源。",
      impactDetail: "若直接送出，後續很可能無法抓取正文，也無法穩定形成可用 source material。",
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
    status: "pending",
    statusLabel: "待解析",
    statusDetail: "URL 屬正式支援來源；建立後會實際嘗試抓取標題與文字內容。",
    impactDetail: "目前還不能先假設已成功抽到正文；若來源沒有可讀內容或受權限限制，後續會轉成 ingestion issue。",
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
    status: "accepted",
    statusLabel: "已接受",
    statusDetail: "這段內容會直接作為正式 source material 掛回同一個案件，不需另外轉格式。",
    impactDetail: "它可直接進來源與證據主鏈，通常是最穩定的 fallback material strategy。",
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
  context,
}: {
  supportLevel: string | null;
  ingestStatus: string | null;
  ingestStrategy: string | null;
  metadataOnly: boolean;
  ingestionError?: string | null;
  context?: MaterialRemediationContext;
}): RuntimeMaterialHandlingSummary {
  if (ingestStatus === "failed") {
    const failed = classifyFailedIngest(ingestionError);
    return {
      status: "issue",
      statusLabel: "處理失敗",
      statusDetail: failed.statusDetail,
      impactDetail: failed.impactDetail,
      recommendedNextStep: laneAwareNextStep(context, {
        intake: failed.recommendedNextStep,
        oneOff: "若這份材料是這次交付依據，請優先換成可讀文字版、摘要或替代來源，再繼續。",
        followUp: "若這份材料是這輪 checkpoint 要補的依據，請優先補文字版、摘要或替代來源，再回主線更新。",
        continuous: "若這份材料是這輪 progression 要驗證的依據，請優先補文字版、摘要或替代來源，再回主線續推。",
        workspace: failed.recommendedNextStep,
      }),
      fallbackStrategy: failed.fallbackStrategy,
    };
  }

  if (supportLevel === "unsupported" || ingestStatus === "unsupported") {
    return {
      status: "unsupported",
      statusLabel: "尚未正式支援",
      statusDetail: "目前不會把這份材料當成正式可解析來源；它只會保留最小記錄或直接被拒絕。",
      impactDetail: "它不會進正常文字分析或 evidence extraction，也不應被當成只要等等就會自動成功。",
      recommendedNextStep: laneAwareNextStep(context, {
        intake: "請先移除，改成正式支援格式，或直接補文字摘要 / 可讀 URL。",
        oneOff: "若這份材料會影響這次交付物，請先改成正式支援格式或補文字摘要。",
        followUp: "若這份材料是這輪 checkpoint 需要的依據，請先改成正式支援格式或補文字摘要。",
        continuous: "若這份材料是這輪 progression 需要的依據，請先改成正式支援格式或補文字摘要。",
        workspace: "請改補正式支援格式、公開可讀來源，或直接貼出文字摘要。",
      }),
      fallbackStrategy: "常見替代是 PDF、DOCX、TXT、CSV、可讀 URL，或直接補重點摘要。",
    };
  }

  if (
    supportLevel === "limited" ||
    metadataOnly ||
    ingestStatus === "metadata_only" ||
    ingestStrategy === "reference_image" ||
    ingestStrategy === "pdf_metadata_only"
  ) {
    return {
      status: "limited",
      statusLabel: "有限支援",
      statusDetail:
        ingestStrategy === "reference_image"
          ? "目前只建立影像 reference / metadata，不預設 OCR 或完整全文理解。"
          : "目前只建立 metadata / reference-level 記錄；若是掃描型 PDF 或低文字密度來源，不會假裝成完整全文支援。",
      impactDetail:
        ingestStrategy === "reference_image"
          ? "這份材料可作 reference，但不能直接當成完整文字證據或完整全文來源。"
          : "這份材料可保留在案件世界內，但不能假裝已完整抽文，也不應直接當成穩定 evidence extraction 來源。",
      recommendedNextStep: laneAwareNextStep(context, {
        intake: "若你需要正式文字分析，建議補文字版、OCR 後文字、可讀 URL，或至少貼重點摘要。",
        oneOff: "若這份材料是本次交付依據，建議補文字版或摘要，避免交付物只剩 reference-level 依據。",
        followUp: "若這份材料要支撐這輪 checkpoint，建議補文字版、OCR 後文字或人工摘要。",
        continuous: "若這份材料要支撐這輪 progression 判斷，建議補文字版、OCR 後文字或人工摘要。",
        workspace: "若你希望它真的參與 evidence chain，請補文字版、OCR 後文字或人工摘要。",
      }),
      fallbackStrategy: "較佳替代方式是 text-first PDF、DOCX、TXT、可讀 URL，或直接補貼文字重點。",
    };
  }

  if (ingestStrategy === "remote_text_extract" || ingestStrategy === "text_first_pdf") {
    return {
      status: "accepted",
      statusLabel: "已接受",
      statusDetail: "這份材料已走正式內容擷取流程，後續會以正式來源與證據鏈回看。",
      impactDetail: "它可直接進來源、證據與交付物主鏈，不需要另外降成 metadata-only。",
      recommendedNextStep: laneAwareNextStep(context, {
        intake: "可直接沿正式主鏈使用；若還有材料，後續再分批補件。",
        oneOff: "這份材料已可直接支撐這次交付物，接著可回主線完成分析與交付。",
        followUp: "這份材料已可直接支撐這輪 checkpoint，補完後就可回主線更新。",
        continuous: "這份材料已可直接支撐這輪 progression，補完後就可回主線續推。",
        workspace: "可直接回看 evidence chain，確認它實際支撐了哪些 recommendation / risk / action。",
      }),
      fallbackStrategy: null,
    };
  }

  if (ingestStatus === "processed" && supportLevel === "full") {
    return {
      status: "accepted",
      statusLabel: "已接受",
      statusDetail: "這份材料已正式進入案件世界，可直接參與來源、證據與交付物主鏈。",
      impactDetail: "它現在就是正式可用來源，不需要再用 fallback material strategy 補它才能啟動分析。",
      recommendedNextStep: laneAwareNextStep(context, {
        intake: "可直接走正式主鏈；若還有其他材料，再分批補件即可。",
        oneOff: "可直接拿來支撐這次交付物，再視需要補更多依據。",
        followUp: "可直接拿來補這輪 checkpoint，再回案件工作面更新結論。",
        continuous: "可直接拿來補這輪 progression，再回案件工作面更新 action / outcome。",
        workspace: "可直接回看它目前支撐了哪些證據與輸出，不需要先做 remediation。",
      }),
      fallbackStrategy: null,
    };
  }

  return {
    status: "pending",
    statusLabel: "待處理",
    statusDetail: "這份材料已被接收，但仍待系統確認最終解析層級。",
    impactDetail: "現在還不能先假設它已成功抽出正文或已穩定進 evidence chain；最終可用範圍要看實際解析結果。",
    recommendedNextStep: laneAwareNextStep(context, {
      intake: "可先建立案件，但建立後請回工作面確認最終解析結果；若最後沒能抽文，請補文字版或摘要。",
      oneOff: "若這份材料是本次交付依據，請優先確認最終解析結果；若沒有正文，補文字版或摘要。",
      followUp: "若這份材料是這輪 checkpoint 依據，請先確認最終解析結果；若沒有正文，補文字版或摘要。",
      continuous: "若這份材料是這輪 progression 依據，請先確認最終解析結果；若沒有正文，補文字版或摘要。",
      workspace: "先確認最終解析結果；若最後只有 metadata-only 或失敗，請補文字版、摘要或替代來源。",
    }),
    fallbackStrategy: "最保守的替代方式是 text-first PDF、DOCX、TXT、可讀 URL，或直接補文字摘要。",
  };
}
