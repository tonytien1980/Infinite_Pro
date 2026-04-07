# Phase 6 Feedback-Linked Persisted Scoring v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `Phase 6` 的 persisted completion-review scoring，從 generic snapshot 推進成 explicit feedback-linked snapshot，但第一刀只吃 `AdoptionFeedback` 與 candidate governance evidence，不碰 outcome/writeback scoring。

**Architecture:** backend 先新增一個 `PhaseSixFeedbackLinkedScoringSnapshot` contract，將 explicit adoption / revision / not-adopted / template-candidate 與 candidate governance outcomes 收斂成可追溯的 scoring evidence。接著把這份 snapshot 接進 `build_phase_six_completion_review()` 與 checkpoint persistence；frontend 只在既有 `Generalist Governance` completion-review 區塊補一條 low-noise feedback-linked summary，不新增新 route family 或 score dashboard。最後同步更新 active docs 與 QA evidence。

**Tech Stack:** FastAPI, SQLAlchemy, Pydantic, pytest, Next.js, node test, active docs under `docs/`

---

## File Structure

- Modify: `backend/app/workbench/schemas.py`
  - Add `PhaseSixFeedbackLinkedScoringSnapshotRead`
  - Extend `PhaseSixCompletionReviewResponse`
- Modify: `backend/app/services/workbench.py`
  - Aggregate explicit feedback / candidate governance evidence from DB
  - Persist snapshot into `WorkbenchExtensionState.payload`
- Modify: `backend/app/services/phase_six_generalist_governance.py`
  - Build low-noise feedback-linked snapshot
  - Rewrite `feedback_loop` score dimension to read that snapshot
- Create: `backend/tests/test_phase_six_feedback_scoring.py`
  - Focused backend tests for snapshot + checkpoint persistence
- Modify: `frontend/src/lib/types.ts`
  - Add frontend types for feedback-linked snapshot
- Modify: `frontend/src/lib/api.ts`
  - Parse new completion-review payload fields
- Modify: `frontend/src/lib/phase-six-governance.ts`
  - Add helper for compact feedback-linked summary
- Modify: `frontend/src/components/workbench-home.tsx`
  - Render low-noise feedback-linked summary inside existing completion-review card
- Modify: `frontend/tests/phase-six-governance.test.mjs`
  - Add helper-level summary assertions
- Modify: `docs/01_runtime_architecture_and_data_contracts.md`
  - Update `7.24` / `7.25` contract wording
- Modify: `docs/06_product_alignment_and_85_point_roadmap.md`
  - Mark `7.2` first slice as started, without overclaiming outcome-level scoring
- Modify: `docs/04_qa_matrix.md`
  - Append real verification evidence

---

### Task 1: Add Feedback-Linked Snapshot Contract And Builder

**Files:**
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/app/workbench/schemas.py`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/app/services/phase_six_generalist_governance.py`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/app/services/workbench.py`
- Test: `/Users/oldtien_base/Desktop/Infinite Pro/backend/tests/test_phase_six_feedback_scoring.py`

- [ ] **Step 1: Write the failing backend test**

```python
def test_phase_six_feedback_linked_snapshot_summarizes_explicit_feedback():
    snapshot = build_phase_six_feedback_linked_scoring_snapshot(
        adopted_count=2,
        needs_revision_count=1,
        not_adopted_count=1,
        template_candidate_count=3,
        governed_candidate_count=4,
        promoted_candidate_count=2,
        dismissed_candidate_count=1,
        override_signal_count=2,
        top_asset_codes=["domain_playbook", "review_lens"],
    )

    assert snapshot.adopted_count == 2
    assert snapshot.override_signal_count == 2
    assert snapshot.top_asset_codes == ["domain_playbook", "review_lens"]
    assert "feedback" in snapshot.summary
```

- [ ] **Step 2: Run test to verify it fails**

Run: `PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_phase_six_feedback_scoring.py -q`

Expected: FAIL because `PhaseSixFeedbackLinkedScoringSnapshotRead` / `build_phase_six_feedback_linked_scoring_snapshot()` do not exist yet.

- [ ] **Step 3: Write minimal implementation**

```python
class PhaseSixFeedbackLinkedScoringSnapshotRead(BaseModel):
    adopted_count: int = 0
    needs_revision_count: int = 0
    not_adopted_count: int = 0
    template_candidate_count: int = 0
    governed_candidate_count: int = 0
    promoted_candidate_count: int = 0
    dismissed_candidate_count: int = 0
    override_signal_count: int = 0
    top_asset_codes: list[str] = Field(default_factory=list)
    top_asset_labels: list[str] = Field(default_factory=list)
    summary: str = ""
