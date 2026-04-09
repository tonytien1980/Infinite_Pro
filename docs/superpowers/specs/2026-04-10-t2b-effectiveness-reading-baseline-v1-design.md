# T2-B Effectiveness Reading Baseline V1 Design

日期：2026-04-10
狀態：draft

## Purpose

`docs/06_product_alignment_and_85_point_roadmap.md` 已把第二 tranche 的 `T2-B` 定義成：

- `Reusable intelligence effectiveness deepen`

而目前 repo 已經有一條可工作的 foundation：

- explicit feedback evidence
- deliverable-linked closeout depth
- outcome / writeback evidence
- persisted completion checkpoint

也就是說，system 現在已經知道：

- 有沒有 feedback
- feedback 是否掛在真實 deliverable
- deliverable 是否進過 publish / closeout
- 是否已有 outcome / writeback evidence

但 system 還沒有更誠實地回答另一個產品問題：

- 這些 evidence 到底能不能支撐「某些 reusable intelligence 開始站得住」
- 哪些只是早期 adoption signal
- 哪些已到 closeout-supported / writeback-supported
- 哪些還不能過度解讀

這一刀的目的，就是把現有 `Phase 6 feedback-linked persisted scoring`，從「有 evidence」推到「更可信的 effectiveness reading」。

## Product Posture

這一刀的正式角色是：

- 讓 `Phase 6` 不只回報 counts，而是回報 reusable intelligence 的 evidence posture
- 讓 owner 能分清楚：
  - `只是有 adoption signal`
  - `已被 deliverable / closeout 支撐`
  - `已被 outcome / writeback 再往下支撐`
- 讓 system 對 reusable pattern 的說法更保守、更可信

這一刀不是：

- KPI dashboard
- business outcome attribution engine
- reusable asset ranking wall
- new analytics family
- new architecture layer

## Architecture Guardrails

這一刀**不改變** Infinite Pro 的六層架構：

1. Ontology Layer
2. Context Layer
3. Capability Layer
4. Agent Layer
5. Pack Layer
6. Workbench / UI Layer

這一刀只會發生在既有邊界內：

- Host-governed runtime scoring / review read model deepen
- workbench 對既有 scorecard 的低噪音讀取補強
- active docs 對既有 contract 的補強

這一刀不會：

- 新增第七層
- 重組 capability / agent / pack taxonomy
- 把 Host judgment 外移到 UI
- 用 UI-only logic 取代 runtime governance

## Why This Slice Now

`T2-A` 目前已把 coverage proof 從 baseline 補到一個比較站得住的 posture：

- `stage/type`
- `personal-brand cross-stage`
- `continuity`
- `cross-domain`

接下來更值得補的，不是再把 benchmark matrix 繼續做厚，而是讓 system 更可信地回答：

- 這些 reusable patterns 是否真的開始形成 effectiveness

目前 `Phase 6` 已經有 evidence，但還有三個缺口：

1. `feedback evidence` 與 `effectiveness posture` 之間仍然靠人腦解讀
2. `deliverable adoption` 與 `writeback evidence` 還沒有被整理成一套更穩的 posture vocabulary
3. UI 目前能顯示 feedback-linked scoring，但還沒有正式回答「哪些 reusable intelligence 可以說開始站得住」

所以這一刀最適合做的是：

- `effectiveness reading baseline`

而不是直接衝：

- KPI / business outcome attribution

## Approaches Considered

### Approach A: Summary wording pass only

只把現有 feedback / closeout / writeback summary 重新整理成更好讀的文字。

優點：

- 最安全
- 幾乎不動 contract

缺點：

- 進展感太弱
- 本質上仍只是 readout wording，不是真正的 effectiveness posture

### Approach B: Effectiveness reading baseline

在既有 snapshot 上新增一層更明確的 evidence posture，讓 system 正式回報：

- early signal
- adoption-supported
- closeout-supported
- writeback-supported

優點：

- 能在不 overclaim 的情況下，讓 reusable intelligence 的說法變得更可信
- 邊界清楚
- 可建立在 repo 內已存在的 persisted evidence 上

缺點：

- 還不能回答真正 KPI / business outcome attribution

### Approach C: KPI / business outcome attribution now

直接把 reusable intelligence effectiveness 接到更強的 outcome / KPI / attribution 讀法。

