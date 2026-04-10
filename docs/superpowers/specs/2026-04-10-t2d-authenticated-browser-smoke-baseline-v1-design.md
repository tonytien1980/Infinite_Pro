# T2-D Authenticated Browser Smoke Baseline V1 Design

日期：2026-04-10
狀態：draft

## Purpose

`T2-D slice 2` 已把 browser smoke 往前推成：

- normalized smoke manifest
- required / optional smoke lanes
- dynamic-entry expectation

但目前 `docs/04` 裡最新的真實 browser smoke evidence 仍停在：

- required targets 都 hit 到了
- 但因為 browser session 未登入
- 所有 protected routes 都被導回 `/login?next=...`

這代表目前 browser smoke 的正式缺口，已經不是：

- target contract 不清楚

而是：

- authenticated browser smoke 還沒有正式 baseline

現在的 gap 主要有四個：

1. Infinite Pro 的 protected routes 全都依賴正式 session cookie
   - 現在沒有 authenticated browser session，就只會看到 `/login`

2. 系統目前只有正式 Google login
   - 沒有 local dev login
   - 沒有測試專用 bypass
   - 沒有 smoke-only auth shortcut

3. 目前 `browser smoke normalization v1` 雖然已經把 unauthenticated smoke 記得很誠實
   - 但還沒有一條正式的 authenticated smoke baseline

4. 如果不把這一刀補起來，之後的 smoke evidence 會一直卡在：
   - 能證明 auth gate 正常
   - 但不能證明登入後的主要 consultant-facing surfaces 仍正常

這一刀的目的，就是把目前的 browser smoke baseline 往前推成：

- `authenticated browser smoke baseline v1`

## Product Posture

這一刀的正式角色是：

- 把 authenticated smoke 從 ad-hoc 操作，推到一個誠實、可重複、可記錄的 operator-assisted baseline
- 讓 QA / release evidence 能更清楚區分：
  - unauthenticated smoke
  - authenticated smoke
  - 哪一種 evidence 補了哪一層信心

這一刀不是：

- auth bypass
- local dev login
- fake session injection
- full Google OAuth automation
- Playwright platform build-out

## Architecture Guardrails

這一刀不改 Infinite Pro 的六層架構。

這一刀只會發生在：

- `README`
- `docs/04`
- `docs/06`
- 既有 release-readiness / browser-smoke contract
- 必要時一個很小的 browser-smoke helper 或 documentation-side runbook contract

這一刀不會：

- 新增測試專用 auth backdoor
- 改 Google login flow
- 改 session middleware / cookie semantics
- 改 protected-route gating
- 把 operator-assisted smoke 誤說成 fully automated proof

## Why This Slice Now

`T2-D` 前兩刀已經把這條主線推到一個很自然的下一步：

- `runtime confidence baseline v1`
- `browser smoke normalization v1`

也就是說：

- runtime profile 已清楚
- browser smoke manifest 也清楚

現在最明顯的真正缺口，只剩：

- authenticated browser smoke 還沒有正式 baseline

如果這刀不補，`T2-D` 會一直停在：

- 我們知道要 smoke 哪些頁
- 也知道 protected routes 會導回 login
- 但還是沒有正式證據證明「登入後的主工作面」仍可正常進入

## Approaches Considered

### Approach A: 新增測試專用 auth bypass

加一條只給 smoke / QA 用的登入捷徑，直接建立 session。

優點：

- 最容易跑
- 最容易穩定重複

缺點：

- 明顯違反目前 auth 架構與產品邊界
- 會把 smoke baseline 建在一條 production 不存在的路上
- 不誠實

### Approach B: Operator-assisted authenticated smoke via real session reuse / cookie import

沿用既有正式 Google login 與 cookie-based session，不改產品邏輯；authenticated smoke 的正式做法是：

- 使用已登入的本地真實 browser session
- 或透過 operator-assisted cookie import，把同一個正式 session 帶進 smoke browser

優點：