```

```python
def build_phase_six_feedback_linked_scoring_snapshot(
    *,
    adopted_count: int,
    needs_revision_count: int,
    not_adopted_count: int,
    template_candidate_count: int,
    governed_candidate_count: int,
    promoted_candidate_count: int,
    dismissed_candidate_count: int,
    override_signal_count: int,
    top_asset_codes: list[str],
) -> schemas.PhaseSixFeedbackLinkedScoringSnapshotRead:
    top_asset_labels = [
        OPTIMIZATION_ASSET_LABELS[item]
        for item in top_asset_codes
        if item in OPTIMIZATION_ASSET_LABELS
    ]
    summary = (
        f"已採用 {adopted_count}｜需改寫 {needs_revision_count}｜不採用 {not_adopted_count}"
        f"｜主要影響 {'、'.join(top_asset_labels[:2]) or '既有 reusable assets'}。"
    )
    return schemas.PhaseSixFeedbackLinkedScoringSnapshotRead(
        adopted_count=adopted_count,
        needs_revision_count=needs_revision_count,
        not_adopted_count=not_adopted_count,
        template_candidate_count=template_candidate_count,
        governed_candidate_count=governed_candidate_count,
        promoted_candidate_count=promoted_candidate_count,
        dismissed_candidate_count=dismissed_candidate_count,
        override_signal_count=override_signal_count,
        top_asset_codes=top_asset_codes[:3],
        top_asset_labels=top_asset_labels[:3],
        summary=summary,
    )
```

- [ ] **Step 4: Run test to verify it passes**

Run: `PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_phase_six_feedback_scoring.py -q`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/app/workbench/schemas.py backend/app/services/phase_six_generalist_governance.py backend/app/services/workbench.py backend/tests/test_phase_six_feedback_scoring.py
git commit -m "feat: add phase six feedback scoring snapshot"
```

---

### Task 2: Rewrite Completion Review To Use Feedback-Linked Evidence

**Files:**
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/app/services/phase_six_generalist_governance.py`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/app/services/workbench.py`
- Test: `/Users/oldtien_base/Desktop/Infinite Pro/backend/tests/test_phase_six_feedback_scoring.py`
- Test: `/Users/oldtien_base/Desktop/Infinite Pro/backend/tests/test_mvp_slice.py`

- [ ] **Step 1: Write the failing integration test**

```python
def test_phase_six_completion_review_persists_feedback_linked_snapshot(client: TestClient):
    checkpoint = client.post(
        "/api/v1/workbench/phase-6-completion-review/checkpoint",
        json={"operator_label": "王顧問"},
    )
    assert checkpoint.status_code == 200
    body = checkpoint.json()

    assert body["feedback_linked_summary"]
    assert body["feedback_linked_scoring_snapshot"]["adopted_count"] >= 0
```

- [ ] **Step 2: Run test to verify it fails**

Run:
- `PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_phase_six_feedback_scoring.py -q`
- `PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_mvp_slice.py -q -k "phase_six_completion_review or phase_six_sign_off"`

Expected: FAIL because completion-review payload does not expose feedback-linked fields yet.

- [ ] **Step 3: Write minimal implementation**

```python
feedback_snapshot = build_phase_six_feedback_linked_scoring_snapshot(...)
feedback_loop_score = (
    84 if feedback_snapshot.adopted_count + feedback_snapshot.template_candidate_count >= 4
    and feedback_snapshot.override_signal_count <= 1
    else 68 if feedback_snapshot.adopted_count + feedback_snapshot.template_candidate_count > 0
    else 42
)
```

```python
row.payload = {
    "checkpointed": True,
    "checkpointed_at": models.utc_now().isoformat(),
    "checkpointed_by_label": operator_label,
    "overall_score": current.overall_score,
    "scorecard_items": [item.model_dump() for item in current.scorecard_items],
    "review_posture": current.review_posture,
    "closure_posture": current.closure_posture,
    "feedback_linked_summary": current.feedback_linked_summary,
    "feedback_linked_scoring_snapshot": current.feedback_linked_scoring_snapshot.model_dump(),
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:
- `PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_phase_six_feedback_scoring.py -q`
- `PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_mvp_slice.py -q -k "phase_six_completion_review or phase_six_sign_off"`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/app/services/phase_six_generalist_governance.py backend/app/services/workbench.py backend/tests/test_phase_six_feedback_scoring.py backend/tests/test_mvp_slice.py
git commit -m "feat: link phase six scoring to feedback evidence"
```

---

### Task 3: Add Low-Noise Frontend Readout

