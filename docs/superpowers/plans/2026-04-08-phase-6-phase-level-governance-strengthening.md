# Phase 6 Phase-Level Governance Strengthening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `7.15` 收斂成一個安全可驗證的 phase-level 補強：讓 `Phase 6` 首頁治理層與既有 `phase-6-*` route family 的語意正式對齊 `7.1` 已落地的工作面 runtime，並誠實保留 `7.2` 尚未補滿的 scoring depth。

**Architecture:** 不新增新的 public route family，也不改寫 `task / matter / deliverable` 的既有 case-aware contract。backend 在既有 `phase_six_generalist_governance.py` / `workbench.py` 內補一條 internal alignment layer，統一 phase-level summaries、boundary notes 與 recommended next step；frontend 只在首頁 `Generalist Governance` 補一條更低噪音的 alignment summary，並整理既有 copy，不新增 dashboard family。

**Tech Stack:** FastAPI, SQLAlchemy, Pydantic, pytest, Next.js, node test, active docs under `docs/`

---

## File Structure

- Create: `/Users/oldtien_base/Desktop/Infinite Pro/backend/tests/test_phase_six_phase_level_governance_alignment.py`
  - 專門承接 `7.15` phase-level alignment regression，不把新測試再塞回超長的 `test_mvp_slice.py`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/app/services/phase_six_generalist_governance.py`
  - 補 internal alignment snapshot / helper，統一 phase-level route 的 summary / boundary / next step
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/app/services/workbench.py`
  - 集中組 phase-level alignment inputs，再把它傳進既有 phase-6 builders
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/lib/phase-six-governance.ts`
  - 補首頁 alignment summary helper，保持 low-noise 與 consultant-readable
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/components/workbench-home.tsx`
  - 只整理既有 `Generalist Governance` 的 phase posture 區塊，不新增新頁或新 dashboard family
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/tests/phase-six-governance.test.mjs`
  - 補 alignment summary regression
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/01_runtime_architecture_and_data_contracts.md`
  - 補 `7.15` 的 runtime / review layer 定位與 boundary
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/06_product_alignment_and_85_point_roadmap.md`
  - 明確標記 `7.15` 的角色與與 `7.2` 的邊界
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/04_qa_matrix.md`
  - 只在真實驗證完成後追加 evidence

---

### Task 1: Backend Phase-Level Alignment Layer

**Files:**
- Create: `/Users/oldtien_base/Desktop/Infinite Pro/backend/tests/test_phase_six_phase_level_governance_alignment.py`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/app/services/phase_six_generalist_governance.py`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/app/services/workbench.py`

- [ ] **Step 1: Write the failing backend regression**

```python
from fastapi.testclient import TestClient


def test_phase_six_phase_level_reviews_explain_work_surface_and_scoring_boundary(
    client: TestClient,
) -> None:
    maturity = client.get("/api/v1/workbench/phase-6-maturity-review")
    closure = client.get("/api/v1/workbench/phase-6-closure-criteria")
    completion = client.get("/api/v1/workbench/phase-6-completion-review")

    assert maturity.status_code == 200
    assert closure.status_code == 200
    assert completion.status_code == 200

    maturity_body = maturity.json()
    closure_body = closure.json()
    completion_body = completion.json()

    assert "工作面已正式落地" in maturity_body["summary"]
    assert "工作面已正式落地" in closure_body["summary"]
    assert "治理評分" in closure_body["recommended_next_step"]
    assert "治理評分" in completion_body["recommended_next_step"]


def test_phase_six_closeout_review_keeps_phase_level_review_boundary_visible(
    client: TestClient,
) -> None:
    response = client.get("/api/v1/workbench/phase-6-closeout-review")

    assert response.status_code == 200
    payload = response.json()

    assert "階段層" in payload["summary"] or "階段層" in payload["recommended_next_step"]
    assert "工作面更直接感受到" in payload["recommended_next_step"]
```

