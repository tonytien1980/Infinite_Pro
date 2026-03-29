# 08_codex_handoff.md

> 文件狀態：Governance Reset v2.0（Codex 正式交接文件）
>
> 本文件用於把 Infinite Pro 的最新治理原則濃縮成可直接交給 Codex 的施工指引。

---

## 1. 這份文件是拿來幹嘛的

這份文件不是願景摘要，而是：

> **讓 Codex 一進 repo，就知道 Infinite Pro 現在應以單人顧問完整工作台思維施工。**

---

## 2. Codex 必須先記住的正式前提

### 2.1 正式產品名稱
- `Infinite Pro`

### 2.2 正式產品定位
- **Single-Consultant Full-Scope Edition**

### 2.3 正式施工原則
- full-scope by capability
- phased by implementation order
- single-user first
- multi-user later

### 2.4 絕對不要再用的舊思路
- 用縮小版產品邊界當正式產品能力邊界
- 先只做少數 domain / 少數 mode 作為正式產品定義
- 把 ontology / Host / packs 當後補功能
- 把 3 個 specialist flows 當正式產品分類
- 把 4 core agents + 3 specialists 當固定上限

---

## 3. Codex 開工前必讀順序

1. `docs/00_project_vision.md`
2. `docs/01_problem_statement.md`
3. `docs/02_product_scope.md`
4. `docs/03_system_overview.md`
5. `docs/09_infinite_pro_core_definition.md`
6. `docs/10_frontend_information_architecture_and_ux_principles.md`
7. `docs/14_workbench_ui_ux_operating_principles.md`
8. `docs/15_page_level_ui_inventory_and_flow_rules.md`
9. `docs/04_ontology_core.md`
10. `docs/05_agent_architecture.md`
11. `docs/06_system_architecture.md`
12. `docs/07_implementation_order.md`
13. `docs/11_intake_storage_architecture.md` when touching intake / source / storage / retention
14. `docs/12_runtime_persistence_and_release_integrity.md` when touching revision / publish / fallback / sync recovery
15. `AGENTS.md`

如果想法與上述文件衝突，以文件為準。

另外，前端改版不得再把 Infinite Pro 做回 generic AI workspace。
首頁、導覽、工作面、管理面、歷史紀錄與繁體中文化規則，現在正式由 `docs/10_frontend_information_architecture_and_ux_principles.md` 承接。
若施工觸及 page-level 操作邏輯、資訊密度、primary action、progressive disclosure、detail workspace readability 或「現在要先做什麼」類型導引，需補讀 `docs/14_workbench_ui_ux_operating_principles.md`。
若施工觸及具體頁面的第一屏內容、頁面主任務、主按鈕、次級操作、延後揭露內容與跨頁跳轉，需補讀 `docs/15_page_level_ui_inventory_and_flow_rules.md`。
若施工觸及 canonical intake pipeline、entry presets、multi-source ingestion、storage / retention / purge 邊界，需補讀 `docs/11_intake_storage_architecture.md`。
若施工觸及正文 persistence、revision、rollback、publish / artifact records、fallback、degraded mode 或 sync recovery，需補讀 `docs/12_runtime_persistence_and_release_integrity.md`。

---

## 4. Codex 現在應如何理解 Infinite Pro

Infinite Pro 不是：
- 小型 chat app
- 少數 flow 組成的縮小版產品
- 幾個 specialist 工具拼在一起的產品

Infinite Pro 是：

> **一套完整承接單一顧問工作需求的 ontology-first consulting workbench。**

它必須正式承接：
- 顧問案件
- 決策 context
- artifact / source / evidence
- Host orchestration
- reasoning agents
- specialist agents
- packs
- deliverable-centric outputs
- history and traceability

另外，Codex 必須把以下五個能力理解為建立在同一個 ontology world model 上的同一條主鏈，而不是五個平行 feature：
- 案件世界編譯器
- Evidence chain
- Host orchestration
- 外部補完能力
- Decision writeback / feedback loop

在這裡，ontology 應被理解為：
- shared world model
- structured reasoning skeleton
- objects / properties / links / actions / functions / decision context 的操作層
- Host、agents、packs、workbench 與 deliverable generation 的共同語義底座

目前正式施工主軸還必須多記住兩件事：
- `Task` 是世界中的 work slice，不是 consultant world 的唯一主容器
- `follow-up supplement` 應先更新既有案件世界，再決定 task / evidence / deliverable 的後續變化

---

## 5. Codex 必須維持的正式六層主架構

1. Ontology Layer
2. Context Layer
3. Capability Layer
4. Agent Layer
5. Pack Layer
6. Workbench / UI Layer

另外要維持的 cross-cutting concerns：
- provider abstraction
- source ingestion
- evidence pipeline
- persistence
- history
- traceability

