# 05_agent_architecture.md

> 文件狀態：Governance Reset v2.1（正式 Agent 架構文件）
>
> 本文件支撐 Infinite Pro 的 **Single-Consultant Full-Scope Edition**，不再以少量 Agent 與早期 flow 當作正式產品上限。

---

## 1. 文件目的

本文件要回答的是：

1. **Infinite Pro 的 Agent Layer 在完整單人顧問版中應怎麼被定義？**
2. **Host Agent 一開始就必須負責什麼？**
3. **specialist agents 應如何分類，而不是只停在少數 flow 名稱？**
4. **Agent Layer 如何與 ontology、context、packs、deliverables 對接？**

---

## 2. Agent Architecture 的正式定位

Infinite Pro 的 Agent Architecture 不應再被理解成：
- 4 個 core agents + 3 個 specialist agents 的固定上限
- 幾條單點 flow 的集合
- 一個 Host 加幾個 prompt wrapper

而應被理解成：

> **一個由 Host Agent 進行流程治理與決策收斂，並由多個 reasoning agents 與 specialist agents 在 pack-aware context 下共同完成顧問工作的正式架構層。**

---

## 3. 設計原則

### 3.1 Host Agent 是唯一 orchestration center
Host Agent 必須是唯一流程治理中樞。

### 3.2 Agents 是能力模組，不是人格扮演
Agent 的本質是：
- 專業責任
- 可處理的 object 類型
- 可輸出的分析類型
- 可參與的 workflow

### 3.3 Agent Layer 需建立在 ontology objects 上
Agents 不應只吃 prompt 文字，而應建立在 shared objects / links / decision context 上工作。

### 3.3.1 Ontology 與 Agent 的責任不能混在一起
Ontology 負責定義共同世界與操作語義。
Agent 則負責在這個共同世界上執行分析、審閱、收斂與交付 shaping。

也就是說：
- ontology 不是 agent behavior 的同義詞
- agent 也不是 ontology 的替代品
- agent output 應來自 ontology object chain，而不是平行 prompt 宇宙

### 3.4 少量已實作，不等於正式上限
即使第一波只落地少數 agents，也不代表完整單人顧問版只需要那些 agents。

### 3.5 Packs 必須能影響 agent behavior
pack 不能只是標籤，應能正式影響：
- evidence expectations
- decision framing
- specialist routing
- deliverable shaping
- case world compilation
- research strategy
- writeback interpretation

Wave 4 之後，這種影響應優先透過正式 pack contract baseline 進入 Agent Layer：
- `evidence_readiness_v1`
- `decision_framing_v1`
- `deliverable_shaping_v1`

但正式規則仍是：
- pack contract 可以提供 hints / gates / presets
- Host 仍是唯一判斷是否採用、如何採用、以及何時覆蓋這些 contract 的 orchestration center

P0-A 之後，對 Domain / Functional Packs 的正式期待還包括：
- Host 不只讀 pack 是否 ready，也要更強地讀：
  - stage heuristics
  - KPI / operating-signal guidance
  - common risks
  - richer problem-pattern / routing-hint match
- 這些 pack contract 仍只能作為 Host framing / routing / deliverable shaping 的正式輸入
- 它們不能直接取代 Host judgment，也不能把 Agent Layer 和 Pack Layer 混成同一類 taxonomy

Wave 5 之後，Agent Layer 也應理解：
- `ObjectSet` 屬於 Ontology Layer 的正式 primitive，不屬於 Agent Layer
- 但 Host 可正式消費 object-set summary 來理解：
  - 哪組 evidence 已被納入某份 deliverable 的 support bundle
  - 哪組 risks 已被整理成這輪工作的 focus grouping
- 這種 set-aware framing 仍屬 Host orchestration / deliverable shaping 的一部分，不可讓 UI-only grouping 直接取代 Host judgment

---

## 4. Agent Layer 正式分層

## 4.1 Host Agent Layer
只有一個 Host Agent。

## 4.2 Reasoning Agent Layer
承接跨領域、多視角、決策導向分析。

## 4.3 Specialist Agent Layer
承接單點高頻任務與專門工作。

## 4.4 Pack-aware execution behavior
讓特定 domain / function / industry / stage context 能覆蓋 reasoning 與 specialist 行為。

---

## 5. Host Agent 的正式責任

Host Agent 一開始就必須負責：

