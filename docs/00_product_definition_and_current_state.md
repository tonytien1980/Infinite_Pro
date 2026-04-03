# 00 Product Definition and Current State

> 文件狀態：Active source of truth
>
> 本文件是 Infinite Pro 目前的最高層 active 產品文件。它用現在已 shipped、已 hardening、已與程式碼對齊的產品現況，重新定義產品定位、能力邊界、適配案型、當前缺口與目前階段決策。

---

## 1. Purpose

本文件回答：

1. Infinite Pro 現在到底是什麼產品
2. 它的正式能力邊界在哪裡
3. 現在已正式成立的能力是什麼
4. 它目前最適合承接哪幾類顧問工作
5. 這個階段之後不該再怎麼做

本文件不處理細部 runtime schema、page-level UI 規格或 QA append-only 證據。這些分別由 `docs/01_runtime_architecture_and_data_contracts.md`、`docs/03_workbench_ux_and_page_spec.md`、`docs/04_qa_matrix.md` / `docs/05_benchmark_and_regression.md` 承接。

---

## 2. Formal Product Identity

Infinite Pro 的正式定位仍然是：

> **Single-Consultant Full-Scope Edition**

正式規劃原則仍然是：

- full-scope by capability
- phased by implementation order
- single-user first
- multi-user later

正式理解是：

- 產品能力邊界從一開始就承接單一顧問的完整工作世界
- 技術落地可以分波，但不能以縮小版產品重新定義產品
- multi-user、multi-consultant、multi-tenant 與 enterprise governance 是後續 system layer，不是產品定義本身

---

## 3. What Infinite Pro Is and Is Not

Infinite Pro 不是：

- 顧問訓練平台
- generic chatbot wrapper
- prompt-packaging utility
- generic enterprise admin console
- 幾條 specialist flow 拼成的工具集合
- benchmark / ontology / trace metadata 為主體的控制台

Infinite Pro 是：

- ontology-first consulting workbench
- Host-orchestrated decision system
- evidence-linked, deliverable-centric 顧問工作底座
- 一套已正式承接單人顧問完整能力邊界的工作台產品

這個產品的中心不是「更多頁面」或「更多模型能力」，而是：

> 在同一套案件世界中，把 intake、evidence、decision、deliverable、history 與 continuity 串成可正式運作的顧問工作主鏈。

---

## 4. Full-Scope Capability Boundary

### 4.1 Client stages

- `創業階段`
- `制度化階段`
- `規模化階段`

### 4.2 Client types

- 中小企業
- 個人品牌與服務
- 自媒體
- 大型企業

### 4.3 Consulting domains

- 營運
- 財務
- 法務
- 行銷
- 銷售
- 募資
- 以及其他可擴充顧問面向

### 4.4 Consulting capabilities

- Diagnose / Assess
- Decide / Converge
- Review / Challenge
- Synthesize / Brief
- Restructure / Reframe
- Plan / Roadmap
- Scenario comparison
- Risk surfacing
- Deliverable shaping

正式規則：

- 這些能力已屬正式產品邊界
- implementation order 不得被誤讀成 capability boundary reduction

---

## 5. Formal Architecture Boundary

Infinite Pro 的正式主架構仍然只有六層：

1. Ontology Layer
2. Context Layer
3. Capability Layer
4. Agent Layer
5. Pack Layer
6. Workbench / UI Layer

Cross-cutting 正式責任包括：

- canonical intake
- source ingestion
- evidence / provenance
- persistence / history
- traceability
- provider abstraction
- deliverable-centric outputs

正式規則：

- 不得新增第七層架構
- 不得把既有 layer 降回「之後再補」

---

## 6. Core Use Cases

Infinite Pro 目前正式承接的核心使用情境包括：

- 案件與決策工作
  - 客戶需求理解
  - 問題 framing
  - 決策比較與收斂
  - 風險辨識
  - 行動規劃
- 審閱與挑戰工作
  - 合約審閱
  - 提案審閱
  - 制度文件審閱
  - 財務或募資材料審閱
  - 策略與執行假設挑戰
- 研究與整理工作
  - 市場研究整理
  - 會議材料整理
  - 跨來源資訊綜整
  - decision brief 形成
- 重組與交付工作
  - 文件重構
  - 提案重組
  - decision memo
  - roadmap / action plan
  - 顧問交付物整理

---

## 7. Long-Term Product Shape

Infinite Pro 的長期形態不是單一工具頁面，而是一套 object-aware、workflow-aware、deliverable-aware 的 consulting workbench。

它的正式工作面現在應理解為：

- intake surface
- matter / engagement workspace
- decision workspace
- artifact / evidence workspace
- deliverable workspace
- management surfaces
- history surface
- system settings

正式規則：

- workbench 應圍繞 object chain 與 decision flow 展開
- 不可退回 generic AI workspace、consumer app 或 admin-first shell

---

## 8. Single-User Boundary vs Later System Layers

