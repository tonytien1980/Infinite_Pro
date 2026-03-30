# 15_page_level_ui_inventory_and_flow_rules.md

> 文件狀態：Baseline v1.0（正式頁面級 UI inventory 與 flow rules 文件）
>
> 本文件用於把 **Infinite Pro** 的正式頁面與工作面，整理成可施工、可驗收的頁面級操作規則。若後續頁面重構、第一屏調整、主按鈕設計、資訊收合或頁面間跳轉與本文件衝突，應優先回到本文件檢查並修正。

---

## 1. 文件目的

本文件回答以下問題：

1. 每個正式頁面的 **主任務** 是什麼？
2. 每個頁面的 **第一屏** 應先回答什麼？
3. 哪些資訊應首屏可見，哪些資訊應延後揭露？
4. 每個頁面的 **primary action / secondary actions / tertiary actions** 應如何配置？
5. 各頁之間的正式跳轉應如何形成可理解的工作鏈？

---

## 2. 頁面級欄位定義

以下每頁面都以同一套欄位定義：

- **主任務**
  - 使用者來這頁主要是要做什麼

- **第一屏必答**
  - 第一屏必須先回答的主問題

- **Primary action**
  - 這頁唯一最高優先操作

- **Secondary actions**
  - 與主任務相鄰的次級操作

- **首屏必顯**
  - 第一屏必須可見的資訊

- **延後揭露**
  - 不應預設與主線同層完全攤開的內容

- **正式跳轉**
  - 這頁應如何接回其他正式工作面

---

## 3. 頁面規格

### 3.1 `/` 總覽

**主任務**
- 幫顧問判斷「現在最值得回到哪個工作面」

**第一屏必答**
- 現在最值得先回到案件、交付物，還是待補資料

**Primary action**
- 打開最值得回去的工作面

**Secondary actions**
- 建立新案件
- 打開案件工作台
- 打開交付物頁

**首屏必顯**
- 一個 focus card
- 最近交付物數
- 待補資料數
- 建立新案件入口

**延後揭露**
- 最近活動長列表
- 所有案件列表
- 所有交付物列表
- 所有代理 / 模組包摘要

**正式跳轉**
- `/matters/[matterId]`
- `/deliverables/[deliverableId]`
- `/matters/[matterId]/evidence`
- `/new`

---

### 3.2 `/new` 建立新案件

**主任務**
- 讓顧問用最少阻力完成正式進件

**第一屏必答**
- 建立完成後會去哪裡
- 建立後如何產出結果

**Primary action**
- 建立案件 / 開始正式進件

**Secondary actions**
- 補上可選材料
- 展開進階設定

**首屏必顯**
- canonical intake pipeline 說明
- 系統目前判讀出的 intake pattern
- 單次最多 10 份材料與可分批補件的規則
- 統一材料區（file / URL / pasted text）
- 材料 item-level preview / remove / warning
- item-level handling status（accepted / limited support / pending parse / unsupported / failed ingest）
- item-level remediation guidance：
  - 為什麼是這個狀態
  - 這會影響什麼
  - 下一步最建議怎麼補救
- item-level action semantics：
  - 是否 blocking
  - retry / replace / remove / keep-as-reference 中哪個是現在最合理的動作
- item-level progress semantics：
  - 待送出
  - 處理中 / 解析中
  - 已完成
  - 失敗 / 阻擋送出
- continuity strategy / writeback depth（若已展開進階設定）
- continuity 選擇對後續 workflow 的影響：
  `one_off` 偏正式結案、`follow_up` 偏 checkpoint、`continuous` 偏 progression / outcome
- 建立後流程說明
- 核心輸入欄位

**延後揭露**
- 非必要進階設定
- 長篇格式說明
- 過多技術名詞

**正式跳轉**
- 建立完成後必須回到 `/matters/[matterId]`
- 若有對應 task，應攜帶能對準焦點工作紀錄的上下文

---

### 3.3 `/matters` 案件工作台列表

**主任務**
- 找到要續推的案件

**第一屏必答**
- 有多少案件正在進行
- 哪些案件值得優先回去

