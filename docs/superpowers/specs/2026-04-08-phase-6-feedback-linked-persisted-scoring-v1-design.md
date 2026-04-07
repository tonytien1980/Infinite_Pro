# Phase 6 Feedback-Linked Persisted Scoring v1 Design

日期：2026-04-08
狀態：draft

## Purpose

`docs/06_product_alignment_and_85_point_roadmap.md` 已把下一階段第二優先主線定為：

- `7.2 Priority 2: Feedback-linked persisted scoring`

目前 `Phase 6` 已經有：

- runtime feedback loop / closure criteria
- governance scorecard / completion review foundation
- persisted checkpoint snapshot
- sign-off / handoff foundation

但現在的 `completion review` 分數仍偏 foundation-level。

更準確地說：

- `overall_score` 與 `scorecard_items` 仍主要由 phase-level heuristic 組成
- checkpoint 雖已保存 score snapshot，但還沒有保存「這個分數是被哪些 feedback evidence 推上去或拉下來」
- system 還不能正式回答：
  - 哪些 reusable assets 被採用
  - 哪些被明確保留邊界或被退回
  - 哪些 feedback 真的進入 persisted governance scoring

因此這一刀定為：

- `phase-6 feedback-linked persisted scoring v1`

## Product Posture

這一刀的正式定位是：

- 把 `Phase 6` 的 persisted scoring 從 generic snapshot 推進成 feedback-linked snapshot
- 先吃低風險、可追溯、已存在的 explicit evidence
- 保持 low-noise homepage pattern，不長出 score wall

這一刀不是：

- full outcome/writeback scoring engine
- long-term correctness scoring wall
- consultant ranking
- enterprise governance console

## Approaches Considered

### Approach A: explicit feedback first

先只吃：

- `AdoptionFeedback`
- `PrecedentCandidate` 的 governed outcomes / status
- feedback 造成的升格 / 降回候選 / dismiss

優點：

- 邊界最清楚
- 與現有資料模型最對齊
- 最符合安全第一刀

缺點：

- 還不能直接證明它真的幫到最終 outcome

### Approach B: feedback + deliverable/outcome hybrid

除了 explicit feedback，也一起吃：

- deliverable publish / revision
- action plan / execution / outcome

優點：

- 更接近 `docs/06` 的「是否真的幫到 deliverable / outcome」

缺點：

- 一刀就跨進 continuity / writeback 依賴
- 證據歸因會明顯更複雜

### Approach C: full adaptive scoring engine

直接把 reusable asset 採用、override、deliverable impact、outcome impact 一次接成完整治理評分引擎。

優點：

- 產品想像最完整

缺點：

- 風險過高
- 容易把 `7.2` 變成一輪過大的 architecture rewrite

本輪採用：

- `Approach A: explicit feedback first`

## Definitions

本刀先明確定義：

### 1. feedback-linked

第一版只指：

- explicit `AdoptionFeedback`
- 由這些 feedback 長出的 `PrecedentCandidate` lifecycle / governance outcomes

### 2. override

第一版這裡說的 `override`，不是 extension manager 的 pack / agent override。

第一版正式只指：

- 人類明確給出 `needs_revision`
- 人類明確給出 `not_adopted`
- 或這些 feedback 造成 reusable candidate 被 `demote / dismiss / keep contextual`

也就是：

- 這是 reusable-intelligence 的 human override signal
- 不是 runtime routing override

### 3. persisted scoring

第一版指的是：

- `completion review` 的 `overall_score`
- `scorecard_items`
- checkpoint payload

都開始保留 feedback-linked evidence snapshot，而不是只保留 abstract score

## Current Problem

目前 `build_phase_six_completion_review()` 的 `feedback_loop_score` 仍主要看：

- `feedback_signal_count`
- `governed_outcome_count`

這層雖然比完全靜態更進一步，但還不夠回答：

1. 採用的是哪種 feedback
2. 有多少是正向採用、多少是 revision / not adopted
3. 哪些 reusable asset family 受到幫助
4. 這次 checkpoint 到底是因為哪些 feedback evidence 達到 `review_ready`

因此這一刀要補的是：

- feedback evidence summary
- feedback-linked score drivers
- persisted checkpoint 裡的 evidence snapshot

## Core Decision

第一版正式決策如下：

1. backend 新增一個 internal-only `PhaseSixFeedbackLinkedScoringSnapshot`，最少包含：
   - `adopted_count`
   - `needs_revision_count`
   - `not_adopted_count`
   - `template_candidate_count`
   - `governed_candidate_count`
   - `promoted_candidate_count`
   - `dismissed_candidate_count`
   - `override_signal_count`
   - `top_asset_codes`
   - `summary`
2. `completion review` 的 `feedback_loop` 維度，不再只靠 generic count threshold；第一版應先正式吃：
   - explicit positive adoption signals
   - explicit negative / override-like signals
   - reusable candidate governance outcomes
3. `checkpoint` payload 應正式補上：
   - `feedback_linked_scoring_snapshot`
   - `feedback_linked_summary`
4. 第一版首頁仍留在既有 `Generalist Governance`
   - 不新增新頁面
   - 只補一條 low-noise feedback-linked scoring summary

## Recommended First Slice

第一波只做：

- backend feedback-linked scoring snapshot builder
- completion review scorecard rewrite
- persisted checkpoint payload rewrite
- homepage existing `Generalist Governance` low-noise feedback-linked summary
- active docs / QA / verification

## Non-Goals

第一波不做：

- outcome / writeback evidence scoring
- action-plan execution weighting
- deliverable publish correctness scoring
- score dashboard family
- pack / agent override scoring

## Success Criteria

這一刀完成後，至少要能正式回答：

1. 這次 `completion review` 的 feedback loop 分數，是被哪些 explicit feedback evidence 推動
2. system 可分清楚：
   - `adopted`
   - `needs_revision`
   - `not_adopted`
   - `template_candidate`
   - candidate governance outcome
3. checkpoint 不只保存分數，也保存當時的 feedback-linked evidence snapshot
4. 首頁既有 `Generalist Governance` 能低噪音回答：
   - 目前 feedback-linked scoring 是偏強、偏弱，還是混合
   - 主要是被哪些 reusable asset family 推動

## Verification

- backend:
  - targeted tests for feedback-linked scoring snapshot
  - completion review checkpoint persistence test update
- frontend:
  - phase-six governance helper tests for new low-noise summary
- docs:
  - update active runtime contract
  - update roadmap alignment wording
  - append QA evidence only after real verification
