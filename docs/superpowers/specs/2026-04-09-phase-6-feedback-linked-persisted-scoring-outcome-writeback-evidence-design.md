# Phase 6 Feedback-Linked Persisted Scoring Outcome And Writeback Evidence Design

日期：2026-04-09
狀態：draft

## Purpose

`docs/06_product_alignment_and_85_point_roadmap.md` 已把 `7.2` 定義成：

- `Feedback-linked persisted scoring`

而目前 `7.2` 已完成兩刀：

1. explicit feedback / candidate governance outcomes
2. deliverable-linked closeout depth

也就是說，`completion review / checkpoint / sign-off foundation` 現在已能回答：

- 是否有 explicit feedback
- feedback 是否掛在真實 deliverable
- deliverable 是否進過 publish
- deliverable-linked candidate 是否已形成 governed outcome

但 `docs/06` 對 `7.2` 的完整要求，仍還差最後一段：

- `是否真的幫到 deliverable / outcome`
- `如何把這些 evidence 回寫到 persisted governance scoring`

這一刀的目的，就是把 `7.2` 從 closeout depth 再往下推到：

- `outcome / writeback evidence`

## Product Posture

這一刀的正式角色是：

- 讓 `Phase 6` 的 feedback-linked scoring，開始正式讀取 Host 已持久化的 writeback evidence
- 讓 system 能回答：這次交付不只被採用、被 publish，也開始對後續 execution / outcome 留下真實 writeback 痕跡

這一刀不是：

- business KPI attribution engine
- full ROI scoring system
- correctness ranking
- new dashboard family

## Why This Slice Now

目前 `7.2` 雖然已經走到 deliverable-linked closeout depth，但仍有兩個關鍵缺口：

1. system 還不知道這次交付是否真的形成後續 writeback
   - 例如：
     - `OutcomeRecord`
     - `ActionExecution`
     - Host 自動建立的 writeback audit trail

2. system 還無法分清楚：
   - 「這次 feedback / deliverable 很完整」
   - 和
   - 「這次 feedback / deliverable 已開始影響後續 continuity / execution / outcome」

所以這一刀不是再加更多 closeout counts，而是把 closeout evidence 再往 writeback layer 多接一步。

## Existing Evidence We Can Safely Use

repo 內目前已正式存在的可追溯 writeback evidence 包括：

- `OutcomeRecord`
  - `task_id`
  - `matter_workspace_id`
  - `action_execution_id`
  - `deliverable_id`
  - `signal_type`
  - `summary`
  - `evidence_note`

- `ActionExecution`
  - 與 `ActionPlan` / `ActionItem` 關聯
  - 在 full writeback 時會被 Host 自動建立或標記成 `review_required`

- `AuditEvent`
  - `event_type = WRITEBACK_GENERATED`
  - `event_payload.record_type`
    - `decision_record`
    - `action_plan`
    - `outcome_record`
    - `action_execution`

- `resolve_continuity_policy_for_task(...)`
  - 代表 writeback 是否本來就被期待

因此這一刀可以安全建立在：

- 已持久化
- Host 生成
- 可追溯

的 writeback evidence 上，而不是靠推測。

## Critical Constraint

這一刀有一個非常重要的約束：

- **不能錯罰 `one_off / minimal writeback depth` 的案件。**

因為很多案件即使完成得很好，也不一定本來就應該生成：

- `OutcomeRecord`
- `ActionExecution`
- full continuity writeback

所以這一刀必須把 writeback evidence 理解成：

- `depth bonus`
- `closeout confidence booster`

而不是：

- universal hard gate

也就是：

- 有 writeback evidence，可拉高 `feedback_loop` 維度的可信度
- 沒有 writeback evidence，不等於一定做不好；要先看這案本來是不是 `minimal` / `one_off`

## Approaches Considered

### Approach A: Host-generated writeback evidence first

第一版只吃：

- `OutcomeRecord`
- `ActionExecution`
- `AuditEvent(WRITEBACK_GENERATED)`
- continuity / writeback expectation boundary

優點：

- 邊界清楚
- 都是 repo 內已持久化、可追溯的資料
- 可以明確強化 `Phase 6` 的 closeout honesty

缺點：

