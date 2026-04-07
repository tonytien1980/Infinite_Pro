# Phase 6 Confidence Calibration Propagation v1 Design

日期：2026-04-07
狀態：shipped

## Purpose

`confidence calibration v1` 已能在首頁 `Generalist Governance` 回答：

- reusable confidence 目前是被 `client stage`
- `client type`
- 或 `domain lens`

哪一條 calibration axis 拉低。

但這條 read model 若只停在首頁，顧問在 task / matter / deliverable 真正工作時，仍看不到這條 calibration。

因此這一刀的正式問題是：

- 怎麼把這條 `confidence calibration` 接進既有 work-surface contract
- 讓既有 second-layer guidance 卡片也能低噪音讀到目前的 calibration reading

因此這一刀定為：

- `phase-6 confidence-calibration propagation v1`

## Product Posture

這一刀的正式定位是：

- 把 `confidence calibration` 掛進既有 task / matter / deliverable work-surface contract
- 讓既有 second-layer cards 多一條簡短 `Phase 6 confidence calibration` note
- 不改變 primary summary，不讓 second-layer guidance 過度膨脹

這一刀不是：

- 新的 calibration page
- consultant ranking
- routing rewrite
- 長篇 training copy

## Core Decision

第一版正式決策如下：

1. `confidence_calibration_signal` 應掛進 `TaskAggregateResponse` 與 `MatterWorkspaceResponse`
2. deliverable workspace 可沿用既有 `task: TaskAggregate`
3. 第一波只 propagation 到：
   - `organization memory`
   - `domain playbook`
   - `deliverable template`
4. 新增 note 必須維持 low-noise，不可壓過原本卡片主線

## Recommended First Slice

第一波只做：

- backend `confidence calibration` propagation contract
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

- `confidence_calibration_signal` 已掛進 `TaskAggregateResponse` / `MatterWorkspaceResponse`
- task / matter / deliverable 的既有 second-layer guidance 現在都能讀到低噪音 `Phase 6 confidence calibration` note
- 沒有新增新頁面，也沒有讓頁面自己額外查 governance route
