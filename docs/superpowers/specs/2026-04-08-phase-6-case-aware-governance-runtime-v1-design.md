# Phase 6 Case-Aware Governance Runtime v1 Design

日期：2026-04-08
狀態：draft

## Purpose

`docs/06_product_alignment_and_85_point_roadmap.md` 已把下一階段第一優先主線定為：

- `7.1 Priority 1: Case-aware governance runtime`

目前 `Phase 6` 的 phase-level closeout、completion review、sign-off / handoff 都已成立，但 task / matter work surface 讀到的 `Phase 6` signals 仍偏 phase-level 靜態敘述。  
也就是：

- `guidance posture`
- `reuse confidence`
- `confidence calibration`
- `calibration-aware weighting`

雖然已進到既有 work-surface contract，卻還沒有正式吃進當前案件的：

- `client_stage`
- `client_type`
- `domain_lenses`
- `evidence_thickness`
- `pack context`

因此這一刀定為：

- `phase-6 case-aware governance runtime v1`

## Product Posture

這一刀的正式定位是：

- 讓既有 `Phase 6` work-surface signals 變成真正 case-aware
- 保持 consultant-first / low-noise workbench
- 只強化既有 task / matter / deliverable read model，不新增新 page family

這一刀不是：

- 新 governance dashboard
- 新 phase-level console
- consultant ranking / training shell
- 只改 note wording 的 micro-slice

## Current Problem

目前 backend 的 `phase_six_generalist_governance` 雖然已有：

- reuse boundary
- guidance posture
- context distance / reuse confidence
- confidence calibration
- calibration-aware weighting

但在 task / matter response assembly 時，仍主要使用 phase-level builder 的無參數版本。

這造成：

1. 同一類 reusable asset 在不同案件中，work surface 仍容易讀到相同判讀
2. `Phase 6` second-layer note 雖然已 low-noise，但不夠 case-aware
3. `docs/06` 所要求的 `evidence_thickness / pack context` 還沒有正式進入 work-surface governance runtime

## Core Decision

第一版正式決策如下：

1. backend 新增一個 internal-only `PhaseSixCaseContext` contract，最少包含：
   - `client_stage`
   - `client_type`
   - `domain_lenses`
   - `evidence_count`
   - `unresolved_evidence_gap_count`
   - `selected_domain_pack_ids`
   - `selected_industry_pack_ids`
2. `build_phase_six_generalist_guidance_posture`
   `build_phase_six_context_distance_audit`
   `build_phase_six_confidence_calibration`
   `build_phase_six_calibration_aware_weighting`
   都要能吃這份 `case context`
3. task / matter response assembly 必須把真實案件上下文傳入，而不是只讀 phase-level 靜態預設
4. 第一版先讓以下判讀正式變動：
   - 是否維持低噪音 / 適度明示 / 先保守引導
   - reusable assets 與當前案件是 `close / moderate / far`
   - `client_stage / client_type / domain_lens` 是 `aligned / caution / mismatch`
   - Host weighting 是 `allow_expand / keep_contextual / background_only`

## Recommended First Slice

第一波只做：

- backend case-aware governance runtime builder
- task / matter propagation
- backend tests
- active docs / QA 同步

## Non-Goals

第一波不做：

- 首頁 phase-level `Generalist Governance` 改成 case-specific console
- 新增 `/phase-6` route family
- 新增 score wall
- 重做 deliverable page IA

## Success Criteria

這一刀完成後，至少要能正式回答：

1. 同一類 reusable asset 在 rich case 與 sparse case 會得到不同判讀
2. task / matter work surface 看到的 `guidance / confidence / calibration / weighting` 已不再只是 phase-level 固定敘述
3. `evidence_thickness` 與 `pack context` 已正式進入 `Phase 6` 的 work-surface runtime
4. active docs 已把這條 runtime 契約寫清楚

## Verification

- backend: 新增 case-aware governance unit/integration tests
- frontend: 保持既有 phase-six / second-layer tests green
- docs: 更新 active runtime doc 與 QA matrix
