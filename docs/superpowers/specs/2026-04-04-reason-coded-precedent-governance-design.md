# Reason-Coded Precedent Governance Design

## Purpose

這一輪是 adoption feedback v1 的第二段。

目標不是再加一層新的 precedent asset，而是讓系統開始正式利用前一輪補進來的 `reason_codes`，回答：

- 這個 precedent 候選為什麼值得先回看
- 這個 precedent 目前更適合拿來參考哪一種用途

## Problem

目前 precedent 已經有：

- candidate pool
- governance
- review surface
- priority ordering
- Host-safe reference

但這些能力雖然知道：

- 有沒有被採用
- 有沒有值得當範本
- 有沒有升格

卻還不夠知道：

- 是因為交付結構好
- 還是因為判斷方式穩
- 還是因為可直接落地
- 還是因為風險掃描特別可重用

結果是：

- precedent review lane 的 priority reason 仍偏粗
- Host reference 的 recommended uses / safe-use note 仍偏 generic

## Scope

這一輪只做兩個地方：

1. `precedent review lane`
2. `Host-safe precedent reference`

不做：

- 新頁面
- 新治理流程
- 自動套用
- playbook library

## Design

### 1. Candidate should carry reason-coded source signal

precedent candidate 在 sync feedback 時，除了 `source_feedback_status` 外，也應正式保留：

- `source_feedback_reason_codes`

這樣 review lane 與 Host reference 不需要重新查 adoption feedback row，就能在 candidate read model 階段理解「為什麼被採納」。

### 2. Review lane should expose low-noise primary reason

`/history` precedent review lane 應補：

- `primary_reason_label`
- `source_feedback_reason_labels`

但 UI 只需要低噪音顯示：

- 一個主要原因

例如：

- `主要原因：可重用的交付結構`
- `主要原因：可重用的行動模式`

### 3. Review priority should become reason-aware

review priority 不需要新增新的等級，但 `review_priority_reason` 應開始吃到 `reason_codes`。

例子：

- 不只是「來自值得當範本的候選，且目前仍待決」
- 而是「來自值得當範本的候選，且主要原因是可重用的交付結構」

這讓 precedence review 比較像顧問在回看方法資產，而不是單純排序待辦。

### 4. Host-safe reference should become reason-aware

`precedent_reference_guidance` 裡：

- `matched_items` 應補上 `primary_reason_label`
- `recommended_uses`
- `safe_use_note`

都應開始依 reason code 更精準。

例如：

- `reusable_structure` / `reusable_deliverable_shape`
  - 優先參考交付骨架與段落順序
- `reusable_reasoning`
  - 優先參考判斷與收斂方式
- `reusable_action_pattern` / `reusable_priority_judgment`
  - 優先參考行動排序與優先順序
- `reusable_risk_scan` / `reusable_constraint_handling`
  - 優先參考漏看風險與限制條件

## UX Rules

- `/history` 只多一行低噪音原因，不新增欄位群
- `task / deliverable` precedent reference 仍維持現有 second-layer disclosure
- 不新增 precedent wizard / chooser
- 不把 reason codes 直接露成內部 code id

## Expected Outcome

做完後，precedent 不只知道「這筆模式存在」，而是開始知道：

- 它為什麼值得保留
- 它現在比較適合幫哪一種判斷

也就是從「有 precedent」往「precedent 變得可讀、可用、可解釋」前進一步。

