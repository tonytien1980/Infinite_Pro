from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.domain import models
from app.ingestion.preprocess import build_text_chunks, infer_relevance_label, summarize_evidence_text
from app.services.material_storage import build_source_reference, sync_source_material_from_document

WORLD_SHARED_CONTINUITY_SCOPE = "world_shared"
SLICE_PARTICIPATION_CONTINUITY_SCOPE = "slice_participation"
OBJECT_TYPE_SOURCE_MATERIAL = "source_material"
OBJECT_TYPE_ARTIFACT = "artifact"
OBJECT_TYPE_EVIDENCE = "evidence"
PARTICIPATION_TYPE_DIRECT_INGEST = "direct_ingest"
PARTICIPATION_TYPE_SHARED_REUSE = "shared_reuse"


def _task_query_parts(task: models.Task) -> list[str]:
    return [
        task.title,
        task.description,
        *(subject.name for subject in task.subjects),
        *(goal.description for goal in task.goals),
    ]


def build_source_material_summary(source_document: models.SourceDocument) -> str:
    return (
        (source_document.extracted_text or source_document.ingestion_error or "").strip()[:500]
    )


def infer_artifact_type(source_document: models.SourceDocument) -> str:
    if source_document.source_type in {"manual_upload", "manual_input", "manual_url", "google_docs"}:
        return "working_material"
    if source_document.source_type == "external_search":
        return "external_reference"
    return "source_artifact"


def load_existing_world_shared_bundle(
    db: Session,
    *,
    matter_workspace_id: str | None,
    source_type: str,
    storage_path: str | None = None,
    content_digest: str | None = None,
) -> tuple[models.SourceDocument, models.SourceMaterial, models.Artifact, models.Evidence] | None:
    if not matter_workspace_id:
        return None
    if not storage_path and not content_digest:
        return None

    statement = (
        select(models.SourceDocument)
        .where(models.SourceDocument.matter_workspace_id == matter_workspace_id)
        .where(models.SourceDocument.continuity_scope == WORLD_SHARED_CONTINUITY_SCOPE)
        .where(models.SourceDocument.source_type == source_type)
        .order_by(models.SourceDocument.created_at)
    )
    if storage_path:
        statement = statement.where(models.SourceDocument.storage_path == storage_path)
    else:
        statement = statement.where(models.SourceDocument.content_digest == content_digest)

    source_document = db.scalars(statement).first()
    if source_document is None:
        return None

    source_material = db.scalars(
        select(models.SourceMaterial)
        .where(models.SourceMaterial.source_document_id == source_document.id)
        .where(models.SourceMaterial.matter_workspace_id == matter_workspace_id)
        .where(models.SourceMaterial.continuity_scope == WORLD_SHARED_CONTINUITY_SCOPE)
        .order_by(models.SourceMaterial.created_at)
    ).first()
    artifact = db.scalars(
        select(models.Artifact)
        .where(models.Artifact.source_document_id == source_document.id)
        .where(models.Artifact.matter_workspace_id == matter_workspace_id)
        .where(models.Artifact.continuity_scope == WORLD_SHARED_CONTINUITY_SCOPE)
        .order_by(models.Artifact.created_at)
    ).first()
    evidence = db.scalars(
        select(models.Evidence)
        .where(models.Evidence.source_document_id == source_document.id)
        .where(models.Evidence.matter_workspace_id == matter_workspace_id)
        .where(models.Evidence.continuity_scope == WORLD_SHARED_CONTINUITY_SCOPE)
        .where(models.Evidence.evidence_type != "source_chunk")
        .order_by(models.Evidence.created_at)
    ).first()

    if source_material is None or artifact is None or evidence is None:
        return None
    return source_document, source_material, artifact, evidence


