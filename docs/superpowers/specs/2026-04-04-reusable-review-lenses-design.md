# Reusable Review Lenses Design

## Goal

precedent / reusable intelligence 現在已經有：

- candidate pool
- candidate governance
- review surface
- review priority
- Host-safe precedent reference
- same-matter duplicate governance

下一步最合理的第一批真正可重用資產，不是 template auto-apply，而是：

> reusable review lenses

也就是讓 Host 在每一輪正式判斷前，先知道：

- 這類案子通常要先看哪幾點
- 哪些審閱角度最值得優先展開

---

## Why review lenses should come first

在 precedent 真正變成 playbook / template 之前，最安全、最有價值的重用方式是：

- 改善判斷順序
- 改善審閱焦點
- 減少漏看

這比直接重用內容更穩，也更符合你要的產品原則：

- 底層很強
- 表面很簡單
- 顧問不用面對複雜知識庫

---

## Design principles

### 1. Host-owned guidance, not user-authored checklist UI

review lenses 主要是給 Host 用的。

不是要先做一個讓顧問自己手動維護很多 lens 的系統。

第一波應是：

- Host 根據 precedent reference 與 pack context 自動挑出 2 到 4 個最值得先看的 lens
- 前端只低噪音回讀

### 2. Lens means “what to look at first”

review lens 不是：

- 結論
- 風險清單
- 完整模板

它是：

- 這輪先看哪個面向
- 為什麼這個面向要先看

### 3. Reuse patterns, not prior text

lens 的來源可以包括：

- precedent reference
- pack decision patterns
- pack common risks
- lane / deliverable-type heuristics

但輸出仍要是新的顧問語言，不是把舊案句子直接貼出來。

### 4. Small set only

第一波最多只顯示：

- 2 到 4 個 review lenses

避免：

- 首屏資訊牆
- 把工作面做成 knowledge dashboard

### 5. Low-noise reading

這層 UI 應先放在：

- `task detail` second-layer disclosure
- `deliverable workspace` second-layer disclosure

不應搶首屏 hero。

---

## Recommended source model

### A. Precedent reference

如果 Host 已找到 matched precedents，可先把它們轉成 lens source。

例如：

- 同樣的 `contract_review`
- 同樣的 `material_review_start`
- 同樣的 `decision_action_deliverable`

### B. Pack decision patterns

既有 pack 已有：

- `decision_patterns`

這可直接成為 review lens 的重要 seed。

### C. Pack common risks

既有 pack 也有：

- `common_risks`

第一波可以把高頻 common risk 轉成：

- 先檢查哪類風險是否已出現

### D. Task / deliverable heuristic fallback

若 precedent 與 pack 都很弱，仍可依：

- `task_type`
- `deliverable_type`
- `flagship lane`

給最小可信 lens。

---

## Runtime contract

需要新增：

### `ReviewLensItem`

至少包括：

- `lens_id`
- `title`
- `summary`
- `why_now`
- `source_kind`
  - `precedent_reference`
  - `pack_decision_pattern`
  - `pack_common_risk`
  - `task_heuristic`
- `source_label`
- `priority`

### `ReviewLensGuidance`

至少包括：

- `status`
  - `available`
  - `fallback`
  - `none`
- `label`
- `summary`
- `boundary_note`
- `lenses`

---

## Host integration

`AgentInputPayload` 應新增：

- `review_lens_guidance`

model-router request 可新增：

- `review_lens_context`

內容應是簡短 lines，例如：

- `先看終止條款與義務邊界`
- `先檢查責任限制與賠償風險`
- `先確認附件、SLA 與資料條款是否缺漏`

這層應和 precedent context 並存，但角色不同：

- precedent context：為什麼這個模式和現在相似
- review lens context：這輪先看哪幾點

---

## UI reading

前端回讀時，應讓顧問感受到：

- 系統這輪先幫我排好要先看哪幾個角度
- 但不是替我下結論

建議顯示：

- section title：`這輪先看哪幾點`
- 每個 lens：
  - title
  - why_now
  - source_label

例如：

- `先看終止條款與義務邊界`
- `這輪屬於合約審閱，且 precedent 與 pack 都顯示這是最容易先出問題的區塊`
- `來源：precedent + legal risk pack`

---

## Non-goals

這一輪不做：

- common risk library full product
- deliverable template system
- playbook library
- user-authored lens editor
- auto-apply

---

## Success criteria

- Host 能穩定產出小而可用的 review lenses
- review lenses 會進正式模型上下文
- 顧問可低噪音回讀這輪先看哪幾點
- review lenses 與 precedent reference 分工清楚
- 程式、docs、QA 對齊
