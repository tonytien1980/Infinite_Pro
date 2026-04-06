# Phase 6 Generalist Consulting Intelligence Governance Design

日期：2026-04-06
狀態：proposed

## Purpose

Phase 4 `precedent / reusable intelligence` 與 Phase 5 `Single-Firm Cloud Foundation` 都已正式收口後，Infinite Pro 的下一個正式問題不再是：

- 能不能登入
- 能不能讓多位顧問各自辦案
- 能不能累積 precedent / memory / playbook / template

而是：

- 這套已經會持續累積 shared intelligence 的系統，怎麼在長期演化中仍然維持「全面型顧問公司」的能力邊界
- 系統怎麼避免因近期高頻案型、高頻顧問習慣或局部成功模式而越學越偏
- shared intelligence 怎麼從「會記住經驗」進一步升級成「可治理、可觀測、可泛化的全面型顧問能力底座」

因此 Phase 6 的正式方向定為：

- `Generalist Consulting Intelligence Governance`

## Product Posture

這一階段的正式定位是：

- 保護 `Single-Consultant Full-Scope Edition` 的能力邊界，不讓 system-level learning 把產品拉窄
- 讓 shared intelligence 持續變強，但不靠犧牲 generalist posture 來換取局部效率
- 讓單一 firm 在累積更多 precedent / memory / feedback 後，仍然保有跨客戶階段、跨客戶類型、跨顧問面向的工作能力

這一階段不是：

- 某個產業或案型的 specialization program
- consultant training platform
- consultant ranking / 資歷分級系統
- enterprise BI dashboard
- multi-tenant admin shell

## Core Product Problem

如果 Infinite Pro 只根據近期高頻樣本與高採用模式持續學習，長期風險會是：

1. 某幾類高頻案件被誤認成整間顧問公司的正式工作主軸
2. 某些局部有效的 precedent / playbook 被過度擴張成 general best practice
3. 某些近期較少出現的顧問能力面向，在 shared intelligence 內逐步失去存在感
4. 系統表面上看起來在自我優化，實際上是在對近期樣本過度擬合

這與 Infinite Pro 的正式產品身份相衝突：

- full-scope by capability
- single-user first
- multi-user later
- consulting intelligence system，而不是 narrow specialist tool

因此 Phase 6 要解的不是更多 workflow surface，而是：

- 怎麼正式治理「shared intelligence 的能力覆蓋、偏移風險、可泛化邊界與全面型 posture」

## Core Decisions

Phase 6 第一版正式決策如下：

1. 不把 shared intelligence 的成長直接等同於產品變強
2. 必須正式區分：
   - 高頻訊號
   - 高品質訊號
   - 可泛化訊號
3. 必須開始正式觀測能力覆蓋，而不是只觀測 precedent / feedback 數量
4. 必須把 reusable intelligence 的適用邊界說清楚，而不是預設可橫向套用
5. 必須把「全面型顧問公司 posture」視為需要被治理的正式資產，而不是自然會存在的副作用

## Governance Dimensions

### 1. Capability Coverage

系統必須開始正式回答：

- 目前 shared intelligence 覆蓋了哪些 client stages
- 覆蓋了哪些 client types
- 覆蓋了哪些 consulting domains
- 覆蓋了哪些案件型態：
  - 一次性報告
  - 持續深化案件
  - research-heavy
  - review-heavy
  - decision-convergence-heavy

正式規則：

- coverage 不能只看 precedent 數量
- 必須把 capability family、client stage、client type、domain lens 一起納入

### 2. Anti-Drift

系統必須開始正式回答：

- 哪些 shared intelligence 雖然近期很活躍，但可能只是高頻而非高品質
- 哪些 reusable assets 正在過度代表某類客戶、某種案型、某種顧問風格
- 哪些能力面向的存在感正在變薄

正式規則：

- high-frequency 不等於 high-quality
- high-adoption 不等於 broadly-generalizable
- phase 6 第一版只做 drift detection / explanation，不做自動糾偏 engine

### 3. Reuse Boundary

系統必須開始正式區分：

- `可跨情境泛化`
- `局部可參考`
- `只適用於特定脈絡`

正式規則：

- 不可把某個 precedent / playbook / template 因為近期成功就直接擴寫成全域最佳實務
- Host 仍應保有最終 contextual judgment

### 4. Generalist Posture

系統必須開始正式回答：

- 這間 firm 的 shared intelligence 目前仍像全面型顧問公司
- 還是已開始朝某些高頻局部能力過度傾斜

正式規則：

- phase 6 不可把「偏科變強」誤當成「整體變強」
- generalist posture 本身必須成為正式 read model

## Product Options

### Option A: `Capability Coverage + Anti-Drift Governance` `(Recommended)`

- 先建立一套低噪音、可正式回讀的 generalist governance layer
- 第一波先看 coverage / drift / reuse boundary
- 不急著做自動修正或大型治理介面

優點：

- 最符合目前產品成熟度
- 不會太早長成 dashboard shell
- 可直接保護 existing shared intelligence 不被高頻樣本拉歪

缺點：

- 第一波仍主要是觀測與治理，不是自動優化

### Option B: `Vertical Excellence Program`

- 挑幾個高頻案型先做更深 specialization

優點：

- 短期可能更快看到某些案型的品質提升

缺點：

- 直接違背全面型顧問公司的產品理想
- 會把 system-level learning 往偏科方向推

### Option C: `Consultant Performance Governance`

- 先看哪類顧問或哪種風格留下的內容最有價值

優點：

- 對團隊治理看似有吸引力

缺點：

- 太容易滑向 ranking / training / people management shell
- 和目前產品身份不一致

正式建議：

- 採 `Option A`

## Recommended First Slice

Phase 6 第一個正式施工 slice 應是：

- `capability coverage and anti-drift audit v1`

第一波正式回答：

1. 目前 reusable intelligence 主要集中在哪些 capability areas
2. 哪些 areas 已有較穩 coverage
3. 哪些 areas 正在過重
4. 哪些 areas 明顯偏薄
5. 哪些 precedent / playbook / template 屬於：
   - generalizable
   - contextual
   - narrow-use

第一波正式輸出應偏向：

- low-noise audit read model
- consultant-readable / owner-readable summary
- 不新增大型治理頁面

## IA Posture

第一波建議仍留在既有 workbench surface，不新增：

- `/phase-6`
- `/governance`
- `/coverage-dashboard`

較合理的承接面包括：

- `總覽`
- `history`
- shared-intelligence 既有 second-layer surface

## Non-Goals

Phase 6 第一版明確不做：

- 自動糾偏 engine
- consultant 排名
- team scorecard
- enterprise governance shell
- 垂直產業特化版
- 多租戶 SaaS 化

## Success Criteria

如果 Phase 6 第一版有效，系統至少應能正式回答：

- shared intelligence 現在覆蓋得夠不夠全面
- 哪些地方正在偏科
- 哪些 reusable assets 其實不應被過度泛化
- 目前這套系統還是不是一個全面型顧問公司的 shared brain

若這些問題還只能靠對話臨時推論，就不算進入真正的 Phase 6。