任何結構改動都不能把這些層從正式架構中移除。

---

## 6. Codex 應正式承接的能力邊界

### 6.1 Client stages
- 創業階段
- 制度化階段
- 規模化階段

### 6.2 Client types
- 中小企業
- 個人品牌與服務
- 自媒體
- 大型企業

### 6.3 Consulting domains
- 營運
- 財務
- 法務
- 行銷
- 銷售
- 募資
- other extensible domains

### 6.4 Core consulting capabilities
- Diagnose / Assess
- Decide / Converge
- Review / Challenge
- Synthesize / Brief
- Restructure / Reframe
- Plan / Roadmap

這些都是正式能力邊界，不是未來才想的東西。

---

## 7. Host 與 Agent 的施工原則

### 7.1 Host
Host Agent 永遠是唯一 orchestration center。

必須正式負責：
- task / decision framing
- ontology mapping
- case world compilation
- case world state promotion / synchronization
- workflow selection
- agent routing
- readiness governance
- research trigger governance
- convergence
- deliverable shaping
- continuity / writeback policy control

### 7.2 Agents
Agents 應依能力面與專業責任分類，而不是只依目前已落地 flow 命名。
目前已不只是抽象分類：
- Agent Registry / Resolver 已是正式系統骨架
- Host 已正式吃 resolver 輸出
- selected agents、selection rationale、omitted / deferred / escalation notes 應寫回 aggregate / workspace payload / deliverable metadata
- Workbench / UI Layer 內也應有最小可用的 agent visibility 與 task-level override surface

對單人版來說，Agent Orchestration 不應再被當成「後續還要更深做」的未完成主題；完成後的後續重點應轉向：
- 新 pack 與新 agent family 的擴充
- multi-user / marketplace / 組織治理

### 7.3 Pack Layer
Packs 應被視為正式能力層，不得退化為 tags。

Pack Layer 正式包含：
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
為準。

另外，Codex 必須維持三者邊界：
- Capability Archetypes = 這次要做哪種顧問工作
- Packs = 這次要套用哪些 context modules
- Agents = 誰來執行與收斂

Domain / Functional Packs 應被理解為：
- 企業常見經營問題與顧問職能面向的正式 context modules
- 會影響 evidence expectations、readiness、routing 與 deliverable hints
- 不是 agents，也不是 capability archetypes

### 7.4 Matter / Engagement Workspace
在單人版範圍內，`Matter / Engagement Workspace` 不應再被視為未來工作面或 partial object-aware deepening。

Codex 應把它理解為已完成的正式案件工作面，至少承接：
- `Client / Engagement / Workstream / DecisionContext` 的 canonical display 與導航骨架
- related tasks / deliverables / source materials 的案件連續性
- workbench home -> matter workspace -> task detail 的正式導覽鏈
- 不同 task 與 deliverable 在同一個案件世界中的最小回看脈絡

### 7.5 Artifact / Evidence Workspace
在單人版範圍內，`Artifact / Evidence Workspace` 也不應再被視為未來工作面或 supporting context 的延伸區塊。

Codex 應把它理解為已完成的正式來源 / 證據工作面，至少承接：
- `Artifact / SourceMaterial / Evidence` 的 canonical display 與正式工作面入口
- evidence 對 recommendation / risk / action item 的最小正式支撐鏈
- evidence sufficiency、high-impact gaps、deliverable limitations 的可見治理結果
- matter workspace / task detail / deliverable lane 與來源 / 證據工作面的正式銜接
- 同一案件的正式補件主鏈與多材料清單
- material support level、retention / purge 狀態與最小 traceability

### 7.6 Deliverable Workspace
在單人版範圍內，`Deliverable Workspace` 也不應再被視為未來工作面、generic result page，或 task detail 結果區的延伸包裝。

Codex 應把它理解為已完成的正式交付物工作面，至少承接：
- `Deliverable` 的 canonical display、class、status 與正式工作面入口
- deliverable 對 decision context、matter、artifacts、source materials、evidence、recommendations、risks、action items 的正式回鏈
- confidence / applicability、high-impact gaps、deliverable limitations 的可見治理結果
- matter workspace、artifact / evidence workspace、task detail 與 deliverable workspace 之間的正式回跳與連續性

### 7.7 正式進件模式與 storage 邊界
在目前單人正式 beta 範圍內，Codex 應把以下能力視為已成立的正式主鏈，而不是暫時 hack：

- `/new` 現在應只保留一個 unified intake surface
- 系統內部仍支援三種 intake patterns：
  - 只有一句話
  - 一句話 + 1 份材料
  - 一句話 + 多份材料
