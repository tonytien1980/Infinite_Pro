# Phase 6 Cross-Surface Note Consistency v1 Design

日期：2026-04-07
狀態：shipped

## Purpose

`reusable-signal freshness prioritization v1` 已讓 condensed second-layer `Phase 6` note 會優先顯示 reusable source 的 freshness / lifecycle posture。

但目前 task / matter / deliverable 三個 surface，對相近狀態仍可能各自用不同語氣描述：

- 同樣是重新回到前景
- 同樣是需要退回背景
- 同樣是偏舊或恢復中

這會讓顧問在不同工作面讀到略微漂移的語氣，雖然不是 bug，但會削弱 `Phase 6` note 的一致性。

因此這一刀的正式問題是：

- 怎麼讓 task / matter / deliverable 三個 surface 的 condensed note
- 在同類 reusable 狀態下
- 用更一致的 consultant-facing wording 表達

因此這一刀定為：

- `phase-6 cross-surface note consistency v1`

## Product Posture

這一刀的正式定位是：

- 只調整 condensed note 的 wording consistency
- 不改 signal 優先順序
- 不改 backend contract
- 不新增新頁面

這一刀不是：

- 新治理面板
- 新 signal
- 文案大改版
- backend lifecycle rewrite

## Core Decision

第一版正式決策如下：

1. condensed note 仍維持單行、低噪音
2. 相同 reusable posture 在不同 surface 應使用一致的句型骨架
3. 第一版至少對齊：
   - `重新回前景`
   - `仍需退背景`
   - `來源偏舊`
   - `仍在恢復期`
4. 可以保留 surface-specific 主詞，但不要讓整句風格漂移太大

## Recommended First Slice

第一波只做：

- frontend condensed-note wording normalization helper
- 3 個 reusable guidance helper 對齊輸出
- tests / docs / QA

## Non-Goals

第一波不做：

- backend schema change
- 新 propagation
- long-form copy rewrite
- homepage Generalist Governance redesign

## Shipped Outcome

這一刀目前已正式落地：

- task / matter / deliverable 三個 surface 的 condensed `Phase 6` note 現在已對齊成一致的句型骨架
- helper 仍可保留不同 surface 的主詞，但像 `重新回前景` / `仍需退背景` 這類 reusable posture 已不再各說各話
- backend contract 不變，也沒有新增新頁面
