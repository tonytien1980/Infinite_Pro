# Phase 6 Feedback-Linked Persisted Scoring Closeout Depth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `7.2` 下一刀推進成 `deliverable-linked closeout depth`：讓 `completion review / checkpoint / sign-off foundation` 不只看到 explicit feedback rows，還能看到這些 feedback 是否掛在真實 deliverable、是否進過 publish、是否形成 deliverable-linked governed candidate outcome。

**Architecture:** 沿用既有 `PhaseSixFeedbackLinkedScoringSnapshotRead`，不另開第二個 scoring snapshot family。backend 在既有 snapshot builder 與 completion-review scoring 上補 `deliverable -> publish -> governed candidate` closeout-depth counts；frontend 仍留在既有首頁 `Generalist Governance` completion-review 區塊，只補一條 low-noise closeout-depth summary；active docs 與 QA evidence 只在真實驗證完成後同步更新。

**Tech Stack:** FastAPI, SQLAlchemy, Pydantic, pytest, Next.js, node test, active docs under `docs/`

---

## File Structure

- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/app/workbench/schemas.py`
  - Extend `PhaseSixFeedbackLinkedScoringSnapshotRead` with deliverable-linked closeout-depth fields
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/app/services/workbench.py`
  - Count deliverable-linked feedback, publish records, and deliverable-linked governed candidates
  - Feed the expanded snapshot into completion review / checkpoint / sign-off flow
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/app/services/phase_six_generalist_governance.py`
  - Extend snapshot builder summary
  - Rewrite `feedback_loop` score weighting so deliverable-linked closeout depth matters
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/tests/test_phase_six_feedback_scoring.py`
  - Add targeted closeout-depth backend tests
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/tests/test_mvp_slice.py`
  - Update / add regression covering deliverable feedback, publish, and phase-six completion-review/sign-off readiness
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/lib/types.ts`
  - Extend frontend snapshot type
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/lib/api.ts`
  - Parse closeout-depth payload fields
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/lib/phase-six-governance.ts`
  - Add helper for low-noise closeout-depth summary
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/components/workbench-home.tsx`
  - Read the closeout-depth summary inside existing completion-review card
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/tests/phase-six-governance.test.mjs`
  - Add helper regression for closeout-depth summary
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/01_runtime_architecture_and_data_contracts.md`
  - Update `7.24` / `7.25` wording for deliverable-linked closeout depth
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/06_product_alignment_and_85_point_roadmap.md`
  - Mark `7.2` closeout-depth slice as landed / in progress without overclaiming outcome/writeback scoring
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/04_qa_matrix.md`
  - Append real verification evidence only after all commands pass

---

### Task 1: Extend Feedback Snapshot With Deliverable-Linked Closeout Depth

**Files:**
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/app/workbench/schemas.py`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/app/services/workbench.py`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/app/services/phase_six_generalist_governance.py`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/tests/test_phase_six_feedback_scoring.py`

- [ ] **Step 1: Write the failing backend snapshot test**

```python
def test_phase_six_feedback_snapshot_reads_deliverable_linked_closeout_depth() -> None:
    snapshot = build_phase_six_feedback_linked_scoring_snapshot(
        adopted_count=2,
        needs_revision_count=1,
        not_adopted_count=1,
        template_candidate_count=2,
        governed_candidate_count=3,
        promoted_candidate_count=2,
        dismissed_candidate_count=1,
        override_signal_count=2,
        top_asset_codes=["domain_playbook", "review_lens"],
        deliverable_feedback_count=3,
        deliverable_adopted_count=2,
        published_deliverable_count=1,
        published_adopted_count=1,
        deliverable_candidate_count=2,
        governed_deliverable_candidate_count=1,
    )

    assert snapshot.deliverable_feedback_count == 3
    assert snapshot.published_adopted_count == 1
    assert snapshot.governed_deliverable_candidate_count == 1
    assert snapshot.closeout_depth_summary