1. **task / decision interpretation**
   - 解析 Task、DecisionContext、Goal、Constraint、Assumption、Audience

2. **ontology mapping**
   - 把使用者原始問題映射進 shared objects / links / actions / decision context

3. **case world compilation**
   - 所有 intake 都必須先形成 `case_world_draft`
   - `只有一句話 / 一句話 + 1 份材料 / 一句話 + 多份材料` 只應是系統判讀的 intake patterns，不可當成三種 ontology worlds
   - 編譯結果應先提升 / 同步成 `CaseWorldState`
   - 後續才決定要在這個世界中建立或推進哪些 task slices

4. **workflow orchestration**
   - 判斷應採用什麼工作 archetype
   - 判斷應用哪種 execution mode

5. **specialist / reasoning routing**
   - 決定需要哪些 agent 參與
   - 決定輸入 payload 與協作順序

6. **readiness governance**
   - 判斷背景、artifact、evidence 是否足夠
   - 明確標記不確定性與資料缺口

7. **domain / pack / stage awareness**
   - 結合 DomainLens、ClientStage、ClientType、selected domain packs、selected industry packs 調整分析重心
   - 若 selected packs 已具備正式 interface / rule binding，Host 應把它們視為正式 runtime contract，而不是純文字備註

8. **research trigger governance**
   - 根據 evidence gaps、pack expectations 與外部補完需求決定是否啟動 research
   - research 不可直接偷塞進最終答案，而要先落回 `SourceMaterial / Artifact / Evidence` 鏈

9. **convergence**
   - 整理 Insight、Risk、Option、Recommendation、ActionItem
   - 形成 deliverable-centric output
   - 但 deliverable generation 的來源底座仍是 ontology，而不是 Host 臨時拼裝的自由文字

10. **continuity / writeback policy control**
   - 根據 `engagement_continuity_mode` 與 `writeback_depth` 控制 decision writeback 深度
   - `one_off` 不應被強迫建立完整 continuous loop
   - `continuous` 必須能支撐 decision -> action -> outcome 的最小閉環

11. **writeback contract framing**
   - Host 必須把本輪輸出對應到正式的 `function_type / action_type`
   - Host 必須區分「模型建議已產生」與「正式核可已成立」
   - Host 不可把 model run success 直接等同於 approval success
   - Host 寫回時應同步留下最小 `AuditEvent`

12. **world-first follow-up governance**
   - follow-up supplements 應先更新既有 `CaseWorldState`
   - 再決定是刷新既有 task slice、建立新的 task slice，或只更新 evidence / deliverable context

13. **history writeback**
   - 將本輪執行與交付結果寫回系統歷史

Host Agent 不是最後才來做摘要的總結員，而是全流程治理者。
這也包括：把既有 writeback records 補成更正式的 action / function / approval / audit contract，而不是讓 UI 或單一 model 回傳結果自行決定它們的正式地位。

---

## 6. Reasoning agents 的正式分類

Reasoning agents 不應只用少數固定名稱思考，而應先用能力面分類。

至少應保留以下 reasoning families：

### 6.1 Strategy / Decision
- 問題拆解
- 選項比較
- 優先順序
- 決策收斂

### 6.2 Operations
- 執行可行性
- 流程與依賴
- 資源配置
- 落地風險

### 6.3 Finance / Capital
- 財務結構
- 現金流
- 單位經濟
- 募資與資本配置

### 6.4 Legal / Risk
- 法務邊界
- 合規與責任
- 條款風險
- 風險挑戰

### 6.5 Marketing / Growth
- 市場訊號
- 品牌與訊息
- 成長與 demand 假設

### 6.6 Sales / GTM
- 客戶路徑
- 銷售流程
- 成交阻力
- go-to-market 選擇

### 6.7 Research / Insight
- 外部研究
- 資訊綜整
- pattern finding

### 6.8 Communication / Narrative
- 提案結構
- 文件重組
- 對不同 audience 的表達重塑

第一波可以先落地其中一部分，但架構上不應把其餘能力排除在外。

第一批正式 agent 範圍至少應保留：
- `Host Agent`
- `Strategy / Decision Agent`
- `Operations Agent`
- `Finance Agent`
- `Legal / Risk Agent`
- `Marketing / Growth Agent`
- `Sales / Business Development Agent`
- `Research / Intelligence Agent`
- `Document / Communication Agent`

