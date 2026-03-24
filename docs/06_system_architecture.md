# 06_system_architecture.md

> 文件狀態：Governance Reset v2.1（正式系統架構文件）
>
> 本文件支撐 Infinite Pro 的 **Single-Consultant Full-Scope Edition**。

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
5. **Pack Layer**
6. **Workbench / UI Layer**

這六層都屬於第一天就存在的正式架構，不可把其中任何一層視為之後才補的附加功能。

---

## 4. 六層架構說明

## 4.1 Ontology Layer

### 角色
提供 shared world model、structured reasoning skeleton，以及 objects / properties / links / actions / functions / decision context 的共同操作層。

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
Ontology Layer 不是知識庫、prompt system、pack 或 UI 本身，而是這些層共同依附的語義底座。

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
Context 不是 UI 補充欄位，而是 Host、agents、packs 與 deliverable shaping 的正式輸入層。

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
- Agent Registry
- Agent Resolver / Selector
- pack-aware routing hooks

### 原則
Agent Layer 不是 prompt 集合，而是 capability execution layer。
它也不應停留在抽象概念層；至少要有正式 registry / resolver，讓 Host 能把 selected agents、omitted / deferred / escalation notes 寫進 aggregate、workspace payload 與 deliverable metadata。

在單人顧問完整工作台範圍內，Agent Orchestration 應視為已完成的正式能力，而不是之後還要再補一輪的 foundation。

---

## 4.5 Pack Layer

### 角色
承接可版本化、可治理、可啟用 / 停用的 context modules。

### 正式拆分
- `Domain / Functional Packs`
  - 代表企業問題面向或顧問職能面向
  - 第一批正式範圍：
    - `operations_pack`
    - `finance_fundraising_pack`
    - `legal_risk_pack`
    - `marketing_sales_pack`
    - `business_development_pack`
    - `research_intelligence_pack`
- `Industry Packs`
  - 代表產業脈絡
  - 第一批正式範圍：
    - `online_education_pack`
    - `ecommerce_pack`
    - `gaming_pack`
    - `funeral_services_pack`
    - `health_supplements_pack`

### Pack 至少可擴充
- ontology-aware context presets
- evidence expectations
- decision criteria
- routing hints
- deliverable templates
- recommendation patterns
- risk libraries

### 原則
Pack 不是 Agent，也不是 Capability Archetype。
Pack Layer 是正式能力層，但不應變成第七層或平行系統。

### Pack System 的正式治理結構
Pack Layer 應至少具備：
- `Pack Spec`
- `Pack Registry`
- `Pack Resolver`
- `Pack Management Surface`

其中：
- `Pack Spec` 定義 pack 的正式欄位與版本
- `Pack Registry` 定義有哪些 pack 可用、哪些為 active / inactive / draft
- `Pack Resolver` 定義 Host 如何選 pack、疊加 pack、處理衝突與 override
- `Pack Management Surface` 則讓顧問能查看 pack 列表、版本、狀態，以及本次任務用到了哪些 pack

第一批正式 pack 範圍至少應保留：
- Domain / Functional Packs
  - `operations_pack`
  - `finance_fundraising_pack`
  - `legal_risk_pack`
  - `marketing_sales_pack`
  - `business_development_pack`
  - `research_intelligence_pack`
- Industry Packs
  - `online_education_pack`
  - `ecommerce_pack`
  - `gaming_pack`
  - `funeral_services_pack`
  - `health_supplements_pack`

正式 Pack Spec 至少應包含：
- `pack_id`
- `pack_type`
  - `domain`
  - `industry`
- `pack_name`
- `description`
- `domain_definition`
- `industry_definition`
- `common_business_models`
- `common_problem_patterns`
- `stage_specific_heuristics`
- `key_kpis_or_operating_signals`
- `key_kpis`
- `domain_lenses`
- `relevant_client_types`
- `relevant_client_stages`
- `default_decision_context_patterns`
- `evidence_expectations`
- `risk_libraries`
- `common_risks`
- `decision_patterns`
- `recommendation_patterns`
- `deliverable_presets`
- `routing_hints`
- `pack_notes`
- `scope_boundaries`
- `pack_rationale`
- `version`
- `status`
  - `draft`
  - `active`
- `inactive`
- `override_rules`

其中：
- `domain_definition`、`common_problem_patterns`、`key_kpis_or_operating_signals`、`scope_boundaries`、`pack_rationale` 對 Domain / Functional Packs 特別重要
- `industry_definition`、`common_business_models` 與產業型 `key_kpis` 對 Industry Packs 特別重要

### Capability / Pack / Agent 的層次差異
- Capability Layer 決定這次要做哪種顧問工作
- Pack Layer 決定哪些 context modules 要影響這次工作
- Agent Layer 決定由誰執行、分析、協作與收斂

這三者不能混成同一個 taxonomy。

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

### Extension Manager 的正式位置
顧問查看 packs 與 agents、查看 active / inactive / draft 狀態、查看版本與本次任務使用情況，
應透過 Workbench / UI Layer 內的 shared `Extension Manager` 來呈現。

這個 `Extension Manager`：
- 已在單人版工作台中以最小 surface 形式正式存在
- 可以同時管理 pack catalog 與 agent catalog
- 可以承接 task-level override 與 selection visibility
- 但不代表 Pack Layer 與 Agent Layer 合併
- 也不代表系統新增第七層

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

### 5.6 Registry / Resolver Foundation
- capability archetype taxonomy
- pack registry / resolver
- agent registry / resolver
- extension management surface

---

## 6. 正式系統流

Infinite Pro 的正式系統流可理解為：

1. 顧問建立或選擇 `Client / Engagement / Workstream`
2. 建立 `Task` 與 `DecisionContext`
3. 匯入 `Artifact / SourceMaterial`
4. 經由 ingestion 形成 `Evidence`
5. Host 根據 context / capability / selected packs 決定工作方式
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
- packs 先不算正式層

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
- 更正式的 pack execution
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
3. 不再把 packs、ontology、Host、workbench 視為後補
4. 不再把 mode 清單當成產品主結構
5. 實作順序可以分批，但架構邊界要先完整存在

---

## 11. 文件結論

Infinite Pro 的正式系統架構不是「一個有後端、有前端、能跑幾個 flow 的小系統」。

它應被理解為：

> **一套以 ontology、context、capability、agents、packs 與 consulting workbench 共同構成的單人顧問完整工作系統。**
