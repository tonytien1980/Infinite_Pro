# 00 Product Definition and Current State

> 文件狀態：Active source of truth
>
> 本文件是 Infinite Pro 目前的最高層 active 產品文件。它用現在已 shipped、已 hardening、已與程式碼對齊的產品現況，重新定義產品定位、能力邊界、適配案型、當前缺口與目前階段決策。

---

## 1. Purpose

本文件回答：

1. Infinite Pro 現在到底是什麼產品
2. 它的正式能力邊界在哪裡
3. 現在已正式成立的能力是什麼
4. 它目前最適合承接哪幾類顧問工作
5. 這個階段之後不該再怎麼做

本文件不處理細部 runtime schema、page-level UI 規格或 QA append-only 證據。這些分別由 `docs/01_runtime_architecture_and_data_contracts.md`、`docs/03_workbench_ux_and_page_spec.md`、`docs/04_qa_matrix.md` / `docs/05_benchmark_and_regression.md` 承接。

---

## 2. Formal Product Identity

Infinite Pro 的正式定位仍然是：

> **Single-Consultant Full-Scope Edition**

正式規劃原則仍然是：

- full-scope by capability
- phased by implementation order
- single-user first
- multi-user later

正式理解是：

- 產品能力邊界從一開始就承接單一顧問的完整工作世界
- 技術落地可以分波，但不能以縮小版產品重新定義產品
- multi-user、multi-consultant、multi-tenant 與 enterprise governance 是後續 system layer，不是產品定義本身

### 2.1 Commercial posture

Infinite Pro 的正式商業定位也應一起理解為：

- 它不是優先拿去賣給大型企業的 SaaS shell
- 它首先是顧問公司內部的 consulting intelligence system
- 顧問公司真正賣的是顧問服務；Infinite Pro 是把顧問團隊產能、穩定度與複利做大的內部系統
- 一位高階顧問單獨使用時，也必須已經非常強；團隊共享 intelligence 是加成，不是替代
- 多位顧問使用同一套系統，不等於多位顧問必須共同處理同一案件；更常見的正式使用姿態是：
  - 每位顧問各自辦自己的案件
  - 系統再把不同案件留下的 precedent / memory / feedback / writeback 累積成共享 intelligence

---

## 3. What Infinite Pro Is and Is Not

Infinite Pro 不是：

- 顧問訓練平台
- generic chatbot wrapper
- prompt-packaging utility
- generic enterprise admin console
- 預設先往 enterprise SaaS shell 走的產品
- 幾條 specialist flow 拼成的工具集合
- benchmark / ontology / trace metadata 為主體的控制台

Infinite Pro 是：

- ontology-first consulting workbench
- Host-orchestrated decision system
- evidence-linked, deliverable-centric 顧問工作底座
- 一套已正式承接單人顧問完整能力邊界的工作台產品
- 一套可讓顧問公司把多位顧問的工作經驗逐步沉澱成共享 intelligence 的內部系統

這個產品的中心不是「更多頁面」或「更多模型能力」，而是：

> 在同一套案件世界中，把 intake、evidence、decision、deliverable、history 與 continuity 串成可正式運作的顧問工作主鏈。

---

## 4. Full-Scope Capability Boundary

### 4.1 Client stages

- `創業階段`
- `制度化階段`
- `規模化階段`

### 4.2 Client types

- 中小企業
- 個人品牌與服務
- 自媒體
- 大型企業

### 4.3 Consulting domains

- 營運
- 財務
- 法務
- 行銷
- 銷售
- 募資
- 以及其他可擴充顧問面向

### 4.4 Consulting capabilities

- Diagnose / Assess
- Decide / Converge
- Review / Challenge
- Synthesize / Brief
- Restructure / Reframe
- Plan / Roadmap
- Scenario comparison
- Risk surfacing
- Deliverable shaping

正式規則：

- 這些能力已屬正式產品邊界
- implementation order 不得被誤讀成 capability boundary reduction

---

## 5. Formal Architecture Boundary

Infinite Pro 的正式主架構仍然只有六層：

1. Ontology Layer
2. Context Layer
3. Capability Layer
4. Agent Layer
5. Pack Layer
6. Workbench / UI Layer

Cross-cutting 正式責任包括：

- canonical intake
- source ingestion
- evidence / provenance
- persistence / history
- traceability
- provider abstraction
- deliverable-centric outputs

正式規則：

- 不得新增第七層架構
- 不得把既有 layer 降回「之後再補」

---

## 6. Core Use Cases

Infinite Pro 目前正式承接的核心使用情境包括：

- 案件與決策工作
  - 客戶需求理解
  - 問題 framing
  - 決策比較與收斂
  - 風險辨識
  - 行動規劃
- 審閱與挑戰工作
  - 合約審閱
  - 提案審閱
  - 制度文件審閱
  - 財務或募資材料審閱
  - 策略與執行假設挑戰
- 研究與整理工作
  - 市場研究整理
  - 會議材料整理
  - 跨來源資訊綜整
  - decision brief 形成
- 重組與交付工作
  - 文件重構
  - 提案重組
  - decision memo
  - roadmap / action plan
  - 顧問交付物整理

---

## 7. Long-Term Product Shape

Infinite Pro 的長期形態不是單一工具頁面，而是一套 object-aware、workflow-aware、deliverable-aware 的 consulting workbench。

更精確地說，它的正式長期形態應同時包含兩層：

- `案件 Digital Twin`
  - 每個案件在系統內都有同一條 object-aware 的正式工作世界
- `顧問判斷力的 AI Digital Twin`
  - 系統會逐步把顧問們留下的 precedent、memory、playbook、template 與 feedback 沉澱成另一個會成長的顧問大腦

