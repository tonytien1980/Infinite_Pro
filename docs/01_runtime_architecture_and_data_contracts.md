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

正式理解也應區分兩個層次：

- 這條 object chain 形成的是 `案件 Digital Twin`
- precedent / memory / playbook / template 與 feedback / writeback loop 逐步形成的是 `顧問判斷力的 system-level Digital Twin`

正式規則：

- 前者是案件世界本身
- 後者不是新的 architecture layer，而是建立在既有六層之上的 shared intelligence 演化

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
- `material_review_start` 正式應被理解為 document-heavy review posture，而不是 sparse-start 的過渡標籤
- 這層可以顯示 current-output / upgrade-target / boundary，但不應把 review work 誤寫成 final decision convergence
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

### 4.6 Research-guidance read model

目前 research / investigation lane 的第一波產品化，也以 derived read model 方式成立。

它的責任不是新增 research app shell，而是低噪音回答：

- 這輪是否需要先補研究
- 建議研究深度
- 優先子題
- 停止條件
- handoff 方向

正式規則：

- 這是 consultant-facing research guidance，不是新的 orchestration center
- research 深度仍由 Host / runtime signals 決定，不由使用者在首屏手動調整
- 當案件不需要研究時，這層應保持低噪音甚至不顯示
- 這層只描述「系統研究主線」要不要先處理公開來源與外部事實補完
- 若缺的是客戶內部資料、附件、會議紀錄或顧問手上原始材料，正式應改走 supplement / evidence 主鏈，而不是混成 research guidance

第一波正式欄位 baseline 至少包括：

- `status`
- `label`
- `summary`
- `recommended_depth`
- `suggested_questions`
- `evidence_gap_focus`
- `source_quality_summary`
- `freshness_summary`
- `contradiction_watchouts`
- `citation_ready_summary`
- `evidence_gap_closure_plan`
- `stop_condition`
- `handoff_summary`
- `latest_run_summary`
- `execution_owner_label`
- `supplement_boundary_note`
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
- 正式定位是 `one_off` 與 `continuous` 之間的 middle layer，不應被誤寫成縮小版 progression shell
- 應能回答：
  - previous checkpoint
  - latest update
  - what changed
  - next follow-up action

正式 UX / read-model 規則：

- 首屏應優先使用「回來更新 / checkpoint」語言，而不是 progression / outcome 語言
- `follow_up` 的重點是 checkpoint / milestone update，不要求完整 action / outcome loop
- 若後續真的要追 action / outcome，才應升級到 `continuous`
- 若要讓 middle-layer 真的好用，`follow_up` 也應能透過同一條 `continuation_surface` 回答：
  - `timeline_items`
  - `review_rhythm`
- 但這一層的 review rhythm 必須維持「有新資料就回來更新 / 補件後回看」語氣，不可漂成 `continuous` 的 progression cadence

### 6.4 continuous

- 保留 `follow_up` baseline
- 正式支援 decision -> action -> outcome loop
- 正式定位是 retained advisory / 持續推進層，不可退化成 generic progress tracker
- 應能回答：
  - latest progression state
  - previous progression snapshot
  - action / outcome state
  - next progression action
  - health signal
  - low-noise timeline items
  - next-step queue

正式 UX / read-model 規則：

- 首屏應優先使用「持續推進 / outcome」語言
- 這一層才需要較完整的 action state 與 outcome signal 表達
- 不可反向污染 `follow_up` 的 checkpoint / milestone 心智
- retained advisory MVP 應優先把複雜度收斂進 `continuation_surface`，而不是讓前端自行從 progression 明細拼接
- 第一波 formal read-model 應至少包含：
  - `health_signal`
  - `timeline_items`
  - `next_step_queue`
- 下一波 retained-advisory read-model 可在同一條 surface 補：
  - `outcome_tracking`
  - `review_rhythm`

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

### 6.9 Minimal adoption-feedback foundation

目前正式已補上一層最小 adoption-feedback foundation。

正式規則：

- 這層不是 chat bubble feedback
- 它附著在正式工作物件上，第一波只涵蓋：
  - `Deliverable`
  - `Recommendation`
- 第一波正式值至少包括：
  - `adopted`
  - `needs_revision`
  - `not_adopted`
  - `template_candidate`
- feedback record 現在也可附帶：
  - `reason_codes`
  - optional `note`
- V1 正式規則：
  - `reason_codes` 可為空
  - V1 UI 只會主動收 0 到 1 個 primary reason
  - `note` 仍是 optional
  - status click 不應要求先填 note 或先選 reason 才能完成
- 若 status 被切換到另一個值，既有 `reason_codes` 應先清空，避免把舊原因帶到新狀態
- 若 request 沒有明確傳入 `note`，既有 note 不應被靜默清空
- publish / approval / revision 仍屬治理或版本訊號，不等於 explicit human adoption feedback
- 這層的正式目的，是為未來 precedent / reusable intelligence 提供更可靠的人類採納訊號

### 6.9A Feedback optimization signals v1

在 minimal adoption-feedback foundation 已成立後，feedback -> optimization loop 的第一刀應先補：

- `precedent optimization signal`

正式規則：

- 這不是新的架構層
- 也不是新的獨立 page family
- 它是掛在 precedent review 與 Host-safe precedent reference 上的一層 nested signal
- 這層的正式角色是回答：
  - 這筆 precedent 對哪種 reusable asset 最有幫助
  - 這筆 precedent 的參考強度大概多高

第一版 contract 至少包括：

- `strength`
  - `high`
  - `medium`
  - `low`
- `strength_reason`
- `best_for_asset_codes`
- `best_for_asset_labels`
- `summary`

第一波 asset codes 只允許：

- `review_lens`
- `common_risk`
- `deliverable_shape`
- `deliverable_template`
- `domain_playbook`

正式規則：

- 這層不可直接等於 Host 自動調權
- 第一波只允許影響：
  - precedent review lane 的排序細化
  - Host-safe precedent reference 的 explainability
  - reusable asset routing 的 explainability
- frontend 不可自行把這層擴寫成黑箱品質分數或 correctness score
- 這層是在回答「這筆 feedback 對未來哪種重用最有幫助」，不是在回答「這筆 precedent 絕對正確」

### 6.9B Team-attributed reusable intelligence governance v1

在 feedback -> optimization loop 的第一刀已成立後，precedent / reusable intelligence 應先補上一層很輕的 attribution：

- `team-attributed governance v1`

正式規則：

