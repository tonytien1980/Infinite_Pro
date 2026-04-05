# Feedback-Linked Shared-Source Recovery Balancing v1

日期：2026-04-05
狀態：implemented

## 目標

當同一輪 reusable-intelligence guidance 同時出現：

- 正向 feedback 讓 shared source 回前景
- 負向 feedback 讓另一批 shared source 退背景

系統不應只把兩句 lifecycle 訊號並排丟給顧問或 Host。

第一波要先收成一條更一致的平衡讀法：

- `recovery_balance_summary`

## 範圍

- `domain_playbook_guidance`
- `deliverable_template_guidance`
- prompt-safe payload
- 現有 second-layer UI readback

## 不做

- 不做新的 dashboard
- 不做新的 ranking page
- 不做背景自動治理 job
- 不做 memory / organization-memory balancing

## 設計

### Backend contract

新增：

- `DomainPlaybookGuidanceRead.recovery_balance_summary`
- `DeliverableTemplateGuidanceRead.recovery_balance_summary`

規則：

- 若同時存在 `reactivation_summary` 與 `decay_summary`
- 產生 `recovery_balance_summary`
- lifecycle summary 改成更誠實的平衡姿態

### Prompt contract

若存在 `recovery_balance_summary`：

- prompt context 優先輸出 `來源平衡：...`
- 同一 slice 不再重複堆疊 `來源回前景` / `來源退背景`

### UI contract

既有 second-layer surface 優先顯示：

- `來源平衡：...`

並避免把兩句互相衝突的 lifecycle copy 直接並排。

## 驗證

- targeted backend tests for playbook/template balancing
- targeted payload tests for `來源平衡`
- full repo verification follows existing phase-4 runtime checks