```

- [ ] **Step 2: Run the targeted test to verify it fails**

Run: `PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_phase_six_feedback_scoring.py -q`

Expected:
- FAIL because the current snapshot schema / builder do not expose deliverable-linked closeout-depth fields yet

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
    summary: str = ""
```

- [ ] **Step 4: Extend the backend snapshot builder**

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
    deliverable_feedback_count: int = 0,
    deliverable_adopted_count: int = 0,
    published_deliverable_count: int = 0,
    published_adopted_count: int = 0,
    deliverable_candidate_count: int = 0,
    governed_deliverable_candidate_count: int = 0,
) -> schemas.PhaseSixFeedbackLinkedScoringSnapshotRead:
    ...
    closeout_depth_summary = (
        f"deliverable feedback {deliverable_feedback_count}｜"
        f"已 publish {published_deliverable_count}｜"
        f"deliverable governed {governed_deliverable_candidate_count}"
    )
    return schemas.PhaseSixFeedbackLinkedScoringSnapshotRead(
        ...,
        deliverable_feedback_count=deliverable_feedback_count,
        deliverable_adopted_count=deliverable_adopted_count,
        published_deliverable_count=published_deliverable_count,
        published_adopted_count=published_adopted_count,
        deliverable_candidate_count=deliverable_candidate_count,
        governed_deliverable_candidate_count=governed_deliverable_candidate_count,
        closeout_depth_summary=closeout_depth_summary,
    )
```

- [ ] **Step 5: Extend `_build_phase_six_feedback_linked_snapshot()` in `workbench.py`**

```python
deliverable_feedback_rows = [row for row in feedback_rows if row.deliverable_id]
deliverable_feedback_count = len(deliverable_feedback_rows)
deliverable_adopted_count = sum(
    1 for row in deliverable_feedback_rows if row.feedback_status == "adopted"
)

published_deliverable_ids = {
    row.deliverable_id
    for row in db.scalars(select(models.DeliverablePublishRecord)).all()
    if row.deliverable_id
}
published_deliverable_count = len(published_deliverable_ids)
published_adopted_count = len(
    {
        row.deliverable_id
        for row in deliverable_feedback_rows
        if row.deliverable_id
        and row.feedback_status == "adopted"
        and row.deliverable_id in published_deliverable_ids
    }
)

deliverable_candidate_rows = [row for row in candidate_rows if row.source_deliverable_id]
deliverable_candidate_count = len(deliverable_candidate_rows)
governed_deliverable_candidate_count = sum(
    1
    for row in deliverable_candidate_rows
    if row.candidate_status in {"promoted", "dismissed"}
)
```

- [ ] **Step 6: Re-run the targeted backend test**

Run: `PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_phase_six_feedback_scoring.py -q`

Expected:
- PASS

- [ ] **Step 7: Commit the snapshot-extension slice**

```bash
git add backend/app/workbench/schemas.py \
  backend/app/services/workbench.py \
  backend/app/services/phase_six_generalist_governance.py \
  backend/tests/test_phase_six_feedback_scoring.py
