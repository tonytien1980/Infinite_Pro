# Multi-Consultant Ontology Intelligence Readiness Design

日期：2026-05-01
狀態：approved design spec

## 1. Purpose

這份文件是 Infinite Pro 下一階段的規格討論文件。

它不是 implementation plan，也不是 active source of truth。

它的目的，是把目前全面盤點與討論後的下一步方向收成已認可的設計規格。方向經老田確認後，下一步會另外落成 implementation plan，之後才進入實作。

本文件要回答：

1. Infinite Pro 下一階段應優先補什麼
2. 哪些現有產品方向要調整或補強
3. 多位顧問使用時，產品應先做到哪個成熟度
4. shared intelligence 要如何從「會留下回饋」走向「真的越用越好」
5. 後續 spec -> plan -> implementation -> docs/code sync 的工作流程應如何固定

## 2. Process Position

Infinite Pro 後續正式產品工作應採以下流程：

1. 先建立規格討論文件
2. 與老田反覆討論、修訂方向與範圍
3. 老田確認後，將討論稿定案為可執行 spec
4. 再建立 implementation plan
5. 老田確認 implementation plan 後，才進入實作
6. 實作階段必須同步更新正式 active docs 與程式碼
7. 有真實驗證後，才更新 `docs/04_qa_matrix.md` 或 `docs/05_benchmark_and_regression.md`
8. 若工作要保留或交付，必須完成本機與 GitHub 狀態同步，或明確回報不同步原因

這個流程是正確的，原因如下：

- Infinite Pro 的產品邊界大，不能靠臨場想法直接施工。
- 目前 active docs 已是正式 source of truth，不能讓程式碼先跑到文件前面。
- 規格討論文件可以容納未定案想法，但不污染 active docs。
- implementation plan 可以把已定案方向拆成可驗證的小切片。
- 實作階段再同步 active docs，可避免文件講未 shipped 的能力。

正式規則：

- `docs/superpowers/specs/` 放討論與設計文件。
- `docs/superpowers/plans/` 放已準備施工的 implementation plan。
- `docs/00` 到 `docs/06` 只放已定案、已對齊或已 shipped 的正式產品事實。
- 不在 implementation plan 前直接改程式碼。
- 不用外部產品方向重新定義 Infinite Pro。

## 3. Direction Decision

本輪不吸收 Nautilus 路線。

Nautilus 類型的啟發可作為市場敘事觀察，但不進 Infinite Pro 下一階段產品方向。

Infinite Pro 下一階段仍走原本主線：

> 以 Palantir ontology 方法論啟發的 ontology-first consulting intelligence system，先服務顧問的完整工作世界，再讓多位顧問各自使用時留下的歷程逐步強化 shared intelligence。

正式不做：

- 不改成 IM Bot-first 產品
- 不改成五大 AI 員工模組
- 不改成 generic enterprise AI platform
- 不先做公開 multi-tenant SaaS shell
- 不新增第七層架構
- 不讓 UI 取代 Host orchestration

### 3.1 已認可的討論決策

以下決策已在 2026-05-01 的討論中獲得老田認可：

| 決策 | 中文方向 | 產品含義 |
| --- | --- | --- |
| `Single Firm Private Beta` | 單一 firm、3 到 5 位顧問、各自辦案、共用 shared intelligence | 下一階段不是 public SaaS，而是一個顧問團隊多人使用 |
| `Auto-Share With Risk Gates` | 自動共享，風險攔截 | trusted consultants 的回饋預設進 shared intelligence，但高風險內容要攔截或降權 |
| `Case Privacy By Default` | 案件預設隔離，智慧抽象共享 | 顧問彼此不看原始案件，只共享抽象後的可重用智慧 |
| `Owner Governance, Not Surveillance` | owner 負責治理，不做監控後台 | owner 能治理品質、資料、provider 與 shared intelligence，但不做顧問排名或績效監控 |
| `Personal Key First, Firm Default Fallback` | 個人 key 優先，事務所預設備援 | 顧問可用自己的模型 key；沒有提供時才用 firm default；不做計費系統 |

這些決策屬於本 approved design spec 的已認可方向，尚未代表 implementation plan 已完成，也尚未代表 active docs 已同步。

## 4. Current Product Reading

目前 Infinite Pro 應理解為：

