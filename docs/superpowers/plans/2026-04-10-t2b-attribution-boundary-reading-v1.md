# T2-B Attribution Boundary Reading V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `T2-B` 第三刀落成 `attribution boundary reading`：在不改六層架構、也不引入 KPI / ROI scoring 的前提下，讓 `Phase 6 feedback-linked persisted scoring` 能更誠實地回答目前最多只能 claim 到哪個 attribution 邊界。

**Architecture:** 沿用既有 `PhaseSixFeedbackLinkedScoringSnapshotRead`、`build_phase_six_feedback_linked_scoring_snapshot(...)`、`build_phase_six_completion_review(...)` 與首頁 `Generalist Governance` completion-review card，不新增新的 snapshot family、analytics page、或工作面滲透。backend 只補 attribution boundary code/label/summary；frontend 只把新 readout 接進既有 helper / homepage；active docs 與 QA evidence 只在真實驗證完成後同步更新。

**Tech Stack:** FastAPI, SQLAlchemy, Pydantic, pytest, Next.js, node:test, active docs under `docs/`

---

## File Structure

- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/app/workbench/schemas.py`
  - Extend `PhaseSixFeedbackLinkedScoringSnapshotRead` with attribution-boundary fields
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/app/services/phase_six_generalist_governance.py`
  - Derive `not_claimable / outcome_adjacent / cautious_attribution_candidate`
  - Keep existing posture, composition, and score math intact
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/tests/test_phase_six_feedback_scoring.py`
  - Add targeted unit + integration assertions for attribution-boundary reading
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/lib/types.ts`
  - Extend `PhaseSixFeedbackLinkedScoringSnapshot`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/lib/api.ts`
  - Parse new boundary fields from the backend payload
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/lib/phase-six-governance.ts`
  - Add helper for low-noise attribution-boundary summary
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/components/workbench-home.tsx`
  - Render attribution-boundary summary inside the existing completion-review card
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/tests/phase-six-governance.test.mjs`
  - Add helper-level assertions for the new boundary readout
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/01_runtime_architecture_and_data_contracts.md`
  - Extend `7.24` / `7.25` to describe attribution-boundary reading honestly
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/06_product_alignment_and_85_point_roadmap.md`
  - Mark `T2-B slice 3` as landed without overclaiming KPI attribution
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/04_qa_matrix.md`
  - Append real verification evidence after backend/frontend verification passes

---

### Task 1: Extend The Backend Snapshot With Attribution Boundary Fields

**Files:**
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/app/workbench/schemas.py`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/app/services/phase_six_generalist_governance.py`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/tests/test_phase_six_feedback_scoring.py`

- [ ] **Step 1: Write the failing backend boundary test**

Add this unit test to `backend/tests/test_phase_six_feedback_scoring.py`:

```python
def test_phase_six_feedback_snapshot_reads_attribution_boundary() -> None:
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

    assert snapshot.attribution_boundary == "cautious_attribution_candidate"
    assert snapshot.attribution_boundary_label == "可保守視為 attribution 候選"
    assert "目前仍不是正式 attribution" in snapshot.attribution_boundary_summary
```

- [ ] **Step 2: Run the targeted backend test to verify RED**

Run:

```bash
PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_phase_six_feedback_scoring.py -q
```

Expected:

- FAIL because the snapshot schema/builder does not expose attribution-boundary fields yet

- [ ] **Step 3: Extend the snapshot schema**

Add these fields to `PhaseSixFeedbackLinkedScoringSnapshotRead` in `backend/app/workbench/schemas.py`:

```python
    attribution_boundary: Literal[
        "not_claimable",
        "outcome_adjacent",
        "cautious_attribution_candidate",
    ] = "not_claimable"
    attribution_boundary_label: str = ""
    attribution_boundary_summary: str = ""
```

- [ ] **Step 4: Derive boundary fields in `build_phase_six_feedback_linked_scoring_snapshot(...)`**

Add the smallest possible mapping in `backend/app/services/phase_six_generalist_governance.py`:

```python
    if (
        has_writeback_depth
        and has_strong_deliverable_closeout_depth
        and current_caveat_signal not in {"thin_writeback_evidence", "thin_deliverable_evidence"}
    ):
        attribution_boundary = "cautious_attribution_candidate"
        attribution_boundary_label = "可保守視為 attribution 候選"
        attribution_boundary_summary = (
            "目前已到 closeout + writeback depth，但仍不是正式 attribution，只能保守視為候選。"
        )
    elif has_deliverable_closeout_depth or has_writeback_depth:
        attribution_boundary = "outcome_adjacent"
        attribution_boundary_label = "目前只到 outcome-adjacent"
        attribution_boundary_summary = (
            "目前已有 outcome / closeout 關聯 evidence，但還不足以 claim business outcome attribution。"
        )
    else:
        attribution_boundary = "not_claimable"
        attribution_boundary_label = "目前不可 claim attribution"
        attribution_boundary_summary = (
            "目前仍以 feedback / adoption signal 為主，還不能把 business outcome 歸因給 system。"
        )
```