正式規則：

- 案件層的 Digital Twin 是 `CaseWorld / Evidence / Deliverable / Writeback`
- 系統層的 Digital Twin 不是某個模型人格，而是整套 Host + reusable intelligence + feedback loop 長出來的 shared brain
- 「AI 大腦進化」在這個產品裡，正式是 system-level intelligence 的進化，不等於 API 模型權重自己學會你的顧問方法

它的正式工作面現在應理解為：

- intake surface
- matter / engagement workspace
- decision workspace
- artifact / evidence workspace
- deliverable workspace
- management surfaces
- history surface
- system settings

正式規則：

- workbench 應圍繞 object chain 與 decision flow 展開
- 不可退回 generic AI workspace、consumer app 或 admin-first shell

---

## 8. Single-User Boundary vs Later System Layers

目前正式屬於產品邊界的包括：

- ontology-first object model
- Host orchestration
- multiple agents
- Pack Layer
- consulting workbench UI
- source / evidence / history / traceability
- provider abstraction
- continuity / writeback baseline

後續 system layer 才處理的包括：

- login / auth
- RBAC
- 多顧問協作
- 多公司同步與隔離
- multi-tenant governance
- enterprise admin console
- per-user credential management

正式規則：

- single-user first 不是縮水版產品
- multi-user later 不是現階段產品定義
- 在正式 multi-user / collaboration shell 尚未成立前，shared intelligence accumulation 仍可先成立
- 也就是：
  - 很多顧問各自辦案
  - 系統共用一個逐步成長的 intelligence 底座
  - 這和「多人一起辦同一案」不是同一件事

---

## 9. What Is Formally Established Now

截至目前 shipped baseline，以下能力已正式成立：

### 6.1 World-first case chain

- `canonical intake pipeline -> CaseWorldDraft -> CaseWorldState` 已成立
- `Task` 已重新定位為 world 內的 work slice
- follow-up supplements 應先更新同一個案件世界，再決定 task / evidence / deliverable 變化

### 6.2 Host-led orchestration

- Host 是唯一 orchestration center
- Host 正式承接 task framing、decision framing、workflow selection、readiness governance、research trigger、agent routing、deliverable shaping 與 continuity control
- Agent Registry / Resolver 已是正式 runtime 骨架，不是概念補充

### 6.3 Evidence and provenance

- `Artifact / SourceMaterial / Evidence` 已有正式 workspace
- sufficiency、high-impact gaps、research provenance 與 deliverable limitations 已可回看
- `ChunkObject / MediaReference / retrieval provenance` 已是正式支撐鏈 baseline

### 6.4 Pack contracts

- 8 個 Domain / Functional Packs 與 11 個 Industry Packs 已全部形成正式單人版基線
- required-property gate、interface ids、rule binding ids、scored selection 已形成正式 contract baseline
- pack 已能正式影響 readiness、decision framing、deliverable shaping 與 resolver behavior

### 6.5 Object-aware deliverables

- `Deliverable Workspace` 已是正式工作面
- deliverable revision、rollback、version event、publish / artifact record 已是正式 runtime 邊界
- object-set advanced views 已存在，但保持低噪音
- minimal adoption-feedback foundation 已開始成立：
  - 先從 `deliverable` 與 `recommendation` 物件收 explicit human feedback
  - 這是 precedent / reusable intelligence 的前置地基，不等於 precedent 系統已完成
- precedent / reusable intelligence 第一輪也已開始成立：
  - 先以 `precedent candidate pool` 的形式保存可重用候選
  - 第一波只從已被 explicit adoption feedback 標記的 `deliverable` / `recommendation` 形成候選
  - 目標是先記住「什麼值得下次重用」，不是直接把舊案全文複製到新案
  - 目前也已開始進入 first managed pass：
    - candidate 可升格成 `promoted`
    - candidate / promoted 可先轉成 `dismissed`
    - `dismissed` 可再列回 `candidate`
  - 目前 precedent review 也已補上低風險建議排序：
    - 集中回看仍留在既有 `history` family
    - 先用 `建議先看 / 可安排下一輪 / 先放背景` 排出 review 順序
    - 只是在說「先看哪個候選」，不是在做黑箱品質評分
  - 目前也已補上第一波 Host-safe reference：
    - Host 可在 task framing / review / deliverable shaping 時，安全參考少量 precedent patterns
    - precedent 只會以 pattern context 進入模型邊界，不會直接把舊案正文灌回主線
    - task / deliverable 也可低噪音回讀 Host 正在參考哪些既有模式
  - 目前也已補上同案 duplicate governance：
    - 先只處理同一案件世界裡很像的 precedent candidates
    - `/history` precedent family 可標記確認同一模式、保留分開或拆成不同模式
    - Host reference 在未人工處理前也會先預設去重，避免把同一組模式重複帶進模型
  - 目前也已補上第一批真正可重用的 consultant asset：
    - 先以 `reusable review lenses` 的形式成立
    - Host 會先從 precedent reference、pack decision patterns、pack common risks 與 task heuristics 收斂少量 review lenses
    - 目前先用在 review / analysis ordering，不直接複製舊案內容，也不等於 common risk library 或 deliverable template
    - `task / deliverable` 工作面已可低噪音回讀 `這輪先看哪幾點`
  - 目前也已補上第二批 reusable consultant asset：
    - `common risk libraries` 已開始成立
    - Host 會先從 precedent-derived risk patterns、pack common risks 與 task heuristics 收斂少量 common risk watchouts
    - 目前先用在風險掃描提醒，不等於正式風險判定，也不等於 risk dashboard
    - `task / deliverable` 工作面已可低噪音回讀 `這類案件常漏哪些風險`
  - 目前也已補上第三批 reusable consultant asset：
    - `deliverable shape hints` 已開始成立
    - Host 會先從 precedent deliverable pattern、pack deliverable presets 與 task heuristics 收斂較穩的交付骨架
    - 目前先用在交付收斂提示，不等於模板 auto-apply，也不等於 deliverable library
    - `task / deliverable` 工作面已可低噪音回讀 `這份交付物通常怎麼收比較穩`
  - 目前也已補上第一版 `deliverable templates`：
    - Host 會先把 precedent deliverable pattern、pack deliverable presets、deliverable shape、domain playbook 與 task heuristics 收斂成模板主線提示
    - 目前先用在 `task / deliverable` 的 second-layer reading 與 model-router prompt boundary
    - 它是在提示 `這份交付比較適合沿用哪種模板主線`，不是模板後台，也不是 auto-apply
  - 目前也已補上第一版 `domain playbooks`：
    - Host 會先把 research / continuity / pack / precedent / heuristic signals 收斂成這類案件較穩的工作主線
    - 目前先用在 `matter / task` 的 second-layer reading 與 model-router prompt boundary
    - 它是在提示 `這類案子通常怎麼走`，不是 checklist shell，也不是 playbook library
  - 但仍不做自動 retrieval、auto-apply、playbook library 或 precedent dashboard

