# 11_intake_storage_architecture.md

> 文件狀態：Beta v1.0（正式進件、storage、retention 與成本邊界文件）
>
> 本文件用於正式定義 **Infinite Pro** 在單人正式 beta 階段的進件模式、multi-source ingestion、storage 分層、retention / purge 邊界、格式支援層級與成本控制原則。若後續 intake、source material、artifact、publish、purge lifecycle 或 storage 責任變更，應優先同步更新本文件。
>
> 若後續調整正文 persistence、revision、rollback、publish / artifact record、fallback / degraded mode / re-sync，應同步更新 `docs/12_runtime_persistence_and_release_integrity.md`。

---

## 1. 文件目的

這份文件要解決的不是單一上傳功能，而是以下正式問題：

1. `/new` 的 canonical intake pipeline 與 entry presets 現在到底如何被正式理解？
2. 一個案件是否能正式掛多份來源材料，而不是停留在單檔心智？
3. raw intake、derived extracts、release artifacts、publish / audit records 應如何分層？
4. retention、purge、成本控制與雲端正式環境邊界應如何定義？

---

## 2. 正式 intake 語義

Infinite Pro 不再把 `/new` 的三種 intake patterns 理解成三個不同 ontology worlds。

正式規則改為：

> **系統只有一條 canonical intake pipeline，而 `/new` 對使用者可見的應只有一個 unified intake surface。**

### 2.1 正式 intake 只分三類輸入
- 問題陳述
- 補充材料
  - 檔案
  - URL
  - pasted text
  - structured data
- 後續補件

### 2.2 `/new` 的 unified intake surface 與三種 intake patterns
目前 `/new` 應只保留一個可見進件入口。

但系統內部仍要能推導三種 intake patterns：
- `只有一句話`
- `一句話 + 1 份材料`
- `一句話 + 多份材料`

但正式語義是：
- 它們只是不同稀疏度、不同來源量、不同來源型態的 intake patterns
- 不可被當成三種不同案件型別
- 不可讓 ontology、Host orchestration、evidence pipeline、writeback policy 因這三者而分叉
- 「1 份材料」不只限於文件，應包括檔案、URL、補充文字或其他正式支援的單一材料
- 「多份材料」可混合檔案、URL、補充文字，並作為同一個案件逐步長成 multi-source case
- 統一材料區應同時承接 file / URL / pasted text，單次最多 10 份，超過時應要求分批補件
- 統一材料區應提供逐項 preview / remove / warning，讓每份材料都可被單獨檢查與移除
- item-level handling 應至少標示 accepted、limited support、pending parse、unsupported / rejected、failed ingest
- remediation guidance 應逐項回答：
  - 為什麼是這個狀態
  - 這會影響什麼
  - 建議下一步怎麼補救
  - 若需要更穩定分析，應補哪種替代材料
- 若 item-level retry / upload progress 已正式打開，則統一材料區還應逐項區分：
  - blocking item：會阻擋建立 / 補件送出
  - non-blocking item：可保留並繼續進主鏈或 reference-level
  - retryable failure：可直接 retry
  - non-retryable failure：應偏 replace / remove / fallback 材料
- 若再往前補 richer upload progress / retry history，則統一材料區也應提供最小 batch-level 可見性：
  - completed batch
  - partially usable batch
  - blocked batch
  - latest retry result / latest attempt state
- 若再往前補 deeper ingest diagnostics，則 item-level 與 batch-level 語義都應補上：
  - diagnostic category
  - likely cause
  - current usable scope
  - retryability explanation
  - recommended remediation
- 建議優先區分的 diagnostic 語義為：
  - format unsupported
  - fetch / access failure
  - empty / invalid content
  - parse failed
  - parse pending / not finished
  - limited-support reference-only
  - accepted but limited extraction
- `current usable scope` 至少要回答：
  - 是否可直接進文字 evidence chain
  - 是否只能保留為 metadata / reference-level
  - 是否目前完全不可用、只能等待替代材料

### 2.3 Case World Compiler 是正式第一站
任何 intake 都必須先進入：
- `Case World Compiler`
- 輸出：`case_world_draft`

接著必須提升 / 同步成：
- `CaseWorldState`
- 作為同一個案件世界的正式工作底座

Host 必須在這一階段判斷：
- 現在只有一句話，還是已有少量 / 多份材料
- 是否存在外部補完需求
- 是否足以直接進入 evidence / convergence
- 下一步應是補件、research、執行分析，還是先回看既有交付物

