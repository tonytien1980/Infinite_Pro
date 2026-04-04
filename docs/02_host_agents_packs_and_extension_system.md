# 02 Host, Agents, Packs, and Extension System

> 文件狀態：Active source of truth
>
> 本文件定義 Infinite Pro 目前與程式碼對齊的 orchestration 層、agent system、pack system、extension manager 與 related runtime / management contracts。

---

## 1. Purpose

本文件回答：

1. Host 在 Infinite Pro 中的正式責任是什麼
2. Agent Layer 的正式 runtime realization 是什麼
3. Pack Layer 的正式 contract 與 resolver baseline 是什麼
4. Capability / Pack / Agent 的邊界如何維持清楚
5. extension management 現在正式成立到哪裡

---

## 2. Host As The Only Orchestration Center

Host 是 Infinite Pro 唯一的 orchestration center。

Host 正式負責：

- task / decision interpretation
- ontology mapping
- case world compilation
- case world state promotion / synchronization
- workflow orchestration
- reasoning / specialist routing
- readiness governance
- research trigger governance
- precedent reference governance
- organization memory governance
- domain playbook governance
- reusable review-lens governance
- common-risk-library governance
- deliverable-shape governance
- convergence
- deliverable shaping
- continuity / writeback policy control
- history writeback
- generated output language guardrail

正式規則：

- UI-only logic 不得取代 Host 決定核心 workflow
- direct model call 不得繞過 Host orchestration 與 provider boundary
- precedent 若要進模型上下文，必須經 Host 選取與縮寫，不可由前端直接回灌 raw candidate content
- reusable review lenses 若要進模型上下文，必須經 Host 收斂成 prompt-safe guidance，不可由前端或單一 agent 自行擴寫成 checklist shell
- common risk libraries 若要進模型上下文，必須經 Host 收斂成 prompt-safe guidance，不可由前端或單一 agent 自行把 common risks 擴寫成正式風險結論
- deliverable shape hints 若要進模型上下文，必須經 Host 收斂成 prompt-safe guidance，不可由前端或單一 agent 自行把交付提示擴寫成 template auto-fill
- domain playbooks 若要進模型上下文，必須經 Host 收斂成 prompt-safe guidance，不可由前端或單一 agent 自行把工作主線擴寫成 checklist shell
- reusable review lenses、common risk libraries、deliverable shape hints、domain playbooks 之間的角色必須保持分離：
  - review lenses = 先看角度
  - common risks = 漏看提醒
  - deliverable shape = 交付骨架
  - domain playbook = 工作主線
- pack contract 可以 influence Host judgment，但不能 replace Host judgment
- Host 與 extension synthesis 都必須沿用正式語言 guardrail；若無明確例外，模型輸出預設為繁體中文

---

## 3. Capability, Pack, and Agent Boundary

### 3.1 Capability archetypes

Capability 回答的是：

- 這次要做哪種顧問工作

正式 archetypes 包括：

- Diagnose / Assess
- Decide / Converge
- Review / Challenge
- Synthesize / Brief
- Restructure / Reframe
- Plan / Roadmap
- Scenario comparison
- Risk surfacing

### 3.2 Packs

Pack 回答的是：

- 哪些 context modules 要影響這次工作

Pack 正式分為：

- Domain / Functional Packs
- Industry Packs

### 3.3 Agents

Agent 回答的是：

- 誰來執行、分析、協作與收斂

Agent 正式分為：

- Host Agent
- Reasoning Agents
- Specialist Agents

正式規則：

- Capability 不是 Pack
- Pack 不是 Agent
- Domain Pack 不是 Industry Pack

### 3.4 Execution modes

Execution mode 是 Host 的 orchestration 選擇，不是產品主分類。

目前正式應維持：

- host-lightweight
- specialist
- multi-agent convergence

正式規則：

- execution mode 不可被誤寫成 ontology mode 或產品 taxonomy
- intake patterns 也不應被誤寫成 execution modes

---

## 4. Current Agent System

### 4.1 Formal agent-layer baseline

目前 Agent Layer 已正式成立：

- Agent Registry
- Agent Resolver / Selector
- task-level selected agent visibility
- task-level `selection_score / selection_signals` explainability
- omitted / deferred / escalation notes
- runtime-compatible agent selection writeback
- selected agents 對 execution path、readiness 與 deliverable shaping 的正式影響

### 4.2 Current runtime realization

catalog / management surface 維持：

- `Host + 11 個非 Host agents`

目前正式 reasoning runtime families 至少包括：

- `strategy_business_analysis`
- `operations`
- `finance_capital`
- `legal_risk`
- `marketing_growth`
- `sales_business_development`
- `research_intelligence`
- `document_communication`

目前正式 specialist runtime families 至少包括：

- `contract_review`
- `research_synthesis`
- `document_restructuring`

