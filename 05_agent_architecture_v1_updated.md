# 05_agent_architecture_v1.md

> 文件狀態：Baseline v1.1（補強版，可作為後續文件與開專案依據）
>
> 本文件用於定義 AI Advisory OS 在 V1 / MVP 階段的 Agent Architecture，說明 Host Agent、核心 Agent、Specialist Agent 的角色分工、任務流程、輸入輸出責任、模組擴充原則與問題處理邊界，作為 Codex 後續開發的依據。

---

## 1. 這份文件是拿來幹嘛的

這份文件要解決的，不是「我們有沒有很多 Agent」這種表面問題。

它真正要解決的是：

> **V1 裡到底有哪些 Agent、誰負責什麼、怎麼協作、怎麼收斂、如何擴充，以及哪些事情現在不要做。**

如果這份文件沒有先定清楚，系統很容易退化成：
- 一個超大 prompt
- 幾個名字不同但功能重疊的 Agent
- 很熱鬧但不收斂的多 Agent 對話
- 難以實作與測試的模糊流程

所以這份文件的目的，是把 Agent 從「想像中的角色」變成「可被實作的系統元件」。

---

## 2. 先講最白話的一句話

V1 的 Agent Architecture 可以先理解成：

> **一個由 Host Agent 負責判斷任務與收斂流程，再視任務需要調用少量核心 Agent 或單點 Specialist Agent，共同建立分析結果與輸出的工作架構。**

也就是說：
- Host Agent 是中樞
- 核心 Agent 是多視角分析能力
- Specialist Agent 是單點任務能力
- Ontology 是大家共享的世界模型
- Deliverable / Recommendation / ActionItem 是最終輸出落點

---

## 3. V1 Agent Architecture 的設計原則

### 3.1 Agent 不是人格扮演，而是能力與視角模組

V1 不應把 Agent 設計成「像某個人講話」。

Agent 的本質應該是：
- 看問題的視角
- 使用的評估框架
- 負責的輸出類型
- 可接觸的本體物件
- 可被調用的任務類型

也就是：

> **Agent = 能力 + 責任 + 視角，不是戲劇化角色。**

### 3.2 Host Agent 必須是中樞，不是總結員

Host Agent 不是最後才出來整理文字，
而是整個流程的治理中心。

它必須先理解任務、決定流程、選擇 Agent、控制節奏、處理衝突、形成輸出。

### 3.3 V1 先做少量高品質 Agent，不追求數量

V1 不應該一開始就做很多 Agent。

V1 先控制在 **4 個核心分析 Agent**，外加 **3 個 Specialist Agent** 即可。

重點是：
- 差異清楚
- 功能不重疊
- 流程可測試
- 收斂結果有價值

### 3.4 同一套架構要同時支援複合任務與單點任務

V1 既要支援：
- 多 Agent 收斂的複雜任務

也要支援：
- 合約審閱
- 研究整理
- 文件 / 提案重組

所以架構不能只為多 Agent 任務而設計。

### 3.5 Agent 架構要建立在 04 的 Core Ontology 之上

所有 Agent 都必須建立在同一套 Core Ontology 上工作，尤其是：
- Task
- TaskContext
- Evidence
- Insight
- Risk
- Option
- Recommendation
- ActionItem
- Deliverable

這樣多 Agent 才不是各說各話。

---

## 4. V1 Agent 架構總覽

V1 建議將 Agent 分成三層：

### 4.1 Layer A：Host Agent（中樞層）
整個系統只有一個主控中樞角色。

### 4.2 Layer B：Core Analysis Agents（核心分析層）
用於複雜商業問題的多視角分析與辯證。

### 4.3 Layer C：Specialist Agents（單點任務層）
用於高頻、範圍明確的單點任務處理。

這樣的分層可以同時滿足：
- 複合任務的多 Agent 收斂
- 單點任務的快速處理
- 未來模組化擴充

---

## 5. Host Agent 定義

### 5.1 Host Agent 的角色

Host Agent 是整個 V1 的流程中樞。

它不專注在某一種專業分析，
而專注在：
- 理解任務
- 管理流程
- 選擇能力
- 收斂輸出

### 5.2 Host Agent 的核心責任

Host Agent 在 V1 中至少負責：

1. **任務解析**
   - 讀取 Task / TaskContext / Subject / Goal / Constraint
   - 判斷任務是複合任務還是單點任務

2. **流程選擇**
   - multi-agent flow
   - specialist flow

