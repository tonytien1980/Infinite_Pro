# 13_system_provider_settings_and_credentials.md

> 文件狀態：Beta v1.0（單人版 system provider settings / credentials 文件）
>
> 本文件正式定義 **Infinite Pro** 在單人正式 beta 階段的系統級模型供應商設定、credential 邊界、runtime precedence、驗證流程與 fail-closed 規則。若後續調整 `provider settings / credentials / active runtime config / env precedence / provider validation / settings page 正式責任`，應優先同步更新本文件。

---

## 1. 文件目的

本文件回答以下問題：

1. 單人版 owner 可以在系統設定頁管理哪些 provider / model / credential 設定？
2. active provider config 與 `.env` baseline 的 precedence 怎麼定義？
3. credential 存在哪裡、哪些部分可以回到前端、哪些必須 fail-closed？
4. 哪些 provider 已正式可配置、哪些只是 beta 相容路徑？

---

## 2. 正式能力邊界

本輪正式成立的是：

- 單人版 owner 的 **system-level active provider config**
- `/settings` 的「模型與服務設定」正式區塊
- backend persisted runtime config
- backend connection validation
- 單一 active provider 的正式 precedence

明確不做：

- 多人 / per-user API key management
- 多家 provider 同時啟用
- provider fallback chaining
- 依 agent / pack 指派不同 provider
- enterprise admin credential console

---

## 3. 正式支援的 provider 範圍

第一波正式 provider id：

- `openai`
- `anthropic`
- `gemini`
- `xai`
- `minimax`

前端正式顯示名稱：

- OpenAI
- Anthropic（Claude）
- Google Gemini
- xAI（Grok）
- MiniMax

正式規則：

- 同一時間只允許一個 active provider
- provider preset、model level mapping 與 runtime config 都由 backend 維護
- 前端只能編輯、驗證、儲存、回到 env baseline，不可直接決定低層 provider 呼叫

---

## 4. Provider preset 與模型層級

每個正式 provider preset 至少包含：

- `provider_id`
- `display_name`
- `default_base_url`
- `default_timeout_seconds`
- `auth_scheme_type`
- `recommended_models`
  - `high_quality`
  - `balanced`
  - `low_cost`

正式 UI 流程：

1. 先選 provider
2. 再選模型層級
3. 系統自動帶出推薦 model id
4. 需要時可用 `custom_model_id` 覆寫

正式規則：

- 不把 provider 硬綁成單一模型
- 不把龐大的全模型 catalog 攤在 UI 上
- 推薦模型 mapping 必須集中在可維護位置，而不是散落在前端文案

---

## 5. Runtime precedence

正式 precedence：

1. `system_provider_configs` 的 persisted runtime config
2. `.env` baseline
3. `.env` 只作 bootstrap / emergency baseline，不應在已有 persisted runtime config 後靜默覆蓋 UI 儲存結果

正式規則：

- 若 DB 有正式 runtime config，Host / agent / deliverable runtime path 應優先讀 DB
- 若 DB 無正式 runtime config，才回退到 `.env`
- 設定頁必須清楚顯示目前來源是 `runtime_config` 還是 `env_baseline`

---

## 6. Credential storage 與安全邊界

目前單人 beta 的正式 secret boundary：

- credential 只存 backend
- credential 不進 localStorage
- credential 不混進一般 `workbench_preferences`
- frontend 不可回顯完整 key

目前 backend persisted row：

- `system_provider_configs`

其中至少包含：

- `provider_id`
- `model_level`
- `model_id`
- `custom_model_id`
- `base_url`
- `timeout_seconds`
- `api_key_secret`
- `api_key_masked`
- `last_validation_status`
- `last_validation_message`
- `last_validated_at`
- `updated_at`
- `key_updated_at`

目前的 beta 限制：

- credential 已有清楚的 backend secret boundary
- 目前仍是單人版 DB-backed secret storage
- 目前尚未做到獨立 external secret manager
- 若未額外配置更高級的 secret storage，仍不應把這一層描述成 production-grade secrets platform

---

## 7. 驗證與套用流程

正式流程：

1. 進入設定頁先看目前生效設定
2. 進入編輯模式
3. 修改 provider / key / model level / base URL / timeout / custom model id
4. 先做 `測試連線`
5. 驗證成功後再 `儲存並套用`
6. backend 寫入正式 runtime config
7. Host 與其他正式模型呼叫繼續透過 internal router 讀新的 active config

可選但需明示風險的流程：

- 使用者可在未先成功驗證時強制儲存
- 這種情況應標記為 `not_validated`
- UI 不可把這種情況描述成「已驗證成功」

---

## 8. 連線驗證的正式責任

目前正式驗證只做最小檢查：

1. API key 是否可用
2. Base URL 是否可達
3. model 是否可接受

正式狀態至少要區分：

- `success`
- `invalid_api_key`
- `base_url_unreachable`
- `model_unavailable`
- `timeout`
- `unknown_error`
- `not_validated`

正式規則：

- 驗證是 backend responsibility
- 前端只顯示簡潔結果與次層詳細錯誤
- 目前不做 benchmark、壓力測試、多輪對話測試或成本測試

---

## 9. Fail-closed 規則

下列操作必須 fail-closed：

- credential update
- provider validation
- 正式 runtime config save

正式規則：

- credential update 不可 local fallback
- backend 寫入失敗時，不可在 UI 上看起來像成功
- 前端不可用一般 workbench preference 的 local fallback 路徑代替 credential save

---

## 10. Provider abstraction

本輪不得破壞既有 provider abstraction。

