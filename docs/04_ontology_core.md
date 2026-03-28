# 04_ontology_core.md

> 文件狀態：Governance Reset v2.1（正式 Ontology 基底文件）
>
> 本文件支撐 Infinite Pro 的 **Single-Consultant Full-Scope Edition**，並以正式 ontology 基底作為產品主骨架。

---

## 1. 這份文件現在要解決什麼問題

本文件不再只是回答：
- 早期縮小版規劃會先問哪些物件最少需要存在

它現在要回答的是：

1. **Infinite Pro 作為單人顧問完整工作台，必須以哪些核心 objects 來理解世界？**
2. **哪些 objects 是 core，哪些是 supporting，哪些是 links？**
3. **哪些 object families 必須從第一天就被正式納入架構？**
4. **哪些 object 可以第一波先實作，哪些可以第二波實作，但仍屬正式架構的一部分？**

---

## 2. Ontology 在 Infinite Pro 的正式角色

Ontology 在 Infinite Pro 中不是：
- 資料庫同義詞
- 單純知識庫
- prompt 模板集合
- 功能列表
- mode taxonomy
- UI 欄位分類表
- deliverable 本身
- pack 本身

Ontology 是：

> **顧問工作世界的共享世界模型（shared world model）、結構化思考骨架（structured reasoning skeleton），以及承載顧問案件 objects / properties / links / actions / functions / decision context 的操作層。**

它是：
- Host Agent 的共同語義底座
- specialist / reasoning agents 的共同語義底座
- packs 的共同語義底座
- workbench UI 的共同語義底座
- deliverable generation 的來源底座

它也必須正式承接：
- canonical intake 進入同一個案件世界
- case world compilation
- evidence gaps 與 research provenance
- continuity / writeback policy 下的 decision feedback loop

它至少要同時支撐：
- 顧問案件的上下文
- 決策問題的 framing
- 文件與來源資料的映射
- evidence 到 recommendation 的分析鏈
- deliverable 的生成與保存
- specialist 與 Host 在同一語境上工作
- packs 的擴充

---

## 3. Ontology 設計原則

### 3.1 先定義完整工作世界，再決定實作順序
Ontology 的能力邊界要先完整。
不能因為第一波只實作一部分，就把正式工作世界縮小。

### 3.2 先定義 objects / links / actions，再定頁面與表單
Infinite Pro 不應只用 mode 與頁面來定義產品。

### 3.3 讓 Host 與 agents 在同一個世界工作
Ontology 是 Host orchestration 與 multiple agents 的共同語境。

### 3.4 讓 deliverable 與 history 建立在 object chain 上
Deliverable 不是 ontology 本身，而是建立在 ontology object chain 之上的可回看成果。

### 3.5 支撐 Pack Layer，而不是被 packs 取代
Pack Layer 是建立在 ontology 之上的正式擴充，不是另一套平行系統。

Pack Layer 正式包含：
- Domain / Functional Packs
- Industry Packs

### 3.6 Ontology 是操作層，不是靜態名詞表
Ontology 不只定義物件名稱，也要定義：
- 哪些 objects 可被操作
- 哪些 properties 可被讀寫
- 哪些 links 代表正式關係
- 哪些 actions / functions 能改變 decision context 與 deliverable generation

---

## 4. Ontology 與其他層的邊界

### 4.1 Ontology Layer 與 Context Layer 的差異
- Ontology Layer 定義世界中有哪些正式 objects、properties、links、actions、functions
- Context Layer 則提供本次判斷的脈絡變數，例如 client stage、client type、domain lens、goal、constraint、assumption
- Context 不是 ontology 的替代品，而是進入 ontology 操作層的正式輸入

### 4.2 Ontology Layer 與 Agent Layer 的差異
- Ontology Layer 定義 agents 共同工作的世界
- Agent Layer 則在這個世界上執行 diagnosis、review、synthesis、convergence 等能力
- Agent 不應自行發明一套平行世界模型

### 4.3 Ontology Layer 與 Pack Layer 的差異
- Ontology Layer 是共同底座
- Pack Layer 是在共同底座上的正式擴充
- Domain / Functional Packs 與 Industry Packs 都可以擴充 ontology-aware context，但不應取代 ontology

### 4.4 Ontology Layer 與 Workbench / UI Layer 的差異
- Ontology Layer 不是 UI 本身
- Workbench / UI Layer 則負責把 ontology objects、relationships、actions、deliverables 以顧問可操作的方式呈現出來
- UI 應反映 ontology，而不是反過來成為 ontology 的定義來源

