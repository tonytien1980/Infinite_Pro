# 06_system_architecture_v1.md

> 文件狀態：Baseline v1.0（補強版，可作為後續文件與開專案依據）
>
> 本文件用於定義 AI Advisory OS 在 V1 / MVP 階段的系統架構，說明主要模組、資料流、前後端邊界、任務流、檔案處理、模型路由、歷史保存、知識來源入口與未來擴充接口，作為 Codex 後續實作的主要技術藍圖。

---

## 1. 這份文件是拿來幹嘛的

前面的文件已經回答了：
- 產品是什麼
- 為什麼要做
- V1 要做什麼
- 整體系統長什麼樣
- Ontology 如何成為核心骨架
- Agent 如何分工與收斂

這份文件接下來要回答的是：

> **那這些東西在系統裡到底要怎麼被做出來？**

也就是把前面的概念，轉成：
- 有哪些模組
- 哪些模組先做
- 它們彼此怎麼溝通
- 任務與資料怎麼流動
- 哪些地方要保留未來擴充空間

這份文件的主要讀者是：
1. 你自己
2. 後續使用 Codex 開發時的工程上下文

---

## 2. 先講最白話的一句話

V1 的系統架構可以先理解成：

> **一個讓使用者提交任務與背景資料，由後端建立 Task 與 Ontology 物件，再由 Host Agent 編排核心 Agent 或 Specialist Agent 產生結構化結果，最後保存成可回顧任務歷史的系統。**

也就是說，系統不是只有一個聊天介面，
而是至少要有：
- 任務入口
- 檔案 / 背景引用入口
- 知識來源入口
- Agent orchestration
- Ontology / domain model
- LLM router
- 結果輸出
- 歷史保存

---

## 3. V1 系統架構目標

V1 的系統架構，不追求一次做到最完整，而是追求這 6 件事：

### 3.1 先把核心主流程跑通
也就是：
- 建立任務
- 帶入背景
- 跑分析
- 產出建議與成果
- 保存歷史

### 3.2 讓 Ontology 真正進入系統
Ontology 不能只存在文件裡，
而是要進入：
- 任務建立
- 分析中介物件
- 輸出結構
- 歷史保存

### 3.3 讓 Host Agent 與其他 Agent 有可實作的架構
不能只是概念上的多 Agent，
而是要有明確 orchestration 與 agent interface。

### 3.4 讓檔案 / 背景資料真正成為知識來源入口
也就是：
- 資料能進系統
- 資料能形成 Evidence
- 資料能支撐任務分析
- 未來能成為知識重用基礎

### 3.5 保留未來擴充空間
未來會擴充：
- 更多 Agent
- 更多單點模組
- 團隊協作
- 更多模型供應商
- 外部工具整合
- 更多雲端來源
- 專案級知識庫

V1 不能把這些擴充路堵死。

### 3.6 不過度工程化
V1 要先能做出來、用起來、驗證價值，
而不是先做成完整企業平台。

---

## 4. V1 系統總體分層

V1 建議分成 8 個主要模組層。

### Layer 1：User Interface
使用者操作介面。

### Layer 2：Application Backend
應用後端 / API 層。

### Layer 3：Task & Orchestration Engine
任務管理與 Host Agent 流程編排層。

### Layer 4：Ontology / Domain Layer
Core Ontology 與任務物件層。

### Layer 5：Agent Runtime Layer
核心 Agent / Specialist Agent 執行層。

### Layer 6：Model Router Layer
模型供應商抽象與路由層。

### Layer 7：Storage Layer
任務、物件、檔案引用、歷史與結果儲存層。

### Layer 8：Source & Knowledge Ingestion Layer
檔案上傳、來源接入、Evidence 抽取、後續知識入口層。

你可以把它理解成：
- 前台給人用
- 中間層負責流程
- 底層負責資料與模型
- 來源層負責把真實世界資料帶進來

---

## 5. 各層模組說明

## 5.1 User Interface

### 角色
這是使用者直接互動的地方。

### V1 應具備的能力
- 建立 Task
- 輸入任務說明
- 上傳檔案 / 引用背景資料
- 選擇或顯示任務模式（自動判斷為主）
- 查看最終輸出
- 查看任務歷史
- 回看任務內容與背景引用

### V1 不先追求的能力
- 完整團隊工作區
- 複雜多人共編
- 複雜角色權限系統

### 補充
V1 前台應該像「個人工具台」，
而不是企業級控制台。

