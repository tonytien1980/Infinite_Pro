# Shared-Source Lifecycle Posture v1

日期：2026-04-05
狀態：implemented

## 目標

把 playbook / template 已有的 shared-source lifecycle wording，收成一個正式、可共用的 posture contract。

## 第一版 contract

- `lifecycle_posture`
  - `foreground`
  - `balanced`
  - `background`
  - `thin`
- `lifecycle_posture_label`

## 作用

- Host prompt 不必再自己猜 lifecycle 狀態
- frontend second-layer 不必只靠 copy 猜測這輪是前景還是背景
- playbook / template 不再各自長不同方言

## 不做

- 不開新頁面
- 不做 lifecycle dashboard
- 不做自動治理 job

## 驗證

- backend targeted tests
- prompt payload tests
- frontend helper tests
- full repo verification
