# Shared-Source Lifecycle Posture v1 Plan

日期：2026-04-05
狀態：completed

## 實作步驟

1. 先補 failing tests，鎖住 playbook / template / payload / frontend helper 的 posture contract
2. 新增 shared lifecycle helper
3. 在 playbook / template 導入共用 posture 計算
4. prompt payload 補 `來源姿態`
5. frontend helper / second-layer surface 對齊
6. active docs / QA matrix 對齊
7. full verification / commit / push
