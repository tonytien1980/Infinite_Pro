# Follow-Up Checkpoint Timeline Design

**Date:** 2026-04-03

**Goal**

把 `follow_up` 從「知道最近一個 checkpoint 是什麼」深化成真正可用的 checkpoint timeline MVP，讓顧問回到案件工作台時能更快理解：

- 最近幾輪 checkpoint 是怎麼變的
- 目前這案的回來更新節奏穩不穩
- 下次應該什麼時候回來更新

這一輪不把 `follow_up` 做成縮小版 `continuous`，而是把它自己的 middle-layer 心智做完整。

## Why This Matters

目前 `follow_up` 已經有：

- latest update
- previous checkpoint
- what changed
- next follow-up action

但它還沒有真正像一條好用的「回來更新 / checkpoint」主線，因為：

- timeline 雖然底層已經有，但還沒有成為首屏可用的閱讀主線
- 回看節奏還不夠正式，不夠像顧問工作節奏提示
- 回到案件頁時，使用者仍要自己把多個欄位拼起來理解

## Product Principle

這一輪不是讓 `follow_up` 更像 `continuous`。

正式原則：

- `follow_up` 保持 checkpoint / milestone update 心智
- timeline 要像更新紀錄，不像 progression dashboard
- review rhythm 要像「什麼時候值得回來更新」，不是排程系統
- 表面維持簡單，不新增新頁面

## Scope

In scope:

- `follow_up` 的 checkpoint timeline MVP
- `continuation_surface.review_rhythm` 正式支援 `follow_up`
- `matter workspace` 用同一條 advisory helper 讀出 follow-up timeline 與回來更新節奏
- active docs 與 QA evidence 同步

Out of scope:

- 不把 `follow_up` 做成 action / outcome dashboard
- 不新增 calendar / reminder center
- 不改寫 task / deliverable / evidence 的 follow-up layout

## Design Decision

### 1. Reuse `timeline_items`, Do Not Invent A Second Timeline Contract

`follow_up` 的 checkpoint timeline 已經可由 `timeline_items` 承接，因此這一輪不新增第二套 timeline 欄位。

正式策略：

- `timeline_items` 繼續作為 `follow_up` 與 `continuous` 共用 timeline surface
- 差異留在 `kind`、標題與說明文案

### 2. Add Review Rhythm For `follow_up`

`follow_up` 雖然不是 regular cadence loop，但仍需要一個很輕的回來更新節奏提示。

例如：

- 有新資料就回來更新
- 補件後回看
- 這週內回來確認一次

這是顧問工作節奏，不是行事曆。

### 3. Matter Workspace Stays The Primary Surface

這一輪一樣是 matter-first。

因為：

- `follow_up` 的節奏判斷主要發生在案件工作台
- task / deliverable 仍比較像單輪工作切面
- 先把案件頁做清楚，比把每個工作面都微調更有價值

## UX Guardrails

- 不可把 `follow_up` 寫成「小型 continuous」
- 首屏用語仍應明示這是回來更新 / checkpoint 節奏
- 不新增新頁面
- 不增加厚重儀表板

## Success Criteria

這一輪完成後，使用者回到 `follow_up` 案件頁，應能在 3 到 5 秒內理解：

- 最近幾輪 checkpoint 怎麼變
- 目前更新節奏穩不穩
- 下次是有新資料就回來，還是值得短期回看一次

## Files Likely To Change

- `backend/app/domain/schemas.py`
- `backend/app/services/tasks.py`
- `backend/tests/test_mvp_slice.py`
- `frontend/src/lib/continuation-advisory.ts`
- `frontend/src/lib/types.ts`
- `frontend/src/components/matter-workspace-panel.tsx`
- `frontend/tests/intake-progress.test.mjs`
- `docs/00_product_definition_and_current_state.md`
- `docs/01_runtime_architecture_and_data_contracts.md`
- `docs/03_workbench_ux_and_page_spec.md`
- `docs/04_qa_matrix.md`

## Verification Plan

至少驗證：

- backend 會在 `follow_up` continuation surface 回出 `review_rhythm`
- `follow_up` matter workspace 會顯示 checkpoint timeline 與回來更新節奏
- `follow_up` 不會被誤讀成 `continuous`
- `pytest`、`node --test`、frontend build、typecheck、local smoke
