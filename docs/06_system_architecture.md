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
- CaseWorldDraft
- CaseWorldState
- Artifact
- SourceMaterial
- Evidence
- EvidenceGap
- Insight
- Risk
- Option
- Recommendation
- ActionItem
- Deliverable
- ResearchRun / ExternalResearchRun
- DecisionRecord
- ActionPlan
- ActionExecution
- OutcomeRecord

### 原則
系統不應只圍繞 task 與 mode 工作，而應圍繞 ontology objects 與 links 工作。
Ontology Layer 不是知識庫、prompt system、pack 或 UI 本身，而是這些層共同依附的語義底座。

### Deeper identity bridge
目前正式 bridge 應理解為：
- `CaseWorldState` 是 matter/world-native identity spine
- `Task` 是 world 內的 work slice
- `Client / Engagement / Workstream / DecisionContext` 的正式 authority 應逐步提升到 matter/world 層
- `SourceMaterial / Artifact / Evidence` 的 continuity 也應逐步能在 matter/world 層被直接回訪與共享
- identity deepen phase 11 應優先把 read / write / serialize / batch response path 調整成：
  - canonical world authority first
  - slice-local overlay second
  - legacy compatibility fallback last
  - local participation rows / mappings 明確與 canonical ownership 分層
  - `task_id` 只保留 compatibility / access / participation linkage 的最低必要角色
  - `slice_decision_context` 只保留 local delta，而不是第二套完整 authority
  - core/context rows 與 source-chain participation bridge 落在同一個 matter/world spine 上
  - Host payload、workspace、aggregate 與常用 read models 的 canonical-first 行為一致
  - source-chain typed participation bridge 進一步朝更正式 mapping 與 compatibility closeout 收斂
  - matter-scoped canonicalization review 只在同一案件世界內收斂 duplicate candidate，不跨案件世界做 aggressive merge

這一輪允許保留：
- world-level canonical identity
- task-level legacy references
- synchronized / derived world summaries

但不應再把 legacy `task_id` ownership 誤認成最終正式架構。

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
- engagement_continuity_mode
- writeback_depth

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
後續新增或深化 agents 時，也應回到 `docs/05_agent_architecture.md` 的統一 Agent Spec Baseline，而不是只補 catalog 名稱與 description。
Agent Resolver 與 Pack Resolver 也應逐步提供 relevance score / matched signals，讓 Host 的 selection quality 可被解釋，而不是只剩下靜態名單。
若管理面允許使用者以最少資訊新增 agent，補完流程也必須走正式 backend synthesis path：
- 先形成最少輸入草稿
- 使用目前 active provider 與外部搜尋生成正式 contract draft
- 再回到 registry / resolver / management surface 的正式欄位與 writeback 路徑

正式 runtime 理解還應包括：
- 使用者建立 agent，不等於 Host 之後一定會使用這個 agent
- 建立完成只代表 catalog 中新增一個正式 capability module
- 是否在某個案件中被選入，仍由 Host 根據 capability、packs、decision context、readiness 與 evidence sufficiency 判斷
- 因此「建立規格」與「實際執行選用」必須保持分層，不可混成同一步

在單人顧問完整工作台範圍內，Agent Orchestration 應視為已完成的正式能力，而不是之後還要再補一輪的 foundation。

Host 第一階段現在必須正式被理解為：
- `Case World Compiler`
- 輸出 `case_world_draft`
- 提升 / 同步為 `CaseWorldState`
- 再決定 workflow、research、routing、task slices 與 writeback policy

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
    - `organization_people_pack`
    - `product_service_pack`
- `Industry Packs`
  - 代表產業脈絡
  - 第一批正式範圍：
    - `online_education_pack`
    - `ecommerce_pack`
    - `gaming_pack`
    - `funeral_services_pack`
    - `health_supplements_pack`
    - `energy_pack`
    - `saas_pack`
    - `media_creator_pack`
    - `professional_services_pack`
    - `manufacturing_pack`
    - `healthcare_clinic_pack`

### Pack 至少可擴充
- ontology-aware context presets
- evidence expectations
- decision criteria
- routing hints
- deliverable templates
- recommendation patterns
- risk libraries
- research focus
- writeback interpretation

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
- `Pack Management Surface` 則讓顧問能查看 pack 列表、版本、狀態、本次任務用到了哪些 pack，以及它們的核心 pack contract 是否完整

Wave 4 的最小正式基線還包括：
- `pack_id` 作為 pack 的 stable API name baseline
- interface ids / required property ids / rule binding ids 作為 contract naming baseline
- active pack 的 required-property gate
- pack-to-contract binding 對 readiness / decision framing / deliverable hints 的正式影響

P0-A 之後，Domain / Functional Packs 還應進一步滿足：
- `ready` 不只代表最低 interface completeness，而應代表 domain contract 已達正式可依賴水準
- domain-only required-property gate 應至少正式檢查：
  - stage heuristics
  - KPI / operating-signal guidance
  - common risks
