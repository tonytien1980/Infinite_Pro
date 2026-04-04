# 03 Workbench UX and Page Spec

> 文件狀態：Active source of truth
>
> 本文件定義 Infinite Pro 目前已 shipped 的 workbench IA、page roles、detail workspace reading order、page-level action hierarchy、cross-page jumps、design posture 與 UI disclosure rules。

---

## 1. Purpose

本文件回答：

1. Infinite Pro 的正式工作面現在怎麼分工
2. 每一頁第一屏應先回答什麼
3. primary / secondary / tertiary action 如何分層
4. 哪些資訊應首屏可見、哪些必須延後揭露
5. workbench 如何維持 consultant-first，而不退回 chat shell、admin panel 或 debug dashboard

本文件同時吸收了仍屬 active SSOT 的 visual / brand / interaction posture。

---

## 2. Design Posture

Infinite Pro 的工作台體驗應維持：

- consultant-first, not chat-first
- clarity before decoration
- one page, one primary action
- progressive disclosure over summary duplication
- evidence-backed confidence
- stable trust posture

正式語氣與視覺方向如下：

- Traditional Chinese 為預設工作語言
- light / dark mode 都是正式主題
- Calm, precise, deliberate
- editorial enterprise workbench，而不是 AI toy
- professional, trusted, stable
- structured, serious, reassuring
- more like an advisory operating system than an AI toy

### 2.1 Visual direction

Infinite Pro 應偏向西式專業顧問軟體感：

- editorial enterprise workbench
- restrained structural grids
- stable spacing
- deliberate whitespace
- high-legibility Traditional Chinese typography
- light mode 先建立閱讀層級，再映射到 dark mode

Typography direction：

- headings: `Noto Serif TC`
- body and UI: `Noto Sans TC`

Palette direction：

- deep navy / slate neutrals for structure
- disciplined blue as main accent
- warm orange only for decisive CTA, escalation, or important next-step emphasis
- semantic colors must remain explicit and accessible in both themes

### 2.1.1 Reference blend

Infinite Pro 目前正式採用下列參考組合作為 UI / UX 方向，而不是任意混搭：

- `Linear`
  - 借它的結構節奏、工作台密度、安靜但清楚的互動階層
- `Coinbase`
  - 借它的信任感、藍色主軸、穩定而機構級的表面處理
- `Wise`
  - 借它的易懂文案、低術語表單、非技術使用者也能快速理解的提示方式

轉譯到 Infinite Pro 的正式規則如下：

- hero 區要像工作台入口，不像行銷頁或 dashboard
- 主色以冷靜藍系與深色中性色為骨架，不靠裝飾性 glow 建立識別
- 卡片、列表、管理面要讓人感覺可靠、克制、易掃讀
- 首屏的數字卡只能當背景脈絡，不能搶走主線
- 任何管理頁或 detail workspace 都要先講「現在最值得做什麼」，再講系統定義

### 2.1.2 Visible surface differentiation

Infinite Pro 的視覺升級不能只停在文案、資訊架構或微弱 token 調整。

若一次 UI / UX pass 完成後，使用者仍覺得：

- header / nav 幾乎沒變
- hero 仍像同一張白卡重複貼在所有頁面
- 列表頁、管理頁、detail workspace 仍像同一套中性模板
- 主要 CTA、焦點卡、安靜指標列之間沒有足夠表面層級差異

那就不應算完成一次正式 visual pass。

正式規則：

- shell、header、nav、hero、主要 CTA、靜態指標列、section surface 必須在第一眼就能傳達這是同一套成熟顧問工作台
- page family 之間可以有表面語言差異，但必須仍維持同一個藍 / 深中性 / 暖橘輔助的品牌邊界
- 視覺差異應來自結構、對比、表面質感、節奏與 accent hierarchy，不是靠炫技特效或脫離產品語氣的裝飾

### 2.1.3 Responsive and mobile posture

Infinite Pro 不只要在桌機可讀，也必須在手機上維持正式可用。

正式規則：

- mobile support 是 workbench quality 的一部分，不是發版後再補的裝飾性工作
- overview、案件工作台、建立新案件、設定頁，以及主要 detail workspace 必須能在手機尺寸下完成核心閱讀與主操作
- mobile adaptation 不等於把桌機畫面硬縮小；要改成 touch-first、單手可理解、垂直閱讀優先的版本
- 不可在手機上隱藏核心工作流，只能重排、收斂、延後揭露

mobile 端正式行為：

- header / nav 應允許 touch-first 橫向導覽，而不是擠成不可按的多排小字
- hero 應收成單欄主閱讀順序，主要 CTA 優先滿版或接近滿版
- breadcrumb 與返回入口應保持可達，但不能破壞首屏主閱讀；可改成較輕量的換行或堆疊形式
- section guide、tabs、次要導覽在手機上可改成橫向滑動，但必須保有足夠點擊面積與可理解性
- 長標題、長 object path、長 summary 在手機上要優先處理可讀性，而不是原樣硬塞
- touch target 最小高度應維持接近 `44px`

