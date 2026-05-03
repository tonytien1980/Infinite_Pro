# Infinite Pro Owner-Consultant 85 分產品對齊文件

日期：2026-05-03

狀態：討論用對齊文件，尚未成為已核准的實作計劃

核心標準：老田同時是 owner，也是第一位真正要使用 Infinite Pro 的顧問。這套產品必須強到老田本人願意拿去做真實顧問工作，才算接近可用。

---

## 1. 文件目的

這份文件的目的，是把老田對 Infinite Pro 的最終想像重新收斂成一份可討論、可審查、可拆實作計劃的產品對齊文件。

這份文件要處理四件事：

- 重新整理 Infinite Pro 的終局產品想像
- 對照目前 active docs 與已完成實作，盤點哪些已經做完
- 明確列出距離終局想像與 85 分標準還缺什麼
- 定義下一步應該如何推進，而不是繼續無限改、無限補、無限覺得不夠

這不是 MVP 文件，也不是 private beta 文件。

老田這次明確調整標準：

- 不是「平均 85」就可以
- 不是「工程上能讓多人登入」就可以
- 不是「有一個最小可行版本」就可以
- 而是每一個主要產品維度至少要達到 85 分
- 且老田身為 owner + 顧問本人，要願意在真實顧問工作中使用

因此，接下來的產品推進不應再用「先做到能測」作為主要標準，而應改成：

> 先做到足以協助顧問打仗。

---

## 2. 老田的終局產品想像

Infinite Pro 的終局想像不是一套普通 AI 工具，也不是一套把很多功能堆在一起的顧問後台。

它的核心想像是：

> 以 Palantir Ontology 的方法論為啟發，建立一套 ontology-first 的顧問分析與交付工作台，讓顧問在同一個案件世界中處理 intake、資料、證據、判斷、決策、交付、回饋、歷史與可重用經驗，最後逐步形成一個會讓顧問與顧問公司越用越強的 AI 商業大腦。

這裡的 `AI 商業大腦` 不是單一模型人格，也不是單純把資料丟進 RAG。

它應該是由以下東西共同形成：

- ontology-first 的案件世界
- Host 主導的判斷與協調
- 證據、來源與追溯
- 顧問交付物
- 決策與行動寫回
- 顧問採納 / 修正 / 不採納的回饋
- precedent 與 reusable intelligence
- 可被治理、可被泛化、可被觀察的 shared intelligence

### 2.1 它要承接的顧問工作範圍

Infinite Pro 最終要能支援：

- 創業階段
- 制度化階段
- 規模化階段
- 中小型企業
- 大型公司或集團
- 個人品牌或服務
- 自媒體
- 營運
- 財務
- 商務
- 法務
- 行銷
- 銷售
- 綜合策略
- 一次性報告
- 可持續深化的顧問案件

換句話說，它不是窄版 specialist tool。

它要成為一位全面型顧問的工作底座，並且長期能成為一間顧問公司的內部 operating system。

### 2.2 第一個真正的使用標準

長期來看，Infinite Pro 要讓初階到高階顧問都能使用。

但第一個真正標準不是「其他顧問能不能登入」。

第一個真正標準是：

> 老田本人是否願意用它處理真實顧問工作。

如果老田不願意用，代表它還沒有達到產品想像。

如果老田願意用，再往其他顧問擴張，才是相對工程化的問題。

---

## 3. 新的 85 分標準

目前 `docs/06_product_alignment_and_85_point_roadmap.md` 裡的分數，是 planning-grade alignment score，不是客觀 benchmark 分數。

原本文件裡的目標偏向「整體平均往 85 推進」。

但老田現在確認的新標準是：

> 每一個主要產品維度都至少要 85 分，Infinite Pro 才能被視為真正開始可用。

這代表不能用強項平均掉弱項。

例如：

- ontology-first 做到 86，不代表 usability 只有 74 可以接受
- one-off / continuous 做到 87，不代表 domain breadth 只有 77 可以接受
- 工程上多人可登入，不代表產品已能協助顧問打仗

