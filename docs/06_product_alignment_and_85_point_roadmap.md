# 06 Product Alignment and 85-Point Roadmap

> 文件狀態：Active source of truth
>
> 本文件把 Infinite Pro 的正式產品想像、目前已對齊的實作現況、主要缺口，以及後續要把整體成熟度拉到平均 85 分以上的補強順序，收成下一階段唯一可 handoff 的對齊文件。

---

## 1. Purpose

本文件回答：

1. 創辦人對 Infinite Pro 的正式產品想像是什麼
2. 目前文件、程式與 QA 證據已對齊到哪裡
3. 哪些地方已達標、哪些只部分達成、哪些仍明顯不足
4. 若目標是把整體產品成熟度拉到平均 `85` 分以上，應該先補什麼、後補什麼
5. 下一個新對話 / 新 session 不應該如何誤解方向

本文件不是：

- runtime schema 文件
- page-level UX 規格
- QA append-only history
- benchmark manifest 說明書

這些分別由 `docs/01_runtime_architecture_and_data_contracts.md`、`docs/03_workbench_ux_and_page_spec.md`、`docs/04_qa_matrix.md`、`docs/05_benchmark_and_regression.md` 承接。

---

## 2. Canonical Product Vision

Infinite Pro 的正式產品想像應理解為：

- 以 `Palantir ontology` 方法論啟發的 consulting intelligence system
- ontology-first、object-first、workbench-first，而不是 chat-first
- 一套能承接單一顧問完整工作世界的分析與交付工作台
- 一套最終應可被顧問公司作為內部 operating system 的產品，而不是 generic SaaS shell

它應同時能承接：

- client stages
  - 創業階段
  - 制度化階段
  - 規模化階段
- client types
  - 中小型企業
  - 大型公司或集團
  - 個人品牌或服務
  - 自媒體
- consulting domains
  - 營運
  - 財務
  - 商務
  - 法務
  - 行銷
  - 銷售
  - 綜合策略
- matter types
  - 一次性報告
  - 可持續深化案件

它的最終成熟形態不應只是：

- 幫高階顧問加速的工具
- 若干 specialist flows 的集合
- 單純會記錄 precedent 的知識庫

它最終應是：

- 初階到高階顧問都能實際使用的 consulting workbench
- 會接收 feedback
- 會逐步改善 reusable intelligence
- 會讓整間顧問公司越用越強、但不因高頻案型而偏科

---

## 3. Planning Scorecard

以下分數是目前的 `planning-grade alignment score`。

正式理解：

- 這不是 benchmark 分數
- 不是 runtime evaluator 輸出
- 是根據 active docs、repo code、當前測試與 shipped evidence 做出的產品成熟度判讀

| 項目 | 目標 | 目前分數 | 判讀 |
| --- | --- | ---: | --- |
| A | ontology-first 顧問分析工具 | 85 | 大方向已成立 |
| B | 支援創業 / 制度化 / 規模化 | 70 | 邊界成立，深度不平均 |
| C | 適用中小企業 / 大企業 / 個人品牌 / 自媒體 | 68 | 邊界成立，覆蓋證據仍薄 |
| D | 覆蓋營運 / 財務 / 商務 / 法務 / 行銷 / 銷售 / 策略 | 65 | 架構可承接，等深度能力未完成 |
| E | 支援一次性報告與持續深化案件 | 84 | 已有正式 baseline，接近達標 |
| F | 成熟產品度 | 60 | 骨架很強，但仍未達成熟產品感 |
| G | 初階到高階顧問都能輕易使用 | 52 | low-noise workbench 已有，但 experience layer 明顯不足 |
| H | 接收回饋與自我優化 | 58 | feedback / governance foundation 已有，但真正 adaptive runtime 仍不足 |

---

## 4. What Is Already True Now

截至目前，以下敘述可視為正式成立：

### 4.1 Product and runtime spine

