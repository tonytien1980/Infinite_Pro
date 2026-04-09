# T2-B Effectiveness Reading Baseline V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `T2-B` 的第一刀落成 `effectiveness reading baseline`：在不改六層架構、也不引入 KPI attribution 的前提下，讓 `Phase 6 feedback-linked persisted scoring` 能更可信地回報 reusable intelligence 到底只是 early signal、已被 adoption 支撐、已被 closeout 支撐，還是已被 writeback 支撐。

**Architecture:** 沿用既有 `PhaseSixFeedbackLinkedScoringSnapshotRead`、`build_phase_six_feedback_linked_scoring_snapshot(...)`、`build_phase_six_completion_review(...)` 與首頁 `Generalist Governance` completion-review card，不新增新的 snapshot family、analytics page、或 dashboard family。backend 只補 posture fields 與 low-noise summary；frontend 只把新 posture readout 接進既有 helper / homepage；active docs 與 QA evidence 只在真實驗證完成後同步更新。

**Tech Stack:** FastAPI, SQLAlchemy, Pydantic, pytest, Next.js, node:test, active docs under `docs/`

---

## File Structure

- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/app/workbench/schemas.py`
  - Extend `PhaseSixFeedbackLinkedScoringSnapshotRead` with effectiveness posture fields
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/app/services/phase_six_generalist_governance.py`
  - Derive `evidence_thin / adoption_supported / closeout_supported / writeback_supported`
  - Keep scoring conservative; deepen wording, not attribution scope
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/tests/test_phase_six_feedback_scoring.py`
  - Add targeted unit + integration assertions for effectiveness posture
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/lib/types.ts`
  - Extend `PhaseSixFeedbackLinkedScoringSnapshot`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/lib/api.ts`
  - Parse new posture fields from the backend payload
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/lib/phase-six-governance.ts`
  - Add helper for low-noise effectiveness reading
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/components/workbench-home.tsx`
  - Render effectiveness reading inside the existing completion-review card
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/tests/phase-six-governance.test.mjs`
  - Add helper-level assertions for the new readout
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/01_runtime_architecture_and_data_contracts.md`
  - Extend sections `7.24` and `7.25` to describe the new effectiveness reading contract honestly
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/06_product_alignment_and_85_point_roadmap.md`
  - Mark `T2-B slice 1` as landed without overclaiming KPI attribution
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/04_qa_matrix.md`
  - Append real verification evidence after backend/frontend verification passes

---

### Task 1: Extend The Backend Snapshot With Effectiveness Posture

**Files:**
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/app/workbench/schemas.py`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/app/services/phase_six_generalist_governance.py`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/tests/test_phase_six_feedback_scoring.py`

- [ ] **Step 1: Write the failing backend posture test**

```python
def test_phase_six_feedback_snapshot_reads_effectiveness_posture() -> None:
    snapshot = build_phase_six_feedback_linked_scoring_snapshot(
        adopted_count=2,
        needs_revision_count=1,
        not_adopted_count=0,
        template_candidate_count=1,
        governed_candidate_count=2,
        promoted_candidate_count=1,
        dismissed_candidate_count=0,
        override_signal_count=1,
        top_asset_codes=["domain_playbook", "review_lens"],
        deliverable_feedback_count=2,
        deliverable_adopted_count=1,
        published_deliverable_count=1,
        published_adopted_count=1,
        deliverable_candidate_count=1,
        governed_deliverable_candidate_count=1,
        outcome_record_count=1,
        writeback_generated_event_count=2,
        review_required_execution_count=1,
        planned_execution_count=1,
        writeback_expected_task_count=1,
    )

    assert snapshot.effectiveness_posture == "writeback_supported"
    assert snapshot.effectiveness_posture_label == "已到 writeback 支撐"
    assert "工作主線" in snapshot.effectiveness_posture_summary
    assert snapshot.effectiveness_caveat_summary
```

- [ ] **Step 2: Run the targeted backend test to verify RED**

