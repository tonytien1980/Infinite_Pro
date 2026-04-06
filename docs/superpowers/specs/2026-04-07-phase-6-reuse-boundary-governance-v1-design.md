# Phase 6 Reuse-Boundary Governance v1 Design

日期：2026-04-07
狀態：proposed

## Purpose

`capability coverage and anti-drift audit v1` 已正式開始落地後，Phase 6 下一個最自然的問題不再是：

- shared intelligence 有沒有開始偏科
- 哪些能力區塊偏穩、偏薄、過重

而是：

- 哪些 reusable intelligence 可被較廣泛地重用
- 哪些只能維持局部參考
- 哪些其實應被明確限制在窄情境內，不應再被擴張成全域 best practice

因此這一刀的正式方向定為：

- `reuse-boundary governance v1`

## Product Posture

這一刀的正式定位是：

- 把現有 phase-6 audit 裡已經可見的 `generalizable / contextual / narrow_use`，收成更正式的治理讀法
- 讓 owner / consultant 都能更誠實地看見「哪些 asset 可以擴大重用，哪些不行」
- 仍維持 low-noise governance surface，不長出新 dashboard

這一刀不是：

- 自動糾偏 engine
- consultant ranking
- template auto-blocker
- enterprise approval workflow

## Core Product Problem

如果 system 只會回答：

- 哪些東西目前看起來偏科
- 哪些東西目前偏高頻

但不會正式回答：

- 到底哪些可擴大重用
- 哪些只能局部參考
- 哪些不該擴大套用

那麼 shared intelligence 雖然被 audit 到，仍然沒有真正治理邊界。

因此這一刀的核心問題是：

- 把 reuse boundary 從 audit signal 提升成正式 governance recommendation

## Core Decisions

第一版正式決策如下：

1. 不新增新頁面，沿用既有 `Generalist Governance`
2. governance recommendation 第一波只做：
   - `can_expand`
   - `keep_contextual`
   - `restrict_narrow_use`
3. 這些 recommendation 只作 low-noise guidance，不做硬性 enforcement
4. Host 仍保有最終 contextual judgment
5. 第一波只做 reusable-intelligence 治理摘要，不做人工批准流程

## Contract Shape

第一版正式應新增：

- `phase_6_reuse_boundary_governance`

至少回答：

- `phase_id`
- `phase_label`
- `governance_posture`
- `governance_posture_label`
- `summary`
- `generalizable_count`
- `contextual_count`
- `narrow_use_count`
- `governance_items`
- `recommended_next_step`

每個 `governance_item` 至少回答：

- `asset_code`
- `asset_label`
- `boundary_status`
- `boundary_status_label`
- `reuse_recommendation`
- `reuse_recommendation_label`
- `summary`
- `guardrail_note`

## Recommended First Slice

第一波只做：

- backend reuse-boundary governance read model
- homepage `Generalist Governance` 內的 low-noise governance summary

不做：

- automatic gating
- phase-6 dashboard
- approval queue

## Non-Goals

這一刀明確不做：

- 自動阻止 precedent / template 被使用
- 針對顧問做績效治理
- 讓 owner 人工逐筆批准 reusable assets
- 長出 `/phase-6` 或 `/governance`
