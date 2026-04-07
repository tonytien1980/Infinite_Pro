# Phase 6 Note Brevity Guardrails v1 Design

日期：2026-04-07
狀態：shipped

## Purpose

`surface-specific emphasis tuning v1` 已讓 condensed `Phase 6` note 在尾段補上更可執行的 surface-specific emphasis。

但 note 現在的句型雖然清楚，仍可能因為：

- posture label
- lifecycle posture
- emphasis label

一起疊上去而變長。

因此這一刀的正式問題是：

- 怎麼把 condensed `Phase 6` note 的長度正式鎖住
- 讓它持續保持單行、低噪音、像工作提示而不是完整句

因此這一刀定為：

- `phase-6 note brevity guardrails v1`

## Product Posture

這一刀的正式定位是：

- 只調整 condensed note 的字句長度與短標籤
- 保留既有訊號順序與 surface emphasis
- 不改 backend contract，不新增新頁面

這一刀不是：

- 新 signal
- 新 dashboard
- 長篇 copy rewrite
- backend rewrite

## Core Decision

第一版正式決策如下：

1. condensed note 仍維持單行
2. 優先使用短標籤，而不是完整句
3. 第一版至少縮成：
   - `背景回前景`
   - `主線回前景`
   - `骨架回前景`
   - `需退背景`
   - `來源偏舊`
   - `仍在恢復`
   - `校正客戶背景`
   - `校正工作主線`
   - `校正交付骨架`
4. note 應避免超過 3 段主訊息

## Recommended First Slice

第一波只做：

- frontend shared helper short-label normalization
- targeted tests for note shape / wording
- docs / QA / verification

## Non-Goals

第一波不做：

- backend schema change
- homepage redesign
- new propagation
- long-form microcopy rewrite

## Shipped Outcome

這一刀目前已正式落地：

- condensed `Phase 6` note 現在會優先使用短標籤，而不是完整句
- reusable lifecycle 與 emphasis 已被壓成更短的 canonical wording
- note 仍維持單行、三段主訊息，不新增新頁面也不改 backend contract