Run:

```bash
PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_phase_six_feedback_scoring.py -q
```

Expected:

- FAIL because `PhaseSixFeedbackLinkedScoringSnapshotRead` does not expose the effectiveness posture fields yet

- [ ] **Step 3: Extend the snapshot schema**

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
    deliverable_feedback_count: int = 0
    deliverable_adopted_count: int = 0
    published_deliverable_count: int = 0
    published_adopted_count: int = 0
    deliverable_candidate_count: int = 0
    governed_deliverable_candidate_count: int = 0
    closeout_depth_summary: str = ""
    outcome_record_count: int = 0
    deliverable_outcome_record_count: int = 0
    follow_up_outcome_count: int = 0
    writeback_generated_event_count: int = 0
    review_required_execution_count: int = 0
    planned_execution_count: int = 0
    writeback_expected_task_count: int = 0
    writeback_depth_summary: str = ""
    effectiveness_posture: Literal[
        "evidence_thin",
        "adoption_supported",
        "closeout_supported",
        "writeback_supported",
    ] = "evidence_thin"
    effectiveness_posture_label: str = ""
    effectiveness_posture_summary: str = ""
    effectiveness_caveat_summary: str = ""
    summary: str = ""
```

- [ ] **Step 4: Derive the posture in `build_phase_six_feedback_linked_scoring_snapshot(...)`**

```python
    positive_feedback_count = adopted_count + template_candidate_count + promoted_candidate_count
    has_strong_deliverable_closeout_depth = (
        deliverable_adopted_count > 0 and published_adopted_count > 0
    )
    has_deliverable_closeout_depth = (
        deliverable_feedback_count > 0 or governed_deliverable_candidate_count > 0
    )
    has_writeback_depth = (
        writeback_expected_task_count > 0
        and (
            outcome_record_count > 0
            or writeback_generated_event_count > 0
            or review_required_execution_count > 0
        )
    )

    if has_writeback_depth:
        effectiveness_posture = "writeback_supported"
        effectiveness_posture_label = "已到 writeback 支撐"
    elif has_strong_deliverable_closeout_depth or has_deliverable_closeout_depth:
        effectiveness_posture = "closeout_supported"
        effectiveness_posture_label = "已到 closeout 支撐"
    elif positive_feedback_count > 0 or governed_candidate_count > 0:
        effectiveness_posture = "adoption_supported"
        effectiveness_posture_label = "已有 adoption 支撐"
    else:
        effectiveness_posture = "evidence_thin"
        effectiveness_posture_label = "證據仍薄"

    effectiveness_posture_summary = (
        f"{effectiveness_posture_label}｜主要看 {'、'.join(top_asset_labels[:2]) or '既有 reusable assets'}。"
    )
    effectiveness_caveat_summary = (
        "目前多為 one-off / minimal 案件，沒有 writeback 不算負訊號。"
        if writeback_expected_task_count == 0
        else "已有 full writeback expectation，若後續沒有 outcome / writeback evidence，就不要過度解讀 effectiveness。"
    )
```

and return those fields in the existing `PhaseSixFeedbackLinkedScoringSnapshotRead(...)` constructor.

- [ ] **Step 5: Re-run the targeted backend test to verify GREEN**

Run:

```bash
PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_phase_six_feedback_scoring.py -q
```

Expected:

- PASS

- [ ] **Step 6: Commit the backend posture slice**

```bash
git add backend/app/workbench/schemas.py \
  backend/app/services/phase_six_generalist_governance.py \
  backend/tests/test_phase_six_feedback_scoring.py
