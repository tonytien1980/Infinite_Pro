# 04_ontology_core_v1.md

> 文件狀態：Baseline v1.1（補強版，可作為後續文件與開專案依據）
>
> 本文件用於定義 AI Advisory OS 在 V1 / MVP 階段的最小可行 Core Ontology，作為 Host Agent、核心 Agent、Structured Output、任務歷史保存、檔案背景引用與後續 Codex 開發的共同基礎。

---

## 1. 這份文件是拿來幹嘛的

這份文件不是要建立一個包山包海、一次涵蓋所有產業的完整本體論。

這份文件只做一件事：

> **定義 V1 真的需要的最小可行 Ontology，讓系統能夠穩定處理任務、共享背景、支撐多 Agent 收斂，並輸出結構化結果。**

這份文件會同時服務兩種對象：

1. **人類**：幫助你確認 V1 的世界模型是否在正確軌道上
2. **Codex / 工程端**：幫助後續開發時知道哪些核心物件一定要先做、彼此怎麼串接

---

## 2. 先講最白話的一句話

V1 的 Core Ontology 可以先理解成：

> **一套把任務、背景、證據、分析結果、風險、建議、行動項與最終成果，放進同一個系統語境中的結構。**

它的目的不是追求理論上的漂亮，
而是讓系統裡所有角色都知道：
- 現在在做什麼
- 根據什麼在分析
- 分析出了什麼
- 有哪些風險
- 最後建議什麼
- 下一步要做什麼

---

## 3. 為什麼 V1 一定要先有 Ontology

根據前面的文件，AI Advisory OS 的核心不是單純聊天，而是：
- 以 Ontology 作為共享世界模型
- 以 Host Agent 作為流程治理與收斂中心
- 以多 Agent 作為不同視角與能力承載方式
- 以結構化輸出與任務歷史保存累積價值

如果沒有 Ontology，系統很容易退化成：
- 一堆 prompt 串起來的流程
- 每個 Agent 都各自理解任務
- 分析結果難以沉澱
- 輸出只有一大段自然語言
- 單點任務與複合任務難以共用同一個骨架

所以 V1 要先有 Ontology，
但只需要先有一套**最小可行、可擴充、可落地**的版本。

---

## 4. V1 Ontology 的角色

V1 的 Core Ontology 在系統中至少要扮演 5 個角色：

### 4.1 任務理解骨架
讓系統知道：
- 目前在處理哪個任務
- 任務背景是什麼
- 任務目標是什麼
- 任務限制是什麼

### 4.2 多 Agent 的共享語境
讓 Host Agent 與其他 Agent 不是各自憑語感回答，
而是在同一套物件與關係上工作。

### 4.3 結構化分析容器
讓分析不是散落在聊天文字中，
而是能被整理成：
- 證據
- 洞察
- 風險
- 方案
- 建議

### 4.4 結構化輸出骨架
讓最後輸出可以自然形成：
- 報告
- 建議
- 行動項
- 任務成果

### 4.5 後續擴充的底座
讓未來新增模組、產業包、更多 Agent 時，
可以疊加在同一套骨架上，而不是重做一套新系統。

---

## 5. V1 Ontology 設計原則

### 5.1 先做最小可行，不追求全宇宙完整
V1 的目標是讓核心流程跑通，不是一次定義所有產業與所有規則。

### 5.2 先支援任務流，再支援產業細節
V1 先處理：
- 任務
- 背景
- 分析
- 收斂
- 輸出

而不是先做很細的產業專屬名詞體系。

### 5.3 先定工作物件，再定資料表欄位
這份文件先定義的是語義與關係，不是最終 DB schema。

### 5.4 同一套 Ontology 要能同時承載複合任務與單點任務
V1 既要支援多 Agent 收斂，也要支援合約審閱、研究整理、文件重組這類 Specialist 任務。

### 5.5 所有核心物件都要有未來擴充空間
V1 的物件定義要簡潔，但不能封死未來成長方向。

### 5.6 檔案與雲端來源是本體物件的重要來源，不是本體本身
這一點很重要。

系統中的：
- 上傳檔案
- 背景資料
- 歷史專案文件
- 未來可能接入的雲端來源

都不是 Ontology 本身，
而是 Ontology 物件的重要來源。

