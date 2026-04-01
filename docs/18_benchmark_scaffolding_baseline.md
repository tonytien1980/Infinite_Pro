# 18_benchmark_scaffolding_baseline.md

## 1. 文件目的

本文件用於正式定義 Infinite Pro 進入下一階段 hardening / extension 前的 benchmark scaffolding baseline。

它的角色是：
- 建立後續 pack hardening 的 before / after 對照骨架
- 明確 benchmark baseline 與 living QA matrix 的分工
- 提供最小但真實的 manifest / result schema / runner runbook

它不是：
- 完整 evaluation platform
- 新的 product layer
- 新的 app shell
- 全量 regression suite

---

## 2. 邊界與不變原則

### 2.1 正式定位

這一份 baseline 只服務於：
- pack hardening / extension
- object / evidence / deliverable runtime regression observation
- 後續 hardening checkpoint 的前後對照

### 2.2 這一份 baseline 不做什麼

禁止把這份 baseline 擴成：
- 大型 benchmark 平台
- 新的評分控制台
- 自動化多輪 judge system
- 需要顧問額外學習的新主流程

### 2.3 與 living QA matrix 的關係

`docs/16_qa_matrix.md` 的責任是：
- 記錄 build / typecheck / smoke / pytest 等已驗證的 shipped evidence
- 維護單一 living QA history

本 benchmark baseline 的責任是：
- 提供可重複執行的 seed cases
- 提供結構化 result schema
- 讓後續 hardening 可以保留 before / after 對照骨架

換句話說：
- `docs/16_qa_matrix.md` 是 shipped verification history
- 本文件與其對應 manifest / runner 是 hardening benchmark scaffolding

---

## 3. 最小 shipped baseline

### 3.1 docs baseline

目前正式 baseline 包含：
- 本文件：`docs/18_benchmark_scaffolding_baseline.md`
- manifest：`backend/app/benchmarks/manifests/p0_industry_batch1.json`
- manifest：`backend/app/benchmarks/manifests/p0_industry_batch2.json`
- manifest：`backend/app/benchmarks/manifests/p0_legal_finance_contract.json`
- manifest：`backend/app/benchmarks/manifests/p0_operations_process.json`
- manifest：`backend/app/benchmarks/manifests/p0_deliverable_hardening.json`
- manifest：`backend/app/benchmarks/manifests/p0_ingestion_hardening.json`
- result schema：`backend/app/benchmarks/schemas.py`
- runner：`backend/app/benchmarks/runner.py`
- CLI run path：`backend/scripts/run_pack_benchmark_scaffold.py`

### 3.2 目前 benchmark case 類型

P0-0 先只建立支撐 P0-B 的最小 baseline：
- `saas_pack`
- `ecommerce_pack`
- `media_creator_pack`
- `professional_services_pack`
- `online_education_pack`
- `gaming_pack`

這六個 seed cases 的目的不是涵蓋所有問題型態，而是：
- 先為 Industry Batch 1 建立正式對照骨架
- 讓後續 hardening 能比較 pack selection、hint depth、contract readiness 是否變強

P0-C 之後，這份 baseline 也正式擴充到支撐 Batch 2：
- `manufacturing_pack`
- `healthcare_clinic_pack`
- `energy_pack`
- `health_supplements_pack`
- `funeral_services_pack`

P0-D 之後，這份 baseline 也正式擴充到 legal / finance contract-aware cases：
- `legal_risk_pack`
- `finance_fundraising_pack`
- 重點觀察：
  - target / selected domain packs
  - contract-aware evidence expectations
  - decision patterns
  - deliverable presets
  - readiness baseline

P0-E 之後，這份 baseline 也正式擴充到 operations / process-aware cases：
- `operations_pack`
- 必要時可與 `finance_fundraising_pack` 一起形成 sequencing / capacity 對照
- 重點觀察：
  - target / selected domain packs
  - process-aware evidence expectations
  - decision patterns
  - deliverable presets
  - readiness baseline

P0-F 之後，這份 baseline 也正式擴充到 deliverable-oriented hardening cases：
- `legal_risk_pack` / `finance_fundraising_pack` 的 clause bundle deliverable
- `operations_pack` 的 process issue deliverable
- 額外可觀察：
  - deliverable-oriented hardening markers
    - `bundle_density_policy_ready`
    - `support_bundle_summary_ready`
    - `artifact_readiness_summary_ready`

P0-G 之後，這份 baseline 也正式擴充到 ingestion-oriented hardening cases：
- scanned / image-like reference-only boundary
- table-heavy limited extract boundary
- 額外可觀察：
  - ingestion-oriented hardening markers
    - `reference_only_boundary_ready`
    - `limited_extract_boundary_ready`
    - `fallback_semantics_ready`

仍要維持的原則是：
- 一次只新增最小必要的 seed cases
- 不把 scaffold 膨脹成 full scoring platform

### 3.3 目前 formalized 的 result schema

每筆 benchmark result 至少表達：
- `case_id`
- target pack(s)
- input profile / material summary
- selected pack ids
- observed hint areas
- satisfied interface ids
- pack scores / signal counts
- observed ingestion markers
- structured observations
- pass / warn / fail status
- notes / regression markers

目前設計重點是：
- 先保留結構化 observation
- 不急著做重型總分平台

---

## 4. runner 與 runbook

### 4.1 最小可執行路徑

目前正式可執行路徑：

```bash
python3 backend/scripts/run_pack_benchmark_scaffold.py
```

或指定 manifest：

```bash
python3 backend/scripts/run_pack_benchmark_scaffold.py --manifest backend/app/benchmarks/manifests/p0_industry_batch1.json
python3 backend/scripts/run_pack_benchmark_scaffold.py --manifest backend/app/benchmarks/manifests/p0_industry_batch2.json
python3 backend/scripts/run_pack_benchmark_scaffold.py --manifest backend/app/benchmarks/manifests/p0_legal_finance_contract.json
python3 backend/scripts/run_pack_benchmark_scaffold.py --manifest backend/app/benchmarks/manifests/p0_operations_process.json
python3 backend/scripts/run_pack_benchmark_scaffold.py --manifest backend/app/benchmarks/manifests/p0_deliverable_hardening.json
python3 backend/scripts/run_pack_benchmark_scaffold.py --manifest backend/app/benchmarks/manifests/p0_ingestion_hardening.json
```

### 4.2 pytest baseline

目前也有最小 pytest baseline：

```bash
.venv312/bin/python -m pytest backend/tests/test_benchmark_scaffolding.py -q
```

這一條的責任是：
- 驗證 manifest 結構
- 驗證 seed case 覆蓋
- 驗證 runner 至少可對目前 pack stack 執行

### 4.3 何時更新

可更新時機：
- Industry Batch 1 / Batch 2 的正式 seed case 範圍變動
- 需要新增新的 hardening baseline 類別
- result schema 需要正式擴充

不應更新時機：
- 單純 UI wording 調整
- 尚未 shipped / 尚未驗證的臨時想法
- 只因為想把 benchmark 做得更大，卻沒有明確 hardening 需求

---

## 5. 與 P0-B 的關係

P0-B `Industry Packs Batch 1` 應直接重用這份 baseline。

也就是說：
- 先保留這六個 seed cases 作為 before state
- 再觀察 P0-B 之後 pack selection、contract readiness、hint depth 是否更強

這是下一階段 hardening 的正式起點，不是等到最後才補做的事。