正式規則：

- catalog agent 與 runtime binding 命名可暫時不完全一致
- 但 selected catalog agents 與實際 runtime path 都必須可回看
- 不得再把已分化的 reasoning families 壓回 shared-runtime 最小切片

### 4.3 Agent families and responsibilities

目前正式責任面已涵蓋：

- Strategy / Decision
- Operations
- Finance / Capital
- Legal / Risk
- Marketing / Growth
- Sales / Business Development
- Research / Intelligence
- Document / Communication

以及目前已正式 shipped 的 specialist families：

- review specialists
- synthesis specialists
- restructuring specialists

後續可再擴充為更明確的 decision-support specialists 或 domain specialists，但在目前 shipped baseline 中，尚不應把這些視為已獨立成立的 specialist runtime families。

---

## 5. Research / Investigation Direction

目前正式方向不是新增平行調研 agent，而是深化既有 `research_intelligence` family。

正式方向應理解為：

> 把 `research_intelligence_agent` 深化成真正的 `Research / Investigation` lane

它應正式承接：

- research planning
- sub-question decomposition
- external source exploration
- source quality grading
- freshness handling
- contradiction handling
- evidence-gap closure
- citation-ready handoff
- uncertainty framing

它不應取代：

- Host orchestration
- final decision sign-off
- downstream synthesis specialist 的 deliverable-oriented narration

### 5.1 Research depth levels

正式 research 深度應至少區分：

- `Light`
  - 補最小可信來源與 freshness-sensitive facts
- `Standard`
  - 大多數顧問案件的預設研究層級
  - 包含 sub-questions、source grading、contradiction notes、citation-ready handoff
- `Deep`
  - 只在高價值、external-heavy、gap-heavy case 由 Host 明確升級

正式規則：

- Deep research 不是所有案件預設
- research 深度仍由 Host 決定，不由 UI 或單一 agent 自行提升

目前 first pass 產品化規則：

- 不把 research depth 暴露成首屏必選設定
- 不讓使用者先看到研究控制台或調研儀表板
- 先由 runtime / Host signals 低噪音生成 research guidance，再讓工作面用顧問語言提示下一步

目前較成熟的 research guidance 應至少再補：

- source quality summary
- freshness summary
- contradiction watchouts
- citation-ready summary
- evidence-gap closure plan

### 5.2 Research handoff boundaries

正式 handoff 規則：

- `research_intelligence` 偏 discovery / investigation / gap closure
- `research_synthesis` 偏 implication shaping / deliverable-oriented synthesis
- 當 research handoff 尚未穩定前，不應過早交給 synthesis specialist

目前 first pass 對工作面的正式表達應優先是：

- 要不要補研究
- 若要補，先查哪幾題
- 查到哪裡就先停
- 研究結果之後要先交回哪條收斂主線
- 來源品質與新鮮度怎麼看
- 哪個矛盾訊號必須保留
- citation-ready handoff 應長什麼樣
- 哪些缺口最先收斂

目前邊界也必須明確：

- Host 決定是否啟動 research lane、研究深度與 handoff 方向
- `research_intelligence` / research lane 處理公開來源、外部事實、來源品質與矛盾訊號
- consultant-facing research guidance 只是把上述判斷翻成前端低噪音提示
- 客戶內部資料、附件、會議紀錄與顧問手上原始材料，不屬於 research lane，正式應走 supplement / evidence 主鏈

---

## 6. Agent Contract System

### 6.1 Unified agent spec baseline

每個 agent 的正式 contract 至少要回答：

- 它是誰
- 它負責什麼
- 它不負責什麼
- 它在什麼 context 下最有價值
- 它合理啟動的最低條件是什麼
- 它產出什麼
- Host 何時該叫它、何時不該叫它
- 如何評估它是否做得好

### 6.2 Machine-readable subset

目前 machine-readable subset 已不只剩 name / description，而已承接：

- `agent_id`
- `agent_name`
- `agent_type`
- `description`
- `supported_capabilities`
- `primary_responsibilities`
- `out_of_scope`
- `input_requirements`
- `minimum_evidence_readiness`
- `required_context_fields`
- `output_contract`
- `produced_objects`
- `deliverable_impact`
- `writeback_expectations`
- `invocation_rules`
- `escalation_rules`
- `handoff_targets`
- `evaluation_focus`
- `failure_modes_to_watch`
- `trace_requirements`
- `version`
- `status`

### 6.3 Resolver rules

Host 在 resolver 層至少正式參考：

- capability archetype
- selected domain packs
- selected industry packs
- decision context
- readiness / evidence sufficiency
- explicit override

後續 resolver deepen 時，正式方向應是提升 explainability，不是新增 parallel routing shell。

目前已正式 shipped 的 explainability baseline 至少包括：

