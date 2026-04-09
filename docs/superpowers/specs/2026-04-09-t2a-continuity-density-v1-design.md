# T2-A Continuity Density V1 Design

> 文件狀態：Proposed design
>
> 本文件定義 `T2-A Coverage density and proof deepen` 的下一刀：補 continuity lane diversity，讓 `generalist_coverage_proof_v1` 不再只用單一 follow-up case 和單一 continuous case 代表整條 continuity posture，但仍維持 advisory-first benchmark baseline，不擴成新的 continuity platform。

---

## 1. Problem

經過前兩刀後，`T2-A` 在 `stage/type` 上已經明顯比 baseline 更厚：

- stage counts：`創業階段 = 4 / 制度化階段 = 8 / 規模化階段 = 4`
- type counts：`中小企業 = 7 / 大型企業 = 2 / 個人品牌與服務 = 4 / 自媒體 = 3`

但 continuity 這條線雖然 suite-level counts 看起來不差：

- `one_off = 7`
- `follow_up = 5`
- `continuous = 4`

實際上仍有一個誠實的薄弱點：

- 專門的 `g1_continuity_coverage.json` 仍然只有：
  - `one_off` 1 例
  - `follow_up` 1 例
  - `continuous` 1 例

而且這三條 lane 的代表性仍然過於集中：

- `follow_up` 幾乎只由 `制度化階段 + 中小企業 + operations/org` 代表
- `continuous` 幾乎只由 `規模化階段 + 大型企業 + operations/finance` 代表

這代表產品現在已能說：

- continuity lanes 都有 baseline

但還不能說：

- continuity proof 對不同 client / industry / work style 已經比較站得住

---

## 2. Decision

本設計的正式決策是：

- **先做 continuity lane diversity patch**
- **只補 `follow_up` 與 `continuous`**
- **先不補 `one_off`**
- **先不新增 continuity-specific schema**
- **先不做 pair-level or writeback-depth platform**

這一刀的工作定義是：

- 在 `g1_continuity_coverage.json` 補 2 個新案例
- 讓 `follow_up` 不再只代表 SMB operations checkpoint
- 讓 `continuous` 不再只代表 scaled enterprise operations case

---

## 3. Alternatives Considered

### 3.1 Approach A: Follow-up + continuous lane diversity patch

做法：

- 補 1 個 `follow_up` 代表案例
- 補 1 個 `continuous` 代表案例
- 讓 continuity proof 的 lane semantics 更分散

優點：

- 風險最低
- 不需要改 schema
- 最直接改善 continuity baseline 的單點代表問題

缺點：

- `one_off` 不會在這一刀再補厚

### 3.2 Approach B: One-off + follow-up patch

做法：

- 補 1 個 `one_off`
- 補 1 個 `follow_up`

優點：

- 能讓 `one_off` 也更有顧問案例多樣性

缺點：

- `one_off` 在整體 suite 裡已經不算薄
- 不如先處理 `continuous` 單點代表問題

### 3.3 Approach C: Continuity summary platform

做法：

- 不加新案例
- 先讓 suite 正式回讀 continuity/writeback pair summary

優點：

- 更會描述 continuity posture

缺點：

- 這是「更會描述自己」
- 不是先把 continuity evidence 變厚
- 不符合 `T2-A` 當前優先順序

### 3.4 Selected approach

本設計選擇：

- `Approach A: Follow-up + continuous lane diversity patch`

因為它最直接解決現在 continuity baseline 的單點代表問題。

---

## 4. Scope

### 4.1 In scope

- 更新 `backend/app/benchmarks/manifests/g1_continuity_coverage.json`
- 新增 2 個 continuity representative cases
- 更新 benchmark tests 中與 continuity density 有關的 expectations
- 更新 `docs/05_benchmark_and_regression.md`
- 更新 `docs/06_product_alignment_and_85_point_roadmap.md`
- 更新 `docs/04_qa_matrix.md`，但前提是有真實 verification evidence

### 4.2 Out of scope

- stage/type density
- cross-domain density
- continuity schema 擴充
- writeback-depth score wall
- pair-level summary contract
- new suite family

---

## 5. Proposed Manifest Change

`g1_continuity_coverage.json` 應從 `3` 個 cases 擴到 `5` 個 cases。

### 5.1 New follow-up case

這個 case 應補的是：

- 非 SMB operations 的 `follow_up` 代表性

目前較穩定的 target 組合已驗證為：

- target domain packs
  - `product_service_pack`
  - `marketing_sales_pack`
- target industry pack
  - `online_education_pack`

這個 case 應回答的問題類型像是：

- 個人品牌 / 教育型服務，在已經有初版 offer 後，是否該在下一輪 enrollment push 前先收斂 offer ladder、acquisition mix 與 delivery scope

正式要求：

- 保持 `follow_up`
- 保持 `writeback_depth = milestone`
- 不把它寫成 generic onboarding shell

### 5.2 New continuous case

這個 case 應補的是：

- 非大型企業 operations/finance 的 `continuous` 代表性

目前較穩定的 target 組合已驗證為：

- target domain packs
  - `operations_pack`
  - `marketing_sales_pack`
- target industry pack
  - `media_creator_pack`

這個 case 應回答的問題類型像是：

- 規模化 creator business 在贊助、內容節奏與交付模型之間，是否還能繼續擴張而不犧牲品質

正式要求：

- 保持 `continuous`
- 保持 `writeback_depth = full`
- 不把它寫成 media analytics shell

---

## 6. Expected Posture Change

這一刀完成後，預期 continuity counts 會從：

- `one_off = 7`
- `follow_up = 5`
- `continuous = 4`

變成：

- `one_off = 7`
- `follow_up = 6`
- `continuous = 5`

而 continuity manifest 本身也會從：

- 每條 lane 各 1 例

變成：

- `one_off = 1`
- `follow_up = 2`
- `continuous = 2`

這不代表 continuity 已 fully mature，但會比現在更像多樣化的顧問案例 proof，而不是單點 lane label。

---

## 7. Verification Expectations

這一刀完成後，至少要重新驗證：

1. `PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_benchmark_scaffolding.py -q`
2. `PYTHONPATH=backend .venv312/bin/python backend/scripts/run_pack_benchmark_scaffold.py --suite coverage`
3. `docs/05` / `docs/06` / `docs/04` 與 live result 對齊

其中至少應確認：

- continuity counts 變成 `7 / 6 / 5`
- suite 仍是 `advisory-first`
- `continuous` 不再只有 scaled enterprise 代表
- `follow_up` 不再只有 SMB operations 代表

---

## 8. Success Criteria

這一刀的完成判準是：

- `g1_continuity_coverage` 已有 5 個 cases
- continuity proof 不再只靠單一 follow-up 與單一 continuous case
- follow-up / continuous 各自至少有 2 個類型不同的代表案例
- docs / tests / verification evidence 同步成立
- 沒有把 continuity proof 擴成新平台

---

## 9. What This Slice Still Does Not Claim

即使這一刀完成，也仍不能宣告：

- `T2-A` 已完成
- continuity density 已 fully mature
- writeback-depth semantics 已 fully modeled
- pair-level summary 已是 shipped contract

這一刀只代表：

- continuity proof 已從單點 label baseline 再往前補厚一段
- `T2-A` 已開始不只補 `stage/type`，也開始補 `continuity`

