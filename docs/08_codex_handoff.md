# 08_codex_handoff.md

> 文件狀態：Baseline v1.0（可直接提供給 Codex 作為開發交接文件）
>
> 本文件用於把 AI Advisory OS V1 / MVP 目前已確認的產品方向、系統邊界、技術選型、施工順序與實作規則，濃縮成一份可直接交給 Codex 的 handoff 文件。

---

## 1. 這份文件是拿來幹嘛的

這份文件不是再重講願景。

它的任務是：

> **讓 Codex 一進 repo，就知道這個專案現在處於哪個階段、先做什麼、不要做什麼、怎麼做才不會走歪。**

如果前面的 00～07 是：
- 產品與系統定義
- 架構與規格設計
- 施工順序規劃

那 08 就是：

> **給 Codex 的實作交接指令文件。**

---

## 2. 專案目前狀態

### 2.1 工作名稱
- `AI Advisory OS`

### 2.2 目前階段
- **MVP / V1**

### 2.3 目前定位
- 顧問服務業內部使用的個人工具台
- 以複雜商業問題收斂為主體
- 單點 Specialist 任務為輔
- 先驗證平台核心，不驗證所有未來擴張

### 2.4 目前核心原則
- Ontology 是共享世界模型
- Host Agent 是流程中樞
- Core Agents 提供多視角分析
- Specialist Agents 提供單點能力
- Structured outputs 比長篇聊天更重要
- Task history 是價值累積的一部分
- 檔案 / 背景 / 來源資料是知識入口，不是單純附件

---

## 3. Codex 開工前必讀文件順序

Codex 在做任何重大結構決策前，應依序閱讀：

1. `docs/00_project_vision.md`
2. `docs/01_problem_statement.md`
3. `docs/02_product_scope_v1.md`
4. `docs/03_system_overview.md`
5. `docs/04_ontology_core_v1.md`
6. `docs/05_agent_architecture_v1.md`
7. `docs/06_system_architecture_v1.md`
8. `docs/07_mvp_build_plan.md`
9. `AGENTS.md`

如果實作想法與上述文件衝突，應以文件為準，而不是以推測為準。

---

## 4. Codex 需要先理解的產品核心

這個專案不是：
- 一般聊天機器人包裝層
- 純 RAG / 知識庫問答工具
- 一開始就做到完整 Palantir 規模的平台
- 一開始就面向所有產業的全功能系統

這個專案是：

> **一個以 Ontology 為核心、以 Host Agent 為中樞、以可擴充 Agent 能力為執行層、能處理複雜知識型工作並輸出結構化結果的智能工作平台。**

MVP 的目標不是做滿宇宙，而是先把：
- 任務入口
- 背景 / 檔案 / 來源資料入口
- Ontology 最小鏈
- Host orchestration
- Specialist flow
- Multi-agent flow
- Structured output
- History persistence

這條主鏈做對。

---

## 5. V1 明確 in-scope

Codex 應把以下內容視為 V1 的核心範圍：

### 5.1 主流程
- Task 建立
- TaskContext 建立
- 檔案上傳 / 背景引用
- Source / Evidence 建立
- Host Agent 路由與收斂
- 結構化輸出
- 任務歷史保存

### 5.2 兩種流程模式
- `multi_agent`
- `specialist`

### 5.3 Core Agents
- Strategy / Business Analysis Agent
- Operations Agent
- Market / Research Insight Agent
- Risk / Challenge Agent

### 5.4 Specialist Agents
- Contract Review Agent
- Research Synthesis Agent
- Document Restructuring Agent

### 5.5 Core Ontology Objects
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

---

## 6. V1 明確 out-of-scope

Codex 在 V1 階段不應主動擴張到以下範圍：

- 完整 Agent Market
- 外部 Agent 上架機制
- 複雜企業權限系統
- 多租戶 SaaS 治理
- 完整雲端知識平台
- 全產業完整 Ontology
- 自我演化 / 自我繁殖 Agent
- 全自動高風險執行
- 取代所有單點專業工具

未來擴充應保留接口，但不要提前把功能做出來。

---

## 7. 建議技術選型（預設，不需重新發明）

### 前端
- Next.js
- TypeScript
- App Router

### 後端
- Python
- FastAPI

### 資料庫
- PostgreSQL

### 檔案儲存
- V1 先用本機檔案系統或簡單 object storage 模擬
- metadata 存 DB

### 模型層
- internal model router abstraction
- V1 先接 1～2 家 provider

### 啟動方式
- Docker Compose

如果沒有非常明確的理由，不要自行換成不同技術棧。

---

## 8. 建議 repo 形狀

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
    08_codex_handoff.md

  apps/
    web/

  services/
    api/

  packages/
    domain/
    agents/
    model_router/
    shared/

  storage/
    uploads/

  scripts/
