# Precedent / Reusable Intelligence First Pass Design

## Why this phase now

前 3 條主線目前已經收成可用 baseline：

- flagship workflows 已形成可用 lane 與 second-layer reading
- `Research / Investigation` 已完成 final-mile reading
- retained advisory loop 已完成單人版 MVP

因此下一步不該再只是把「這一案做得更清楚」，而應開始處理：

> 這一案做完之後，哪些東西值得被系統記住，並在下一案被正式重用。

但這一段不能一口氣做成厚重知識庫、聊天記憶體或新的 admin shell。

Infinite Pro 目前最適合的第一步是：

> 先建立 precedent candidate pool，也就是「可重用候選資產池」。

---

## Product goal

這一輪要做的不是完整 precedent platform，而是讓 Infinite Pro 開始具備：

- 把正式採納過的交付物 / 建議，轉成可回看的候選資產
- 用低噪音方式知道「哪些內容值得未來重用」
- 為後續的 playbook、template、review lens、risk library 打底

這一輪明確不做：

- 自動把 precedent 直接套進每一個新案件
- 大型知識庫首頁
- 獨立 precedent 管理後台
- 多人協作治理流程
- 以 chat memory 方式記住所有互動

---

## Design principles

### 1. Human-adopted first

precedent 不能從「有產出」直接升格而來。

第一輪候選池只應建立在：

- explicit adoption feedback
- 已正式存在的治理訊號

其中 explicit feedback 優先級高於 publish / approval / revision。

### 2. Candidate pool before precedent library

第一輪只做 candidate pool，不直接宣稱它們已是正式 precedent library。

也就是：

- 先收集候選
- 再做判斷
- 之後才升格

### 3. Low-noise surface

UI 不能長成新的 knowledge dashboard。

第一輪只允許：

- 在既有 deliverable / task / matter surface 低噪音顯示 precedent candidate 狀態
- 在 management / history family 之後再考慮集中回看

### 4. Host-owned reuse path

未來 precedent 被調用時，也應由 Host 決定怎麼用。

第一輪不能讓前端自行把 precedent 當 prompt snippet 插回流程。

### 5. Reusable pattern, not raw copy

系統要保存的是「值得重用的模式」，不是整份舊案直接複製。

因此第一輪候選至少要抽出：

- 它屬於哪種 lane / posture
- 適用於哪類問題
- 交付物類型
- 建議 / 風險 / 結構重點
- 為什麼值得重用

---

## Approaches considered

### A. Candidate pool first

做一層正式 precedent candidate object，附著在現有 deliverable / recommendation 與 explicit adoption feedback 上。

優點：

- 最符合目前已存在的 adoption-feedback foundation
- 低 UI 風險
- 不會把系統突然做成知識庫產品
- 最容易保持 consultant-first

缺點：

- 第一輪不會立刻讓新案自動變聰明
- 價值會先表現在治理與候選積累，而不是大幅自動化

### B. Auto-suggest templates first

直接讓新案件 intake / task framing 先吃 precedent suggestion。

優點：

- 立刻有「下一案變快」的感覺

缺點：

- 目前 precedent 品質訊號還不夠穩
- 很容易把 UI 變成 suggestion-heavy shell
- 容易誤把低品質產出也帶進下一案

### C. Big knowledge library first

先做 precedent management console / library。

優點：

- 看起來很完整

缺點：

- 幾乎一定過重
- 與目前單人顧問產品節奏不匹配
- 很容易花大力氣做出「很厲害但沒人想打開」的東西

### Recommendation

選 A。

也就是：

> 先做 precedent candidate pool，讓系統先知道哪些東西值得被記住，再考慮怎麼重用。

---

## Scope

### In scope

- 新增正式 `precedent_candidate` runtime object / contract
- 由 `Deliverable` 與 `Recommendation` 建立 precedent candidate
- candidate 來源以 explicit adoption feedback 為主，治理訊號為輔
- 候選資產的低噪音 consultant-facing read model
- 候選資產如何附著在既有工作面
- 為後續 Host retrieval 預留 query-friendly metadata