也就是說：
- 文件不是 `Evidence` 本身，但可以產生 `Evidence`
- 專案資料不是 `TaskContext` 本身，但可以補強 `TaskContext`
- 一份客戶簡報不是 `Recommendation`，但它可能支持某些 `Insight`、`Risk` 或 `Option`

更精確地說：

> **檔案 / 雲端來源提供原料，Ontology 負責把這些原料轉成系統能工作的物件。**

---

## 6. V1 最小可行 Ontology 鏈

先不要把 Ontology 想成很多抽象名詞。

你可以先把它想成 V1 一定要跑通的這條鏈：

> **Task → Context → Evidence → Insight / Risk / Option → Recommendation → ActionItem → Deliverable**

只要這條鏈能穩定跑通，V1 就已經具備：
- 任務入口
- 背景引用
- 多 Agent 分析
- 風險與方案整理
- 建議輸出
- 行動延伸
- 結果保存

這就是 V1 最核心的 Ontology 骨架。

---

## 7. V1 核心物件清單

V1 建議先定義以下 12 類核心物件。

### 7.1 Task

#### 角色
代表一個被系統處理的工作單位。

#### 白話理解
一次任務就是一個 Task，例如：
- 幫我分析這個提案需求
- 幫我審閱這份合約
- 幫我整理這份研究
- 幫我從多角度評估某個商業問題

#### 最少必要欄位
- id
- title
- description
- task_type
- mode（multi_agent / specialist）
- status
- created_at
- updated_at

#### 說明
Task 是所有後續物件的掛載起點。

---

### 7.2 TaskContext

#### 角色
代表任務的背景脈絡。

#### 白話理解
它是「這個任務目前的上下文包」，裡面可以放：
- 額外說明
- 背景摘要
- 使用者補充前提
- 假設條件

#### 最少必要欄位
- id
- task_id
- summary
- assumptions
- notes
- version

#### 說明
TaskContext 不一定等於一個檔案，它比較像這次任務的背景容器。

---

### 7.3 Subject

#### 角色
代表任務主要在分析的對象。

#### 白話理解
Subject 可以是：
- 一個客戶
- 一家公司
- 一份文件
- 一個提案
- 一個市場
- 一個專案
- 一個商業問題本身

#### 最少必要欄位
- id
- task_id
- subject_type
- name
- description
- source_ref

#### 說明
V1 先用泛化設計，不把它寫死成某一種類型，這樣未來擴充比較容易。

---

### 7.4 Goal

#### 角色
代表這次任務想達成的目的。

#### 白話理解
例如：
- 找出風險
- 提出提案方向
- 比較不同方案
- 給出審閱建議
- 形成下一步行動

#### 最少必要欄位
- id
- task_id
- goal_type
- description
- success_criteria
- priority

#### 說明
Goal 讓整個流程不會變成散漫的資訊整理。

---

### 7.5 Constraint

#### 角色
代表任務的限制條件。

#### 白話理解
例如：
- 時間限制
- 預算限制
- 法規限制
- 客戶偏好
- 技術限制
- 資源限制

#### 最少必要欄位
- id
- task_id
- constraint_type
- description
- severity

#### 說明
Constraint 用來避免 Agent 提出看似漂亮但不現實的建議。

---

### 7.6 Evidence

#### 角色
代表可被引用的背景材料與分析依據。

#### 白話理解
這是非常重要的物件，因為 V1 已明確需要：
- 檔案上傳
- 任務背景引用
- 文件作為審閱與分析依據

Evidence 可以來自：
- 上傳文件
- 文件切片
- 外部資料
- 任務背景說明
- 手動補充內容
- 未來可能接入的雲端來源資料

#### 最少必要欄位
- id
- task_id
- evidence_type
- source_type
- source_ref
- title
- excerpt_or_summary
- reliability_level

#### 說明
沒有 Evidence，Ontology 很容易停留在抽象層，接不住真實工作流。

---

### 7.7 Insight

#### 角色
代表分析過程中的重要觀察與中間判斷。

#### 白話理解
它是介於「原始證據」和「最終建議」之間的中間層。

例如：
- 競品定位出現明顯重疊
- 合約條文存在責任不對等風險
- 提案需求與預算存在落差
- 使用者需求其實偏向營運問題而非行銷問題