3. **Agent 選角**
   - 決定需要哪些核心 Agent
   - 或決定是否直接交給某個 Specialist Agent

4. **分析治理**
   - 控制分析順序
   - 避免重複
   - 要求補足證據
   - 發現衝突與盲點

5. **現實校準與可信度控制**
   - 要求所有分析盡量建立在 Evidence 之上
   - 區分哪些是事實、哪些是推論、哪些是假設
   - 當證據不足時，要求輸出「待補資料 / 不確定性」，而不是硬湊答案
   - 避免 Agent 以虛假資料或無依據內容作為結論基礎

6. **結果收斂**
   - 整理 Insight / Risk / Option
   - 形成 Recommendation
   - 轉出 ActionItem
   - 建立 Deliverable

7. **歷史保存接口**
   - 確保任務結果能被保存為後續可回顧的成果

### 5.3 Host Agent 的定位補充

Host Agent 的角色可以直接理解成：

> **會議主持人 + 流程總指揮 + 品質控制員。**

它不是單純幫大家做會議紀錄，而是要：
- 把討論拉回任務目標
- 管理出場順序與節奏
- 阻止離題與重複
- 要求依據與現實約束
- 把發散討論收斂成可用成果

### 5.4 Host Agent 不做什麼

Host Agent 不應自己假裝成所有專家。

它應該避免：
- 同時扮演全部分析角色
- 跳過分析過程直接下結論
- 變成只是漂亮文案整理員

### 5.5 Host Agent 的輸入

- Task
- TaskContext
- Subject
- Goal
- Constraint
- Evidence

### 5.6 Host Agent 的輸出

- 選定流程模式
- 選定參與 Agent
- 分析收斂結果
- Recommendation
- ActionItem
- Deliverable

---

## 6. V1 Core Analysis Agents

V1 建議先用 **4 個核心分析 Agent**。

這 4 個 Agent 已經足夠支撐大部分 V1 的複合型任務，又不會過多。

### 6.1 Strategy / Business Analysis Agent

#### 主要角色
從整體商業目標與問題結構角度看任務。

#### 核心關注
- Goal
- Option
- Recommendation
- 問題拆解
- 任務方向是否合理

#### 適合回答的問題
- 這個任務真正要解的是什麼？
- 哪些方向值得優先考慮？
- 有哪些可比較的策略路徑？

#### 主要產出
- 問題框架
- 方案方向
- 策略性建議

---

### 6.2 Operations Agent

#### 主要角色
從執行可行性、流程、資源與落地面看任務。

#### 核心關注
- Constraint
- Risk
- ActionItem
- 執行成本
- 流程與資源可行性

#### 適合回答的問題
- 這件事做得下去嗎？
- 哪些地方會卡住？
- 執行上最現實的下一步是什麼？

#### 主要產出
- 執行風險
- 資源與流程限制
- 落地建議
- ActionItem 草案

---

### 6.3 Market / Research Insight Agent

#### 主要角色
從資料、背景、研究與外部訊號角度看任務。

#### 核心關注
- Evidence
- Insight
- 背景整理
- 市場 / 研究視角
- 對外部資料的提煉

#### 適合回答的問題
- 從資料來看最重要的重點是什麼？
- 哪些背景訊號值得被納入判斷？
- 有哪些洞察可以支撐或推翻現有方向？

#### 主要產出
- Evidence 整理
- Insight 彙整
- 研究型補充觀點

---

### 6.4 Risk / Challenge Agent

#### 主要角色
扮演反方、風險檢查與盲點挑戰者。

#### 核心關注
- Risk
- Constraint
- Recommendation
- 假設檢查
- 反方論點

#### 適合回答的問題
- 哪裡太樂觀了？
- 哪些假設站不住腳？
- 目前方案最危險的地方是什麼？

#### 主要產出
- 風險檢查
- 反方觀點
- 假設漏洞提醒

---

## 7. 為什麼 V1 先選這 4 個核心 Agent

這 4 個 Agent 的組合剛好覆蓋了 V1 複合型任務最常見的四個面向：

- **方向**：Strategy / Business Analysis
- **落地**：Operations
- **依據**：Market / Research Insight
- **反方檢查**：Risk / Challenge

也就是說，這組合不綁定單一產業，
但足以處理顧問型工作、研究型工作、提案型工作與問題診斷型工作。

這也符合前面文件一直強調的：
V1 先保留彈性，不過早綁死某個細分場景。

