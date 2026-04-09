# Docs 06 Second Tranche To 85 Design

> 文件狀態：Proposed design
>
> 本文件定義 `docs/06_product_alignment_and_85_point_roadmap.md` 在第一 tranche 正式收尾後，應如何在同一份 active roadmap 內續寫第二 tranche，而不提早拆成新的 active top-level doc。

---

## 1. Problem

目前 `docs/06` 已有：

- canonical product vision
- A 到 H 的 planning scorecard
- `7.1` 到 `7.5` 第一 tranche 主線
- `Phase Close Review Framework`

而依這個 framework，第一 tranche 已可誠實收工：

- `7.1`、`7.15`、`7.2` 已到本階段完成點
- `7.3`、`7.4`、`7.5` 已到 `v1 完成`
- 剩餘 gap 已可合法轉入下一階段 backlog

但現在出現新的文件治理問題：

1. 下一階段是否仍屬於 `docs/06` 的問題域
2. 若仍屬於 `docs/06`，那第二 tranche 是否還應沿用舊的 `7.1` 到 `7.5`
3. 若不沿用舊分類，active docs 要如何重新 handoff，才不會讓未來 session 又回到靠對話記憶判方向

如果沒有新的 tranche framing，後續很容易犯三種錯：

- 繼續把所有新工作硬掛在舊的 `7.1` 到 `7.5`
- 太早開新 active top-level doc，導致 `docs/06` 與新文件同時當 roadmap truth
- 把第二 tranche 誤解成只是第一 tranche 的零碎補洞，而不是新的補強結構

---

## 2. Decision

本設計的正式決定是：

- **下一階段仍留在 `docs/06_product_alignment_and_85_point_roadmap.md` 內**
- **不新增新的 active top-level doc**
- **第二 tranche 不再沿用舊的 `7.1` 到 `7.5` 當主分類**

更精確地說：

- `docs/06` 仍是 active roadmap SSOT
- 第一 tranche 要在 `docs/06` 內被明確標為已收尾
- 第二 tranche 要在 `docs/06` 內用新的主線名稱承接下一批 gap

---

## 3. Why Not A New Active Doc Yet

現在不適合開新的 active top-level doc，原因有三個：

1. `問題域仍相同`
   - 現在要補的，仍然是 `docs/06` 已點名的 85-point gap
   - 還不是全新產品問題

2. `治理風險較高`
   - 若現在開 `docs/07`，很容易讓 `docs/06` 與新文件同時承接「下一階段 roadmap」
   - active truth 會分裂

3. `方向還不是新宇宙`
   - 現在更像：
     - 第一 tranche 建立 baseline
     - 第二 tranche 補厚、補深、補可信度
   - 不是另起一個新的產品定義

正式規則：

- 只有當下一輪已明顯脫離 `85-point alignment` 的問題域，才考慮開新的 active top-level doc
- 在那之前，`docs/06` 應保持為唯一 active roadmap

---

## 4. Design Goal

第二 tranche 的 framing 必須同時做到四件事：

1. 誠實標記第一 tranche 已收尾
2. 把第一 tranche 的未盡 gap 合法轉入下一輪
3. 定義第二 tranche 的新主線，而不是繼續硬用舊的 `7.1` 到 `7.5`
4. 保持 `docs/06` 作為唯一 active roadmap handoff

---

## 5. Non-Goals

這個設計不做以下事情：

- 不重新評分 A 到 H
- 不重寫第一 tranche 的 shipped history
- 不把 `docs/06` 改成 project management board
- 不把第二 tranche 直接擴成新的 multi-user / enterprise phase
- 不在這一刀裡決定第二 tranche 的所有 implementation slices

---

## 6. Proposed `docs/06` Structure

### 6.1 Keep one roadmap, add two explicit tranche sections

`docs/06` 應新增兩個明確段落：

1. `First Tranche Close Review`
   - 記錄第一 tranche 如何通過 close review
   - 說清楚哪些已完成、哪些是 `v1`、哪些轉入下一階段 backlog

2. `Second Tranche To 85`
   - 作為下一輪唯一正式 roadmap 入口
   - 重新定義第二 tranche 的主線

### 6.2 First tranche section should be retrospective, not reopened roadmap

`First Tranche Close Review` 的角色應是：

- 結案記帳
- 誠實說明第一 tranche 做到哪
- 明確說明哪些 gap 仍存在

