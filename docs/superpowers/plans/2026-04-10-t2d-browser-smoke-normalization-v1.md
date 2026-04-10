# T2-D Browser Smoke Normalization V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `T2-D slice 2` 落成 `browser smoke normalization v1`：讓 `browser_smoke` 從抽象 target list 變成更完整、profile-aware、可記錄 evidence 的 smoke manifest，同時維持 operator-assisted posture，不把這刀拉成 full automation platform。

**Architecture:** 保留 `backend/scripts/run_release_readiness.py` 作為唯一 repo-native release-readiness entrypoint，不新增第二支 smoke script。實作上先擴充 `browser_smoke` payload 的 manifest shape 與 tests，再同步 README、`docs/04`、`docs/06` 的 smoke terminology，最後用一次真實 operator-assisted browser run 補 QA evidence；dynamic target 只做誠實的 list-to-detail entry，不假設固定 task id。

**Tech Stack:** Python 3.12, pytest, existing release-readiness script, README, active docs under `docs/`, operator-assisted browser verification via Playwright MCP

---

## File Structure

- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/scripts/run_release_readiness.py`
  - Deepen the `browser_smoke` payload into a richer manifest with required/optional, entry kind, path template, entry path, and evidence expectation
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/tests/test_release_readiness_script.py`
  - Extend script tests for the normalized smoke-manifest shape and dynamic-entry rules
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/README.md`
  - Clarify how the operator-assisted browser smoke layer should be run and recorded
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/04_qa_matrix.md`
  - Append real browser-smoke evidence using the normalized format after actual verification
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/06_product_alignment_and_85_point_roadmap.md`
  - Mark `T2-D slice 2` as landed after behavior and evidence are real

---

### Task 1: Normalize The Browser-Smoke Manifest Contract

**Files:**
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/scripts/run_release_readiness.py`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/tests/test_release_readiness_script.py`

- [ ] **Step 1: Write failing tests for the richer smoke manifest**

Append these tests to `backend/tests/test_release_readiness_script.py`:

```python
def test_browser_smoke_targets_include_required_and_optional_lanes() -> None:
    targets = release_readiness.build_browser_smoke_targets("docker-compose")

    assert [item["label"] for item in targets] == [
        "overview_focus_return",
        "new_matter_entry",
        "matters_list",
        "deliverables_list",
        "task_detail_operating_surface",
    ]
    assert [item["required"] for item in targets] == [True, True, True, True, False]
    assert [item["entry_kind"] for item in targets] == [
        "direct-route",
        "direct-route",
        "direct-route",
        "direct-route",
        "list-to-detail",
    ]


def test_browser_smoke_targets_record_dynamic_entry_for_task_detail() -> None:
    task_target = release_readiness.build_browser_smoke_targets("standalone")[-1]

    assert task_target["label"] == "task_detail_operating_surface"
    assert task_target["path_template"] == "/tasks/[taskId]"
    assert task_target["entry_path"] == "/matters"
    assert task_target["mode"] == "operator-assisted"
    assert "operating summary" in task_target["evidence_expectation"]
