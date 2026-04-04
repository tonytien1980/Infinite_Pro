# Cross-Matter Organization Memory V2 Design

## Purpose

這一輪要把目前只停在「同一案件世界內」的 organization memory，往前推成一個很保守的 v2：

- 同客戶 / 組織的其他案件
- 若名稱高度相近
- 且只補少量穩定背景摘要

## Why This Slice

目前 Infinite Pro 已經會記得：

- 這一案目前的穩定背景
- 這一案已知限制
- 這一案延續哪條主線

但還不會記得：

- 同一個客戶在其他案件裡，是否已經留下了可安全參考的穩定背景

如果要往小型顧問團隊 shared intelligence system 走，這一步很重要，因為它讓系統第一次開始知道：

- 這個客戶不是只存在單一案件裡

## Scope

第一版只做：

1. 同客戶跨案件的少量摘要
2. Host-owned `organization_memory_context`
3. matter / task 的低噪音回讀

不做：

- CRM shell
- client profile library
- 跨客戶自動合併
- 舊案全文回灌
- team dashboard

## Matching Rule

第一版只允許：

- client name 正規化後相同
- 或高度相近

而且：

- 不允許拿 `尚未明確標示客戶` 這種預設值做 cross-matter match

## Contract

在既有 `organization_memory_guidance` 上新增：

- `cross_matter_summary`
- `cross_matter_items`

每筆 item 至少包括：

- `matter_workspace_id`
- `matter_title`
- `summary`
- `relation_reason`

## Role Separation

- `organization memory`
  - 回答：這個客戶 / 組織有哪些穩定背景
- `precedent`
  - 回答：以前哪些模式值得參考
- `domain playbook`
  - 回答：這類案子通常怎麼走

所以 cross-matter organization memory 不是：

- precedent retrieval
- playbook library
- CRM record

## Host Usage

Host 只可把這層帶進：

- framing
- review
- deliverable shaping

並且只能用 prompt-safe lines，像：

- 這個客戶還有哪幾個相近案件
- 它們留下了什麼穩定背景
- 為什麼和現在相近

不能：

- 把舊案正文直接放進 prompt
- 讓前端自行拼 raw history shell

## UI Rules

### Matter workspace

可稍微完整地讀出：

- 跨案件摘要
- 1 到 3 張相關案件卡
- 每張卡只說：
  - 這是哪個案件
  - 它留下什麼穩定背景
  - 為什麼和現在相近

### Task detail

只做更輕的 second-layer disclosure：

- 少量卡片
- 不做 list shell

## Expected Outcome

做完後，Infinite Pro 會開始知道：

- 同一個客戶不只是一案一案孤立存在
- 如果過去已有相近案件留下穩定背景，這一輪可以少量、安全地拿來當 context 補強

這會是後面做：

- domain playbooks v2
- deliverable templates v2
- small-team shared intelligence

的更穩底座。