### 2.2 Anti-direction

Infinite Pro 不應往下列方向偏移：

- playful / whimsical / trend-chasing UI
- floating chatbot shells
- AI-purple gradients
- glass-heavy neon dark interfaces
- metrics-first dashboards that bury the work
- admin-console clutter pretending to be a workbench

### 2.3 Copy posture

Infinite Pro 的正式文案應優先服務「正在做判斷、推進案件、整理交付物的顧問」，而不是技術專家。

因此文案必須維持：

- plain-language first
- action-first, system-jargon second
- short before complete
- consultant mental model before implementation detail

正式規則：

- hero 區只先說明這頁在幫什麼忙，不先解釋系統內部結構
- section intro 先回答「這裡能幫我做什麼」
- button text 要明確描述下一步，例如：
  - `前往案件頁`
  - `前往交付物`
  - `先補件`
  - `看全部案件`
- 若使用者不是在 debug，不應把下列詞放在第一層文案：
  - runtime config
  - fallback
  - checkpoint
  - progression
  - work slice
  - canonical authority
  - provenance
- 若某些術語在系統內不可避免，第一層應先翻成顧問可理解的語言，例如：
  - `checkpoint` -> `檢查點`
  - `progression` -> `推進狀態`
  - `runtime config` -> `正式執行設定`
  - `env baseline` -> `環境基線`
  - `local fallback` -> `本機備援`

文案風格要求：

- 不要用工程師視角解釋頁面
- 不要把「這頁怎麼用」寫成很長的操作手冊
- 不要同時講三層系統概念
- 優先讓顧問在 3 到 5 秒內知道現在該做什麼

可接受的語氣：

- 穩定
- 直接
- 低壓力
- 非技術導向

不可接受的語氣：

- platform-jargon heavy
- debug-first
- over-explained
- mixed English / Chinese when the English is not needed for user action

---

## 3. Global Workbench Rules

### 3.1 One page, one primary action

每頁同一時間只能有一個 primary action。

### 3.2 First screen answers three questions

每頁第一屏必須先回答：

1. 我現在在哪裡
2. 這裡最重要的是什麼
3. 我現在應該做什麼

### 3.2.1 List and management hero pattern

列表頁與管理頁第一屏正式採下列編排：

- 左側主敘事：
  - 頁名
  - 一句話說明這頁幫什麼忙
  - 一個 primary action
- 右側焦點卡：
  - 這頁現在先看什麼
  - 或目前最值得先處理的項目
- 下方靜態指標列：
  - 2 到 4 個輕量摘要即可
  - 只提供脈絡，不與 primary action 競爭

正式規則：

- 不要把 hero 做成四張同權重卡片的數字牆
- 不要讓列表頁 hero 同時承擔導覽、教學、系統說明、debug 摘要
- 管理頁的 hero 應先幫使用者判斷「要新增、要整理、還是先補齊定義」

### 3.2.2 Detail workspace first-screen pattern

detail workspace 第一屏正式採下列分工：

- 左側主線：
  - 物件標題
  - 這一頁在處理哪個判斷 / 哪個交付 / 哪組證據
  - 主要 CTA
- 右側操作決策卡：
  - 現在最重要的狀態
  - 現在先做什麼
  - 不做什麼
- 下方安靜脈絡列：
  - 版本
  - 證據厚度
  - 缺口數量
  - 工作流狀態

正式規則：

- hero 必須先承接主線與下一步，不能只當物件標頭
- hero 已說過的主線、下一步與版本狀態，不應在第一個正文區塊原樣重講一次
- 第一個正文區塊應該補「限制、焦點、依據或結果」，不是再重複一次 hero 摘要
- 若頁面同時有 section guide，guide 應當是導讀，不應再成為第二個 hero
- detail workspace 的 breadcrumb / back-link 不應只是裸文字鏈結；它們應清楚表達這是一套可返回、可續推的工作台路徑
- detail workspace 的 right rail 不應像普通資訊欄；它應明確承接版本、可信度、限制、結案姿態或下一步判斷
- detail workspace 的 metric strip 不只顯示數量，也應幫使用者快速辨識目前姿態，例如案件模式、版本狀態、依據厚度、代理 / 模組包路徑
- 若 detail workspace 已經完成 structural pass，後續 visual pass 必須讓 hero / rail / section guide 在第一眼就更像正式工作台，不是維持中性白卡模板

### 3.2.3 Flagship lane summary

對目前已產品化的旗艦流程，首屏應可顯示：

- 這輪目前屬於哪種起手姿態
- 目前為什麼屬於這種姿態
- 下一步最適合做什麼
- 後續可如何升級到更完整的工作主線

第一波正式值包括：

- `diagnostic_start`
- `material_review_start`
- `decision_convergence_start`

正式規則：

