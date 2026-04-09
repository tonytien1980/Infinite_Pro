# T2-B Effectiveness Evidence Composition V1 Design

日期：2026-04-10
狀態：draft

## Purpose

`T2-B` 第一刀已經把 `Phase 6 feedback-linked persisted scoring` 從「只有 evidence counts」推到：

- `effectiveness reading baseline`

目前 system 已能保守區分：

- `evidence_thin`
- `adoption_supported`
- `closeout_supported`
- `writeback_supported`

這代表 system 已開始知道 reusable intelligence 的 effectiveness 到了哪個大層級。  
但現在還差一個重要問題：

- **這個 posture 到底主要是被哪一類 evidence 撐起來？**
- **目前最需要保留的 caveat 是什麼？**

換句話說，第一刀已經回答：

- `有效性大概到哪個層級`

第二刀要補的是：

- `為什麼現在是這個層級`
- `主要支撐 evidence 是什麼`
- `還不能怎麼過度解讀`

這一刀的目的，就是把目前的 `effectiveness posture`，再往下補成：

- `effectiveness evidence composition / caveat reading`

## Product Posture

這一刀的正式角色是：

- 讓 `Phase 6 completion review` 不只說「現在是 adoption_supported」
- 也能說「目前主要是 explicit feedback 在支撐」
- 或說「目前已經有 deliverable closeout depth，但 writeback 還薄」
- 或說「目前有 writeback evidence，但仍只集中在少數 reusable asset lane」

這一刀不是：

- KPI / business outcome attribution
- ROI engine
- new analytics dashboard
- work-surface expansion to `task / matter / deliverable`
- six-layer architecture change

## Architecture Guardrails

這一刀延續 `T2-B slice 1` 的約束：

- 不改 Infinite Pro 六層架構
- 不新增第七層
- 不改 Host / Pack / Agent / Workbench 的正式邊界
- 不把 Host judgment 外移到 UI

這一刀只會發生在既有邊界內：

- `feedback_linked_scoring_snapshot` 的 read model deepen
- `completion review / checkpoint` 的 low-noise summary deepen
- homepage `Generalist Governance` 既有 completion-review card 的 readout deepen

## Why This Slice Now

目前 `T2-B slice 1` 已成立，但仍有三個缺口：

1. posture 太粗
   - 例如：
     - `closeout_supported`
     - `writeback_supported`
   - 目前只知道層級，不知道主要是什麼在撐它

2. caveat 還不夠聚焦
   - 現在大多只回答：
     - `one-off / minimal` 不該被錯罰
   - 但還不能更細地回答：
     - `有 adoption，但 deliverable evidence 還薄`
     - `有 closeout，但 writeback 還不足以放大解讀`

3. reusable intelligence 的可信度仍然偏黑箱
   - system 已經知道大致 posture
   - 但 owner 還看不出這個 posture 的主要支撐結構

所以第二刀不應該立刻跳去：

- KPI attribution
- business outcome dashboard

而應該先把現有 evidence 讀得更誠實。

## Approaches Considered

### Approach A: 只補 caveat wording

只在現有 `effectiveness_posture_summary` 後面多加幾句提醒文案。

優點：

- 最安全
- 幾乎不動 contract

缺點：

- 還是太像 copy tuning
- system 仍沒有正式表達 evidence composition

### Approach B: Evidence composition baseline

在既有 posture 上新增：

- 主要支撐 evidence 類型
- 次要支撐 evidence 類型
- current caveat 類型
- low-noise composition summary

優點：

- 可明確補上「為什麼是這個 posture」
- 還留在可驗證、可保守表述的安全邊界內
- 不需要立刻碰 KPI attribution

缺點：

- 仍然不是完整 attribution engine

### Approach C: 直接把 composition 接到 task / matter / deliverable surfaces

不只補 homepage / completion review，還同時把 composition 讀法下放到各工作面。

優點：

- 產品感更強

缺點：

