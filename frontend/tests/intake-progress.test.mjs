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
  buildFlagshipDetailView,
  buildFlagshipLaneView,
  CONSULTANT_START_OPTIONS,
  resolveWorkflowValueForConsultingStart,
} from "../src/lib/flagship-lane.ts";
import { ADOPTION_FEEDBACK_OPTIONS, buildAdoptionFeedbackView } from "../src/lib/adoption-feedback.ts";
import {
  buildContinuationAdvisoryView,
  buildContinuationDetailView,
  buildContinuationFocusSummary,
} from "../src/lib/continuation-advisory.ts";
import { buildMaterialReviewPostureView } from "../src/lib/material-review-ux.ts";
import {
  buildPrecedentCandidateActionView,
  buildPrecedentCandidateSummaryView,
  buildPrecedentCandidateView,
} from "../src/lib/precedent-candidates.ts";
import {
  buildPrecedentDuplicateActionView,
  buildPrecedentDuplicateSummaryView,
} from "../src/lib/precedent-duplicates.ts";
import {
  buildPrecedentReviewPriorityView,
  filterPrecedentReviewItems,
} from "../src/lib/precedent-review.ts";
import { buildPrecedentReferenceView } from "../src/lib/precedent-reference.ts";
import { buildReviewLensView } from "../src/lib/review-lenses.ts";
import { buildContinuationPostureView } from "../src/lib/continuity-ux.ts";
import { buildResearchDetailView, buildResearchGuidanceView } from "../src/lib/research-lane.ts";

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

test("continuity focus summary keeps checkpoint and progression wording aligned across work surfaces", () => {
  const checkpointSummary = buildContinuationFocusSummary({
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
        created_at: "2026-04-04T09:00:00Z",
        task_id: "task-2",
        task_title: "Follow-up refresh",
        deliverable_id: "deliverable-2",
        deliverable_title: "Follow-up deliverable",
      },
    ],
    next_step_queue: ["先補 premium 轉換與定價反饋，再回來更新 checkpoint。"],
    outcome_tracking: null,
    review_rhythm: {
      label: "有新資料就回來更新",
      summary: "這類案件以 milestone 更新為主。",
      next_review_prompt: "下次回看時，先確認最新補件是否足以改寫 checkpoint。",
    },
  });
  const progressionSummary = buildContinuationFocusSummary({
    workflow_layer: "progression",
    current_state: "progression_ready",
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
        created_at: "2026-04-04T10:00:00Z",
        task_id: "task-3",
        task_title: "Continuous progression",
        deliverable_id: "deliverable-3",
        deliverable_title: "Continuous deliverable",
      },
    ],
    next_step_queue: ["確認是否要刷新最新 deliverable，讓已完成 action 的 outcome 被正式寫回。"],
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

  assert.equal(checkpointSummary.label, "回來更新節奏");
  assert.match(checkpointSummary.title, /Checkpoint B/);
  assert.match(checkpointSummary.copy, /有新資料就回來更新/);
  assert.doesNotMatch(checkpointSummary.copy, /outcome|progression/i);

  assert.equal(progressionSummary.label, "持續推進節奏");
  assert.equal(progressionSummary.title, "結果已開始站穩");
  assert.match(progressionSummary.copy, /本週內回看/);
  assert.match(progressionSummary.copy, /刷新 deliverable|改寫正式交付物/);
});

