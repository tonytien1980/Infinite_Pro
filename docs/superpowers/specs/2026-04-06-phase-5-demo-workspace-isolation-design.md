# Phase 5 Demo Workspace Isolation Design

日期：2026-04-06
狀態：proposed

## Purpose

`Single-Firm Cloud Foundation` 的前兩個 slice 已正式建立：

- `Google Login + owner invite`
- `User / Firm / Membership / Invite / Session`
- `owner / consultant / demo`
- owner-only `Members`
- `Firm Settings`
- `Personal Provider Settings`
- consultant 缺少 personal key 時的 fail-closed run path

因此 phase 5 目前最明確、也最自然的下一個缺口變成：

- `demo` 角色雖然已存在，但還沒有正式的 demo workspace isolation
- `demo` 仍缺少固定 sample dataset 與受控展示入口
- owner 還不能正式控管 demo 帳號數量與 demo 展示面

所以第三個 slice 的正式目標是：

- 讓 `demo` 帳號登入後只進入 demo workspace
- 讓 demo 看到固定、共享、唯讀的展示資料
- 讓 demo 完全碰不到正式 firm data
- 讓 owner 能正式控管 demo 帳號與 demo 展示面

## Core Decision

第三個 slice 的正式決策如下：

1. `demo` 必須登入後才能進入 demo workspace
2. 所有 demo 帳號共用同一套固定 sample dataset
3. demo workspace 是唯讀展示環境，不是 production workspace 的 read-only mode
4. demo 不可新增、修改、上傳、分析、feedback、治理
5. demo 不可讀取任何正式 firm data
6. owner 需要能在成員管理面控管 demo 帳號數量與啟停

## Product Options

### Option A: Shared fixed demo workspace `(Recommended)`

- 所有 demo 帳號登入後都進同一套固定 demo dataset
- demo dataset 由系統 seed
- demo 只能看，不可寫

優點：

- 最穩、最簡單
- 最容易保證資料隔離
- 最符合「受控展示環境」而不是「試用系統」

缺點：

- 所有 demo 帳號看到的內容完全相同
- 不適合展示每人各自操作的深度體驗

### Option B: Per-demo cloned workspace

- 每個 demo 帳號登入時拿到一份自己的 demo 副本

優點：

- 展示體驗更接近真實使用

缺點：

- seed / reset / cleanup 成本高很多
- 很快會把 phase 5 拉向 dataset orchestration，而不是 demo isolation

### Option C: Production workspace read-only mode

- demo 直接讀正式 workspace，但所有寫入禁用

優點：

- 最省工程

缺點：

- 會讓 demo 與正式資料邊界變危險
- 不符合這個產品的 trust posture
- 不符合既定 `demo workspace isolation` 定義

正式建議：

- 採 `Option A`

## Demo Workspace Posture

demo workspace 的正式定位是：

- controlled product demonstration environment
- 展示 Infinite Pro 的案件世界、交付物、history、shared intelligence 讀法
- 對外或對內 demo 時使用的安全隔離區

demo workspace 不是：

- production workspace 的只讀旁觀者
- free trial environment
- training sandbox

## Isolation Rules

第三個 slice 的正式規則：

- demo 只能進 `/demo`
- demo 不可進正式：
  - `/matters`
  - `/deliverables`
  - `/history`
  - `/settings`
  - `/members`
  - `/agents`
  - `/packs`
- 若 demo 直接打正式 route，應被：
  - redirect 到 `/demo`
  - 或 server-side fail-closed

正式資料隔離：

- demo dataset 與正式 firm dataset 是不同資料來源
- demo 不可透過 permission filter 間接讀到正式資料
- demo query path 不得共用 production workspace 的 data source 後再只做前端遮罩

## Demo Dataset

第一版 demo dataset 應是固定、共享、由系統 seed 的 sample dataset。

至少包括：

- sample matters
- sample deliverables
- sample history
- sample shared-intelligence read model

第一版正式要求：

- sample dataset 要足以展示 Infinite Pro 的核心工作流
- 但不需要一開始就涵蓋所有 lane / 所有產業 / 所有案型

第一版建議展示內容：

1. 一個 sample flagship matter
2. 一個 sample deliverable
3. 一個 sample history / precedent / shared intelligence section
4. 一段說明 demo 邊界的靜態文案

## Owner Controls

第三個 slice 必須讓 owner 正式控管：

- demo 帳號邀請
- demo 帳號停用
- 目前 demo 帳號數量
- 哪些帳號屬於 demo role

第一版不做：

- 複雜 quota engine
- demo analytics dashboard
- demo seat billing

但正式資料模型與 UI 必須留得出：

- owner 可控管 demo 帳號數量

## Routing and UX

第三個 slice 後，demo 的正式 UX 應是：

1. 登入成功
2. 若角色是 `demo`
3. 導向 `/demo`
4. 在 `/demo` 內只看到展示頁面與說明

正式頁面結構建議：

### `/demo`

主要任務：

- 展示 Infinite Pro 在做什麼
- 展示 sample workbench surfaces
- 明講 demo 只能看，不能操作

第一屏必答：

- 你現在在 demo workspace
- 這不是正式辦案 workspace
- 這裡能看什麼
- 這裡不能做什麼

## Data Model

第三個 slice 至少應新增或正式化：

- `DemoWorkspacePolicy`
- `DemoWorkspaceSeed` 或等價 seed contract

第一版責任：

- 定義 demo 是否啟用
- 定義 demo 使用哪一套 seed dataset
- 定義 demo 與 production workspace 的 route / read-source 邊界

## Server-Side Rules

第三個 slice 的正式原則：

- demo 隔離不可只做前端按鈕隱藏
- backend route / service 也必須正式識別：
  - `demo`
  - `consultant`
  - `owner`

最低要求：

- demo 不得執行分析 route
- demo 不得執行寫入 route
- demo 不得進入 shared intelligence governance route
- demo 不得讀取正式 firm workspace objects

## Scope Guard

這個 slice 只做：

- demo workspace isolation
- shared fixed demo dataset
- demo routing gate
- owner demo account controls

這個 slice 不做：

- 每個 demo 帳號一份 clone
- public anonymous demo
- demo analytics
- demo billing / seat accounting
- training sandbox

## First Implementation Slice

第三個 slice 的第一個實作切法建議是：

1. `demo role routing + workspace gate`
2. `demo dataset seed / read model`
3. `demo page shell`
4. `/members` 的 demo account controls 補強

這樣可以先把最重要的「資料隔離 + 路由隔離」站穩，再往 demo page 的體驗往前推。