- 它是 consultant-facing first-screen summary，不是新的 product taxonomy layer
- 它必須由既有 runtime signals 衍生，而不是前端自創 workflow 真相
- 第一波正式產品化重點是 sparse-start matters 的 `diagnostic_start`
- `material_review_start` deepen 後應明示這是 document-heavy review workflow，而不是 generic file flow

deepen 後，首屏還應能回答：

- 目前這輪最多能交到什麼等級
- 目前不該被誤讀成什麼
- 若要升級到下一階段，最先要補的是什麼

第二層 flagship reading 也應沿用共用 helper，至少回答：

- 目前工作姿態
- 目前交付等級
- 適用邊界
- 下一步要升級到哪裡
- 升級前最該補什麼
- 升級條件

正式規則：

- `matter / evidence` 可直接把這層放在第二層正文
- `task / deliverable` 可把同一套閱讀放在較低噪音的 detail / disclosure surface
- 不可每一頁各自重寫 lane detail copy，導致同一案件在不同工作面講成不同意思

### 3.2.4 Research guidance

當案件需要補 research / investigation 時，工作面也應低噪音回答：

- 這輪要不要先補研究
- 建議研究深度
- 優先子題
- 查到哪裡就先停

正式規則：

- 不新增 research dashboard-first 頁面
- 不把 research depth 暴露成首屏必選控制
- research guidance 應嵌在既有 task / matter / evidence 工作面中，以「先查哪幾題」的顧問語言出現
- 當研究不是必要條件時，這層不應搶走首屏
- research guidance 的標題與摘要必須明示這是「系統研究主線」的建議，不可寫得像要求顧問自己去查
- 補件入口也必須明示：客戶內部資料、附件、會議紀錄與顧問手上原始材料，應走 supplement 主鏈，不要和系統研究混稱

### 3.3 Consultant-first, debug-on-demand

以下內容可達、可追、可展開，但預設不應與主線同層競爭：

- full trace
- full case world draft
- full research provenance
- full approval / audit list
- full canonicalization review
- full object-set membership metadata
- full revision / publish / artifact history

### 3.4 Consultant language, not platform jargon

UI 第一層語言應優先使用：

- 案件工作台
- 來源與證據
- 交付物
- 證據集
- 風險群組
- 條款集 / 義務清單
- 流程問題集
- 引用來源片段

不應把下列詞直接推上首屏：

- ObjectSet
- canonicalization review
- interface contract
- required-property ids
- rule binding ids

### 3.5 Progressive disclosure

Infinite Pro 正式採：

- page-level separation
- workspace-level separation
- section-level guides
- disclosure panels
- section navigator

### 3.6 No summary duplication

同責任的重複摘要不應同層出現。

允許的是：

- hero 一句話主線
- detail 區塊完整解釋
- evidence / history / deliverable workspace 的回鏈版本

---

## 4. Formal Workbench Surfaces

目前正式工作面包括：

- `總覽`
- `建立新案件`
- `案件工作台`
- `來源與證據工作面`
- `決策工作面`
- `交付物`
- `代理管理`
- `模組包管理`
- `歷史紀錄`
- `系統設定`

這些工作面共同構成 Infinite Pro 的 consulting workbench，而不是外掛式功能頁。

---

## 5. Global Page Roles

### `總覽`

角色：

- 今日工作總覽
- 導引顧問回到最值得先處理的工作面

### `建立新案件`

角色：

- 正式 intake 入口
- 一條 canonical intake pipeline 的可見入口

### `案件工作台`

角色：

- 操作 matter/world 的正式主工作面
- 承接 `Client / Engagement / Workstream / DecisionContext` 與 continuity 導引

### `來源與證據工作面`

角色：

- source / evidence / gap / supplement 的正式工作面

### `決策工作面`

角色：

- 推進單筆 task/work slice，讓其形成可正式交付的結果

### `交付物`

角色：

- 閱讀、整理、修訂、發布正式 deliverable

### `代理管理` / `模組包管理`

角色：

- extension catalog 與 task-level overrides 的正式管理面

### `歷史紀錄`

角色：

- 回看，不是主線推進面

### `系統設定`

角色：

- workbench preferences 與 system-level provider settings 的正式管理面

---

## 6. Detail Workspace Reading Order

對 `案件工作台`、`來源與證據工作面`、`決策工作面`、`交付物工作面`，正式閱讀順序是：

1. 定位
2. 主線
3. 主操作
4. 工作摘要
5. 深層內容

### 6.1 Right rail responsibility

右側欄只應承接：

- status
- readiness
- high-impact cues
- primary-action guidance
- 少量 metrics

右側欄不應承接：

- 長段落第二主內容流
- 全量歷史
- 全量 trace
- 與主內容同責任的重複摘要

### 6.2 Section navigator

若 detail workspace 有 4 個以上主要 section，第一屏應提供段落導覽。

導覽只應回答：

- section 名稱
- section 責任
- 何時需要往下讀

不應變成第二套摘要總覽。

---

## 7. Page-Level First-Screen Rules