### 6.6 Continuity and writeback

- `one_off / follow_up / continuous` 已是正式 continuity lanes
- `minimal / milestone / full` 已是正式 writeback depth
- `DecisionRecord / ActionPlan / ActionExecution / OutcomeRecord / AuditEvent` 已在正式主鏈內
- `continuous` 現已開始進入 retained advisory MVP：
  - `continuation_surface` 會正式回出 health signal
  - `continuation_surface` 會正式回出 low-noise timeline items
  - `continuation_surface` 會正式回出 next-step queue
  - `matter workspace` 仍是主控面
  - `task / deliverable / evidence` 也已開始用共用 focus summary 對齊 continuity 首屏語言
  - `matter / task / deliverable / evidence` 也已開始用共用 detail helper 對齊第二層 continuity 閱讀順序
  - 但整體仍不做成 dashboard shell

### 6.7 Regression discipline

- Wave 0 到 Wave 5 deepen baseline 已全部成立
- `P0-0` 到 `P0-H` hardening / extension baseline 已全部成立
- full regression suite 已存在，且不作為新的產品層

### 6.8 First flagship workflow productization

- sparse-start / low-information matters 現已進入第一輪旗艦流程產品化
- consultant-facing intake 現可先用「先快速看清問題與下一步 / 先審閱手上已有材料 / 先比較方案並收斂決策」等工作語言起手，再映射到既有 runtime path
- `diagnostic_start / material_review_start / decision_convergence_start` 現已作為 consultant-facing derived lane baseline 出現在 task / matter read model 與核心工作面首屏
- 這條 lane 是既有 runtime signals 的衍生讀取契約，不是新的架構層，也不是新的 ontology world
- 其中 `material_review_start` 目前也開始往 document-heavy review workflow 深化，而不再只是 derived label

### 6.9 First flagship workflow deepening

- flagship lane 不只會標示目前屬於哪種起手姿態，現在也會進一步說明：
  - 目前交付等級
  - 目前輸出邊界
  - 下一個升級目標
  - 升級還缺什麼
- 這讓 sparse-start matters 不只停在「知道自己在哪條路」，而是開始具備「知道現在最多能交到哪裡、要往下一階段補什麼」的正式工作引導
- `material_review_start` 也開始具備更清楚的 review-first posture：
  - 這輪主要在審哪份核心材料
  - 目前更像 review memo / assessment，還不是最終決策版本
  - 若要升級成 decision / action deliverable，下一步應補什麼
- flagship lane 現在也開始有第二層共用閱讀：
  - `matter / evidence` 可直接用同一套旗艦閱讀 helper 回答「這條主線現在怎麼讀」
  - `task / deliverable` 則把同一套旗艦閱讀放在較低噪音的 detail / disclosure 區塊
  - 讓不同工作面不再各自重寫 lane 文案，而是沿用同一條「姿態 / 交付等級 / 邊界 / 升級目標 / 升級條件」閱讀骨架

---

## 10. What The Product Is Good At Now

Infinite Pro 目前最強的，不是「任何事情都能做」，而是以下這條能力帶：

- 接住 sparse inquiry 或 multi-source matter
- 先形成正式案件世界
- 再把 evidence、risk、recommendation、action 與 deliverable 收斂進同一條 object chain
- 最後讓顧問能回看、補件、延續與正式交付

以顧問工作來看，目前最適合承接的案型包括：

- decision memo / diagnostic brief
- contract / obligation / risk review
- operations / process remediation
- finance / fundraising / capital framing
- 需要 evidence-linked deliverable 的研究、整理與收斂工作

目前最能放大顧問效率的地方包括：

- 讓 intake 不再是一次性對話，而是可延續的案件世界
- 讓 follow-up 補件不再把脈絡打散
- 讓交付物不是聊天回覆，而是有 lineage、有支撐、有回鏈的正式成果物

---

## 11. Product Fit Assessment

### 8.1 Best-fit usage

目前最適合的是：

- 單一顧問主導
- document-heavy
- decision-heavy
- deliverable-heavy
- 需要持續補件與回看的 advisory work

### 8.2 Current maturity by stage

- `創業階段`：成熟度高
- `制度化階段`：成熟度高
- `規模化階段`：能力邊界已納入，但若需要 enterprise-grade collaboration / security / governance，仍未到位

