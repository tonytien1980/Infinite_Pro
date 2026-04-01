# 17_operational_ontology_deepen_program.md

## 1. 文件目的

本文件用於正式定義 Infinite Pro 下一段深化工程的施工邊界、波次順序、驗收方式與 UI exposure policy。

這不是新的產品定義文件，也不是新的架構層。

它的責任是：
- 把既有正式治理文件轉成可執行的 deepen program
- 明確規定哪些能力可以先內部深化，哪些能力暫時不可直接暴露給使用者
- 避免把研究方向誤讀成重做平台或新增第七層

---

## 2. 與既有正式文件的關係

### 2.1 文件優先序

本文件不得推翻下列正式前提：
- `AGENTS.md`
- `docs/00_project_vision.md`
- `docs/01_problem_statement.md`
- `docs/02_product_scope.md`
- `docs/03_system_overview.md`
- `docs/04_ontology_core.md`
- `docs/05_agent_architecture.md`
- `docs/06_system_architecture.md`
- `docs/07_implementation_order.md`
- `docs/08_codex_handoff.md`
- `docs/09_infinite_pro_core_definition.md`
- `docs/10_frontend_information_architecture_and_ux_principles.md`
- `docs/11_intake_storage_architecture.md`
- `docs/12_runtime_persistence_and_release_integrity.md`
- `docs/13_system_provider_settings_and_credentials.md`
- `docs/14_workbench_ui_ux_operating_principles.md`
- `docs/15_page_level_ui_inventory_and_flow_rules.md`
- `.impeccable.md`

若研究文件、gap analysis 或外部參考與上述正式文件語言不同：
- 以 repo 正式文件作為產品邊界
- 以研究文件作為 deepen 方向與補強依據
- 不得用研究文件引入新的主導航心智或新的正式架構層

### 2.2 研究文件的正確角色

下列文件屬於本 program 的研究 /深化依據：
- `docs/infinite_pro_gap_map.md`
- `docs/Palantir Ontology 如何運作與顧問工作分析系統承接設計報告.pdf`

這些文件可用來回答：
- 下一段最值得補的 operational layer 是什麼
- 哪些能力應先內部深化
- 哪些 Palantir-like 能力只適合作為啟發，不適合直接複製

但它們不可被當成：
- 正式產品邊界來源
- 新 layer 的依據
- 推翻 single-consultant full-scope 定位的理由

### 2.3 與 README / QA matrix 的關係

本文件屬於 program / governance docs，不等於 shipped status。

因此：
- `README.md` 只在 code / behavior / runbook 真正改變且已驗證後更新
- `docs/16_qa_matrix.md` 只在實際 smoke / test / build 證據存在時更新
- 本文件不可提前宣稱某能力已正式 shipped

---

## 3. 當前基線（2026-03-31）

本 program 啟動時，Infinite Pro 的正式基線如下：

### 3.1 已成立的產品與架構基線

- 產品仍是 `Single-Consultant Full-Scope Edition`
- 正式規劃原則仍是：
  - full-scope by capability
  - phased by implementation order
  - single-user first
  - multi-user later
- 正式主架構仍然只有六層：
  1. Ontology Layer
  2. Context Layer
  3. Capability Layer
  4. Agent Layer
  5. Pack Layer
  6. Workbench / UI Layer
- Host 仍然是唯一 orchestration center
- Pack / Capability / Agent 邊界仍必須明確

### 3.2 已成立的工作主鏈與 continuity 基線

- canonical intake pipeline 已成立
- `CaseWorldDraft -> CaseWorldState` 已是正式進件主鏈
- `Task` 已被重新理解為 world 內的 work slice
- `one_off / follow_up / continuous` 已是正式 continuity lanes
- deliverable revision / publish / artifact record / rollback / re-sync 已有正式邊界

### 3.3 已存在的 runtime anchors

目前 runtime 已經有下列正式物件或 read models：
- `CaseWorldState`
- `DecisionRecord`
- `ActionPlan`
- `ActionExecution`
- `OutcomeRecord`

這代表本 program 不應另開一套平行的 decision / action / outcome 世界。
後續 wave 應建立在既有 runtime anchors 上深化，而不是重寫它們的存在理由。

### 3.4 尚待後續波次深化的主題

