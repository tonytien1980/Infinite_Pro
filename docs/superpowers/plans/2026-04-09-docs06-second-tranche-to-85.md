# Docs 06 Second Tranche To 85 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update `docs/06_product_alignment_and_85_point_roadmap.md` so it formally records the first tranche close review and defines the second tranche to 85 inside the same active roadmap, with only minimal supporting sync in `docs/00_product_definition_and_current_state.md`.

**Architecture:** Keep `docs/06` as the single active roadmap SSOT. Add one retrospective section for first-tranche close review, one forward-looking section for second-tranche themes, then update the future-session usage rules so later work hangs off the new tranche framing instead of the old `7.1` to `7.5` labels. Only add the smallest necessary supporting sentence to `docs/00` so it stays aligned without duplicating roadmap content.

**Tech Stack:** Markdown, git, ripgrep, diff verification

---

### Task 1: Add first-tranche close review to `docs/06`

**Files:**
- Modify: `docs/06_product_alignment_and_85_point_roadmap.md`

- [ ] **Step 1: Insert a new `## 10. First Tranche Close Review` section**

Add this section immediately after `## 9. Phase Close Review Framework` and before the current `How Future Sessions Must Use This Doc` section:

```md
## 10. First Tranche Close Review

依第 9 節的 framework，第一 tranche 現在可正式判定為：

- `正式收工`

正式理由是：

- `7.1`
  - 已達 `本階段完成`
- `7.15`
  - 已達 `本階段完成`
- `7.2`
  - 已達本階段批准範圍內的完成點
- `7.3`
  - 已達 `v1 完成`
- `7.4`
  - 已達 `v1 完成`
- `7.5`
  - 已達 `v1 完成`

### 10.1 What first tranche actually completed

第一 tranche 的正式成果應理解為：

- `7.1`
  - `task / matter / deliverable` 的 case-aware governance runtime 已收口
- `7.15`
  - phase-level governance summary 已與 work-surface landed status 對齊
- `7.2`
  - feedback-linked persisted scoring 已從 explicit feedback 推進到 deliverable、outcome、writeback evidence
- `7.3`
  - `generalist_coverage_proof_v1` 已成立
- `7.4`
  - `overview / matter / deliverable workspace` 的 consultant usability v1 已成立
- `7.5`
  - repo-native release-readiness baseline v1 已成立

### 10.2 What first tranche did not claim

第一 tranche 雖已正式收工，但沒有宣告以下事項已全部完成：

- `7.2`
  - KPI / business outcome attribution
- `7.3`
  - coverage density fully matured
- `7.4`
  - `task detail` usability completion
- `7.5`
  - browser smoke automation completion
  - Docker-specific runtime gate completion

### 10.3 Carry-forward backlog

第一 tranche 留給下一輪的 backlog 至少包括：

- KPI / business outcome attribution 是否值得做、如何做才不失真
- coverage thin lanes 補厚
- `task detail` 的 consultant usability
- browser smoke automation 與更穩的 runtime confidence
```

- [ ] **Step 2: Renumber the current downstream sections**

After inserting the new `## 10` section, renumber the later top-level sections in `docs/06_product_alignment_and_85_point_roadmap.md` so they remain sequential.

### Task 2: Add second-tranche framing to `docs/06`

**Files:**
- Modify: `docs/06_product_alignment_and_85_point_roadmap.md`

- [ ] **Step 1: Insert a new `## 11. Second Tranche To 85` section**

Add this section immediately after the new first-tranche close review:

```md
## 11. Second Tranche To 85

第二 tranche 的正式理解是：

- 仍屬於本文件的問題域
- 仍服務於整體成熟度往平均 `85` 分以上推進
- 但不再沿用第一 tranche 的 `7.1` 到 `7.5` 當唯一主分類

正式規則：

- 第二 tranche 仍以 `docs/06_product_alignment_and_85_point_roadmap.md` 為唯一 active roadmap
- 不提早開新的 active top-level doc
- 新工作應優先掛到第二 tranche 的主線，而不是回頭硬掛第一 tranche 的 `7.1` 到 `7.5`

### 11.1 T2-A Coverage density and proof deepen

目標：

- 把 `generalist_coverage_proof_v1` 從 baseline 推進到更有說服力的 proof posture

正式應補：

- `client_stage / client_type / continuity / cross-domain` 的 thin lane 補厚
- representative seed cases 增密
- benchmark / regression 能更誠實回答 coverage depth，而不只是 coverage existence

主要對應：

- B
- C
- D

### 11.2 T2-B Reusable intelligence effectiveness deepen

目標：

- 把 feedback-linked persisted scoring 從 foundation deepen 成更可信的 reusable intelligence effectiveness reading

正式應補：

- KPI / business outcome attribution 是否成立、成立到哪個安全邊界
- reusable asset 的 effectiveness posture 如何更可信
- feedback / deliverable / outcome / writeback 的回寫邏輯如何避免失真

主要對應：

- H
- F

### 11.3 T2-C Consultant operating leverage and task-surface usability

目標：

- 把 usability 從 `overview / matter / deliverable` 延伸到更高槓桿的 consultant operating layer

正式應補：

- `task detail` usability pass
- consultant operating leverage framing
- 同一套工作面如何同時支撐初階不迷路與高階高槓桿

主要對應：

- G
- F

### 11.4 T2-D Runtime and release confidence deepen

目標：

- 把 release-readiness baseline 往更高信心的 runtime / smoke posture 推進

正式應補：

- browser smoke 常態化
- Docker-specific runtime gate
- live runtime verification confidence uplift

主要對應：

- F
```

