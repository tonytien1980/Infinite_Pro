# Product Reliability And Release Discipline v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立一個 repo-native `release-readiness` baseline，正式分清 `static / runtime / browser smoke` 三層驗證，並讓 README、`docs/04`、`docs/06` 與實際可執行的驗證入口對齊。

**Architecture:** 第一刀只新增一支標準庫驅動的 Python script `backend/scripts/run_release_readiness.py`，由它承接 `static` 與 `runtime` 兩層驗證；`browser smoke` 仍維持 operator-assisted baseline，先寫進 docs 與 QA，不把 repo 拉成 CI / browser lab 平台。這支 script 會同時收斂 frontend build / typecheck 順序、backend health、frontend route reachability，並用一組 pytest 覆蓋 command plan、fallback handling、與 HTTP smoke summary。

**Tech Stack:** Python stdlib (`argparse`, `subprocess`, `urllib`, `json`, `dataclasses`), pytest, existing FastAPI health route, existing frontend build/typecheck flow, README, `docs/04_qa_matrix.md`, `docs/06_product_alignment_and_85_point_roadmap.md`

---

## File Structure

- Create: `/Users/oldtien_base/Desktop/Infinite Pro/backend/scripts/run_release_readiness.py`
  - Repo-native verification entrypoint for `static`, `runtime`, and `all`
  - Build command plan, runtime HTTP checks, and JSON/text summaries
- Create: `/Users/oldtien_base/Desktop/Infinite Pro/backend/tests/test_release_readiness_script.py`
  - Test command order, `.next/types` fallback behavior, health parsing, and route smoke summaries
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/README.md`
  - Add canonical release-readiness run path and clarify `build -> typecheck` order plus `typegen` fallback
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/04_qa_matrix.md`
  - Append shipped evidence for the new release-readiness baseline only after real runs pass
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/06_product_alignment_and_85_point_roadmap.md`
  - Mark `7.5` first slice as started/landed with honest scope

---

### Task 1: Add A Tested Release-Readiness Script Contract

**Files:**
- Create: `/Users/oldtien_base/Desktop/Infinite Pro/backend/scripts/run_release_readiness.py`
- Create: `/Users/oldtien_base/Desktop/Infinite Pro/backend/tests/test_release_readiness_script.py`

- [ ] **Step 1: Write the failing script-contract tests**

```python
from __future__ import annotations

import importlib.util
from pathlib import Path

SCRIPT_PATH = Path(__file__).resolve().parents[1] / "scripts" / "run_release_readiness.py"
SCRIPT_SPEC = importlib.util.spec_from_file_location("run_release_readiness_module", SCRIPT_PATH)
assert SCRIPT_SPEC is not None and SCRIPT_SPEC.loader is not None
release_readiness = importlib.util.module_from_spec(SCRIPT_SPEC)
SCRIPT_SPEC.loader.exec_module(release_readiness)


def test_static_check_plan_keeps_frontend_build_before_typecheck(tmp_path: Path) -> None:
    repo_root = tmp_path / "repo"
    frontend_root = repo_root / "frontend"
    backend_root = repo_root / "backend"
    frontend_root.mkdir(parents=True)
    backend_root.mkdir(parents=True)

    checks = release_readiness.build_static_checks(
      repo_root=repo_root,
      frontend_root=frontend_root,
      backend_root=backend_root,
      python_executable=Path("/usr/bin/python3"),
    )

    labels = [item.label for item in checks]
    assert labels == [
      "backend_compile",
      "backend_pytest",
      "frontend_node_tests",
      "frontend_build",
      "frontend_typecheck",
    ]
    assert checks[-2].command == ["npm", "run", "build"]
```

```python
def test_missing_next_types_error_triggers_typegen_repair() -> None:
    stderr = "error TS6053: File '/tmp/frontend/.next/types/app/page.ts' not found."
    assert release_readiness.needs_typegen_repair(stderr) is True
    assert release_readiness.needs_typegen_repair("random compile error") is False
```

```python
def test_runtime_smoke_targets_cover_backend_health_and_frontend_workbench_routes() -> None:
    targets = release_readiness.build_runtime_smoke_targets(
      backend_base_url="http://127.0.0.1:8000/api/v1",
      frontend_base_url="http://127.0.0.1:3000",
    )

    assert [item.label for item in targets] == [
      "backend_health",
      "frontend_overview",
      "frontend_new",
      "frontend_matters",
      "frontend_deliverables",
    ]
    assert targets[0].url.endswith("/health")
```

- [ ] **Step 2: Run the script-contract test to verify it fails**

Run: `PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_release_readiness_script.py -q`

Expected:
- FAIL with file-not-found because `backend/scripts/run_release_readiness.py` does not exist yet

- [ ] **Step 3: Write the minimal script contract**

```python
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

