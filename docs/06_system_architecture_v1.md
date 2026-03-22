# 06_system_architecture_v1.md

> 文件狀態：Governance Reset v2.1（正式系統架構文件）
>
> 本文件延續既有檔名以維持文件索引穩定，但內容已改為支撐 Infinite Pro 的 **Single-Consultant Full-Scope Edition**。

---

## 1. 文件目的

本文件要回答的是：

1. **Infinite Pro 的正式系統架構應如何分層？**
2. **哪些層是第一天就存在的正式架構，而不是之後再補？**
3. **哪些能力屬於單人顧問完整工作台，哪些屬於 multi-user system layer？**
4. **如何在不縮小產品能力邊界的前提下，分批落地實作？**

---

## 2. 系統架構總原則

Infinite Pro 的系統架構應遵守：

> **full-scope by capability, phased by implementation order, single-user first, multi-user later**

也就是：
- 能力邊界先完整定義
- 系統層次先完整存在
- 技術實作順序可以分波
- 多人登入、多租戶治理屬於較後面的系統拓撲層

---

## 3. 正式六層主架構

Infinite Pro 應正式以這六層作為主架構：

1. **Ontology Layer**
2. **Context Layer**
3. **Capability Layer**
4. **Agent Layer**
5. **Industry Pack Layer**
6. **Workbench / UI Layer**

這六層都屬於第一天就存在的正式架構，不可把其中任何一層視為之後才補的附加功能。

---

## 4. 六層架構說明

## 4.1 Ontology Layer

### 角色
提供 shared world model 與 structured reasoning skeleton。

### 正式承接
- Client
- Engagement
- Workstream
- Task
- DecisionContext
- Artifact
- SourceMaterial
- Evidence
- Insight
- Risk
- Option
- Recommendation
- ActionItem
- Deliverable

### 原則
系統不應只圍繞 task 與 mode 工作，而應圍繞 ontology objects 與 links 工作。

---

## 4.2 Context Layer

### 角色
提供這次分析與交付所依賴的上下文維度。

### 正式承接
- ClientStage
  - 創業階段
  - 制度化階段
  - 規模化階段
- ClientType
- DomainLens
- Goal
- Constraint
- Assumption
- Stakeholder
- Audience
- Metric
- Timeline

### 原則
Context 不是 UI 補充欄位，而是 Host、agents、industry packs 與 deliverable shaping 的正式輸入層。

---

## 4.3 Capability Layer

### 角色
定義 Infinite Pro 正式承接哪些顧問工作 archetypes。

### 正式能力面
- Diagnose / Assess
- Decide / Converge
- Review / Challenge
- Synthesize / Brief
- Restructure / Reframe
- Plan / Roadmap
- Scenario comparison
- Risk surfacing

### 原則
Capability Layer 是產品主體，不應被簡化成少數 workflow mode 名稱。

---

## 4.4 Agent Layer

### 角色
承接 Host orchestration、reasoning、specialist execution。

### 正式承接
- Host Agent
- reasoning agents
- specialist agents
- pack-aware routing hooks

### 原則
Agent Layer 不是 prompt 集合，而是 capability execution layer。

---

## 4.5 Industry Pack Layer

### 角色
承接特定產業、情境與顧問範式的擴充。

### pack 至少可擴充
- ontology extensions
- context presets
- evidence expectations
- decision criteria
- specialist routing hints
- deliverable templates
- risk libraries

### 原則
Industry packs 是正式能力層，不能只是標籤。

---

## 4.6 Workbench / UI Layer

### 角色
把 ontology-aware system 落成顧問工作台，而不是 consumer app 或 debug console。

### 正式工作面
- intake surface
- matter / engagement workspace
- decision workspace
- artifact / evidence workspace
- deliverable workspace
- supporting context surface
- system trace surface

### 原則
UI 不是只做表單與結果頁，而是正式工作面。

---

## 5. 跨層基礎能力

以下能力雖不屬於上述六層之一，但在系統架構中必須是第一天就被正式承接的 cross-cutting concerns：

### 5.1 Source & Ingestion
- file ingestion
- URL ingestion
- source normalization
- artifact creation

### 5.2 Evidence Pipeline
- evidence extraction
- evidence preprocessing
- evidence chunking
- relevance handling

### 5.3 Model Router / Provider Abstraction
- unified provider boundary
- future provider switching

### 5.4 Persistence / History
- structured state persistence
- deliverable history
- task / matter history
- traceability support

### 5.5 Traceability
- source to evidence
- evidence to recommendation
- recommendation to action item
- decision context to deliverable

---

## 6. 正式系統流

Infinite Pro 的正式系統流可理解為：

1. 顧問建立或選擇 `Client / Engagement / Workstream`
2. 建立 `Task` 與 `DecisionContext`
3. 匯入 `Artifact / SourceMaterial`
4. 經由 ingestion 形成 `Evidence`
5. Host 根據 context / capability / industry pack 決定工作方式
6. routing 給 reasoning agents 與 specialist agents
7. 收斂成 `Insight / Risk / Option / Recommendation / ActionItem`
8. 形成 `Deliverable`
9. 保存 history 與 traceability

這比「填一個表單，跑一個 mode」更接近正式產品形態。

---

## 7. 舊式縮小版產品思維需要移除的地方

以下觀念不應再作為系統架構規劃依據：
- 系統只先需要最小 ontology
- 一開始只需要少數既有 flow
- 4 core agents + 3 specialists 是正式上限
- UI 只要 task form + result page
- industry packs 先不算正式層

這些只能作為實作先後順序，不是架構定義。

---

## 8. 第一波與第二波實作的正確區分

### 8.1 第一波可優先落地
- Ontology Layer 的第一批核心 objects
- Context Layer 的基本 stage / type / domain 掛載
- Capability Layer 的少數 archetypes
- Host orchestration
- 少數 reasoning / specialist agents
- 基本 workbench surfaces
- source / evidence / history / deliverable 主鏈

### 8.2 第二波可再深化
- 更完整的 object surfaces
- 更完整的 domain reasoning
- 更正式的 industry pack execution
- 更細的 traceability
- 更豐富的 deliverable templates

但這不代表第二波內容不屬於正式架構。

---

## 9. 不屬於本輪正式核心的多使用者系統層

以下屬於 multi-user system layer：
- login / auth
- RBAC
- 多顧問協作
- 多公司同步與隔離
- multi-tenant governance
- user-scoped API key management
- enterprise admin console

它們不應影響單人顧問完整工作台的正式能力邊界。

---

## 10. 對後續實作的約束

後續 Codex 或工程實作，必須遵守：

1. 不再以縮小版產品邏輯縮小正式能力邊界
2. 不再把單人版理解成縮水版
3. 不再把 industry packs、ontology、Host、workbench 視為後補
4. 不再把 mode 清單當成產品主結構
5. 實作順序可以分批，但架構邊界要先完整存在

---

## 11. 文件結論

Infinite Pro 的正式系統架構不是「一個有後端、有前端、能跑幾個 flow 的小系統」。

它應被理解為：

> **一套以 ontology、context、capability、agents、industry packs 與 consulting workbench 共同構成的單人顧問完整工作系統。**
