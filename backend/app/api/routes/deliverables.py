from __future__ import annotations

from fastapi import APIRouter, Depends
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.domain import schemas
from app.services.tasks import (
    build_deliverable_markdown_export,
    get_deliverable_workspace,
    update_deliverable_metadata,
)

router = APIRouter(prefix="/deliverables", tags=["deliverables"])


@router.get("/{deliverable_id}", response_model=schemas.DeliverableWorkspaceResponse)
def get_deliverable_workspace_route(
    deliverable_id: str,
    db: Session = Depends(get_db),
) -> schemas.DeliverableWorkspaceResponse:
    return get_deliverable_workspace(db, deliverable_id)


@router.put("/{deliverable_id}/metadata", response_model=schemas.DeliverableWorkspaceResponse)
def update_deliverable_metadata_route(
    deliverable_id: str,
    payload: schemas.DeliverableMetadataUpdateRequest,
    db: Session = Depends(get_db),
) -> schemas.DeliverableWorkspaceResponse:
    return update_deliverable_metadata(db, deliverable_id, payload)


@router.get("/{deliverable_id}/export")
def export_deliverable_markdown_route(
    deliverable_id: str,
    db: Session = Depends(get_db),
) -> Response:
    filename, content, version_tag = build_deliverable_markdown_export(db, deliverable_id)
    return Response(
        content=content,
        media_type="text/markdown; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "X-Infinite-Pro-Version": version_tag,
        },
    )
