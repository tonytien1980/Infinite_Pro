# T2-B Effectiveness Distortion Guard V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `T2-B` 第四刀落成 `effectiveness distortion guard`：在不改六層架構、也不引入 KPI / ROI / business outcome attribution engine 的前提下，讓 `Phase 6 feedback-linked persisted scoring` 能更誠實地區分正常缺口、continuity-aware distortion risk、以及目前最該避免的高估。

**Architecture:** 沿用既有 `PhaseSixFeedbackLinkedScoringSnapshotRead`、`_build_phase_six_feedback_linked_snapshot(...)`、`build_phase_six_feedback_linked_scoring_snapshot(...)`、`build_phase_six_completion_review(...)` 與首頁 `Generalist Governance` completion-review card，不新增新的 scoring family、analytics page、或工作面擴張。backend 只補 continuity mix counts、distortion guard fields 與 conservative summary；frontend 只把新 readout 接進既有 helper / homepage；active docs 與 QA evidence 只在真實驗證完成後同步更新。

**Tech Stack:** FastAPI, SQLAlchemy, Pydantic, pytest, Next.js, node:test, active docs under `docs/`

---

## File Structure

- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/app/workbench/schemas.py`
  - Extend `PhaseSixFeedbackLinkedScoringSnapshotRead` with continuity-mix counts and distortion-guard fields
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/app/services/workbench.py`
  - Derive `one_off / follow_up / continuous` counts from real task continuity policy and pass them into the snapshot builder
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/app/services/phase_six_generalist_governance.py`
  - Derive continuity-aware distortion fields and deepen completion-review wording without changing score math
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/tests/test_phase_six_feedback_scoring.py`
  - Add targeted unit + integration assertions for distortion guard fields and summary propagation
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/lib/types.ts`
  - Extend `PhaseSixFeedbackLinkedScoringSnapshot`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/lib/api.ts`
  - Parse new distortion-guard fields from the backend payload
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/lib/phase-six-governance.ts`
  - Add helper for low-noise distortion-guard summary
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/components/workbench-home.tsx`
  - Render the distortion-guard readout inside the existing completion-review card
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/tests/phase-six-governance.test.mjs`
  - Add helper-level assertions for the new distortion-guard summary
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/01_runtime_architecture_and_data_contracts.md`
  - Extend `7.24` / `7.25` to describe `T2-B slice 4` honestly
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/06_product_alignment_and_85_point_roadmap.md`
  - Mark `T2-B slice 4` as landed without drifting into KPI attribution
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/04_qa_matrix.md`
  - Append real verification evidence after backend/frontend verification passes

---

### Task 1: Add Continuity Mix Counts And Distortion Guard Fields To The Backend Snapshot

**Files:**
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/app/workbench/schemas.py`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/app/services/workbench.py`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/app/services/phase_six_generalist_governance.py`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/tests/test_phase_six_feedback_scoring.py`

- [ ] **Step 1: Write the failing backend unit tests first**

Add these tests to `backend/tests/test_phase_six_feedback_scoring.py`:

```python
def test_phase_six_feedback_snapshot_treats_one_off_absence_as_normal() -> None:
    snapshot = build_phase_six_feedback_linked_scoring_snapshot(
        adopted_count=1,
        needs_revision_count=0,
        not_adopted_count=0,
        template_candidate_count=1,
        governed_candidate_count=1,
        promoted_candidate_count=1,
        dismissed_candidate_count=0,
        override_signal_count=0,
        top_asset_codes=["domain_playbook"],
        one_off_task_count=2,
        follow_up_task_count=0,
        continuous_task_count=0,
        writeback_expected_task_count=0,
    )

    assert snapshot.continuity_interpretation == "one_off_minimal"
    assert snapshot.distortion_guard_signal == "normal_writeback_absence"
    assert "沒有 writeback 屬正常" in snapshot.distortion_guard_summary


def test_phase_six_feedback_snapshot_flags_continuous_writeback_gap() -> None:
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
        one_off_task_count=0,
        follow_up_task_count=0,
        continuous_task_count=2,
        follow_up_outcome_count=0,
        writeback_expected_task_count=2,
    )

    assert snapshot.continuity_interpretation == "continuous_expected"
    assert snapshot.distortion_guard_signal == "continuous_writeback_gap"
    assert "不要把 adoption 或 closeout 直接高估成 retained effectiveness" in (
        snapshot.distortion_guard_summary
    )
```