---

## 5.2 Application Backend

### 角色
承接前端請求，負責把 UI 動作轉成系統內部流程。

### V1 應負責
- Task CRUD
- 檔案上傳與背景資料建立
- 啟動任務分析流程
- 讀取任務歷史
- 提供 Deliverable / Recommendation / ActionItem 查詢

### 白話理解
它像整個系統的總 API 層，
前端不直接碰 Agent，也不直接碰模型。

---

## 5.3 Task & Orchestration Engine

### 角色
這是整個 V1 的流程心臟。

### 主要責任
- 建立任務執行上下文
- 呼叫 Host Agent
- 判斷 Multi-Agent Flow 或 Specialist Flow
- 選角
- 管理執行順序
- 收斂結果
- 觸發歷史保存

### 為什麼這層重要
因為 AI Advisory OS 的差異化很大部分就在這裡。

不是單純把 prompt 丟給模型，
而是：
- 有任務流程
- 有中樞
- 有多 Agent 與單點任務兩種模式
- 有收斂邏輯

---

## 5.4 Ontology / Domain Layer

### 角色
這層承接 04 文件裡定義的 Core Ontology。

### V1 至少要能承接的核心物件
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

### 這層的任務
- 將使用者輸入與背景整理成結構化 domain objects
- 提供 Agent 共同使用的任務語境
- 承接分析過程中的中介結果
- 支撐最終輸出與歷史保存

### 白話理解
這層不是資料庫本身，
而是整個系統理解世界的工作物件層。

---

## 5.5 Agent Runtime Layer

### 角色
負責執行 Host Agent、Core Agents 與 Specialist Agents。

### V1 的 Agent 類型
- Host Agent × 1
- Core Analysis Agents × 4
- Specialist Agents × 3

### 這層的責任
- 接受 orchestration 指令
- 組裝輸入 payload
- 呼叫模型
- 解析輸出
- 將輸出寫回 Ontology objects

### 這層不應做什麼
- 不要把整個流程寫死在某一個 Agent 裡
- 不要讓每個 Agent 自己亂管理全局

---

## 5.6 Model Router Layer

### 角色
讓系統不綁死單一 LLM API。

### V1 應具備的能力
- 封裝模型供應商差異
- 根據 Agent 類型或任務模式選擇預設模型
- 統一 request / response interface
- 支援日後擴充更多供應商

### V1 不需要一開始做太複雜的部分
- 不必做超精細成本最佳化
- 不必做動態模型競價式 routing

### V1 比較合理的做法
- 先支援 1~2 家模型
- 但以統一抽象層包起來

---

## 5.7 Storage Layer

### 角色
保存任務與結果，不讓系統每次都變成一次性對話。

### V1 至少要存的東西
- Task
- TaskContext
- Evidence metadata / references
- Insight
- Risk
- Option
- Recommendation
- ActionItem
- Deliverable
- Agent execution logs（可簡化）
- 任務狀態與時間戳記

### 白話理解
這層的價值不是存聊天紀錄，
而是存工作成果與任務結構。

---

## 5.8 Source & Knowledge Ingestion Layer

### 角色
把真實世界資料帶進系統，並轉成可被主流程使用的 Evidence 與背景上下文。

### V1 至少應承接
- 檔案上傳
- 任務背景附件
- 文字型背景補充
- 手動引用的歷史資料

### V1 長期應預留的接口
- Google Drive 類型來源
- Notion / 文件平台類型來源
- 專案級知識資料夾
- 其他雲端來源

### 這層的責任
- 接收原始來源
- 建立 source metadata
- 將內容轉為可被 Task / Evidence 使用的結構
- 為未來知識重用保留入口

### 補充
這層不是完整知識庫平台本身，
但它是未來知識庫能力的入口。

---

## 6. V1 的主要資料流

先看最重要的兩條資料流。

## 6.1 Multi-Agent Flow 資料流

1. 使用者在 UI 建立 Task
2. 上傳檔案 / 輸入背景說明
3. Source & Knowledge Ingestion Layer 建立來源資料與可用 Evidence
4. Backend 建立 Task + TaskContext + Evidence
5. Orchestration Engine 啟動 Host Agent
6. Host Agent 判斷為 multi-agent flow
7. Host Agent 根據任務選擇 Core Agents
8. Agent Runtime 依序或並行執行核心 Agent
9. 核心 Agent 輸出 Insight / Risk / Option 等中介結果
10. Host Agent 收斂 Recommendation / ActionItem / Deliverable
11. Backend 將結果寫入 Storage
12. UI 顯示最終成果與任務歷史

