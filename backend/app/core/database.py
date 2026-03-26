from __future__ import annotations

from collections.abc import Generator

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import settings


class Base(DeclarativeBase):
    pass


sqlite_connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
engine = create_engine(
    settings.database_url,
    pool_pre_ping=not settings.database_url.startswith("sqlite"),
    connect_args=sqlite_connect_args,
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def initialize_database() -> None:
    from app.domain import models  # noqa: F401

    Base.metadata.create_all(bind=engine)
    _ensure_incremental_schema_updates()


def _ensure_incremental_schema_updates() -> None:
    schema_patches = {
        "workbench_preferences": {
            "interface_language": "VARCHAR(20) NOT NULL DEFAULT 'zh-Hant'",
            "homepage_display_preference": "VARCHAR(50) NOT NULL DEFAULT 'matters'",
            "history_default_page_size": "INTEGER NOT NULL DEFAULT 20",
            "show_recent_activity": "BOOLEAN NOT NULL DEFAULT TRUE",
            "show_frequent_extensions": "BOOLEAN NOT NULL DEFAULT TRUE",
            "new_task_default_input_mode": "VARCHAR(50) NOT NULL DEFAULT 'one_line_inquiry'",
            "density": "VARCHAR(20) NOT NULL DEFAULT 'standard'",
            "deliverable_sort_preference": "VARCHAR(50) NOT NULL DEFAULT 'updated_desc'",
        },
        "workbench_extension_states": {
            "is_custom": "BOOLEAN NOT NULL DEFAULT FALSE",
            "payload": "JSON NOT NULL DEFAULT '{}'",
        },
        "task_visibility_states": {
            "visibility_state": "VARCHAR(20) NOT NULL DEFAULT 'visible'",
            "hidden_at": "DATETIME",
        },
        "matter_workspaces": {
            "summary": "TEXT NOT NULL DEFAULT ''",
            "status": "VARCHAR(50)",
            "title_override_active": "BOOLEAN NOT NULL DEFAULT FALSE",
        },
        "deliverables": {
            "summary": "TEXT NOT NULL DEFAULT ''",
            "status": "VARCHAR(50)",
            "version_tag": "VARCHAR(50)",
        },
    }

    inspector = inspect(engine)

    with engine.begin() as connection:
        for table_name, columns in schema_patches.items():
            existing_columns = {column["name"] for column in inspector.get_columns(table_name)}

            for column_name, column_definition in columns.items():
                if column_name in existing_columns:
                    continue

                connection.execute(
                    text(
                        f"ALTER TABLE {table_name} "
                        f"ADD COLUMN {column_name} {column_definition}"
                    )
                )


def get_db() -> Generator[Session, None, None]:
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