- [ ] **Step 2: Run the targeted backend test to verify RED**

Run:

```bash
PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_phase_six_feedback_scoring.py -q
```

Expected:

- FAIL because the snapshot schema/builder does not expose continuity counts or distortion-guard fields yet

- [ ] **Step 3: Extend the snapshot schema**

Add these fields to `PhaseSixFeedbackLinkedScoringSnapshotRead` in `backend/app/workbench/schemas.py`:

```python
    one_off_task_count: int = 0
    follow_up_task_count: int = 0
    continuous_task_count: int = 0
    continuity_interpretation: Literal[
        "one_off_minimal",
        "follow_up_present",
        "continuous_expected",
        "mixed_continuity",
    ] = "one_off_minimal"
    continuity_interpretation_label: str = ""
    distortion_guard_signal: Literal[
        "normal_writeback_absence",
        "follow_up_not_retained",
        "continuous_writeback_gap",
        "mixed_continuity_requires_context",
        "none",
    ] = "none"
    distortion_guard_signal_label: str = ""
    distortion_guard_summary: str = ""
```

- [ ] **Step 4: Derive continuity counts in `_build_phase_six_feedback_linked_snapshot(...)`**

Replace the current one-line `writeback_expected_task_count` computation in `backend/app/services/workbench.py` with an explicit continuity counter:

```python
    continuity_counter: Counter[str] = Counter()
    writeback_expected_task_count = 0
    for row in task_rows:
        continuity_mode, writeback_depth = resolve_continuity_policy_for_task(row)
        continuity_counter[continuity_mode.value] += 1
        if writeback_depth.value == "full":
            writeback_expected_task_count += 1
```

and pass the new counts into the snapshot builder:

```python
        one_off_task_count=continuity_counter["one_off"],
        follow_up_task_count=continuity_counter["follow_up"],
        continuous_task_count=continuity_counter["continuous"],
```

- [ ] **Step 5: Derive distortion fields in `build_phase_six_feedback_linked_scoring_snapshot(...)`**

Add the smallest continuity-aware mapping in `backend/app/services/phase_six_generalist_governance.py`:

```python
    has_mixed_continuity = (
        sum(
            count > 0
            for count in (one_off_task_count, follow_up_task_count, continuous_task_count)
        )
        > 1
    )

    if has_mixed_continuity:
        continuity_interpretation = "mixed_continuity"
        continuity_interpretation_label = "目前是 mixed continuity"
        distortion_guard_signal = "mixed_continuity_requires_context"
        distortion_guard_signal_label = "不能把不同 continuity 用同一把尺看"
        distortion_guard_summary = (
            "目前 continuity lane 混合，不能把 missing writeback、follow-up signal、與 retained effectiveness 用同一把尺看。"
        )
    elif continuous_task_count > 0:
        continuity_interpretation = "continuous_expected"
        continuity_interpretation_label = "目前已有 continuous expectation"
        if not has_writeback_depth:
            distortion_guard_signal = "continuous_writeback_gap"
            distortion_guard_signal_label = "continuous writeback gap 仍在"
            distortion_guard_summary = (
                "目前已有 continuous / full writeback expectation，但 writeback depth 仍薄，不要把 adoption 或 closeout 直接高估成 retained effectiveness。"
            )
        else:
            distortion_guard_signal = "none"
            distortion_guard_signal_label = "目前未見主要 continuity distortion"
            distortion_guard_summary = (
                "目前已有 continuous / full writeback evidence，但仍只能保守看 reusable effectiveness，不可直接升格成 KPI attribution。"
            )
    elif follow_up_task_count > 0:
        continuity_interpretation = "follow_up_present"
        continuity_interpretation_label = "目前已有 follow-up continuity"
        if not has_writeback_depth:
            distortion_guard_signal = "follow_up_not_retained"
            distortion_guard_signal_label = "follow-up 仍不能當 retained effectiveness"
            distortion_guard_summary = (
                "目前已有 follow-up continuity，但仍缺少足夠 writeback depth；最多只能先當 checkpoint signal，不要高估成 retained effectiveness。"
            )
        else:
            distortion_guard_signal = "none"
            distortion_guard_signal_label = "目前 follow-up evidence 已開始站穩"
            distortion_guard_summary = (
                "目前已有 follow-up continuity 與 writeback evidence，但仍只應保守視為延續 signal，不可直接跳成 business outcome attribution。"
            )
    else:
        continuity_interpretation = "one_off_minimal"
        continuity_interpretation_label = "目前以 one-off / minimal 為主"
        distortion_guard_signal = "normal_writeback_absence"
        distortion_guard_signal_label = "absence 不算負訊號"
        distortion_guard_summary = (
            "目前以 one-off / minimal 為主，沒有 writeback 屬正常，不要把 absence 當成 effectiveness 失敗。"
        )
```