### 7.1 `/`

主任務：

- 幫顧問判斷現在最值得回到哪個工作面

第一屏必答：

- 最值得先回案件、交付物，還是待補資料

Primary action：

- 打開最值得回去的工作面

### 7.2 `/new`

主任務：

- 用最少阻力完成正式進件

第一屏必答：

- 建立後會去哪裡
- 建立後如何進入正式主鏈

首屏必顯：

- canonical intake pipeline 說明
- inferred intake pattern
- unified material area
- item-level preview / remove / warning
- item-level status / diagnostics / remediation
- continuity mode / writeback depth 進階設定

Primary action：

- 建立案件 / 開始正式進件

第一屏也應維持：

- 先用顧問工作語言決定這次怎麼開始
- internal workflow labels 留在 disclosure / advanced settings
- 不讓使用者在第一步就被迫理解 specialist / multi-agent 等系統實作詞

### 7.3 `/matters/[matterId]`

主任務：

- 在同一個案件世界下決定主線與下一步

第一屏必答：

- 目前主線是什麼
- 下一步該補件、跑分析，還是看交付物

Primary action 應隨 continuity mode 分流：

- `one_off`
  - 正式結案 / reopen / 打開最新交付物
- `follow_up`
  - 補件 / 更新 checkpoint / 打開最新交付物
- `continuous`
  - 補件 / 記錄 outcome / 打開最新交付物

正式 guardrail：

- `follow_up` 首屏應明示這是「回來更新 / checkpoint」節奏
- 不可把 `follow_up` 寫成縮小版 `continuous`
- 不可讓 progression / outcome 語言在 `follow_up` 首屏與 checkpoint 同層競爭
- `continuous` 才應明示這是「持續推進 / outcome」節奏
- `follow_up` 也可用共通 advisory surface 回答：
  - 最近 checkpoint 時間線
  - 目前更新節奏穩不穩
  - 下次何時值得回來更新
- 但這一層不可露出 `outcome tracking` 主語言

首屏也應明示：

- 這個案件目前屬於哪種 flagship lane
- 目前交付等級與輸出邊界
- 這輪為什麼還停在這個姿態
- 下一步要補件、跑分析，還是回交付物

第二層旗艦區塊應沿用共用 detail helper，而不是每頁重新拼 sparse-start / material-review 的補充文案。

若案件屬於 `continuous`，第一波 retained advisory MVP 應優先回答：

- 現在健康嗎
- 最近推進到哪裡
- 下一步先做什麼
- 這輪結果目前追到哪裡
- 下一次應該什麼時候回看

正式 guardrail：

- 這三個答案應優先由 `continuation_surface` 提供，而不是前端自己拼接
- `matter workspace` 仍是 retained-advisory 主控面
- `task / deliverable / evidence` 首屏也應沿用同一條 continuity focus summary，而不是各自重寫 lane 文案
- 第二層 continuity 區塊也應沿用共用 detail helper，而不是各頁自己重組 checkpoint / progression 細節
- 可以比 `follow_up` 深，但不可長成厚重 dashboard
- outcome tracking 與 review rhythm 也應沿用同一條 surface，不另開 calendar / reminder shell

若 research guidance 被判定為 `recommended` 或 `active`，也可低噪音補充：

- 第一個 research question
- 研究大概補到哪裡就先停
- 來源品質怎麼看
- 這輪是否高度依賴新鮮度
- 哪個矛盾訊號必須保留
- 第二層研究區塊也應沿用共用 detail helper，而不是各頁自己拼研究卡片

若這個案件世界已累積 precedent candidates，也只應低噪音補一個 summary：

- 這案目前留下了幾個可重用候選
- 交付物候選與建議候選各有多少

不可把 precedent candidate summary 做成新的 hero 主線。

若 research guidance 目前為 `not_needed`，task 首屏 continuity 區塊應直接改用共通 focus summary，至少回答：

- 目前是回來更新，還是持續推進
- 最近最重要的變化是什麼
- 下次回看節奏與下一步先做什麼

### 7.4 `/matters/[matterId]/evidence`

主任務：

- 判斷來源、證據與缺口是否足以支撐主線

第一屏必答：

- 現在缺的是什麼
- 應先補什麼
- 補完之後回哪裡

Primary action：

- 依 continuity mode 做補件 / reopen / progression-linked supplement

若案件屬於 sparse-start diagnostic lane，首屏應先回答：

- 目前哪些支撐鏈還沒形成
- 補完後會回哪條主線
- 何時會從 first diagnosis 升級成較完整的 material review / decision convergence
- 目前這輪還不應被誤讀成什麼程度的正式交付

若 research guidance 目前為 `not_needed`，evidence 首屏 continuity 區塊也應沿用共通 focus summary，至少回答：

- 現在是 checkpoint 節奏還是 progression 節奏
- 最近一輪變化是什麼
- 應以什麼節奏回來更新，與下一步先補什麼

若案件屬於 `material_review_start`，首屏也應先回答：