- Pack Resolver 不應只靠 `domain_lenses` 選 domain pack，也應正式參考：
  - `routing_hints`
  - `common_problem_patterns`
  - `default_decision_context_patterns`
  - relevant client stage / type

P0-B 之後，Industry Packs 也應進一步滿足：
- `ready` 不只代表最低 interface completeness，而應代表 industry contract 已達正式可依賴水準
- industry-only required-property gate 應至少正式檢查：
  - `common_business_models`
  - KPI / operating-signal guidance
- Pack Resolver 不應只靠鬆散產業 token 命中選 industry pack，也應正式參考：
  - `common_business_models`
  - `common_problem_patterns`
  - `default_decision_context_patterns`
  - relevant client stage / type
- 若同一輪有多個可能的 Industry Packs，應優先維持 scored selection 與 top-score trimming，而不是把所有 soft match 一起掛上

Wave 5 的最小正式基線則是：
- `ObjectSet` 仍留在 Ontology Layer，不能形成第七層
- first shipped set types 只先包含：
  - `evidence_set_v1`
  - `risk_set_v1`
- first shipped owning scopes 只先包含：
  - deliverable-local support bundle
  - task-scope focus grouping
- `object-set views` 只作為既有工作面的進階視圖，不形成新 app shell

若 Pack Management Surface 採精簡建立模式，正式規則也應是：
- 一般使用者只填最少必要資訊
- backend 使用目前 active provider 與外部搜尋生成正式 pack contract draft
- draft 仍需回到 Pack Spec / Registry 的正式欄位，不可停留在前端模板或 local-only 補值

### Pack / Agent contract synthesis guardrails
當 Agent / Pack 由精簡建立生成時，正式系統層至少應包含：
- fixed structured-output schema
- provider-boundary execution
- bounded external search
- post-synthesis normalization
- registry-safe write path

也就是說：
- 模型可以補完，但不能自由定義整套 ontology / pack / capability 語義
- 影響 routing 與 selection 的關鍵欄位，應先經過正式 whitelist / normalization
- registry / resolver 才是最終正式治理層，而不是模型輸出本身

單人版 Pack 基本盤至少應保留：
- Domain / Functional Packs
  - `operations_pack`
  - `finance_fundraising_pack`
  - `legal_risk_pack`
  - `marketing_sales_pack`
  - `business_development_pack`
  - `research_intelligence_pack`
  - `organization_people_pack`
  - `product_service_pack`
- Industry Packs
  - `online_education_pack`
  - `ecommerce_pack`
  - `gaming_pack`
  - `funeral_services_pack`
  - `health_supplements_pack`
  - `energy_pack`
  - `saas_pack`
  - `media_creator_pack`
  - `professional_services_pack`
  - `manufacturing_pack`
  - `healthcare_clinic_pack`

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
- `industry_definition`、`common_business_models`、`common_problem_patterns`、產業型 `key_kpis`、`evidence_expectations`、`decision_patterns`、`deliverable_presets` 與 `pack_rationale` 對 Industry Packs 特別重要
- 不論 domain 或 industry，正式 pack spec 都不應讓 `common_problem_patterns`、`evidence_expectations`、`decision_patterns`、`deliverable_presets`、`pack_rationale` 退化成空集合
- `key_kpis` 與 `key_kpis_or_operating_signals` 應維持正式可用，不可只剩其中一側

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

在單人顧問完整工作台範圍內，`Matter / Engagement Workspace` 現在應視為已完成的正式工作面：
- `Client / Engagement / Workstream / DecisionContext` 已具備 canonical workspace identity
- workspace 不再只是 task list 的包裝，而是案件世界的正式導航骨架
- cross-task / cross-deliverable continuity 已屬於正式工作面責任，而不是零散頁面邏輯
- matter metadata 與正文已是 remote-first 正式 persistence；degraded mode 只作為明示 fallback 與待同步保底

在單人顧問完整工作台範圍內，`Artifact / Evidence Workspace` 也應視為已完成的正式工作面：
- `Artifact / SourceMaterial / Evidence` 已具備 canonical workspace identity 與獨立工作面入口
- evidence 對 recommendation / risk / action item 的最小正式支撐鏈已可被回看
- sufficiency、high-impact gaps、deliverable limitations 已成為正式工作面責任
- 它不是 supporting context 區塊，也不是 raw trace panel

在單人顧問完整工作台範圍內，`Deliverable Workspace` 也應視為已完成的正式工作面：
- `Deliverable` 已具備 canonical workspace identity 與獨立工作面入口
- deliverable class、confidence / applicability、limitations、high-impact gaps 已成為正式工作面責任
- deliverable 對 matter / decision context / source / evidence / recommendation / risk / action 的回鏈已可被正式回看
- deliverable 正文、revision、rollback、version events、publish / artifact records 與正式匯出都已屬於正式 runtime responsibility
- Wave 5 後，deliverable workspace 也可低噪音進入：
  - `evidence_set_v1` support bundle 視角
  - `risk_set_v1` focus grouping 視角