- Infinite Pro 已是 ontology-first consulting workbench，不是 generic chatbot wrapper
- world-first 主鏈已成立：
  - canonical intake
  - CaseWorldDraft
  - CaseWorldState
  - Task / Evidence / Deliverable / History / Continuity
- shared intelligence baseline 已成立：
  - precedent
  - organization memory
  - domain playbook
  - deliverable template
  - feedback / writeback / closure review

### 4.2 Workbench and cloud foundation

- `Phase 5` single-firm cloud foundation 已正式 shipped and signed off
- Google Login、single-firm membership、owner / consultant / demo 邊界已成立
- demo workspace isolation、owner controls、firm operating snapshot 已成立

### 4.3 Phase 6 governance layer

- `Phase 6: Generalist Consulting Intelligence Governance` 已不是空白方向
- capability coverage / anti-drift / reuse-boundary / guidance posture / calibration / weighting / completion review / sign-off / closeout review 都已進 code
- 首頁既有 `Generalist Governance` 已能低噪音回讀 phase-6 主線狀態
- task / matter / deliverable 也已能回讀 condensed `Phase 6` second-layer note
- `7.1` 的第一刀也已開始正式落地：
  - task / matter / deliverable work-surface 讀到的 `guidance / confidence / calibration / weighting`
  - 現在都已正式吃 `client_stage / client_type / domain_lenses / evidence_thickness / pack context`
  - 工作面層的 `7.1 completion pass` 已收口
  - phase-level governance 補強則留給後續 `7.15`
- `7.15` 也已開始正式落地：
  - 首頁 `Generalist Governance` 現在會先回答 phase posture、再回答工作面已落地到哪、最後回答下一刀還差什麼
  - phase-level `maturity / closure / completion / closeout` 也開始共用同一條 alignment 語意
  - 但這一刀仍只做 phase-level governance strengthening，不算 `7.2`
- `7.2` 的第一刀也已開始正式落地：
  - `completion review / checkpoint` 現在開始正式保存 explicit feedback-linked evidence snapshot
  - 但目前仍只先吃 `AdoptionFeedback` 與 candidate governance outcomes
  - 還沒有把 deliverable / outcome writeback evidence 一次做滿
- `7.2` 的第二刀目前也已開始正式落地：
  - feedback-linked scoring 開始正式區分 deliverable-linked evidence
  - `completion review / checkpoint` 現在也開始看 deliverable feedback / publish / deliverable-linked governed candidate
  - 但仍未進到 outcome / writeback scoring

---

## 5. What Must Not Be Overclaimed

以下幾點必須在後續所有對話中誠實維持，不能被高估。

### 5.1 Phase 6 is not yet a fully context-aware adaptive engine

`Phase 6` 已有正式 runtime route、schema、首頁摘要與 work-surface propagation。

但目前更準確的理解是：

- 已有 `generalist governance read layer`
- 已有 `low-noise work-surface guidance signals`
- 已有 `completion review / sign-off / closeout foundation`
- `7.1 case-aware runtime` 已在工作面層收口
- `7.15` 已把 phase-level governance summary 與 work-surface landed status 對齊
- 但 phase-level governance 仍不是 fully adaptive engine，也還不是 `7.2` 的 persisted scoring depth

尚未完全成立的是：

- 每個 task / matter 真正依其當下脈絡動態計算出不同治理判讀的成熟 adaptive layer

正式規則：

- 不可把目前 Phase 6 誤寫成 fully context-aware self-optimizing consultant brain
- 也不可把既有 read model 誤寫成完整 runtime intelligence engine

### 5.2 Completion review scoring is still foundation-level

目前 `completion review / persisted checkpoint / sign-off foundation` 已成立，而且 `7.2` 已開始往 deliverable-linked closeout depth 推進。

但它更準確的產品理解是：

- persisted checkpoint snapshot
- low-noise readiness readout
- owner sign-off foundation

不是：

- 成熟的 governance scoring engine
- 長期 evidence-weighted quality system