@dataclass(frozen=True)
class ReleaseCheck:
    label: str
    cwd: Path
    command: list[str]
    tier: str
    kind: str


@dataclass(frozen=True)
class RuntimeSmokeTarget:
    label: str
    url: str
    expected_status: int = 200
    expect_json_status_ok: bool = False


def build_static_checks(
    *,
    repo_root: Path,
    frontend_root: Path,
    backend_root: Path,
    python_executable: Path,
) -> list[ReleaseCheck]:
    return [
        ReleaseCheck(
            label="backend_compile",
            cwd=repo_root,
            command=[str(python_executable), "-m", "compileall", "backend/app"],
            tier="static",
            kind="command",
        ),
        ReleaseCheck(
            label="backend_pytest",
            cwd=repo_root,
            command=[str(python_executable), "-m", "pytest", "backend/tests/test_mvp_slice.py", "-q"],
            tier="static",
            kind="command",
        ),
        ReleaseCheck(
            label="frontend_node_tests",
            cwd=frontend_root,
            command=[
                "node",
                "--test",
                "tests/auth-foundation.test.mjs",
                "tests/provider-settings-foundation.test.mjs",
                "tests/demo-workspace-isolation.test.mjs",
                "tests/intake-progress.test.mjs",
                "tests/phase-six-governance.test.mjs",
                "tests/consultant-usability.test.mjs",
            ],
            tier="static",
            kind="command",
        ),
        ReleaseCheck(
            label="frontend_build",
            cwd=frontend_root,
            command=["npm", "run", "build"],
            tier="static",
            kind="command",
        ),
        ReleaseCheck(
            label="frontend_typecheck",
            cwd=frontend_root,
            command=["npm", "run", "typecheck"],
            tier="static",
            kind="command",
        ),
    ]
```

```python
def needs_typegen_repair(stderr: str) -> bool:
    lowered = stderr.lower()
    return ".next/types" in lowered and ("not found" in lowered or "ts6053" in lowered)


def build_typegen_repair_command(frontend_root: Path) -> list[ReleaseCheck]:
    return [
        ReleaseCheck(
            label="frontend_typegen_repair",
            cwd=frontend_root,
            command=[
                "sh",
                "-lc",
                "mkdir -p .next/types && npx next typegen",
            ],
            tier="static",
            kind="repair",
        )
    ]
```

```python
def build_runtime_smoke_targets(
    *,
    backend_base_url: str,
    frontend_base_url: str,
) -> list[RuntimeSmokeTarget]:
    return [
        RuntimeSmokeTarget(
            label="backend_health",
            url=f"{backend_base_url.rstrip('/')}/health",
            expected_status=200,
            expect_json_status_ok=True,
        ),
        RuntimeSmokeTarget(label="frontend_overview", url=f"{frontend_base_url.rstrip('/')}/"),
        RuntimeSmokeTarget(label="frontend_new", url=f"{frontend_base_url.rstrip('/')}/new"),
        RuntimeSmokeTarget(label="frontend_matters", url=f"{frontend_base_url.rstrip('/')}/matters"),
        RuntimeSmokeTarget(
            label="frontend_deliverables",
            url=f"{frontend_base_url.rstrip('/')}/deliverables",
        ),
    ]
```

- [ ] **Step 4: Re-run the script-contract test**

Run: `PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_release_readiness_script.py -q`

Expected:
- PASS

- [ ] **Step 5: Commit the script contract**

```bash
git add backend/scripts/run_release_readiness.py \
  backend/tests/test_release_readiness_script.py
git commit -m "feat: add release readiness baseline"
```

---

### Task 2: Implement Static And Runtime Execution Paths

**Files:**
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/scripts/run_release_readiness.py`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/backend/tests/test_release_readiness_script.py`

- [ ] **Step 1: Extend the failing test for runtime summary behavior**

```python
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from threading import Thread


def test_runtime_smoke_reports_pass_for_health_and_frontend_routes() -> None:
    events: list[str] = []

    class Handler(BaseHTTPRequestHandler):
        def do_GET(self):
            events.append(self.path)
            if self.path == "/api/v1/health":
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(b'{\"status\":\"ok\"}')
                return
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"ok")

        def log_message(self, format, *args):
            return

    server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    thread = Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        port = server.server_address[1]
        result = release_readiness.run_runtime_smoke(
            release_readiness.build_runtime_smoke_targets(
                backend_base_url=f"http://127.0.0.1:{port}/api/v1",
                frontend_base_url=f"http://127.0.0.1:{port}",
            )
        )
    finally:
        server.shutdown()
        thread.join()

    assert result["status"] == "pass"
    assert len(result["checks"]) == 5
    assert "/api/v1/health" in events
    assert "/deliverables" in events
