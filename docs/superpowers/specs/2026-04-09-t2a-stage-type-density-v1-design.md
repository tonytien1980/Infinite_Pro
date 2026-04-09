# T2-A Stage/Type Density V1 Design

> 文件狀態：Proposed design
>
> 本文件定義 `docs/06` 第二 tranche 中 `T2-A Coverage density and proof deepen` 的第一刀：先補 `stage/type` 最薄 lane，讓 `generalist_coverage_proof_v1` 從「剛好有覆蓋」往「比較站得住」推進，但不把 benchmark scaffold 擴成大型 coverage matrix 平台。

---

## 1. Problem

第一 tranche 結束後，`7.3` 已誠實到達 `v1 完成`：

- `generalist_coverage_proof_v1` 已成立
- `covered / thin / missing / counts` 已能正式回讀
- `docs/05_benchmark_and_regression.md` 已把 hardening regression 與 coverage proof 分開

但這還只是 baseline，不是 coverage density 已成熟。

目前 `generalist_coverage_proof_v1` 的 `stage/type` posture 有兩個特徵：

1. `coverage existence` 已成立
   - `創業階段 / 制度化階段 / 規模化階段`
   - `中小企業 / 大型企業 / 個人品牌與服務 / 自媒體`
   都至少已被 suite 觸及

2. `coverage density` 仍不均衡
   - 目前整個 coverage suite 的 stage counts 為：
     - `創業階段 = 2`
     - `制度化階段 = 8`
     - `規模化階段 = 2`
   - 目前整個 coverage suite 的 type counts 為：
     - `中小企業 = 7`
     - `大型企業 = 2`
     - `個人品牌與服務 = 2`
     - `自媒體 = 1`

因此，`T2-A` 第一刀最明顯的薄弱點不是「完全沒覆蓋」，而是：

- `自媒體` 仍是單一代表 case
- `stage/type` 的代表性仍過度集中在 `制度化階段 + 中小企業`

這代表產品現在已可以說：

- 我們不是只服務單一 lane

但還不能說：

- 我們的 `stage/type` proof 已經比較站得住

---

## 2. Decision

`T2-A` 第一刀的正式決策是：

- **只處理 `stage/type` 最薄 lane**
- **先不處理 continuity density**
- **先不處理 cross-domain density**
- **先不開新的 suite**
- **先不把 coverage proof 提升成 weighted score wall**

這一刀的工作定義是：

- 補強 `g1_stage_type_coverage.json`
- 讓 `generalist_coverage_proof_v1` 的 suite-level summary 在 `client_type=self_media` 上不再只靠一個單點案例支撐
- 同時稍微改善 `創業階段 / 規模化階段` 相對於 `制度化階段` 的不對稱

---

## 3. Why This Slice First

這一刀先做 `stage/type thin lanes`，而不是 continuity 或 cross-domain，原因如下：

### 3.1 Lowest-risk improvement

它可以直接沿用現有：

- `generalist_coverage_proof_v1`
- `g1_stage_type_coverage.json`
- `run_suite()` 的既有 summary

不需要重新設計 suite 結構。

### 3.2 Most obvious current weak point

現有 `stage/type` posture 最明顯的薄弱 lane 是：

- `自媒體 = 1`

這比 continuity 或 cross-domain 更容易形成「雖然有列進邊界，但證據仍偏薄」的感覺。

### 3.3 Clean fit with `docs/06`

它最直接對應：

- B
- C

也符合 `T2-A Coverage density and proof deepen` 這條新主線本來要做的事。

---

## 4. Selected Approach

本設計採用：

- `Approach A: thin-lane density patch`（推薦且已選定）

其核心做法是：

- 在 `g1_stage_type_coverage.json` 補兩個新的 `自媒體` representative cases
- 讓新增案例分布在：
  - `創業階段`
  - `規模化階段`

這樣可以同時達到三件事：

1. `自媒體` 不再只有單點代表 case
2. `創業階段 / 規模化階段` 相對於 `制度化階段` 稍微不那麼失衡
3. 不需要對 continuity / cross-domain manifest 動刀

### 4.1 Alternatives intentionally not chosen

本次刻意不選：

