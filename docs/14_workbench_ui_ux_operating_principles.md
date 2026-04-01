# 14_workbench_ui_ux_operating_principles.md

> 文件狀態：Baseline v1.0（正式 workbench UI/UX 操作原則文件）
>
> 本文件用於正式定義 **Infinite Pro** 在 single-user first 前提下，如何在 `操作邏輯性`、`人類使用便利性` 與 `資訊完整度` 之間取得平衡。若後續前端施工、detail workspace 重構、跨頁操作導引或資訊密度決策與本文件衝突，應優先回到本文件檢查並修正。

---

## 1. 文件目的

本文件不再處理「頁面要有哪些正式角色」這種資訊架構層級問題；那一層已由 `docs/10_frontend_information_architecture_and_ux_principles.md` 正式承接。

本文件現在要回答的是：

1. **什麼叫做對顧問友善、但不犧牲資訊完整度的 workbench UI/UX？**
2. **一個頁面該如何安排主操作、次操作與深層資訊，而不是全部同時競爭？**
3. **哪些資訊應首屏可見、哪些資訊應延後揭露、哪些資訊應跨頁承接？**
4. **如何避免 Infinite Pro 退化成「資訊很多但不好操作」或「很乾淨但缺少顧問完整度」？**

---

## 2. 與既有正式文件的關係

### 2.1 與 `docs/10_frontend_information_architecture_and_ux_principles.md` 的關係
- `docs/10` 定義的是：
  - 首頁 / 導覽 / 頁面角色
  - 正式工作面分工
  - 中文化規則
  - 高層 UX 驗收原則
- 本文件定義的是：
  - 每個工作面內部如何排主次
  - 如何安排主按鈕、導引層與深層資訊
  - 如何處理資訊密度、重複摘要與漸進揭露

### 2.2 與 `docs/15_page_level_ui_inventory_and_flow_rules.md` 的關係
- 本文件定義的是跨頁共通原則
- `docs/15` 則把這些原則落到具體頁面與工作流

---

## 3. 正式核心原則

Infinite Pro 的 workbench UI/UX 應遵守以下正式原則：

1. **完整資訊不等於首屏全攤開**
2. **每頁只能有一個 primary action**
3. **每頁第一屏只能回答一個主問題**
4. **重複摘要比資訊不足更容易破壞可用性**
5. **深層資訊應可達、可追、可展開，但不應與主線同層競爭**
6. **使用者應永遠知道：現在在哪裡、系統知道什麼、下一步是什麼**
7. **資訊完整度要保留，但必須透過工作面分層與漸進揭露達成**
8. **顧問日常使用應是結論優先，debug / trace 按需展開**

---

## 4. 「資訊完整度」的正式定義

Infinite Pro 的 UI 不得把「資訊完整度」誤解為：
- 把所有資訊放在第一屏
- 讓每個區塊都像摘要總結
- 同一個判斷在多個區塊重複呈現
- 為了避免遺漏而讓每塊資訊都升到第一層

正式的資訊完整度應改為：

1. **可達**
   - 關鍵資訊必須可以在 1 到 2 次操作內到達

2. **可追**
   - 使用者能回看這個結論來自哪個案件、哪份來源、哪條證據鏈

3. **可展開**
   - 深層內容可透過 tab、section、workspace jump、disclosure 進一步查看

4. **可分層**
   - 首屏看決策與下一步
   - 中層看工作摘要與支撐
   - 深層看原文、修訂、事件、artifact 或 system trace

正式規則：
- **第一層** 承接決策與操作
- **第二層** 承接理解與判斷支撐
- **第三層** 承接回看、稽核與細節驗證

### 4.1 Consultant-first / Debug-on-demand

Infinite Pro 是顧問工作台，不是系統內部模型瀏覽器。

正式規則：
- 顧問日常使用預設只看：目前判斷、結論可信度、下一步
- evidence chain
- agent / pack routing
- revision / publish / artifact record
- raw trace / 大量 supporting context
- case world draft 全量欄位
- research provenance 全量明細
- decision / outcome records 全量列表
- approval status / audit trail 全量紀錄

這些都應屬於 `debug / trace / audit` 層，而不是主工作面首屏。

