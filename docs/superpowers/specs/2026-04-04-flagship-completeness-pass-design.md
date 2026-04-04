# Flagship Workflow Completeness Pass Design

**Date:** 2026-04-04

**Goal**

把三條旗艦主線從「首屏已可辨識」再收成「第二層閱讀也像同一套產品語言」。

這一輪不新增新的 workflow，也不新增新的 backend contract。  
只做一件事：

- 讓 `matter / task / deliverable / evidence` 在第二層也都能用同一套方式回答：
  - 目前工作姿態是什麼
  - 目前交付等級是什麼
  - 這一輪的適用邊界在哪裡
  - 下一步要怎麼升級

## Why This Matters

目前旗艦 lane 已經不只是標籤：

- `diagnostic_start`
- `material_review_start`
- `decision_convergence_start`

也已有：

- current output
- boundary note
- upgrade target
- upgrade requirements

但第二層閱讀還不夠一致：

- `matter` 多半只顯示一條升級提示
- `task` 主要還是把 flagship 當成首屏 fallback
- `deliverable` 雖然有 lane 文案，但第二層沒有同樣清楚的主線收斂
- `evidence` 仍以補件語言為主，旗艦 lane 的升級邏輯沒有明顯成為第二層閱讀的一部分

結果是：

- 首屏知道自己在哪條旗艦主線
- 但第二層還是不夠像一條完整 workflow

## Product Principle

這一輪不是新增第 4 條 workflow，而是把現有 3 條 workflow 收完整。

正式原則：

- flaghsip lane 的第二層閱讀應跨工作面保持一致
- `diagnostic / review / convergence` 的差異要保留
- 不新增 dashboard
- 不把 evidence / deliverable 變成教學頁

## Scope

In scope:

- 新增 shared flagship detail helper
- 用 shared helper 收斂 `matter / task / deliverable / evidence` 的第二層 flagship 閱讀
- active docs 與 QA evidence 同步

Out of scope:

- 新增 backend flagship contract
- 新增新 workflow
- 新增 precedent / reusable intelligence
- 新增 enterprise / team 能力

## Design Decision

### 1. Reuse The Existing Flagship Contract

這一輪不往 backend 加欄位。

正式策略：

- 延用既有 `flagship_lane`
- 延用既有 `buildFlagshipLaneView`
- 前端補一個 second-layer helper，把既有欄位轉成一致的閱讀結構

### 2. Keep The Reading Structure Shared

第二層至少都要讀得出：

- 目前工作姿態
- 目前交付等級
- 適用邊界
- 升級目標
- 升級條件 / 下一步

### 3. Keep Surface Roles Distinct

即使共用 helper，也要保留工作面角色：

- `matter` 偏主控與總覽
- `task` 偏這輪工作切片
- `deliverable` 偏正式成果與版本
- `evidence` 偏補件與支撐鏈

所以這一輪做的是 workflow reading 對齊，不是資訊架構合併。

## UX Guardrails

- 不新增新頁面
- 不新增重型旗艦 lane 管理殼
- 不讓第二層變成重複首屏
- 不留下英文殘字或內部 contract 語氣

## Success Criteria

這一輪完成後：

- `matter / task / deliverable / evidence` 的第二層都更清楚說明該旗艦主線目前處在哪裡
- 使用者能更快理解「這一輪能交到哪裡」「不能誤讀成什麼」「再往上升級缺什麼」
- 三條旗艦主線更像完整產品，而不是只有首屏分流

## Files Likely To Change

- `frontend/src/lib/flagship-lane.ts`
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

- shared flagship detail helper 的 node test
- frontend build / typecheck
- backend compile / targeted pytest
- local smoke for:
  - diagnostic-start matter/task/evidence
  - document-heavy review deliverable or task
