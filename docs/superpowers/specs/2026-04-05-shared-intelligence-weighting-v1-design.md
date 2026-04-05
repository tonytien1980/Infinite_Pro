# Shared Intelligence Weighting V1 Design

## Purpose

這一輪不新增新的 page family，也不把 precedent / reusable intelligence 變成黑箱權重系統。

先做一個很小但真正開始影響下一案品質的版本：

- `shared-intelligence weighting v1`

也就是讓 Host 在整理 reusable assets 時，開始優先參考：

- 已開始形成共享模式的 precedent
- 應提高參考的 precedent

而不是只停在 precedent review / reference 的 explainability。

## Why This Next

上一輪 `shared_intelligence_signal` 已成立，但目前主要只用在：

- precedent review lane
- Host-safe precedent reference
- precedent context explainability

這還比較像：

> 系統知道這筆模式目前累積到什麼程度

還不是：

> 系統已經開始因為這些 shared-intelligence 訊號，在下一案更優先採信較成熟的模式

這一輪是在補：

> 讓 shared-intelligence signal 真正開始影響 Host 的 reusable-asset assembly

## Scope

第一版只做：

1. `review_lens_guidance`
2. `common_risk_guidance`
3. `domain_playbook_guidance`
4. `deliverable_template_guidance`

不做：

- 新 UI 區塊
- consultant ranking
- 顯性資歷分級
- 手動調權後台
- 黑箱全域 routing 自動化

## Weighting Rule

這一輪只允許很輕的 precedent weighting：

- 同類 asset precedence 先看 `shared_intelligence_signal.weight_action`
  - `upweight`
  - `hold`
  - `downweight`
- 再看 `shared_intelligence_signal.maturity`
  - `shared`
  - `emerging`
  - `personal`
- 再看既有：
  - `optimization_signal.strength`
  - `review_priority`

實務上：

- 若同類 asset 已有非 `downweight` 的 precedent，先不使用 `downweight` precedent
- 只有在沒有更好 precedent 時，才回退到 `downweight` precedent 或 heuristic

## Role Separation

這層必須和既有 contract 分清楚：

- `optimization_signal`
  - 回答：這筆 precedent 最能幫哪種 reusable asset
- `shared_intelligence_signal`
  - 回答：這筆 precedent 目前累積到什麼程度
- `weighting v1`
  - 回答：Host 在挑 reusable asset precedent source 時，該先信哪一筆

也就是：

- `optimization_signal` = asset affinity
- `shared_intelligence_signal` = shared maturity
- `weighting` = source ordering

## Affected Builders

### Review lenses

若有多筆 review-lens precedent candidates：

- 先選 shared / emerging / upweight 的 precedent
- 沒有更好的 precedent 才退回一般 precedent 或 heuristic

### Common risks

若有多筆 common-risk precedent candidates：

- 先選非 downweight precedent 的 risk patterns
- 沒有更好的 precedent 才退回 pack common risks / heuristics

### Domain playbooks

若有多筆 domain-playbook precedent candidates：

- 先讓 shared-intelligence 較成熟的 precedent 校正工作主線
- organization memory / research / continuity 仍維持既有角色，不被 precedent 完全取代

### Deliverable templates

若有多筆 deliverable-template precedent candidates：

- 先讓 shared-intelligence 較成熟的 precedent 決定模板主線
- shape / playbook / pack preset 仍是重要來源，但 precedence 改為較成熟 precedent 優先

## UX Rules

這一輪不新增新的可見 page-level surface。

如果有 UI 變化，也只允許：

- 沿用既有 source label / summary
- 最多在 source copy 上低噪音暗示「共享模式優先」

不允許：

- 新的 weighting dashboard
- 顧問等級顯示
- “高權重顧問” / “低權重顧問” 這類可見標籤

## Expected Outcome

做完後，Infinite Pro 會開始從：

- 知道哪些模式看起來值得保留

往前推成：

- 在下一案整理 review lens / risk / playbook / template 時，更優先參考那些已開始被多位顧問反覆保留的模式

這會是真正讓「很多顧問各自使用後，系統大腦慢慢變強」的第一個實際 weighting slice。