- 這不是新的架構層
- 也不是正式帳號 / auth / RBAC shell
- 第一波只補：
  - browser-local operator identity
  - action-level attribution writeback
- 這層的正式角色是回答：
  - 這筆 feedback 是誰標記的
  - 這筆 candidate 是誰建立的
  - 最近一次升格 / 停用是誰做的

第一版 contract 至少包括：

- feedback request / record
  - `operator_label`
- precedent candidate
  - `source_feedback_operator_label`
  - `created_by_label`
  - `last_status_changed_by_label`

正式規則：

- 第一版 operator identity 不從 backend auth 取得
- 它只應來自 browser-local setting，再以 action metadata 方式寫回
- attribution != reason code
- attribution != optimization signal
- attribution != formal permission model
- 這層的目的，是讓小型顧問團隊共享 intelligence 時開始知道「誰做了哪個判斷」，但不把單人工作流變重

### 6.9C Shared intelligence evolution rules v1

在 feedback optimization signal 與 team-attributed governance v1 都已成立後，feedback -> optimization loop 的下一刀應先補：

- `shared_intelligence_signal`

正式規則：

- 這不是新的架構層
- 也不是正式 team collaboration shell
- 它是掛在 precedent review 與 Host-safe precedent reference 上的一層 nested signal
- 這層的正式角色是回答：
  - 這筆模式目前仍偏個別經驗，還是已開始形成共享模式
  - 這筆模式目前應提高參考、先持平觀察，還是降低參考
- 這層只可根據既有 precedent rows、reason-coded signal、candidate status 與 attribution 收斂
- 第一波不可把顧問顯性分成初階 / 中階 / 高階，也不可把 operator label 直接轉成 visible skill score

第一版 contract 至少包括：

- `maturity`
  - `personal`
  - `emerging`
  - `shared`
- `maturity_reason`
- `maturity_label`
- `weight_action`
  - `upweight`
  - `hold`
  - `downweight`
- `weight_action_label`
- `stability`
  - `stable`
  - `watch`
  - `recovering`
  - `retired`
- `stability_reason`
- `stability_label`
- `supporting_candidate_count`
- `distinct_operator_count`
- `promoted_candidate_count`
- `dismissed_candidate_count`
- `summary`

正式規則：

- 這層不是 correctness score
- 這層不是 consultant seniority score
- 第一波只允許影響：
  - precedent review lane 的排序細化
  - Host-safe precedent reference 的排序細化
  - precedent context explainability
- 這層是在回答「這筆模式目前開始累積到什麼程度」，不是在回答「這筆 precedent 絕對正確」

在 shared intelligence evolution rules v1 已成立後，feedback -> optimization loop 的下一刀可先補：

- `shared-intelligence stability weighting v1`

正式規則：

- 這不是新的架構層
- 它是在回答：當兩筆 precedent 都有共享訊號時，哪一筆比較像已站穩的共享模式，哪一筆仍只是觀察中或剛恢復觀察
- 第一波只允許根據：
  - `candidate_status`
  - `source_feedback_status`
  - `shared_intelligence_signal.maturity`
  - `shared_intelligence_signal.weight_action`
  - family-level `dismissed_candidate_count`
  來衍生 `stability`
- 第一波的 stability baseline 可分成：
  - `stable`
  - `watch`
  - `recovering`
  - `retired`
- 第一波只允許影響：
  - precedent review lane 的排序細化
  - Host-safe precedent reference 的排序細化
  - reusable asset source ordering
- 這層不可做成背景 freshness job，也不可做成 consultant ranking / credibility score
- 這層是在回答「這筆模式目前有多穩」，不是在回答「這筆 precedent 是否絕對正確」

在 `shared_intelligence_signal` 已成立後，下一刀可先補：

- `shared-intelligence weighting v1`

正式規則：

- 這不是新的架構層
- 它是在回答：當多筆 precedent 都可幫同一種 reusable asset 時，Host 該先信哪一筆
- 第一波只允許根據：
  - `shared_intelligence_signal.weight_action`
  - `shared_intelligence_signal.maturity`
  - `shared_intelligence_signal.stability`
  - `optimization_signal.strength`
  - `review_priority`
來做 precedence 排序
- 若同類 asset 已有非 `downweight` precedent，第一波可先不使用 `downweight` precedent
- 這層不是全域自動 routing 引擎，也不是手動調權後台

在 shared-intelligence weighting v1 已成立後，precedent governance 的下一刀可先補：

- `shared-intelligence governance recommendation v1`

正式規則：

- 這不是新的架構層
- 也不是 candidate 狀態的自動 mutation engine
- 這層是在回答：依目前 shared-intelligence 訊號，這筆候選比較適合升格、持平、降回候選，還是退場
- 第一波只允許影響：
  - precedent review lane 的低噪音治理建議
  - precedent candidate action 的排序
- 這層不可直接自動改 candidate status；最終治理動作仍由顧問明確觸發

在 `shared-intelligence governance recommendation v1` 已成立後，下一刀可先補：

- `shared-intelligence promotion / decay application v1`

正式規則：

- 這不是新的架構層
- 第一波只允許：
  - 顧問在 precedent review lane 上明確按下「套用建議」
  - 系統再把當下 recommendation 的 `target_status` 寫回 candidate status
- 若 governance recommendation 屬於：
  - `keep_candidate`
  - `keep_promoted`
  - `keep_dismissed`
  則第一波不應做 no-op mutation button
- 第一波不可做 background auto-promotion 或 background auto-dismiss
- 這層的正式目的，是把 governance recommendation 從純讀取提示推進成可人工套用的治理捷徑
- 這層目前也應維持在 workbench / review family 內，不新增 governance page family

第一版 contract 至少包括：

- `action`
  - `promote`
  - `keep_candidate`
  - `demote`
  - `keep_promoted`
  - `dismiss`
  - `keep_dismissed`
- `target_status`
- `action_label`
- `summary`
- `rationale`

在 `shared-intelligence promotion / decay application v1` 已成立後，下一刀可先補：

- `shared-intelligence promotion / decay rules v2`

正式規則：

- 這不是新的架構層
- 也不是背景 auto-promotion / auto-dismiss job
- 這層的正式角色，是在 explicit adoption feedback 更新時保留 precedent lifecycle，而不是把既有 candidate row 粗暴刪除或重設
- 若 source 尚未建立 precedent candidate，`not_adopted` 仍不應新建 candidate row
- 但若 source 已有 precedent candidate row，第一波正式行為應為：
  - `candidate` + `not_adopted` -> `dismissed`
  - `promoted` + `not_adopted` -> `candidate`
  - `dismissed` + 新的 qualifying feedback -> `candidate`
  - `promoted` + 新的 qualifying feedback -> 維持 `promoted`