正式規則：

- 所有模型呼叫仍走 internal router / provider boundary
- Host orchestration 不可因設定頁加入而直接從前端呼叫 provider
- `/settings` 只負責管理 active runtime config，不負責執行模型請求

### 10.1 管理面 contract synthesis 也屬於正式 provider 呼叫
Agent / Pack 管理面的「精簡建立 -> 正式 contract draft」同樣屬於正式模型呼叫。

正式規則：
- 精簡建立補完必須由 backend 執行，不可在前端直接打 provider
- 應沿用目前 active runtime config，而不是額外藏一套獨立模型設定
- 若有外部搜尋補完，也應由 backend 一併治理搜尋查詢、來源摘要與錯誤處理
- 補完結果仍應回到正式 schema 驗證，再交給管理面儲存或微調

### 10.2 管理面 contract synthesis 的 backend guardrails
管理面補完不應只是「模型回什麼就存什麼」。

正式 backend guardrails 至少應包括：
- structured-output schema 約束
- bounded external search
- post-synthesis normalization
- whitelist / registry-aware validation
- fail-closed 的正式寫入路徑

更具體地說：
- `agent_type`、`supported_capabilities`、`relevant_*_packs`
  應限制在正式 Agent / Pack / Capability 語義集合內
- `domain_lenses`、`relevant_client_types`、`relevant_client_stages`
  應限制在正式治理詞彙內
- 不合法值應被清理、保守降級或拒絕，而不是直接落進 registry

### 10.3 OpenAI request-body 預檢與 parse-body 400 收斂

在單人正式 beta 階段，`openai` 正式 runtime path 也應保留最小但真實的 request guardrail，而不是把 provider-side parse 錯誤直接當作不可解釋的黑盒失敗。

正式規則：
- backend 應先對即將送出的 JSON request body 做本地預檢
- 若 request body 在本地序列化 / decode / parse 就失敗，應直接 fail-closed，不可把錯誤延後成模糊的 provider runtime 問題
- 若本地 request-body 預檢已通過，但 OpenAI 官方 API 回傳明確的 parse-body `HTTP 400`，backend 可在同一 provider path 內以 fresh request 進行單次收斂重試
- 此類單次重試仍不得繞過 provider abstraction，也不得改走 UI fallback、mock provider 或未治理的替代路徑
- 若重試後仍失敗，應維持正式 fail-closed 行為，而不是吞錯或偽裝成成功

---

## 11. 第一波 provider 支援層級

### 11.1 正式 verified

- `openai`
  - backend validator 正式接通
  - runtime path 為正式主路徑
  - 官方 OpenAI API 路徑
  - request-body 本地預檢與 parse-body `HTTP 400` 單次收斂重試已正式建立
  - 推薦模型：
    - `gpt-5.4`
    - `gpt-5.4-mini`
    - `gpt-5.4-nano`

### 11.2 Native beta runtime path

- `anthropic`
- `gemini`

目前狀態：

- `anthropic` 走原生 Claude Messages API
- `gemini` 走原生 Gemini API
- UI / preset / backend validation path / backend runtime path 都已成立
- 目前仍應誠實標示為 beta，直到對應 provider 在正式環境完成 end-to-end runtime 驗證

目前建議模型：

- `anthropic`
  - `claude-opus-4-6`
  - `claude-sonnet-4-6`
  - `claude-haiku-4-5`
- `gemini`
  - `gemini-2.5-pro`
  - `gemini-2.5-flash`
  - `gemini-2.5-flash-lite`

### 11.3 Compatibility beta runtime path

- `xai`
- `minimax`

目前狀態：

- UI / preset / backend validation path 已成立
- runtime path 依官方文件可用的相容路徑接入
- `xai` 目前走官方 OpenAI-compatible 路徑
- `minimax` 目前走官方 OpenAI-compatible 路徑
- 但在目前單人 beta 文件中，仍應誠實標記為 beta 相容路徑，而非宣稱每一家都已 production-verified

目前建議模型：

- `xai`
  - `grok-4.20-reasoning`
  - `grok-4-1-fast-reasoning`
  - `grok-4-1-fast-non-reasoning`
- `minimax`
  - `MiniMax-M2.7`
  - `MiniMax-M2.7-highspeed`
  - `MiniMax-M2.1`

### 11.4 Provider preset 的正式規則

- provider preset 與 model level mapping 必須由 backend 維護
- OpenAI 使用官方 OpenAI API
- Anthropic / Gemini 優先使用官方原生 API
- xAI / MiniMax 目前維持官方相容 API 路徑
- `anthropic` 的預設 Base URL 應直接對齊 Claude Messages API
- `gemini` 的預設 Base URL 應對齊 Gemini 原生 API root，再由 backend 補完整模型 action endpoint
- 若某家 provider 的最新型號尚未被官方 API 文件明確列出，不應硬寫進正式 preset

---

## 12. 與其他 persistence 文件的關係

本文件和 [12_runtime_persistence_and_release_integrity.md](/Users/tonytien/Desktop/Infinite%20Pro/docs/12_runtime_persistence_and_release_integrity.md) 的分工如下：

- `docs/12`：正文 persistence、revision、rollback、publish / artifact、fallback / degraded mode / re-sync
- `docs/13`：system provider settings、credential 邊界、runtime precedence、provider validation、single-owner active config

兩者共同正式要求：

- 不能把 secret 當一般 UI preference
- 不能把 fail-closed 路徑做成假成功
- 不能讓前端繞過 backend router 直接呼叫模型 provider
