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
- publish / approval / revision 可作為輔助 metadata，但不能單獨建立 candidate

第一波 candidate contract 至少包括：

- `candidate_type`
- `candidate_status`
- `source_feedback_status`
- `source_feedback_reason_codes`
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
- `optimization_signal`

正式規則：

- 這是 review guidance，不是 correctness score
- review lane 應開始利用 `source_feedback_reason_codes` 回答「這筆候選為什麼值得先看」
- review lane 也應開始利用 `optimization_signal` 回答「這筆候選目前最能幫哪種 reusable asset」
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
- `optimization_signal`
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
- domain playbook 若要進模型上下文，必須經 Host 整理成 prompt-safe `domain_playbook_context`
- `domain_playbook_context` 應與 `organization_memory_context`、`precedent_context`、`review_lens_context` 並存，但角色不同：
  - organization memory context：這個客戶 / 組織有哪些穩定背景
  - precedent context：以前哪些模式值得參考
  - review lens context：這輪先看哪幾點
  - domain playbook context：這類案子通常怎麼走、這輪目前在哪一步
- 第一波只允許影響：
  - framing / sequencing
  - review / convergence ordering
  - continuity-aware next-step alignment
- 不可被誤讀成強制 checklist 或 playbook library shell
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

第一波 `deliverable_template_guidance` contract 至少包括：

- `status`
  - `available`
  - `fallback`
  - `none`
- `label`
- `summary`
- `template_label`
- `template_fit_summary`
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
- deliverable template 若要進模型上下文，必須經 Host 整理成 prompt-safe `deliverable_template_context`
- `deliverable_template_context` 應與 `deliverable_shape_context` 並存，但角色不同：
  - deliverable shape context：這份交付物通常怎麼收比較穩
  - deliverable template context：這份交付比較適合沿用哪種模板主線
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
