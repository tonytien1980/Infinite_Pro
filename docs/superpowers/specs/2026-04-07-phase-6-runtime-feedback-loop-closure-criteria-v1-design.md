# Phase 6 Runtime Feedback Loop / Closure Criteria v1 Design

日期：2026-04-07
狀態：shipped

## Purpose

`phase-6 maturity review v1` 已正式回答：

- Phase 6 目前屬於 `refinement lane`
- 哪些 milestone clusters 已站穩
- 還剩哪些真正值得投入的 focus items

但它還沒有正式回答兩件更關鍵的事：

1. Phase 6 的 runtime feedback loop 到底有沒有開始形成
2. 若未來要做 phase-6 completion review，現在還差哪些 closure criteria

因此這一刀定為：

- `phase-6 runtime feedback loop / closure criteria v1`

## Product Posture

這一刀的正式定位是：

- 補一個 phase-level `closure criteria` read model
- 明確把 runtime feedback loop 也納入 phase-6 closing posture
- 讓首頁 `Generalist Governance` 可以低噪音回答「為什麼還不能收口」

這一刀不是：

- phase-6 sign-off flow
- new governance dashboard
- Host runtime rewrite
- 再補一條 second-layer note

## Core Decision

第一版正式決策如下：

1. backend 新增 `GET /workbench/phase-6-closure-criteria`
2. 第一版 contract 應回答：
   - 目前 closure posture
   - runtime feedback loop 摘要
   - criteria items
   - remaining blockers
   - recommended next step
3. runtime feedback loop 應盡量吃真實 runtime evidence：
   - `AdoptionFeedback`
   - `PrecedentCandidate` 的 governed outcomes
4. 首頁不新增新頁面，只在既有 `Generalist Governance` 裡補一塊 `closure criteria`

## Recommended First Slice

第一波只做：

- backend schema / service / route
- frontend types / api / helper / homepage low-noise summary
- docs / QA / verification

## Non-Goals

第一波不做：

- sign-off persistence
- owner-only closure button
- new page family
- persisted scoring rewrite

## Shipped Outcome

這一刀目前已正式落地：

- backend 已有 `GET /workbench/phase-6-closure-criteria`
- 這層現在會正式回出：
  - closure posture
  - runtime feedback loop summary
  - criteria items
  - remaining blockers
- 首頁既有 `Generalist Governance` 已補上一塊低噪音 `closure criteria`
- 這一刀沒有新增 sign-off flow，也沒有新增新頁面 family