- 已是 ontology-first consulting workbench
- 已有 world-first case chain
- 已有 Host orchestration
- 已有 evidence / deliverable / history / continuity baseline
- 已有 single-firm cloud foundation
- 已有 owner / consultant / demo 邊界
- 已有 provider boundary 與 current-member-aware provider resolution
- 已有 shared intelligence baseline
- 已有 Shell v2 與 dual-layer language direction

但目前仍不能高估為：

- 完整多顧問正式上市產品
- 公開 multi-tenant SaaS
- 成熟 self-optimizing consultant brain
- 完整 business outcome attribution engine
- 完整 release / ops / support ready product

比較精準的判斷是：

> Infinite Pro 已具備單一顧問與單一 firm 內部化使用的產品骨架，下一階段應補到可支援 3 到 5 位顧問 private beta，而不是直接公開上市。

## 5. Next-Phase Name

建議下一階段名稱：

> Multi-Consultant Ontology Intelligence Readiness

這個名稱刻意不使用 `multi-tenant SaaS`、`enterprise admin` 或 `AI employee platform`。

它的意思是：

- 多位顧問可以各自使用 Infinite Pro 工作
- 每位顧問不一定共同處理同一案件
- 每個案件仍走 CaseWorld / Evidence / Deliverable / Writeback 主鏈
- 使用歷程、回饋、precedent、playbook、template 會回流到 shared intelligence
- shared intelligence 再由 Host 安全地回饋到後續案件

## 6. Target Launch Level

下一階段不應以公開上市為目標，而應以 private beta readiness 為目標。

建議分三層：

| 層級 | 目標 | 判斷 |
| --- | --- | --- |
| Internal dogfood | 老田與核心使用者持續辦真實案件 | 已接近可持續使用 |
| Single-firm private beta | 3 到 5 位顧問各自使用、共用 firm intelligence | 下一階段主目標 |
| Public multi-firm SaaS | 多公司、多租戶、計費、支援、營運化 | 暫不進入 |

下一階段的成功不是「功能更多」。

下一階段的成功是：

> 多位顧問可以各自完成真實案件，而且系統能安全、可審核、可解釋地把使用歷程變成下一次工作的幫助。

## 7. Primary Work Directions

### 7.1 Direction A: Private Beta Operating Boundary

要先定清楚 private beta 的使用方式。

已認可邊界：

- 單一 firm
- 3 到 5 位顧問
- 每位顧問各自辦自己的案件
- owner 可以管理成員、provider allowlist 與 shared intelligence governance
- consultant 可以建立案件、上傳材料、產出結果、留下回饋
- demo workspace 仍維持隔離，不混入正式 firm workspace

這一方向要補的不是新功能，而是驗收邊界。

需要回答：

- 顧問是否能只看到自己該看的工作內容
- owner 是否能看見整體 firm operating posture
- demo / consultant / owner 的行為是否都 fail closed
- private beta 前是否有足夠的最小操作說明

### 7.2 Direction B: Shared Intelligence Governance

這是下一階段最重要的產品核心。

目前系統已經有 feedback、precedent candidate、organization memory、domain playbook、deliverable template 等基礎。

下一階段要把它們收成更清楚的使用閉環，但不採逐筆 owner 審核。

已認可方向：

> 自動共享，風險攔截。

預設邏輯：

1. 顧問完成案件或結果
2. 顧問標記採用、未採用、原因與補充說明
3. 系統自動產生 shared intelligence candidate
4. 低風險 candidate 預設進入 shared intelligence，但先以較弱權重使用
5. 後續若跨案件、跨顧問被採用，才逐步升權
6. 若命中特定風險條件，進入需檢查狀態或降權
7. Host 在後續案件中只引用 prompt-safe guidance
8. 後續結果再被回饋，形成可追蹤的改善歷程

建議狀態：

| 狀態 | 意思 | Host 使用方式 |
| --- | --- | --- |
| `provisional` | 顧問回饋後自動進入 | 只能作為提醒、弱訊號或參考 |
| `validated` | 多次採用、跨案件有效、沒有明顯負面回饋 | 可以成為較強 reusable guidance |
| `needs_review` | 命中敏感、高風險、低信心或負面回饋條件 | 暫不升權，進入治理視圖 |

風險攔截條件至少應包含：

