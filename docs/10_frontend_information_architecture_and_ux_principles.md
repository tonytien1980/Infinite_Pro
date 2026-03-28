# 10_frontend_information_architecture_and_ux_principles.md

> 文件狀態：Baseline v1.0（正式前端資訊架構與 UX 治理文件）
>
> 本文件用於正式定義 **Infinite Pro** 在 single-user first 前提下的前端資訊架構、頁面角色、工作面分工、中文化規則與驗收原則。若後續前端改版、頁面重組或 UX 決策與本文件衝突，應優先回到本文件檢查並修正。

---

## 1. 文件目的

這份文件要解決的不是單一頁面的美化問題，而是 **Infinite Pro 作為正式產品介面應如何被組織與驗收**。

它的正式目的包括：
- 把 Infinite Pro 從功能逐步堆疊的工作台，整理成可長期使用的正式產品介面
- 把一般 UI polish 與產品級介面架構重整區分開來
- 提供後續 Codex 進行前端施工、重整、驗收時的正式依據
- 讓首頁、導航、工作面、管理面與交付物視角有一致的資訊階層與工作流順序

這份文件不處理：
- 多人權限治理細節
- 視覺品牌風格指南
- marketplace 或 enterprise admin console 設計

---

## 2. 正式前提

Infinite Pro 的前端 / UI / UX 應建立在以下正式前提上：

1. **單人優先，但多人相容**
   - 目前採 `single-user first`
   - 但資訊架構、物件模型、導航、頁面分工必須能自然擴展到登入、成員、權限與協作

2. **現階段不先做完整多人 SaaS**
   - 這一輪不以多人工作台、權限設計或 tenant console 為主體
   - 但也不能把頁面做成無法自然延伸到多使用者的死路

3. **重點是產品級使用體驗，不是花俏視覺**
   - 這一輪優先處理：
     - 產品級使用體驗
     - 資訊階層
     - 工作流順序
     - 高頻使用效率
   - 而不是先追求動畫、特效或 dashboard 感

4. **consulting workbench UI 屬於正式主架構**
   - UI 不是包裝層，而是六層正式架構中的 `Workbench / UI Layer`
   - 它必須承接 ontology objects、Host orchestration 結果、Pack / Agent context 與 deliverables

5. **介面與預設輸出語言以繁體中文為準**
   - 所有主頁名稱、卡片標題、欄位、狀態、按鈕、說明文、空狀態與錯誤訊息，都應以繁體中文為預設

---

## 3. 首頁 / 導覽 / 頁面角色的正式原則

Infinite Pro 的前端不應以表單流程或聊天殼層為核心，而應以正式頁面與正式工作面為核心。

正式原則如下：

1. **首頁必須是總覽，不是輸入表單頁**
   - 首頁應回答：
     - 今天有哪些工作
     - 哪些案件正在進行
     - 最近有哪些交付物
     - 哪些資料與證據仍待補
   - 首頁不應被建立新任務的表單佔滿

2. **建立新案件 / 新任務應是獨立入口或獨立工作頁**
   - 可以在首頁保留快速開始入口
   - 但不得讓輸入表單取代首頁主體
   - `/new` 應正式承接一條 canonical intake pipeline
   - UI 上可保留三種 entry presets：
     - 一句話問題
     - 單文件進件
     - 多材料案件
   - 這三種入口都必須匯進同一個案件主鏈，而不是三套互不相容的 wizard

3. **歷史紀錄不應全站側邊常駐**
   - 歷史紀錄應是正式頁面
   - 在其他頁面中只保留最小 recent slice 與「查看全部」

4. **主導覽應以正式頁面為核心**
   - 不應以聊天殼層、wizard 流程或單一 task form 當作網站骨架
   - 頁面角色應對應真實顧問工作：
     - 看總覽
     - 看案件
     - 看交付物
     - 管理代理
     - 管理模組包
     - 回看歷史
     - 調整系統設定

5. **Infinite Pro 的 UI 應更像 consulting workbench**
   - 它不是 generic AI workspace
   - 不是 prompt 包裝工具
   - 不是 admin-first 平台
   - 也不是 generic AI platform dashboard

---

## 4. 正式第一層主導覽

Infinite Pro 的正式第一層主導覽應為：

1. **總覽**
   - 單人顧問的今日工作總覽頁
   - 承接 active work、recent deliverables、待補資料、最近活動與快速開始入口
   - 它不是案件頁、不是歷史頁、也不是輸入表單頁

2. **案件工作台**
   - 顧問操作案件世界的正式主工作面
   - 承接 `Client / Engagement / Workstream / DecisionContext`
   - 它不是 task list 的包裝，而是案件脈絡、相關工作、來源、交付物與工作紀錄的主體

