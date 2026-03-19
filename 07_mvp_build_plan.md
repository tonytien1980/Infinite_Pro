# 07_mvp_build_plan.md

> 文件狀態：Baseline v1.0（可作為 Codex 開發起點）
>
> 本文件用於把 AI Advisory OS V1 / MVP 的產品、Ontology、Agent 與系統架構，翻成可執行的建造順序、建議技術選型、repo 結構、階段目標與驗收標準，作為 Codex 開工時的施工藍圖。

---

## 1. 文件目的

這份文件回答的是：

1. V1 應該先做哪些東西，後做哪些東西？
2. Codex 應該用什麼技術組合開始實作？
3. repo 應該長什麼樣？
4. 每個階段的完成標準是什麼？
5. 哪些事情現在先不要碰，避免把 MVP 做爆？

這份文件是 **施工順序文件**，不是願景文件。

---

## 2. V1 的施工原則

V1 的任務不是把最終平台一次做完，而是先把「可運作的核心循環」蓋出來。

V1 的核心循環是：

> Task 建立 → 背景資料進入系統 → Host Agent 判斷流程 → Core / Specialist Agent 分析 → Recommendation / ActionItem / Deliverable 形成 → 任務歷史保存。

因此，Codex 的工作優先順序應該遵守：

1. 先做 **能跑通主流程** 的模組
2. 先做 **可驗證** 的版本，不做炫技版本
3. 先做 **結構化輸入與輸出**，不要只做聊天框
4. 先做 **單機 / Docker 可跑**，不先做複雜部署
5. 先做 **可擴充骨架**，不先做完整市場化平台

---

## 3. 建議技術選型（V1 預設）

### 3.1 前端
- **Next.js**
- **TypeScript**
- 建議使用 App Router

### 3.2 後端
- **Python**
- **FastAPI**

### 3.3 資料庫
- **PostgreSQL**

### 3.4 檔案儲存
- V1 開發期先以 **本機檔案系統** 或簡單 object storage 模擬
- metadata 存資料庫

### 3.5 模型層
- 建立 **internal model router abstraction**
- V1 先接 **1~2 家 provider** 即可

### 3.6 開發與啟動方式
- **Docker Compose**
- 前後端分服務
- DB 獨立服務

### 3.7 為什麼這樣選
這組合的目的不是最潮，而是：
- 好做
- 好維護
- 好讓 Codex 接手
- 能支撐 web app + agent orchestration + file handling

---

## 4. 建議 repo 結構

```text
repo-root/
  AGENTS.md
  README.md
  docker-compose.yml
  .env.example

  docs/
    00_project_vision.md
    01_problem_statement.md
    02_product_scope_v1.md
    03_system_overview.md
    04_ontology_core_v1.md
    05_agent_architecture_v1.md
    06_system_architecture_v1.md
    07_mvp_build_plan.md

  apps/
    web/
      # Next.js frontend

  services/
    api/
      # FastAPI backend

  packages/
    domain/
      # ontology/domain models
    agents/
      # host/core/specialist agent interfaces and configs
    model_router/
      # provider abstraction
    shared/
      # shared types / schemas / utilities

  storage/
    uploads/
      # local uploaded files for dev

  scripts/
    # dev scripts / seed / migrations helpers
```

如果你之後想用 monorepo，這個結構很適合。若不做 monorepo，也至少保持 docs / frontend / backend / domain / agents 的概念分離。

---

## 5. V1 實作分期

我建議 V1 不是一次開發，而是分成 6 個階段。

## Phase 1：專案骨架與基礎設施

### 目標
把 repo 與最基本運行環境搭起來。

### 要做的事
- 建立 repo 結構
- 建立 `AGENTS.md`
- 建立 `README.md`
- 建立 FastAPI skeleton
- 建立 Next.js skeleton
- 建立 PostgreSQL 連線
- 建立 Docker Compose
- 建立 `.env.example`

### 驗收標準
- `docker compose up` 能啟動基本服務
- 前端與後端都能跑
- 後端可健康檢查
- DB 連線正常

### 先不要做的事
- 不做完整功能
- 不做複雜 UI
- 不做真正 Agent 流程

---

## Phase 2：Task / Context / Evidence 基礎層

### 目標
先讓任務建立、背景輸入、檔案上傳、Evidence 進系統。

### 要做的事
- 實作 Task domain model
- 實作 TaskContext domain model
- 實作 Evidence domain model
- 建立 Task CRUD API
- 建立檔案上傳 API
- 建立 Evidence 建立與查詢 API
- 前端建立任務建立頁 / 任務詳情頁

### 驗收標準
- 使用者可以建立 Task
- 可以補 TaskContext
- 可以上傳檔案並掛到某個 Task
- 檔案 metadata 與 Evidence 可查詢
- UI 能看到該任務有哪些背景資料

### 先不要做的事
- 不做進階文件切片
- 不做複雜搜尋知識庫
- 不做完整 Agent

---

## Phase 3：Core Ontology Domain Models

### 目標
把 04 中的 12 類核心物件落成程式中的 domain models。

### V1 核心物件
- Task
- TaskContext
- Subject
- Goal
- Constraint
- Evidence
- Insight
- Risk
- Option
- Recommendation
- ActionItem
- Deliverable

### 要做的事
- 定義 Python domain models / schemas
- 定義 API input / output schemas
- 定義 persistence mapping
- 建立基本 object validation

### 驗收標準
- 核心物件可被建立與序列化
- 物件之間關聯可保存
- Deliverable / Recommendation / ActionItem 有結構化資料型態

### 先不要做的事
- 不做完整 graph database
- 不做複雜跨專案知識圖譜

