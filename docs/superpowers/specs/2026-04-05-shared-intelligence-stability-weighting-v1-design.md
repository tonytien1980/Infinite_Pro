# Shared Intelligence Stability Weighting V1 Design

## Purpose

這一輪不新增新的治理頁，也不做 background lifecycle job。

先補一個更細的 shared-intelligence 判斷層：

- `shared-intelligence stability weighting v1`

也就是在既有 `maturity` 與 `weight_action` 之外，再回答這筆 precedent 現在到底是：

- 已站穩共享模式
- 仍在共享觀察期
- 剛恢復觀察
- 已退到背景

## Scope

第一版只做：

1. 擴充 `shared_intelligence_signal`
2. precedent review / reference 低噪音回讀
3. reusable asset source ordering 吃 stability

不做：

- background freshness job
- memory / playbook / template 自己的 lifecycle engine
- stability dashboard

## Rule

第一波 stability 收斂規則：

- `promoted + shared + upweight` -> `stable`
- `candidate + positive feedback + family 有 dismissed signal` -> `recovering`
- `dismissed` -> `retired`
- 其他 -> `watch`

第一波作用邊界：

- precedent review 排序
- Host-safe precedent reference 排序
- review lens / common risk / playbook / template 這些 reusable assets 的 source ordering

## Expected Outcome

做完後，系統不只知道哪筆 precedent 共享成熟度比較高，也更知道：

- 哪筆比較穩
- 哪筆只是剛恢復
- 哪筆應該先放背景

這樣 Host 在下一案的 reusable intelligence 組裝時，就能更像一個會分辨「資深穩定經驗」與「剛回來觀察的經驗」的顧問大腦。
