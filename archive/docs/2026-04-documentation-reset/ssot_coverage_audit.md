# SSOT Coverage Audit

> 狀態：2026-04 SSOT audit
>
> 本文件用於檢查 pre-reset 舊治理文件在新 6 份 SSOT 文件中的覆蓋情況，確認這次收斂不是為了瘦身而瘦身，而是維持或提升未來新任務 / 新 session 的可讀性與一致性。

---

## 1. Audit Scope

本次 audit 檢查下列舊文件是否已被有效吸收：

- `00_project_vision.md`
- `01_problem_statement.md`
- `02_product_scope.md`
- `03_system_overview.md`
- `04_ontology_core.md`
- `05_agent_architecture.md`
- `06_system_architecture.md`
- `07_implementation_order.md`
- `08_codex_handoff.md`
- `09_infinite_pro_core_definition.md`
- `10_frontend_information_architecture_and_ux_principles.md`
- `11_intake_storage_architecture.md`
- `12_runtime_persistence_and_release_integrity.md`
- `13_system_provider_settings_and_credentials.md`
- `14_workbench_ui_ux_operating_principles.md`
- `15_page_level_ui_inventory_and_flow_rules.md`
- `16_qa_matrix.md`
- `17_operational_ontology_deepen_program.md`
- `18_benchmark_scaffolding_baseline.md`
- `19_current_product_state_review_and_next_phase_decision_memo.md`
- `.impeccable.md`

新的 SSOT 集合是：

- `docs/00_product_definition_and_current_state.md`
- `docs/01_runtime_architecture_and_data_contracts.md`
- `docs/02_host_agents_packs_and_extension_system.md`
- `docs/03_workbench_ux_and_page_spec.md`
- `docs/04_qa_matrix.md`
- `docs/05_benchmark_and_regression.md`

---

## 2. Audit Standard

本次 audit 的標準不是「字句有沒有搬過去」，而是：

1. 重要且必要的 active 治理資訊是否仍存在
2. 該資訊是否落在正確的 SSOT 文件裡
3. 是否有資訊被錯誤降階成 archive / research 才看得到
4. 是否有重複資訊被合理收斂，而不是直接消失

---

## 3. Global Conclusion

整體結論：

- **沒有發現重要且必要的 active 治理資訊因收斂而消失。**
- 新 6 份文件已能承接未來新任務 / 新 session 所需的主要產品、runtime、extension、UX、QA、benchmark 規則。
- 本次 audit 過程中另外補回了數項原先還不夠明確的內容：
  - ontology 設計原則與 core relationships
  - output governance baseline
  - matter-scoped canonicalization 規則
  - minimum production-like boundary
  - research depth levels 與 research handoff boundary
  - management surface layout rules
  - `.impeccable.md` 的 active design posture 吸收進 `docs/03`
  - core use cases、long-term product shape、single-user vs later system layer 的高層定義

保留在 archive / research、而未進 SSOT 的內容，屬於：

- 歷史性演進敘事
- 已完成 program / sprint / wave 文本
- 外部對照研究材料
- 已被 present-tense SSOT 吸收的重複段落

---

## 4. Coverage Checklist By Legacy Doc

### `00_project_vision.md`

重要內容：

- 正式產品定位
- 高層願景
- 核心產品原則
- 正式能力邊界
- 長期產品形態
- 單人版與多人系統層界線

新家：

- `docs/00_product_definition_and_current_state.md`

狀態：

- 已覆蓋

### `01_problem_statement.md`

重要內容：

- 顧問工作問題定義
- 工具鏈割裂 / shared world model 缺口 / orchestration 缺口 / deliverable 缺口
- 為什麼需要 ontology / Host / packs / workbench

新家：

- `docs/00_product_definition_and_current_state.md`

狀態：

- 已覆蓋

### `02_product_scope.md`

重要內容：

- full-scope by capability
- formal product boundary
- core use cases
- in-scope / out-of-scope

新家：

- `docs/00_product_definition_and_current_state.md`

狀態：

- 已覆蓋

### `03_system_overview.md`

重要內容：

- 六層架構白話解釋
- 系統主要工作面
- 正式系統流
- 為何不是 generic AI workspace

新家：

- `docs/00_product_definition_and_current_state.md`
- `docs/01_runtime_architecture_and_data_contracts.md`
- `docs/03_workbench_ux_and_page_spec.md`

狀態：

- 已覆蓋

### `04_ontology_core.md`

重要內容：

- ontology role
- objects / supporting objects / links
- ontology 主鏈
- intake / continuity / deliverable 約束
- deeper identity bridge

新家：

- `docs/01_runtime_architecture_and_data_contracts.md`

狀態：

- 已覆蓋

### `05_agent_architecture.md`

重要內容：

- Host responsibilities
- reasoning / specialist families
- capability / pack / agent boundary
- Agent Spec / Registry / Resolver
- research direction

新家：

- `docs/02_host_agents_packs_and_extension_system.md`

狀態：

- 已覆蓋

### `06_system_architecture.md`

重要內容：

- 六層架構
- cross-cutting concerns
- Pack System 治理
- Extension Manager 位置
- formal system flow

