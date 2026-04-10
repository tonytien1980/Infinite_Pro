from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from pathlib import Path
from typing import NamedTuple
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


class ReleaseCheck(NamedTuple):
    label: str
    cwd: Path
    command: list[str]
    tier: str
    kind: str


class RuntimeSmokeTarget(NamedTuple):
    label: str
    url: str
    expected_status: int = 200
    expect_json_status_ok: bool = False


class RuntimeProfileTargets(NamedTuple):
    profile: str
    frontend_base_url: str
    backend_base_url: str
    targets: list[RuntimeSmokeTarget]


def build_static_checks(
    *,
    repo_root: Path,
    frontend_root: Path,
    backend_root: Path,
    python_executable: Path,
) -> list[ReleaseCheck]:
    _ = backend_root
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
                "rm -f .next/cache/.tsbuildinfo && mkdir -p .next/types && npx next typegen",
            ],
            tier="static",
            kind="repair",
        )
    ]


def build_runtime_smoke_targets(
    *,
    backend_base_url: str,
    frontend_base_url: str,
) -> list[RuntimeSmokeTarget]:
    frontend_root = frontend_base_url.rstrip("/")
    backend_root = backend_base_url.rstrip("/")
    return [
        RuntimeSmokeTarget(
            label="backend_health",
            url=f"{backend_root}/health",
            expected_status=200,
            expect_json_status_ok=True,
        ),
        RuntimeSmokeTarget(label="frontend_overview", url=f"{frontend_root}/"),
        RuntimeSmokeTarget(label="frontend_new", url=f"{frontend_root}/new"),
        RuntimeSmokeTarget(label="frontend_matters", url=f"{frontend_root}/matters"),
        RuntimeSmokeTarget(label="frontend_deliverables", url=f"{frontend_root}/deliverables"),
    ]


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
            "auth_requirement": "authenticated",
            "auth_entry_method": "existing-session-or-cookie-import",
            "unauthenticated_expected_behavior": "redirect-to-login",
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
            "auth_requirement": "authenticated",
            "auth_entry_method": "existing-session-or-cookie-import",
            "unauthenticated_expected_behavior": "redirect-to-login",
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
            "auth_requirement": "authenticated",
            "auth_entry_method": "existing-session-or-cookie-import",
            "unauthenticated_expected_behavior": "redirect-to-login",
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
            "auth_requirement": "authenticated",
            "auth_entry_method": "existing-session-or-cookie-import",
            "unauthenticated_expected_behavior": "redirect-to-login",
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
            "auth_requirement": "authenticated",
            "auth_entry_method": "existing-session-or-cookie-import",
            "unauthenticated_expected_behavior": "redirect-to-login",
            "intent": "確認 task detail 仍維持 operating summary 與低噪音主線",
            "evidence_expectation": "若列表中有可進入的 task，記錄 operating summary 與 condensed notes 是否仍成立。",
            "mode": "operator-assisted",
        },
    ]


def run_command_checks(checks: list[ReleaseCheck]) -> dict[str, object]:
    results: list[dict[str, object]] = []
    overall_status = "pass"

    for check in checks:
        try:
            completed = subprocess.run(
                check.command,
                cwd=check.cwd,
                capture_output=True,
                text=True,
                check=False,
                env=_build_check_env(check.cwd),
            )
        except OSError as exc:
            results.append(
                {
                    "label": check.label,
                    "tier": check.tier,
                    "kind": check.kind,
                    "status": "fail",
                    "returncode": None,
                    "stdout": "",
                    "stderr": str(exc),
                }
            )
            overall_status = "fail"
            break

        stderr_payload = f"{completed.stdout}\n{completed.stderr}"
        if (
            check.label == "frontend_typecheck"
            and completed.returncode != 0
            and needs_typegen_repair(stderr_payload)
        ):
            repair_payload = run_command_checks(build_typegen_repair_command(check.cwd))
            results.extend(repair_payload["checks"])  # type: ignore[arg-type]
            if repair_payload["status"] != "pass":
                overall_status = "fail"
                break
            completed = subprocess.run(
                check.command,
                cwd=check.cwd,
                capture_output=True,
                text=True,
                check=False,
                env=_build_check_env(check.cwd),
            )

        result = {
            "label": check.label,
            "tier": check.tier,
            "kind": check.kind,
            "status": "pass" if completed.returncode == 0 else "fail",
            "returncode": completed.returncode,
            "stdout": completed.stdout.strip(),
            "stderr": completed.stderr.strip(),
        }
        results.append(result)
        if completed.returncode != 0:
            overall_status = "fail"
            break

    return {"status": overall_status, "checks": results}


def run_runtime_smoke(targets: list[RuntimeSmokeTarget]) -> dict[str, object]:
    checks: list[dict[str, object]] = []
    overall_status = "pass"

    for target in targets:
        detail = ""
        status = "pass"
        try:
            request = Request(target.url, headers={"User-Agent": "InfinitePro-ReleaseReadiness/1.0"})
            with urlopen(request, timeout=5) as response:
                body = response.read().decode("utf-8", errors="replace")
                detail = body[:240]
                if response.status != target.expected_status:
                    status = "fail"
                elif target.expect_json_status_ok:
                    try:
                        payload = json.loads(body)
                    except json.JSONDecodeError:
                        status = "fail"
                        detail = "response was not valid JSON"
                    else:
                        if payload.get("status") != "ok":
                            status = "fail"
                            detail = body[:240]
        except HTTPError as exc:
            status = "fail"
            detail = f"HTTPError: {exc.code}"
        except URLError as exc:
            status = "fail"
            detail = str(exc.reason or exc)

        checks.append(
            {
                "label": target.label,
                "url": target.url,
                "status": status,
                "detail": detail,
            }
        )
        if status != "pass":
            overall_status = "fail"

    return {"status": overall_status, "checks": checks}


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Run Infinite Pro release-readiness baseline checks.",
    )
    parser.add_argument("--tier", choices=["static", "runtime", "all"], default="static")
    parser.add_argument("--runtime-profile", choices=["standalone", "docker-compose"], default=None)
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
        if static_results["status"] != "pass":
            exit_code = 1

    if args.tier in {"runtime", "all"}:
        if args.runtime_profile:
            runtime_profile = build_runtime_smoke_targets_for_profile(args.runtime_profile)
            runtime_results = run_runtime_smoke(runtime_profile.targets)
            runtime_results["profile"] = runtime_profile.profile
            runtime_results["frontend_base_url"] = runtime_profile.frontend_base_url
            runtime_results["backend_base_url"] = runtime_profile.backend_base_url
            payload["browser_smoke"] = {
                "profile": args.runtime_profile,
                "mode": "operator-assisted",
                "targets": build_browser_smoke_targets(args.runtime_profile),
            }
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

    print(json.dumps(payload, ensure_ascii=False, indent=2))
    return exit_code


def _build_check_env(cwd: Path) -> dict[str, str]:
    env = os.environ.copy()
    repo_root = cwd if (cwd / "backend").exists() else cwd.parent if (cwd.parent / "backend").exists() else None
    if repo_root is not None:
        backend_path = str(repo_root / "backend")
        current_pythonpath = env.get("PYTHONPATH", "")
        paths = [item for item in current_pythonpath.split(os.pathsep) if item]
        if backend_path not in paths:
            env["PYTHONPATH"] = os.pathsep.join([backend_path, *paths]) if paths else backend_path
    return env


if __name__ == "__main__":
    raise SystemExit(main())
