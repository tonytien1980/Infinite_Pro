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
import { ADOPTION_FEEDBACK_OPTIONS, buildAdoptionFeedbackView } from "../src/lib/adoption-feedback.ts";
import { buildContinuationAdvisoryView } from "../src/lib/continuation-advisory.ts";
import { buildMaterialReviewPostureView } from "../src/lib/material-review-ux.ts";
import { buildContinuationPostureView } from "../src/lib/continuity-ux.ts";
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
    label: "系統研究建議",
    summary: "這輪案件已有明顯研究缺口，建議先由系統研究主線補公開來源。",
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
    execution_owner_label: "由系統研究主線處理",
    supplement_boundary_note: "若缺的是客戶內部資料、附件或會議紀錄，請改走補件主鏈。",
    source_quality_summary: "優先官方、原始與第一手來源；若是新聞型題材，至少交叉比對近期公開來源。",
    freshness_summary: "這輪高度依賴近期訊號，若來源太舊，判斷可能失真。",
    contradiction_watchouts: ["若官方說法與市場報導不一致，需保留矛盾訊號。"],
    citation_ready_summary: "研究輸出應保留來源、矛盾與可回看引用線索，再交回主控代理收斂。",
    evidence_gap_closure_plan: ["先補關稅政策與出口限制的近期官方來源。"],
  });

  assert.equal(guidance.shouldShow, true);
  assert.equal(guidance.label, "系統研究建議");
  assert.equal(guidance.depthLabel, "標準研究");
  assert.equal(guidance.firstQuestion, "目前最需要先查清楚的外部事實是什麼？");
  assert.equal(guidance.focusSummary, "外部政策變化｜競品反應");
  assert.equal(guidance.executionOwnerLabel, "由系統研究主線處理");
  assert.match(guidance.supplementBoundaryNote, /補件主鏈/);
  assert.match(guidance.boundaryNote, /補齊缺口/);
  assert.match(guidance.sourceQualitySummary, /官方|第一手/);
  assert.match(guidance.freshnessSummary, /近期訊號/);
  assert.equal(guidance.contradictionWatchouts.length, 1);
  assert.match(guidance.citationReadySummary, /來源|矛盾/);
  assert.equal(guidance.evidenceGapClosurePlan.length, 1);
});

test("continuity posture view keeps follow-up distinct from one-off and continuous", () => {
  const oneOff = buildContinuationPostureView({
    workflow_layer: "closure",
    current_state: "closure_ready",
    summary: "one-off summary",
  });
  const followUp = buildContinuationPostureView({
    workflow_layer: "checkpoint",
    current_state: "checkpoint_ready",
    summary: "follow-up summary",
  });
  const continuous = buildContinuationPostureView({
    workflow_layer: "progression",
    current_state: "progression_ready",
    summary: "continuous summary",
  });

  assert.equal(oneOff.modeLabel, "一次性交付 / 結案");
  assert.match(oneOff.primarySummary, /結案|匯出|發布/);

  assert.equal(followUp.modeLabel, "回來更新 / checkpoint");
  assert.match(followUp.primarySummary, /回來更新/);
  assert.doesNotMatch(followUp.primarySummary, /outcome|progression/i);

  assert.equal(continuous.modeLabel, "持續推進 / outcome");
  assert.match(continuous.primarySummary, /進度|outcome|結果/);
});

test("material review posture view keeps document-heavy review distinct from other lanes", () => {
  const review = buildMaterialReviewPostureView(
    buildFlagshipLaneView({
      lane_id: "material_review_start",
      label: "先審閱手上已有材料",
      summary: "目前主要在圍繞核心材料形成 review / assessment 判斷。",
      next_step_summary: "先把核心材料審完，確認高風險點與缺口。",
      upgrade_note: "若補進更多背景，再升級成決策收斂。",
      current_output_label: "評估 / 審閱備忘",
      current_output_summary: "目前先形成 review memo。",
      upgrade_target_label: "決策 / 行動交付物",
      upgrade_requirements: ["至少再補 1 類不同來源背景材料"],
      upgrade_ready: false,
      boundary_note: "這份內容目前仍不是最終決策版本。",
    }),
  );

  assert.equal(review.modeLabel, "材料審閱 / review memo");
  assert.match(review.primarySummary, /核心材料|review memo|審完/);
  assert.match(review.boundaryNote, /最終決策版本/);
});

test("adoption feedback view exposes lightweight consultant-facing feedback states", () => {
  assert.deepEqual(
    ADOPTION_FEEDBACK_OPTIONS.map((item) => item.value),
    ["adopted", "needs_revision", "not_adopted", "template_candidate"],
  );

  const feedback = buildAdoptionFeedbackView({
    id: "feedback-1",
    task_id: "task-1",
    matter_workspace_id: "matter-1",
    deliverable_id: "deliverable-1",
    recommendation_id: null,
    feedback_status: "template_candidate",
    note: "",
    created_at: "2026-04-03T00:00:00Z",
    updated_at: "2026-04-03T00:00:00Z",
  });

  assert.equal(feedback.currentStatus, "template_candidate");
  assert.equal(feedback.currentLabel, "值得當範本");
  assert.equal(feedback.hasFeedback, true);
});