- `Approach B: continuity-first density deepen`
  - 因為 continuity 目前不是最薄 lane，且會把 slice 拉到 `T2-A` 與 `T2-D` 之間

- `Approach C: cross-domain bundle deepen`
  - 因為 cross-domain 現在已能回答 representative bundles 是否存在，下一刀補 bundle depth 會比 stage/type thin lane 更大更散

---

## 5. Scope

### 5.1 In scope

- 更新 `backend/app/benchmarks/manifests/g1_stage_type_coverage.json`
- 新增兩個 `自媒體` representative seed cases
- 更新相關 pytest expectations
- 若 suite-level `counts / thin_values` 的預期因此改變，更新對應 benchmark tests
- 更新 `docs/05_benchmark_and_regression.md`
- 更新 `docs/06_product_alignment_and_85_point_roadmap.md`
- 更新 `docs/04_qa_matrix.md`，但前提是有 real verification evidence

### 5.2 Out of scope

- 新的 suite family
- 新的 benchmark dashboard
- continuity manifest 擴充
- cross-domain manifest 擴充
- 改成 weighted score
- full matrix expansion
- `T2-B / T2-C / T2-D` 的任何工作

---

## 6. Proposed Manifest Change

`g1_stage_type_coverage.json` 應從目前的 5 個 cases，擴到 7 個 cases。

新增的兩個 cases 應滿足：

- client_type = `自媒體`
- 其中一個位於 `創業階段`
- 其中一個位於 `規模化階段`
- 都仍保持 advisory / consultant-workbench 風格
- 不寫成 AI platform、creator growth hack tool、或 media analytics shell

### 6.1 New case design principles

新增案例應遵守：

- 仍是顧問工作，不是 creator-course shell
- 要有明確 decision context
- 要能合理對應現有 domain / industry packs
- 要讓 `research / marketing / product/service / business development` 等既有 pack 組合自然參與

### 6.2 Why two cases, not one

只補一個 `自媒體` case，雖然能讓 `自媒體` 從 `1 -> 2`，
但仍無法同時改善：

- `創業階段`
- `規模化階段`

這兩個相對薄的 stage lane。

補兩個案例，則可把 suite-level counts 從：

- stage
  - `創業階段 = 2`
  - `制度化階段 = 8`
  - `規模化階段 = 2`
- type
  - `中小企業 = 7`
  - `大型企業 = 2`
  - `個人品牌與服務 = 2`
  - `自媒體 = 1`

推到更健康的形狀：

- stage
  - `創業階段 = 3`
  - `制度化階段 = 8`
  - `規模化階段 = 3`
- type
  - `中小企業 = 7`
  - `大型企業 = 2`
  - `個人品牌與服務 = 2`
  - `自媒體 = 3`

這仍不代表完全平衡，但會比現在更像「不是單點薄弱 lane」。

---

## 7. Expected Verification

這一刀完成後，至少要能重新驗證：

1. `pytest backend/tests/test_benchmark_scaffolding.py -q`
   - manifest 與 suite expectations 都仍成立

2. `python backend/scripts/run_pack_benchmark_scaffold.py --suite coverage`
   - coverage suite 可真實回出更新後的 counts / thin_values / missing_values

3. `docs/05` / `docs/06` / `docs/04`
   - 與 code / suite result 對齊

---

## 8. Success Criteria

這一刀的完成判準是：

- `generalist_coverage_proof_v1` 仍維持 advisory-first posture
- `g1_stage_type_coverage.json` 已新增兩個合理的自媒體 representative cases
- suite-level `client_type=self_media` 不再是單點代表
- `創業階段 / 規模化階段` 相對薄弱度略有改善
- 沒有把 coverage proof 擴成 full matrix platform
- docs / tests / verification evidence 都同步更新

---

## 9. What This Slice Still Does Not Claim

即使這一刀完成，也仍不能宣告：

- `T2-A` 已完成
- coverage density 已 fully mature
- every stage / type lane 已等深

這一刀只代表：

- `T2-A` 的第一個 density deepen slice 已成立
- `stage/type` 不再停在最薄的 baseline posture

後續仍可有：

- `T2-A slice 2`
  - personal brand / enterprise density 或 asymmetry 是否要再補
- `T2-A slice 3`
  - continuity density
- `T2-A slice 4`
  - cross-domain density

