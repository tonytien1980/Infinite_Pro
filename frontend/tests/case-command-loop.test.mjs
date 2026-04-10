import test from "node:test";
import assert from "node:assert/strict";

import {
  buildMatterCommandView,
  buildDecisionBriefView,
  buildWritebackApprovalView,
} from "../src/lib/case-command-loop.ts";

test("matter command view promotes one primary task and one blocker", () => {
  const view = buildMatterCommandView({
    command_posture: "fill_evidence",
    command_posture_label: "先補依據",
    focus_summary: "這案目前卡在證據厚度不夠，還不適合直接發布結論。",
    primary_task_id: "task-1",
    primary_task_title: "補齊營運與銷售證據",
    primary_task_reason: "先把這輪主決策的依據補齊。",
    blocker_summary: "目前高影響缺口仍在，應先補來源、證據或脈絡。",
    deliverable_direction_summary: "目前不要急著收成正式交付物。",
    next_step_summary: "先回來源與證據，再決定要不要重跑。",
  });

  assert.equal(view.primaryHref, "/tasks/task-1");
  assert.match(view.primaryTitle, /補齊營運與銷售證據/);
  assert.match(view.blockerCopy, /高影響缺口/);
});

test("decision brief view separates recommendation from publish posture", () => {
  const view = buildDecisionBriefView({
    posture: "decision_ready",
    posture_label: "可收成正式判斷",
    question_summary: "先判斷這輪應優先修營運瓶頸還是改銷售節奏。",
    options_summary: "主 option 是先修營運，再以銷售調整跟進。",
    risk_summary: "若先動銷售而不補營運，容易放大交付壓力。",
    recommendation_summary: "先用兩週修營運瓶頸，再進第二輪銷售調整。",
    next_action_summary: "把這輪判斷收成正式交付摘要。",
    boundary_note: "這仍是第一版正式判斷，不是最終 published version。",
  });

  assert.equal(view.railEyebrow, "Decision Brief");
  assert.match(view.summary, /先用兩週修營運瓶頸/);
  assert.match(view.boundaryNote, /第一版正式判斷/);
});

test("writeback approval view keeps candidate review separate from formal approval", () => {
  const view = buildWritebackApprovalView({
    posture: "formal_approval",
    posture_label: "待正式核可",
    summary: "writeback 已形成，但仍有正式核可待處理。",
    primary_action_label: "先確認正式核可",
    primary_action_summary: "先處理 pending approval，再決定哪些東西值得升成 shared intelligence。",
    candidate_summary: "目前有 2 筆 precedent candidates，1 筆適合往 template 方向看。",
    boundary_note: "不是每次案件結果都應該被泛化成共用資產。",
  });

  assert.match(view.primaryTitle, /先確認正式核可/);
  assert.match(view.candidateCopy, /precedent candidates/);
  assert.match(view.boundaryNote, /不是每次案件結果都應該被泛化/);
});

test("decision brief view keeps one formal recommendation summary", () => {
  const view = buildDecisionBriefView({
    posture: "publish_ready",
    posture_label: "可收成正式交付結果",
    question_summary: "先判斷要不要把這輪結論發布給客戶。",
    options_summary: "主 option 是直接發布，次 option 是先補一輪風險說明。",
    risk_summary: "若直接發布而未補邊界，容易被過度解讀。",
    recommendation_summary: "先補邊界說明後發布正式版本。",
    next_action_summary: "回交付物完成最後修訂與發布。",
    boundary_note: "這份 brief 不等於 admin approval console。",
  });

  assert.equal(view.checklist.length, 4);
  assert.match(view.summary, /先補邊界說明後發布正式版本/);
});

test("writeback approval view keeps approval and candidate review in the same loop", () => {
  const view = buildWritebackApprovalView({
    posture: "candidate_review",
    posture_label: "先看哪些值得留下",
    summary: "目前正式核可不是唯一重點，這輪更重要的是先分辨哪些東西值得寫回。",
    primary_action_label: "先做 writeback 判斷",
    primary_action_summary: "先看這次結果哪些值得留 precedent、哪些適合 playbook 或 template。",
    candidate_summary: "目前有 3 筆候選，其中 1 筆更適合 template。",
    boundary_note: "個案成功不等於一定適合變成共享規則。",
  });

  assert.match(view.primaryCopy, /prece.*template/i);
  assert.match(view.boundaryNote, /個案成功不等於一定適合變成共享規則/);
});