- 疑似客戶名稱、個資、價格、合約細節或敏感商業機密
- 只在單一特殊案件成立，缺乏泛化信心
- 法務、財務、合規或高風險建議
- 被顧問標記為不適用、誤導、情境特殊或需要修正
- 來源 evidence 不足或 provenance 不清楚

正式規則：

- shared intelligence 不是 raw case history search。
- shared intelligence 不是把所有顧問的資料直接灌回模型。
- shared intelligence 必須由 Host 做選取、壓縮、引用與安全邊界控制。
- shared intelligence 不應變成顧問排名或黑箱正確率分數。
- owner 不應被迫逐筆審核 trusted consultants 的每個回饋。

### 7.3 Direction C: Consultant Usability For Junior To Senior Users

目前 Shell v2 與 dual-layer language 已改善前台負擔，但 `docs/06` 仍明確指出 `G` 項尚未完成。

下一階段要特別處理：

- 初階顧問第一次進來是否知道怎麼開始
- 中階顧問是否知道如何補件、比較方案、產出報告
- 高階顧問是否覺得系統有槓桿，而不是只是一套表單
- 每頁是否仍維持一個 primary action
- 高流量頁是否仍遵守第一層簡單、第二層專業、第三層內部的語言系統

這一方向的重點不是再做大 redesign，而是做 beta 前的 usability closure。

### 7.3.1 Case Privacy And Owner Governance

多顧問 private beta 的資料邊界應採：

> 案件預設隔離，智慧抽象共享。

正式方向：

- 顧問彼此預設看不到對方原始案件。
- shared intelligence 只共享抽象後的判斷模式、風險提醒、模板、playbook 與可重用經驗。
- Host 不可把其他顧問的 raw case content 直接帶入當前案件。
- owner 可以看全局、處理治理與風險，但首頁與主工作台不做成監控後台。
- 不做顧問排名、績效榜、黑箱正確率榜或產能監控 dashboard。
- owner 的重點是治理 shared intelligence、provider、安全與產品品質，不是盯人。

### 7.4 Direction D: Provider, Cost, And Usage Guardrails

多位顧問使用後，provider 與成本會從設定問題變成營運問題。

已認可方向：

> 個人 key 優先，事務所預設備援。

具體規則：

- 顧問可以設定自己的 provider / model key。
- 顧問有自己的可用 key 時，優先使用個人 key。
- 顧問沒有提供 key 時，才使用 owner / firm 的預設 provider。
- owner 可以限制 firm 允許使用的 provider / model。
- demo 使用者不能跑正式分析。
- 若顧問自己的 key 不可用，系統要清楚說明原因，並可依設定退回 firm default。
- 不做計費系統、不做 credits、不做 subscription、不做 invoice。
- 第一版只做 provider 可用狀態、錯誤原因與必要的高成本提醒。

這一方向不是 cost accounting。

它是 provider safety and usage awareness，目的是避免多顧問使用時出現「不知道誰能用什麼模型、為什麼跑不了、是否誤用高成本模型」的狀況。

### 7.5 Direction E: Release, QA, And Ops Readiness

如果要讓複數顧問使用，產品不能只靠本機手動測試信心。

下一階段需要把 release readiness 補成可重複節奏：

- authenticated browser smoke 更自動化
- build -> typecheck 的順序固定
- backend test / frontend test / browser smoke 的 gate 分層固定
- QA evidence 只在真實驗證後寫入 `docs/04_qa_matrix.md`
- benchmark / regression 只在 suite 或 gate 行為改變時更新 `docs/05_benchmark_and_regression.md`
- deployment / backup / restore / logs / secret posture 至少有 private beta 等級的說明

這一方向不等於完整 DevOps 平台。

它只是讓 private beta 不靠運氣。

### 7.6 Direction F: Data Hygiene And Historical Noise

前面已經出現過測試資料、歷史資料與入口文字造成混亂的問題。

private beta 前要再次處理：

- 測試資料與正式資料的界線
- demo data 與 firm workspace data 的隔離
- 歷史清理入口是否容易誤解
- 舊資料是否殘留舊用字
- legacy task_id / CaseWorldState bridge 是否有足夠誠實標示

這一方向不是要刪掉歷史能力。

它是要避免 beta 顧問一進來就看到測試殘留和混亂資料。

## 8. Recommended Priority