#### 最少必要欄位
- id
- task_id
- generated_by
- summary
- evidence_refs
- confidence_level

#### 說明
Insight 能讓分析過程被保存，而不是只留下最後結論。

---

### 7.8 Risk

#### 角色
代表在分析過程中被辨識出的風險。

#### 白話理解
例如：
- 法務風險
- 執行風險
- 資源風險
- 預算風險
- 品牌風險
- 時程風險

#### 最少必要欄位
- id
- task_id
- title
- description
- risk_type
- impact_level
- likelihood_level
- evidence_refs

#### 說明
V1 先不做複雜風險系統，但至少要有一致承載風險的物件。

---

### 7.9 Option

#### 角色
代表可被考慮的方案、路徑或做法。

#### 白話理解
當系統在做多視角分析時，常常不是只有一種答案，而是會出現：
- 方案 A
- 方案 B
- 方案 C

#### 最少必要欄位
- id
- task_id
- title
- description
- pros
- cons
- related_risk_refs

#### 說明
Option 讓比較與收斂變得更自然。

---

### 7.10 Recommendation

#### 角色
代表系統收斂後提出的建議方向。

#### 白話理解
Recommendation 是分析之後的採用建議，
它應該建立在 Goal、Evidence、Insight、Risk、Option 之上。

#### 最少必要欄位
- id
- task_id
- summary
- rationale
- based_on_refs
- priority
- owner_suggestion

#### 說明
Recommendation 比 Insight 更靠近決策與輸出。

---

### 7.11 ActionItem

#### 角色
代表可執行的下一步事項。

#### 白話理解
把建議變成：
- 下一步要做什麼
- 建議誰做
- 先後順序怎麼排
- 哪些東西要補件

#### 最少必要欄位
- id
- task_id
- description
- suggested_owner
- priority
- due_hint
- dependency_refs
- status

#### 說明
這個物件是未來工作流追蹤的重要接口。

---

### 7.12 Deliverable

#### 角色
代表最終輸出的任務成果。

#### 白話理解
例如：
- 分析報告
- 合約審閱摘要
- 研究整理結果
- 提案重組稿
- 問題診斷結果

#### 最少必要欄位
- id
- task_id
- deliverable_type
- title
- content_structure
- version
- generated_at

#### 說明
Deliverable 不應只是單一大段文字，而要有結構。

---

## 8. 物件之間的核心關係

V1 先把關係控制在最關鍵、最實作導向的版本。

### 8.1 任務入口關係
- Task has TaskContext
- Task targets Subject
- Task has Goal
- Task has Constraint
- Task uses Evidence

### 8.2 分析中介關係
- Evidence supports Insight
- Evidence supports Risk
- Goal shapes Option
- Constraint limits Option
- Insight informs Recommendation
- Risk informs Recommendation
- Option informs Recommendation

### 8.3 輸出與延伸關係
- Recommendation derives ActionItem
- Recommendation contributes to Deliverable
- ActionItem can be included in Deliverable

你可以把它看成：

> 背景與證據進來 → 分析中介物件形成 → 建議形成 → 行動與成果輸出。

---

## 9. Host Agent 如何使用這套 Ontology

Host Agent 在 V1 中不是單純總結聊天內容，
而是在管理一組工作物件。

### 9.1 在任務起點
Host Agent 需要先理解：
- Task
- TaskContext
- Subject
- Goal
- Constraint

### 9.2 在分析過程中
Host Agent 需要管理：
- Evidence
- Insight
- Risk
- Option

### 9.3 在收斂輸出時
Host Agent 需要形成：
- Recommendation
- ActionItem
- Deliverable

也就是說，Host Agent 的工作本質是：

> **把一個任務帶著背景與證據，穿過分析中介層，最後整理成結構化成果。**

---

## 10. 核心 Agent 如何共享這套 Ontology

V1 預計會有 3~5 個核心 Agent，
它們不應各自活在不同語境裡，
而應都共用這套 Core Ontology。

例如：
- Strategy Agent 更關心 Goal、Option、Recommendation
- Operations Agent 更關心 Constraint、Risk、ActionItem
- Market / Insight Agent 更關心 Evidence、Insight、Option
- Risk / Challenge Agent 更關心 Risk、Constraint、Recommendation