- 它不是 generic result page，也不是 task detail 的附帶閱讀區

### Extension Manager 的正式位置
顧問查看 packs 與 agents、查看 active / inactive / draft 狀態、查看版本與本次任務使用情況，
應透過 Workbench / UI Layer 內的 shared `Extension Manager` 來呈現。

這個 `Extension Manager`：
- 已在單人版工作台中以最小 surface 形式正式存在
- 可以同時管理 pack catalog 與 agent catalog
- 可以承接 task-level override 與 selection visibility
- 若 task 已選定 packs，應能看出 pack 對 evidence expectations、decision patterns 與 deliverable presets 的影響，而不只是看到 pack 名稱
- Wave 4 後也應能低噪音看出：
  - 哪些 interface 已正式啟用
  - 哪些 required properties 缺失
  - 哪些 rule binding 正在影響 runtime
- 但不代表 Pack Layer 與 Agent Layer 合併
- 也不代表系統新增第七層

---

## 5. 跨層基礎能力

以下能力雖不屬於上述六層之一，但在系統架構中必須是第一天就被正式承接的 cross-cutting concerns：

### 5.1 Source & Ingestion
- file ingestion
- URL ingestion
- three formal intake modes
- matter-level supplement chain
- source normalization
- artifact creation
- raw / derived / released storage separation
- retention / purge metadata

正式更新後應理解為：
- one canonical intake pipeline
- one unified intake surface
- three inferred intake patterns from actual input composition
- all intake first enters `case world compilation`
- follow-up supplements go back into the same case world rather than opening a parallel intake branch

### 5.2 Evidence Pipeline
- evidence extraction
- evidence preprocessing
- evidence chunking
- relevance handling
- facts vs assumptions visibility
- evidence gaps visibility
- research provenance writeback

### 5.3 Model Router / Provider Abstraction
- unified provider boundary
- future provider switching

### 5.4 Persistence / History
- structured state persistence
- content persistence
- revision history
- deliverable history
- publish / artifact records
- task / matter history
- traceability support
- continuity policy persistence
- decision / action / outcome writeback

### 5.5 Failure Governance / Sync Recovery
- fail-closed boundaries for正式 deliverable content / publish / artifact paths
- degraded mode boundaries for matter local fallback
- manual re-sync / discard local fallback flow
- retryable remote operations without fake local success

### 5.6 Traceability
- source to evidence
- evidence to recommendation
- recommendation to action item
- decision context to deliverable
- research run to source material / evidence
- research run 也應逐步保留 research depth、sub-questions、evidence-gap focus、source-quality summary、contradiction summary、citation handoff，以及 Host 的 delegation status / handoff target / stop condition 等 provenance 欄位，而不是只留 query 與 source count
- deliverable to decision record / action plan / outcome record

### 5.7 Registry / Resolver Foundation
- capability archetype taxonomy
- pack registry / resolver
- agent registry / resolver
- extension management surface

---

## 6. 正式系統流

Infinite Pro 的正式系統流可理解為：

1. 顧問透過 canonical intake pipeline 進入系統
2. Host 先形成 `CaseWorldDraft`
3. 在同一個案件世界下建立或對齊 `Client / Engagement / Workstream / Task / DecisionContext`
4. 匯入 `Artifact / SourceMaterial`
5. 經由 ingestion 形成 `Evidence`
6. Host 根據 context / capability / selected packs / evidence gaps 決定 workflow 與 research
7. research 若發生，必須先回到 `SourceMaterial / Evidence` 主鏈
8. routing 給 reasoning agents 與 specialist agents
9. 收斂成 `Insight / Risk / Option / Recommendation / ActionItem`
10. 形成 `Deliverable`
11. 根據 continuity / writeback policy 形成 `DecisionRecord / ActionPlan / ActionExecution / OutcomeRecord`
12. 保存 history 與 traceability

這比「填一個表單，跑一個 mode」更接近正式產品形態。

---

## 7. 舊式縮小版產品思維需要移除的地方

以下觀念不應再作為系統架構規劃依據：
- 系統只先需要最小 ontology
- 一開始只需要少數既有 flow
- 4 core agents + 3 specialists 是正式上限
- UI 只要 task form + result page
- packs 先不算正式層
- catalog agent 與 runtime binding 暫時不完全 1:1，就代表 agent catalog 可以被重新壓回較少名稱

這些只能作為實作先後順序，不是架構定義。

補充：
- Agent catalog 的治理語義仍應維持 `Host + 11 個非 Host agents`
- runtime execution path 在命名上可與 catalog agent 不完全一致
- 但 Host 必須誠實寫回：
  - 這輪選了哪些 catalog agents
  - 實際用了哪些 runtime agents
  - runtime path 是否已對齊成該 family 的 dedicated execution path

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