### 8.3 Current maturity by client type

- 中小企業、個人品牌與服務、自媒體、founder-led professional services：最適合
- 大型企業：適合作為單一顧問在大型企業案件中的工作台，不適合作為 enterprise platform shell

### 8.4 Current maturity by domain

相對最成熟的面向是：

- 營運
- 法務 / 風險
- 財務 / 募資
- 研究 / 綜整
- decision convergence
- document restructuring

---

## 12. Current Gaps

### 9.1 Product-level gaps

- 前 3 條產品主線已經從「只有方向」收成「可用的單人顧問工作台 baseline」：
  - 旗艦顧問案型已有 `sparse-intake diagnostic`、`document-heavy review`、`continuous advisory` 三條主線
  - flagship workflows 已補到 second-layer shared reading，而不只停在 first-screen lane summary
  - `Research / Investigation` 已補到 final-mile reading，能更完整回答來源品質、新鮮度、矛盾訊號、citation-ready handoff 與缺口收斂
  - retained advisory 已補到單人版 MVP，能在 `follow_up / continuous` 下回答 checkpoint、timeline、health、next step 與 review rhythm
- 但這三條主線目前仍主要停在「當下這案怎麼做得更清楚」，尚未進入「做過一次之後，下一案能不能更聰明」的 precedent / reusable intelligence 層
- precedent / reusable intelligence 已開始進入 first pass：
  - explicit adoption signal 也已不再只停在 status-only foundation：
    - 現在除了 `adopted / needs_revision / not_adopted / template_candidate`
    - 也開始補上低負擔的 structured reason signal
    - 目的是讓系統不只知道有沒有被採用，也更知道為什麼
  - 正式理解也應維持：
    - Infinite Pro 的第一輪產出本來就應該夠強
    - 人類回饋的角色是把已經不錯的產出再推向更成熟的顧問品質
    - 它不是讓人類替系統補破網或救火
    - 這些回饋若要被系統吸收，也應盡量以低負擔、低壓力、保有人類自尊的方式完成
  - 目前先成立 `precedent candidate pool`
  - 目前也已補上 first managed pass 的基本治理：
    - `candidate`
    - `promoted`
    - `dismissed`
  - 目前也已補上集中回看 surface：
    - precedent candidates 可在既有 `history` family 集中回看
    - 可依狀態與類型做低噪音篩選
    - 也已補上輕量 ranking / suggested order，先把仍待決且採納訊號較強的候選排在前面
  - 目前也已進入第一波 Host-safe reference：
    - 先用少量 precedent patterns 輔助 framing / review / deliverable shaping
    - 不直接搬舊案內容，也不做 auto-apply
  - 目前也已補上同案 duplicate governance：
    - 先只整理同一 matter 內的 duplicate precedent candidates
    - raw candidates 不會被靜默刪除
    - Host reference 預設只取每組 duplicate 的代表 candidate，除非顧問明確標記保留分開
  - 目前也已開始成立第一波 reusable assets：
    - `reusable review lenses` 已正式進入產品層
    - 先由 Host 把 precedent / pack / heuristic signals 收斂成 2 到 4 個 review lenses
    - 這層目前先用在 `task / deliverable` 的 second-layer reading 與 model-router prompt boundary
    - 它是在幫顧問排「先看哪幾點」，不是在自動套模板或輸出結論
    - `common risk libraries` 也已正式進入產品層
    - 先由 Host 把 precedent-derived risk patterns、pack common risks 與 task heuristics 收斂成 2 到 4 個 common risk watchouts
    - 這層目前先用在 `task / deliverable` 的 second-layer reading 與 model-router prompt boundary
    - 它是在提醒「這類案件常漏哪些風險」，不是在直接判定這案已發生哪些風險
    - `deliverable shape hints` 也已正式進入產品層
    - 先由 Host 把 precedent deliverable pattern、pack deliverable presets 與 task heuristics 收斂成較穩的交付骨架
    - 這層目前先用在 `task / deliverable` 的 second-layer reading 與 model-router prompt boundary
    - 它是在提示「這份交付物怎麼收比較穩」，不是在直接套模板或複製舊案交付物
    - `deliverable templates` 也已開始進入產品層
    - 先由 Host 把 precedent / pack / shape / playbook / heuristic signals 收斂成模板主線、core sections 與 optional sections
    - 這層目前先用在 `task / deliverable` 的 second-layer reading 與 model-router prompt boundary
    - 它是在提示「這份交付比較適合沿用哪一型模板」，不是在開 template library 或直接套模板
    - `domain playbooks` 也已開始進入產品層
    - 先由 Host 把 flagship / research / continuity / pack / precedent / heuristic signals 收斂成較穩的工作主線
    - 這層目前先用在 `matter / task` 的 second-layer reading 與 model-router prompt boundary
    - 它是在提示「這類案子通常怎麼走、這輪目前在哪一步、下一步通常接什麼」，不是在開 checklist shell 或 playbook library
  - 目前也開始進入 reason-coded precedent governance：
    - 系統不只知道某個 precedent 是否被採用
    - 也開始知道它是因為交付結構、判斷方式、行動模式，或其他可重用原因被保留
    - 這個訊號目前先用在 precedent review lane、Host-safe reference，以及 reusable assets 的 precedent routing
    - 也就是 review lenses / common risk / deliverable shape 會開始分清楚：哪種 precedent 更適合幫哪一種 reusable asset
    - 仍不做 auto-apply
  - 目前也開始補上 feedback -> optimization loop 的第一刀：
    - precedent review 與 Host-safe reference 現在不只知道某筆模式為什麼被保留
    - 也開始知道它對哪種 reusable asset 最有幫助、參考強度大概多高
    - 這層目前先用在 review 排序細化、Host-safe reference explainability，以及 reusable asset 後續優化地基
  - 目前也開始補上 shared intelligence evolution rules v1：
    - precedent review 與 Host-safe reference 現在開始區分這筆模式仍偏個別經驗、已開始形成共享模式，或已接近共享模式
    - 系統也開始回答這筆模式目前應提高參考、先持平觀察，還是降低參考
    - 第一波只用既有 precedent rows、reason codes、candidate status 與 operator attribution 收斂這個訊號
    - 這層目前先用在 review / reference 的排序細化與 explainability，不做顯性資歷分級，也不把 UI 做成權重控制台
    - 目前也已開始補上 `shared-intelligence stability weighting v1`：
      - 系統除了共享成熟度與權重趨勢，也開始區分這筆模式是否已站穩共享模式、仍在觀察，或只是剛恢復觀察
      - Host 在 reusable asset source ordering 時，現在可優先吃穩定共享模式，而不把剛恢復觀察的模式和穩定模式混成同一層
      - 這層目前先用在 precedent review / reference explainability 與 reusable asset 排序，不做 stability dashboard
  - 目前也開始補上 shared-intelligence weighting v1：
    - review lenses、common risks、domain playbooks 與 deliverable templates 現在開始優先使用 shared-intelligence 較成熟的 precedent
    - 若已有非 downweight precedent，可先不讓 downweight precedent 影響這輪 reusable asset 收斂
    - 這層目前先影響 Host 的 reusable-asset assembly，不新增新頁面，也不做黑箱全域 routing
  - 目前也開始補上 shared-intelligence governance recommendation v1：
    - precedent review lane 現在會正式回答這筆候選比較像：
      - 可考慮升格
      - 先留在候選
      - 可考慮降回候選
      - 可考慮退場
    - 這層只提供治理建議與動作排序，不會自動改 candidate 狀態
    - UI 仍維持低噪音，不做治理後台或 consultant ranking
  - 目前也開始補上 shared-intelligence promotion / decay application v1：
    - `/history` precedent review lane 現在可直接一鍵套用系統治理建議
    - 第一波只處理明確建議的 `升格 / 降回候選 / 退場`
    - `先留在候選 / 維持正式模式 / 維持停用` 這類建議仍只顯示，不會硬套
    - 這層仍是人工確認後才套用，不做自動 mutation
  - 目前也開始補上 shared-intelligence promotion / decay rules v2：
    - source feedback 更新後，既有 precedent candidate row 不應被粗暴刪除
    - 若既有 `candidate` 遇到 `not_adopted`，第一波先衰退成 `dismissed`
    - 若既有 `promoted` 遇到 `not_adopted`，第一波先衰退回 `candidate`
    - 若既有 `dismissed` 之後又收到新的正向採納回饋，第一波可恢復回 `candidate`
    - 若既有 `promoted` 只是收到新的正向 feedback 更新，第一波不應被重設回 `candidate`
    - 這層是在補 feedback-driven lifecycle preservation，不是背景 auto-governance job
  - 目前也開始補上 team-attributed governance v1：
    - 採納回饋與 precedent 治理現在可開始記錄是由哪位顧問做了這次判斷
    - 第一波只用 browser-local 顧問署名，不做 auth / account shell
    - 這層目前先用在 feedback、candidate 與 history family 的低噪音 attribution，不把單人使用流程變重
  - 仍未進入 playbook library 或 template auto-apply
  - 這一輪重點仍是先把 explicit adoption signal 轉成可回看的候選資產，再用最小治理把候選池維持乾淨
