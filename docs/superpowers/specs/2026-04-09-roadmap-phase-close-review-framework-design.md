# Roadmap Phase Close Review Framework Design

> 文件狀態：Proposed design
>
> 本文件把 `docs/06_product_alignment_and_85_point_roadmap.md` 缺少的「本階段如何誠實收尾」邏輯正式定義出來，避免未來 session 把 `v1 完成`、`本階段完成`、`85 分 target state` 與 `可開新 decision phase` 混為一談。

---

## 1. Problem

`docs/06` 已清楚定義：

- canonical product vision
- A 到 H 的 planning scorecard
- `7.1` 到 `7.5` 的主線與完成判準
- 不可 overclaim 的邊界

但它還缺一個正式框架，去回答更實務的問題：

1. `7.1` 到 `7.5` 做到什麼程度，才算這一輪真的可以收尾
2. 哪些項目只是 `v1 完成`，哪些可以視為 `本階段完成`
3. 什麼情況下可以合法開新方向，而不必再把新工作硬掛在 `7.1` 到 `7.5`
4. `Phase 6 closeout review` 這種 runtime read model，和 repo / product 層的 phase close 判定，到底是不是同一件事

如果沒有這個框架，後續 session 很容易犯三種錯：

- 把 `v1` 誤寫成 fully mature
- 把 phase-level read model 誤寫成產品 phase 已正式收工
- 把還沒收好的舊主線，硬塞進新方向裡繼續延伸

---

## 2. Design Goal

這個框架要正式回答兩件不同的事，而且不能混在一起：

1. `本階段是否可收工`
   - 這是在判斷 `docs/06` 這一輪主線是否已到一個誠實、可交接、可結案的狀態

2. `距離 85-point target state 還差多少`
   - 這是在判斷產品是否已達到更成熟的長期目標

正式規則應是：

- `可收工` 不等於 `已達 85`
- `v1 完成` 不等於 `終局完成`
- `system 內部 phase-6 closeout read model` 不等於 `repo / product phase close authority`

---

## 3. Non-Goals

這個框架不做以下事情：

- 不新增新的 runtime read model
- 不新增新的 governance dashboard family
- 不把 `docs/06` 變成新的 project-management shell
- 不把 A 到 H 的 score 變成自動化數學評分器
- 不要求每一條主線都在本階段做到長期終局成熟度

---

## 4. Proposed Structure

### 4.1 Canonical home

真正可 handoff 的 phase-close framework 應直接寫入：

- `docs/06_product_alignment_and_85_point_roadmap.md`

因為：

- `docs/06` 已是本階段唯一 active roadmap handoff
- phase close 的 authority 必須和 roadmap 主線放在一起
- 這樣未來 session 不會再跑去把收尾邏輯藏在 `spec only` 或 phase-level runtime note 裡

### 4.2 Supporting clarification

另外應在：

- `docs/00_product_definition_and_current_state.md`

補一條澄清：

- `phase-6 closeout review / sign-off / handoff` 是 system runtime 內的 read model
- `7.1` 到 `7.5` 這一輪 repo / product phase 是否可正式收工，仍由 `docs/06` 的 close review framework 判定

這能避免之後再次把兩層 closeout 混在一起。

---

## 5. Framework Definition

### 5.1 Two different closure questions

未來每次 close review 都要先分開回答：

1. `Roadmap tranche close question`
   - 這一輪 `7.1` 到 `7.5` 是否已到可收工、可交接、可開新 decision phase 的程度

2. `85-point maturity question`
   - 整體產品是否已接近或達到平均 85 分以上

正式規則：

- 第一題答 `是`，第二題仍可答 `還沒`
- 這不是矛盾，而是代表「這一輪主線收好了，但長期成熟度還有下一輪」

### 5.2 Allowed line statuses

每條主線只能使用以下狀態，不可自由發明：

- `未開始`
  - 還沒有 spec / plan / implementation
- `僅有規劃`
  - 只有 spec / plan，還沒有真實 implementation 與驗證
- `進行中`
  - 已有 implementation，但還未到可誠實收口的程度
- `v1 完成`
  - 第一個真實、可驗證、可 handoff 的完成點已成立
  - 但明確不是終局成熟度
- `本階段完成`
  - 依本階段批准範圍，這一條已可收口
- `轉入下一階段 backlog`
  - 不代表沒做
  - 代表剩餘 gap 已明確記帳，且不再算本階段 blocker

### 5.3 Phase-close gates