Return those fields from `PhaseSixFeedbackLinkedScoringSnapshotRead(...)` together with the new continuity counts.

- [ ] **Step 6: Re-run the targeted backend test to verify GREEN**

Run:

```bash
PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_phase_six_feedback_scoring.py -q
```

Expected:

- PASS

- [ ] **Step 7: Commit the backend distortion-guard slice**

```bash
git add backend/app/workbench/schemas.py \
  backend/app/services/workbench.py \
  backend/app/services/phase_six_generalist_governance.py \
  backend/tests/test_phase_six_feedback_scoring.py
git commit -m "feat: add t2b distortion guard signals"
```

Expected:

- commit succeeds with schema + aggregation + builder + targeted backend test changes

---

### Task 2: Deepen Completion Review Summary With Distortion Guard Reading

**Files:**
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/app/services/phase_six_generalist_governance.py`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/tests/test_phase_six_feedback_scoring.py`

- [ ] **Step 1: Extend the completion-review integration test first**

Inside `test_phase_six_completion_review_persists_feedback_linked_snapshot(...)`, add:

```python
    assert snapshot["one_off_task_count"] >= 0
    assert snapshot["follow_up_task_count"] >= 0
    assert snapshot["continuous_task_count"] >= 0
    assert snapshot["continuity_interpretation"] in {
        "one_off_minimal",
        "follow_up_present",
        "continuous_expected",
        "mixed_continuity",
    }
    assert snapshot["distortion_guard_signal"] in {
        "normal_writeback_absence",
        "follow_up_not_retained",
        "continuous_writeback_gap",
        "mixed_continuity_requires_context",
        "none",
    }
    assert snapshot["distortion_guard_summary"]
    assert snapshot["distortion_guard_signal_label"]
    assert snapshot["distortion_guard_signal_label"] in review_payload["feedback_linked_summary"]
```

and after the checkpoint response:

```python
    assert (
        checkpoint_payload["feedback_linked_scoring_snapshot"]["distortion_guard_signal"]
        == review_payload["feedback_linked_scoring_snapshot"]["distortion_guard_signal"]
    )
```

- [ ] **Step 2: Run the targeted backend test to verify RED**

Run:

```bash
PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_phase_six_feedback_scoring.py -q
```

Expected:

- FAIL because completion-review summary text does not yet include distortion-guard reading

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
                f"｜{computed_feedback_snapshot.distortion_guard_summary}"
                f"｜{computed_feedback_snapshot.effectiveness_caveat_summary}"
                f"｜governed candidates {computed_feedback_snapshot.governed_candidate_count}。"
            ),
        ),
```

and extend `feedback_linked_summary` with:

```python
            f"｜{effective_feedback_snapshot.distortion_guard_signal_label}"
```

Do **not** add KPI / ROI wording here.

- [ ] **Step 4: Re-run the targeted backend test to verify GREEN**

Run:

```bash
PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_phase_six_feedback_scoring.py -q
```

Expected:

- PASS

- [ ] **Step 5: Commit the completion-review distortion slice**

```bash
git add backend/app/services/phase_six_generalist_governance.py \
  backend/tests/test_phase_six_feedback_scoring.py