test("continuity detail view keeps second-layer checkpoint and progression reading aligned", () => {
  const checkpointDetail = buildContinuationDetailView({
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
        summary: "Checkpoint B：改成優先修正 premium 報價敘事，渠道主線先延續。",
        created_at: "2026-04-04T09:00:00Z",
        task_id: "task-2",
        task_title: "Follow-up refresh",
        deliverable_id: "deliverable-2",
        deliverable_title: "Follow-up deliverable",
      },
      {
        kind: "checkpoint",
        title: "上一個 checkpoint",
        summary: "Checkpoint A：先確認這輪補件是否足以改寫 checkpoint。",
        created_at: "2026-04-04T08:00:00Z",
        task_id: "task-1",
        task_title: "Follow-up baseline",
        deliverable_id: "deliverable-1",
        deliverable_title: "Baseline deliverable",
      },
    ],
    next_step_queue: ["先補 premium 轉換與定價反饋，再回來更新 checkpoint。"],
    outcome_tracking: null,
    review_rhythm: {
      label: "有新資料就回來更新",
      summary: "這類案件以 milestone 更新為主。",
      next_review_prompt: "下次回看時，先確認最新補件是否足以改寫 checkpoint。",
    },
    follow_up_lane: {
      latest_update: {
        record_id: "record-2",
        task_id: "task-2",
        task_title: "Follow-up refresh",
        deliverable_id: "deliverable-2",
        deliverable_title: "Follow-up deliverable",
        summary: "Checkpoint B：改成優先修正 premium 報價敘事，渠道主線先延續。",
        created_at: "2026-04-04T09:00:00Z",
      },
      previous_checkpoint: {
        record_id: "record-1",
        task_id: "task-1",
        task_title: "Follow-up baseline",
        deliverable_id: "deliverable-1",
        deliverable_title: "Baseline deliverable",
        summary: "Checkpoint A：先確認這輪補件是否足以改寫 checkpoint。",
        created_at: "2026-04-04T08:00:00Z",
      },
      recent_checkpoints: [],
      what_changed: ["這輪有 2 項建議被新增或重新浮出。"],
      recommendation_changes: [
        {
          kind: "recommendation",
          title: "Premium 報價",
          change_type: "added",
          summary: "需要重新整理定價敘事。",
        },
      ],
      risk_changes: [],
      action_changes: [],
      next_follow_up_actions: ["先補至少一份檔案、網址或 pasted text。"],
      evidence_update_goal: "這次補件主要是為了補強最新後續更新的判斷基礎。",
    },
    progression_lane: null,
  });

  const progressionDetail = buildContinuationDetailView({
    workflow_layer: "progression",
    current_state: "progression_ready",
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
        created_at: "2026-04-04T10:00:00Z",
        task_id: "task-3",
        task_title: "Continuous progression",
        deliverable_id: "deliverable-3",
        deliverable_title: "Continuous deliverable",
      },
    ],
    next_step_queue: ["確認是否要刷新最新 deliverable，讓已完成 action 的 outcome 被正式寫回。"],
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
    follow_up_lane: null,
    progression_lane: {
      latest_progression: {
        record_id: "progress-2",
        task_id: "task-3",
        task_title: "Continuous progression",
        deliverable_id: "deliverable-3",
        deliverable_title: "Continuous deliverable",
        summary: "第二輪 outcome 顯示主要阻塞已解除，可以考慮刷新 deliverable。",
        action_state_summary: "主要 action 已完成。",
        outcome_summary: "主要阻塞已解除。",
        created_at: "2026-04-04T10:00:00Z",
      },
      previous_progression: {
        record_id: "progress-1",
        task_id: "task-2",
        task_title: "Continuous baseline",
        deliverable_id: "deliverable-2",
        deliverable_title: "Previous deliverable",
        summary: "第一輪 action 已啟動，但目前仍在跨部門協調中。",
        action_state_summary: "行動已啟動。",
        outcome_summary: "仍在協調中。",
        created_at: "2026-04-04T09:00:00Z",
      },
      recent_progressions: [],
      what_changed: ["主要阻塞已解除。"],
      recommendation_states: [
        {
          title: "刷新交付物",
          state: "ready",
          summary: "建議已接近可採納狀態。",
        },
      ],
      action_states: [
        {
          title: "跨部門協調",
          state: "completed",
          summary: "已完成主要協調。",
        },
      ],
      outcome_signals: ["結果已開始站穩。"],
      next_progression_actions: ["確認是否要刷新最新 deliverable，讓已完成 action 的 outcome 被正式寫回。"],
      evidence_update_goal: "這次補件主要是為了補強 continuous progression 的下一步判斷基礎。",
    },
  });

  assert.equal(checkpointDetail.sectionTitle, "checkpoint 時間線與變化");
  assert.equal(checkpointDetail.cards[0]?.title, "最近 checkpoint");
  assert.match(checkpointDetail.cards[0]?.summary ?? "", /Checkpoint B/);
  assert.match(checkpointDetail.cards[3]?.summary ?? "", /有新資料就回來更新/);
  assert.doesNotMatch(
    checkpointDetail.cards.map((card) => card.summary ?? "").join("｜"),
    /outcome|progression/i,
  );

  assert.equal(progressionDetail.sectionTitle, "推進健康、結果與時間線");
  assert.equal(progressionDetail.cards[0]?.title, "推進健康");
  assert.match(progressionDetail.cards[0]?.summary ?? "", /推進穩定/);
  assert.match(progressionDetail.cards[1]?.summary ?? "", /結果已開始站穩/);
  assert.match(progressionDetail.cards[3]?.summary ?? "", /本週內回看/);
  assert.match(progressionDetail.cards[4]?.summary ?? "", /刷新最新 deliverable/);
});