- 目前主要在審哪份核心材料
- 這輪是 review / assessment posture，而不是最終決策版本
- 要升級成 decision convergence，最先還缺哪些背景或來源

第二層旗艦區塊也應沿用共用 detail helper，直接把這條主線的姿態、邊界與升級條件講清楚。

若 research guidance 為 `recommended`，也應補充：

- 先查哪幾題
- 補研究是為了補缺口，不是把所有公開資訊都抓完
- 若缺的是客戶內部資料或附件，應明示改走補件主鏈
- citation-ready handoff 應長什麼樣
- 最先怎麼收斂 evidence gaps
- 第二層研究區塊應把「這輪先查什麼 / 來源品質 / 時效性與矛盾 / 研究交接 / 研究子題與缺口收斂」讀成同一條系統研究主線

### 7.5 `/tasks/[taskId]`

主任務：

- 推進單筆工作紀錄，形成正式交付物

第一屏必答：

- 這筆工作能不能跑
- 若不能跑，缺什麼
- 若能跑，跑完去哪裡

Primary action：

- 執行分析

首屏也應明示：

- 這筆工作現在屬於哪個 flagship lane
- 目前是 exploratory、material review，還是 decision convergence posture
- 若要升級到下一個交付等級，最先缺的是什麼
- 執行分析後會往哪個正式交付結果前進

若這筆工作屬於 `material_review_start`，首屏文案應優先像顧問在審文件，而不是 generic analysis runner。

若要在 task surface 補第二層旗艦閱讀，應優先放在較低噪音的世界 / 寫回相關 detail 區塊，例如 `案件世界草稿與寫回策略`，而不是把這層直接塞回 hero。

若 research guidance 被判定為 `recommended` 或 `active`，可在同一個右側引導區補充：

- 建議研究深度
- 第一個 research question
- stop condition
- 這是系統研究，不是要求顧問自己去查
- 來源品質 / freshness 提示
- 第二層研究區塊也應沿用共用 detail helper，而不是只留下簡短 metadata

若 recommendation 已進入 precedent candidate pool，也應只在 recommendation 卡片附近低噪音提示：

- 這是建議模式候選
- 為何值得重用

若 research guidance 目前為 `not_needed`，task 第二層 continuity 區塊也應延用共通 detail helper，至少回答：

- 最近 checkpoint / progression 的位置
- 這輪最重要的變化
- 回看節奏與下一步建議

### 7.6 `/deliverables/[deliverableId]`

主任務：

- 閱讀、修訂、發布正式交付物

第一屏必答：

- 這是什麼版本
- 現在該先整理版本、發布、匯出，還是回看依據鏈

Primary action 應隨 continuity mode / status 分流：

- `one_off`
  - 正式發布 / 匯出 / 正式結案
- `follow_up`
  - 新增 checkpoint / 回案件工作台續推
- `continuous`
  - 記錄 outcome / 更新下一步 / 回案件工作台續推

正式 guardrail：

- `follow_up` 版交付物應明示它屬於回來更新 / checkpoint 版本
- `one_off` 應仍偏向發布 / 匯出 / 結案
- `continuous` 才應保留較完整的 progression / outcome 心智
- `continuous` 版交付物應清楚表達它承接長期推進，而不是單次 checkpoint 更新
- 交付物右側 rail 的 continuity 區塊應沿用共通 focus summary，而不是只拼 raw lane summary
- 第二層 continuity 區塊也應沿用共通 detail helper，把推進健康、結果追蹤、回看節奏與下一步建議讀成同一條 retained-advisory 主線

若這份交付物有 research run history，研究區塊應讀成「最近系統研究交接」，而不是 raw `research runs` 清單，至少回答：

- 最近研究交接了什麼
- 來源品質怎麼看
- 時效性與矛盾怎麼看
- 研究結果如何交回主線

若這份交付物來自 sparse-start / flagship lane，首屏應可回答：

- 這份交付物目前屬於哪個工作姿態下的成果
- 它是 exploratory、assessment，還是 decision-action 等級
- 若要提高正式性，下一步應補什麼、升級到哪種主線
- 目前這份交付物的適用邊界在哪裡

若要在 deliverable surface 補第二層旗艦閱讀，應優先放在較低噪音的 continuity / research / writeback disclosure 中，而不是讓這層與交付摘要主線搶首屏。

若這份交付物已進入 precedent candidate pool，也應優先掛在 adoption feedback 區塊附近，而不是在交付 hero 額外開一條 precedent 主線。

### 7.7 `/agents`

主任務：

- 管理 agent catalog 與狀態
- 以最少必要資訊建立新代理，再由 backend AI + 外部搜尋補完正式 contract

Primary action：

- 建立代理，並讓系統自動補完正式 contract

第一屏必答：

- 這一頁只需要顧問提供哪些最少資訊
- 系統會自動補完哪些正式 agent contract 欄位
- 建立一個 agent 是否等於 Host 之後一定會用它

