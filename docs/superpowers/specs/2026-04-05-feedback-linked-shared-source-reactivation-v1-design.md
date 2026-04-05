# Feedback-Linked Shared-Source Reactivation V1 Design

## Purpose

這一輪不是再做一層新的 lifecycle engine。

先把既有 `shared-source refresh / reactivation` 往前推成更誠實的一刀：

- 若 shared source 回前景，system 不只說「有較新的 source 回來了」
- 也開始更明確回答：
  - 是不是新的 precedent 採納回饋把它拉回前景
  - 還是只是 generic freshness 的回溫

## Scope

第一版只做：

1. `domain_playbook_guidance` 的 feedback-linked reactivation wording
2. `deliverable_template_guidance` 的 feedback-linked reactivation wording
3. `PrecedentReferenceItem` 正式帶 `source_feedback_status`

不做：

- 新資料表
- precedent auto-promotion
- 新頁面
- consultant ranking

## Rules

第一波正式規則：

- 若回前景主要由新的 `adopted` precedent 觸發，playbook / template 可誠實寫成「新的採納回饋已把這類 shared source 拉回前景」
- 若回前景主要由新的 `template_candidate` precedent 觸發，template 可誠實寫成「新的範本候選回饋已把這類模板主線拉回前景」
- 若沒有明顯 feedback link，仍可保留 generic reactivation wording

## Expected Outcome

做完後，Infinite Pro 會更像是在消化顧問們真實留下的採納訊號，而不是只用 source 新舊去猜哪些模式重新變得可信。
