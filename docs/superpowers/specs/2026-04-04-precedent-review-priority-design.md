# Precedent Review Priority Design

## Goal

在 precedent candidate pool、candidate governance、集中回看 surface 都已成立之後，下一個最自然的補強不是自動套用，而是：

> 讓 `/history` 裡的 precedent review lane 先有一個低風險、可理解的建議排序。

這一輪要回答的是：

- 目前哪幾個候選最值得先回看
- 為什麼它們應該排在前面

這一輪不做：

- auto-apply
- Host retrieval
- precedent dashboard
- 黑箱分數系統

---

## Why ranking is needed now

precedent candidates 一旦超過少量，單靠：

- 狀態篩選
- 類型篩選
- 關鍵字搜尋

還不夠。

顧問仍然會遇到：

- 不知道先看哪一筆
- promoted 跟 candidate 混在一起時，不知道哪個更急
- `template_candidate` 與 `needs_revision` 的價值差異沒有被體現

因此這一輪需要一個非常輕的 review priority，先把回看順序拉順。

---

## Design principles

### 1. Ranking is review guidance, not truth scoring

這不是在說某個 precedent 比另一個「更正確」。

它只是在說：

- 對現在的 precedent review 工作來看
- 哪些 item 比較值得先回看

### 2. Backend owns the order

precedent review 的建議順序應由 backend read model 統一產生。

原因：

- 前後端不能各有一套排序邏輯
- 未來若 Host 要安全參考 precedent，也可以沿用同一個 baseline

### 3. Explainable over clever

這一輪不用隱含評分或複雜 weighting。

顧問應至少能讀到：

- `建議先看`
- `可安排下一輪`
- `先放背景`

以及一句理由。

### 4. Candidate first, dismissed last

排序應先服務治理節奏。

因此原則上：

- `candidate` 應排在最前
- `promoted` 排中間
- `dismissed` 排最後

### 5. Explicit adoption signal should matter

既然 precedent pool 是從 adoption feedback 長出來的，review priority 也應體現這個訊號。

因此：

- `template_candidate` 應比 `adopted` 更適合作為優先回看對象
- `adopted` 應比 `needs_revision` 更靠前

---

## Recommended priority model

第一輪採三段式：

- `high`
- `medium`
- `low`

對應的顧問語言：

- `high` -> `建議先看`
- `medium` -> `可安排下一輪`
- `low` -> `先放背景`

---

## Recommended ranking rules

### High priority

符合以下任一條件即可列為 `high`：

- `candidate` 且 `source_feedback_status = template_candidate`
- `candidate` 且 `source_feedback_status = adopted`

理由：

- 這些 item 仍在候選中
- 而且已經有較強的人類採納訊號
- 最值得優先決定要不要升格成正式可重用模式

### Medium priority

符合以下任一條件列為 `medium`：

- `candidate` 且 `source_feedback_status = needs_revision`
- `promoted`

理由：

- `needs_revision` 代表還有價值，但還不夠穩
- `promoted` 已完成正式升格，仍可回看，但不該搶在待決候選前面

### Low priority

以下列為 `low`：

- `dismissed`

理由：

- 仍要保留可回看與可恢復能力
- 但不應與待決候選搶前排位置

### Tie-breaker

同一 priority 內採：

1. `updated_at desc`
2. `created_at desc`

這樣能讓最近有治理動作的 item 比較靠前。

---

## UI reading

`/history` precedent review lane 應新增兩個低噪音訊號：

- priority label
- priority reason

每個 item 至少可讀成：

- `建議先看`
- `來自 template_candidate，且仍在候選中，值得先決定是否升格`

或：

- `可安排下一輪`
- `這個模式已正式升格，目前比較適合週期性回看`

或：

- `先放背景`
- `這個候選目前已停用，保留回看與恢復能力即可`

---

## Summary reading

precedent review panel summary 可補一個很輕的訊號：

- 目前建議先回看的候選數

但不應做成：

- 總分排行榜
- heatmap
- dashboard hero

---

## Runtime contract changes

集中 precedent review API 應多回：

- `review_priority`
- `review_priority_reason`

summary 至少多回：

- `high_priority_count`
- `medium_priority_count`
- `low_priority_count`

---

## Success criteria

- `/history` precedent review lane 預設就按建議順序排列
- 顧問能一眼看懂哪些 candidate 值得先回看
- priority 規則可用一句白話理由解釋
- 不新增 precedent page family
- 不把 precedent 做成自動套用或黑箱分數系統
