# Matter-Scoped Precedent Duplicate Governance Design

## Goal

precedent / reusable intelligence 現在已經有：

- candidate pool
- candidate governance
- review surface
- review priority
- Host-safe reference

下一個最自然的缺口是：

> 同一個案件世界裡，若留下兩筆其實很像的 precedent candidates，系統要能先把「怎麼參考」整理乾淨。

這一輪不是在刪資料。

這一輪是要回答：

- 哪些 precedent candidates 很可能其實是同一種模式
- 目前應該先合併看，還是保留分開
- Host 在參考 precedent 時，要不要先避開重複模式

---

## Why this comes next

現在 precedent 已開始進入 Host-safe reference。

如果同一案件世界裡留下兩三筆很像的 candidate，會有 3 個問題：

- 顧問在 `/history` 回看時會覺得重複
- Host reference 可能會吃到重複模式
- 後面要長成真正 reusable intelligence 時，候選池會越來越亂

所以在進一步做：

- review lens library
- risk library
- deliverable template hint

之前，應先做 matter-scoped duplicate governance。

---

## Design principles

### 1. Matter-scoped only

第一波只處理：

- 同一個 `matter_workspace`

不處理：

- 跨案件世界 merge
- 全域 precedent dedupe

### 2. Reference cleanup, not data deletion

這一輪不能靜默刪除 raw precedent rows。

raw candidates 仍要保留，整理的是：

- review reading
- Host reference selection

### 3. Suggest first, govern second

系統可以先提出：

- `merge_candidate`

但最後仍應保留人工決定：

- `human_confirmed_canonical_row`
- `keep_separate`
- `split`

### 4. Low-noise placement

precedent duplicate governance 仍應留在既有 `/history` precedent family。

不應新增：

- precedent governance dashboard
- canonicalization page family

### 5. Host should collapse duplicates by default

即使人工還沒 review，

Host-safe reference 也應先避免把同一組 duplicate pattern 重複帶進模型。

所以第一波規則應是：

- unresolved duplicate group 預設只取 1 筆代表 candidate 進 Host reference
- 若人工標記 `keep_separate` 或 `split`，才允許全數保留

---

## Duplicate detection model

第一波先採保守規則，只抓高信心 duplicate：

- same `matter_workspace_id`
- same `candidate_type`
- same normalized title
- same `lane_id`
- same `deliverable_type`

這一輪的目的是：

- 先抓非常像的 duplicate
- 不追求模糊相似

### Default representative

如果同一組 duplicate 還未人工處理，系統先選 1 筆代表 candidate：

優先順序：

1. `promoted`
2. `template_candidate`
3. `adopted`
4. 最近更新

這筆代表 candidate 只影響：

- Host reference
- duplicate reading

不影響 raw rows 本身。

---

## Runtime contract

需要新增：

### `PrecedentDuplicateSummary`

至少包括：

- `pending_review_count`
- `human_confirmed_count`
- `kept_separate_count`
- `split_count`
- `summary`

### `PrecedentDuplicateCandidate`

至少包括：

- `matter_workspace_id`
- `matter_title`
- `review_key`
- `review_status`
- `suggested_action`
- `confidence_level`
- `consultant_summary`
- `canonical_candidate_id`
- `canonical_title`
- `candidate_ids`
- `candidate_titles`
- `task_ids`
- `task_titles`
- `candidate_count`
- `resolution_note`
- `resolved_at`

### `MatterPrecedentDuplicateReview`

需要新的 persistence row，至少包括：

- `matter_workspace_id`
- `review_key`
- `review_status`
- `confidence_level`
- `consultant_summary`
- `resolution_note`
- `canonical_candidate_id`
- `candidate_ids`
- `task_ids`
- `resolved_by`
- `resolved_at`

---

## UI shape

`/history` precedent review lane 裡應補一塊低噪音 duplicate governance：

- summary card
- duplicate review list
- item-level actions

每一組 duplicate 至少能做：

- `確認同一模式`
- `保留分開`
- `拆成不同模式`

第一波不做：

- bulk action
- drag and drop
- merge wizard

---

## Host interaction

Host-safe precedent reference 要開始 consult duplicate governance：

- `human_confirmed_canonical_row`
  - 只用 canonical candidate
- `keep_separate`
  - 全數保留
- `split`
  - 全數保留
- unresolved
  - 預設只取代表 candidate

這樣能先減少 duplicate precedent 對模型的噪音。

---

## Success criteria

- 同一案件世界裡的 duplicate precedent candidates 可被集中看見
- 顧問可低噪音決定合併看或保留分開
- Host reference 預設不再把同一組 duplicate pattern 重複帶進模型
- raw candidate rows 不被靜默刪除
- 程式、docs、QA 對齊
