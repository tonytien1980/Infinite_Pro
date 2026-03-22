# 05_agent_architecture_v1.md

> 文件狀態：Governance Reset v2.0（正式 Agent 架構文件）
>
> 本文件延續既有檔名以維持文件索引穩定，但內容已改為支撐 Infinite Pro 的 **Single-Consultant Full-Scope Edition**，不再以少量 Agent 與 MVP flow 當作正式產品上限。

---

## 1. 文件目的

本文件要回答的是：

1. **Infinite Pro 的 Agent Layer 在完整單人顧問版中應怎麼被定義？**
2. **Host Agent 一開始就必須負責什麼？**
3. **specialist agents 應如何分類，而不是只停在少數 flow 名稱？**
4. **Agent Layer 如何與 ontology、context、industry packs、deliverables 對接？**

---

## 2. Agent Architecture 的正式定位

Infinite Pro 的 Agent Architecture 不應再被理解成：
- 4 個 core agents + 3 個 specialist agents 的固定上限
- 幾條單點 flow 的集合
- 一個 Host 加幾個 prompt wrapper

而應被理解成：

> **一個由 Host Agent 進行流程治理與決策收斂，並由多個 reasoning agents、specialist agents 與 pack-aware capability agents 共同完成顧問工作的正式架構層。**

---

## 3. 設計原則

### 3.1 Host Agent 是唯一 orchestration center
Host Agent 必須是唯一流程治理中樞。

### 3.2 Agents 是能力模組，不是人格扮演
Agent 的本質是：
- 專業責任
- 可處理的 object 類型
- 可輸出的分析類型
- 可參與的 workflow

### 3.3 Agent Layer 需建立在 ontology objects 上
Agents 不應只吃 prompt 文字，而應建立在 shared objects / links / decision context 上工作。

### 3.4 少量已實作，不等於正式上限
即使第一波只落地少數 agents，也不代表完整單人顧問版只需要那些 agents。

### 3.5 Industry packs 必須能影響 agent behavior
industry pack 不能只是標籤，應能正式影響：
- evidence expectations
- decision framing
- specialist routing
- deliverable shaping

---

## 4. Agent Layer 正式分層

## 4.1 Host Agent Layer
只有一個 Host Agent。

## 4.2 Reasoning Agent Layer
承接跨領域、多視角、決策導向分析。

## 4.3 Specialist Agent Layer
承接單點高頻任務與專門工作。

## 4.4 Pack-aware Capability Layer
讓特定 domain / industry / stage context 能覆蓋 reasoning 與 specialist 行為。

---

## 5. Host Agent 的正式責任

Host Agent 一開始就必須負責：

1. **task / decision interpretation**
   - 解析 Task、DecisionContext、Goal、Constraint、Assumption、Audience

2. **ontology mapping**
   - 把使用者原始問題映射進 shared objects / links

3. **workflow orchestration**
   - 判斷應採用什麼工作 archetype
   - 判斷應用哪種 execution mode

4. **specialist / reasoning routing**
   - 決定需要哪些 agent 參與
   - 決定輸入 payload 與協作順序

5. **readiness governance**
   - 判斷背景、artifact、evidence 是否足夠
   - 明確標記不確定性與資料缺口

6. **industry / domain / stage awareness**
   - 結合 DomainLens、ClientStage、ClientType、IndustryPack 調整分析重心

7. **convergence**
   - 整理 Insight、Risk、Option、Recommendation、ActionItem
   - 形成 deliverable-centric output

8. **history writeback**
   - 將本輪執行與交付結果寫回系統歷史

Host Agent 不是最後才來做摘要的總結員，而是全流程治理者。

---

## 6. Reasoning agents 的正式分類

Reasoning agents 不應只用少數固定名稱思考，而應先用能力面分類。

至少應保留以下 reasoning families：

### 6.1 Strategy / Decision
- 問題拆解
- 選項比較
- 優先順序
- 決策收斂

### 6.2 Operations
- 執行可行性
- 流程與依賴
- 資源配置
- 落地風險

### 6.3 Finance / Capital
- 財務結構
- 現金流
- 單位經濟
- 募資與資本配置

### 6.4 Legal / Risk
- 法務邊界
- 合規與責任
- 條款風險
- 風險挑戰

### 6.5 Marketing / Growth
- 市場訊號
- 品牌與訊息
- 成長與 demand 假設

### 6.6 Sales / GTM
- 客戶路徑
- 銷售流程
- 成交阻力
- go-to-market 選擇

### 6.7 Research / Insight
- 外部研究
- 資訊綜整
- pattern finding

### 6.8 Communication / Narrative
- 提案結構
- 文件重組
- 對不同 audience 的表達重塑

第一波可以先落地其中一部分，但架構上不應把其餘能力排除在外。

---

## 7. Specialist agents 的正式分類

Specialist agents 不應只被定義為目前已存在的 3 個 flow。

應先從工作型態分類：

### 7.1 Review specialists
- contract review
- proposal review
- financial model review
- governance / SOP review

### 7.2 Synthesis specialists
- research synthesis
- meeting synthesis
- market brief generation
- evidence consolidation

### 7.3 Restructuring specialists
- document restructuring
- proposal reframing
- board memo restructuring
- founder narrative restructuring

### 7.4 Decision-support specialists
- scenario comparison
- roadmap drafting
- action plan shaping
- issue prioritization

### 7.5 Domain specialists
- legal
- finance
- fundraising
- operations
- marketing
- sales

目前已落地的 specialist 只是這個正式分類下的第一波 exemplars。

---

## 8. Execution modes 與 consulting capability 的區分

Agent 架構不應再把 mode 與產品分類混在一起。

應區分：

### 8.1 Consulting capability archetypes
- Diagnose / Assess
- Decide / Converge
- Review / Challenge
- Synthesize / Brief
- Restructure / Reframe
- Plan / Roadmap

### 8.2 Execution modes
- host-lightweight
- specialist
- multi-agent convergence

Execution mode 是 Host 的 orchestration 選擇，不是產品主分類。

---

## 9. Industry packs 如何進入 Agent Layer

Industry packs 必須能正式影響 agent behavior，例如：
- 哪些 evidence 是必要的
- 哪些風險類型要優先看
- 哪些 deliverable sections 要優先形成
- 哪些 specialists 應被優先調用
- 哪些 decision criteria 要被套用

所以 Agent Layer 要能讀取 pack-aware context，而不是永遠只跑通用 prompt。

---

## 10. 第一波實作與第二波實作

### 10.1 第一波實作可優先落地
- Host Agent
- 少數 reasoning agents
- 少數 specialist agents
- 基本 pack-aware hooks
- 基本 execution modes

### 10.2 第二波實作可再擴充
- 更完整的 reasoning families
- 更完整的 domain specialists
- 更明確的 pack-aware routing
- 更細的 workflow chains

但這不表示第二波內容不屬於正式架構。

---

## 11. 對後續實作的約束

後續實作時，不應再：
- 把 4 core agents + 3 specialist agents 視為固定上限
- 把 specialist flow 名稱直接當產品主分類
- 把 Host Agent 降成最後的文案整理員
- 把 industry pack 視為後補標籤

後續應做的是：
- 讓 Host 真正控制能力選擇與收斂
- 讓 agent families 與 ontology / context / pack 結構對齊
- 讓 specialist agents 成為正式可擴充能力，而不是零散功能

---

## 12. 文件結論

Infinite Pro 的 Agent Architecture 現在應被視為：

> **支撐完整單人顧問工作範圍的正式能力層。**

少量 agent 的第一波實作只是技術 rollout 順序，不再代表產品正式能力邊界。
