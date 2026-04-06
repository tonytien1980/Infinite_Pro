# Phase 5 Owner Controls Deepen Design

日期：2026-04-06
狀態：proposed

## Purpose

`Single-Firm Cloud Foundation` 的前三個 slice 已正式建立：

- `Auth + Membership Foundation`
- `Personal Provider Settings + Allowlist Foundation`
- `Demo Workspace Isolation`

因此現在的明確缺口不再是：

- 顧問能不能登入
- consultant 能不能用自己的 key 工作
- demo 能不能和正式資料隔離

而是：

- owner 雖然已能管理 members、provider allowlist、demo 帳號與 demo workspace 基礎
- 但 owner 仍缺少更成熟的 firm controls
- 目前的 owner controls 還偏「有功能」，但還不夠「可營運」

所以這一條主線的正式目標是：

- 讓 owner 可以更成熟地管理 firm 內的成員、邀請、demo policy 與基礎營運控制
- 但不把 Infinite Pro 拉成 generic enterprise admin console

## Product Posture

這一條主線的正式定位是：

- `Single-Firm Cloud Foundation` 站穩後的 owner-side operating controls deepen
- 是小型顧問公司用得上的 owner controls
- 不是企業平台化 admin shell

這一條主線不是：

- enterprise RBAC matrix
- audit analytics platform
- HR / org-chart system
- billing admin console

## Core Decision

這一條主線的正式決策如下：

1. owner controls 應只補「單一 firm 真正需要的控制面」
2. members 相關的控制留在 `/members`
3. demo / provider / global guardrail 相關控制留在 `Firm Settings`
4. owner 應能撤回待接受邀請，不只看 pending invite
5. owner 應能管理 demo policy，而不只看到 demo summary
6. owner 應能看懂目前 firm 的控制狀態，不必靠讀 DB 或看多個頁面拼湊

## Recommended Scope

第一個 owner controls deepen slice 只做：

1. `invite revoke / invite state control`
2. `demo workspace policy controls`
3. `owner control summary`

不做：

- audit log center
- seat billing
- fine-grained permission editor
- multi-firm policy
- external IdP / SCIM

## Product Options

### Option A: Deepen existing `/members` + `Firm Settings` surfaces `(Recommended)`

- `/members` 補 invite revoke 與更清楚的 member / demo summary
- `Firm Settings` 補 demo policy controls
- 不新增新的 admin dashboard

優點：

- 最符合現有 IA
- 不會把產品拉向 generic admin console
- owner 的控制面仍維持低噪音

缺點：

- owner controls 分散在兩個地方

### Option B: Add a new `/firm-controls` page

- 所有 owner controls 拉到一個新頁面

優點：

- owner controls 都集中

缺點：

- 會過早長出 admin shell
- 與目前 workbench posture 不一致

### Option C: Keep all owner controls inside `/settings`

- members invite / revoke 也一起塞進 settings

優點：

- 實作可能看起來集中

缺點：

- `/settings` 會變得過重
- members 與 firm policy 的邊界會混掉

正式建議：

- 採 `Option A`

## Capability Breakdown

### 1. Invite Revoke

owner 應能：

- 撤回 pending invite
- 在 UI 內看見 invite 是否仍可用
- 不必靠 DB 或重新送一份相同邀請來覆蓋舊 invite

正式規則：

- 只可撤回 `pending` invite
- 已 `accepted` 或已 `revoked` 的 invite 不可重複撤回
- 撤回後，原 invite token 不可再被用於登入加入

### 2. Demo Policy Controls

owner 應能管理：

- demo workspace 是否啟用
- `max_active_demo_members`
- demo workspace 的顯示標題 / workspace slug 是否維持預設

第一版正式建議：

- 先只做：
  - `status`
  - `max_active_demo_members`
- `workspace_slug` 與 `seed_version` 先保留在 backend，UI 不開放編輯

### 3. Owner Control Summary

owner 應能在第一眼看見：

- active members 總數
- active demo 帳號數
- pending invites
- pending demo invites
- demo workspace 是否啟用
- current provider guardrail 是否已站穩

這一層的目的不是做 dashboard，而是：

- 減少 owner 來回跳頁面才能知道系統是否在可控狀態

## IA Placement

### `/members`

正式承接：

- members list
- pending invites
- invite revoke
- member role / status update
- member / demo summary

### `/settings`

正式承接：

- `Firm Settings`
- provider allowlist
- demo policy controls
- 其他 owner-level global controls

## Backend Requirements

這一條主線至少需要：

- `revoke_member_invite`
- `get_demo_workspace_policy`
- `update_demo_workspace_policy`

建議新增 contract：

- `MemberInviteRevokeResponse`
- `DemoWorkspacePolicyRead`
- `DemoWorkspacePolicyUpdateRequest`

## Frontend Requirements

這一條主線至少需要：

- `/members` 的 revoke invite action
- `/members` 的更完整 summary block
- `Firm Settings` 補 demo policy panel
- low-noise owner copy，不做 admin jargon

## Scope Guard

這個 slice 只做：

- owner controls deepen
- invite revoke
- demo policy controls
- owner control summary

這個 slice 不做：

- audit log console
- multi-firm controls
- consultant ranking
- org chart
- enterprise RBAC editor

## Recommended First Slice

如果要開始實作，我建議先切成：

1. `members invite revoke + owner summary`
2. `Firm Settings demo policy controls`

也就是先把 owner 最常碰、最像「真正在營運一個 firm」的控制面補起來。