建議排序如下：

1. `Private Beta Operating Boundary`
2. `Shared Intelligence Governance`
3. `Consultant Usability For Junior To Senior Users`
4. `Provider, Cost, And Usage Guardrails`
5. `Release, QA, And Ops Readiness`
6. `Data Hygiene And Historical Noise`

原因：

- 先定 private beta 邊界，才知道要驗收什麼。
- shared intelligence 是 Infinite Pro 的核心差異化，不能只停在功能存在。
- usability 決定顧問是否真的願意用。
- provider / cost 在多顧問場景會立刻變成風險。
- release / QA / ops 是 private beta 的穩定底座。
- data hygiene 應在 beta 前收，但不應取代主線。

## 9. First Implementation Plan Boundary

如果本文件方向定案，第一份 implementation plan 不建議一次包全部六個方向。

已認可第一份 plan 範圍：

> Private Beta Operating Boundary + Shared Intelligence Governance + Personal Key First / Firm Default Fallback 的最小可驗收版本

第一份 plan 的建議目標：

- 不改產品定義
- 不新增第七層架構
- 不重做整個 UI
- 不做 public SaaS
- 不做完整 billing
- 先把 single-firm multi-consultant private beta 的權限、資料、回饋、shared intelligence、provider fallback 閉環驗收補齊

第一份 plan 應明確包含：

- 權限與資料邊界測試
- shared intelligence candidate / promote / dismiss / restore 的產品驗收
- auto-share risk gates 的資料與 Host 使用規則
- Host-safe reusable guidance 的驗收
- personal key first / firm default fallback 的 provider 行為驗收
- 顧問與 owner 可見文案的低噪音調整
- QA evidence 寫入規則
- active docs 同步規則

## 10. Active Docs Sync Strategy

本討論稿定案後，實作階段應依實際行為更新 active docs：

| 行為類型 | 應同步文件 |
| --- | --- |
| 產品定位或下一階段方向正式改變 | `docs/00_product_definition_and_current_state.md`, `docs/06_product_alignment_and_85_point_roadmap.md` |
| runtime object / feedback / shared intelligence contract 改變 | `docs/01_runtime_architecture_and_data_contracts.md`, `docs/02_host_agents_packs_and_extension_system.md` |
| 顧問工作面、文案、可見行為改變 | `docs/03_workbench_ux_and_page_spec.md` |
| 真實測試、build、typecheck、browser QA 完成 | `docs/04_qa_matrix.md` |
| benchmark suite、manifest、gate 行為改變 | `docs/05_benchmark_and_regression.md` |

正式規則：

- 不能只改 spec / plan，不改 active docs。
- 不能只改 code，不改 active docs。
- 不能沒有驗證就更新 QA matrix。
- 不能把尚未實作的能力寫成已 shipped 事實。

## 11. Approval Questions

這份文件需要老田決策的問題：

已認可：

1. private beta 的第一個目標先設為單一 firm、3 到 5 位顧問。
2. 顧問各自辦案，共用 shared intelligence。
3. shared intelligence 採自動共享、風險攔截，不採 owner 逐筆審核。
4. 顧問彼此預設看不到原始案件，只共享抽象後的 intelligence。
5. owner 負責治理，不做監控後台。
6. provider 採個人 key 優先、事務所預設備援，不做計費系統。
7. 第一份 implementation plan 範圍包含多顧問權限與案件隔離、shared intelligence 自動共享與風險攔截、provider 個人 key 優先與 firm fallback。

已確認：

1. 下一階段是否正式採用 `Multi-Consultant Ontology Intelligence Readiness` 作為主線名稱？
2. 本文件是否可從 `draft discussion` 升級為 approved design spec？
3. 是否開始撰寫第一份 implementation plan？

## 12. Self-Review

本文件檢查結果：

- 沒有把 Nautilus 或其他外部方案吸收成產品方向。
- 沒有新增第七層架構。
- 沒有把 Infinite Pro 改成 chatbot、IM bot、admin console 或 generic SaaS shell。
- 沒有把 private beta 誤寫成 public launch。
- 沒有把 shared intelligence 誤寫成模型權重自動學習。
- 沒有把未實作能力寫入 active docs。
- 保留了 spec discussion -> implementation plan -> implementation -> active docs/code sync 的工作流程。
