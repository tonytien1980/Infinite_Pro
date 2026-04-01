# 09_infinite_pro_core_definition.md

> 文件狀態：Baseline v2.0（高優先級正式核心準則）
>
> 本文件用於正式定義 **Infinite Pro** 的核心定位、ontology 原則、Host 與 agent 分工、Pack Layer 地位、deliverable 導向輸出原則，以及對後續設計與實作的正式約束。若後續決策與本文件衝突，應優先回到本文件檢查並修正。

---

# Infinite Pro 核心定義

## 1. 一句話定位

Infinite Pro 是一套讓顧問以最少輸入，透過 ontology 驅動的結構化思考流程、Host Agent orchestration 與多種 specialist / reasoning agents 協作，產出顧問級分析、建議、行動方案與正式交付物的工作台系統。

---

## 2. 正式產品前提

Infinite Pro 的正式產品前提是：

> **單人顧問完整工作台（Single-Consultant Full-Scope Edition）**

這代表：
- 能力邊界先完整定義
- 實作順序可以分批
- 使用拓撲先以 single-user 為主
- multi-user 與 multi-company 能力屬於後續系統層

正式規劃原則為：
- full-scope by capability
- phased by implementation order
- single-user first
- multi-user later

---

## 3. 核心產品原則

Infinite Pro 的核心原則是：

1. **ontology-first**
   - 系統分析不是靠 prompt 堆疊，而是建立在正式工作物件、屬性、關係與 decision context 上。

2. **Host 為唯一 orchestration center**
   - Host 必須負責 task framing、decision framing、workflow orchestration、evidence governance、agent coordination 與 deliverable convergence。

3. **multiple specialist agents 與 reasoning agents**
   - agent 是正式能力層，不是少數固定 flow 的暫時附屬物。

4. **modular pack system**
   - Pack Layer 是正式能力層，可擴充 ontology-aware context、heuristics、evidence expectations、decision criteria 與 deliverable patterns。
   - Pack Layer 正式拆分為：
     - Domain / Functional Packs
     - Industry Packs

5. **deliverable-centric outputs**
   - 輸出不應停在聊天式長文，而應形成可採用、可回看、可討論、可追蹤的顧問交付物。

6. **consulting workbench UI**
   - 介面應反映顧問在操作的 objects、relationships、actions、workflows 與 deliverables，而不是 generic AI workspace。
   - 前端資訊架構、頁面角色、中文化規則與 UX 驗收原則，正式由 `docs/10_frontend_information_architecture_and_ux_principles.md` 承接。
   - 正式進件模式、multi-source ingestion、storage / retention / purge 邊界，正式由 `docs/11_intake_storage_architecture.md` 承接。
   - 正文 persistence、revision、rollback、publish / artifact records、fallback / degraded mode / re-sync 邊界，正式由 `docs/12_runtime_persistence_and_release_integrity.md` 承接。

7. **canonical intake pipeline**
   - 系統只有一條 canonical intake pipeline
   - `/new` 對使用者可見的應只有一個 unified intake surface
   - `只有一句話 / 一句話 + 1 份材料 / 一句話 + 多份材料` 是系統內部判讀的 intake patterns
   - unified material area 應可逐項預覽、移除並顯示 warning / support 狀態，而不是只顯示批次總數
   - item-level status 應至少可分辨 accepted、limited support、pending parse、unsupported / rejected、failed ingest
   - item-level remediation guidance 應回答：
     - 為什麼是這個狀態
     - 這會影響什麼
     - 現在最建議怎麼補救
     - 是否有更穩定的 fallback material strategy
   - 若 remediation 已能收斂到明確 next action，則 item row 也應清楚分辨 blocking / non-blocking、retryable / non-retryable，並提供最合理的 retry / replace / remove / keep-as-reference 動作
   - 任何 intake 都必須先進入 `Case World Compiler`
   - `Case World Compiler` 之後應先形成 / 同步 `CaseWorldState`
   - `Task` 應被理解成 `CaseWorldState` 內的 work slice

8. **continuity-aware writeback**
   - 並非所有案件都需要 full continuous loop
   - 但所有案件都至少需要最小 history、evidence basis 與 deliverable lineage

9. **deeper identity / world-native continuity**
   - `CaseWorldState` 應作為 matter/world-level identity authority 持續強化
   - `Task` 應逐步退居 work slice，而不是 core business objects 的唯一 owner
   - `Client / Engagement / Workstream / DecisionContext / SourceMaterial / Artifact / Evidence`
     應逐步從 task-local persistence 過渡到 world-native continuity
