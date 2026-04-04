# Deliverable Templates V2 Design

## Purpose

這一輪不是做 template library，也不是做 template picker。

而是把目前的 `deliverable_template_guidance` 往前推成更像 shared intelligence：

- 不只回答這份交付像哪一型模板
- 也開始回答這輪為何適用這個模板主線
- 以及這個模板主線主要由哪些來源組合收斂出來

## Why This Slice

現在前面已經有：

- deliverable shape hints
- domain playbooks v2
- precedent deliverable patterns
- pack deliverable presets

如果 template guidance 仍只有：

- template label
- core / optional sections

那它還不夠像一個真的會越用越強的顧問 intelligence layer。

## Scope

第一版只做：

1. `fit_summary`
2. `source_mix_summary`
3. formalize `deliverable_shape` as a template source
4. low-noise task / deliverable readback

不做：

- template picker
- template library
- auto-apply
- template editor

## Contract Changes

在 `deliverable_template_guidance` 上新增：

- `fit_summary`
- `source_mix_summary`

並允許新的 block source：

- `deliverable_shape`

## Role Separation

- `deliverable shape`
  - 回答：這份交付通常怎麼收比較穩
- `deliverable template`
  - 回答：這份交付適合沿用哪種模板主線

所以 v2 的原則是：

- 可以吸收 shape
- 但不能把 shape 直接等於 template

## Host Usage

Host 可以從：

- precedent deliverable template
- pack deliverable preset
- deliverable shape
- domain playbook
- task heuristic

一起收斂出：

- 這輪為何適用這個模板主線
- 主要依據哪些來源
- 最值得先看的 template blocks

## UI Rules

task / deliverable 只低噪音補：

- `模板主線`
- `這輪適合`
- `這輪為何適用`
- `收斂依據`
- `核心區塊`
- `可選區塊`
- 少量 template blocks

不新增：

- template page
- 模板後台
- 選模板流程

## Expected Outcome

做完後，deliverable template 會更像：

- 一條由 precedent / shape / playbook / pack 組合收斂出的模板主線

而不是：

- 只有 template label 的靜態提示
