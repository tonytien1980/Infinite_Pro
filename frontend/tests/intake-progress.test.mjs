import test from "node:test";
import assert from "node:assert/strict";

import {
  buildIntakePreviewItems,
  defaultProgressInfoForPreviewItem,
  describeRuntimeMaterialHandling,
  progressInfoFromRuntimeHandling,
  summarizeBatchProgress,
} from "../src/lib/intake.ts";

test("batch progress summary distinguishes done, parsing, failed, blocking, and reference-only items", () => {
  const items = buildIntakePreviewItems({
    files: [
      new File(["png"], "photo.png", { type: "image/png" }),
      new File(["pdf"], "brief.pdf", { type: "application/pdf" }),
      new File(["deck"], "deck.pptx", {
        type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      }),
    ],
    urls: ["https://example.com/report"],
    pastedText: "manual note",
    context: { lane: "intake" },
  });

  const summary = summarizeBatchProgress({
    items,
    progressByItemId: {
      [items[0].id]: {
        ...defaultProgressInfoForPreviewItem(items[0], { keepAsReference: true }),
        attemptCount: 1,
      },
      [items[1].id]: {
        phase: "parsing",
        label: "待解析",
        detail: "這份材料仍待解析。",
        blocksSubmit: false,
        retryable: false,
        attemptCount: 1,
      },
      [items[2].id]: defaultProgressInfoForPreviewItem(items[2]),
    },
    keepAsReferenceByItemId: {
      [items[0].id]: true,
    },
    sessionStates: [
      {
        itemId: "uploaded-1",
        title: "already-done.txt",
        kindLabel: "檔案",
        progress: {
          phase: "done",
          label: "已接受",
          detail: "已進主鏈。",
          blocksSubmit: false,
          retryable: false,
          attemptCount: 1,
          latestAttemptLabel: "第 1 次結果：已接受",
          latestAttemptDetail: "已進主鏈。",
        },
      },
      {
        itemId: "failed-1",
        title: "retry-later.txt",
        kindLabel: "檔案",
        progress: {
          phase: "failed",
          label: "失敗，可重試",
          detail: "這份材料這輪未成功。",
          blocksSubmit: false,
          retryable: true,
          attemptCount: 2,
          latestAttemptLabel: "第 2 次結果：處理失敗",
          latestAttemptDetail: "network timeout",
        },
      },
    ],
  });

  assert.equal(summary.total, 7);
  assert.equal(summary.completed, 1);
  assert.equal(summary.processing, 1);
  assert.equal(summary.pending, 3);
  assert.equal(summary.failed, 1);
  assert.equal(summary.blocking, 1);
  assert.equal(summary.referenceOnly, 1);
});

test("runtime handling distinguishes retryable and non-retryable failures", () => {
  const retryable = progressInfoFromRuntimeHandling({
    status: "issue",
    statusLabel: "處理失敗",
    statusDetail: "network timeout while fetching source",
    impactDetail: "impact",
    recommendedNextStep: "next",
    fallbackStrategy: "fallback",
    retryable: true,
  });
  assert.equal(retryable.phase, "failed");
  assert.equal(retryable.retryable, true);

  const nonRetryable = progressInfoFromRuntimeHandling({
    status: "issue",
    statusLabel: "處理失敗",
    statusDetail: "上傳檔案為空白內容。",
    impactDetail: "impact",
    recommendedNextStep: "next",
    fallbackStrategy: "fallback",
    retryable: false,
  });
  assert.equal(nonRetryable.phase, "failed");
  assert.equal(nonRetryable.retryable, false);
});

test("preview items expose clearer diagnostic category and usable scope", () => {
  const items = buildIntakePreviewItems({
    files: [
      new File(["img"], "diagram.png", { type: "image/png" }),
      new File(["pdf"], "scan.pdf", { type: "application/pdf" }),
      new File(["deck"], "deck.pptx", {
        type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      }),
    ],
    urls: ["https://example.com/report"],
    pastedText: "manual note",
    context: { lane: "follow_up", updateGoal: "補齊 checkpoint 缺口" },
  });

  const png = items.find((item) => item.title === "diagram.png");
  const pdf = items.find((item) => item.title === "scan.pdf");
  const pptx = items.find((item) => item.title === "deck.pptx");
  const text = items.find((item) => item.kind === "text");

  assert.equal(png?.diagnosticCategory, "reference_only");
  assert.equal(png?.usableScopeLabel, "僅可 reference-level 保留");
  assert.match(png?.impactDetail ?? "", /checkpoint/i);

  assert.equal(pdf?.diagnosticCategory, "parse_pending");
  assert.equal(pdf?.retryabilityLabel, "先等解析，不必先重試");

  assert.equal(pptx?.diagnosticCategory, "format_unsupported");
  assert.equal(pptx?.retryabilityLabel, "重試通常沒有幫助");

  assert.equal(text?.diagnosticCategory, "accepted_full");
  assert.equal(text?.retryabilityLabel, "不需要重試");
});

test("runtime handling exposes diagnostic category, retryability explanation, and usable scope", () => {
  const fetchFailure = describeRuntimeMaterialHandling({
    supportLevel: "unsupported",
    ingestStatus: "failed",
    ingestStrategy: "remote_fetch",
    metadataOnly: true,
    ingestionError: "403 forbidden while fetching source",
    context: { lane: "continuous", updateGoal: "驗證 action handoff" },
  });
  assert.equal(fetchFailure.diagnosticCategory, "fetch_access_failure");
  assert.equal(fetchFailure.retryable, false);
  assert.equal(fetchFailure.retryabilityLabel, "不建議直接重試");
  assert.match(fetchFailure.retryabilityDetail, /權限|存取/);
  assert.match(fetchFailure.impactDetail, /progression/i);

  const limited = describeRuntimeMaterialHandling({
    supportLevel: "limited",
    ingestStatus: "processed",
    ingestStrategy: "reference_image",
    metadataOnly: true,
    ingestionError: null,
    context: { lane: "follow_up", updateGoal: "補強 latest checkpoint" },
  });
  assert.equal(limited.diagnosticCategory, "reference_only");
  assert.equal(limited.usableScopeLabel, "僅可 reference-level 保留");
  assert.equal(limited.retryabilityLabel, "重試通常沒有幫助");
  assert.match(limited.retryabilityDetail, /不是暫時性失敗/);

  const pending = describeRuntimeMaterialHandling({
    supportLevel: "full",
    ingestStatus: "pending",
    ingestStrategy: "remote_text_extract",
    metadataOnly: false,
    ingestionError: null,
    context: { lane: "intake" },
  });
  assert.equal(pending.diagnosticCategory, "parse_pending");
  assert.equal(pending.status, "pending");
});
