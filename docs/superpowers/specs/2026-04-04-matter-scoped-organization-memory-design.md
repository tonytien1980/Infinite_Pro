# Matter-Scoped Organization Memory Design

## Purpose

這一輪先不做跨客戶的大知識庫，而是做一個很克制的第一版：

- `matter-scoped organization memory`

也就是在同一案件世界中，讓系統開始正式保留並回讀：

- 這個客戶 / 組織目前有哪些穩定背景
- 這個案件世界反覆出現的限制與工作脈絡是什麼
- Host 這輪該帶哪些穩定背景進模型上下文

## Why This First

目前 precedent / reusable intelligence 已經開始知道：

- 哪些內容值得保留
- 為什麼值得保留
- 哪種 precedent 比較適合餵給哪種 reusable asset

但系統還不夠知道：

- 這個客戶 / 組織本身有哪些穩定背景不該每次重問
- 這個案件世界目前有哪些已經站穩的工作脈絡

所以這一輪不是在做更多 precedent，而是在補：

> **這個案件世界自己的穩定記憶**

## Scope

第一版只做：

1. `matter workspace`
2. `task detail`
3. Host-safe prompt context

不做：

- 跨 matter / 跨 client 自動合併
- 獨立 organization page
- 厚重 profile editor
- 多人協作型 CRM 殼

## Data Source

第一版只吃同一 `matter workspace` 內已存在的正式資料：

- `client_name`
- `client_stage`
- `client_type`
- `domain_lenses`
- `engagement_continuity_mode`
- `writeback_depth`
- case world 的 `next_best_actions`
- same-matter related tasks 的 constraints / selected packs / continuity signals

也就是：

> 這不是外掛知識庫，而是對同一案件世界已知正式資料的 Host-owned 收斂

## Read Model

新增：

- `organization_memory_guidance`

第一版 contract 至少包括：

- `status`
  - `available`
  - `none`
- `label`
- `summary`
- `organization_label`
- `stable_context_items`
- `known_constraints`
- `continuity_anchor`
- `boundary_note`

### Meaning

- `organization_label`
  - 像是「某客戶｜制度化階段｜中小企業」
- `stable_context_items`
  - 這個案件世界目前已站穩的背景
- `known_constraints`
  - 這個案件世界反覆出現、值得持續記住的限制
- `continuity_anchor`
  - 這個案件世界目前要延續的主線

## Host Boundary

Host 可把這層整理成：

- `organization_memory_context`

正式規則：

- 只能帶少量、穩定、已知的 context
- 不能把 raw matter 全部摘要塞進 prompt
- 不能和 precedent context 混成同一層

角色區分：

- precedent context：以前做過哪些可重用模式
- organization memory context：這個客戶 / 組織目前有哪些穩定背景

## UI Rules

這一輪的 UI 只做低噪音 second-layer reading。

### Matter workspace

是最適合放這層的第一個地方。  
因為這本來就是案件世界主控面。

只應回答：

- 這個客戶 / 組織目前已知的穩定背景
- 這案目前要延續哪條主線

### Task detail

只作為低噪音回讀，不重複整張 profile 卡。

## Expected Outcome

做完後，系統會開始更像：

- 不只記得「什麼模式可重用」
- 也記得「這個客戶 / 組織目前已知的穩定背景」

這會是後面真正做 `client profile / organization memory` 前最安全的一塊地基。

