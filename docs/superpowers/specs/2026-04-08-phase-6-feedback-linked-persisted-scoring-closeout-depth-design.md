# Phase 6 Feedback-Linked Persisted Scoring Closeout Depth Design

日期：2026-04-08
狀態：draft

## Purpose

`docs/06_product_alignment_and_85_point_roadmap.md` 已把下一條主線定成：

- `7.2 Priority 2: Feedback-linked persisted scoring`

目前 `7.2` 的第一刀已完成：

- `completion review / checkpoint` 已開始正式保存 explicit feedback-linked evidence snapshot
- 第一刀已能吃：
  - `AdoptionFeedback`
  - `PrecedentCandidate` governance outcomes

而 `7.15` 也剛完成：

- phase-level `Generalist Governance` 已和 `7.1` landed runtime 正式對齊

所以現在 `Phase 6` 真正還缺的，不是再多做 phase-level summary，而是把 `7.2` 往更接近 closeout 的證據深度推進。

這份設計要補的正是：

- `7.2 slice 2 = deliverable-linked closeout depth`

## Product Posture

這一刀的正式角色是：

- 把 `Phase 6` 的 feedback-linked persisted scoring，從「只有 explicit feedback rows」推進成「可以看見這些 feedback 是否掛在真實 deliverable closeout 上」

這一刀不是：

- full outcome / writeback scoring engine
- long-term business outcome attribution engine
- correctness ranking
- new governance dashboard family

## Why This Slice Now

目前 `Phase 6` 雖然已有：

- completion review
- checkpoint persistence
- sign-off foundation
- phase-level alignment

但 closeout depth 仍偏薄，原因是：

1. system 還無法清楚分辨：
   - 這些 feedback 是不是掛在真實 deliverable 上
   - 還是只停留在 recommendation / abstract feedback 層

2. system 還無法清楚回答：
   - 被採用的 deliverable 有沒有真的進入 publish
   - deliverable-linked reusable candidate 有沒有形成 governed outcome

3. 因此現在的 `completion review / sign-off foundation`
   - 雖然不是空的
   - 但還不夠接近「Phase 6 closeout-ready evidence」

## Definitions

### 1. closeout depth

這一刀所說的 `closeout depth`，第一版只指：

- explicit feedback 是否掛在真實 deliverable
- 這些 deliverable 是否有 publish evidence
- deliverable-linked reusable candidate 是否有 governed outcome

它不等於：

- business outcome impact
- downstream KPI impact
- long-term continuity result quality

### 2. deliverable-linked evidence

第一版正式只吃：

- `AdoptionFeedback.deliverable_id`
- `DeliverablePublishRecord`
- `PrecedentCandidate.source_deliverable_id`
- deliverable-linked candidate governance outcomes

### 3. outcome / writeback evidence

repo 裡雖然已經有：

- `OutcomeRecord`
- action / writeback records
- continuity-related structures

但這一刀先不把它們接進 scoring engine。

它們屬於後續更深的 `7.2` / next closeout lane，而不是這一刀。

## Approaches Considered

### Approach A: Deliverable-linked closeout depth first

先把既有 feedback-linked scoring 往下接到：

- deliverable-linked adoption
- publish evidence
- deliverable-linked governed candidate outcome

優點：

- 比 `7.2 v1` 更接近 `docs/06` 的「是否真的幫到 deliverable」
- 比 outcome/writeback scoring 更低風險
- 能直接強化 `completion review / checkpoint / sign-off foundation` 的誠實度

缺點：

- 還不能回答真正的 downstream outcome impact

### Approach B: Deliverable + writeback hybrid

除了 deliverable-linked evidence，也一起吃：

- `OutcomeRecord`
- action execution
- continuity writeback

優點：

- 更接近真正完整的 closeout evidence

缺點：

- 一刀就跨進更大的 continuity / writeback attribution 問題
- 很容易把 `7.2` slice 2 直接做成大型 architecture 擴張

### Approach C: Full closeout scoring engine

一次把：

- explicit feedback
- deliverable evidence
- publish evidence
- writeback evidence
- downstream outcome

全接成完整 scoring engine。

優點：

- 產品想像最完整

缺點：

- 風險最高
- 很容易失控
- 也不符合這一輪「一刀一刀安全推進」的規則

本輪採用：