```

- [ ] **Step 2: Run the targeted pytest to verify RED**

Run:

```bash
PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_release_readiness_script.py -q
```

Expected:

- FAIL because `build_browser_smoke_targets(...)` still returns the older, flatter shape without `required`, `entry_kind`, `path_template`, `entry_path`, or `evidence_expectation`

- [ ] **Step 3: Deepen the smoke manifest shape in the script**

Update `backend/scripts/run_release_readiness.py` so `build_browser_smoke_targets(...)` returns `list[dict[str, object]]` and uses a normalized contract:

```python
def build_browser_smoke_targets(profile: str) -> list[dict[str, object]]:
    normalized = profile.strip().lower()
    if normalized not in {"standalone", "docker-compose"}:
        raise ValueError(f"Unsupported browser smoke profile: {profile}")

    return [
        {
            "label": "overview_focus_return",
            "required": True,
            "entry_kind": "direct-route",
            "path_template": "/",
            "entry_path": "/",
            "intent": "確認首頁仍能把顧問送回主工作面",
            "evidence_expectation": "記錄首頁 primary action block 與 section guide 仍可讀。",
            "mode": "operator-assisted",
        },
        {
            "label": "new_matter_entry",
            "required": True,
            "entry_kind": "direct-route",
            "path_template": "/new",
            "entry_path": "/new",
            "intent": "確認正式進件入口仍可進入 canonical intake",
            "evidence_expectation": "記錄 intake 首屏可見且可進入正式進件主線。",
            "mode": "operator-assisted",
        },
        {
            "label": "matters_list",
            "required": True,
            "entry_kind": "direct-route",
            "path_template": "/matters",
            "entry_path": "/matters",
            "intent": "確認案件列表仍可作為主工作面入口",
            "evidence_expectation": "記錄案件列表可見且可進入案件工作面。",
            "mode": "operator-assisted",
        },
        {
            "label": "deliverables_list",
            "required": True,
            "entry_kind": "direct-route",
            "path_template": "/deliverables",
            "entry_path": "/deliverables",
            "intent": "確認交付物主工作面仍可進入正式結果閱讀",
            "evidence_expectation": "記錄交付物列表可見且能作為正式結果入口。",
            "mode": "operator-assisted",
        },
        {
            "label": "task_detail_operating_surface",
            "required": False,
            "entry_kind": "list-to-detail",
            "path_template": "/tasks/[taskId]",
            "entry_path": "/matters",
            "intent": "確認 task detail 仍維持 operating summary 與低噪音主線",
            "evidence_expectation": "若列表中有可進入的 task，記錄 operating summary 與 condensed notes 是否仍成立。",
            "mode": "operator-assisted",
        },
    ]
```

Keep the existing `profile` and `mode` payload wrapping in `main()`, but let `payload["browser_smoke"]["targets"]` now expose this richer shape.

- [ ] **Step 4: Re-run the targeted pytest to verify GREEN**

Run:

```bash
PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_release_readiness_script.py -q
```

Expected:

- PASS for the richer smoke-manifest tests plus the existing release-readiness tests

- [ ] **Step 5: Commit the manifest-normalization slice**

```bash
git add backend/scripts/run_release_readiness.py \
  backend/tests/test_release_readiness_script.py
git commit -m "feat: normalize t2d browser smoke manifest"
```

Expected:

- commit succeeds with the richer smoke-manifest shape and tests

---

### Task 2: Normalize Docs And Smoke-Evidence Language

**Files:**
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/README.md`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/06_product_alignment_and_85_point_roadmap.md`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/04_qa_matrix.md`

- [ ] **Step 1: Update README with the normalized operator-assisted smoke explanation**

In `README.md`, replace the current single bullet under `browser smoke` with:

```md
- `browser smoke`
  - operator-assisted consultant-facing flow checks against the normalized smoke manifest
  - required direct-route targets:
    - `/`
    - `/new`
    - `/matters`
    - `/deliverables`
  - optional dynamic-entry target:
    - `/tasks/[taskId]`, entered from `/matters` when a visible task row is available
```

- [ ] **Step 2: Update `docs/06` progress under `11.4 T2-D`**

Append this progress note to `/Users/oldtien_base/Desktop/Infinite Pro/docs/06_product_alignment_and_85_point_roadmap.md`:

```md
- 第二刀已正式落地成 `browser smoke normalization v1`
- `browser_smoke` 現在不再只是抽象 target list，而是有 `required/optional`、`entry_kind`、`entry_path`、`evidence_expectation` 的 normalized smoke manifest
- operator-assisted smoke evidence 也開始有較一致的記錄格式，而不是只寫「有跑 / 沒跑」
```

- [ ] **Step 3: Prepare the `docs/04` entry shell without claiming results yet**

