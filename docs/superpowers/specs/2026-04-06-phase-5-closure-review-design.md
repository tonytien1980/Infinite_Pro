# Phase 5 Closure Review Design

日期：2026-04-06
狀態：shipped

## Purpose

`Single-Firm Cloud Foundation` 目前已正式落地的子線包括：

- `Auth + Membership Foundation`
- `Personal Provider Settings + Allowlist Foundation`
- `Demo Workspace Isolation`
- `owner controls deepen`
- `demo polish`
- `firm operating surfaces`

因此 phase 5 現在的主要缺口，不再是再補某個單點 surface，而是：

- system 仍缺少一份正式的 phase-5 completion read model
- 使用者目前只能從多份 docs 與多個 surface 推論「phase 5 是否接近收口」
- repo 還沒有一個像 phase 4 那樣的 low-noise closure review contract

因此這一條主線的正式目標是：

- 把 phase 5 做到哪、還差什麼，從對話狀態變成 system 內正式可讀的 closure review
- 但第一波只做 closure review，不做 sign-off action

## Product Posture

這一條主線的正式定位是：

- low-noise phase status read model
- consultant-readable completion summary
- workbench-first meta surface

這一條主線不是：

- project management board
- release dashboard
- new admin console
- automatic sign-off engine

## Core Decision

正式決策如下：

1. phase 5 第一波只做 `closure review`
2. 不在這一刀加入 `sign-off` action
3. UI surface 放在既有 `總覽`
4. contract 盡量沿用 phase 4 closure review 的語言與結構
5. asset audit 第一波只回 phase-5 已站穩的子線，不擴成新 dashboard

## Recommended Scope

第一個 `phase-5 closure review` slice 只做：

1. `phase_5_closure_review` backend contract
2. 首頁 low-noise closure panel
3. remaining items 與 recommended next step

不做：

- explicit sign-off action
- handoff execution
- new phase dashboard

## Product Options

### Option A: Add a dedicated phase-5 closure review read model `(Recommended)`

- backend 新增一條專用 route
- frontend 在首頁顯示一塊 closure summary

優點：

- 最接近 phase 4 成熟做法
- 不需要把首頁變成管理牆
- phase 5 可以開始正式收尾

缺點：

- 第一波仍只是 read model，不是 sign-off

### Option B: Reuse only docs and skip runtime read model

- 不新增 route
- 只靠 docs 宣告 phase 5 接近收口

優點：

- 最省改動

缺點：

- 不符合目前 repo 已建立的 phase closure pattern

### Option C: Jump directly to phase-5 sign-off

- 直接做 sign-off action + handoff

優點：

- 速度快

缺點：

- 中間少了一層 closure review，太硬
- 不利於之後追蹤還差哪些點

正式建議：

- 採 `Option A`

## Capability Breakdown

### 1. Phase 5 Closure Review

第一波正式回出：

- `phase_id`
- `phase_label`
- `closure_status`
- `closure_status_label`
- `summary`
- `foundation_snapshot`
- `completed_count`
- `remaining_count`
- `completed_items`
- `asset_audits`
- `remaining_items`
- `recommended_next_step`

### 2. Asset Audits

phase 5 第一波 asset audit 只回：

- auth / membership
- provider / allowlist
- demo isolation
- owner controls
- demo polish
- firm operating

### 3. Remaining Items

第一波 remaining items 只保留：

- `phase 5 sign-off 與下一階段 handoff`

## IA Placement

### `總覽`

正式承接：

- `phase 5 closure review` panel

### Not Added

這一刀不新增：

- `/phase-5`
- `/release`
- `/handoff`

## Backend Requirements

這一條主線至少需要：

- `build_phase_five_closure_review`
- `GET /workbench/phase-5-closure-review`

## Frontend Requirements

這一條主線至少需要：

- phase 5 closure review helper
- `總覽` low-noise closure review panel
- 不搶走既有工作主線

## Scope Guard

這個 slice 只做：

- phase-5 closure review
- asset audit read model
- homepage closure panel

這個 slice 不做：

- phase-5 sign-off
- next-phase handoff action
- admin shell

## Recommended First Slice

如果要開始實作，我建議先切成：

1. backend `phase_5_closure_review` route
2. frontend `總覽` closure review panel

也就是先讓 system 正式回答「phase 5 現在做到哪」，再決定何時進 sign-off。

## Implemented Outcome

這一輪已正式 shipped：

- backend 已新增 `GET /workbench/phase-5-closure-review`
- frontend `總覽` 已補上 `第 5 階段收尾狀態`
- phase 5 六條主要子線現在都能被 system 內正式回讀
- remaining item 也已正式收斂成：
  - `phase 5 sign-off 與下一階段 handoff`
