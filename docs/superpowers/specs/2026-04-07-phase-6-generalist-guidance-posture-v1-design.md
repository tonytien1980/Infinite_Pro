# Phase 6 Generalist Guidance Posture v1 Design

日期：2026-04-07
狀態：shipped

## Purpose

phase 6 目前已經先做出：

- capability coverage and anti-drift audit
- reuse-boundary governance
- host-aware reuse weighting

但這些治理訊號目前仍主要停留在：

- audit read model
- governance recommendation
- Host ordering explainability

因此下一刀的正式問題是：

- 怎麼把這些治理訊號更正式地翻成 consultant-facing 的工作 guidance posture
- 讓 system 回答「目前這類 reusable intelligence 應該維持多低噪音、多明示邊界、多保守引導」

因此這一刀定為：

- `phase-6 generalist guidance posture v1`

## Product Posture

這一刀的正式定位是：

- 把 phase-6 governance 訊號收成一條 low-noise guidance posture
- 幫 consultant-facing surface 回答目前該維持：
  - `維持低噪音`
  - `適度明示`
  - `先保守引導`
- 保持首頁總覽可讀，但不長出新的治理頁或調參面

這一刀不是：

- consultant ranking
- training platform
- per-user maturity model
- policy editor
- dashboard wall

## Core Decision

第一版正式決策如下：

1. 第一波只做一個新的 read model，不直接改寫 task / matter / deliverable 全部 surface
2. guidance posture 必須由 phase-6 audit + reuse-boundary governance 共同導出
3. 目前 posture 至少回答：
   - system 現在該維持多低噪音
   - 是否應明示 reusable boundary
   - 是否應保守地把 shared intelligence 當作「校正主線」而不是「近乎定論」
4. UI 仍掛在既有 `Generalist Governance`，不新增 `/phase-6` / `/governance`

## Recommended First Slice

第一波只做：

- backend `phase-6 generalist guidance posture` read model
- `GET /workbench/phase-6-generalist-guidance-posture`
- homepage `Generalist Governance` 補一塊 low-noise `guidance posture`
- helper copy / labels / QA / docs 同步

## Non-Goals

第一波不做：

- user-level maturity preference
- automatic task-surface rewriting
- new dashboard or tuning console
- hard enforcement on work surfaces

## Shipped Outcome

這一刀目前已正式落地：

- backend 已有 `phase-6-generalist-guidance-posture` read model
- system 已能正式回答目前工作 guidance 應維持多低噪音、哪些 boundary 應先明示、什麼時候要先保守引導
- `Generalist Governance` 已補上 low-noise `guidance posture` 摘要