- identity deepen phase 11 應明確區分：
  - canonical world rows
  - task-slice local overlay rows
  - world-authoritative core/context rows
  - 共享 continuity / local participation rows or mappings
  - compatibility-only `task_id` references
  - participation-aware upload / source / batch responses
  - delta-only `slice_decision_context`
  - canonical host payload context spine
  - canonical-first read / serialize helpers shared by aggregate / workspace / host paths
  - matter-scoped duplicate reduction contract，能區分 merge candidate / keep separate / split / human-confirmed canonical row
  - canonicalization 只在同一 matter 內成立，不可把不同案件世界的 rows 提前混成一個全域 identity 池
  - source-chain compatibility closeout 與 identity-line stop condition
  的 authority、write path 與 fallback 順序

---

## 4. Ontology 的正式角色

在 Infinite Pro 中，ontology 不是：
- 資料表或 schema 的同義詞
- 單純知識庫
- 單純分類表
- prompt 模板集合
- 功能列表
- mode 清單
- UI 本身
- pack 本身
- deliverable 本身

Ontology 是這套系統的：

> **共享世界模型（shared world model）、結構化思考骨架（structured reasoning skeleton），以及承載顧問案件 objects / properties / links / actions / functions / decision context 的操作層。**

它的正式作用包括：
- 定義系統如何理解 client、engagement、workstream、task 與 decision context
- 定義 artifact、source material、evidence、risk、option、recommendation、deliverable 之間的正式關係
- 作為 Host、specialist agents、reasoning agents、packs、workbench UI 的共同語義底座
- 作為 deliverable generation 的來源底座，而不是 deliverable 本身
- 支撐 structured outputs、history、traceability 與多 agent 收斂

請不要把 ontology 簡化成：
- 一組欄位
- 一套 mode 下拉選單
- 一組 prompt 變數
- 一份 UI 導覽表

也不要把 ontology world 按 `一句話 / 單文件 / 多材料` 拆成三個不同世界。

---

## 5. 正式主鏈與工作物件

Infinite Pro 的工作世界至少應圍繞以下主鏈理解：

> **CaseWorldState → Client → Engagement → Workstream → DecisionContext → Task(work slice) → Artifact / SourceMaterial → ChunkObject / MediaReference → Evidence → Insight / Risk / Option → Recommendation → ActionItem → Deliverable**

這條主鏈代表：
- Deliverable 不是自由文字的終點
- Recommendation / Risk / ActionItem 不是獨立散落的欄位
- 每一段輸出都應儘量能回到 shared objects 與 links
- `/new` 的 unified intake surface 不論是只有一句話、單材料起手，或多來源案件，都必須匯進這同一條 canonical intake pipeline，而不是三套互不相容的 intake 流程

在這條主鏈之前，Host 還必須先形成：
- `CaseWorldDraft`
- 並把它提升 / 同步成 `CaseWorldState`

在 bridge architecture 下，還必須誠實區分：
- 哪些 world objects 已由 `CaseWorldState` / matter spine 正式承接 authority
- 哪些物件仍由 legacy task-local persistence 提供 access path 或相容性引用

在這條主鏈之後，根據 continuity / writeback policy，系統還要能正式保留：
- `DecisionRecord`
- `ActionPlan`
- `ActionExecution`
- `OutcomeRecord`
- `AuditEvent`

Wave 1 deepen 後，這些 records 之間還應明確區分：
- 哪個 `function_type` 產生了這次 decision / outcome
- 哪個 `action_type` 承接了後續 plan / execution
- 這份內容目前是模型建議、正式核可，還是僅完成 writeback 記錄

Wave 3 deepen 後，這條主鏈還應再往前一步：
- parseable material 應能在 source-level 之下產生正式 `ChunkObject`
- limited-support / unsupported material 至少應能留下誠實的 `MediaReference`
- retrieval provenance 應能讓 evidence 與 deliverable 回看自己是被哪個 chunk / media support 撐起來的
- provenance 預設屬按需展開層，不可污染首屏主線

正式核心物件至少包括：
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
- Goal
- Constraint
- Assumption
- Stakeholder
- Audience
- CaseWorldDraft
- CaseWorldState
- EvidenceGap
- ResearchRun / ExternalResearchRun
- DecisionRecord
- ActionPlan
- ActionExecution
- OutcomeRecord

---

## 6. 系統角色分工

