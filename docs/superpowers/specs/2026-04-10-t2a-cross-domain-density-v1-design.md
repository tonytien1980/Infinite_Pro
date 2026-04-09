# T2-A Cross-Domain Density V1 Design

> 文件狀態：Proposed design
>
> 本文件定義 `T2-A Coverage density and proof deepen` 的下一刀：先補最薄的 `legal_plus_finance` cross-domain bundle，讓 `generalist_coverage_proof_v1` 不再主要靠單一 SMB 合約/融資案例與單一大型企業案例代表這條 bundle，但仍維持 advisory-first benchmark posture，不擴成新的 cross-domain matrix platform。

---

## 1. Problem

在 `T2-A` 已完成：

- `stage/type density v1`
- `personal-brand density v1`
- `continuity density v1`

之後，suite-level counts 目前是：

- client stage
  - `創業階段 = 4`
  - `制度化階段 = 9`
  - `規模化階段 = 5`
- client type
  - `中小企業 = 7`
  - `大型企業 = 2`
  - `個人品牌與服務 = 5`
  - `自媒體 = 4`
- continuity
  - `one_off = 7`
  - `follow_up = 6`
  - `continuous = 5`
- cross-domain bundle
  - `research_plus_domain_advisory = 4`
  - `operations_plus_org_people = 4`
  - `legal_plus_finance = 3`
  - `marketing_sales_plus_product_service = 7`

所以現在最薄的 cross-domain bundle 很明確是：

- `legal_plus_finance = 3`

而且它目前的代表性仍然偏窄：

- 一個主要是 `制度化階段 + 中小企業` 的 contract/finance case
- 一個主要是 `制度化階段 + 中小企業` 的 one-off contract review
- 一個主要是 `規模化階段 + 大型企業` 的 scaled enterprise legal/finance case

這代表系統現在已能說：

- `legal_plus_finance` bundle 存在

但還不能說：

- 這個 bundle 的 representative density 對不同 client stage / client type 已比較站得住

---

## 2. Decision

本設計的正式決策是：

- **只處理 `legal_plus_finance` 這條 cross-domain bundle**
- **先不補其他 bundle**
- **先不做 cross-domain summary schema**
- **先不做 weighted bundle score**

這一刀的工作定義是：

- 在 `g1_cross_domain_coverage.json` 新增 2 個 `legal_plus_finance` representative cases
- 讓這條 bundle 不再主要只由：
  - `制度化階段 + 中小企業`
  - `規模化階段 + 大型企業`
 兩種姿態代表

---

## 3. Alternatives Considered

### 3.1 Approach A: Legal-plus-finance diversity patch

做法：

- 只補 `legal_plus_finance`
- 用 2 個新案例把它拉向更分散的 stage/type posture

優點：

- 直接處理目前最薄 bundle
- 風險低
- 不需要改 schema / runner

缺點：

- `operations_plus_org_people` 或 `research_plus_domain_advisory` 的更細緻多樣性不會在這一刀處理

### 3.2 Approach B: Cross-domain even-up patch

做法：

- 同時補多條 bundle，各加 1 個 case

優點：

- 表面上更平均

缺點：

- scope 變大
- 很容易變成 matrix inflation
- 不利於一刀一刀可驗證推進

### 3.3 Approach C: Cross-domain summary-first patch

做法：

- 不加案例
- 先讓 suite 額外回讀更細的 bundle density summary

優點：

- 更會描述目前的 bundle posture

缺點：

- 這是在讓 system 更會描述自己
- 不是先讓 proof 變厚
- 不符合 `T2-A` 當前優先順序

### 3.4 Selected approach

本設計選擇：

- `Approach A: Legal-plus-finance diversity patch`

因為它最直接解決當前 cross-domain 最薄的真實 gap。

---

## 4. Scope

### 4.1 In scope

- 更新 `backend/app/benchmarks/manifests/g1_cross_domain_coverage.json`
- 新增 2 個 `legal_plus_finance` representative cases
- 更新 benchmark tests 中與 cross-domain density 有關的 expectation
- 更新 `docs/05_benchmark_and_regression.md`
- 更新 `docs/06_product_alignment_and_85_point_roadmap.md`
- 更新 `docs/04_qa_matrix.md`，但前提是有真實 verification evidence

### 4.2 Out of scope

- stage/type density
- continuity density
- other bundle density
- cross-domain summary schema
- weighted bundle score wall
- new suite family

---

## 5. Proposed Manifest Change

`g1_cross_domain_coverage.json` 應從目前 `4` 個 cases 擴到 `6` 個 cases。

### 5.1 New startup legal/finance case

這個 case 應補的是：

- `創業階段 + 中小企業` 的 legal/finance representative density
- 但不能只是把現有 legal/finance 案例換個名字

目前已驗證較穩的 target 組合是：

- target domain packs
  - `finance_fundraising_pack`
  - `legal_risk_pack`
- target industry pack
  - `saas_pack`

應回答的問題類型像是：

- 創業階段的 founder agreement、early financing structure、長尾 obligations 是否已過早複雜化

### 5.2 New personal-brand legal/finance case

這個 case 應補的是：

- `制度化階段 + 個人品牌與服務` 的 legal/finance representative density

目前已驗證較穩的 target 組合是：

- target domain packs
  - `legal_risk_pack`
  - `finance_fundraising_pack`
- target industry pack
  - `online_education_pack`

應回答的問題類型像是：

- 個人品牌 / 教育型服務的 revenue-share、partner agreement、cashflow 與 contract structure 是否該在擴張前先簡化

正式要求：

- 不把它寫成 generic course business marketing problem
- 要保留 legal + finance bundle 的顧問問題本質

---

## 6. Expected Posture Change

這一刀完成後，預期 bundle counts 會從：

- `research_plus_domain_advisory = 4`
- `operations_plus_org_people = 4`
- `legal_plus_finance = 3`
- `marketing_sales_plus_product_service = 7`

變成：

- `research_plus_domain_advisory = 4`
- `operations_plus_org_people = 4`
- `legal_plus_finance = 5`
- `marketing_sales_plus_product_service = 7`

這不代表 cross-domain 已 fully mature，但 `legal_plus_finance` 就不再是明顯最薄的單一 bundle。

---

## 7. Verification Expectations

這一刀完成後，至少要重新驗證：

1. `PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_benchmark_scaffolding.py -q`
2. `PYTHONPATH=backend .venv312/bin/python backend/scripts/run_pack_benchmark_scaffold.py --suite coverage`
3. `docs/05` / `docs/06` / `docs/04` 與 live result 對齊

其中至少應確認：

- bundle counts 裡 `legal_plus_finance = 5`
- suite 仍是 `advisory-first`
- `legal_plus_finance` 不再主要只靠 SMB contract review 與 scaled enterprise case 支撐

---

## 8. Success Criteria

這一刀的完成判準是：

- `g1_cross_domain_coverage` 已有 6 個 cases
- `legal_plus_finance` bundle 不再是明顯最薄 bundle
- 新案例與既有 `saas_pack` / `online_education_pack` 的語意相容
- docs / tests / verification evidence 同步成立
- 沒有把 cross-domain proof 擴成新平台

---

## 9. What This Slice Still Does Not Claim

即使這一刀完成，也仍不能宣告：

- `T2-A` 已完成
- cross-domain density 已 fully mature
- every bundle 已等深
- cross-domain summary schema 已正式 shipped

這一刀只代表：

- `T2-A` 已開始正式補 `cross-domain`
- 最薄的 `legal_plus_finance` bundle 已從 baseline 再往前補厚一段