---

## 7. Specialist agents 的正式分類

Specialist agents 不應只被定義為目前已存在的 3 個 flow。

應先從工作型態分類：

### 7.1 Review specialists
- contract review
- proposal review
- financial model review
- governance / SOP review

### 7.2 Synthesis specialists
- research synthesis
- meeting synthesis
- market brief generation
- evidence consolidation

### 7.3 Restructuring specialists
- document restructuring
- proposal reframing
- board memo restructuring
- founder narrative restructuring

### 7.4 Decision-support specialists
- scenario comparison
- roadmap drafting
- action plan shaping
- issue prioritization

### 7.5 Domain specialists
- legal
- finance
- fundraising
- operations
- marketing
- sales

目前已落地的 specialist 只是這個正式分類下的第一波 exemplars。

---

## 8. Execution modes 與 consulting capability 的區分

Agent 架構不應再把 mode 與產品分類混在一起。

同樣地，也不應把 mode taxonomy 誤當成 ontology 本身。
mode 與 capability 是在 ontology world model 上執行的工作方式，不是世界模型本體。

同樣地，`只有一句話 / 一句話 + 1 份材料 / 一句話 + 多份材料` 也不應再被視為 ontology modes，而只能是 canonical intake pipeline 內部推導出的 intake patterns。

應區分：

### 8.1 Consulting capability archetypes
- Diagnose / Assess
- Decide / Converge
- Review / Challenge
- Synthesize / Brief
- Restructure / Reframe
- Plan / Roadmap

### 8.2 Execution modes
- host-lightweight
- specialist
- multi-agent convergence

Execution mode 是 Host 的 orchestration 選擇，不是產品主分類。

---

## 9. Capability、Pack 與 Agent 的責任邊界

### 9.1 Capability Archetypes
Capability Archetypes 定義的是：
- 這次要做哪種顧問工作
- 例如 Diagnose / Assess、Review / Challenge、Synthesize / Brief、Plan / Roadmap

### 9.2 Packs
Packs 定義的是：
- 這次工作要套用哪些 context modules
- 並正式分為：
  - Domain / Functional Packs
  - Industry Packs

目前單人版 Pack 基本盤中的 Domain / Functional Packs 應以：
- `operations_pack`
- `finance_fundraising_pack`
- `legal_risk_pack`
- `marketing_sales_pack`
- `business_development_pack`
- `research_intelligence_pack`
- `organization_people_pack`
- `product_service_pack`

目前單人版 Pack 基本盤中的 Industry Packs 應以：
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

### 9.3 Agents
Agents 定義的是：
- 誰來執行或收斂這次工作
- 包含：
  - Host Agent
  - Reasoning Agents
  - Specialist Agents

Pack 不是 Agent。
Agent 不是 Capability Archetype。
Domain / Functional Pack 不是 Industry Pack。

## 10. Packs 如何進入 Agent Layer

Packs 必須能正式影響 agent behavior，例如：
- 哪些 evidence 是必要的
- 哪些風險類型要優先看
- 哪些 deliverable sections 要優先形成
- 哪些 specialists 應被優先調用
- 哪些 decision criteria 要被套用
- research 要先補哪些方向
- writeback 要保留哪些 continuity 節點

所以 Agent Layer 要能讀取 pack-aware context，而不是永遠只跑通用 prompt。

Pack 也必須正式進入以下五個核心能力：
1. case world compilation
2. evidence expectations
3. readiness governance
4. research trigger / focus
5. deliverable shaping 與 writeback interpretation

---

## 11. Agent Spec / Registry / Resolver / Management Surface

### 11.1 Agent Spec
每個 agent 至少應有正式 spec，包含：
- `agent_id`
- `agent_name`
- `agent_type`
  - `host`
  - `reasoning`
  - `specialist`
- `description`
- `supported_capabilities`
- `relevant_domain_packs`
- `relevant_industry_packs`
- `input_requirements`
- `output_contract`
- `invocation_rules`
- `escalation_rules`
- `version`
- `status`
  - `draft`
  - `active`
  - `inactive`
  - `deprecated`

### 11.1.1 統一 Agent Spec Baseline
為了避免 agent catalog 變成只剩名稱與描述的鬆散清單，所有現有與未來新增 agents 都應以同一個 baseline 規格撰寫。

正式 baseline 應至少回答以下八個問題：