雖然關注重點不同，
但它們處理的仍然是同一個 Task 世界。

這就是 Ontology 對多 Agent 的真正價值。

---

## 11. 單點 Specialist 任務如何復用同一套 Ontology

V1 的三個單點任務：
- 合約審閱
- 研究整理
- 文件 / 提案重組

不需要各自建立一套完全不同的本體論。

它們可以共用同一套骨架，只是偏重不同物件。

### 11.1 合約審閱
偏重：
- Task
- TaskContext
- Evidence
- Goal
- Constraint
- Risk
- Recommendation
- Deliverable

### 11.2 研究整理
偏重：
- Task
- TaskContext
- Evidence
- Insight
- Goal
- Deliverable

### 11.3 文件 / 提案重組
偏重：
- Task
- TaskContext
- Evidence
- Goal
- Recommendation
- Deliverable

這樣做的好處是：
- 平台骨架一致
- 輸入與輸出邏輯一致
- 未來模組擴充更容易

---

## 12. Codex 實作時應如何理解這份 Ontology

對 Codex 來說，這份文件不是要它立刻做出最終完整 graph database。

這份文件真正的作用是：

### 12.1 先定核心 domain model
Codex 實作時，至少應把這 12 類物件視為 V1 的核心 domain entities。

### 12.2 先支援主流程
Codex 不需要先做所有細緻欄位、所有類型、所有規則，
而是先支援 MVP 最重要的那條鏈跑通。

### 12.3 先支援結構化輸入與輸出
Ontology 的價值不是存在文件裡，
而是要進入：
- 任務建立
- 檔案引用
- 分析結果保存
- 建議形成
- 行動項輸出
- 任務歷史保存

### 12.4 先留擴充口，不先做完整宇宙
Codex 在設計資料結構時，應保留擴充空間，
但不要一開始就過度工程化。

---

## 13. V1 不先做的 Ontology 範圍

為避免過度設計，以下內容 V1 先不完整納入：

### 13.1 完整 Stakeholder / 組織層本體
例如：
- 部門樹
- 完整組織圖
- 複雜職責對應

### 13.2 完整 Decision 本體
V1 先用 Recommendation + ActionItem 承接，
暫不獨立做複雜決策物件。

### 13.3 完整產業專屬 Ontology
例如：
- 公關專屬完整術語體系
- 教育產業完整課程與招生模型
- 法務完整契約類型體系

### 13.4 完整工作流狀態機
例如：
- 複雜審批流程
- 依賴圖
- 自動化規則引擎

### 13.5 完整 Agent 生態本體
例如：
- 外部 Agent Market
- 能力評分市場
- 外部 Agent 授權體系

V1 應先把底座做對，而不是把所有未來功能都先建模完。

---

## 14. 濃縮版結論

V1 的 Core Ontology 不需要一次畫完整宇宙。

V1 需要的是一條真正能運作的最小鏈：

> **Task → Context → Evidence → Insight / Risk / Option → Recommendation → ActionItem → Deliverable**

只要這條鏈跑得動，
你就已經有了：
- 任務入口
- 背景引用
- 共享世界模型
- 多 Agent 共享語境
- 收斂建議
- 行動輸出
- 歷史沉澱
- 模組擴充基礎

---

## 15. 已確認事項

1. **V1 先使用這 12 類核心物件，不再一開始做更大的宇宙**
2. **`Subject` 採泛化物件設計**
   - 可承載客戶、公司、文件、提案、市場、專案等
3. **V1 暫不加入 `Stakeholder` 作為核心本體物件**
4. **V1 暫不獨立加入 `Decision`，先由 `Recommendation + ActionItem` 承接**
5. **`Deliverable` 先不細分內部版 / 外部版**
6. **檔案 / 雲端來源被明確視為本體物件的重要來源層，而不是本體本身**

---

## 16. 結語

V1 的 Ontology 不是為了證明理論完整，
而是為了讓系統真的可以開始工作。

它的成功標準不是「包山包海」，
而是：

- 能不能讓 Host Agent 與其他 Agent 在同一個世界裡合作
- 能不能讓任務、背景、分析與輸出真正串起來
- 能不能支撐 MVP 的主流程
- 能不能為未來模組擴充留下穩定底座

> **先把最小可行本體鏈做對，未來的宇宙才有地方長。**
