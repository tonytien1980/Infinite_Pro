# Research Final-Mile Design

**Date:** 2026-04-04

**Goal**

把 `Research / Investigation` 從「已有 guidance contract」再收成「第二層閱讀也像同一條系統研究主線」。

這一輪不新增 research console，也不改 backend contract。  
只做一件事：

- 讓 `matter / task / evidence / deliverable` 在研究相關的第二層閱讀上，也共用同一套顧問語言與閱讀順序

## Why This Matters

現在 research 已經不只是：

- 研究深度
- 第一個問題

它也已有：

- 來源品質
- 新鮮度
- 矛盾訊號
- citation-ready handoff
- evidence-gap closure

但第二層閱讀仍不一致：

- `task` / `matter` / `evidence` 已有研究細節，但是各自拼自己的卡片與 list
- `deliverable` 還停在 raw `research runs` list

結果是：

- research contract 已經成熟
- 但使用者在不同工作面看研究時，還是像在讀不同年代的產品

## Product Principle

這一輪不是新增研究功能，而是把既有研究能力讀得更一致。

正式原則：

- 保持 research Host-owned、system-run
- 不新增新頁面
- 不新增研究 dashboard
- 讓研究第二層閱讀跨工作面更一致
- 讓 deliverable 也能用顧問語言讀出「最近這輪系統研究交接了什麼」

## Scope

In scope:

- 新增 shared research detail helper
- 用 shared helper 收斂 `matter / task / evidence / deliverable` 的研究第二層閱讀
- deliverable 把 raw `research runs` 讀法改成較正式的 consultant-facing research handoff
- active docs 與 QA evidence 同步

Out of scope:

- 新增 research console
- 新增新的 backend research contract
- 新增研究排程中心
- 新增 precedent / reusable intelligence

## Design Decision

### 1. Reuse The Existing Research Contract

這一輪不往 backend 加欄位。

正式策略：

- guidance 仍以 `research_guidance` 為主
- deliverable / history 類資訊仍以 `research_runs` 為主
- 前端新增 shared helper，統一把 guidance / latest run 轉成 second-layer 顧問閱讀語言

### 2. Keep Guidance And Handoff In The Same Family

研究主線至少要讀得出：

- 這輪先查什麼
- 來源品質怎麼看
- 時效性與矛盾要怎麼看
- 研究結果最後要怎麼交回主線
- 缺口收斂到哪裡先停

deliverable 若已有 `research_runs`，應能回答：

- 最近一次系統研究做了什麼
- 主要查了哪些子題
- 來源品質與引用交接目前怎麼看

### 3. Keep The Surfaces Role-Specific

即使共用 helper，也要保留工作面角色：

- `matter` 偏主控與總覽
- `task` 偏這輪工作切片
- `evidence` 偏證據與補件
- `deliverable` 偏正式交接與可回看成果

所以這一輪做的是研究閱讀對齊，不是研究資訊架構合併。

## UX Guardrails

- 不新增 research dashboard
- 不讓研究資訊搶走主線
- `recommended / active` 時才明顯顯示
- deliverable 的研究區塊要像正式 handoff，不是 debug trace

## Success Criteria

這一輪完成後：

- `matter / task / evidence / deliverable` 的研究第二層會更像同一套產品語言
- deliverable 不再只是 raw `research runs`
- 使用者能更容易理解系統研究到底補了什麼、還保留了哪些不確定性、最後怎麼交回主線

## Files Likely To Change

- `frontend/src/lib/research-lane.ts`
- `frontend/src/components/matter-workspace-panel.tsx`
- `frontend/src/components/task-detail-panel.tsx`
- `frontend/src/components/artifact-evidence-workspace-panel.tsx`
- `frontend/src/components/deliverable-workspace-panel.tsx`
- `frontend/tests/intake-progress.test.mjs`
- `docs/00_product_definition_and_current_state.md`
- `docs/03_workbench_ux_and_page_spec.md`
- `docs/04_qa_matrix.md`

## Verification Plan

至少驗證：

- shared research detail helper 的 node test
- frontend build / typecheck
- backend compile / targeted pytest
- local smoke for:
  - research-heavy task
  - research-heavy matter / evidence
  - deliverable research handoff reading