### 3.1 現況分數與 85 門檻

| 維度 | 目前 active roadmap 分數 | 新門檻 | 判斷 |
| --- | ---: | ---: | --- |
| A. ontology-first 顧問分析工具 | 86 | 85+ | 已達標，但不能退步 |
| B. 支援創業 / 制度化 / 規模化 | 80 | 85+ | 未達標 |
| C. 適用中小企業 / 大企業 / 個人品牌 / 自媒體 | 79 | 85+ | 未達標 |
| D. 覆蓋營運 / 財務 / 商務 / 法務 / 行銷 / 銷售 / 策略 | 77 | 85+ | 未達標 |
| E. 支援一次性報告與持續深化案件 | 87 | 85+ | 已達標，但仍需實戰驗收 |
| F. 成熟產品度 | 79 | 85+ | 未達標 |
| G. 初階到高階顧問都能輕易使用 | 74 | 85+ | 最大可用性缺口 |
| H. 接收回饋與自我優化 | 80 | 85+ | 未達標 |

### 3.2 最危險的缺口

目前最危險的缺口不是「多人使用」。

最危險的是：

- G：顧問是否真的願意用
- D：是否真的能承接全面型顧問工作，而不是偏科
- H：是否真的會越用越好，而不是只會記錄 precedent
- F：是否真的穩定、可靠、成熟到可以被信任

因此下一階段不應先把重點放在 public SaaS、billing、enterprise admin、顧問排名或更多管理功能。

下一階段應該先把產品本身拉到老田願意使用的 85 分標準。

---

## 4. 已經做完的部分

### 4.1 Ontology 與 runtime 主骨架

已經完成：

- 六層架構仍維持清楚
- Host 仍是唯一 orchestration center
- `CaseWorldState` 已成為 matter/world 層的 authority center
- `Task` 已被定義為案件世界裡的 work slice，而不是唯一主容器
- canonical intake、source material、artifact、evidence、recommendation、deliverable、history、writeback 已形成主鏈
- object set、provenance、deliverable lineage、publish record、adoption feedback 已進入產品層
- 系統仍是 ontology-first、object-first、workbench-first，而不是 chat-first

仍未完成：

- `CaseWorldState` 與 legacy `task_id` references 仍共存
- 不是每一條流程都已完全 world-native
- 部分 legacy deliverable rows 的 newer summary contract backfill 不完整
- ontology 已能運作，但還不是完整長期 business operating model
- action / outcome / decision memory 的長期閉環還不夠成熟

### 4.2 顧問工作台主流程

已經完成：

- 總覽
- 新案件 intake
- 案件主控台
- 資料與證據
- 分析項目
- 結果與報告
- 歷史紀錄
- 系統設定
- 代理管理
- 模組包管理
- 成員管理
- 示範工作台
- 登入 / 登出基礎

已經改善：

- Shell v2 方向
- 低噪音第一屏
- 繁中第一層語言
- consultant-facing labels
- second-layer governance disclosure
- 不再把大量內部術語放在高流量畫面

仍未完成：

- 還沒有用老田的真實顧問案件完整走過一輪，證明工作節奏真的自然
- 部分 task / evidence / deliverable 流程仍可能像系統頁，不像顧問 cockpit
- first-run guidance、error recovery、blocked state 還沒證明達到 85 分
- 資訊密度雖已降低，但仍可能讓顧問覺得「我要先理解系統，才能工作」

### 4.3 Client stage / client type / domain coverage

已經完成：

- stage / type coverage proof baseline
- continuity coverage proof
- cross-domain coverage proof
- 創業階段與制度化階段相對成熟
- 中小企業、個人品牌、自媒體、founder-led professional services 相對成熟
- 營運、法務 / 風險、財務 / 募資、研究綜整、決策收斂、文件重整相對成熟

仍未完成：