test("research detail view keeps guidance-driven and run-driven reading aligned", () => {
  const guidanceView = buildResearchGuidanceView({
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
    source_quality_summary: "優先官方、原始與第一手來源。",
    freshness_summary: "這輪高度依賴近期訊號，若來源太舊，判斷可能失真。",
    contradiction_watchouts: ["若官方說法與市場報導不一致，需保留矛盾訊號。"],
    citation_ready_summary: "研究輸出應保留來源、矛盾與可回看引用線索，再交回主控代理收斂。",
    evidence_gap_closure_plan: ["先補關稅政策與出口限制的近期官方來源。"],
  });

  const guidanceDetail = buildResearchDetailView(guidanceView, null);
  const runDetail = buildResearchDetailView(null, {
    id: "run-1",
    task_id: "task-1",
    matter_workspace_id: "matter-1",
    status: "completed",
    query: "出口限制與關稅風險",
    trigger_reason: "host_research_guidance",
    research_scope: "public_web",
    research_depth: "deep_research",
    freshness_policy: "優先最近 30 天的公開來源。",
    confidence_note: "目前來源大多一致，但仍需保留政策更新風險。",
    source_trace_summary: "已整理 6 筆公開來源。",
    selected_domain_pack_ids: [],
    selected_industry_pack_ids: [],
    sub_questions: ["政策變動何時生效？", "哪些產業先受影響？"],
    evidence_gap_focus: ["出口限制", "關稅政策"],
    source_quality_summary: "以官方、原始與第一手來源為主。",
    contradiction_summary: "官方口徑與市場報導仍有落差。",
    citation_handoff_summary: "研究結果已整理成可回看引用線索，可交回主線收斂。",
    result_summary: "已補齊第一輪公開來源缺口。",
    source_count: 6,
    error_message: null,
    started_at: "2026-04-04T10:00:00Z",
    completed_at: "2026-04-04T10:10:00Z",
  });

  assert.equal(guidanceDetail.sectionTitle, "系統研究主線");
  assert.equal(guidanceDetail.cards[0]?.title, "這輪先查什麼");
  assert.match(guidanceDetail.cards[0]?.summary ?? "", /標準研究|外部事實/);
  assert.match(guidanceDetail.cards[1]?.summary ?? "", /官方|第一手/);
  assert.match(guidanceDetail.cards[2]?.summary ?? "", /近期訊號|矛盾訊號/);
  assert.match(guidanceDetail.cards[3]?.summary ?? "", /引用|交回主控代理/);
  assert.equal(guidanceDetail.listTitle, "研究子題 / 缺口收斂");
  assert.equal(guidanceDetail.listItems.length, 3);

  assert.equal(runDetail.sectionTitle, "最近系統研究交接");
  assert.equal(runDetail.cards[0]?.title, "最近研究交接");
  assert.match(runDetail.cards[0]?.summary ?? "", /深度研究|出口限制與關稅風險/);
  assert.match(runDetail.cards[1]?.summary ?? "", /官方|第一手/);
  assert.match(runDetail.cards[2]?.summary ?? "", /30 天|政策更新風險/);
  assert.match(runDetail.cards[3]?.summary ?? "", /引用線索|主線收斂/);
  assert.equal(runDetail.listTitle, "研究子題 / 來源線索");
  assert.equal(runDetail.listItems.length, 3);
});