---

## 5. 正式 core object families

### 5.1 Commercial / engagement objects

### Client
代表被服務的客戶主體。

### Engagement
代表一次顧問合作、案子、委託或服務關係。

### Workstream
代表 engagement 之下的子工作流、子題或顧問題組。

### Stakeholder
代表決策相關的人、角色、利害關係人。

---

### 5.2 Work orchestration objects

### Task
代表一次具體工作請求或執行單位。

### DecisionContext
代表這次到底要幫使用者做什麼判斷。
這是正式核心物件，不應只藏在 prompt 或自由文字裡。

### Goal
代表此次任務或 decision context 想達成的目標。

### Constraint
代表不可踩線的限制、前提、資源或政策條件。

### Assumption
代表目前暫時成立但尚待驗證的假設。

### Metric
代表此次判斷所依賴的衡量方式或成功標準。

### Timeline / Milestone
代表時程、節點與期限。

### Audience
代表交付物預期的閱讀者或使用者。

---

### 5.3 Material / knowledge objects

### Artifact
代表顧問工作會處理的正式材料，例如：
- 合約
- 提案
- 研究資料
- 財務表
- 制度文件
- 會議筆記
- 簡報草稿

### SourceMaterial
代表外部或內部的原始來源載體。

### Evidence
代表可用於支撐或挑戰判斷的結構化證據。

---

### 5.4 Analysis objects

### Insight
代表從 evidence 與 context 中推導出的分析洞察。

### Risk
代表對決策、執行、交付或結果的風險。

### Option
代表可比較的方案或路徑。

### Recommendation
代表顧問式建議。

### ActionItem
代表可執行下一步。

### Deliverable
代表顧問級交付成果，是可保存、回看、討論與後續使用的正式物件。

### CaseWorldDraft
代表 Host 在正式 orchestration 前，先把 intake 編譯成可治理案件世界草稿的第一階段輸出。

### EvidenceGap
代表目前案件世界中仍缺少、但對判斷有高影響的資訊缺口。

### ResearchRun / ExternalResearchRun
代表正式 research / external completion 執行紀錄。
它不是直接塞進答案的外部片段，而是會再進入 `SourceMaterial / Artifact / Evidence` 鏈的補完執行物件。

### DecisionRecord
代表正式 decision writeback 的節點，而不是一般 revision history。

### ActionPlan
代表 decision 被轉成可管理的行動方案。

### ActionExecution
代表 action plan 中某個行動的正式執行狀態。

### OutcomeRecord
代表後續觀察、結果訊號與 outcomes 的正式寫回物件。

---

### 5.5 Context extension objects

### ClientStage
正式值應使用：
- `創業階段`
- `制度化階段`
- `規模化階段`

### ClientType
正式值應至少包括：
- 中小企業
- 個人品牌與服務
- 自媒體
- 大型企業

### DomainLens
代表本次分析採用的顧問面向，如：
- 營運
- 財務
- 法務
- 行銷
- 銷售
- 募資

### Pack references
Pack 的正式定義屬於 Pack Layer，不屬於 Ontology Layer。

Ontology runtime state 可以攜帶：
- selected domain packs
- selected industry packs
- pack resolver outputs

但 pack 本身不是 ontology object family 的替代品。

---

## 6. Core objects 與 supporting objects 的區分

### 6.1 Core objects
以下物件必須從第一天就被正式納入架構：
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

### 6.2 Supporting objects
以下物件也屬正式架構，但可依實作順序分波落地：
- Goal
- Constraint
- Assumption
- Stakeholder
- Audience
- Metric
- Timeline / Milestone
- DomainLens
- ClientStage
- ClientType
- CaseWorldDraft
- EvidenceGap
- ResearchRun / ExternalResearchRun
- DecisionRecord
- ActionPlan
- ActionExecution
- OutcomeRecord

---

## 7. Core links / relationships

Infinite Pro 的 ontology 不只是一組 objects，還需要明確 links。

至少應承接以下 links：

