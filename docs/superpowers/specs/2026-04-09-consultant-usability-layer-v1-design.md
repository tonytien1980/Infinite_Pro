# Consultant Usability Layer v1 Design

日期：2026-04-09
狀態：draft

## Purpose

`docs/06_product_alignment_and_85_point_roadmap.md` 已把第四條主線定成：

- `7.4 Priority 4: Consultant usability layer`

正式目標是：

- 讓同一套 consultant workbench 對不同成熟度顧問更可用
- 讓 system 更清楚回答 `現在先做什麼`
- 讓第二層 explanation 與 disclosure 更穩，但不滑向 training platform

這一刀不是在重做整套 IA，也不是把產品改成 onboarding shell，而是把目前已 shipped 的主要工作面做成：

- low-noise by default
- explanation on demand
- stronger first action hierarchy
- progressive disclosure that does not duplicate the whole page

## Product Posture

這一刀的正式角色是：

- 補 `7.4` 的第一個可驗證完成點
- 讓首頁、案件頁、交付物頁更能支撐不同成熟度顧問
- 讓使用者更容易從第一屏接回主工作

這一刀不是：

- training platform
- guided onboarding shell
- new dashboard family
- new page family
- chat-like coaching surface

正式仍要維持：

- consultant-first, not chat-first
- one page, one primary action
- progressive disclosure over summary duplication
- debug-on-demand
- Traditional Chinese first

## Scope Decision

本輪採用：

- `同一個 7.4 phase`
- `一份 spec`
- `一份 implementation plan`
- implementation 內部分三個連續 slices：
  - `slice 1 = overview clearer first action`
  - `slice 2 = matter workspace calmer second-layer reading`
  - `slice 3 = deliverable workspace explanation-on-demand cleanup`

這代表：

- 對產品節奏來說，這仍是同一個 `7.4` phase
- 對工程節奏來說，不做成一個超大混合 commit
- 每個 slice 都要能獨立驗證，最後再一起收口文件與 QA

## Why This Shape

目前 `docs/03_workbench_ux_and_page_spec.md` 已經把正式 UX 原則寫得很清楚：

- 首屏先回答：我在哪裡、什麼最重要、下一步做什麼
- 同一頁不應同時講三層系統概念
- `matter workspace` 是 retained-advisory 主控面
- `deliverable workspace` 與 `task detail` 才適合放 second-layer disclosure

但目前 shipped surfaces 仍有三個 usability gap：

### 1. overview 的 first action 已存在，但還不夠穩

首頁現在已能把人導回：

- 進行中案件
- 最近交付物
- 待補資料

但它目前仍比較偏：

- summary-rich
- metric-backed
- section-heavy

而不是更明確地回答：

- 你現在最值得做的一件事是什麼
- 為什麼是它
- 如果不做它，下一個選項是什麼

### 2. matter workspace 的 second layer 太容易變厚

`matter workspace` 現在已承接很多有價值的背景層：

- continuity
- research detail
- organization memory
- domain playbook

但它作為案件主控面，若第二層節奏不夠克制，初階顧問容易迷路，而高階顧問也會感到頁面太吵。

### 3. deliverable workspace 的 explanation-on-demand 還能更一致

`deliverable workspace` 已有相當多 disclosure panels 與 reusable guidance layers：

- precedent reference
- review lenses
- common-risk libraries
- deliverable-shape hints
- deliverable templates

這些方向本身是對的，但還需要更一致地回答：

- 這層是在幫我做什麼
- 什麼時候要看
- 這不是什麼

也就是要更像顧問工作台的 second-layer explanation，而不是系統能力展示牆。

## Approaches Considered

### Approach A: Overview-only quick cleanup

只做首頁：

- stronger first action
- less metric emphasis
- clearer return-to-work hierarchy

優點：

- 範圍最小
- 風險最低

缺點：

- 只能補入口
- 進到 `matter / deliverable` 後仍可能迷路
- 不足以誠實稱為 `7.4` 第一刀

### Approach B: Full multi-surface usability pass in one phase

同一個 `7.4` phase 內，正式補：

- overview
- matter workspace
- deliverable workspace

但 implementation 內分 slices 連續做完。

優點：