- client profile / organization memory、domain playbooks、deliverable templates 都還未進入完整成熟產品層
  - 但第一版 `matter-scoped organization memory` 已開始補上：
    - 先不做跨客戶 profile library
    - 先讓同一案件世界裡的穩定背景、已知限制與延續主線可被 Host 與工作面低噪音回讀
  - 目前也已開始補上 `cross-matter organization memory v2`：
    - 先只整理同客戶、且名稱高度相近的其他案件摘要
    - 先讓 Host 與工作面知道：這個客戶還有哪些相近案件留下了穩定背景
    - 仍不做 CRM shell，也不把舊案正文直接回灌新案
    - 目前也開始補上 `shared source lifecycle filtering v1`：
      - cross-matter organization memory 現在會先區分這批跨案件背景目前可直接當穩定背景，還是先留作背景參考
    - 目前也開始補上 `cross-matter organization memory freshness v1`：
      - system 會先讀出跨案件背景目前是最近更新、近期可參考，還是較舊背景
      - 偏舊背景會先留在背景參考層，不急著抬成這輪主線依據
    - 目前也開始補上 `shared-source refresh / reactivation v1`：
      - 若較新的同客戶背景又回來，system 會更明確回答這批 shared source 可重新拉回前景
      - 偏舊背景仍保留，但會留在背景參考層
    - 目前也開始補上 `organization-memory lifecycle posture v1`：
      - organization memory 現在也會正式回答這輪跨案件背景更接近 `前景 / 平衡 / 背景 / 偏薄` 哪一種姿態
      - 這讓 Host、prompt 與前端 second-layer 對這批背景的讀法開始和 playbook / template 使用同一套 contract
  - `domain playbooks` 也已開始有第一版：
    - 先不做獨立 playbook library
    - 先讓同類案件的工作主線可被 Host 與工作面低噪音回讀
  - 目前也已開始補上 `domain playbooks v2`：
    - 主線不只會回答這類案子通常怎麼走，也開始回答這輪為何適用、主要由哪些來源組合收斂
    - 這一層已開始吸收 cross-matter organization memory，但仍由 Host 收斂成 prompt-safe guidance
    - 仍不做 checklist shell 或 playbook library
    - 目前也開始補上 `shared source lifecycle filtering v1`：
      - 若 precedent / cross-matter organization memory 仍偏背景參考，playbook 會先把它們降成背景校正，不讓較弱的 shared source 過早主導整條工作主線
    - 目前也開始補上 `shared source authority gating v1`：
      - 若這輪只有背景校正等級的 shared source，playbook 會更誠實地維持在 fallback，而不是假裝已經有足夠強的 shared guidance
    - 目前也開始補上 `shared-source freshness / retirement v1`：
      - playbook 現在會更正式回答 shared source 是近期仍可直接參考，還是已偏舊 / 仍在恢復
      - 若這輪只剩偏舊或恢復中的 shared source，它們會先退到背景，不再假裝仍可站在主線最前面
    - 目前也開始補上 `shared-source refresh / reactivation v1`：
      - 若較新的 shared source 已回來，playbook 會更明確回答這輪可重新讓 shared guidance 站前面
      - 偏舊來源仍保留在背景校正層，不再和剛回來的來源混成同一層
    - 目前也開始補上 `feedback-linked shared-source reactivation v1`：
      - 若新的 precedent 採納回饋已站穩，playbook 會更明確指出是這筆 feedback 把 shared guidance 拉回前景
    - 目前也開始補上 `feedback-linked shared-source decay v1`：
      - 若最新 precedent 回饋仍是需要改寫，playbook 會更明確指出這筆 feedback 讓 shared guidance 先退到背景觀察
    - 目前也開始補上 `feedback-linked shared-source recovery balancing v1`：
      - 若同一輪同時存在新的正向 precedent feedback 與需要退背景的負向 precedent feedback，playbook 會先收成一條更一致的平衡判斷
      - system 會更明確回答「哪些 shared source 可回前景、哪些仍留背景」，而不是把兩句互相打架的訊號直接並排丟給顧問
    - 目前也開始補上 `shared-source lifecycle posture v1`：
      - playbook 現在會正式回答這輪 shared source 是 `前景 / 平衡 / 背景 / 偏薄` 哪一種姿態
      - 這讓 Host、prompt 與前端 second-layer 不必各自猜同一套 lifecycle 狀態
  - `deliverable templates` 也已開始有第一版：
    - 先不做 template library
    - 先讓交付模板主線可被 Host 與工作面低噪音回讀
  - 目前也已開始補上 `deliverable templates v2`：
    - 模板主線不只會回答這份交付像哪一型模板，也開始回答這輪為何適用、主要由哪些來源組合收斂
    - 這一層已開始正式吸收 deliverable shape 與 richer domain playbook signal
    - 仍不做 template library、template picker 或 auto-apply
    - 目前也開始補上 `shared source lifecycle filtering v1`：
      - 若 precedent 仍偏 recovering / background-only，template guidance 會先把它當背景校正，不讓它直接覆蓋較穩的 pack / shape / heuristic 模板主線
    - 目前也開始補上 `shared source authority gating v1`：
      - 若這輪模板只剩 background-only precedent，template guidance 會維持 fallback，不把這種薄 shared source 誤寫成已足夠主導模板主線
    - 目前也開始補上 `shared-source freshness / retirement v1`：
      - template 現在也會更正式回答 shared source 是近期可直接沿用，還是已偏舊 / 仍在恢復
      - 若這輪模板只剩偏舊或恢復中的 shared source，它們會先退到背景，讓較新的 pack / shape / heuristic 站前面
    - 目前也開始補上 `shared-source refresh / reactivation v1`：
      - 若較新的 shared source 已回來，template 會更明確回答這輪可重新讓模板主線站前面
      - 偏舊來源仍保留在背景校正層，不再和剛回來的來源混成同一層
    - 目前也開始補上 `feedback-linked shared-source reactivation v1`：
      - 若新的 precedent 採納回饋或範本候選訊號已站穩，template 會更明確指出是這筆 feedback 把模板主線拉回前景
    - 目前也開始補上 `feedback-linked shared-source decay v1`：
      - 若最新 precedent 回饋仍是需要改寫，template 會更明確指出這筆 feedback 讓模板主線先退到背景觀察
    - 目前也開始補上 `feedback-linked shared-source recovery balancing v1`：
      - 若同一輪同時存在新的正向 precedent feedback 與需要退背景的負向 precedent feedback，template 會先收成一條更一致的平衡判斷
      - system 會更明確回答「哪些模板來源可重新站前面、哪些仍留背景」，而不是把兩句互相打架的訊號直接並排丟給顧問
    - 目前也開始補上 `shared-source lifecycle posture v1`：
      - template 現在會正式回答這輪 shared source 是 `前景 / 平衡 / 背景 / 偏薄` 哪一種姿態
      - 這讓 Host、prompt 與前端 second-layer 不必各自猜同一套 lifecycle 狀態
  - 目前也開始補上 `shared-intelligence closure review v1`：
    - `/history` precedent family 現在會正式回一份低噪音 closure review
    - 它會回答第 4 階段哪些 shared-intelligence contract 已站穩、現在接近哪種收尾狀態、還剩哪些 completion-pass gap
    - 這層是收尾 read model，不是新的治理後台或 phase dashboard shell
  - 目前也開始補上 `shared-intelligence asset closure audit v1`：
    - closure review 不再只說「還剩 review lens / common risk / deliverable shape 的 audit」
    - system 現在也會正式列出這三個 asset family 的 audit 狀態，讓第 4 階段更接近 sign-off
  - 目前也開始補上 `phase-4 sign-off / next-phase handoff v1`：
    - 當 duplicate 整理已收斂、closure review 已達 `ready_to_close`，顧問可在既有 `/history` precedent family 內正式收口 phase 4
    - 收口後 system 會正式回出下一階段 handoff，而不是只停在「接近可收口」

