# Shell v2 Hybrid Workbench Direction Design

日期：2026-04-12
狀態：draft

## 1. Purpose

這份設計文件要正式定義 Infinite Pro 下一輪殼層與資訊架構調整方向。

它不回答：

- 某個單一卡片該長什麼樣
- 某個按鈕該放左邊還是右邊
- 哪個 component 先拆哪個 hook

它要先回答更上層的問題：

1. 為什麼目前 workbench 雖然整齊，卻仍讓人眼花撩亂
2. Infinite Pro 應不應該退回傳統 admin-console 式殼層
3. 若不退回，新的殼層應該長成什麼樣
4. 哪些頁應維持 page-first，哪些頁應改成 hybrid shell
5. 哪些資訊必須從第一屏退下去

這份文件的目的，是把「表面簡單、底層強」正式落成可執行的 shell direction，而不是停留在抽象偏好。

## 2. Problem Statement

Infinite Pro 現在最真實的 UI 問題，不是畫面不整齊，也不是功能不夠。

真正的問題是：

- 同一頁裡有太多「看起來都重要」的區塊
- 太多區塊在回答相近問題
- 太多資訊以完整句子與完整卡片同時出現
- 使用者雖然看得懂每一塊，卻不知道「現在先看哪一塊」

所以目前的失敗不是亂，而是：

> 結構整齊，但資訊權重仍然太平均。

這會導致一種典型 failure mode：

- page-first 已經成立
- 但沒有進一步做 aggressive prioritization
- 結果不是清楚的工作台
- 而是整齊的資訊牆

## 3. Why Not A Traditional Admin Shell

這一輪不建議把 Infinite Pro 退回成傳統 `左側功能樹 + 上方導覽 + 中央內容窗格` 的後台式設計。

原因不是這種設計不好，
而是它不適合 Infinite Pro 的核心任務。

Infinite Pro 的核心問題不是：

- 我有哪些模組可以點
- 我要進哪個系統功能
- 我要在管理頁之間切來切去

Infinite Pro 的核心問題是：

- 這個案件現在主線是什麼
- 我現在最該補什麼
- 我應該先跑分析，還是回看交付物

也就是說，Infinite Pro 更像：

- 顧問工作台
- 案件主線控制台
- 決策與交付推進系統

而不是：

- 模組型 admin console
- ERP 風格功能樹
- 工具目錄型 dashboard

如果直接退回大側欄，會有三個風險：

1. 把產品重新做成功能導向，而不是工作導向
2. 把底層 ontology / workflow / governance 再次直接丟到使用者面前
3. 讓 Infinite Pro 更像企業後台，而不是專業顧問軟體

## 4. Root Cause Diagnosis

### 4.1 Too many top-level blocks per screen

目前主要 detail page 常同時出現：

- hero 主敘事
- hero aside
- metrics strip
- section guide
- summary grid
- disclosure / second-layer cards

這些東西單看都合理，
但一起出現在首屏前段，就會造成視覺上的多中心競爭。

### 4.2 Repeated guidance in different voices

現在很多頁面會用不同區塊重複回答相近問題：

- 現在先做什麼
- 這頁怎麼讀
- 下一步去哪裡
- 目前狀態是什麼

當同一件事被 hero、guide、summary、metrics 各講一次，
使用者就會感覺資訊很多，即使內容本身並不混亂。

### 4.3 Text is still too card-shaped

這一輪 low-noise repass 已經比以前好很多，
但仍有大量資訊以「完整卡片 + 完整句子」方式存在。

真正的低噪音工作台不只是少卡片，
而是要把很多資訊壓成：

- 一句話結論
- 2 到 3 個重點
- 1 個 next step

如果每一個資訊點都長成完整卡片，
那即使排得很好，也還是累。

### 4.4 Lack of a stable local anchor

我們現在已經避免了巨大左側功能樹，
但 detail workspace 也還沒有建立足夠穩定的 local rail。

所以使用者在 detail page 裡常常只能靠往下滑動來找方向，
缺少一個持續存在的頁內抓手。

## 5. Design Direction

正式建議方向：

> Shell v2 = Hybrid Workbench

它不是傳統後台，也不是極端的純 page-stage。

它應該是：

- 上方保留全域導覽
- detail workspace 引入穩定的 local rail / local navigator
- 中央主舞台只保留真正重要的工作內容
- 第二層資訊用 disclosure / deferred panel / secondary tab 接住

### 5.1 Core shell rules

Shell v2 正式採以下規則：

1. 全域導覽維持上方，不新增大型 persistent left nav
2. `matter / task / deliverable / evidence` 應各自有穩定的 local rail
3. 每頁第一屏最多只留 3 個高權重區塊
4. metrics 只能做輕量脈絡，不可再充當主閱讀內容
5. 同一頁只保留一套「下一步提示」
6. 同一頁不可同時有兩套以上 summary system
7. 文字預設先壓成短結論，不先攤完整說明

### 5.2 What “local rail” means here

這裡的 local rail 不是再做一個功能總表，
而是頁內工作定位器。

