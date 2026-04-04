# Retained Advisory Final-Mile Design

**Date:** 2026-04-04

**Goal**

把 retained-advisory 從「首屏已對齊」再收成「第二層閱讀也對齊」。

這一輪不新增新的 continuity contract，不新增頁面，也不新增提醒中心。  
只做一件事：

- 讓 `matter / task / deliverable / evidence` 在展開後的 continuity 閱讀，也沿用同一條 `follow_up / continuous` 語言

## Why This Matters

目前第一層已經比之前清楚很多：

- `follow_up` 會讀成回來更新 / checkpoint
- `continuous` 會讀成持續推進 / outcome

但第二層還不夠一致：

- `matter` 已有較完整的 retained-advisory detail block
- `task` 還是偏工作頁自己的說法
- `deliverable` 還保留較多 raw lane list
- `evidence` 還有一些 continuity 細節卡片自己拼接

結果是：

- 首屏看起來像同一個產品
- 但一展開細節，又像回到不同時期的文案層

## Product Principle

這一輪不做新能力，只做閱讀一致性收尾。

正式原則：

- 同一條 continuity 主線，首屏與第二層都應讀得出同樣心智
- `follow_up` 保持 checkpoint-first
- `continuous` 保持 progression / outcome-first
- 不把第二層做成 dashboard，也不新增管理殼

## Scope

In scope:

- 新增 shared continuity detail helper
- 用 shared helper 收斂 `matter / task / deliverable / evidence` 的第二層 continuity 區塊
- 補測試，鎖住 checkpoint / progression detail wording
- active docs 與 QA evidence 同步

Out of scope:

- 新增 backend contract
- 新增 calendar / reminder / notification shell
- 新增 precedent / reusable intelligence
- 新增多人協作 / governance

## Design Decision

### 1. Reuse `continuation_surface`

這一輪不往 backend 加欄位。

正式策略：

- 繼續以 `continuation_surface` 為唯一 continuity surface
- 延用既有 `buildContinuationAdvisoryView`
- 在前端新增第二層的 shared detail helper

### 2. Make Second-Layer Reading Mode-Specific But Shared

使用者展開 continuity 區塊後，應該看到：

- `follow_up`
  - 最近 checkpoint
  - 這輪變化
  - 回來更新節奏
  - 下一步建議
- `continuous`
  - 推進健康
  - 結果追蹤
  - 最近推進
  - 下次回看節奏
  - 下一步建議

這些答案應該跨頁一致，但仍保留工作面角色。

### 3. Keep Matter As The Main Control Surface

`matter workspace` 仍是 retained-advisory 主控面。

所以這一輪不是把所有頁面抹平成同一頁，而是：

- `matter` 作為最完整 continuity surface
- 其他頁面用共用 helper 跟齊語言與閱讀順序

## UX Guardrails

- 不新增新大區塊
- 只替換既有 continuity 細節區塊的文案與排列方式
- 不能把 `follow_up` 寫成簡化版 `continuous`
- 不能讓 `continuous` 退回 generic progress tracker
- 不留下英文殘字例如 `Progression continuity`

## Success Criteria

這一輪完成後：

- `matter / task / deliverable / evidence` 的第二層 continuity 區塊會更像同一條產品語言
- `follow_up` 在所有工作面都保持 checkpoint-first
- `continuous` 在所有工作面都保持 progression / outcome-first
- 首屏與第二層不再彼此打架

## Files Likely To Change

- `frontend/src/lib/continuation-advisory.ts`
- `frontend/src/components/matter-workspace-panel.tsx`
- `frontend/src/components/task-detail-panel.tsx`
- `frontend/src/components/deliverable-workspace-panel.tsx`
- `frontend/src/components/artifact-evidence-workspace-panel.tsx`
- `frontend/tests/intake-progress.test.mjs`
- `docs/00_product_definition_and_current_state.md`
- `docs/03_workbench_ux_and_page_spec.md`
- `docs/04_qa_matrix.md`

## Verification Plan

至少驗證：

- shared detail helper 的 node test
- frontend build / typecheck
- backend compile / targeted pytest
- local smoke for:
  - strict `follow_up` task detail
  - strict `follow_up` evidence detail
  - `continuous` deliverable detail
