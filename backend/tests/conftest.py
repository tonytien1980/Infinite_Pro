from __future__ import annotations

import ipaddress
import os
import shutil
import socket
import sys
from pathlib import Path
from tempfile import gettempdir, mkdtemp
from typing import Generator
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url
from sqlalchemy.pool import NullPool

BACKEND_ROOT = Path(__file__).resolve().parents[1]
requested_root = os.environ.get("IP_TEST_RUN_ROOT")
RUNTIME_DIR = Path(requested_root or mkdtemp(prefix="infinite-pro-test.")).resolve()
if (
    RUNTIME_DIR.parent not in {Path(gettempdir()).resolve(), Path("/private/tmp").resolve()}
    or not RUNTIME_DIR.name.startswith("infinite-pro-test.")
    or (requested_root and Path(requested_root).is_symlink())
):
    raise RuntimeError("Unsafe test root: use a dedicated temporary directory")
DATABASE_PATH = RUNTIME_DIR / "test.db"
UPLOAD_DIR = RUNTIME_DIR / "uploads"

database_url = make_url(os.environ.get("DATABASE_URL", f"sqlite+pysqlite:///{DATABASE_PATH}"))
POSTGRES_SCHEMA: str | None = None
POSTGRES_ADMIN_ENGINE = None
if database_url.drivername == "sqlite+pysqlite":
    if (
        database_url.query
        or not database_url.database
        or Path(database_url.database).resolve() != DATABASE_PATH
        or DATABASE_PATH.exists()
    ):
        raise RuntimeError("Unsafe test database: SQLite must be this run's test.db")
elif database_url.drivername == "postgresql+psycopg":
    if (
        os.environ.get("IP_TEST_ALLOW_DISPOSABLE_POSTGRES") != "1"
        or not database_url.database
        or database_url.query
    ):
        raise RuntimeError("Unsafe test database: PostgreSQL requires explicit disposable-test authorization")
else:
    raise RuntimeError("Unsafe test database: unsupported test database URL")

for name, leaf in (("UPLOAD_DIR", "uploads"), ("DERIVED_DIR", "derived"), ("RELEASE_DIR", "releases")):
    expected = RUNTIME_DIR / leaf
    requested = Path(os.environ.get(name, str(expected)))
    if requested.resolve() != expected or requested.is_symlink():
        raise RuntimeError(f"Unsafe test storage: {name} must belong to this test run")
    os.environ[name] = str(expected)
if os.environ.get("MODEL_PROVIDER", "mock") != "mock":
    raise RuntimeError("Tests require MODEL_PROVIDER=mock")

# Validate the destination before importing app settings or constructing its engine.
if database_url.drivername == "postgresql+psycopg":
    POSTGRES_ADMIN_ENGINE = create_engine(database_url, poolclass=NullPool, connect_args={"connect_timeout": 5})
    with POSTGRES_ADMIN_ENGINE.begin() as connection:
        privileges = connection.execute(text(
            "SELECT rolsuper, rolcreatedb, rolcreaterole, rolreplication, "
            "shobj_description((SELECT oid FROM pg_database WHERE datname = current_database()), "
            "'pg_database') AS marker FROM pg_roles WHERE rolname = current_user"
        )).mappings().one()
        if any(privileges[name] for name in ("rolsuper", "rolcreatedb", "rolcreaterole", "rolreplication")) or privileges["marker"] != "infinite-pro-disposable-test":
            raise RuntimeError("Unsafe test database: require an unprivileged role and disposable database marker")
        POSTGRES_SCHEMA = f"ip_test_{uuid4().hex}"
        connection.execute(text(f'CREATE SCHEMA "{POSTGRES_SCHEMA}"'))
    database_url = database_url.update_query_dict({"options": f"-csearch_path={POSTGRES_SCHEMA}"})