git commit -m "feat: add t2b effectiveness posture snapshot"
```

Expected:

- commit succeeds with schema + backend builder + targeted backend test changes

---

### Task 2: Deepen Completion Review Readout Without Turning It Into Attribution

**Files:**
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/app/services/phase_six_generalist_governance.py`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/tests/test_phase_six_feedback_scoring.py`

- [ ] **Step 1: Extend the existing completion-review integration test first**

Add these assertions inside `test_phase_six_completion_review_persists_feedback_linked_snapshot(...)` after `snapshot = review_payload["feedback_linked_scoring_snapshot"]`:

```python
    assert snapshot["effectiveness_posture"] == "adoption_supported"
    assert snapshot["effectiveness_posture_label"] == "已有 adoption 支撐"
    assert snapshot["effectiveness_posture_summary"]
    assert snapshot["effectiveness_caveat_summary"]
    assert "已有 adoption 支撐" in review_payload["feedback_linked_summary"]
```

and after `checkpoint_payload = checkpoint.json()` add:

```python
    assert (
        checkpoint_payload["feedback_linked_scoring_snapshot"]["effectiveness_posture"]
        == review_payload["feedback_linked_scoring_snapshot"]["effectiveness_posture"]
    )
```

- [ ] **Step 2: Run the targeted backend test to verify RED**

Run:

```bash
PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_phase_six_feedback_scoring.py -q
```

Expected:

- FAIL because `build_phase_six_completion_review(...)` does not yet fold the new posture wording into `feedback_linked_summary`

- [ ] **Step 3: Update `build_phase_six_completion_review(...)` to read the new posture conservatively**

Keep the numeric score logic as-is, but deepen the wording:

```python
        schemas.PhaseSixCompletionScorecardItemRead(
            dimension_code="feedback_loop",
            dimension_label="feedback loop",
            score=feedback_loop_score,
            status_label="已開始形成" if feedback_loop_score >= 60 else "仍需加深",
            summary=(
                f"{computed_feedback_snapshot.summary}"
                f"｜{computed_feedback_snapshot.closeout_depth_summary}"
                f"｜{computed_feedback_snapshot.writeback_depth_summary}"
                f"｜{computed_feedback_snapshot.effectiveness_posture_summary}"
                f"｜{computed_feedback_snapshot.effectiveness_caveat_summary}"
            ),
        ),
```

and replace the computed summary with:

```python
    feedback_linked_summary = (
        str(checkpoint_state.get("feedback_linked_summary", "")).strip()
        if checkpoint_state and checkpoint_state.get("feedback_linked_summary")
        else (
            f"{effective_feedback_snapshot.summary}"
            f"｜{effective_feedback_snapshot.closeout_depth_summary}"
            f"｜{effective_feedback_snapshot.writeback_depth_summary}"
            f"｜{effective_feedback_snapshot.effectiveness_posture_summary}"
        )
    )
```

Do **not** add any KPI / ROI wording here.

- [ ] **Step 4: Re-run the targeted backend test to verify GREEN**

Run:

```bash
PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_phase_six_feedback_scoring.py -q
```

Expected:

- PASS

- [ ] **Step 5: Commit the completion-review readout slice**

```bash
git add backend/app/services/phase_six_generalist_governance.py \
  backend/tests/test_phase_six_feedback_scoring.py
git commit -m "feat: deepen t2b completion review reading"
```

Expected:

- commit succeeds with completion-review wording + targeted backend test updates

---

### Task 3: Add The Low-Noise Frontend Effectiveness Readout

**Files:**
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/lib/types.ts`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/lib/api.ts`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/lib/phase-six-governance.ts`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/components/workbench-home.tsx`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/tests/phase-six-governance.test.mjs`

- [ ] **Step 1: Add the failing frontend helper test**

Add this test to `frontend/tests/phase-six-governance.test.mjs`:

