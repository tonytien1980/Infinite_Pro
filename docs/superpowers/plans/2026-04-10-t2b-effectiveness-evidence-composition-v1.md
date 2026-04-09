# T2-B Effectiveness Evidence Composition V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `T2-B` 第二刀落成 `effectiveness evidence composition`：在不改六層架構、也不引入 KPI attribution 的前提下，讓 `Phase 6 feedback-linked persisted scoring` 不只知道目前是 `adoption_supported / closeout_supported / writeback_supported`，也能更誠實地回答這個 posture 主要靠哪類 evidence 撐起來，以及目前最大的 caution 是什麼。

**Architecture:** 沿用既有 `PhaseSixFeedbackLinkedScoringSnapshotRead`、`build_phase_six_feedback_linked_scoring_snapshot(...)`、`build_phase_six_completion_review(...)` 與首頁 `Generalist Governance` completion-review card，不新增新的 snapshot family、analytics page、或工作面滲透。backend 只補 composition/caveat fields 與 one-line summary；frontend 只把新 readout 接進既有 helper / homepage；active docs 與 QA evidence 只在真實驗證完成後同步更新。

**Tech Stack:** FastAPI, SQLAlchemy, Pydantic, pytest, Next.js, node:test, active docs under `docs/`

---

## File Structure

- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/app/workbench/schemas.py`
  - Extend `PhaseSixFeedbackLinkedScoringSnapshotRead` with composition/caveat fields
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/app/services/phase_six_generalist_governance.py`
  - Derive primary support signal, optional secondary support signal, current caveat signal, and low-noise composition summary
  - Keep existing posture taxonomy and score math intact
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/tests/test_phase_six_feedback_scoring.py`
  - Add targeted unit + integration assertions for composition/caveat reading
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/lib/types.ts`
  - Extend `PhaseSixFeedbackLinkedScoringSnapshot`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/lib/api.ts`
  - Parse new composition fields from the backend payload
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/lib/phase-six-governance.ts`
  - Add helper for low-noise composition summary
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/components/workbench-home.tsx`
  - Render composition summary inside the existing completion-review card
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/tests/phase-six-governance.test.mjs`
  - Add helper-level assertions for the new composition readout
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/01_runtime_architecture_and_data_contracts.md`
  - Extend `7.24` / `7.25` to describe composition/caveat reading honestly
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/06_product_alignment_and_85_point_roadmap.md`
  - Mark `T2-B slice 2` as landed without overclaiming KPI attribution
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/04_qa_matrix.md`
  - Append real verification evidence after backend/frontend verification passes

---

### Task 1: Extend The Backend Snapshot With Composition And Caveat Fields

**Files:**
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/app/workbench/schemas.py`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/app/services/phase_six_generalist_governance.py`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/tests/test_phase_six_feedback_scoring.py`

- [ ] **Step 1: Write the failing backend composition test**

Add this unit test to `backend/tests/test_phase_six_feedback_scoring.py`:

```python
def test_phase_six_feedback_snapshot_reads_effectiveness_composition() -> None:
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

    assert snapshot.primary_support_signal == "writeback_evidence"
    assert snapshot.primary_support_signal_label == "主要靠 writeback evidence"
    assert snapshot.secondary_support_signal == "deliverable_closeout"
    assert snapshot.current_caveat_signal == "narrow_asset_concentration"
    assert snapshot.effectiveness_composition_summary
```

- [ ] **Step 2: Run the targeted backend test to verify RED**

Run:

```bash
PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_phase_six_feedback_scoring.py -q
```

Expected:

- FAIL because the snapshot schema/builder does not expose composition fields yet

- [ ] **Step 3: Extend the snapshot schema**

Add these fields to `PhaseSixFeedbackLinkedScoringSnapshotRead` in `backend/app/workbench/schemas.py`:

```python
    primary_support_signal: Literal[
        "explicit_feedback",
        "deliverable_closeout",
        "writeback_evidence",
        "mixed_support",
    ] = "explicit_feedback"
    primary_support_signal_label: str = ""
    secondary_support_signal: Literal[
        "none",
        "explicit_feedback",
        "deliverable_closeout",
        "writeback_evidence",
        "mixed_support",
    ] = "none"
    secondary_support_signal_label: str = ""
    current_caveat_signal: Literal[
        "thin_deliverable_evidence",
        "thin_writeback_evidence",
        "minimal_writeback_expected",
        "narrow_asset_concentration",
        "none",
    ] = "none"
    current_caveat_signal_label: str = ""
    effectiveness_composition_summary: str = ""
```

- [ ] **Step 4: Derive composition fields in `build_phase_six_feedback_linked_scoring_snapshot(...)`**

Add the smallest possible mapping in `backend/app/services/phase_six_generalist_governance.py`:

```python
    if has_writeback_depth:
        primary_support_signal = "writeback_evidence"
        primary_support_signal_label = "主要靠 writeback evidence"
        secondary_support_signal = "deliverable_closeout"
        secondary_support_signal_label = "次要靠 deliverable closeout"
    elif has_strong_deliverable_closeout_depth or has_deliverable_closeout_depth:
        primary_support_signal = "deliverable_closeout"
        primary_support_signal_label = "主要靠 deliverable closeout"
        secondary_support_signal = "explicit_feedback"
        secondary_support_signal_label = "次要靠 explicit feedback"
    elif positive_feedback_count > 0 or governed_candidate_count > 0:
        primary_support_signal = "explicit_feedback"
        primary_support_signal_label = "主要靠 explicit feedback"
        secondary_support_signal = "none"
        secondary_support_signal_label = ""
    else:
        primary_support_signal = "explicit_feedback"
        primary_support_signal_label = "目前仍以顯性回饋為主"
        secondary_support_signal = "none"
        secondary_support_signal_label = ""

    if writeback_expected_task_count == 0:
        current_caveat_signal = "minimal_writeback_expected"
        current_caveat_signal_label = "目前本來就不期待 full writeback"
    elif has_deliverable_closeout_depth and not has_writeback_depth:
        current_caveat_signal = "thin_writeback_evidence"
        current_caveat_signal_label = "writeback evidence 仍薄"
    elif deliverable_feedback_count == 0 and outcome_record_count == 0:
        current_caveat_signal = "thin_deliverable_evidence"
        current_caveat_signal_label = "deliverable evidence 仍薄"
    elif len(top_asset_labels[:2]) <= 1:
        current_caveat_signal = "narrow_asset_concentration"
        current_caveat_signal_label = "目前仍集中在少數 reusable asset"
    else:
        current_caveat_signal = "none"
        current_caveat_signal_label = ""

    effectiveness_composition_summary = (
        f"{primary_support_signal_label}"
        + (f"｜{secondary_support_signal_label}" if secondary_support_signal != "none" else "")
        + (f"｜{current_caveat_signal_label}" if current_caveat_signal != "none" else "")
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

- [ ] **Step 6: Commit the backend composition slice**

```bash
git add backend/app/workbench/schemas.py \
  backend/app/services/phase_six_generalist_governance.py \
  backend/tests/test_phase_six_feedback_scoring.py
git commit -m "feat: add t2b effectiveness composition"
```

Expected:

- commit succeeds with schema + builder + targeted backend test changes

---

### Task 2: Deepen Completion Review Summary With Composition Reading

**Files:**
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/app/services/phase_six_generalist_governance.py`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/tests/test_phase_six_feedback_scoring.py`

- [ ] **Step 1: Extend the existing completion-review integration test first**

Inside `test_phase_six_completion_review_persists_feedback_linked_snapshot(...)`, add:

```python
    assert snapshot["primary_support_signal"] == "explicit_feedback"
    assert snapshot["primary_support_signal_label"] == "主要靠 explicit feedback"
    assert snapshot["current_caveat_signal"] in {"minimal_writeback_expected", "narrow_asset_concentration"}
    assert snapshot["effectiveness_composition_summary"]
    assert "主要靠 explicit feedback" in review_payload["feedback_linked_summary"]