- 這層的正式目的是：
  - 保留 precedent row identity
  - 保留 candidate 已有的治理與共享訊號
  - 讓 decay 先走一步，而不是直接硬刪
- 若 feedback 更新實際造成 candidate status 改變，且 request 帶有 `operator_label`，第一波可把這次 feedback operator 寫回 `last_status_changed_by_label`
- 這層仍屬 feedback-driven lifecycle handling，不等於整體 shared-intelligence lifecycle 已完成成熟化

### 6.10 Precedent candidate pool

目前 precedent / reusable intelligence 的第一輪正式形態，是 `precedent candidate pool`。

正式規則：

- 這不是新的架構層
- 它是既有 ontology / runtime contract 上的新 object 與新 read model
- 第一波候選只來自：
  - `Deliverable`
  - `Recommendation`
- 而且必須先有 explicit adoption feedback，才可建立 candidate
- 第一波允許建立 candidate 的 feedback status 包括：
  - `adopted`
  - `needs_revision`
  - `template_candidate`
- `not_adopted` 不可建立 precedent candidate
- 若 precedent candidate 已存在，`not_adopted` 第一波不應直接刪除 row，而應交由 lifecycle preservation / decay rules 處理
- publish / approval / revision 可作為輔助 metadata，但不能單獨建立 candidate

第一波 candidate contract 至少包括：

- `candidate_type`
- `candidate_status`
- `source_feedback_status`
- `source_feedback_reason_codes`
- `source_feedback_operator_label`
- `created_by_label`
- `last_status_changed_by_label`
- `source_task_id`
- `source_deliverable_id` / `source_recommendation_id`
- `title`
- `summary`
- `reusable_reason`
- `lane_id`
- `continuity_mode`
- `deliverable_type`
- `client_stage`
- `client_type`
- `domain_lenses`
- `selected_pack_ids`
- `keywords`
- `pattern_snapshot`

正式規則：

- 第一波建立後預設是 `candidate`
- managed pass 後，允許：
  - `candidate -> promoted`
  - `candidate -> dismissed`
  - `promoted -> candidate`
  - `promoted -> dismissed`
  - `dismissed -> candidate`
- precedence governance 不應改寫 adoption feedback 本身；它只管理 `candidate_status`
- 候選內容應優先保存 pattern / shape / reusable reason，而不是整份舊案全文
- future retrieval remains Host-owned；前端不可自行把 candidate 當 prompt snippet 插回主線

集中 precedent review read model 目前也可正式補上：

- `review_priority`
  - `high`
  - `medium`
  - `low`
- `review_priority_reason`
- `primary_reason_label`
- `source_feedback_reason_labels`
- `source_feedback_operator_label`
- `created_by_label`
- `last_status_changed_by_label`
- `optimization_signal`
- `shared_intelligence_signal`
- `governance_recommendation`

正式規則：

- 這是 review guidance，不是 correctness score
- review lane 應開始利用 `source_feedback_reason_codes` 回答「這筆候選為什麼值得先看」
- review lane 也應開始利用 `optimization_signal` 回答「這筆候選目前最能幫哪種 reusable asset」
- review lane 也應開始利用 `shared_intelligence_signal` 回答：
  - 這筆候選目前仍偏個別經驗，還是開始形成共享模式
  - 目前應提高參考、先持平觀察，還是降低參考
- review lane 也可開始利用 `governance_recommendation` 回答：
  - 這筆候選目前比較像可考慮升格
  - 先留在候選觀察
  - 可考慮降回候選或退場
- 第一波建議順序至少應符合：
  - `candidate + template_candidate` -> `high`
  - `candidate + adopted` -> `high`
  - `candidate + needs_revision` -> `medium`
  - `promoted` -> `medium`
  - `dismissed` -> `low`
- 同一 priority 內應再依最近治理動作排序
- 這層可幫 precedent review lane 先決定「先看哪一筆」，但不等於 Host 已正式自動 retrieval

### 6.10.1 Host-safe precedent reference

在 candidate pool、governance、review surface 與 priority 都已成立後，precedent 的下一步正式形態是：

- `precedent_reference_guidance`

正式規則：

- precedent reference 仍是 Host-owned
- frontend 不可自行把 precedent rows 拼成 prompt snippet 再塞回主線
- 第一波只允許引用少量 precedent patterns
- 第一波只允許：
  - `promoted`
  - `candidate` 且 `source_feedback_status` 屬於較強採納訊號
- `dismissed` 不可進入 Host reference set
- current task 自己生成的 candidate 不可回灌給自己
- precedent reference 只可帶 pattern / shape / match reason / safe-use note
- 不可把舊案全文直接當作 precedent retrieval payload

第一波 `precedent_reference_guidance` contract 至少包括：

- `status`
- `label`
- `summary`
- `recommended_uses`
- `boundary_note`
- `matched_items`

每筆 `matched_item` 至少包括：

- `candidate_id`
- `candidate_type`
- `candidate_status`
- `review_priority`
- `primary_reason_label`
- `source_feedback_reason_labels`
- `source_feedback_operator_label`
- `created_by_label`
- `last_status_changed_by_label`
- `optimization_signal`
- `shared_intelligence_signal`
- `title`
- `summary`
- `reusable_reason`
- `match_reason`
- `safe_use_note`
- `source_task_id`
- `source_deliverable_id` / `source_recommendation_id`

正式規則：

- 這一層的目的，是讓 Host 開始安全參考 precedent patterns
- `recommended_uses` 與 `safe_use_note` 可開始利用 reason-coded signal 說明：
  - 這筆 precedent 現在比較適合拿來參考交付骨架
  - 或比較適合拿來參考判斷方式 / 行動排序 / 風險掃描
- `shared_intelligence_signal` 可開始回答：
  - 這筆 precedent 目前仍偏個別經驗，還是已開始形成共享模式
  - Host 目前應提高參考、先持平觀察，還是降低參考
- 它不等於 playbook library
- 它也不等於 template auto-apply

### 6.10.2 Reusable review lenses

在 Host-safe precedent reference 已成立後，precedent / reusable intelligence 的第一批真正可重用資產應先是：

- `review_lens_guidance`