優點：

- 產品感最強

缺點：

- 容易太早碰到歸因失真與 overclaim
- 很快會超出這輪安全切法

本輪採用：

- `Approach B: Effectiveness reading baseline`

## Existing Evidence We Can Safely Use

這一刀只建立在 repo 內已存在、可追溯、已被 current runtime 使用的 evidence 上：

- `AdoptionFeedback`
- deliverable-linked adopted / needs-revision / candidate signals
- publish / closeout related deliverable evidence
- `OutcomeRecord`
- `ActionExecution`
- `AuditEvent(event_type = writeback_generated)`
- persisted `completion checkpoint` snapshot

因此這一刀做的是：

- 重組 evidence reading

不是：

- 引入新的主觀 KPI
- 外接新的 attribution 資料源

## Core Decision

這一刀的正式決策如下：

1. 沿用既有 `feedback_linked_scoring_snapshot`
   - 不新開第四個 scoring family
   - 在既有 snapshot 之上補一層 `effectiveness reading`

2. `effectiveness reading` 第一版只分四種 posture：
   - `evidence_thin`
   - `adoption_supported`
   - `closeout_supported`
   - `writeback_supported`

3. posture 的判定只建立在既有 persisted evidence 深度上：
   - 不能靠推測
   - 不能因 absence of KPI 而把案件誤判成低效

4. 這一刀要保留之前已建立的安全邊界：
   - `one_off / minimal` 案件不能因沒有 writeback 就被錯罰
   - `writeback_supported` 是加深可信度，不是 universal hard gate

5. UI 只做 low-noise readout deepen：
   - 不新增 dashboard family
   - 不新開 analytics page
   - 仍掛在既有 `Generalist Governance / completion review` 附近

## Proposed First Slice

這一刀正式只做：

1. backend effectiveness posture read model
   - 在既有 `feedback_linked_scoring_snapshot` 之上補 posture fields / summary
   - 把 evidence 深度轉成更明確的 reusable intelligence reading

2. completion review summary deepen
   - 讓 closeout review / completion review 不只顯示 counts
   - 也能回答哪些 reusable patterns 目前只是 signal、哪些已較站得住

3. frontend low-noise effectiveness readout
   - 在既有 `Generalist Governance` 補一段 explanation-on-demand 等級的 effectiveness summary
   - 不新增新頁面

4. docs / QA sync
   - `docs/01`
   - `docs/06`
   - `docs/04`

## Data Model Direction

第一版不需要引入新的獨立 persistence table。

建議做法是：

- 在既有 `PhaseSixFeedbackLinkedScoringSnapshotRead` 或其相鄰 read model 上
- 補足 effectiveness-related fields，例如：
  - posture code
  - posture label
  - posture summary
  - reusable candidate support summary
  - evidence depth caveat

實作名稱可在 implementation plan 再定，但原則固定：

- 不新增重型 analytics schema
- 不在這一刀引入 KPI attribution schema

## UI Direction

前端 readout 的目標不是「讓畫面更像分析平台」，而是讓顧問更快看懂：

- 目前 reusable intelligence 到哪個可信層級
- 哪些已經值得繼續沿用
- 哪些還只是 early signal
- 下一步缺的是 adoption、closeout，還是 writeback

所以 UI 應維持：

- low-noise
- consultant-first
- explanation on demand

而不是：

- full table wall
- metric dashboard wall
- ranking-centric display

## Verification Intent

這一刀的驗證重點應包括：

- backend tests 能證明不同 evidence depth 會映射到不同 effectiveness posture
- `one_off / minimal` 案件不會被 absence of writeback 錯罰
- existing completion review / checkpoint flow 不被破壞
- frontend readout 能正確顯示新的 posture summary

## Explicitly Not In Scope

這一刀明確不做：

- KPI / business outcome attribution
- ROI scoring
- reusable asset ranking
- cross-matter success league table
- new analytics page family
- six-layer architecture change

## Expected Outcome

完成後，`T2-B slice 1` 應能讓 Infinite Pro 更誠實地說：

- system 不只是累積 feedback evidence
- system 已開始知道哪些 reusable intelligence 的 effectiveness 有較可信的 evidence depth
- 但 system 仍沒有 overclaim 成 KPI attribution engine
