# T2-D Runtime Confidence Baseline V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `T2-D slice 1` 落成 `runtime confidence baseline v1`：讓 repo-native release-readiness baseline 能正式區分 `standalone` 與 `docker-compose` runtime profile，並建立一組可重複參照、但仍維持 operator-assisted 的 browser smoke target contract。

**Architecture:** 保留現有 `backend/scripts/run_release_readiness.py` 作為唯一 repo-native entrypoint，不新增第二支平行 script。實作上先擴充 runtime profile 與 target builders，再用 pytest 補上 profile-aware contract，最後同步 README、`docs/04`、`docs/06` 的 terminology 與 QA evidence；browser smoke 這一刀只建立 canonical target contract，不宣稱 fully automated。

**Tech Stack:** Python 3.12, pytest, standard-library HTTP smoke checks, README, active docs under `docs/`

---

## File Structure

- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/scripts/run_release_readiness.py`
  - Add runtime profile support and a canonical browser-smoke target contract
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/tests/test_release_readiness_script.py`
  - Extend the existing tests for standalone/docker-compose profiles and browser smoke targets
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/README.md`
  - Clarify the canonical release-readiness runtime profiles and browser-smoke expectations
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/04_qa_matrix.md`
  - Append real runtime-confidence evidence for this slice only after actual runs succeed
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/06_product_alignment_and_85_point_roadmap.md`
  - Mark `T2-D slice 1` progress after the behavior is real

---

### Task 1: Add Runtime Profile Support To The Release-Readiness Script

**Files:**
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/scripts/run_release_readiness.py`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/tests/test_release_readiness_script.py`

- [ ] **Step 1: Write failing tests for runtime profile support**

Append these tests to `backend/tests/test_release_readiness_script.py`:

```python
def test_runtime_profile_targets_support_standalone_and_docker_compose() -> None:
    standalone = release_readiness.build_runtime_smoke_targets_for_profile("standalone")
    docker = release_readiness.build_runtime_smoke_targets_for_profile("docker-compose")

    assert standalone.profile == "standalone"
    assert standalone.frontend_base_url == "http://127.0.0.1:3000"
    assert standalone.backend_base_url == "http://127.0.0.1:8000/api/v1"

    assert docker.profile == "docker-compose"
    assert docker.frontend_base_url == "http://127.0.0.1:3000"
    assert docker.backend_base_url == "http://127.0.0.1:8000/api/v1"
    assert [item.label for item in docker.targets] == [
        "backend_health",
        "frontend_overview",
        "frontend_new",
        "frontend_matters",
        "frontend_deliverables",
    ]


def test_runtime_profile_builder_rejects_unknown_profile() -> None:
    try:
        release_readiness.build_runtime_smoke_targets_for_profile("legacy-8010")
    except ValueError as exc:
        assert "Unsupported runtime profile" in str(exc)
    else:
        raise AssertionError("expected runtime profile builder to reject unknown profile")
```

- [ ] **Step 2: Run the targeted pytest to verify RED**

Run:

```bash
PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_release_readiness_script.py -q
```

Expected:

- FAIL because `build_runtime_smoke_targets_for_profile(...)` does not exist yet

- [ ] **Step 3: Add runtime profile types and builders to the script**

Update `backend/scripts/run_release_readiness.py` with:

```python
class RuntimeProfileTargets(NamedTuple):
    profile: str
    frontend_base_url: str
    backend_base_url: str
    targets: list[RuntimeSmokeTarget]


def build_runtime_smoke_targets_for_profile(profile: str) -> RuntimeProfileTargets:
    normalized = profile.strip().lower()
    if normalized == "standalone":
        frontend_base_url = "http://127.0.0.1:3000"
        backend_base_url = "http://127.0.0.1:8000/api/v1"
    elif normalized == "docker-compose":
        frontend_base_url = "http://127.0.0.1:3000"
        backend_base_url = "http://127.0.0.1:8000/api/v1"
    else:
        raise ValueError(f"Unsupported runtime profile: {profile}")

    return RuntimeProfileTargets(
        profile=normalized,
        frontend_base_url=frontend_base_url,
        backend_base_url=backend_base_url,
        targets=build_runtime_smoke_targets(
            backend_base_url=backend_base_url,
            frontend_base_url=frontend_base_url,
        ),
    )
