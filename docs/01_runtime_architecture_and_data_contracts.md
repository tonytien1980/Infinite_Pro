# 01 Runtime Architecture and Data Contracts

> 文件狀態：Active source of truth
>
> 本文件定義 Infinite Pro 目前與程式碼對齊的 runtime architecture、object chain、intake / persistence / writeback / provenance contract、provider boundary 與 bridge semantics。

---

## 1. Purpose

本文件回答：

1. Infinite Pro 現在的 runtime shape 是什麼
2. 哪些 object / chain / records 已是正式 contract
3. intake、storage、persistence、writeback、provider 的正式邊界在哪裡
4. 哪些行為是正式 success path，哪些是 fail-closed 或 degraded mode
5. 哪些地方仍是 bridge / legacy / compatibility note

### 1.1 Current implementation stack

目前與 shipped runtime 對齊的技術棧仍為：

- frontend：Next.js + TypeScript + App Router
- backend：Python + FastAPI
- primary DB：PostgreSQL
- model layer：internal provider / model router abstraction
- local orchestration / startup posture：Docker Compose

正式規則：

- stack choice 本身不是產品定義
- 但後續工作不應隱性假設另一套核心 runtime stack 已成立

---

## 2. Runtime Shape

Infinite Pro 目前的正式 runtime 主鏈應理解為：

> `canonical intake pipeline -> CaseWorldDraft -> CaseWorldState -> Task(work slices) / DecisionContext -> Artifact / SourceMaterial -> ChunkObject / MediaReference -> Evidence -> Insight / Risk / Option -> Recommendation / ActionItem -> Deliverable -> DecisionRecord / ActionPlan / ActionExecution / OutcomeRecord`

正式規則：

- 產品不是 mode-first，也不是 task-first
- `Task` 不是 consultant world 的唯一主容器
- follow-up 與 supplements 應先更新既有 world，再決定 task / evidence / deliverable 的變化

### 2.1 Ontology design rules

Ontology 在 Infinite Pro 中是：

- shared world model
- structured reasoning skeleton
- objects / properties / links / actions / functions / decision context 的操作層

正式規則：

- 先定義 objects / links / actions，再定頁面與表單
- Host、agents、packs、workbench 必須工作在同一個世界上
- deliverable 與 history 建立在 object chain 上，而不是平行 prompt 宇宙
- pack 是 ontology 上的正式擴充，不是 ontology 的替代品

### 2.2 Layer boundaries inside runtime

正式邊界：

- Ontology Layer：定義世界與操作語義
- Context Layer：提供 stage / type / lens / goal / constraint / assumption 等輸入
- Agent Layer：在共同 ontology 上執行分析與收斂
- Pack Layer：提供 context modules 與 contract influence
- Workbench / UI Layer：把 world objects 轉成正式工作面

---

## 3. Core Runtime Objects

### 3.1 World and context spine

- `CaseWorldDraft`
- `CaseWorldState`
- `Client`
- `Engagement`
- `Workstream`
- `DecisionContext`
- `Goal`
- `Constraint`
- `Assumption`
- `Stakeholder`
- `Audience`
- `ClientStage`
- `ClientType`
- `DomainLens`

### 3.2 Work and material chain

- `Task`
- `Artifact`
- `SourceMaterial`
- `Evidence`
- `EvidenceGap`
- `ResearchRun / ExternalResearchRun`
- `ChunkObject`
- `MediaReference`

### 3.3 Analysis and output chain

- `Insight`
- `Risk`
- `Option`
- `Recommendation`
- `ActionItem`
- `Deliverable`

### 3.4 Continuity and writeback chain

- `DecisionRecord`
- `ActionPlan`
- `ActionExecution`
- `OutcomeRecord`
- `AuditEvent`

### 3.5 Grouping and support chain

- `ObjectSet`
- `ObjectSetMember`
- `evidence_set_v1`
- `risk_set_v1`
- `clause_obligation_set_v1`
- `process_issue_set_v1`

### 3.6 Core relationships

至少應維持以下正式 links：