**Primary action**
- 打開案件工作面

**Secondary actions**
- 建立新案件
- 搜尋 / 篩選
- 回到交付物或工作紀錄

**首屏必顯**
- 全部案件數
- 進行中數
- 封存數
- 案件列表

**延後揭露**
- 大量長摘要
- 編輯案件欄位
- 全量工作歷史

**正式跳轉**
- `/matters/[matterId]`
- `/deliverables/[deliverableId]`
- `/tasks/[taskId]`
- `/new`

---

### 3.4 `/matters/[matterId]` 案件工作面

**主任務**
- 在同一個案件世界下決定目前主線與下一步

**第一屏必答**
- 我現在在哪個案件世界
- 目前主線是什麼
- 下一步該補件、跑分析，還是看交付物

**Primary action**
- 依案件狀態決定：
  - `one_off`：正式結案 / reopen / 打開最新交付物
  - `follow_up`：補件 / 更新 checkpoint / 打開最新交付物
  - `continuous`：補件 / 記錄 outcome / 打開最新交付物

**continuous 額外首屏必顯**
- latest progression state
- previous progression snapshot
- action / outcome 最重要的變化
- next progression action

**Secondary actions**
- 打開焦點工作紀錄
- 切頁籤到決策問題 / 來源與證據 / 交付物 / 工作紀錄
- 儲存案件資訊

**首屏必顯**
- object path
- 狀態 / 來源 / 證據 / 交付物 / 工作紀錄指標
- 目前主線
- continuity mode / writeback depth 摘要
- 案件推進導引

**延後揭露**
- 正文修訂列表
- 大量工作紀錄細節
- 所有 related items 全量清單
- case world draft 全量欄位
- decision / outcome writeback 記錄

**正式跳轉**
- `/matters/[matterId]/evidence`
- `/tasks/[taskId]`
- `/deliverables/[deliverableId]`

---

### 3.5 `/matters/[matterId]/evidence` 來源與證據工作面

**主任務**
- 判斷目前案件的來源、證據與缺口是否足以支撐主線判斷

**第一屏必答**
- 現在缺的是什麼
- 應該先補什麼
- 補完之後回哪裡

**Primary action**
- 依 continuity mode 決定：
  - `one_off` 且已結案：先 reopen
  - `follow_up`：補件，然後回案件工作面更新 checkpoint
  - `continuous`：補件，然後回案件工作面記錄 progression / outcome

**Secondary actions**
- 打開焦點工作紀錄
- 打開最新交付物
- 返回案件工作面

**首屏必顯**
- 來源材料數
- 證據支撐鏈數
- 高影響缺口數
- research provenance 摘要
- 補件導引
- 若為 `follow_up`，需顯示這次補件主要想更新什麼，以及上一個 / 最新 checkpoint 的輕量脈絡
- 若為 `follow_up`，補件區本身也需顯示 latest update、previous checkpoint、what changed、next follow-up action
- 若為 `continuous`，需顯示這次補件主要想驗證哪個 action / outcome / recommendation，以及最新 progression 的最小脈絡
- 若補件或既有材料屬 limited-support、pending-parse、unsupported 或 failed ingest，卡片與補件區也需顯示目前可用範圍、限制與補救方式
- 若補件 item 為 retryable failure，補件區也需直接提供 retry；若非 retryable，則應偏向 replace / remove / fallback 材料
- 段落導覽

**延後揭露**
- 全量來源清單
- 全量工作物件清單
- 長篇證據鏈細節
- 證據期待、保留邊界、進件規則等 supporting / debug 資訊
- evidence gap records
- research provenance 明細

**正式跳轉**
- `/tasks/[taskId]`
- `/deliverables/[deliverableId]`
- `/matters/[matterId]`

---

### 3.6 `/tasks/[taskId]` 決策工作面

**主任務**
- 推進單筆工作紀錄，讓它形成正式交付物

**第一屏必答**
- 這筆工作現在能不能跑
- 若不能跑，缺什麼
- 若能跑，跑完之後去哪裡

**Primary action**
- 執行分析

