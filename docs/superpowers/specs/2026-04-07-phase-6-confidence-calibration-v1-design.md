# Phase 6 Confidence Calibration v1 Design

日期：2026-04-07
狀態：shipped

## Purpose

phase 6 目前已能回答 reusable assets 與目前案件脈絡是：

- `close / moderate / far`
- `high_confidence / bounded_confidence / low_confidence`

但這條 reading 目前還沒有更明確拆開：

- 是 `client stage` 有距離
- 還是 `client type` 有距離
- 或是 `domain lens` 本身就不夠接近

因此這一刀定為：

- `phase-6 confidence calibration v1`

## Product Posture

這一刀的正式定位是：

- 把 `reuse confidence` 再更明確拆成幾個 low-noise calibration axes
- 幫 consultant 看見目前 reusable confidence 是被哪一種脈絡差距拉低
- 保持首頁總覽可讀，不長出新頁

這一刀不是：

- Host weighting rewrite
- auto-blocking
- calibration dashboard
- consultant tuning console

## Core Decision

第一版正式決策如下：

1. 第一波只做 read model，不動 Host routing
2. 第一波至少校準：
   - `client_stage`
   - `client_type`
   - `domain_lens`
3. 第一波至少回答：
   - `aligned`
   - `caution`
   - `mismatch`
4. UI 仍只掛在既有 `Generalist Governance`

## Recommended First Slice

第一波只做：

- backend `phase-6-confidence-calibration` read model
- `GET /workbench/phase-6-confidence-calibration`
- homepage `Generalist Governance` 補一塊 low-noise `confidence calibration`
- docs / QA / verification 同步

## Non-Goals

第一波不做：

- propagation 到 task / matter / deliverable
- new dashboard
- hard gating
- per-user tuning

## Shipped Outcome

這一刀目前已正式落地：

- backend 已有 `phase-6-confidence-calibration` read model
- system 已能正式回答 reusable confidence 目前是被 `client stage`、`client type` 還是 `domain lens` 差距拉低
- `Generalist Governance` 已補上低噪音 `confidence calibration` 摘要