---

## 3. 正式工作主鏈

所有 intake patterns 都必須匯進同一條正式工作主鏈：

> `CaseWorldState → Task slices / DecisionContext → Artifact / SourceMaterial → Evidence → Deliverable`

正式規則：
- 不可把 quick inquiry、single-material start、multi-source case 拆成三套 payload 或三套持久化世界
- intake 的前半段必須先形成 `case_world_draft`
- 補件必須先更新既有 `CaseWorldState`，而不是開出新的孤立 intake 分支
- 來源材料、證據、交付物與發布紀錄都必須保留最小 traceability
- 同一個案件建立後，後續補件仍應沿用同一條 matter / source material / evidence 主鏈，不可因批次不同而斷裂

在 deeper identity bridge 下：
- `CaseWorldState` 應逐步成為材料 continuity 的正式 anchor
- `SourceMaterial / Artifact / Evidence` 應逐步能以 matter/world spine 被直接回訪
- legacy `task_id` 可暫時保留作為 slice-level access path，但不應再是唯一 continuity owner
- identity deepen phase 11 應再往前一步：
  - 同一 matter 下的 canonical source chain 應盡量重用既有
    `SourceDocument / SourceMaterial / Artifact / Evidence`
  - 新 task slice 不應因同一份 canonical source 再次進件，就重建一套近似孤島的 rows
  - 新 task slice 也應自然繼承 canonical client / engagement / workstream / decision context
  - 若仍有 slice-local usage，應被視為 local participation / overlay，而非新的 canonical owner
  - `task_id` 若仍保留，應更接近 compatibility-only access path
  - upload / source batch responses 也應能顯示 shared participation，而不是退回 task-local owner 心智
  - participation bridge 應逐步從 helper / scope bridge 推進到更明確的 mapping 結構與 compatibility closeout
  - 若同一 matter 內仍長出近似重複的 source-chain rows，系統應能形成 matter-scoped canonicalization candidate，而不是默默讓 world spine 變髒
  - 該 candidate 至少應可承接：
    - `merge_candidate`
    - `keep_separate`
    - `split`
    - `human_confirmed_canonical_row`
  - human review 只在真的需要人工判斷時露出，不可把 canonicalization review 變成每次 intake 的必經流程
  - Host payload 與 task / matter / evidence read models 對 core/context 的理解也應繼承同一套 world spine，而不是繞回 task-local rows
  - 若 source-chain family 已能穩定區分 canonical owner / local participation / compatibility fallback，identity 線就應進入 stop-condition 評估，而不是再無限展開

補完後，正式理解應是：

> `canonical intake pipeline → case_world_draft → CaseWorldState → Task(work slices) / DecisionContext → Artifact / SourceMaterial → Evidence → Deliverable`

---

## 4. SourceMaterial / Artifact ingestion 的正式責任

在目前正式 beta 階段：

### 4.1 SourceMaterial
每份來源材料至少有：
- `source id`
- `task / matter 關聯`
- `原始檔名`
- `canonical display name`
- `mime type`
- `extension`
- `size`
- `storage key`
- `status`
- `support level`
- `ingest strategy`
- `retention policy`
- `purge_at`
- `availability_state`

### 4.2 Artifact
- Artifact 不是原始附件本體
- 它是正式進入工作鏈、可被 evidence / deliverable 回鏈的工作物件
- Artifact 與 SourceMaterial 可共享同一份來源世界，但 responsibility 不同
- publish / artifact record 的正式治理責任，另由 `docs/12_runtime_persistence_and_release_integrity.md` 承接

### 4.3 Evidence
- Evidence 承接可直接支撐 recommendation / risk / action item / deliverable 的內容
- metadata-only 或 limited-support 的材料，也可先留下 reference-level evidence，而不是假裝已完整抽文
- research 補完結果也必須先回到 `SourceMaterial / Artifact / Evidence` 鏈，而不是直接偷塞進答案

### 4.4 Matter-scoped canonicalization
- intake / supplement 完成後，若同一 matter 內出現近似重複的 source-chain family，系統應形成 candidate review，而不是直接做跨案件世界 merge
- Wave 2 的正式落點是：
  - canonical owner 仍落在 matter/world spine
  - task 只保留 local participation / compatibility boundary
  - human-confirmed canonical row 只會重寫 matter 內的 participation mapping，不會把 raw rows 靜默刪除

---

## 5. 格式支援層級

