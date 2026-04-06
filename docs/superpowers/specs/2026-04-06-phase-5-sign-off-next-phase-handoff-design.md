# Phase 5 Sign-Off and Next-Phase Handoff Design

日期：2026-04-06
狀態：shipped

## Purpose

`Single-Firm Cloud Foundation` 目前已正式建立：

- auth / membership foundation
- personal provider settings + allowlist
- demo workspace isolation
- owner controls deepen
- demo polish
- firm operating surfaces
- phase-5 closure review

因此 phase 5 現在的主要缺口，不再是 completion read model，而是：

- 缺少 explicit sign-off action
- 缺少正式的 next-phase handoff contract
- system 還不能把「接近收口」推進到「已正式收口」

因此這一條主線的正式目標是：

- 把 phase 5 從 `ready_to_close` 推到正式 `signed_off`
- 把下一階段 handoff 做成正式 contract
- 但仍維持 low-noise workbench posture

## Product Posture

這一條主線的正式定位是：

- phase-level explicit sign-off
- low-noise handoff summary
- workbench-first，不新增 phase dashboard

這一條主線不是：

- release management suite
- project tracker
- admin workflow engine

## Core Decision

正式決策如下：

1. sign-off action 應只給 owner
2. sign-off action 第一波只放在既有 `總覽` 的 phase-5 closure panel
3. 不新增 `/phase-5`、`/handoff`、`/release`
4. sign-off 完成後，closure review 應正式回出：
   - `signed_off`
   - `signed_off_by_label`
   - `signed_off_at`
   - `next_phase_label`
   - `handoff_summary`
   - `handoff_items`
5. next phase 第一波只 handoff 到：
   - `phase-6 decision framing`

## Recommended Scope

第一個 `phase-5 sign-off / next-phase handoff` slice 只做：

1. backend sign-off persistence
2. phase-5 closure review signed-off state
3. homepage sign-off button + signed-off readout

不做：

- phase 6 runtime work
- multi-step approval workflow
- sign-off history center

## Product Options

### Option A: Mirror phase-4 sign-off pattern on phase 5 `(Recommended)`

- backend 用同一種 persisted phase-review row
- frontend 在既有首頁 closure panel 顯示 sign-off

優點：

- 最一致
- 風險最低
- 不需要新 shell

缺點：

- 仍是單步 action，不是複雜 workflow

### Option B: Keep read-only closure review and delay sign-off

- 不做 explicit action

優點：

- 改動更少

缺點：

- phase 5 會一直停在「接近收口」

### Option C: Add a dedicated sign-off workspace

- 新增 phase-level 管理頁

優點：

- sign-off 看起來更完整

缺點：

- 太重
- 會偏離 workbench posture

正式建議：

- 採 `Option A`

## Capability Breakdown

### 1. Phase 5 Sign-Off Action

owner 應能：

- 在 `closure_status == ready_to_close` 時明確觸發 sign-off
- 寫入 operator label
- 讓 system 回出正式 signed-off state

### 2. Next-Phase Handoff

system 應正式回出：

- `next_phase_label`
- `handoff_summary`
- `handoff_items`

第一波 handoff 正式建議：

- 先進入 `phase-6 decision framing`
- 不直接跳成 enterprise governance shell

## IA Placement

### `總覽`

正式承接：

- phase-5 sign-off button
- signed-off readout
- next-phase handoff summary

## Backend Requirements

這一條主線至少需要：

- `sign_off_phase_five`
- `GET /workbench/phase-5-closure-review`
- `POST /workbench/phase-5-sign-off`

## Frontend Requirements

這一條主線至少需要：

- phase-5 closure helper支援 signed-off 狀態
- owner-only sign-off button
- signed-off handoff readout

## Scope Guard

這個 slice 只做：

- phase-5 sign-off
- next-phase handoff contract
- homepage low-noise surface

這個 slice 不做：

- phase 6 implementation
- new dashboard
- multi-step sign-off flow

## Recommended First Slice

如果要開始實作，我建議先切成：

1. backend sign-off state persistence
2. frontend owner-only sign-off button + handoff readout

也就是先把 phase 5 從「可準備收口」正式推到「已收口」。

## Implemented Outcome

這一輪已正式 shipped：

- backend 已新增 `POST /workbench/phase-5-sign-off`
- owner 可在首頁總覽的 phase-5 closure panel 內正式收口
- 收口後 system 會正式回出：
  - `signed_off`
  - `signed_off_by_label`
  - `next_phase_label`
  - `handoff_summary`
  - `handoff_items`
- phase 5 現在可正式視為已收口，並 handoff 到：
  - `phase-6 decision framing`