- [ ] **Step 2: Run the targeted backend test to verify it fails**

Run: `PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_phase_six_phase_level_governance_alignment.py -q`

Expected:
- FAIL because current phase-level builders still use mostly fixed global summary / next-step wording
- at least one assertion about「工作面已正式落地」或「治理評分」應該會失敗

- [ ] **Step 3: Add an internal alignment snapshot in the governance service**

```python
from dataclasses import dataclass


@dataclass(frozen=True)
class PhaseSixPhaseLevelAlignmentSnapshot:
    phase_level_boundary_note: str
    work_surface_landed_summary: str
    scoring_pending_summary: str


def build_phase_six_phase_level_alignment_snapshot(
    *,
    feedback_signal_count: int,
    governed_outcome_count: int,
    feedback_snapshot: schemas.PhaseSixFeedbackLinkedScoringSnapshotRead | None = None,
) -> PhaseSixPhaseLevelAlignmentSnapshot:
    del feedback_signal_count
    del governed_outcome_count
    del feedback_snapshot

    return PhaseSixPhaseLevelAlignmentSnapshot(
        phase_level_boundary_note="這裡是 Phase 6 的階段層 review，不是案件計分引擎。",
        work_surface_landed_summary="三個正式工作面已正式落地。",
        scoring_pending_summary="下一刀應把採用回饋證據更正式接回治理評分。",
    )
```

- [ ] **Step 4: Thread the alignment snapshot through workbench route builders**

```python
def _build_phase_six_phase_level_alignment_snapshot(
    db: Session,
) -> PhaseSixPhaseLevelAlignmentSnapshot:
    feedback_signal_count = int(
        db.scalar(select(func.count()).select_from(models.AdoptionFeedback)) or 0
    )
    governed_outcome_count = int(
        db.scalar(
            select(func.count())
            .select_from(models.PrecedentCandidate)
            .where(models.PrecedentCandidate.candidate_status.in_(["promoted", "dismissed"]))
        )
        or 0
    )
    feedback_snapshot = _build_phase_six_feedback_linked_snapshot(db)
    return build_phase_six_phase_level_alignment_snapshot(
        feedback_signal_count=feedback_signal_count,
        governed_outcome_count=governed_outcome_count,
        feedback_snapshot=feedback_snapshot,
    )


def get_phase_six_maturity_review(
    db: Session,
) -> schemas.PhaseSixMaturityReviewResponse:
    alignment = _build_phase_six_phase_level_alignment_snapshot(db)
    return build_phase_six_maturity_review(alignment=alignment)
```

```python
def build_phase_six_maturity_review(
    *,
    alignment: PhaseSixPhaseLevelAlignmentSnapshot | None = None,
) -> schemas.PhaseSixMaturityReviewResponse:
    source_alignment = alignment or build_phase_six_phase_level_alignment_snapshot(
        feedback_signal_count=0,
        governed_outcome_count=0,
    )
    return schemas.PhaseSixMaturityReviewResponse(
        ...,
        summary=(
            "Phase 6 已進入收斂深化；"
            f"{source_alignment.work_surface_landed_summary}"
        ),
        recommended_next_step=source_alignment.scoring_pending_summary,
    )
```

- [ ] **Step 5: Apply the same alignment layer to closure / completion / closeout builders**

```python
def build_phase_six_closure_criteria_review(
    *,
    feedback_signal_count: int,
    governed_outcome_count: int,
    alignment: PhaseSixPhaseLevelAlignmentSnapshot | None = None,
) -> schemas.PhaseSixClosureCriteriaReviewResponse:
    source_alignment = alignment or build_phase_six_phase_level_alignment_snapshot(
        feedback_signal_count=feedback_signal_count,
        governed_outcome_count=governed_outcome_count,
    )
    return schemas.PhaseSixClosureCriteriaReviewResponse(
        ...,
        summary=(
            "Phase 6 現在已能正式回答 closure criteria；"
            f"{source_alignment.work_surface_landed_summary}"
        ),
        recommended_next_step=source_alignment.scoring_pending_summary,
    )
```

