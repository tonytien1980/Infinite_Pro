# Phase 6 Guidance Posture Propagation v1 Design

日期：2026-04-07
狀態：shipped

## Purpose

`generalist guidance posture v1` 已能在首頁 `Generalist Governance` 回答：

- 目前工作 guidance 應維持多低噪音
- 是否應適度明示 reusable boundary
- 什麼時候要先保守引導

但這條 posture 若只停在首頁，還沒有真正進入 consultant 真正工作的 second-layer guidance。

因此這一刀的正式問題是：

- 怎麼把這條 posture 接進既有 task / matter / deliverable 的 second-layer guidance
- 讓既有 reusable-intelligence cards 不只回來源狀態，也能更明確提示目前應維持哪種 guidance 語氣

因此這一刀定為：

- `phase-6 guidance posture propagation v1`

## Product Posture

這一刀的正式定位是：

- 把 `generalist_guidance_posture` 掛進既有 work-surface contract
- 保持 second-layer guidance low-noise
- 讓既有 `organization memory` / `domain playbook` / `deliverable template` 卡片多一條簡短 guidance note

這一刀不是：

- 開新的 phase-6 頁面
- 讓每個頁面自己額外打 governance route
- 把 second-layer guidance 變成長篇教學
- consultant ranking / training shell

## Core Decision

第一版正式決策如下：

1. `generalist_guidance_posture` 應直接掛進 `TaskAggregateResponse` 與 `MatterWorkspaceResponse`
2. deliverable workspace 可沿用既有 `task: TaskAggregate`，不另開新 contract
3. 第一波只 propagation 到：
   - `organization memory`
   - `domain playbook`
   - `deliverable template`
4. 新增的 guidance note 必須維持 low-noise，不可搶走原本卡片主線

## Shipped Outcome

這一刀目前已正式落地：

- `TaskAggregateResponse` / `MatterWorkspaceResponse` 已正式帶出 `generalist_guidance_posture`
- task / matter / deliverable 的既有 second-layer guidance 現在可讀到 Phase 6 guidance note
- 沒有新增新頁面，也沒有破壞既有 Host / workbench 邊界