- 規模化階段若涉及 enterprise collaboration / security / governance，還不成熟
- 大型公司或集團目前比較適合作為單一顧問案件工作台，不是 enterprise platform shell
- 行銷、銷售、商務、綜合策略的深度還不夠
- 每個 domain 都達到足夠可信的 85 分，尚未證明
- cross-domain reasoning 仍需要更多代表案例與可重用模式

### 4.4 一次性報告與持續深化案件

已經完成：

- one-off report workflow 相對成熟
- follow-up / continuous advisory foundation 已存在
- continuity mode、checkpoint、timeline、health、next step、review rhythm 已有 baseline
- deliverable closeout、publish、history、feedback 已存在

仍未完成：

- 長期 client memory 還不像完整的客戶經營記憶
- outcome tracking 與 business-result interpretation 還有限
- continuous advisory 還需要實戰證明：系統真的能幫顧問跨時間記住、判斷、推進，而不是只保存舊紀錄

### 4.5 Shared intelligence 與自我優化

已經完成：

- adoption feedback foundation
- precedent candidate pool
- candidate / promoted / dismissed 狀態
- reason-coded feedback
- Host-safe precedent reference
- shared intelligence risk gates
- reusable review lenses
- common risk libraries
- deliverable shape hints
- deliverable templates 初版
- domain playbooks 初版
- reusable asset ordering 開始吃 shared intelligence
- 人工確認後可套用 governance suggestion
- multi-consultant raw case privacy 與 prompt-safe shared guidance 規則開始成立

仍未完成：

- 還不是 fully context-aware adaptive engine
- 系統可以讀 feedback，但還不能強力證明下一案真的因為 feedback 變好
- KPI / business outcome attribution 還不成熟
- reusable intelligence effectiveness 仍是保守判讀，不是強因果判斷
- client profile、organization memory、domain playbooks、deliverable templates 還不是成熟產品層
- 還需要更強的防偏機制，避免系統因近期高頻案型、單一顧問風格、局部成功模式而越學越偏

### 4.6 Single-firm / multi-consultant foundation

已經完成：

- Google login foundation
- owner / consultant / demo roles
- members page
- firm settings
- personal provider settings
- firm provider fallback
- raw matter / task / material / deliverable / history privacy boundary
- demo workspace isolation
- shared-intelligence governance permission boundary

仍未完成：

- 不是 public multi-tenant SaaS readiness
- enterprise RBAC、dynamic security、ABAC、marking、support ops、commercial readiness 都未完成
- 最新 multi-consultant state 仍需要 authenticated browser walkthrough，才能作為更高信心的 readiness gate

重要判斷：

> 其他顧問能不能用，是重要但相對工程化的問題。更核心的問題是，Infinite Pro 本身是否已達到老田對顧問業使用的期待。

---

## 5. 核心缺口診斷

Infinite Pro 目前不是缺一堆隨機功能。

真正缺口是：

> 它已經有很強的架構與很多嚴肅 runtime pieces，但還需要證明自己能在真實顧問工作裡，像一個可信賴的顧問工作智能，而不是一套需要顧問先管理它的系統。

### Gap 1：Owner-consultant daily usability

產品不能只是把正確資訊放上去。

它必須在顧問打開時立刻回答：

- 我現在在哪裡？
- 這案子最重要的是什麼？
- 我下一步應該做什麼？
- 哪些可以先不用管？
- 目前最好的顧問動作是什麼？
- 這份工作接下來會走向哪裡？

目前風險：

- 產品比以前可讀，但仍可能有認知負擔
- 顧問可能覺得自己在操作一套系統，而不是在被系統協助工作
- 底層很強，但表層還不一定轉化成高槓桿

85 分要求：

- 老田能打開產品，處理真實或高度擬真的顧問案件，並感覺它是在幫忙，而不是需要被照顧

### Gap 2：Consulting-domain depth

產品要承接營運、財務、商務、法務、行銷、銷售、策略，但目前深度不平均。

目前風險：

- 成熟 lane 讓產品看起來很 generalist，但薄 lane 可能只有名義覆蓋
- 行銷、銷售、商務、綜合策略若不補厚，產品會偏向 operations / legal / finance / research

