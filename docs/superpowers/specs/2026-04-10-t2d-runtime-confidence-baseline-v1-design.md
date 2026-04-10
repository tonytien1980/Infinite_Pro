# T2-D Runtime Confidence Baseline V1 Design

日期：2026-04-10
狀態：draft

## Purpose

`docs/06_product_alignment_and_85_point_roadmap.md` 已把 `T2-D` 定義成：

- `Runtime and release confidence deepen`

正式應補的是：

- browser smoke 常態化
- Docker-specific runtime gate
- live runtime verification confidence uplift

目前 Infinite Pro 已經有一個 repo-native release-readiness baseline：

- `backend/scripts/run_release_readiness.py --tier static`
- `backend/scripts/run_release_readiness.py --tier runtime`

這代表第一層 baseline 已成立，但 `T2-D` 仍有三個明顯缺口：

1. runtime gate 目前只有「給你 frontend/backend base URL 後去打」的 generic 模式
   - 還沒有正式區分：
     - standalone local runtime
     - Docker Compose runtime

2. `browser smoke` 雖然已在 README 與 `docs/04` 被誠實列成第三層
   - 但還沒有一個 repo-native、可重複參照的 smoke target contract

3. QA evidence 目前仍混有不同 runtime profile 的歷史記錄
   - 例如有些條目指向 `127.0.0.1:8010`
   - 但當前 compose / `.env` 預設其實是 `8000 / 3000`
   - 若不把 profile 講清楚，之後很難誠實聲稱「這次到底驗的是哪種 runtime」

這一刀的目的，就是把目前的 release-readiness baseline 往前推成：

- `runtime confidence baseline v1`

## Product Posture

這一刀的正式角色是：

- 把「已可執行」的 release-readiness baseline，補成「更可解釋、可區分 profile、可重複使用」的 runtime confidence contract
- 讓 runtime evidence 能明確回答：
  - 這次驗的是 standalone 還是 Docker Compose
  - browser smoke 應該開哪些頁面 / flows
  - 哪些是 repo-native script 證據
  - 哪些仍是 operator-assisted smoke 證據

這一刀不是：

- CI 平台化
- browser automation lab
- deploy console
- release dashboard
- 一口氣全自動化所有 smoke flow

## Architecture Guardrails

這一刀不改 Infinite Pro 的六層架構。

這一刀只會發生在：

- 既有 `backend/scripts/run_release_readiness.py`
- 對應的 script tests
- README / `docs/04` / `docs/06` 的 release-confidence contract

這一刀不會：

- 改 Host orchestration
- 改 workbench product surfaces
- 把 browser smoke 誤包裝成 fully automated runtime proof
- 新增新的 runtime admin page

## Why This Slice Now

目前 `T2-C` 已經連做兩刀：

- `task detail usability pass v1`
- `task detail operating leverage v1`

task surface 的主體現在已經比之前穩很多。相對地，接下來最值得補的是：

- `T2-D` 仍然幾乎沒動
- 現有 runtime / smoke evidence 仍偏分散
- compose profile 與 standalone profile 的界線還不夠正式

也就是說，現在再繼續留在 `T2-C`，價值多半只剩更細的 polish；而轉進 `T2-D`，可以更直接提升：

- F 類 runtime confidence
- ship / release posture 的可信度

## Approaches Considered

### Approach A: Docs-only clarification

只更新 README 與 `docs/04`，把 Docker / standalone / browser smoke 的差別寫清楚，不改 script。

優點：

- 最安全
- 不需要碰程式

缺點：

- 沒有把 repo-native release-readiness 入口一起補齊
- 太容易回到 docs 說得清楚，但 script 本身不知道 profile 的狀態

### Approach B: Docker-aware runtime profile + browser smoke target contract

延伸既有 `run_release_readiness.py`，讓它正式支援 runtime profile 概念，並在 repo 內建立一組 browser smoke target contract，但仍保持 browser smoke 為 operator-assisted。

優點：

- 能直接補上 `T2-D` 最核心的缺口
- 不會把 repo 拉成 browser automation platform
- docs / script / QA evidence 能一起對齊