```python
def build_phase_six_closeout_review(
    *,
    completion_review: schemas.PhaseSixCompletionReviewResponse,
    alignment: PhaseSixPhaseLevelAlignmentSnapshot | None = None,
) -> schemas.PhaseSixCloseoutReviewResponse:
    source_alignment = alignment or build_phase_six_phase_level_alignment_snapshot(
        feedback_signal_count=0,
        governed_outcome_count=0,
    )
    return schemas.PhaseSixCloseoutReviewResponse(
        ...,
        summary=(
            f"{source_alignment.phase_level_boundary_note}"
            " 目前 phase 6 已站穩 governance foundation。"
        ),
        recommended_next_step=(
            "下一階段先做 consultant operating leverage framing。"
            if completion_review.sign_off_status == "signed_off"
            else source_alignment.scoring_pending_summary
        ),
    )
```

- [ ] **Step 6: Re-run the targeted backend test**

Run: `PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_phase_six_phase_level_governance_alignment.py -q`

Expected:
- PASS

- [ ] **Step 7: Commit the backend slice**

```bash
git add backend/tests/test_phase_six_phase_level_governance_alignment.py \
  backend/app/services/phase_six_generalist_governance.py \
  backend/app/services/workbench.py
git commit -m "feat: align phase six phase-level reviews"
```

---

### Task 2: Homepage Generalist Governance Alignment Summary

**Files:**
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/lib/phase-six-governance.ts`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/src/components/workbench-home.tsx`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/frontend/tests/phase-six-governance.test.mjs`

- [ ] **Step 1: Write the failing frontend regression**

```javascript
test("phase 6 phase-level alignment summary stays low-noise and readable", () => {
  assert.equal(
    summarizePhaseSixPhaseLevelAlignment({
      phasePostureLabel: "已進入收斂深化",
      workSurfaceSummary: "三個正式工作面已正式落地。",
      remainingNextStep: "下一刀先補治理評分深度。",
    }),
    "已進入收斂深化｜三個正式工作面已正式落地。｜下一刀先補治理評分深度。",
  );
});
```

- [ ] **Step 2: Run the frontend test to verify it fails**

Run: `cd frontend && node --test tests/phase-six-governance.test.mjs`

Expected:
- FAIL because `summarizePhaseSixPhaseLevelAlignment` does not exist yet

- [ ] **Step 3: Add a single low-noise alignment helper**

```typescript
export function summarizePhaseSixPhaseLevelAlignment(input: {
  phasePostureLabel: string;
  workSurfaceSummary: string;
  remainingNextStep: string;
}) {
  return [
    input.phasePostureLabel,
    input.workSurfaceSummary,
    input.remainingNextStep,
  ]
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3)
    .join("｜");
}
```

- [ ] **Step 4: Use the helper in `workbench-home.tsx` without growing a new dashboard family**

```tsx
const phaseSixAlignmentSummary =
  phaseSixMaturity && phaseSixCompletionReview
    ? summarizePhaseSixPhaseLevelAlignment({
        phasePostureLabel: labelForPhaseSixMaturityStage(phaseSixMaturity.maturityStage),
        workSurfaceSummary:
          phaseSixCloseoutReview?.foundationSnapshot ||
          "三個正式工作面已正式落地。",
        remainingNextStep:
          phaseSixCompletionReview.recommendedNextStep ||
          phaseSixClosureCriteria?.recommendedNextStep ||
          "",
      })
    : "";
```

```tsx
<p className="panel-copy">
  低噪音回答 Phase 6 現在在哪、工作面已落地到哪、下一刀還差什麼。
</p>

