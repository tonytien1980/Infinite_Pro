# T2-C Low-Noise Workbench Repass Design

日期：2026-04-11
狀態：draft

## 1. Purpose

這份設計文件要把 Infinite Pro 下一輪 UI / UX repass 正式定義清楚，
避免我們一邊嫌現在不好用，一邊又只做零碎 patch。

這一輪的正式目的不是加功能，
而是把已經很強的底層能力重新包成更簡單、可理解、可操作的顧問工作台。

它要回答：

1. Infinite Pro 現在前台到底為什麼讓人迷惑
2. 哪些市面產品值得拿來借鏡
3. 要借它們什麼，不借什麼
4. 下一輪 UI / UX repass 應先改哪些工作面
5. 如何在不破壞六層架構與 Host 邊界的前提下，把表面做得更簡單

## 2. Why This Is The Right Next Move

依目前 active SSOT：

- `docs/06_product_alignment_and_85_point_roadmap.md`
  已經把第二 tranche 的主線定在 `T2-A` 到 `T2-D`
- 其中目前最直接影響日常依賴度的，是 `T2-C Consultant operating leverage and task-surface usability`

而目前最真實的產品問題，不是：

- backend 還不夠複雜
- reusable intelligence 還不夠多
- governance signals 還不夠完整

而是：

- 前台一次講太多事情
- 同一屏有太多同權重卡片
- 很多文字太長、太抽象、太像系統在對自己說話
- 顧問在首屏不容易快速判斷「現在先做什麼」

所以這一輪最值得做的不是 backend-first，
而是：

> 在維持底層強度的前提下，把工作面收成更低噪音、更高槓桿的 consultant-facing operating surface。

## 3. Product Principles For This Repass

這一輪必須嚴格遵守以下原則：

1. 先對產品真的有用，不是先對分數有用
2. 表面簡單，底層可以很強
3. Professional, trusted, stable
4. 讓顧問更快推進案件，不是讓顧問看更多系統摘要
5. 不新增第七層架構
6. 不讓 UI 取代 Host 做流程判斷
7. 不把工作台滑向 dashboard wall、training shell、admin console 或 chat shell

更白話地說：

- 複雜應留在系統，不該留在使用者腦中
- 顧問不該先理解 ontology、governance、writeback、provenance，才知道下一步
- 首屏應先像顧問工作台，不像系統解剖報告

## 4. Current Problem Statement

### 4.1 Whole-product problem

Infinite Pro 現在不是功能不夠，
而是同一套工作面上疊了太多「都有道理、但同時出現就會讓人累」的資訊層：

- 主線摘要
- readiness / confidence / continuity
- flagship lane
- research guidance
- organization memory
- reusable intelligence
- writeback / adoption / candidate review
- governance / phase-level summary

每一層單看都合理，
但如果第一屏就把很多層一起放上來，
使用者就會只感受到：

- 資訊量很大
- 操作很重
- 系統很厲害，但不知道現在該按哪裡

### 4.2 UX failure mode

目前主要 failure mode 不是「沒有資訊」，
而是「資訊層級失焦」。

具體表現：

- 第一屏常常同時有太多主語句
- hero、rail、metric strip、guide、detail card 都在搶主線
- 很多卡片在回答相近問題，但用不同字講一次
- 同一個概念在不同 surface 的說法不完全一致
- visible English debt 仍然存在，會打斷使用節奏

### 4.3 Performance failure mode

目前這套工作台的「慢」不是只有主觀感受，
而是已經有可觀察的技術根因。

目前已確認的根因包括：

- 首頁 `WorkbenchHome` 是大型 client component，
  而且在 mount 後一次觸發多個 summary / governance API refresh
- `overview / matter / task / deliverable / evidence` 幾個主工作面
  都由大型 client panel 承接，檔案體積偏大，hydration 成本高
- 目前正式 build 顯示主要 route 的 `First Load JS`
  約落在 `152 kB` 到 `174 kB`
