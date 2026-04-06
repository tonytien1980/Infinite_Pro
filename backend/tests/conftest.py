from __future__ import annotations

import os
import shutil
import sys
from pathlib import Path
from typing import Generator

import pytest
from fastapi.testclient import TestClient

BACKEND_ROOT = Path(__file__).resolve().parents[1]
RUNTIME_DIR = BACKEND_ROOT / ".pytest_runtime"
DATABASE_PATH = RUNTIME_DIR / "test.db"
UPLOAD_DIR = RUNTIME_DIR / "uploads"
RUNTIME_DIR.mkdir(parents=True, exist_ok=True)

os.environ.setdefault("DATABASE_URL", f"sqlite+pysqlite:///{DATABASE_PATH}")
os.environ.setdefault("UPLOAD_DIR", str(UPLOAD_DIR))
os.environ.setdefault("MODEL_PROVIDER", "mock")
os.environ.setdefault("CORS_ORIGINS", "http://localhost:3000")

sys.path.insert(0, str(BACKEND_ROOT))

from app.core.auth import CurrentMember, ROLE_PERMISSIONS, require_current_member  # noqa: E402
from app.core.database import Base, SessionLocal, engine  # noqa: E402
from app.domain import models  # noqa: E402
from app.main import create_app  # noqa: E402


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
    if RUNTIME_DIR.exists():
        shutil.rmtree(RUNTIME_DIR)
