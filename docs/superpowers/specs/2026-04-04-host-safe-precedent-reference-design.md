# Host-Safe Precedent Reference Design

## Goal

precedent / reusable intelligence 現在已經有：

- candidate pool
- candidate governance
- centralized review surface
- review priority ordering

下一步不應直接跳去：

- auto-apply
- template auto-fill
- playbook library shell

而應先補上：

> Host-safe precedent reference layer

也就是讓 Host 在正式工作流中，開始能安全參考少量 precedent patterns，但只把它們當作：

- framing reference
- review lens reminder
- deliverable shape hint

不是舊案內容複製器。

---

## Why this step comes next

如果 precedent 只停在：

- 被存起來
- 被回看
- 被排序

它還沒有真的改善下一案的工作品質。

但如果直接跳去 auto-apply，風險太高：

- 容易照搬舊案
- 容易忽略新案差異
- UI / UX 會開始長出知識庫 shell

因此最合理的中間層是：

- Host 可以參考 precedent
- 顧問可以回讀 Host 參考了什麼
- precedent 只提供模式，不提供整份舊案正文

---

## Design principles

### 1. Host-owned, not UI-owned

precedent reference 必須是 Host-owned。

前端不應自行把 precedent candidate 拼成 prompt，再丟進模型。

正式流程應是：

- backend 選 precedent references
- serialize 成正式 guidance
- Host 再把它帶進 specialist / core analysis request

### 2. Pattern-first, not content-copy

引用 precedent 時，真正可被帶進模型與 UI 的應該是：

- 這類案子通常怎麼 framing
- 這類交付物常用什麼骨架
- 哪些風險或 review lens 常被優先看
- 這個 precedent 為什麼和目前這案相似

不應帶進：

- 舊案全文
- 完整 deliverable 正文
- 大段 recommendation 複製內容

### 3. Safe eligibility before matching

不是所有 candidate 都適合被 Host 參考。

第一波只允許：

- `promoted`
- `candidate` 且 `source_feedback_status` 屬於較強的人類採納訊號

至少排除：

- `dismissed`
- 當前 task 自己剛生成的 candidate
- 沒有明顯相似訊號的候選

### 4. Small retrieval set

第一波只取非常少量 precedent。

建議：

- 最多 2 筆

這樣才能保持：

- prompt 不膨脹
- UI 不變成 precedent dashboard
- Host 不會被 precedent 壓過當前證據

### 5. Explainable matching

每一筆 precedent reference 都應回答：

- 為什麼和這案相似
- 建議怎麼使用
- 不該怎麼使用

---

## Recommended matching model

### Eligibility gate

候選至少要符合：

- `candidate_status != dismissed`
- `source_task_id != current_task_id`
- `candidate_status == promoted`
  或
- `candidate_status == candidate` 且 `source_feedback_status` 為：
  - `adopted`
  - `template_candidate`

### Similarity anchors

至少應有一個強 anchor：

- same `lane_id`
- same `deliverable_type`
- overlap in `domain_lenses`
- overlap in `selected_pack_ids`

若完全沒有 anchor，就不應勉強匹配。

### Ranking inside eligible set

可以採簡單 explainable score：

- same lane
- same deliverable type
- overlapping domain lenses
- overlapping pack ids
- same client stage / client type
- `promoted` bonus
- `template_candidate` bonus

最後仍只取前 1 到 2 筆。

---

## Runtime contract

需要一個新的正式 contract：

### `PrecedentReferenceItem`

至少包括：

- `candidate_id`
- `candidate_type`
- `candidate_status`
- `review_priority`
- `title`
- `summary`
- `reusable_reason`
- `match_reason`
- `safe_use_note`
- `source_task_id`
- `source_deliverable_id`
- `source_recommendation_id`

### `PrecedentReferenceGuidance`

至少包括：

- `status`
  - `available`
  - `no_match`
- `label`
- `summary`
- `recommended_uses`
- `boundary_note`
- `matched_items`

---

## Host payload integration

`AgentInputPayload` 應開始帶：

- `precedent_reference_guidance`

第一波 specialist / core analysis request 不需要完整 object，只需要一個很小的：

- `precedent_context: list[str]`

內容應是已整理過的 pattern lines，例如：

- 這個 precedent 為什麼相似
- 可參考的骨架 / framing
- 不可直接複製舊案正文

---

## UI surface

這一輪仍不新增 precedent 新頁面。

低噪音回讀位置建議放在：

- `task detail` 的 second-layer disclosure
- `deliverable workspace` 的 continuity / research / writeback disclosure

顧問應看得到：

- 系統目前是否找到可參考的既有模式
- 最多 1 到 2 筆
- 為什麼相似
- 建議怎麼用

但這層不應搶首屏。

---

## Non-goals

這一輪明確不做：

- auto-apply
- 自動把 precedent 內容灌進 deliverable
- precedent dashboard
- playbook library
- candidate cross-matter merge UI
- team review workflow

---

## Success criteria

- Host 開始能安全參考 precedent patterns
- precedent 只以小型 pattern context 進模型，不帶舊案正文
- 顧問可回讀 Host 參考了什麼、為什麼
- UI 保持 low-noise
- active docs、runtime contract、QA 對齊