```

and after the checkpoint response:

```python
    assert (
        checkpoint_payload["feedback_linked_scoring_snapshot"]["effectiveness_composition_summary"]
        == review_payload["feedback_linked_scoring_snapshot"]["effectiveness_composition_summary"]
    )
```

- [ ] **Step 2: Run the targeted backend test to verify RED**

Run:

```bash
PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_phase_six_feedback_scoring.py -q
```

Expected:

- FAIL because completion-review summary text does not yet include composition reading

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
                f"｜{computed_feedback_snapshot.effectiveness_caveat_summary}"
            ),
        ),
```

and extend the computed `feedback_linked_summary` with:

```python
            f"｜{effective_feedback_snapshot.effectiveness_composition_summary}"
```

Do **not** add KPI / ROI wording here.

- [ ] **Step 4: Re-run the targeted backend test to verify GREEN**

Run:

```bash
PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_phase_six_feedback_scoring.py -q
```

Expected:

- PASS

- [ ] **Step 5: Commit the completion-review composition slice**

```bash
git add backend/app/services/phase_six_generalist_governance.py \
  backend/tests/test_phase_six_feedback_scoring.py
git commit -m "feat: deepen t2b effectiveness composition summary"
```

Expected:

- commit succeeds with completion-review wording + targeted backend test updates

---

### Task 3: Add The Low-Noise Frontend Composition Readout

**Files:**
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/lib/types.ts`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/lib/api.ts`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/lib/phase-six-governance.ts`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/components/workbench-home.tsx`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/tests/phase-six-governance.test.mjs`

- [ ] **Step 1: Add the failing frontend helper test**

Add this test to `frontend/tests/phase-six-governance.test.mjs`:

```javascript
test("phase 6 effectiveness composition helper stays low-noise and readable", () => {
  assert.equal(
    summarizePhaseSixEffectivenessComposition({
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
        summary: "summary",
      },
    }),
    "主要靠 writeback evidence｜次要靠 deliverable closeout｜目前仍集中在少數 reusable asset",
  );
});
```

- [ ] **Step 2: Run the targeted frontend test to verify RED**

Run:

```bash
cd frontend && node --test tests/phase-six-governance.test.mjs
```

Expected:

- FAIL because `summarizePhaseSixEffectivenessComposition(...)` does not exist yet

- [ ] **Step 3: Extend frontend types and API parsing**

Add these fields to `PhaseSixFeedbackLinkedScoringSnapshot` in `frontend/src/lib/types.ts`:

```ts
  primarySupportSignal:
    | "explicit_feedback"
    | "deliverable_closeout"
    | "writeback_evidence"
    | "mixed_support";
  primarySupportSignalLabel: string;
  secondarySupportSignal:
    | "none"
    | "explicit_feedback"
    | "deliverable_closeout"
    | "writeback_evidence"
    | "mixed_support";
  secondarySupportSignalLabel: string;
  currentCaveatSignal:
    | "thin_deliverable_evidence"
    | "thin_writeback_evidence"
    | "minimal_writeback_expected"
    | "narrow_asset_concentration"
    | "none";
  currentCaveatSignalLabel: string;
  effectivenessCompositionSummary: string;
```

Then map them in `frontend/src/lib/api.ts`:

```ts
      primarySupportSignal:
        payload.feedback_linked_scoring_snapshot?.primary_support_signal || "explicit_feedback",
      primarySupportSignalLabel:
        payload.feedback_linked_scoring_snapshot?.primary_support_signal_label || "",
      secondarySupportSignal:
        payload.feedback_linked_scoring_snapshot?.secondary_support_signal || "none",
      secondarySupportSignalLabel:
        payload.feedback_linked_scoring_snapshot?.secondary_support_signal_label || "",
      currentCaveatSignal:
        payload.feedback_linked_scoring_snapshot?.current_caveat_signal || "none",
      currentCaveatSignalLabel:
        payload.feedback_linked_scoring_snapshot?.current_caveat_signal_label || "",
      effectivenessCompositionSummary:
        payload.feedback_linked_scoring_snapshot?.effectiveness_composition_summary || "",