這一輪 phase 是否可收尾，至少要通過六個 gate：

1. `方向 gate`
   - 工作仍忠於 `Single-Consultant Full-Scope Edition`
   - 沒有滑向 training shell、admin console、dashboard family、multi-tenant shell

2. `主線 gate`
   - `7.1` 到 `7.5` 每一條都必須至少達到：
     - `v1 完成`
     - 或 `本階段完成`
   - 不允許仍停在 `未開始`、`僅有規劃` 或早期 `進行中`

3. `對齊 gate`
   - active docs、repo code、QA / benchmark evidence 的責任分工清楚
   - 不能只在 spec/plan 寫了，就把主線視為完成

4. `驗證 gate`
   - 需要有 fresh verification evidence
   - 有 shipped behavior 變化時，`docs/04` 必須有對應 evidence
   - 有 benchmark / coverage 變化時，`docs/05` 必須有對應 evidence

5. `同步 gate`
   - local 與 GitHub 狀態必須說得清楚
   - 不可讓 branch / main / remote 長期失配又假裝 phase 已結束

6. `carry-forward gate`
   - 任何未完成到終局成熟度的項目，都要明確寫成下一階段 backlog
   - 並回答：
     - 還差什麼
     - 為什麼不是本階段 blocker
     - 下一階段應掛在哪條新主線

### 5.4 Closeout outcomes

phase close review 的最後結論只能落在四種結果之一：

- `不可收工`
  - 至少有一條主線仍停在 `未開始`、`僅有規劃`，或關鍵 blocker 未排除

- `可進收尾審查`
  - 所有主線都已有真實 implementation
  - 但 remaining gap 還沒有被正式記帳或分流

- `條件式可收工`
  - 所有主線至少都到 `v1 完成`
  - 剩餘 gap 已明確轉成下一階段 backlog
  - 但仍有少量同步、驗證、或 close memo 還沒補完

- `正式收工`
  - 所有 gate 均通過
  - 本階段可以合法結束
  - 下一輪可以從新的 decision phase 啟動，不需再硬掛 `7.1` 到 `7.5`

### 5.5 Minimum close review record

每次正式收尾，至少要有一個 close review 記錄回答：

- 本階段 scope 是什麼
- `7.1` 到 `7.5` 各自目前狀態是什麼
- 哪些是 `v1 完成`
- 哪些是 `本階段完成`
- 哪些 gap 被轉進下一階段 backlog
- 最後結論是：
  - `不可收工`
  - `可進收尾審查`
  - `條件式可收工`
  - `正式收工`

---

## 6. Closure Rule For The Current `docs/06` Phase

針對本輪 `7.1` 到 `7.5`，正式規則應是：

- 本階段要能收工，不要求每一條都達到 85 target state
- 但要求每一條都至少到第一個誠實的可 handoff 完成點

因此本輪正確的 close rule 應是：

- `7.1`
  - 必須達到 `本階段完成`
- `7.15`
  - 若此插段被採用，必須達到 `本階段完成`
- `7.2`
  - 必須達到「本階段批准範圍內的完成點」
  - KPI / business outcome attribution 可轉入下一階段 backlog
- `7.3`
  - 至少要 `v1 完成`
  - coverage baseline、thin/missing posture、suite / manifest / docs 對齊要真實存在
- `7.4`
  - 至少要 `v1 完成`
  - 允許 `task detail` 留到下一階段
- `7.5`
  - 至少要 `v1 完成`
  - 允許 browser smoke automation 或 Docker-specific runtime gate 留到下一階段

這樣的設計，才能同時滿足：

- 不把 `v1` 誤寫成終局完成
- 不把明顯未完的主線硬判成已結束
- 也不把本來就應該進下一階段的補厚工作，硬留在本階段不放

---

## 7. Recommended Landing

### 7.1 Files to update

- 新增：
  - `docs/superpowers/specs/2026-04-09-roadmap-phase-close-review-framework-design.md`
- 更新：
  - `docs/06_product_alignment_and_85_point_roadmap.md`
  - `docs/00_product_definition_and_current_state.md`

### 7.2 Expected outcome

落地後，未來 session 應能更穩定回答：

- 目前這一輪是不是已可收工
- 哪些只是 `v1`
- 哪些已可視為本階段完成
- 是否已能合法開新 decision phase

而不會再混成：

- runtime phase-6 closeout read model
- repo / product roadmap phase close
- 85-point long-term maturity target