- Client **has** Engagement
- Engagement **contains** Workstream
- Workstream **contains** Task
- Workstream **frames** DecisionContext
- Task **acts_on** Artifact
- Artifact / SourceMaterial **produce** Evidence
- Evidence **supports / weakens** Insight
- Evidence **supports / weakens** Risk
- Evidence **supports / weakens** Option
- EvidenceGap **expresses** missing facts / missing proof
- ResearchRun **produces** SourceMaterial / Artifact / Evidence
- DecisionContext **evaluates** Option
- Recommendation **addresses** DecisionContext
- Recommendation **responds_to** Risk
- ActionItem **operationalizes** Recommendation
- DecisionRecord **captures** Deliverable + Evidence basis + continuity intent
- ActionPlan **operationalizes** DecisionRecord
- ActionExecution **tracks** ActionPlan
- OutcomeRecord **feeds_back_into** DecisionContext / Evidence / Deliverable
- Deliverable **summarizes** DecisionContext + Evidence + Recommendation + Risk + ActionItem
- DomainLens / ClientStage / ClientType / selected Packs **shape** DecisionContext and Deliverable

---

## 8. 正式 ontology 主鏈

在完整單人顧問工作台前提下，主鏈不應只停留在：

> Task → Context → Evidence → Insight / Risk / Option → Recommendation → ActionItem → Deliverable

而應升級理解為：

> Client → Engagement → Workstream → Task / DecisionContext → Artifact / SourceMaterial → Evidence → Insight / Risk / Option → Recommendation → ActionItem → Deliverable

這才更符合顧問工作的真實世界。

在本次正式補完後，這條主鏈還要再加上兩個前後責任：

> Intake → CaseWorldDraft → Client / Engagement / Workstream / Task / DecisionContext → Artifact / SourceMaterial → Evidence → Insight / Risk / Option → Recommendation → ActionItem → Deliverable → DecisionRecord / ActionPlan / ActionExecution / OutcomeRecord

也就是說：
- intake 不再是 mode taxonomy，而是同一條 canonical pipeline 的不同 entry presets
- writeback 不再只等於 deliverable revision history

---

## 9. 第一波實作與第二波實作的正確區分

### 9.1 第一波實作應優先落地
- Task
- DecisionContext
- Artifact
- Evidence
- Risk
- Option
- Recommendation
- ActionItem
- Deliverable
- Goal / Constraint / Assumption
- ClientStage / ClientType / DomainLens 的基本掛載方式
- CaseWorldDraft
- EvidenceGap
- continuity / writeback policy 的正式欄位

### 9.2 第二波實作可再深化
- Client
- Engagement
- Workstream 的完整顯性化
- Stakeholder / Audience / Metric / Timeline 的完整物件化
- Pack resolver outputs 與 pack-aware links 的正式掛接
- 更細的 traceability links
- ResearchRun / ExternalResearchRun 的更完整治理
- DecisionRecord / ActionPlan / ActionExecution / OutcomeRecord 的更細 object 化

注意：
- 第二波不代表不屬於正式架構
- 只代表它們可以晚一點做成完整可操作形態

---

## 10. 對 Agent、Workbench 與 Deliverable 的約束

### 10.1 對 Host 與 agents 的約束
Host 與其他 agents 應以 ontology objects 和 links 工作，不應只吃自由文字。

### 10.2 對 workbench UI 的約束
UI 應逐步反映：
- 正在操作哪個 object
- object 之間的關係
- 現在位於哪個 decision context
- 哪些 artifacts / evidence 支撐這輪工作
- 最後形成哪份 deliverable

### 10.3 對 deliverable 的約束
Deliverable 應被視為 ontology chain 的正式成果，而不是任意長文。

### 10.4 對 intake 的約束
- `一句話問題`、`單文件進件`、`多材料案件` 只應是 entry presets
- 不可被視為 ontology 上不同案件型別
- 任何 intake 都必須先進入同一個 `CaseWorldDraft`

### 10.5 對 continuity / writeback 的約束
- `one_off`、`follow_up`、`continuous` 是案件世界的 continuity 策略，不是 UI 文案
- `minimal`、`milestone`、`full` 是正式 writeback depth，不是單純偏好設定
- 所有案件都至少要保有最小 history / traceability
- 只有 follow-up 與 continuous 案件才應逐步加深 decision feedback loop

---

## 11. 文件結論

Infinite Pro 的 ontology 不再只是早期縮小版規劃中的最小骨架。

它現在是：

> **單人顧問完整工作台的正式世界模型。**

後續實作可以分波，但所有重要 objects、links 與 context layers 都應被視為正式存在的架構邊界，而不是未來有空再補的附加想法。