### 5.3 Full-scope boundary is established before equal-depth maturity

Infinite Pro 已正式承接：

- full-scope by capability
- full client-stage boundary
- broad client-type boundary
- broad consulting-domain boundary

但這不等於：

- 每個 stage / type / domain 都已經有同樣深度與同樣成熟度

正式規則：

- 可以宣告 full-scope product boundary 已成立
- 不可宣告每個面向都已 equally mature

### 5.4 Low-noise UX is not the same as junior-to-senior usability completion

目前已成立的是：

- consultant-first workbench
- low-noise copy
- no governance wall
- no training shell

尚未完成的是：

- 初階顧問自然不迷路
- 高階顧問自然感到高槓桿
- 同一套工作面對不同成熟度使用者都同樣順手

---

## 6. 85-Point Target State

若目標是把整體產品成熟度拉到平均 `85` 分以上，正式應理解為：

- A. ontology-first 核心維持並深化到 `88` 左右
- B. client-stage coverage 至少到 `85`
- C. client-type coverage 至少到 `83-85`
- D. consulting-domain breadth 至少到 `82-85`
- E. one-off / continuous dual-lane成熟度到 `88`
- F. product maturity 至少到 `82-85`
- G. consultant usability 至少到 `80-85`
- H. feedback / self-optimization 至少到 `85`

這個 `85` 不是要求每一格都完美，而是要求：

- 沒有明顯短板拖累整體
- generalist posture 可被證明
- runtime intelligence 開始真的對案子有差異化作用
- 顧問實際用起來感覺成熟、可靠、可持續

---

## 7. Roadmap To 85

後續補強不可再用零碎 micro-slice 無限延長，而應集中到下列五條主線。

### 7.1 Priority 1: Case-aware governance runtime

目標：

- 把 `Phase 6` 從全域治理敘述，推進成真正會依案件脈絡變化的 runtime layer

正式應補：

- reusable guidance 依當前 `client_stage / client_type / domain_lens / evidence_thickness / pack context` 真正變動
- task / matter / deliverable 看到的 `guidance / reuse confidence / calibration / weighting` 不再只是固定全域輸出

完成判準：

- 同一類 reusable asset 在不同案件中可得到不同判讀
- second-layer phase-6 note 真正反映當前案件，而不是 phase-level 全域 posture
- Host 的 reusable ordering 能明確吃到 case-aware calibration

### 7.15 Inserted Pass: Phase-level governance strengthening

目標：

- 在 `7.1` 與 `7.2` 之間，把 phase-level `Phase 6` review layer 與已落地的 work-surface runtime 正式對齊

正式應補：

- 首頁 `Generalist Governance` 先回答 phase posture、再回答工作面 landed status、再回答 remaining next-step
- `maturity / closure / completion / closeout` 這幾條 phase-level route 共享一致的 alignment 語意
- 明確把 phase-level review、`7.1` landed runtime、以及 `7.2` pending scoring depth 分開

完成判準：

- phase-level route 不再像彼此分離的靜態治理摘要
- 首頁可以低噪音說清楚 `7.1` 已成立到哪、`7.2` 還差什麼
- 不新增 dashboard family，也不把這一刀誤寫成 `7.2`

### 7.2 Priority 2: Feedback-linked persisted scoring

目標：

- 把 feedback loop 從 foundation-level snapshot，推進成 evidence-linked persisted scoring

正式應補：

- reusable asset 是否被採用
- 是否被 override
- 是否真的幫到 deliverable / outcome
- 如何把這些 evidence 回寫到 persisted governance scoring

目前進度：

- 第一刀已正式吃到 explicit feedback 與 candidate governance outcomes
- 第二刀已開始正式吃到 deliverable-linked feedback / publish / governed candidate outcome
- 但 outcome / writeback evidence 仍未接滿

完成判準：

- checkpoint score 不再主要靠 heuristic 固定分數
- feedback-linked evidence 會影響 reusable asset posture
- completion review 可更誠實反映真正有效與無效的治理資產

