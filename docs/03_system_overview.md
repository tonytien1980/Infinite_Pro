# 03_system_overview.md

> 文件狀態：Baseline v2.0（正式系統總覽文件）
>
> 本文件用於用白話方式說明 **Infinite Pro** 的完整單人顧問工作台輪廓：六層主架構如何運作、主要工作面如何分工、ontology / Host / agents / packs / workbench 如何共同形成一套正式系統。

---

## 1. 這份文件在講什麼

這份文件不是在講資料表細節，也不是在講單一頁面的操作說明。

它要回答的是：

> **Infinite Pro 作為單人顧問完整工作台，整體系統到底長成什麼樣子？**

你可以把它當成：
- 高層願景與細節設計之間的橋樑
- 後續 ontology、agent、system architecture、UI 實作的共同總覽

---

## 2. 一句最白話的系統定義

Infinite Pro 可以先把它理解成：

> **一套以 ontology 為共享世界模型、由 Host Agent 負責流程治理、調度多種 specialist 與 reasoning agents、整合內外部資料與 evidence，最後形成顧問級 deliverables 的工作台系統。**

它不是：
- 純聊天機器人
- 單一 specialist 工具集合
- 只負責搜尋與摘要的知識助手

它更像是一個顧問工作作業台：
- 能接案
- 能理解任務
- 能吸收資料
- 能形成判斷
- 能產出交付物
- 能保存歷史與支持後續迭代

---

## 3. 正式六層主架構

Infinite Pro 應正式以六層架構理解：

1. **Ontology Layer**
2. **Context Layer**
3. **Capability Layer**
4. **Agent Layer**
5. **Pack Layer**
6. **Workbench / UI Layer**

這六層不是可有可無的附加項，而是第一天就存在的正式主架構。

---

## 4. 六層架構的白話說明

### 4.1 Ontology Layer
這是整套系統的 shared world model。

它定義：
- 系統正在處理哪些 objects
- 這些 objects 彼此如何連結
- evidence、risk、recommendation、deliverable 如何落在同一條分析主鏈上

如果沒有這一層，Infinite Pro 就會退化成比較強的 prompt 系統。

### 4.2 Context Layer
這層回答的是：
- 這是什麼類型的客戶
- 處在什麼成長階段
- 這次分析用什麼 domain lens
- 有哪些 goals、constraints、assumptions、stakeholders

這些不是補充欄位，而是 Host、agents、packs 與 deliverable shaping 的正式輸入。

### 4.3 Capability Layer
這層定義系統能承接哪些顧問工作 archetypes，例如：
- diagnose / assess
- decide / converge
- review / challenge
- synthesize / brief
- restructure / reframe
- plan / roadmap

也就是說，Infinite Pro 的主體不是幾個功能頁，而是顧問工作能力。

### 4.4 Agent Layer
這層承接實際分析執行。

其中：
- Host Agent 是唯一 orchestration center
- reasoning agents 與 specialist agents 共同承接不同能力面
- agents 應建立在 shared ontology 上工作，而不是各自吃一段 prompt

### 4.5 Pack Layer
這層承接不同問題面向與產業脈絡的正式擴充。

它正式包含兩個 pack family：
- Domain / Functional Packs
- Industry Packs

它不只是標籤，而應能正式擴充：
- ontology-aware context modules
- heuristics
- evidence expectations
- decision criteria
- deliverable templates
- routing hints

也就是說：
- Capability Archetypes 決定這次要做哪種顧問工作
- Packs 決定哪些 context modules 要影響這次工作
- Agents 決定由誰來執行與收斂

### 4.6 Workbench / UI Layer
這層把整套系統變成顧問真的能使用的工作台。

它不應只是：
- 表單頁
- 結果頁

而應逐步形成：
- object-aware views
- workflow-aware views
- deliverable-aware views

---

## 5. 系統裡的主要工作物件

Infinite Pro 的工作主體不應只是 task。

正式工作物件至少包括：
- `Client`
- `Engagement`
- `Workstream`
- `Task`
- `DecisionContext`
- `Artifact`
- `SourceMaterial`
- `Evidence`
- `Insight`
- `Risk`
- `Option`
- `Recommendation`
- `ActionItem`
- `Deliverable`

這些 objects 才是系統的正式主角。
頁面、workflow、agents，都應圍繞它們來組織。

---

## 6. 工作台的主要工作面

從 UI / workbench 角度來看，Infinite Pro 應逐步形成以下主要工作面：

### 6.1 Intake surface
用來接住原始問題、補充資料、外部資料策略與進階背景。

### 6.2 Matter / Engagement workspace
用來表示這次顧問案件本身與其工作脈絡。

### 6.3 Decision workspace
用來做 task framing、readiness、decision output、mode-specific sections。

### 6.4 Artifact / Evidence workspace
用來處理文件、來源、evidence 與 supporting context。

### 6.5 Deliverable workspace
用來閱讀、整理、調整與回看交付物。

### 6.6 System trace surface
用來查看 orchestration、history、ontology mapping 與工作流痕跡。

這些工作面可以分波逐步實作，但它們都屬於正式系統輪廓。

---

## 7. 系統是怎麼運作的

Infinite Pro 的正式系統流可白話理解為：

1. 顧問輸入原始問題，並附上背景與資料
2. 系統把問題映射成 `Task` 與 `DecisionContext`
3. 將文件、網址、貼文等來源轉成 `Artifact / SourceMaterial`
4. 經由 ingestion 與 preprocessing 建立 `Evidence`
5. Host 根據 ontology、context、capability 與 packs 決定工作方式
6. 調度適合的 reasoning agents / specialist agents
7. 收斂成 `Insight / Risk / Option / Recommendation / ActionItem`
8. 形成 `Deliverable`
9. 保存 history、supporting context 與 traceability

這條鏈代表：

> Infinite Pro 不只是回答問題，而是在完成一段正式的顧問工作流程。

---

## 8. 單人版與多人系統層的界線

Infinite Pro 目前採：

> **single-user first, multi-user later**

意思不是能力縮小，而是使用拓撲先限制為單人。

### 屬於正式單人版的能力
- ontology layer
- context layer
- capability layer
- Host orchestration
- multiple agents
- pack layer
- workbench UI
- source / evidence / history / traceability
- deliverable-centric outputs

### 屬於後續多人系統層的能力
- 多人登入
- 多顧問協作
- 多公司專案同步
- 多租戶治理
- enterprise admin / governance console
- user-level credential management

---

## 9. 為什麼這不是 generic AI workspace

Infinite Pro 與一般 AI workspace 的差異在於：

- 它以 ontology objects 與 links 為主體，不是以 chat thread 為主體
- 它以 Host orchestration 為中樞，不是讓所有能力平鋪直敘地暴露
- 它以 deliverable 為結果中心，不是以聊天回覆為結果中心
- 它以顧問工作面為組織方式，不是以零散功能頁為組織方式

---

## 10. 對後續文件與實作的約束

後續文件與實作應以本總覽為準，並遵守：

- 不再以縮小版產品敘事來理解系統全貌
- 不再以少數既有 flows 作為正式產品輪廓
- 不再把 ontology、Host、packs、workbench 視為後補層
- 不再把 task-centric / mode-centric 當成唯一系統骨架

---

## 11. 文件結論

Infinite Pro 的正確理解方式，不是把它看成一個「比較強的 AI 工具」，
而是：

> **一套 ontology-first、Host-orchestrated、deliverable-centric、可正式承接單一顧問完整工作世界的工作台系統。**