- Client has Engagement
- Engagement contains Workstream
- Workstream contains Task
- Workstream frames DecisionContext
- Artifact / SourceMaterial produce Evidence
- Evidence supports or weakens Insight / Risk / Option
- Recommendation addresses DecisionContext
- Recommendation responds_to Risk
- ActionItem operationalizes Recommendation
- Deliverable summarizes DecisionContext + Evidence + Recommendation + Risk + ActionItem
- ResearchRun produces SourceMaterial / Artifact / Evidence
- OutcomeRecord feeds back into DecisionContext / Evidence / Deliverable

---

## 4. Canonical Intake and Case World Contracts

### 4.1 Intake semantics

系統只有一條 canonical intake pipeline。

使用者可見層只有一個 unified intake surface。

系統內部仍可推導三種 intake patterns：

- `只有一句話`
- `一句話 + 1 份材料`
- `一句話 + 多份材料`

正式規則：

- 它們不是三個不同 ontology worlds
- 它們不得把 Host orchestration、evidence pipeline 或 writeback policy 分叉成三套世界

### 4.2 Unified material area

統一材料區正式承接：

- files
- URLs
- pasted text
- structured data
- follow-up supplements

單次最多 10 份材料，可後續補件。

### 4.3 Item-level ingestion contract

每份材料至少應可表達：

- item status
  - `accepted`
  - `limited_support`
  - `pending_parse`
  - `unsupported`
  - `failed_ingest`
- diagnostic category
- extract availability
  - `full_text_ready`
  - `partial_extract_ready`
  - `reference_only`
  - `not_available`
- current usable scope
  - `chunk_ready`
  - `limited_extract`
  - `reference_only`
  - `unusable`
- fallback boundary
- retryability explanation
- blocking / non-blocking semantics

### 4.4 Case world compilation

所有 intake 都必須先進入：

- `Case World Compiler`
- output: `case_world_draft`

其後必須提升或同步成：

- `CaseWorldState`

正式理解：

- `CaseWorldState` 是 matter/world-level authority center
- `Task` 是 world 內的 work slice
- supplements 回到同一 world，而不是平行 intake branch

### 4.5 Consultant-facing flagship-lane read model

目前正式 read-model baseline 也包含一層 consultant-facing derived lane contract。

第一波正式值包括：

- `diagnostic_start`
- `material_review_start`
- `decision_convergence_start`

它是由既有 runtime signals 衍生而成，至少包括：

- `input_entry_mode`
- `deliverable_class_hint`
- `external_research_heavy_candidate`
- `next_best_actions`
- continuity mode / writeback depth

正式規則：

- 這是 consultant-facing workflow read model，不是新的 architecture layer
- 它不是新的 ontology world，也不是新的 execution mode taxonomy
- 它的責任是把既有 runtime shape 翻譯成顧問可直接理解的起手姿態、下一步與升級方向
- 第一波產品化重點是 sparse-start matters 的 `diagnostic_start`

目前第一輪 deepen 後，這份 derived contract 至少應包括：

- 目前起手姿態
- 目前交付等級
- 目前輸出邊界
- 下一個升級目標
- 升級 requirements

正式欄位 baseline 至少包括：

- `lane_id`
- `label`
- `summary`
- `next_step_summary`
- `upgrade_note`
- `current_output_label`
- `current_output_summary`
- `upgrade_target_label`
- `upgrade_requirements`
- `upgrade_ready`
- `boundary_note`

---

## 5. Source, Evidence, Provenance, and Object-Set Contracts

### 5.1 Source / Artifact / Evidence

正式規則：

- `SourceMaterial` 承接原始來源材料與其 metadata
- `Artifact` 是正式進入工作鏈、可被 evidence / deliverable 回鏈的工作物件
- `Evidence` 是可支撐或挑戰判斷的正式證據單位
- metadata-only 或 limited-support 材料也可留下 reference-level evidence，不可假裝全文成熟

### 5.2 Chunk and media provenance

正式規則：

- parseable text-first materials 可形成 `ChunkObject`
- limited-support / reference-level materials 可形成 `MediaReference`
- retrieval provenance 必須能回答：
  - evidence 來自哪個 chunk / media reference
  - deliverable / recommendation / risk / action item 用了哪筆 evidence

### 5.3 Support boundaries

目前正式支援的邊界是：

- `.md / .txt / .docx / .xlsx / .csv / text-first PDF / URL / 純文字補充`
  - 正式支援