RUNTIME_DIR.mkdir(mode=0o700, exist_ok=True)
os.environ.update({
    "IP_TEST_RUN_ROOT": str(RUNTIME_DIR),
    "DATABASE_URL": database_url.render_as_string(hide_password=False),
    "MODEL_PROVIDER": "mock",
    "MODEL_PROVIDER_API_KEY": "",
    "MODEL_PROVIDER_BASE_URL": "",
    "OPENAI_API_KEY": "",
    "GOOGLE_CLIENT_ID": "",
    "GOOGLE_CLIENT_SECRET": "",
    "PROVIDER_SECRET_ENCRYPTION_KEY": "",
    "SESSION_SECRET_KEY": "infinite-pro-test-only-session-secret",
    "BOOTSTRAP_OWNER_EMAILS": "",
    "CORS_ORIGINS": "http://localhost:3000",
})

sys.path.insert(0, str(BACKEND_ROOT))

from app.core.auth import CurrentMember, ROLE_PERMISSIONS, require_current_member  # noqa: E402
from app.core.database import Base, SessionLocal, engine  # noqa: E402
from app.domain import models  # noqa: E402
from app.main import create_app  # noqa: E402


@pytest.fixture(autouse=True)
def block_unplanned_network(monkeypatch: pytest.MonkeyPatch) -> None:
    original_connect = socket.socket.connect
    original_connect_ex = socket.socket.connect_ex

    def check_address(sock: socket.socket, address) -> None:
        if sock.family in {socket.AF_INET, socket.AF_INET6}:
            host = address[0]
            try:
                allowed = ipaddress.ip_address(host).is_loopback
            except ValueError:
                allowed = host == "localhost"
            if not allowed:
                raise RuntimeError("External network is disabled in the mock test suite")

    def guarded_connect(sock: socket.socket, address):
        check_address(sock, address)
        return original_connect(sock, address)

    def guarded_connect_ex(sock: socket.socket, address):
        check_address(sock, address)
        return original_connect_ex(sock, address)

    monkeypatch.setattr(socket.socket, "connect", guarded_connect)
    monkeypatch.setattr(socket.socket, "connect_ex", guarded_connect_ex)


@pytest.fixture()
def anonymous_client() -> Generator[TestClient, None, None]:
    if UPLOAD_DIR.exists():
        shutil.rmtree(UPLOAD_DIR)
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    engine.dispose()
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    with TestClient(create_app()) as test_client:
        yield test_client

    Base.metadata.drop_all(bind=engine)


def _seed_default_owner_current_member() -> CurrentMember:
    with SessionLocal() as session:
        firm = models.Firm(name="Test Firm", slug="test-firm")
        user = models.User(email="owner@test.local", full_name="Test Owner")
        membership = models.FirmMembership(
            firm=firm,
            user=user,
            role="owner",
            status="active",
        )
        session.add_all([firm, user, membership])
        session.commit()
        session.refresh(firm)
        session.refresh(user)
        session.refresh(membership)
        return CurrentMember(
            user=user,
            firm=firm,
            membership=membership,
            permissions=set(ROLE_PERMISSIONS["owner"]),
        )


@pytest.fixture()
def client(anonymous_client: TestClient) -> Generator[TestClient, None, None]:
    app = anonymous_client.app
    current_member = _seed_default_owner_current_member()
    app.dependency_overrides[require_current_member] = lambda: current_member
    try:
        yield anonymous_client
    finally:
        app.dependency_overrides.clear()


@pytest.fixture(scope="session", autouse=True)
def cleanup_runtime_dir() -> Generator[None, None, None]:
    yield
    engine.dispose()
    if POSTGRES_ADMIN_ENGINE is not None and POSTGRES_SCHEMA is not None:
        with POSTGRES_ADMIN_ENGINE.begin() as connection:
            connection.execute(text(f'DROP SCHEMA "{POSTGRES_SCHEMA}" CASCADE'))
        POSTGRES_ADMIN_ENGINE.dispose()
    if RUNTIME_DIR.exists():
        shutil.rmtree(RUNTIME_DIR)
