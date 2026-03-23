# 01_problem_statement.md

> 文件狀態：Baseline v2.0（正式問題定義文件）
>
> 本文件用於說明 **Infinite Pro** 為什麼必須作為單人顧問完整工作台而存在，以及它要解決的是哪一類跨場景、跨資料來源、跨交付物的核心問題。

---

## 1. 文件目的

本文件要回答的是：

1. **為什麼顧問需要一套完整工作底座，而不是更多零散工具？**
2. **為什麼 Infinite Pro 不能只被規劃成縮小版驗證工具？**
3. **單一顧問的完整工作需求到底包含哪些層次？**
4. **為什麼 ontology、Host、multiple agents、Pack Layer、consulting workbench 必須從一開始就在正式架構內？**

---

## 2. 核心問題總述

Infinite Pro 要解決的，不是單一流程慢、單一文件難讀、或單一分析不夠快的局部問題。

它要解決的是：

> **單一顧問在真實工作中，必須長期面對跨客戶、跨階段、跨面向、跨資料來源、跨交付物的高密度知識工作，但現有工具大多只能處理其中一小段，無法形成完整、可治理、可累積、可交付的工作系統。**

也就是說，問題不是：
- 有沒有一個更會回答問題的 AI

而是：
- 有沒有一套系統能承接顧問的完整工作世界
- 能不能把原本分散在腦中、文件中、會議中、工具中的工作物件與關係整理進同一個 shared world model
- 能不能讓分析、審閱、整理、收斂與交付都回到同一個工作台

---

## 3. 單一顧問工作的完整範圍

一位顧問的真實工作，不會只落在單一產業或單一任務。

### 3.1 客戶成長階段
顧問可能同時服務：
- `創業階段`
- `制度化階段`
- `規模化階段`

不同階段代表完全不同的判斷標準、風險結構、交付形式與建議方式。

### 3.2 客戶型態
顧問可能同時服務：
- 中小企業
- 個人品牌與服務
- 自媒體
- 大型企業

不同客戶型態會改變：
- 決策者角色
- 資料成熟度
- 執行資源
- 風險承受能力
- 交付物閱讀方式

### 3.3 顧問面向
顧問可能同時跨越：
- 營運
- 財務
- 法務
- 行銷
- 銷售
- 募資
- 以及其他可擴充顧問面向

### 3.4 資料與交付物型態
顧問不只要處理一種資料，也不只要產出一種結果。

輸入可能來自：
- 合約
- 提案
- 研究資料
- 財務表
- SOP / 制度文件
- 會議紀錄
- 網頁、新聞、外部資訊
- 顧問自己補充的背景知識

輸出可能是：
- decision memo
- diagnostic brief
- review memo
- research brief
- restructuring draft
- roadmap / action plan

因此，真正的問題不是「如何先驗證一個小工具」，
而是：

> **如何讓單一顧問從第一天就有一套能承接完整工作現實的系統。**

---

## 4. 現有工作方式的主要缺口

### 4.1 工具鏈割裂
顧問工作往往散落在：
- 筆記工具
- 文件工具
- 雲端硬碟
- 搜尋工具
- 會議整理工具
- AI 聊天工具
- 報表與試算表

結果是：
- 每次都要重新拼湊上下文
- evidence 難以累積
- decision logic 難以沉澱
- deliverable 難以回看與重用

### 4.2 缺少 shared world model
即使資料很多，如果沒有 ontology，系統也很難穩定理解：
- 現在在處理哪個 client / engagement / workstream
- 這次到底要做什麼判斷
- 哪些 artifact 與 evidence 支撐目前結論
- 哪些 recommendation 對應哪些風險與 action items

沒有 shared world model，工具很容易退化成摘要器、問答器或 prompt 拼接器。

### 4.3 缺少正式 orchestration
真實顧問工作不只是「讓一個模型回答」，而是：
- 理解任務
- 釐清 decision context
- 判斷資料是否足夠
- 選擇分析方式
- 收斂不同專業視角
- 產出可交付結果