- `.jpg / .jpeg / .png / .webp / 掃描型 PDF`
  - 有限支援，且預設為 metadata / reference-level
- `.pptx`、壓縮包、OCR-heavy image parsing
  - 尚未正式支援

### 5.4 Limited extract and reference-only honesty

正式規則：

- table-heavy `.csv / .xlsx` 若只形成 row / worksheet snapshot，必須誠實屬於 `limited_extract`
- scanned / image-like materials 若只有 locator / preview / file-level 回鏈，必須誠實屬於 `reference_only`
- 「已接受」不等於「已具完整 chunk-native 支撐能力」

### 5.5 Object-set contracts

正式規則：

- `ObjectSet` 是 Ontology Layer primitive，不是第七層
- object-set views 是既有工作面的進階視圖，不是新 app shell
- first shipped set types：
  - `evidence_set_v1`
  - `risk_set_v1`
  - `clause_obligation_set_v1`
  - `process_issue_set_v1`
- first shipped scopes：
  - deliverable-local support bundle
  - task-scope focus grouping
- deliverable-local contract-risk support bundle
- deliverable-local remediation support bundle

### 5.6 Output governance baseline

Infinite Pro 的正式輸出不應退回 generic long answer。

正式語言規則：

- model-generated natural-language fields 預設輸出為繁體中文
- 這條規則適用於：
  - `problem_definition`
  - `background_summary`
  - `findings`
  - `risks`
  - `recommendations`
  - `action_items`
  - `missing_information`
  - 以及 agent / pack contract synthesis 的自然語言欄位
- 若輸入材料是英文，系統可以保留必要專有名詞、條款原文、品牌名稱或直接引用片段
- 但摘要、結論、風險、建議與行動項目仍應以繁體中文輸出
- 不得把英文整句直接當成預設交付內容，除非任務明確要求英文
- UI language preference 不得默默讓正式內容退回英文；若未來要支援英語交付，必須明確作為正式 runtime contract 擴充，而不是隱性漂移

最低治理原則：

- `Recommendation`
  - 應盡量帶有 priority、rationale、預期效果
- `Risk`
  - 應盡量帶有 severity、impact 說明、相對 likelihood
- `ActionItem`
  - 應盡量帶有 priority、建議責任角色、前置依賴或條件
- `Deliverable`
  - 應被視為 object chain 的正式成果物，而不是一次性回答

---

## 6. Continuity, Writeback, and Release Integrity

### 6.1 Continuity modes

正式欄位：

- `engagement_continuity_mode`
  - `one_off`
  - `follow_up`
  - `continuous`
- `writeback_depth`
  - `minimal`
  - `milestone`
  - `full`

### 6.2 one_off

- 至少保留 history、evidence basis、deliverable lineage
- 支援 formal closure / reopen
- 不強迫建立完整 action-outcome loop

### 6.3 follow_up

- 保留 `one_off` baseline
- 支援 checkpoint / milestone-level writeback
- supplements 仍掛回同一案件世界
- 應能回答：
  - previous checkpoint
  - latest update
  - what changed
  - next follow-up action

### 6.4 continuous

- 保留 `follow_up` baseline
- 正式支援 decision -> action -> outcome loop
- 應能回答：
  - latest progression state
  - previous progression snapshot
  - action / outcome state
  - next progression action

### 6.5 Writeback records

正式規則：

- `DecisionRecord / OutcomeRecord` 承接 `function_type`
- `ActionPlan / ActionExecution` 承接 `action_type`
- `DecisionRecord / ActionPlan` 承接 `approval_policy / approval_status`
- `AuditEvent` 作為 append-only audit log

### 6.6 Matter persistence boundary

matter workspace 採：

> remote-first，network / 5xx 時可 local fallback，之後再手動 re-sync

正式規則：

- fallback 不等於正式成功
- `4xx` 不可偷 fallback
- local fallback 至少需表達：
  - `pending_sync`
  - `syncing`
  - `sync_failed`
  - `needs_review`

### 6.7 Deliverable release integrity boundary

deliverable workspace 採：

> remote-only + fail-closed

正式規則：

- deliverable 正文、revision、version events、publish records、artifact registry、正式匯出 / 發布不得 silently fallback
- backend 不可用時必須清楚報錯
- 不得製造看起來像已正式發布的本機假成功資料