**Secondary actions**
- 打開正式交付物
- 打開來源 / 證據工作面
- 回案件工作面

**首屏必顯**
- task 身份與狀態
- 目前工作導引
- case world draft 摘要
- 若為 `continuous`，需顯示這筆工作接在哪個 progression update 後面，以及這輪是在補強、刷新還是應對新 outcome
- 來源厚度 / 結果狀態
- 若為 `follow_up`，需顯示這筆分析接在哪一次 checkpoint 後面，以及這輪是在延續、修正還是補強
- 主按鈕
- 段落導覽

**延後揭露**
- 完整 object navigation strip
- 長篇分析框架
- system trace
- 擴充管理面
- 案件世界連續性與 supporting context
- facts / assumptions / evidence gaps 全量列表
- research provenance 全量列表
- decision / outcome writeback 記錄

**正式跳轉**
- `/deliverables/[deliverableId]`
- `/matters/[matterId]/evidence`
- `/matters/[matterId]`

---

### 3.7 `/deliverables` 交付物列表

**主任務**
- 找到要回看、續修或比較的交付物

**第一屏必答**
- 有多少交付物
- 哪些是待確認、哪些已定稿

**Primary action**
- 打開交付物工作面

**Secondary actions**
- 篩選 / 搜尋 / 排序
- 返回所屬案件

**首屏必顯**
- 全部交付物數
- 待確認數
- 定稿數
- 列表與排序工具

**延後揭露**
- 長篇摘要全文
- 發布與 artifact 細節
- 全部版本事件

**正式跳轉**
- `/deliverables/[deliverableId]`
- `/matters/[matterId]`

---

### 3.8 `/deliverables/[deliverableId]` 交付物工作面

**主任務**
- 閱讀、整理、修訂、發布正式交付物

**第一屏必答**
- 這是什麼版本
- 現在該先整理版本、發布、匯出，還是回看依據鏈

**Primary action**
- 依狀態決定：
  - `one_off`：正式發布 / 匯出 / 正式結案
  - `follow_up`：新增 checkpoint / 回案件工作面續推
  - `continuous`：記錄 outcome / 更新下一步 / 回案件工作面續推

**Secondary actions**
- 整理版本與摘要
- 查看交付摘要
- 回看依據來源
- 返回案件工作面

**首屏必顯**
- deliverable 身份
- 一句話結論
- 版本 / 狀態 / 所屬案件
- 若為 `follow_up`，需顯示這份 deliverable 對應哪個 checkpoint 階段、上一輪是什麼、以及下一步建議回 checkpoint 還是先補件 / 再分析
- 若為 `continuous`，需顯示這份 deliverable 對應哪個 progression state、最近 action / outcome 有何變化，以及下一步建議回案件工作面續推、先補件，還是刷新 deliverable
- continuity mode / writeback depth 摘要
- 導引層
- 段落導覽

**延後揭露**
- 版本管理表單
- 正文修訂
- 版本事件
- artifact records
- publish records
- 相關交付物
- 完整 evidence / ontology 回鏈明細
- decision / outcome writeback 記錄
- research provenance 細節

**交付物管理段落規則**
- 交付物管理不應把唯讀 metadata、版本控制與正文編修塞成同一排密集表單
- 應至少拆成：
  - 版本狀態 / 定位資訊
  - 封面資訊（標題、短摘要、版本標記）
  - 正式內容正文（摘要、建議、風險、行動、依據）
  - 發布與版本動作
- 長文字欄位不可全部做成同尺寸的小格；正文編修應優先保留閱讀與打字空間

**正式跳轉**
- `/matters/[matterId]`
- `/tasks/[taskId]`
- `/matters/[matterId]/evidence`

---

### 3.9 `/agents` 代理管理

**主任務**
- 管理代理目錄與狀態

**第一屏必答**
- 目前有哪些代理
- 哪些啟用中
- 現在要編輯哪一個

**Primary action**
- 新增代理 或 儲存代理

**Secondary actions**
- 搜尋 / 篩選
- 編輯
- 啟用 / 停用

