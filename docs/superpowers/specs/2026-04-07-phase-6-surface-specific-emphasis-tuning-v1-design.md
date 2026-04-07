# Phase 6 Surface-Specific Emphasis Tuning v1 Design

日期：2026-04-07
狀態：shipped

## Purpose

`cross-surface note consistency v1` 已把 condensed `Phase 6` note 的句型骨架做一致。

但目前這條 note 雖然一致，仍偏像一條「狀態描述」；它還沒有更明確回答：

- 這條 reusable signal 現在主要是拿來校正什麼

也就是：

- `organization memory` 應偏向校正客戶 / 組織背景
- `domain playbook` 應偏向校正工作主線
- `deliverable template` 應偏向校正交付骨架

因此這一刀的正式問題是：

- 怎麼在不破壞低噪音前提下
- 讓 condensed `Phase 6` note 再多一點 surface-specific action emphasis

因此這一刀定為：

- `phase-6 surface-specific emphasis tuning v1`

## Product Posture

這一刀的正式定位是：

- 保留既有 condensed note 骨架
- 在尾端補一個更明確、但仍短的「先拿來校正什麼」提示
- 不改 backend contract，不新增新頁面

這一刀不是：

- 長篇 instruction copy
- 新 governance panel
- reusable tutorial layer
- backend rewrite

## Core Decision

第一版正式決策如下：

1. condensed note 仍維持單行、低噪音
2. note 仍維持：
   - posture
   - lifecycle / boundary 核心訊號
3. 第一版再補一段短 action emphasis：
   - `organization memory` -> `先校正客戶 / 組織背景`
   - `domain playbook` -> `先校正工作主線`
   - `deliverable template` -> `先校正交付骨架`
4. 這段 action emphasis 必須足夠短，不可變成 instruction wall

## Recommended First Slice

第一波只做：

- frontend shared helper 增加 emphasis segment
- 3 個 reusable guidance helper 傳入 emphasis label
- tests / docs / QA

## Non-Goals

第一波不做：

- backend schema change
- new propagation
- long-form instructional copy
- homepage redesign

## Shipped Outcome

這一刀目前已正式落地：

- condensed `Phase 6` note 現在會在尾段補一個短的 surface-specific emphasis
- `organization memory` / `domain playbook` / `deliverable template` 現在會分別提示：
  - `先校正客戶 / 組織背景`
  - `先校正工作主線`
  - `先校正交付骨架`
- backend contract 不變，也沒有新增新頁面
