# Product Reliability And Release Discipline v1 Design

日期：2026-04-09
狀態：draft

## Purpose

`docs/06_product_alignment_and_85_point_roadmap.md` 已把第五條主線定成：

- `7.5 Priority 5: Product reliability and release discipline`

正式目標是：

- 把目前已經很強的產品骨架，推進成更像成熟產品的驗證與發版節奏
- 讓 shipped claim、QA evidence、以及 repo 內實際可執行的 verification path 更一致
- 讓「build / typecheck / local runtime / browser smoke」不再混成一團

這一刀不是在新增產品功能，而是在補：

- verification contract
- local runtime smoke baseline
- release-readiness discipline

## A-H Alignment

這一刀主打：

- `F. product maturity`

本輪目標不是大幅拉動其他面向，而是先把 `F` 從現在較分散的 verification posture，推到更穩、更可重複、也更少靠人工記憶的狀態。

## Product Posture

這一刀的正式角色是：

- 把 repo 目前零散但有效的驗證做法，收斂成一套比較正式的 release-readiness baseline
- 讓日後每次宣告「已完成 / 已驗證 / 可收 branch」時，更有一致的依據

這一刀不是：

- CI platform
- deploy dashboard
- multi-environment admin shell
- browser test lab
- 新的產品 page family

正式仍要維持：

- evidence before assertions
- docs and code stay aligned
- local branch and GitHub stay synchronized
- QA matrix 是唯一 shipped evidence 檔

## Current State

repo 目前已正式存在幾條有效但分散的驗證路徑：

1. backend 驗證
   - `python -m compileall`
   - `pytest`

2. frontend 驗證
   - `node --test`
   - `npm run build`
   - `npm run typecheck`

3. benchmark / regression
   - `backend/scripts/run_pack_benchmark_scaffold.py`

4. live runtime evidence
   - 主要以 `docs/04_qa_matrix.md` 的實跑紀錄保存

但目前還有幾個 reliability / release-discipline gap：

### 1. verification 命令仍散在各個 plan 與 QA entry

目前很多驗證命令其實有效，但主要散在：

- `docs/04`
- `docs/05`
- 各 phase 的 spec / plan

這代表：

- 人知道怎麼驗，不等於 repo 自己知道怎麼驗
- 發版 readiness 仍偏向「記得這次跑過哪些命令」

### 2. frontend static verification 順序仍不夠正式

目前這個 repo 已經反覆出現一個現實：

- `typecheck` 有時候依賴 `.next/types`
- 實際上常常要先 `build`
- `npx next typegen` 也可能因本地 `.next/types` 狀態而出現路徑毛病

也就是說：

- `build`
- `typecheck`
- `typegen`

之間的正式順序與 fallback handling 還不夠明確。

### 3. live runtime verification 常存在，但不夠常態化

`docs/04` 已經有很多很好的 live runtime 與 browser smoke evidence，但它們仍比較像：

- 某一輪有做
- 某一輪沒做
- 某一輪明講 `Not run`

這是誠實的，但也代表：

- `7.5` 還沒把「什麼時候至少要做哪種 live check」正式化

### 4. repo 缺少 release-readiness baseline script / runbook contract

目前 `backend/scripts/` 裡已有 benchmark scaffold runner，但還沒有對應：

- static release-readiness baseline
- local runtime health baseline
- smoke baseline

這讓每次驗證都比較像重新組合。

## Existing Constraints

這一刀必須遵守幾個限制：

1. 不把 repo 變成 CI platform
2. 不把 `docs/04` 換成新的 QA 系統
3. 不引入新的 deploy shell 或 admin console
4. 不讓 release discipline 反過來成為顧問主產品的可見主流程
5. 若 browser smoke 做不到 fully automated，也必須誠實區分：
   - repo-native static checks
   - local runtime checks
   - browser-assisted smoke

## Approaches Considered

### Approach A: Docs-only runbook cleanup

只更新：

- `docs/04`
- `docs/05`
- `README`

把驗證順序講得更清楚。

優點：

- 最快
- 風險最低

缺點：

- 仍主要靠人記得命令
- repo 自己沒有新的 release-readiness 執行入口
- `7.5` 會比較像描述改善，而不是工作流改善

### Approach B: Repo-native release-readiness baseline v1

