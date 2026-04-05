# Shared Intelligence Governance Recommendation V1 Design

## Purpose

這一輪不做 precedent 狀態自動化，也不做新的治理後台。

先做一個很小但實際可用的版本：

- `shared-intelligence governance recommendation v1`

也就是讓 precedent review lane 開始正式回答：

- 這筆候選現在比較像可考慮升格
- 先留在候選觀察
- 可考慮降回候選
- 可考慮退場

## Why This Next

目前系統已經有：

- `optimization_signal`
- `shared_intelligence_signal`
- `shared-intelligence weighting`

但還缺：

> 顧問在 precedent review lane 上，下一步到底該怎麼治理這筆候選？

這一輪是在補：

> shared-intelligence 訊號如何被翻成可執行、低噪音的治理建議

## Scope

第一版只做：

1. precedent review read model
2. precedent candidate action ordering
3. 低噪音 governance summary

不做：

- auto promote
- auto dismiss
- batch governance console
- consultant ranking
- 顯性資歷分級

## Read Model

新增 nested object：

- `governance_recommendation`

第一版 contract 至少包括：

- `action`
  - `promote`
  - `keep_candidate`
  - `demote`
  - `keep_promoted`
  - `dismiss`
  - `keep_dismissed`
- `target_status`
- `action_label`
- `summary`
- `rationale`

## Rule

第一版先只根據：

- current `candidate_status`
- `shared_intelligence_signal.weight_action`
- `shared_intelligence_signal.maturity`

轉成治理建議。

核心原則：

- `candidate + upweight` -> 傾向 `promote`
- `candidate + hold` -> 傾向 `keep_candidate`
- `candidate + downweight` -> 傾向 `dismiss`
- `promoted + downweight` -> 傾向 `dismiss`
- `promoted + personal + hold` -> 可考慮 `demote`
- `dismissed` -> 先維持停用

## UX Rules

這一輪 UI 只做低噪音補充：

- `治理建議：...`
- action buttons 把建議動作排在前面

正式規則：

- 不得新增治理 page family
- 不得新增 consultant ranking
- 不得新增批次 auto-governance
- 顧問仍要自己按下治理動作，系統不會自動改狀態

## Expected Outcome

做完後，precedent review lane 不只知道這筆模式目前累積到什麼程度，也會開始回答：

- 那我現在該拿它怎麼辦？

這會讓 precedent governance 開始從「只是有很多狀態按鈕」變成「有明確 shared-intelligence 依據的低噪音治理建議」。