```

- [ ] **Step 2: Run the script test to verify it fails**

Run: `PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_release_readiness_script.py -q`

Expected:
- FAIL because `run_runtime_smoke()` and/or CLI summary behavior are not implemented yet

- [ ] **Step 3: Implement command execution, typegen fallback, and runtime smoke**

```python
import argparse
import json
import subprocess
import sys
from urllib.error import URLError
from urllib.request import Request, urlopen
```

```python
def run_command_checks(checks: list[ReleaseCheck]) -> list[dict[str, object]]:
    results: list[dict[str, object]] = []
    for check in checks:
        completed = subprocess.run(
            check.command,
            cwd=check.cwd,
            capture_output=True,
            text=True,
            check=False,
        )
        if check.label == "frontend_typecheck" and completed.returncode != 0 and needs_typegen_repair(
            f"{completed.stdout}\n{completed.stderr}"
        ):
            repair = build_typegen_repair_command(check.cwd)
            repair_result = run_command_checks(repair)[0]
            results.append(repair_result)
            completed = subprocess.run(
                check.command,
                cwd=check.cwd,
                capture_output=True,
                text=True,
                check=False,
            )

        results.append(
            {
                "label": check.label,
                "tier": check.tier,
                "kind": check.kind,
                "status": "pass" if completed.returncode == 0 else "fail",
                "returncode": completed.returncode,
                "stdout": completed.stdout.strip(),
                "stderr": completed.stderr.strip(),
            }
        )
        if completed.returncode != 0:
            break
    return results
```

```python
def run_runtime_smoke(targets: list[RuntimeSmokeTarget]) -> dict[str, object]:
    checks: list[dict[str, object]] = []
    overall_status = "pass"

    for target in targets:
      try:
          request = Request(target.url, headers={"User-Agent": "InfinitePro-ReleaseReadiness/1.0"})
          with urlopen(request, timeout=5) as response:
              body = response.read().decode("utf-8", errors="replace")
              status = "pass"
              if response.status != target.expected_status:
                  status = "fail"
              elif target.expect_json_status_ok and '"status": "ok"' not in body and '"status":"ok"' not in body:
                  status = "fail"
      except URLError as exc:
          status = "fail"
          body = str(exc)

      checks.append(
          {
              "label": target.label,
              "url": target.url,
              "status": status,
              "detail": body[:240],
          }
      )
      if status != "pass":
          overall_status = "fail"

    return {"status": overall_status, "checks": checks}
```

```python
def main() -> int:
    parser = argparse.ArgumentParser(description="Run Infinite Pro release-readiness baseline checks.")
    parser.add_argument("--tier", choices=["static", "runtime", "all"], default="static")
    parser.add_argument("--frontend-base-url", default="http://127.0.0.1:3000")
    parser.add_argument("--backend-base-url", default="http://127.0.0.1:8000/api/v1")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()

    repo_root = Path(__file__).resolve().parents[2]
    frontend_root = repo_root / "frontend"
    backend_root = repo_root / "backend"
    python_executable = Path(sys.executable)

    payload: dict[str, object] = {"tier": args.tier}
    exit_code = 0

    if args.tier in {"static", "all"}:
        static_results = run_command_checks(
            build_static_checks(
                repo_root=repo_root,
                frontend_root=frontend_root,
                backend_root=backend_root,
                python_executable=python_executable,
            )
        )
        payload["static"] = static_results
        if any(item["status"] != "pass" for item in static_results):
            exit_code = 1

    if args.tier in {"runtime", "all"}:
        runtime_results = run_runtime_smoke(
            build_runtime_smoke_targets(
                backend_base_url=args.backend_base_url,
                frontend_base_url=args.frontend_base_url,
            )
        )
        payload["runtime"] = runtime_results
        if runtime_results["status"] != "pass":
            exit_code = 1

    print(json.dumps(payload, ensure_ascii=False, indent=2))
    return exit_code
```

- [ ] **Step 4: Re-run the script test**

Run: `PYTHONPATH=backend .venv312/bin/pytest backend/tests/test_release_readiness_script.py -q`

Expected:
- PASS

- [ ] **Step 5: Commit the execution slice**

```bash
git add backend/scripts/run_release_readiness.py \
  backend/tests/test_release_readiness_script.py
git commit -m "feat: implement release readiness checks"
```

---

### Task 3: Document Canonical Verification Order And Repo Entry Points

**Files:**
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/README.md`
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/06_product_alignment_and_85_point_roadmap.md`

- [ ] **Step 1: Update the README local verification section**

````md
## Release Readiness Baseline

Repo-native entrypoint:

```bash
PYTHONPATH=backend .venv312/bin/python backend/scripts/run_release_readiness.py --tier static
```

If local frontend/backend runtime is already up:

```bash
PYTHONPATH=backend .venv312/bin/python backend/scripts/run_release_readiness.py \
  --tier runtime \
  --frontend-base-url http://127.0.0.1:3000 \
  --backend-base-url http://127.0.0.1:8000/api/v1