正式規則：

- review lenses 仍是 Host-owned
- frontend 不可自行從 candidate pool 或 pack raw fields 拼出 lens list 再回灌主線
- review lens 的正式角色是回答：
  - 這輪先看哪幾點
  - 為什麼這幾點要先看
- 它不是：
  - 自動結論
  - common risk library
  - deliverable template
  - 舊案正文 reuse
- 第一波只允許少量 lens：
  - 2 到 4 個
- lens source 第一波至少包括：
  - `precedent_reference`
  - `pack_decision_pattern`
  - `task_heuristic`
- 這層的正式目的，是改善 review / analysis ordering，不是直接複製 prior text
- review lenses 應優先回答「先從哪幾個角度看」，不應回退成風險掃描提醒

第一波 `review_lens_guidance` contract 至少包括：

- `status`
  - `available`
  - `fallback`
  - `none`
- `label`
- `summary`
- `boundary_note`
- `lenses`

每筆 `lens` 至少包括：

- `lens_id`
- `title`
- `summary`
- `why_now`
- `source_kind`
- `source_label`
- `priority`

正式規則：

- `available` 代表至少已有 precedent / pack / stronger runtime source
- `fallback` 代表目前主要仍靠 task heuristic 補最小可信 lens
- `none` 代表這輪不額外補 review lenses
- review lenses 若要進模型上下文，必須經 Host 整理成 prompt-safe `review_lens_context`
- `review_lens_context` 應與 `precedent_context` 並存，但角色不同：
  - precedent context：為什麼這個模式和現在相似
  - review lens context：這輪先看哪幾點
- 當多筆 precedent 都可作為 review-lens source 時，第一波可優先使用 shared-intelligence 較成熟、且非 `downweight` 的 precedent
- 第一波只允許影響：
  - framing / review ordering
  - deliverable shaping 的閱讀順序
- common risk 應留在 `common_risk_context`，不可再直接回流進 `review_lens_context`
- precedent 若已有 human reason-coded signal，review lenses 只應優先吸收：
  - 判斷方式
  - 優先順序判斷
  - client framing 類原因
- 不可被誤用成 template auto-fill 或自動風險判定
- task / deliverable surface 目前只應以 second-layer disclosure 低噪音回讀
- matter / overview 目前不應長出 review lens dashboard hero

### 6.10.2A Matter-scoped organization memory

在 precedent / reusable intelligence 已開始知道「哪些模式值得保留」之後，第一版 `client / organization memory` 正式先落在：

- `matter-scoped organization_memory_guidance`

正式規則：

- 第一版只整理同一案件世界內已知的穩定背景
- 不做跨 matter / 跨 client 自動合併
- Host 可把這層收斂成 prompt-safe `organization_memory_context`
- 這層的正式角色是回答：
  - 這個客戶 / 組織目前已知的穩定背景
  - 這個案件世界反覆出現的限制
  - 這案目前延續哪條主線

第一版 contract 至少包括：

- `status`
- `label`
- `summary`
- `organization_label`
- `source_lifecycle_summary`
- `stable_context_items`
- `known_constraints`
- `continuity_anchor`
- `boundary_note`

正式規則：

- 這層不是 CRM shell
- 這層不是跨客戶 profile library
- `organization_memory_context` 應與 `precedent_context` 並存，但角色不同：
  - precedent context：以前哪些模式值得參考
  - organization memory context：這個客戶 / 組織目前有哪些穩定背景不必重問

在 matter-scoped v1 已成立後，第二版應先補：

- `cross-matter organization memory v2`

正式規則：

- 第一波只允許整理：
  - 同一客戶 / 組織、且名稱高度相近的其他案件摘要
- 不做跨 client 自動合併
- 不做 CRM shell
- 不做 raw 舊案正文回灌
- Host 可把這層收斂成同一份 prompt-safe `organization_memory_context`
- 這層的正式角色是回答：
  - 同一客戶是否已有其他案件留下穩定背景
  - 這些跨案件背景為什麼和本案相近
  - 目前只值得補哪些少量跨案件摘要

第二版 contract 至少包括：

- `cross_matter_summary`
- `freshness_summary`
- `cross_matter_items`

每筆 `cross_matter_item` 至少包括：

- `matter_workspace_id`
- `matter_title`
- `summary`
- `relation_reason`
- `freshness_label`

正式規則：

- `organization_memory_context` 仍應優先以本案穩定背景為主
- 跨案件摘要只可作為少量補充，不可壓過這案當前證據
- 第一波也可補一個低噪音 `source_lifecycle_summary`，用來回答：
  - 這批跨案件背景目前可直接當穩定背景
  - 或仍只適合先留作背景參考
- 第一波也可補一個正式 `lifecycle_posture` / `lifecycle_posture_label`，用來回答：
  - 這批跨案件背景目前更接近 `前景 / 平衡 / 背景 / 偏薄` 哪一種姿態
- 第一波也可補一個低噪音 `freshness_summary`，用來回答：
  - 這批跨案件背景目前是最近更新
  - 或只是近期可參考
  - 或已偏舊，應先留在背景層
- 若 organization memory 已開始提供這層 posture，`organization_memory_context` 也可低噪音補：
  - `來源姿態：...`
- 這層不是 precedent retrieval，也不是 playbook library
- boundary copy 應明講：
  - 這是在提示同客戶跨案件背景
  - 不是 CRM profile
  - 若與這案正式證據衝突，仍以這案當前證據為準
- 若 cross-matter background 已偏舊，第一波可先把它留在背景參考，不應過早抬成主要工作主線

在第 4 階段進入 completion pass 後，history family 也可先補：

- `shared_intelligence_closure_review`

第一版 contract 至少包括：

- `phase_id`
- `phase_label`
- `closure_status`
- `closure_status_label`
- `summary`
- `candidate_snapshot`
- `completed_count`
- `remaining_count`
- `completed_items`
- `remaining_items`
- `recommended_next_step`

正式規則：

- 這層是 shared-intelligence closure read model，不是新的 architecture layer
- 它只可低噪音回答：
  - 第 4 階段哪些 contract 已站穩
  - 目前還剩哪些 completion-pass gap
  - 下一個最合理的 closure slice 是什麼
- 它不可長成 phase dashboard、PM 控制台或 consultant ranking shell

在 `shared_intelligence_closure_review` 已成立後，completion pass 也可先補：

- `asset_audits`

第一版 contract 至少包括：

