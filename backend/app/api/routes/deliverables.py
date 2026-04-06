from __future__ import annotations

from fastapi import APIRouter, Depends
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.auth import require_permission
from app.core.database import get_db
from app.domain import schemas
from app.services.tasks import (
    apply_deliverable_adoption_feedback,
    build_deliverable_docx_export,
    build_deliverable_markdown_export,
    download_deliverable_artifact,
    get_deliverable_workspace,
    publish_deliverable_release,
    rollback_deliverable_content_revision,
    update_deliverable_precedent_candidate_status,
    update_deliverable_metadata,
    update_deliverable_workspace,
)

router = APIRouter(prefix="/deliverables", tags=["deliverables"])


@router.get("/{deliverable_id}", response_model=schemas.DeliverableWorkspaceResponse)
def get_deliverable_workspace_route(
    deliverable_id: str,
    current_member=Depends(require_permission("access_firm_workspace")),
    db: Session = Depends(get_db),
) -> schemas.DeliverableWorkspaceResponse:
    return get_deliverable_workspace(db, deliverable_id)


@router.put("/{deliverable_id}/metadata", response_model=schemas.DeliverableWorkspaceResponse)
def update_deliverable_metadata_route(
    deliverable_id: str,
    payload: schemas.DeliverableMetadataUpdateRequest,
    current_member=Depends(require_permission("access_firm_workspace")),
    db: Session = Depends(get_db),
) -> schemas.DeliverableWorkspaceResponse:
    return update_deliverable_metadata(db, deliverable_id, payload)


@router.put("/{deliverable_id}/workspace", response_model=schemas.DeliverableWorkspaceResponse)
def update_deliverable_workspace_route(
    deliverable_id: str,
    payload: schemas.DeliverableWorkspaceUpdateRequest,
    current_member=Depends(require_permission("access_firm_workspace")),
    db: Session = Depends(get_db),
) -> schemas.DeliverableWorkspaceResponse:
    return update_deliverable_workspace(db, deliverable_id, payload)


@router.post("/{deliverable_id}/publish", response_model=schemas.DeliverableWorkspaceResponse)
def publish_deliverable_release_route(
    deliverable_id: str,
    payload: schemas.DeliverablePublishRequest,
    current_member=Depends(require_permission("access_firm_workspace")),
    db: Session = Depends(get_db),
) -> schemas.DeliverableWorkspaceResponse:
    return publish_deliverable_release(db, deliverable_id, payload)


@router.post("/{deliverable_id}/feedback", response_model=schemas.DeliverableWorkspaceResponse)
def apply_deliverable_adoption_feedback_route(
    deliverable_id: str,
    payload: schemas.AdoptionFeedbackRequest,
    current_member=Depends(require_permission("access_firm_workspace")),
    db: Session = Depends(get_db),
) -> schemas.DeliverableWorkspaceResponse:
    return apply_deliverable_adoption_feedback(db, deliverable_id, payload)


@router.post(
    "/{deliverable_id}/precedent-candidate",
    response_model=schemas.DeliverableWorkspaceResponse,
)
def update_deliverable_precedent_candidate_status_route(
    deliverable_id: str,
    payload: schemas.PrecedentCandidateStatusUpdateRequest,
    current_member=Depends(require_permission("access_firm_workspace")),
    db: Session = Depends(get_db),
) -> schemas.DeliverableWorkspaceResponse:
    return update_deliverable_precedent_candidate_status(db, deliverable_id, payload)


@router.post(
    "/{deliverable_id}/revisions/{revision_id}/rollback",
    response_model=schemas.DeliverableWorkspaceResponse,
)
def rollback_deliverable_content_revision_route(
    deliverable_id: str,
    revision_id: str,
    current_member=Depends(require_permission("access_firm_workspace")),
    db: Session = Depends(get_db),
) -> schemas.DeliverableWorkspaceResponse:
    return rollback_deliverable_content_revision(db, deliverable_id, revision_id)


@router.get("/{deliverable_id}/export")
def export_deliverable_markdown_route(
    deliverable_id: str,
    current_member=Depends(require_permission("access_firm_workspace")),
    db: Session = Depends(get_db),
) -> Response:
    filename, content, version_tag = build_deliverable_markdown_export(db, deliverable_id)
    return Response(
        content=content,
        media_type="text/markdown; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "X-Infinite-Pro-Version": version_tag,
            "X-Infinite-Pro-Artifact-Format": "markdown",
        },
    )


@router.get("/{deliverable_id}/export/docx")
def export_deliverable_docx_route(
    deliverable_id: str,
    current_member=Depends(require_permission("access_firm_workspace")),
    db: Session = Depends(get_db),
) -> Response:
    filename, content, version_tag = build_deliverable_docx_export(db, deliverable_id)
    return Response(
        content=content,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "X-Infinite-Pro-Version": version_tag,
            "X-Infinite-Pro-Artifact-Format": "docx",
        },
    )


@router.get("/{deliverable_id}/artifacts/{artifact_id}")
def download_deliverable_artifact_route(
    deliverable_id: str,
    artifact_id: str,
    current_member=Depends(require_permission("access_firm_workspace")),
    db: Session = Depends(get_db),
) -> Response:
    filename, content, version_tag, artifact_format, mime_type = download_deliverable_artifact(
        db,
        deliverable_id,
        artifact_id,
    )
    return Response(
        content=content,
        media_type=mime_type,
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "X-Infinite-Pro-Version": version_tag,
            "X-Infinite-Pro-Artifact-Format": artifact_format,
        },
    )