首屏應清楚說明：

- 標準使用者不需要先手動填 capability、pack 綁定或技術欄位
- 建立流程正式走 backend synthesis，而不是前端模板硬補
- 本次 AI 補完的摘要、搜尋查詢、外部來源與生成備註可被回看
- catalog creation 不等於 automatic runtime invocation；是否真的被案件選用仍由 Host 判斷

### 7.8 `/packs`

主任務：

- 管理問題面向模組包與產業模組包
- 以最少必要資訊建立新模組包，再由 backend AI + 外部搜尋補完正式 contract

Primary action：

- 建立模組包，並讓系統自動補完正式 contract

第一屏必答：

- 這一頁只需要顧問提供哪些最少資訊
- 系統會自動補完哪些正式 pack contract 欄位
- 建立一個 pack 是否等於案件之後一定會套用它

首屏應清楚說明：

- 標準使用者不需要先手動填問題型態、KPI、證據期待、decision patterns 或 deliverable presets
- 建立流程正式走 backend synthesis，而不是把完整 pack contract 責任丟回顧問
- 本次 AI 補完的摘要、搜尋查詢、外部來源與生成備註可被回看
- pack creation 不等於 automatic runtime invocation；是否真的進入案件流程仍由 Host 判斷

### 7.9 `/history`

主任務：

- 回看與整理歷史
- 集中回看 precedent candidates

Primary action：

- 打開工作紀錄

同頁也應成立第二條低噪音 precedent review lane：

- 可重用候選回看
- 狀態篩選
- 類型篩選
- 輕量建議排序
- 同案重複候選整理
- item-level 升格 / 停用 / 恢復

正式規則：

- precedent review 應留在 `history / management` family 內，不新增 precedent page family
- 這條 lane 不可搶走 history hero 的主定位
- task history list 與 precedent review list 應清楚分隔，但留在同一頁
- precedence review 的排序語言應保持可理解：
  - `建議先看`
  - `可安排下一輪`
  - `先放背景`
- 這層只是在幫顧問決定 review 順序，不應讀起來像模型在替候選做品質打分
- 每筆 candidate 可低噪音補一行：
  - `主要原因：...`
  - 但不應展開成原因矩陣或治理表格
- duplicate governance 也應保持低噪音：
  - `確認同一模式`
  - `保留分開`
  - `拆成不同模式`
- 這層是在整理「怎麼參考」，不是在刪 raw precedent rows

### 7.10 `/settings`

主任務：

- 儲存正式偏好與 system-level provider config

Primary action：

- 編輯 / 儲存並套用

---

## 8. Cross-Page Jump Chain

正式主鏈應維持：

1. `/new`
   -> `/matters/[matterId]`
2. `/matters/[matterId]`
   -> `/matters/[matterId]/evidence`
   -> `/tasks/[taskId]`
   -> `/deliverables/[deliverableId]`
3. `/tasks/[taskId]`
   -> `/deliverables/[deliverableId]`
4. `/deliverables/[deliverableId]`
   -> `/matters/[matterId]`
   -> `/matters/[matterId]/evidence`

正式規則：

- 不可只靠瀏覽器返回維持主線
- 關鍵工作面之間必須有明示 workspace jump

---

## 9. Visibility and Disclosure Rules

### 9.1 What may appear on the first screen

首屏可顯示：

- mainline summary
- next-step guidance
- readiness / status
- continuity mode summary
- limited high-impact cues

### 9.2 What should stay in low-noise disclosure

以下只應出現在 disclosure / secondary / advanced sections：

- pack contract metadata
- resolver scores / matched signals
- approval / audit details
- canonicalization review details
- chunk / media locator details
- object-set member metadata
- support-bundle density detail
- benchmark / QA style metadata

### 3.4 Minimal adoption feedback

若產品需要收集「這次輸出是否真的可用」的訊號，正式做法應是輕量 adoption feedback，而不是把工作面做成聊天讚踩。

正式規則：

- feedback 應掛在正式工作物件上，而不是聊天訊息上
- 第一波只應出現在：
  - `deliverable workspace`
  - `recommendation` 相關工作面
- 互動必須輕量、可快速完成，不應打斷主線
- V1 預設應維持 one-click feedback：
  - 第 1 拍：先按 status
  - 第 2 拍：若願意，再補 quick-reply primary reason
  - 第 3 層：若仍需要，再補一句 note
- reason chips 應像 quick reply，而不是表單欄位
- 備註欄位應保持收合，不應擋住主線
- 第一波正式值至少包括：
  - 可直接採用
  - 需改寫後採用
  - 目前不採用
  - 值得當範本
- V1 的 structured reason signal 只應低噪音回答：
  - 為什麼這次可用
  - 為什麼這次還要改
  - 為什麼這次不採用
  - 為什麼值得保留成可重用模式
- 這層的正式責任是收集 explicit human adoption signal，而不是直接等於 precedent selection

### 9.2.1 Precedent candidate reading