git commit -m "feat: deepen t2b distortion guard summary"
```

Expected:

- commit succeeds with completion-review wording + targeted backend test updates

---

### Task 3: Add The Low-Noise Frontend Distortion Guard Readout

**Files:**
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/lib/types.ts`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/lib/api.ts`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/lib/phase-six-governance.ts`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/components/workbench-home.tsx`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/tests/phase-six-governance.test.mjs`

- [ ] **Step 1: Write the failing frontend helper test first**

Add this test to `frontend/tests/phase-six-governance.test.mjs`:

```javascript
test("phase 6 distortion guard summary stays low-noise and consultant-readable", () => {
  assert.equal(
    summarizePhaseSixEffectivenessDistortionGuard({
      feedbackLinkedScoringSnapshot: {
        distortionGuardSummary:
          "目前已有 continuous / full writeback expectation，但 writeback depth 仍薄，不要把 adoption 或 closeout 直接高估成 retained effectiveness。",
      },
    }),
    "目前已有 continuous / full writeback expectation，但 writeback depth 仍薄，不要把 adoption 或 closeout 直接高估成 retained effectiveness。",
  );
});
```

and import the helper at the top of the test file.

- [ ] **Step 2: Run the frontend test to verify RED**

Run:

```bash
cd frontend && node --test tests/phase-six-governance.test.mjs
```

Expected:

- FAIL because the helper does not exist yet

- [ ] **Step 3: Extend the frontend snapshot type and API parser**

Add the new fields to `PhaseSixFeedbackLinkedScoringSnapshot` in `frontend/src/lib/types.ts`:

```ts
  oneOffTaskCount: number;
  followUpTaskCount: number;
  continuousTaskCount: number;
  continuityInterpretation:
    | "one_off_minimal"
    | "follow_up_present"
    | "continuous_expected"
    | "mixed_continuity";
  continuityInterpretationLabel: string;
  distortionGuardSignal:
    | "normal_writeback_absence"
    | "follow_up_not_retained"
    | "continuous_writeback_gap"
    | "mixed_continuity_requires_context"
    | "none";
  distortionGuardSignalLabel: string;
  distortionGuardSummary: string;
```

and parse them in `frontend/src/lib/api.ts`:

```ts
      oneOffTaskCount: Number(
        payload.feedback_linked_scoring_snapshot?.one_off_task_count ?? 0,
      ),
      followUpTaskCount: Number(
        payload.feedback_linked_scoring_snapshot?.follow_up_task_count ?? 0,
      ),
      continuousTaskCount: Number(
        payload.feedback_linked_scoring_snapshot?.continuous_task_count ?? 0,
      ),
      continuityInterpretation:
        payload.feedback_linked_scoring_snapshot?.continuity_interpretation || "one_off_minimal",
      continuityInterpretationLabel:
        payload.feedback_linked_scoring_snapshot?.continuity_interpretation_label || "",
      distortionGuardSignal:
        payload.feedback_linked_scoring_snapshot?.distortion_guard_signal || "none",
      distortionGuardSignalLabel:
        payload.feedback_linked_scoring_snapshot?.distortion_guard_signal_label || "",
      distortionGuardSummary:
        payload.feedback_linked_scoring_snapshot?.distortion_guard_summary || "",
```

- [ ] **Step 4: Add the helper and render it inside the existing card**

Add this helper to `frontend/src/lib/phase-six-governance.ts`:

```ts
export function summarizePhaseSixEffectivenessDistortionGuard(
  review: Pick<
    {
      feedbackLinkedScoringSnapshot: {
        distortionGuardSummary: string;
      };
    },
    "feedbackLinkedScoringSnapshot"
  >,
) {
  return (
    review.feedbackLinkedScoringSnapshot.distortionGuardSummary ||
    "目前還沒有可讀取的 distortion guard。"
  );
}
```

Import it into `frontend/src/components/workbench-home.tsx` and render one extra paragraph immediately after the attribution-boundary line:

```tsx
                      <p className="muted-text" style={{ marginTop: "8px" }}>
                        {summarizePhaseSixEffectivenessDistortionGuard(
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

- [ ] **Step 6: Run the broader frontend verification**

Run:

```bash
cd frontend && node --test tests/phase-six-governance.test.mjs tests/intake-progress.test.mjs
cd frontend && npm run build
cd frontend && npm run typecheck
```

Expected:

- all commands PASS

- [ ] **Step 7: Commit the frontend distortion-guard readout**

```bash
git add frontend/src/lib/types.ts \
  frontend/src/lib/api.ts \
  frontend/src/lib/phase-six-governance.ts \
  frontend/src/components/workbench-home.tsx \
  frontend/tests/phase-six-governance.test.mjs