- 其中最重的幾條主工作面包括：
  - `/tasks/[taskId]` `174 kB`
  - `/matters/[matterId]` `174 kB`
  - `/deliverables/[deliverableId]` `172 kB`
  - `/matters/[matterId]/evidence` `164 kB`
  - `/` `152 kB`

這代表目前的慢感至少來自兩層：

1. 真正的技術慢
   - client hydration 偏重
   - 首頁 requests 偏多
   - 首屏資料責任太廣

2. 認知上的慢
   - 第一屏資訊太多
   - 即使畫面已出來，使用者也要花很多時間讀懂

正式判斷：

- 這一輪 UI / UX repass 不能只做 hierarchy 與 copy
- 必須一起處理首頁 request 密度、首屏 hydration 壓力與第二層內容延後載入

### 4.4 Copy failure mode

目前不是只有 mixed language 的問題，
而是文字策略也有問題：

- 很多段落太長
- 很多段落不是 action-first
- 很多段落像是系統在解釋自己，而不是在幫顧問做事
- 有些地方在第一層就露出本來應該留給 second-layer disclosure 的語意

這一輪如果只做翻譯，
還不夠。

真正要做的是：

- 把文字壓短
- 把一大段說明改成「一句話結論 + 2 到 3 個重點 + 一個下一步」
- 把系統語言退到第二層

## 5. Alternatives Considered

### Option A. 只做表層中文化與文案清理

優點：

- 風險低
- 速度快

缺點：

- 只能修表面
- 不能解決資訊量同權競爭問題
- 很容易做完還是覺得不好用

### Option B. 做一輪 low-noise workbench repass（推薦）

核心做法：

- 不改六層架構
- 不先動 backend 主鏈
- 直接重收 `overview / matter / task / deliverable / settings` 的第一屏責任
- 先處理最明顯的首頁 / 主工作面載入壓力
- 同時做 visible language normalization 與 copy compression

優點：

- 最符合現在的產品問題
- 最能直接提升每天使用感
- 不會把系統帶去錯方向

缺點：

- 需要對多個工作面一起下手
- 不能只靠單一 micro-slice 補丁收口

### Option C. 直接做全面 shell redesign

優點：

- 表面看起來變化會很大

缺點：

- 容易 scope creep
- 容易打亂已對齊的 docs / QA 基線
- 很容易做成「看起來像新產品」，但實際主線更亂

本輪採用：

- `Option B. low-noise workbench repass`

## 6. Market Reference Set

這一輪不應找單一產品照抄，
而應該做 reference blend。

### 6.1 Primary references

#### 1. Linear

可借：

- 安靜但高效率的工作台節奏
- 很清楚的主次層級
- 列表與 detail surface 的低噪音結構

不要借：

- issue-tracker 式過度工程團隊語氣
- 只對熟悉型 power user 友善的默契化互動

對 Infinite Pro 的價值：

- 最適合借來收 `shell / matter / task` 的 hierarchy

官方參考：

- https://linear.app/
- https://linear.app/docs

#### 2. Stripe Dashboard

可借：

- settings / status / logs / admin-heavy 區塊的穩定感
- 高密度資訊下的閱讀層次
- 安全、可信、非炫技的表面處理

不要借：

- 過度偏金融後台的硬控制台語氣

對 Infinite Pro 的價值：

- 最適合借 `settings / version state / structured status block`

官方參考：

- https://stripe.com/
- https://docs.stripe.com/dashboard/basics

#### 3. Attio

可借：

- 底層 data model 很強，但前台仍然像現代工作台
- object-based product 的前台簡潔度
- flexible system without looking chaotic

不要借：

- generic CRM builder 感

對 Infinite Pro 的價值：

- 最適合借「複雜系統藏在後面」這件事

官方參考：

- https://attio.com/

#### 4. Glean

可借：