### 9.2 System-layer gaps

- multi-user / RBAC / multi-tenant governance
- enterprise-grade dynamic security / ABAC / marking
- production-grade object storage serving / purge jobs / conflict merge
- OCR-heavy ingestion、`.pptx`、壓縮包
- external secret manager 等級的 secret posture

### 9.3 Bridge / compatibility notes

- `CaseWorldState` 與 legacy `task_id` references 仍共存
- catalog agent 與 runtime binding 未必文字 1:1
- 部分 legacy deliverable rows 的 newer summary contract backfill 不完整

正式規則：

- 這些 bridge notes 應誠實標示
- 不可被誤寫成已 fully world-native 或 fully enterprise-ready

---

## 13. Alignment With Palantir

Infinite Pro 現在已與 Palantir 對齊在：

- ontology 作為 operational layer，而非靜態 schema
- object-first / workbench-first，而非 chat-first
- writeback、approval、audit、history 作為同一責任鏈
- object set、provenance、required-property gate、canonicalization 作為可執行 contract

Infinite Pro 目前沒有也不應硬對齊於：

- dynamic security / ABAC shell
- full branching / migration framework
- OSDK ecosystem / marketplace
- object explorer / graph shell / enterprise admin shell
- large-scale compute / indexing / throughput governance

正式結論：