- `asset_code`
- `asset_label`
- `audit_status`
- `audit_status_label`
- `summary`
- `next_step`

第一波 asset codes 只允許：

- `review_lens`
- `common_risk`
- `deliverable_shape`

正式規則：

- 這層是在回答 remaining asset families 是否已完成 closure audit
- 不可長成新的治理 page 或 manual scoring shell

在 closure review 與 asset-audit 都已成立後，也可先補：

- `phase-4 sign-off / next-phase handoff v1`

第一版 contract 至少包括：

- `closure_status = signed_off`
- `signed_off_at`
- `signed_off_by_label`
- `next_phase_label`
- `handoff_summary`
- `handoff_items`

正式規則：

- sign-off 必須是顧問明確觸發，不可背景自動收口
- 第一波只允許在 `closure_status == ready_to_close` 時執行 sign-off
- sign-off 仍只可出現在既有 `/history` precedent family，不新增 phase dashboard

### 6.10.2B Domain playbooks

在 reusable assets 已開始知道 `先看哪幾點 / 常漏哪些風險 / 交付怎麼收` 之後，precedent / reusable intelligence 的下一版可重用資產應先補：

- `domain_playbook_guidance`

正式規則：

- domain playbooks 仍是 Host-owned
- frontend 不可自行從 precedent rows、pack raw stage heuristics 或 continuity signals 拼出 playbook checklist 再回灌主線
- domain playbooks 的正式角色是回答：
  - 這類案子通常怎麼走
  - 這輪目前在哪一步
  - 下一步通常接什麼
- 它不是：
  - playbook library
  - checklist dashboard
  - template auto-apply
  - prior-case content reuse
- 第一波只允許少量 playbook stages：
  - 3 到 4 個
- playbook source 第一波至少包括：
  - `research_guidance`
  - `precedent_reference`
  - `pack_stage_heuristic`
  - `continuity_signal`
  - `task_heuristic`

在 v2，domain playbook 應開始允許：

- `organization_memory`

也就是：

- 若同客戶跨案件背景已成立，playbook 可以開始吸收少量 cross-matter organization memory 來校正這輪主線
- 但這層仍不是 CRM / profile shell，也不是 prior-case content reuse

第一波 `domain_playbook_guidance` contract 至少包括：

- `status`
  - `available`
  - `fallback`
  - `none`
- `label`
- `summary`
- `playbook_label`
- `current_stage_label`
- `next_stage_label`
- `fit_summary`
- `source_mix_summary`
- `source_lifecycle_summary`
- `boundary_note`
- `stages`

每筆 `stage` 至少包括：

- `stage_id`
- `title`
- `summary`
- `why_now`
- `source_kind`
- `source_label`
- `priority`

正式規則：

- `available` 代表至少已有 precedent / pack / research / continuity 等較強來源
- `fallback` 代表目前主要仍靠 task heuristic 補最小可信工作主線
- `none` 代表這輪不額外補 domain playbook
- `fit_summary` 應回答：
  - 這輪為什麼適合這條主線
- `source_mix_summary` 應回答：
  - 這條主線主要由哪些來源組合收斂出來
- `source_lifecycle_summary` 應回答：
  - 這輪 shared source 目前比較像穩定來源
  - 或仍偏背景校正，不宜過度主導整條工作主線
- `lifecycle_posture` / `lifecycle_posture_label` 應回答：
  - 這輪 shared source 整體更接近 `前景 / 平衡 / 背景 / 偏薄` 的哪一種正式姿態
- `freshness_summary` 應回答：
  - 這輪 shared source 目前仍屬近期可直接參考
  - 或已偏舊 / 仍在恢復，應先讓較新的 pack / research / task heuristic 站在前面
- `reactivation_summary` 應回答：
  - 若較新的 shared source 已回來，這輪是否可重新讓 shared guidance 站前面
  - 偏舊來源是否仍保留在背景校正層
  - 若回前景主要是由新的 precedent 採納回饋觸發，也應誠實讀出這層 feedback link
- `decay_summary` 應回答：
  - 若最新 precedent feedback 仍是 `needs_revision` 或 shared signal 已明顯 `downweight`
  - 這輪是否應把 shared guidance 先退到背景觀察
- `recovery_balance_summary` 應回答：
  - 若同一輪同時存在 feedback-linked reactivation 與 feedback-linked decay
  - system 應如何把這兩邊收成一致的平衡讀法，而不是只把兩句 lifecycle 訊號並排
- domain playbook 若要進模型上下文，必須經 Host 整理成 prompt-safe `domain_playbook_context`
- `domain_playbook_context` 應與 `organization_memory_context`、`precedent_context`、`review_lens_context` 並存，但角色不同：
  - organization memory context：這個客戶 / 組織有哪些穩定背景
  - precedent context：以前哪些模式值得參考
  - review lens context：這輪先看哪幾點
  - domain playbook context：這類案子通常怎麼走、這輪目前在哪一步
- 當多筆 precedent 都可作為 domain-playbook source 時，第一波可優先使用 shared-intelligence 較成熟、且非 `downweight` 的 precedent
- 若 precedent / organization memory source 仍偏 recovering / background-only，第一波可先把它們留在背景校正層，不讓較弱 shared source 過早抬成主線
- 若這輪只剩背景校正等級的 shared source，第一波可更誠實地維持 `fallback`，不把薄 shared source 誤寫成 `available`
- 若這輪 shared source 已偏舊或仍在恢復，第一波可把它們先退到背景，不讓它們繼續站在工作主線最前面
- 若較新的 shared source 已回來，第一波可更明確讀成可重新拉回前景，但仍不可把偏舊來源誤讀成同一層 authority
- 若回前景主要來自新的 `adopted` / `template_candidate` precedent feedback，第一波可明確把這層讀成 feedback-linked reactivation，而不是只剩抽象 freshness wording
- 若最新 precedent feedback 仍是 `needs_revision` 或 shared signal 已明顯 `downweight`，第一波可明確把這層讀成 feedback-linked decay，讓 shared guidance 先退到背景觀察
- 若同一輪同時已有 feedback-linked reactivation 與 feedback-linked decay，第一波可優先收成 `recovery_balance_summary`，讓 prompt / UI 先看到整體平衡判斷，再決定是否展開個別 lifecycle 細節
- 第一波也可正式把這層再收成 `lifecycle_posture`，讓 Host / prompt / UI 共享同一套姿態 contract，而不是各自猜測這輪 shared source 到底算前景、平衡、還是背景
- 第一波只允許影響：
  - framing / sequencing
  - review / convergence ordering
  - continuity-aware next-step alignment