3. **交付物**
   - 正式交付物頁與交付物回看入口
   - 承接 deliverable identity、summary、judgment、recommendation、risk、action、evidence basis、limitations 與版本紀錄
   - 它不是單次 task 的結果區替身

4. **代理管理**
   - 正式管理頁
   - 用來查看、理解與控制 agents catalog、status、version、selected agents 與 task-level override
   - 它不是附屬小功能，也不是 debug panel

5. **模組包管理**
   - 正式管理頁
   - 用來查看與管理 Pack catalog、status、version、selected packs 與 task-level override
   - 它應分為兩個頁籤：
     - 問題面向模組包
     - 產業模組包

6. **歷史紀錄**
   - 正式回看頁
   - 用來查看過去 tasks、deliverables、recent activity 與工作脈絡
   - 它不應全站固定霸佔側欄

7. **系統設定**
   - 正式設定頁
   - 單人版主要承接個人設定、預設偏好、模型與系統層設定
   - `模型與服務設定` 應作為正式區塊存在，承接單一 active provider config，而不是把 credential 分散在開發說明或 `.env` 提示裡
   - provider、模型層級、實際 model id、base URL 與 timeout 應由 backend preset 自動帶入合理預設，不應讓使用者從空白開始猜
   - 它不是 enterprise admin console
   - provider / credential / runtime precedence 的正式 backend 邊界應回到 `docs/13_system_provider_settings_and_credentials.md`

---

## 5. 主要工作面的正式分工

### A0. 建立新案件 / 正式進件頁

`/new` 應是正式進件頁，而不是暫時性的表單殼層。

它至少應承接：
- 一條 canonical intake pipeline
- 一句話問題入口
- 單文件進件入口
- 多材料案件入口
- 對正式支援 / 有限支援格式的清楚提示
- 建立後直接回到案件工作台，而不是停在孤立 task 頁

正式規則：
- 三種入口共用同一條 task / matter / source material / evidence / deliverable 主鏈
- intake 第一站應先進入 `Case World Compiler`
- 單文件入口建立時不應混成多材料入口
- 多材料入口應清楚允許混合檔案、URL 與補充文字
- `.md / .txt / .docx / .xlsx / .csv / text-first PDF / URL / 純文字補充` 應在 UI 上明確標示為正式支援
- `.jpg / .jpeg / .png / .webp / 掃描型 PDF` 應在 UI 上明確標示為有限支援，意思是 metadata / reference-level ingestion，不預設 OCR
- 正式支援、有限支援與未支援應在 UI 上明確分層，不可寫得像所有格式都同等成熟

### A. 總覽

總覽頁應正式承接：
- 今日工作總覽
- 進行中案件
- 最近交付物
- 待補資料 / 待補證據
- 最近活動
- 常用代理 / 模組包
- 快速開始入口

正式原則：
- 快速開始只能是入口，不得取代總覽主體
- 首頁第一屏必須先回答「現在最值得先看哪裡」

### B. 案件工作台

案件工作台應是頁籤式正式工作面，至少包含：
- `案件概覽`
- `決策問題`
- `來源與證據`
- `交付物`
- `工作紀錄`

正式責任：
- 承接 `Client / Engagement / Workstream / DecisionContext`
- 承接 related tasks、related deliverables、related artifacts / source materials 的最小連續性
- 讓顧問感受到自己是在操作案件世界，而不是一堆彼此孤立的 task detail
- 在 `來源與證據` 頁籤中，至少要看見材料數量、補件入口，以及少量最近材料與其格式 / retention 狀態
- matter degraded mode 若發生，必須有清楚的 `待同步 / 同步中 / 同步失敗 / 需要人工確認` 狀態提示
- matter 正文的 revision 歷史與 rollback 入口，應位於案件 detail workspace 內，而不是藏在 debug metadata

### C. 交付物

交付物必須是獨立正式頁，不再只是 task detail 的結果區。

至少應承接：
- 交付物主卡
- 摘要
- 建議與風險
- 行動項目
- 依據來源
- 版本紀錄

正式責任：
- 呈現 deliverable class、適用範圍、限制與可信度
- 呈現對 matter、decision context、evidence、recommendation、risk、action 的正式回鏈
- 清楚區分正文 revision、version event、publish record 與 artifact record
- 正式匯出 / 發布按鈕若失敗，必須明確報錯；不可做成本機假成功

### D. 代理管理

代理管理應是 workbench 內的正式管理頁，而不是附屬小功能。

至少應承接：
- available agents
- selected agents
- version / status
- spec 摘要
- task-level override 與相關說明

### E. 模組包管理

模組包管理應是獨立正式管理頁，並至少包含兩個頁籤：
- `問題面向模組包`
- `產業模組包`

至少應承接：
- available packs
- selected packs
- version / status
- spec 摘要
- task-level override 與相關說明

