# Phase 5 Personal Provider Settings + Allowlist Foundation Design

日期：2026-04-06
狀態：proposed

## Purpose

`Single-Firm Cloud Foundation` 的第一個 slice 已正式建立：

- Google Login
- `User / Firm / Membership / Invite / Session`
- `owner / consultant / demo`
- owner-only `members`
- backend permission gate

下一個正式缺口是：

- `consultant` 還不能在正式系統內保存自己的 API key
- provider / model 還沒有 owner-controlled allowlist contract
- `/settings` 仍主要是單人版 `system-level provider settings`

因此第二個 slice 的正式目標是：

- 讓 owner / consultant 都能在雲端保存自己的 `Personal Provider Settings`
- 讓 owner 正式定義 firm 可允許的 provider / model 範圍
- 讓 system 在真正執行分析前，先按身份、allowlist、個人 key 狀態做正確的 provider resolution

## Scope

第一版只做：

1. `Personal Provider Settings`
2. owner-managed provider allowlist foundation
3. run-time provider precedence 改成 auth-aware
4. `/settings` 正式拆成：
   - `Firm Settings`
   - `Personal Provider Settings`
5. consultant 若尚未填自己的 key，執行分析 fail-closed

不做：

- demo workspace data isolation
- sample dataset
- provider usage analytics dashboard
- secret manager integration
- multi-firm tenant policy

## Core Decision

第二個 slice 的正式決策如下：

1. `consultant` 執行分析時，必須使用自己的 provider credential
2. `owner` 可維持管理：
   - firm-level provider defaults
   - provider allowlist
3. `consultant` 不能修改 firm-level defaults
4. `consultant` 只能在 owner allowlist 內選 provider / model
5. 個人 API key 必須存 backend，且加密保存
6. 若 encryption key 不可用，personal credential write path 必須 fail-closed

## Product Options

### Option A: Keep current global provider config, add personal override `(Recommended)`

- 保留既有 `SystemProviderConfig` 當作 owner / firm-level default
- 新增 `PersonalProviderCredential`
- 新增 `ProviderAllowlistEntry`
- run-time resolution 先看 personal，再看 firm default

優點：

- 最貼合現有 repo 結構
- 不需重寫所有 provider settings 邏輯
- phase 5 第二刀可控

缺點：

- 會有一段 bridge period：同時存在 firm-level 與 personal-level provider config

### Option B: Replace current global provider config with per-user config only

- 拿掉 `SystemProviderConfig` 當正式主路徑
- 全部改成 personal-only

優點：

- 模型簡單

缺點：

- 和目前已 shipped 的 owner provider settings 衝突
- 會讓 owner 的 firm default / allowlist 一起失去落點

### Option C: Fully separate provider policy service

- allowlist、defaults、personal creds 全做成新 policy subsystem

優點：

- 長期乾淨

缺點：

- 這一刀太重
- 會把第二個 slice 變成 provider platform 重構

正式建議：

- 採 `Option A`

## Data Model

第二個 slice 至少新增：

- `PersonalProviderCredential`
- `ProviderAllowlistEntry`

### `PersonalProviderCredential`

正式責任：

- 保存 owner / consultant 的個人 provider credential
- 保存 provider / model selection
- 保存加密後的 API key
- 保存最後驗證狀態

第一版至少包括：

- `user_id`
- `provider_id`
- `model_level`
- `model_id`
- `custom_model_id`
- `base_url`
- `timeout_seconds`
- `api_key_ciphertext`
- `api_key_masked`
- `last_validation_status`
- `last_validation_message`
- `last_validated_at`
- `updated_at`
- `key_updated_at`

### `ProviderAllowlistEntry`

正式責任：

- 保存 firm 允許哪些 provider / model

第一版至少包括：

- `firm_id`
- `provider_id`
- `model_level`
- `allowed_model_ids`
- `allow_custom_model`
- `status`

## Encryption Posture

第一版正式規則：

- personal API key 不能明文保存
- backend 必須用 app-level symmetric encryption 保存個人 key
- encryption key 應來自環境變數，例如：
  - `PROVIDER_SECRET_ENCRYPTION_KEY`

第一版可接受的正式做法：

- `cryptography.fernet.Fernet`

第一版不可做：

- base64 假加密
- 前端 localStorage 保存真實 key
- demo account 共用 owner key

若 encryption key 缺失：

- read existing masked state 可保留
- write / rotate personal key 必須 fail-closed

## Runtime Precedence

第二個 slice 後，正式 provider precedence 應改成：

### `consultant`

1. personal provider credential
2. 若 personal provider 未設定或不在 allowlist
   - `run_analysis` fail-closed

### `owner`

1. personal provider credential
2. firm-level provider default
3. `.env` baseline

### `demo`

- 不可執行分析

正式規則：

- allowlist 先於 personal preference 生效
- 即使 consultant 有 key，也不可選 firm 不允許的 provider / model

## API Surface

第二個 slice 第一版建議新增：

- `GET /workbench/personal-provider-settings`
- `PUT /workbench/personal-provider-settings`
- `POST /workbench/personal-provider-settings/validate`
- `POST /workbench/personal-provider-settings/revalidate`
- `GET /workbench/provider-allowlist`
- `PUT /workbench/provider-allowlist`

既有 API 的新角色：

- `/workbench/provider-settings`
  - 轉為 owner-only `Firm Settings`
- `/workbench/provider-settings/validate`
  - owner-only

## Settings UX

第二個 slice 完成後，`/settings` 應正式拆成兩區：

### `Firm Settings`

只對 owner 顯示：

- firm-level provider default
- provider allowlist
- 保留既有 system-level provider validation

### `Personal Provider Settings`

對 owner / consultant 顯示：

- 目前個人 provider
- 目前個人 model
- 個人 API key 是否已保存
- 重新驗證 / 更新

consultant 視角的正式規則：

- 可以看 allowlist 範圍
- 可以改自己的 provider / model / key
- 不可改 firm defaults

## Failure Rules

### consultant 沒有個人 key

- task run 應回明確 `403` 或 `400` 類型錯誤
- consultant-facing copy 應明講：
  - 先完成個人模型設定，才能執行分析

### personal provider 不在 allowlist

- write path fail-closed
- runtime path也 fail-closed

### encryption key 缺失

- personal key write path fail-closed
- owner-visible firm default path 可維持既有行為

## Non-Goals

這一輪明確不做：

- demo dataset
- demo workspace isolation
- API cost tracking
- provider usage billing
- client-level provider policy

## Expected Outcome

做完這一刀後，Infinite Pro 會正式從：

- 有 identity / membership，但 provider 仍偏單人全域設定

往前推成：

- 真正支援多位顧問各自用自己的 key 工作
- 由 owner 控 firm 可用 provider 邊界
- settings 也正式長成 `Firm Settings + Personal Provider Settings` 的雙層結構
