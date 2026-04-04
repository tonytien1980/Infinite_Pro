# Team-Attributed Reusable Intelligence Governance V1 Design

## Purpose

這一輪不做真正的 multi-user auth，也不做 RBAC。

先補一個很小但很關鍵的 shared-intelligence 地基：

- 系統開始知道
  - 這筆 feedback 是誰標記的
  - 這個 precedent candidate 是誰留下來的
  - 最近一次升格 / 停用是誰做的

## Why This Slice

目前 precedent / reusable intelligence 已經知道：

- 哪些內容被採用
- 為什麼被採用
- 最適合幫哪種 reusable asset

但還不知道：

- 這個判斷是誰做的

如果未來要長成 4 到 5 人顧問團隊共用的 intelligence system，這層一定要先有。

## Scope

第一版只做：

1. browser-local operator identity
2. adoption feedback attribution
3. precedent candidate governance attribution
4. low-noise UI readback

不做：

- 真正帳號系統
- login / session auth
- team directory
- reviewer hierarchy
- trust weighting engine

## Core Rule

這層必須同時滿足兩件事：

- **單人使用不變重**
- **團隊共用 intelligence 開始有 attribution**

所以第一版做法是：

- 在 settings 先放一個 `本機顧問署名`
- 只保存在目前瀏覽器
- 送出 feedback / precedent governance 時，再把這個署名一起帶進 request

## Contract Separation

正式分工：

- `operator_label`
  - 回答：這次動作是誰做的
- `reason_codes`
  - 回答：為什麼這次採用 / 不採用 / 值得保留
- `optimization_signal`
  - 回答：這筆 precedent 最適合幫哪種 reusable asset

也就是：

- attribution != reason
- attribution != quality score
- attribution != auth

## Data Shape

第一版正式新增：

### Adoption feedback

- `operator_label`

### Precedent candidate

- `source_feedback_operator_label`
- `created_by_label`
- `last_status_changed_by_label`

## Source of Identity

第一版不從 backend workbench preferences 取 operator identity。

理由：

- 目前 backend preferences 仍偏 single-profile
- 直接把 operator identity 寫成正式後端偏好，容易和未來 team model 混淆

所以第一版規則是：

- operator identity 只作為 browser-local action metadata
- backend 只保存 action attribution 結果

## UI Rules

### Settings

只新增一個低噪音小區塊：

- `本機顧問署名`

並明講：

- 只保存在目前瀏覽器
- 用於回寫採納 / 治理 attribution
- 不等於正式帳號系統

### Deliverable / Recommendation

adoption feedback 區塊可低噪音補：

- `由 XXX 標記`

precedent candidate 區塊可低噪音補：

- `採納：XXX`
- `最近治理：YYY`

### History / precedent review

precedent review lane 可低噪音補：

- `採納：XXX`
- `最近治理：YYY`

但不可變成：

- 人員表格
- 權限矩陣
- 管理後台

## Expected Outcome

做完後，Infinite Pro 會開始正式知道：

- 某個可重用模式是誰留的
- 最近一次治理動作是誰做的

這讓後面要長成：

- team-attributed governance v2
- feedback -> optimization loop v2
- cross-matter shared intelligence

時，有乾淨且不破壞單人工作流的第一層基礎。
