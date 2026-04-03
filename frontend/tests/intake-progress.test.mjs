import test from "node:test";
import assert from "node:assert/strict";

import {
  buildIntakePreviewItems,
  defaultProgressInfoForPreviewItem,
  describeRuntimeMaterialHandling,
  progressInfoFromRuntimeHandling,
  summarizeBatchProgress,
} from "../src/lib/intake.ts";
import {
  buildFlagshipLaneView,
  CONSULTANT_START_OPTIONS,
  resolveWorkflowValueForConsultingStart,
} from "../src/lib/flagship-lane.ts";
import { buildResearchGuidanceView } from "../src/lib/research-lane.ts";

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

test("consultant-facing start modes stay separate from internal workflow labels", () => {
  assert.deepEqual(
    CONSULTANT_START_OPTIONS.map((item) => item.value),
    ["diagnostic_start", "material_review_start", "decision_convergence_start"],
  );
  assert.equal(CONSULTANT_START_OPTIONS[0]?.label, "先快速看清問題與下一步");
  assert.equal(CONSULTANT_START_OPTIONS[1]?.label, "先審閱手上已有材料");
  assert.equal(CONSULTANT_START_OPTIONS[2]?.label, "先比較方案並收斂決策");

  assert.equal(
    resolveWorkflowValueForConsultingStart("diagnostic_start", "需要快速盤點目前問題與下一步"),
    "research_synthesis",
  );
  assert.equal(
    resolveWorkflowValueForConsultingStart("material_review_start", "請審閱這份 agreement 的 termination 條款"),
    "contract_review",
  );
  assert.equal(
    resolveWorkflowValueForConsultingStart("material_review_start", "請幫我重整這份 proposal 草稿結構"),
    "document_restructuring",
  );
  assert.equal(
    resolveWorkflowValueForConsultingStart("decision_convergence_start", "請比較三種方案後給建議"),
    "multi_agent",
  );
});

test("flagship lane view exposes current output level and upgrade checklist", () => {
  const lane = buildFlagshipLaneView({
    label: "先快速看清問題與下一步",
    summary: "先用探索級方式整理第一輪判斷。",
    next_step_summary: "先補至少一份正式來源材料。",
    upgrade_note: "補完之後可升級成評估 / 審閱備忘。",
    current_output_label: "探索型簡報",
    current_output_summary: "目前先形成探索級交付。",
    upgrade_target_label: "評估 / 審閱備忘",
    upgrade_requirements: ["至少補 1 份正式來源材料", "補到至少 2 則可用證據"],
    upgrade_ready: false,
    boundary_note: "這一輪不應被誤讀成完整決策結論。",
  });

  assert.equal(lane.currentOutputLabel, "探索型簡報");
  assert.equal(lane.upgradeTargetLabel, "評估 / 審閱備忘");
  assert.equal(lane.upgradeReady, false);
  assert.equal(lane.upgradeRequirements.length, 2);
  assert.match(lane.boundaryNote, /誤讀|完整決策/);
});

test("research guidance view turns backend guidance into low-noise consultant copy", () => {
  const guidance = buildResearchGuidanceView({
    status: "recommended",
    label: "如果要補研究",
    summary: "這輪案件已有明顯研究缺口，建議先補研究。",
    recommended_depth: "standard_investigation",
    suggested_questions: [
      "目前最需要先查清楚的外部事實是什麼？",
      "哪些公開來源最能補上主要證據期待？",
    ],
    evidence_gap_focus: ["外部政策變化", "競品反應"],
    stop_condition: "當主要子題都有可信來源時，就先停止補研究。",
    handoff_summary: "研究結果先交回主控代理收斂。",
    latest_run_summary: "",
    boundary_note: "研究是為了補齊缺口，不是先把所有公開資訊都抓完。",
  });

  assert.equal(guidance.shouldShow, true);
  assert.equal(guidance.depthLabel, "標準研究");
  assert.equal(guidance.firstQuestion, "目前最需要先查清楚的外部事實是什麼？");
  assert.equal(guidance.focusSummary, "外部政策變化｜競品反應");
  assert.match(guidance.boundaryNote, /補齊缺口/);
});
