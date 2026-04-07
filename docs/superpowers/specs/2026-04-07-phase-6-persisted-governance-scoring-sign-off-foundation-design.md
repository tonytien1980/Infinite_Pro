# Phase 6 Persisted Governance Scoring / Sign-Off Foundation Design

日期：2026-04-07
狀態：shipped

## Purpose

`phase-6 governance scorecard / completion review foundation` 已讓 system 能：

- 回讀 low-noise scorecard
- 記錄 completion checkpoint

但它還缺兩個真正讓這條線能進入收口準備的能力：

1. checkpoint 應保存當時的 score snapshot，而不是只記時間
2. owner 應在達到 review-ready 後，能正式做 phase-6 sign-off

因此這一刀定為：

- `phase-6 persisted governance scoring / sign-off foundation`

## Product Posture

這一刀的正式定位是：

- 讓 checkpoint 成為真正的 persisted review snapshot
- 補上 owner-only phase-6 sign-off foundation
- 仍維持 low-noise homepage pattern

這一刀不是：

- next-phase handoff shell
- governance dashboard
- correctness scoring wall
- multi-user review workflow

## Core Decision

第一版正式決策如下：

1. checkpoint payload 應保存：
   - `overall_score`
   - `scorecard_items`
   - `closure_posture`
2. completion review 的 `review_posture` 應優先讀 persisted checkpoint snapshot，而不是每次只看即時計算
3. backend 新增：
   - `POST /workbench/phase-6-sign-off`
4. sign-off 只允許：
   - owner
   - 已有 checkpoint
   - persisted review posture 已達 `review_ready`
5. 首頁仍留在既有 `Generalist Governance`

## Recommended First Slice

第一波只做：

- persisted checkpoint snapshot rewrite
- owner-only sign-off route
- homepage sign-off action / signed-off readout
- docs / QA / verification

## Non-Goals

第一波不做：

- next-phase handoff
- new page family
- enterprise governance shell
- scoring engine rewrite

## Shipped Outcome

這一刀目前已正式落地：

- checkpoint 現在會保存當時的 governance score snapshot
- backend 已有 `POST /workbench/phase-6-sign-off`
- owner 現在可在 review-ready 後正式做 `Phase 6 sign-off`
- 首頁既有 `Generalist Governance` 已補上 signed-off readout
- 這一刀沒有新增 handoff shell，也沒有新增 dashboard family
