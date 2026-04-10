# T2-D Authenticated Browser Smoke Baseline V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `T2-D slice 3` 落成 `authenticated browser smoke baseline v1`：在不新增 auth bypass 的前提下，正式建立基於真實 session / cookie import 的 authenticated operator-assisted smoke baseline，讓 browser smoke evidence 不再只停在 `/login?next=...`。

**Architecture:** 保留既有 cookie-based session、Google login、protected-route gate 與 `browser_smoke` manifest，不新增新的 auth endpoint 或 test-only backdoor。實作上先把 `browser_smoke` contract 補上 `auth_requirement` / `auth_entry_method` / `unauthenticated_expected_behavior`，再同步 README、`docs/04`、`docs/06` 的 authenticated smoke wording，最後用真實 authenticated browser session 或 cookie import 跑一次 operator-assisted smoke evidence。

**Tech Stack:** Python 3.12, pytest, existing release-readiness script, README, active docs under `docs/`, operator-assisted browser verification via gstack browse cookie import + browser session reuse

---

## File Structure

- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/scripts/run_release_readiness.py`
  - Extend the normalized `browser_smoke` manifest with authenticated-smoke metadata
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/tests/test_release_readiness_script.py`
  - Extend manifest tests for authenticated smoke metadata
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/README.md`
  - Document the authenticated browser smoke baseline and operator-assisted auth entry method
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/04_qa_matrix.md`
  - Add real authenticated browser smoke evidence after a successful or honestly-limited authenticated run
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/06_product_alignment_and_85_point_roadmap.md`
  - Mark `T2-D slice 3` as landed once behavior and evidence are real

---

### Task 1: Add Authenticated-Smoke Metadata To The Browser-Smoke Manifest

**Files:**
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/scripts/run_release_readiness.py`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/tests/test_release_readiness_script.py`

- [ ] **Step 1: Write failing tests for authenticated-smoke metadata**

Append these tests to `backend/tests/test_release_readiness_script.py`:

```python
def test_browser_smoke_targets_mark_authenticated_requirement_and_entry_method() -> None:
    targets = release_readiness.build_browser_smoke_targets("docker-compose")

    assert [item["auth_requirement"] for item in targets] == [
        "authenticated",
        "authenticated",
        "authenticated",
        "authenticated",
        "authenticated",
    ]
    assert [item["auth_entry_method"] for item in targets] == [
        "existing-session-or-cookie-import",
        "existing-session-or-cookie-import",
        "existing-session-or-cookie-import",
        "existing-session-or-cookie-import",
        "existing-session-or-cookie-import",
    ]


def test_browser_smoke_targets_explain_unauthenticated_fallback_behavior() -> None:
    targets = release_readiness.build_browser_smoke_targets("standalone")

    assert targets[0]["unauthenticated_expected_behavior"] == "redirect-to-login"
    assert targets[-1]["unauthenticated_expected_behavior"] == "redirect-to-login"
```

- [ ] **Step 2: Run the targeted pytest to verify RED**

Run:

```bash
PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_release_readiness_script.py -q
```

Expected:

- FAIL because the current smoke manifest does not expose `auth_requirement`, `auth_entry_method`, or `unauthenticated_expected_behavior`

- [ ] **Step 3: Extend `build_browser_smoke_targets(...)` with authenticated-smoke metadata**

Update `backend/scripts/run_release_readiness.py` so every smoke target includes:

```python
{
    "auth_requirement": "authenticated",
    "auth_entry_method": "existing-session-or-cookie-import",
    "unauthenticated_expected_behavior": "redirect-to-login",
}
```

Apply it to all five targets while preserving the existing normalized shape:

```python
{
    "label": "overview_focus_return",
    "required": True,
    "entry_kind": "direct-route",
    "path_template": "/",
    "entry_path": "/",
    "auth_requirement": "authenticated",
    "auth_entry_method": "existing-session-or-cookie-import",
    "unauthenticated_expected_behavior": "redirect-to-login",
    "intent": "確認首頁仍能把顧問送回主工作面",
    "evidence_expectation": "記錄首頁 primary action block 與 section guide 仍可讀。",
    "mode": "operator-assisted",
}
```

For the dynamic task-detail target, keep the current normalized shape and only add the same auth metadata:

```python
{
    "label": "task_detail_operating_surface",
    "required": False,
    "entry_kind": "list-to-detail",
    "path_template": "/tasks/[taskId]",
    "entry_path": "/matters",
    "auth_requirement": "authenticated",
    "auth_entry_method": "existing-session-or-cookie-import",
    "unauthenticated_expected_behavior": "redirect-to-login",
    "intent": "確認 task detail 仍維持 operating summary 與低噪音主線",
    "evidence_expectation": "若列表中有可進入的 task，記錄 operating summary 與 condensed notes 是否仍成立。",
    "mode": "operator-assisted",
}
```

- [ ] **Step 4: Re-run the targeted pytest to verify GREEN**

Run:

```bash
PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_release_readiness_script.py -q
```

Expected:

- PASS for the new authenticated-smoke manifest tests plus the existing release-readiness tests

- [ ] **Step 5: Commit the authenticated-manifest slice**

```bash
git add backend/scripts/run_release_readiness.py \
  backend/tests/test_release_readiness_script.py
git commit -m "feat: add t2d authenticated smoke manifest"
```

Expected:

- commit succeeds with the auth-aware smoke-manifest metadata and tests

---

### Task 2: Normalize Docs And Prepare The Authenticated-Smoke QA Entry

**Files:**
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/README.md`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/06_product_alignment_and_85_point_roadmap.md`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/04_qa_matrix.md`

