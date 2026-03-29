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
- `CaseWorldState`
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

其中正式 runtime 理解應是：
- `CaseWorldState` 是案件世界目前的工作底座
- `Task` 是這個案件世界中的 work slice
- follow-up 補件應先更新案件世界，再決定 task / evidence / deliverable 的變化

---

## 6. 工作台的主要工作面

從 UI / workbench 角度來看，Infinite Pro 目前的正式單人版工作面應理解為：

### 6.1 Intake surface
用來接住原始問題、補充資料、外部資料策略與進階背景。

在目前單人正式 beta 階段，這個工作面已正式包含：
- 一條 canonical intake pipeline
- 一個 unified intake surface
- 三種由系統內部判讀的 intake patterns：
  - `只有一句話`
  - `一句話 + 1 份材料`
  - `一句話 + 多份材料`
- `Case World Compiler`
- `CaseWorldState` 的最小正式世界狀態
- 建立後回到同一條 matter / source material / evidence / deliverable 主鏈
- matter-level 補件入口，而不是只存在一次性上傳流程

正式理解應接近：

> `Intake -> Case World Compiler -> CaseWorldDraft / CaseWorldState -> Task slices -> SourceMaterial / Evidence -> Deliverable`

### 6.2 Matter / Engagement workspace
用來表示這次顧問案件本身與其工作脈絡。

在單人版範圍內，這個工作面現在應視為已正式成立：
- `Client / Engagement / Workstream / DecisionContext` 已成為案件工作面的主體
- 顧問可以從 workbench 進入 matter workspace，再回到相關 task / deliverable
- 同一個案件世界下的 related tasks、recent deliverables、related artifacts / source materials 已具備最小跨任務連續性
- matter 正文與摘要已具備 remote-first 正式 persistence；後端暫時不可用時，才進入明示的 degraded-mode local fallback 與 re-sync
- 這不再只是 task detail 的 object strip，而是正式案件工作面

### 6.3 Decision workspace
用來做 task framing、readiness、decision output、mode-specific sections。

### 6.4 Artifact / Evidence workspace
用來處理文件、來源、evidence、支撐鏈與缺口治理。

在單人版範圍內，這個工作面現在也應視為已正式成立：
- `Artifact / SourceMaterial / Evidence` 已成為正式工作面的主體，而不是 supporting context 附屬區塊
- 顧問可以從 matter workspace 或 task detail 進入正式來源 / 證據工作面
- evidence 對 recommendation / risk / action item 的最小正式支撐鏈已可回看
- sufficiency 與 high-impact gaps 已是正式工作面責任，而不是隱性 trace metadata

### 6.5 Deliverable workspace
用來閱讀、整理、回看與操作正式交付物。

在單人版範圍內，這個工作面現在也應視為已正式成立：
- `Deliverable` 已成為正式工作面的主體，而不是 task detail 裡的結果區塊
- 顧問可以從 matter workspace、task detail 與 artifact / evidence workspace 進入正式 deliverable workspace
- deliverable class、evidence basis、ontology linkage、limitations 與適用範圍已成為正式工作面責任
- deliverable 正文、revision history、rollback、version events、publish records 與 artifact registry 已成為正式工作面責任
- 這不再只是 generic result page，而是正式交付物工作面

### 6.6 System trace surface
用來查看 orchestration、history、ontology mapping 與工作流痕跡。

這些工作面都屬於正式系統輪廓；其中 `Matter / Engagement workspace`、`Artifact / Evidence workspace` 與 `Deliverable workspace` 在單人版範圍內已可視為正式完成的工作面。

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
9. 形成 revision、version event、publish / artifact record 與正式 history
10. 保存 supporting context 與 traceability

這條鏈代表：

> Infinite Pro 不只是回答問題，而是在完成一段正式的顧問工作流程。

若施工觸及 intake / storage / retention / purge，應同步參考 `docs/11_intake_storage_architecture.md`。
若施工觸及正文 persistence、revision、rollback、publish、artifact registry、fallback 或 re-sync，應同步參考 `docs/12_runtime_persistence_and_release_integrity.md`。

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