---

## 6.2 Specialist Flow 資料流

1. 使用者在 UI 建立 Task
2. 上傳檔案 / 背景資料
3. Source & Knowledge Ingestion Layer 建立來源資料與可用 Evidence
4. Backend 建立 Task + TaskContext + Evidence
5. Host Agent 判斷為 specialist flow
6. Host Agent 指派對應 Specialist Agent
7. Specialist Agent 輸出 Deliverable / Recommendation / Risk 等結果
8. Host Agent 做最終整合與收尾
9. Backend 保存結果
10. UI 顯示成果與歷史

---

## 7. V1 模組邊界

這一段很重要，因為它決定 Codex 實作時不會把責任寫混。

### 7.1 UI 不負責做分析
UI 只負責輸入、顯示、查詢。

### 7.2 Backend 不負責扮演 Agent
Backend 是服務層，不應自己生成分析結果。

### 7.3 Host Agent 不直接處理檔案儲存
Host Agent 只用已整理好的背景與 Evidence，不應自己兼任檔案管理器。

### 7.4 Agent Runtime 不負責最終歷史保存邏輯
Agent Runtime 專注於執行與輸出，不應直接承擔完整 persistence orchestration。

### 7.5 Model Router 不直接決定業務流程
Model Router 是工具層，不是業務決策層。

### 7.6 Ingestion Layer 不直接做最終業務判斷
來源層只負責把資料轉成可用材料，不應直接代替 Agent 做最終結論。

---

## 8. V1 建議的最小模組拆分

為了讓 Codex 更容易動手，V1 可以先拆成以下最小模組：

### 8.1 Task Module
負責：
- Task CRUD
- Task status
- Task history 查詢

### 8.2 Context & Evidence Module
負責：
- TaskContext 建立
- 檔案 metadata
- 背景資料引用
- Evidence 建立與整理

### 8.3 Source Module
負責：
- 檔案上傳
- source metadata
- 未來雲端來源接口保留
- 從原始來源轉入系統材料

### 8.4 Ontology Module
負責：
- 12 類核心物件定義
- object validation
- object serialization / persistence mapping

### 8.5 Agent Module
負責：
- Agent interface
- Agent registry / config
- Agent invocation
- Agent output normalization

### 8.6 Orchestration Module
負責：
- Host Agent 執行流程
- Flow mode 判斷
- Agent selection
- 結果收斂

### 8.7 LLM Module
負責：
- 模型呼叫抽象
- provider adapter
- request / response normalize

### 8.8 Deliverable Module
負責：
- Recommendation 組裝
- ActionItem 組裝
- Deliverable 內容生成

---

## 9. V1 儲存策略建議

V1 不一定需要一開始就做很複雜的 graph database。

比較務實的做法是：
- 先用一般關聯式或文件式儲存
- 用清楚的 domain model 承接 Ontology 物件
- 保留未來轉成更進階圖結構或混合架構的可能

### V1 先重視的不是資料庫炫技，而是：
- Domain model 是否正確
- 物件是否能被保存與查詢
- 任務歷史是否能被回顧
- 結構化輸出是否能被穩定保存

---

## 10. 檔案上傳、雲端來源與知識入口如何進系統

這是 V1 的核心能力之一。

### 10.1 V1 至少要做到
- 檔案可被上傳
- 檔案可與 Task 關聯
- 可從檔案產生 Evidence
- Agent 可使用這些 Evidence

### 10.2 V1 應保留的雲端來源方向
V1 不必一開始就完整實作 Google Drive 類型連接器，
但系統架構上應保留：
- 外部來源 connector interface
- source metadata 結構
- 將外部來源轉成 Evidence 的入口

### 10.3 V1 不一定一開始要做到
- 超複雜文件切片策略
- 很重的知識庫索引系統
- 全量文件治理平台
- 跨專案全域搜尋

### 10.4 更重要的是
- 檔案真的能進主流程
- 合約審閱與研究整理能真的用到檔案
- Host Agent 知道有哪些 Evidence 可用
- 架構上明確把檔案 / 雲端來源視為未來知識入口層

---

## 11. 任務歷史保存要怎麼理解

V1 已確認需要任務歷史保存。

這代表系統至少要能保存：
- 任務本身
- 任務背景
- 引用過的 Evidence
- 分析結果
- 最終 Deliverable
- 建議與行動項
- 基本執行紀錄
- 來源資料與其引用關係