git commit -m "feat: add t2b distortion guard readout"
```

Expected:

- commit succeeds with parser + helper + homepage + frontend test changes

---

### Task 4: Sync Active Docs And QA Evidence After Real Verification

**Files:**
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/01_runtime_architecture_and_data_contracts.md`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/06_product_alignment_and_85_point_roadmap.md`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/04_qa_matrix.md`

- [ ] **Step 1: Update `docs/01` to reflect the new snapshot contract**

Extend the `feedback_linked_scoring_snapshot` bullet list in `docs/01_runtime_architecture_and_data_contracts.md` with:

```md
- `one_off_task_count`
- `follow_up_task_count`
- `continuous_task_count`
- `continuity_interpretation`
- `continuity_interpretation_label`
- `distortion_guard_signal`
- `distortion_guard_signal_label`
- `distortion_guard_summary`
```

and add a new `T2-B slice 4` note that explains:

```md
- 第二 tranche 的 `T2-B slice 4` 現在正式補到：
  - continuity-aware distortion guard
  - normalized missing-evidence reading
  - reusable-intelligence effectiveness anti-overread summary
```

- [ ] **Step 2: Update `docs/06` to record the shipped roadmap status**

Add a short landed note under `11.2 T2-B Reusable intelligence effectiveness deepen`:

```md
- 第四刀已正式落地成 `effectiveness distortion guard v1`
- `Phase 6 feedback-linked persisted scoring` 現在也會正式回答：
  - 哪些缺口屬正常 one-off / minimal absence
  - 哪些 follow-up / continuous lane 仍不能高估
  - 目前最該避免的 distortion risk 是什麼
```

- [ ] **Step 3: Run the full verification required for `docs/04` evidence**

Run:

```bash
PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_phase_six_feedback_scoring.py -q
PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_mvp_slice.py -q
cd frontend && node --test tests/phase-six-governance.test.mjs tests/intake-progress.test.mjs
cd frontend && npm run build
cd frontend && npm run typecheck
git diff --check
```

Expected:

- all commands PASS

- [ ] **Step 4: Append a real QA evidence entry to `docs/04`**

Add a new entry to `docs/04_qa_matrix.md` with this structure:

```md
## Entry: 2026-04-10 T2-B effectiveness distortion guard v1

### Scope
- deepen `T2-B` by turning existing posture / composition / attribution reading into a continuity-aware distortion guard

### Verification
| Layer | Surface | Expectation | Result | Evidence |
| --- | --- | --- | --- | --- |
| Backend | `build_phase_six_feedback_linked_scoring_snapshot(...)` | Add continuity-aware distortion fields without creating a new scoring family | Verified | targeted backend tests confirm the snapshot now distinguishes normal one-off absence, follow-up caution, and continuous writeback gap conservatively |
| Backend | `/api/v1/workbench/phase-6-completion-review` | Fold distortion guard wording into low-noise completion-review summary | Verified | targeted backend tests confirm completion-review summary now carries distortion-guard reading while keeping score math unchanged |
| Frontend | homepage `Generalist Governance` completion-review card | Render one extra low-noise distortion-guard line inside the existing card | Verified | node tests confirm the helper stays compact and the homepage still uses the same completion-review surface |
| Regression | backend / frontend shared verification | Preserve existing Phase 6 routes, homepage contract, type parsing, and broader MVP behavior | Verified | targeted backend tests, backend regression, frontend node tests, build, and typecheck all remain green after the distortion-guard pass |
```

- [ ] **Step 5: Commit the docs + QA sync**

```bash
git add docs/01_runtime_architecture_and_data_contracts.md \
  docs/06_product_alignment_and_85_point_roadmap.md \
  docs/04_qa_matrix.md
git commit -m "docs: align t2b distortion guard"
```

Expected:

- commit succeeds with active-doc sync and real QA evidence