- `Approach A: Deliverable-linked closeout depth first`

## Current Problem

目前 `feedback_linked_scoring_snapshot` 已能回答：

- adopted / needs_revision / not_adopted
- template candidate
- governed candidate outcome
- top asset families

但它還不能回答：

1. 這些 adopted / override signals 是不是來自真實 deliverable
2. 這些 deliverable 有沒有真的進入 publish
3. deliverable-linked reusable candidate 是否已經被 promote / dismiss
4. 目前 `review_ready` 比較像「有 feedback loop foundation」，還不是「closeout depth 已更接近真實交付」

## Core Decision

這一刀正式決策如下：

1. 延伸既有 `feedback_linked_scoring_snapshot`
   - 補 deliverable-linked closeout counts / summary
   - 不另開第二個 scoring snapshot family

2. `feedback_loop` 維度正式分成兩層讀法
   - 第一層：explicit feedback baseline
   - 第二層：deliverable-linked closeout depth

3. 第一版 scoring 規則要正式承認：
   - recommendation-only / abstract feedback 可以證明 feedback foundation 已存在
   - 但若缺少 deliverable-linked evidence，就不應把 feedback loop 維度拉到最強

4. `checkpoint` 與 `completion review`
   - 應保存當時的 deliverable-linked closeout snapshot
   - 讓 owner 看得出這次 review-ready 是不是建立在真實交付 evidence 上

5. 首頁仍留在既有 `Generalist Governance`
   - 只補一條 low-noise closeout-depth summary
   - 不新增 score wall

## Proposed First Slice

這一刀正式只做：

1. backend 擴充既有 feedback-linked snapshot
   - 補 deliverable-linked closeout fields

2. rewrite `completion review` 的 feedback-loop scoring
   - 讓 deliverable-linked adopted / published / governed evidence 影響分數強度

3. rewrite checkpoint persistence
   - 保存 deliverable-linked closeout snapshot

4. homepage low-noise closeout-depth summary
   - 讓既有 `Generalist Governance` 可回答：
     - 目前 feedback loop 只是 foundation
     - 還是已開始接近 deliverable closeout depth

5. active docs / QA / verification

## What This Slice Should Read

第一版建議至少正式讀：

- `deliverable_feedback_count`
- `deliverable_adopted_count`
- `published_deliverable_count`
- `published_adopted_count`
- `deliverable_candidate_count`
- `governed_deliverable_candidate_count`
- `closeout_depth_summary`

正式目的不是追求欄位越多越好，而是讓 system 能回答：

- adopted evidence 有多少是真的掛在 deliverable 上
- 其中多少已進 publish
- 其中多少已形成 governed reusable candidate outcome

## Non-Goals

本刀明確不做：

- `OutcomeRecord` scoring
- action execution / writeback scoring
- continuity result quality scoring
- publish correctness ranking
- consultant ranking
- new governance dashboard family

## Success Criteria

這一刀完成後，至少要能正式回答：

1. `completion review` 不再只知道「有 feedback」，還知道：
   - feedback 是不是 deliverable-linked
   - 有沒有 publish evidence
   - 有沒有 deliverable-linked governed candidate outcome

2. feedback-loop 維度不再只靠 generic heuristic count
   - 若只有 abstract / recommendation-level evidence，分數應停在中段
   - 若已有 deliverable-linked adopted / published / governed evidence，分數才可更強

3. checkpoint payload 不只保存 generic feedback snapshot
   - 也保存當時的 deliverable-linked closeout depth

4. 首頁既有 `Generalist Governance` 能低噪音回答：
   - 現在是 feedback foundation
   - 還是已開始接近 deliverable closeout depth

5. 這一刀仍沒有滑向：
   - writeback scoring engine
   - outcome attribution engine
   - governance dashboard family

## Verification

backend：

- targeted tests for deliverable-linked closeout snapshot
- completion review scoring threshold rewrite tests
- checkpoint persistence tests
- relevant `test_mvp_slice.py` regression around:
  - deliverable feedback
  - publish record
  - candidate governance outcome
  - phase-six completion review / sign-off

frontend：

- phase-six governance helper tests for closeout-depth summary
- homepage `Generalist Governance` readout regression

docs：

- update active runtime contract
- update roadmap alignment wording
- append QA evidence only after real verification