若使用者只有在「覺得結論怪怪的」時才需要打開某區塊，則該區塊預設就不應展開。
同理，Wave 1 引入的 approval / audit 語義只能作為低噪音 secondary / disclosure surface，不可升成新的首屏主線。
同理，Wave 2 的 canonicalization review 只能在真的出現 duplicate candidate、且需要人工確認時，以低噪音 disclosure surface 出現；UI 應優先使用「需確認是否同一份材料」之類的顧問語言，而不是把 `canonicalization` / `merge-split` 直接當作首屏主語言。
同理，Wave 3 的 chunk / media provenance 只能在 evidence / citation / continuity 類 disclosure 中按需展開；UI 應優先使用「引用來源片段」「依據來源」「支撐片段」之類的顧問語言，而不是把 `ChunkObject / MediaReference / retrieval provenance` 直接推上首屏。
同理，Wave 4 的 interface / required properties / pack-to-contract binding 也只能在 task detail 的治理 disclosure、Extension Manager、pack detail 或 deliverable 背景摘要中低噪音呈現；UI 應優先使用「模組合約摘要」「必要欄位是否補齊」「交付傾向」之類的顧問語言，而不是把 schema / contract metadata 直接灌進主工作面首屏。
同理，Wave 5 的 object-set views 也只能在既有工作面的進階 section / disclosure 中按需展開；UI 應優先使用「證據集」「風險群組」「已選入這次交付支撐集」「已納入這次分析範圍」之類的顧問語言，而不是把 `ObjectSet / membership / creation mode` 直接推上首屏。
同理，P0-A 的 domain-pack hardening 細節也只能在 `/packs`、task detail 的模組合約摘要，或 matter / deliverable 的低噪音背景摘要中呈現；UI 應優先使用「關鍵訊號」「階段啟發」「常見風險」「判斷情境」之類的顧問語言，而不是把 required-property ids 與 resolver internals 直接灌進首屏。

---

## 5. 主操作層級原則

### 5.1 每頁只能有一個 primary action

同一頁面在同一時間只能有一個使用者最應該做的操作。

這個 primary action 可以是：
- 建立新案件
- 執行分析
- 正式發布
- 補件
- 儲存設定

但不能同時有多個看起來同等重要的主按鈕。

### 5.2 Secondary / Tertiary actions 必須降階

正式規則：
- `primary`：唯一高對比按鈕
- `secondary`：同層輔助操作
- `tertiary`：文字連結、段落內跳轉、次層入口

若使用者第一眼無法判斷「現在最該按哪一個」，則屬違反正式原則。

---

## 6. 第一屏原則

每個正式頁面的第一屏必須回答以下三件事：

1. **我現在在哪裡？**
   - 例如：案件工作台 / 交付物工作面 / 來源與證據工作面

2. **這個頁面現在最重要的是什麼？**
   - 例如：目前主線、最新交付物、待補資料、高影響缺口

3. **我現在應該做什麼？**
   - 例如：先補件、執行分析、打開交付物、回工作紀錄

第一屏不應同時承擔：
- 頁面簡介
- 工作摘要
- 全部 metadata
- 全部風險
- 全部歷史
- 全部行動項目

---

## 7. 重複內容治理原則

### 7.1 同一層不得重複摘要

若同一個判斷已在 hero 區塊出現，就不應在右側欄與下方摘要區再次以同樣的層級重複一次。

### 7.2 重複允許的唯一情況

以下情況允許重複，但責任必須不同：
- hero 顯示一句話主線
- detail 區塊顯示完整解釋
- evidence / deliverable / history workspace 顯示回鏈版本

也就是：
- **同內容不同責任** 可以
- **同內容同責任** 不可以

---

## 8. 漸進揭露原則

Infinite Pro 應正式使用以下漸進揭露方式：

1. **頁面層級揭露**
   - 先分頁面，不要所有工作都塞進同一頁

2. **工作面層級揭露**
   - 先進案件，再進證據，再進交付物

3. **section 層級揭露**
   - 先看摘要，再看正文、修訂、事件、trace

4. **inline disclosure**
   - 對長列表、長文字、細節結構做展開

5. **section navigator**
   - 在 detail workspace 第一屏提供 3 到 5 個段落入口
   - 讓使用者先選閱讀路徑，而不是被迫整頁往下刷