當某份 `deliverable` 或某條 `recommendation` 已因 explicit adoption feedback 進入 precedent candidate pool 時，UI 應維持低噪音顯示：

- 已進入可重用候選池
- 為什麼值得重用
- 它是交付物候選，還是建議候選

正式規則：

- `deliverable` 應優先把這層掛在既有 adoption feedback 區塊附近
- `recommendation` 應優先把這層掛在既有建議卡附近
- `matter workspace` 只應提供很輕的 candidate summary，不可做成 precedent dashboard hero
- 這層是在說「這個內容值得被記住」，不是在說「系統已經自動重用它」
- governance action 也應保持低噪音：
  - `candidate` 可升格或先停用
  - `promoted` 可降回候選或停用
  - `dismissed` 可重新列回候選
- 這些 action 只應出現在既有 candidate 區塊附近，不可新增 precedent management page

### 9.2.2 Precedent reference reading

當 Host 已開始安全參考 precedent patterns 時，UI 也應維持低噪音回讀：

- 目前是否找到可參考的既有模式
- 為什麼這些模式和當前案件相似
- 這些模式可以怎麼用
- 這些模式不能怎麼用

正式規則：

- 第一波只應出現在 `task detail` 與 `deliverable workspace` 的 second-layer disclosure
- `matter workspace` 這一輪不應長出 precedent reference hero
- 每次只應顯示少量 matched patterns，不可變成 precedent list shell
- UI 必須清楚標示：
  - 這是「可參考既有模式」
  - 不是「系統已自動套用」
- 若 precedent 已有明確 human reason signal，UI 可低噪音補：
  - `主要原因：...`
  - 讓顧問知道這筆模式為何值得保留
- `recommended_uses` 若因 human reason signal 變得更精準，也應維持：
  - 一兩句可直接讀懂的用法
  - 不要把內部 reason code 或 asset routing 規則直接露在 UI 上
- boundary copy 應明講：
  - 可參考 framing / review lens / deliverable shape
  - 不會直接複製舊案正文
- 若同案 duplicate governance 尚未處理，UI 不需要把這種內部去重邏輯放上首屏，但 history family 應能回看這些 duplicate groups

### 9.2.3 Reusable review-lens reading

當 Host 已開始把 precedent / pack / heuristic signals 收斂成 reusable review lenses 時，UI 也應維持低噪音回讀：

- 這輪先看哪幾點
- 為什麼這幾點要先看
- 這些 lens 主要來自哪類 source
- 這層只是在排 review 順序，不是自動結論

正式規則：

- 第一波只應出現在 `task detail` 與 `deliverable workspace` 的 second-layer disclosure
- 每次只應顯示少量 lens：
  - 2 到 4 個
- `matter workspace`、`overview`、`history` 目前都不應長出 review-lens hero
- UI 必須清楚標示這層是在回答：
  - `這輪先看哪幾點`
- 不可把這層寫成：
  - 風險清單總表
  - 可直接採用的結論
  - 手動維護 checklist 管理頁
- 每個 lens card 第一波應優先顯示：
  - `title`
  - `why_now`
  - `source_label`
- 若要補 list，只應輕量回讀：
  - `先從這幾個角度看`
- boundary copy 應明講：
  - 這是在幫顧問排審閱順序
  - 不是自動結論
  - 若與正式證據衝突，仍以這案的正式證據為準
- 這層不可再把 common risk 的文案偽裝成 review lens；若內容是在提醒「常漏哪些風險」，就應留在 common-risk layer

### 9.2.4 Common-risk-library reading

當 Host 已開始把 precedent-derived risk patterns、pack common risks 與 heuristic signals 收斂成 common risk libraries 時，UI 也應維持低噪音回讀：

- 這類案件常漏哪些風險
- 為什麼這些風險值得先掃一遍
- 這些風險主要來自哪類 source
- 這層只是在提醒不要漏看，不是在判定已經發生

正式規則：

- 第一波只應出現在 `task detail` 與 `deliverable workspace` 的 second-layer disclosure
- 每次只應顯示少量 risk watchouts：
  - 2 到 4 個
- `matter workspace`、`overview`、`history` 目前都不應長出 common-risk hero
- UI 必須清楚標示這層是在回答：
  - `這類案件常漏哪些風險`
- 不可把這層寫成：
  - 正式風險總表
  - risk register
  - escalation dashboard
  - 已發生風險清單
- 每個 risk card 第一波應優先顯示：
  - `title`
  - `why_watch`
  - `source_label`
- 若要補 list，只應輕量回讀：
  - `先掃這些漏看點`
- boundary copy 應明講：
  - 這些是 common risk watchouts
  - 不代表這案已經發生
  - 若要成立正式風險，仍須由這案的證據與分析支撐

### 9.2.5 Deliverable-shape-hint reading

當 Host 已開始把 precedent deliverable pattern、pack deliverable presets 與 heuristic signals 收斂成 deliverable shape hints 時，UI 也應維持低噪音回讀：

