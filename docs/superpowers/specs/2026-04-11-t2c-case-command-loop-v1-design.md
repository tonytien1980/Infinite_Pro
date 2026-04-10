# T2-C Case Command Loop V1 Design

日期：2026-04-11
狀態：draft

## Purpose

`docs/06_product_alignment_and_85_point_roadmap.md` 目前的官方分數已來到平均 `80.3`。

這代表 Infinite Pro 已經不是骨架型產品：

- `T2-A` 已把 generalist coverage baseline 補厚
- `T2-B` 已把 reusable intelligence effectiveness reading 補到較可信的 posture
- `T2-C` 已把 task detail 從資訊堆疊頁推成比較像顧問工作面
- `T2-D` 已把 runtime / release confidence 往更正式的 smoke posture 推進

但這也意味著，下一步如果只是再做更多 micro-slice，
很容易只得到 `+1 / +2` 的小幅加分，
卻沒有真正改變顧問每天使用這套系統的依賴程度。

目前最值得正面處理的缺口，不是再補一層 proof，也不是先做 KPI dashboard，
而是：

- **Infinite Pro 還沒有把同一個案件中的 `matter -> task -> deliverable -> writeback` 做成真正高槓桿的指揮鏈**

換句話說，系統現在已經比較會：

- 告訴顧問這頁在看什麼
- 告訴顧問 evidence / guidance / readiness 的 posture
- 告訴顧問 task / deliverable 的 next-step

但系統還沒有足夠成熟地做到：

- 在案件層先回答這案子現在最該推什麼
- 在 decision 層先收成一個可交付、可判斷、可 handoff 的 canonical output
- 在 closeout 層讓 precedent / playbook / template 的 writeback approval 變成日常工作的一部分

這一刀的目的，就是把這個缺口正式定義成：

- `T2-C case command loop v1`

## Product Posture

這一刀的正式角色是：

- 把 Infinite Pro 從「多個工作頁面已經比較順」推到「同一個案件有更清楚的 command loop」
- 讓 system 不只回答每一頁怎麼看，而是更清楚回答：
  - 這個案件現在最值得推哪一條主線
  - 這個 task 現在該如何收斂成正式 decision brief
  - 這次結果有哪些值得寫回 shared intelligence

這一刀不是：

- 為了把分數從 `80.3` 推到更漂亮而硬造功能
- 新 dashboard family
- enterprise admin shell
- KPI / ROI attribution engine
- matter / task / deliverable 的全面重寫

## Why This Is The Right Next Move

如果只看目前最弱的官方分數：

- `G = 74`
- `D = 77`
- `F = 79`
- `C = 79`
- `H = 80`

最容易誤判的做法，是直接選一格最低分，然後去堆最容易加分的補丁。

但這不一定真的有產品價值。

目前更準確的產品判斷是：

1. `T2-A`
   - 已到一個可信的 `v1` proof posture
   - 再往下會更偏 proof deepen，而不是每天更有感的工作台進步

2. `T2-B`
   - 已到一個保守可信的 reusable intelligence reading posture
   - 再往下就很容易碰到更重的 KPI / attribution 問題

3. `T2-D`
   - release-readiness 與 browser smoke baseline 已站起來
   - 但再往下更多是 runtime confidence deepen，不是主工作流本身的核心升級

4. `T2-C`
   - 是現在最有機會把「顧問實際依賴程度」再往上拉的一條
   - 而且剛好已經有：
     - `task detail usability`
     - `task operating leverage`
     - `task handoff`
     的基礎

所以這一刀應該做的，不是 task page polish v4，
而是把它往上接到 matter、往下接到 deliverable / writeback，
形成真正的案件指揮鏈。

## Architecture Guardrails

這一刀不改 Infinite Pro 的六層架構。

這一刀只會發生在：

- 既有 `matter / task / deliverable / writeback` 工作主鏈
- 既有 Host 主導的 orchestration boundary
- 既有 frontend workbench surfaces 與其 helper / view-model
- active docs 與 QA evidence

這一刀不會：

- 新增第七層架構
- 讓 UI 取代 Host 做流程判斷
- 把 task 變成新的總控 dashboard
- 把 decision brief 做成另一種平行 deliverable 系統
- 把 writeback approval 做成 admin console

## Approaches Considered

### Approach A: 繼續用 micro-slice 把 `T2-C` 補得更細

例如再補：

- task 頁更多 handoff 文案
- matter 頁更多焦點卡
- deliverable 頁更多 rail 摘要

優點：

- 風險低
- 每刀都容易收口

缺點：

- 很可能繼續只得到小幅加分
- 難以形成真正的產品拉力

### Approach B: 直接跳去 KPI / business outcome dashboard

優點：

- 聽起來像大進展

