# 00_project_vision.md

> 文件狀態：Baseline v2.0（正式高層願景文件）
>
> 本文件用於定義 **Infinite Pro** 的高層願景、正式定位、核心價值與正式能力邊界，作為後續 ontology、agent、system architecture、packs 與 consulting workbench 實作的上位文件。

---

## 1. 文件目的

本文件要回答的是：

1. **Infinite Pro 為什麼存在？**
2. **Infinite Pro 的正式定位是什麼？**
3. **Infinite Pro 的正式能力邊界應如何理解？**
4. **為什麼它應從第一天就被規劃成單人顧問完整工作台，而不是縮小版工具？**

---

## 2. 正式產品定位

Infinite Pro 的正式定位是：

> **單人顧問完整工作台（Single-Consultant Full-Scope Edition）**

這代表：
- 產品能力邊界從第一天就要完整承接單一顧問的全部工作需求
- ontology、Host Agent、multiple specialist agents、modular pack system、consulting workbench UI 都屬於正式主架構
- 系統可以分批實作，但不能以縮小版產品邊界來重新定義產品
- 現階段先採 single-user first，multi-user 與 multi-company 系統能力屬於後續系統層

Infinite Pro 不是：
- 一般對外型 SaaS
- 純聊天型 AI 工具
- 單一模型的 prompt 包裝層
- 幾個 specialist flow 拼成的工具集合

Infinite Pro 是：
- ontology-first 的顧問工作系統
- Host Agent orchestration 的決策與交付平台
- 能夠承接單一顧問完整工作現實的 consulting workbench

在這個定位下，ontology 不只是底層資料結構，而是：
- 顧問工作世界的共享世界模型
- 顧問工作物件與關係的操作層
- Host、specialist agents、packs、workbench UI 與 deliverable generation 的共同語義底座

---

## 3. 一句話願景

Infinite Pro 是一套以 ontology 為共享世界模型、以 Host Agent 為唯一 orchestration center、以多種 specialist 與 reasoning agents 為能力承載、以 modular pack system 為正式擴充層、並以 consulting workbench UI 為工作介面的顧問工作系統。

它的目標不是讓 AI 更會聊天，而是讓顧問能以更低成本、更高密度、更高一致性的方式完成分析、審閱、整理、收斂與交付。

---

## 4. 為什麼需要這樣的系統

顧問工作的真實特性不是單一步驟，而是同時具備：

- 跨客戶成長階段
- 跨客戶型態
- 跨顧問面向
- 跨資料來源
- 跨交付物型態
- 跨分析方法與判斷框架

單一顧問在真實工作中，可能同時需要處理：
- 創業階段公司的商業模式與募資敘事
- 制度化階段公司的營運流程、制度文件與管理治理
- 規模化階段公司的成長效率、部門協作、風險管理與決策收斂
- 中小企業、個人品牌與服務、自媒體、大型企業等不同客戶型態
- 營運、財務、法務、行銷、銷售、募資等不同顧問面向

因此，Infinite Pro 不能被定義為「先支援幾個功能、之後再慢慢長」的系統。
它必須一開始就被定義為：

> **完整承接單一顧問工作世界的正式平台。**

---

## 5. 核心產品原則

Infinite Pro 的正式原則是：

1. **full-scope by capability**
   - 正式能力邊界先完整定義。

2. **phased by implementation order**
   - 技術落地可以分批，但不是用來縮小產品本身。

3. **single-user first**
   - 先完整服務單一顧問的工作需求。

4. **multi-user later**
   - 多人登入、協作、多租戶與治理屬於下一層系統能力。

5. **ontology-first**
   - 系統應以 objects、properties、links、actions、functions、workflows、decision context 來建模，而不是先以功能頁與 mode 列表建模。

6. **Host Agent orchestration**
   - Host 必須作為唯一 orchestration center，負責理解任務、選擇能力、治理流程、收斂輸出。

7. **multiple specialist agents**
   - 專門能力不應被壓縮成少數固定 flow，而應成為正式能力層。

