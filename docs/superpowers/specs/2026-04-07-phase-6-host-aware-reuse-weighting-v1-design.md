# Phase 6 Host-Aware Reuse Weighting v1 Design

日期：2026-04-07
狀態：shipped

## Purpose

`reuse-boundary governance v1` 已能正式回答：

- 哪些 reusable assets 可擴大重用
- 哪些只能局部參考
- 哪些不應被擴大套用

但這些治理建議目前仍主要停留在 read model。

因此下一刀的正式問題是：

- 怎麼把這些治理建議真正接進 Host 的 source ordering / reusable-intelligence weighting
- 讓 precedent / playbook / template 的排序與前景程度，不只看 shared-intelligence weight_action，也開始吃到 reuse-boundary recommendation

因此這一刀的正式方向定為：

- `host-aware reuse weighting v1`

## Product Posture

這一刀的正式定位是：

- 把 phase-6 的治理建議真正接進 Host 選源邏輯
- 先讓 `can_expand / keep_contextual / restrict_narrow_use` 對 reusable asset ordering 產生影響
- 仍維持 low-noise explainability，不做 hidden auto-engine

這一刀不是：

- 重新發明一套 weighting system
- 把 Host judgment 變成硬編碼 policy
- 自動封鎖 precedent / template 的使用
- 新增大型治理頁面

## Core Decision

第一版正式決策如下：

1. Host weighting 第一波先只影響 reusable asset source ordering
2. reuse-boundary recommendation 應排在 shared-intelligence weight_action 之前
3. `can_expand` 應優先於 `keep_contextual`
4. `restrict_narrow_use` 若有其他可用來源，應退到背景或被排除
5. 第一波只先接在：
   - `select_weighted_precedent_reference_items`
   - `domain playbook`
   - `deliverable template`

## Recommended First Slice

第一波只做：

- backend `host-aware reuse weighting` helper
- update `select_weighted_precedent_reference_items`
- 讓 `domain playbook` / `deliverable template` 對 `restrict_narrow_use` 更保守
- `Generalist Governance` 補一條 low-noise `Host weighting` 摘要

## Non-Goals

第一波不做：

- automatic hard blocking
- consultant-visible tuning controls
- route-level policy editor
- full routing engine rewrite

## Shipped Outcome

這一刀目前已正式落地：

- Host 已開始把 `can_expand / keep_contextual / restrict_narrow_use` 接進 reusable asset ordering
- precedent-driven reusable ordering 現在不只看 shared-intelligence `weight_action`
- `domain playbook` / `deliverable template` 對 `restrict_narrow_use` precedent 會更保守，優先留背景校正
- `Generalist Governance` 已補上 low-noise `Host weighting` 摘要
