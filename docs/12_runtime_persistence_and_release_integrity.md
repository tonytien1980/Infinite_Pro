# 12_runtime_persistence_and_release_integrity.md

> 文件狀態：Beta v1.0（正式 persistence、revision、publish 與 sync recovery 文件）
>
> 本文件用於正式定義 **Infinite Pro** 在單人正式 beta 階段的正文 persistence、revision history、rollback、deliverable version events、publish / artifact records、fail-closed 邊界，以及 matter degraded mode / re-sync 流程。若後續調整 `revision / rollback / publish / artifact registry / fallback / degraded mode / sync recovery`，應優先同步更新本文件。

若後續調整的是 system-level provider settings、credential storage、active runtime config、provider validation、native / compatibility provider adapter 或 env precedence，則應改以 `docs/13_system_provider_settings_and_credentials.md` 為 primary guide，並同步檢查本文件中的 fail-closed 邊界是否仍一致。

---

## 1. 文件目的

本文件回答以下問題：

1. 哪些資料屬於正式 domain metadata，哪些屬於正文內容，哪些屬於 publish / artifact record？
2. 正文 revision、deliverable version event、publish record 三層應如何分工？
3. 哪些工作面允許 local fallback，哪些必須 fail-closed？
4. degraded mode 後如何回到正式資料主路徑？

---

## 2. 正式資料分層

目前正式 beta 至少區分以下四層資料：

### 2.1 Domain metadata
- matter：`title`、`summary`、`status`
- deliverable：`title`、`summary`、`status`、`version_tag`
- agent / pack：正式狀態、版本、分類與核心描述

### 2.2 正文內容
- matter `content_sections`
  - `core_question`
  - `analysis_focus`
  - `constraints_and_risks`
  - `next_steps`
- deliverable `content_sections`
  - `executive_summary`
  - `recommendations`
  - `risks`
  - `action_items`
  - `evidence_basis`

### 2.3 Revision / event / publish records
- `matter_content_revisions`
- `deliverable_content_revisions`
- `deliverable_version_events`
- `deliverable_publish_records`
- `deliverable_artifact_records`

### 2.4 UI preference / visibility / fallback
- `workbench_preferences`
- `task_visibility_states`
- matter local fallback record

### 2.5 continuity / writeback records
- `case_world_drafts`
- `case_world_states`
- `evidence_gaps`
- `research_runs`
- `decision_records`
- `action_plans`
- `action_executions`
- `outcome_records`

正式規則：
- metadata 不能和正文內容混成單一模糊欄位
- revision record 不能假裝是 publish note
- export event 不等於 publish record
- UI preference / visibility state 不應寫進正式 audit / publish record
- continuity / writeback record 不等於 deliverable revision history

在 deeper identity bridge 下還要再補一條：
- `CaseWorldState` 應逐步成為 matter/world identity authority
- 某些 domain objects 仍可暫時保留 legacy `task_id` references
- 但 release integrity 與 writeback 行為不得因 identity 遷移而退化
- identity deepen phase 11 應額外保證：
  - canonical world read path 優先
  - world-preferred write / sync path 優先
  - slice-local fallback 僅作 compatibility / overlay
  - core/context objects 的 canonical owner 不得因 task-local row 仍存在而回退
  - `Client / Engagement` 的 compatibility task reference 不得再被當成最新 slice owner 證明
  - shared material / evidence reuse 不得破壞 deliverable revision / publish /
    artifact record / rollback / re-sync 邊界
  - local participation rows / mappings 不得被誤算成 canonical ownership 或正式 release basis
  - `SourceDocument` participation 與 shared chain reuse 不得把 raw / derived /
    released artifact 的 release integrity 邊界混在一起
  - upload / source / batch response 的 participation-aware contract 不得和 aggregate /
    workspace 的正式語義互相衝突
  - source-chain compatibility fallback 不得再次被誤算成正式 participation mapping
  - delta-only overlay contract 不得洗掉 canonical world decision authority
  - host payload 與常用 workspace / aggregate read path 不得因 compatibility-only `task_id` 仍存在而回退到 task-local core/context authority

---

## 3. Matter Workspace 的正式 persistence 邊界

目前 matter workspace 採：

> **remote-first，network / 5xx 時可 local fallback，之後再手動 re-sync**

正式承接範圍：
- matter metadata
- matter 正文內容
- matter content revisions

### 3.1 正式成功路徑
- 正常情況下，matter metadata 與正文內容應直接寫回 backend
- 重新整理或重開分頁時，應由 backend 正式讀回
- 每次正文成功更新時，應寫入 `matter_content_revisions`

### 3.2 fallback 觸發條件
- 只在 `network error` 或 `5xx` 時允許
- `4xx` 不可偷偷 fallback