### F. 歷史紀錄

歷史紀錄應是正式頁面，不再全站側邊常駐。

正式規則：
- 在案件頁與交付物頁只保留：
  - 最近 3 筆
  - 查看全部
- 歷史頁的責任是回看與比較，不是取代首頁或案件工作台

### G. 來源與證據工作面

來源與證據工作面除了回看 evidence chain，也應承接：
- 同一案件的正式補件入口
- 多材料清單
- source material 的格式、大小、支援層級、保留期限與 purge 狀態

正式規則：
- 不可再把補件做成只存在 task detail 的孤立上傳器
- 不可讓 raw material 是否即將過期、是否只有 metadata-only 變成隱藏狀態

---

## 6. 視覺與互動原則

前端實作應遵守以下正式規則：

1. **卡片 + 頁籤式結構優先**
   - 讓主要工作面有穩定資訊容器與清楚分工

2. **每個頁面第一屏只能有一個主焦點**
   - 不能讓首頁、案件頁、交付物頁第一屏同時競爭多條主線

3. **不要一頁到底的超長表單**
   - 輸入表單應有獨立工作頁或獨立入口
   - 不應把首頁或主工作頁變成一條超長輸入流

4. **輸入、查看、管理、回看要分開**
   - 建立任務不是總覽
   - 查看交付物不是管理 packs / agents
   - 回看歷史不是案件工作台

5. **system trace 應存在，但不能搶主閱讀層級**
   - trace 是正式存在的 supporting surface
   - 但不應與主 judgment / evidence / deliverable 爭奪第一層注意力

6. **輔助說明不要形成第二條主內容流**
   - 提示、補充說明與治理 notes 應支援主內容，不可反客為主

7. **degraded mode 與正式成功必須可被區分**
   - 若內容只是本機 fallback、待同步或需要人工確認，不可用看起來像正式保存成功的文案
   - 對 fail-closed 的正式發布 / 匯出 / 交付物正文操作，錯誤提示應比漂亮文案更重要

7. **介面應偏正式產品感**
   - 不應呈現聊天工具拼裝感
   - 不應呈現 generic dashboard 感

8. **先重結構與可用性，再談視覺 polish 與動畫**
   - 視覺 refinement 應建立在正確的資訊架構與工作流之上

---

## 7. 中文化正式規則

Infinite Pro 在單人版範圍內，所有可見介面與預設輸出語言都應以繁體中文為正式預設。

以下項目都應全面繁體中文：
- 主頁名稱
- 卡片標題
- 按鈕文字
- 狀態名稱
- 欄位標籤
- 頁籤名稱
- 說明文
- 空狀態提示
- 錯誤訊息
- 管理頁名稱

正式術語對照如下：
- Agent → `代理`
- Pack → `模組包`
- Workspace → `工作台 / 工作面`
- Deliverable → `交付物`
- Evidence → `證據`
- History → `歷史紀錄`
- Settings → `系統設定`
- Matter / Engagement Workspace → `案件工作台`
- Artifact / Evidence Workspace → `來源與證據工作面`
- Extension Manager → `擴充管理面`

若技術欄位或 API id 仍需保留英文，應限制在內部資料層，不應直接成為主要使用者可見文案。

---

## 8. 本輪不做的事

本文件所對應的前端改版，不應提前擴張到以下範圍：
- 完整多人登入 / 權限 / 協作系統
- enterprise admin / tenant governance console
- 過度花俏的動畫
- marketplace 介面
- 炫技型 dashboard
- 大規模視覺風格翻新
- 與正式工作流無關的高級互動效果

---

## 9. 驗收原則

後續 Codex 進行前端施工時，至少應用以下問題驗收：

1. 首頁是否已從表單頁轉成總覽頁？
2. 建立新案件 / 新任務是否已成為獨立入口或獨立工作頁？
3. 歷史紀錄是否已從側邊抽離為正式頁？
4. 案件 / 交付物 / 代理 / 模組包是否都成為正式頁面？
5. 案件工作台是否已能承接 `Client / Engagement / Workstream / DecisionContext` 的案件世界？
6. 交付物是否已不再只是 task detail 的結果區，而是正式工作面？
7. 來源與證據是否已不再只是 supporting context，而是正式工作面？
8. UI 是否更像 consulting workbench，而不是 generic AI workspace？
9. 使用者可見文字是否已全面繁體中文？
10. 單人高頻使用效率是否提升？
11. system trace 是否存在但未搶走主閱讀層級？
12. 頁面結構是否可自然延伸至未來多使用者情境？

---

## 10. 文件結論

> **Infinite Pro 的前端改版不應理解為一般 UI polish，而應理解為 single-user first、multi-user compatible 的 consulting workbench 介面架構完成。**
