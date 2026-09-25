from __future__ import annotations

import json
import os
from pathlib import Path
import subprocess
import sys
from tempfile import TemporaryDirectory

import pytest


CONFTEST_PATH = Path(__file__).with_name("conftest.py")
GUARD_PROBE = """
import importlib.abc
import runpy
import sys

class RejectAppImport(importlib.abc.MetaPathFinder):
    def find_spec(self, fullname, path=None, target=None):
        if fullname == "app" or fullname.startswith("app."):
            raise RuntimeError("APP_IMPORTED_BEFORE_GUARD")

sys.meta_path.insert(0, RejectAppImport())
runpy.run_path(sys.argv[1])
"""
VALID_PROBE = """
import json
import os
import runpy
import sys

scope = runpy.run_path(sys.argv[1])
from app.core.config import settings
print(json.dumps({
    "root": str(scope["RUNTIME_DIR"]),
    "database": settings.database_url,
    "upload": str(settings.upload_path),
    "derived": str(settings.derived_path),
    "release": str(settings.release_path),
    "provider": settings.model_provider,
    "has_provider_key": bool(settings.model_provider_api_key or settings.openai_api_key),
}))
"""


def probe(root: Path, *, overrides: dict[str, str], guard_only: bool = True):
    env = os.environ.copy()
    for key in list(env):
        if key.startswith("IP_TEST_") or key in {
            "DATABASE_URL", "UPLOAD_DIR", "DERIVED_DIR", "RELEASE_DIR",
            "MODEL_PROVIDER", "MODEL_PROVIDER_API_KEY", "OPENAI_API_KEY",
        }:
            env.pop(key)
    env.update({
        "IP_TEST_RUN_ROOT": str(root),
        "DATABASE_URL": f"sqlite+pysqlite:///{root / 'test.db'}",
        "MODEL_PROVIDER": "mock",
        **overrides,
    })
    return subprocess.run(
        [sys.executable, "-c", GUARD_PROBE if guard_only else VALID_PROBE, str(CONFTEST_PATH)],
        cwd=root,
        env=env,
        capture_output=True,
        text=True,
        timeout=30,
    )


@pytest.mark.parametrize("database_url", [
    "postgresql+psycopg://test:test@invalid.local/production",
    "sqlite+pysqlite:////private/tmp/not-a-test-database.db",
    "sqlite+pysqlite:///:memory:",
])
def test_rejects_unsafe_database_before_app_import(database_url: str) -> None:
    with TemporaryDirectory(prefix="infinite-pro-test.") as directory:
        result = probe(Path(directory), overrides={"DATABASE_URL": database_url})
    assert result.returncode != 0
    assert "Unsafe test database" in result.stderr
    assert "APP_IMPORTED_BEFORE_GUARD" not in result.stderr


@pytest.mark.parametrize("setting", ["UPLOAD_DIR", "DERIVED_DIR", "RELEASE_DIR"])
def test_rejects_storage_outside_test_root_before_app_import(setting: str) -> None:
    with TemporaryDirectory(prefix="infinite-pro-test.") as directory:
        result = probe(Path(directory), overrides={setting: "/private/tmp/real-client-materials"})
    assert result.returncode != 0
    assert "Unsafe test storage" in result.stderr
    assert "APP_IMPORTED_BEFORE_GUARD" not in result.stderr


def test_rejects_paid_provider_before_app_import() -> None:
    with TemporaryDirectory(prefix="infinite-pro-test.") as directory:
        result = probe(Path(directory), overrides={"MODEL_PROVIDER": "openai"})
    assert result.returncode != 0
    assert "Tests require MODEL_PROVIDER=mock" in result.stderr
    assert "APP_IMPORTED_BEFORE_GUARD" not in result.stderr


def test_valid_root_controls_all_storage_and_ignores_dotenv_secrets() -> None:
    with TemporaryDirectory(prefix="infinite-pro-test.") as directory:
        root = Path(directory).resolve()
        (root / ".env").write_text(
            "OPENAI_API_KEY=not-a-real-key\nMODEL_PROVIDER_API_KEY=also-not-real\n",
            encoding="utf-8",
        )
        result = probe(root, overrides={}, guard_only=False)
        assert result.returncode == 0, result.stderr
        payload = json.loads(result.stdout)
        assert payload == {
            "root": str(root),
            "database": f"sqlite+pysqlite:///{root / 'test.db'}",
            "upload": str(root / "uploads"),
            "derived": str(root / "derived"),
            "release": str(root / "releases"),
            "provider": "mock",
            "has_provider_key": False,
        }


def test_rejects_symlinked_storage_before_app_import() -> None:
    with TemporaryDirectory(prefix="infinite-pro-test.") as directory:
        root = Path(directory)
        (root / "uploads").symlink_to(root.parent, target_is_directory=True)
        result = probe(root, overrides={})
    assert result.returncode != 0
    assert "Unsafe test storage" in result.stderr
    assert "APP_IMPORTED_BEFORE_GUARD" not in result.stderr


def test_mock_suite_blocks_external_network_before_connecting() -> None:
    import socket

    with socket.socket() as connection:
        with pytest.raises(RuntimeError, match="External network is disabled"):
            connection.connect(("203.0.113.10", 443))


def test_rejects_arbitrary_temporary_directory_as_test_root() -> None:
    with TemporaryDirectory(prefix="client-materials-") as directory:
        result = probe(Path(directory), overrides={})
    assert result.returncode != 0
    assert "Unsafe test root" in result.stderr
    assert "APP_IMPORTED_BEFORE_GUARD" not in result.stderr


def test_rejects_existing_sqlite_file_without_changing_it() -> None:
    with TemporaryDirectory(prefix="infinite-pro-test.") as directory:
        root = Path(directory)
        database = root / "test.db"
        database.write_bytes(b"existing-data-must-not-change")
        result = probe(root, overrides={})
        assert database.read_bytes() == b"existing-data-must-not-change"
    assert result.returncode != 0
    assert "Unsafe test database" in result.stderr
    assert "APP_IMPORTED_BEFORE_GUARD" not in result.stderr


def test_mock_suite_blocks_connect_ex_before_connecting() -> None:
    import socket

    with socket.socket() as connection:
        connection.settimeout(0.01)
        with pytest.raises(RuntimeError, match="External network is disabled"):
            connection.connect_ex(("203.0.113.10", 443))