### Ontology
定義系統如何理解世界、任務、資料、判斷與交付，並提供共同的 objects / properties / links / actions / functions / decision context 操作層。

### Host
作為唯一 orchestration center，負責：
- 理解任務
- decision framing
- case world compilation
- workflow selection
- readiness governance
- research trigger governance
- specialist / reasoning routing
- convergence
- deliverable shaping
- continuity / writeback policy control

### Agents
提供不同專業視角或專門能力，用於：
- diagnosis
- review
- synthesis
- restructuring
- convergence
- planning
- 以及其他可擴充顧問能力

### Capability Archetypes
定義這次要做哪種顧問工作，例如：
- Diagnose / Assess
- Decide / Converge
- Review / Challenge
- Synthesize / Brief
- Restructure / Reframe
- Plan / Roadmap
- Scenario comparison
- Risk surfacing

### Pack Layer
作為正式能力擴充層，負責：
- 區分 `Domain / Functional Packs` 與 `Industry Packs`
- 提供 context modules
- 擴充 ontology-aware context、heuristics、evidence expectations、decision templates、deliverable patterns
- 影響 case world compilation、research focus 與 writeback interpretation
- 透過 registry / resolver / management surface 被治理

單人版 Pack 基本盤中的 Domain / Functional Packs 應至少包括：
- `operations_pack`
- `finance_fundraising_pack`
- `legal_risk_pack`
- `marketing_sales_pack`
- `business_development_pack`
- `research_intelligence_pack`
- `organization_people_pack`
- `product_service_pack`

單人版 Pack 基本盤中的 Industry Packs 應至少包括：
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

### Extension Manager 的正式地位
`Extension Manager` 屬於 `Workbench / UI Layer` 內的最小正式管理面。

它不是 marketplace，也不是第七層；它的責任是：
- 讓單人顧問看見可用的 packs / agents catalog
- 讓單人顧問看見本次任務實際用了哪些 packs / agents
- 讓 task-level pack / agent overrides 有正式入口
- 讓 spec / version / status 可被查看，而不是只停在 payload 或 debug metadata

### Matter / Engagement Workspace 的正式地位
在單人版範圍內，`Matter / Engagement Workspace` 已是正式工作面，而不是未來概念層。

它正式承接：
- `Client / Engagement / Workstream / DecisionContext` 的案件世界主體
- related tasks、deliverables、artifacts、source materials 的最小連續性
- workbench home -> matter workspace -> task / deliverable detail 的正式導航骨架
- 對單一顧問而言可長時間使用的案件工作上下文

### Artifact / Evidence Workspace 的正式地位
在單人版範圍內，`Artifact / Evidence Workspace` 也已是正式工作面，而不是 supporting context 或 trace panel 的延伸。

它正式承接：
- `Artifact / SourceMaterial / Evidence` 的來源世界主體
- evidence 對 recommendation / risk / action item 的最小正式支撐鏈
- evidence sufficiency、high-impact gaps、deliverable limitations 的可見治理
- matter workspace、task detail 與 deliverable lane 對來源 / 證據工作面的正式回跳與連續性
- 同一案件的正式補件主鏈、多材料清單與 retention / purge 狀態

### Deliverable Workspace 的正式地位
在單人版範圍內，`Deliverable Workspace` 也已是正式工作面，而不是 generic result page 或 task detail 結果區的延伸。

它正式承接：
- `Deliverable` 的交付物主體與 canonical display
- deliverable class、confidence / applicability、limitations、high-impact gaps 的可見治理
- deliverable 對 matter、decision context、artifact、source material、evidence、recommendation、risk、action item 的正式回鏈
- matter workspace、artifact / evidence workspace、task detail 與 deliverable workspace 的正式銜接與連續性

### Intake / Storage 邊界的正式地位
在目前單人正式 beta 階段，以下能力也應被視為正式 architecture responsibility：
- 一個 unified intake surface
- 三種由系統內部推導的 intake patterns：
  - 只有一句話
  - 一句話 + 1 份材料
  - 一句話 + 多份材料
- one canonical intake pipeline
- `Case World Compiler`
- multi-source ingestion
- raw / derived / released storage 分層
- retention / purge metadata
- metadata-only / limited support / unsupported 的正式邊界

格式支援口徑應正式理解為：
- `.md / .txt / .docx / .xlsx / .csv / text-first PDF / URL / 純文字補充`：正式支援
- `.jpg / .jpeg / .png / .webp / 掃描型 PDF`：有限支援
- 有限支援的意思是建立 metadata / reference-level record，不預設做高成本 OCR，也不宣稱與 text-first 文件同等成熟
- `.pptx`、壓縮包、批次圖片資料夾、OCR-heavy image parsing：尚未正式支援