85 分要求：

- 每個主要 domain 至少要有可信代表案例、證據期待、交付形態、風險提醒與可重用判斷模式

### Gap 3：Context-aware shared intelligence

系統已開始記住並治理可重用模式，但終局想像要求更高。

它不只要知道「過去有類似經驗」，還要知道：

- 這次能不能用？
- 為什麼能用？
- 能用到什麼程度？
- 什麼情況下不能用？
- 這個 pattern 是否因為高頻案型而偏掉？
- 這個 pattern 是否只是某位顧問的個人風格？

目前風險：

- reusable intelligence 存在，但 case-aware 程度還不夠
- 系統可能知道 pattern 存在，卻不夠知道何時信、何時弱化、何時忽略
- effectiveness reading 還無法強力證明「未來工作真的因此更好」

85 分要求：

- shared intelligence 必須可治理、可泛化、可觀測，並能針對當前案件解釋相關性與信任程度

### Gap 4：Long-running client memory and outcome loop

持續顧問工作不是一串任務，而是長期客戶脈絡、決策、承諾、結果與變化。

目前風險：

- continuity 存在，但長期 client operating memory 不夠成熟
- outcome / business-result interpretation 還有限
- 系統可能能幫忙產出一份好報告，但還不一定能管理一段長期 advisory relationship

85 分要求：

- 系統能幫顧問從前案接續，知道什麼變了、什麼已決定、什麼承諾過、什麼應該推進

### Gap 5：Product reliability and real-use confidence

測試通過不等於顧問願意用。

目前風險：

- 自動化測試強，但部分最新狀態仍缺真實 authenticated walkthrough
- loading、error、blocked state、資料上傳、模型設定等若不穩，會直接傷害信任
- 如果把測試通過誤當真實工作信心，會高估產品成熟度

85 分要求：

- 老田能用它走完整工作流程，不覺得脆弱、慢、混亂、不可控或有風險

---

## 6. 下一階段建議

下一階段應定義為：

> Owner-Consultant 85-Point Readiness Push

這一階段要取代「private beta readiness」作為立即產品標準。

目標不是給外部多人試用。

目標是：

> 老田作為 owner + 顧問本人，能真正願意用 Infinite Pro 打顧問戰。

### Workstream 1：Owner-consultant real-work cockpit

目標：

- 讓 Infinite Pro 感覺像顧問 cockpit，而不是系統 dashboard

可能工作：

- 第一輪真實工作節奏
- case command loop
- 下一步動作階層
- task / evidence / deliverable handoff
- first-run guidance
- blocked state
- error recovery
- 減少等權重資訊堆疊

主要推進：

- G consultant usability
- F product maturity

建議優先度：最高。

原因：

- 如果老田自己不願意用，其他所有能力都沒有產品意義。

### Workstream 2：Domain and client coverage to 85

目標：

- 讓 full-scope consulting capability 不只是宣言，而是有足夠代表案例與 proof

可能工作：

- 補厚薄弱 domain
- 補厚大型公司 / 規模化 / 個人品牌 / 自媒體代表案例
- 補強 marketing / sales / business / strategy 的交付形態
- 補強 cross-domain reasoning
- 更新 benchmark / coverage proof

主要推進：

- B client-stage coverage
- C client-type coverage
- D consulting-domain breadth

建議優先度：第二。

原因：

- 這是產品能否符合「全面型顧問工具」想像的核心。

### Workstream 3：Case-aware shared intelligence

目標：

- 從「系統記得有用模式」推進到「系統知道這個模式在這一案該怎麼用」

可能工作：

- context-aware reusable guidance
- trust / observe / ignore logic
- maturity / bias guardrails
- relevance explanation
- safer Host weighting
- shared intelligence 不因高頻案型偏科

主要推進：

- H feedback and self-optimization
- A ontology-first consulting tool
- D consulting-domain breadth

建議優先度：第三。

原因：

- 這是 AI 商業大腦是否真正會越用越強的核心。

