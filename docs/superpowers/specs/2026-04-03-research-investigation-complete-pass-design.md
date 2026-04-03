# Research / Investigation Complete Pass Design

**Date:** 2026-04-03

**Goal**

把 `Research / Investigation` 從現在的 first pass 補成真正成熟的完整版本，但仍維持低噪音工作面，不做研究控制台。

這一輪的核心是讓現有 `research_guidance` 正式回答：

- 子問題拆解是什麼
- 來源品質怎麼看
- 新鮮度 / 時效性怎麼看
- 矛盾訊號該怎麼留
- citation-ready handoff 長什麼樣
- 缺口要怎麼收斂

## Why This Matters

目前 Infinite Pro 已能回答：

- 這輪要不要先補研究
- 建議研究深度
- 第一個研究問題
- 何時先停止研究
- 研究完交回哪條主線

這已經是好的 first pass，但還不夠像真正成熟的研究 lane。對顧問來說，成熟版本還應讓系統更清楚幫你處理：

- 問題怎麼拆
- 來源可信度怎麼看
- 哪些資訊要看新鮮度
- 哪些訊號互相矛盾
- 最後要怎麼交回可引用、可收斂的工作結果

## Product Principle

這一輪不是做 research dashboard。

正式原則：

- 底層研究能力可以更強
- 表面仍維持低噪音 research guidance
- 新資訊應優先掛在既有 matter / task / evidence 工作面
- 不讓 research lane 搶走主線工作心智

## Scope

In scope:

- 擴充 `ResearchGuidanceRead`
- 擴充 frontend research guidance helper
- 低噪音補強 matter / task / evidence 現有 research guidance 區塊
- active docs 與 QA evidence 同步

Out of scope:

- 新增研究專用頁面
- 新增搜尋控制台
- 真正自動引用編輯器
- precedent / reusable intelligence
- 聊天式互動治理

## Design Decision

### 1. Keep `suggested_questions` As The Visible Sub-Question Decomposition

不用再另發明第二個 sub-question object。

這一輪的原則是：

- `suggested_questions` 正式承擔 sub-question decomposition
- 補的是它的品質與配套欄位，不是另起一套研究樹

### 2. Add Five New Read-Model Answers

在現有 `research_guidance` 上補：

- `source_quality_summary`
- `freshness_summary`
- `contradiction_watchouts`
- `citation_ready_summary`
- `evidence_gap_closure_plan`

這五個欄位都是 read-model 強化，不新增新層。

### 3. Source Quality Should Stay Human And Operational

`source_quality_summary` 不應是抽象方法論，而要像顧問真的會看的規則，例如：

- 優先官方、原始、第一手
- 新聞型題材要交叉
- 二手整理不可直接當結論

### 4. Freshness And Contradiction Must Stay Lightweight

這兩塊很重要，但不應變成 debug wall。

正式原則：

- `freshness_summary` 只回答這輪是否高度依賴近期訊號
- `contradiction_watchouts` 只列最需要保留的矛盾點

### 5. Citation-Ready Means “Ready To Hand Back”, Not “Auto-Citation UI”

這一輪不做引用編輯器。

`citation_ready_summary` 的責任是說清楚研究輸出應具備：

- 來源可回看
- 矛盾已留
- 可交回主控代理或綜整主線

### 6. Evidence Gap Closure Plan Must Be Actionable

`evidence_gap_closure_plan` 不應只重述 gap title，而應像顧問下一步要做的補強計畫。

例如：

- 先補哪類公開來源
- 哪類 gap 補到什麼程度就先停
- 哪些 gap 其實應改走補件主鏈

## UX Guardrails

- 不新增新頁面
- 不新增研究控制台
- 不把既有工作面塞成研究牆
- 第一屏只露最重要的 research guidance
- 其餘細節放在既有次層區塊內

## Success Criteria

這一輪完成後，使用者在有研究需求的案件上，應能在 3 到 5 秒內理解：

- 系統會怎麼拆研究問題
- 來源品質與新鮮度要怎麼看
- 哪些矛盾必須保留
- 研究最後要交回怎樣的 handoff
- 哪些缺口先補、補到哪裡先停

## Files Likely To Change

- `backend/app/domain/schemas.py`
- `backend/app/services/tasks.py`
- `backend/tests/test_mvp_slice.py`
- `frontend/src/lib/types.ts`
- `frontend/src/lib/research-lane.ts`
- `frontend/src/components/matter-workspace-panel.tsx`
- `frontend/src/components/task-detail-panel.tsx`
- `frontend/src/components/artifact-evidence-workspace-panel.tsx`
- `frontend/tests/intake-progress.test.mjs`
- `docs/00_product_definition_and_current_state.md`
- `docs/01_runtime_architecture_and_data_contracts.md`
- `docs/02_host_agents_packs_and_extension_system.md`
- `docs/03_workbench_ux_and_page_spec.md`
- `docs/04_qa_matrix.md`

## Verification Plan

至少驗證：

- backend `research_guidance` 會正式回出上述五個欄位
- strict / not-needed 路徑仍維持低噪音
- matter / task / evidence 工作面能低噪音讀出新資訊
- `pytest`、`node --test`、frontend build、typecheck、local smoke
