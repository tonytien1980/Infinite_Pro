# Common Risk Libraries Design

## Goal

precedent / reusable intelligence 現在已經有：

- candidate pool
- candidate governance
- review surface
- review priority
- Host-safe precedent reference
- same-matter duplicate governance
- reusable review lenses

下一步最合理的第二批真正可重用資產，不是 template auto-apply，而是：

> common risk libraries

也就是讓 Host 在每一輪正式分析前，先知道：

- 這類案子常漏哪些風險
- 哪些風險值得先被掃一遍
- 哪些風險還不能被誤讀成「已經發生」

---

## Why common risk libraries should come after review lenses

review lenses 回答的是：

- 這輪先看哪幾點

common risk libraries 回答的是：

- 這類案子常漏哪些風險

所以它們不是同一層：

- review lenses 偏 review ordering
- common risk libraries 偏 omission guardrail

先把順序排好，再補風險掃描提醒，UI 才不會一次跳太多層。

---

## Design principles

### 1. Host-owned warning layer, not a new risk dashboard

common risk libraries 主要是給 Host 用的。

不是要做：

- 讓顧問自己手動維護風險庫
- 新增 precedent / risk dashboard
- 新增另一個 risk management page family

第一波應是：

- Host 根據 precedent / pack / task heuristic 自動挑出 2 到 4 個 common risks
- 前端只低噪音回讀

### 2. Common risk means “often missed”, not “already true”

common risk library 不是：

- 這案已發生的風險
- 最終風險判定
- 正式 risk register

它是：

- 這類案子常漏看的風險
- 這輪應先掃一遍的風險提醒

### 3. Reuse risk patterns, not prior conclusions

common risk 的來源可以包括：

- precedent-derived risk patterns
- pack common risks
- task heuristics

但輸出仍要是新的顧問語言，不是把舊案風險段落直接貼出來。

### 4. Small set only

第一波最多只顯示：

- 2 到 4 個 common risk items

避免：

- 首屏資訊牆
- 把 second-layer reading 做成風險總表

### 5. Low-noise reading

這層 UI 應先放在：

- `task detail` second-layer disclosure
- `deliverable workspace` second-layer disclosure

不應搶首屏 hero，也不應蓋過既有風險卡片。

---

## Recommended source model

### A. Pack common risks

這是第一波最主要的 source。

既有 pack 已有：

- `common_risks`

這可直接成為 common risk library 的基礎。

### B. Precedent-derived risk patterns

如果 precedent candidate 已升格成可參考模式，且其 pattern snapshot 已保留：

- top risks
- risk keywords
- risk watchouts

就可轉成 reusable risk seeds。

### C. Task heuristic fallback

若 precedent 與 pack 都很弱，仍可依：

- `task_type`
- `flagship lane`
- `deliverable class`

給最小可信 common risks。

---

## Runtime contract

需要新增：

### `CommonRiskItem`

至少包括：

- `risk_id`
- `title`
- `summary`
- `why_watch`
- `source_kind`
  - `precedent_risk_pattern`
  - `pack_common_risk`
  - `task_heuristic`
- `source_label`
- `priority`

### `CommonRiskGuidance`

至少包括：

- `status`
  - `available`
  - `fallback`
  - `none`
- `label`
- `summary`
- `boundary_note`
- `risks`

---

## Host integration

`AgentInputPayload` 應新增：

- `common_risk_guidance`

model-router request 可新增：

- `common_risk_context`

內容應是簡短 lines，例如：

- `常漏風險 1：責任不對稱與 indemnity / liability 暴露`
- `為什麼要先掃：這類案件最容易在條款不完整時低估責任暴露`
- `來源：pack common risk`

這層應和 precedent context、review lens context 並存，但角色不同：

- precedent context：為什麼這個模式和現在相似
- review lens context：這輪先看哪幾點
- common risk context：這類案子常漏哪些風險

---

## UI reading

前端回讀時，應讓顧問感受到：

- 系統先提醒我這類案件常漏哪些風險
- 但不是把這些風險直接判成已發生

建議顯示：

- section title：`這類案件常漏哪些風險`
- 每個 risk：
  - title
  - why_watch
  - source_label

例如：

- `責任不對稱與 indemnity / liability 暴露`
- `這類合約審閱最容易在附件未齊、條文未完整時低估責任暴露`
- `來源：pack common risk`

boundary copy 應明講：

- 這些是 common risk watchouts
- 不代表這案已經發生
- 若要成立正式風險，仍須由這案的證據與分析支撐