缺點：

- 需要很小心地區分「target contract」和「fully automated smoke」

### Approach C: Full browser automation baseline

把 `browser smoke` 直接做成自動化 script / Playwright full path。

優點：

- 最完整

缺點：

- 範圍太大
- 很容易變成另一條大型工程線
- 也不符合目前 `T2-D` 第一刀應該先誠實補 baseline 的節奏

本輪採用：

- `Approach B: Docker-aware runtime profile + browser smoke target contract`

## Core Decision

這一刀的正式決策如下：

1. repo-native runtime gate 必須正式支援 `runtime profile`
   - 至少明確區分：
     - `standalone`
     - `docker-compose`

2. Docker Compose profile 必須對準 repo 已有的 `docker-compose.yml` 與當前 `.env` 預設
   - 不應繼續混用舊的 `8010` 路徑當成 compose 預設
   - 預設 compose profile 應以 repo 現在的 `8000 / 3000` 為主

3. browser smoke 仍然維持 `operator-assisted`
   - 但 repo 內要有一組正式 target contract，至少回答：
     - 要打哪些 route
     - 最小 smoke flow 是什麼
     - 這些 smoke targets 對應哪個 runtime profile

4. runtime confidence uplift 的第一刀，重點不是「把所有 smoke 自動化」
   - 而是讓每一次驗證都更誠實、可重複、可對照

5. README、`docs/04`、`docs/06`、script 行為，必須對同一套 terminology：
   - `static`
   - `runtime`
   - `browser smoke`
   - `standalone`
   - `docker-compose`

## Proposed First Slice

這一刀正式只做：

1. Docker-aware runtime profile support
   - 延伸 `run_release_readiness.py`
   - 讓 runtime gate 能用 profile 名稱生成 target set，而不是只能靠外部手動傳 URL 才知道在驗什麼

2. browser smoke target contract
   - 在 repo 內補一組 canonical browser smoke targets
   - 這組 targets 只提供 operator-assisted smoke 的正式參照，不直接宣稱 automation complete

3. release-readiness tests deepen
   - 補 script pytest，驗證：
     - standalone profile targets
     - docker-compose profile targets
     - browser smoke target contract

4. docs / QA sync
   - `README`
   - `docs/04`
   - `docs/06`

## Runtime Direction

runtime profile 的方向應該是：

- `standalone`
  - 承接目前 branch / local runtime 的最小 smoke 方式
- `docker-compose`
  - 承接 repo 內正式的 compose 路徑與 `.env` 預設

browser smoke target contract 的方向應該是：

- 先鎖定最小但高價值的 consultant-facing paths
- 不追求一次把所有頁面全收進 smoke set
- 也不把 operator-assisted smoke 假裝成 fully automated gate

## Verification Intent

這一刀的驗證重點應包括：

- script 是否能清楚區分 standalone / docker-compose runtime profile
- compose profile 是否對準 repo 現有 `docker-compose.yml` 與 `.env` 預設
- browser smoke target contract 是否形成正式可讀的 baseline
- README / `docs/04` / `docs/06` 是否與 script terminology 完全一致
- 若 Docker daemon 可用，至少補一次真實 compose runtime evidence
- 若 Docker daemon 不可用，也必須誠實記錄這次缺少的是哪一層 live evidence

## Explicitly Not In Scope

這一刀明確不做：

- full browser automation lab
- deploy pipeline / CI platform
- release dashboard
- runtime admin console
- workbench UI 改版
- Host / case-world / task runtime contract 變更

## Expected Outcome

完成後，`T2-D slice 1` 應能讓 Infinite Pro 的 runtime confidence 進到下一個誠實完成點：

- repo-native release-readiness baseline 不再只是一個 generic runtime probe
- 每次 runtime 驗證都能更清楚回答：現在驗的是 standalone 還是 Docker Compose
- browser smoke 雖仍是 operator-assisted，但已經有正式、可重複參照的 smoke target contract
- README、`docs/04`、`docs/06` 與 script 本體會對到同一套 runtime confidence vocabulary
