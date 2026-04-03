# Follow-Up Middle Layer Design

**Date:** 2026-04-03

**Goal**

把 `follow_up` 做成清楚、低噪音、好理解的中間層，讓它明確介於 `one_off` 與 `continuous` 之間，避免案件在 UI/UX 上被誤導成「不是已結案，就是要進入完整長期追蹤」。

## Why This Matters

Infinite Pro 現在已能分辨：

- `one_off`
- `follow_up`
- `continuous`

但目前 shipped surface 仍有一個真實風險：

- `follow_up` 太容易被看成「長期追蹤的弱化版」
- `one_off` 與 `follow_up` 的首屏語言還不夠分明
- `continuous` 的 progression 心智可能外溢到不需要它的案件

這會直接傷害產品的清楚度。對顧問來說，最重要的不是系統有沒有 continuity capability，而是每次打開案件時，能不能立刻知道：

- 這是哪一種案子
- 這一輪在做什麼
- 現在最該做什麼
- 不該把這頁誤讀成什麼

## Product Principle

這一輪不是要把 continuity 做得更重，而是要把 continuity 做得更清楚。

正式原則：

- `one_off` 應像一次性交付系統
- `follow_up` 應像回來更新 / 補件 / checkpoint 的系統
- `continuous` 才像 action / outcome 持續推進系統

換句話說：

> 底層保留完整 continuity 能力，但表面只露出符合這一種案件的最小心智負擔。

## Scope

這一輪只處理 `follow_up` middle layer clarity。

In scope:

- matter workspace 的 `follow_up` 首屏語言與主動作
- task workspace 的 `follow_up` 首屏語言與導引
- deliverable workspace 的 `follow_up` 首屏語言與回跳建議
- `follow_up` 與 `one_off / continuous` 的首屏邊界更清楚
- active docs 與 QA evidence 同步

Out of scope:

- 完整深化 `continuous` retained advisory experience
- 新增 continuity page / dashboard
- 新增 timeline app shell
- 新增 team collaboration / assignment / reviewer shell
- 改寫整個 continuation runtime contract

## Current Problem

目前 runtime 已有 `follow_up_lane`、`continuation_surface`、`record_checkpoint` 等骨架，但工作面仍可能讓使用者感覺：

- `follow_up` 只是比 `continuous` 少一點功能
- 需要理解太多底層概念才知道下一步
- 同一頁同時看到 closure / checkpoint / progression 語言
- 不確定這輪應該補件、更新 checkpoint，還是重新跑分析

這不是底層能力不足，而是表層心智模型還不夠銳利。

## Design Decision

### 1. Make Follow-Up A Distinct Product Posture

`follow_up` 不再只是 continuity mode 的其中一種 technical value，而要成為一種清楚的顧問工作姿態：

- 已有一輪結果
- 這次是回來更新，不是重新開新案
- 重點是 checkpoint / milestone update
- 不要求完整 action / outcome loop

### 2. Protect One-Off From Continuity Drift

`one_off` 首屏不應預設出現 progression / outcome / next progression 語言。

它應優先回答：

- 這份結果是否已可正式閱讀 / 匯出 / 結案
- 若還不夠，應先補件還是先跑分析
- 是否需要 reopen

### 3. Keep Continuous Explicitly Heavier Than Follow-Up

`continuous` 才需要正式回答：

- latest progression state
- action state
- outcome signal
- next progression action

`follow_up` 則只回答：

- previous checkpoint
- latest update
- what changed
- next follow-up action

### 4. UI Should Use Consultant Language, Not Runtime Language

首屏應優先使用：

- 上次做到哪裡
- 這次有什麼變化
- 這輪最值得先補什麼
- 補完後回哪裡

而不是：

- checkpoint lane
- progression layer
- workflow layer
- outcome logging

runtime 詞彙可以保留在次層，但不與首屏競爭。

## Experience Rules

### Matter Workspace

`follow_up` 首屏應優先回答：

- 這是一個回來更新的案件，不是重新開新案
- 上一次 checkpoint 是什麼
- 這次最重要的變化是什麼
- 現在應先補件、更新 checkpoint，或回看最新交付物

首屏不應：

- 讓 `follow_up` 看起來像 `continuous` 的縮小版
- 把 progression / outcome 放在與 checkpoint 同層

### Task Workspace

`follow_up` task 首屏應優先回答：

- 這筆工作屬於 checkpoint 更新鏈
- 跑分析之後，結果會寫回哪個 update / deliverable / checkpoint
- 若這輪只是補強，不應被誤讀成長期追蹤

### Deliverable Workspace

`follow_up` deliverable 首屏應優先回答：

- 這是來自 follow-up 的版本更新
- 現在適合回案件工作台寫 checkpoint，而不是進入完整 progression tracking
- 若還要續推，建議回哪個工作面

## Runtime / Contract Impact

這一輪不新增新的 ontology object，也不新增第七層。

正式策略：

- 優先重用既有 `continuation_surface`
- 優先重用既有 `follow_up_lane`
- 補的是 read-model shaping 與 UI wording，不是新 runtime branch

若需要補 contract，應偏向：

- 更清楚的 `follow_up` surface summary
- 更清楚的 `follow_up` next-step phrasing
- 更清楚的 `one_off vs follow_up vs continuous` 首屏保護欄

## UX Guardrails

這一輪必須遵守：

- one page, one primary action
- progressive disclosure over duplication
- follow_up 首屏不可比現在更重
- 不新增 continuity dashboard-first 頁面
- 不新增需要顧問先學習的新控制項
- 不把 `follow_up` 的資訊密度做得接近 `continuous`

## Success Criteria

這一輪完成後，使用者應能在 3 到 5 秒內理解：

- 這案是一次性、回來更新、還是持續推進
- 這頁現在最重要的是什麼
- 這輪不該被誤讀成什麼

更具體地說：

- `one_off` 不再被 continuity 語言污染
- `follow_up` 明顯像 checkpoint / milestone update
- `continuous` 明顯保留最重的 progression / outcome 語言

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

- `follow_up` case 在 matter workspace 的首屏呈現
- `follow_up` case 在 task workspace 的首屏呈現
- `follow_up` case 在 deliverable workspace 的首屏呈現
- `one_off` case 不會露出不必要的 progression / outcome 語言
- `continuous` case 仍保留較完整的 progression 語言
- `pytest`、`node --test`、frontend build、typecheck

