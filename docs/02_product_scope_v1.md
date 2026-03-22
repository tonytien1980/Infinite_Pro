# 02_product_scope_v1.md

> 文件狀態：Governance Reset v2.0（正式產品範圍文件）
>
> 本文件延續既有檔名以維持文件索引穩定，但內容已不再採用「V1 / MVP 作為產品能力邊界」的規劃方式。

---

## 1. 文件目的

本文件現在要回答的是：

1. **Infinite Pro 的正式產品能力邊界是什麼？**
2. **在單人顧問前提下，哪些能力必須從第一天就被納入正式架構？**
3. **哪些事情屬於實作順序的先後，而不是能力範圍的刪減？**
4. **哪些事情屬於多使用者系統層，而不是單人顧問完整工作台本身？**

本文件是產品能力邊界文件，不是縮小版施工文件。

---

## 2. 正式產品定位

Infinite Pro 現在應被定義為：

> **單人顧問完整工作台（Single-Consultant Full-Scope Edition）**

這代表：
- 產品一開始就要完整承接單一顧問的工作需求
- ontology、Host Agent、multiple specialist agents、industry packs、consulting workbench UI 都屬於正式主架構
- 可以分批實作，但不能把能力邊界縮成小型 MVP
- 現階段只限制使用拓撲為單人，不限制產品能力範圍

---

## 3. Full-scope by capability 的規劃原則

Infinite Pro 的規劃方式應改為：

> **Full-scope by capability, phased by implementation order, single-user first, multi-user later**

也就是：
- 能力邊界先完整定義
- 實作順序可以分批
- 多人系統能力之後再做

不再採用：
- 以 MVP 作為產品能力邊界
- 先只做少數 domain / 少數 mode 作為正式產品範圍
- 先把 ontology / Host / industry packs 降成後補項目

---

## 4. 正式能力邊界

### 4.1 客戶成長階段
Infinite Pro 的正式能力邊界必須涵蓋：
- `創業階段`
- `制度化階段`
- `規模化階段`

### 4.2 客戶型態
必須涵蓋：
- 中小企業
- 個人品牌與服務
- 自媒體
- 大型企業

### 4.3 顧問面向
必須正式承接：
- 營運
- 財務
- 法務
- 行銷
- 銷售
- 募資
- 以及其他可擴充顧問面向

### 4.4 正式能力面
Infinite Pro 應被設計為可承接以下顧問工作能力：
- diagnosis / assessment
- decision convergence
- review / challenge
- research / synthesis
- restructuring / reframing
- planning / roadmaping
- risk surfacing
- scenario comparison
- deliverable shaping

這些是正式能力邊界的一部分，不應只因為第一波尚未全部做滿，就被視為「不在產品範圍內」。

---

## 5. 正式主架構邊界

以下六層都屬於第一天就存在的正式主架構：

1. **Ontology Layer**
2. **Context Layer**
3. **Capability Layer**
4. **Agent Layer**
5. **Industry Pack Layer**
6. **Workbench / UI Layer**

此外，以下跨層責任也屬於正式範圍：
- provider abstraction
- source ingestion
- evidence creation
- history persistence
- traceability
- deliverable-centric output shaping

---

## 6. 產品核心使用情境

Infinite Pro 的核心使用情境不是「少量功能頁」，
而是單一顧問在真實工作中反覆面對的完整案件循環。

### 6.1 案件與決策工作
- 客戶需求理解
- 問題 framing
- 決策比較與收斂
- 風險辨識
- 行動規劃

### 6.2 審閱與挑戰工作
- 合約審閱
- 提案審閱
- 制度文件審閱
- 財務或募資材料審閱
- 策略與執行假設挑戰

### 6.3 研究與整理工作
- 市場研究整理
- 會議材料整理
- 跨來源資訊綜整
- decision brief 形成

### 6.4 重組與交付工作
- 文件重構
- 提案重組
- 內部決策 memo
- roadmap / action plan
- 可供客戶或內部使用的交付物整理

---

## 7. 正式產品範圍（In Scope）

以下都屬於產品正式範圍，而不是未來附加項：

### 7.1 Ontology-first 工作模型
系統必須以 objects、properties、links、actions、workflows、decision context 來建模顧問工作。

### 7.2 Host Agent 作為唯一 orchestration center
Host Agent 必須正式負責：
- task / decision framing
- workflow selection
- specialist routing
- readiness governance
- evidence sufficiency judgment
- result convergence
- deliverable shaping

### 7.3 Multiple agents
系統必須正式承接：
- reasoning agents
- specialist agents
- 後續可擴充 agent families

### 7.4 Industry packs
Industry packs 必須是正式能力層，而不是標籤。

### 7.5 Consulting workbench UI
UI 必須正式朝顧問工作台設計，而不是只做表單頁與結果頁。

### 7.6 Source / Evidence / History / Traceability
檔案、外部來源、evidence、deliverable、history、traceability 都屬於正式能力的一部分。

### 7.7 Provider abstraction
模型供應商不可被硬綁死。

---

## 8. 不屬於本輪核心能力邊界的內容

以下屬於後續 multi-user system layer，而不是單人顧問完整工作台的定義：

- 多人登入
- 多顧問協作
- 多公司專案同步
- 多租戶治理
- workspace 權限系統
- per-user API key 管理
- enterprise admin / governance console

這些不是產品正式能力邊界的中心，而是之後的系統拓撲擴張。

---

## 9. 實作順序的正確理解

Infinite Pro 之後仍可以分波實作，但分的是：
- implementation order
- technical rollout order
- adoption order

不是分：
- product capability legitimacy
- architecture existence
- whether a layer belongs to the system at all

正確問法應該是：
- 哪些正式能力先落地？
- 哪些正式 layers 先實作第一波？
- 哪些 object / links / workflows 先形成可用版本？

而不是：
- 哪些東西先不算產品的一部分？

---

## 10. 對後續文件與實作的約束

後續 Ontology、Agent、系統架構、施工文件與 Codex handoff 都應遵守以下原則：

1. 不再使用 MVP 作為產品能力邊界
2. 不再把少數 domain / 少數 mode 當成正式產品上限
3. 不再把最小 ontology 視為最終主骨架
4. 不再把 3 個 specialist flows 當成正式產品分類
5. 不再把 4 core agents + 3 specialist agents 當固定上限
6. 改用 full-scope by capability + phased by implementation order

---

## 11. 成功標準

Infinite Pro 的成功標準不再是：
- 「先做出一個縮小版顧問工具」

而是：

> **從第一天就以完整單人顧問工作台為正式目標，並用分批實作方式逐步把這個正式架構落地。**
