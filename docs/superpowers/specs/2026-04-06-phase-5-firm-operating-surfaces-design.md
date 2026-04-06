# Phase 5 Firm Operating Surfaces Design

日期：2026-04-06
狀態：shipped

## Purpose

`Single-Firm Cloud Foundation` 的前三條輕量主線目前已依序站穩：

- `owner controls deepen`
- `demo polish`

因此 phase 5 現在剩下最合理的一條，就是：

- `firm operating surfaces`

目前的缺口不是：

- 身分與權限還沒建立
- demo 還沒隔離
- owner 無法管理基本控制面

而是：

- owner / consultant 一登入正式 workspace，還沒有低噪音但真正有用的 firm operating read model
- 首頁總覽目前仍偏單顧問工作節奏，尚未正式回答「這間 firm 現在能不能順利工作」

因此這一條主線的正式目標是：

- 在不長出 admin console 的前提下
- 讓首頁總覽開始有 single-firm operating read model
- 讓 owner / consultant 一進來就能知道：
  - 目前這間 firm 的運作是否站穩
  - 哪些地方需要注意
  - 接下來最合理的 operating action 是什麼

## Product Posture

這一條主線的正式定位是：

- single-firm operating read model
- workbench-first
- role-aware but low-noise

這一條主線不是：

- firm dashboard shell
- KPI wall
- analytics console
- management cockpit

## Core Decision

正式決策如下：

1. `firm operating surfaces` 第一刀應落在既有首頁 `總覽`
2. 不新增 `/firm`、`/ops`、`/admin-dashboard`
3. 用一個新的 `firm operating snapshot` read model 支撐首頁
4. owner 與 consultant 會看到同一塊 operating surface，但 copy 與重點可 role-aware
5. 第一刀只做 read model，不做新的治理 action center

## Recommended Scope

第一個 `firm operating surfaces` slice 只做：

1. `firm operating snapshot` backend contract
2. `總覽` 頁面的 low-noise firm operating panel
3. owner / consultant 的 role-aware copy

不做：

- trends / charts
- billing / seat usage console
- audit log center
- admin dashboard

## Product Options

### Option A: Add a role-aware operating panel to existing `總覽` `(Recommended)`

- backend 新增一個簡潔 read model
- frontend 在首頁總覽補一塊 `firm operating` 區
- 不開新頁

優點：

- 最符合 workbench posture
- 不會把產品拉成 admin shell
- owner / consultant 都能受益

缺點：

- operating summary 必須很克制，不能太重

### Option B: Create a dedicated `/firm` or `/ops` page

- 把 team / provider / demo / membership summary 全集中

優點：

- 入口單純

缺點：

- 太容易長成管理後台
- 目前還太早

### Option C: Keep everything distributed across `/members`, `/settings`, `/demo`

- 不新增 read model
- 讓使用者自行拼湊 operating state

優點：

- 最少改動

缺點：

- 無法真正回答「這間 firm 現在能不能順利工作」

正式建議：

- 採 `Option A`

## Capability Breakdown

### 1. Firm Operating Snapshot

第一刀應正式回出：

- `operating_posture`
- `operating_summary`
- `priority_note`
- `action_label`
- `action_href`
- `signals`

其中 `signals` 第一版只涵蓋：

- active members
- active demo seats
- pending demo invites
- demo workspace status
- provider guardrail status

### 2. Role-Aware Copy

owner 應看到的重點偏向：

- team readiness
- demo policy posture
- provider guardrail posture

consultant 應看到的重點偏向：

- firm 已準備好工作
- 若 provider 或 demo policy 有明顯異常，應低噪音提示

### 3. Low-Noise Placement

首頁總覽只新增一塊 operating panel：

- 不可變成 dashboard wall
- 不可擠掉原本案件 / 交付物 / 補件主線
- 應放在首頁 detail stack，而不是 hero 主位

## IA Placement

### `總覽`

正式承接：

- firm operating snapshot panel

### Not Added

這一刀不新增：

- `/firm`
- `/ops`
- `/dashboard`

## Backend Requirements

這一條主線至少需要：

- `get_firm_operating_snapshot`

建議新增 contract：

- `FirmOperatingSignalRead`
- `FirmOperatingSnapshotRead`

## Frontend Requirements

這一條主線至少需要：

- `overview` helper for firm operating posture
- `WorkbenchHome` 新增一塊 role-aware operating panel
- consultant-facing Traditional Chinese copy

## Scope Guard

這個 slice 只做：

- firm operating surfaces
- homepage operating snapshot
- role-aware low-noise operating copy

這個 slice 不做：

- owner controls deepen
- demo polish
- admin dashboard
- analytics wall

## Recommended First Slice

如果要開始實作，我建議先切成：

1. `firm operating snapshot` backend route
2. `總覽` operating panel

也就是先讓首頁正式回答「這間 firm 現在能不能順利工作」，再考慮更後面的 surface 深化。

## Implemented Outcome

這一輪已正式 shipped：

- backend 已新增 `GET /workbench/firm-operating-snapshot`
- owner / consultant 都會收到 role-aware 的 operating snapshot
- frontend `總覽` 已補上一塊 low-noise 的 `firm operating` panel
- 這一刀仍維持既有首頁，不新增 `/firm` 或 `/ops` 頁面
