# T2-D Browser Smoke Normalization V1 Design

日期：2026-04-10
狀態：draft

## Purpose

`docs/06_product_alignment_and_85_point_roadmap.md` 已把 `T2-D` 定義成：

- `Runtime and release confidence deepen`

目前第一刀 `runtime confidence baseline v1` 已經落地：

- repo-native release-readiness baseline 可明確區分 `standalone` / `docker-compose`
- `browser_smoke` 已有 canonical target contract

但 `browser smoke` 目前仍停在一個「存在 target contract、但還沒有真正 normalizable smoke baseline」的階段。

現在的 gap 主要有三個：

1. 既有 browser smoke contract 仍偏「靜態 target 列表」
   - 還不足以回答：
     - 哪些是必跑 smoke targets
     - 哪些是 conditional targets
     - 對 dynamic route 應該怎麼進場

2. `docs/04` 目前對 browser smoke 的表述仍偏「這層存在，但這次沒跑」
   - 還沒有一個更標準化的 smoke evidence 格式

3. `runtime confidence baseline v1` 已把 `standalone` / `docker-compose` profile 立起來
   - 下一步最自然的不是再加更多 runtime probe
   - 而是把 browser smoke 也變成更一致、可重複、可對照的 operator-assisted baseline

這一刀的目的，就是把目前的 browser smoke contract 往前推成：

- `browser smoke normalization v1`

## Product Posture

這一刀的正式角色是：

- 把 browser smoke 從「抽象存在的第三層驗證」推到「有一致 target shape、flow ordering、evidence wording 的 smoke baseline」
- 讓 QA / release evidence 更誠實地回答：
  - 這次 smoke 跑了哪些 targets
  - 哪些 targets 是必跑
  - 哪些 dynamic surfaces 不是硬寫 ID，而是有標準進場方式

這一刀不是：

- full browser automation lab
- CI browser suite
- Playwright 平台化
- deploy dashboard
- 全面 E2E framework build-out

## Architecture Guardrails

這一刀不改 Infinite Pro 的六層架構。

這一刀只會發生在：

- `backend/scripts/run_release_readiness.py`
- 對應的 script tests
- `README`
- `docs/04`
- `docs/06`

這一刀不會：

- 改 Host / runtime business logic
- 改 workbench UI behavior
- 把 operator-assisted smoke 誤說成 fully automated proof
- 新增新的 runtime admin page 或 smoke dashboard

## Why This Slice Now

`T2-D` 的第一刀已經把 runtime profile 基礎打好了：

- `standalone`
- `docker-compose`
- canonical `browser_smoke` targets

這代表第二刀最合理的延伸，不是再回頭補 generic runtime，而是把：

- `browser smoke 常態化`

先做成一個誠實、可重複、可記錄的 baseline。

而且這一刀正好符合先前的 guardrail：

- 不要把 release-readiness script 當成一鍵可信任的萬能 gate
- 要明確區分：
  - script 能證明什麼
  - operator-assisted smoke 又在補什麼

## Approaches Considered

### Approach A: Docs-only smoke checklist

只在 README 與 `docs/04` 補一段更明確的 smoke checklist，不改 script output。

優點：

- 最安全
- 不碰程式

缺點：

- 會讓 smoke baseline 再次分裂成：
  - script 一套
  - docs 一套
- 不利於未來 session 重複沿用

### Approach B: Profile-aware smoke manifest normalization

延伸既有 `browser_smoke` contract，把它補成更完整的 smoke manifest，包含：

- required / optional 分流
- direct route / list-entry / dynamic-target 的進場型態
- smoke ordering
- evidence expectation

優點：

- 能直接把目前抽象 contract 變成更可執行的 baseline
- 仍維持 operator-assisted，不會 scope 爆炸
- 很適合做成 `T2-D slice 2`

缺點：

- 需要很小心不要越做越像自動化平台

### Approach C: Full Playwright smoke runner

直接把 canonical targets 接成完整 browser automation。

優點：

- 最完整

缺點：