> Infinite Pro 已與 Palantir 對齊在方法論內核與能力骨架，而不是 enterprise platform 外殼。

---

## 14. Current Phase Decision

目前階段的正式結論是：

- Wave 0 到 Wave 5 deepen baseline 已完成
- `P0-0` 到 `P0-H` hardening line 已完成
- `P0 hardening line is formally closed`
- 不應再開 `P0-I`
- 下一輪工作不應從 further baseline extension 啟動，而應從新的 decision phase 啟動
- 旗艦顧問案型、`Research / Investigation` lane、retained advisory loop 這三條主線，現在都已有可用 baseline / MVP，不應再被描述成只停在初始方向
- 第 4 階段 `precedent / reusable intelligence` 已透過 closure review、asset audit、sign-off / handoff 正式收口
- 第 5 階段 `Single-Firm Cloud Foundation` 已透過 closure review、sign-off 與 next-phase handoff 正式收口
- 目前正式狀態已不是：
  - `phase-5 implementation in progress`
  - `single-firm cloud foundation, slice 1 standing`
- 目前正式狀態應理解為：
  - `phase 5 shipped and signed off`
  - `phase-6 decision framing begins`
- 因此此刻不應先把重心轉成：
  - multi-tenant SaaS shell
  - enterprise governance shell
  - 多人共編同一案件的 collaboration shell
- 下一個正式問題不再是「能不能讓顧問公司上雲使用」，而是：
  - 這套已會累積 shared intelligence 的系統，怎麼在長期演化時仍然維持全面型顧問公司的能力邊界
  - 怎麼避免因近期高頻案型、局部成功模式或顧問風格而越學越偏
  - 怎麼把 shared intelligence 從「會記住經驗」推進成「可治理、可泛化、可觀測的全面型顧問能力底座」

---

## 15. Recommended Next Phase Directions

下一階段的正式方向應理解為：

- `Phase 6: Generalist Consulting Intelligence Governance`

如果只看現在最該優先的，正式答案也是：

- `Generalist Consulting Intelligence Governance`

它的核心目標不是讓 Infinite Pro 更專，而是讓它：

- 在持續學習時不偏科
- 在 shared intelligence 持續累積時仍然維持 full-scope by capability
- 在多位顧問各自辦案後，仍然保有全面型顧問公司的能力結構

因此它此刻真正要解的正式問題應理解為：

1. `coverage`
   - shared intelligence 目前覆蓋了哪些 client stages / client types / consulting domains /案件型態
2. `anti-drift`
   - 哪些 reusable intelligence 雖然高頻，卻未必代表高品質或可泛化
3. `reuse boundary`
   - 哪些 precedent / playbook / template 可跨情境泛化，哪些只能局部適用
4. `generalist posture`
   - system 目前仍像全面型顧問公司的 shared brain，還是已開始被高頻案型拉偏

不是：

- 先做 multi-tenant SaaS shell
- 先做 enterprise RBAC matrix
- 先做多人共編同一案件 collaboration shell
- 先做 consultant ranking / training platform
- 先做垂直案型 specialization program

目前進度補充：

- 旗艦顧問案型產品化已完成目前這一輪 completeness pass：
  - `sparse-intake diagnostic lane`
  - `document-heavy review lane`
  - `continuous advisory lane` baseline
  - `matter / evidence` 可直接回讀 second-layer flagship reading
  - `task / deliverable` 也可在低噪音 detail / disclosure 內沿用同一套旗艦閱讀
- `Research / Investigation` 已完成目前這一輪 final-mile 對齊：
  - guidance contract 已能正式回答研究深度、優先子題、來源品質、新鮮度、矛盾訊號、citation-ready handoff 與缺口收斂
  - `matter / task / evidence / deliverable` 也已開始用共用 second-layer helper 對齊研究閱讀
  - 但仍維持 low-noise、沒有額外 research console