- 不可被誤讀成強制 checklist 或 playbook library shell
- v2 仍不可把 organization memory 直接等同於 playbook：
  - organization memory = 穩定背景
  - domain playbook = 工作主線
- `matter / task` surface 目前只應以 second-layer disclosure 低噪音回讀
- `overview / history / settings` 目前不應長出 domain-playbook dashboard hero

### 6.10.3 Common risk libraries

在 reusable review lenses 已成立後，precedent / reusable intelligence 的下一批 reusable asset 應先是：

- `common_risk_guidance`

正式規則：

- common risk libraries 仍是 Host-owned
- frontend 不可自行從 precedent rows、pack raw fields 或 task result cards 拼出風險庫再回灌主線
- common risk libraries 的正式角色是回答：
  - 這類案件常漏哪些風險
  - 為什麼這些風險值得先掃一遍
- 它不是：
  - 已成立的正式風險判定
  - risk dashboard
  - auto escalation shell
  - 舊案風險段落複製
- 第一波只允許少量 common risks：
  - 2 到 4 個
- risk source 第一波至少包括：
  - `precedent_risk_pattern`
  - `pack_common_risk`
  - `task_heuristic`
- 這層的正式目的，是降低 omission risk，而不是直接替代 task-produced risk cards

第一波 `common_risk_guidance` contract 至少包括：

- `status`
  - `available`
  - `fallback`
  - `none`
- `label`
- `summary`
- `boundary_note`
- `risks`

每筆 `risk` 至少包括：

- `risk_id`
- `title`
- `summary`
- `why_watch`
- `source_kind`
- `source_label`
- `priority`

正式規則：

- `available` 代表至少已有 precedent-derived risk pattern 或 pack common risk
- `fallback` 代表目前主要仍靠 task heuristic 補最小可信風險掃描提醒
- `none` 代表這輪不額外補 common risk libraries
- common risk 若要進模型上下文，必須經 Host 整理成 prompt-safe `common_risk_context`
- `common_risk_context` 應與 `precedent_context`、`review_lens_context` 並存，但角色不同：
  - precedent context：為什麼這個模式和現在相似
  - review lens context：這輪先看哪幾點
  - common risk context：這類案件常漏哪些風險
- 當多筆 precedent 都可作為 common-risk source 時，第一波可優先使用 shared-intelligence 較成熟、且非 `downweight` 的 precedent risk patterns
- 第一波只允許影響：
  - review / analysis 的風險掃描順序
  - deliverable shaping 前的 omission guardrail
- 若某個 signal 已被定義為 common risk watchout，就不應再同時以 review lens 名義重複露出
- precedent 若已有 human reason-coded signal，common risk layer 只應優先吸收：
  - risk scan
  - constraint handling 類原因
- 不可被誤讀成這案已經正式存在這些風險
- task / deliverable surface 目前只應以 second-layer disclosure 低噪音回讀
- matter / overview / history 目前不應長出 common-risk dashboard hero

### 6.10.4 Deliverable shape hints

在 common risk libraries 已成立後，precedent / reusable intelligence 的下一批 reusable asset 應先是：

- `deliverable_shape_guidance`

正式規則：

- deliverable shape hints 仍是 Host-owned
- frontend 不可自行從 precedent rows、pack deliverable presets 或 deliverable UI sections 拼出 shape template 再回灌主線
- deliverable shape hints 的正式角色是回答：
  - 這份交付物通常怎麼收比較穩
  - 建議先有哪些段落
- 它不是：
  - 自動套模板
  - deliverable library
  - prior-case content reuse
  - 最終結論本身
- 第一波只允許：
  - 1 個 primary shape
  - 3 到 5 個 section hints
  - 少量 supporting hints
- shape source 第一波至少包括：
  - `precedent_deliverable_pattern`
  - `pack_deliverable_preset`
  - `task_heuristic`
- 這層的正式目的，是改善 deliverable shaping，而不是直接替代 deliverable content authoring
- precedent snapshot 的 raw section labels 若偏內部語言，正式讀取前應先做 consultant-facing normalization 與排序

第一波 `deliverable_shape_guidance` contract 至少包括：

- `status`
  - `available`
  - `fallback`
  - `none`
- `label`
- `summary`
- `primary_shape_label`
- `section_hints`
- `boundary_note`
- `hints`

每筆 `hint` 至少包括：

- `hint_id`
- `title`
- `summary`
- `why_fit`
- `source_kind`
- `source_label`
- `priority`

正式規則：

- `available` 代表至少已有 precedent deliverable pattern 或 pack deliverable preset
- `fallback` 代表目前主要仍靠 task heuristic 補最小可信交付骨架
- `none` 代表這輪不額外補 deliverable shape hints
- deliverable shape 若要進模型上下文，必須經 Host 整理成 prompt-safe `deliverable_shape_context`
- `deliverable_shape_context` 應與 `precedent_context`、`review_lens_context`、`common_risk_context` 並存，但角色不同：
  - precedent context：為什麼這個模式和現在相似
  - review lens context：這輪先看哪幾點
  - common risk context：這類案件常漏哪些風險
  - deliverable shape context：這份交付物通常怎麼收比較穩
- 第一波只允許影響：
  - deliverable shaping 的收斂順序與段落組織
- `section_hints` 正式應優先輸出顧問可直接閱讀的骨架順序，例如：
  - `一句話結論`
  - `主要發現`
  - `主要風險`
  - `建議處置`
  - `下一步行動`
  - `待補資料`
- precedent 若已有 human reason-coded signal，deliverable shape layer 只應優先吸收：
  - reusable structure
  - reusable deliverable shape 類原因
- 不可被誤讀成 template auto-fill 或 prior deliverable copy
- task / deliverable surface 目前只應以 second-layer disclosure 低噪音回讀
- matter / overview / history 目前不應長出 deliverable-shape dashboard hero

### 6.10.5 Deliverable templates

在 deliverable shape hints 已開始回答「交付骨架怎麼收」之後，precedent / reusable intelligence 的下一批 reusable asset 應先補：

- `deliverable_template_guidance`

正式規則：

- deliverable templates 仍是 Host-owned
- frontend 不可自行從 precedent rows、pack deliverable presets、deliverable shape rows 或 playbook rows 拼出 template library 再回灌主線
- deliverable templates 的正式角色是回答：
  - 這份交付比較適合沿用哪種模板主線
  - 哪些區塊應視為 core sections
  - 哪些區塊屬於 optional sections
