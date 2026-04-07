# Phase 6 Calibration-Aware Reuse Weighting v1 Design

日期：2026-04-07
狀態：shipped

## Purpose

`confidence calibration v1` 與 `confidence calibration propagation v1` 已能回答：

- reusable confidence 是被 `client stage`
- `client type`
- 或 `domain lens`

哪一條 calibration axis 拉低。

但目前 Host 的 reusable ordering 還主要停在：

- shared-intelligence `weight_action`
- phase-6 reuse recommendation

也就是說，system 雖然已能看見 calibration mismatch，卻還沒有把這條訊號正式接回 reusable ordering。

因此這一刀的正式問題是：

- 怎麼讓 calibration signal 真正影響 Host 的 reusable ordering
- 讓 `domain lens` mismatch 不再和 fully aligned 的 reusable source 站在同一個 weighting posture
- 同時維持 low-noise homepage reading，不新增 Phase 6 dashboard

因此這一刀定為：

- `phase-6 calibration-aware reuse weighting v1`

## Product Posture

這一刀的正式定位是：

- 把 `client stage / client type / domain lens` calibration 接回 reusable ordering
- 讓 `domain lens` mismatch 先退到背景校正
- 讓 `client stage / client type` mismatch 至少降回 contextual reuse
- 在首頁既有 `Host weighting` 區塊補一條更準的 calibration-aware summary

這一刀不是：

- policy editor
- hard blocking
- routing rewrite
- 新的治理頁

## Core Decision

第一版正式決策如下：

1. backend 新增 `phase-6 calibration-aware reuse weighting` read model
2. Host reusable ordering 仍維持 soft ordering，不做 hard block
3. `domain lens` mismatch 應優先被讀成背景校正
4. `client stage / client type` mismatch 至少不應維持 `can_expand`
5. `Generalist Governance` 只補一條低噪音 weighting summary，不新增新卡牆

## Recommended First Slice

第一波只做：

- backend calibration-aware weighting contract
- precedent reusable ordering 接 calibration signal
- existing `Host weighting` summary 改讀 calibration-aware summary
- docs / QA / verification

## Non-Goals

第一波不做：

- page-local calibration dashboards
- consultant-visible weighting controls
- new work-surface propagation
- hard route / source blocking

## Shipped Outcome

這一刀目前已正式落地：

- backend 已新增 `phase-6 calibration-aware reuse weighting` read model
- Host reusable ordering 現在會把 `domain lens` mismatch 先退到背景校正
- `client stage / client type` mismatch 也不再維持 `can_expand`
- 首頁既有 `Host weighting` 現在已改讀 calibration-aware summary，沒有新增新卡牆
