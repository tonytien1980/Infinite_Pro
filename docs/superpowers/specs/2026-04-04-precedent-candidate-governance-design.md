# Precedent Candidate Governance Design

## Goal

在 precedent candidate pool 已成立之後，下一個最小但必要的能力不是自動套用，而是：

> 讓顧問能正式決定某個 candidate 要不要升格、先保留在候選狀態，或先停用。

這一輪只處理 candidate governance，不做自動 retrieval、模板套用或 precedent library 頁面。

---

## Why now

目前 candidate pool 已能回答：

- 哪些 `deliverable` / `recommendation` 值得被記住

但還不能回答：

- 哪些候選真的值得被保留成更正式的 reusable pattern
- 哪些候選只是暫時保留
- 哪些候選應先停用，不再作為 active 候選

如果沒有這一層，candidate pool 只會越堆越多，卻沒有明確治理邊界。

---

## Design choice

第一輪治理採三態：

- `candidate`
- `promoted`
- `dismissed`

白話意義：

- `candidate`
  - 已被系統記住，但還只是候選
- `promoted`
  - 顧問明確覺得這個模式值得更正式保留
- `dismissed`
  - 先停用，不列入 active 候選

這一輪不做：

- 多人審核
- approval workflow
- automatic retrieval ranking
- auto-apply

---

## UX principles

- 不新增 precedent dashboard
- 不新增新的管理頁
- action 只掛在既有 `deliverable adoption feedback` 與 `recommendation` 卡片附近
- `matter` 只顯示輕量 summary，不提供治理按鈕

---

## Interaction design

### Deliverable / Recommendation

若目前狀態是 `candidate`：

- 顯示目前是可重用候選
- 提供：
  - `升格成正式可重用模式`
  - `先停用這個候選`

若目前狀態是 `promoted`：

- 顯示目前是正式可重用模式
- 提供：
  - `降回候選`
  - `停用這個模式`

若目前狀態是 `dismissed`：

- 顯示目前已停用
- 提供：
  - `重新列回候選`

### Matter

`matter` summary 只統計 active candidates：

- `candidate`
- `promoted`

`dismissed` 不計入 matter summary。

---

## Runtime rules

- `not_adopted` feedback 仍不建立 candidate
- governance action 不應改寫 adoption feedback 本身
- governance action 只改 `candidate_status`
- source object read model 應仍能回出 `dismissed` candidate，方便 restore
- matter summary 則應排除 `dismissed`

---

## Success criteria

- 顧問可在現有工作面正式升格 / 降回 / 停用 candidate
- UI 仍保持低噪音
- 不新增 precedent 首頁
- active docs、runtime contract、QA matrix 都同步對齊
