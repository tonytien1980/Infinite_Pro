# Phase 6 Case-Aware Governance Runtime Completion Design

日期：2026-04-08
狀態：draft

## Purpose

`docs/06_product_alignment_and_85_point_roadmap.md` 已把第一優先主線定為：

- `7.1 Priority 1: Case-aware governance runtime`

目前 `7.1` 已完成第一刀：

- task / matter work-surface 的 `guidance / reuse confidence / calibration / weighting`
- 已開始正式吃：
  - `client_stage`
  - `client_type`
  - `domain_lenses`
  - `evidence_thickness`
  - `pack context`

但 `7.1` 仍未正式收口。

本設計的目的，是把 `7.1` 補成一條完整、可收口、可驗證的主線，而不是做完一個 slice 就跳去 `7.2`。

## Product Posture

這一輪的正式節奏改為：

1. 先把 `7.1` 補完
2. `7.1` 補完後，不直接回到 `7.2`
3. 先插入一段：
   - `7.15`
4. `7.15` 收完後，才回到 `7.2`

這一輪的正式理解是：

- `7.1` 是工作面 case-aware runtime completion
- `7.15` 是 phase-level / governance 補強收尾
- `7.2` 則是下一條主線，暫時不啟動

## Why Not Jump To 7.2

前一輪實作雖然已經做出 `7.1 slice 1` 和 `7.2 slice 1`，但如果繼續這種多主線交錯推進，會產生兩個問題：

1. 使用者難以判斷：
   - 現在到底在 `7.1`、`7.15`、還是 `7.2`
2. 主線容易失焦：
   - `7.1` 還沒收口，system 就先往 scoring / benchmark 推進

因此這一輪的正式決策是：

- 單線推進
- 先收完 `7.1`
- 再做 `7.15`
- 最後才回到 `7.2`

## Current State

目前已正式完成的 `7.1` 內容是：

### 已完成：slice 1

- backend case-aware governance builder 已成立
- task / matter work-surface propagation 已成立
- active docs / QA 已同步

### 尚未收口的部分

`docs/06` 對 `7.1` 的要求是：

- reusable guidance 要依案件脈絡真正變動
- `task / matter / deliverable` 看到的 `guidance / reuse confidence / calibration / weighting`
  不再只是固定全域輸出

因此現在仍缺：

1. deliverable work-surface parity
2. work-surface consistency completion pass
3. `7.1` closeout-ready verification

## Scope Decision

本輪 `7.1` 的正式收尾範圍只包含：

- `task`
- `matter`
- `deliverable`

不包含：

- 把 `/workbench/phase-6-*` phase-level routes 一起改成 case-aware route family

原因是：

- `7.1` 在產品上應優先成立於顧問真正工作的 surface
- phase-level routes 更接近 governance summary layer
- 若把它們一起塞進 `7.1`，容易讓 system 又回頭花太多力氣描述自己，而不是更會工作

## Core Decision

`7.1` 剩餘部分正式拆成兩個 slices：

### Slice 2: Deliverable propagation and parity

目標：

- 讓 deliverable work-surface 正式吃到與 task / matter 同級的 case-aware `Phase 6` signals

正式應補：

- deliverable workspace read chain 對齊 task / matter
- deliverable-side `guidance / confidence / calibration / weighting` 不再只是沿用舊的 phase-level固定輸出
- deliverable 相關第二層 low-noise reading 與既有工作面一致

### Slice 3: Work-surface consistency and completion pass

目標：

- 讓 `task / matter / deliverable` 三個工作面的 case-aware runtime 契約、驗證與文件正式收口

正式應補：

- cross-surface consistency pass
- docs completion wording
- QA evidence / verification closure

## 7.15 Positioning

`7.1` 收完之後，下一步不是直接回 `7.2`，而是先做：

- `7.15`

`7.15` 在這裡的正式角色是：

- 處理先前 `Phase 6` 還值得補強、但不屬於 `7.1` 工作面 completion 的部分
- 主要會偏向：
  - phase-level governance / review layer
  - case-aware 與 phase-level summary 的語意補齊
  - 仍不進入 `7.2 feedback-linked scoring`

`7.15` 不是：

- `7.2`
- `7.3`
- 一個新的產品主線

它只是：

- `7.1` 和 `7.2` 之間的 phase-level補強插段

## Recommended Execution Order

正式順序改為：

1. `7.1 slice 2`
   - deliverable propagation and parity
2. `7.1 slice 3`
   - work-surface consistency and completion pass
3. `7.15`
   - phase-level governance補強
4. `7.2`
   - feedback-linked persisted scoring

## Non-Goals

本輪明確不做：

- `7.2` 新實作擴張
- `7.3` benchmark / regression expansion
- dashboard family
- training shell
- consultant ranking

## Success Criteria

這份 completion 設計完成後，正式應能回答：

1. `7.1` 現在還缺哪些 slices 才算完整
2. 這些 slices 為何先於 `7.2`
3. `7.15` 為何存在，以及它和 `7.2` 的邊界
4. 後續執行節奏已改成單線推進，而不是多主線交錯