- selected agents 可回看 `selection_score`
- selected agents 可回看 `selection_signals`
- Host 的固定主控地位也應透過 explainability payload 被清楚寫回，而不是只留隱性保底規則

---

## 7. Current Pack System

### 7.1 Domain / Functional Packs

目前正式單人版 baseline 包含：

- `operations_pack`
- `finance_fundraising_pack`
- `legal_risk_pack`
- `marketing_sales_pack`
- `business_development_pack`
- `research_intelligence_pack`
- `organization_people_pack`
- `product_service_pack`

### 7.2 Industry Packs

目前正式單人版 baseline 包含：

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

### 7.3 Pack contract baseline

目前 Pack Layer 已正式承接：

- `Pack Spec`
- `Pack Registry`
- `Pack Resolver`
- `Pack Management Surface`
- stable API naming baseline
  - `pack_id`
  - interface ids
  - required-property ids
  - rule binding ids

### 7.4 Required-property gate

active pack 必須通過 required-property gate，否則不得被描述成正式可依賴 contract。

目前正式已成立：

- stronger domain-only gate
- stronger industry-only gate
- scored selection
- task-level `selection_score / selection_signals`
- top-score trimming
- rule-bound readiness / decision framing / deliverable shaping hints

### 7.5 Pack influence scope

pack 可正式影響：

- case world compilation
- evidence expectations
- readiness governance
- routing hints
- research focus
- decision framing
- deliverable shaping
- writeback interpretation

正式規則：

- pack influence 必須走正式 contract path
- 不可退化成 catalog copy
- 也不可越權取代 Host judgment

---

## 8. Extension Manager and Management Surfaces

### 8.1 Formal role

`Extension Manager` 屬於 Workbench / UI Layer 內的 shared management surface。

它不是：

- marketplace
- 第七層
- 新的 app shell

### 8.2 What it formally supports now

目前最小正式管理能力至少包括：

- pack catalog visibility
- agent catalog visibility
- task-level selected extension visibility
- task-level pack / agent override surface
- version / status visibility

### 8.3 Management page rules

管理面應維持：

- list-first
- filter / search / status control second
- edit side panel or secondary section
- 長說明壓縮在 disclosure，而不是與列表爭奪首屏

建立 agent / pack 時的正式規則：

- 使用者先提供最少必要資訊
- backend 再做正式 contract synthesis
- synthesis 必須走 schema validation、normalization、registry-safe write path
- management surface 應能回看這次補完至少使用了哪些來源摘要與 synthesis summary
- 建立 catalog item 不等於案件一定會使用它

### 8.4 What it should not become

正式規則：

- 不把 pack 與 agent 合併成同一 taxonomy
- 不把 selection internals 變成首頁或 matter hero 的主線
- 不把 management surface 變成 enterprise governance console

---

## 9. Current Hardening Status For Extension System

與 extension system 直接相關、且已完成的基線包括：

- Wave 4 pack contract baseline
- Wave 5 object-set baseline
- `P0-A` domain pack hardening
- `P0-B` industry packs batch 1
- `P0-C` industry packs batch 2
- `P0-D` clause / obligation set + legal / finance hardening
- `P0-E` process issue set + operations hardening

正式結論：

- extension baseline 已不再是「有 catalog 就算完成」
- 它已進入 runtime influence、deliverable shaping 與 regression verification

---

## 10. Guardrails For Future Changes

後續 extension work 必須遵守：

- Host 仍是唯一 orchestration center
- provider abstraction 不得被繞過
- 不新增第七層
- 不新增新的主導航心智
- 進階 contract metadata 只能低噪音暴露
- 若新增 agent / pack creation flow，仍必須走 backend synthesis、schema validation、normalization 與 registry-safe write path

正式規則：

- catalog creation 不等於 automatic runtime invocation
- 建立一個 agent / pack，不等於 Host 之後一定會用它
- invocation 仍由 Host 在 task / evidence / context 下判斷
- 標準建立流程應維持最少必要輸入，不應回到手動填滿 capability、pack 綁定、KPI、evidence expectations 或完整 contract 欄位
- 若未來真的需要 expert-only creation path，也必須與標準建立流程明確分流，不可重新污染一般顧問的標準操作

---

## 11. Relationship To Other Active Docs

- `docs/00_product_definition_and_current_state.md`
  承接高層產品定位、current phase decision 與 product-fit language
- `docs/01_runtime_architecture_and_data_contracts.md`
  承接 case world、persistence、provenance、provider boundary
- `docs/03_workbench_ux_and_page_spec.md`
  承接 management surface、task/matter/deliverable 中的 extension visibility 規格
- `docs/04_qa_matrix.md`
  承接已驗證的 shipped evidence
- `docs/05_benchmark_and_regression.md`
  承接 benchmark / regression suite baseline
