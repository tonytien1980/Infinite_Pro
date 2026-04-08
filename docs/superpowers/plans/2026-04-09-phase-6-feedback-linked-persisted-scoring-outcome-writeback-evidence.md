# Phase 6 Feedback-Linked Persisted Scoring Outcome And Writeback Evidence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `7.2` 下一刀推進成 `outcome / writeback evidence`：讓 `completion review / checkpoint / sign-off foundation` 不只讀 explicit feedback 與 deliverable closeout depth，也開始讀 Host 已持久化的 `OutcomeRecord / ActionExecution / WRITEBACK_GENERATED audit`。

**Architecture:** 沿用既有 `PhaseSixFeedbackLinkedScoringSnapshotRead`，不新開第四套 snapshot family。backend 在既有 snapshot builder 與 completion-review scoring 上補 writeback-evidence counts、expectation boundary、以及 low-noise writeback-depth summary；frontend 只在既有首頁 `Generalist Governance` completion-review card 再補一條 outcome/writeback depth readout；active docs 與 QA evidence 只在真實驗證完成後同步更新。

**Tech Stack:** FastAPI, SQLAlchemy, Pydantic, pytest, Next.js, node test, active docs under `docs/`

---

## File Structure

- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/app/workbench/schemas.py`
  - Extend `PhaseSixFeedbackLinkedScoringSnapshotRead` with outcome/writeback evidence fields
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/app/services/workbench.py`
  - Aggregate `OutcomeRecord`, `ActionExecution`, and `AuditEvent(event_type=writeback_generated)` for relevant task ids
  - Track whether writeback was actually expected for the involved tasks
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/app/services/phase_six_generalist_governance.py`
  - Extend snapshot builder summary
  - Rewrite `feedback_loop` scoring to add a writeback bonus when appropriate without universally penalizing one-off/minimal work
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/tests/test_phase_six_feedback_scoring.py`
  - Add targeted writeback-evidence tests
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/lib/types.ts`
  - Extend frontend snapshot type
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/lib/api.ts`
  - Parse writeback-evidence payload fields
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/lib/phase-six-governance.ts`
  - Add helper for low-noise outcome/writeback summary
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/components/workbench-home.tsx`
  - Render the writeback-depth summary inside existing completion-review card
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/tests/phase-six-governance.test.mjs`
  - Add helper-level writeback summary assertions
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/01_runtime_architecture_and_data_contracts.md`
  - Update `7.24` / `7.25` wording to describe outcome/writeback evidence depth
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/06_product_alignment_and_85_point_roadmap.md`
  - Mark the next `7.2` slice as started / landed without overclaiming KPI attribution
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/04_qa_matrix.md`
  - Append real verification evidence only after all commands pass

---

### Task 1: Extend Snapshot With Outcome And Writeback Evidence

**Files:**
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/app/workbench/schemas.py`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/app/services/workbench.py`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/app/services/phase_six_generalist_governance.py`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/tests/test_phase_six_feedback_scoring.py`

- [ ] **Step 1: Write the failing backend snapshot test**

```python
def test_phase_six_feedback_snapshot_reads_outcome_and_writeback_evidence() -> None:
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
        outcome_record_count=2,
        deliverable_outcome_record_count=1,
        follow_up_outcome_count=1,
        writeback_generated_event_count=4,
        review_required_execution_count=1,
        planned_execution_count=2,
        writeback_expected_task_count=1,
    )

    assert snapshot.outcome_record_count == 2
    assert snapshot.writeback_generated_event_count == 4
    assert snapshot.review_required_execution_count == 1
    assert snapshot.writeback_expected_task_count == 1
    assert snapshot.writeback_depth_summary
```

- [ ] **Step 2: Run the targeted test to verify it fails**

Run: `PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_phase_six_feedback_scoring.py -q`