截至 2026-04-01，以下能力已成為 repo 內的正式 contract baseline：
- `ActionType`
- `FunctionType`
- `ApprovalPolicy`
- `AuditEvent`
- matter-scoped canonicalization / merge-split / human-confirmed canonical row contract
- `ChunkObject`
- `MediaReference`
- retrieval provenance contract
- pack interface / required-property / stable API naming baseline
- pack-to-contract binding
- minimal rule binding for readiness / decision framing / deliverable hints
- `ObjectSet`
- `ObjectSetMember`
- `evidence_set_v1`
- `risk_set_v1`

因此本 deepen program 的五個 wave 已全部形成正式 baseline。
後續若再深化，應視為既有能力的 hardening / extension，而不是隱性 Wave 6。

下一階段正式理解應是：
- hardening / extension
- 不是新的 deepen wave
- 不是隱性 Wave 6
- 不是 system-layer sprint
- 施工時仍要遵守 docs-code lockstep、Host-only orchestration 與 low-noise disclosure 原則

### 3.5 下一階段正式排序

Wave 0-5 全部完成後，repo 已正式採納下一階段的 hardening / extension 排序如下：

1. `P0-0` benchmark scaffolding baseline
2. `P0-A` Domain / Functional Packs full hardening
3. `P0-B` Industry Packs Batch 1
4. `P0-C` Industry Packs Batch 2
5. `P0-D` clause / obligation set + legal / finance hardening
6. `P0-E` process issue set + operations hardening
7. `P0-F` deliverable hardening checkpoint
8. `P0-G` ingestion hardening checkpoint
9. `P0-H` full benchmark / evaluation suite + regression gate

其中：
- `P0-0` 必須先於後續 pack sprint 存在
- `P0-F` 與 `P0-G` 是兩個可獨立收斂的 checkpoint
- `P0-H` 是把 benchmark baseline 擴成完整 suite，而不是第一次建立 benchmark

### 3.6 adopted planning file 的正式處理規則

若某份下一階段 proposal 的內容已被正式採納：
- 不得長期留在 repo 工作樹裡作為漂浮未追蹤 planning file
- 應把穩定內容吸收到正式 docs
- 再移除該未追蹤 planning file

從 P0-0 起，下一階段 hardening / extension 的穩定內容已由本文件與 benchmark baseline 文件正式承接。

---

## 4. 不可違反的硬規則

### 4.1 不得新增第七層架構

`ObjectSet is not a seventh layer.`

正式理解必須是：
- `ObjectSet` 屬於 Ontology Layer 內的 capability / primitive
- `object-set views` 屬於 Workbench / UI Layer 內的進階視圖

禁止：
- 把 `ObjectSet` 當成獨立平台
- 為 `ObjectSet` 新開一套頂層 app shell
- 以研究文件為由新增新的架構層

### 4.2 不得新增新的主導航心智

新的 deepen 能力只能落在既有工作面與既有架構中：
- Matter / Engagement workspace
- Artifact / Evidence workspace
- Deliverable workspace
- Task / decision workspace
- 既有管理與歷史工作面

禁止：
- 新增平行產品入口
- 用 approval / graph / provenance / object sets 取代既有主工作面

### 4.3 只在需要的 lane / surface 暴露更深能力

正式規則：
- `one_off` 保持 closure-first
- `follow_up` 保持 checkpoint-light
- `continuous` 才能暴露較深 progression / action / outcome surface

同理，下列能力只能按需暴露：
- approval
- audit
- object-set views
- provenance
- graph / explorer
- canonicalization review

禁止：
- 把進階能力塞進每個案件首屏
- 讓所有案件都被迫進入 continuous UX

### 4.4 必須使用顧問語言，而不是 ontology / platform jargon

UI 可用：
- 風險群組
- 證據集
- 條款集
- 流程問題集
- 正式核可
- 需確認是否同一實體
- 引用來源

UI 不應直接把下列詞當作首要使用者語言：
- `ObjectSet`
- `Interface contract`
- `Canonicalization review`
- `Function binding`
- `Mapping mode`

### 4.5 Host / provider 邊界不得被繞過

新的 action / approval / audit / writeback semantics 仍必須遵守：
- Host 是唯一 orchestration center
- provider abstraction 不可被繞過
- 不可讓 UI-only logic 或 direct model call 決定核心 workflow