and return those fields in `PhaseSixFeedbackLinkedScoringSnapshotRead(...)`.

- [ ] **Step 5: Re-run the targeted backend test to verify GREEN**

Run:

```bash
PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_phase_six_feedback_scoring.py -q
```

Expected:

- PASS

- [ ] **Step 6: Commit the backend attribution-boundary slice**

```bash
git add backend/app/workbench/schemas.py \
  backend/app/services/phase_six_generalist_governance.py \
  backend/tests/test_phase_six_feedback_scoring.py
git commit -m "feat: add t2b attribution boundary"
```

Expected:

- commit succeeds with schema + builder + targeted backend test changes

---

### Task 2: Deepen Completion Review Summary With Attribution Boundary Reading

**Files:**
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/app/services/phase_six_generalist_governance.py`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/tests/test_phase_six_feedback_scoring.py`

- [ ] **Step 1: Extend the existing completion-review integration test first**

Inside `test_phase_six_completion_review_persists_feedback_linked_snapshot(...)`, add:

```python
    assert snapshot["attribution_boundary"] == "not_claimable"
    assert snapshot["attribution_boundary_label"] == "目前不可 claim attribution"
    assert snapshot["attribution_boundary_summary"]
    assert "目前不可 claim attribution" in review_payload["feedback_linked_summary"]
```

and after the checkpoint response:

```python
    assert (
        checkpoint_payload["feedback_linked_scoring_snapshot"]["attribution_boundary"]
        == review_payload["feedback_linked_scoring_snapshot"]["attribution_boundary"]
    )
```

- [ ] **Step 2: Run the targeted backend test to verify RED**

Run:

```bash
PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_phase_six_feedback_scoring.py -q
```

Expected:

- FAIL because completion-review summary text does not yet include attribution-boundary reading

- [ ] **Step 3: Update `build_phase_six_completion_review(...)` conservatively**

Keep the score math unchanged, but deepen the wording in `backend/app/services/phase_six_generalist_governance.py`:

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
                f"｜{computed_feedback_snapshot.effectiveness_composition_summary}"
                f"｜{computed_feedback_snapshot.attribution_boundary_summary}"
                f"｜{computed_feedback_snapshot.effectiveness_caveat_summary}"
            ),
        ),
```

and extend the computed `feedback_linked_summary` with:

```python
            f"｜{effective_feedback_snapshot.attribution_boundary_label}"
```

Do **not** add KPI / ROI wording here.

- [ ] **Step 4: Re-run the targeted backend test to verify GREEN**

Run:

```bash
PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_phase_six_feedback_scoring.py -q
```

Expected:

- PASS

- [ ] **Step 5: Commit the completion-review boundary slice**

```bash
git add backend/app/services/phase_six_generalist_governance.py \
  backend/tests/test_phase_six_feedback_scoring.py
git commit -m "feat: deepen t2b attribution boundary summary"
```

Expected:

- commit succeeds with completion-review wording + targeted backend test updates

---

### Task 3: Add The Low-Noise Frontend Attribution Boundary Readout

**Files:**
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/lib/types.ts`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/lib/api.ts`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/lib/phase-six-governance.ts`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/components/workbench-home.tsx`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/tests/phase-six-governance.test.mjs`

- [ ] **Step 1: Add the failing frontend helper test**

Add this test to `frontend/tests/phase-six-governance.test.mjs`:

```javascript
test("phase 6 attribution boundary helper stays low-noise and readable", () => {
  assert.equal(
    summarizePhaseSixAttributionBoundary({
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
        effectivenessCaveatSummary: "目前仍集中在少數 reusable asset。",
        primarySupportSignal: "writeback_evidence",
        primarySupportSignalLabel: "主要靠 writeback evidence",
        secondarySupportSignal: "deliverable_closeout",
        secondarySupportSignalLabel: "次要靠 deliverable closeout",
        currentCaveatSignal: "narrow_asset_concentration",
        currentCaveatSignalLabel: "目前仍集中在少數 reusable asset",
        effectivenessCompositionSummary:
          "主要靠 writeback evidence｜次要靠 deliverable closeout｜目前仍集中在少數 reusable asset",
        attributionBoundary: "cautious_attribution_candidate",
        attributionBoundaryLabel: "可保守視為 attribution 候選",
        attributionBoundarySummary:
          "目前已到 closeout + writeback depth，但仍不是正式 attribution，只能保守視為候選。",
        summary: "summary",
      },
    }),
    "可保守視為 attribution 候選",
  );
});
```

- [ ] **Step 2: Run the targeted frontend test to verify RED**

Run:

```bash
cd frontend && node --test tests/phase-six-governance.test.mjs
```

Expected:

- FAIL because `summarizePhaseSixAttributionBoundary(...)` does not exist yet

- [ ] **Step 3: Extend frontend types and API parsing**

Add these fields to `PhaseSixFeedbackLinkedScoringSnapshot` in `frontend/src/lib/types.ts`:

```ts
  attributionBoundary:
    | "not_claimable"
    | "outcome_adjacent"
    | "cautious_attribution_candidate";
  attributionBoundaryLabel: string;
  attributionBoundarySummary: string;
```

Then map them in `frontend/src/lib/api.ts`:

```ts
      attributionBoundary:
        payload.feedback_linked_scoring_snapshot?.attribution_boundary || "not_claimable",
      attributionBoundaryLabel:
        payload.feedback_linked_scoring_snapshot?.attribution_boundary_label || "",
      attributionBoundarySummary:
        payload.feedback_linked_scoring_snapshot?.attribution_boundary_summary || "",
```

- [ ] **Step 4: Add the helper and render it in the homepage card**

In `frontend/src/lib/phase-six-governance.ts` add:

```ts
export function summarizePhaseSixAttributionBoundary(
  review: Pick<
    {
      feedbackLinkedScoringSnapshot: {
        attributionBoundaryLabel: string;
      };
    },
    "feedbackLinkedScoringSnapshot"
  >,
) {
  return (
    review.feedbackLinkedScoringSnapshot.attributionBoundaryLabel ||
    "目前還沒有可讀取的 attribution boundary。"
  );
}
```

and render it inside the existing completion-review card in `frontend/src/components/workbench-home.tsx`, immediately after the existing composition paragraph:

```tsx
                      <p className="muted-text" style={{ marginTop: "8px" }}>
                        {summarizePhaseSixAttributionBoundary(
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

- [ ] **Step 6: Commit the frontend boundary slice**

```bash
git add frontend/src/lib/types.ts \
  frontend/src/lib/api.ts \
  frontend/src/lib/phase-six-governance.ts \
  frontend/src/components/workbench-home.tsx \
  frontend/tests/phase-six-governance.test.mjs
git commit -m "feat: add t2b attribution boundary readout"
```

Expected:

- commit succeeds with frontend type/api/helper/home/test updates

---

### Task 4: Sync Active Docs And Run Final Verification

**Files:**
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/01_runtime_architecture_and_data_contracts.md`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/06_product_alignment_and_85_point_roadmap.md`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/04_qa_matrix.md`

- [ ] **Step 1: Update `docs/01` to describe the new boundary contract honestly**

In sections `7.24` / `7.25`, extend the snapshot bullet list with:

```md
- `attribution_boundary`
- `attribution_boundary_label`
- `attribution_boundary_summary`
```

and add wording like:

```md
- `T2-B slice 3` 現在正式把 effectiveness reading 再補到 attribution boundary reading
- 第一版 boundary 目前只保守區分：
  - `not_claimable`
  - `outcome_adjacent`
  - `cautious_attribution_candidate`
- 這一刀仍不等於：
  - KPI attribution
  - ROI scoring
  - business outcome dashboard
```

- [ ] **Step 2: Update `docs/06` to mark `T2-B slice 3` as landed**

Append under `11.2 T2-B Reusable intelligence effectiveness deepen`:

```md
- 第三刀已正式落地成 `attribution boundary reading v1`
- system 現在不只知道有效性證據有多深，也開始正式回讀目前最多只能 claim 到哪個 attribution boundary
- 第一版 boundary 目前只保守區分 `not_claimable / outcome_adjacent / cautious_attribution_candidate`
- 這一刀仍未進入 KPI / business outcome attribution
```

- [ ] **Step 3: Append a QA entry in `docs/04` after real verification**

Add a new entry like:

```md
## Entry: 2026-04-10 T2-B attribution boundary reading v1

Scope:
- deepen `T2-B` by turning effectiveness reading into a low-noise attribution boundary reading
- keep the same completion-review surface instead of creating a new analytics family
- keep KPI / business outcome attribution explicitly out of scope
```

and record the real command outputs in its verification tables.

- [ ] **Step 4: Run final backend and frontend verification**

Run **serially**:

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
    Path("docs/superpowers/specs/2026-04-10-t2b-attribution-boundary-reading-v1-design.md"),
    Path("docs/superpowers/plans/2026-04-10-t2b-attribution-boundary-reading-v1.md"),
]
for path in paths:
    for lineno, line in enumerate(path.read_text().splitlines(), start=1):
        if any(token in line for token in ("TODO", "TBD", "FIXME")):
            if path.name == "04_qa_matrix.md" and "conversation-only TODO" in line:
                continue
            if path.name.endswith(".md") and 'if any(token in line for token in (' in line:
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
git commit -m "docs: align t2b attribution boundary"
```

Expected:

- commit succeeds with active docs aligned to shipped behavior and verification evidence