```

如果實作細節有變動，至少要保留：
- UI
- API
- domain models
- orchestration
- agents
- model router
- storage
- docs

的可見分層。

---

## 9. 系統最小模組拆分

Codex 應優先把系統拆成以下模組，而不是一開始寫成一個大檔案或一個超大 controller。

### 9.1 Task Module
- Task CRUD
- status
- history 查詢

### 9.2 Context & Evidence Module
- TaskContext
- Evidence
- 背景資料引用

### 9.3 Source Module
- 檔案上傳
- source metadata
- 未來 connector interface 預留

### 9.4 Ontology Module
- 12 類核心 domain entities
- validation
- serialization / persistence mapping

### 9.5 Agent Module
- Agent interface
- Agent registry / config
- Agent invocation
- output normalization

### 9.6 Orchestration Module
- Host Agent
- flow mode 判斷
- agent selection
- convergence logic

### 9.7 LLM Module
- provider adapter
- routing abstraction
- request / response normalize

### 9.8 Deliverable Module
- Recommendation 組裝
- ActionItem 組裝
- Deliverable 生成

---

## 10. Agent 實作規則

### 10.1 Host Agent
Host Agent 不是普通 Agent。
它是：
- 任務分類器
- 路由器
- 收斂器
- 品質控制員

### 10.2 Core Agents
Core Agents 應先做最小可行版，不要追求過度複雜人格化。

### 10.3 Specialist Agents
Specialist Agents 應先直接承接三個已定任務：
- 合約審閱
- 研究整理
- 文件 / 提案重組

### 10.4 Agent 是模組，不是寫死角色
每個 Agent 至少應有：
- `agent_id`
- `agent_type`
- `display_name`
- `agent_category`
- `supported_task_types`
- `supported_flow_modes`
- `required_inputs`
- `produced_objects`
- `default_model_policy`
- `version`
- `status`

### 10.5 Agent 輸出規則
Agent 輸出應優先落在 Ontology 物件裡，而不是只回一段 prose。

---

## 11. Ontology 實作規則

Codex 不需要一開始做 graph database。

Codex 需要先做的是：
- 12 類核心 domain models
- 物件之間的最小可行關係
- 可序列化與可保存
- 可支撐 Task → Evidence → Insight / Risk / Option → Recommendation → ActionItem → Deliverable 這條主鏈

### 11.1 不要做太大的本體宇宙
- 不先做 Stakeholder 全景層
- 不先做 Decision 獨立本體
- 不先做完整產業包
- 不先做完整知識圖譜

### 11.2 檔案不是本體本身
檔案 / 來源資料是本體物件的重要來源，尤其是：
- TaskContext
- Evidence
- Insight
- Risk
- Option

---

## 12. 檔案與知識入口規則

這一層對 V1 很重要。

### 12.1 必要能力
- 使用者可上傳檔案
- 檔案可與 Task 關聯
- 可由檔案形成 Evidence
- Agent 能引用 Evidence

### 12.2 預留但不完整實作
- Google Drive 類型 connector interface
- Notion 類型 connector interface
- source metadata 結構

### 12.3 不要現在就做爆
- 不做完整同步平台
- 不做超複雜索引
- 不做跨專案全域搜尋

---

## 13. 錯誤處理與降級規則

### 13.1 模型呼叫失敗
- 記錄錯誤
- 可重試一次
- 若仍失敗，回報任務受限

### 13.2 Agent 調用失敗
- Host Agent 可改派備援流程
- 或降級為較簡化流程

### 13.3 Agent 輸出不合格
- 先修正 / 重試
- 仍失敗則降權或忽略
- 不假裝結果完整無誤

### 13.4 背景資料不足
- 明確輸出待補資料 / 不確定性
- 不硬湊答案

### 13.5 來源資料不可用
- 明確標示哪些檔案 / 來源未被成功納入

---

## 14. Codex 實作順序（請遵守）

### Phase 1
- repo skeleton
- docker compose
- FastAPI / Next.js skeleton
- PostgreSQL connection

### Phase 2
- Task / TaskContext / Evidence API
- file upload
- Task UI

### Phase 3
- 12 類 ontology domain models
- schema / validation
- persistence mapping

### Phase 4
- Host Agent 最小版
- 3 個 Specialist Agents 最小版
- Specialist Flow 跑通

### Phase 5
- Host orchestration 升級
- 4 個 Core Agents
- Multi-Agent Flow 跑通

### Phase 6
- Task history
- Deliverable review UI
- 基本 logging / error handling

如果遇到取捨，優先保主流程，不要先做花俏功能。

---

## 15. UI / UX 基本規則

V1 是 personal workbench，不是企業控制台。

### 必須有
- 清楚的 Task 建立
- 清楚的檔案 / context 附加
- 清楚的 structured outputs
- 清楚的 task history

### 先不要有
- 超多 admin controls
- 複雜多人協作介面
- 過度企業感操作流程

---

## 16. 測試與驗收規則

每次完成一個功能，至少要驗證：
- Task creation 還能跑
- 背景與檔案仍能附加
- Host orchestration 仍能執行
- Structured outputs 仍能回來
- Task history 仍能保存
- 沒有新邏輯繞過 model abstraction layer

如果功能涉及 orchestration / ontology，至少要測：
- 一個 specialist flow
- 一個 complex convergence flow

---

## 17. 改動控制規則

Codex 在改動時應遵守：
- diff 要小
- refactor 與新功能儘量分開
- 不要隨意更名 major concepts
- 不要偷偷擴 scope
- 若文件未確認，不要自行發明新產品方向

如果需求與目前 MVP 文件衝突，應採最窄實作版本。

---

## 18. 什麼叫成功

對 Codex 來說，V1 的成功不是：
- 看起來像完整平台
- 有很多 Agent
- 有很炫的 UI

而是：
1. 使用者能建立任務
2. 能附加背景與檔案
3. 能跑 specialist 或 multi-agent flow
4. 能得到 structured result
5. 能回頭在 history 中重看成果
6. 系統看起來像 workbench，而不是另一個聊天框

---

## 19. 最後一句話

如果你不確定該做什麼，請回到這個原則：

> **先把底座做對，先把主流程跑通，先讓一個人真的能用，再談宇宙級擴張。**
