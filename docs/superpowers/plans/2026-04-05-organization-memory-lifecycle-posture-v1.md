# Organization-Memory Lifecycle Posture v1 Plan

日期：2026-04-05
狀態：completed

## 實作步驟

1. 補 failing tests，鎖住 organization memory 的 `background / balanced / thin` posture
2. backend schema 加入 posture 欄位
3. organization-memory service 導入共用 lifecycle posture helper
4. prompt context 補 `來源姿態`
5. frontend helper / second-layer surface 對齊
6. active docs / QA matrix 對齊
7. full verification / commit / push
