# Sparse Intake Diagnostic Lane Design

Status: draft for review

Date: 2026-04-03

Owner: Codex + user

## 1. Why this is the first optimization

Infinite Pro's current runtime already supports:

- one-line inquiry intake
- provisional case-world compilation
- exploratory deliverable posture
- follow-up supplements that return to the same matter world
- continuity and writeback policies

What is still missing is productization.

Right now, the system can technically handle sparse-start consulting work, but it still asks the consultant to translate real work into internal workflow labels too early. For the user's actual operating model, that is backwards.

The first flagship workflow should therefore be:

> Start with limited information, form a first diagnostic judgment quickly, show what is missing, and create a formal first deliverable that can later deepen into follow-up or continuous advisory work.

This aligns with the user's real work:

- some cases start with very little information
- some cases need only a first formal report
- some cases later deepen into ongoing support
- the same consultant may work across multiple domains and industries

## 2. Alternatives considered

### Option A. Sparse-intake diagnostic lane first

Make one-line and low-information cases feel like a first-class consulting workflow.

Pros:

- strongest fit for the user's actual intake reality
- builds on existing world-first runtime instead of replacing it
- improves first-use clarity without adding a new architecture layer
- creates the right base for later research and retainer improvements

Cons:

- does not yet fully mature the external research lane
- does not yet fully productize long-term advisory loops

### Option B. Research lane first

Deepen the research and investigation system before improving entry flow.

Pros:

- strong value for ambiguous and external-heavy cases
- useful for trend, market, and policy-sensitive work

Cons:

- fixes the middle of the workflow before the start of the workflow
- risks making the product feel like a research tool instead of a consulting workbench
- does not solve first-run clarity for sparse-start cases

### Option C. Continuous advisory loop first

Prioritize retained, ongoing client work before sparse-start work.

Pros:

- strong value for long-running engagements
- moves toward retained advisory productization

Cons:

- weaker fit for the first moment when most new matters begin
- depends on a cleaner first diagnostic start than the product currently provides

## 3. Recommendation

Choose Option A first.

Plain-language reason:

- many real consulting matters start with little information
- if the product cannot make that first moment feel natural, the rest of the system feels harder than it should
- once the first diagnostic start is strong, the same matter can naturally deepen into research, follow-up, or continuous work

## 4. Product goal

When the consultant starts with only a rough question or thin material, Infinite Pro should:

1. help them open a matter without forcing system-jargon choices up front
2. classify the case as a diagnostic-style start
3. form a provisional but honest first case world
4. make the next best action obvious
5. produce a formal first deliverable that is clearly framed as exploratory or assessment-grade
6. allow the matter to deepen later without breaking continuity

## 5. Non-goals for this phase

This phase does not:

- add a seventh architecture layer
- create a separate research app shell
- create a separate retainer app shell
- introduce multi-user or enterprise governance features
- replace Host with frontend workflow logic
- pretend sparse-start cases already have full certainty

## 6. Recommended design

### 6.1 Keep one intake surface, but simplify the first decision

The visible intake should stop leading with internal workflow categories such as:

- research synthesis
- contract review
- document restructuring
- multi-agent convergence

Those are valid internal execution paths, but they are too implementation-shaped for the first screen.

Instead, the first question should be outcome-first and consultant-first.

Recommended top-level choices:

- 先快速看清問題與下一步
- 先審閱手上已有材料
- 先比較方案並收斂決策

System rule:

- these are not new architecture layers
- these are not new ontology worlds
- they are a clearer product entry language mapped onto existing runtime paths

Advanced workflow override should remain available, but behind disclosure.

### 6.2 Introduce a derived flagship-lane contract

Add a derived runtime/read-model concept that expresses the consultant-facing starting posture.

Initial values:

- `diagnostic_start`
- `material_review_start`
- `decision_convergence_start`

For this phase, only `diagnostic_start` is fully productized.

Important rule:

- this is a derived workflow-facing contract
- not a new architecture layer
- not a replacement for `Capability`, `Pack`, or `Agent`

Suggested response fields:

- `flagship_lane`
- `flagship_lane_label`
- `flagship_lane_summary`
- `flagship_next_step_summary`
- `flagship_upgrade_note`

These should be computed from existing signals such as:

- `input_entry_mode`
- `deliverable_class_hint`
- `suggested_research_need`
- `presence_state_summary`
- `next_best_actions`
- continuity mode and writeback depth

### 6.3 Make sparse-start matters clearly diagnostic by default

For `diagnostic_start`, the runtime should emphasize:

- provisional world formation
- missing-object honesty
- conservative agent selection
- exploratory or assessment-grade deliverable class
- explicit next-step guidance for supplementing evidence

This should strengthen existing behavior, not replace it.

The system already has much of this logic. The product pass should make it easier to understand and more consistent across surfaces.

### 6.4 Make the mainline visible across workspaces

The following pages should all speak the same first-workflow language:

- `/new`
- `/matters/[matterId]`
- `/matters/[matterId]/evidence`
- `/tasks/[taskId]`
- `/deliverables/[deliverableId]`

For `diagnostic_start`, each page should clearly answer:

- what kind of case this is right now
- what is already strong enough to proceed
- what is still missing
- what the next best step is
- what kind of deliverable the consultant should expect at this stage

This should be reflected in existing hero, right-rail, and first-screen summary patterns rather than adding a new console.

### 6.5 Preserve continuity into later phases

The first workflow must not trap the matter in a "quick answer only" dead end.

It should be able to deepen into:

- richer research
- follow-up checkpoints
- continuous advisory progression

The first implementation should therefore include clear upgrade language such as:

- what to add next
- when to reopen
- when to move from first diagnosis to stronger evidence-backed convergence

## 7. Implementation scope for the first pass

### Backend

- add derived flagship-lane fields to task and matter read models
- centralize mapping from existing runtime signals to consultant-facing lane summaries
- tighten sparse-start next-step guidance so it is consistent across task and matter serialization
- avoid DB migrations unless a derived read model proves insufficient

### Frontend

- rewrite intake first-screen wording around consultant outcomes rather than raw workflow labels
- keep advanced execution-path override in disclosure
- surface `diagnostic_start` posture clearly on matter, task, evidence, and deliverable first screens
- make "what to do next" more consistent for sparse-start cases

### Docs

Update active docs when implementation lands:

- [docs/00_product_definition_and_current_state.md](/Users/oldtien_base/Desktop/Infinite Pro/docs/00_product_definition_and_current_state.md)
- [docs/01_runtime_architecture_and_data_contracts.md](/Users/oldtien_base/Desktop/Infinite Pro/docs/01_runtime_architecture_and_data_contracts.md)
- [docs/03_workbench_ux_and_page_spec.md](/Users/oldtien_base/Desktop/Infinite Pro/docs/03_workbench_ux_and_page_spec.md)
- [docs/04_qa_matrix.md](/Users/oldtien_base/Desktop/Infinite Pro/docs/04_qa_matrix.md)

This research doc is not an active source of truth. It is the implementation design note that should later be reflected into the active docs above.

## 8. Verification plan

Minimum required verification when implementation starts:

- backend `python3 -m compileall backend/app`
- backend `PYTHONPATH=backend .venv312/bin/python -m pytest backend/tests/test_mvp_slice.py -q`
- frontend `npm run build`
- frontend `npm run typecheck`
- live smoke for:
  - sparse-start intake on `/new`
  - matter first screen after create
  - task page first screen
  - deliverable page first screen

QA evidence should only be added to the active QA matrix after real verification exists.

## 9. Git and sync protocol for this work

This repo should keep code, docs, and Git history aligned.

Implementation rule for this optimization:

1. update runtime and UI code
2. update active docs in the same phase
3. run verification
4. commit locally with a focused message
5. push the branch to GitHub

## 10. What comes next after this phase

If this first flagship workflow lands well, the next recommended phases remain:

1. formalize the research and investigation lane
2. productize retained follow-up and continuous advisory loops
3. deepen reusable consultant memory, precedent, and playbook structures
