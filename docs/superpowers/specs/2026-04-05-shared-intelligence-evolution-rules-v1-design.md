# Shared Intelligence Evolution Rules V1 Design

## Purpose

這一輪不做多人共案協作，也不做 team management shell。

先把 precedent / reusable intelligence 裡最接近「共享顧問大腦」的一刀補上：

- `shared_intelligence_signal`

也就是讓系統不只知道：

- 這筆 precedent 為什麼被保留
- 這筆 precedent 最能幫哪一種 reusable asset

還開始知道：

- 這筆 precedent 目前仍偏個別經驗，還是已開始形成共享模式
- 這筆 precedent 目前應提高參考、先持平觀察，還是降低參考

## Why This Now

Infinite Pro 現在已經有：

- adoption feedback
- reason-coded precedent governance
- optimization signal
- team-attributed governance v1
- Host-safe precedent reference
- reusable assets first pass

但它還沒有正式回答：

> 多位顧問各自使用後，哪些模式開始像共享 intelligence，哪些仍只是局部經驗？

這一輪是在補：

> feedback -> optimization loop 的 shared-intelligence 演化規則第一刀

## Scope

第一版只做：

1. precedent review lane
2. Host-safe precedent reference
3. prompt-safe precedent context
4. 低噪音 precedent UI readback

不做：

- 顯性 consultant seniority 分級
- team collaboration UI
- auth / RBAC
- 手動調權後台
- 黑箱自動優化全部 orchestration

## Role Separation

這層必須和既有 contract 分清楚：

- `review_priority`
  - 回答：這筆候選值不值得先看
- `optimization_signal`
  - 回答：這筆候選對哪種 reusable asset 最有幫助
- `shared_intelligence_signal`
  - 回答：這筆候選目前累積到什麼程度、下一案應多大程度參考

也就是：

- `review_priority` = 先看順序
- `optimization_signal` = 最適合幫哪類 reusable asset
- `shared_intelligence_signal` = 共享成熟度與權重趨勢

## Read Model

新增 nested object：

- `shared_intelligence_signal`

第一版 contract 至少包括：

- `maturity`
  - `personal`
  - `emerging`
  - `shared`
- `maturity_reason`
- `maturity_label`
- `weight_action`
  - `upweight`
  - `hold`
  - `downweight`
- `weight_action_label`
- `supporting_candidate_count`
- `distinct_operator_count`
- `promoted_candidate_count`
- `dismissed_candidate_count`
- `summary`

## Derivation Rules

第一版只允許用既有 precedent rows 推導，不新增新的大型資料層。

收斂來源只包括：

- candidate status
- feedback status / reason codes
- operator attribution
- precedent family similarity
  - candidate type
  - reusable-asset family
  - lane / deliverable type
  - domain overlap

這一版的關鍵不是絕對正確，而是：

- 比沒有演化規則更接近共享 intelligence
- 可解釋
- 低風險
- 不傷害使用者體驗

## Host Usage

第一版只允許：

- precedent review 排序細化
- Host-safe precedent reference 排序細化
- precedent context explainability 強化

不允許：

- consultant ranking
- 顯性資歷標籤
- correctness score
- UI 上的 manual weighting console

## UX Rules

這層 UI 只做低噪音補充，不新增新頁面。

### History / precedent review

可低噪音補：

- `共享成熟度：...`
- `權重趨勢：...`

### Task / deliverable precedent reference

可低噪音補：

- 這筆 precedent 目前偏個別經驗，還是已開始形成共享模式
- Host 目前會提高參考、先持平觀察，還是降低參考

正式規則：

- 不可露出 consultant 等級
- 不可讓使用者覺得自己被系統貼上初階 / 高階標籤
- UI 必須維持像顧問工作台裡的輕量回讀，而不是管理後台

## Expected Outcome

做完後，Infinite Pro 會開始更接近你要的那個方向：

- 每位顧問各自辦案
- 回饋與 precedent 會逐漸累積成共享 intelligence
- 系統開始知道哪些模式只是局部經驗，哪些開始值得整個系統更優先相信

這會是後面真正做 shared-intelligence governance、memory / playbook / template 演化的安全地基。