- 很容易和 `T2-C` 混線
- scope 會明顯變大

本輪採用：

- `Approach B: Evidence composition baseline`

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

- evidence composition reading

不是：

- 新引入外部 KPI
- 新引入 business outcome source

## Core Decision

這一刀的正式決策如下：

1. 沿用既有 `effectiveness_posture`
   - 不新增第五種 posture
   - 不改第一刀已建立的 posture taxonomy

2. 第一版只新增 `evidence composition` 讀法，不新增新分數
   - 這一刀要補的是「組成與 caveat」
   - 不是另開第二條 effectiveness score

3. `composition` 第一版只回答三件事：
   - 目前主要支撐 evidence 是什麼
   - 目前次要支撐 evidence 是什麼
   - 目前最需要保留的 caution 是什麼

4. 這一刀仍保留保守邊界：
   - 沒有 KPI attribution，不可暗示真正 business outcome 已被歸因
   - `writeback_supported` 也不代表普遍成功，只代表 evidence depth 更深

5. UI 仍然只補 low-noise readout
   - 不開新頁
   - 不開新圖表
   - 不做 asset ranking wall

## Proposed First Slice

這一刀正式只做：

1. backend composition fields
   - 在既有 snapshot 上新增 composition / caveat fields
   - 例如：
     - `primary_support_signal`
     - `secondary_support_signal`
     - `current_caveat_signal`
     - `effectiveness_composition_summary`

2. completion review summary deepen
   - 讓 completion review 不只顯示 posture
   - 還能回答「現在主要靠什麼站得住」

3. homepage low-noise readout deepen
   - 在既有 completion-review card 補一條 composition summary
   - 仍保持 consultant-readable

4. docs / QA sync
   - `docs/01`
   - `docs/06`
   - `docs/04`

## Data Model Direction

第一版不需要新增 persistence table。

建議做法是：

- 在既有 `PhaseSixFeedbackLinkedScoringSnapshotRead` 上
- 補 composition 相關欄位

第一版建議採用 enum-like code，而不是自由文字，避免後續 drift：

- `primary_support_signal`
  - `explicit_feedback`
  - `deliverable_closeout`
  - `writeback_evidence`
  - `mixed_support`

- `secondary_support_signal`
  - 同上，但可為空

- `current_caveat_signal`
  - `thin_deliverable_evidence`
  - `thin_writeback_evidence`
  - `minimal_writeback_expected`
  - `narrow_asset_concentration`
  - `none`

實際欄位名可在 implementation plan 再微調，但原則固定：

- code + label + low-noise summary
- 不新開 analytics schema

## UI Direction

前端 readout 的目標仍然不是做成分析牆，而是讓顧問快速看懂：

- 現在主要是哪一類 evidence 在支撐 reusable intelligence
- 目前最大的 caution 是哪一塊

所以 UI 應維持：

- one-line summary
- low-noise
- explanation-on-demand

而不是：

- full diagnostic table
- multi-row metric panel
- dashboard family expansion

## Verification Intent

這一刀的驗證重點應包括：

- backend tests 能證明不同 evidence 組合會產生不同 composition / caveat reading
- `one_off / minimal` 案件會落到 `minimal_writeback_expected`，而不是被錯讀成負面
- completion review / checkpoint 仍會正確 round-trip 新欄位
- frontend helper 能把 composition summary 保持在低噪音 consultant-readable 形式

## Explicitly Not In Scope

這一刀明確不做：

- KPI / business outcome attribution
- ROI scoring
- reusable asset ranking
- task / matter / deliverable surface propagation
- new analytics page
- six-layer architecture change

## Expected Outcome

完成後，`T2-B slice 2` 應能讓 Infinite Pro 更誠實地說：

- system 不只知道現在是 `adoption_supported` 或 `writeback_supported`
- system 也能說出這個 posture 主要是被哪一類 evidence 撐起來
- system 同時能保留目前最大的 caution，避免把 reusable intelligence 講得比實際更成熟