### 6.8 Revision / event / publish separation

正式分層：

- revision
  - 正文 snapshot 與 diff summary
- version event
  - 版本治理相關事件
- publish / artifact record
  - 正式發布與正式輸出物紀錄
- continuity / writeback record
  - 與 revision history 分層存在

### 6.9 Matter-scoped canonicalization and duplicate governance

正式規則：

- canonicalization 第一波只處理同一 matter 內的 duplicate candidate
- 系統至少需能正式區分：
  - `merge_candidate`
  - `keep_separate`
  - `split`
  - `human_confirmed_canonical_row`
- human-confirmed canonical row 只應回寫 matter-scoped participation mapping
- raw rows 不得因第一波 canonicalization 被靜默刪除
- 不可提前跨案件世界做 aggressive merge

---

## 7. Storage and Availability Contracts

### 7.1 Storage kinds

正式區分：

- `raw_intake`
- `derived_extract`
- `released_artifact`

### 7.2 DB vs object storage

DB 負責：

- structured metadata
- relations
- state
- revision / audit / publish / artifact records

Object storage 負責：

- raw intake files
- derived extracts
- released artifacts

### 7.3 Availability state

至少應表達：

- `available`
- `metadata_only`
- `reference_only`
- `purged`

### 7.4 Retention posture

目前正式 beta 邊界：

- raw intake 預設 30 天，active matter 可延到 90 天
- derived extracts 預設 180 天
- released artifacts 預設 365 天
- failed / unfinished uploads 預設 7 天

自動 purge job 仍屬後續能力，不可誤寫成已 production-ready。

### 7.5 Minimum production-like boundary

若以 production-like posture 理解，正式最小邊界包括：

- frontend
- backend API / orchestration
- primary DB for structured metadata and records
- object storage for raw / derived / released layers

目前仍不應誠實之外宣稱 fully production-grade 的包括：

- signed URL / artifact serving
- purge scheduling
- conflict auto-merge
- OCR-heavy ingest platform

---

## 8. Provider Boundary

### 8.1 Formal scope

目前正式成立的是：

- system-level active provider config
- `/settings` 的模型與服務設定
- backend persisted runtime config
- backend validation
- single active provider precedence

### 8.2 Formal provider set

- `openai`
- `anthropic`
- `gemini`
- `xai`
- `minimax`

### 8.3 Runtime precedence

正式 precedence：

1. DB persisted runtime config
2. `.env` baseline

### 8.4 Secret boundary

正式規則：

- credentials 只存 backend
- frontend 不回顯完整 key
- frontend 不可直接呼叫 provider
- 所有模型呼叫仍經 internal router / provider abstraction

### 8.5 Provider maturity

- `openai`
  - 正式 verified path
- `anthropic` / `gemini`
  - native beta runtime path
- `xai` / `minimax`
  - compatibility beta runtime path

### 8.6 OpenAI adapter guardrail

目前正式保留：

- request-body local preflight
- parse-body `HTTP 400` 單次收斂重試

正式規則：

- fix 必須留在 provider boundary
- 不得繞過 Host 或 provider abstraction

---

## 9. Bridge, Legacy, and Compatibility Notes

目前仍需誠實標示：

- `CaseWorldState` 是 authority center，但 legacy `task_id` references 仍存在
- core/context rows 仍有 canonical authority 與 local overlay / compatibility path 並存
- shared source-chain reuse、local participation、canonical owner 邊界仍在 bridge closeout 中
- 較舊 rows 的部分 newer contracts 可能尚未完整 backfill

正式規則：

- bridge notes 要集中標示
- 不可把現況誤寫成 fully world-native closeout
- 也不可把 bridge state 誤寫成產品未成立

---

## 10. Relationship To Other Active Docs

- `docs/00_product_definition_and_current_state.md`
  承接高層產品定位與 current phase decision
- `docs/02_host_agents_packs_and_extension_system.md`
  承接 Host / agents / packs / extension semantics
- `docs/03_workbench_ux_and_page_spec.md`
  承接 workbench page-first 規格與 disclosure rules
- `docs/04_qa_matrix.md`
  承接 shipped verification evidence
- `docs/05_benchmark_and_regression.md`
  承接 benchmark / regression suite baseline
