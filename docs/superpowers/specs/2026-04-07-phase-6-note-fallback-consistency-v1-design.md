# Phase 6 Note Fallback Consistency v1 Design

日期：2026-04-07
狀態：shipped

## Purpose

`note brevity guardrails v1` 已把 condensed `Phase 6` note 壓成更短的標籤。

但當 lifecycle / freshness 類訊號缺失時，這條 note 目前仍只是機械地退回：

- Host weighting
- confidence calibration
- reuse confidence

而這些 fallback 還沒有被正式鎖成一套固定的短標籤讀法。

因此這一刀的正式問題是：

- 怎麼讓 condensed `Phase 6` note 在主要訊號缺失時
- 仍能穩定退回到次要訊號
- 而且保持一致、簡短、可預期

因此這一刀定為：

- `phase-6 note fallback consistency v1`

## Product Posture

這一刀的正式定位是：

- 只調整 condensed note 的 fallback order 與 fallback label
- 不改 lifecycle 優先順序
- 不改 backend contract，不新增新頁面

這一刀不是：

- 新 signal
- 新 governance panel
- backend rewrite
- 全面 copy rewrite

## Core Decision

第一版正式決策如下：

1. condensed note 在 `lifecyclePrioritySummary` 存在時，維持現狀
2. condensed note 在 `lifecyclePrioritySummary` 缺失時，正式 fallback 順序定為：
   - `calibrationAwareWeightingSignal`
   - `confidenceCalibrationSignal`
   - `reuseConfidenceSignal`
3. fallback labels 應使用短標籤：
   - `領域退背景`
   - `階段留邊界`
   - `客型可放大`
   - `領域仍不對齊`
   - `重用低信心`
4. note 仍維持單行、三段主訊息

## Recommended First Slice

第一波只做：

- frontend shared helper fallback short-label normalization
- direct helper tests
- docs / QA / verification

## Non-Goals

第一波不做：

- backend schema change
- homepage redesign
- new propagation
- long-form explanation wall

## Shipped Outcome

這一刀目前已正式落地：

- condensed `Phase 6` note 在缺少 lifecyclePrioritySummary 時，現在會穩定退回 weighting -> calibration -> reuse confidence
- fallback labels 已統一成短標籤，例如 `領域退背景`、`階段要留意`、`重用低信心`
- backend contract 不變，也沒有新增新頁面
