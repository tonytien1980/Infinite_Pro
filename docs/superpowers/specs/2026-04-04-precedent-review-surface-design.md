# Precedent Review Surface Design

## Goal

在 precedent candidate pool 與最小治理能力都已成立之後，下一個最自然的能力不是自動套用，而是：

> 讓顧問能在同一個地方集中回看目前有哪些 precedent candidates，以及它們現在分別處於 `candidate / promoted / dismissed` 哪個狀態。

這一輪的目標是做一個低噪音的 review surface，不做新的 precedent page family。

---

## Why this surface should live in `/history`

Infinite Pro 現在已經有一個正式的 `history` 工作面，責任是：

- 回看過去做過的工作
- 重新打開原始工作脈絡
- 做低風險整理與收納

precedent candidate 的集中回看，本質上也屬於：

- 回看過去留下了什麼
- 決定哪些值得保留、哪些先停用

因此它比起新頁面，更適合落在既有 `history / management` family。

這樣可以維持：

- 不增加主導航
- 不新增 precedent dashboard
- 不把 precedent 做成另一個產品殼

---

## Design principles

### 1. Review surface, not library shell

這一輪是 review surface，不是 precedent library。

所以它應回答：

- 目前有哪些候選
- 它們是什麼類型
- 它們是 `candidate / promoted / dismissed` 哪種狀態
- 從哪個案件 / 任務 / 交付物來

而不是回答：

- 如何自動套進新案
- 如何做大規模知識管理

### 2. Same page, separate lane

`/history` 裡應把 precedent review 視為另一條低噪音回看 lane。

也就是：

- 不混進一般 task history list 的主表格邏輯
- 但也不分裂成新頁面

### 3. Filter-first

precedent 集中回看最重要的是篩選，不是總覽數字。

第一輪至少要能篩：

- `全部`
- `candidate`
- `promoted`
- `dismissed`
- `deliverable_pattern`
- `recommendation_pattern`

### 4. Action stays near the item

集中回看頁面可以看到每個 candidate 的狀態，但治理 action 仍應盡量靠近 item 本身。

因此這一輪可以在 precedent review list 裡直接提供：

- 升格
- 降回候選
- 停用
- 恢復

但不要做 bulk action。

### 5. Consultant-first copy

這一層要用顧問可理解的語言，不用知識工程術語。

例如：

- `可重用候選`
- `正式可重用模式`
- `已停用`
- `來自哪一案 / 哪個交付物`

---

## Approaches considered

### A. New `/precedents` page

優點：

- 結構最乾淨

缺點：

- 又多一個 page family
- 很容易變成 precedent dashboard
- 不符合這一輪的「低噪音、先嵌入既有工作台」原則

### B. Put precedent review inside `/history`

優點：

- 最符合既有 IA
- 最不會增加心智負擔
- 仍然保有集中回看能力

缺點：

- `history` 頁面責任會稍微變重
- 需要把 precedent lane 和 task-history lane 清楚分隔

### C. Only keep item-level review, no centralized view

優點：

- 最省工

缺點：

- 一旦 precedent 變多，就很難回看
- 會讓 candidate pool 沒有真正的 review surface

### Recommendation

選 B。

---

## UX shape

`/history` 第一屏仍維持歷史紀錄工作面的主定位。

precedent review 應作為同頁的第二條管理 lane 出現：

- 一個獨立 panel
- 一組簡單 filter
- 一個 precedent list

第一輪不應：

- 搶走 hero 主線
- 取代原本的 task history list

---

## Candidate list item

每個 item 至少應顯示：

- 標題
- 類型
- 目前狀態
- 來自哪個案件 / 任務 / 交付物 / 建議
- 為什麼值得重用
- lane / continuity / deliverable type

每個 item 也可直接提供治理 action：

- `candidate`:
  - 升格成正式可重用模式
  - 先停用
- `promoted`:
  - 降回候選
  - 停用
- `dismissed`:
  - 重新列回候選

---

## Runtime needs

需要一條集中 list API，至少回：

- precedent candidate rows
- matter / task / deliverable labels
- filter-friendly fields

這條 API 不應回傳整份 source object payload。

它只應服務 precedent review surface。

---

## Success criteria

- 顧問可以在 `/history` 集中回看 precedent candidates
- 可以篩不同狀態與類型
- 不新增 precedent page family
- UI 仍維持低噪音
- active docs / QA / runtime contract 對齊
