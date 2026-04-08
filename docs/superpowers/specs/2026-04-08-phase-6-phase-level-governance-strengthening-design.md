# Phase 6 Phase-Level Governance Strengthening Design

日期：2026-04-08
狀態：draft

## Purpose

`docs/06_product_alignment_and_85_point_roadmap.md` 已把主線明確定成：

- `7.1 Priority 1: Case-aware governance runtime`
- `7.2 Priority 2: Feedback-linked persisted scoring`

而這一輪由使用者明確決定的執行節奏是：

1. 先把 `7.1` 收完
2. 在 `7.2` 之前插入 `7.15`
3. `7.15` 做完後，才回到 `7.2`

因此 `7.15` 不是新的 roadmap 主線，而是：

- `7.1` 和 `7.2` 之間的 phase-level 補強插段

這份設計的目的，是把 `Phase 6` 目前還留在 phase-level review / summary layer 的遺留項收斂成一個可實作、可驗證、但不越界的工作定義。

## Execution Principles

這一輪的最高原則必須直接寫進設計，而不是只停留在對話口頭約定：

1. 文件端和程式端必須對齊
   - 任何 runtime / UI / contract 改動，都要同步更新對應 active docs
2. 本機端和 GitHub 必須同步
   - 每個 spec / plan / implementation phase 完成後，都要 commit 並 push 到工作 branch
3. 能調用 skills 解決工作，就先調用 skills
   - 這一輪已先使用 `brainstorming`
   - 後續進 plan 時要用 `writing-plans`
   - 進實作與驗證時要遵守 `verification-before-completion`

## Product Positioning

`7.15` 的正式角色是：

- 補強首頁 `Generalist Governance` 與既有 `phase-6-*` route family 的 phase-level 語意
- 讓 phase-level review layer 能更誠實回答：
  - 目前哪些是 phase-level foundation / review 結論
  - 哪些能力已經正式落到 `task / matter / deliverable`
  - 哪些部分仍留待 `7.2` 的 persisted scoring 再深化

`7.15` 不是：

- `7.2 feedback-linked persisted scoring`
- `7.3 generalist coverage proof`
- 新的 dashboard family
- 新的 phase console / governance wall

## Current Problem

目前 `7.1` 的工作面收口已經成立：

- `task / matter / deliverable` 都已能回讀 case-aware `guidance / reuse confidence / calibration / weighting`
- second-layer low-noise reading 也已 propagation 到三個正式工作面

但 phase-level `Phase 6` layer 仍有三個明顯缺口：

1. phase-level route 大多仍偏向全域 read model
   - `workbench.py` 目前多數 `get_phase_six_*` route 直接回傳 builder 結果
   - 除 `completion review` 會吃 feedback snapshot 外，多數 summary / next-step 仍偏固定敘述

2. phase-level 與 work-surface 的語意還沒有被正式對齊
   - 目前首頁 `Generalist Governance` 能讀到很多 phase-level cards
   - 但它還沒有很清楚地回答：
     - 這些是 phase-level review
     - 哪些已經在工作面 case-aware 成立
     - 哪些還沒進 persisted scoring

3. 容易造成產品認知漂移
   - 若直接把這些 phase-level route 誤講成 fully adaptive engine，會 overclaim
   - 若反過來只做 wording 微調，又會變成沒有實質進展的 docs-only micro-slice

## Design Goals

`7.15` 要正式補的不是更多卡片，而是更清楚的 phase-level定位與對齊能力。

本輪正式目標：

1. phase-level route 保持 phase review 身分，但不再像彼此分離的固定摘要
2. 首頁 `Generalist Governance` 能更低噪音地說清楚：
   - phase-level 狀態
   - work-surface 已落地的 case-aware runtime
   - `7.2` 尚未完成的 scoring / feedback depth
3. `Phase 6` 的 phase-level summary 與 active docs 不再互相打架

## Approaches Considered

### Approach A: Full Phase-Level Route Rewrite

作法：

- 把整串 `phase-6-*` route 都重寫成全面 case-aware runtime
- 讓 phase-level review 直接以案件脈絡動態重算所有治理結論

優點：

- 技術上最徹底
- phase-level 與 work-surface 會更接近單一引擎

缺點：

- 範圍太大，容易直接撞進 `7.2`
- 很容易把 `7.15` 變成新的主線
- 也容易重新長成 dashboard / governance wall

結論：

- 不採用

### Approach B: Docs-Only Relabeling

作法：

- 不改 runtime
- 只調整 `docs/01`、`docs/06` 與首頁文案敘述

優點：

- 成本最低
- 風險小

缺點：

- 無法算是真正產品進展
- phase-level route 的契約與首頁呈現仍可能繼續脫節

結論：

- 不採用

### Approach C: Recommended

作法：

- 保留既有 `phase-6-*` route family，不新增 public route family
- 在 backend 補一條 shared phase-level alignment layer
  - 負責把 audit / governance / guidance / confidence / maturity / closure / completion / closeout 的語意對齊
  - 明確區分：
    - phase-level review conclusion
    - work-surface landed runtime
    - `7.2` pending scoring depth