正式規則：
- 正文全文
- revision history
- artifact records
- publish records
- large evidence lists
- system trace

這些都不應預設與主操作同層完全展開。

正式規則：
- 若某個工作面存在 4 個以上主要 section，應在第一屏提供「段落導覽」或等價的 section navigator
- section navigator 應只承接：
  - section 名稱
  - 這一段的責任
  - 何時需要往下讀
- section navigator 不應變成第二套摘要總覽

---

## 9. Detail Workspace 正式排版原則

對 `案件工作台`、`決策工作面`、`來源與證據工作面`、`交付物工作面`，正式採以下閱讀順序：

1. **定位**
   - 我在哪個 object / matter / deliverable 上

2. **主線**
   - 現在最重要的判斷 / 結論 / 缺口

3. **主任務**
   - 現在最值得做的操作

4. **工作摘要**
   - 支撐這個操作的最小必要資訊

5. **深層內容**
   - 正文、證據鏈、修訂、版本事件、artifact、trace
   - case world draft 全量欄位
   - research provenance
   - decision / action / outcome writeback 記錄

### 9.1 第一屏之後的段落導引

對長頁 detail workspace，第一屏導引層之後應立即提供段落導覽，至少幫助使用者判斷：
- 先看判斷本身
- 先看能不能執行 / 發布
- 先看依據鏈
- 先看歷史 / 修訂 / trace

這一層的目的是減少長頁迷路，不是再重講一次 hero 內容。

### 9.2 右側欄責任

右側欄只應承接：
- metrics
- readiness / status
- 主操作導引
- 少量高影響提示

右側欄不應承接：
- 與主內容同等長度的第二條內容流
- 完整摘要重述
- 長段落論述
- 全量事件與版本歷史
- 全量 case world draft
- 全量 decision / outcome writeback 記錄

### 9.4 新增可見規則：canonical intake / continuity / writeback

正式規則：
- `/new` 第一屏應明確說明「現在只有一個 unified intake surface，背後仍是同一條 canonical intake pipeline」
- `/new` 的統一材料區應提供 item-level preview / remove / warning，且每份材料都要在 item 上看得出支援層級、影響與補救方式
- 若這輪已打開 per-item retry / upload progress，則 `/new` 與補件區的 item row 還應直接看得出：
  - 現在是否 blocking
  - 目前進度是在待送出、處理中、待解析、已完成，還是失敗
  - 現在最適合的動作是 retry、replace、remove，還是 keep-as-reference
- 若再往前補 richer upload progress / retry history，則第一層還應補一個輕量整批視角：
  - 這輪總共有幾份
  - 幾份已完成
  - 幾份仍待解析
  - 幾份失敗 / blocking
  - 最近一次處理過什麼
- 若再往前補 deeper ingest diagnostics，則第一層還應讓顧問快速看懂：
  - 這是哪一類問題
  - 目前可用範圍到哪裡
  - retry 是否值得
  - 若不值得，應偏 replace、remove 還是 fallback 材料
- `Task detail` 應可見最小 `case world draft` 摘要，但全量 facts / assumptions / evidence gaps 應預設收合
- `Matter workspace` 應可見 `engagement_continuity_mode / writeback_depth`，且第一屏 primary action 應隨模式分流：
  `one_off` 偏 closure、`follow_up` 偏 checkpoint、`continuous` 偏 progression / outcome
- `follow_up` 的第一屏應先回答「上次到哪裡、這次改什麼、下一步是什麼」，而不是直接鋪滿所有 checkpoint records
- `continuous` 的第一屏應先回答「目前 progression 到哪裡、action / outcome 狀態如何、下一步是什麼」，而不是把所有 records 直接鋪成 timeline
- `Artifact / Evidence workspace` 應可見 research provenance 與 evidence gaps，但不應退回 debug dashboard
- `Artifact / Evidence workspace` 在 `follow_up` 模式下應明確提示這次補件主要想更新哪一類 recommendation / risk / next step，而不是只顯示 generic 上傳動作
- `Artifact / Evidence workspace` 的補件區也應顯示 latest update、previous checkpoint、what changed 與 next follow-up action，但仍維持輕量 lane
- `Artifact / Evidence workspace` 在 `continuous` 模式下應明確提示這次補件主要想驗證哪個 action / outcome / recommendation，並顯示最新 progression 的最小脈絡
- `Artifact / Evidence workspace` 與 `Matter workspace` 的來源 / 材料卡若遇到 limited-support、pending-parse、unsupported 或 failed ingest，第一層就應先回答：
  - 這份材料現在可不可直接用
  - 問題是哪一類
  - 限制是什麼
  - 目前還能不能保留成 reference-level
  - 我現在怎麼補救