Append this entry skeleton to `/Users/oldtien_base/Desktop/Infinite Pro/docs/04_qa_matrix.md`, but fill the results only after the real verification in Task 3:

```md
## Entry: 2026-04-10 T2-D browser smoke normalization v1

Scope:
- deepen `browser_smoke` from a flat target list into a normalized smoke manifest
- standardize required vs optional smoke lanes and dynamic-entry expectations
- record at least one real operator-assisted browser smoke pass using the new manifest language

Environment used:
- repo-native release-readiness verification
- operator-assisted local browser smoke
```

Do not add fake results yet.

- [ ] **Step 4: Commit the doc-normalization pre-work after the README and roadmap text are in place**

```bash
git add README.md \
  docs/06_product_alignment_and_85_point_roadmap.md \
  docs/04_qa_matrix.md
git commit -m "docs: prepare t2d browser smoke normalization"
```

Expected:

- commit succeeds with README / roadmap wording updated and the QA entry shell added

---

### Task 3: Run Real Operator-Assisted Browser Smoke And Record Evidence

**Files:**
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/04_qa_matrix.md`

- [ ] **Step 1: Re-run the script verification before browser work**

Run:

```bash
PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_release_readiness_script.py -q
PYTHONPATH=backend .venv312/bin/python backend/scripts/run_release_readiness.py --tier runtime --runtime-profile docker-compose
git diff --check
```

Expected:

- script pytest PASS
- docker-compose runtime profile PASS
- `git diff --check` PASS

- [ ] **Step 2: Run the required direct-route browser smoke targets**

Use Playwright MCP on the currently running local runtime with this exact sequence:

1. Navigate to `http://127.0.0.1:3000/`
2. Navigate to `http://127.0.0.1:3000/new`
3. Navigate to `http://127.0.0.1:3000/matters`
4. Navigate to `http://127.0.0.1:3000/deliverables`

For each page, capture:

- page reached or not
- whether the expected mainline is visible
- whether the page still reads like the intended consultant-facing surface

- [ ] **Step 3: Attempt the optional dynamic-entry target from `/matters`**

From `http://127.0.0.1:3000/matters`:

- if a visible task link exists, open the first `/tasks/<id>` detail page
- verify that the task detail page still shows:
  - the first-screen task mainline
  - the low-noise operating summary
  - condensed second-layer reading

If no visible task link exists, record this as:

- `optional target not run`
- reason: `no visible task row available from matters list during smoke window`

Do not fabricate a task id.

- [ ] **Step 4: Fill the new `docs/04` entry with the real smoke evidence**

Complete the new QA entry using this structure:

```md
### Build / Typecheck / Compile

| Check | Result |
| --- | --- |
| `PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_release_readiness_script.py -q` | Passed |
| `PYTHONPATH=backend .venv312/bin/python backend/scripts/run_release_readiness.py --tier runtime --runtime-profile docker-compose` | Passed |
| `git diff --check` | Passed |

### T2-D browser smoke normalization verification

| Area | Page / Flow | Action | Status | Notes |
| --- | --- | --- | --- | --- |
| Browser smoke manifest | required direct-route targets | Verify `/`, `/new`, `/matters`, `/deliverables` against the normalized manifest | Verified | note which required targets were reached and whether their expected consultant-facing mainline was visible |
| Browser smoke manifest | optional dynamic-entry target | Attempt `/tasks/[taskId]` through `/matters` list-to-detail entry | Verified or Limited | if reached, note the operating summary / condensed notes; if not reached, record the exact reason instead of claiming pass |
| Runtime posture | docker-compose profile | Confirm browser smoke is being recorded against the same compose runtime profile used by the script gate | Verified | note that browser observation was aligned to the compose runtime on `3000 / 8000` |
```

- [ ] **Step 5: Commit the QA evidence slice**

```bash
git add docs/04_qa_matrix.md
git commit -m "docs: record t2d browser smoke evidence"
```

Expected:

- commit succeeds with real browser-smoke evidence and no overclaimed automation