Expected:
- FAIL because the current snapshot schema / builder do not expose outcome/writeback-evidence fields yet

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
    outcome_record_count: int = 0,
    deliverable_outcome_record_count: int = 0,
    follow_up_outcome_count: int = 0,
    writeback_generated_event_count: int = 0,
    review_required_execution_count: int = 0,
    planned_execution_count: int = 0,
    writeback_expected_task_count: int = 0,
) -> schemas.PhaseSixFeedbackLinkedScoringSnapshotRead:
    normalized_top_asset_codes: list[str] = []
    for code in top_asset_codes:
        normalized = str(code).strip()
        if not normalized or normalized in normalized_top_asset_codes:
            continue
        normalized_top_asset_codes.append(normalized)

    top_asset_labels = [
        OPTIMIZATION_ASSET_LABELS[item]
        for item in normalized_top_asset_codes
        if item in OPTIMIZATION_ASSET_LABELS
    ]
    summary = (
        f"已採用 {adopted_count}｜需改寫 {needs_revision_count}｜不採用 {not_adopted_count}"
        f"｜主要影響 {'、'.join(top_asset_labels[:2]) or '既有 reusable assets'}。"
    )
    closeout_depth_summary = (
        f"交付回饋 {deliverable_feedback_count}｜已 publish {published_deliverable_count}"
        f"｜deliverable governed {governed_deliverable_candidate_count}"
    )
    writeback_depth_summary = (
        "目前多為 one-off / minimal 案件，沒有 writeback 不算負訊號。"
        if writeback_expected_task_count == 0
        else (
            f"outcome {outcome_record_count}｜writeback events {writeback_generated_event_count}"
            f"｜review-required executions {review_required_execution_count}"
        )
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
        top_asset_codes=normalized_top_asset_codes[:3],
        top_asset_labels=top_asset_labels[:3],
        deliverable_feedback_count=deliverable_feedback_count,
        deliverable_adopted_count=deliverable_adopted_count,
        published_deliverable_count=published_deliverable_count,
        published_adopted_count=published_adopted_count,
        deliverable_candidate_count=deliverable_candidate_count,
        governed_deliverable_candidate_count=governed_deliverable_candidate_count,
        closeout_depth_summary=closeout_depth_summary,
        outcome_record_count=outcome_record_count,
        deliverable_outcome_record_count=deliverable_outcome_record_count,
        follow_up_outcome_count=follow_up_outcome_count,
        writeback_generated_event_count=writeback_generated_event_count,
        review_required_execution_count=review_required_execution_count,
        planned_execution_count=planned_execution_count,
        writeback_expected_task_count=writeback_expected_task_count,
        writeback_depth_summary=writeback_depth_summary,
        summary=summary,
    )
```

- [ ] **Step 5: Extend `_build_phase_six_feedback_linked_snapshot()` in `workbench.py`**

```python
task_ids = {row.task_id for row in feedback_rows} | {row.task_id for row in candidate_rows}
task_rows = (
    db.scalars(select(models.Task).where(models.Task.id.in_(task_ids))).all()
    if task_ids
    else []
)
outcome_rows = (
    db.scalars(select(models.OutcomeRecord).where(models.OutcomeRecord.task_id.in_(task_ids))).all()
    if task_ids
    else []
)
execution_rows = (
    db.scalars(select(models.ActionExecution).where(models.ActionExecution.task_id.in_(task_ids))).all()
    if task_ids
    else []
)
writeback_events = (
    db.scalars(
        select(models.AuditEvent)
        .where(models.AuditEvent.task_id.in_(task_ids))
        .where(models.AuditEvent.event_type == "writeback_generated")
    ).all()
    if task_ids
    else []
)

writeback_expected_task_count = sum(
    1 for row in task_rows if row.writeback_depth == "full"
)
outcome_record_count = len(outcome_rows)
deliverable_outcome_record_count = sum(1 for row in outcome_rows if row.deliverable_id)
follow_up_outcome_count = sum(1 for row in outcome_rows if row.signal_type == "follow_up_run")
review_required_execution_count = sum(1 for row in execution_rows if row.status == "review_required")
planned_execution_count = sum(1 for row in execution_rows if row.status == "planned")
writeback_generated_event_count = len(writeback_events)
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
git commit -m "feat: add phase six writeback snapshot"
```

---

### Task 2: Rewrite Completion Review And Checkpoint To Use Writeback Evidence

**Files:**
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/app/services/phase_six_generalist_governance.py`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/tests/test_phase_six_feedback_scoring.py`

- [ ] **Step 1: Write the failing integration test for writeback bonus**

```python
def test_phase_six_completion_review_reads_outcome_writeback_evidence_for_full_writeback_task(
    client: TestClient,
) -> None:
    payload = {
        "title": "Phase 6 writeback depth",
        "description": "Track whether writeback evidence deepens phase six scoring.",
        "task_type": "contract_review",
        "mode": "specialist",
        "entry_preset": "one_line_inquiry",
        "external_data_strategy": "strict",
        "client_name": "Acme Corp",
        "client_stage": "制度化階段",
        "client_type": "中小企業",
        "engagement_name": "Continuous writeback",
        "workstream_name": "Outcome tracking",
        "domain_lenses": ["法務"],
        "background_text": "Need a reusable review flow with follow-up evidence.",
        "subject_name": "MSA draft",
        "goal_description": "Carry the review through follow-up writeback.",
        "engagement_continuity_mode": "continuous",
        "writeback_depth": "full",
    }
    task = client.post("/api/v1/tasks", json=payload).json()

    client.post(
        f"/api/v1/tasks/{task['id']}/uploads",
        files=[("files", ("agreement.txt", b"Termination and indemnity clauses need review.", "text/plain"))],
    )
    first_run = client.post(f"/api/v1/tasks/{task['id']}/run")
    assert first_run.status_code == 200

    client.post(
        f"/api/v1/tasks/{task['id']}/sources",
        json={
            "urls": [],
            "pasted_text": "Follow-up note: negotiation moved forward and a new revision is required.",
            "pasted_title": "Follow-up outcome note",
        },
    )
    second_run = client.post(f"/api/v1/tasks/{task['id']}/run")
    assert second_run.status_code == 200

    review = client.get("/api/v1/workbench/phase-6-completion-review")
    body = review.json()
    feedback_loop = next(
        item for item in body["scorecard_items"] if item["dimension_code"] == "feedback_loop"
    )

    assert body["feedback_linked_scoring_snapshot"]["outcome_record_count"] >= 1
    assert body["feedback_linked_scoring_snapshot"]["writeback_generated_event_count"] >= 1
    assert "writeback" in feedback_loop["summary"] or "outcome" in feedback_loop["summary"]

    checkpoint = client.post(
        "/api/v1/workbench/phase-6-completion-review/checkpoint",
        json={"operator_label": "王顧問"},
    )
    assert checkpoint.status_code == 200
    assert "writeback" in checkpoint.json()["checkpoint_summary"] or "outcome" in checkpoint.json()["checkpoint_summary"]
