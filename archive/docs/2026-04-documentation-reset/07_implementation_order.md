# 07_implementation_order.md

> 文件狀態：Governance Reset v2.1（正式施工順序文件）
>
> 本文件以 **full-scope by capability + phased by implementation order** 作為正式施工原則。

---

## 1. 文件目的

本文件現在回答的是：

1. **在完整單人顧問工作台前提下，實作應該先做什麼、後做什麼？**
2. **如何在不縮小能力邊界的前提下，安排施工順序？**
3. **哪些正式能力是第一波、哪些是第二波、哪些屬於多人系統層？**

這份文件是施工順序文件，不是產品縮水文件。

---

## 2. 正式施工原則

Infinite Pro 的施工原則應改為：

1. **完整能力邊界先定義**
2. **實作順序再分批**
3. **單人顧問完整工作優先**
4. **多人系統層後做**
5. **ontology、Host、packs、consulting workbench 都算正式主架構**

不再採用：
- 先做最小功能集合
- 先只做少數 domain / 少數 mode 當正式產品定義
- 先把 ontology / Host / packs 當未來擴充

---

## 3. 建議技術選型（目前仍成立）

### 前端
- Next.js
- TypeScript
- App Router

### 後端
- Python
- FastAPI

### 資料庫
- PostgreSQL

### 模型層
- internal model router abstraction

### 啟動方式
- Docker Compose

這些選型仍成立，因為它們支持：
- consulting workbench UI
- backend orchestration
- ontology-aligned state
- file / source handling
- provider abstraction

---

## 4. 施工順序的正確拆法

不再以「Phase by capability reduction」來規劃。

改為：

### Wave 1：Governance / Ontology / Context spine
先把治理語言、objects、links、context layers 對齊。

此波次現在正式包含：
- canonical intake pipeline 與 unified intake semantics 一致化
- `Case World Compiler / case_world_draft`
- `CaseWorldState`
- `engagement_continuity_mode / writeback_depth`
- research provenance 與 decision writeback 邊界

### Wave 2：Ontology contracts / persistence
先讓正式物件、contracts、persistence 邊界與歷史 / writeback 分層成形。

此波次現在也正式包含：
- `/new` 的單一 unified intake surface
- one canonical intake pipeline
- `CaseWorldDraft / CaseWorldState / EvidenceGap / ResearchRun / DecisionRecord / ActionPlan / ActionExecution / OutcomeRecord` 的最小 contract
- continuity policy 與 writeback depth 的正式 persistence
- raw / derived / released 的 storage 邊界
- retention / purge metadata 與成本控制邊界

若施工觸及 intake、source material、artifact storage、retention 或 purge lifecycle，應同步參考 `docs/11_intake_storage_architecture.md`。
若施工觸及正文 persistence、revision、rollback、publish、artifact registry、fallback、degraded mode 或 sync recovery，應同步參考 `docs/12_runtime_persistence_and_release_integrity.md`。

### Wave 3：Host orchestration reset
把 Host 的 world-first orchestration 正式接起來。

此波次應優先承接：
- `intake -> case world compilation -> case world state -> task slices`
- follow-up supplements 先更新世界，再決定 task / evidence / deliverable 變化
- 在保留 transitional persistence 的前提下，把 runtime authority 從 task-first 推向 world-first

### Wave 4：Workbench surfaces
讓 intake、decision workspace、artifact/evidence workspace、deliverable workspace 在不退回 debug dashboard 的前提下，可見化新的 ontology / writeback 主鏈。

### Wave 5：Agent families expansion
讓 reasoning agents 與 specialist agents 形成正式能力層。

### Wave 6：Pack integration deepen
讓 Pack Layer 更深地進入 case world compilation、research strategy、deliverable shaping 與 writeback interpretation。

### Wave 7：Multi-user system layer
最後才進入多人登入、權限、多租戶與協作治理。

---

## 5. 第一波實作（不縮小能力邊界）

### 5.1 Ontology spine
第一波應優先落地：
- Task
- DecisionContext
- Artifact
- SourceMaterial
- Evidence
- Risk
- Option
- Recommendation
- ActionItem
- Deliverable
- Goal / Constraint / Assumption
- ClientStage / ClientType / DomainLens 的基本掛載

### 5.2 Host spine
第一波應優先落地：
- task interpretation
- decision framing
- case world compilation
- readiness governance
- execution mode selection
- specialist / reasoning routing
- deliverable convergence
- continuity / writeback policy selection

### 5.3 Workbench spine
第一波應優先落地：
- intake surface
- decision workspace
- supporting context surface
- system trace surface
- deliverable reading surface

### 5.4 Source / Evidence spine
第一波應優先落地：
- file ingestion
- URL ingestion
- evidence creation
- source metadata
- history writeback
- 三種 intake patterns 共用同一條 task / matter / source / evidence 主鏈
- raw / derived / released storage metadata 與 retention 邊界
- research 結果回到同一條 source / evidence 主鏈

---

## 6. 第二波實作（深化正式能力）

### 6.1 Ontology deepen
- Client
- Engagement
- Workstream
- Stakeholder
- Audience
- Metric
- Timeline
- richer links and traceability
- EvidenceGap / ResearchRun / DecisionRecord / ActionPlan / ActionExecution / OutcomeRecord 的完整深化

### 6.2 Agent deepen
- 更完整 reasoning families
- 更完整 specialist families
- pack-aware routing
- pack-aware research strategy
- continuity-aware writeback governance

### 6.3 UI deepen
- object-aware navigation
- engagement / workstream views
- artifact work surfaces
- deliverable work surfaces
- revision / rollback / publish 與 degraded-mode UX 收斂

前端資訊架構、頁面角色與 UX 驗收原則，現在已由 `docs/10_frontend_information_architecture_and_ux_principles.md` 正式承接。
後續 UI deepen 應以該文件作為正式治理依據，而不是再以零散頁面調整或單點 polish 方式推進。

### 6.4 Industry pack deepen
- domain heuristics
- risk libraries
- deliverable templates
- evidence expectations
- research focus
- writeback interpretation

---

## 7. 多人系統層（較後面的施工波）

以下不屬於前述完整單人版的第一波或第二波，而屬於 multi-user system layer：
- 登入
- 權限
- 多顧問協作
- 多公司同步與隔離
- tenant governance
- shared workspace administration
- user-level API credential management

---

## 8. 施工時的禁止事項

施工時不要再：
- 以縮小版產品語言決定能力是否存在
- 以「先只做幾個 specialist flow」當產品分類
- 以最小 ontology 當長期主骨架
- 以少數 agents 當正式上限
- 以 consumer app 或 admin panel 的慣性設計 workbench

---

## 9. 建議 repo 形狀（可保持現況概念分離）

目前 repo 已有：
- `frontend/`
- `backend/`
- `docs/`
- `storage/`

未來若重整，也應持續保留這些概念分離：
- workbench UI
- application backend
- ontology / domain models
- orchestration
- agents
- model router
- source ingestion
- persistence
- docs

---

## 10. 驗收標準的重寫

之後施工驗收不應只問：
- 某個 flow 有沒有跑通

還應問：
- ontology spine 是否更完整
- Host 是否更像正式 orchestration center
- UI 是否更像 consulting workbench
- deliverable 是否更像顧問交付物
- evidence 與 history 是否更能支持回看與復用
- pack hooks 是否已保留

---

## 11. 文件結論

Infinite Pro 的施工順序現在應理解為：

> **不是先做一個縮小版產品，而是先把完整單人顧問工作台的正式架構，按實作順序分波落地。**
