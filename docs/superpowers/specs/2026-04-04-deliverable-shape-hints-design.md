# Deliverable Shape Hints Design

## Goal

precedent / reusable intelligence 現在已經有：

- candidate pool
- candidate governance
- review surface
- review priority
- Host-safe precedent reference
- same-matter duplicate governance
- reusable review lenses
- common risk libraries

下一步最合理的第三批真正可重用資產，不是 template auto-apply，而是：

> deliverable shape hints

也就是讓 Host 在每一輪正式收斂前，先知道：

- 這份交付物通常怎麼收比較穩
- 先有哪些段落
- 應先像 review memo、decision memo，還是 action-oriented deliverable

---

## Why deliverable shape hints should come after review lenses and common risks

review lenses 回答的是：

- 這輪先看哪幾點

common risk libraries 回答的是：

- 這類案子常漏哪些風險

deliverable shape hints 回答的是：

- 這份交付物最後怎麼收比較穩

所以這三層是自然往下走的：

- 先排審閱順序
- 再補風險掃描
- 最後再決定交付骨架

---

## Design principles

### 1. Host-owned shaping guidance, not template auto-fill

deliverable shape hints 主要是給 Host 用的。

不是要做：

- 自動套模板
- 讓顧問手動挑一堆 template
- 新增 deliverable template dashboard

第一波應是：

- Host 根據 precedent / pack / task heuristic 自動挑出 1 個 primary shape
- 再補 3 到 5 個 section hints
- 前端只低噪音回讀

### 2. Shape means “how to structure”, not “what the answer is”

deliverable shape hint 不是：

- 最終結論
- 自動生成全文
- 直接複製舊案交付物

它是：

- 這輪較適合什麼交付姿態
- 先有哪些段落
- 哪一段要先講

### 3. Reuse patterns, not prior text

shape 的來源可以包括：

- precedent deliverable pattern
- pack deliverable presets
- task / deliverable heuristics

但輸出仍要是新的顧問語言，不是把舊案段落直接貼出來。

### 4. One primary shape only

第一波最多只顯示：

- 1 個 primary shape
- 3 到 5 個 section hints
- 1 到 3 個 supporting hints

避免：

- 首屏資訊牆
- 變成模板管理器

### 5. Low-noise reading

這層 UI 應先放在：

- `task detail` second-layer disclosure
- `deliverable workspace` second-layer disclosure

不應搶首屏 hero，也不應蓋過正式交付摘要。

---

## Recommended source model

### A. Precedent deliverable pattern

如果 precedent candidate 已升格成可參考模式，且其 pattern snapshot 已保留：

- current_output_label
- deliverable_type
- shape_sections

就可轉成 reusable deliverable shape seed。

### B. Pack deliverable presets

既有 pack 已有：

- `deliverable_presets`

這可直接成為 shape hint 的主要 seed。

### C. Task / lane heuristic fallback

若 precedent 與 pack 都很弱，仍可依：

- `task_type`
- `flagship lane`
- `deliverable_class_hint`

給最小可信 shape。

---

## Runtime contract

需要新增：

### `DeliverableShapeHint`

至少包括：

- `hint_id`
- `title`
- `summary`
- `why_fit`
- `source_kind`
  - `precedent_deliverable_pattern`
  - `pack_deliverable_preset`
  - `task_heuristic`
- `source_label`
- `priority`

### `DeliverableShapeGuidance`

至少包括：

- `status`
  - `available`
  - `fallback`
  - `none`
- `label`
- `summary`
- `primary_shape_label`
- `section_hints`
- `boundary_note`
- `hints`

---

## Host integration

`AgentInputPayload` 應新增：

- `deliverable_shape_guidance`

model-router request 可新增：

- `deliverable_shape_context`

內容應是簡短 lines，例如：

- `建議交付形態：評估 / 審閱備忘`
- `建議先用段落：一句話結論、主要發現、主要風險、建議處置、待補資料`
- `為什麼這樣收：這輪仍屬 review memo 姿態，不適合假裝已完成 final decision memo`

這層應和 precedent context、review lens context、common risk context 並存，但角色不同：

- precedent context：為什麼這個模式和現在相似
- review lens context：這輪先看哪幾點
- common risk context：這類案子常漏哪些風險
- deliverable shape context：這份交付物怎麼收比較穩

---

## UI reading

前端回讀時，應讓顧問感受到：

- 系統已先幫我排出比較穩的交付骨架
- 但不是已經替我寫完，也不是把舊案直接套上來

建議顯示：

- section title：`這份交付物通常怎麼收比較穩`
- primary shape
- section hints
- supporting hints

例如：

- `建議交付形態：評估 / 審閱備忘`
- `建議先用段落：一句話結論、主要發現、主要風險、建議處置、待補資料`
- `來源：precedent deliverable pattern`

boundary copy 應明講：

- 這是在提示交付骨架
- 不是自動套模板
- 若和這案正式證據衝突，仍以這案當前判斷與證據為準