第一刀正式補：

- 一個 repo-native verification / release-readiness script family
- static verification 的 canonical order
- local runtime health / smoke baseline
- active docs 與 QA evidence 的正式對齊

優點：

- 最符合 `7.5`
- 會讓 repo 更知道「怎麼證明這次真的 ready」
- 不需要一次做成大型 CI / browser platform

缺點：

- 需要同時碰 script、runbook、docs、QA
- 要很小心區分哪些是 repo-native、哪些仍是 operator-assisted

### Approach C: Full browser automation first

第一刀直接做：

- 大量 Playwright smoke automation
- 發版前完整 browser suite

優點：

- 理論上最完整

缺點：

- 範圍過大
- 很容易偏成 test platform project
- 不適合 `7.5` 第一刀

本輪採用：

- `Approach B: Repo-native release-readiness baseline v1`

## Core Decision

這一刀的正式決策如下：

1. `7.5 v1` 先不做 full browser automation platform
2. 先把 repo-native verification path 正式化
3. 把驗證分成三層：
   - static verification
   - local runtime verification
   - browser smoke verification
4. 把「哪些可以由 repo 內 script 執行、哪些仍需人工 / browser tool 輔助」明確寫清楚
5. 只在 real evidence 存在時更新 `docs/04`

## Proposed First Slice

第一刀正式只做：

### 1. Release-readiness script baseline

新增一組 repo-native scripts / entrypoints，至少正式承接：

- backend compile
- backend pytest baseline
- frontend build
- frontend typecheck
- local backend health check
- local frontend route reachability check

這一刀的重點不是 shell 炫技，而是讓 repo 內正式有：

- `static gate`
- `runtime gate`

的最小入口。

### 2. Verification tier separation

正式把 verification 分成三層：

- `static`
  - 不依賴 live runtime
- `runtime`
  - 依賴 frontend / backend 已啟動
- `browser smoke`
  - 依賴 live runtime 且需做 user-flow 驗證

這能讓之後每次 QA evidence 更清楚回答：

- 這次到底跑到了哪一層
- 哪些 claim 是真的驗過
- 哪些只是還沒做，不是失敗

### 3. Canonical frontend verification order

正式釐清：

- `build`
- `typecheck`
- `typegen`

的實際順序與 fallback rule。

這一刀應誠實承認：

- 目前這個 repo 的 `typecheck` 對 `.next/types` 有依賴
- 因此 verification order 不能只寫成理想化順序

### 4. Local runtime smoke runbook baseline

正式建立一個最小 runbook，回答：

- backend health endpoint 怎麼檢
- frontend route availability 怎麼檢
- 哪些頁面是最低限度 smoke target

第一刀不要求自動化所有 browser smoke，但至少應讓：

- smoke target
- expected outcome
- operator path

有正式 baseline。

## What This Slice Must Improve

這一刀完成後，至少要能更誠實回答：

- 這次是否只做 static checks，還是真的做了 local runtime
- frontend verification 的正式順序是什麼
- 發版 readiness 到底有沒有明確 baseline，而不是靠記憶

## What This Slice Must Not Do

這一刀明確不能做：

- 新的 deploy dashboard
- CI mega project
- browser lab platform
- 只寫更多說明文字卻沒有 repo-native entrypoint
- 把 release discipline 變成顧問可見產品主流程

## Success Criteria

這一刀完成後，正式至少要成立：

1. repo 內有正式的 release-readiness baseline 入口
2. static / runtime / browser smoke 三層分界清楚
3. frontend build / typecheck / typegen 的順序與 fallback rule 更明確
4. `docs/04` 的 evidence 記法能更清楚區分驗證層級
5. shipped claim 與 verification evidence 的落差更少

## Verification Expectations

這一刀正式至少要驗證：

- release-readiness script / entrypoint 可執行
- backend health check 可執行
- frontend static verification 可重複執行
- 至少一條 local runtime smoke 路徑被實跑並記進 `docs/04`

若 benchmark behavior 沒改，則：

- 不更新 `docs/05`

若 verification posture 與 shipped discipline 改了，則正式同步：

- `docs/04_qa_matrix.md`
- `docs/06_product_alignment_and_85_point_roadmap.md`
- 視需要更新 `README.md` 的 local verification 段落
