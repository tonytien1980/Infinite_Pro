# Documentation Reset Absorption Map

> 狀態：2026-04 documentation reset working map
>
> 本文件記錄本次文件重組後的新主幹文件樹、每份 active doc 的責任邊界，以及 legacy docs 吸收 / 封存 / stub 對照表。

---

## 1. New Active Documentation Tree

本次 reset 後，Infinite Pro 的 active docs 主幹如下：

```text
docs/
├── 00_product_definition_and_current_state.md
├── 01_runtime_architecture_and_data_contracts.md
├── 02_host_agents_packs_and_extension_system.md
├── 03_workbench_ux_and_page_spec.md
├── 04_qa_matrix.md
└── 05_benchmark_and_regression.md
```

補充：

- root-level `AGENTS.md` 保留為 agent operating guide
- root-level `README.md` 保留為 repo / runbook / verified-baseline 入口
- 原本的 `.impeccable.md` 設計上下文已被吸收進 `docs/03_workbench_ux_and_page_spec.md`，原檔改存為 archive 參考
- archive docs 移到 `archive/docs/2026-04-documentation-reset/`
- research docs 移到 `research/docs/`

---

## 2. Responsibility Boundaries

### `docs/00_product_definition_and_current_state.md`

責任：

- 正式產品定位
- 正式能力邊界
- 現在已形成的產品樣貌
- shipped baseline 的產品語言摘要
- product fit / non-goals / current phase decision

不承擔：

- 細部 runtime schema
- page-level UI inventory
- QA append-only evidence
- benchmark runner 細節

### `docs/01_runtime_architecture_and_data_contracts.md`

責任：

- ontology / case world / object chain
- canonical intake / storage / provenance / persistence / writeback / provider boundaries
- bridge / legacy / compatibility notes
- current runtime contract 與 fail-closed / degraded-mode semantics

不承擔：

- 高層產品敘事
- agent catalog 細節
- page-first UX 規格

### `docs/02_host_agents_packs_and_extension_system.md`

責任：

- Host orchestration
- agent families / registry / resolver / runtime realization
- pack layer / pack contracts / extension manager
- capability / pack / agent 邊界

不承擔：

- 完整 runtime storage / persistence contract
- page-first UX spec
- QA / benchmark 歷史

### `docs/03_workbench_ux_and_page_spec.md`

責任：

- workbench IA
- page roles / page-level first-screen rules
- detail workspace reading order
- page transitions / primary action hierarchy
- Traditional Chinese product copy posture
- 吸收後的 visual / interaction rules

不承擔：

- backend schema
- provider contract
- agent / pack runtime internals beyond user-facing visibility rules

### `docs/04_qa_matrix.md`

責任：

- 單一 living QA history
- build / typecheck / smoke / benchmark evidence

### `docs/05_benchmark_and_regression.md`

責任：

- benchmark / regression suite baseline
- manifest family
- gate modes
- runner / runbook

### `archive/docs/2026-04-documentation-reset/`

責任：

- 保留 pre-reset 治理文件與完成階段文檔
- 提供歷史對照，不再作為 active source of truth

### `research/docs/`

責任：

- 保留 gap analysis、外部研究、對照材料
- 不作為正式產品邊界 source of truth

---

## 3. Legacy-To-New Absorption Table

| Legacy file | New home / role | Disposition |
| --- | --- | --- |
| `docs/00_project_vision.md` | `docs/00_product_definition_and_current_state.md` | archive then remove |
| `docs/01_problem_statement.md` | `docs/00_product_definition_and_current_state.md` | archive then remove |
| `docs/02_product_scope.md` | `docs/00_product_definition_and_current_state.md` | archive then remove |
| `docs/03_system_overview.md` | `docs/00_product_definition_and_current_state.md` and `docs/01_runtime_architecture_and_data_contracts.md` | archive then remove |
| `docs/04_ontology_core.md` | `docs/01_runtime_architecture_and_data_contracts.md` | archive then remove |
| `docs/05_agent_architecture.md` | `docs/02_host_agents_packs_and_extension_system.md` | archive then remove |
| `docs/06_system_architecture.md` | `docs/01_runtime_architecture_and_data_contracts.md` and `docs/02_host_agents_packs_and_extension_system.md` | archive then remove |
| `docs/07_implementation_order.md` | `docs/00_product_definition_and_current_state.md` and reset history only | archive then remove |
| `docs/08_codex_handoff.md` | `docs/02_host_agents_packs_and_extension_system.md` and `AGENTS.md` | archive then remove |
| `docs/09_infinite_pro_core_definition.md` | `docs/00_product_definition_and_current_state.md` | archive then remove |
| `docs/10_frontend_information_architecture_and_ux_principles.md` | `docs/03_workbench_ux_and_page_spec.md` | archive then remove |
| `docs/11_intake_storage_architecture.md` | `docs/01_runtime_architecture_and_data_contracts.md` | archive then remove |
| `docs/12_runtime_persistence_and_release_integrity.md` | `docs/01_runtime_architecture_and_data_contracts.md` | archive then remove |
| `docs/13_system_provider_settings_and_credentials.md` | `docs/01_runtime_architecture_and_data_contracts.md` | archive then remove |
| `docs/14_workbench_ui_ux_operating_principles.md` | `docs/03_workbench_ux_and_page_spec.md` | archive then remove |
| `docs/15_page_level_ui_inventory_and_flow_rules.md` | `docs/03_workbench_ux_and_page_spec.md` | archive then remove |
| `docs/16_qa_matrix.md` | `docs/04_qa_matrix.md` | quality move then remove |
| `docs/17_operational_ontology_deepen_program.md` | archive only | archive + stub |
| `docs/18_benchmark_scaffolding_baseline.md` | `docs/05_benchmark_and_regression.md` | quality move then remove |
| `docs/19_current_product_state_review_and_next_phase_decision_memo.md` | `docs/00_product_definition_and_current_state.md` | archive then remove |
| `docs/infinite_pro_gap_map.md` | `research/docs/infinite_pro_gap_map.md` | research move then remove |
| `docs/Palantir Ontology 如何運作與顧問工作分析系統承接設計報告.pdf` | `research/docs/...` | research move |
| `.impeccable.md` | absorbed into `docs/03_workbench_ux_and_page_spec.md`; archived as design context history | archive |

---

## 4. Reading Order After Reset

新的正式閱讀入口應改為：

1. `AGENTS.md`
2. `docs/00_product_definition_and_current_state.md`
3. `docs/01_runtime_architecture_and_data_contracts.md`
4. `docs/02_host_agents_packs_and_extension_system.md`
5. `docs/03_workbench_ux_and_page_spec.md`
6. `docs/04_qa_matrix.md` when verifying shipped behavior
7. `docs/05_benchmark_and_regression.md` when verifying regression / benchmark paths

research / archive docs 只在需要歷史背景或外部對照時再讀。
