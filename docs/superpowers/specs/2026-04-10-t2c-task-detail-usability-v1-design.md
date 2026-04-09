# T2-C Task Detail Usability V1 Design

日期：2026-04-10
狀態：draft

## Purpose

`docs/06_product_alignment_and_85_point_roadmap.md` 已把 `T2-C` 定義成：

- `Consultant operating leverage and task-surface usability`

而 `docs/03_workbench_ux_and_page_spec.md` 也已明確說明：

- `/tasks/[taskId]` 第一屏必須先回答：
  - 這筆工作能不能跑
  - 若不能跑，缺什麼
  - 若能跑，跑完去哪裡

目前 task page 已有很多資訊，但主線仍不夠聚焦：

- run panel、deliverable surface、recommendation/risk/action item、extension manager、補充脈絡都在
- 但顧問第一眼還不容易立即判斷：
  - 現在這筆工作最重要的是什麼
  - 該不該先跑
  - 跑完會往哪裡
  - 若不能跑，先補哪個缺口

這一刀的目的，就是把 `/tasks/[taskId]` 正式補成：

- `task detail usability pass v1`

## Product Posture

這一刀的正式角色是：

- 把 task page 從「資訊齊全但主線分散」推到「主線更清楚、下一步更直接」
- 讓 task detail 成為更高槓桿的 consultant operating surface
- 讓初階顧問不迷路，同時不把高階顧問困在 onboarding shell

這一刀不是：

- training shell
- onboarding wizard
- new dashboard family
- second homepage
- task page 重寫成 admin console

## Architecture Guardrails

這一刀不改 Infinite Pro 的六層架構。

這一刀只會發生在：

- 現有 task page 的 workbench / UI layer
- 既有 task aggregate / helper read model 的低噪音重新組織

這一刀不會：

- 改 Host orchestration 邏輯
- 新增架構層
- 把 UI-only logic 變成 runtime authority

## Why This Slice Now

目前 `T2-B` 已把 reusable intelligence effectiveness deepen 到一個安全收口點：

- posture
- composition
- attribution boundary

下一個最值得補的短板，正是 `docs/06` 已明講的：

- `task detail usability pass`

原因是：

1. task page 是顧問真正推進工作的核心 surface
2. 目前資訊很多，但首屏判斷負擔偏高
3. 這一刀能直接提升 consultant operating leverage
4. 風險比繼續深挖 KPI attribution 低很多

## Approaches Considered

### Approach A: 小修文案與標題

只調整 task page 的標題與少數 copy，保持目前版型不變。

優點：

- 最安全
- 最省工

缺點：

- 進展感太弱
- 不足以真正解掉主線分散問題

### Approach B: Task hero + right-rail usability pass

保留現有 page 結構，但重整：

- hero / first-screen 主線
- run decision block
- right-rail 的 next-step / boundary / confidence / version posture

優點：

- 可直接回應 `docs/03` 對 task page 的要求
- 不需要整頁重寫
- 最適合做成安全第一刀

缺點：

- 仍然不是整個 task page 的全面重構

### Approach C: 全面 task page 重構

把 task page 所有 section 與 IA 全部重排。

優點：

- 最完整

缺點：

- 範圍太大
- 容易一刀炸開
- 也很容易和新 dashboard / training shell 混線

本輪採用：

- `Approach B: Task hero + right-rail usability pass`

## Core Decision

這一刀的正式決策如下：

1. 第一屏主線必須先回答：
   - 能不能跑
   - 若不能跑，最缺什麼
   - 若能跑，跑完去哪裡

2. task hero 必須正式帶出：
   - 目前是哪條 flagship lane
   - 目前 posture 是什麼
   - 若要升級到下一個交付等級，最先缺的是什麼

3. run panel 應變成明確的 first action block
   - 不再只是 generic `執行任務流程`
   - 而是更像這筆工作的「現在先做這件事」

4. 右側 rail 應改成更清楚承接：
   - 版本 / 信心 / 邊界 / 下一步
   - 而不是與主欄同層競爭資訊量

5. 第二層資訊仍保留，但要更低噪音：
   - recommendation / risk / action item
   - extension manager
   - ontology / evidence / background

## Proposed First Slice

這一刀正式只做：

1. task hero / first-screen summary pass
   - 把 readiness、flagship lane、posture、next-step 統一成第一眼可讀的 summary

2. run block usability pass
   - 讓 primary action 更明確回答「現在先做這件事」

3. right-rail guidance pass
   - 讓右側 rail 更清楚承接：
     - confidence / boundary / next step / deliverable destination

4. docs / QA sync
   - `docs/03`
   - `docs/06`
   - `docs/04`

## UI Direction

task page 第一刀的目標不是做得更花，而是更像專業顧問工作台：

- hero 先講主線
- first action 明確
- right rail 講限制與下一步
- 第二層資訊保持低噪音可展開

應避免：

- 首屏堆太多 section card
- 重複講一樣的 summary
- 讓 extension manager / recommendation / evidence 和主線搶首屏

## Verification Intent

這一刀的驗證重點應包括：

- task page 首屏是否更直接回答「能不能跑 / 缺什麼 / 跑完去哪裡」
- primary action 是否更清楚
- right rail 是否更像決策輔助，不像一般資訊欄
- 既有 task flow、run action、deliverable backlink、extension manager 是否仍正常

## Explicitly Not In Scope

這一刀明確不做：

- training shell
- onboarding wizard
- new dashboard family
- task page 全面重寫
- matter / deliverable surface 再改版
- six-layer architecture change

## Expected Outcome

完成後，`T2-C slice 1` 應能讓 Infinite Pro 更像一個高槓桿顧問工作台：

- 顧問進到 task page 後，更快知道現在該不該跑
- 若不能跑，會先補哪個缺口
- 若能跑，會往哪個交付物或下一步前進