### Out of scope

- precedent 自動套用到新案
- precedent ranking engine
- precedent dedup / merge intelligence
- playbook authoring console
- team review / approval flow
- client-wide memory graph

---

## Runtime model

### New object

第一輪新增：

- `PrecedentCandidate`

第一輪建議欄位：

- `id`
- `candidate_type`
  - `deliverable_pattern`
  - `recommendation_pattern`
- `source_task_id`
- `source_deliverable_id`
- `source_recommendation_id`
- `source_feedback_status`
- `candidate_status`
  - `candidate`
  - `promoted`
  - `dismissed`
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
- `created_at`
- `updated_at`

### Promotion rule

第一輪先不要做自動 `promoted`。

預設：

- 新建後一律是 `candidate`

之後 phase 才考慮：

- human promotion
- repeated validation
- outcome-backed promotion

### Candidate-creation rule

第一輪正式允許的來源：

- `Deliverable`
  - feedback status = `adopted`
  - feedback status = `needs_revision`
  - feedback status = `template_candidate`
- `Recommendation`
  - feedback status = `adopted`
  - feedback status = `needs_revision`
  - feedback status = `template_candidate`

第一輪正式排除：

- `not_adopted`
- 沒有任何 explicit feedback 的內容

治理訊號可作為附帶 metadata，但不能單獨建立 candidate：

- publish
- approval
- revision history

---

## Pattern snapshot

第一輪 precedent candidate 不需要保存完整案件世界。

只需要保存可重用 pattern snapshot，例如：

- 問題類型摘要
- 這輪 lane / posture
- 交付結構重點
- 建議摘要
- 主要風險摘要
- 適用邊界
- 可重用原因

正式規則：

- 不應把整份 source material 或全文 deliverable 直接當 precedent payload
- 第一輪應以 summary / shape / pattern-first 的方式保存

---

## Read model and UX

### Deliverable surface

當某份交付物已被標記成可建立 precedent candidate 時：

- adoption feedback 區塊附近應能低噪音顯示：
  - 是否已進入候選池
  - 目前候選狀態
  - 為何值得重用

第一輪不需要在首屏 hero 顯示。

### Task surface

若 recommendation 已進入 candidate pool：

- recommendation 卡片附近可顯示低噪音 precedent candidate 狀態

### Matter surface

若這個案件已累積 precedent candidates：

- matter workspace 可用一個很輕的 summary 回答：
  - 這案目前留下了幾個可重用候選
  - 類型是交付物 / 建議哪一種

不新增 precedent dashboard-first hero。

### Management posture

第一輪不新增 precedent library 頁。

若需要集中回看，可先掛在既有 history / management family 的後續 phase。

---

## Host / future integration boundary

這一輪只做 candidate pool，不做 Host automatic retrieval。

但 contract 應預留未來查詢條件：

- lane match
- continuity match
- deliverable type match
- client stage / type match
- domain lens match
- pack match
- keyword match

正式規則：

- future retrieval remains Host-owned
- precedent 不可變成前端自行拼接的 workflow shortcut

---

## Docs impact

這一輪若開始實作，至少要同步更新：

- `docs/00_product_definition_and_current_state.md`
- `docs/01_runtime_architecture_and_data_contracts.md`
- `docs/03_workbench_ux_and_page_spec.md`
- `docs/04_qa_matrix.md`

---

## QA expectations

第一輪至少要驗：

- explicit adoption feedback 可建立 precedent candidate
- `not_adopted` 不會建立 candidate
- deliverable / recommendation read models 會回出 precedent candidate 摘要
- matter surface 的 precedent summary 不會搶首屏主線
- 不會新增新的 dashboard shell

---

## Success criteria

這一輪完成後，Infinite Pro 至少要正式成立：

- 系統已不再只會記住「這案做過了」
- 系統開始知道「這案裡有什麼值得下次重用」
- precedent 還沒有被過度 UI 化
- 顧問日常操作不會因為 precedent 功能而變複雜