```

- [ ] **Step 2: Write the failing boundary test for one-off / minimal cases**

```python
def test_phase_six_completion_review_does_not_penalize_one_off_without_writeback_records(
    client: TestClient,
) -> None:
    task = _create_feedback_task(client, title="One-off no writeback penalty")
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
            "publish_note": "No writeback penalty check",
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

    assert body["feedback_linked_scoring_snapshot"]["writeback_expected_task_count"] == 0
    assert "不算負訊號" in body["feedback_linked_scoring_snapshot"]["writeback_depth_summary"]
```

- [ ] **Step 3: Run the targeted tests to verify they fail**

Run: `PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_phase_six_feedback_scoring.py -q`

Expected:
- FAIL because completion-review scoring and checkpoint summary do not read writeback evidence yet

- [ ] **Step 4: Rewrite `feedback_loop` scoring with a writeback bonus**

```python
base_feedback_loop_score = (
    84
    if has_strong_deliverable_closeout_depth
    or computed_feedback_snapshot.governed_deliverable_candidate_count > 0
    else 68
    if has_deliverable_closeout_depth
    or positive_feedback_count > 0
    or computed_feedback_snapshot.governed_candidate_count > 0
    else 42
)

has_writeback_depth = (
    computed_feedback_snapshot.writeback_expected_task_count > 0
    and (
        computed_feedback_snapshot.outcome_record_count > 0
        or computed_feedback_snapshot.writeback_generated_event_count > 0
        or computed_feedback_snapshot.review_required_execution_count > 0
    )
)

feedback_loop_score = min(94, base_feedback_loop_score + 6) if has_writeback_depth else base_feedback_loop_score
```

```python
summary=(
    f"{computed_feedback_snapshot.summary}"
    f"｜{computed_feedback_snapshot.closeout_depth_summary}"
    f"｜{computed_feedback_snapshot.writeback_depth_summary}"
)
```

- [ ] **Step 5: Rewrite summary and checkpoint persistence text**

```python
feedback_linked_summary = (
    str(checkpoint_state.get("feedback_linked_summary", "")).strip()
    if checkpoint_state and checkpoint_state.get("feedback_linked_summary")
    else (
        f"{effective_feedback_snapshot.summary}"
        f"｜{effective_feedback_snapshot.closeout_depth_summary}"
        f"｜{effective_feedback_snapshot.writeback_depth_summary}"
    )
)
```

```python
checkpoint_summary = (
    (
        f"最近一次 checkpoint 由 {checkpoint_state.get('checkpointed_by_label') or 'owner'} 記錄，"
        f"當時總分 {overall_score}，"
        f"{effective_feedback_snapshot.closeout_depth_summary}｜"
        f"{effective_feedback_snapshot.writeback_depth_summary}。"
    )
    if checkpointed
    else "目前還沒有 recorded checkpoint，可先用這次 scorecard 做第一筆 completion review snapshot。"
)
```

- [ ] **Step 6: Re-run the targeted backend tests**

Run: `PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_phase_six_feedback_scoring.py -q`

Expected:
- PASS

- [ ] **Step 7: Commit the scoring-rewrite slice**

```bash
git add backend/app/services/phase_six_generalist_governance.py \
  backend/tests/test_phase_six_feedback_scoring.py
