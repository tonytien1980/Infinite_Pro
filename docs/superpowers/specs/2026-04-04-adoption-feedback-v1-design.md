# Adoption Feedback V1 Design

## Purpose

這一輪要把「聊天式的輕互動 + 顧問系統的正式治理」做成第一個正式可用版本。

重點不是把 Infinite Pro 做成聊天產品，而是讓顧問在正式工作物件上，能用極低負擔的方式留下更乾淨的人類採納訊號，讓後續 precedent / reusable intelligence 不只知道「有沒有採用」，也更知道「為什麼」。

## Problem

目前 adoption feedback 已有最小 foundation：

- `adopted`
- `needs_revision`
- `not_adopted`
- `template_candidate`

但它目前只記 `status + free-text note`。

這有三個問題：

1. status 太粗  
   系統知道你按了什麼，但不知道你為什麼這樣按。
2. free-text note 太重  
   顧問現場不一定願意每次都補一句，所以實際資料會很稀疏。
3. precedent 後續治理訊號仍偏弱  
   候選池現在知道哪些內容被採納，但不夠知道這些內容是因為結構好、判斷穩、可直接交付，還是只是勉強可用。

## UX Goal

這一輪要守住以下原則：

- 第一拍仍然是 one-click feedback
- 不要求使用者先填表單才能完成回饋
- 後續補充訊號要像 quick reply，而不是後台表單
- 主線工作面不能變成治理面板

## Approaches Considered

### A. 維持 status-only

優點：

- 最輕

缺點：

- 訊號太弱
- 後面 precedent / Host 很難用

### B. status + quick-reply reason chips + optional short note

優點：

- 第一拍仍然很輕
- 第二拍開始有結構化原因
- 仍然保留一句補充的空間
- 最符合「聊天式輕互動 + 正式治理」

缺點：

- 需要多一層 UI / schema / write path

### C. 多維評分表

優點：

- 訊號最完整

缺點：

- 太重
- 顧問現場不會想填
- UI/UX 違反這個產品的克制原則

## Chosen Approach

選擇 **B**。

## V1 Scope

### 1. 保留現有四個 status

- `adopted`
- `needs_revision`
- `not_adopted`
- `template_candidate`

第一拍互動維持不變：按一下就可完成正式 status 回饋。

### 2. 新增 quick-reply primary reason

當某個 `Deliverable` 或 `Recommendation` 已有 feedback status 後，UI 才露出第二拍：

- `補一個主要原因`

這層用 status-sensitive quick-reply chips 呈現。

正式規則：

- V1 只收一個 primary reason
- data model 仍使用 `reason_codes: list[str]`，但 V1 UI 只允許 0 或 1 個
- 這樣後續若要升級成多理由，不需再改 schema

### 3. 保留 optional short note

若顧問還想補一句，才展開一個小型 note input：

- 預設收合
- 不擋主線
- 不要求必填

## Reason Design

V1 不做自由定義 reason taxonomy，而是只提供少量、穩定、顧問可快速理解的 quick reasons。

### Deliverable reasons

#### `adopted`

- `ready_to_send`
- `judgment_clear`
- `structure_clear`
- `fits_this_case`

#### `needs_revision`

- `needs_more_evidence`
- `needs_tighter_logic`
- `needs_clearer_structure`
- `needs_scope_adjustment`

#### `not_adopted`

- `too_generic`
- `misread_context`
- `too_risky`
- `not_actionable`

#### `template_candidate`

- `reusable_structure`
- `reusable_reasoning`
- `reusable_risk_scan`
- `reusable_deliverable_shape`

### Recommendation reasons

#### `adopted`

- `actionable_now`
- `priority_is_right`
- `fits_constraints`
- `ready_to_assign`

#### `needs_revision`

- `needs_more_support`
- `needs_owner_clarity`
- `needs_scope_clarity`
- `needs_sequence_adjustment`

#### `not_adopted`

- `not_fit_for_case`
- `too_abstract`
- `timing_not_right`
- `risk_too_high`

#### `template_candidate`

- `reusable_action_pattern`
- `reusable_priority_judgment`
- `reusable_constraint_handling`
- `reusable_client_framing`

## Data Contract Changes

`AdoptionFeedback` 正式新增：

- `reason_codes: list[str]`

V1 規則：

- 可為空
- 若非空，V1 最多 1 個
- note 仍保留

read contract / request contract 都應同步更新。

## Write Path Rules

### First tap

點 status button 時：

- 立即儲存 `feedback_status`
- 不要求先選 reason
- 若原本已有 reason / note，先保留，除非新 status 與舊 status 不同

### Status changed

若使用者換了另一個 status：

- `reason_codes` 應清空
- note 保留或清空都可，但 V1 建議保留 note，避免使用者已輸入的上下文遺失

### Reason tap

點 quick-reply chip 時：

- 以同一筆 feedback record 更新 `reason_codes`
- V1 僅保留 1 個 reason

## Governance Impact

這一輪先不改 precedent candidate 的升格規則，但可做兩個小改善：

1. `reusable_reason` fallback  
   若 note 為空，但有 reason code，則 candidate 的 fallback reusable reason 應優先用 reason label。
2. review surface 顯示更完整  
   adoption feedback 區塊可低噪音讀出目前 primary reason。

## UI Rules

- 不新增頁面
- 不新增 dashboard
- reason chips 只出現在已有 feedback status 的卡片內
- note input 預設收合
- 這層只應出現在既有：
  - `deliverable adoption feedback`
  - `recommendation adoption feedback`

## Expected Outcome

做完後，顧問仍然可以一拍完成回饋；
但如果願意多補半拍，系統就能知道：

- 這次為什麼被採用 / 不採用 / 值得保留
- 哪種 pattern 是因為結構穩、哪種是因為判斷穩、哪種是因為可直接落地

這會讓後面的 precedent / reusable intelligence 有更可靠的人類訊號地基。

