# T2-B Effectiveness Distortion Guard V1 Design

日期：2026-04-10
狀態：draft

## Purpose

`docs/06_product_alignment_and_85_point_roadmap.md` 已把 `T2-B` 定義成：

- `Reusable intelligence effectiveness deepen`

目前這條主線已經連做三刀：

- `effectiveness reading baseline v1`
- `effectiveness evidence composition v1`
- `attribution boundary reading v1`

也就是說，system 現在已經能回答：

- reusable intelligence 目前大概有效到哪一層
- 主要靠哪類 evidence 支撐
- 最大 caution 是什麼
- 目前最多只能 claim 到哪個 attribution boundary

但現在還有一個明顯缺口：

- **system 雖然會提醒不要過度解讀，但還沒有正式的 distortion guard**

目前最容易失真的地方有三種：

1. `one_off / follow_up / continuous` 案件被看成同一把尺
   - 例如 `one_off` 本來就不期待 full writeback
   - 但 `continuous` 缺少後續 outcome / writeback 時，意義就完全不同

2. deliverable closeout、outcome rows、writeback events 雖然都會進 snapshot
   - 但 system 還沒有更正式區分：
     - 這是正常缺失
     - 還是 distortion 風險

3. 目前 `effectiveness_caveat_summary` 與 `current_caveat_signal` 已經有一些 guard
   - 但還沒有形成一套更可讀、可重複的「不要高估」contract

這一刀的目的，就是把 `T2-B` 往前推成：

- `effectiveness distortion guard v1`

## Product Posture

這一刀的正式角色是：

- 把 reusable intelligence effectiveness reading 從「已有 caution」推到「更正式的 anti-overread guardrail」
- 讓 system 更清楚回答：
  - 哪些 evidence gap 是正常的
  - 哪些是真的 distortion risk
  - 現在最該避免哪種高估

這一刀不是：

- KPI dashboard
- ROI score wall
- business outcome attribution engine
- new governance dashboard family

## Architecture Guardrails

這一刀不改 Infinite Pro 的六層架構。

這一刀只會發生在：

- 既有 `Phase 6 feedback-linked scoring snapshot`
- 對應 backend scoring / read-model helpers
- workbench/homepage 的 low-noise summary wording
- active docs 與 QA evidence

這一刀不會：

- 改 Host orchestration boundary
- 把 attribution boundary 直接升格成正式 KPI attribution
- 把 completion review 變成一個 scoring console

## Why This Slice Now

`T2-B` 到目前為止最大的進展，是 system 已經會保守地說：

- `evidence_thin`
- `adoption_supported`
- `closeout_supported`
- `writeback_supported`

以及：

- `not_claimable`
- `outcome_adjacent`
- `cautious_attribution_candidate`

但現在最大的剩餘風險，不是 system 完全看不到 effectiveness，
而是：

- **看到了，但還可能看得太快、太平、太樂觀**

也就是說，下一刀最值得補的不是更大的 score，而是更好的 distortion guard。

## Approaches Considered

### Approach A: 直接做 KPI / business outcome attribution

讓 system 往 KPI dashboard 或 ROI-like reading 再走一步。

優點：

- 看起來進展最大

缺點：

- 太容易 overclaim
- 目前 evidence 邊界還不夠穩
- 風險太高

### Approach B: continuity-aware distortion guard（推薦）

保留既有 posture / composition / boundary，不擴成更大的 score，而是正式補：

- continuity-aware guardrail
- missing-evidence normalization
- anti-overread summary

優點：

- 最符合目前產品真實狀態
- 可以直接補 `H / F`
- 也和使用者前面一直強調的「不要對不起來、不要 overclaim」完全一致

缺點：

- 體感上不像大功能
- 但信任度提升最大

### Approach C: 直接把 distortion guard 做成新 dashboard 區塊

新增更細的 phase-level review wall 去拆解 distortion。

優點：

- 結構上看起來完整

缺點：

- 違反目前 low-noise posture
- 很容易走回 dashboard family

本輪採用：

- `Approach B: continuity-aware distortion guard`

## Core Decision

這一刀的正式決策如下：

1. `effectiveness distortion guard` 要正式回答 continuity-aware interpretation
   - `one_off`
   - `follow_up`
   - `continuous`
   不能再只靠同一條 generic caveat summary 帶過

2. system 要能更清楚區分：
   - 正常不期待的缺口
   - 需要保守解讀的缺口
   - 真正構成 distortion risk 的缺口

3. distortion guard 應該優先聚焦在：
   - writeback expectation 是否合理
   - follow-up outcome 是否足夠
   - deliverable closeout 與 writeback depth 是否被錯誤混讀

4. 這一刀應先做成 low-noise snapshot / summary
   - 不做新 dashboard
   - 不做 ranking wall
   - 不做 KPI attribution engine

## Proposed First Slice

這一刀正式只做：

1. continuity-aware distortion signals
   - 在 scoring snapshot 裡補一層更正式的 distortion signal / label / summary
   - 至少能回答：
     - 目前屬於哪種 continuity interpretation
     - 目前最該避免哪種高估

2. normalized missing-evidence guard
   - 把「正常不期待 full writeback」與「應該有但還沒有」的差別再講清楚
   - 尤其是：
     - `one_off / minimal`
     - `follow_up`
     - `continuous`

3. low-noise workbench summary deepen
   - 在既有 `Generalist Governance` 的 low-noise summary 裡補一條 distortion guard reading
   - 不新增新頁

4. docs / QA sync
   - `docs/01`
   - `docs/06`
   - `docs/04`

## Runtime Direction

這一刀的 runtime direction 應該是：

- 不追求更高分
- 先追求更不容易看錯

也就是：

- `writeback_supported` 不等於「已經可靠」
- `outcome_adjacent` 也不等於「幾乎可直接歸因」
- `follow_up_outcome_count > 0` 也不自動代表 retained effectiveness 已站穩

## Verification Intent

這一刀的驗證重點應包括：

- continuity-aware distortion guard 是否在 snapshot 中形成正式欄位 / summary
- `one_off / follow_up / continuous` 是否不再只被 generic caveat 帶過
- homepage 的 low-noise summary 是否能更誠實地提醒 distortion risk
- README / docs 不需要改；active docs 主要應對齊 `docs/01`、`docs/06`、`docs/04`

## Explicitly Not In Scope

這一刀明確不做：

- KPI / ROI dashboard
- business outcome attribution engine
- new phase dashboard family
- auth / browser smoke work
- consultant surface 大改版

## Expected Outcome

完成後，`T2-B slice 4` 應能讓 Infinite Pro 的 effectiveness reading 再穩一層：

- system 不只會說有效到哪
- 也更會說「現在最容易看錯的是哪裡」
- reusable intelligence 的 effectiveness posture 會更不容易因 continuity 差異或 missing writeback 被誤讀