**首屏必顯**
- 全部代理數
- 啟用中數
- Host 數
- 代理列表

**延後揭露**
- 長篇描述
- 細節結構
- 使用紀錄全文

**正式跳轉**
- 無跨頁主線跳轉要求，但應保留與 task-level override 的概念連結

---

### 3.10 `/packs` 模組包管理

**主任務**
- 管理問題面向模組包與產業模組包

**第一屏必答**
- 現在正在看哪一種 pack family
- 哪些可用、哪些啟用中

**Primary action**
- 新增模組包 或 儲存模組包

**Secondary actions**
- tab 切換
- 搜尋 / 篩選
- 編輯
- 啟用 / 停用

**首屏必顯**
- 兩類 pack family 數量
- 啟用中數
- 當前 tab 列表

**延後揭露**
- KPI 細節
- 長篇描述
- 全量 problem pattern 展示

**正式跳轉**
- 無跨頁主線跳轉要求，但應保留與 task-level pack selection 的概念連結

---

### 3.11 `/history` 歷史紀錄

**主任務**
- 回看與整理歷史，不是推進主線

**第一屏必答**
- 有多少可回看紀錄
- 目前篩選條件下剩多少

**Primary action**
- 打開工作紀錄

**Secondary actions**
- 搜尋 / 篩選
- 隱藏單筆
- 清理本頁
- 打開案件工作面

**首屏必顯**
- 可回看數
- 已隱藏數
- 案件數
- 篩選工具

**延後揭露**
- 批次操作說明
- 長篇描述
- 全量明細預設展開

**正式跳轉**
- `/tasks/[taskId]`
- `/matters/[matterId]`

---

### 3.12 `/settings` 系統設定

**主任務**
- 儲存正式偏好與系統級模型設定

**第一屏必答**
- 目前生效設定是什麼
- 來源是 runtime config 還是 env baseline
- 接下來應該編輯哪一段

**Primary action**
- 依區塊決定：
  - 編輯設定
  - 儲存並套用
  - 儲存正式 provider 設定

**Secondary actions**
- 測試連線
- 回復 env 預設值
- 回復偏好預設

**首屏必顯**
- 模型與服務設定摘要
- 介面偏好
- 建立新案件預設
- 套用區塊

**延後揭露**
- 進階 provider 欄位
- 驗證細節
- 長說明文

**正式跳轉**
- 無跨頁主線跳轉要求，但調整後應自然影響首頁、列表頁與新案件頁

---

## 4. 跨頁正式跳轉規則

Infinite Pro 應正式維持以下主鏈：

1. `/new`
   → `/matters/[matterId]`

2. `/matters/[matterId]`
   → `/matters/[matterId]/evidence`
   → `/tasks/[taskId]`
   → `/deliverables/[deliverableId]`

3. `/tasks/[taskId]`
   → `/deliverables/[deliverableId]`

4. `/deliverables/[deliverableId]`
   → `/matters/[matterId]`
   → `/matters/[matterId]/evidence`

正式規則：
- 不可只靠返回上一頁維持主線
- 必須有明示的 workspace jump
- 重要工作面之間的跳轉應可預期、可回跳

---

## 5. 頁面級驗收問題

每次頁面施工至少應回答：

1. 這頁的主任務是否清楚？
2. 第一屏是否清楚回答這頁最重要的主問題？
3. 是否只有一個 primary action？
4. 是否把深層資訊正確延後揭露？
5. 是否與相鄰工作面形成清楚跳轉？
6. 是否保留了正式 object chain / evidence chain / deliverable chain 的完整回看能力？

---

## 6. 與其他正式文件的關係

- 高層頁面角色與導覽原則：`docs/10_frontend_information_architecture_and_ux_principles.md`
- 跨頁操作原則與資訊密度治理：`docs/14_workbench_ui_ux_operating_principles.md`
- intake / storage / retention 邊界：`docs/11_intake_storage_architecture.md`
- persistence / revision / publish / fallback 邊界：`docs/12_runtime_persistence_and_release_integrity.md`
- settings provider / credential 邊界：`docs/13_system_provider_settings_and_credentials.md`
