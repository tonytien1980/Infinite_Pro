# Infinite Pro 專案體檢報告

> 日期：2026-07-07
> 目的：全面檢視 docs 與 code，診斷專案停滯原因，並給出可執行的改進路線。
> 2026-09-25 閱讀提示：下文保留 7 月的診斷快照，不是今日測試結果或施工授權。依全域及 repo `AGENTS.md` 進入，再讀 `REBOOT_DIRECTION.md`；9 月診斷、已核定總交付清單與方向調整已整合於該文件。具體施工依 2026-09-25 核准的 `IMPLEMENTATION_PLAN.md`，不依本報告舊第 5、6 節開工。
> 9 月已查證的修正：現有系統有規則式歷史匹配及提示注入，不能解讀第 2.4 節為完全沒有檢索；多顧問是人類已提出的需求，不能依第 2.5 節當成憑空擴張。案件底座成立不代表材料、引用、整合判斷或共享隱私已可靠；最新已重現問題見 `REBOOT_DIRECTION.md` 第 2 節。

---

## 1. 專案現況快照（客觀事實）

| 項目 | 數據 |
| --- | --- |
| 開發期間 | 2026-03-19 ~ 2026-05-03（約 6.5 週），之後停滯至今約 2 個月 |
| 總 commits | 454 |
| 每週 commit 數 | 15 → 67 → 108 → 229 → 10 → (空) → 25 → 停止 |
| Backend | FastAPI + SQLAlchemy，114 個 .py 檔，約 48,000 行 |
| Frontend | Next.js 15 + React 19，92 個 ts/tsx 檔，約 36,600 行 |
| Active docs | 7 份，共約 14,600 行 |
| Backend 測試 | 9 個檔案，約 12,700 行（其中單一檔案 10,878 行） |
| Frontend 測試 | 17 個 node test 檔（package.json 無 test script） |
| Git 分支 | 31 條 codex/* 分支；30 條已 merge 未清理；目前 HEAD 在 `codex/owner-consultant-cockpit-a`，領先 main 5 個 commits 未合併 |
| CI | 無（沒有 .github/workflows） |
| API routes | 約 55 個 endpoints |
| 真實 LLM 呼叫面 | 只有 6 種 structured tasks（research synthesis / core analysis / document restructuring / contract review / agent 與 pack contract synthesis） |

commit 曲線本身就是診斷書：第 4 週衝到單週 229 commits，隔週掉到 10，之後熄火。這是典型的「衝刺 → 燒盡 → 棄置」曲線。

---

## 2. 核心診斷：專案為什麼卡住

### 2.1 最大病灶：自我描述型功能的無限增生（meta-work spiral）

後期的工作重心已經不是「幫顧問做案子」，而是「讓系統描述自己的治理狀態」。證據在 `docs/00` 後段：Phase 6 一路推到「第二十三刀」，其中包括：

- `phase-6 maturity review v1`（系統回讀自己在哪個 maturity stage）
- `phase-6 closure criteria v1`（系統回答自己為何還不能收口）
- `phase-6 governance scorecard / sign-off foundation`（給自己打分、給自己簽核）
- `note brevity guardrails v1`、`cross-surface note consistency v1`、`surface-specific emphasis tuning v1`（調整系統描述自己的措辭長度與句型）

也就是說：系統長出了一整套「回讀自己治理進度」的 read models、打分機制、簽核流程，而這些對真正的顧問工作（接案、審材料、出交付物）沒有增量價值。`docs/06` 第 13 節自己都寫了警語——「它有沒有讓 system 更接近全面型顧問 operating system，而不是只是更會自我描述」——但後期工作恰好違反了這條。

每一刀都很小、都能通過測試、都能寫進 QA matrix，所以感覺一直有進度；但產品對使用者的價值曲線是平的。做的人會越來越無法回答「這個專案到底前進了什麼」，這就是失去動力的直接原因。

### 2.2 文件治理系統反噬（docs 成為主要工作產物）

- Active docs 共 14,600 行，其中 `04_qa_matrix.md` 一份就 6,877 行（append-only 證據日誌）。
- `AGENTS.md` + `docs/00` + `docs/06` 要求每個新 session 先讀完數千行、回答 5 個 checklist 問題才能動工。
- 文件語言高度抽象（「正式規則」「不可」「已正式成立」「第 N 刀」），行為描述埋在敘事裡，人和 AI 都難以快速定位「系統實際上做什麼」。

這套治理本來是為了讓 Codex 不偏航，但它變成：改任何行為 → 要同步改多份 doc → doc 越長 → 下次 session 讀入成本越高 → 越傾向做「安全的小刀」→ 又回到 2.1 的 meta-work。治理系統與 meta-work 互相餵養。

### 2.3 God files：程式結構已到達 AI 與人類都難以操作的臨界

| 檔案 | 行數 |
| --- | --- |
| `backend/app/services/tasks.py` | 12,747 行、283 個函式 |
| `backend/tests/test_mvp_slice.py` | 10,878 行 |
| `backend/app/agents/host.py` | 3,720 行 |
| `backend/app/extensions/registry.py` | 3,249 行 |
| `frontend/src/components/task-detail-panel.tsx` | 3,511 行 |
| `frontend/src/components/deliverable-workspace-panel.tsx` | 3,163 行 |
| `frontend/src/lib/types.ts` | 2,908 行 |

`services/tasks.py` 一個檔案就佔 backend 四分之一的程式量，intake、continuation、precedent、playbook、template、organization memory 全部混在裡面。這對 AI coding agent 是致命的：單檔超出有效 context，每次修改都要冒險；對人則是「不敢動」。專案越後期，每一刀的成本越高、範圍越小——這也解釋了為什麼後期只敢做文案級的「note wording」修改。

### 2.4 智能天花板太低：巨大的衍生外殼包著很薄的 AI 核心

整個 model 邊界只有 6 種 structured tasks。而 docs 裡大書特書的 shared intelligence、precedent pool、review lenses、common risk libraries、deliverable templates、domain playbooks、freshness/decay/reactivation 生命週期……絕大多數是**確定性的啟發式規則與標籤管線**，不是真正的智能累積（沒有 retrieval、沒有 embedding、明文規定不做 auto-apply）。

結果是：本體論極其宏大，但實際輸出品質由那 6 個 prompt 決定。使用起來的「聰明感」撐不起文件裡的敘事高度，落差本身就會讓開發者懷疑「這到底有沒有必要做下去」。

### 2.5 在零真實用戶的情況下做 multi-consultant 治理

產品定位明明是 single-consultant first，最後一批 commits 卻在做：multi-consultant case privacy、member scope、shared intelligence risk gates（`needs_review / provisional / validated`）、consultant firm provider fallback、private beta 文案。這些都是「假想中的 3~5 位顧問 private beta」的需求，而不是任何一位真實使用者（包括你自己）回饋出來的需求。方向盤轉向了不存在的用戶。

### 2.6 收尾與驗收永遠差一步

`docs/06` 明示：「authenticated browser walkthrough 仍是下一個 owner-confirmed gate，不可用 source-level tests 取代真實使用感驗收」。也就是說，最後停滯點正好卡在「需要 owner 真人坐下來用一輪」的驗收上——而這一步一直沒有發生。工程證據（pytest、typecheck、smoke）堆了 6,877 行，真實使用證據接近零。

### 2.7 次要工程債（相對好解決）

- 30 條已合併分支未清理；HEAD 停在 side branch，領先 main 5 commits 未合併回去。
- 無 CI：release-readiness script 存在但只能手動跑。
- repo 內有三份 venv（`.venv`、`.venv312`、`.venv_stale_20260328`），README 與腳本混用兩個 Python 版本。
- docker-compose 走 PostgreSQL、本地實際跑 SQLite（`local.db`），兩條 persistence path 長期並存。
- frontend 除 Next/React 外零依賴，所有 UI、i18n（`ui-labels.ts` 1,041 行）、workflow 邏輯全部手刻。
- frontend package.json 沒有 `test` script，17 個測試檔的執行方式沒有正式入口。

---

## 3. 這個專案值得繼續嗎（誠實評估）

**值得，但不是以原本的方式繼續。**

真正有價值、且已經做出來的部分：

- `intake → CaseWorldDraft → CaseWorldState → Task → Evidence → Deliverable → writeback` 這條 object chain 是真的、能跑、有測試、有 smoke 證據。「案件是可延續的世界，不是一次性對話；交付物有 lineage 和 evidence 支撐」——這個核心命題在 2026 年仍然成立，而且比多數 chatbot wrapper 有深度。
- Provider boundary、structured output contract、intake pipeline 的工程品質不差（有防禦性錯誤處理、有 schema 驗證、有回歸測試）。

沒有價值、應該凍結或砍掉的部分：

- Phase 6 全部的自我治理 read models（maturity review、closure criteria、scorecard、sign-off、handoff）。
- shared intelligence 的 lifecycle 機械（freshness/decay/reactivation/posture 那一整串 v1）。
- multi-consultant readiness（在有第二位真實使用者之前）。

**判準只有一個**：你（或任何一位真實顧問）是否願意在接下來 2 週，用它處理至少一件真實案件。如果連你自己都不會用它辦案，那再多的 hardening 都是沉沒成本的追加，應該正式封存。如果會用，那下面的路線圖就是把它從「治理迷宮」救回「工作台」的方法。

---

## 4. 給 Codex 的總則（本輪改進作業的行為約束）

1. 本文件優先於 `AGENTS.md` 的「Current Phase Rule」與 doc 更新義務。`AGENTS.md` 的六層架構與 provider boundary 規則仍然有效。
2. **禁止**新增任何「vN」「第 N 刀」式的治理 read model、governance note、posture label、wording 調整。
3. **禁止**在重構期間新增功能。第 5 節的每個 phase 完成前不開下一個。
4. 每個 phase 結束的驗收是：`run_release_readiness.py --tier static` 全綠 + 該 phase 的明確產出物存在。
5. 文件同步規則暫改為：只更新 `README.md` 與本文件的進度區，不再往 `docs/04_qa_matrix.md` append。

---

## 5. 改進路線圖（依序執行）

### Phase R0 — 止血與收攏（半天）

- [ ] 把 `codex/owner-consultant-cockpit-a` 的 5 個 commits merge 回 `main`，切回 main 作業。
- [ ] 刪除 30 條已 merge 的本地與遠端分支；未 merge 的 2 條確認內容後決定去留。
- [ ] 刪除 `.venv_stale_20260328`；統一用一個 Python 版本（建議 3.12，與 `.venv312` 一致），更新 README 移除雙 venv 說明。
- [ ] 建立最小 CI（GitHub Actions）：跑 backend pytest + frontend build/typecheck，就用現成的 release-readiness static tier。
- [ ] frontend package.json 加上 `"test": "node --test tests/"`（或實際的執行方式）。

### Phase R1 — 文件減重（1 天）

目標：active docs 從 14,600 行壓到 2,500 行以內。

- [ ] `docs/04_qa_matrix.md`（6,877 行）整份移到 `archive/`，新建一份只保留「最新一次全綠證據」的 20 行版本。
- [ ] `docs/00` 與 `docs/06`：把所有「第 N 刀」「已開始補上 XXX v1」的敘事史移到 `archive/`，各壓成 ≤300 行的「系統現在做什麼」描述。行為描述用表格與 bullet，不用敘事。
- [ ] `AGENTS.md` 重寫為 ≤100 行：架構六層、runtime chain、provider boundary、測試期望。刪除 reading-order 儀式與 phase 官僚規則。
- [ ] 刪除 docs 中所有與程式行為不對應的宣稱（以 code 為準核對）。

### Phase R2 — 拆解 god files（2~4 天，純機械性重構，行為不變）

驗收：全部既有測試通過、無單一 source 檔超過 1,500 行。

- [ ] `backend/app/services/tasks.py`（12,747 行）依既有函式命名前綴拆為模組包 `app/services/tasks/`：
  - `intake.py`（matter/task 建立與 canonicalization 呼叫）
  - `continuation.py`（continuation surface / follow-up lane / progression lane）
  - `precedent.py`（precedent pool / adoption feedback / shared intelligence）
  - `reusable_assets.py`（review lenses / common risks / shape hints / templates / playbooks）
  - `organization_memory.py`
  - `read_models.py`（各工作面 read model 組裝）
  - `__init__.py` re-export 維持既有 import 路徑不變。
- [ ] `backend/tests/test_mvp_slice.py`（10,878 行）依同樣邊界拆成多檔。
- [ ] `frontend/src/components/task-detail-panel.tsx`、`deliverable-workspace-panel.tsx` 各拆出子元件；`lib/types.ts` 依 domain 拆檔。
- [ ] `app/agents/host.py` 與 `app/extensions/registry.py` 至少拆出資料表/常數部分。

### Phase R3 — 真實使用驗收（1~2 週，這是決定專案生死的 phase）

- [ ] Owner（老田）選 1 件真實案件，完整走一輪：`/new` intake → matter → 上傳材料 → 分析 → deliverable → 採納回饋。
- [ ] 過程中所有卡點、看不懂的文案、多餘的畫面元素，記成 issue list（這份清單取代所有 roadmap doc，成為唯一 backlog）。
- [ ] 明確決策：若這一輪跑不完或跑完覺得沒價值 → 專案正式封存，寫一份 postmortem 結束；若有價值 → issue list 就是 Phase R4 的全部內容。

### Phase R4 — 只修真實用戶的痛（依 R3 清單）

原則：每個修改必須對應 R3 清單上的一條真實痛點。不做任何清單外的「順手補強」。

### Phase R5 — 抬高智能天花板（R4 之後才考慮）

- [ ] 檢討 6 種 structured tasks 的 prompt 品質與 model 選型（現在的 provider preset 是否還是最佳模型）。
- [ ] 把啟發式的 precedent/reusable assets 換成真正的 retrieval：對歷史 deliverable/evidence 做 embedding 檢索，取代標籤式 lifecycle 機械。
- [ ] 考慮 streaming output 改善長分析的使用體驗。

---

## 6. 明確不做清單（與第 5 節同等效力）

- 不做 multi-consultant / member scope / firm governance 的任何延伸（直到有第二位真實使用者）。
- 不做 Phase 7、不重開 P0、不開任何新的 phase 命名體系。
- 不新增治理類 read model、scorecard、sign-off、posture、lifecycle 標籤。
- 不新增 doc；不對 docs/ 做 append-only 累積。
- 不在 R3 完成前做任何新功能。

---

## 7. 一句話總結

這個專案不是死於能力不足，而是死於**把「描述工作」當成了「工作」**：核心 object chain 是好的、能跑的，但後期 80% 的力氣花在讓系統回讀自己的治理狀態，而真正的驗收——一位真實顧問用它辦完一件真實案件——從未發生。先減重（docs、god files、分支），再用一件真案做生死判定，值不值得繼續會在兩週內有明確答案。