它只應回答：

- 這一頁有哪些主要段落
- 我目前在哪一段
- 我現在應先去哪一段

它不應回答：

- 系統有多少模組
- governance 有多少層
- ontology 有多少物件

換句話說：

- global nav = 去哪個正式工作面
- local rail = 這個工作面裡先看哪一段

## 6. Recommended Page Pattern

### 6.1 `overview`

方向：

- 退回純 launcher
- 不再承接重治理摘要

正式規則：

- 首屏只留：
  - `現在先做這件事`
  - `回哪個工作面`
  - `是否直接建立新案件`
- `firm operating`
- `phase closure`
- `generalist governance`

這三塊不再作為首頁主要閱讀內容，
而應移到：

- 第二層折疊區
- 或管理型入口
- 或更小的 secondary strip

首頁的責任不是「說明整個系統狀態」，
而是「把人送回主工作」。

### 6.2 `matter`

方向：

- 正式成為案件主控台
- 是 Shell v2 的中樞頁

首屏只留三件事：

1. 主線
2. blocker
3. 下一步

local rail 建議項：

- 主線
- 補件 / 證據
- 工作紀錄
- 交付物
- 歷史 / 連續性

應移出首屏的東西：

- continuity 細節卡片群
- research detail cards
- flagship detail full cards
- 大段 analysis focus / risk / next-step 條列

### 6.3 `task`

方向：

- 這頁要做最大幅度收斂

它目前最容易造成「我到底先看哪塊」。

首屏正式只留：

1. 這輪判斷什麼
2. 現在先做什麼
3. 跑完去哪裡

以下三者不可再三套並存：

- hero rail guidance
- section guide
- operating summary

正式建議：

- 保留 `section guide`
- hero rail 只留單一主提示
- operating summary 下沉為第二層

### 6.4 `evidence`

方向：

- 改成補件與支撐鏈工作台
- 不再讓它同時像 dashboard、guide page、summary page

首屏只留：

1. 缺什麼
2. 補什麼
3. 補完回哪裡

應移出首屏的東西：

- 過多 hero focus cards
- 額外 metrics 解釋
- 補件判斷的重複摘要
- 第二條研究 summary

### 6.5 `deliverable`

方向：

- 保留強頁面
- 但更接近文件工作台

它是五個主要工作面中最適合保留 `page-first` 強結構的頁面，
因為使用者本來就會進來長時間閱讀與修訂內容。

首屏只留：

1. 版本與交付狀態
2. 現在是發布 / 修訂 / 回看依據
3. primary action

其他 governance / continuity / research 都應第二層化。

## 7. Cross-Surface Compression Rules

這一輪若要真的把眼花撩亂降下來，
不能只做 layout，還要做資訊壓縮。

正式規則如下：

### 7.1 First-screen block budget

每個 detail workspace 第一屏最多只留：

- 1 個主敘事區
- 1 個主行動區
- 1 個輕量定位 / 狀態區

超過這個數量，
就必須下沉。

### 7.2 No parallel summary systems

同一頁不可同時存在：

- hero summary
- section guide summary
- metric summary
- operating summary

四套都在首屏同層工作。

最多只能有一套主 summary，
其餘只作為輔助定位。

### 7.3 Metrics are context, not content

metrics card 應正式降級成 context-only。

它們可以回答：

- 數量
- 狀態
- 脈絡

但不應再承擔：

- 下一步提示
- 主敘事摘要
- 判斷邊界

### 7.4 Sentence compression

所有高可見度工作台文案應優先壓成：

- 一句結論
- 2 到 3 個重點
- 1 個 next step

不應先用完整段落解釋系統。

## 8. What This Changes Conceptually

Shell v2 不會改變產品的正式邊界：

- 不改六層架構
- 不改 Host 邊界
- 不改 ontology-first runtime
- 不把系統退化成一般 CRUD admin

它改變的是：

- 使用者如何定位自己
- 使用者如何在同頁中找到主線
- 使用者如何在不讀完整頁的情況下開始推進

也就是：

> 不是改產品做什麼，而是改產品怎麼被使用。

## 9. Non-Goals

這一輪方向文件不包含：

- 重新定義 ontology
- 增加新 route family
- 引入新的治理面板
- 重做 auth / provider / extension architecture
- 全面改寫設計語言

這是一份：

- shell direction spec
- information hierarchy spec
- work-surface compression spec

不是功能 spec。

## 10. Recommendation

正式建議採用：

`Shell v2 = Hybrid Workbench`

而不是：

- 傳統 admin console
- 極端 page-stage
- 再多做一輪局部 patch

原因是：

1. 它最符合 Infinite Pro 的產品本質
2. 它最能解決目前的眼花撩亂
3. 它不會把產品做回模組型後台
4. 它仍保留 consultant workbench 的方向

## 11. Next Step

這份方向若確認，
下一步應寫 implementation plan，
把工作拆成：

1. shell primitives
2. overview 收斂
3. matter shell v2
4. task shell v2
5. evidence shell v2
6. deliverable compression pass

而不是直接整包開工。
