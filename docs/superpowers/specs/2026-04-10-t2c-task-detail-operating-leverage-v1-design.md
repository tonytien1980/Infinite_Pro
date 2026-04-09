# T2-C Task Detail Operating Leverage V1 Design

日期：2026-04-10
狀態：draft

## Purpose

`docs/06_product_alignment_and_85_point_roadmap.md` 已把 `T2-C` 定義成：

- `Consultant operating leverage and task-surface usability`

而 `task detail usability pass v1` 已經先把 `/tasks/[taskId]` 的第一屏收斂成：

- 能不能跑
- 若不能跑，缺什麼
- 若能跑，跑完去哪裡

這代表 task page 的第一個短板已經補掉，但 `T2-C` 還有第二半沒有完成：

- consultant operating leverage framing
- 同一套工作面如何同時支撐初階不迷路與高階高槓桿

目前 `/tasks/[taskId]` 雖然已比以前更容易進場，但整頁仍有明顯的 operating-layer 問題：

- 第二層資訊仍偏像「有很多東西可看」，而不是「顧問接下來怎麼推進工作」
- readiness / run / deliverable 主線已成立，但往下讀後容易回到多塊資訊並列
- 同類型 Phase 6 / readiness / continuity / research 註記，仍有變成 note stack 的風險
- 高階顧問會想直接抓主線與限制，初階顧問則需要被引回最有效的下一步；這兩種需求目前還沒有完全共存在同一個低噪音讀法裡

這一刀的目的，就是把 `/tasks/[taskId]` 正式往前推成：

- `task detail operating leverage v1`

## Product Posture

這一刀的正式角色是：

- 把 task page 從「第一屏比較清楚」推到「整頁更像顧問工作主線」
- 讓 second-layer 區塊不再只是資訊陳列，而是服務顧問推進工作
- 讓初階顧問看得懂下一步，同時讓高階顧問能快速抓到 posture、限制與 handoff

這一刀不是：

- task page 全面重寫
- 新 dashboard family
- onboarding shell
- training shell
- 把 task page 變成第二個案件工作台

## Architecture Guardrails

這一刀不改 Infinite Pro 的六層架構。

這一刀只會發生在：

- 現有 task page 的 workbench / UI layer
- 既有 task aggregate / helper read model 的低噪音重組

這一刀不會：

- 改 Host orchestration
- 改 task runtime contract 的 authority 邊界
- 把 UI 變成 runtime 決策中心
- 新增新的 `/phase-6`、`/governance`、`/task-console` 類頁面

## Why This Slice Now

目前 `T2-C` 的第一刀已經成立：

- 第一屏先回答能不能跑
- section guide 已縮成 readiness / run decision / result destination
- task hero 已開始更像顧問工作面

但 `docs/06` 對 `T2-C` 的要求還沒完整達成，因為：

1. `/tasks/[taskId]` 還需要更完整的 consultant operating leverage framing
2. `docs/03_workbench_ux_and_page_spec.md` 已明示：
   - 若要在 task surface 補第二層旗艦閱讀，應優先放在低噪音 detail 區塊
   - 同類 reusable posture 應優先做 wording consistency 與 note condensation
3. 現在若直接跳去 `T2-D`，會中斷 task page 已經建立起來的 momentum
4. 這一刀比直接衝更重的 runtime confidence 或新 surface 改版安全很多，也更直接提升 consultant-facing leverage

## Approaches Considered

### Approach A: 只補 section copy consistency

只調整現有 section 的標題與少數描述文字，盡量不動 helper 與 page structure。

優點：

- 最安全
- 幾乎不碰實作骨架

缺點：

- 只能算 wording cleanup
- 不足以完成 `consultant operating leverage framing`

### Approach B: second-layer operating leverage pass

保留既有 page 結構，但補一層統一的 operating-leverage view model，把：

- second-layer notes
- readiness / research / continuity / deliverable handoff
- section reading order

收成更一致、更低噪音的工作主線。

優點：

- 能直接補上 `T2-C` 還缺的第二半
- 仍然維持 task page 現有結構，不會炸成全頁重寫
- 很適合做成小而完整的下一刀

