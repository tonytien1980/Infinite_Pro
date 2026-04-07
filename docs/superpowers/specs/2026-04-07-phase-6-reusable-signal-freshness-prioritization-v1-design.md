# Phase 6 Reusable-Signal Freshness Prioritization v1 Design

日期：2026-04-07
狀態：shipped

## Purpose

`second-layer signal condensation v1` 已把 4 條 Phase 6 notes 收成 1 條低噪音摘要。

但目前這條 note 仍傾向固定優先顯示：

- `Host weighting`
- 或其他 reusable boundary 類訊號

這代表當 reusable source 的真正重點是：

- 剛重新回到前景
- 近期偏舊
- 仍在恢復期
- 需要先退背景觀察

顧問不一定會先看到這條更貼近「現在該怎麼讀這個 reusable signal」的 freshness / lifecycle 判斷。

因此這一刀的正式問題是：

- 怎麼讓 condensed second-layer note 優先讀出 reusable signal 的 freshness / lifecycle posture
- 讓顧問先知道這條 shared source 現在是剛回來、偏舊、還是需要保守看待

因此這一刀定為：

- `phase-6 reusable-signal freshness prioritization v1`

## Product Posture

這一刀的正式定位是：

- 只調整 second-layer condensed note 的訊號優先順序
- 讓 freshness / reactivation / recovery / decay 這類 reusable lifecycle signal 比一般 boundary signal 更早被看見
- 不改 backend contract，不新增新頁面

這一刀不是：

- 新的 freshness dashboard
- backend lifecycle rewrite
- governance policy engine
- 顧問分級系統

## Core Decision

第一版正式決策如下：

1. condensed note 仍維持單行、低噪音
2. 若卡片本身已有 reusable lifecycle / freshness signal，這條訊號應優先於一般 boundary signal
3. 優先順序第一版定為：
   - `recovery_balance_summary`
   - `reactivation_summary`
   - `decay_summary`
   - `freshness_summary`
   - 之後才回到 `Host weighting / calibration / reuse confidence`
4. condensed note 仍保留 `guidance posture` 作為第一段語氣

## Recommended First Slice

第一波只做：

- frontend condensed-note priority helper 更新
- `organization memory` / `domain playbook` / `deliverable template` 傳入 freshness/lifecycle signal
- tests / docs / QA

## Non-Goals

第一波不做：

- backend schema change
- homepage Generalist Governance redesign
- 新 propagation
- 長篇 reusable lifecycle 說明牆

## Shipped Outcome

這一刀目前已正式落地：

- condensed second-layer `Phase 6` note 現在會先看 reusable freshness / lifecycle signal
- `reactivation / recovery / decay / freshness` 會比一般 boundary 類訊號更早被顯示
- backend contract 不變，也沒有新增新頁面