### Workstream 4：Long-running client memory and outcome loop

目標：

- 讓 continuous advisory 真正像長期顧問關係，而不是舊任務集合

可能工作：

- client-level memory summary
- decision / commitment tracking
- outcome / writeback interpretation
- continuity review
- next engagement handoff
- safe business outcome attribution boundary

主要推進：

- E one-off and continuous matters
- H feedback and self-optimization
- F product maturity

建議優先度：第四。

原因：

- 一次性報告已較成熟，長期顧問複利還可以更強。

### Workstream 5：Real-use reliability gate

目標：

- 用真實使用證據證明產品可靠，而不是只靠測試通過

可能工作：

- authenticated browser walkthrough
- owner-consultant smoke cases
- upload / run / deliverable / history verification
- loading performance
- failure recovery
- QA evidence honesty

主要推進：

- F product maturity
- G consultant usability

建議優先度：橫跨所有 workstream。

原因：

- 每一輪補強都必須被真實驗證，不能只寫進文件。

---

## 7. 建議推進順序

下一步不應直接寫程式。

建議順序是：

1. 老田審閱這份對齊文件。
2. 修正這份文件，直到它準確反映產品想像。
3. 依這份文件建立 `Owner-Consultant 85-Point Readiness Push` 實作計劃。
4. 將實作計劃拆成有限 tranche。
5. 每個 tranche 同步更新 active docs 與程式碼。
6. 每個 tranche 都補 QA evidence。
7. 每個 tranche 後重新評估 A 到 H。
8. 直到每一項都至少 85，才視為可進入真正使用。

### 建議第一個實作計劃焦點

第一個實作計劃建議從 Workstream 1 開始：

> Owner-consultant real-work cockpit

但這不應變成另一輪廣泛 UI redesign。

它應該從老田的真實顧問工作流程出發：

- 建立或使用一個真實 / 高擬真案件
- 上傳或輸入材料
- 讓系統完成 framing
- 查看它認為的主線與下一步
- 跑分析
- 查看證據
- 產出或修正交付物
- 給 feedback
- 延續或收口案件

只有這條真實工作 loop 中卡住的地方，才應成為第一輪實作項目。

---

## 8. 下一階段不應做什麼

下一階段不應優先做：

- public multi-tenant SaaS
- billing system
- consultant ranking
- owner surveillance dashboard
- generic enterprise admin console
- marketplace-style agent / pack expansion
- 大型 UI 重做但沒有真實工作 loop
- 為了分數而補表面功能
- 用平均 85 掩蓋單項未達標

產品應該因為更能幫顧問工作而變強，不是因為畫面更多、設定更多、治理詞更多而變強。

---

## 9. 需要老田確認的決策

進入實作計劃前，需要老田確認：

1. 是否正式採用「每一項至少 85」作為開始使用門檻？
2. 是否正式採用「老田本人願意用於真實顧問工作」作為第一使用門檻？
3. 下一個實作計劃是否先從 Workstream 1 開始？
4. multi-consultant 是否暫時視為 secondary engineering layer，除非它阻擋老田本人使用？
5. 這份文件確認後，是否要同步更新 `docs/06_product_alignment_and_85_point_roadmap.md`，把目標從平均 85 改成每項 85？

---

## 10. 工作結論

Infinite Pro 已經不是粗糙 MVP。

它已經有：

- 嚴肅的 ontology-first 架構
- 真正的顧問工作台
- 案件世界與 evidence / deliverable 主鏈
- shared intelligence foundation
- feedback / precedent / reusable asset 初版
- single-firm multi-consultant infrastructure
- 基本驗證與 QA matrix

但老田的標準更高：

> 這套系統必須一開始上場就能協助顧問打仗。

因此，下一階段不應再以「可測、可展示、可 private beta」作為主要標準。

下一階段應以：

> owner-consultant 願意用、每項至少 85、真實顧問工作能跑通

作為唯一產品推進標準。

本文件通過老田審閱後，下一個 artifact 應是實作計劃，而不是直接施工。
