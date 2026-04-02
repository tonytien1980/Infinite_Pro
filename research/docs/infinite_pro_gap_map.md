# Infinite Pro × Palantir Ontology Gap Map

## 結論

Palantir Ontology 拆解對 Infinite Pro 的主要價值，不是在推翻方向，而是在指出：

- 你現在的產品方向已經相當接近 **ontology-first / world-first / deliverable-centric / Host-orchestrated**
- 下一步真正要補強的是：把 ontology 從「共享世界模型」深化成 **可執行、可審計、可版本化、可重放** 的 operational layer

換句話說，這不是「重做」，而是一次 **有方向的 deepen refactor**。

---

## 六層架構 Gap Map

| 層 | 已對齊 | 需深化 | 先不做 |
|---|---|---|---|
| Ontology Layer | 已有 shared world model、CaseWorldState、Task 作為 work slice、canonical intake、正式 object chain、DecisionRecord / ActionPlan / ActionExecution / OutcomeRecord | 補 `Object / Link / Action / Function` runtime contract；加入 `ObjectSet`；做 entity resolution / canonicalization；建立 interface / required properties / API naming / status lifecycle | Foundry 級完整 branching + schema migration framework、精細 compute/throughput governance |
| Context Layer | 已有 ClientStage / ClientType / DomainLens / Goal / Constraint / Assumption / Stakeholder / Audience | 把 stage / domain / risk-bearing context 形式化成 interface-like contracts 與最小 required inputs | 全面 enterprise 級 marking / ABAC matrix |
| Capability Layer | 已正式定義 Diagnose / Converge / Review / Synthesize / Reframe / Plan / Scenario / Risk surfacing | 做 function / rule engine，把 risk scoring / derivation / readiness 判斷正式掛到 ontology 上 | 一次做滿所有 domain 引擎 |
| Agent Layer | Host 是唯一 orchestration center，已有 multi-agent / specialist 路徑與 registry / resolver 概念 | 把 approval / human oversight / audit event 拉成正式 runtime responsibility，避免「模型執行成功」和「正式核可寫回」混為一談 | 高自治、低審核的 end-to-end 自動執行 |
| Pack Layer | 已明確區分 Capability / Pack / Agent，Pack 能提供 ontology-aware context、heuristics、evidence expectations、deliverable patterns | 讓 Pack 對 interface、evidence contract、deliverable contract、writeback interpretation 有更正式綁定 | 類 OSDK marketplace 與大規模 pack 發布生態 |
| Workbench / UI Layer | 已有 Matter / Engagement、Artifact / Evidence、Deliverable 三大正式 workspace，不再只是表單頁與結果頁 | 增加 object explorer / graph view / object-set views / approval surfaces / action log 視角 | Palantir 全套應用族群的完整重現 |

---

## 三欄整理：已對齊 / 需深化 / 先不做

### 已對齊

1. **Ontology-first 與 world-first 主張已成立**
   - 不是 mode-first，也不是 task-first。
2. **Canonical intake pipeline 已成立**
   - `一句話問題 / 單文件進件 / 多材料案件` 只是 entry presets。
3. **CaseWorldState 作為 matter/world authority 的方向已經很正確**
   - `Task` 被重新定義成 world 內的 work slice。
4. **Deliverable / Evidence / History 已是正式主鏈**
   - 不是聊天回答附屬物。
5. **Host / Agent / Pack / Capability 已完成概念分層**
   - 沒有把 pack 當 agent，也沒有把 agent 當 capability。
6. **Workbench 已不是 generic AI workspace**
   - 已有正式案件工作面、證據工作面、交付物工作面。

### 需深化

1. **Action / Function contract**
   - 從「有 writeback 物件」升級成「有正式動詞層」。
2. **Object Set layer**
   - 讓顧問可以操作「一組風險 / 一組合約 / 一組流程 / 一組證據」。
3. **Interface / polymorphism / required properties**
   - 讓 stage、domain、risk-bearing objects 可擴充但不失控。
4. **Entity resolution / canonicalization**
   - 避免重複 object、支援 merge / split / reuse。
5. **Approval / audit / human oversight**
   - 將「可寫回」與「已核可」分開，保留審計鍊。
6. **Chunk objects + media references**
   - 文件證據鏈更接近 Palantir 的 ontology-augmented retrieval 邏輯。

### 先不做

1. **Palantir 級完整 dynamic security / marking / ABAC**
2. **完整 schema branching / migration 測試框架**
3. **OSDK 級 SDK generation / marketplace deployment**
4. **大規模 indexing/query/action 成本治理**
5. **多人 / 多租戶 / enterprise governance layers**

---

## 建議優先順序

### P0：現在最值得做

- 正式化 `ActionType / FunctionType / ApprovalPolicy / AuditEvent`
- 加入 `ObjectSet`
- 補 canonicalization / entity resolution / merge-split-human-review
- 把 writeback 與核可流程拆開

### P1：下一輪深化

- 建立 interface / required properties / stable API names
- 補 `ChunkObject / MediaReference / Retrieval provenance`
- 把 risk scoring / derivation / readiness 做成 function / rule engine

### P2：再往後

- object explorer / graph view / approval inbox
- pack-to-contract binding
- exportable schema / action contracts

### Later

- 深度 ABAC / marking
- branching + migration testing
- cost observability / scale governance
- multi-user / multi-tenant layers

---

## 最後一句

Infinite Pro 現在最該做的，不是「像 Palantir 一樣重做一套平台」，而是把你已經正確的 **world-first consulting workbench**，再往前推成 **operational ontology-first consulting workbench**。