- [ ] **Step 2: Update the anti-drift rule near the new second-tranche section**

Add a short rule immediately after the `11.4` block:

```md
正式規則：

- 第二 tranche 的提案若無法明顯推進 `T2-A` 到 `T2-D` 其中一條，應先降優先級
- 若某個提案已明顯脫離 `85-point alignment` 的問題域，才考慮另開新的 active top-level roadmap doc
```

### Task 3: Update future-session usage rules in `docs/06`

**Files:**
- Modify: `docs/06_product_alignment_and_85_point_roadmap.md`

- [ ] **Step 1: Replace the old future-session question set**

Change the numbered list under `How Future Sessions Must Use This Doc` from the old first-tranche wording to this:

```md
未來對話若要提案、實作或盤點，必須先回答：

1. 這次工作在 A 到 H 的哪一格
2. 這次工作是在處理：
   - 第一 tranche 的 close review
   - 或第二 tranche 的 `T2-A` 到 `T2-D` 哪一條主線
3. 它會把哪一格從多少分推到多少分
4. 它有沒有讓 system 更接近你要的全面型顧問 operating system，而不是只是更會自我描述
5. 若某提案不再屬於 `85-point alignment` 的問題域，是否已準備好另開新的 active roadmap doc
```

- [ ] **Step 2: Add one anti-drift rule under the existing rule bullets**

Append this rule to the existing `正式規則` bullets in that same section:

```md
- 第一 tranche 已正式收工後，不應再把第二 tranche 的新工作機械地回掛到舊 `7.1` 到 `7.5`
```

### Task 4: Add minimal supporting sync to `docs/00`

**Files:**
- Modify: `docs/00_product_definition_and_current_state.md`

- [ ] **Step 1: Add one sentence to the `Relationship To Other Active Docs` bullet for `docs/06`**

Replace the current `docs/06` relationship bullet with this exact wording:

```md
- `docs/06_product_alignment_and_85_point_roadmap.md`
  承接創辦人產品想像、目前 attainment 對照、85 分補強順序、第一 tranche close review 與第二 tranche active roadmap handoff
```

### Task 5: Verify, commit, and sync

**Files:**
- Modify: `docs/06_product_alignment_and_85_point_roadmap.md`
- Modify: `docs/00_product_definition_and_current_state.md`
- Verify: `docs/superpowers/specs/2026-04-09-docs06-second-tranche-to-85-design.md`
- Verify: `docs/superpowers/plans/2026-04-09-docs06-second-tranche-to-85.md`

- [ ] **Step 1: Run placeholder scans**

Run:

- `rg -n "TBD|TODO|FIXME" docs/superpowers/specs/2026-04-09-docs06-second-tranche-to-85-design.md docs/06_product_alignment_and_85_point_roadmap.md docs/00_product_definition_and_current_state.md`
- `rg -n -P '^(?!.*TBD\\|TODO\\|FIXME).*(TBD|TODO|FIXME)' docs/superpowers/plans/2026-04-09-docs06-second-tranche-to-85.md`

Expected:

- no output from either command

- [ ] **Step 2: Check diff integrity**

Run:

- `git diff --check`

Expected:

- no output

- [ ] **Step 3: Review git state**

Run:

- `git status -sb`

Expected:

- only `docs/06_product_alignment_and_85_point_roadmap.md` and `docs/00_product_definition_and_current_state.md` appear as modified for the implementation work

- [ ] **Step 4: Commit and push**

Run:

```bash
git add docs/06_product_alignment_and_85_point_roadmap.md docs/00_product_definition_and_current_state.md
git commit -m "docs: define docs06 second tranche roadmap"
git push
```

Expected:

- commit succeeds
- remote branch updates
- local and GitHub remain aligned
