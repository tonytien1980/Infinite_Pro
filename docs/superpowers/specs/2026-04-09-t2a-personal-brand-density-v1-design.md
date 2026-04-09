# T2-A Personal-Brand Density V1 Design

> 文件狀態：Proposed design
>
> 本文件定義 `T2-A Coverage density and proof deepen` 的第二刀：補 `個人品牌與服務` 這個 client type 的跨 stage 代表性，讓 `generalist_coverage_proof_v1` 不再把此類案件幾乎都壓在 `制度化階段`，但仍維持 advisory-first benchmark posture，不擴成 full matrix platform。

---

## 1. Problem

`T2-A stage/type density v1` 已把 `自媒體` 從單點薄弱 lane 補厚，現在 suite-level counts 已是：

- client stage
  - `創業階段 = 3`
  - `制度化階段 = 8`
  - `規模化階段 = 3`
- client type
  - `中小企業 = 7`
  - `大型企業 = 2`
  - `個人品牌與服務 = 2`
  - `自媒體 = 3`

這代表：

- `自媒體` 已不再是最薄 type lane
- 但 `個人品牌與服務` 仍然只有 `2`

更重要的是，`個人品牌與服務` 目前在 suite-level 的 `stage/type pair` 幾乎完全壓在：

- `制度化階段 + 個人品牌與服務 = 2`

而缺少：

- `創業階段 + 個人品牌與服務`
- `規模化階段 + 個人品牌與服務`

這會造成一個更細的 proof 問題：

- 雖然 system 已能說自己處理 `個人品牌與服務`
- 但實際 benchmark evidence 更像是在說「只處理制度化中的個人品牌與服務」

所以 `T2-A slice 2` 的核心問題不是 `client_type existence`，而是：

- `個人品牌與服務` 的跨 stage density 仍不足

---

## 2. Decision

本設計的正式決策是：

- **只處理 `個人品牌與服務` 的跨 stage density**
- **不再追加 `自媒體` cases**
- **先不處理大型企業 density**
- **先不新增 pair-level summary schema**
- **仍不開新 suite family**

這一刀的工作定義是：

- 在 `g1_stage_type_coverage.json` 新增兩個 `個人品牌與服務` representative cases
- 分別補在：
  - `創業階段`
  - `規模化階段`
- 讓 `個人品牌與服務` 從「只在制度化出現」走向「至少橫跨三個 stage 有代表性」

---

## 3. Alternatives Considered

### 3.1 Approach A: Personal-brand stage spread patch

做法：

- 補兩個 `個人品牌與服務` cases
- 分別落在 `創業階段` 與 `規模化階段`

優點：

- 直接解掉目前最明顯的 pair asymmetry
- 同時改善：
  - `個人品牌與服務` type density
  - `創業階段 / 規模化階段` 的 stage density
- 不需要變更 suite / runner / schema

缺點：

- `大型企業` 仍會維持相對薄的 type density

### 3.2 Approach B: Large-enterprise density patch

做法：

- 再補 1 到 2 個 `大型企業` cases

優點：

- 能把 type counts 往更平均拉

缺點：

- 對 stage/type pair 的改善較有限
- 很可能又把 cases 補到 `制度化 / 規模化`，對目前最明顯的跨 stage 空洞幫助較小

### 3.3 Approach C: Pair-level readout before more cases

做法：

- 不加 cases
- 先讓 suite 回讀 `stage/type pair` summary

優點：

- 更誠實暴露不對稱

缺點：

- 這是在讓 system 更會描述自己
- 不是先把 proof 變厚
- 不符合目前 tranche 2 對 `T2-A` 的優先順序

### 3.4 Selected approach

本設計選擇：

- `Approach A: Personal-brand stage spread patch`

因為它最直接解決現在真正仍偏薄的地方，而且風險最低。

---

## 4. Scope

### 4.1 In scope

- 更新 `backend/app/benchmarks/manifests/g1_stage_type_coverage.json`
- 新增兩個 `個人品牌與服務` representative cases
- 更新 benchmark tests 中與 stage/type density 有關的 expectation
- 更新 `docs/05_benchmark_and_regression.md`
- 更新 `docs/06_product_alignment_and_85_point_roadmap.md`
- 更新 `docs/04_qa_matrix.md`，但前提是有真實 verification evidence

