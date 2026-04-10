# T2-C Task Handoff Deepen V1 Design

日期：2026-04-10
狀態：draft

## Purpose

`docs/06_product_alignment_and_85_point_roadmap.md` 已把 `T2-C` 定義成：

- `Consultant operating leverage and task-surface usability`

目前這條主線已經連做兩刀：

- `task detail usability pass v1`
- `task detail operating leverage v1`

也就是說，`/tasks/[taskId]` 現在已經能比較清楚回答：

- 這筆工作能不能跑
- 若不能跑，最缺什麼
- 若能跑，跑完去哪裡
- 這頁現在怎麼推最快
- 若不直接執行，最有槓桿的回退路徑是什麼

但現在還有一個很明顯的缺口：

- **task detail 已經比較會回答這頁怎麼看，卻還沒有正式把 task -> matter / deliverable 的 operating handoff 做得夠清楚**

目前最容易卡住的地方有三種：

1. 顧問知道「不要只停在 task 摘要」
   - 但還不夠清楚這一刻到底該回 `matter` 還是 `deliverable`
   - 以及為什麼現在該走那一邊

2. 首屏已經有 `run / evidence / result destination`
   - 但 task page 還沒有更正式地把：
     - `回案件工作面是為了補脈絡 / 來源 / continuity`
     - `回正式交付物是為了閱讀 / 修訂 / 發布`
     明確區分成 handoff contract

3. 第二層 operating summary 已經開始收斂
   - 但還沒有把「handoff 到下一個正式工作面」讀成同一條 consultant operating 主線

這一刀的目的，就是把 `T2-C` 往前推成：

- `task handoff deepen v1`

## Product Posture

這一刀的正式角色是：

- 把 task detail 從「這頁現在怎麼看 / 怎麼推」推到「接下來應該交回哪個正式工作面、為什麼」
- 讓 system 更清楚回答：
  - 現在先留在 task 面，還是應回 `matter`
  - 什麼情況應該優先回 `deliverable`
  - 這次 handoff 的主要理由是脈絡、continuity、還是正式交付結果

這一刀不是：

- task 頁全面重寫
- new dashboard family
- training shell
- 自動跳頁 orchestration
- matter / deliverable surface 重做

## Architecture Guardrails

這一刀不改 Infinite Pro 的六層架構。

這一刀只會發生在：

- 既有 `/tasks/[taskId]` task surface
- 既有 frontend helper / view-model layer
- 既有 `WorkspaceSectionGuide`
- 既有 task hero / right rail / operating summary
- active docs 與 QA evidence

這一刀不會：

- 改 Host orchestration boundary
- 把 task 變成新的中心 dashboard
- 在 task surface 內複製 `matter` 或 `deliverable` 的完整內容
- 把 handoff 做成 workflow automation console

## Why This Slice Now

`T2-C` 到目前為止最大的進展，是 task detail 已開始比較像 consultant operating surface，
而不是單純的資訊堆疊頁。

但現在最大的剩餘風險，不是 task page 完全不能用，
而是：

- **task page 雖然比較會說這頁怎麼看，但還不夠會把人送到下一個對的正式工作面**

也就是說，下一刀最值得補的不是再加更多 task 摘要，
而是更好的 handoff。

## Approaches Considered

### Approach A: 再做一輪 task hero / copy polish

只補 wording、標題、right-rail 文案。

優點：

- 施工最小

缺點：

- 只能改善表面閱讀感
- 對 handoff 問題幫助有限

### Approach B: task-to-matter / deliverable handoff contract（推薦）

保留既有 hero / guide / operating summary，不擴成新頁，而是正式補：

- `handoff target`
- `handoff reason`
- `handoff summary`
- `task 留守 / 回 matter / 回 deliverable` 的低噪音判讀

優點：

- 最符合 `T2-C` 目前的真缺口
- 能直接補顧問操作體感
- 不會和 `T2-D`、`T2-B` 混線

缺點：

- 體感不像大改版
- 但對真實使用最有幫助

### Approach C: 新增 task handoff dashboard / panel family

把 handoff 做成一條新的可展開控制台。

優點：

- 結構上看起來完整

缺點：

- 很容易重新長出 dashboard family
- 不符合現在 low-noise posture

本輪採用：

- `Approach B: task-to-matter / deliverable handoff contract`

## Core Decision

這一刀的正式決策如下：

1. task detail 應正式回答：
   - 現在應該先留在 task
   - 還是回 `matter workspace`
   - 還是回 `deliverable workspace`

2. handoff 判讀應優先聚焦在三種理由：
   - `context / evidence deepen`
   - `continuity / operating context`
   - `formal result / publish-oriented reading`

3. 這一刀應優先把 handoff 補進：
   - task usability helper
   - `WorkspaceSectionGuide`
   - operating summary notes
   - 右側 rail 的 task-first readout

4. 這一刀先做成 low-noise handoff framing：
   - 不做自動跳頁
   - 不做新 handoff console
   - 不改 matter / deliverable 本體

## Proposed First Slice

這一刀正式只做：

1. explicit handoff target reading
   - 在 task detail usability view 補一層更正式的 handoff target / reason / summary
   - 至少能回答：
     - 現在最自然該回哪個正式工作面
     - 為什麼不是另一個

2. section guide handoff deepen
   - 把 `WorkspaceSectionGuide` 裡的第三條主線從 generic destination
     推成更明確的 `回 matter / 回 deliverable / 先留 task`

3. operating summary handoff deepen
   - 在既有 operating notes 中，把「最有槓桿的下一步」與「接續工作時」補成更像顧問工作面 handoff
   - 不再只說要回哪，而是要說回去的主因是什麼

4. docs / QA sync
   - `docs/03`
   - `docs/06`
   - `docs/04`

## UX Direction

這一刀的 UX direction 應該是：

- 不再多造一層摘要
- 先讓 handoff 更不容易看錯

也就是：

- `回 matter` 不等於只是回上一頁
- `回 deliverable` 不等於只因為有結果就跳
- `先留在 task` 也不等於什麼都不做

這頁應該更明確地把：

- 補脈絡 / 來源 / continuity -> 回 `matter`
- 閱讀 / 修訂 / 發布正式結果 -> 回 `deliverable`
- 先做局部判斷 / 決定要不要執行 -> 先留 `task`

讀成同一條 operating 主線。

## Verification Intent

這一刀的驗證重點應包括：

- task usability helper 是否形成正式 handoff fields / summary
- `/tasks/[taskId]` 是否能更清楚區分：
  - 先留 task
  - 回 matter
  - 回 deliverable
- `WorkspaceSectionGuide` 是否能更明確回答 handoff 理由
- active docs 主要應對齊：
  - `docs/03`
  - `docs/06`
  - `docs/04`

## Explicitly Not In Scope

這一刀明確不做：

- task page 全面重寫
- matter workspace 改版
- deliverable workspace 改版
- new dashboard family
- handoff automation / auto-redirect
- `T2-D` runtime / browser smoke work

## Expected Outcome

完成後，`T2-C slice 3` 應能讓 Infinite Pro 的 task surface 再穩一層：

- task page 不只會說這頁怎麼看
- 也更會說「現在應該交回哪個正式工作面」
- task -> matter / deliverable 的 handoff 會更接近顧問真實工作流，而不是 generic navigation