### 7.3 Priority 3: Generalist coverage proof

目標：

- 把 `full-scope by capability` 從產品宣言，推進成有 benchmark / regression 證據支撐的 coverage posture

正式應補：

- client-stage coverage matrix
- client-type coverage matrix
- cross-domain representative cases
- one-off / follow-up / continuous representative cases

完成判準：

- 每一大類 client stage / type / domain 都至少有正式 seed cases
- regression baseline 可回答哪些區塊已穩、哪些偏薄
- 不再只能靠產品敘述說自己是 generalist system

### 7.4 Priority 4: Consultant usability layer

目標：

- 讓系統對不同成熟度顧問更可用，但不滑向 training platform

正式應補：

- clearer first action
- 更好的 explanation on demand
- more graceful progressive disclosure
- 更穩的低噪音 default + deeper layer when needed

完成判準：

- 初階顧問不會因第二層 guidance 而迷路
- 高階顧問不覺得系統過度吵雜或像教學平台
- 同一套 surface 能支撐不同成熟度而不分裂成 training shell

### 7.5 Priority 5: Product reliability and release discipline

目標：

- 把強骨架拉近成熟產品感

正式應補：

- browser smoke 的常態化
- live runtime verification runbook
- build / typecheck / local runtime separation 更清楚
- release / merge readiness discipline 更穩

完成判準：

- 不只 code 可 build，也能更常態地證明 app live runtime 可用
- shipped claim 與 QA evidence 更少落差
- 發版前的 readiness 不再主要靠人工印象

---

## 8. What We Should Not Do Next

為了避免方向漂移，後續工作明確不應優先做：

- 新的 note wording micro-slice
- 新的 governance dashboard family
- consultant ranking / seniority scoring
- training platform / onboarding shell
- multi-tenant shell
- collaboration-first shell
- enterprise admin console
- 只新增更多 read model，卻不把 runtime intelligence 做實

正式規則：

- 若一個新提案無法明顯推進 `7.1` 到 `7.5` 其中一條，就應先降優先級
- 若一個提案只會讓 system 更會描述自己，而不會真的更會工作，就不應視為高優先工作

---

## 9. How Future Sessions Must Use This Doc

下一個新對話或未來 session 若要繼續推 Infinite Pro，正式讀取順序應至少是：

1. `AGENTS.md`
2. `docs/00_product_definition_and_current_state.md`
3. `docs/06_product_alignment_and_85_point_roadmap.md`
4. 再視需要讀 `docs/01` 到 `docs/05`

未來對話若要提案、實作或盤點，必須先回答：

1. 這次工作在 A 到 H 的哪一格
2. 這次工作是在推進 `7.1` 到 `7.5` 哪一條主線
3. 它會把哪一格從多少分推到多少分
4. 它有沒有讓 system 更接近你要的全面型顧問 operating system，而不是只是更會自我描述

正式規則：

- 不可跳過本文件直接開始下一波新功能
- 不可把本文件視為 brainstorming memo；它是 active SSOT handoff
- 不可在未對照本文件前，把局部優化誤寫成產品主線進展

---

## 10. Relationship To Other Active Docs

- `docs/00_product_definition_and_current_state.md`
  承接產品正式身份、能力邊界、目前 phase 與 active product truth
- `docs/01_runtime_architecture_and_data_contracts.md`
  承接 runtime shape、provider boundary、bridge semantics 與 phase-level runtime contracts
- `docs/02_host_agents_packs_and_extension_system.md`
  承接 Host / agents / packs / extension governance
- `docs/03_workbench_ux_and_page_spec.md`
  承接 workbench surfaces、page family 與低噪音 UX 規則
- `docs/04_qa_matrix.md`
  承接 shipped verification evidence
- `docs/05_benchmark_and_regression.md`
  承接 coverage / regression scaffolding 與 seed-case baseline
