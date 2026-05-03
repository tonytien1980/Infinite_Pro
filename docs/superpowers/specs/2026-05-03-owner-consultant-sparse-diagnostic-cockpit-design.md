# Owner-Consultant Sparse Diagnostic Cockpit Design

日期：2026-05-03

狀態：draft for 老田 review

對應 alignment 文件：

- `docs/superpowers/specs/2026-05-03-owner-consultant-85-point-product-alignment.md`

對應 85 分拉動：

- 主要：G. 初階到高階顧問都能輕易使用
- 主要：F. 成熟產品度
- 次要：A. ontology-first 顧問分析工具
- 次要：E. 一次性報告與持續深化案件

---

## 1. Purpose

老田已確認第一輪核心是：

> Owner-consultant real-work cockpit：讓老田本人願意用 Infinite Pro 跑真實顧問案件。

第一條驗收主線選定為：

> A. 少資料快速診斷案

這份設計文件要把這條主線收成可實作、可驗收、可回頭評分的產品 slice。

這不是另一次大規模 UI redesign。

這一輪要處理的是：

- 少資料起手時，老田是否能快速建立案件
- 系統是否能立即回答「現在主線是什麼」
- 系統是否能說清楚「目前最卡的是什麼」
- 系統是否能指引「下一步先補資料、先跑分析，還是先看結果」
- 跑完後是否能形成老田願意看的第一版顧問結果
- 老田是否能低負擔給回饋，讓這次判斷有機會進入 shared intelligence

成功標準不是「頁面更漂亮」。

成功標準是：

> 老田可以用這條 loop 處理一個真實或高擬真的模糊顧問問題，並覺得 Infinite Pro 是在協助自己工作，而不是要求自己先理解系統。

---

## 2. Existing Foundation

這一輪不是從零開始。

目前已存在的基礎包括：

- `diagnostic_start`
  - 少資料起手已可映射成「先快速看清問題與下一步」
- `CaseWorldState`
  - 案件世界已是 matter-level authority center
- `matter_command`
  - matter 已有案件主線、blocker、下一步的 command read model
- `task detail usability`
  - task 頁已能回答能不能跑、缺什麼、跑完去哪裡
- `case command loop v1`
  - `matter -> task -> deliverable -> writeback` 已開始形成案件指揮鏈
- `Shell v2`
  - workbench 已有低噪音第一屏與 local rail 基礎
- `dual-layer language`
  - 第一層語言已朝顧問可讀收斂
- `adoption feedback`
  - 結果與建議已有低負擔回饋基礎

因此本輪設計不應重建這些東西。

本輪應該補的是：

- 把少資料診斷 loop 變成老田能直接使用的一條工作路徑
- 把各頁已有的好東西串成一條「顧問下一步」主線
- 把多個 helper / read model 的輸出收成更少、更可行動的 first-layer guidance

---

## 3. User Story

老田作為顧問，遇到一個資訊不足、但必須快速判斷方向的客戶問題。

他希望打開 Infinite Pro 後可以：

1. 用很少輸入建立案件
2. 不需要先懂 workflow 代號
3. 馬上知道這案目前是少資料診斷
4. 馬上看到系統判斷的主線、卡點、下一步
5. 若資料不足，知道要補什麼
6. 若可以先跑分析，知道跑完會產出什麼
7. 跑完後能看到一份可讀、可追溯、可討論的第一版結果
8. 能標記這份結果是否有用、哪裡要修、是否可作為後續模板或判斷模式
9. 能決定要補資料、重跑、延續，或先收口

---

## 4. Product Problem

目前少資料診斷的能力已存在，但對 owner-consultant 的實際使用仍可能卡在三個地方。

### 4.1 Loop 分散

目前 `/new`、`/matters/[id]`、`/tasks/[id]`、`/matters/[id]/evidence`、`/deliverables/[id]` 各自都比以前清楚。

但老田實際工作時要的不是「每一頁都有說明」。

他要的是一條連續 loop：

> 建案 -> 判斷主線 -> 補資料或跑分析 -> 看結果 -> 給回饋 -> 下一步

### 4.2 診斷狀態不夠像 cockpit

`diagnostic_start` 已存在，但使用者仍可能感覺：

- 這只是系統標籤
- 不確定現在應先補資料還是直接跑
- 不確定目前這輪最多能交到哪裡
- 不確定系統產出後如何回到案件主線

### 4.3 驗收缺少 owner-consultant 標準

過去 QA 多半驗證：

- API 正確
- UI 文字正確
- build / typecheck / tests 正確

這些必要但不夠。

這輪要新增一個更直接的產品驗收：

> 老田能否用這條 loop 處理真實顧問問題。

---

## 5. Design Direction

本輪正式設計方向：

> Sparse Diagnostic Cockpit Loop

它不是新頁面，也不是新 dashboard。

它是把既有 workbench surfaces 收成一條 owner-consultant 的少資料診斷操作 loop。

### 5.1 Loop contract

本輪每個相關 surface 都要共同服務同一條 loop：

1. `/new`
   - 讓老田用少量文字快速起案
   - 清楚告訴他這是「先快速看清問題與下一步」