```

- [ ] **Step 4: Add the helper and render it in the homepage card**

In `frontend/src/lib/phase-six-governance.ts` add:

```ts
export function summarizePhaseSixEffectivenessComposition(
  review: Pick<
    {
      feedbackLinkedScoringSnapshot: {
        effectivenessCompositionSummary: string;
      };
    },
    "feedbackLinkedScoringSnapshot"
  >,
) {
  return (
    review.feedbackLinkedScoringSnapshot.effectivenessCompositionSummary ||
    "目前還沒有可讀取的 effectiveness composition。"
  );
}
```

and render it inside the existing completion-review card in `frontend/src/components/workbench-home.tsx`, immediately after the existing effectiveness-reading paragraph:

```tsx
                      <p className="muted-text" style={{ marginTop: "8px" }}>
                        {summarizePhaseSixEffectivenessComposition(
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

- [ ] **Step 6: Commit the frontend composition slice**

```bash
git add frontend/src/lib/types.ts \
  frontend/src/lib/api.ts \
  frontend/src/lib/phase-six-governance.ts \
  frontend/src/components/workbench-home.tsx \
  frontend/tests/phase-six-governance.test.mjs
git commit -m "feat: add t2b effectiveness composition readout"
```

Expected:

- commit succeeds with frontend type/api/helper/home/test updates

---

### Task 4: Sync Active Docs And Run Final Verification

**Files:**
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/01_runtime_architecture_and_data_contracts.md`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/06_product_alignment_and_85_point_roadmap.md`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/04_qa_matrix.md`

- [ ] **Step 1: Update `docs/01` to describe the new composition contract honestly**

In sections `7.24` / `7.25`, extend the snapshot bullet list with:

```md
- `primary_support_signal`
- `primary_support_signal_label`
- `secondary_support_signal`
- `secondary_support_signal_label`
- `current_caveat_signal`
- `current_caveat_signal_label`
- `effectiveness_composition_summary`
```

and add wording like:

```md
- `T2-B slice 2` 現在正式把 effectiveness posture 再補成 evidence composition / caveat reading
- 第一版 composition 目前只回答：
  - 主要支撐 evidence 類型
  - 次要支撐 evidence 類型
  - 最大 caution 類型
- 這一刀仍不等於：
  - KPI attribution
  - ROI scoring
  - business outcome dashboard
```

- [ ] **Step 2: Update `docs/06` to mark `T2-B slice 2` as landed**

Append under `11.2 T2-B Reusable intelligence effectiveness deepen`:

```md
- 第二刀已正式落地成 `effectiveness evidence composition v1`
- system 現在不只知道目前是 `adoption_supported / closeout_supported / writeback_supported`
- system 也開始正式回讀目前主要支撐 evidence 與最大 caution
- 這一刀仍未進入 KPI / business outcome attribution
```

- [ ] **Step 3: Append a QA entry in `docs/04` after real verification**

Add a new entry like:

```md
## Entry: 2026-04-10 T2-B effectiveness evidence composition v1

Scope:
- deepen `T2-B` by turning effectiveness posture into low-noise evidence composition / caveat reading
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
    Path("docs/superpowers/specs/2026-04-10-t2b-effectiveness-evidence-composition-v1-design.md"),
    Path("docs/superpowers/plans/2026-04-10-t2b-effectiveness-evidence-composition-v1.md"),
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
git commit -m "docs: align t2b effectiveness composition"
```

Expected:

- commit succeeds with active docs aligned to shipped behavior and verification evidence
