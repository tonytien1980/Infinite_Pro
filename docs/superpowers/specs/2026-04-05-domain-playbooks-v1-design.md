# Domain Playbooks V1 Design

## Purpose

這一輪不做厚重的 playbook library，也不做新 management page。

先做一個很克制的第一版：

- `domain_playbook_guidance`

也就是讓 Host 開始正式回答：

- 這類案子通常怎麼走
- 這輪目前比較像卡在哪一步
- 下一步通常該接什麼

## Why This Next

目前 precedent / reusable intelligence 已經開始知道：

- 哪些內容值得保留
- 哪些模式可以安全參考
- 哪些 reusable assets 能幫 review / risk / deliverable shaping

但系統還不夠知道：

- 這類案子整體通常怎麼推進
- 這輪現在更像在 playbook 的哪一段
- 下一步要先補研究、補材料、還是先收斂交付

所以這一輪不是在做更多靜態知識，而是在補：

> **顧問在這類案件裡通常怎麼走的低噪音工作主線**

## Scope

第一版只做：

1. `matter workspace`
2. `task detail`
3. Host-safe prompt context

不做：

- playbook library page
- template auto-apply
- 顧問手動挑選 playbook 的 selector
- cross-client canonical knowledge base

## Role Separation

這層必須和既有 reusable assets 分清楚：

- `review lenses`
  - 回答：先看哪幾點
- `common risk libraries`
  - 回答：常漏哪些風險
- `deliverable shape hints`
  - 回答：交付怎麼收比較穩
- `organization memory`
  - 回答：這個客戶 / 組織有哪些穩定背景
- `domain playbooks`
  - 回答：這類案子通常怎麼走、現在在哪一步、下一步通常接什麼

## Data Source

第一版只吃正式已有的低風險資料：

- `task_type`
- `flagship_lane`
- `research_guidance`
- `continuation_surface`
- `pack_resolution`
  - `decision_patterns`
  - `deliverable_presets`
- `precedent_reference_guidance`
- `organization_memory_guidance`

也就是：

> 這不是新知識庫，而是把既有 Host-owned signals 收斂成一條更完整的顧問工作主線

## Read Model

新增：

- `domain_playbook_guidance`

第一版 contract 至少包括：

- `status`
  - `available`
  - `fallback`
  - `none`
- `label`
- `summary`
- `playbook_label`
- `current_stage_label`
- `next_stage_label`
- `boundary_note`
- `stages`

每筆 `stage` 至少包括：

- `stage_id`
- `title`
- `summary`
- `why_now`
- `source_kind`
- `source_label`
- `priority`

### Meaning

- `playbook_label`
  - 例如：`合約審閱工作主線`
- `current_stage_label`
  - 例如：`先補齊審閱範圍與條款邊界`
- `next_stage_label`
  - 例如：`再收斂高風險點與建議處置`
- `stages`
  - 這類案件較穩的 3 到 4 段工作順序

## Host Boundary

Host 可把這層整理成：

- `domain_playbook_context`

正式規則：

- 只能帶少量、順序化、prompt-safe 的 stage guidance
- 不能把整份 playbook 偽裝成強制 checklist
- 不能和 precedent context / review lens context 混成同一層

角色區分：

- precedent context：以前哪些模式值得參考
- review lens context：這輪先看哪幾點
- domain playbook context：這類案子通常怎麼走，這輪現在在哪一步

## UI Rules

這一輪的 UI 只做 low-noise second-layer reading。

### Matter workspace

應該回答：

- 這類案子通常怎麼走
- 這案目前比較像在 playbook 的哪一步
- 下一步通常接什麼

### Task detail

只做更輕的第二層回讀，不做新的流程圖或 checklist shell。

## Expected Outcome

做完後，系統會開始更像：

- 不只知道「先看哪幾點」
- 也知道「這類案子通常怎麼推進」

這會是後面真正做 `domain playbooks` 與更成熟 feedback governance 前最安全的一塊地基。