git commit -m "feat: add phase six closeout-depth snapshot"
```

---

### Task 2: Rewrite Completion Review And Checkpoint To Use Closeout Depth

**Files:**
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/app/services/phase_six_generalist_governance.py`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/app/services/workbench.py`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/tests/test_phase_six_feedback_scoring.py`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/tests/test_mvp_slice.py`

- [ ] **Step 1: Write the failing integration test for closeout-depth scoring**

```python
def test_phase_six_completion_review_raises_feedback_loop_score_when_deliverable_is_published(
    client: TestClient,
) -> None:
    task = _create_feedback_task(client, title="Phase 6 closeout depth")
    client.post(
        f"/api/v1/tasks/{task['id']}/uploads",
        files=[("files", ("agreement.txt", b"Termination and liability clauses need review.", "text/plain"))],
    )
    run_response = client.post(f"/api/v1/tasks/{task['id']}/run")
    assert run_response.status_code == 200
    deliverable_id = run_response.json()["deliverable"]["id"]

    workspace = client.get(f"/api/v1/deliverables/{deliverable_id}").json()
    publish_response = client.post(
        f"/api/v1/deliverables/{deliverable_id}/publish",
        json={
            "title": workspace["deliverable"]["title"],
            "summary": workspace["deliverable"]["summary"],
            "version_tag": workspace["deliverable"]["version_tag"] or "v1",
            "publish_note": "closeout depth verification",
            "artifact_formats": ["markdown"],
            "content_sections": workspace["content_sections"],
        },
    )
    assert publish_response.status_code == 200

    feedback_response = client.post(
        f"/api/v1/deliverables/{deliverable_id}/feedback",
        json={"feedback_status": "adopted", "note": "這份交付可直接採用。"},
    )
    assert feedback_response.status_code == 200

    review = client.get("/api/v1/workbench/phase-6-completion-review")
    body = review.json()
    feedback_loop = next(
        item for item in body["scorecard_items"] if item["dimension_code"] == "feedback_loop"
    )

    assert body["feedback_linked_scoring_snapshot"]["published_adopted_count"] == 1
    assert "closeout" in feedback_loop["summary"] or "交付" in feedback_loop["summary"]
```

- [ ] **Step 2: Run the integration tests to verify they fail**

Run:
- `PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_phase_six_feedback_scoring.py -q`
- `PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_mvp_slice.py -q -k "deliverable_feedback or phase_six_completion_review or phase_six_sign_off"`

Expected:
- FAIL because completion-review scoring still treats feedback rows mostly as the same generic foundation signal

- [ ] **Step 3: Rewrite feedback-loop scoring in `build_phase_six_completion_review()`**

```python
has_strong_deliverable_closeout_depth = (
    computed_feedback_snapshot.deliverable_adopted_count > 0
    and computed_feedback_snapshot.published_adopted_count > 0
)
has_deliverable_closeout_depth = (
    computed_feedback_snapshot.deliverable_feedback_count > 0
    or computed_feedback_snapshot.deliverable_candidate_count > 0
)

feedback_loop_score = (
    84
    if has_strong_deliverable_closeout_depth
    or computed_feedback_snapshot.governed_deliverable_candidate_count > 0
    else 68
    if has_deliverable_closeout_depth
    or positive_feedback_count > 0
    or computed_feedback_snapshot.governed_candidate_count > 0
    else 42
)
```

```python
summary=(
    f"{computed_feedback_snapshot.summary}"
    f"｜{computed_feedback_snapshot.closeout_depth_summary}"
)
```

- [ ] **Step 4: Keep checkpoint persistence and sign-off flow reading the expanded snapshot**

```python
row.payload = {
    "checkpointed": True,
    "checkpointed_at": models.utc_now().isoformat(),
    "checkpointed_by_label": operator_label,
    "overall_score": current.overall_score,
    "scorecard_items": [item.model_dump() for item in current.scorecard_items],
    "feedback_linked_summary": current.feedback_linked_summary,
    "feedback_linked_scoring_snapshot": current.feedback_linked_scoring_snapshot.model_dump(),
    "review_posture": current.review_posture,
    "closure_posture": current.closure_posture,
}
```

```python
checkpoint_summary = (
    f"最近一次 checkpoint 由 {checkpoint_state.get('checkpointed_by_label') or 'owner'} 記錄，"
    f"當時總分 {overall_score}，"
    f"{effective_feedback_snapshot.closeout_depth_summary}"
    if checkpointed
    else "目前還沒有 recorded checkpoint，可先用這次 scorecard 做第一筆 completion review snapshot。"
)
```

- [ ] **Step 5: Update the phase-six sign-off regression to use real deliverable-linked evidence**

```python
task_payload = client.post(
    "/api/v1/tasks",
    json=create_contract_review_payload("Phase 6 sign-off readiness"),
)
assert task_payload.status_code == 201
created_task = task_payload.json()