```

Also extend the CLI:

```python
parser.add_argument(
    "--runtime-profile",
    choices=["standalone", "docker-compose"],
    default=None,
)
```

And in `main()` derive runtime targets like this:

```python
if args.tier in {"runtime", "all"}:
    if args.runtime_profile:
        runtime_profile = build_runtime_smoke_targets_for_profile(args.runtime_profile)
        runtime_results = run_runtime_smoke(runtime_profile.targets)
        runtime_results["profile"] = runtime_profile.profile
        runtime_results["frontend_base_url"] = runtime_profile.frontend_base_url
        runtime_results["backend_base_url"] = runtime_profile.backend_base_url
    else:
        runtime_results = run_runtime_smoke(
            build_runtime_smoke_targets(
                backend_base_url=args.backend_base_url,
                frontend_base_url=args.frontend_base_url,
            )
        )
        runtime_results["profile"] = "custom"
        runtime_results["frontend_base_url"] = args.frontend_base_url
        runtime_results["backend_base_url"] = args.backend_base_url

    payload["runtime"] = runtime_results
    if runtime_results["status"] != "pass":
        exit_code = 1
```

- [ ] **Step 4: Re-run the targeted pytest to verify GREEN**

Run:

```bash
PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_release_readiness_script.py -q
```

Expected:

- PASS for the new runtime-profile tests plus the existing script tests

- [ ] **Step 5: Commit the runtime-profile slice**

```bash
git add backend/scripts/run_release_readiness.py \
  backend/tests/test_release_readiness_script.py
git commit -m "feat: add t2d runtime profiles"
```

Expected:

- commit succeeds with the new runtime-profile contract and tests

---

### Task 2: Add A Canonical Browser-Smoke Target Contract

**Files:**
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/scripts/run_release_readiness.py`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/tests/test_release_readiness_script.py`

- [ ] **Step 1: Write failing tests for browser-smoke targets**

Append these tests to `backend/tests/test_release_readiness_script.py`:

```python
def test_browser_smoke_targets_define_a_small_consultant_facing_contract() -> None:
    targets = release_readiness.build_browser_smoke_targets("docker-compose")

    assert [item["label"] for item in targets] == [
        "overview_focus_return",
        "new_matter_entry",
        "matters_list",
        "deliverables_list",
        "task_detail_operating_surface",
    ]
    assert targets[0]["path"] == "/"
    assert targets[-1]["path"] == "/tasks/[taskId]"
    assert targets[-1]["mode"] == "operator-assisted"


def test_browser_smoke_targets_reject_unknown_profile() -> None:
    try:
        release_readiness.build_browser_smoke_targets("legacy-8010")
    except ValueError as exc:
        assert "Unsupported browser smoke profile" in str(exc)
    else:
        raise AssertionError("expected browser smoke targets to reject unknown profile")
```

- [ ] **Step 2: Run the targeted pytest to verify RED**

Run:

```bash
PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_release_readiness_script.py -q
```

Expected:

- FAIL because `build_browser_smoke_targets(...)` does not exist yet

- [ ] **Step 3: Add a canonical browser-smoke target builder**

Extend `backend/scripts/run_release_readiness.py` with:

```python
def build_browser_smoke_targets(profile: str) -> list[dict[str, str]]:
    normalized = profile.strip().lower()
    if normalized not in {"standalone", "docker-compose"}:
        raise ValueError(f"Unsupported browser smoke profile: {profile}")

    return [
        {
            "label": "overview_focus_return",
            "path": "/",
            "intent": "確認首頁仍能把顧問送回主工作面",
            "mode": "operator-assisted",
        },
        {
            "label": "new_matter_entry",
            "path": "/new",
            "intent": "確認正式進件入口仍可進入 canonical intake",
            "mode": "operator-assisted",
        },
        {
            "label": "matters_list",
            "path": "/matters",
            "intent": "確認案件列表仍可作為主工作面入口",
            "mode": "operator-assisted",
        },
        {
            "label": "deliverables_list",
            "path": "/deliverables",
            "intent": "確認交付物主工作面仍可進入正式結果閱讀",
            "mode": "operator-assisted",
        },
        {
            "label": "task_detail_operating_surface",
            "path": "/tasks/[taskId]",
            "intent": "確認 task detail 仍維持 operating summary 與低噪音主線",
            "mode": "operator-assisted",
        },
    ]
```

Also expose this in JSON payloads when `--tier all` or `--tier runtime` runs with a profile:

```python
if args.runtime_profile:
    payload["browser_smoke"] = {
        "profile": args.runtime_profile,
        "mode": "operator-assisted",
        "targets": build_browser_smoke_targets(args.runtime_profile),
    }