{phaseSixAlignmentSummary ? (
  <div className="section-card" style={{ marginBottom: "16px" }}>
    <h3>目前階段姿態</h3>
    <p className="muted-text">{phaseSixAlignmentSummary}</p>
  </div>
) : null}
```

- [ ] **Step 5: Re-run the targeted frontend tests**

Run: `cd frontend && node --test tests/phase-six-governance.test.mjs tests/intake-progress.test.mjs`

Expected:
- PASS

- [ ] **Step 6: Commit the frontend slice**

```bash
git add frontend/src/lib/phase-six-governance.ts \
  frontend/src/components/workbench-home.tsx \
  frontend/tests/phase-six-governance.test.mjs
git commit -m "feat: align phase six governance summary"
```

---

### Task 3: Active Docs, QA Evidence, And Full Verification

**Files:**
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/01_runtime_architecture_and_data_contracts.md`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/06_product_alignment_and_85_point_roadmap.md`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/04_qa_matrix.md`

- [ ] **Step 1: Update the runtime architecture doc**

```md
- roadmap-side `7.15` 在這一輪只代表：
  - `7.1` 與 `7.2` 之間的 phase-level governance strengthening
- 這一刀只補 `Generalist Governance` 與既有 `phase-6-*` route family 的 alignment
- `7.1` 已正式成立於 `task / matter / deliverable`
- 這一刀不是新的 dashboard family，也不是 `7.2` scoring expansion
```

- [ ] **Step 2: Update the roadmap alignment doc**

```md
- `7.15` 已被正式定義為：
  - `7.1` 與 `7.2` 之間的 phase-level governance strengthening
- 正式目的不是再擴新功能，而是把 phase-level review、work-surface landed runtime、以及 `7.2` pending scoring depth 說清楚
```

- [ ] **Step 3: Run the full verification set**

Run:
- `PYTHONPATH=backend .venv312/bin/python -m compileall backend/app`
- `PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_phase_six_phase_level_governance_alignment.py -q`
- `PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_mvp_slice.py -q`
- `cd frontend && node --test tests/phase-six-governance.test.mjs tests/intake-progress.test.mjs`
- `cd frontend && rm -f .next/cache/.tsbuildinfo && mkdir -p .next/types && npx next typegen && npm run typecheck`
- `cd frontend && npm run build`

Expected:
- backend compile PASS
- targeted `7.15` backend regression PASS
- broader backend regression PASS
- frontend targeted tests PASS
- frontend typecheck PASS
- frontend build PASS

- [ ] **Step 4: Append the QA matrix only after the real runs pass**

```md
## Entry: 2026-04-08 phase-6 phase-level governance strengthening

- Scope:
  - align `Generalist Governance` phase-level review language with `7.1` landed work surfaces
  - keep `7.2` scoring depth explicitly out of scope
- Verification:
  - `PYTHONPATH=backend .venv312/bin/python -m compileall backend/app`
  - `PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_phase_six_phase_level_governance_alignment.py -q`
  - `PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_mvp_slice.py -q`
  - `cd frontend && node --test tests/phase-six-governance.test.mjs tests/intake-progress.test.mjs`
  - `cd frontend && rm -f .next/cache/.tsbuildinfo && mkdir -p .next/types && npx next typegen && npm run typecheck`
  - `cd frontend && npm run build`
```

- [ ] **Step 5: Commit docs and QA alignment**

```bash
git add docs/01_runtime_architecture_and_data_contracts.md \
  docs/06_product_alignment_and_85_point_roadmap.md \
  docs/04_qa_matrix.md
git commit -m "docs: align phase six governance strengthening"
```

- [ ] **Step 6: Push the branch so local and GitHub stay synchronized**

```bash
git push origin codex/docs06-roadmap
```

---

### Self-Review

- [ ] Spec coverage: this plan implements only `7.15` phase-level governance strengthening and keeps `7.2` scoring expansion out of scope
- [ ] Placeholder scan: no `TODO`, `TBD`, or vague “handle edge cases” wording remains
- [ ] Type consistency: no new public schema or public route family is introduced; backend alignment helper stays internal and homepage helper stays low-noise
