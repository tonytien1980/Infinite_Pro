# Deliverable Templates V1 Design

## Purpose

這一輪不做模板管理後台，也不做 auto-apply。

先做一個很克制的第一版：

- `deliverable_template_guidance`

也就是讓 Host 開始正式回答：

- 這份交付物比較適合沿用哪種模板主線
- 哪些區塊應該視為 core sections
- 哪些區塊屬於 optional sections

## Why This Next

目前 precedent / reusable intelligence 已經開始知道：

- 哪些 precedent 可安全參考
- 哪些 review lenses 值得先看
- 哪些 common risks 容易漏看
- 哪種 deliverable shape 較穩
- 這類案子通常怎麼走

但系統還不夠知道：

- 這份交付物更像哪一型正式模板
- 哪些段落是這類交付的核心 block
- 哪些段落只是視情況才補

所以這一輪不是做更多頁面，而是在補：

> **這份交付物應該先沿用哪一種模板主線**

## Scope

第一版只做：

1. `task detail`
2. `deliverable workspace`
3. Host-safe prompt context

不做：

- template library page
- template picker
- auto-apply
- 直接把舊案內容複製進新交付

## Role Separation

這層必須和既有 reusable assets 分清楚：

- `review lenses`
  - 回答：先看哪幾點
- `common risk libraries`
  - 回答：常漏哪些風險
- `deliverable shape hints`
  - 回答：交付骨架怎麼收比較穩
- `domain playbooks`
  - 回答：這類案子通常怎麼走
- `deliverable templates`
  - 回答：這份交付物比較適合沿用哪一型模板主線、哪些區塊應視為 core / optional

## Data Source

第一版只吃低風險正式來源：

- `precedent_reference_guidance`
- `deliverable_shape_guidance`
- `domain_playbook_guidance`
- `pack_resolution.deliverable_presets`
- `task_type`
- `deliverable_class_hint`

也就是：

> 這不是模板庫，而是把既有 Host-owned signals 收斂成一個更穩的模板主線提示

## Read Model

新增：

- `deliverable_template_guidance`

第一版 contract 至少包括：

- `status`
  - `available`
  - `fallback`
  - `none`
- `label`
- `summary`
- `template_label`
- `template_fit_summary`
- `core_sections`
- `optional_sections`
- `boundary_note`
- `blocks`

每筆 `block` 至少包括：

- `block_id`
- `title`
- `summary`
- `why_fit`
- `source_kind`
- `source_label`
- `priority`

### Meaning

- `template_label`
  - 例如：`合約審閱備忘模板`
- `template_fit_summary`
  - 例如：`這輪仍屬 review / assessment 主線，比直接拉成最終決策模板更穩`
- `core_sections`
  - 這一型模板通常一定要先有的區塊
- `optional_sections`
  - 視案件條件才補的區塊

## Host Boundary

Host 可把這層整理成：

- `deliverable_template_context`

正式規則：

- 只能帶少量、prompt-safe 的 template guidance
- 不能把 template guidance 擴寫成自動產文 shell
- 不能和 `deliverable_shape_context` 混成同一層

角色區分：

- deliverable shape context：交付骨架與段落順序
- deliverable template context：這份交付比較適合沿用哪一型模板主線

## UI Rules

這一輪的 UI 只做 low-noise second-layer reading。

### Task detail

應回答：

- 這份交付比較像哪一型模板
- 這一型模板的 core sections 是什麼
- 哪些 block 是 optional

### Deliverable workspace

只做更輕的第二層回讀，不做 template chooser。

## Expected Outcome

做完後，系統會開始更像：

- 不只知道交付順序怎麼排
- 也知道這份交付物更像哪一型模板

這會是後面真正做 `deliverable templates` 或更成熟 feedback governance 前最安全的一塊地基。
