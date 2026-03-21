# 09_infinite_pro_core_definition.md

> 文件狀態：Baseline v1.0（高優先級產品準則）
>
> 本文件用於正式定義 **Infinite Pro** 的產品核心、角色分工、Ontology 定位、UX 原則與後續實作約束。若後續設計與本文件衝突，應優先回到本文件檢查並修正。

---

# Infinite Pro 核心定義 v1

## 一句話定位
Infinite Pro 是一套讓使用者以最少輸入，透過 ontology 驅動的結構化思考流程，產出顧問級分析、建議與行動方案的系統。

## 核心產品原則
Infinite Pro 的目標是做到：
1. 最簡單的輸入
2. 最系統化的分析
3. 最完整可用的產出

這代表：
- 使用者不需要先學會顧問框架，系統應主動幫助使用者把自然語言任務轉成可分析的案件結構
- 系統分析不是只靠 prompt 拼湊，而是建立在 ontology 定義的工作物件與關係之上
- 最終輸出不是只有長篇文字，而應是可直接使用的顧問級交付物，至少包含結論、風險、建議、行動項、缺漏資訊

## Ontology 的角色
在 Infinite Pro 中，ontology 不是資料庫同義詞，也不是單純分類表。
Ontology 是這套系統的共享世界模型（shared world model）與結構化思考骨架（structured reasoning skeleton）。

它的作用是：
- 定義系統如何理解任務
- 定義工作物件及其關係
- 讓 Host 與各種 agents 共用同一套分析語境
- 支撐 structured outputs、history、traceability 與多 agent 收斂

請不要把 ontology 簡化成「prompt 模板」或「一般分類欄位」。

## 系統角色分工
Infinite Pro 的核心分工如下：

- Ontology：
  定義系統如何理解世界與任務，提供結構化思考骨架

- Host：
  作為唯一 orchestration center，負責理解任務、選擇 workflow、管理分析治理、協調 agents、收斂結果

- Agents：
  提供不同專業視角或專門能力，用於 specialist flow 與 multi-agent flow

- LLM / Provider：
  負責語言理解、推理與生成，但不應取代 ontology 與 host 的結構化治理角色

- Deliverable：
  是顧問級產出，不只是模型回覆文字；應可被保存、回看、討論與後續行動使用

## Infinite Pro 不應退化成什麼
Infinite Pro 不應退化成：
- 純聊天機器人
- 單純 prompt 包裝工具
- 多個 specialist 功能拼湊的工具箱
- 只有平台感但沒有顧問式決策邏輯的企業後台

## Infinite Pro 應優先強化什麼
後續開發應優先強化：
1. 顧問式 intake flow
2. readiness / evidence sufficiency 治理
3. 顧問式結果頁與交付邏輯
4. ontology / work object visibility
5. evidence-to-recommendation traceability
6. mode-specific intake / output blocks under a shared task model

## UX 原則
Infinite Pro 的體驗原則是：
- 使用者可以用最自然、最低摩擦的方式輸入問題
- 系統應主動補齊顧問分析框架，而不是要求使用者先把框架填滿
- 進階模式可以存在，但應作為補充與干預，不應成為預設門檻
- 所有介面與預設輸出語言以繁體中文為預設，除非使用者明確要求英文

## 對後續實作的約束
未來所有功能設計、UI 調整、agent 擴充、provider 接入、knowledge ingestion、history 呈現，都應回到這份核心定義檢查是否仍符合 Infinite Pro 的產品初衷。

若某項設計會讓產品更像：
- chat-first 工具
- enterprise admin platform
- generic AI workspace

而不是「顧問案件工作台」，
則應重新檢查並優先修正。