正式規則是：
- DB 負責 structured metadata、關聯、狀態、publish / artifact record
- object storage 負責 raw materials、derived extracts、released artifacts
- raw intake file 不預設永久保存
- publish / artifact / audit record 不可跟 raw file retention 混成同一層

### continuity / writeback 的正式地位
Infinite Pro 現在正式支援：
- `engagement_continuity_mode`
  - `one_off`
  - `follow_up`
  - `continuous`
- `writeback_depth`
  - `minimal`
  - `milestone`
  - `full`
- `approval_policy`
- `approval_status`

正式規則：
- `one_off` 至少保留 history、evidence basis 與 deliverable lineage
- `follow_up` 允許 decision checkpoints 與 milestone-level writeback
- `continuous` 才要求 decision -> action -> outcome 的持續閉環
- research 與 follow-up 補件都必須回到同一個 case world，而不是浮在外面
- `one_off` 應有正式 closure / reopen 語義，而不是被 continuous UX 汙染
- `follow_up` 應有輕量 checkpoint / milestone 更新語義，而不是被迫進入完整 action-outcome tracking
- approval / audit contract 只能深化既有 writeback 主鏈，不可引入新的第七層或新的主導航心智
- `follow_up` 應讓顧問看得出上一個 checkpoint、最新更新、這次差異與下一步建議
- `follow_up` 應讓 recommendation / risk / action continuity 可見，但仍維持輕量 lane，而不是長期 CRM timeline
- `follow_up` 的補件工作面也應看得出 evidence update goal 與這次補件主要想補哪個缺口
- `continuous` 才應顯示較完整的 progression / outcome logging surface
- `continuous` 應讓顧問看得出 latest progression state、previous progression snapshot、what changed、next progression action
- `continuous` 應讓 recommendation adoption、action status、outcome signals 可見，但仍維持輕量 progression workbench，而不是 project tracker
- `continuous` 的補件工作面應說明這次主要想驗證哪個 action / outcome / recommendation，而不是 generic upload

### Persistence / Release Integrity 的正式地位
在目前單人正式 beta 階段，以下也應被視為正式 architecture responsibility：
- matter metadata 與正文的 remote-first persistence
- matter degraded mode 的 local fallback、sync state 與 re-sync
- deliverable 正文、revision、rollback、version events、publish records 與 artifact registry
- revision / version event / publish record 三層明確分工

正式規則是：
- matter degraded mode 只可作為明示 fallback，不可假裝正式成功
- deliverable 正文、發布與正式 artifact 流程必須 fail-closed
- 正文 revision 不等於 publish record
- export event 不等於正式發布

### LLM / Provider
負責語言理解、推理與生成，但不應取代 ontology、Host 與 workbench 的結構化治理角色。

### Deliverable
是顧問級產出，不只是模型回覆文字；應可被保存、回看、討論、修改與後續行動使用。

### 各層邊界的正式理解
- Ontology Layer：定義共同世界與操作語義
- Context Layer：提供本次分析與判斷所需的 stage / type / lens / goals / constraints / assumptions
- Agent Layer：在共同 ontology 上執行 diagnosis、review、synthesis、convergence 等能力
- Pack Layer：在共同 ontology 上做 domain / function / industry 的 context module 擴充
- Workbench / UI Layer：把 ontology objects、relationships、actions 與 deliverables 以可操作方式呈現

### Capability / Pack / Agent 的正式邊界
- Capability Archetypes 回答：這次要做哪種顧問工作
- Packs 回答：哪些 context modules 要影響這次工作
- Agents 回答：由誰執行、分析、協作與收斂

三者不可混為同一套 taxonomy。

### Agent Registry / Resolver 的正式地位
在正式 runtime 中，Agent Layer 不能只停留在概念層。
至少應存在：
- `Agent Registry`
- `Agent Resolver / Selector`
- selected agents writeback

也就是：
- 哪些 agents 可用
- 哪些 agents 被選中
- 為什麼被選中
- 哪些相關 agents 本輪沒有啟用
- 哪些 agents 被 deferred
- 哪些 agents 需要 escalation 才適合啟用

都應能被 aggregate、workspace 與 deliverable metadata 看見。

---

## 7. 輸出物件治理原則

