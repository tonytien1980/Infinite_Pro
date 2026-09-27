import test from "node:test";
import assert from "node:assert/strict";
import { describeRuntimeMaterialHandling } from "../src/lib/intake.ts";
import { labelForSourceIngestStrategy } from "../src/lib/ui-labels.ts";

test("partially read PDF explains missing pages without calling it a table snapshot", () => {
  const result = describeRuntimeMaterialHandling({
    supportLevel: "limited", ingestStatus: "processed", ingestStrategy: "text_first_pdf",
    metadataOnly: false, diagnosticCategory: "accepted_partial_extract",
    extractAvailability: "partial_extract_ready", currentUsableScope: "limited_extract",
    ingestionError: "第 2 頁尚未完成 OCR 核對。",
  });
  assert.equal(result.statusLabel, "部分內容待確認");
  assert.match(result.statusDetail, /第 2 頁/);
  assert.doesNotMatch(result.usableScopeDetail, /snapshot|evidence chain|表格快照/);
});

test("old material is not claimed to be completely read", () => {
  const result = describeRuntimeMaterialHandling({
    supportLevel: "full", ingestStatus: "processed", ingestStrategy: "text_extract",
    metadataOnly: false, diagnosticCategory: "extraction_unverified",
    extractAvailability: "unverified", currentUsableScope: "limited_extract",
  });
  assert.equal(result.statusLabel, "讀取範圍待確認");
  assert.match(result.statusDetail, /尚未.*讀取範圍/);
  assert.equal(result.status, "limited");
});

test("structured spreadsheet strategies use consultant-facing labels", () => {
  assert.equal(labelForSourceIngestStrategy("csv_structured_extract"), "CSV 表格讀取");
  assert.equal(labelForSourceIngestStrategy("worksheet_structured_extract"), "Excel 表格讀取");
});

test("completed OCR still asks to verify important facts without claiming unread pages", () => {
  const result = describeRuntimeMaterialHandling({
    supportLevel: "limited", ingestStatus: "processed", ingestStrategy: "image_ocr",
    metadataOnly: false, diagnosticCategory: "accepted_extract_needs_check",
    extractAvailability: "full_text_ready", currentUsableScope: "limited_extract",
    ingestionError: "OCR 辨識文字可能有誤，重要數字請核對。",
  });
  assert.equal(result.statusLabel, "已讀取，請核對");
  assert.doesNotMatch(result.statusDetail, /未讀|表格快照/);
});