### 4.6 Canonicalization 第一波必須是 matter-scoped first

entity resolution / canonicalization 的第一波只處理：
- 同一 matter 內多來源重複 object
- 同一案件世界下的 merge candidate / split / keep separate
- human-confirmed canonical row

禁止一開始就做：
- 跨案件世界的 aggressive merge
- 全域自動去重
- 讓不同案件世界互相污染

---

## 5. docs-code lockstep 與驗證規則

### 5.1 文件分層

本 program 施工時，要區分三類文件：

1. 正式治理文件
2. program / staging 文件
3. shipped / verified 文件

本文件屬於第 2 類。

### 5.2 正式治理文件何時更新

若改動影響下列任一項，正式治理文件必須同步：
- ontology objects / links / actions / functions
- Host responsibilities
- pack semantics
- interface / required properties
- approval / audit semantics
- `ObjectSet` semantics
- canonicalization / merge / split / human review semantics
- chunk / media / retrieval provenance semantics
- workbench surface / first-screen guidance / primary actions
- formal terminology

### 5.3 README / QA matrix 何時更新

只有在下列條件成立時，才更新 `README.md` 或 QA matrix：
- code / runtime behavior 真的改變
- build / typecheck / smoke / test 已實際執行
- 變更結果可被證明

Wave 0 若仍是 docs-first，則通常不應更新：
- `README.md`
- `docs/16_qa_matrix.md`

### 5.4 每一波的驗證順序

每一波應遵守：
1. 先 docs / framing
2. 再 investigate live 現況與既有 contracts
3. 再 code
4. 再做受影響 surface 的 smoke / test / build

---

## 6. Wave 順序與正式施工邊界

本 program 不採一次做滿，而採 multi-wave deepen。

### Wave 0 — Program framing / docs-first

目標：
- 把 program 的邊界、順序、stop condition、UI exposure policy 寫清楚

本波重點：
- 不先大改 code
- 先明確寫出：
  - `ObjectSet is not a seventh layer`
  - 三條核心 exposure 規則
  - Host boundary
  - matter-scoped-first canonicalization policy
  - 每個主題的 UI exposure policy
  - 每一波的驗收與 stop condition

本波最低驗收：
- 不與既有正式文件衝突
- 不提前宣稱未 shipped 的能力
- 後續 wave 可依本文件直接執行

### Wave 1 — Action / Function contract + Approval / Audit

目標：
- 把既有 writeback / decision / action / outcome 主鏈，深化成更正式的名詞 + 動詞 + 核可 + 稽核結構

本波必須建立在既有 runtime anchors 上：
- `DecisionRecord`
- `ActionPlan`
- `ActionExecution`
- `OutcomeRecord`

本波重點：
- 正式化 `ActionType / FunctionType / ApprovalPolicy / AuditEvent`
- 將「模型建議」「正式核可」「實際寫回」分開
- 保持 consultant-first
- 不做成重型審批平台

本波最小落地 contract：
- 在既有 `DecisionRecord / ActionPlan / ActionExecution / OutcomeRecord` 上補正式欄位
- `DecisionRecord / OutcomeRecord` 先承接 `function_type`
- `ActionPlan / ActionExecution` 先承接 `action_type`
- `DecisionRecord / ActionPlan` 先承接 `approval_policy / approval_status`
- `AuditEvent` 先以 append-only event log 形式落地
- 本波不建立獨立 approval inbox，也不建立重型 workflow engine

本波 UI exposure policy：
- approval / audit 僅在高風險或按需展開的 surface 出現
- 不得讓首屏充滿 approval noise

本波 stop condition：
- 若需要重寫既有 continuity 主鏈，則停止並回到 docs / contract 收斂

### Wave 2 — Entity Resolution / Canonicalization

目標：
- 先解同一 matter 下多來源材料造成的重複 object 問題

本波重點：
- 先從 source-chain family 開始：
  - `SourceDocument`
  - `SourceMaterial`
  - `Artifact`
  - `Evidence`
- merge candidate
- split / keep separate
- human-confirmed canonical row
- matter-scoped duplicate reduction
- canonical owner / local participation boundary

本波 UI exposure policy：
- 大部分複雜度留在系統內部
- 只有需要人工確認時才露出 review surface
- review surface 不得干擾一般案件首屏