---

## 8. V1 Specialist Agents

V1 的 Specialist Agent 應直接對應目前已確認的三類單點任務。

### 8.1 Contract Review Agent

#### 任務類型
- 合約審閱
- 條款風險辨識
- 基本審閱建議整理

#### 主要依賴物件
- Task
- TaskContext
- Evidence
- Constraint
- Risk
- Recommendation
- Deliverable

#### 說明
它不必是完整法務系統，
但要能在 V1 中承接高頻合約審閱任務。

---

### 8.2 Research Synthesis Agent

#### 任務類型
- 研究整理
- 背景彙整
- 資料摘要與重組

#### 主要依賴物件
- Task
- TaskContext
- Evidence
- Insight
- Deliverable

#### 說明
這個 Agent 的重點是把大量背景資料整理成可用成果。

---

### 8.3 Document Restructuring Agent

#### 任務類型
- 文件重組
- 提案重組
- 內容重整

#### 主要依賴物件
- Task
- TaskContext
- Evidence
- Goal
- Recommendation
- Deliverable

#### 說明
這個 Agent 比較偏面向輸出重構，不一定需要複雜多 Agent 協作。

---

### 8.4 為什麼 V1 就要保留 Agent 擴充空間

雖然 V1 先只做 4 個核心分析 Agent 與 3 個 Specialist Agent，
但架構上必須從第一天就預留擴充性。

原因是：
- 產品定位本來就是可持續擴張的智能工作平台
- 後續一定會長出更多單點模組與產業型 Agent
- 如果 V1 把 Agent 寫死成不可替換的流程，後面會很難擴充

因此，V1 雖然不做外部 Agent Market，
但應先把 Agent 視為：

> **可被註冊、可被調用、可被替換、可被停用、未來可持續增加的能力模組。**

### 8.5 V1 應先定義的 Agent 模組規格

V1 不需要先做完整 Marketplace，
但應先定義內部 Agent 的最小模組規格，至少包含：

- `agent_id`
- `agent_type`
- `display_name`
- `agent_category`（core / specialist）
- `supported_task_types`
- `supported_flow_modes`
- `required_inputs`
- `produced_objects`
- `default_model_policy`
- `version`
- `status`（active / disabled / deprecated）

這樣的好處是：
- 未來新增 Agent 不需要推翻整套系統
- Host Agent 可以根據能力規格去選角
- Codex 可以先做出最小可行的 Agent registry / config layer
- 出問題的 Agent 可以被停用、替換、升版

---

## 9. V1 任務流程模式

V1 應明確支援兩種流程模式。

### 9.1 Multi-Agent Flow

適用情況：
- 問題複雜
- 需要多視角分析
- 需要風險與方案比較
- 最終需要報告與行動建議

#### 流程
1. 使用者建立 Task
2. 上傳 / 引用背景資料
3. Host Agent 解析任務
4. Host Agent 選擇 2~4 個 Core Agents
5. 核心 Agent 依序或並行分析
6. Host Agent 收斂 Insight / Risk / Option
7. Host Agent 形成 Recommendation / ActionItem / Deliverable
8. 保存任務歷史

---

### 9.2 Specialist Flow

適用情況：
- 任務範圍明確
- 單點功能即可處理
- 不需要複雜多視角協作

#### 流程
1. 使用者建立 Task
2. 上傳 / 引用背景資料
3. Host Agent 判斷為 specialist 模式
4. Host Agent 將任務交給對應 Specialist Agent
5. Specialist Agent 輸出 Deliverable / Recommendation / Risk 等結果
6. Host Agent 做最終整理與保存

---

## 10. Agent 輸入輸出規格原則

V1 不需要先把每個 Agent 寫成超複雜自治體，
但至少應先建立一致的輸入輸出原則。

### 10.1 共通輸入原則
所有 Agent 至少能讀取：
- Task
- TaskContext
- Subject
- Goal
- Constraint
- Evidence

### 10.2 共通輸出原則
所有 Agent 的輸出應優先落在以下物件中，而不是只吐自由文字：
- Insight
- Risk
- Option
- Recommendation
- ActionItem
- Deliverable 內容片段

### 10.3 可信度與現實約束原則
所有 Agent 在輸出時應遵守：
- 優先根據 Evidence 輸出
- 明確區分事實 / 推論 / 假設
- 當資料不足時，可輸出「待補資料」或「不確定性」
- 不應虛構不存在的資料來源、數字、條文或市場事實

