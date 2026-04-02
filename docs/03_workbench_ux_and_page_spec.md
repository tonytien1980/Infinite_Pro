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

### 2.2 Anti-direction

Infinite Pro 不應往下列方向偏移：

- playful / whimsical / trend-chasing UI
- floating chatbot shells
- AI-purple gradients
- glass-heavy neon dark interfaces
- metrics-first dashboards that bury the work
- admin-console clutter pretending to be a workbench

---

## 3. Global Workbench Rules

### 3.1 One page, one primary action

每頁同一時間只能有一個 primary action。

### 3.2 First screen answers three questions

每頁第一屏必須先回答：

1. 我現在在哪裡
2. 這裡最重要的是什麼
3. 我現在應該做什麼

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

### 7.4 `/matters/[matterId]/evidence`

主任務：

- 判斷來源、證據與缺口是否足以支撐主線

第一屏必答：

- 現在缺的是什麼
- 應先補什麼
- 補完之後回哪裡

Primary action：

- 依 continuity mode 做補件 / reopen / progression-linked supplement

### 7.5 `/tasks/[taskId]`

主任務：

- 推進單筆工作紀錄，形成正式交付物

第一屏必答：

- 這筆工作能不能跑
- 若不能跑，缺什麼
- 若能跑，跑完去哪裡

Primary action：

- 執行分析

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

Primary action：

- 打開工作紀錄

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