這樣未來你才能：
- 回頭檢查分析過程
- 延續任務
- 複製方法論
- 比較前後版本
- 逐步累積專案知識

所以任務歷史不是附加功能，
而是產品價值累積機制的一部分。

---

## 12. 錯誤處理與降級原則

V1 雖然不是完整企業平台，
但不能完全沒有錯誤與降級設計。

### 12.1 若模型呼叫失敗
- 記錄錯誤
- 可重試一次
- 若失敗，回報任務處理受限

### 12.2 若 Agent 調用失敗
- Host Agent 可改派備援流程
- 或降級為較簡化的單 Agent / 主持人收斂模式

### 12.3 若 Agent 輸出不合格
- 嘗試修正 / 重試
- 仍失敗則降權或忽略
- 不應假裝結果完整無誤

### 12.4 若背景資料不足
- 系統應輸出「待補資料 / 不確定性」
- 不應硬湊完整答案

### 12.5 若來源資料不可用
- 應明確標示哪些檔案 / 來源沒有被成功納入
- 不應假設未成功讀取的資料已被分析

---

## 13. V1 不先做的系統能力

為避免過度工程化，以下能力 V1 先不做完整版本：

### 13.1 多租戶 SaaS 架構
V1 不以完整 SaaS 平台優先。

### 13.2 複雜企業權限系統
V1 先偏個人工具台。

### 13.3 完整 Agent Market
V1 不開放外部上架 Agent。

### 13.4 完整外部工具工作流自動化
V1 可先保留接口，但不先做很多實際自動執行。

### 13.5 高度自治系統
V1 不做自我繁殖、自我改寫、多層級自治 Agent 社會。

### 13.6 完整雲端知識平台
V1 不先做完整連接器生態、同步排程與全域知識搜尋。

---

## 14. Codex 實作時的優先順序建議

這段是給後續開發最實際的參考。

### Step 1：Task + Source + Context + Evidence 基礎層
先讓任務能建立、背景能進來、來源能被掛到任務上。

### Step 2：Core Ontology domain model
把 12 類核心物件落成程式中的 domain model。

### Step 3：Agent interface + Host orchestration skeleton
先把 Host Agent 與 Agent interface 架起來。

### Step 4：先做 Specialist Flow
因為單點任務比較容易先跑通，也能驗證來源→Evidence→Deliverable 鏈。

### Step 5：再做 Multi-Agent Flow
把 Host Agent + 4 個核心 Agent 跑通。

### Step 6：Deliverable / Recommendation / ActionItem 結構化輸出
讓結果不只是聊天。

### Step 7：任務歷史保存與回看
讓整個系統開始有累積價值。

這樣做的好處是：
- 風險較低
- 容易逐步驗證
- 能更快得到可用原型

---

## 15. 濃縮版結論

V1 的系統架構可以濃縮成：

> **一個以 Task 為入口、以 Source / Context / Evidence 為知識入口、以 Ontology 為骨架、以 Host Agent 為中樞、以 Core / Specialist Agents 為能力層、以 Model Router 為模型抽象層、以 Storage 為歷史與成果沉澱層的智能工作系統。**

這個架構的價值不在於複雜，
而在於：
- 能先做出來
- 能真的被使用
- 能支撐主流程
- 能為未來模組擴充留下空間

---

## 16. 已確認事項

1. **V1 先採分層架構**
2. **V1 先以 Task / Context / Evidence / Agent / Deliverable 為核心模組骨架**
3. **V1 的儲存策略先以務實可用為主，不追求一開始就做 graph database**
4. **檔案上傳與背景引用，在 V1 先以能進主流程為優先**
5. **Codex 的實作優先順序先從 Task / Context / Evidence / Specialist Flow 開始**
6. **檔案 / 雲端來源在系統架構中被明確視為知識入口層**

---

## 17. 結語

V1 的 System Architecture 成功標準，不是看起來多先進，
而是：
- 能不能把前面文件定下來的願景、Ontology、Agent 流程真正翻成可執行系統
- 能不能讓使用者真的完成任務、得到成果、保存歷史
- 能不能在不過度工程化的情況下，為未來模組與平台擴充留下正確底座
- 能不能讓檔案 / 雲端來源逐步長成知識入口與知識重用能力

> **先把系統骨架做對，Codex 才有辦法把你的宇宙真正蓋出第一個可用城市。**