本波 stop condition：
- 若需求開始擴散到跨案件世界去重，先停下來重新定義邊界

### Wave 3 — ChunkObject / MediaReference / Retrieval Provenance

目標：
- 把 evidence chain 從 source-level 提升到 chunk / media / citation-level

本波重點：
- `ChunkObject`
- `MediaReference`
- retrieval provenance
- source -> chunk/media -> evidence -> deliverable 的回鏈
- 先用最小但真實的 text-first contract 落地，再誠實保留 reference-level 邊界

本波限制：
- 先聚焦 parseable、text-like 或可合理切塊的材料
- limited-support / unsupported 材料可先停留在 reference-level

本波 UI exposure policy：
- 先提升 evidence trustworthiness 與引用回鏈
- 不把 provenance 做成 debug wall

### Wave 4 — Interface / required properties / pack-to-contract binding

目標：
- 讓 stage、domain、industry 與 packs 的擴充更穩，不越做越亂

本波重點：
- interface
- required properties
- stable API names
- pack-to-contract binding
- 最小必要的 function / rule binding

本波限制：
- 不可把 Context Layer 整個吞進 Ontology Layer
- 不可破壞 capability / pack / agent 邊界
- 不一次做滿所有 domain 引擎

截至 2026-04-01，Wave 4 的最小 shipped baseline 應理解為：
- active pack 必須通過最小 required-property gate
- `pack_id`、interface ids、required property ids、rule binding ids 形成 stable API naming baseline
- selected packs 可透過正式 contract 影響：
  - readiness gate
  - decision framing hints
  - deliverable shaping hints
- UI 只在 Extension Manager 與 task detail disclosure 低噪音顯示這些 contract metadata

### Wave 5 — ObjectSet capability + object-set views

目標：
- 讓顧問能操作一組風險 / 一組證據 / 一組條款 / 一組流程，而不只是一個 object

本波重點：
- `ObjectSet` 作為 Ontology Layer primitive / capability
- object-set views 作為 Workbench / UI Layer 內的進階視圖

本波限制：
- 不新增第七層
- 不新增新的 app shell
- 不把 `ObjectSet` 做成所有人必學的新流程

本波建議優先 set：
- Risk set
- Evidence set
- Clause / obligation set
- Process issue set

本波 UI exposure policy：
- 使用顧問語言，而不是平台語言
- 保持 one primary action 與 progressive disclosure

截至 2026-04-01，Wave 5 的最小 shipped baseline 應理解為：
- first shipped set types：
  - `evidence_set_v1`
  - `risk_set_v1`
- first shipped owning scopes：
  - deliverable-local support bundle
  - task-scope focus grouping
- first shipped object-set view：
  - deliverable workspace 的低噪音進階段落

---

## 7. 每一波都要回答的驗收問題

每一波完成後都必須回答：

1. 這一波增加的是系統內部複雜度，還是使用者表面複雜度？
2. 若增加了表面複雜度，是否仍符合本文件的硬規則？
3. 哪個頁面的首屏被改動了？
4. 有沒有新增新的主導航心智？
5. 有沒有污染 `one_off / follow_up / continuous` 的 lane 邊界？
6. 有沒有破壞 Host-only orchestration 邊界？
7. 有哪些部分已正式可用？
8. 有哪些部分仍是 bridge？
9. 下一波最適合收斂哪一段？

---

## 8. 建議 smoke / test strategy

若某一波影響 UI semantics / workflow behavior，優先 smoke：
- `/new`
- `/matters/[matterId]`
- `/matters/[matterId]/evidence`
- `/tasks/[taskId]`
- `/deliverables/[deliverableId]`

但正式規則是：
- 只測受影響的 surfaces
- 不必每一波都全站重跑

若某一波只改 docs，則不得假裝已完成 UI / runtime 驗證。

---

## 9. 成功標準

本 program 的成功標準不是一次改很多。

成功標準是：

> 在不增加預設使用者複雜度的前提下，把 Infinite Pro 從 world-first consulting workbench，推進成更像真正 operational ontology 的 consulting workbench。

這意味著：
- 內部 contract 更正式
- evidence chain 更可信
- world model 更乾淨
- packs / stage / domain 擴充更穩
- Host orchestration 更可審計
- 但使用者的主工作心智仍然是顧問工作台，而不是平台控制台
