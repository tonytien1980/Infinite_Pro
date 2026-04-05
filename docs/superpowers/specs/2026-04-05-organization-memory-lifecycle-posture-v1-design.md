# Organization-Memory Lifecycle Posture v1

日期：2026-04-05
狀態：implemented

## 目標

把 organization memory 補進和 playbook / template 一致的 shared-source lifecycle posture contract。

## 第一版 contract

- `lifecycle_posture`
  - `foreground`
  - `balanced`
  - `background`
  - `thin`
- `lifecycle_posture_label`

## 設計重點

- 單一 cross-matter 背景即使很新，也仍先算 `background`
- recent + stale 並存時，算 `balanced`
- 沒有 cross-matter、只剩同案穩定背景時，算 `thin`
- 這一版不把 organization memory 拉進 feedback-linked decay

## 驗證

- targeted backend tests
- prompt payload test
- frontend helper test
- full repo verification