git commit -m "feat: deepen phase six writeback scoring"
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
test("phase 6 feedback writeback depth summary stays low-noise and readable", () => {
  assert.equal(
    summarizePhaseSixFeedbackWritebackDepth({
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
        outcomeRecordCount: 2,
        deliverableOutcomeRecordCount: 1,
        followUpOutcomeCount: 1,
        writebackGeneratedEventCount: 4,
        reviewRequiredExecutionCount: 1,
        plannedExecutionCount: 2,
        writebackExpectedTaskCount: 1,
        writebackDepthSummary: "outcome 2｜writeback events 4｜review-required executions 1",
        summary: "summary",
      },
    }),
    "outcome 2｜writeback events 4｜review-required executions 1",
  );
});
```

- [ ] **Step 2: Run the targeted frontend test to verify it fails**

Run: `cd frontend && node --test tests/phase-six-governance.test.mjs`

Expected:
- FAIL because the new helper and snapshot fields do not exist yet

- [ ] **Step 3: Extend frontend types and API parsing**

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
  outcomeRecordCount: number;
  deliverableOutcomeRecordCount: number;
  followUpOutcomeCount: number;
  writebackGeneratedEventCount: number;
  reviewRequiredExecutionCount: number;
  plannedExecutionCount: number;
  writebackExpectedTaskCount: number;
  writebackDepthSummary: string;
  summary: string;
}
```

```typescript
outcomeRecordCount: Number(payload.feedback_linked_scoring_snapshot?.outcome_record_count ?? 0),
deliverableOutcomeRecordCount: Number(
  payload.feedback_linked_scoring_snapshot?.deliverable_outcome_record_count ?? 0,
),
followUpOutcomeCount: Number(
  payload.feedback_linked_scoring_snapshot?.follow_up_outcome_count ?? 0,
),
writebackGeneratedEventCount: Number(
  payload.feedback_linked_scoring_snapshot?.writeback_generated_event_count ?? 0,
),
reviewRequiredExecutionCount: Number(
  payload.feedback_linked_scoring_snapshot?.review_required_execution_count ?? 0,
),
plannedExecutionCount: Number(
  payload.feedback_linked_scoring_snapshot?.planned_execution_count ?? 0,
),
writebackExpectedTaskCount: Number(
  payload.feedback_linked_scoring_snapshot?.writeback_expected_task_count ?? 0,
),
writebackDepthSummary:
  payload.feedback_linked_scoring_snapshot?.writeback_depth_summary || "",
```

- [ ] **Step 4: Add a low-noise helper and surface it in homepage completion-review card**

```typescript
export function summarizePhaseSixFeedbackWritebackDepth(
  review: Pick<
    {
      feedbackLinkedScoringSnapshot: {
        writebackDepthSummary: string;
      };
    },
    "feedbackLinkedScoringSnapshot"
  >,
) {
  return (
    review.feedbackLinkedScoringSnapshot.writebackDepthSummary ||
    "目前還沒有可讀取的 outcome / writeback evidence。"
  );
}
```

```tsx
<p className="muted-text" style={{ marginTop: "8px" }}>
  {summarizePhaseSixFeedbackWritebackDepth(phaseSixCompletionReview)}
</p>
```

- [ ] **Step 5: Update active docs**

```md
- `7.2` 第三刀現在也正式補到：
  - Host-generated outcome / writeback evidence
  - 但仍不等於 KPI attribution
- one-off / minimal 案件不應因 absence of writeback 被錯誤視為失敗
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
## Entry: 2026-04-09 phase-6 feedback-linked persisted scoring outcome and writeback evidence

- Scope:
  - extend `7.2` from deliverable closeout depth to Host-generated outcome/writeback evidence
  - keep KPI / business outcome attribution out of scope
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
git commit -m "docs: align phase six writeback scoring"
git push origin codex/docs06-roadmap
```

---

### Self-Review

- [ ] Spec coverage: this plan only implements Host-generated outcome/writeback evidence, not KPI/business outcome attribution
- [ ] Placeholder scan: no `TODO`, `TBD`, or vague “handle edge cases” wording remains
- [ ] Type consistency: the expanded feedback snapshot keeps one contract family across backend schema, API parsing, frontend types, and checkpoint persistence
- [ ] Scope safety: no task crosses into business KPI attribution, subjective quality ranking, or a new dashboard family
- [ ] Boundary safety: one-off / minimal cases are protected by `writeback_expected_task_count` so absence of writeback is not treated as universal failure