- 最符合 `docs/06` 想要的產品主線進展
- 可以把 `clearer first action`、`explanation on demand`、`progressive disclosure` 一次串起來
- 對使用者體感來說，會比較像完成一段真正的 usability pass

缺點：

- 實作量較大
- 必須嚴格控制邊界，避免順手把 `task detail`、training shell、或 dashboard family 也帶進來

### Approach C: Training-like guided mode

額外加：

- 教學提示
- step-by-step onboarding guidance
- 類 wizard 式引導

優點：

- 初學者短期可能更容易理解

缺點：

- 明確違反 `docs/06`
- 很容易把產品帶成 training platform
- 高階顧問會立刻覺得被打斷

本輪採用：

- `Approach B: Full multi-surface usability pass in one phase`

## Core Decision

這一刀的正式決策如下：

1. `7.4 v1` 只處理三個 surface：
   - `overview`
   - `matter workspace`
   - `deliverable workspace`

2. `task detail` 不納入本輪
   - 避免 scope 爆開
   - 也避免把 second-layer disclosure 系統一次改太多處

3. 不新增任何新 page family
   - 不新增 onboarding page
   - 不新增 guidance dashboard
   - 不新增 consultant mode switch

4. 只做三類 usability 動作：
   - clearer first action
   - explanation on demand
   - calmer progressive disclosure

5. 所有新增文案都必須維持：
   - plain-language first
   - action-first, system-jargon second
   - low-noise default

## Proposed First Slice Family

### Slice 1: Overview clearer first action

首頁正式應補：

- primary action hierarchy 更清楚
- `現在最值得做的一件事` 比現有 metrics 更前景
- secondary paths 更像 fallback options，而不是平行主線

這一刀重點不是新增資料，而是把第一屏的閱讀順序更明確化：

1. 先做什麼
2. 為什麼是這件事
3. 如果不是它，再去哪裡

### Slice 2: Matter workspace calmer second-layer reading

案件頁正式應補：

- `案件主線` 與 `背景補充` 的分界更清楚
- second-layer sections 需要更明確回答「什麼時候才要看這層」
- organization memory / domain playbook / continuity 等 layer 的優先順序更穩

這一刀的正式責任是：

- 讓初階顧問不會被第二層 guidance 淹沒
- 讓高階顧問仍能快速取用 background intelligence

### Slice 3: Deliverable workspace explanation-on-demand cleanup

交付物頁正式應補：

- disclosure panels 的 opening copy 更一致
- reusable guidance layers 更明確回答：
  - 這層可以怎麼用
  - 不代表什麼
  - 什麼時候值得打開

這一刀不新增新的 reusable layer，而是把既有 layer 做得更可讀、更低噪音、更一致。

## What This Phase Must Improve

這一刀完成後，至少要能更誠實回答：

- `overview` 是否更能回答現在先做什麼
- `matter workspace` 是否不再像「很多好資訊一起堆在主控面」
- `deliverable workspace` 的 disclosure 是否更像 explanation-on-demand，而不是能力牆

## What This Phase Must Not Do

這一刀明確不能做：

- 把首頁做成 onboarding hero
- 新增 training shell
- 新增 dashboard family
- 把所有 explanation 都搬到首屏
- 把 `matter workspace` 做成 precedent / memory / playbook portal
- 把 `deliverable workspace` 做成 reusable governance console
- 把 `task detail` 一起拉進同一輪 scope

## Success Criteria

這一刀完成後，正式至少要成立：

1. 首頁 first action hierarchy 比現在更清楚
2. `matter workspace` 首屏與 second layer 的分界更穩
3. `deliverable workspace` 的 disclosure copy 與 disclosure order 更一致
4. 同一套 surface 對初階與高階顧問都更可用
5. 沒有滑向 training platform 或新 dashboard family

## Verification Expectations

這一刀正式至少要驗證：

- homepage / overview 的主要 CTA 與閱讀順序
- `matter workspace` 的首屏與 tab / second-layer reading
- `deliverable workspace` 的 disclosure 互動與可讀性
- responsive reading 不被新 disclosure 打壞
- 既有 build / typecheck / targeted frontend tests 維持通過

若 shipped behavior 有明顯變動，正式還要同步更新：

- `docs/03_workbench_ux_and_page_spec.md`
- `docs/06_product_alignment_and_85_point_roadmap.md`
- `docs/04_qa_matrix.md`