### 3.3 sync state
matter local fallback 至少應有以下狀態：
- `pending_sync`
- `syncing`
- `sync_failed`
- `needs_review`

### 3.4 re-sync 原則
- fallback 不等於正式成功
- 使用者必須能清楚看到「尚未寫回正式資料」
- backend 恢復後，可手動重新同步
- 若 fallback 期間遠端資料也變更，應進入 `needs_review`
- 使用者可選擇覆蓋正式資料或丟棄本機暫存

---

## 4. Deliverable Workspace 的正式 release integrity 邊界

目前 deliverable workspace 採：

> **remote-only + fail-closed**

正式承接範圍：
- deliverable metadata
- deliverable 正文內容
- deliverable content revisions
- deliverable version events
- publish records
- artifact records
- 正式匯出 / 發布

### 4.1 fail-closed 規則
以下能力不得 silently fallback：
- deliverable 正文
- deliverable metadata
- deliverable revision history
- version events
- publish records
- artifact registry
- 正式匯出 / 發布

若 backend 暫時不可用：
- UI 必須清楚報錯
- 使用者可重試
- 不得在本機製造「看起來像已正式發布」的假資料

若 task / specialist / model router 在正式執行期間失敗：
- 該次 run 應標示為失敗
- task 不應被寫成 completed
- 不應為了掩蓋 provider timeout / runtime error 而自動產出看起來像正式完成的降級交付物

若 research / external completion 在正式執行期間失敗：
- research run 應標示為失敗
- 不可把失敗的外部補完結果偷塞成正式 evidence
- 若只建立了 metadata / reference-level record，必須誠實標示 provenance 與 support level

### 4.2 正式發布與正式匯出
deliverable 正式發布至少要留下：
- deliverable id
- version tag
- deliverable status
- publish note
- artifact format 列表
- created_at

deliverable artifact record 至少要留下：
- artifact kind
- artifact format
- file name
- artifact key
- storage provider
- digest
- file size
- availability state
- purge / retention metadata

---

## 5. Revision / Version Event / Publish Record 三層分工

### 5.1 Revision
revision 用來描述正文內容怎麼演進。

正式責任：
- 保存正文 snapshot
- 保存 changed sections
- 保存 diff summary
- 保存 source，例如：
  - `manual_edit`
  - `rollback`
  - `runtime_backfill`

目前正式 table：
- `matter_content_revisions`
- `deliverable_content_revisions`

### 5.2 Version Event
version event 用來描述交付物在版本治理上的較廣義事件。

正式責任：
- 草稿建立
- 正文更新
- 正文 rollback
- 狀態切換
- version tag 更新
- export event
- published event
- note event

目前正式 table：
- `deliverable_version_events`

### 5.3 Publish Record / Artifact Record
publish / artifact records 用來描述正式發布與正式輸出物。

正式責任：
- 哪個版本正式發布
- 發布時狀態是什麼
- 發布說明是什麼
- 產出了哪些 artifact
- artifact 現在是否可用、是否 metadata-only、何時 purge

目前正式 table：
- `deliverable_publish_records`
- `deliverable_artifact_records`

### 5.4 Decision / Action / Outcome Writeback
這一層不屬於 revision history，而屬於 continuity-aware writeback。

正式責任：
- `DecisionRecord`
  - 保留 decision checkpoint、evidence basis、deliverable lineage
- `ActionPlan`
  - 把 decision 轉成可治理的行動方案
- `ActionExecution`
  - 追蹤 action 是否啟動、卡住、完成
- `OutcomeRecord`
  - 把 follow-up 訊號、後續結果與 outcome observation 寫回同一個案件世界

正式規則：
- `minimal`
  - 至少保留 history + evidence basis + deliverable lineage
- `milestone`
  - 在 `minimal` 基礎上再保留 decision checkpoints
- `full`
  - 在 `milestone` 基礎上再保留 action execution + outcome records

---

## 6. Revision 與 Rollback 的正式規則

目前正式 beta 採：

> **snapshot + section-level diff summary + explicit rollback record**

正式規則：
- 每次正文成功儲存時，都應建立 revision
- revision 至少應包含：
  - object type
  - object id
  - revision id
  - created_at
  - changed sections
  - revision summary
  - source
- rollback 不可靜默覆蓋
- rollback 本身也要留下 revision
- deliverable rollback 還應留下對應的 version event
- rollback 不得抹掉既有 publish record / artifact record

---

## 7. Sync Recovery / Degraded Mode 的正式規則

### 7.1 允許 fallback 的範圍
目前正式允許 fallback 的只有：
- matter metadata
- matter 正文內容
- UI preference
- history visibility
- 某些 agent / pack 管理狀態