1. **這個 agent 是誰**
   - `agent_id`
   - `agent_name`
   - `agent_type`
   - `version`
   - `status`

2. **這個 agent 到底負責什麼**
   - `description`
   - `primary_responsibilities`
   - `supported_capabilities`

3. **它不負責什麼**
   - `out_of_scope`
   - `defer_rules`

4. **它在什麼 context 下最有價值**
   - `relevant_domain_packs`
   - `relevant_industry_packs`
   - `preferred_execution_modes`

5. **它需要吃進哪些東西才算合理啟動**
   - `input_requirements`
   - `minimum_evidence_readiness`
   - `required_context_fields`

6. **它產出什麼，而且產出要如何進入正式主鏈**
   - `output_contract`
   - `produced_objects`
   - `deliverable_impact`
   - `writeback_expectations`

7. **Host 何時應叫它，何時不該叫它**
   - `invocation_rules`
   - `defer_rules`
   - `escalation_rules`
   - `handoff_targets`

8. **怎麼判斷它做得好不好**
   - `evaluation_focus`
   - `failure_modes_to_watch`
   - `trace_requirements`

### 11.1.2 目前 machine-readable subset 與正式 baseline 的關係
目前 registry 中已正式落地的 machine-readable subset，已至少包括：
- `agent_id`
- `agent_name`
- `agent_type`
- `description`
- `supported_capabilities`
- `relevant_domain_packs`
- `relevant_industry_packs`
- `primary_responsibilities`
- `out_of_scope`
- `defer_rules`
- `preferred_execution_modes`
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

這代表：
- 目前 runtime / resolver / management surface 已經不只停在最小 spec 骨架
- 之後新增 agent 時，設計與文件仍不應退回只剩 `agent_id / description` 的薄 catalog
- 新增 agent 的設計審查，應以完整 baseline 為準，並同步檢查 management surface、selected-agent payload 與 Host writeback 是否一致

### 11.1.3 後續新增 agent 的最低交件標準
未來若要新增任何一個 agent，不論是 reasoning 或 specialist，至少應同時交付：
- 一份符合統一 Agent Spec Baseline 的文件規格
- registry / resolver 對應條目
- Host selection / omission / defer / escalation 邏輯
- 最小 management surface visibility
- 至少一條測試用例，驗證它不只是 catalog 可見，而是真的影響 execution path 或 writeback

若管理面採用「精簡建立」流程，正式規則應是：
- 一般使用者先提供最少必要資訊
- backend 再用目前生效的 provider 與外部搜尋結果生成第一版正式 contract 草案
- 生成結果仍必須回到統一 Agent Spec Baseline 驗證，而不是直接繞過正式欄位定義
- management surface 應能回看這次補完的搜尋查詢、來源摘要與 generation notes，避免「系統自動補齊」變成不可審視的黑箱

更精確地說，標準使用者流程不應要求顧問先手動定義：
- `supported_capabilities`
- `relevant_domain_packs`
- `relevant_industry_packs`
- `agent_type`
- 逐欄 technical contract 欄位

這些欄位應先由 backend synthesis path 推導，再回到正式 baseline 中被驗證與正規化。

### 11.1.4 Agent synthesis guardrails
當 Agent 由「精簡建立 -> AI + 搜尋補完」生成時，backend 至少應提供以下 guardrails：

1. **固定 contract schema**
   - 模型不應自由輸出任意欄位
   - 所有結果都必須回到正式 Agent Spec Baseline

2. **受控推導欄位**
   - `agent_type`
   - `supported_capabilities`
   - `relevant_domain_packs`
   - `relevant_industry_packs`
   這些可以由模型推導，但不可跳過正式驗證

3. **post-synthesis normalization**
   - capability ids 應限制在正式 Capability Archetype 集合內
   - pack ids 應限制在正式 Registry 既有 pack ids 內
   - 不合法值應被清理、回退或保守降級，而不是直接寫進 registry

4. **Host-centered governance**
   - 建立一個 agent contract，不等於之後每個案件都必然啟用它
   - 是否真正拉入案件流程，仍應由 Host 在 task / pack / evidence / readiness context 下判斷
   - Agent creation 是 catalog / capability governance；Agent invocation 是 Host orchestration

### 11.2 Agent Registry
系統應有正式 registry 來表達：
- 有哪些 agents 存在
- 哪一個是唯一 Host Agent
- 哪些 agents 可被 Host 調用
- 哪些 agents 屬於 `draft / active / inactive / deprecated`

