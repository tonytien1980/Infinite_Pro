# Phase 6 Calibration-Aware Weighting Propagation v1 Design

日期：2026-04-07
狀態：shipped

## Purpose

`calibration-aware reuse weighting v1` 已能在首頁 `Generalist Governance` 的 `Host weighting` 低噪音回答：

- `domain lens` mismatch 會先退到背景校正
- `client stage / client type` mismatch 不再直接維持 `can_expand`

但如果這條判斷只停在首頁，顧問在 task / matter / deliverable 真正工作時，仍看不到：

- 為什麼這次 reusable source 先留背景
- 為什麼這次只能局部參考

因此這一刀的正式問題是：

- 怎麼把 `calibration-aware weighting` 回寫到既有 work-surface contract
- 讓既有 second-layer guidance 卡片也能低噪音讀到這條 Host weighting 判斷

因此這一刀定為：

- `phase-6 calibration-aware weighting propagation v1`

## Product Posture

這一刀的正式定位是：

- 把 `calibration_aware_weighting_signal` 掛進既有 task / matter / deliverable work-surface contract
- 讓 `organization memory` / `domain playbook` / `deliverable template` 多一條簡短 `Phase 6 Host weighting` note
- 不改變 primary summary，不讓 second-layer guidance 膨脹成治理牆

這一刀不是：

- 新的 weighting page
- consultant-visible tuning console
- routing rewrite
- 長篇 training copy

## Core Decision

第一版正式決策如下：

1. `calibration_aware_weighting_signal` 應掛進 `TaskAggregateResponse` 與 `MatterWorkspaceResponse`
2. deliverable workspace 可沿用既有 `task: TaskAggregate`
3. 第一波只 propagation 到：
   - `organization memory`
   - `domain playbook`
   - `deliverable template`
4. 新增 note 必須維持 low-noise，不可壓過原本卡片主線

## Recommended First Slice

第一波只做：

- backend `calibration-aware weighting` propagation contract
- existing helper / panel note wiring
- docs / QA / verification

## Non-Goals

第一波不做：

- new dashboard
- page-local query for governance routes
- propagation to all guidance cards
- hard policy on work surfaces

## Shipped Outcome

這一刀目前已正式落地：

- `calibration_aware_weighting_signal` 已掛進 `TaskAggregateResponse` / `MatterWorkspaceResponse`
- task / matter / deliverable 的既有 second-layer guidance 現在都能讀到低噪音 `Phase 6 Host weighting` note
- 沒有新增新頁面，也沒有讓各頁自己額外查 governance route