- 在首頁 `Generalist Governance` 補一條更低噪音的 phase-level alignment / contrast reading
  - 不新增 dashboard family
  - 不增加更多 cards
  - 優先把目前已存在的多段資訊整理成更可讀的結構

優點：

- 能把 phase-level 遺留真正補上
- 不會重開 `7.1`
- 也不會偷跑進 `7.2`

缺點：

- 仍需要小幅 backend / frontend / docs 一起改
- 必須很小心避免把首頁治理區塊做得更吵

結論：

- 採用這個方向

## Scope

`7.15` 的正式範圍包含：

1. `Phase 6` phase-level route alignment
   - 讓既有 `phase-6-*` builders 的 summary / snapshot / recommended next step 更一致
   - 明確補上「這是 phase-level review，不是 case-scoring engine」的語意邊界

2. 首頁 `Generalist Governance` 的低噪音收斂
   - 讓首頁能更清楚表達：
     - `7.1` 工作面已成立
     - phase-level governance 正在做什麼
     - `7.2` 還沒做滿什麼

3. active docs alignment
   - `docs/01_runtime_architecture_and_data_contracts.md`
   - `docs/06_product_alignment_and_85_point_roadmap.md`
   - `docs/04_qa_matrix.md` 只在有真實驗證時更新

## Explicit Non-Goals

本輪明確不做：

- 擴張 `7.2` 的 scoring evidence 來源
- 改寫 `task / matter / deliverable` 的既有 case-aware contract
- 新增 `/phase-6` page family
- 新增 governance dashboard family
- 新增 consultant ranking / training posture / enterprise review shell

## Proposed Runtime Shape

`7.15` 的推薦 runtime shape 是：

- 保留既有 public routes：
  - `phase-6-capability-coverage-audit`
  - `phase-6-reuse-boundary-governance`
  - `phase-6-generalist-guidance-posture`
  - `phase-6-context-distance-audit`
  - `phase-6-confidence-calibration`
  - `phase-6-calibration-aware-weighting`
  - `phase-6-maturity-review`
  - `phase-6-closure-criteria`
  - `phase-6-completion-review`
  - `phase-6-closeout-review`

但在 backend 內部補一條 shared alignment layer，用來保證這些 route 在語意上都能回答同三件事：

1. `Phase 6` 目前 phase-level 的真實位置是什麼
2. 哪些能力已經由 `7.1` 正式落到 work-surface
3. 哪些 remaining items 必須留給 `7.2`

這層是 internal alignment layer，不是：

- 新的 public API family
- 新的 page family
- 新的 governance console

## Homepage Behavior

首頁 `Generalist Governance` 在 `7.15` 後應更像：

- 一個低噪音 phase review surface

而不是：

- 一排彼此獨立、互相重複的治理卡片

正式希望達到的狀態：

1. 首屏先回答 `Phase 6` 現在在哪
2. 再回答 `7.1` 已落地到哪
3. 最後才回答 `7.2` 之前還差什麼

也就是：

- 先 phase posture
- 再 work-surface landed status
- 再 remaining next-step

## Documentation Impact

這一輪若進入實作，active docs 至少要同步回答：

1. `7.15` 是什麼
   - 它只是 `7.1` 與 `7.2` 之間的 phase-level governance strengthening

2. `7.1` 已完成到哪
   - 工作面 case-aware runtime 已收口於 `task / matter / deliverable`

3. `7.2` 尚未完成什麼
   - feedback-linked persisted scoring 仍只做到第一刀
   - 尚未把 deliverable / outcome / writeback evidence 正式接滿

## Verification Expectation

`7.15` 若進入實作，最低驗證標準必須包括：

1. backend phase-level route regression
   - 既有 `phase-6-*` route 仍可正常回應
   - summary / posture / recommended next step 的語意保持一致

2. frontend homepage regression
   - `Generalist Governance` 仍可載入
   - 低噪音摘要可正確回讀
   - 不因補強而長成更吵的多卡牆

3. active docs / QA alignment
   - 只有在真實驗證存在時，才更新 `docs/04_qa_matrix.md`

## Success Criteria

`7.15` 完成後，正式應能回答：

1. phase-level `Phase 6` 現在不是一堆分離的靜態治理摘要
2. 首頁 `Generalist Governance` 能清楚區分：
   - phase-level review
   - `7.1` 已落地的 work-surface runtime
   - `7.2` 尚未補滿的 scoring depth
3. docs / runtime / homepage 對 `Phase 6` 的說法一致
4. 補強後仍沒有新增 dashboard family，沒有偏離 `docs/06`

## Next Step

這份 spec 若經使用者 review 通過，下一步才進：

- `writing-plans`

也就是：

- 先寫 `7.15` implementation plan
- 你 review plan
- 然後才開始寫 `7.15` 的 code