- 這份交付物通常怎麼收比較穩
- 建議交付形態是什麼
- 建議先有哪些段落
- 這層只是在提示交付骨架，不是在自動套模板

正式規則：

- 第一波只應出現在 `task detail` 與 `deliverable workspace` 的 second-layer disclosure
- 每次只應顯示：
  - 1 個 primary shape
  - 3 到 5 個 section hints
  - 少量 supporting hints
- `matter workspace`、`overview`、`history` 目前都不應長出 deliverable-shape hero

### 9.2.6 Matter-scoped organization-memory reading

當 Host 已開始把同一案件世界裡的穩定背景收斂成 organization memory 時，UI 也應維持低噪音回讀：

- 這個客戶 / 組織目前已知的穩定背景
- 這案已知的限制
- 這案目前延續哪條主線

正式規則：

- 第一波優先出現在 `matter workspace`
- `task detail` 只做更輕的 second-layer 回讀
- 不新增 organization page family
- 不把這層做成 CRM profile 卡
- 只應露出少量、已站穩、對當前判斷真的有幫助的背景
- UI 必須清楚標示這層是在回答：
  - `這份交付物通常怎麼收比較穩`
- 不可把這層寫成：
  - template chooser
  - deliverable library
  - 已完成內容
  - prior deliverable copy shell
- 第一波應優先顯示：
  - `建議交付形態`
  - `建議交付骨架`
  - `supporting hints`
- supporting hint card 應優先顯示：
  - `title`
  - `why_fit`
  - `source_label`
- boundary copy 應明講：
  - 這是在提示交付骨架
  - 不是自動套模板
  - 若和這案正式證據衝突，仍以這案當前判斷與證據為準
- section hints 若來自 precedent raw sections，也應先收斂成顧問可直接閱讀的段落名與順序，不應把 `問題定義` 之類內部骨架直接放在最前面

### 9.3 Specialized hardening views

以下能力雖已 shipped，但仍應保持低噪音：

- `證據集`
- `風險群組`
- `條款集 / 義務清單`
- `流程問題集`
- pack interface / required-property summary
- provenance / citation detail

它們服務的是顧問理解與回鏈，不是首屏 hero。

---

## 10. Language, Theme, and Interaction Rules

### 10.1 Language

預設可見語言為繁體中文。

正式內容語言也預設為繁體中文。

正式規則：

- model-generated 摘要、風險、建議、行動項目與缺漏資訊，預設應為繁體中文
- 若資料來源本身是英文，可在必要處保留原文片段，但主要說明仍應用繁體中文
- 不應把英文整句直接暴露成預設交付內容，除非任務明確要求英文
- UI 可見語言與內容輸出語言不得各自漂移

主要正式用語包括：

- Agent -> `代理`
- Pack -> `模組包`
- Deliverable -> `交付物`
- Evidence -> `證據`
- History -> `歷史紀錄`
- Matter / Engagement Workspace -> `案件工作台`
- Artifact / Evidence Workspace -> `來源與證據工作面`

### 10.2 Theme

正式規則：

- light mode 與 dark mode 都是正式產品主題
- light mode 先建立穩定閱讀層級
- dark mode 必須保持相同結構與可讀性，不可炫技化

### 10.3 Motion

正式規則：

- subtle, meaningful, removable
- 支援 `prefers-reduced-motion`
- 不以特效取代結構

### 10.4 Accessibility

可近用性屬正式產品品質，而不是 optional polish。

至少必須維持：

- keyboard navigation
- visible focus states
- announced errors
- semantic landmarks
- non-color status signaling
- reduced-motion support

---

## 11. Management Surface Layout Rules

對 `代理管理`、`模組包管理`、`歷史紀錄`、`系統設定`，正式採：

1. 上層總覽
2. 篩選 / 搜尋 / 狀態控制
3. 主列表
4. 編輯 side panel 或次欄

正式規則：

- 列表是主體
- 編輯是次體
- 長說明要壓縮
- 高風險操作與批次操作要明確區隔
- 不可讓清單、表單、說明、系統狀態同時爭奪第一層注意力

---

## 12. Explicit UI Non-Goals

Infinite Pro 的工作台明確不是：

- floating chatbot shell
- metrics-first dashboard
- admin-console clutter
- debug wall
- AI-purple consumer interface
- marketplace shell
- enterprise governance console

---

## 13. Relationship To Other Docs

- `docs/00_product_definition_and_current_state.md`
  承接產品定位、current phase decision 與 current-state judgment
- `docs/01_runtime_architecture_and_data_contracts.md`
  承接 intake / persistence / provenance / provider boundary 的 runtime semantics
- `docs/02_host_agents_packs_and_extension_system.md`
  承接 Host / agents / packs / extension system semantics
- `docs/04_qa_matrix.md`
  承接 UI / workbench shipped verification evidence
- `docs/05_benchmark_and_regression.md`
  承接 regression / benchmark baseline
