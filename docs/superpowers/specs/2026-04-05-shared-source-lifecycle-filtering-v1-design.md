# Shared Source Lifecycle Filtering V1 Design

## Purpose

這一輪不做新的 lifecycle engine，也不做 background job。

先做一個最小但有用的 slice：

- `shared source lifecycle filtering v1`

也就是讓 `organization memory / domain playbook / deliverable template` 開始分辨 shared source 目前是較穩、還是只適合作為背景校正。

## Scope

第一版只做：

1. `organization_memory_guidance` 補 `source_lifecycle_summary`
2. `domain_playbook_guidance` 補 `source_lifecycle_summary`，並讓較弱 shared source 不過早主導主線
3. `deliverable_template_guidance` 補 `source_lifecycle_summary`，並讓 recovering precedent 不直接覆蓋較穩模板主線
4. prompt context 與既有 low-noise UI surface 一起回讀 `來源狀態`

不做：

- 新資料表
- background freshness job
- organization memory / playbook / template 自己的完整 lifecycle engine
- 新頁面

## Rule

第一波正式規則：

- organization memory 若只有少量 cross-matter item，先讀成背景參考
- domain playbook 若 precedent / cross-matter memory 仍偏 recovering / background-only，先當背景校正，不讓它單獨主導整條工作主線
- deliverable template 若 precedent 仍偏 recovering / background-only，先當背景校正，不讓它直接覆蓋較穩的 pack / shape / heuristic 模板主線

## Expected Outcome

做完後，Infinite Pro 不只會說：

- 這些來源有沒有被用到

也會更誠實地說：

- 這些來源目前是穩定 shared source
- 還是只是背景校正來源

這會讓 shared brain 更像資深顧問：知道哪些經驗可以直接拿來帶方向，哪些經驗還只能先放在旁邊校正。
