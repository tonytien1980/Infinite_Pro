# Generalist Coverage Proof v1 Design

日期：2026-04-09
狀態：draft

## Purpose

`docs/06_product_alignment_and_85_point_roadmap.md` 已把第三條主線定成：

- `7.3 Priority 3: Generalist coverage proof`

正式目標是：

- 把 `full-scope by capability` 從產品宣言，推進成有 benchmark / regression 證據支撐的 coverage posture

而 repo 目前已正式存在的 benchmark scaffolding，仍主要是：

- `pack / hardening baseline`
- `industry / domain / deliverable / ingestion` regression

所以這一刀的目的不是再做一次 hardening baseline，而是把現有 scaffold 往前推成：

- `generalist coverage proof v1`

## Product Posture

這一刀的正式角色是：

- 建立一套可重複跑、可回讀、可留痕的 coverage proof baseline
- 讓 system 能開始正式回答：
  - 目前 client stage 覆蓋到哪
  - client type 覆蓋到哪
  - continuity lane 覆蓋到哪
  - cross-domain representative cases 薄不薄

這一刀不是：

- 新的 benchmark platform
- AI judge console
- 新的產品 layer
- 新的治理 dashboard family

## Current State

目前 `docs/05_benchmark_and_regression.md` 與 repo 內 shipped 的 benchmark scaffold 已正式包含：

- `domain_pack_contracts`
- `industry_batch1`
- `industry_batch2`
- `legal_finance_contract`
- `operations_process`
- `deliverable_hardening`
- `ingestion_hardening`

並且已有：

- `backend/app/benchmarks/schemas.py`
- `backend/app/benchmarks/runner.py`
- `backend/app/benchmarks/suites/p0_full_regression_suite.json`
- `backend/tests/test_benchmark_scaffolding.py`
- `backend/scripts/run_pack_benchmark_scaffold.py`

也就是說：

- benchmark runner 與 suite scaffolding 其實已經存在
- 但它目前主要回答的是：
  - pack selection 是否合理
  - contract interface 是否齊
  - hardening markers 是否存在

它還不能正式回答：

- `generalist coverage` 是否成立

## Evidence Gap

目前 benchmark scaffold 對 `7.3` 有三個明顯缺口：

### 1. coverage axis 還沒有被正式建模

目前 `BenchmarkCase` 雖然已有：

- `client_stage`
- `client_type`
- `domain_lenses`

但還沒有：

- continuity lane metadata
- coverage proof summary / missing coverage readout

因此 suite 跑完後，還無法正式回答：

- 哪些 stage / type / continuity 已 covered
- 哪些仍偏薄

### 2. seed cases 目前偏向 pack / hardening baseline

從現有 manifests 看：

- `client_stage` 以 `制度化階段` 為主
- `client_type` 以 `中小企業` 為主
- `continuity` 目前完全沒有 formalized benchmark metadata

所以即使 cases 數量不算少，也還不能正式稱為：

- `generalist coverage proof`

### 3. current suite 還沒有區分「hardening regression」與「coverage proof」

現在的 `p0_full_regression_suite` 是：

- good hardening baseline

但不應被直接誤用成：

- `generalist proof suite`

因為這兩者回答的問題不同：

- hardening regression 回答：功能 / contract / markers 有沒有退步
- coverage proof 回答：產品到底覆蓋了哪些 consultant reality slices

## Existing Constraints

這一刀必須遵守幾個非常重要的限制：

1. 不新長成大型評分平台
2. 不讓 benchmark 變成顧問主流程
3. 不以漂亮 dashboard 取代 regression safety
4. 優先建立：
   - repeatable suite
   - structured coverage summary
   - seed-case baseline

而不是：

- subjective score wall
- multi-judge evaluation system

## Approaches Considered

### Approach A: Full matrix all at once

一次正式補齊：

- client-stage full matrix
- client-type full matrix
- continuity full matrix
- cross-domain representative matrix
- suite summary / missing coverage readout

優點：

- 產品想像最完整

缺點：

- 範圍過大
- 很容易把 `7.3` 第一刀做成大型 benchmark project

### Approach B: Coverage-proof baseline v1

第一刀只做：

- 新的 generalist coverage manifest family
- continuity metadata / representative cases
- suite-level coverage summary
- advisory-first gate mode

優點：

- 足夠回答 `7.3` 的第一個核心問題
- 仍保持 scaffold 取向
- 可以在現有 runner / tests 上安全擴張

