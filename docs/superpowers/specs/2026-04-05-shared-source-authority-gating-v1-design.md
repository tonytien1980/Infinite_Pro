# Shared Source Authority Gating V1 Design

## Purpose

這一輪不做新的 lifecycle engine，也不做新頁面。

先補一個更誠實的 status gate：

- `shared source authority gating v1`

也就是如果這輪只剩 background-only 的 shared source，system 不應再把 guidance 誤寫成 `available`。

## Scope

第一版只做：

1. `domain_playbook_guidance` 的 authority gate
2. `deliverable_template_guidance` 的 authority gate

不做：

- 新資料表
- background job
- UI 新控制項

## Rule

第一波正式規則：

- 若 playbook 只有 background-only precedent / stale cross-matter memory，則維持 `fallback`
- 若 template 只有 background-only precedent，則維持 `fallback`
- `available` 只保留給真正具有較強 authority 的來源，例如：
  - stable precedent
  - pack stage heuristic / deliverable preset
  - deliverable shape
  - active research guidance
  - non-background continuity signal

## Expected Outcome

做完後，Infinite Pro 會更誠實地回答：

- 這輪到底是真的有夠強的 shared guidance
- 還是只是有一些背景校正來源可參考，但仍不該被寫成已站穩主線
