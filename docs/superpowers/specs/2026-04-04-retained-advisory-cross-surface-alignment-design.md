# Retained Advisory Cross-Surface Alignment Design

**Date:** 2026-04-04

**Goal**

把已經在 `matter workspace` 成形的 retained-advisory 心智，低噪音對齊到：

- `task workspace`
- `deliverable workspace`
- `evidence workspace`

這一輪不新增新頁面，也不把這三個面做成 dashboard，只是讓它們都更清楚回答：

- 這案現在是什麼節奏
- 最近變了什麼
- 下一步先做什麼

## Why This Matters

目前 retained-advisory loop 的主控面已經在 `matter workspace` 站穩，但其他工作面還停留在較舊的 continuity 呈現：

- `task` 仍偏單句提示
- `deliverable` 仍偏 raw lane summary
- `evidence` 仍偏補件主線語言

這會造成使用者跨頁切換時，心智又掉回比較碎的 continuity 文案。

## Product Principle

這一輪不是把所有頁面重做一遍。

正式原則：

- 一條 continuity / retained-advisory 心智，跨工作面保持一致
- 每頁只露最需要的那一層
- 不新增新的 continuity taxonomy
- 以 helper 封裝共用文案，不讓每頁自己拼

## Scope

In scope:

- 新增一個共用 continuity advisory focus helper
- `task / deliverable / evidence` 的 hero / first-screen continuity callout 對齊
- 既有 detail 區塊適度跟進，但不做大改版
- active docs 與 QA evidence 同步

Out of scope:

- 新增頁面
- 新增 dashboard
- 新增 calendar / reminder shell
- 改寫 backend contract

## Design Decision

### 1. Reuse The Existing Advisory Contract

這一輪不新增 backend 欄位。

正式策略：

- 重用 `continuation_surface`
- 重用 `buildContinuationAdvisoryView`
- 在前端補一個共用 focus-card helper，把它轉成適合 `task / deliverable / evidence` 的摘要語言

### 2. Make Cross-Surface Continuity Read The Same Way

使用者切到不同工作面時，不應重新學一套 continuity 語言。

理想上：

- `matter` 是主控面
- `task / deliverable / evidence` 是切面
- 但它們都應讀得出同一條 retained-advisory 主線

### 3. Keep The Surfaces Role-Specific

雖然要一致，但不能抹平成同一頁：

- `task` 仍是工作切片
- `deliverable` 仍是正式成果
- `evidence` 仍是補件 / 支撐鏈

所以這一輪做的是 continuity summary 對齊，不是資訊架構合併。

## UX Guardrails

- 不新增新卡片牆
- 只補一層更清楚的 focus summary
- 不讓 `follow_up` 漂成 `continuous`
- 不讓 `continuous` 漂成 project tracker

## Success Criteria

這一輪完成後，使用者切到 `task / deliverable / evidence` 任一頁時，都能在幾秒內理解：

- 目前是哪種 continuity 節奏
- 最近最重要的更新是什麼
- 下一步最該做什麼

而且這三頁的 continuity 語言應該比現在更一致。

## Files Likely To Change

- `frontend/src/lib/continuation-advisory.ts`
- `frontend/src/components/task-detail-panel.tsx`
- `frontend/src/components/deliverable-workspace-panel.tsx`
- `frontend/src/components/artifact-evidence-workspace-panel.tsx`
- `frontend/tests/intake-progress.test.mjs`
- `docs/00_product_definition_and_current_state.md`
- `docs/03_workbench_ux_and_page_spec.md`
- `docs/04_qa_matrix.md`

## Verification Plan

至少驗證：

- helper test 鎖住 checkpoint / progression 的 cross-surface summary
- task / deliverable / evidence 三個工作面都能讀出同一條 retained-advisory 心智
- frontend build / typecheck / node test
- local smoke routes for task / deliverable / evidence