目前正式屬於產品邊界的包括：

- ontology-first object model
- Host orchestration
- multiple agents
- Pack Layer
- consulting workbench UI
- source / evidence / history / traceability
- provider abstraction
- continuity / writeback baseline

後續 system layer 才處理的包括：

- login / auth
- RBAC
- 多顧問協作
- 多公司同步與隔離
- multi-tenant governance
- enterprise admin console
- per-user credential management

正式規則：

- single-user first 不是縮水版產品
- multi-user later 不是現階段產品定義

---

## 9. What Is Formally Established Now

截至目前 shipped baseline，以下能力已正式成立：

### 6.1 World-first case chain

- `canonical intake pipeline -> CaseWorldDraft -> CaseWorldState` 已成立
- `Task` 已重新定位為 world 內的 work slice
- follow-up supplements 應先更新同一個案件世界，再決定 task / evidence / deliverable 變化

### 6.2 Host-led orchestration

- Host 是唯一 orchestration center
- Host 正式承接 task framing、decision framing、workflow selection、readiness governance、research trigger、agent routing、deliverable shaping 與 continuity control
- Agent Registry / Resolver 已是正式 runtime 骨架，不是概念補充

### 6.3 Evidence and provenance

- `Artifact / SourceMaterial / Evidence` 已有正式 workspace
- sufficiency、high-impact gaps、research provenance 與 deliverable limitations 已可回看
- `ChunkObject / MediaReference / retrieval provenance` 已是正式支撐鏈 baseline

### 6.4 Pack contracts

- 8 個 Domain / Functional Packs 與 11 個 Industry Packs 已全部形成正式單人版基線
- required-property gate、interface ids、rule binding ids、scored selection 已形成正式 contract baseline
- pack 已能正式影響 readiness、decision framing、deliverable shaping 與 resolver behavior

### 6.5 Object-aware deliverables

- `Deliverable Workspace` 已是正式工作面
- deliverable revision、rollback、version event、publish / artifact record 已是正式 runtime 邊界
- object-set advanced views 已存在，但保持低噪音

### 6.6 Continuity and writeback

- `one_off / follow_up / continuous` 已是正式 continuity lanes
- `minimal / milestone / full` 已是正式 writeback depth
- `DecisionRecord / ActionPlan / ActionExecution / OutcomeRecord / AuditEvent` 已在正式主鏈內

### 6.7 Regression discipline

- Wave 0 到 Wave 5 deepen baseline 已全部成立
- `P0-0` 到 `P0-H` hardening / extension baseline 已全部成立
- full regression suite 已存在，且不作為新的產品層

### 6.8 First flagship workflow productization

- sparse-start / low-information matters 現已進入第一輪旗艦流程產品化
- consultant-facing intake 現可先用「先快速看清問題與下一步 / 先審閱手上已有材料 / 先比較方案並收斂決策」等工作語言起手，再映射到既有 runtime path
- `diagnostic_start / material_review_start / decision_convergence_start` 現已作為 consultant-facing derived lane baseline 出現在 task / matter read model 與核心工作面首屏
- 這條 lane 是既有 runtime signals 的衍生讀取契約，不是新的架構層，也不是新的 ontology world

### 6.9 First flagship workflow deepening

- flagship lane 不只會標示目前屬於哪種起手姿態，現在也會進一步說明：
  - 目前交付等級
  - 目前輸出邊界
  - 下一個升級目標
  - 升級還缺什麼
- 這讓 sparse-start matters 不只停在「知道自己在哪條路」，而是開始具備「知道現在最多能交到哪裡、要往下一階段補什麼」的正式工作引導

---

## 10. What The Product Is Good At Now

Infinite Pro 目前最強的，不是「任何事情都能做」，而是以下這條能力帶：

- 接住 sparse inquiry 或 multi-source matter
- 先形成正式案件世界
- 再把 evidence、risk、recommendation、action 與 deliverable 收斂進同一條 object chain
- 最後讓顧問能回看、補件、延續與正式交付

以顧問工作來看，目前最適合承接的案型包括：

- decision memo / diagnostic brief
- contract / obligation / risk review
- operations / process remediation
- finance / fundraising / capital framing
- 需要 evidence-linked deliverable 的研究、整理與收斂工作

目前最能放大顧問效率的地方包括：

- 讓 intake 不再是一次性對話，而是可延續的案件世界
- 讓 follow-up 補件不再把脈絡打散
- 讓交付物不是聊天回覆，而是有 lineage、有支撐、有回鏈的正式成果物

---

## 11. Product Fit Assessment

### 8.1 Best-fit usage

目前最適合的是：

- 單一顧問主導
- document-heavy
- decision-heavy
- deliverable-heavy
- 需要持續補件與回看的 advisory work

### 8.2 Current maturity by stage

- `創業階段`：成熟度高
- `制度化階段`：成熟度高
- `規模化階段`：能力邊界已納入，但若需要 enterprise-grade collaboration / security / governance，仍未到位