缺點：

- 很容易高估實際能力
- 容易在資料語意與 attribution 邊界還沒穩時先長出表面控制台

### Approach C: 建立 `case command loop`（推薦）

不重新發明產品，也不做大規模重寫，
而是把既有 `matter -> task -> deliverable -> writeback`
做成更清楚的正式 operating loop。

優點：

- 最符合目前產品真正需要的推進方向
- 同時拉動 `G / F / H`
- 會讓顧問每天更有感，而不是只有 roadmap 更完整

缺點：

- 不是一刀就能全部做滿
- 需要切成 2 到 3 個比較有份量的 slice

本輪採用：

- `Approach C: case command loop`

## Core Decision

這一刀的正式決策如下：

1. 下一條真正值得做的主線，應掛在 `T2-C`
   - 名稱定為 `case command loop v1`

2. 這條主線應以案件工作主鏈為中心，而不是單頁 polish 為中心

3. 它的第一階段應固定由三個子題組成：
   - `matter command`
   - `decision brief`
   - `writeback approval`

4. 這三個子題必須服務同一個問題：
   - 顧問如何用 Infinite Pro 更清楚地推進一個案件，而不是只看更多系統摘要

5. 這條主線主要掛在 `T2-C`
   - 但應誠實承認它會次級拉動：
     - `F mature-product feel`
     - `H self-optimization`

## Proposed Structure

### Slice 1: Matter Command V1

目的：

- 把 matter 頁從案件資訊頁推成案件指揮面

正式應回答：

- 這個案件現在的主目標是什麼
- 目前最大 blocker 是什麼
- 目前最值得優先推的 task 是哪一個
- 若不直接推 task，現在應先補什麼
- 目前最自然的 deliverable 收斂方向是什麼

正式規則：

- 不做 dashboard wall
- 不堆很多同權重 metrics
- 先回答主線與下一步，再回答系統結構

### Slice 2: Decision Brief V1

目的：

- 把 task 和 deliverable 之間收成一條更正式的 decision output

正式應回答：

- 問題是什麼
- options 是什麼
- risk 在哪裡
- recommendation 是什麼
- next action 是什麼
- 這份輸出目前是 draft、decision-ready，還是 publish-oriented

正式規則：

- decision brief 不是新建一個獨立產品
- 而是把既有 task / deliverable 之間的中介收斂成更清楚的 canonical output posture

### Slice 3: Writeback Approval V1

目的：

- 把案件 closeout 後的 shared intelligence 回寫，從被動紀錄推成正式 approval loop

正式應回答：

- 這次有哪些 precedent 值得留下
- 哪些 playbook signal 值得吸收
- 哪些 deliverable pattern 值得升成 template
- 哪些只是個案，不應過度 generalize

正式規則：

- 不做 admin 審批中心
- 不做大量治理欄位牆
- 應保持 consultant-first、low-noise

## UX Direction

這條主線的 UX 方向不是：

- 把更多系統能力抬到第一屏
- 把每頁都做得像控制台

而是：

- matter 頁更像案件指揮面
- task 頁更像 decision push 面
- deliverable 頁更像正式結果工作面
- writeback 更像自然 closeout，而不是背景審計紀錄

如果這條主線做對，
顧問的感受應該是：

- 我更清楚現在這案子應該先推哪
- 我更容易把一次分析收成正式判斷
- 我更容易知道這次有哪些東西值得留下來，讓系統下次真的更強

而不是：

- 多了一堆更完整的摘要
- 但還是不知道現在先做什麼

## Verification Intent

這條主線後續 implementation 的驗證重點應包括：

1. matter 是否真的變成較清楚的案件指揮面
2. task / deliverable 之間是否出現更正式的 decision brief posture
3. writeback approval 是否真的更像正式 closeout loop，而不是背景資料
4. 是否同時提升：
   - consultant usability
   - mature product feel
   - reusable intelligence 的真實回寫價值

## Explicitly Not In Scope

這條 spec 明確不做：

- 新增 active top-level roadmap doc
- 新的 dashboard family
- KPI / ROI / business outcome attribution engine
- multi-user / admin / enterprise shell
- task / matter / deliverable 的全面改版
- 六層架構調整

## Why This Helps The Product More Than Score-Gaming

這條主線若做對，分數當然會動，
但它的價值不應先從分數理解。

它真正的價值是：

- 讓 Infinite Pro 更像顧問每天會依賴的工作台
- 讓 shared intelligence 的複利更自然地接進真案件
- 讓 system 的強度留在底層，而不是把複雜度丟到表面

也就是說，
它不是因為 `G / F / H` 低所以才做，
而是因為：

- **這條主線最有機會把 Infinite Pro 從「已經不錯」推進成「真的更難被替代」**
