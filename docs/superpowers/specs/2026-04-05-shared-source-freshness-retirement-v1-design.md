# Shared-Source Freshness / Retirement V1 Design

## Purpose

這一輪不是做新的 shared-intelligence engine。

先把既有 `shared source lifecycle` 再往前推一小步，讓 system 不只知道來源強不強，也開始更正式地回答：

- 這批 shared source 現在還新不新
- 哪些已偏舊 / 仍在恢復
- 哪些應先退到背景，不要繼續站在主線最前面

## Scope

第一版只做：

1. `domain_playbook_guidance` 補 `freshness_summary`
2. `deliverable_template_guidance` 補 `freshness_summary`
3. 若 shared source 已偏舊 / 仍在恢復，`source_lifecycle_summary` 也更明確寫成先退到背景
4. prompt-safe payload 與既有 second-layer helper 一起讀出 `來源新鮮度`

不做：

- 新資料表
- background job
- 自動 retirement worker
- 新頁面或 dashboard

## Rules

第一波正式規則：

- 若 playbook / template 的 shared source 仍屬近期可直接參考，`freshness_summary` 應誠實讀成仍可直接沿用
- 若 shared source 已偏舊 / 仍在恢復，`freshness_summary` 應誠實讀成先讓較新的 heuristic / pack / shape 站在前面
- 若 stale / recovering source 已不足以主導主線，`source_lifecycle_summary` 應明講它們先退到背景

## Expected Outcome

做完後，Infinite Pro 會更像在整理顧問大腦裡的經驗保鮮節奏，而不是只給一個靜態的「可用 / 不可用」判斷。