### 8.3 Current maturity by client type

- 中小企業、個人品牌與服務、自媒體、founder-led professional services：最適合
- 大型企業：適合作為單一顧問在大型企業案件中的工作台，不適合作為 enterprise platform shell

### 8.4 Current maturity by domain

相對最成熟的面向是：

- 營運
- 法務 / 風險
- 財務 / 募資
- 研究 / 綜整
- decision convergence
- document restructuring

---

## 12. Current Gaps

### 9.1 Product-level gaps

- 尚未把最強的 2 到 3 類旗艦顧問案型完整產品化；目前只先完成 sparse-start diagnostic lane 的 first pass
- `Research / Investigation` 已進入 first pass 產品化，但尚未成為一條成熟、明確、可清楚選擇深度的 high-value lane
- `follow_up / continuous` 已有正式 baseline；其中 `follow_up` 的 middle-layer clarity 已開始深化，但整體 retained advisory experience 仍未完成

### 9.2 System-layer gaps

- multi-user / RBAC / multi-tenant governance
- enterprise-grade dynamic security / ABAC / marking
- production-grade object storage serving / purge jobs / conflict merge
- OCR-heavy ingestion、`.pptx`、壓縮包
- external secret manager 等級的 secret posture

### 9.3 Bridge / compatibility notes

- `CaseWorldState` 與 legacy `task_id` references 仍共存
- catalog agent 與 runtime binding 未必文字 1:1
- 部分 legacy deliverable rows 的 newer summary contract backfill 不完整

正式規則：

- 這些 bridge notes 應誠實標示
- 不可被誤寫成已 fully world-native 或 fully enterprise-ready

---

## 13. Alignment With Palantir

Infinite Pro 現在已與 Palantir 對齊在：

- ontology 作為 operational layer，而非靜態 schema
- object-first / workbench-first，而非 chat-first
- writeback、approval、audit、history 作為同一責任鏈
- object set、provenance、required-property gate、canonicalization 作為可執行 contract

Infinite Pro 目前沒有也不應硬對齊於：

- dynamic security / ABAC shell
- full branching / migration framework
- OSDK ecosystem / marketplace
- object explorer / graph shell / enterprise admin shell
- large-scale compute / indexing / throughput governance

正式結論：

> Infinite Pro 已與 Palantir 對齊在方法論內核與能力骨架，而不是 enterprise platform 外殼。

---

## 14. Current Phase Decision

目前階段的正式結論是：

- Wave 0 到 Wave 5 deepen baseline 已完成
- `P0-0` 到 `P0-H` hardening line 已完成
- `P0 hardening line is formally closed`
- 不應再開 `P0-I`
- 下一輪工作不應從 further baseline extension 啟動，而應從新的 decision phase 啟動

---

## 15. Recommended Next Phase Directions

下一階段只應從下列方向中選 2 到 3 個：

1. 旗艦顧問案型產品化
2. `Research / Investigation` lane 正式化
3. retainer-style `follow_up / continuous advisory loop` 產品化

若只能先選 2 個，建議優先：

- 旗艦顧問案型產品化
- `Research / Investigation` lane 正式化

目前進度補充：

- `Research / Investigation` 已進入 first pass 產品化
- 第一波重點不是新增研究控制台，而是讓 task / matter / evidence 工作面能低噪音回答：
  - 這輪要不要先補研究
  - 建議補到什麼深度
  - 先查哪幾題
  - 查到哪裡就先停
- 目前也已明確把「系統研究主線」與「顧問 / 客戶補件主鏈」分開：
  - 公開來源、外部事實與 freshness-sensitive 補完，屬於系統研究
  - 客戶內部資料、附件、會議紀錄與顧問手上原始材料，屬於補件主鏈
- `follow_up` 目前也正式朝「checkpoint / milestone middle layer」深化：
  - 目標不是把所有後續案件都做成長期追蹤
  - 而是把 `one_off`、`follow_up`、`continuous` 三者的首屏心智清楚分開

---

## 16. Explicit Non-Goals

下一階段明確不是：

- 顧問訓練平台
- generic enterprise admin console
- 新 deepen wave
- `P0-I`
- benchmark dashboard-first 平台化
- OCR / 文件處理平台化
- 先做 multi-user shell 再回頭找產品主線

---

## 17. Relationship To Other Active Docs

- `docs/01_runtime_architecture_and_data_contracts.md`
  承接 runtime shape、persistence、ingestion、provider 與 bridge semantics
- `docs/02_host_agents_packs_and_extension_system.md`
  承接 Host / agents / packs / extension system
- `docs/03_workbench_ux_and_page_spec.md`
  承接 workbench surfaces、page roles、page-level UX 規格
- `docs/04_qa_matrix.md`
  承接 shipped verification evidence
- `docs/05_benchmark_and_regression.md`
  承接 regression / benchmark baseline