目前第一版正式落地應至少做到：
- Host 能直接讀取 Agent Registry
- aggregate / workspace payload 能回傳 selected agents
- deliverable metadata 能寫回本輪實際選用的 agents 與理由
- omitted / deferred / escalation notes 能成為正式 writeback 結果

### 11.3 Agent Resolver / Selector
Host 應根據以下輸入決定 agent 組合：
- capability archetype
- selected domain packs
- selected industry packs
- decision context
- readiness / evidence sufficiency
- explicit override

在單人版正式範圍內，Agent Resolver / Selector 應已完成以下能力：
- reasoning agents 與 specialist agents 的正式 selection
- omitted / deferred / escalation notes
- runtime-compatible agent selection writeback
- selection 對 execution path、readiness governance 與 deliverable shaping 的正式影響

### 11.3.1 目前 runtime realization（2026-03 baseline）
目前單人版正式 runtime 應理解為：
- catalog / management surface 維持 `Host + 11 個非 Host agents`
- Host 仍是唯一 orchestration center
- reasoning / specialist selection 仍以 catalog agent ids、resolver notes、omitted / deferred / escalation notes 為正式治理語義
- 但 runtime execution path 已不再停留在早期的 `4 core + 3 specialist` 最小驗證切片

目前正式 runtime baseline 至少包括以下 reasoning runtimes：
- `strategy_business_analysis`
- `operations`
- `finance_capital`
- `legal_risk`
- `marketing_growth`
- `sales_business_development`
- `research_intelligence`
- `document_communication`

目前正式 specialist runtimes 至少包括：
- `contract_review`
- `research_synthesis`
- `document_restructuring`

正式理解應是：
- catalog agent 與 runtime binding 在命名上可以暫時不是 1:1
- 但 Host 必須把 selected catalog agents 與實際 runtime path 一起寫回 aggregate / workspace payload / deliverable metadata
- 目前 reasoning families 應優先對齊成 dedicated runtime path，而不是再退回 shared-runtime 最小切片
- 後續擴充的優先順序，應是補強各 runtime 的能力深度與 eval，而不是重新壓縮 catalog agent family

### 11.4 Agent Management Surface
單人版最小管理能力應能讓顧問：
- 查看 agent 列表
- 查看 agent spec
- 知道這次任務用了哪些 agents
- 指定 / 覆寫預設 agent 組合
- 查看 agent 版本與狀態

目前第一版正式落地應至少包含：
- Agent Registry catalog visibility
- task-level selected agents visibility
- task-level agent override surface
- version / status visibility
- 精簡建立模式下的 AI + 搜尋 contract synthesis 可見性：
  - 使用了哪一組搜尋查詢
  - 補入了哪些外部來源
  - 這次草案的 synthesis summary / generation notes 是什麼

標準使用者管理面不應預設暴露：
- capability 勾選器
- pack 綁定勾選器
- 完整 agent contract 的逐欄手動編輯表單

因為這些屬於 contract internals，不應要求一般顧問在建立第一步就自己定義。

全域啟用 / 停用與更完整治理介面，可留到後續 manager / marketplace 擴張再處理。

---

## 12. Research / Investigation Agent 的正式深化方向

目前正式對應角色應以現有 `research_intelligence_agent` 為主體深化，而不是先新增第 12 個非 Host agent。

原因是：
- 它目前已經位於 Reasoning Agent Layer 內的 `Research / Insight` family
- 它本來就應承接外部研究、來源品質、證據缺口與不確定性 framing
- 若再新增一個平行「調研 agent」，很容易與 `research_synthesis_specialist` 與 Host 的 research trigger governance 重疊

因此，正式方向應是：

> **把 `research_intelligence_agent` 深化成真正的 Research / Investigation Agent。**

### 12.1 正式責任邊界
這個 agent 應正式負責：
- research planning
- 子問題拆解
- 外部來源探索
- 來源品質分級
- freshness 檢查
- 矛盾訊號標記
- evidence gap closure
- citation-ready handoff
- uncertainty framing

它不應直接負責：
- 最終結論拍板
- 取代 Host 做 workflow orchestration
- 取代 `research_synthesis_specialist` 做完整敘事型下游綜整
- 把搜尋結果直接塞進最終 deliverable 當成已驗證事實

