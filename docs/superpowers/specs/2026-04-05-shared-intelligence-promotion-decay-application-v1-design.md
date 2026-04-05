# Shared Intelligence Promotion / Decay Application V1 Design

## Purpose

這一輪不做 precedent 狀態的背景自動化，也不做治理後台。

先做一個很小但可用的版本：

- `shared-intelligence promotion / decay application v1`

也就是讓顧問在 `/history` 的 precedent review lane 上，能直接一鍵套用目前系統已經回出的治理建議。

## Scope

第一版只做：

1. workbench route：套用 governance recommendation
2. history precedent lane：顯示 `套用建議`
3. 仍由顧問人工觸發，不做 auto mutation

不做：

- auto promote / auto dismiss
- background decay job
- batch apply
- governance dashboard

## Rule

只有當 `governance_recommendation.action` 屬於可執行動作時，才允許顯示與套用：

- `promote`
- `demote`
- `dismiss`

若 recommendation 屬於：

- `keep_candidate`
- `keep_promoted`
- `keep_dismissed`

則第一波只顯示摘要，不做按鈕。

## Expected Outcome

做完後，precedent review lane 會從：

- 只告訴你接下來比較應該怎麼治理

往前推成：

- 顧問可以直接低成本套用這個治理建議

但整體仍維持：

- 人工確認
- 低噪音
- 不自動改狀態