缺點：

- 還不是最終完整 proof system

### Approach C: Docs-only coverage inventory

只在 `docs/05` 和 `docs/06` 盤點目前覆蓋面，不擴 suite / manifests / tests。

優點：

- 最快

缺點：

- 無法形成真正可重複跑的證據
- 仍然過度依賴產品敘述

本輪採用：

- `Approach B: Coverage-proof baseline v1`

## Core Decision

這一刀的正式決策如下：

1. 保留現有 `p0_full_regression_suite`
   - 不把它硬改名成 generalist suite

2. 新增一組專屬的 `generalist coverage proof` suite / manifest family
   - 與現有 hardening suite 分工

3. 第一版 coverage proof 至少要正式承接四個軸：
   - `client_stage`
   - `client_type`
   - `continuity`
   - `cross-domain representative cases`

4. 第一版 gate posture 採：
   - `advisory-first`
   - 因為這一刀先要回答 coverage 薄弱區，而不是先做 hard fail gate

5. suite 跑完後，必須能正式回答：
   - covered values
   - thin / missing values
   - 哪些 categories 目前偏穩、哪些偏薄

## Proposed First Slice

第一刀正式只做：

1. extend benchmark schema
   - 加入 continuity metadata
   - 加入 suite-level coverage summary schema

2. add new manifests
   - `client_stage / client_type` representative coverage
   - `continuity` representative coverage
   - `cross-domain` representative coverage

3. add a new suite
   - `generalist_coverage_proof_v1`

4. extend runner
   - 能回出 suite-level coverage summary
   - 能指出哪些 axes 目前 covered / thin / missing

5. extend benchmark tests
   - 驗證新 manifests、suite category coverage、coverage summary output

6. sync active docs / QA / runbook

## What This Slice Must Read

第一版至少要正式讀：

- `client_stage`
- `client_type`
- `domain_lenses`
- `engagement_continuity_mode`
- `writeback_depth`

正式目的不是把 benchmark 變重，而是讓它能開始回答：

- stage coverage 現在是不是只偏在 `制度化階段`
- type coverage 是否過度偏在 `中小企業`
- continuity 是否只剩 one-off / workbench 主線，還沒有 benchmark 化
- cross-domain representative cases 到底薄不薄

## Suggested Coverage Scope

第一版建議至少正式涵蓋：

### client_stage

- `創業階段`
- `制度化階段`
- `規模化階段`

### client_type

- `中小企業`
- `大型企業`
- `個人品牌與服務`
- `自媒體`

### continuity

- `one_off`
- `follow_up`
- `continuous`

### cross-domain representative bundles

至少包含：

- legal + finance
- operations + org/people
- marketing/sales + product/service
- research + domain-specific advisory

第一版不是要求 full Cartesian matrix，而是要求：

- 每條 major axis 都至少有正式代表 case

## New Artifacts

第一版推薦新增：

- `backend/app/benchmarks/manifests/g1_stage_type_coverage.json`
- `backend/app/benchmarks/manifests/g1_continuity_coverage.json`
- `backend/app/benchmarks/manifests/g1_cross_domain_coverage.json`
- `backend/app/benchmarks/suites/generalist_coverage_proof_v1.json`

必要時也可新增：

- runner CLI alias
  - 例如 `--suite coverage`

但這仍屬於：

- run convenience

不是：

- 新平台能力

## Non-Goals

本刀明確不做：

- benchmark dashboard family
- LLM judge loops
- subjective consultant scoring
- production product UI changes
- full weighted generalist score

## Success Criteria

這一刀完成後，至少要能正式回答：

1. `7.3` 不再只是產品敘述
2. suite 能正式列出：
   - 哪些 client stages 已 covered
   - 哪些 client types 已 covered
   - 哪些 continuity modes 已 covered
   - 哪些 domain bundles 已有 representative cases
3. suite 也能指出：
   - thin / missing coverage
4. current benchmark system 仍保持 scaffold posture
   - 沒有滑向大型 evaluation platform

## Verification

backend：

- `backend/tests/test_benchmark_scaffolding.py`
  - new manifests
  - new suite
  - coverage summary output
- benchmark script / runner regression

docs：

- update `docs/05_benchmark_and_regression.md`
- update `docs/06_product_alignment_and_85_point_roadmap.md`
- append `docs/04_qa_matrix.md` only after real verification