### 12.2 三級調研模型
調研 agent 的正式研究深度應分三級：

#### 12.2.1 Light completion
適用於：
- freshness 敏感但問題相對單純
- 只需要補 1 到 3 個高權威來源
- evidence gap 明確且範圍窄

正式責任：
- 補最小可信來源
- 回答最新狀態 / 是否已變動
- 標示明顯 evidence gap

#### 12.2.2 Standard investigation
適用於：
- 大多數顧問案件的外部補完
- 問題需要拆成數個研究子題
- 需要處理來源品質、矛盾訊號與 citation handoff

正式責任：
- 子問題拆解
- 來源分級
- freshness / quality / coverage 標記
- contradiction notes
- evidence map
- citation-ready handoff

這應是大多數案件的預設研究層級。

#### 12.2.3 Deep research
適用於：
- sparse、open-ended、外部依賴高
- pack evidence expectations 很強
- 單案價值高，值得承受更高 latency / token / orchestration 成本

正式責任：
- 多輪研究規劃
- 多個研究子題的擴展探索
- gap-oriented follow-up search
- 更完整的 evidence map / contradiction map / uncertainty boundary

正式原則：
- Deep research 不是預設
- 必須由 Host 明確升級
- 不應在所有案件中常態啟動

### 12.3 正式輸出契約
Research / Investigation Agent 的正式輸出，不應只剩一般 findings / recommendations。

它至少應能正式形成：
- `ResearchRun / ExternalResearchRun`
- `SourceMaterial`
- `Evidence`
- `EvidenceGap`
- `SourceQualityNote`
- `FreshnessNote`
- `ContradictionNote`
- `EvidenceMap`
- `citation_ready_handoff`

正式主鏈應理解為：

> `ResearchRun -> SourceMaterial -> Evidence -> EvidenceGap -> Host / other reasoning agents / specialist handoff`

### 12.4 正式 evaluation focus
這個 agent 的評估不應只看「有沒有找到資料」，還應至少看：
- query / sub-question decomposition quality
- source quality classification quality
- freshness handling
- contradiction handling
- evidence-gap precision
- citation handoff usability
- 是否把弱訊號誤包裝成高信心結論

---

## 13. 與 Host / specialist / other reasoning agents 的正式分工草案

### 13.1 與 Host 的分工
Host 仍是唯一 orchestration center。

Host 應負責：
- 判斷是否需要 research
- 決定 research 深度是 `Light / Standard / Deep`
- 決定何時停止 research 並進入 convergence
- 決定研究結果如何影響 selected agents 與 deliverable shaping

Research / Investigation Agent 應負責：
- 把 research 本身做乾淨
- 把來源、證據、缺口與 citation handoff 整理好
- 不直接越權下最終結論

### 13.2 與 `research_synthesis_specialist` 的分工
`research_synthesis_specialist` 應視為：
- 在研究材料已相對齊備後
- 將 findings / implications / gaps 整理成 decision-useful brief 的 specialist

因此兩者邊界應是：
- `research_intelligence_agent` 偏 discovery / investigation / evidence gap closure
- `research_synthesis_specialist` 偏 synthesis / implication shaping / deliverable-oriented summarization

正式 stop condition 應是：
- 當研究主鏈仍未穩定時，不應過早交給 `research_synthesis_specialist`
- 當 research handoff 已足夠支撐敘事整理時，才交給 `research_synthesis_specialist`

### 13.3 與其他 reasoning agents 的分工
其他 reasoning agents 應消費 research agent 整理過的正式輸出，而不是各自直接重做一輪薄搜尋。

正式理解應是：
- `strategy_decision_agent` 消費 research implications 與 uncertainty framing
- `finance_agent` 消費 market / benchmark / capital / external signal evidence
- `legal_risk_agent` 消費法規 / 政策 /責任邊界 research results
- `marketing_growth_agent` 消費 audience / channel / competitor / market-signal evidence
- `sales_business_development_agent` 消費 GTM / partner / market-access evidence
- `document_communication_agent` 消費 citation-ready handoff 與 provenanced findings

也就是說：
- research agent 不應取代它們的專業判斷
- 但應成為外部 research provenance 的正式上游

---

## 14. Host 與其他 agent 需要同步調整的地方

若要正式深化 `research_intelligence_agent`，至少要同步調整以下部分：