**Files:**
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/lib/types.ts`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/lib/api.ts`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/lib/phase-six-governance.ts`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/components/workbench-home.tsx`
- Test: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/tests/phase-six-governance.test.mjs`

- [ ] **Step 1: Write the failing frontend helper test**

```javascript
test("phase 6 feedback-linked scoring summary stays low-noise and readable", () => {
  assert.equal(
    summarizePhaseSixFeedbackLinkedScoring({
      feedbackLinkedSummary:
        "已採用 2｜需改寫 1｜不採用 1｜主要影響工作主線、審閱視角。",
      feedbackLinkedScoringSnapshot: {
        adoptedCount: 2,
        needsRevisionCount: 1,
        notAdoptedCount: 1,
        templateCandidateCount: 3,
        governedCandidateCount: 4,
        promotedCandidateCount: 2,
        dismissedCandidateCount: 1,
        overrideSignalCount: 2,
        topAssetCodes: ["domain_playbook", "review_lens"],
        topAssetLabels: ["工作主線", "審閱視角"],
        summary: "summary",
      },
    }),
    "已採用 2｜需改寫 1｜不採用 1｜主要影響工作主線、審閱視角。",
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && node --test tests/phase-six-governance.test.mjs`

Expected: FAIL because `summarizePhaseSixFeedbackLinkedScoring()` and new fields do not exist yet.

- [ ] **Step 3: Write minimal implementation**

```typescript
export interface PhaseSixFeedbackLinkedScoringSnapshot {
  adoptedCount: number;
  needsRevisionCount: number;
  notAdoptedCount: number;
  templateCandidateCount: number;
  governedCandidateCount: number;
  promotedCandidateCount: number;
  dismissedCandidateCount: number;
  overrideSignalCount: number;
  topAssetCodes: string[];
  topAssetLabels: string[];
  summary: string;
}
```

```typescript
export function summarizePhaseSixFeedbackLinkedScoring(
  review: Pick<PhaseSixCompletionReview, "feedbackLinkedSummary">,
) {
  return review.feedbackLinkedSummary || "目前還沒有可讀取的 feedback-linked scoring。";
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && node --test tests/phase-six-governance.test.mjs tests/intake-progress.test.mjs`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/types.ts frontend/src/lib/api.ts frontend/src/lib/phase-six-governance.ts frontend/src/components/workbench-home.tsx frontend/tests/phase-six-governance.test.mjs
git commit -m "feat: show phase six feedback-linked scoring"
```

---

### Task 4: Sync Active Docs And Verification Evidence

**Files:**
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/01_runtime_architecture_and_data_contracts.md`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/06_product_alignment_and_85_point_roadmap.md`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/04_qa_matrix.md`

- [ ] **Step 1: Update runtime contract doc**

```md
- `completion review` 現在也正式補上：
  - `feedback_linked_summary`
  - `feedback_linked_scoring_snapshot`
- 第一版 feedback-linked persisted scoring 只吃：
  - explicit `AdoptionFeedback`
  - `PrecedentCandidate` governance outcomes
```

- [ ] **Step 2: Update roadmap alignment doc**

```md
- `7.2 feedback-linked persisted scoring` 已進入第一刀：
  - completion review / checkpoint 現在開始正式保存 explicit feedback-linked evidence snapshot
  - 但仍未把 deliverable / outcome writeback evidence 全量接入
```

- [ ] **Step 3: Run full verification**

Run:
- `PYTHONPATH=backend .venv312/bin/python -m compileall backend/app`
- `PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_phase_six_feedback_scoring.py -q`
- `PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_mvp_slice.py -q`
- `cd frontend && node --test tests/phase-six-governance.test.mjs tests/intake-progress.test.mjs`

Expected:
- backend compile PASS
- new backend tests PASS
- existing backend regression PASS
- frontend targeted tests PASS

- [ ] **Step 4: Append QA matrix**

```md
## Entry: 2026-04-08 phase-6 feedback-linked persisted scoring v1
```

- [ ] **Step 5: Commit**

```bash
git add docs/01_runtime_architecture_and_data_contracts.md docs/06_product_alignment_and_85_point_roadmap.md docs/04_qa_matrix.md
git commit -m "docs: align phase six feedback scoring"
```

---

### Self-Review

- [ ] Spec coverage: plan stays inside `docs/06` `7.2` first slice and does not include outcome/writeback scoring
- [ ] Placeholder scan: no `TODO`, `TBD`, or vague “handle edge cases”
- [ ] Type consistency: `feedback_linked_summary` and `feedback_linked_scoring_snapshot` names must match backend schemas, API parser, frontend types, and tests
