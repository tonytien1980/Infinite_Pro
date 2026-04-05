# Shared Intelligence Promotion / Decay Rules V2 Design

## Purpose

這一輪不做新的治理頁，也不做背景自動化。

先把 precedent lifecycle 補成熟一點：

- `shared-intelligence promotion / decay rules v2`

也就是讓 source feedback 更新時，既有 precedent candidate 不會被粗暴刪除或重設，而是沿著更合理的 lifecycle 前進。

## Scope

這一版只做：

1. feedback-driven lifecycle preservation
2. existing precedent row identity 保留
3. 明確的 decay / restore 規則

不做：

- background auto-promotion
- background retirement job
- 全域 freshness scheduler
- template / playbook / memory 的 lifecycle job

## Rule

第一波正式規則：

- 若 source 尚未建立 precedent candidate，`not_adopted` 仍不建立 candidate
- 若既有 `candidate` 收到 `not_adopted`，改成 `dismissed`
- 若既有 `promoted` 收到 `not_adopted`，先 decay 回 `candidate`
- 若既有 `dismissed` 之後收到新的 qualifying feedback，恢復到 `candidate`
- 若既有 `promoted` 只是收到新的 qualifying feedback，維持 `promoted`

補充規則：

- source feedback 更新後，candidate row 不應被刪除
- 若 feedback 更新造成 status 改變，且 request 帶 `operator_label`，可把這次 operator 寫回 `last_status_changed_by_label`

## Expected Outcome

做完後，Infinite Pro 會從：

- 只會收 feedback、建立 candidate、手動治理

往前推成：

- feedback 本身也開始具備更成熟的 precedent lifecycle 作用

但整體仍維持：

- consultant-first
- low-noise
- 非背景自動治理