client.post(
    f"/api/v1/tasks/{created_task['id']}/uploads",
    files=[("files", ("agreement.txt", b"Termination and indemnity clauses need review.", "text/plain"))],
)
run_response = client.post(f"/api/v1/tasks/{created_task['id']}/run")
assert run_response.status_code == 200
deliverable_id = run_response.json()["deliverable"]["id"]

workspace = client.get(f"/api/v1/deliverables/{deliverable_id}").json()
publish = client.post(
    f"/api/v1/deliverables/{deliverable_id}/publish",
    json={
        "title": workspace["deliverable"]["title"],
        "summary": workspace["deliverable"]["summary"],
        "version_tag": workspace["deliverable"]["version_tag"] or "v1",
        "publish_note": "Phase 6 sign-off readiness",
        "artifact_formats": ["markdown"],
        "content_sections": workspace["content_sections"],
    },
)
assert publish.status_code == 200

feedback = client.post(
    f"/api/v1/deliverables/{deliverable_id}/feedback",
    json={"feedback_status": "adopted", "note": "這份交付值得保留成可重用模式。"},
)
assert feedback.status_code == 200
```

- [ ] **Step 6: Re-run the targeted backend regressions**

Run:
- `PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_phase_six_feedback_scoring.py -q`
- `PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_mvp_slice.py -q -k "deliverable_feedback or phase_six_completion_review or phase_six_sign_off"`

Expected:
- PASS

- [ ] **Step 7: Commit the scoring-rewrite slice**

```bash
git add backend/app/services/phase_six_generalist_governance.py \
  backend/app/services/workbench.py \
  backend/tests/test_phase_six_feedback_scoring.py \
  backend/tests/test_mvp_slice.py
git commit -m "feat: deepen phase six closeout scoring"
```

---

### Task 3: Frontend Readout, Active Docs, And Full Verification

**Files:**
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/lib/types.ts`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/lib/api.ts`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/lib/phase-six-governance.ts`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/components/workbench-home.tsx`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/tests/phase-six-governance.test.mjs`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/01_runtime_architecture_and_data_contracts.md`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/06_product_alignment_and_85_point_roadmap.md`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/04_qa_matrix.md`

- [ ] **Step 1: Write the failing frontend helper regression**

```javascript
test("phase 6 feedback closeout depth summary stays low-noise and readable", () => {
  assert.equal(
    summarizePhaseSixFeedbackCloseoutDepth({
      feedbackLinkedScoringSnapshot: {
        adoptedCount: 2,
        needsRevisionCount: 1,
        notAdoptedCount: 1,
        templateCandidateCount: 2,
        governedCandidateCount: 3,
        promotedCandidateCount: 2,
        dismissedCandidateCount: 1,
        overrideSignalCount: 2,
        topAssetCodes: ["domain_playbook"],
        topAssetLabels: ["工作主線"],
        deliverableFeedbackCount: 3,
        deliverableAdoptedCount: 2,
        publishedDeliverableCount: 1,
        publishedAdoptedCount: 1,
        deliverableCandidateCount: 2,
        governedDeliverableCandidateCount: 1,
        closeoutDepthSummary: "交付回饋 3｜已 publish 1｜deliverable governed 1",
        summary: "summary",
      },
    }),
    "交付回饋 3｜已 publish 1｜deliverable governed 1",
  );
});
```

- [ ] **Step 2: Run the targeted frontend test to verify it fails**

Run: `cd frontend && node --test tests/phase-six-governance.test.mjs`

Expected:
- FAIL because the new helper and snapshot fields do not exist yet

- [ ] **Step 3: Extend frontend types / API parsing**

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
  deliverableFeedbackCount: number;
  deliverableAdoptedCount: number;
  publishedDeliverableCount: number;
  publishedAdoptedCount: number;
  deliverableCandidateCount: number;
  governedDeliverableCandidateCount: number;
  closeoutDepthSummary: string;
  summary: string;
}
```