- 最符合目前產品真實 auth 邊界
- 不需要發明假的登入路徑
- 能讓 authenticated smoke evidence 更可信

缺點：

- 仍有人工步驟
- baseline 不會像 fake auth 那麼無腦穩定

### Approach C: Full automated Google OAuth smoke

直接把 Google login 整條也自動化。

優點：

- 最完整

缺點：

- 範圍太大
- 很容易變成另一條大型工程
- 完全不符合目前 `T2-D` 的 slice 節奏

本輪採用：

- `Approach B: Operator-assisted authenticated smoke via real session reuse / cookie import`

## Core Decision

這一刀的正式決策如下：

1. authenticated browser smoke baseline 必須沿用正式 auth 邊界
   - 只能使用：
     - 已登入的真實 session
     - 或 operator-assisted cookie import
   - 不能靠 auth bypass

2. authenticated smoke 應正式和 unauthenticated smoke 分層記錄
   - unauthenticated：
     - 可證明 auth gate 正常
   - authenticated：
     - 才能證明登入後主工作面正常

3. authenticated smoke 的 required target 不必一次覆蓋所有 protected surfaces
   - 第一刀應先鎖定最有價值的 consultant-facing required set

4. demo workspace 不能當成正式 authenticated smoke 的替代
   - 因為 demo workspace 是特定隔離場景
   - 不能直接等同正式 firm workspace 的 consultant-facing smoke

5. smoke evidence 必須誠實記錄 auth entry method
   - 例如：
     - existing browser session
     - cookie import
   - 不可只寫「已登入」

## Proposed First Slice

這一刀正式只做：

1. authenticated smoke baseline contract
   - 在 release / QA docs 補一條正式的 authenticated smoke baseline
   - 清楚定義：
     - 何時需要 authenticated smoke
     - 怎麼進場
     - 哪些 target 是 required

2. cookie/session entry normalization
   - 把「使用既有登入 session 或 cookie import」寫成正式 operator-assisted 路徑
   - 這一刀可以明確承認需要先有真實登入 session

3. authenticated smoke evidence format
   - 在 `docs/04` 補一組更標準化的 evidence wording
   - 明確記：
     - auth entry method
     - 哪些 required authenticated targets 有跑
     - 哪些 optional targets 沒跑

4. minimal authenticated target set
   - 第一刀先鎖定最值得證明的 protected surfaces，例如：
     - overview
     - matters list
     - deliverables list
     - task detail 或 matter workspace 其中一個 detail target

## Authenticated Smoke Direction

這一刀的 authenticated smoke baseline 應優先回答：

- 在真實登入 session 存在時，首頁是否仍能正常進入主工作面
- 主要 protected list surfaces 是否能正常讀取
- 至少一個 detail surface 是否仍能正常進場

而不是一開始就要求：

- 全部頁面都要 authenticated smoke
- 全部 detail route 都要覆蓋
- Google OAuth 整條都 fully automated

## Verification Intent

這一刀的驗證重點應包括：

- authenticated smoke baseline 是否已在 docs / runbook 中正式成立
- auth entry method 是否被誠實記錄
- 至少一次真實 authenticated browser smoke evidence 是否存在
- 若 cookie import / session reuse 做不到，也必須明確記錄 blocker，而不是再把 evidence 寫成模糊的 `Not run`

## Explicitly Not In Scope

這一刀明確不做：

- auth bypass
- local dev login
- fake session injection endpoint
- full Google OAuth automation
- Playwright automation lab
- deploy / CI browser infrastructure
- runtime business logic 調整

## Expected Outcome

完成後，`T2-D slice 3` 應能讓 Infinite Pro 的 browser smoke posture 往前推到下一個誠實完成點：

- unauthenticated smoke 與 authenticated smoke 會正式分層
- authenticated smoke 會有明確的 operator-assisted baseline
- QA evidence 不再只停在「protected routes 會導回 login」
- 後續若要再做更高層的 browser automation，也會建立在真實 auth baseline 之上，而不是建立在假登入捷徑之上
