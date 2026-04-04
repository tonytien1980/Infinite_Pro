# Reusable Intelligence Convergence Pass Design

## Purpose

這一輪不是新增第四種 reusable intelligence，而是把已存在的三層收斂成更清楚的分工：

- `reusable review lenses` 回答「這輪先從哪幾個角度看」
- `common risk libraries` 回答「這類案件常漏哪些風險」
- `deliverable shape hints` 回答「這份交付物最後怎麼收比較穩」

目標是讓 Host 更容易正確使用這三層，也讓 workbench second-layer disclosure 更像顧問工作輔助，而不是三組彼此重複的提示卡。

## Problem

目前三層已可運作，但仍有兩個主要問題：

1. `review lenses` 仍可能直接吃 `pack common risks`，導致「先看哪幾點」和「常漏哪些風險」有時候會講成同一件事。
2. `deliverable shape hints` 雖然已能輸出 `primary shape + section hints`，但 precedent snapshot 與 heuristic 合流後，段落名稱與順序仍可能偏內部語言，而不是成熟顧問交付骨架。

## Design Goals

1. 明確分工，而不是擴增表面資訊量。
2. 保持 Host-owned guidance，不讓前端自行拼 checklist。
3. 不新增頁面，不把 UI 做成 precedent dashboard。
4. 文件與程式同步更新，避免後續維運混淆。

## Convergence Rules

### 1. Review Lenses

`review_lens_guidance` 只保留「先看順序 / 先看角度」。

正式規則：

- 可使用 `precedent_reference`
- 可使用 `pack decision patterns`
- 可使用 `task heuristics`
- 不再直接把 `pack common risks` 塞進 `review_lens_guidance`

這代表 review lenses 的每一張卡都應該像：

- 先比對哪個差異
- 先釐清哪個決策邊界
- 先確認哪個角度的材料是否站穩

而不是：

- 先檢查某個高頻風險是否已發生

### 2. Common Risk Libraries

`common_risk_guidance` 專注在「這類案件常漏哪些風險」。

正式規則：

- precedent-derived risk patterns、pack common risks、task heuristics 繼續存在
- 每張卡都應該保留風險提醒語氣，而不是改寫成 review angle
- 若一張 risk card 與 review lens 文字極度相似，應優先讓它留在 risk layer，不回流到 review layer

### 3. Deliverable Shape Hints

`deliverable_shape_guidance` 專注在「這份交付物最後怎麼收」。

正式規則：

- `section_hints` 在寫回前要經過 consultant-facing normalization
- 優先輸出成熟顧問段落語言，例如：
  - `一句話結論`
  - `主要發現`
  - `主要風險`
  - `建議處置`
  - `下一步行動`
  - `待補資料`
- precedent snapshot 若帶有內部或偏原始的段落名，例如 `問題定義`、`分析範圍`、`建議事項`，應先映射成較穩定的顧問閱讀語言，再決定排序
- section 順序應符合「先結論、再發現、再風險、再建議、最後補件 / 下一步」的閱讀節奏

## Host / UI Boundary

這一輪不改六層架構，也不新增新頁面。

- Host 繼續擁有三層 guidance 的收斂與 provider-boundary context 輸入
- UI 只負責 second-layer reading
- `task / deliverable` 仍是主要露出面

## Expected User-Facing Outcome

收斂後，顧問在第二層閱讀上應更容易感受到：

- `review lenses` 是在排閱讀順序
- `common risks` 是在提醒漏看風險
- `deliverable shape` 是在提示交付骨架

而不是看到三組看起來都像「再提醒你一次」的卡片。