它不應再被寫成：

- 還在進行中的 roadmap
- 仍要持續被切 slice 的主線區

### 6.3 Second tranche section should be forward-looking

`Second Tranche To 85` 的角色應是：

- 定義接下來要補的真正短板
- 讓未來 session 有新的主線名稱可掛
- 避免每個新工作都回頭硬掛在舊 `7.1` 到 `7.5`

---

## 7. Proposed Second Tranche Themes

第二 tranche 的主線，應針對第一 tranche 留下的 gap 重新整理，而不是照抄舊分類。

### 7.1 T2-A: Coverage density and proof deepen

主問題：

- `7.3 v1` 已成立，但 coverage 仍偏薄

應承接的 gap：

- `client_stage / client_type / continuity / cross-domain` 的薄弱 lane 補厚
- representative seed cases 增密
- proof posture 從「有 baseline」走向「更站得住」

這條線主要對應：

- B
- C
- D

### 7.2 T2-B: Reusable intelligence effectiveness deepen

主問題：

- `7.2` 已做到 persisted scoring foundation，但還沒真正把「哪些 reusable asset 真的有效」拉到更可信的產品層

應承接的 gap：

- KPI / business outcome attribution 是否值得做、做到哪裡才不失真
- reusable posture 與 evidence effect 的更成熟讀法
- feedback / deliverable / outcome / writeback 之間的可信回寫邏輯

這條線主要對應：

- H
- F

### 7.3 T2-C: Consultant operating leverage and task-surface usability

主問題：

- `7.4 v1` 已補 overview / matter / deliverable，但 `task detail` 與更高槓桿的顧問工作導引仍偏薄

應承接的 gap：

- `task detail` 的 usability pass
- consultant operating leverage framing
- 如何讓高階顧問感受到更高槓桿，而不是只是不迷路

這條線主要對應：

- G
- F

### 7.4 T2-D: Runtime and release confidence deepen

主問題：

- `7.5 v1` 已有 baseline，但 `browser smoke`、Docker-specific runtime gate、live confidence 仍不夠穩

應承接的 gap：

- browser smoke 常態化
- runtime verification discipline 更完整
- release-readiness 的 confidence uplift

這條線主要對應：

- F

---

## 8. What Carries Forward From First Tranche

第一 tranche 應轉進第二 tranche backlog 的內容，至少包括：

- `7.2`
  - KPI / business outcome attribution 是否成立、如何成立
- `7.3`
  - coverage density、更多 representative cases、thin lane 補厚
- `7.4`
  - `task detail` usability
- `7.5`
  - browser smoke automation
  - Docker-specific runtime verification

正式規則：

- 這些項目在第二 tranche 中應被重新分流到新的 tranche themes
- 不再以「舊 `7.x` 還沒做完」的姿態存在

---

## 9. Relationship To `docs/00`

`docs/00` 應保持最小同步即可。

正式做法：

- 保留 `Single-Consultant Full-Scope Edition`
- 保留 `P0 hardening line is formally closed`
- 保留「新工作應從新的 decision phase 啟動」
- 不在 `docs/00` 詳列第二 tranche 主線

原因：

- `docs/00` 處理的是產品身份與 current state
- `docs/06` 才是 active roadmap 與 tranche handoff authority

---

## 10. Implementation Shape

這份設計被批准後，後續 implementation 應是 docs-only：

1. 更新 `docs/06`
   - 新增 `First Tranche Close Review`
   - 新增 `Second Tranche To 85`
   - 把原本 future-session usage 規則更新成新 tranche 讀法

2. 視需要最小更新 `docs/00`
   - 只補一句「目前 active next-step roadmap 仍由 `docs/06` 承接」

3. 不在這一刀裡改 runtime / frontend / benchmark code

---

## 11. Expected Outcome

落地後，未來 session 應能清楚回答：

- 第一 tranche 是否已正式收尾
- 第二 tranche 是否仍屬於 `docs/06`
- 後續新工作該掛在哪條新主線
- 什麼時候才真的需要開新的 active top-level doc

正式結果應是：

- `docs/06` 仍是唯一 active roadmap
- 第一 tranche 被正式結案
- 第二 tranche 成為新的可 handoff 主線
- 未來工作不再硬掛舊 `7.1` 到 `7.5`