```javascript
test("phase 6 effectiveness reading helper stays low-noise and readable", () => {
  assert.equal(
    summarizePhaseSixEffectivenessReading({
      feedbackLinkedScoringSnapshot: {
        adoptedCount: 2,
        needsRevisionCount: 1,
        notAdoptedCount: 0,
        templateCandidateCount: 1,
        governedCandidateCount: 2,
        promotedCandidateCount: 1,
        dismissedCandidateCount: 0,
        overrideSignalCount: 1,
        topAssetCodes: ["domain_playbook"],
        topAssetLabels: ["工作主線"],
        deliverableFeedbackCount: 2,
        deliverableAdoptedCount: 1,
        publishedDeliverableCount: 1,
        publishedAdoptedCount: 1,
        deliverableCandidateCount: 1,
        governedDeliverableCandidateCount: 1,
        closeoutDepthSummary: "交付回饋 2｜已 publish 1｜deliverable governed 1",
        outcomeRecordCount: 1,
        deliverableOutcomeRecordCount: 1,
        followUpOutcomeCount: 1,
        writebackGeneratedEventCount: 2,
        reviewRequiredExecutionCount: 1,
        plannedExecutionCount: 1,
        writebackExpectedTaskCount: 1,
        writebackDepthSummary: "outcome 1｜writeback events 2｜review-required executions 1",
        effectivenessPosture: "writeback_supported",
        effectivenessPostureLabel: "已到 writeback 支撐",
        effectivenessPostureSummary: "已到 writeback 支撐｜主要看工作主線。",
        effectivenessCaveatSummary:
          "已有 full writeback expectation，若後續沒有 outcome / writeback evidence，就不要過度解讀 effectiveness。",
        summary: "summary",
      },
    }),
    "已到 writeback 支撐｜主要看工作主線。",
  );
});
```

- [ ] **Step 2: Run the targeted frontend test to verify RED**

Run:

```bash
cd frontend && node --test tests/phase-six-governance.test.mjs
```

Expected:

- FAIL because `summarizePhaseSixEffectivenessReading(...)` does not exist yet

- [ ] **Step 3: Extend frontend types and API parsing**

Add these fields to `PhaseSixFeedbackLinkedScoringSnapshot` in `frontend/src/lib/types.ts`:

```ts
  effectivenessPosture:
    | "evidence_thin"
    | "adoption_supported"
    | "closeout_supported"
    | "writeback_supported";
  effectivenessPostureLabel: string;
  effectivenessPostureSummary: string;
  effectivenessCaveatSummary: string;
```

Then map them in `frontend/src/lib/api.ts`:

```ts
      effectivenessPosture:
        payload.feedback_linked_scoring_snapshot?.effectiveness_posture || "evidence_thin",
      effectivenessPostureLabel:
        payload.feedback_linked_scoring_snapshot?.effectiveness_posture_label || "",
      effectivenessPostureSummary:
        payload.feedback_linked_scoring_snapshot?.effectiveness_posture_summary || "",
      effectivenessCaveatSummary:
        payload.feedback_linked_scoring_snapshot?.effectiveness_caveat_summary || "",
```

- [ ] **Step 4: Add the helper and render it in the homepage card**

In `frontend/src/lib/phase-six-governance.ts` add:

```ts
export function summarizePhaseSixEffectivenessReading(
  review: Pick<
    {
      feedbackLinkedScoringSnapshot: {
        effectivenessPostureSummary: string;
      };
    },
    "feedbackLinkedScoringSnapshot"
  >,
) {
  return (
    review.feedbackLinkedScoringSnapshot.effectivenessPostureSummary ||
    "目前還沒有可讀取的 effectiveness reading。"
  );
}
```

and in `frontend/src/components/workbench-home.tsx` render it inside the existing completion-review card, immediately after the writeback-depth paragraph:

```tsx
                      <p className="muted-text" style={{ marginTop: "8px" }}>
                        {summarizePhaseSixEffectivenessReading(
                          phaseSixCompletionReview,
                        )}
                      </p>
```

- [ ] **Step 5: Re-run the targeted frontend test to verify GREEN**

Run:

```bash
cd frontend && node --test tests/phase-six-governance.test.mjs
```

Expected:

- PASS

- [ ] **Step 6: Commit the frontend readout slice**