如果沒有 Host orchestration，系統很難穩定處理高密度、高不確定性的顧問案件。

### 4.4 缺少正式的 deliverable-centric output
很多 AI 工具停在：
- 摘要
- 問答
- 一段長文

但顧問真正需要的是：
- 可採用的判斷
- 可討論的風險
- 可執行的建議
- 可追蹤的 action items
- 可回看的 deliverable

### 4.5 缺少可擴充的專業能力層
現實中，顧問不會只做單一任務原型。
如果系統只能承接少數固定 flow，就無法對應真實顧問工作的多樣性。

因此系統必須一開始就保留：
- multiple specialist agents
- multiple reasoning agents
- modular pack system

---

## 5. 為什麼不能再用縮小版產品思維

如果一開始把 Infinite Pro 規劃成縮小版能力集合，會造成幾個結構性問題：

1. ontology 會被誤做成 task form 附屬物
2. Host 會被誤降成流程控制器，而不是正式治理中樞
3. agents 會被誤看成少數固定功能
4. packs 會被誤降成標籤
5. workbench 會退化成表單頁與結果頁

這會讓後續每次擴充都像在外掛功能，而不是在同一個正式架構上延展。

因此，Infinite Pro 必須從一開始就以：

> **完整能力邊界先定義，實作順序再分批**

來規劃。

---

## 6. 為什麼需要 ontology-first consulting workbench

Infinite Pro 必須以 ontology-first 的方式存在，因為顧問工作本質上是在操作：
- objects
- properties
- links
- actions
- workflows
- decision contexts

也就是：
- client
- engagement
- workstream
- task
- artifact
- evidence
- risk
- recommendation
- deliverable

如果 UI 與系統核心只圍繞 mode 與表單，顧問就還是在使用一套比較漂亮的工具集合，而不是工作系統。

---

## 7. 為什麼需要 Host + multiple agents

### Host 的必要性
Host 必須負責：
- task framing
- decision framing
- readiness governance
- agent routing
- result convergence
- deliverable shaping

### Multiple agents 的必要性
不同顧問工作需要不同能力面：
- diagnosis
- review
- synthesis
- restructuring
- decision convergence
- planning

這些能力不應都塞進單一回答中，而應由不同 specialist / reasoning agents 在共同 ontology 上工作。

### Pack Layer 的必要性
顧問工作還會受到：
- client stage
- client type
- domain lens
- industry context

影響。

Pack Layer 應成為正式擴充層，用來擴充：
- ontology
- heuristics
- evidence expectations
- decision criteria
- deliverable patterns

---

## 8. 系統必須支撐的正式工作循環

Infinite Pro 應正式支撐這條完整循環：

1. 接住原始問題與背景
2. 將其映射為 task 與 decision context
3. 匯入 artifact / source materials
4. 建立與治理 evidence
5. 由 Host 決定要採取的工作方式
6. 調度 specialist / reasoning agents
7. 收斂成 recommendation / risk / action items
8. 形成 deliverable
9. 保存 history、supporting context 與 traceability

如果其中任何一段缺席，系統就很難成為真正的顧問工作台。

---

## 9. 問題定義的最終濃縮

Infinite Pro 要解決的核心問題可以濃縮為：

> **如何建立一套 ontology-first、Host-orchestrated、deliverable-centric 的單人顧問完整工作台，讓顧問能以同一套系統承接跨階段、跨客戶型態、跨顧問面向、跨資料來源與跨交付物的真實工作。**

---

## 10. 對後續文件與實作的約束

後續文件與實作應遵守：

- 不再以縮小版產品語言定義正式邊界
- 不再把少數既有 flow 當產品主分類
- 不再把 ontology、Host、packs、workbench 當後補層
- 不再使用舊的數字成長階段 shorthand
- 應以單人顧問完整工作世界作為正式問題背景

---

## 11. 文件結論

Infinite Pro 之所以需要存在，不是因為市場上還少一個 AI 助手，
而是因為：

> **單一顧問需要一套能完整承接其工作世界的正式工作底座，而現有工具普遍只能處理其中的一小段。**