- 還不能回答真正 business outcome 是否改善

### Approach B: Add business outcome hints now

在 Host-generated writeback 之外，再一起吃：

- richer human-entered outcome quality
- external KPI-like outcome hints

優點：

- 更接近完整的「是否真的幫到 outcome」

缺點：

- 歸因會快速失控
- 容易開始引入主觀品質判斷

### Approach C: Full continuity scoring engine

一次把：

- writeback evidence
- outcome records
- execution states
- business outcome
- continuity quality

全接成完整 scoring engine。

優點：

- 想像最完整

缺點：

- 風險過高
- 直接超出這輪安全切法

本輪採用：

- `Approach A: Host-generated writeback evidence first`

## Core Decision

這一刀的正式決策如下：

1. 沿用既有 `feedback_linked_scoring_snapshot`
   - 不新開第三個 snapshot family
   - 只補 outcome/writeback evidence fields

2. 第一版 outcome/writeback evidence 只讀：
   - `OutcomeRecord`
   - `ActionExecution`
   - `AuditEvent(WRITEBACK_GENERATED)`
   - 與當前 task / matter / deliverable 有關聯的 records

3. `feedback_loop` 維度正式變成三層：
   - explicit feedback foundation
   - deliverable-linked closeout depth
   - outcome/writeback evidence depth

4. writeback evidence 只做：
   - bonus / confidence deepening
   - 不做 universal penalty

5. `checkpoint` 與 persisted snapshot
   - 應保存當時的 outcome/writeback evidence snapshot
   - 讓 owner 看得出這次 review-ready 有沒有真的碰到 continuity / execution / outcome layer

## Proposed First Slice

這一刀正式只做：

1. backend 擴充 snapshot
   - 補 outcome/writeback evidence counts / summary

2. rewrite completion-review scoring
   - 讓 writeback evidence 只在合理時拉高 feedback-loop depth

3. rewrite checkpoint persistence
   - 保存 outcome/writeback evidence snapshot

4. homepage low-noise readout
   - 在既有 completion-review card 補一條短的 outcome/writeback depth summary

5. active docs / QA / verification

## What This Slice Should Read

第一版建議至少正式讀：

- `outcome_record_count`
- `deliverable_outcome_record_count`
- `follow_up_outcome_count`
- `writeback_generated_event_count`
- `review_required_execution_count`
- `planned_execution_count`
- `writeback_depth_summary`

正式目的不是把欄位灌滿，而是要讓 system 能回答：

- 這次交付之後，有沒有真的留下 outcome/writeback 痕跡
- 這些痕跡是落在 deliverable / execution / outcome 哪一層
- 這案是不是本來就應該期待 full writeback

## Non-Goals

本刀明確不做：

- business KPI attribution
- correctness scoring
- subjective quality ranking
- consultant ranking
- new governance dashboard family

## Success Criteria

這一刀完成後，至少要能正式回答：

1. `completion review` 不再只知道：
   - 有 feedback
   - 有 deliverable closeout evidence
   還知道：
   - 有沒有 outcome / writeback evidence

2. `feedback_loop` 維度不再只看 closeout depth
   - 若已有 Host-generated writeback evidence，分數可信度可更高
   - 若案件本來只屬於 `minimal` / `one_off`，則 absence 不應被錯誤視為失敗

3. checkpoint payload 不只保存 deliverable closeout depth
   - 也保存當時的 outcome/writeback evidence snapshot

4. 首頁既有 `Generalist Governance` 能低噪音回答：
   - 現在只有 feedback / closeout depth
   - 還是已開始接到 outcome/writeback evidence

5. 這一刀仍沒有滑向：
   - KPI dashboard
   - enterprise console
   - business outcome attribution wall

## Verification

backend：

- targeted tests for outcome/writeback evidence snapshot
- completion review scoring threshold rewrite tests
- checkpoint persistence tests
- relevant `test_mvp_slice.py` regression around:
  - deliverable run / publish
  - full writeback generation
  - action execution / outcome record presence
  - phase-six completion review / sign-off

frontend：

- phase-six governance helper tests for writeback-depth summary
- homepage `Generalist Governance` readout regression

docs：

- update active runtime contract
- update roadmap alignment wording
- append QA evidence only after real verification
