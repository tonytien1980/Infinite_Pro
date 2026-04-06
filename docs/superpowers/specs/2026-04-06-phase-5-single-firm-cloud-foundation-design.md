# Phase 5 Single-Firm Cloud Foundation Design

日期：2026-04-06
狀態：partially_implemented

## Purpose

第 4 階段 `precedent / reusable intelligence` 已正式收口後，Infinite Pro 的下一個正式問題不再是 shared-intelligence lifecycle 的 completion pass，而是：

- 這套已能累積 shared intelligence 的系統，怎麼正式支援一間顧問公司在雲端使用
- 多位顧問各自辦案時，系統怎麼知道是誰在使用、誰留下了什麼經驗、誰可執行哪些治理動作
- 在不提早做成 enterprise SaaS shell 的前提下，怎麼建立小型顧問公司可用的 identity / access foundation

因此第 5 階段的正式方向定為：

- `Single-Firm Cloud Foundation`

## Product Posture

這一階段的正式定位是：

- 先支援單一顧問公司在雲端使用 Infinite Pro
- 一間 firm 內可有多位顧問正式登入並各自辦案
- shared intelligence 繼續在同一個系統大腦內累積
- multi-firm schema 可以預留，但第一版不啟用 multi-tenant 營運

這一階段不是：

- enterprise RBAC platform
- 公開註冊 SaaS
- 多人共編同一案件的 collaboration shell
- client-facing portal
- consultant ranking / 資歷分級系統

## Core Decisions

第一版正式決策如下：

1. 登入方式採 `Google Login`
2. 加入方式採 `owner 邀請制`
3. 角色只允許：
   - `owner`
   - `consultant`
   - `demo`
4. `demo` 也必須登入後才能進入 demo workspace
5. `consultant` 必須使用自己的 provider credentials 工作，不可沿用 owner 預設 key
6. `consultant` 若尚未填入自己的 API key，正式規則是不可執行分析
7. provider / model 必須受 owner allowlist 約束
8. `Agents / Packs` 對 consultant 可見，但 consultant 不可新增、編輯、停用或治理
9. `owner` 需有獨立 `members` 管理頁，正式管理 firm 成員與身份別

## Role Model

### `owner`

正式責任：

- firm 最高管理者
- identity / membership / shared-governance 管理者
- Agents / Packs / phase sign-off / shared-intelligence 治理的正式授權者

第一版權限：

- 全部 `consultant` 權限
- `manage_members`
- `manage_agents`
- `manage_packs`
- `manage_firm_settings`
- `manage_provider_allowlist`
- `govern_shared_intelligence`
- `sign_off_phase`
- `access_demo_workspace`
- `access_firm_workspace`

### `consultant`

正式責任：

- 使用 Infinite Pro 辦案、分析、產交付物、留下 feedback 與 candidate

第一版權限：

- `access_firm_workspace`
- `use_personal_provider_settings`
- `create_matter`
- `update_matter`
- `run_analysis`
- `update_deliverable`
- `submit_feedback`
- `create_precedent_candidate`
- `view_agents`
- `view_packs`

第一版限制：

- 不可管理 members
- 不可管理 Agents / Packs
- 不可做 phase sign-off
- 不可做 final shared-intelligence governance
- 尚未填入自己的 API key 時，不可執行分析

### `demo`

正式責任：

- 只作受控展示，不作正式生產使用

第一版權限：

- `access_demo_workspace`
- `read_only`

第一版限制：

- 不可進正式 firm workspace
- 不可新增、修改、上傳、分析、feedback、治理
- 不可看到真實顧問公司的正式資料

## Settings Split

這一階段必須把目前偏 single-user 的 `/settings` 正式拆成兩層概念：

### `Firm Settings`

只允許 owner 管理：

- firm 基本設定
- provider allowlist
- 成員邀請策略
- demo policy
- 其他全域預設

### `Personal Provider Settings`

允許 owner / consultant 各自管理自己的設定：

- provider
- model
- API key
- 個人工作偏好

正式規則：

- personal credentials 必須存伺服器端並加密保存
- consultant 不可改 global system settings
- consultant 只能在 owner 允許的 provider / model 範圍內設定自己的工作引擎

## Membership and Access Model

第一版正式資料責任應至少包括：

- `User`
- `AuthIdentity`
- `Firm`
- `FirmMembership`
- `FirmInvite`
- `PersonalProviderCredential`
- `DemoWorkspacePolicy`
- `AuditLog`

正式流程：

1. 使用者用 Google 登入
2. 系統解析 `AuthIdentity`
3. 若未被 owner 邀請加入 firm，則不可進正式 workspace
4. 若已具 firm membership，依角色進入：
   - firm workspace
   - 或 demo workspace

## Demo Isolation

第一版正式規則：

- demo 一定要登入
- demo 帳號數量由 owner 控管
- demo 只能進 demo workspace
- demo data 必須是固定 sample dataset
- demo 不可讀到任何正式 firm data

這層是：

- controlled product demonstration environment

不是：

- production workspace 的唯讀旁觀模式

## Server-Side Access Control

第一版正式原則：

- 權限檢查不可只做在前端按鈕顯示層
- 後端 route / service 必須正式檢查角色與 permission bundle

第一批必須被 server-side gate 保護的面與動作：

- `/agents`
- `/packs`
- `/members`
- `Firm Settings`
- phase sign-off
- shared-intelligence governance actions

## Cloud-Ready Constraints

由於此產品將部署到雲端，第一版設計必須從一開始就承接：

- OAuth callback / session lifecycle
- invite token lifecycle
- server-side encrypted credential storage
- audit trail
- demo / production data isolation
- 未來 multi-firm schema 擴充空間

正式規則：

- 第一版可以是 single-firm runtime
- 但不可把 schema 寫死成永遠只能單使用者本機執行

## First Implementation Slice

第 5 階段的第一個正式施工 slice 應是：

- `Auth + Membership Foundation`

包含：

- Google auth
- user / identity / firm / membership / invite schema
- owner invite flow
- role resolution
- session foundation
- 基礎 route guard

原因：

- 沒有這層，後續的 `members`、`Personal Provider Settings`、`demo isolation`、`permission gating` 都沒有正式地基

目前這個 first slice 已正式落地：

- Google auth foundation
- single-firm membership / invite / session models
- owner-only `members` page / API
- backend route permission gate baseline

但仍未完成：

- `Personal Provider Settings`
- provider allowlist UI
- demo workspace data isolation

## Non-Goals

第一版明確不做：

- multi-tenant SaaS shell
- enterprise RBAC matrix
- SSO / SCIM
- public signup
- client portal
- 多人共編同一案件 collaboration shell
- consultant ranking / visible seniority scoring

## Expected Outcome

做完第 5 階段第一版後，Infinite Pro 會正式從：

- 單人超強工作台 + 已成立的 shared intelligence foundation

往前推成：

- 單一顧問公司可在雲端正式登入、分角色、各自辦案、共用 shared brain 的 operating foundation
