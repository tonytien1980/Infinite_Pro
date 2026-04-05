# Feedback-Linked Shared-Source Decay V1 Design

## Purpose

這一輪不做新的 lifecycle engine。

先把既有 `feedback-linked shared-source reactivation` 補成對稱的另一半：

- 若 shared source 能因正向 feedback 回前景
- system 也應能更誠實地回答：
  - 是不是最新的負向 feedback 讓它退回背景
  - 還是只是 generic freshness / stability 下滑

## Scope

第一版只做：

1. `domain_playbook_guidance` 補 `decay_summary`
2. `deliverable_template_guidance` 補 `decay_summary`
3. prompt-safe payload 補 `來源退背景`

不做：

- 新資料表
- background worker
- auto-dismiss / auto-governance
- 新頁面

## Rules

第一波正式規則：

- 若最新 precedent feedback 是 `needs_revision`，且這筆 precedent 原本會進 playbook / template 主線，system 可明確讀成 feedback-linked decay
- 若 precedent 的 shared signal 已是 `downweight`，也可讀成先退到背景觀察
- 這層不代表 precedent 立刻從資料庫消失，只代表在 reusable guidance 裡它不該繼續站在前景

## Expected Outcome

做完後，Infinite Pro 在 shared source lifecycle 上會更接近顧問真實判斷：好模式能因新的採納回饋回前景，不夠穩的模式也會因新的負向回饋被推回背景。