Infinite Pro 的輸出不應只停留在「看起來像分析結果」的文字段落，而應盡量接近可採用的顧問交付物。

在既有 ontology 主鏈之上，`Recommendation`、`Risk` 與 `ActionItem` 應具備最低限度的可執行資訊。這些規則是正式輸出治理原則的一部分；後續若調整 schema，應做的是收斂與深化，而不是退回聊天式長文。

也就是說：
- deliverable generation 應建立在 ontology object chain 之上
- output shaping 可以調整，但不應脫離 shared world model

### Recommendation
每筆 recommendation 不應只是一句泛用建議，而應盡量具備：
- 建議內容
- 優先級
- rationale：為什麼提出這個建議
- 預期效果：若可合理推定，應說明它希望改善什麼、推動什麼或降低什麼風險

### Risk
每筆 risk 不應只是一段模糊提醒，而應盡量具備：
- 風險內容
- 嚴重度
- 影響說明：若風險發生，會對決策、執行或交付造成什麼影響
- 發生可能性：若可合理推定，應標示高低或相對機率

### ActionItem
每筆 action item 不應只是一條泛用待辦，而應盡量具備：
- 行動內容
- 優先順序
- 建議責任角色：若可合理推定，應指出較適合承接的角色
- 前置依賴或條件：若存在，應說明需先滿足哪些前提

### 輸出治理原則
- 目的不是增加無意義欄位，而是讓輸出更接近顧問級交付與可執行決策
- 若任務資料不足，可保留部分欄位為空或暫時推定，但應保留主要內容與不確定性說明
- 輸出補充欄位應延續既有 ontology 主鏈與 shared world model，不應形成另一套平行輸出宇宙
- 輸出應優先支撐決策、交付與回看，而不是只支撐模型一次性回答

---

## 8. UX 與工作台原則

Infinite Pro 的體驗原則是：
- 使用者可以用最自然、最低摩擦的方式輸入問題
- 系統應主動補齊顧問分析框架，而不是要求使用者先把框架填滿
- 工作台應優先呈現 objects、decision context、deliverables 與 supporting context
- system trace 應存在，但不應搶主閱讀層級
- 所有介面與預設輸出語言以繁體中文為預設，除非使用者明確要求英文

Infinite Pro 不應退化成：
- 純聊天機器人
- prompt 包裝工具
- generic AI workspace
- admin-first 平台
- 幾個 specialist 功能拼湊的工具箱

---

## 9. 後續實作的正式約束

未來所有功能設計、UI 調整、agent 擴充、provider 接入、knowledge ingestion、history 呈現、pack 擴充，都應回到這份核心定義檢查是否仍符合以下約束：

- 是否仍以 ontology-first 為中心
- 是否仍由 Host 作為唯一 orchestration center
- 是否仍把 agents 視為正式能力層
- 是否仍把 packs 視為正式能力層
- 是否仍把 deliverable 當正式成果物
- 是否仍在建構 consulting workbench，而不是 generic AI workspace

若某項設計會讓產品更像：
- chat-first 工具
- 功能列表導向的工具集合
- admin platform
- 單一模式下的固定流程頁

則應重新檢查並優先修正。

---

## 10. 單人版 system provider settings 的正式定位

在單人正式 beta 中，system-level provider settings 已屬於正式產品能力的一部分。

正式定位：

- 它屬於 `Workbench / UI Layer` 下的系統設定責任
- 它服務的是單一 owner 的 system-level runtime config
- 它不是 multi-user credential layer
- 它不是 enterprise admin console

正式規則：

- 同一時間只允許一個 active provider config
- 所有模型呼叫仍必須走 internal router / provider abstraction
- credential storage、provider validation、runtime precedence 應留在 backend responsibility
- frontend 只負責輸入、遮罩顯示、測試連線、儲存並套用

這一層目前正式承接的是：

- provider
- API key
- model level
- actual model id
- base URL
- timeout
- runtime config source（DB / env）
- backend-maintained provider preset 與 model mapping
- native provider route 或 compatibility route 的正式選擇

若後續調整這一層，應同步查看：

- `docs/10_frontend_information_architecture_and_ux_principles.md`
- `docs/12_runtime_persistence_and_release_integrity.md`
- `docs/13_system_provider_settings_and_credentials.md`

---

## 11. 文件結論

Infinite Pro 的正式核心，不是做出更會回答問題的 AI，而是：

> **建立一套 ontology-first、Host-orchestrated、deliverable-centric、可正式承接單一顧問完整工作世界的 consulting workbench。**
