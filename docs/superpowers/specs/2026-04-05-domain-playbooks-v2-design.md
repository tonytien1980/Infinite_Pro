# Domain Playbooks V2 Design

## Purpose

這一輪不是做 playbook library，也不是做 checklist shell。

而是把目前的 `domain_playbook_guidance` 往前推成更像 shared intelligence：

- 不只回答這類案子通常怎麼走
- 也開始回答這輪為何適用這條主線
- 以及這條主線主要由哪些來源組合收斂出來

## Why This Slice

現在前面已經有：

- precedent reference
- review lenses
- common risk libraries
- deliverable shape / template
- cross-matter organization memory

如果 domain playbook 仍只停在 heuristic stage list，它就還沒有真正變成：

- 能吸收 shared intelligence 的工作主線

## Scope

第一版只做：

1. domain playbook 吸收 cross-matter organization memory
2. 新增 `fit_summary`
3. 新增 `source_mix_summary`
4. low-noise matter / task readback

不做：

- playbook library
- 手動編輯器
- team checklist board
- auto-apply workflow shell

## Contract Changes

在 `domain_playbook_guidance` 上新增：

- `fit_summary`
- `source_mix_summary`

並允許新的 stage source：

- `organization_memory`

## Role Separation

- `organization memory`
  - 回答：這個客戶有哪些穩定背景
- `domain playbook`
  - 回答：這輪應該怎麼走

所以 v2 的原則是：

- 可以吸收 organization memory
- 但不能把 organization memory 直接等於 playbook

## Host Usage

Host 可以從：

- research guidance
- precedent reference
- pack stage heuristic
- continuity signal
- task heuristic
- cross-matter organization memory

一起收斂出：

- 這輪為何適用這條主線
- 主要依據哪些來源
- 最值得先看的 3 到 4 個 stage

## UI Rules

matter / task 只低噪音補：

- `工作主線`
- `這輪為何適用`
- `收斂依據`
- `目前這輪`
- `下一步通常接`
- 少量 stage cards

不新增：

- playbook page
- SOP 後台
- checklist dashboard

## Expected Outcome

做完後，domain playbook 會更像：

- 一條由 shared intelligence 收斂出的工作主線

而不是：

- 只有 task heuristic 的靜態 stage list
