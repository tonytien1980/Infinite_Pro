from __future__ import annotations

from collections.abc import Generator

from sqlalchemy import create_engine, inspect, select, text
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
    _normalize_incremental_data()
    _ensure_incremental_indexes()


def _ensure_incremental_schema_updates() -> None:
    datetime_column_type = (
        "DATETIME"
        if settings.database_url.startswith("sqlite")
        else "TIMESTAMP WITH TIME ZONE"
    )
    schema_patches = {
        "workbench_preferences": {
            "interface_language": "VARCHAR(20) NOT NULL DEFAULT 'zh-Hant'",
            "theme_preference": "VARCHAR(20) NOT NULL DEFAULT 'light'",
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
            "hidden_at": datetime_column_type,
        },
        "matter_workspaces": {
            "summary": "TEXT NOT NULL DEFAULT ''",
            "status": "VARCHAR(50)",
            "content_sections": "JSON NOT NULL DEFAULT '{}'",
            "title_override_active": "BOOLEAN NOT NULL DEFAULT FALSE",
            "engagement_continuity_mode": "VARCHAR(30) NOT NULL DEFAULT 'one_off'",
            "writeback_depth": "VARCHAR(30) NOT NULL DEFAULT 'minimal'",
        },
        "tasks": {
            "entry_preset": "VARCHAR(50) NOT NULL DEFAULT 'one_line_inquiry'",
        },
        "case_world_states": {
            "client_id": "VARCHAR(36)",
            "engagement_id": "VARCHAR(36)",
            "workstream_id": "VARCHAR(36)",
            "decision_context_id": "VARCHAR(36)",
        },
        "clients": {
            "matter_workspace_id": "VARCHAR(36)",
            "identity_scope": "VARCHAR(30) NOT NULL DEFAULT 'slice_overlay'",
        },
        "engagements": {
            "matter_workspace_id": "VARCHAR(36)",
            "identity_scope": "VARCHAR(30) NOT NULL DEFAULT 'slice_overlay'",
        },
        "workstreams": {
            "matter_workspace_id": "VARCHAR(36)",
            "identity_scope": "VARCHAR(30) NOT NULL DEFAULT 'slice_overlay'",
        },
        "decision_contexts": {
            "matter_workspace_id": "VARCHAR(36)",
            "identity_scope": "VARCHAR(30) NOT NULL DEFAULT 'slice_overlay'",
        },
        "deliverables": {
            "summary": "TEXT NOT NULL DEFAULT ''",
            "status": "VARCHAR(50)",
            "version_tag": "VARCHAR(50)",
            "content_sections": "JSON NOT NULL DEFAULT '{}'",
        },
        "deliverable_version_events": {
            "event_key": "VARCHAR(255)",
        },
        "source_documents": {
            "matter_workspace_id": "VARCHAR(36)",
            "research_run_id": "VARCHAR(36)",
            "continuity_scope": "VARCHAR(30) NOT NULL DEFAULT 'slice_participation'",
            "canonical_display_name": "VARCHAR(255) NOT NULL DEFAULT ''",
            "file_extension": "VARCHAR(20)",
            "storage_key": "VARCHAR(1024)",
            "storage_kind": "VARCHAR(50) NOT NULL DEFAULT 'raw_intake'",
            "storage_provider": "VARCHAR(50) NOT NULL DEFAULT 'local_fs'",
            "content_digest": "VARCHAR(128)",
            "ingest_strategy": "VARCHAR(100) NOT NULL DEFAULT 'text_extract'",
            "support_level": "VARCHAR(30) NOT NULL DEFAULT 'full'",
            "retention_policy": "VARCHAR(100) NOT NULL DEFAULT 'raw_default_30d'",
            "purge_at": datetime_column_type,
            "availability_state": "VARCHAR(30) NOT NULL DEFAULT 'available'",
            "metadata_only": "BOOLEAN NOT NULL DEFAULT FALSE",
            "derived_storage_key": "VARCHAR(1024)",
            "updated_at": f"{datetime_column_type} NOT NULL DEFAULT CURRENT_TIMESTAMP",
        },
        "research_runs": {
            "research_depth": "VARCHAR(50) NOT NULL DEFAULT 'light_completion'",
            "sub_questions": "JSON NOT NULL DEFAULT '[]'",
            "evidence_gap_focus": "JSON NOT NULL DEFAULT '[]'",
            "source_quality_summary": "TEXT NOT NULL DEFAULT ''",
            "contradiction_summary": "TEXT NOT NULL DEFAULT ''",
            "citation_handoff_summary": "TEXT NOT NULL DEFAULT ''",
        },
        "source_materials": {
            "matter_workspace_id": "VARCHAR(36)",
            "continuity_scope": "VARCHAR(30) NOT NULL DEFAULT 'slice_participation'",
            "canonical_display_name": "VARCHAR(255) NOT NULL DEFAULT ''",
            "file_extension": "VARCHAR(20)",
            "file_size": "INTEGER NOT NULL DEFAULT 0",
            "storage_key": "VARCHAR(1024)",
            "storage_kind": "VARCHAR(50) NOT NULL DEFAULT 'raw_intake'",
            "storage_provider": "VARCHAR(50) NOT NULL DEFAULT 'local_fs'",
            "content_digest": "VARCHAR(128)",
            "ingest_strategy": "VARCHAR(100) NOT NULL DEFAULT 'text_extract'",
            "support_level": "VARCHAR(30) NOT NULL DEFAULT 'full'",
            "retention_policy": "VARCHAR(100) NOT NULL DEFAULT 'raw_default_30d'",
            "purge_at": datetime_column_type,
            "availability_state": "VARCHAR(30) NOT NULL DEFAULT 'available'",
            "metadata_only": "BOOLEAN NOT NULL DEFAULT FALSE",
            "updated_at": f"{datetime_column_type} NOT NULL DEFAULT CURRENT_TIMESTAMP",
        },
        "artifacts": {
            "matter_workspace_id": "VARCHAR(36)",
            "continuity_scope": "VARCHAR(30) NOT NULL DEFAULT 'slice_participation'",
        },
        "evidence": {
            "matter_workspace_id": "VARCHAR(36)",
            "source_material_id": "VARCHAR(36)",
            "artifact_id": "VARCHAR(36)",
            "chunk_object_id": "VARCHAR(36)",
            "media_reference_id": "VARCHAR(36)",
            "continuity_scope": "VARCHAR(30) NOT NULL DEFAULT 'slice_participation'",
        },
        "task_object_participation_links": {
            "source_document_id": "VARCHAR(36)",
            "source_material_id": "VARCHAR(36)",
            "artifact_id": "VARCHAR(36)",
            "evidence_id": "VARCHAR(36)",
        },
        "deliverable_artifact_records": {
            "storage_provider": "VARCHAR(50) NOT NULL DEFAULT 'local_fs'",
            "retention_policy": "VARCHAR(100) NOT NULL DEFAULT 'release_365d'",
            "purge_at": datetime_column_type,
        },
        "decision_records": {
            "function_type": "VARCHAR(50) NOT NULL DEFAULT 'synthesize_brief'",
            "approval_policy": "VARCHAR(50) NOT NULL DEFAULT 'not_required'",
            "approval_status": "VARCHAR(50) NOT NULL DEFAULT 'not_required'",
            "approval_summary": "TEXT NOT NULL DEFAULT ''",
            "approved_at": datetime_column_type,
        },
        "action_plans": {
            "action_type": "VARCHAR(50) NOT NULL DEFAULT 'decision_follow_through'",
            "approval_policy": "VARCHAR(50) NOT NULL DEFAULT 'not_required'",
            "approval_status": "VARCHAR(50) NOT NULL DEFAULT 'not_required'",
            "approval_summary": "TEXT NOT NULL DEFAULT ''",
            "approved_at": datetime_column_type,
        },
        "action_executions": {
            "action_type": "VARCHAR(50) NOT NULL DEFAULT 'action_execution_tracking'",
        },
        "outcome_records": {
            "function_type": "VARCHAR(50) NOT NULL DEFAULT 'outcome_observation'",
        },
        "adoption_feedback": {
            "reason_codes": "JSON NOT NULL DEFAULT '[]'",
        },
        "precedent_candidates": {
            "source_feedback_reason_codes": "JSON NOT NULL DEFAULT '[]'",
        },
        "object_set_members": {
            "support_evidence_id": "VARCHAR(36)",
            "member_metadata": "JSON NOT NULL DEFAULT '{}'",
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


def _normalize_incremental_data() -> None:
    from app.domain import models
    from app.services.artifact_storage import backfill_deliverable_artifact_storage
    from app.services.content_revisions import (
        ensure_deliverable_content_revisions,
        ensure_matter_content_revisions,
    )
    from app.services.deliverable_records import (
        ensure_deliverable_release_records,
        normalize_deliverable_version_events,
    )
    from app.services.material_storage import normalize_source_storage_metadata

    session = SessionLocal()
    try:
        if settings.database_url.startswith("sqlite"):
            with session.bind.begin() as connection:
                connection.execute(text("UPDATE clients SET identity_scope = 'slice_overlay' WHERE identity_scope = 'task_slice'"))
                connection.execute(text("UPDATE engagements SET identity_scope = 'slice_overlay' WHERE identity_scope = 'task_slice'"))
                connection.execute(text("UPDATE workstreams SET identity_scope = 'slice_overlay' WHERE identity_scope = 'task_slice'"))
                connection.execute(text("UPDATE decision_contexts SET identity_scope = 'slice_overlay' WHERE identity_scope = 'task_slice'"))
                connection.execute(text("UPDATE source_documents SET continuity_scope = 'slice_participation' WHERE continuity_scope = 'task_slice'"))
                connection.execute(text("UPDATE source_materials SET continuity_scope = 'slice_participation' WHERE continuity_scope = 'task_slice'"))
                connection.execute(text("UPDATE artifacts SET continuity_scope = 'slice_participation' WHERE continuity_scope = 'task_slice'"))
                connection.execute(text("UPDATE evidence SET continuity_scope = 'slice_participation' WHERE continuity_scope = 'task_slice'"))
        else:
            with session.bind.begin() as connection:
                connection.execute(text("UPDATE clients SET identity_scope = 'slice_overlay' WHERE identity_scope = 'task_slice'"))
                connection.execute(text("UPDATE engagements SET identity_scope = 'slice_overlay' WHERE identity_scope = 'task_slice'"))
                connection.execute(text("UPDATE workstreams SET identity_scope = 'slice_overlay' WHERE identity_scope = 'task_slice'"))
                connection.execute(text("UPDATE decision_contexts SET identity_scope = 'slice_overlay' WHERE identity_scope = 'task_slice'"))
                connection.execute(text("UPDATE source_documents SET continuity_scope = 'slice_participation' WHERE continuity_scope = 'task_slice'"))
                connection.execute(text("UPDATE source_materials SET continuity_scope = 'slice_participation' WHERE continuity_scope = 'task_slice'"))
                connection.execute(text("UPDATE artifacts SET continuity_scope = 'slice_participation' WHERE continuity_scope = 'task_slice'"))
                connection.execute(text("UPDATE evidence SET continuity_scope = 'slice_participation' WHERE continuity_scope = 'task_slice'"))
        deliverables = session.scalars(select(models.Deliverable)).all()
        deliverable_ids = session.scalars(
            select(models.DeliverableVersionEvent.deliverable_id).distinct()
        ).all()
        for deliverable_id in deliverable_ids:
            normalize_deliverable_version_events(session, deliverable_id)
        normalize_source_storage_metadata(session)
        matter_workspaces = session.scalars(select(models.MatterWorkspace)).all()
        for matter_workspace in matter_workspaces:
            ensure_matter_content_revisions(session, matter_workspace)
        for deliverable in deliverables:
            ensure_deliverable_content_revisions(session, deliverable)
            ensure_deliverable_release_records(
                session,
                deliverable,
                fallback_status=deliverable.status,
            )
            backfill_deliverable_artifact_storage(session, deliverable.id)

        participation_links = session.scalars(select(models.TaskObjectParticipationLink)).all()
        for link in participation_links:
            canonical_id = link.canonical_object_id or link.object_id
            if link.object_type == "source_document":
                if link.source_document_id != canonical_id:
                    link.source_document_id = canonical_id
                    session.add(link)
                continue
            if link.object_type == "source_material":
                source_material = session.get(models.SourceMaterial, canonical_id)
                if source_material is None:
                    continue
                if link.source_material_id != source_material.id:
                    link.source_material_id = source_material.id
                    session.add(link)
                if link.source_document_id != source_material.source_document_id:
                    link.source_document_id = source_material.source_document_id
                    session.add(link)
                continue
            if link.object_type == "artifact":
                artifact = session.get(models.Artifact, canonical_id)
                if artifact is None:
                    continue
                if link.artifact_id != artifact.id:
                    link.artifact_id = artifact.id
                    session.add(link)
                if link.source_material_id != artifact.source_material_id:
                    link.source_material_id = artifact.source_material_id
                    session.add(link)
                if link.source_document_id != artifact.source_document_id:
                    link.source_document_id = artifact.source_document_id
                    session.add(link)
                continue
            if link.object_type == "evidence":
                evidence = session.get(models.Evidence, canonical_id)
                if evidence is None:
                    continue
                if link.evidence_id != evidence.id:
                    link.evidence_id = evidence.id
                    session.add(link)
                if link.artifact_id != evidence.artifact_id:
                    link.artifact_id = evidence.artifact_id
                    session.add(link)
                if link.source_material_id != evidence.source_material_id:
                    link.source_material_id = evidence.source_material_id
                    session.add(link)
                if link.source_document_id != evidence.source_document_id:
                    link.source_document_id = evidence.source_document_id
                    session.add(link)
    finally:
        session.close()


def _ensure_incremental_indexes() -> None:
    index_statements = [
        "CREATE UNIQUE INDEX IF NOT EXISTS uq_deliverable_version_event_key "
        "ON deliverable_version_events (deliverable_id, event_key)",
        "CREATE INDEX IF NOT EXISTS ix_source_documents_content_digest "
        "ON source_documents (content_digest)",
        "CREATE INDEX IF NOT EXISTS ix_task_object_participation_lookup "
        "ON task_object_participation_links (matter_workspace_id, object_type, canonical_object_id)",
        "CREATE INDEX IF NOT EXISTS ix_task_object_participation_source_document "
        "ON task_object_participation_links (matter_workspace_id, source_document_id)",
        "CREATE INDEX IF NOT EXISTS ix_chunk_objects_source_document "
        "ON chunk_objects (source_document_id, sequence_index)",
        "CREATE INDEX IF NOT EXISTS ix_media_references_source_document "
        "ON media_references (source_document_id)",
    ]

    with engine.begin() as connection:
        for statement in index_statements:
            connection.execute(text(statement))


def get_db() -> Generator[Session, None, None]:
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