- 統一入口
- 先幫使用者找到方向，而不是先展示整個系統
- 大量知識場景下的低摩擦入口設計

不要借：

- search-first product 的單一路徑心智

對 Infinite Pro 的價值：

- 最適合借 `overview / case command` 的入口心智

官方參考：

- https://www.glean.com/product/workplace-search-ai

#### 5. Harvey

可借：

- 文件重、判斷重、草稿重工作流的專業感
- document-heavy 專業場景怎麼避免 consumer AI 感

不要借：

- 過度法律專用化
- 讓頁面過度像 drafting cockpit

對 Infinite Pro 的價值：

- 最適合借 `deliverable / review / evidence-heavy workflow`

官方參考：

- https://www.harvey.ai/platform/assistant

### 6.2 Secondary references

#### 6. Notion

可借：

- 長文、摘要、section、database 之間的節奏
- disclosure 與 block-based readability

不要借：

- 開放到沒有邊界
- 使用者必須自己組出工作流

官方參考：

- https://www.notion.com/product/notion

#### 7. Coda

可借：

- doc + decision + structured object 的混合工作面

不要借：

- 太像 doc-builder 而不像專業顧問工作台

官方參考：

- https://coda.io/product/docs-and-team-hubs

#### 8. Airtable Interface Designer

可借：

- 同一份底層資料，做成不同 task-specific surfaces
- 讓不同角色 / 任務只看到該看的層

不要借：

- 太像 generic builder

官方參考：

- https://www.airtable.com/platform/interface-designer

#### 9. Diligent Boards

可借：

- 大量、嚴肅、難讀材料的 distillation 能力
- 如何把 dense board materials 收成 clear, distilled, actionable reading

不要借：

- board governance 專用語氣
- 厚重 enterprise compliance shell

官方參考：

- https://www.diligent.com/products/boards

#### 10. Asana

可借：

- clearer action hierarchy
- work-to-outcome framing

不要借：

- 過度 project-management platform 語氣

官方參考：

- https://asana.com/product

## 7. Core Design Decision

這輪的核心設計決定是：

> Infinite Pro 前台不再嘗試在第一屏同時解釋整個系統，而是每頁只先回答一個主問題、一個主動作、一個最合理 fallback。

### 7.1 Page responsibility rule

每頁第一屏只回答：

- 我在哪裡
- 這頁最重要的是什麼
- 我現在先做什麼

不再同時承接：

- 系統全貌解說
- 深層治理摘要
- 太多同權重狀態卡

### 7.2 Two-layer rule

Infinite Pro 要明確分成兩層：

第一層：

- consultant-facing action layer
- plain-language
- route and next-step first

第二層：

- why / confidence / boundary / provenance / reusable-intelligence / governance

正式規則：

- 第二層必須保留
- 但第二層不能再壓回第一屏主線

### 7.3 Copy compression rule

第一層文案必須改成：

- 一句話結論優先
- 支援清單最多 2 到 3 點
- 長段說明退到 disclosure

不應再讓第一層出現：

- 兩三段長文
- 很長的名詞堆疊
- 用系統術語解釋系統術語

### 7.4 Visible language normalization

這輪必須把重要 visible English debt 清掉。

優先正規化對象：

- `Decision Brief`
- `Firm Operating`
- `Phase 5 Closure Review`
- `Generalist Governance`
- `Personal Provider Settings`
- `Firm Settings`
- `provider allowlist`
- `firm provider default`
- `Demo Workspace`

建議改法：

- `Decision Brief` -> `決策摘要`
- `Firm Operating` -> `營運狀態`
- `Phase 5 Closure Review` -> `第五階段收尾`
- `Generalist Governance` -> `全面型顧問治理`
- `Personal Provider Settings` -> `個人模型設定`
- `Firm Settings` -> `事務所設定`
- `provider allowlist` -> `可用模型來源清單`
- `firm provider default` -> `預設模型來源`
- `Demo Workspace` -> `示範工作台`