- 它不是：
  - template library
  - template picker
  - auto-apply
  - prior-case content reuse
- 第一波只允許少量 template guidance：
  - 1 個 template label
  - 3 到 4 個 core sections
  - 少量 optional sections
  - 2 到 4 個 template blocks
- template source 第一波至少包括：
  - `precedent_deliverable_template`
  - `pack_deliverable_preset`
  - `domain_playbook`
  - `task_heuristic`

在 v2，deliverable template 應開始允許：

- `deliverable_shape`

也就是：

- 若交付骨架已先收斂，template guidance 可以正式把 shape 當成一種來源，而不是只當隱性 fallback

第一波 `deliverable_template_guidance` contract 至少包括：

- `status`
  - `available`
  - `fallback`
  - `none`
- `label`
- `summary`
- `template_label`
- `template_fit_summary`
- `fit_summary`
- `source_mix_summary`
- `source_lifecycle_summary`
- `core_sections`
- `optional_sections`
- `boundary_note`
- `blocks`

每筆 `block` 至少包括：

- `block_id`
- `title`
- `summary`
- `why_fit`
- `source_kind`
- `source_label`
- `priority`

正式規則：

- `available` 代表至少已有 precedent / pack / playbook 等較強來源
- `fallback` 代表目前主要仍靠 task heuristic 補最小可信模板主線
- `none` 代表這輪不額外補 deliverable template guidance
- `fit_summary` 應回答：
  - 這輪為什麼適合這個模板主線
- `source_mix_summary` 應回答：
  - 這個模板主線主要由哪些來源組合收斂出來
- `source_lifecycle_summary` 應回答：
  - 目前哪些 shared source 已足夠穩定，可直接拿來校正模板主線
  - 哪些 shared source 仍只適合作為背景校正
- `lifecycle_posture` / `lifecycle_posture_label` 應回答：
  - 這輪模板 shared source 整體更接近 `前景 / 平衡 / 背景 / 偏薄` 的哪一種正式姿態
- `freshness_summary` 應回答：
  - 目前 shared source 是否仍屬近期可直接沿用
  - 或已偏舊 / 仍在恢復，應先讓較新的 pack / shape / task heuristic 站在前面
- `reactivation_summary` 應回答：
  - 若較新的 shared source 已回來，這輪是否可重新讓模板主線站前面
  - 偏舊來源是否仍保留在背景校正層
  - 若回前景主要是由新的 precedent 採納回饋或範本候選訊號觸發，也應誠實讀出這層 feedback link
- `decay_summary` 應回答：
  - 若最新 precedent feedback 仍是 `needs_revision` 或 shared signal 已明顯 `downweight`
  - 這輪是否應把模板主線先退到背景觀察
- `recovery_balance_summary` 應回答：
  - 若同一輪同時存在 feedback-linked reactivation 與 feedback-linked decay
  - system 應如何把這兩邊收成一致的模板主線平衡讀法，而不是只把兩句 lifecycle 訊號並排
- deliverable template 若要進模型上下文，必須經 Host 整理成 prompt-safe `deliverable_template_context`
- `deliverable_template_context` 應與 `deliverable_shape_context` 並存，但角色不同：
  - deliverable shape context：這份交付物通常怎麼收比較穩
  - deliverable template context：這份交付比較適合沿用哪種模板主線
- 當多筆 precedent 都可作為 deliverable-template source 時，第一波可優先使用 shared-intelligence 較成熟、且非 `downweight` 的 precedent
- 若 precedent deliverable template 仍偏 recovering / background-only，第一波可先保留它的背景校正價值，但不應直接覆蓋較穩的 pack / shape / heuristic 模板主線
- 若這輪模板只剩 background-only precedent，第一波可更誠實地維持 `fallback`，而不是把薄 precedent 誤寫成足夠主導模板主線的 `available`
- 若這輪模板 shared source 已偏舊或仍在恢復，第一波可把它們先退到背景，不讓它們繼續站在模板主線最前面
- 若較新的模板 shared source 已回來，第一波可更明確讀成可重新拉回前景，但仍不可把偏舊來源誤讀成同一層 authority
- 若回前景主要來自新的 `adopted` / `template_candidate` precedent feedback，第一波可明確把這層讀成 feedback-linked reactivation，而不是只剩抽象 freshness wording
- 若最新 precedent feedback 仍是 `needs_revision` 或 shared signal 已明顯 `downweight`，第一波可明確把這層讀成 feedback-linked decay，讓模板主線先退到背景觀察
- 若同一輪同時已有 feedback-linked reactivation 與 feedback-linked decay，第一波可優先收成 `recovery_balance_summary`，讓 prompt / UI 先看到整體平衡判斷，再決定是否展開個別 lifecycle 細節
- 第一波也可正式把這層再收成 `lifecycle_posture`，讓 Host / prompt / UI 共享同一套姿態 contract，而不是各自猜測這輪模板 shared source 到底算前景、平衡、還是背景
- v2 可吸收 deliverable shape 與 richer domain playbook signal，但仍不可把：
  - 交付骨架 = 模板主線
  - playbook = template library
- 第一波只允許影響：
  - deliverable shaping 的模板主線與 section grouping
- 不可被誤讀成 template picker 或 auto-apply
- `task / deliverable` surface 目前只應以 second-layer disclosure 低噪音回讀
- `matter / overview / history` 目前不應長出 deliverable-template dashboard hero

### 6.11 Matter-scoped canonicalization and duplicate governance

正式規則：

- 第一波只處理同一 matter 內的 duplicate precedent candidate
- 系統至少需能正式區分：
  - `merge_candidate`
  - `keep_separate`
  - `split`
  - `human_confirmed_canonical_row`
- raw precedent rows 不得因這一輪 duplicate governance 被靜默刪除
- 不可提前跨案件世界做 aggressive merge

第一波 duplicate governance 至少應包括：

- `precedent_duplicate_summary`
- `precedent_duplicate_candidates`
- `matter_precedent_duplicate_review`

正式規則：

- duplicate grouping 第一波只抓高信心同案重複：
  - same `matter_workspace_id`
  - same `candidate_type`
  - same normalized pattern signature
  - same `lane_id`
  - same `deliverable_type`
- 若 duplicate group 尚未人工處理：
  - Host reference 預設只取 1 筆代表 candidate
