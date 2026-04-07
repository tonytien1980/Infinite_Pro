# Phase 6 Maturity Review v1 Design

日期：2026-04-07
狀態：shipped

## Purpose

`Generalist Consulting Intelligence Governance` 已經不只是一條起步中的 phase-6 主線。

到目前為止，Phase 6 已經完成：

- coverage / anti-drift audit
- reuse-boundary governance
- Host-aware weighting
- guidance posture 與 propagation
- context-distance / reuse-confidence
- confidence calibration 與 propagation
- second-layer note condensation 與 consistency guardrails

因此現在真正缺的，不再是另一條更細的 note 微規則，而是：

- 系統要能正式回答 Phase 6 目前做到哪
- 目前屬於 foundation、refinement，還是可準備收斂
- 接下來最值得投入的是哪一類工作，而不是下一個文案微調

因此這一刀定為：

- `phase-6 maturity review v1`

## Product Posture

這一刀的正式定位是：

- 補一個 low-noise 的 Phase 6 maturity read model
- 把首頁 `Generalist Governance` 裡現在的成熟度位置說清楚
- 讓 active docs 與 QA 也正式把 Phase 6 當前位置寫清楚

這一刀不是：

- phase 6 sign-off
- 新 dashboard family
- 再加一條 reusable note
- 大改 Host runtime

## Core Decision

第一版正式決策如下：

1. backend 新增 `phase-6 maturity review` read model
2. maturity review 不假裝 Phase 6 已收口，而是誠實標成：
   - `refinement_lane`
3. maturity review 應回答 4 件事：
   - 目前 phase posture
   - 已完成的 milestone 數
   - 還剩的 focus items
   - 下一條最合理的 implementation direction
4. 首頁不新增新頁面，只在既有 `Generalist Governance` 裡補一塊 `Phase 6 maturity`

## Recommended First Slice

第一波只做：

- backend schema / service / route
- frontend types / api / helper / homepage summary block
- docs / QA / verification

## Non-Goals

第一波不做：

- Host prompt rewrite
- persisted governance scoring rewrite
- phase 6 sign-off flow
- 新的 manager dashboard

## Shipped Outcome

這一刀目前已正式落地：

- backend 已有 `GET /workbench/phase-6-maturity-review`
- 首頁既有 `Generalist Governance` 已補上一塊低噪音 `Phase 6 maturity`
- system 現在已能正式回答：
  - 目前屬於 `refinement lane`
  - 已完成哪些 milestone clusters
  - 還剩哪些真正值得投入的 focus items
- 這一刀沒有把 phase 6 假裝收口，也沒有新增新 dashboard family
