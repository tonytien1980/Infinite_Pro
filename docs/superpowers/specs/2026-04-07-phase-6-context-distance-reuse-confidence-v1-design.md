# Phase 6 Context-Distance Reuse Confidence v1 Design

日期：2026-04-07
狀態：shipped

## Purpose

phase 6 目前已經能回答：

- reusable assets 是否可擴大重用
- 是否只應維持局部參考
- Host 現在如何調整 ordering
- 目前工作 guidance 應維持多低噪音、多明示邊界

但目前還缺一個更細的問題：

- 這些 reusable assets 跟「目前這案」到底距離多近
- 因此目前到底屬於高信心重用，還是只是有邊界的參考

因此這一刀定為：

- `phase-6 context-distance / reuse confidence v1`

## Product Posture

這一刀的正式定位是：

- 補上一條 low-noise `context distance / reuse confidence` read model
- 幫 system 正式回答 reusable intelligence 與當前案件脈絡之間的距離
- 讓 consultant 看得懂目前哪些來源較接近、哪些其實離現在這案還有段距離

這一刀不是：

- 新的 routing engine
- 自動禁用資產
- 新頁面 / dashboard
- 細粒度 tuning console

## Core Decision

第一版正式決策如下：

1. 第一波只做 read model，不改 Host weighting 規則
2. 第一波至少回答：
   - `close / moderate / far`
   - `high_confidence / bounded_confidence / low_confidence`
3. UI 仍掛在既有 `Generalist Governance`
4. 這一刀的作用是 explainability 與 confidence reading，不是 hard policy

## Recommended First Slice

第一波只做：

- backend `phase-6 context-distance / reuse-confidence` read model
- `GET /workbench/phase-6-context-distance-audit`
- homepage `Generalist Governance` 補一塊 low-noise `reuse confidence`
- helper copy / labels / docs / QA / verification 同步

## Non-Goals

第一波不做：

- automatic blocking
- full context-distance scoring engine
- task / matter / deliverable 全面 propagation
- page-local policy editor

## Shipped Outcome

這一刀目前已正式落地：

- backend 已有 `phase-6-context-distance-audit` read model
- system 已能正式回答 reusable assets 跟目前案件脈絡是 `close / moderate / far`
- `Generalist Governance` 已補上低噪音 `reuse confidence` 摘要