### 7.2 禁止 fallback 的範圍
目前正式禁止 fallback 的包括：
- deliverable 正文
- deliverable 正式 metadata 更新
- deliverable revision history
- version events
- publish records
- artifact records
- 正式匯出 / 發布

### 7.3 retry 原則
- deliverable 正式操作失敗時，可重試，但仍屬 fail-closed
- matter fallback 恢復時，可走手動 re-sync
- 不應用背景靜默重試把本機暫存假裝成正式成功

---

## 8. continuity / writeback policy 的正式規則

### 8.1 Formal fields
- `engagement_continuity_mode`
  - `one_off`
  - `follow_up`
  - `continuous`
- `writeback_depth`
  - `minimal`
  - `milestone`
  - `full`

### 8.2 one_off
- 建立案件世界
- 建立 evidence chain
- 產出 deliverable
- 保留最小 history / traceability
- 不強迫建立完整 action-outcome loop
- 應支援 formal closure
- 若後續又有新資料，應以 reopen 重新啟動，而不是默默假裝仍在 continuous 狀態

### 8.3 follow_up
- 允許 checkpoint / milestone-level writeback
- 補件仍應優先掛回同一個案件世界與 evidence chain
- matter / evidence 工作面應能顯示 latest update、previous checkpoint、what changed、next follow-up action
- follow-up 補件區不應只是 generic upload；應顯示這次補件主要想補哪個 evidence gap / update goal
- 若補進來的材料屬 limited-support、pending-parse、unsupported 或 failed ingest，補件區與材料卡也應明確說明：
  - 這個狀態代表什麼
  - 會影響哪個 checkpoint 缺口
  - 下一步最建議怎麼補救
  - 若可 retry，應提供 retry；若不適合 retry，則應偏 replace / remove / fallback 材料

### 8.4 continuous
- 在 `follow_up` 基礎上
- 正式支援 decision -> action -> outcome 閉環
- 支援長期更新案件世界
- manual outcome logging 與 progression surface 只應在這一層被正式打開
- UI / workflow 應可見 latest progression state、previous progression snapshot、what changed、next progression action
- UI / workflow 應可見 recommendation adoption、action status 與 outcome signals，但仍維持顧問工作面，而不是 records 牆
- continuous 補件應能說明這次主要是為了驗證哪個 action / outcome / recommendation
- 若補進來的材料屬 limited-support、pending-parse、unsupported 或 failed ingest，補件區與材料卡也應明確說明：
  - 這個狀態代表什麼
  - 會影響哪個 action / outcome / recommendation 驗證
  - 下一步最建議怎麼補救
  - 若可 retry，應提供 retry；若不適合 retry，則應偏 replace / remove / fallback 材料

正式規則：
- 所有案件都至少要保留最小 history / traceability
- 並非所有案件都應被污染成 continuous UX
- 但 `continuous` 案件的 writeback 痕跡不可消失在 revision history 裡
- `writeback_depth` 不可只存在欄位；它必須在 closure、checkpoint、outcome logging 上有可見後果

---

## 9. 舊資料相容、lazy init 與 runtime backfill

目前正式 beta 採：
- runtime schema patch
- lazy init
- runtime backfill

至少應保證：
- 舊 matter 若沒有正文 revision，仍可正常打開，並在需要時補基線 revision
- 舊 deliverable 若沒有 version events / publish record / artifact record，仍可正常打開，並以 backfill 形成合理基線
- 舊 artifact 若仍只有 metadata 或舊 blob 路徑，不可直接讓 detail workspace 壞掉

正式原則：
- backfill 可以建立「基線」，但不能假裝歷史比實際更完整
- metadata-only record 必須誠實標示，不可偽裝成可下載正式 artifact

---

## 10. 與其他正式文件的關係

- intake、storage、retention、purge 與成本治理，正式由 `docs/11_intake_storage_architecture.md` 承接
- 前端工作面角色、頁面責任與 detail workspace UX 原則，正式由 `docs/10_frontend_information_architecture_and_ux_principles.md` 承接
- 核心產品邊界與正式主鏈，正式由 `docs/09_infinite_pro_core_definition.md` 承接

本文件專注在：
- persistence 邊界
- revision / rollback
- version event / publish record / artifact record
- degraded mode / re-sync

---

## 11. 目前仍屬 beta 的部分

以下能力目前仍屬 beta，可用但未到 production-ready：
- matter fallback 後的自動 conflict merge
- production-grade artifact direct retrieval / signed URL
- 完整 release package 治理
- purge jobs 的正式排程
- 更細的 rich diff / cross-revision comparison

正式說法應是：
- 正文 persistence、revision、publish record、artifact registry 與 sync recovery 已正式成立
- 但完整 production-grade release / storage serving / conflict resolution 仍屬後續波次能力
