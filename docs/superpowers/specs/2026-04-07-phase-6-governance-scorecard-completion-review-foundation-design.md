# Phase 6 Governance Scorecard / Completion Review Foundation Design

日期：2026-04-07
狀態：shipped

## Purpose

`phase-6 closure criteria review v1` 已能正式回答：

- runtime feedback loop 是否開始形成
- 距離 completion review 還差哪些 blocker

但 system 還沒有兩個更像 phase-level foundation 的能力：

1. 一組低噪音、可回讀的 governance scorecard
2. 一個可保存的 completion review checkpoint

因此這一刀定為：

- `phase-6 governance scorecard / completion review foundation`

## Product Posture

這一刀的正式定位是：

- 補一個 phase-level completion review read model
- 補一組低噪音 governance scorecard
- 允許 owner 記錄 completion checkpoint，但不等於 sign-off

這一刀不是：

- phase-6 sign-off
- new governance dashboard
- correctness score
- consultant ranking

## Core Decision

第一版正式決策如下：

1. backend 新增 `GET /workbench/phase-6-completion-review`
2. backend 新增 `POST /workbench/phase-6-completion-review/checkpoint`
3. completion review contract 至少包括：
   - `review_posture`
   - `overall_score`
   - `scorecard_items`
   - `closure_posture`
   - `last_checkpoint_at`
   - `last_checkpoint_by_label`
4. checkpoint 只代表：
   - owner 已在這個時間點記錄了一次 completion review snapshot
   - 不代表 phase 6 已正式收口
5. 首頁仍留在既有 `Generalist Governance`，不新增 `/phase-6` 新頁面

## Recommended First Slice

第一波只做：

- backend scorecard / checkpoint contract
- owner-only checkpoint action
- homepage low-noise completion review block
- docs / QA / verification

## Non-Goals

第一波不做：

- sign-off / handoff
- persisted scoring engine rewrite
- new dashboard family
- multi-user review workflow

## Shipped Outcome

這一刀目前已正式落地：

- backend 已有 `GET /workbench/phase-6-completion-review`
- backend 已有 `POST /workbench/phase-6-completion-review/checkpoint`
- 首頁既有 `Generalist Governance` 已補上 low-noise `completion review`
- owner 現在可記錄一筆 checkpoint，但這不等於 sign-off
- 這一刀沒有新增 score dashboard，也沒有新增新頁面 family