- 範圍太大
- 會把這刀從 baseline normalization 拉成另一條大工程
- 不符合目前 `T2-D` 的節奏

本輪採用：

- `Approach B: Profile-aware smoke manifest normalization`

## Core Decision

這一刀的正式決策如下：

1. `browser_smoke` contract 應升級成較完整的 `smoke manifest`
   - 不再只有 label/path
   - 還要回答：
     - required 還是 optional
     - direct route 還是 dynamic entry flow
     - smoke intent
     - evidence expectation

2. `browser_smoke normalization v1` 仍維持 `operator-assisted`
   - 這一刀不把 smoke flow 變成 fully automated runner
   - 但要讓未來每次 smoke evidence 的格式更一致

3. dynamic route 不能再只是抽象 `path template`
   - 必須補一個誠實的進場方式
   - 例如：
     - 先從列表頁進場
     - 再打開第一筆可用項目
   - 而不是假裝有固定 ID

4. `standalone` 與 `docker-compose` 的 smoke manifest 必須共用同一組頁面責任
   - 差別只應在 profile / base URL / runtime posture
   - 不應讓 smoke target 名稱漂移

5. `docs/04` 的 browser smoke evidence 應開始使用較標準化的 wording
   - 清楚區分：
     - 這次跑了哪些 required targets
     - 哪些 optional targets 沒跑
     - 哪些 dynamic targets 用了什麼進場方式

## Proposed First Slice

這一刀正式只做：

1. browser smoke manifest builder deepen
   - 延伸 `run_release_readiness.py` 的 `browser_smoke` payload
   - 補 `required/optional`
   - 補 `entry_kind`
   - 補 `path_template` / `entry_path`
   - 補 `evidence_expectation`

2. release-readiness tests deepen
   - 補 pytest，驗證：
     - standalone / docker-compose manifest shape 一致
     - dynamic target 不是只有裸 `path template`
     - required targets 排序與 naming 穩定

3. smoke baseline docs normalization
   - 在 `README` 補一個更明確的 operator-assisted smoke 說明
   - 在 `docs/04` 新增標準化的 smoke evidence entry
   - 在 `docs/06` 記錄 `T2-D slice 2` 的進度

## Smoke Direction

這一刀的 browser smoke baseline 應優先鎖定高價值 consultant-facing flows：

- overview
- new matter entry
- matters list
- deliverables list
- task detail operating surface

但其中不同 target 應被誠實分類：

- direct route targets
- dynamic-entry targets

例如：

- `/`
- `/new`
- `/matters`
- `/deliverables`
  都可屬於 direct route

而 task detail 則應更像：

- `entry_path = /matters` 或 `/deliverables`
- `entry_kind = list-to-detail`

而不是假裝有穩定固定的 `/tasks/<seed-id>`。

## Verification Intent

這一刀的驗證重點應包括：

- script pytest 是否能證明 smoke manifest shape 已穩定
- `browser_smoke` payload 是否比現在更完整、可讀、可重複
- README / `docs/04` / `docs/06` 是否都用同一套 smoke terminology
- 至少補一次真實 operator-assisted browser smoke evidence
  - 明確記錄 required targets
  - 明確記錄 dynamic target 的實際進場方式
- 若某個 dynamic target 因資料狀態無法進場，也必須誠實記錄，而不是假裝 pass

## Explicitly Not In Scope

這一刀明確不做：

- full Playwright automation suite
- deploy / CI browser infrastructure
- release dashboard
- runtime admin console
- 新的 UI surface 改版
- runtime business logic 調整

## Expected Outcome

完成後，`T2-D slice 2` 應能讓 Infinite Pro 的 browser smoke posture 往前推到下一個誠實完成點：

- `browser_smoke` 不再只是抽象 target list
- smoke baseline 會有更完整的 manifest shape
- operator-assisted smoke evidence 會開始有一致格式
- future sessions 也更容易沿用同一套 smoke baseline，而不需要每次重新猜「這次要 smoke 哪些頁面、怎麼進場」