```typescript
feedbackLinkedScoringSnapshot: {
  ...,
  deliverableFeedbackCount: Number(
    payload.feedback_linked_scoring_snapshot?.deliverable_feedback_count ?? 0,
  ),
  deliverableAdoptedCount: Number(
    payload.feedback_linked_scoring_snapshot?.deliverable_adopted_count ?? 0,
  ),
  publishedDeliverableCount: Number(
    payload.feedback_linked_scoring_snapshot?.published_deliverable_count ?? 0,
  ),
  publishedAdoptedCount: Number(
    payload.feedback_linked_scoring_snapshot?.published_adopted_count ?? 0,
  ),
  deliverableCandidateCount: Number(
    payload.feedback_linked_scoring_snapshot?.deliverable_candidate_count ?? 0,
  ),
  governedDeliverableCandidateCount: Number(
    payload.feedback_linked_scoring_snapshot?.governed_deliverable_candidate_count ?? 0,
  ),
  closeoutDepthSummary: payload.feedback_linked_scoring_snapshot?.closeout_depth_summary || "",
}
```

- [ ] **Step 4: Add a low-noise helper and surface it in the homepage completion-review card**

```typescript
export function summarizePhaseSixFeedbackCloseoutDepth(review: Pick<
  { feedbackLinkedScoringSnapshot: { closeoutDepthSummary: string } },
  "feedbackLinkedScoringSnapshot"
>) {
  return (
    review.feedbackLinkedScoringSnapshot.closeoutDepthSummary ||
    "目前還沒有可讀取的交付收尾深度。"
  );
}
```

```tsx
<p className="muted-text" style={{ marginTop: "8px" }}>
  {summarizePhaseSixFeedbackCloseoutDepth(phaseSixCompletionReview)}
</p>
```

- [ ] **Step 5: Update active docs**

```md
- `7.2` closeout-depth slice 現在也正式把：
  - deliverable-linked adoption feedback
  - publish evidence
  - deliverable-linked governed candidate outcome
  接回 completion review / checkpoint
- 但這一刀仍不等於 outcome / writeback scoring
```

- [ ] **Step 6: Run the full verification set**

Run:
- `PYTHONPATH=backend .venv312/bin/python -m compileall backend/app`
- `PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_phase_six_feedback_scoring.py -q`
- `PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_mvp_slice.py -q`
- `cd frontend && node --test tests/phase-six-governance.test.mjs tests/intake-progress.test.mjs`
- `cd frontend && rm -f .next/cache/.tsbuildinfo && mkdir -p .next/types && npx next typegen && npm run typecheck`
- `cd frontend && npm run build`

Expected:
- backend compile PASS
- targeted feedback-scoring tests PASS
- full backend regression PASS
- frontend targeted tests PASS
- frontend typecheck PASS
- frontend build PASS

- [ ] **Step 7: Append QA evidence only after the full runs pass**

```md
## Entry: 2026-04-08 phase-6 feedback-linked persisted scoring closeout depth

- Scope:
  - extend feedback-linked scoring from explicit rows to deliverable-linked closeout depth
  - keep outcome / writeback scoring out of scope
```

- [ ] **Step 8: Commit docs / frontend / QA alignment and push**

```bash
git add frontend/src/lib/types.ts \
  frontend/src/lib/api.ts \
  frontend/src/lib/phase-six-governance.ts \
  frontend/src/components/workbench-home.tsx \
  frontend/tests/phase-six-governance.test.mjs \
  docs/01_runtime_architecture_and_data_contracts.md \
  docs/06_product_alignment_and_85_point_roadmap.md \
  docs/04_qa_matrix.md
git commit -m "docs: align phase six closeout scoring"
git push origin codex/docs06-roadmap
```

---

### Self-Review

- [ ] Spec coverage: this plan only implements `7.2 slice 2 = deliverable-linked closeout depth`
- [ ] Placeholder scan: no `TODO`, `TBD`, or vague “handle edge cases” wording remains
- [ ] Type consistency: the expanded feedback snapshot keeps one contract family across backend schema, API parsing, frontend types, and checkpoint persistence
- [ ] Scope safety: no task crosses into `OutcomeRecord`, action execution, continuity writeback scoring, or business outcome attribution
