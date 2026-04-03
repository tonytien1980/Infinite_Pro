# Continuous Advisory MVP Design

**Date:** 2026-04-03

**Goal**

把 `continuous` 從「已經有 progression / outcome 語言」深化成真正可用的 retained advisory MVP，先讓案件工作台能清楚回答：

- 現在健康嗎
- 最近推進到哪裡
- 下一步先做什麼

這一輪不做厚重 dashboard，也不把整個 workbench 重排；先把 matter workspace 做成可信、低噪音的持續推進主控面。

## Why This Matters

目前 Infinite Pro 已經有：

- `one_off / follow_up / continuous` continuity mode
- `follow_up` 的中間層 clarity
- `continuous` 的基本 progression / outcome posture

但它還沒有真正完成 retained advisory MVP。對顧問來說，這會卡在一個尷尬狀態：

- 系統知道這是長期案
- 也知道可以記錄 outcome
- 但你回到案件頁時，還不夠快看懂現在到底推進得好不好

如果這一段不補，`continuous advisory lane` 仍然會停在「概念與 contract 已在」而不是「真的每天想打開來用」。

## Product Principle

這一輪不是做 project management dashboard，也不是把案件工作台變成 KPI cockpit。

正式原則：

- 底層可保留 action / outcome loop
- 表層只回答最重要的 3 個問題
- 首屏應像 retained advisory 主控面，不像 generic progress tracker
- `continuous` 可以比 `follow_up` 深，但仍必須克制

## Scope

In scope:

- `continuous` 的 retained advisory MVP
- `continuation_surface` 補正式 read-model 欄位，讓前端不必自行拼湊
- `matter workspace` 首屏新增低噪音：
  - health signal
  - progression timeline
  - next-step queue
- active docs 與 QA evidence 同步

Out of scope:

- 不重做 task / deliverable / evidence 的整體 continuity layout
- 不新增新頁面或新導航
- 不做完整 recurring review system
- 不做 precedent / reusable intelligence
- 不做聊天式互動治理

## Design Decision

### 1. Add Three Formal Answers To `continuation_surface`

這一輪新增的不是新 layer，而是讓現有 `continuation_surface` 多 3 個正式答案：

- `health_signal`
- `timeline_items`
- `next_step_queue`

這樣 matter workspace 不需要自己散接 `progression_lane` 與 `follow_up_lane` 才能推導 retained advisory 介面。

### 2. Keep The Surface Matter-First

這一輪最值得做深的地方是 `matter workspace`，因為它才是長期案的真正主控面。

`task` 和 `deliverable` 仍可以沿用既有 continuity posture 與 lane 文案，但不必在這輪一起重做 retained advisory layout。

### 3. Health Must Be Plain-Language, Not KPI-Speak

所謂 health signal，不是多一排 enterprise 指標，而是很白話地回答：

- 目前推進穩定
- 目前有阻塞，要先解卡
- 目前需要重看或刷新

重點是幫顧問快速判斷，不是做分數牆。

### 4. Timeline Should Read As “Recent Progression”, Not Audit Log

timeline 不應變成完整稽核歷史首頁，而應優先承接：

- 最近一輪 outcome / progression
- 前一輪 progression
- 最多再往前一輪

讓顧問一眼知道最近 2 到 3 輪是怎麼推進的。

### 5. Queue Must Stay Action-Oriented

next-step queue 應保持少量、可採行、顧問人話。

重點不是「列出所有可能下一步」，而是先給 2 到 4 條最值得先做的事。

## Experience Rules

### Matter Workspace

`continuous` 首屏應優先回答：

- 現在這案健康度如何
- 最新一輪 progression / outcome 是什麼
- 跟前一輪相比，最近變化是什麼
- 接下來先做哪幾件事

而且這些答案應放在第一屏就可讀到的位置，不需要先展開深層 disclosure。

### Follow-Up Guardrail

這一輪雖然會在 backend contract 上補共通欄位，但 `follow_up` 仍應保持：

- checkpoint 心智
- milestone update 語言
- 不被 progression 儀表板污染

### One-Off Guardrail

`one_off` 不應被 health / timeline / queue 過度佔據第一屏。若 contract 回傳空或低噪音摘要即可，不應把一次性案件做成 retained advisory 外觀。

## Runtime / Contract Impact

這一輪不新增 ontology object，也不新增第七層。

正式策略：

- 延用 `ContinuationSurfaceRead`
- 延用 `FollowUpLaneRead` / `ProgressionLaneRead`
- 在 `continuation_surface` 補：
  - health signal
  - timeline items
  - next-step queue

這些都屬於 read-model 強化，而不是新 runtime branch。

## UX Guardrails

這一輪必須遵守：

- matter 首屏只新增低噪音 retained advisory 區塊
- 不新增新頁面
- 不新增重量級 dashboard 或圖表
- 不讓 `continuous` 首屏比現在更難讀
- 不讓 `follow_up` / `one_off` 被同一套重介面污染

## Success Criteria

這一輪完成後，使用者回到 `continuous` 案件頁，應能在 3 到 5 秒內理解：

- 這案目前是穩定、卡住、還是要重看
- 最近 2 到 3 輪是怎麼推進的
- 下一步先做哪幾件事

更具體地說：

- `continuous` 看起來更像 retained advisory 主控面
- `follow_up` 仍保持 checkpoint 中間層心智
- `one_off` 沒有被這輪功能污染

## Files Likely To Change

- `backend/app/domain/schemas.py`
- `backend/app/services/tasks.py`
- `backend/tests/test_mvp_slice.py`
- `frontend/src/lib/types.ts`
- `frontend/src/lib/continuity-ux.ts`
- `frontend/src/components/matter-workspace-panel.tsx`
- `frontend/tests/intake-progress.test.mjs`
- `docs/00_product_definition_and_current_state.md`
- `docs/01_runtime_architecture_and_data_contracts.md`
- `docs/03_workbench_ux_and_page_spec.md`
- `docs/04_qa_matrix.md`

## Verification Plan

至少驗證：

- backend 會正式回出 `health_signal / timeline_items / next_step_queue`
- `continuous` matter workspace 首屏會優先顯示 retained advisory MVP
- `follow_up` 仍保持 checkpoint posture，不被 progression MVP 污染
- `pytest`、`node --test`、frontend build、typecheck
