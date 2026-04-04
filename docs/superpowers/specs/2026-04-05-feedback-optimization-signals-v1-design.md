# Feedback Optimization Signals V1 Design

## Purpose

這一輪不做完整 team collaboration，也不做大型治理殼。

先做一個很小但方向正確的第一版：

- `precedent optimization signal`

也就是讓系統不只知道：

- 這筆 precedent 有沒有被採用
- 這筆 precedent 的主要原因是什麼

還開始知道：

- 這筆 precedent 對哪種 reusable asset 最有幫助
- 這筆 precedent 的參考強度大概多高
- Host 後續應該多優先相信它，還是先放背景

## Why This First

目前 precedent / reusable intelligence 已經有：

- explicit adoption feedback
- reason codes
- candidate pool
- review priority
- Host-safe reference
- reusable assets routing

但這些還比較像：

> **系統知道它「被保留了」**

還不是：

> **系統知道它「未來應該多大程度影響下一案」**

所以這一輪是在補：

> **從 human feedback 走向可被 Host 使用的 optimization signal**

## Scope

第一版只做：

1. precedent review lane
2. Host-safe precedent reference
3. 低噪音 precedent UI readback

不做：

- team identity
- shared team roles
- cross-user weighting
- 自動調整所有 routing policy
- 自動閉環優化引擎

## Role Separation

這層必須和既有 contract 分清楚：

- `review_priority`
  - 回答：這筆候選值不值得先看
- `primary_reason_label`
  - 回答：它為什麼被保留
- `optimization signal`
  - 回答：它對哪類 reusable asset 最有幫助、參考強度如何

也就是：

- `review_priority` = review order
- `reason_label` = retained because...
- `optimization_signal` = best future reuse signal

## Read Model

新增 nested object：

- `optimization_signal`

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

## Host Usage

第一版只允許：

- precedence review sorting 的細微加權
- Host-safe precedent reference 的 explainability 強化
- reusable asset routing 的 explainability 強化

不允許：

- 黑箱自動調整全部 orchestration
- 未經 Host 就讓前端自行推論可重用權重

## UI Rules

這一輪 UI 只做低噪音補充，不新增新頁面。

### History / precedent review

可低噪音補：

- `最佳幫助：...`
- `參考強度：...`

### Task / deliverable precedent reference

可低噪音補：

- 這筆 precedent 現在最能幫哪種 reusable asset
- 它屬於較強或較弱的 optimization signal

## Expected Outcome

做完後，系統會開始更像：

- 不只記得 precedent 為什麼被保留
- 也知道這筆 precedent 對未來哪一種 reusable asset 更有價值

這會是後面真正做 team-shared intelligence、cross-user weighting 與更成熟 feedback loop 的最安全地基。