def ensure_task_object_participation_link(
    db: Session,
    *,
    task_id: str,
    matter_workspace_id: str | None,
    object_type: str,
    object_id: str,
    canonical_object_id: str | None = None,
    participation_type: str = PARTICIPATION_TYPE_SHARED_REUSE,
) -> models.TaskObjectParticipationLink | None:
    if not matter_workspace_id:
        return None

    link = db.scalars(
        select(models.TaskObjectParticipationLink)
        .where(models.TaskObjectParticipationLink.task_id == task_id)
        .where(models.TaskObjectParticipationLink.object_type == object_type)
        .where(models.TaskObjectParticipationLink.object_id == object_id)
    ).first()
    if link is None:
        link = models.TaskObjectParticipationLink(
            task_id=task_id,
            matter_workspace_id=matter_workspace_id,
            object_type=object_type,
            object_id=object_id,
            canonical_object_id=canonical_object_id or object_id,
            participation_type=participation_type,
        )
        db.add(link)
        db.flush()
        return link

    changed = False
    resolved_canonical_id = canonical_object_id or object_id
    if link.matter_workspace_id != matter_workspace_id:
        link.matter_workspace_id = matter_workspace_id
        changed = True
    if link.canonical_object_id != resolved_canonical_id:
        link.canonical_object_id = resolved_canonical_id
        changed = True
    if link.participation_type != participation_type:
        link.participation_type = participation_type
        changed = True
    if changed:
        db.add(link)
        db.flush()
    return link


def ensure_material_evidence_participation_links(
    db: Session,
    *,
    task_id: str,
    matter_workspace_id: str | None,
    source_material_id: str | None,
    artifact_id: str | None,
    evidence_id: str | None,
    participation_type: str,
) -> None:
    if source_material_id:
        ensure_task_object_participation_link(
            db,
            task_id=task_id,
            matter_workspace_id=matter_workspace_id,
            object_type=OBJECT_TYPE_SOURCE_MATERIAL,
            object_id=source_material_id,
            canonical_object_id=source_material_id,
            participation_type=participation_type,
        )
    if artifact_id:
        ensure_task_object_participation_link(
            db,
            task_id=task_id,
            matter_workspace_id=matter_workspace_id,
            object_type=OBJECT_TYPE_ARTIFACT,
            object_id=artifact_id,
            canonical_object_id=artifact_id,
            participation_type=participation_type,
        )
    if evidence_id:
        ensure_task_object_participation_link(
            db,
            task_id=task_id,
            matter_workspace_id=matter_workspace_id,
            object_type=OBJECT_TYPE_EVIDENCE,
            object_id=evidence_id,
            canonical_object_id=evidence_id,
            participation_type=participation_type,
        )


def build_source_objects_for_document(
    *,
    task_id: str,
    matter_workspace_id: str | None,
    source_document: models.SourceDocument,
    continuity_scope: str = SLICE_PARTICIPATION_CONTINUITY_SCOPE,
) -> tuple[models.SourceMaterial, models.Artifact]:
    summary = build_source_material_summary(source_document)
    source_material = models.SourceMaterial(
        task_id=task_id,
        matter_workspace_id=matter_workspace_id,
        source_document_id=source_document.id,
        continuity_scope=continuity_scope,
        source_type=source_document.source_type,
        title=source_document.canonical_display_name or source_document.file_name,
        canonical_display_name=source_document.canonical_display_name or source_document.file_name,
        source_ref=build_source_reference(source_document),
        file_extension=source_document.file_extension,
        content_type=source_document.content_type,
        file_size=source_document.file_size,
        storage_key=source_document.storage_key,
        storage_kind=source_document.storage_kind,
        storage_provider=source_document.storage_provider,
        content_digest=source_document.content_digest,
        ingest_status=source_document.ingest_status,
        ingest_strategy=source_document.ingest_strategy,
        support_level=source_document.support_level,
        retention_policy=source_document.retention_policy,
        purge_at=source_document.purge_at,
        availability_state=source_document.availability_state,
        metadata_only=source_document.metadata_only,
        summary=summary,
    )
    artifact = models.Artifact(
        task_id=task_id,
        matter_workspace_id=matter_workspace_id,
        source_document_id=source_document.id,
        title=source_document.canonical_display_name or source_document.file_name,
        continuity_scope=continuity_scope,
        artifact_type=infer_artifact_type(source_document),
        description=summary[:280],
    )
    sync_source_material_from_document(source_material, source_document)
    return source_material, artifact