8. **modular pack system**
   - Pack Layer 不是標籤，而是可擴充 ontology-aware context、heuristics、decision criteria、deliverable patterns 的正式層。
   - 其中正式區分：
     - Domain / Functional Packs
     - Industry Packs

9. **consulting workbench UI**
   - UI 必須反映顧問工作與 ontology objects，而不是 consumer app 或 debug console。

---

## 6. 正式能力邊界

### 6.1 客戶成長階段
- `創業階段`
- `制度化階段`
- `規模化階段`

### 6.2 客戶型態
- 中小企業
- 個人品牌與服務
- 自媒體
- 大型企業

### 6.3 顧問面向
- 營運
- 財務
- 法務
- 行銷
- 銷售
- 募資
- 以及其他可擴充顧問面向

### 6.4 顧問工作能力
Infinite Pro 應正式承接至少以下能力：
- diagnosis / assessment
- decision convergence
- review / challenge
- research / synthesis
- restructuring / reframing
- planning / roadmaping
- risk surfacing
- scenario comparison
- deliverable shaping

這些都是正式能力邊界的一部分，不應因為實作順序而被視為暫時不存在。

---

## 7. 正式主架構

Infinite Pro 應正式以六層主架構運作：

1. **Ontology Layer**
2. **Context Layer**
3. **Capability Layer**
4. **Agent Layer**
5. **Pack Layer**
6. **Workbench / UI Layer**

此外，以下跨層責任也屬正式主架構的一部分：
- provider abstraction
- source ingestion
- evidence pipeline
- history persistence
- traceability
- deliverable-centric output shaping

在這六層之中，Ontology Layer 的角色應被明確理解為：
- 顧問工作世界的共享世界模型
- Host、agents、packs、UI 的共同語義底座
- 顧問案件 objects 與 links 的操作層
- deliverable generation 的來源底座，而不是 deliverable 本身

而第 5 層 `Pack Layer` 應正式拆分為：
- `Domain / Functional Packs`
- `Industry Packs`

目前第一批正式 Industry Packs 例子應以：
- `online_education_pack`
- `ecommerce_pack`
- `gaming_pack`
- `funeral_services_pack`
- `health_supplements_pack`
為準。

它們與其他層的邊界必須保持清楚：
- Capability Archetypes 決定這次要做哪種顧問工作
- Packs 決定哪些 context modules 要影響本次判斷
- Agents 決定由誰執行、分析、協作、收斂

---

## 8. 長期產品形態

Infinite Pro 的長期形態不是單一工具頁面，而是一套以顧問工作世界為中心的智能工作台。

它應同時具備：
- object-aware views
- workflow-aware views
- deliverable-aware views

它的核心工作面應逐步形成：
- intake surface
- matter / engagement workspace
- decision workspace
- artifact / evidence workspace
- deliverable workspace
- supporting context surface
- system trace surface

---

## 9. 單人版與多人系統層的界線

以下屬於正式產品能力邊界的一部分：
- ontology 建模
- Host orchestration
- multiple agents
- pack layer
- consulting workbench
- evidence / history / deliverables

以下屬於 multi-user system layer，可後續再做：
- 多人登入
- 多顧問協作
- 多公司專案同步
- 多租戶治理
- enterprise admin / governance console
- per-user API key 管理

也就是說：

> **單人版不是縮小版產品，而是完整產品在單人使用拓撲下的第一個正式落地形態。**

---

## 10. 對後續文件與實作的約束

從本文件開始，後續所有文件與實作都應遵守以下約束：

- 正式產品名稱一律使用 `Infinite Pro`
- 不再以縮小版產品思維定義正式能力邊界
- 不再以少數既有 flow 作為正式產品分類
- 不再把 ontology、Host、packs、workbench 視為後補項目
- 不再使用舊的數字成長階段 shorthand
- 不以 generic AI workspace 或 chat-first product 來理解本系統

---

## 11. 文件結論

Infinite Pro 的高層願景，不是做出一個較大的 AI 助手，而是：

> **建立一套 ontology-first、Host-orchestrated、deliverable-centric、可正式承接單一顧問完整工作世界的顧問工作台。**
