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

Infinite Pro 不再把 `/new` 的三種可見入口理解成三個不同 ontology worlds。

正式規則改為：

> **系統只有一條 canonical intake pipeline，而 `/new` 的三種選項只是 entry presets。**

### 2.1 正式 intake 只分三類輸入
- 問題陳述
- 補充材料
  - 檔案
  - URL
  - pasted text
  - structured data
- 後續補件

### 2.2 `/new` 的三種 entry presets
目前 `/new` 仍可保留三種可見入口：
- `一句話問題`
- `單文件進件`
- `多材料案件`

但正式語義是：
- 它們只是不同稀疏度、不同來源量、不同來源型態的 entry presets
- 不可被當成三種不同案件型別
- 不可讓 ontology、Host orchestration、evidence pipeline、writeback policy 因這三者而分叉

### 2.3 Case World Compiler 是正式第一站
任何 intake 都必須先進入：
- `Case World Compiler`
- 輸出：`case_world_draft`

Host 必須在這一階段判斷：
- 現在只有一句話，還是已有少量 / 多份材料
- 是否存在外部補完需求
- 是否足以直接進入 evidence / convergence
- 下一步應是補件、research、執行分析，還是先回看既有交付物

---

## 3. 正式工作主鏈

所有 entry presets 都必須匯進同一條正式工作主鏈：

> `Task → DecisionContext → Artifact / SourceMaterial → Evidence → Deliverable`

正式規則：
- 不可把 quick inquiry、single document、multi material 拆成三套 payload 或三套持久化世界
- intake 的前半段必須先形成 `case_world_draft`
- 補件必須回到既有案件世界，而不是開出新的孤立 intake 分支
- 來源材料、證據、交付物與發布紀錄都必須保留最小 traceability

補完後，正式理解應是：

> `canonical intake pipeline → case_world_draft → Task / DecisionContext → Artifact / SourceMaterial → Evidence → Deliverable`

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

這些能力可在後續波次補強，但不應被文件寫成已 production-ready。