缺點：

- 需要小心避免滑成全頁資訊重排

### Approach C: task page 全面 IA 重整

把 task page 主欄與 disclosures 幾乎全部重新分組。

優點：

- 最完整

缺點：

- 範圍太大
- 容易和新 dashboard family、matter surface、deliverable surface 改版混線

本輪採用：

- `Approach B: second-layer operating leverage pass`

## Core Decision

這一刀的正式決策如下：

1. task page 必須開始有一條更明確的 `operating leverage` 主線
   - 不只回答能不能跑
   - 也要回答這頁現在最值得怎麼讀、怎麼往下推進

2. second-layer 區塊要優先做 `note condensation`
   - 同類型 posture / guidance / caution / handoff 不再各 section 各講各的
   - 優先把重複 note 收成較短、較一致的 condensed note

3. readiness / run / deliverable 的首屏主線已成立，第二層應補成：
   - 為什麼現在是這條主線
   - 目前最大的限制在哪裡
   - 若不直接執行，最有槓桿的回退路徑是什麼

4. task detail 必須更清楚同時支撐兩種使用方式：
   - 初階顧問：不迷路，知道先看哪裡、先做什麼
   - 高階顧問：快速抓 posture、boundary、next move，而不用讀一堆堆疊 note

5. 新的強化應優先落在既有 surface 與 disclosures 內
   - 不新增新頁
   - 不新增 dashboard wall
   - 不把本來低噪音的區塊重新長成 instruction wall

## Proposed First Slice

這一刀正式只做：

1. task operating leverage helper
   - 新增一個純前端 helper，把：
     - current operating posture
     - biggest blocker / caution
     - best fallback move
     - next handoff destination
     收成可測的 view model

2. second-layer note condensation
   - 在 task page 既有 second-layer 區塊內，把重複或太散的 guidance / caution notes 收成較短的一致骨架
   - 優先處理會直接影響顧問閱讀順序的區塊，而不是整頁一起重排

3. task detail operating summary pass
   - 在 task page 首屏與第一層 detail 區塊之間，補一層更清楚的 operating reading
   - 讓顧問更容易判斷：
     - 先執行
     - 先補 evidence
     - 先回 deliverable
     - 或先回 matter / continuity context

4. docs / QA sync
   - `docs/03`
   - `docs/06`
   - `docs/04`

## UI Direction

這一刀的 UI 方向不是「更多資訊」，而是「更少的決策噪音」：

- 首屏維持清楚，不再加第二條主線牆
- 第二層資訊改成更像顧問真正會用的 operating notes
- 同類 note 盡量短、一致、能快速掃讀
- 保留 disclosure 與 section order，但減少每區都重新講一次大意

應避免：

- 新增整排 metrics / governance cards
- 每個 section 都各自長一條完整摘要
- 把 task page 變成第二個 phase / readiness console

## Verification Intent

這一刀的驗證重點應包括：

- task page 是否更像 consultant operating surface，而不只是資訊堆疊頁
- condensed notes 是否真的減少重複與閱讀負擔
- 初階使用者是否仍能快速知道先看哪裡、先做什麼
- 高階使用者是否能更快抓到 posture / caution / next move
- 既有 task flow、run action、deliverable backlink、section anchor 是否仍正常

## Explicitly Not In Scope

這一刀明確不做：

- task page 全面 IA 重寫
- matter / deliverable surface 再改版
- new dashboard family
- training shell / onboarding shell
- KPI attribution
- runtime confidence / Docker gate / browser smoke
- six-layer architecture change

## Expected Outcome

完成後，`T2-C slice 2` 應能讓 `/tasks/[taskId]` 更誠實地達成 `docs/06` 對 task-surface usability 的下一層要求：

- task page 不只更容易進場，也更容易沿著主線往下推進
- 顧問更快看懂：現在的 posture 是什麼、最大的限制在哪裡、若不直接跑最值得回哪裡
- 初階不容易迷路，高階也不需要在第二層資訊裡自己重新拼主線