test("flagship detail view keeps diagnostic and review reading aligned", () => {
  const diagnosticDetail = buildFlagshipDetailView(
    buildFlagshipLaneView({
      lane_id: "diagnostic_start",
      label: "先快速看清問題與下一步",
      summary: "目前先以少資訊起手，形成第一輪可回看的顧問判斷。",
      next_step_summary: "先確認主問題，再補最少但最有用的來源或直接先跑第一版。",
      upgrade_note: "等補進更多來源與證據後，再把案件升級成更完整的判斷主線。",
      current_output_label: "探索型簡報",
      current_output_summary: "目前先形成探索級第一版交付。",
      upgrade_target_label: "評估 / 審閱備忘",
      upgrade_requirements: ["至少補 1 份正式來源材料", "補到至少 2 則可用證據"],
      upgrade_ready: false,
      boundary_note: "這一輪仍有邊界，不應被誤讀成完整定論。",
    }),
  );

  const reviewDetail = buildFlagshipDetailView(
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

  assert.equal(diagnosticDetail.sectionTitle, "這條旗艦主線現在怎麼讀");
  assert.equal(diagnosticDetail.cards[0]?.title, "目前工作姿態");
  assert.match(diagnosticDetail.cards[0]?.summary ?? "", /先快速看清問題與下一步/);
  assert.match(diagnosticDetail.cards[1]?.summary ?? "", /探索型簡報/);
  assert.match(diagnosticDetail.cards[2]?.summary ?? "", /誤讀|完整定論/);
  assert.match(diagnosticDetail.cards[3]?.summary ?? "", /評估 \/ 審閱備忘/);
  assert.equal(diagnosticDetail.listTitle, "升級條件");
  assert.equal(diagnosticDetail.listItems.length, 2);

  assert.equal(reviewDetail.sectionTitle, "這條旗艦主線現在怎麼讀");
  assert.match(reviewDetail.cards[0]?.summary ?? "", /先審閱手上已有材料/);
  assert.match(reviewDetail.cards[1]?.summary ?? "", /評估 \/ 審閱備忘/);
  assert.match(reviewDetail.cards[2]?.summary ?? "", /最終決策版本/);
  assert.match(reviewDetail.cards[3]?.summary ?? "", /決策 \/ 行動交付物/);
  assert.match(reviewDetail.cards[4]?.summary ?? "", /核心材料|更多背景/);
  assert.equal(reviewDetail.listItems.length, 1);
});

test("precedent candidate views keep deliverable, recommendation, and matter summary low-noise", () => {
  const deliverableCandidateView = buildPrecedentCandidateView({
    id: "candidate-deliverable-1",
    candidate_type: "deliverable_pattern",
    candidate_status: "candidate",
    source_feedback_status: "adopted",
    source_task_id: "task-1",
    source_deliverable_id: "deliverable-1",
    source_recommendation_id: null,
    title: "合約審閱交付骨架",
    summary: "這份交付值得保留成下一輪 document-heavy review 的骨架候選。",
    reusable_reason: "已被明確採納，且結構邊界清楚。",
    lane_id: "material_review_start",
    continuity_mode: "one_off",
    deliverable_type: "contract_review",
    client_stage: "institutionalizing",
    client_type: "smb",
    domain_lenses: ["legal_risk"],
    selected_pack_ids: ["legal-risk-pack"],
    keywords: ["contract", "termination", "liability"],
    pattern_snapshot: { summary: "先審核心條款，再整理高風險點與下一步。" },
    created_at: "2026-04-04T10:00:00Z",
    updated_at: "2026-04-04T10:00:00Z",
  });

  const recommendationCandidateView = buildPrecedentCandidateView({
    id: "candidate-recommendation-1",
    candidate_type: "recommendation_pattern",
    candidate_status: "candidate",
    source_feedback_status: "template_candidate",
    source_task_id: "task-2",
    source_deliverable_id: null,
    source_recommendation_id: "recommendation-1",
    title: "價格分層建議模式",
    summary: "這條建議值得保留成模式候選。",
    reusable_reason: "適用範圍清楚，且已被標記為值得當範本。",
    lane_id: "decision_convergence_start",
    continuity_mode: "follow_up",
    deliverable_type: "decision_memo",
    client_stage: "scaling",
    client_type: "professional_service",
    domain_lenses: ["pricing"],
    selected_pack_ids: ["pricing-pack"],
    keywords: ["pricing", "segmentation"],
    pattern_snapshot: { summary: "先切客群，再拆定價與渠道建議。" },
    created_at: "2026-04-04T10:00:00Z",
    updated_at: "2026-04-04T10:00:00Z",
  });

  const matterSummaryView = buildPrecedentCandidateSummaryView({
    total_candidates: 2,
    deliverable_candidate_count: 1,
    recommendation_candidate_count: 1,
    summary: "這案目前留下 2 個可重用候選。",
  });

  assert.equal(deliverableCandidateView.shouldShow, true);
  assert.equal(deliverableCandidateView.badgeLabel, "已進入可重用候選池");
  assert.match(deliverableCandidateView.summary, /交付|骨架候選|明確採納/);

  assert.equal(recommendationCandidateView.shouldShow, true);
  assert.match(recommendationCandidateView.badgeLabel, /建議模式候選/);
  assert.match(recommendationCandidateView.summary, /值得保留|範本/);

  assert.equal(matterSummaryView.shouldShow, true);
  assert.equal(matterSummaryView.title, "可重用候選");
  assert.match(matterSummaryView.summary, /2 個可重用候選/);
  assert.match(matterSummaryView.meta, /交付物 1|建議 1/);
});

test("precedent candidate action view keeps governance states low-noise", () => {
  const candidateActions = buildPrecedentCandidateActionView({
    candidate_status: "candidate",
    candidate_type: "deliverable_pattern",
  });
  const promotedActions = buildPrecedentCandidateActionView({
    candidate_status: "promoted",
    candidate_type: "recommendation_pattern",
  });
  const dismissedActions = buildPrecedentCandidateActionView({
    candidate_status: "dismissed",
    candidate_type: "recommendation_pattern",
  });

  assert.equal(candidateActions.statusLabel, "候選中");
  assert.equal(candidateActions.actions.length, 2);
  assert.equal(candidateActions.actions[0]?.label, "升格成正式可重用模式");
  assert.equal(candidateActions.actions[1]?.label, "先停用這個候選");

  assert.equal(promotedActions.statusLabel, "正式可重用模式");
  assert.equal(promotedActions.actions.length, 2);
  assert.equal(promotedActions.actions[0]?.label, "降回候選");
  assert.equal(promotedActions.actions[1]?.label, "停用這個模式");

  assert.equal(dismissedActions.statusLabel, "已停用");
  assert.equal(dismissedActions.actions.length, 1);
  assert.equal(dismissedActions.actions[0]?.label, "重新列回候選");
});

test("precedent review filter keeps status and type filters predictable", () => {
  const items = [
    {
      id: "1",
      candidate_type: "deliverable_pattern",
      candidate_status: "candidate",
      title: "合約審閱交付骨架",
      summary: "review memo 候選",
      reusable_reason: "已被採納",
      lane_id: "material_review_start",
      continuity_mode: "one_off",
      deliverable_type: "contract_review",
      client_stage: "institutionalizing",
      client_type: "smb",
      matter_workspace_id: "matter-1",
      matter_title: "法務審閱案",
      task_id: "task-1",
      task_title: "合約審閱",
      deliverable_id: "deliverable-1",
      deliverable_title: "合約審閱交付物",
      recommendation_id: null,
      recommendation_summary: null,
      created_at: "2026-04-04T10:00:00Z",
      updated_at: "2026-04-04T10:00:00Z",
    },
    {
      id: "2",
      candidate_type: "recommendation_pattern",
      candidate_status: "promoted",
      title: "價格分層建議",
      summary: "成長建議模式",
      reusable_reason: "值得保留",
      lane_id: "decision_convergence_start",
      continuity_mode: "follow_up",
      deliverable_type: "decision_memo",
      client_stage: "scaling",
      client_type: "professional_service",
      matter_workspace_id: "matter-2",
      matter_title: "成長建議案",
      task_id: "task-2",
      task_title: "價格建議",
      deliverable_id: null,
      deliverable_title: null,
      recommendation_id: "recommendation-2",
      recommendation_summary: "先切客群再談渠道與價格",
      created_at: "2026-04-04T10:00:00Z",
      updated_at: "2026-04-04T10:00:00Z",
    },
  ];

  assert.equal(
    filterPrecedentReviewItems(items, {
      query: "",
      status: "all",
      type: "all",
    }).length,
    2,
  );
  assert.equal(
    filterPrecedentReviewItems(items, {
      query: "",
      status: "promoted",
      type: "all",
    }).length,
    1,
  );
  assert.equal(
    filterPrecedentReviewItems(items, {
      query: "",
      status: "all",
      type: "deliverable_pattern",
    }).length,
    1,
  );
  assert.equal(
    filterPrecedentReviewItems(items, {
      query: "價格",
      status: "all",
      type: "all",
    })[0]?.id,
    "2",
  );
});

test("precedent review priority view stays consultant-readable", () => {
  assert.deepEqual(
    buildPrecedentReviewPriorityView({
      review_priority: "high",
      review_priority_reason: "來自值得當範本的候選，且目前仍待決。",
    }),
    {
      label: "建議先看",
      reason: "來自值得當範本的候選，且目前仍待決。",
    },
  );

  assert.deepEqual(
    buildPrecedentReviewPriorityView({
      review_priority: "medium",
      review_priority_reason: "這個模式已升格，適合排下一輪回看。",
    }),
    {
      label: "可安排下一輪",
      reason: "這個模式已升格，適合排下一輪回看。",
    },
  );

  assert.deepEqual(
    buildPrecedentReviewPriorityView({
      review_priority: "low",
      review_priority_reason: "這個候選目前已停用，先留作背景。",
    }),
    {
      label: "先放背景",
      reason: "這個候選目前已停用，先留作背景。",
    },
  );
});

test("precedent reference view stays low-noise and consultant-readable", () => {
  const view = buildPrecedentReferenceView({
    status: "available",
    label: "可參考既有模式",
    summary: "Host 目前找到 2 個可參考的既有模式，會先拿來輔助 framing 與交付骨架。",
    recommended_uses: ["先看 framing", "先看交付骨架"],
    boundary_note: "這些模式只可拿來參考判斷順序與骨架，不會直接複製舊案正文。",
    matched_items: [
      {
        candidate_id: "candidate-1",
        candidate_type: "deliverable_pattern",
        candidate_status: "promoted",
        review_priority: "medium",
        title: "合約審閱模式",
        summary: "contract review memo",
        reusable_reason: "值得保留",
        match_reason: "同樣屬於 material review start，且交付型態一致。",
        safe_use_note: "可參考交付骨架，不要複製舊案正文。",
        source_task_id: "task-1",
        source_deliverable_id: "deliverable-1",
        source_recommendation_id: null,
      },
    ],
  });

  assert.equal(view.shouldShow, true);
  assert.equal(view.sectionTitle, "可參考既有模式");
  assert.equal(view.cards[0]?.title, "合約審閱模式");
  assert.equal(view.cards[0]?.meta, "同樣屬於 material review start，且交付型態一致。");
  assert.equal(view.listItems[0], "先看 framing");
  assert.equal(view.boundaryNote, "這些模式只可拿來參考判斷順序與骨架，不會直接複製舊案正文。");
});

test("review lens view stays low-noise and consultant-readable", () => {
  const view = buildReviewLensView({
    status: "available",
    label: "這輪先看哪幾點",
    summary: "Host 先整理出 2 個 review lenses，幫你把這輪審閱順序排好。",
    boundary_note: "這些視角是幫你排審閱順序，不是自動結論；若與正式證據衝突，仍以這案的正式證據為準。",
    lenses: [
      {
        lens_id: "precedent_reference:abc",
        title: "先比對這次案件與既有合約審閱模式的差異點",
        summary: "先回看這個既有模式目前代表的審閱骨架。",
        why_now: "目前找到高度相似的既有模式，先用它校正審閱方向。",
        source_kind: "precedent_reference",
        source_label: "來源：precedent reference",
        priority: "high",
      },
      {
        lens_id: "pack_common_risk:def",
        title: "先檢查責任限制與賠償風險",
        summary: "先確認這個高頻風險是否已經在目前材料、判斷或交付骨架中出現。",
        why_now: "這是目前 selected packs 的常見風險之一，適合先拿來做風險掃描。",
        source_kind: "pack_common_risk",
        source_label: "來源：pack common risk",
        priority: "medium",
      },
    ],
  });

  assert.equal(view.shouldShow, true);
  assert.equal(view.sectionTitle, "這輪先看哪幾點");
  assert.match(view.summary, /審閱順序/);
  assert.equal(view.cards.length, 2);
  assert.equal(view.cards[0]?.title, "先比對這次案件與既有合約審閱模式的差異點");
  assert.match(view.cards[0]?.summary ?? "", /先用它校正審閱方向/);
  assert.match(view.cards[0]?.meta ?? "", /precedent reference/);
  assert.equal(view.listTitle, "這輪先照這個順序展開");
  assert.match(view.listItems[0] ?? "", /先比對這次案件/);
  assert.match(view.boundaryNote, /不是自動結論/);
});

test("precedent duplicate governance view stays consultant-readable", () => {
  const summaryView = buildPrecedentDuplicateSummaryView({
    pending_review_count: 1,
    human_confirmed_count: 0,
    kept_separate_count: 0,
    split_count: 0,
    summary: "目前有 1 組同案重複候選待確認。",
  });
  const actionView = buildPrecedentDuplicateActionView({
    review_key: "review-1",
    review_status: "pending_review",
    suggested_action: "merge_candidate",
    confidence_level: "high",
    consultant_summary: "這案目前有 2 個很像的模式候選，建議先確認是否其實是同一種模式。",
    canonical_candidate_id: "candidate-1",
    canonical_title: "合約審閱模式",
    matter_workspace_id: "matter-1",
    matter_title: "法務審閱案",
    candidate_type: "deliverable_pattern",
    candidate_ids: ["candidate-1", "candidate-2"],
    candidate_titles: ["合約審閱模式", "合約審閱模式"],
    task_ids: ["task-1", "task-2"],
    task_titles: ["合約審閱一", "合約審閱二"],
    candidate_count: 2,
    resolution_note: "",
    resolved_at: null,
  });

  assert.equal(summaryView.shouldShow, true);
  assert.equal(summaryView.title, "同案重複候選整理");
  assert.equal(summaryView.meta, "待確認 1 / 已確認同一模式 0 / 保留分開 0 / 已拆分 0");
  assert.equal(actionView.statusLabel, "待確認");
  assert.equal(actionView.actions[0]?.label, "確認同一模式");
  assert.equal(actionView.actions[1]?.label, "保留分開");
  assert.equal(actionView.actions[2]?.label, "拆成不同模式");
});