## 8. Surface-Level Repass Decisions

### 8.1 `/deliverables/[deliverableId]` is the highest-priority surface

這頁目前資訊密度最高，也最容易讓顧問不知道現在到底要：

- 發布
- 修訂
- 回看依據
- 處理採納與寫回

正式改法：

- hero rail 只保留：
  - `這份交付物現在先怎麼處理`
  - `可信度與適用範圍`
- adoption feedback / candidate / writeback approval 退到首屏下方的正式工作區塊
- 第一屏主問題只保留：
  - 這份交付物現在要不要發布、要不要改、還是要先回看依據

### 8.2 `/tasks/[taskId]`

這頁已有 `T2-C` 基礎，
但仍需要再做一次簡化。

正式改法：

- `Decision Brief` 改成 consultant-facing 中文
- 第一屏只保留：
  - 能不能跑
  - 最缺什麼
  - 跑完去哪裡
- 第二層再談：
  - handoff reason
  - evidence thickness
  - continuity / research / decision boundary

### 8.3 `/matters/[matterId]`

這頁要更像案件指揮面，
而不是大雜燴的案件摘要頁。

正式改法：

- 第一屏只保留：
  - 目前主線
  - 最大 blocker
  - 下一步最值得推什麼
- organization memory / research / flagship deep reading 退到第二層
- matter page 不該再像「所有中層摘要都放一張卡」

### 8.4 `/`

首頁應重新回到「把顧問送回正確工作面」。

正式改法：

- `Firm Operating` / `Phase 5 Closure Review` / `Generalist Governance`
  保留，但壓成更短的 readout 或 disclosure
- 首頁不可再讀起來像 dashboard wall
- 首頁的第一責任仍然是：
  - `現在先做這件事`

### 8.5 `/settings`

這頁最大的問題不是功能，
而是語言與分組。

正式改法：

- 優先把 visible English 收斂成一致中文
- 先分清楚：
  - 事務所層
  - 個人層
- 避免像 provider admin console

## 9. Explicit Non-Goals

這一輪明確不是：

- backend-first optimization
- 新 read model family
- 新 dashboard family
- training shell
- onboarding wizard
- enterprise admin console
- 新一輪 phase-level governance expansion
- 用更多卡片來解決資訊量問題

## 10. Recommended Implementation Order

建議施工順序：

1. `performance baseline + homepage request collapse`
2. `deliverable workspace repass`
3. `task detail repass`
4. `matter workspace repass`
5. `overview repass`
6. `settings visible language sweep`

原因：

- `overview` 目前同時承接太多 client-side requests，先處理這個才不會讓後續 UI 判斷失真
- `deliverable` 最痛
- `task` 是最常用、也最能建立 daily leverage 的頁
- `matter` 要在 task / deliverable 新節奏站穩後再回收
- `overview` 最後再收，才不會先做成另一套 summary wall

## 11. Verification And Documentation Rules

這一輪如果進入實作，正式要求如下：

- 不改六層架構
- 不新增新的工作面 family
- 不讓 UI 發明新的 workflow truth
- 先以前端 helper tests 固定新節奏
- 要補一份 build-based route size baseline
- 再跑 `frontend build -> typecheck`
- 若可行，再做 authenticated browser smoke

文件同步規則：

- `docs/03_workbench_ux_and_page_spec.md`
  要同步更新新的 first-screen / disclosure / language rules
- `docs/04_qa_matrix.md`
  只有在真的完成驗證後才 append

## 12. Recommendation

正式建議：

- Infinite Pro 下一輪 UI / UX 工作應正式定義為：
  - `T2-C low-noise workbench repass`
- 實作上採：
  - frontend-first repass
  - existing Host / runtime contracts reused
  - no new architecture layer
- 產品目標不是讓介面看起來更「完整」
  - 而是讓它更容易理解、更容易操作、更像高階顧問真的會依賴的工作台