- 若顧問標記：
  - `keep_separate`
  - `split`
  則 Host reference 可保留全數 candidates
- 若顧問標記：
  - `human_confirmed_canonical_row`
  則 Host reference 只取 canonical candidate

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

### 7.6 Single-firm identity and access foundation

在 phase 5 第一個 implementation slice 後，runtime 也正式新增：

- `User`
- `AuthIdentity`
- `Firm`
- `FirmMembership`
- `FirmInvite`
- `UserSession`

第一版正式規則：

- runtime posture 仍是 single-firm，不是 multi-tenant SaaS shell
- Google Login 為唯一正式登入方式
- `owner` 可 bootstrap 第一個 firm，之後新增成員正式改成 invite-only
- 目前正式角色只有：
  - `owner`
  - `consultant`
  - `demo`
- backend route 已開始正式透過 current-member / permission bundle 控制：
  - `access_firm_workspace`
  - `access_demo_workspace`
  - `view_agents`
  - `view_packs`
  - `manage_members`
  - `manage_agents`
  - `manage_packs`
  - `manage_firm_settings`
  - `govern_shared_intelligence`
  - `sign_off_phase`

正式邊界：

- 這一輪已正式建立 auth / membership foundation
- 目前也已正式建立 demo workspace isolation：
  - `demo` 只能走 `access_demo_workspace`
  - demo data source 與正式 firm workspace data source 分離
  - demo route 不得回讀正式 matter / deliverable / history objects

因此這一層目前應被理解為：

- cloud-ready identity / access foundation

不是：

- completed multi-user operating layer
- finished tenant isolation shell
- enterprise RBAC matrix

### 7.7 Owner operating controls

在 demo workspace isolation 之後，runtime 也已正式補上 single-firm owner controls 的最小深化：

- owner 可撤回 `pending` invite
- backend 已有 `GET /workbench/demo-workspace-policy`
- backend 已有 `PUT /workbench/demo-workspace-policy`
- owner-side control surface 仍維持：
  - `/members`
  - `Firm Settings`

正式規則：

- invite revoke 只允許作用在 `pending` invite
- `accepted` / `revoked` invite 不可重複撤回
- demo workspace policy 第一版只允許 owner 更新：
  - `status`
  - `max_active_demo_members`
- `workspace_slug` 與 `seed_version` 目前仍是 backend-owned metadata，不在 UI 開放編輯

因此這一層現在應被理解為：

- low-noise single-firm owner controls

不是：

- enterprise admin console
- seat billing console
- multi-firm policy center

### 7.8 Firm operating snapshot

在 owner controls 與 demo polish 之後，runtime 也已正式補上一個首頁總覽用的 single-firm operating read model：

- backend 已有 `GET /workbench/firm-operating-snapshot`
- 這條 route 會依 current-member role 回傳：
  - owner view
  - consultant view
- 第一版 signal 只聚合：
  - active members
  - demo seats / pending demo invites
  - demo workspace status
  - provider readiness

正式規則：

- 這是一個 read model，不是新的治理 action center
- owner 與 consultant 都走同一條 route，但 copy 與 signal 會 role-aware
- 這層應支撐首頁總覽，不應長成 `/firm` 或 `/ops` 新頁面

因此這一層現在應被理解為：

- low-noise firm operating surface

不是：

- dashboard shell
- analytics wall
- second admin console

### 7.9 Phase 5 closure review

在 firm operating surfaces 之後，runtime 也已正式補上 phase 5 的 closure review read model：

- backend 已有 `GET /workbench/phase-5-closure-review`
- 第一版正式回讀：
  - `phase_id`
  - `phase_label`
  - `closure_status`
  - `closure_status_label`
  - `foundation_snapshot`
  - `completed_items`
  - `asset_audits`
  - `remaining_items`
  - `recommended_next_step`

正式規則：

- 第一波只做 closure review，不做 sign-off action
- 這層是 phase-level read model，不是新的治理 shell
- UI 只應低噪音掛在既有 `總覽`

因此這一層現在應被理解為：

- phase 5 completion read model

不是：

- release dashboard
- phase control center
- 自動 sign-off engine

### 7.10 Phase 5 sign-off / next-phase handoff

在 phase 5 closure review 之後，runtime 也已正式補上 explicit sign-off：

- backend 已有 `POST /workbench/phase-5-sign-off`
- owner 可在 `closure_status == ready_to_close` 時正式收口
- 收口後 closure review 會正式回出：
  - `signed_off`
  - `signed_off_at`
  - `signed_off_by_label`
  - `next_phase_label`
  - `handoff_summary`
  - `handoff_items`

正式規則：

- 第一波 sign-off 仍只允許 owner 執行
- sign-off action 仍只掛在既有 `總覽`
- next phase 第一波只 handoff 到：
  - `phase-6 decision framing`

因此這一層現在應被理解為：

- explicit phase closeout and handoff

不是：

- release workflow engine
- phase dashboard shell

---

## 8. Provider Boundary

### 8.1 Formal scope

目前正式成立的是：

- system-level active provider config
- `/settings` 的模型與服務設定
- backend persisted runtime config
- backend validation
- single active provider precedence

phase 5 auth foundation 之後，這裡也必須補一條正式邊界：

- 目前 shipped 的仍是 `Firm Settings` 側的 system-level provider config
- phase-5 第二個 slice 已開始建立 backend API foundation：
  - encrypted `PersonalProviderCredential`
  - firm-scoped `ProviderAllowlistEntry`
- owner / consultant 已有 personal-provider settings backend route
- owner / consultant 已能透過 backend contract 讀 personal provider state
- owner 已能管理 provider allowlist backend route
- Host / runs / extension draft synthesis 已開始吃 current-member-aware provider resolution
- consultant 缺少 personal provider credential 時，run path 會 fail-closed
- `/settings` 內的 `Firm Settings` / `Personal Provider Settings` UI 已正式 shipped
- consultant 現在已能在正式 UI 內完成 personal provider workflow，但仍受 allowlist 約束

### 8.2 Formal provider set

- `openai`
- `anthropic`
- `gemini`
- `xai`
- `minimax`

### 8.3 Runtime precedence

正式 precedence：

`owner`

1. personal provider credential
2. DB persisted runtime config
3. `.env` baseline

`consultant`

1. personal provider credential
2. allowlist check
3. 若缺 key 或不在 allowlist，run fail-closed

`demo`

- 只能進 demo workspace
- 不可執行分析
- 不可讀正式 firm workspace

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
