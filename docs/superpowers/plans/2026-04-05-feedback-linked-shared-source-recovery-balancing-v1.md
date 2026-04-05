# Feedback-Linked Shared-Source Recovery Balancing v1 Plan

日期：2026-04-05
狀態：completed

## 實作步驟

1. 先補 failing tests
   - playbook balance
   - template balance
   - prompt payload prefers `來源平衡`
2. backend 新增 `recovery_balance_summary`
3. playbook precedent selection 改成可同時吸收正負 precedent signal
4. prompt payload 優先輸出 `來源平衡`
5. frontend helper / second-layer surface 對齊
6. active docs / QA matrix 對齊
7. full verification / commit / push

## 完成結果

- playbook / template 現在都可在 mixed feedback 情境下輸出一致的 balance summary
- prompt / UI 會優先顯示 `來源平衡`
- 仍維持 low-noise consultant-facing posture
