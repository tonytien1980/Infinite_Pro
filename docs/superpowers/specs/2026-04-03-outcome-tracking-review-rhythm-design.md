# Outcome Tracking And Review Rhythm Design

**Date:** 2026-04-03

**Goal**

在既有 `continuous advisory MVP` 上，補上 retained advisory loop 最需要的兩個正式答案：

- 這輪結果目前追到哪裡
- 下一次應該什麼時候回看

這一輪不做完整 recurring review system，而是先把 `continuous` 的 result tracking 與 review rhythm 做成可用、低噪音的 MVP。

## Why This Matters

上一輪已讓 `continuous` 案件頁能回答：

- 現在健康嗎
- 最近推進到哪裡
- 下一步先做什麼

但 retained advisory 真正要成立，還缺兩個關鍵答案：

- 現在追蹤到的 outcome 到底是正向、卡住，還是需要刷新 deliverable
- 這案應該多久回看一次，不然顧問還是要靠自己記

如果沒有這層，`continuous` 仍然比較像「看得懂現在狀態」，還不是「真的能沿著節奏一路做下去」。

## Product Principle

這一輪不是做 calendar system，也不是做 reminder center。

正式原則：

- 底層承接 outcome record 與 action state
- 表層只回答結果追蹤與回看節奏
- 保持顧問人話，不做排程軟體外觀
- 第一波先放在 `matter workspace`

## Scope

In scope:

- 在 `continuation_surface` 補：
  - `outcome_tracking`
  - `review_rhythm`
- `matter workspace` 首屏與主線補充區讀出這兩個答案
- active docs 與 QA evidence 同步

Out of scope:

- 真正的 recurring automation
- 日曆、通知、排程中心
- task / deliverable / evidence 的 retained-advisory 全面重排
- precedent / reusable intelligence

## Design Decision

### 1. Outcome Tracking Must Summarize, Not Dump Logs

`outcome_tracking` 不應該只是把 `outcome_records` 原樣列出來。

它應優先回答：

- 現在追蹤到的主要結果是什麼
- 目前更像正向進展、阻塞、還是待確認
- 這些結果是否已值得刷新 deliverable

### 2. Review Rhythm Must Be Guidance, Not Scheduling UI

`review_rhythm` 第一波不做明確 calendar integration，而是先給：

- 目前建議的回看節奏
- 為什麼要這樣回看
- 下一次回看時最該確認什麼

也就是顧問工作節奏提示，而不是通知系統。

### 3. Matter Workspace Stays The Primary Surface

這一輪仍然是 matter-first。

原因：

- 長期案的節奏管理主要發生在案件工作台
- task / deliverable 比較像單輪工作與正式成果切面
- retained advisory 的總體節奏應先在 matter workspace 成立

## Runtime / Contract Impact

延用現有 `ContinuationSurfaceRead`，新增兩個 read-model：

- `outcome_tracking`
- `review_rhythm`

這兩個欄位只是在 continuity read-model 補正式答案，不新增新 layer、不新增新 ontology object。

## UX Guardrails

- 不新增新頁面
- 不新增日曆視圖
- 不新增提醒中心
- 先在 matter workspace 低噪音露出
- `follow_up` / `one_off` 不應被這輪 UI 污染

## Success Criteria

這一輪完成後，使用者回到 `continuous` 案件頁，應能在 3 到 5 秒內理解：

- 最近 outcome 現在算是正向、卡住，還是要重看
- 這案現在比較適合短週期回看，還是有新訊號再回看
- 下一次回看時最該確認的事情是什麼

## Files Likely To Change

- `backend/app/domain/schemas.py`
- `backend/app/services/tasks.py`
- `backend/tests/test_mvp_slice.py`
- `frontend/src/lib/types.ts`
- `frontend/src/lib/continuation-advisory.ts`
- `frontend/src/components/matter-workspace-panel.tsx`
- `frontend/tests/intake-progress.test.mjs`
- `docs/00_product_definition_and_current_state.md`
- `docs/01_runtime_architecture_and_data_contracts.md`
- `docs/03_workbench_ux_and_page_spec.md`
- `docs/04_qa_matrix.md`

## Verification Plan

至少驗證：

- backend 會正式回出 `outcome_tracking / review_rhythm`
- `continuous` matter workspace 會把這兩個答案低噪音露出
- `follow_up` 與 `one_off` 不受污染
- `pytest`、`node --test`、frontend build、typecheck、local smoke