```bash
git add frontend/src/lib/types.ts \
  frontend/src/lib/api.ts \
  frontend/src/lib/phase-six-governance.ts \
  frontend/src/components/workbench-home.tsx \
  frontend/tests/phase-six-governance.test.mjs
git commit -m "feat: add t2b effectiveness readout"
```

Expected:

- commit succeeds with frontend type/api/helper/home/test updates

---

### Task 4: Sync Active Docs And Run Final Verification

**Files:**
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/01_runtime_architecture_and_data_contracts.md`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/06_product_alignment_and_85_point_roadmap.md`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/04_qa_matrix.md`

- [ ] **Step 1: Update `docs/01` to describe the new contract honestly**

In sections `7.24` / `7.25`, extend the snapshot bullet list with:

```md
- `effectiveness_posture`
- `effectiveness_posture_label`
- `effectiveness_posture_summary`
- `effectiveness_caveat_summary`
```

and add wording like:

```md
- 這一刀現在正式把 feedback-linked persisted scoring 從「有 evidence」補到「可回讀 effectiveness posture」
- 第一版 effectiveness posture 只允許保守區分：
  - `evidence_thin`
  - `adoption_supported`
  - `closeout_supported`
  - `writeback_supported`
- 這一刀仍不等於：
  - KPI attribution
  - ROI scoring
  - business outcome dashboard
```

- [ ] **Step 2: Update `docs/06` to mark `T2-B slice 1` as landed**

Append a progress note under `11.2 T2-B Reusable intelligence effectiveness deepen`:

```md
- 第一刀已正式落地成 `effectiveness reading baseline v1`
- `Phase 6 feedback-linked persisted scoring` 現在不只回報 feedback / closeout / writeback counts，也開始正式回讀 reusable intelligence 的 effectiveness posture
- 第一版 posture 目前只保守區分 `evidence_thin / adoption_supported / closeout_supported / writeback_supported`
- 這一刀仍未進入 KPI / business outcome attribution
```

- [ ] **Step 3: Append a QA entry in `docs/04` after real verification**

Add a new entry like:

```md
## Entry: 2026-04-10 T2-B effectiveness reading baseline v1

Scope:
- deepen `T2-B` by turning existing feedback / closeout / writeback evidence into a reusable-intelligence effectiveness reading
- keep the same completion-review surface instead of creating a new analytics family
- keep KPI / business outcome attribution explicitly out of scope
```

and capture the real command outputs in its verification tables.

- [ ] **Step 4: Run final backend and frontend verification**

Run:

```bash
PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_phase_six_feedback_scoring.py -q
PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_mvp_slice.py -q
cd frontend && node --test tests/phase-six-governance.test.mjs tests/intake-progress.test.mjs
cd frontend && npm run build
cd frontend && npm run typecheck
```

Expected:

- backend targeted tests pass
- backend regression still passes
- frontend node tests pass
- frontend build passes
- frontend typecheck passes

- [ ] **Step 5: Run final hygiene checks**

Run:

```bash
python3 - <<'PY'
from pathlib import Path
paths = [
    Path("docs/01_runtime_architecture_and_data_contracts.md"),
    Path("docs/04_qa_matrix.md"),
    Path("docs/06_product_alignment_and_85_point_roadmap.md"),
]
for path in paths:
    for lineno, line in enumerate(path.read_text().splitlines(), start=1):
        if any(token in line for token in ("TODO", "TBD", "FIXME")):
            if path.name == "04_qa_matrix.md" and "conversation-only TODO" in line:
                continue
            print(f"{path}:{lineno}:{line}")
PY
git diff --check
```

Expected:

- no new placeholders
- no whitespace / patch-formatting issues

- [ ] **Step 6: Commit docs and verification alignment**

```bash
git add docs/01_runtime_architecture_and_data_contracts.md \
  docs/04_qa_matrix.md \
  docs/06_product_alignment_and_85_point_roadmap.md
git commit -m "docs: align t2b effectiveness reading baseline"
```

Expected:

- commit succeeds with active docs aligned to shipped behavior and verification evidence
