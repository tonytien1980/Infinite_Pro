# Document-Heavy Review Lane Design

**Date:** 2026-04-03

**Goal**

把 `material_review_start` 從「已有一個 lane 標籤」深化成真正好用的 document-heavy review workflow，讓顧問在面對單份核心文件或少量正式材料時，能更快知道該怎麼審、先看哪裡、最後能交到什麼程度。

## Why This Matters

Infinite Pro 現在已能辨認：

- `diagnostic_start`
- `material_review_start`
- `decision_convergence_start`

但 `material_review_start` 目前仍偏向一個 derived label，而不是一條完整、好用、可複用的旗艦流程。

對你這種顧問工作來說，document-heavy review 是非常高頻的一類案子：

- 合約 / 條款 / 義務 / 風險審閱
- 提案 / 報告 / 文件重整
- 客戶丟來一份核心材料，要你快速看出重點與缺口
- 文件很多，但真正焦點常常先落在 1 份主材料上

如果這條 lane 不夠成熟，就會出現這些問題：

- 系統雖然知道是單材料起手，但不夠會帶你審
- 使用者不知道該先看風險、看缺口，還是直接跑分析
- 首屏沒有清楚回答「這份材料現在最多能交到哪裡」
- 補件後怎麼從 review 升級成 decision convergence，也不夠清楚

## Product Principle

這一輪不是做「文件工作台」或「文件管理器」，而是做一條 document-heavy 顧問審閱主線。

正式原則：

- 核心是 review / assess / restructure，不是檔案管理
- 表面要像顧問審閱流程，不要像知識庫或 DMS
- 單一主材料應有明確的第一屏閱讀邏輯
- 若材料不足，系統應清楚標示邊界，而不是假裝已完成完整決策收斂

## Scope

這一輪只處理 `material_review_start` 的旗艦流程深化。

In scope:

- `single_document_intake` / `material_review_start` 的 first-screen clarity
- matter / task / deliverable 對 document-heavy review 的首屏語言與主動作
- 單材料 review 從「正在審」到「可交付 review memo」的升級說明
- document-heavy review 與 `diagnostic_start / decision_convergence_start` 的邊界更清楚
- active docs 與 QA evidence 同步

Out of scope:

- 新增文件管理系統式 page / library shell
- OCR / parser 平台化
- 多文件 graph explorer
- 先做 precedent / reusable intelligence
- 改寫整個 ingest 或 retrieval stack

## Current Problem

目前 `material_review_start` 已存在，但使用體驗還不夠像一條真正的 workflow：

- 它知道這是單材料起手，但不夠清楚「先審什麼」
- UI 對 document-heavy case 的第一屏仍偏 generic
- 沒有明確把 review memo、risk review、document restructuring 這類審閱姿態說清楚
- 補件後如何升級成更完整的 decision / action 主線，也不夠像工作引導

## Design Decision

### 1. Treat Material Review As A Distinct Consultant Workflow

`material_review_start` 不只是 sparse-start 的下一站，也不是 decision convergence 的前置版。

它本身就是一條獨立顧問主線：

- 已有可直接審閱的正式材料
- 當前目標是形成 review / assessment / restructuring 結果
- 若要升級，才進入更完整的決策收斂

### 2. Make The First Screen Answer “What Am I Reviewing?”

document-heavy review 的第一屏應優先回答：

- 這次主要在審哪份材料
- 這輪重點是風險審閱、結構重整，還是判斷整理
- 現在應先補件、直接跑分析，還是回看最近交付物
- 這輪最多能交到 review memo，還是已接近決策交付

### 3. Keep Review Work Distinct From Decision Convergence

`material_review_start` 不應過早講成：

- 已完成方案比較
- 已完成最終決策收斂
- 已形成完整行動方案

它應明確保留邊界：

- 這輪先圍繞現有材料做 review / assessment
- 若還缺背景、來源或 decision context，應明示不足
- 若補件後可升級，再進 decision convergence

### 4. UI Should Feel Like A Review Desk, Not A File Repository

首屏語言應優先使用：

- 這輪主要在審哪份材料
- 先看哪個重點
- 目前最需要補哪一類材料
- 補完之後會往哪種交付升級

而不是：

- metadata
- storage
- artifact registry
- ingestion diagnostics

這些可以保留在次層，但不應和主線競爭。

## Experience Rules

### Matter Workspace

`material_review_start` 首屏應優先回答：

- 這是 document-heavy review 案，不是 sparse diagnosis
- 目前正在圍繞哪份核心材料工作
- 現在應先審、先補件，還是直接產出 review memo
- 目前這輪還不應被誤讀成最終決策收斂

### Task Workspace

`material_review_start` task 首屏應優先回答：

- 這筆工作屬於材料審閱 / 評估主線
- 執行分析後，結果會先落到 review / assessment deliverable
- 若還缺背景或證據，會卡在哪裡

### Deliverable Workspace

`material_review_start` deliverable 首屏應優先回答：

- 這是 review memo / assessment 結果，不一定是最終決策版本
- 這份交付物目前憑哪份材料成立
- 若要升級成 decision / action deliverable，下一步應補什麼

## Runtime / Contract Impact

這一輪不新增新的 ontology object，也不新增第七層。

正式策略：

- 優先重用既有 `flagship_lane`
- 優先重用既有 `deliverable_class_hint`
- 優先重用既有 readiness / evidence / presence-state signals
- 補的是 read-model shaping 與 UI wording，不是新 runtime branch

若需要補 contract，應偏向：

- 更清楚的 material-review summary
- 更清楚的 review-specific next-step phrasing
- 更清楚的 current-output / upgrade-target 描述

## UX Guardrails

這一輪必須遵守：

- one page, one primary action
- 不把 page 做成文件管理器首頁
- 不把 ingest / provenance / parser 細節放到第一屏
- 首屏優先服務「顧問正在審一份材料」這件事
- document-heavy 不等於資訊更重；應更聚焦

## Success Criteria

這一輪完成後，使用者應能在 3 到 5 秒內理解：

- 這是不是材料審閱案
- 現在主要在審哪份材料
- 這輪結果最多能交到哪裡
- 要升級成更完整決策交付，還缺什麼

更具體地說：

- `material_review_start` 明顯不像 sparse-start
- `material_review_start` 也不會被誤讀成 decision convergence
- 單材料案件的第一屏比現在更像顧問 review workflow

## Files Likely To Change

- `backend/app/services/tasks.py`
- `backend/tests/test_mvp_slice.py`
- `frontend/src/components/matter-workspace-panel.tsx`
- `frontend/src/components/task-detail-panel.tsx`
- `frontend/src/components/deliverable-workspace-panel.tsx`
- `docs/00_product_definition_and_current_state.md`
- `docs/01_runtime_architecture_and_data_contracts.md`
- `docs/03_workbench_ux_and_page_spec.md`
- `docs/04_qa_matrix.md`

## Verification Plan

至少驗證：

- `material_review_start` case 在 matter workspace 的首屏呈現
- `material_review_start` case 在 task workspace 的首屏呈現
- `material_review_start` case 在 deliverable workspace 的首屏呈現
- `single_document_intake` case 不會被誤導成 sparse-start 或 continuous posture
- `pytest`、`node --test`、frontend build、typecheck