### 4.2 Out of scope

- `自媒體` 追加 density
- `大型企業` 追加 density
- continuity density
- cross-domain density
- pair-level summary schema
- runner / suite schema 擴充
- weighted score wall

---

## 5. Proposed Manifest Change

`g1_stage_type_coverage.json` 應從目前 `7` 個 cases 擴到 `9` 個 cases。

新增的兩個 cases 應滿足：

- `client_type = 個人品牌與服務`
- 其中一個位於 `創業階段`
- 其中一個位於 `規模化階段`

### 5.1 Startup personal-brand case

這個 case 應偏向：

- `professional_services_pack`
- `product_service_pack`
- `business_development_pack`

應回答的問題類型像是：

- 創業階段的個人品牌 / 顧問服務，是否該先收斂 hero offer、報價邏輯與服務包裝

目前較穩定的 target 組合應直接固定為：

- target domain packs
  - `product_service_pack`
  - `business_development_pack`
- target industry pack
  - `professional_services_pack`

正式要求：

- 不把它寫成 generic creator shell
- 不把它寫成一般中小企業 case 改名
- 要保留個人品牌 / 服務 business 的 consultant posture

### 5.2 Scaled personal-brand case

這個 case 應偏向：

- `online_education_pack`
- `marketing_sales_pack`
- `operations_pack`

應回答的問題類型像是：

- 規模化的個人品牌 / 教育 / 服務 hybrid，是否該重整課程、服務、retainer 或會員產品組合

目前較穩定的 target 組合應直接固定為：

- target domain packs
  - `marketing_sales_pack`
  - `operations_pack`
- target industry pack
  - `online_education_pack`

正式要求：

- 不把它寫成 media creator case 重複命名
- 不把它寫成大型企業 training shell
- 要保留「個人品牌與服務 business 在規模化後如何治理 productized offer」的顧問問題

---

## 6. Expected Posture Change

這一刀完成後，預期 suite-level `client_type` counts 會從：

- `中小企業 = 7`
- `大型企業 = 2`
- `個人品牌與服務 = 2`
- `自媒體 = 3`

變成：

- `中小企業 = 7`
- `大型企業 = 2`
- `個人品牌與服務 = 4`
- `自媒體 = 3`

而 `stage/type pair` 也會從：

- `制度化階段 + 個人品牌與服務 = 2`
- `創業階段 + 個人品牌與服務 = 0`
- `規模化階段 + 個人品牌與服務 = 0`

變成：

- `制度化階段 + 個人品牌與服務 = 2`
- `創業階段 + 個人品牌與服務 = 1`
- `規模化階段 + 個人品牌與服務 = 1`

這不代表完全平衡，但已明顯比目前更站得住。

---

## 7. Verification Expectations

這一刀完成後，至少要重新驗證：

1. `PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_benchmark_scaffolding.py -q`
2. `PYTHONPATH=backend .venv312/bin/python backend/scripts/run_pack_benchmark_scaffold.py --suite coverage`
3. `docs/05` / `docs/06` / `docs/04` 與 live result 對齊

其中至少應確認：

- `client_type` counts 裡 `個人品牌與服務 = 4`
- `client_stage` 仍維持完整覆蓋
- suite 仍是 `advisory-first`

---

## 8. Success Criteria

這一刀的完成判準是：

- `個人品牌與服務` 不再只集中在 `制度化階段`
- suite-level `client_type` counts 反映出更厚的 personal-brand/service density
- 新案例與既有 `online_education_pack` / `professional_services_pack` 的語意相容
- 沒有把 coverage proof 擴成新平台
- docs / tests / verification evidence 同步成立

---

## 9. What This Slice Still Does Not Claim

即使這一刀完成，也仍不能宣告：

- `T2-A` 已完成
- stage/type density 已 fully mature
- every client type 已等深
- pair-level summary 已是正式 shipped contract

這一刀只代表：

- `T2-A` 在 `個人品牌與服務` 這個 type 上，又往前補厚一段
- `stage/type` proof 變得更像跨 stage 顧問 workbench，而不是只在單一 operating band 成立