- [ ] **Step 1: Update README with the authenticated smoke baseline**

In `README.md`, append this directly under the `browser smoke` section:

```md
Authenticated browser smoke baseline:

- use an existing authenticated browser session, or import cookies from a real local Chromium browser
- do not use auth bypass or fake session injection
- record the auth entry method together with the smoke evidence
```

- [ ] **Step 2: Update `docs/06` progress under `11.4 T2-D`**

Append this progress note to `/Users/oldtien_base/Desktop/Infinite Pro/docs/06_product_alignment_and_85_point_roadmap.md`:

```md
- 第三刀已正式落地成 `authenticated browser smoke baseline v1`
- browser smoke 現在已正式分出 unauthenticated 與 authenticated 兩層 evidence
- authenticated smoke 的正式進場方式為真實 session reuse 或 cookie import，而不是 auth bypass
```

- [ ] **Step 3: Add the QA entry shell without claiming results yet**

Append this entry shell to `/Users/oldtien_base/Desktop/Infinite Pro/docs/04_qa_matrix.md`:

```md
## Entry: 2026-04-10 T2-D authenticated browser smoke baseline v1

Scope:
- establish an authenticated operator-assisted browser smoke baseline
- keep the auth path honest by relying on real session reuse or cookie import
- record the difference between unauthenticated auth-gate smoke and authenticated workbench smoke

Environment used:
- repo-native release-readiness verification
- operator-assisted authenticated browser smoke
```

Do not add results yet.

- [ ] **Step 4: Commit the docs-prep slice**

```bash
git add README.md \
  docs/06_product_alignment_and_85_point_roadmap.md \
  docs/04_qa_matrix.md
git commit -m "docs: prepare t2d authenticated smoke baseline"
```

Expected:

- commit succeeds with the new README / roadmap wording and QA entry shell

---

### Task 3: Run Real Authenticated Browser Smoke And Record Evidence

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

- [ ] **Step 2: Import or reuse a real authenticated browser session**

Use the installed session-aware browser workflow to import cookies before running the authenticated smoke:

```bash
_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
B=""
[ -n "$_ROOT" ] && [ -x "$_ROOT/.agents/skills/gstack/browse/dist/browse" ] && B="$_ROOT/.agents/skills/gstack/browse/dist/browse"
[ -z "$B" ] && B=$GSTACK_BROWSE/browse
"$B" cookie-import-browser
```

Expected operator step:

- the cookie picker opens in the default browser
- choose the local Infinite Pro domain/session that is already authenticated
- return to the agent only after the cookies are imported

If no authenticated local browser session exists, stop and record that blocker in `docs/04` rather than fabricating a session.

- [ ] **Step 3: Run the authenticated required smoke targets**

Using the same browse session after cookie import, run:

```bash
"$B" goto http://127.0.0.1:3000/
"$B" text
"$B" goto http://127.0.0.1:3000/matters
"$B" text
"$B" goto http://127.0.0.1:3000/deliverables
"$B" text
```

Record whether:

- `/` now lands on the actual overview instead of `/login`
- `/matters` shows the protected matters surface
- `/deliverables` shows the protected deliverables surface

If any page still redirects to `/login`, record that exact outcome rather than claiming authenticated success.

- [ ] **Step 4: Attempt one authenticated detail target**

From the authenticated `/matters` page, try to reach a task detail route honestly:

```bash
"$B" goto http://127.0.0.1:3000/matters
"$B" snapshot -i
```

Then:

- if a task link is visible, open it using the visible ref or `a[href^="/tasks/"]`
- verify the page shows:
  - the first-screen task mainline
  - the low-noise operating summary
  - condensed second-layer reading

If no visible task link exists, record:

- `optional authenticated detail target not run`
- reason: `no visible task row available from matters list during authenticated smoke window`

Do not fabricate a task id.

- [ ] **Step 5: Fill the new `docs/04` entry with the real authenticated evidence**

Complete the new QA entry using this structure:

```md
### Build / Typecheck / Compile

| Check | Result |
| --- | --- |
| `PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_release_readiness_script.py -q` | Passed |
| `PYTHONPATH=backend .venv312/bin/python backend/scripts/run_release_readiness.py --tier runtime --runtime-profile docker-compose` | Passed |
| `git diff --check` | Passed |

### T2-D authenticated browser smoke verification

| Area | Page / Flow | Action | Status | Notes |
| --- | --- | --- | --- | --- |
| Authenticated smoke baseline | auth entry method | Record whether the smoke used existing session reuse or cookie import | Verified or Blocked | note the actual entry method or the exact blocker |
| Browser smoke posture | required authenticated targets | Verify `/`, `/matters`, and `/deliverables` after authenticated entry | Verified, Limited, or Blocked | record whether the protected surfaces were actually reached or still redirected to `/login` |
| Browser smoke posture | optional authenticated detail target | Attempt a real detail entry from `/matters` | Verified or Limited | if reached, note the task-detail mainline and operating summary; if not, record the exact reason |
```

- [ ] **Step 6: Commit the authenticated smoke evidence slice**

```bash
git add docs/04_qa_matrix.md
git commit -m "docs: record t2d authenticated smoke evidence"
```

Expected:

- commit succeeds with real authenticated smoke evidence and no overclaimed auth success