### 10.4 Host Agent 的特別責任
只有 Host Agent 負責：
- 流程判斷
- 選角
- 衝突收斂
- 最終輸出成形
- 可信度控制與補件判斷

---

## 11. Agent 問題處理與調整原則

V1 雖然不做完整平台治理，但必須先定義最基本的 Agent 問題處理方式。

### 11.1 若 Agent 無法被調用
例如：
- 設定錯誤
- 模型路由失敗
- Agent 狀態為 disabled

系統應：
- 記錄錯誤
- 由 Host Agent 改用替代流程或降級流程
- 視情況改派其他可用 Agent
- 在最終結果中標示該次分析能力受限

### 11.2 若 Agent 輸出格式錯誤或內容異常
例如：
- 沒有輸出結構化物件
- 輸出與任務無關
- 顯著缺乏依據

系統應：
- 先做一次修正 / 重試
- 若仍失敗，Host Agent 應忽略該輸出或降權使用
- 將異常記錄在 agent log / task log 中

### 11.3 若 Agent 品質有問題
例如：
- 經常幻覺
- 與實際任務不匹配
- 貢獻與其他 Agent 高度重複

系統應能：
- 停用該 Agent
- 更換版本
- 調整模組設定
- 替換模型或 prompt 策略

這也是為什麼 V1 應先把 Agent 視為可版本化、可停用、可替換的模組，而不是寫死在程式流程中的不可變角色。

---

## 12. Codex 實作時如何理解這份 Agent 架構

對 Codex 來說，這份文件不是要它先做出一套很炫的 Agent 社會。

它真正要先做的是：

### 12.1 先把 Agent interface 做出來
至少要能支援：
- agent id / type
- input payload
- output payload
- task mode
- invocation by host
- version / status

### 12.2 先把 Host Agent 當作 workflow orchestrator
Host Agent 在工程上應先被實作成：
- 任務分類器
- 路由器
- 收斂器

### 12.3 先把 4 個 Core Agents + 3 個 Specialist Agents 以最小可行版本實作
不是所有功能都完整，而是先跑通流程。

### 12.4 先讓 Agent 輸出能進 Ontology 物件
這樣系統才不是只有聊天內容，而是有結構化結果。

### 12.5 保留未來擴充接口
未來可以增加：
- 更多 Agent 類型
- Agent registry
- 任務模板
- 不同模型路由策略

但 V1 不先做完整市場與治理系統。

---

## 13. V1 不先做的 Agent 能力

為避免過度設計，以下能力 V1 先不做：

### 13.1 不做大量核心 Agent
V1 不追求 10 個、20 個 Agent。

### 13.2 不做自我繁殖 / 自我改寫 Agent
V1 先不碰高度自治與自主演化。

### 13.3 不做開放外部上架 Agent Market
V1 僅做內部定義的 Agent。

### 13.4 不做複雜多層級 Agent 指揮鏈
V1 先固定為：
- 一個 Host Agent
- 少量 Core Agents
- 少量 Specialist Agents

### 13.5 不做全自動高風險執行 Agent
Agent 可以提出建議與行動項，
但不自動做高風險決策。

---

## 14. 已確認事項

1. **V1 先使用 4 個核心分析 Agent**
2. **這 4 個核心 Agent 的命名與分工已接受**
3. **V1 的 3 個 Specialist Agent 先對應已定的三個單點任務**
   - 並保留未來擴充空間
4. **Host Agent 明確作為流程中樞，而不是一般分析 Agent 之一**
   - 其定位為：會議主持人 + 流程總指揮 + 品質控制員
5. **V1 先只支援 Multi-Agent Flow 與 Specialist Flow 兩種模式**
6. **V1 先定義內部 Agent 的最小模組規格**
7. **V1 先建立基本的 Agent 問題處理與降級原則**

---

## 15. 結語

V1 的 Agent Architecture 成功標準，不是看起來像不像一個很複雜的 AI 社會。

而是：
- Host Agent 能不能真的把流程管住
- 核心 Agent 有沒有明確分工
- Specialist Agent 能不能承接高頻單點任務
- 所有 Agent 是否真的共用同一套 Core Ontology
- 最終輸出是否能結構化並沉澱
- Agent 是否從第一天就被當成可擴充、可停用、可替換的模組

> **先把少量高品質 Agent 做對，系統才有資格往更多模組與更大宇宙擴張。**