新家：

- `docs/00_product_definition_and_current_state.md`
- `docs/01_runtime_architecture_and_data_contracts.md`
- `docs/02_host_agents_packs_and_extension_system.md`

狀態：

- 已覆蓋

### `07_implementation_order.md`

重要內容：

- phased by implementation order
- implementation-order 與 capability boundary 的區別
- stack / repo shape / validation posture

新家：

- `docs/00_product_definition_and_current_state.md`
- `docs/01_runtime_architecture_and_data_contracts.md`

狀態：

- 已覆蓋

### `08_codex_handoff.md`

重要內容：

- 給 agent 的正式前提
- active reading order
- runtime / workspace / pack / agent / provider 施工指引

新家：

- `AGENTS.md`
- `docs/02_host_agents_packs_and_extension_system.md`
- `docs/01_runtime_architecture_and_data_contracts.md`

狀態：

- 已覆蓋

### `09_infinite_pro_core_definition.md`

重要內容：

- 核心產品前提
- ontology / Host / packs / deliverable / UX 的正式角色
- output governance

新家：

- `docs/00_product_definition_and_current_state.md`
- `docs/01_runtime_architecture_and_data_contracts.md`

狀態：

- 已覆蓋

### `10_frontend_information_architecture_and_ux_principles.md`

重要內容：

- 工作面分工
- 主導覽
- page roles
- 中文化規則
- high-level UX acceptance

新家：

- `docs/03_workbench_ux_and_page_spec.md`

狀態：

- 已覆蓋

### `11_intake_storage_architecture.md`

重要內容：

- canonical intake pipeline
- source / artifact ingestion
- format support levels
- retention / purge
- storage boundaries

新家：

- `docs/01_runtime_architecture_and_data_contracts.md`

狀態：

- 已覆蓋

### `12_runtime_persistence_and_release_integrity.md`

重要內容：

- revision / version / publish / artifact 分層
- matter remote-first
- deliverable fail-closed
- degraded mode / re-sync
- continuity / writeback rules

新家：

- `docs/01_runtime_architecture_and_data_contracts.md`

狀態：

- 已覆蓋

### `13_system_provider_settings_and_credentials.md`

重要內容：

- provider boundary
- secret boundary
- validation / fail-closed rules
- provider maturity
- runtime precedence

新家：

- `docs/01_runtime_architecture_and_data_contracts.md`

狀態：

- 已覆蓋

### `14_workbench_ui_ux_operating_principles.md`

重要內容：

- first-screen rules
- one primary action
- progressive disclosure
- consultant-first / debug-on-demand
- management page principles

新家：

- `docs/03_workbench_ux_and_page_spec.md`

狀態：

- 已覆蓋

### `15_page_level_ui_inventory_and_flow_rules.md`

重要內容：

- page-level first-screen content
- primary / secondary actions
- cross-page jumps
- page-level acceptance logic

新家：

- `docs/03_workbench_ux_and_page_spec.md`

狀態：

- 已覆蓋

### `16_qa_matrix.md`

重要內容：

- living shipped verification history

新家：

- `docs/04_qa_matrix.md`

狀態：

- 已覆蓋，且完整保留

### `17_operational_ontology_deepen_program.md`

重要內容：

- deepen wave framing
- hard rules
- docs-code lockstep
- completed wave baseline
- P0 closure context

新家：

- active decision 結論進入 `docs/00_product_definition_and_current_state.md`
- 其餘歷史 program 細節保留在 archive

狀態：

- active 必要資訊已覆蓋
- 歷史性施工文本保留在 archive，屬刻意降階，不屬缺失

### `18_benchmark_scaffolding_baseline.md`

重要內容：

- benchmark docs baseline
- manifests
- result schema
- runner / runbook
- gate policy

新家：

- `docs/05_benchmark_and_regression.md`

狀態：

- 已覆蓋，且完整保留

### `19_current_product_state_review_and_next_phase_decision_memo.md`

重要內容：

- current state review
- fit assessment
- Palantir alignment
- current gaps
- next phase decision

新家：

- `docs/00_product_definition_and_current_state.md`

狀態：

- 已覆蓋

### `.impeccable.md`

重要內容：

- brand personality
- aesthetic direction
- typography
- light / dark posture
- accessibility posture

新家：

- `docs/03_workbench_ux_and_page_spec.md`

狀態：

- active 必要資訊已覆蓋
- 原檔改存 archive 歷史參考

---

## 5. Residual Risks

本次 audit 後，剩餘風險主要不是內容消失，而是：

- 新 SSOT 已大幅收斂，未來若有人只更新 archive 文檔而不更新新 6 份文件，會重新製造分叉
- `AGENTS.md` 與 `README.md` 現在已切到新入口，但未來若人工改回舊閱讀順序，也會破壞 SSOT
- 若未來 UI / runtime 行為改動，卻沒有同步更新 `docs/03` 或 `docs/01`，新 SSOT 仍可能失真

因此真正的維護規則應是：

> 未來所有正式更新，只更新新 6 份 SSOT 文件；archive 與 research 只作歷史保存，不再作產品真相來源。
