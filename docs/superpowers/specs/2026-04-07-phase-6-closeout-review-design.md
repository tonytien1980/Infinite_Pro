# Phase 6 Closeout Review Design

日期：2026-04-07
狀態：shipped

## Purpose

Phase 6 現在已經有：

- maturity review
- closure criteria
- completion review
- sign-off foundation
- next-phase handoff foundation

但 system 仍缺一個像 phase 5 那樣的正式 phase-level closeout review。  
也就是：

- 一眼回答 Phase 6 現在是否已正式收口
- 已完成哪些主線
- 還剩哪些收尾項目
- signed-off 後應 handoff 到哪

因此這一刀定為：

- `phase-6 closeout review`

## Product Posture

這一刀的正式定位是：

- 補一個 low-noise phase-level closeout read model
- 把 Phase 6 現有的 completion / sign-off / handoff 收成同一份 contract
- 讓首頁可以正式回答「這整段 Phase 6 現在做到哪」

這一刀不是：

- 新 governance dashboard
- 新 route family 之外的工作流平台
- phase 7 implementation

## Core Decision

第一版正式決策如下：

1. backend 新增 `GET /workbench/phase-6-closeout-review`
2. contract 應至少包括：
   - `closure_status`
   - `closure_status_label`
   - `foundation_snapshot`
   - `completed_items`
   - `asset_audits`
   - `remaining_items`
   - `recommended_next_step`
   - signed-off 後的 `next_phase_label / handoff_summary / handoff_items`
3. 首頁不新增新頁面，只在既有 `Generalist Governance` 內補一塊 `Phase 6 closeout`

## Recommended First Slice

第一波只做：

- backend closeout read model
- homepage low-noise closeout section
- docs / QA / verification

## Non-Goals

第一波不做：

- new dashboard family
- phase 7 code lane
- git / release UI

## Shipped Outcome

這一刀目前已正式落地：

- backend 已有 `GET /workbench/phase-6-closeout-review`
- 首頁既有 `Generalist Governance` 已補上 low-noise `Phase 6 closeout`
- signed-off 後 closeout review 也會正式回出 next-phase handoff
- 這一刀沒有新增新 dashboard family，也沒有新增 git / release UI