- 所有 intake 都必須先進入 `Case World Compiler`
- 三種 intake patterns 都應匯進同一條 `task → matter → source material / artifact → evidence → deliverable` 主鏈
- 同一個案件可持續補檔案、網址與補充文字，不可被資料模型限制成單檔心智
- unified material area 應支援 item-level preview / remove / warning，而不是只顯示批次總數
- item-level 規則應可讓使用者看出每份材料是已接受、有限支援、待解析，還是尚未正式支援
- 正式支援格式應理解為：`.md / .txt / .docx / .xlsx / .csv / text-first PDF / URL / 純文字補充`
- 有限支援格式應理解為：`.jpg / .jpeg / .png / .webp / 掃描型 PDF`
- 有限支援的意思是可建立 metadata / reference-level record，但不預設做高成本 OCR，也不宣稱與 text-first 文件同等成熟
- storage architecture 必須正式區分：
  - DB metadata
  - raw intake storage
  - derived storage
  - release artifacts
- retention / purge policy、metadata-only / limited support、digest / dedupe boundary 與成本控制邊界，現在已由 `docs/11_intake_storage_architecture.md` 正式承接

### 7.8 continuity / writeback policy
Codex 必須正式保留以下欄位與行為：

- `engagement_continuity_mode`
  - `one_off`
  - `follow_up`
  - `continuous`
- `writeback_depth`
  - `minimal`
  - `milestone`
  - `full`

正式規則：
- `one_off` 至少保留最小 history / traceability / deliverable lineage
- `follow_up` 允許 decision checkpoints 與 milestone-level writeback
- `follow_up` 的補件導引應回答 latest update、previous checkpoint、what changed、next follow-up action 與這次補件主要想補哪個 evidence gap / update goal
- `continuous` 必須能形成 decision -> action -> outcome 的最小閉環
- writeback 不是所有案件都 full，但也不可以把所有案件都做成無法回看的孤立結果

### 7.9 正式 persistence / revision / publish 邊界
在目前單人正式 beta 範圍內，Codex 也應把以下能力視為已成立的正式 runtime 邊界：

- matter metadata 與正文採 remote-first persistence
- matter degraded mode 的 local fallback、sync state 與 re-sync 規則
- deliverable metadata、正文、revision、rollback、version events、publish records、artifact registry 與正式匯出採 fail-closed 正式路徑
- revision / version event / publish record 三層分工不可混淆

上述規則現在已由 `docs/12_runtime_persistence_and_release_integrity.md` 正式承接。

---

## 8. Codex 不應再怎麼做

Codex 不應：
- 以少數已存在 flow 推回產品正式分類
- 把 object 模型降成 task form 的附屬物
- 把 UI 做成 admin panel 或 debug panel
- 把多代理與 specialist 當兩套平行產品
- 以「尚未做」為理由把正式層從架構中刪掉

---

## 9. 可以分波做，但要怎麼分

可以分的是：
- ontology object 的實作深度
- UI surfaces 的完整程度
- agent families 的落地數量
- packs 的具體數量

不可以分的是：
- 這些層是否屬於產品正式架構

---

## 10. 多人系統能力是另一層

以下屬於 multi-user system layer：
- 登入
- 權限
- 多顧問協作
- 多公司隔離
- tenant governance
- user-level credential management

它們可以後做，但不應反過來定義 Infinite Pro 是不是完整產品。

---

## 11. Codex 的施工優先順序

若要開始實作，優先順序應理解為：

1. governance alignment
2. ontology / context spine
3. Host orchestration spine
4. workbench UI surfaces
5. agent family expansion
6. pack integration
7. multi-user system layer later

---

## 12. 文件結論

Codex 應把 Infinite Pro 視為：

> **一套正式定義完整能力邊界、但按施工順序分批落地的單人顧問完整工作台。**

從這一刻起，應以完整單人顧問工作台思維規劃這個產品。

---

## 13. 系統級 provider 設定的正式邊界

目前單人正式 beta 已建立：

- `/settings` 的 `模型與服務設定`
- 單一 active provider config
- backend persisted runtime config
- `DB runtime config -> env baseline` precedence
- backend-side credential storage 與 validation
- backend-maintained provider preset 與 model level mapping
- OpenAI 官方 API 路徑
- Anthropic / Gemini 原生 API 路徑
- xAI / MiniMax 官方相容 API 路徑

正式規則：

- 這一層是 system-level owner setting，不是 user-level credential management
- 目前不做多人 / per-user / org / tenant credential scope
- frontend 不能直接呼叫 provider
- Host / agent / deliverable runtime path 仍必須透過 internal router / provider abstraction
- provider preset 的最新官方模型映射與 native / compatibility adapter 選擇，應由 backend 集中維護

若後續調整 provider preset、credential 邊界、驗證流程、env precedence 或 settings page 正式責任，應同步查看：

- `docs/12_runtime_persistence_and_release_integrity.md`
- `docs/13_system_provider_settings_and_credentials.md`