---

## Phase 4：Specialist Flow 先跑通

### 目標
先用最簡單、最容易驗證的單點任務模式跑通端到端流程。

### 先做的 Specialist Agent
- Contract Review Agent
- Research Synthesis Agent
- Document Restructuring Agent

### 要做的事
- 建立 Agent interface
- 建立 Host Agent 最小版（只做任務判斷與 specialist 路由）
- 實作 3 個 Specialist Agent 的最小版
- 讓 Agent 輸出能轉成 Deliverable / Recommendation / Risk

### 驗收標準
- 合約審閱任務可以跑完
- 研究整理任務可以跑完
- 文件 / 提案重組任務可以跑完
- 結果不是聊天，而是結構化輸出
- 任務結果可保存與回看

### 為什麼先做這階段
因為單點任務流程比多 Agent 協作簡單，較快做出可用原型。

---

## Phase 5：Multi-Agent Flow 跑通

### 目標
把 Host Agent + 4 個 Core Analysis Agents 的主流程做出來。

### Core Agents
- Strategy / Business Analysis Agent
- Operations Agent
- Market / Research Insight Agent
- Risk / Challenge Agent

### 要做的事
- Host Agent 升級為 workflow orchestrator
- 加入 multi-agent flow 判斷
- 建立 Agent selection 邏輯
- 建立中介輸出（Insight / Risk / Option）
- 建立 Host 收斂邏輯
- 形成 Recommendation / ActionItem / Deliverable

### 驗收標準
- 複合型任務能完整跑完
- 4 個 Agent 的輸出有角色差異
- Host Agent 能做收斂
- 最終輸出為結構化成果

### 先不要做的事
- 不做超複雜 agent society
- 不做外部 agent market

---

## Phase 6：歷史保存、回看與可用性收尾

### 目標
讓系統不是一次性 demo，而是有可累積價值的內部工具。

### 要做的事
- 任務歷史列表
- 任務詳情頁
- 顯示背景資料 / evidence 引用
- 顯示 deliverable / recommendation / action items
- 基本錯誤與降級提示
- 基本 logging

### 驗收標準
- 使用者能回看舊任務
- 能看到舊任務的背景與成果
- 任務失敗時有清楚提示
- 系統開始具備「內部主力工具」感

---

## 6. 各階段的明確交付物

### Phase 1 交付物
- repo 骨架
- docker-compose
- frontend / backend skeleton
- DB 連線

### Phase 2 交付物
- Task / TaskContext / Evidence API
- 檔案上傳功能
- Task 基本 UI

### Phase 3 交付物
- 12 類 ontology domain models
- schema / validation
- persistence mapping

### Phase 4 交付物
- Host Agent 最小版
- 3 個 Specialist Agent 最小版
- Specialist Flow 可跑通

### Phase 5 交付物
- Host orchestration 升級版
- 4 個 Core Agents
- Multi-Agent Flow 可跑通

### Phase 6 交付物
- 任務歷史
- 結果回看
- 基本 logging / error handling

---

## 7. 各階段的驗證問題

每一階段都應回答一個核心問題。

### Phase 1
系統骨架能不能跑？

### Phase 2
真實背景資料能不能進系統？

### Phase 3
Ontology 能不能落地成可保存的工作物件？

### Phase 4
Specialist 任務能不能先變成可用工具？

### Phase 5
多 Agent 收斂是否真的比單一聊天更有價值？

### Phase 6
這套東西能不能開始作為內部主力工具使用？

---

## 8. V1 的開發限制

Codex 在 V1 開發時，應主動避免以下事情：

- 不要直接跳去做多租戶 SaaS
- 不要先做複雜權限系統
- 不要先做完整 Agent Market
- 不要先做 graph database 炫技
- 不要先做大規模知識庫平台
- 不要先做全自動高風險執行
- 不要把所有未來模組都先做出來

V1 的關鍵是：

> **把主流程做對，而不是把宇宙做滿。**

---

## 9. V1 的預設工程規則

### 9.1 小步提交
每一個 PR / commit 應盡量小而可驗證。

### 9.2 先 mock，後優化
某些 Agent 或 provider 可以先用簡化版 mock / stub，先讓流程跑通。

### 9.3 先結構化，後美化
先保證結果能以 Recommendation / ActionItem / Deliverable 保存，不先追求漂亮 UI。

### 9.4 先可用，後完美
先讓你真的能跑一個案子，再談進階優化。

---

## 10. 對 Codex 的直接指令原則

當你之後把這份交給 Codex 時，可以把它理解成：

- 先照 Phase 順序做
- 不可跳過 Task / Context / Evidence 基層
- 不可跳過 structured outputs
- 任何 Agent 都應輸出結構化物件
- Host Agent 必須先被實作成 orchestrator，不是普通分析器
- 所有複雜功能都應先問：這是 V1 必要嗎？

---

## 11. 濃縮版結論

V1 的施工順序應該是：

> **基礎環境 → 任務與背景 → Core Ontology → Specialist Flow → Multi-Agent Flow → 歷史保存與收尾**

這樣的順序最符合你現在已經定下來的產品方向，也最適合讓 Codex 接手。

---

## 12. 結語

這份文件的目的，是讓 AI Advisory OS 不只是有一套漂亮架構，而是真的有一條能被蓋出來的施工順序。

如果前面的 00～06 是在定義這座城市的願景、道路、建築規則，
那 07 就是在定：

> **第一期工程要先挖哪裡、先蓋哪裡、怎麼驗收、怎麼避免爛尾。**

先把第一個可用城市蓋起來，後面的宇宙才有辦法長。