- 若這輪不直接在卡片上做真正的 reprocess / delete，卡片也至少要清楚指向補件入口，而不是只顯示 static limitation note
- `Deliverable workspace` 應可見這份交付物如何被寫回案件世界，以及它目前更接近 closure、checkpoint 或 progression，但 writeback 細節應維持按需展開
- `Deliverable workspace` 在 `follow_up` 模式下應可看出最新 checkpoint、上一輪 checkpoint 與這輪最重要的 continuity 變化，但不應退成 timeline dashboard
- `Deliverable workspace` 在 `continuous` 模式下應可看出最新 progression、action / outcome 變化與下一步是否該回案件工作面續推或刷新 deliverable

### 9.3 長列表與歷史區塊規則

以下內容預設應採收合或 disclosure panel，而非與主線同層完全展開：
- 全量來源材料列表
- 全量工作物件列表
- 長篇證據支撐鏈
- 正文修訂歷史
- 版本事件 / publish record / artifact registry
- extension manager 細節管理面
- 完整 object navigation strip

若這些區塊需要預設展開，必須有明確理由說明它們已成為該頁 primary reading path 的一部分。

### 9.4 長標題規則

長標題可保留完整語義，但不應在第一屏吃掉過多垂直空間。

正式規則：
- detail workspace 的長標題應限制視覺高度
- 必要時保留完整標題於次層 metadata 或 breadcrumb
- 不可因標題過長而把 primary action 推到首屏外

---

## 10. 管理頁正式原則

對 `代理管理`、`模組包管理`、`歷史紀錄`、`系統設定`，應採：

1. 上層總覽
2. 篩選 / 搜尋 / 狀態控制
3. 主列表
4. 編輯 / 設定 side panel 或次欄

管理頁不應讓：
- 清單
- 編輯表單
- 使用說明
- 系統狀態

四者同時爭奪第一層注意力。

補充：
- 對代理相關工作面，catalog agent 名稱應優先作為第一層語言
- runtime binding 應保留可見，但宜落在次層說明 / disclosure / metadata，而不是取代第一層 agent identity

正式規則：
- 列表是主體
- 編輯是次體
- 長說明要壓縮
- 批次操作與高風險操作要明確區隔

---

## 11. 反模式清單

以下都屬正式反模式：

1. **摘要三連發**
   - hero、rail、main content 都在重複同一段 summary

2. **多主按鈕並列**
   - 使用者無法判斷哪個最重要

3. **所有資訊都像一級重要**
   - 卡片化過度、權重不足

4. **資訊很完整，但使用者不知道現在怎麼推進**

5. **為了簡潔而切掉回鏈、限制、證據、歷史**

6. **為了完整而讓第一屏失去主焦點**

---

## 12. 正式驗收問題

之後每次 UI/UX 改版至少要回答：

1. 第一屏有沒有清楚回答「我在哪裡 / 最重要的是什麼 / 下一步做什麼」？
2. 這頁是不是只有一個 primary action？
3. 有沒有相同責任的重複摘要？
4. 深層資訊是否可達但不擠到第一層？
5. 使用者能不能不靠猜測就理解操作順序？
6. 資訊完整度是否仍保留 object chain、evidence chain、deliverable chain 的正式回看能力？

---

## 13. 與後續施工的關係

後續若重構以下頁面，應同步參考本文件：
- `/`
- `/new`
- `/matters`
- `/matters/[matterId]`
- `/matters/[matterId]/evidence`
- `/tasks/[taskId]`
- `/deliverables`
- `/deliverables/[deliverableId]`
- `/agents`
- `/packs`
- `/history`
- `/settings`

具體頁面級責任、第一屏內容與操作順序，正式由 `docs/15_page_level_ui_inventory_and_flow_rules.md` 承接。
