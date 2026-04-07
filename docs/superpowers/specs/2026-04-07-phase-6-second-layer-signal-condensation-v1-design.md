# Phase 6 Second-Layer Signal Condensation v1 Design

日期：2026-04-07
狀態：shipped

## Purpose

到目前為止，task / matter / deliverable 的既有 second-layer guidance 已能讀到：

- `Phase 6 guidance`
- `Phase 6 reuse confidence`
- `Phase 6 confidence calibration`
- `Phase 6 Host weighting`

但這也意味著每張卡片最下方可能連續堆出 4 條 Phase 6 notes。

因此這一刀的正式問題是：

- 怎麼保留這些 signal
- 但不要讓 second-layer cards 因為 Phase 6 累積太多 low-noise note 而開始變厚

因此這一刀定為：

- `phase-6 second-layer signal condensation v1`

## Product Posture

這一刀的正式定位是：

- 把既有 4 條 Phase 6 second-layer notes 收斂成 1 條 consultant-readable summary
- 保留最重要的導引與邊界訊號
- 不改 primary summary，不新增新頁面，不改 backend contract

這一刀不是：

- 刪掉 Phase 6 signal
- 新增更複雜的 governance panel
- consultant-visible weighting editor
- backend routing / ordering rewrite

## Core Decision

第一版正式決策如下：

1. second-layer cards 只保留 1 條 `Phase 6` condensed note
2. 這條 note 的內容優先順序為：
   - `Host weighting`
   - `confidence calibration`
   - `reuse confidence`
   - `guidance posture`
3. 若有 `Host weighting`，應優先讓顧問看見像 `domain lens 先留背景校正` 這類最可執行的判斷
4. 這一刀只改 frontend helper / panel wiring，不改 backend response contract

## Recommended First Slice

第一波只做：

- one shared helper for second-layer Phase 6 condensed note
- existing `organization memory` / `domain playbook` / `deliverable template` helper refactor
- panel rendering dedup
- docs / QA / verification

## Non-Goals

第一波不做：

- backend schema change
- homepage Generalist Governance redesign
- propagation to more cards
- long-form Phase 6 explanation wall

## Shipped Outcome

這一刀目前已正式落地：

- `organization memory` / `domain playbook` / `deliverable template` 的 second-layer Phase 6 notes 已從 4 條收斂成 1 條
- frontend 已新增共用 condensation helper，避免 3 條 helper 再各自重複拼裝 4 條 signal
- 沒有改 backend contract，也沒有新增新頁面