### 14.1 Host research trigger governance
目前 Host 對外部 research 的理解仍偏向：
- 要不要 search
- 補幾筆公開來源

後續應提升為：
- 要不要 research
- research 的深度級別
- research 的子問題範圍
- 何時停止 research
- 哪些 gaps 還必須保留到 deliverable limitations

### 14.2 Host readiness governance
目前 readiness 需要能更正式回答：
- 這輪缺的是一般資料，還是 research-specific evidence gap
- 目前適合 `Light / Standard / Deep` 哪一級 research
- 哪些 agent 應該先 defer，等 research handoff 完成再進入

### 14.3 Research provenance writeback
目前 research writeback 雖已存在，但仍偏 `Host external completion`。

後續應進一步區分：
- Host-triggered research
- investigation depth
- query plan / sub-questions
- source quality summary
- contradiction summary
- evidence gap summary
- citation handoff summary

### 14.4 Agent Resolver / Selector
Resolver 後續應不只選到 `research_intelligence_agent` 本身，還應讓以下因素真正影響 selection：
- pack evidence expectations
- freshness sensitivity
- sparse-input external-heavy cases
- contradiction-heavy cases
- company-specific certainty 尚不足的情況
- 並以更正式的 relevance score / matched signals 呈現選擇強弱，而不是只留下薄的 resolver note

### 14.5 Specialist handoff
`research_synthesis_specialist` 的啟動條件應更明確依賴：
- research handoff completeness
- evidence coverage
- contradiction status
- citation readiness

### 14.6 Management Surface / Workbench visibility
前端至少應逐步看得到：
- 這輪 research depth 是哪一級
- research run 現在在做什麼
- 補了哪些來源
- 哪些來源可信度較高
- 還缺哪些 evidence gaps
- 是否已達 citation-ready handoff
- Host 目前的調研委派狀態、交回對象與停止條件
- 為什麼是這些 packs / agents 被排在前面，以及各自命中了哪些 selection signals

---

## 15. 建議實作順序

若後續正式落地，建議順序如下：

### 15.1 第一階段：規格與治理對齊
- 統一 Agent Spec Baseline
- 明確定義 Research / Investigation Agent 的責任邊界
- 明確定義 Host / specialist handoff 邊界

### 15.2 第二階段：Host 與 research orchestration 深化
- Host research trigger governance
- research depth selection
- research provenance writeback enrich
- resolver / readiness synchronization

### 15.3 第三階段：runtime 與 UI 落地
- 深化 `research_intelligence` runtime
- 調整 `research_synthesis_specialist` handoff
- 補 task / matter / evidence surfaces 的 research visibility

### 15.4 第四階段：eval 與 hardening
- 加 research-depth routing tests
- 加 source quality / contradiction / evidence-gap writeback tests
- 加 UI visibility regression tests

---

## 16. 第一波實作與第二波實作

### 10.1 第一波實作可優先落地
- Host Agent
- 少數 reasoning agents
- 少數 specialist agents
- 基本 pack-aware hooks
- 基本 execution modes
- Case World Compiler
- research provenance writeback
- continuity / writeback policy hooks

### 10.2 第二波實作可再擴充
- 更完整的 reasoning families
- 更完整的 domain specialists
- 更明確的 pack-aware routing
- 更細的 workflow chains

但這不表示第二波內容不屬於正式架構。

---

## 17. 對後續實作的約束

後續實作時，不應再：
- 把 4 core agents + 3 specialist agents 視為固定上限
- 把 specialist flow 名稱直接當產品主分類
- 把 Host Agent 降成最後的文案整理員
- 把 packs 視為後補標籤
- 把已經對齊好的 agent family 다시壓縮回較少的 shared runtime 名稱

後續應做的是：
- 讓 Host 真正控制能力選擇與收斂
- 讓 agent families 與 ontology / context / pack 結構對齊
- 讓 specialist agents 成為正式可擴充能力，而不是零散功能
- 讓 research、decision writeback 與 continuity policy 一起進入 Host 的正式責任範圍
- 讓所有新增 agents 都遵守統一 Agent Spec Baseline，而不是只補一段 description

---

## 18. 文件結論

Infinite Pro 的 Agent Architecture 現在應被視為：

> **支撐完整單人顧問工作範圍的正式能力層。**

少量 agent 的第一波實作只是技術 rollout 順序，不再代表產品正式能力邊界。