def build_processed_evidence_items(
    *,
    task: models.Task,
    matter_workspace_id: str | None,
    source_document: models.SourceDocument,
    source_material_id: str | None,
    artifact_id: str | None,
    source_ref: str,
    title: str,
    text: str,
    primary_evidence_type: str,
    reliability_level: str = "user_provided",
    continuity_scope: str = SLICE_PARTICIPATION_CONTINUITY_SCOPE,
) -> tuple[models.Evidence, list[models.Evidence]]:
    relevance = infer_relevance_label(text, _task_query_parts(task))
    summary = summarize_evidence_text(text)
    primary = models.Evidence(
        task_id=task.id,
        matter_workspace_id=matter_workspace_id,
        source_document_id=source_document.id,
        source_material_id=source_material_id,
        artifact_id=artifact_id,
        continuity_scope=continuity_scope,
        evidence_type=primary_evidence_type,
        source_type=source_document.source_type,
        source_ref=source_ref,
        title=title,
        excerpt_or_summary=(
            f"關聯度：{relevance}\n"
            f"來源摘要：{summary}"
        ),
        reliability_level=reliability_level,
    )

    chunk_items = [
        models.Evidence(
            task_id=task.id,
            matter_workspace_id=matter_workspace_id,
            source_document_id=source_document.id,
            source_material_id=source_material_id,
            artifact_id=artifact_id,
            continuity_scope=continuity_scope,
            evidence_type="source_chunk",
            source_type=source_document.source_type,
            source_ref=source_ref,
            title=f"{title} - 片段 {index + 1}",
            excerpt_or_summary=(
                f"關聯度：{relevance}\n"
                f"內容片段：{chunk}"
            ),
            reliability_level=reliability_level,
        )
        for index, chunk in enumerate(build_text_chunks(text))
    ]
    return primary, chunk_items


def build_failed_evidence_item(
    *,
    task_id: str,
    matter_workspace_id: str | None,
    source_document_id: str,
    source_material_id: str | None,
    artifact_id: str | None,
    source_type: str,
    source_ref: str,
    title: str,
    error_message: str,
    continuity_scope: str = SLICE_PARTICIPATION_CONTINUITY_SCOPE,
) -> models.Evidence:
    return models.Evidence(
        task_id=task_id,
        matter_workspace_id=matter_workspace_id,
        source_document_id=source_document_id,
        source_material_id=source_material_id,
        artifact_id=artifact_id,
        continuity_scope=continuity_scope,
        evidence_type="source_ingestion_issue",
        source_type=source_type,
        source_ref=source_ref,
        title=title,
        excerpt_or_summary=f"來源擷取失敗：{error_message}",
        reliability_level="user_provided",
    )


def build_unparsed_evidence_item(
    *,
    task_id: str,
    matter_workspace_id: str | None,
    source_document_id: str,
    source_material_id: str | None,
    artifact_id: str | None,
    source_type: str,
    source_ref: str,
    title: str,
    continuity_scope: str = SLICE_PARTICIPATION_CONTINUITY_SCOPE,
) -> models.Evidence:
    return models.Evidence(
        task_id=task_id,
        matter_workspace_id=matter_workspace_id,
        source_document_id=source_document_id,
        source_material_id=source_material_id,
        artifact_id=artifact_id,
        continuity_scope=continuity_scope,
        evidence_type="source_unparsed",
        source_type=source_type,
        source_ref=source_ref,
        title=title,
        excerpt_or_summary="來源已附加，但目前尚未抽出可供分析的文字內容。",
        reliability_level="user_provided",
    )