test("continuous advisory view exposes health, timeline, and next-step queue in consultant-facing copy", () => {
  const view = buildContinuationAdvisoryView({
    workflow_layer: "progression",
    current_state: "active",
    health_signal: {
      status: "steady",
      label: "推進穩定",
      summary: "主要阻塞已解除，現在應優先確認是否刷新交付物。",
    },
    timeline_items: [
      {
        kind: "progression",
        title: "最新推進",
        summary: "第二輪 outcome 顯示主要阻塞已解除，可以考慮刷新 deliverable。",
        created_at: "2026-04-03T14:00:00Z",
        task_id: "task-2",
        task_title: "Second progression",
        deliverable_id: "deliverable-2",
        deliverable_title: "Second deliverable",
      },
      {
        kind: "progression",
        title: "上一輪推進",
        summary: "第一輪 action 已啟動，但目前仍在跨部門協調中。",
        created_at: "2026-04-03T13:00:00Z",
        task_id: "task-1",
        task_title: "First progression",
        deliverable_id: "deliverable-1",
        deliverable_title: "First deliverable",
      },
    ],
    next_step_queue: [
      "確認是否要刷新最新 deliverable，讓已完成 action 的 outcome 被正式寫回。",
      "回案件工作面補一筆 progression update，確認目前最重要的 action 與 outcome。",
    ],
    outcome_tracking: {
      label: "結果已開始站穩",
      summary: "最近 outcome 已顯示主要阻塞解除，值得確認是否刷新交付物。",
      latest_signal_summary: "第二輪 outcome 顯示主要阻塞已解除，可以考慮刷新 deliverable。",
      needs_deliverable_refresh: true,
      tracked_signal_count: 2,
    },
    review_rhythm: {
      label: "本週內回看",
      summary: "主要阻塞已解除，建議這週內確認是否要刷新 deliverable。",
      next_review_prompt: "下次回看時，先確認這輪 outcome 是否已足以改寫正式交付物。",
    },
  });

  assert.equal(view.shouldShow, true);
  assert.equal(view.healthLabel, "推進穩定");
  assert.equal(view.timelineTitle, "最近推進時間線");
  assert.equal(view.timelineItems.length, 2);
  assert.match(view.timelineItems[0].summary, /阻塞已解除/);
  assert.equal(view.nextStepQueue.length, 2);
  assert.equal(view.outcomeTrackingLabel, "結果已開始站穩");
  assert.equal(view.reviewRhythmLabel, "本週內回看");
  assert.match(view.nextReviewPrompt, /刷新交付物|改寫正式交付物/);
});

test("follow-up advisory view exposes checkpoint timeline and review rhythm without reading like continuous", () => {
  const view = buildContinuationAdvisoryView({
    workflow_layer: "checkpoint",
    current_state: "checkpoint_ready",
    health_signal: {
      status: "steady",
      label: "更新節奏已站穩",
      summary: "最近 checkpoint 已形成，而且這輪變化已可讀。",
    },
    timeline_items: [
      {
        kind: "checkpoint",
        title: "最新 checkpoint",
        summary: "Checkpoint B：這輪改成優先修正 premium 報價敘事，渠道主線先延續。",
        created_at: "2026-04-03T14:00:00Z",
        task_id: "task-2",
        task_title: "Follow-up refresh",
        deliverable_id: "deliverable-2",
        deliverable_title: "Follow-up deliverable",
      },
      {
        kind: "checkpoint",
        title: "上一個 checkpoint",
        summary: "Checkpoint A：先維持主方案，但需追蹤報價與渠道效率。",
        created_at: "2026-04-03T13:00:00Z",
        task_id: "task-1",
        task_title: "Follow-up baseline",
        deliverable_id: "deliverable-1",
        deliverable_title: "Baseline deliverable",
      },
    ],
    next_step_queue: [
      "先補 premium 轉換與定價反饋，再回來更新 checkpoint。",
    ],
    outcome_tracking: null,
    review_rhythm: {
      label: "有新資料就回來更新",
      summary: "這類案件以 milestone 更新為主，不需要固定用長期推進節奏回看。",
      next_review_prompt: "下次回看時，先確認最新補件是否足以改寫 checkpoint。",
    },
  });

  assert.equal(view.shouldShow, true);
  assert.equal(view.timelineTitle, "最近 checkpoint 時間線");
  assert.equal(view.timelineItems[0].kind, "checkpoint");
  assert.equal(view.reviewRhythmLabel, "有新資料就回來更新");
  assert.equal(view.outcomeTrackingLabel, "");
  assert.doesNotMatch(view.healthSummary, /outcome|progression/i);
});
