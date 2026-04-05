# Shared-Source Refresh / Reactivation V1 Design

## Purpose

這一輪不是做新的 lifecycle engine，也不是背景 job。

先把既有 `shared-source freshness / retirement` 再往前推一步，讓 system 不只知道哪些 shared source 該淡出，也開始更明確回答：

- 哪些較新的 shared source 已回來
- 這輪是否可重新拉回前景
- 偏舊來源是否仍只留在背景校正層

## Scope

第一版只做：

1. `organization_memory_guidance` 補 `reactivation_summary`
2. `domain_playbook_guidance` 補 `reactivation_summary`
3. `deliverable_template_guidance` 補 `reactivation_summary`
4. prompt-safe payload 與既有 second-layer helper 一起讀出 `來源回前景`

不做：

- 新資料表
- background worker
- 自動 refresh job
- 新頁面或 dashboard

## Rules

第一波正式規則：

- 若較新的同客戶背景與較舊背景並存，organization memory 可明確回答「較新的背景已回來，可重新拉回前景」
- 若 playbook / template 的 shared source 同時存在較新來源與偏舊來源，可明確回答「較新的 shared source 已回來，可重新站到前面」
- 偏舊來源仍要保留，但不得與剛回來的來源混成同一層 authority

## Expected Outcome

做完後，Infinite Pro 會更像在處理顧問大腦裡經驗的回溫與再啟用，而不是只會說一批 shared source 現在偏舊。
