# T2-B Attribution Boundary Reading V1 Design

日期：2026-04-10
狀態：draft

## Purpose

`T2-B` 前兩刀已經把 `Phase 6 feedback-linked persisted scoring` 從 evidence counts 推到：

- `effectiveness reading baseline`
- `effectiveness evidence composition / caveat reading`

也就是說，system 現在已經能回答：

- 目前 reusable intelligence 到哪個 evidence posture
- 主要是被哪一類 evidence 撐起來
- 目前最大的 caution 是什麼

但 `docs/06` 對 `T2-B` 還有一個更敏感、也更重要的未完成點：

- **KPI / business outcome attribution 是否成立、成立到哪個安全邊界**

這一刀的目標不是直接做 attribution engine，  
而是先把 system 的說法補到更誠實的一層：

- **attribution boundary reading**

也就是 system 應能回答：

- 現在最多只能說 `outcome-adjacent`
- 或已到 `cautious attribution candidate`
- 或根本應明說 `not claimable`

## Product Posture

這一刀的正式角色是：

- 讓 `Phase 6 completion review` 不只知道 effectiveness posture 和 evidence composition
- 還能更誠實回答目前是否已經接近 attribution 邊界
- 讓 system 主動保留：
  - 哪些情況不能 claim business outcome attribution
  - 哪些情況只能說 outcome-adjacent
  - 哪些情況才勉強可稱為 cautious attribution candidate

這一刀不是：

- KPI dashboard
- ROI engine
- business outcome score
- consultant ranking
- new analytics family
- work-surface expansion to `task / matter / deliverable`
- six-layer architecture change

## Architecture Guardrails

這一刀延續 `T2-B slice 1` 與 `slice 2` 的約束：

- 不改 Infinite Pro 六層架構
- 不新增第七層
- 不改 Host / Pack / Agent / Workbench 的正式邊界
- 不把 Host judgment 外移到 UI

這一刀只會發生在既有邊界內：

- `feedback_linked_scoring_snapshot` 的 read model deepen
- `completion review / checkpoint` 的 low-noise summary deepen
- homepage `Generalist Governance` 既有 completion-review card 的 readout deepen

## Why This Slice Now

目前 `T2-B` 已經把「有效性讀法」做得更完整，但仍有三個缺口：

1. system 還不會主動說「這裡不能 claim attribution」
   - 現在雖然有 caveat
   - 但還沒有正式的 attribution-boundary vocabulary

2. `writeback_supported` 容易被人過度理解
   - evidence 深度更高
   - 不等於 business outcome 已可安全歸因

3. `docs/06` 已明說要回答 attribution 的安全邊界
   - 如果不先把 boundary reading 建起來
   - 後面很容易不是不小心 overclaim，就是永遠不敢往前走

所以這一刀最合理的做法不是：

- 直接跳 KPI / business outcome attribution

而是：

- 先 formalize `attribution boundary reading`

## Approaches Considered

### Approach A: 只補 warning 文案

只在既有 composition / caveat summary 後面再加一句「不要過度解讀」。

優點：

- 最安全
- 幾乎不動 contract

缺點：

- 仍然沒有正式 boundary vocabulary
- 容易又退回 copy-only patch

### Approach B: Attribution boundary reading baseline

新增一層保守的 boundary code / label / summary，例如：

- `not_claimable`
- `outcome_adjacent`
- `cautious_attribution_candidate`

優點：

- 可以正式回應 `docs/06` 的邊界問題
- 又不會太早滑進 KPI attribution
- 對 `Phase 6 completion review` 的低噪音 readout 很合適

缺點：

- 仍然不是完整 attribution engine

### Approach C: 直接做 KPI attribution

直接把 outcome / writeback / effectiveness composition 推成正式 attribution layer。

優點：

- 產品感最強

缺點：

- 風險最高
- 很容易 overclaim
- 一下子就超出本輪安全邊界

本輪採用：

- `Approach B: Attribution boundary reading baseline`

## Existing Evidence We Can Safely Use

這一刀仍只使用 repo 內已存在、已被 current runtime 使用的 evidence：

- explicit `AdoptionFeedback`
- `PrecedentCandidate` governance outcomes
- deliverable-linked feedback / publish / governed candidate evidence
- `OutcomeRecord`
- `ActionExecution`
- `AuditEvent(event_type = writeback_generated)`
- persisted checkpoint snapshot

