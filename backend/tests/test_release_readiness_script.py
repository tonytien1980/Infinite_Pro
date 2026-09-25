from __future__ import annotations

import importlib.util
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import pytest

SCRIPT_PATH = Path(__file__).resolve().parents[1] / "scripts" / "run_release_readiness.py"
SCRIPT_SPEC = importlib.util.spec_from_file_location(
    "run_release_readiness_module",
    SCRIPT_PATH,
)
assert SCRIPT_SPEC is not None and SCRIPT_SPEC.loader is not None
release_readiness = importlib.util.module_from_spec(SCRIPT_SPEC)
SCRIPT_SPEC.loader.exec_module(release_readiness)


def test_static_check_plan_keeps_frontend_build_before_typecheck(tmp_path: Path) -> None:
    repo_root = tmp_path / "repo"
    frontend_root = repo_root / "frontend"
    backend_root = repo_root / "backend"
    frontend_root.mkdir(parents=True)
    (frontend_root / "tests").mkdir()
    (frontend_root / "tests" / "smoke.test.mjs").touch()
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


def test_missing_next_types_error_triggers_typegen_repair() -> None:
    stderr = "error TS6053: File '/tmp/frontend/.next/types/app/page.ts' not found."

    assert release_readiness.needs_typegen_repair(stderr) is True
    assert release_readiness.needs_typegen_repair("random compile error") is False


def test_static_checks_run_complete_backend_and_frontend_suites(tmp_path: Path) -> None:
    frontend = tmp_path / "frontend"
    (frontend / "tests").mkdir(parents=True)
    (frontend / "tests" / "a.test.mjs").touch()
    (frontend / "tests" / "new-regression.test.mjs").touch()
    checks = release_readiness.build_static_checks(
        repo_root=tmp_path,
        frontend_root=frontend,
        backend_root=tmp_path / "backend",
        python_executable=Path(sys.executable),
    )
    by_label = {check.label: check for check in checks}
    assert by_label["backend_pytest"].command[-2:] == ["backend/tests", "-q"]
    assert by_label["frontend_node_tests"].command == [
        "node", "--test", "tests/a.test.mjs", "tests/new-regression.test.mjs",
    ]


def test_static_gate_rejects_an_empty_frontend_test_suite(tmp_path: Path) -> None:
    with pytest.raises(ValueError, match="No frontend tests found"):
        release_readiness.build_static_checks(
            repo_root=tmp_path,
            frontend_root=tmp_path / "frontend",
            backend_root=tmp_path / "backend",
            python_executable=Path(sys.executable),
        )


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


def test_runtime_smoke_reports_pass_for_health_and_frontend_routes() -> None:
    events: list[str] = []

    class Handler(BaseHTTPRequestHandler):
        def do_GET(self):  # noqa: N802
            events.append(self.path)
            if self.path == "/api/v1/health":
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(b'{"status":"ok"}')
                return
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"ok")

        def log_message(self, format, *args):  # type: ignore[override]
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


def test_browser_smoke_targets_define_a_small_consultant_facing_contract() -> None:
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


def test_browser_smoke_targets_reject_unknown_profile() -> None:
    try:
        release_readiness.build_browser_smoke_targets("legacy-8010")
    except ValueError as exc:
        assert "Unsupported browser smoke profile" in str(exc)
    else:
        raise AssertionError("expected browser smoke targets to reject unknown profile")