- retained advisory loop 已完成目前這一輪單人版 MVP：
  - `one_off / follow_up / continuous` 的首屏心智已分清
  - `follow_up` 已補上 checkpoint timeline 與回來更新節奏
  - `continuous` 已補上 health / timeline / next-step / outcome / review rhythm
  - `matter / task / deliverable / evidence` 已開始用共通 advisory helper 對齊 continuity 的第一層與第二層閱讀
- 因此前 3 條主線現在已不再是最優先缺口；真正新的產品增益點會落在：
  - 讓一位高階顧問單獨使用時就非常強
  - 讓好做法能被記住
  - 讓下一案能重用過去的顧問判斷資產
  - 讓不同顧問各自辦案後留下的經驗，逐步沉澱成共享 intelligence
- 第 4 階段的這層 shared intelligence foundation 現在已足以支撐下一步往 cloud identity / access foundation 前進
- 因此第 5 階段不是在推翻 single-user-first 的產品定義，而是在正式啟動：
  - `multi-user later` 的 single-firm 第一版落地
  - 再之後才讓大型客戶與明確團隊化有更穩的治理底座
- 目前已正式落地的 phase-5 slice 包括：
  - `Google Login` auth foundation
  - `User / Firm / Membership / Invite / Session` 基礎資料模型
  - `owner / consultant / demo` 的最小角色與 backend permission gate
  - `Members` 管理頁
  - consultant-facing `/login` 與 owner-facing `/members`
- 但 phase-5 第二個 slice 已進到 backend API foundation：
  - encrypted `PersonalProviderCredential`
  - firm-scoped `ProviderAllowlistEntry`
  - owner / consultant 已有 personal-provider / provider-allowlist backend route
  - task run / extension draft synthesis 已開始吃 current-member-aware provider resolution
  - consultant 缺少個人 key 時，run path 已 fail-closed
  - `/settings` 已正式拆成 `Firm Settings` 與 `Personal Provider Settings`
  - owner 現在可在 UI 內管理 provider allowlist
- 因此 phase 5 目前最明確的下一個 slice 應理解為：
  - `demo workspace isolation`
  - 這一刀現在也已正式落地：
    - demo 只進 `/demo`
    - demo 只讀固定 sample dataset
    - demo 不可讀正式 firm workspace
    - owner 可在 `/members` 看到 demo 帳號數量與待接受邀請數
- demo 之後，後續三條較輕的主線固定按這個順序往下走：
  1. `owner controls deepen`
  2. `demo polish`
  3. `firm operating surfaces`
- 其中第一條 `owner controls deepen` 現在也已正式 shipped：
  - owner 可撤回 pending invite
  - owner 可在 `Firm Settings` 讀寫 demo workspace policy
  - `/members` 與 `Firm Settings` 已形成 single-firm owner control 的最小分工
- 其中第二條 `demo polish` 現在也已正式 shipped：
  - `/demo` 已不再只是 raw section list
  - backend 已正式回出 guided demo narrative contract
  - frontend 已補成 guided hero、showcase highlights、read-only rules 與 formal-workspace explainer
- 其中第三條 `firm operating surfaces` 現在也已正式開始落地：
  - `總覽` 已補上 role-aware 的 `firm operating snapshot`
  - owner / consultant 一進首頁就能低噪音看到目前 firm 是否已準備好工作
  - 這一刀仍留在既有首頁，不新增 `/firm` 或 `/ops` 管理頁
- 現在 phase 5 的 `completion pass / closure review` 也已正式 shipped：
  - backend 已有 `phase-5 closure review` read model
  - `總覽` 已補上第 5 階段收尾狀態
  - system 現在可以正式回答 phase 5 做到哪、還剩什麼
- 現在 phase 5 的 `sign-off / next-phase handoff` 也已正式 shipped：
  - owner 已可在既有首頁總覽內正式收口 phase 5
  - system 會正式回出 `signed_off` 狀態、下一階段標籤與 handoff 摘要
  - 第 5 階段現在可正式視為已收口
- 因此現在最自然的下一步已不是再補 phase 5，而是：
  - `phase-6 generalist consulting intelligence governance`
- Phase 6 第一個最合理的施工 slice 應是：
  - `capability coverage and anti-drift audit v1`
- 也就是先讓 system 正式回答：
  - 哪些能力區塊已站穩
  - 哪些區塊過重
  - 哪些區塊偏薄
  - 哪些 reusable assets 屬於可泛化、局部適用或窄情境適用
- 這個第一個 slice 現在也已正式開始落地：
  - backend 已有 `phase-6 capability coverage audit` read model
  - `總覽` 已補上一塊 low-noise `Generalist Governance`
  - system 已能正式回讀 coverage / anti-drift / reuse-boundary 的第一版 posture
- 這條線現在也已往前推到第二刀：
  - `reuse-boundary governance v1`
  - system 已能更正式回答哪些 reusable assets 可擴大重用、哪些只能局部參考、哪些不應被擴大套用

---

## 16. Explicit Non-Goals

下一階段明確不是：

- 顧問訓練平台
- generic enterprise admin console
- 新 deepen wave
- `P0-I`
- benchmark dashboard-first 平台化
- OCR / 文件處理平台化
- 先做 multi-user shell 再回頭找產品主線

---

## 17. Relationship To Other Active Docs

- `docs/01_runtime_architecture_and_data_contracts.md`
  承接 runtime shape、persistence、ingestion、provider 與 bridge semantics
- `docs/02_host_agents_packs_and_extension_system.md`
  承接 Host / agents / packs / extension system
- `docs/03_workbench_ux_and_page_spec.md`
  承接 workbench surfaces、page roles、page-level UX 規格
- `docs/04_qa_matrix.md`
  承接 shipped verification evidence
- `docs/05_benchmark_and_regression.md`
  承接 regression / benchmark baseline
