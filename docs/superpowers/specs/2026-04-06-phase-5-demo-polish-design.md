# Phase 5 Demo Polish Design

日期：2026-04-06
狀態：proposed

## Purpose

`demo workspace isolation` 已正式成立，但目前 `/demo` 仍偏向技術上可用的最低版本：

- 有固定 sample dataset
- 有唯讀邊界
- 有 demo-only route gate

但還不夠像一個真正拿來展示產品的受控入口。現在的明確缺口不是隔離性，而是：

- `/demo` 第一眼還不夠回答「這套系統在展示什麼」
- 目前 section list 偏 raw，還不夠 consultant-facing
- demo user 雖然被安全隔離，但還不夠清楚知道：
  - 可以看什麼
  - 不能做什麼
  - 正式版工作流會長成什麼樣子

因此這一條主線的正式目標是：

- 把 `/demo` 補成更像正式產品的 guided showcase
- 但不把 demo 變成另一套產品殼或 onboarding wizard

## Product Posture

這一條主線的正式定位是：

- `demo workspace isolation` 之後的 low-noise product polish
- 受控展示入口
- consultant-facing read-only showcase

這一條主線不是：

- public marketing landing page
- interactive product tour engine
- demo dataset editor
- second admin surface

## Core Decision

正式決策如下：

1. `demo polish` 應留在既有 `/demo` route
2. 不新增新的 demo shell 或 walkthrough wizard
3. polish 的重點是讓 `/demo` 更像產品展示入口，而不是 raw dataset dump
4. 仍維持固定 sample dataset、唯讀、登入後才能看
5. 第一屏要更明確回答：
   - 你在看什麼
   - 這套系統如何工作
   - demo 為什麼不能操作

## Recommended Scope

第一個 `demo polish` slice 只做：

1. `demo narrative read model`
2. `/demo` guided hero + summary cards
3. `read-only boundary` 與 `正式版工作流` 的更清楚文案

不做：

- interactive tour steps
- 每個 section 的深連結 drill-down
- demo analytics
- owner-side demo appearance editor

## Product Options

### Option A: Polish existing `/demo` with a stronger guided read model `(Recommended)`

- backend 回更結構化的 demo overview
- frontend 把 raw section list 轉成更清楚的 hero / highlights / rules / next-step 區塊
- 不改 demo isolation 邊界

優點：

- 最符合現有 IA
- 產品感會提升，但不長出新殼
- 維持 single-firm cloud foundation 的低噪音節奏

缺點：

- 仍然是固定資料，不是互動 demo

### Option B: Build a dedicated interactive product tour

- 為 demo 角色新增 step-by-step 導覽

優點：

- 展示感更強

缺點：

- 太早
- 容易長成第二套產品

### Option C: Keep backend unchanged and do frontend-only copy polish

- 只改 `/demo` 頁面排版與文案

優點：

- 最快

缺點：

- demo contract 不夠穩
- 容易把產品語意藏在前端 heuristics 裡

正式建議：

- 採 `Option A`

## Capability Breakdown

### 1. Demo Narrative Read Model

`/demo` 應正式回出：

- `hero_summary`
- `showcase_highlights`
- `read_only_rules`
- `formal_workspace_explainer`

目的不是增加很多資料，而是把既有 sample dataset 轉成更清楚的展示讀法。

### 2. Guided Demo Hero

第一屏應正式回答：

- 這裡是什麼
- 會看到哪些典型工作面
- 為何不能操作
- 正式版與 demo 的差異

### 3. Demo Showcase Highlights

應清楚點出 demo 目前展示的三條主線：

- matter / case world
- deliverable shaping
- history / shared intelligence

### 4. Read-Only Boundary Copy

目前雖然 backend 已隔離，但 UI 還應更誠實地說清楚：

- 不能新增
- 不能修改
- 不能分析
- 不能治理
- 不能讀正式 firm data

## IA Placement

### `/demo`

正式承接：

- guided hero
- showcase highlights
- read-only rules
- formal workspace explainer
- fixed sample sections

### Not Added

這一刀不新增：

- `/demo/tour`
- `/demo/history`
- `/demo/matters`

## Backend Requirements

這一條主線至少需要：

- enrich `DemoWorkspaceRead`
- keep demo data fixed and backend-owned

建議新增 contract：

- `hero_summary`
- `showcase_highlights`
- `read_only_rules`
- `formal_workspace_explainer`

## Frontend Requirements

這一條主線至少需要：

- `/demo` 不再只是 raw list
- 更清楚的 hero / summary cards
- 更清楚的正式版 / demo 差異說明
- consultant-facing Traditional Chinese copy

## Scope Guard

這個 slice 只做：

- demo polish
- guided read-only showcase
- stronger consultant-facing copy and structure

這個 slice 不做：

- owner controls deepen
- firm operating surfaces
- public landing page
- onboarding wizard

## Recommended First Slice

如果要開始實作，我建議先切成：

1. `DemoWorkspaceRead narrative contract`
2. `/demo` guided shell polish

也就是先把 demo 從「安全但偏 raw」補成「安全而且像正式產品展示入口」。