```

This is documentation-grade target output, not executable browser automation.

- [ ] **Step 4: Re-run the targeted pytest to verify GREEN**

Run:

```bash
PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_release_readiness_script.py -q
```

Expected:

- PASS for the new browser-smoke target tests plus existing script tests

- [ ] **Step 5: Commit the browser-target slice**

```bash
git add backend/scripts/run_release_readiness.py \
  backend/tests/test_release_readiness_script.py
git commit -m "feat: add t2d browser smoke targets"
```

Expected:

- commit succeeds with the browser-smoke target contract and tests

---

### Task 3: Sync Runtime-Confidence Docs And Record Real Evidence

**Files:**
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/README.md`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/04_qa_matrix.md`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/06_product_alignment_and_85_point_roadmap.md`

- [ ] **Step 1: Update README with runtime-profile terminology**

Replace the release-readiness runtime section in `README.md` with:

```md
Repo-native runtime gate (standalone local runtime):

    PYTHONPATH=backend .venv312/bin/python backend/scripts/run_release_readiness.py \
      --tier runtime \
      --runtime-profile standalone

Repo-native runtime gate (Docker Compose profile):

    PYTHONPATH=backend .venv312/bin/python backend/scripts/run_release_readiness.py \
      --tier runtime \
      --runtime-profile docker-compose

Verification tiers:

- `static`
  - backend compile / pytest, frontend node tests, build, typecheck
- `runtime`
  - repo-native HTTP smoke, with explicit `standalone` or `docker-compose` profile
- `browser smoke`
  - operator-assisted consultant-facing flow checks against the canonical smoke-target contract
```

- [ ] **Step 2: Update `docs/06` progress under `11.4 T2-D`**

Append this progress note to `/Users/oldtien_base/Desktop/Infinite Pro/docs/06_product_alignment_and_85_point_roadmap.md`:

```md
- 第一刀已正式落地成 `runtime confidence baseline v1`
- repo-native release-readiness baseline 現在可明確區分 `standalone` 與 `docker-compose` runtime profile
- browser smoke 仍維持 operator-assisted，但 repo 內已建立可重複參照的 canonical smoke target contract
```

- [ ] **Step 3: Add a new `docs/04` entry only after real verification succeeds**

Append this entry to `/Users/oldtien_base/Desktop/Infinite Pro/docs/04_qa_matrix.md` after the commands below have actually passed:

```md
## Entry: 2026-04-10 T2-D runtime confidence baseline v1

Scope:
- deepen release-readiness from generic runtime smoke into explicit runtime profiles
- add a canonical operator-assisted browser smoke target contract
- align README, script output, and QA evidence to the same runtime-confidence vocabulary

Environment used:
- local repo verification
- standalone runtime verification
- Docker compose verification if Docker daemon is available

### Build / Typecheck / Compile

| Check | Result |
| --- | --- |
| `PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_release_readiness_script.py -q` | Passed |
| `PYTHONPATH=backend .venv312/bin/python backend/scripts/run_release_readiness.py --tier static` | Passed |
| `PYTHONPATH=backend .venv312/bin/python backend/scripts/run_release_readiness.py --tier runtime --runtime-profile standalone` | Passed |
| `PYTHONPATH=backend .venv312/bin/python backend/scripts/run_release_readiness.py --tier runtime --runtime-profile docker-compose` | Passed or Not run |
```
```

In the notes section, be explicit:

- if Docker daemon was available and compose runtime passed
- or if Docker daemon was unavailable and the missing evidence is specifically the Docker live runtime layer

- [ ] **Step 4: Run verification in the correct order**

Run:

```bash
PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_release_readiness_script.py -q
PYTHONPATH=backend .venv312/bin/python backend/scripts/run_release_readiness.py --tier static
PYTHONPATH=backend .venv312/bin/python backend/scripts/run_release_readiness.py --tier runtime --runtime-profile standalone
docker compose up -d
PYTHONPATH=backend .venv312/bin/python backend/scripts/run_release_readiness.py --tier runtime --runtime-profile docker-compose
docker compose down
git diff --check
```

Expected:

- script pytest PASS
- static tier PASS
- standalone runtime profile PASS
- Docker profile PASS if Docker daemon is available
- if Docker daemon is unavailable, record that exact limitation and skip the Docker live-evidence claim
- `git diff --check` PASS

- [ ] **Step 5: Commit the docs-and-verification slice**

```bash
git add README.md \
  docs/04_qa_matrix.md \
  docs/06_product_alignment_and_85_point_roadmap.md
git commit -m "docs: align t2d runtime confidence baseline"
```

Expected:

- commit succeeds with active docs and QA evidence aligned to the shipped runtime-confidence behavior