### 5.1 正式支援
以下格式在目前正式 beta 階段屬於正式支援：
- `.md`
- `.txt`
- `.docx`
- `.xlsx`
- `.csv`
- text-based `.pdf`
- `URL`
- `純文字補充說明`

正式支援的最低要求是：
- 可建立正式 metadata
- 可建立基本解析結果
- 可掛回 `SourceMaterial / Artifact / Evidence`

### 5.2 有限支援
以下格式目前屬於有限支援：
- `.jpg`
- `.jpeg`
- `.png`
- `.webp`
- 掃描型 `.pdf`

有限支援的正式定義是：
- 建立 metadata / reference-level record
- 不預設進行高成本 OCR
- 不假裝與 text-first 文件有同等全文理解能力

### 5.3 尚未正式支援
以下格式目前尚未正式支援：
- `.pptx`
- 壓縮包
- 批次圖片資料夾
- OCR-heavy image parsing

尚未正式支援的格式可保留 placeholder 或明確錯誤提示，但不可假裝已 production-ready。

---

## 6. Storage architecture 的正式分工

### 6.1 DB
DB 負責保存：
- structured metadata
- object 關聯
- task / matter / source material / evidence / deliverable 狀態
- publish / artifact record
- retention policy / purge_at / availability_state
- audit / revision / visibility state

### 6.2 Object storage
Object storage 負責保存：
- raw intake files
- derived extracts
- release artifacts

正式規則：
- 不把大檔案本體塞進 DB
- 不把正式 metadata 只存在 object key 或檔名中

### 6.3 三種 storage kind
目前正式區分三類 storage kind：
- `raw_intake`
- `derived_extract`
- `released_artifact`

### 6.4 availability state
storage metadata 至少要能表示：
- `available`
- `metadata_only`
- `reference_only`
- `purged`

---

## 7. Retention / purge policy

目前正式 beta 採以下預設 retention 邊界：

### 7.1 原始進件檔
- 預設：`30 天`
- 案件仍 active 時：可延長到 `90 天`

### 7.2 derived extracts
- 預設：`180 天`

### 7.3 release artifacts
- 預設：`365 天`

### 7.4 failed / unfinished uploads
- 預設：`7 天`

正式規則：
- raw file 不預設永久保存
- publish / artifact record 與 raw file retention 分離
- 即使檔案已過 retention，record 仍可存在
- visibility / audit / publish record 不跟著 raw file purge 規則一起刪除

目前正式 beta 已落地 `retention policy / purge_at / availability_state`，但自動 purge job 仍屬後續波次能力。

---

## 8. 成本控制邊界

在目前正式 beta 階段，成本控制至少包括：
- 以 `digest / hash` 作為 raw file dedupe boundary
- 不重複保存同一份 raw file 的不必要副本
- 對 raw uploads 設定 retention，避免永久堆積
- 對 OCR-heavy 路徑不預設啟動昂貴流程
- 把 raw intake、derived processing、release artifact 的成本責任分開

---

## 9. 雲端正式環境的最小 production-like 邊界

若上雲，最小邊界應理解為：

### 9.1 Compute layer
- frontend
- backend API / orchestration
- lightweight processing workers（若後續需要）

### 9.2 DB
- 只存 structured metadata、relations、states、audit、publish / artifact records

### 9.3 Object storage
- raw intake
- derived extracts
- released artifacts

### 9.4 暫存 / processing state
- 上傳中、解析中、待 purge、失敗回補等 processing state
- 不應與正式 publish / artifact registry 混成同一層

目前正式 beta 仍有 dev-mode 成分：
- local filesystem storage 仍可作為 object storage 的本地替身
- 自動 lifecycle / purge job 尚未正式排程
- artifact direct retrieval 仍以 beta 層級為主，未到 production-grade object storage serving

---

## 10. 目前仍屬 beta / limited support 的部分

以下能力目前仍應被視為 beta 或 limited support：
- 掃描型 PDF 與 OCR-heavy image parsing
- `.pptx` 與壓縮包 ingestion
- 自動 purge / lifecycle jobs
- production-grade object storage serving / signed URLs

產品工作面語義也應保持誠實：
- 掃描型 PDF / 圖片型來源可被接收並建立 reference-level rows，但不應在 item-level UI 上被寫成完整全文支援
- `.pptx`、壓縮包等尚未正式支援材料，應在 item-level UI 上被明確標示為 unsupported 或 reject

這些能力可在後續波次補強，但不應被文件寫成已 production-ready。
