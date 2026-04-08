from __future__ import annotations

import importlib.util
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread

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