因此這一刀只做：

- attribution boundary reading

不是：

- 引入新的 KPI source
- 引入外部 business metrics
- 新增手動 attribution scoring workflow

## Core Decision

這一刀的正式決策如下：

1. 沿用既有 posture 與 composition
   - 不改 `evidence_thin / adoption_supported / closeout_supported / writeback_supported`
   - 不改前一刀的 composition / caveat taxonomy

2. 第一版只新增 attribution boundary 讀法，不新增 attribution score
   - 這一刀要回答的是邊界
   - 不是新增一條 business outcome score

3. 第一版只保守區分三種 boundary：
   - `not_claimable`
   - `outcome_adjacent`
   - `cautious_attribution_candidate`

4. 邊界判定必須保守：
   - 沒有足夠 closeout / writeback / outcome evidence 時，不可跳到 `cautious_attribution_candidate`
   - `cautious_attribution_candidate` 也不等於正式 attribution 成立

5. UI 仍然只補 low-noise readout
   - 不開新頁
   - 不開新圖表
   - 不做 KPI wall

## Proposed First Slice

這一刀正式只做：

1. backend attribution boundary fields
   - 在既有 snapshot 上新增 boundary code / label / summary
   - 例如：
     - `attribution_boundary`
     - `attribution_boundary_label`
     - `attribution_boundary_summary`

2. completion review summary deepen
   - 讓 completion review 不只顯示 effectiveness posture / composition
   - 也能回答目前最多只能 claim 到哪個 attribution boundary

3. homepage low-noise readout deepen
   - 在既有 completion-review card 補一條 attribution boundary summary
   - 仍保持 consultant-readable

4. docs / QA sync
   - `docs/01`
   - `docs/06`
   - `docs/04`

## Data Model Direction

第一版不需要新增 persistence table。

建議做法是：

- 在既有 `PhaseSixFeedbackLinkedScoringSnapshotRead` 上
- 補 attribution boundary 相關欄位

第一版建議採用 enum-like code：

- `attribution_boundary`
  - `not_claimable`
  - `outcome_adjacent`
  - `cautious_attribution_candidate`

原則固定：

- code + label + one-line summary
- 不新開 analytics schema
- 不把這一刀包裝成 KPI engine

## Boundary Logic Direction

第一版不需要非常複雜，但必須保守。

建議方向：

- `not_claimable`
  - 幾乎只有 explicit feedback
  - 或只有一點 adoption signal
  - 還沒有足夠 deliverable / writeback evidence

- `outcome_adjacent`
  - 已有 closeout 或 writeback evidence
  - 但還不足以說 business outcome 可被 system 安全歸因

- `cautious_attribution_candidate`
  - 有較完整的 closeout + writeback evidence
  - 且 caveat 不再只是 `thin_writeback_evidence`
  - 但仍要保留「只到 cautious candidate」的 wording

## UI Direction

前端 readout 的目標仍然不是分析牆，而是讓顧問快速知道：

- 這個 reusable intelligence 現在最多能 claim 到哪裡
- 為什麼還不能更往前說

所以 UI 應維持：

- one-line summary
- low-noise
- explanation-on-demand

而不是：

- KPI 面板
- attribution table
- ranking / leaderboard

## Verification Intent

這一刀的驗證重點應包括：

- backend tests 能證明不同 evidence 組合會得到不同 attribution boundary
- `writeback_supported` 但 evidence 仍薄時，不會被錯升成正式 attribution
- completion review / checkpoint 仍會正確 round-trip 新欄位
- frontend helper 能把 boundary summary 保持在 consultant-readable 形式

## Explicitly Not In Scope

這一刀明確不做：

- KPI / business outcome dashboard
- ROI scoring
- formal attribution score
- task / matter / deliverable surface propagation
- new analytics page
- six-layer architecture change

## Expected Outcome

完成後，`T2-B slice 3` 應能讓 Infinite Pro 更誠實地說：

- system 不只知道有效性證據有多深
- system 也知道目前最多只能 claim 到哪個 attribution boundary
- system 能更主動地避免把 reusable intelligence 講成已經完成 business outcome attribution