2. `/matters/[id]`
   - 第一屏回答：
     - 現在主線
     - 目前卡住原因
     - 下一步最建議做什麼
   - 不把所有案件資訊同權重攤開

3. `/tasks/[id]`
   - 第一屏回答：
     - 這輪能不能跑
     - 如果不能跑，缺什麼
     - 如果能跑，跑完會去哪裡
   - 少資料情境下要更明確說「這輪最多支撐探索型結果，不要假裝已能正式決策」

4. `/matters/[id]/evidence`
   - 只回答補資料決策：
     - 目前缺什麼
     - 補了會升級到哪條主線
     - 可以先不用補什麼

5. `/deliverables/[id]`
   - 第一屏回答：
     - 這份結果能拿來做什麼
     - 可信邊界在哪
     - 下一步是補資料、延續，還是先收口
   - feedback 必須靠近顧問閱讀結果的地方，而不是像事後治理表單

### 5.2 First-layer rule

每個 surface 的第一層都只回答三件事：

- 現在是什麼狀態
- 最重要的限制或機會是什麼
- 下一步先做什麼

其他內容全部放第二層。

### 5.3 Owner-consultant acceptance rule

這一輪不以「看起來更完整」為驗收標準。

驗收標準是：

- 老田是否能用這條 loop 開始工作
- 老田是否知道下一步
- 老田是否覺得系統少了理解成本
- 老田是否願意用它跑下一個真實問題

---

## 6. Proposed Slices

### Slice 1: Sparse diagnostic loop map and route proof

目的：

- 先建立一份可測的少資料診斷 loop map
- 讓前端測試能驗證 `/new -> matter -> task -> evidence -> deliverable` 的主要路徑文案與 CTA 不互相打架

可能內容：

- 新增 frontend helper：`owner-consultant-cockpit.ts`
- 統一 sparse diagnostic loop 的 surface labels、primary action、fallback action、next destination
- 補 node tests，先鎖定 loop 文案與 route intent

不做：

- 不改 backend contract
- 不重排整頁

### Slice 2: Matter / task first-action tightening

目的：

- 讓少資料診斷案在 matter 與 task 第一屏更像 cockpit

可能內容：

- matter first screen 的 sparse diagnostic 狀態更明確
- task first screen 對少資料情境更明確標示：
  - 可以先跑探索型分析
  - 若要更正式，應補什麼
  - 跑完會去哪裡

不做：

- 不新增新頁
- 不把 matter/task 變成 dashboard wall

### Slice 3: Result / feedback close loop

目的：

- 跑完後，結果頁能直接回答這份結果的用途、邊界與下一步
- feedback 能自然接回 reusable intelligence，而不造成額外負擔

可能內容：

- deliverable first screen for sparse diagnostic results
- feedback CTA copy tightening
- next action after feedback

不做：

- 不做完整 KPI / outcome attribution
- 不做 auto-template apply

### Slice 4: Owner-consultant walkthrough gate

目的：

- 建立本輪真正的驗收方式

可能內容：

- 新增 QA checklist 到 QA matrix
- 用一個固定少資料診斷案例跑完整流程
- 記錄是否能完成：
  - 建案
  - 看 matter command
  - 看 task readiness
  - 補資料或先跑
  - 看結果
  - 給 feedback
  - 回到下一步

不做：

- 不聲稱達到 85，除非老田實際確認願意用

---

## 7. Not In Scope

本輪不做：

- public multi-tenant SaaS
- billing
- 顧問排名
- owner surveillance
- 大型 enterprise admin shell
- 全面 UI redesign
- 新的 dashboard family
- 新 agent / pack marketplace
- KPI / business outcome attribution
- 完整 long-running client memory
- 完整 domain coverage to 85

這些是後續 workstream，不是第一輪 owner-consultant cockpit 的必要內容。

---

## 8. Verification Intent

本輪完成後應至少驗證：

- frontend node tests for cockpit loop helper
- existing low-noise workbench tests still pass
- task detail usability tests still pass
- case command loop tests still pass
- backend sparse diagnostic lane tests still pass if backend touched
- build / typecheck pass if frontend touched
- QA matrix append only after real checks

若跑 authenticated browser walkthrough，QA matrix 必須誠實記錄：

- 使用什麼登入方式
- 是否真的跑完整流程
- 哪些只是 source-level / regression proof
- 哪些是 browser proof

---

## 9. Open Review Points For 老田

老田回來後需要確認：

1. 這條 sparse diagnostic cockpit loop 是否符合你說的「先讓我本人願意用」？
2. 第一輪是否同意先做 Slice 1 + Slice 2，而不是一次做到 Slice 4？
3. 驗收案例要不要用你的真實案件，還是先用高擬真測試案件？
4. 如果跑到一半發現現有 UI 還是太重，是否允許針對 matter/task 第一屏做小幅重排？

---

## 10. Working Conclusion

本輪不追求做更多功能。

本輪追求：

> 把已經存在的少資料診斷能力，收成一條老田真的願意使用的顧問工作 loop。

如果這條 loop 成立，Infinite Pro 的 `G consultant usability` 與 `F product maturity` 才有機會從目前分數往 85 靠近。

下一份 artifact 應是對應 implementation plan。
