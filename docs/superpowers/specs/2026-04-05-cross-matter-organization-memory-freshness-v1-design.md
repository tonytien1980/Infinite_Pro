# Cross-Matter Organization Memory Freshness V1 Design

## Purpose

這一輪不做新的 page family，也不做 background refresh job。

先補一個很小但實用的 slice：

- `cross-matter organization memory freshness v1`

也就是讓 system 開始分辨跨案件背景目前是最近更新、近期可參考，還是已偏舊。

## Scope

第一版只做：

1. `organization_memory_guidance` 補 `freshness_summary`
2. 每筆 `cross_matter_item` 補 `freshness_label`
3. prompt context 與既有 low-noise UI surface 一起回讀背景新鮮度
4. `domain_playbook_guidance` 若吃到偏舊的 cross-matter background，先把它留在背景校正層

不做：

- background refresh job
- 自動淘汰 organization memory rows
- 新頁面

## Rule

第一波 freshness 規則：

- 最近更新：最近仍有明顯更新，可直接當穩定背景
- 近期可參考：可參考，但仍建議先當背景校正
- 較舊背景：先留在背景參考，不急著主導這輪判斷

## Expected Outcome

做完後，Infinite Pro 會更像資深顧問在用自己的記憶：

- 最近做過、還很新的案件背景，可以更放心拿來用
- 太舊的背景，仍然記得，但先放旁邊校正，不直接主導新的判斷
