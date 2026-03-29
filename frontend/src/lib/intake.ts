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
}

export interface RuntimeMaterialHandlingSummary {
  status: IntakePreviewStatus;
  statusLabel: string;
  statusDetail: string;
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

function buildFilePreviewItem(file: File, index: number): IntakeMaterialPreviewItem {
  const extension = extensionFromName(file.name);
  const metadata = [
    extension ? extension.slice(1).toUpperCase() : "未知格式",
    file.type || "未提供 MIME",
    `${Math.max(1, Math.round(file.size / 1024))} KB`,
  ];

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
      statusDetail: "這份材料目前不在正式 intake 邊界內。請先移除，或改成正式支援格式再建立案件。",
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
  };
}

function buildUrlPreviewItem(url: string, index: number): IntakeMaterialPreviewItem {
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
    statusDetail: "URL 屬正式支援來源；建立案件後會嘗試抓取標題與文字內容，若沒有可讀正文或權限不足，會明確標示 ingestion issue。",
  };
}

function buildTextPreviewItem(text: string): IntakeMaterialPreviewItem | null {
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
}: {
  files: File[];
  urls: string[];
  pastedText: string;
}) {
  const items: IntakeMaterialPreviewItem[] = [];
  files.forEach((file, index) => {
    items.push(buildFilePreviewItem(file, index));
  });
  urls.forEach((url, index) => {
    items.push(buildUrlPreviewItem(url, index));
  });
  const textItem = buildTextPreviewItem(pastedText);
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
}: {
  supportLevel: string | null;
  ingestStatus: string | null;
  ingestStrategy: string | null;
  metadataOnly: boolean;
}): RuntimeMaterialHandlingSummary {
  if (ingestStatus === "failed") {
    return {
      status: "issue",
      statusLabel: "處理失敗",
      statusDetail: "這份材料未能完成正式解析；請考慮重新補件，或改用更乾淨的正式支援格式。",
    };
  }

  if (supportLevel === "unsupported" || ingestStatus === "unsupported") {
    return {
      status: "unsupported",
      statusLabel: "尚未正式支援",
      statusDetail: "目前不會把這份材料當成正式可解析來源；它只會保留最小記錄或直接被拒絕。",
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
    };
  }

  if (ingestStrategy === "remote_text_extract" || ingestStrategy === "text_first_pdf") {
    return {
      status: "accepted",
      statusLabel: "已接受",
      statusDetail: "這份材料已走正式內容擷取流程，後續會以正式來源與證據鏈回看。",
    };
  }

  if (ingestStatus === "processed" && supportLevel === "full") {
    return {
      status: "accepted",
      statusLabel: "已接受",
      statusDetail: "這份材料已正式進入案件世界，可直接參與來源、證據與交付物主鏈。",
    };
  }

  return {
    status: "pending",
    statusLabel: "待處理",
    statusDetail: "這份材料已被接收，但仍待系統確認最終解析層級。",
  };
}