```

Canonical frontend verification order:

1. `npm run build`
2. `npm run typecheck`

Fallback rule:

- if `typecheck` fails because `.next/types` is missing or stale, run:

```bash
mkdir -p .next/types
npx next typegen
npm run typecheck
```
````

- [ ] **Step 2: Update the roadmap doc**

```md
- `7.5` 的第一刀現在已開始正式落地：
  - repo-native release-readiness baseline
  - static / runtime / browser smoke tier separation
  - canonical frontend verification order and fallback rule
- 但這一刀仍不是 CI platform，也不是 full browser automation suite
```

- [ ] **Step 3: Commit the docs baseline**

```bash
git add README.md docs/06_product_alignment_and_85_point_roadmap.md
git commit -m "docs: document release readiness baseline"
```

---

### Task 4: Run Real Verification And Append QA Evidence

**Files:**
- Modify: `/Users/oldtien_base/Desktop/Infinite Pro/docs/04_qa_matrix.md`

- [ ] **Step 1: Run the static release-readiness entrypoint**

Run: `PYTHONPATH=backend .venv312/bin/python backend/scripts/run_release_readiness.py --tier static`

Expected:
- PASS with JSON output containing:
  - `backend_compile`
  - `backend_pytest`
  - `frontend_node_tests`
  - `frontend_build`
  - `frontend_typecheck`

- [ ] **Step 2: Run the runtime release-readiness entrypoint against a live local runtime**

Run:

```bash
docker compose up -d backend frontend
PYTHONPATH=backend .venv312/bin/python backend/scripts/run_release_readiness.py \
  --tier runtime \
  --frontend-base-url http://127.0.0.1:3000 \
  --backend-base-url http://127.0.0.1:8000/api/v1
```

Expected:
- PASS with JSON output containing:
  - `backend_health`
  - `frontend_overview`
  - `frontend_new`
  - `frontend_matters`
  - `frontend_deliverables`

- [ ] **Step 3: Append QA matrix only after real runs pass**

```md
## Entry: 2026-04-09 product reliability and release discipline v1

Scope:
- add a repo-native release-readiness script baseline
- separate verification into `static`, `runtime`, and `browser smoke`
- clarify canonical frontend verification order and `.next/types` fallback handling

Environment used:
- static verification in local repo
- runtime verification against local frontend/backend

### Build / Typecheck / Compile

| Check | Result |
| --- | --- |
| `PYTHONPATH=backend .venv312/bin/python backend/scripts/run_release_readiness.py --tier static` | Passed |
| `PYTHONPATH=backend .venv312/bin/python backend/scripts/run_release_readiness.py --tier runtime --frontend-base-url http://127.0.0.1:3000 --backend-base-url http://127.0.0.1:8000/api/v1` | Passed |

### Release-readiness verification

| Area | Page / Flow | Action | Status | Notes |
| --- | --- | --- | --- | --- |
| Repo-native script | `backend/scripts/run_release_readiness.py --tier static` | Run canonical static gate in one entrypoint | Verified | command output now records backend compile, backend pytest, frontend node tests, build, and typecheck in one JSON summary |
| Repo-native script | `backend/scripts/run_release_readiness.py --tier runtime` | Run minimal local runtime smoke baseline | Verified | command output now records backend health and core frontend route reachability without requiring a browser automation platform |
| Frontend verification | `build -> typecheck` | Clarify canonical order and keep `typegen` as fallback rather than default ritual | Verified | README, script logic, and QA evidence now agree on the real order for this checkout |
| Browser smoke posture | operator-assisted lane | Keep browser smoke visible as a third tier without pretending it is fully automated yet | Verified | docs now distinguish repo-native runtime smoke from browser-assisted smoke instead of collapsing them into one claim |
```

- [ ] **Step 4: Commit QA alignment and push**

```bash
git add docs/04_qa_matrix.md
git commit -m "docs: align release readiness evidence"
git push origin codex/docs06-roadmap
```

---

### Self-Review

- [ ] Spec coverage: this plan covers script baseline, tier separation, frontend order, runtime smoke, README/docs/QA alignment
- [ ] Placeholder scan: no `TODO`, `TBD`, or vague “handle edge cases” wording remains
- [ ] Type consistency: `ReleaseCheck`, `RuntimeSmokeTarget`, `build_static_checks`, `build_runtime_smoke_targets`, and `run_runtime_smoke` names are consistent across tests and script
- [ ] Scope safety: no task introduces CI platform work, deploy dashboarding, or browser automation mega-scope
- [ ] Evidence safety: QA matrix updates happen only after real static and runtime runs pass
