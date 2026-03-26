from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.extensions.schemas import ExtensionManagerSnapshot
from app.core.database import get_db
from app.services.extensions_manager import (
    get_extension_manager_snapshot,
    upsert_agent_catalog_entry,
    upsert_pack_catalog_entry,
)
from app.workbench import schemas as workbench_schemas

router = APIRouter(prefix="/extensions", tags=["extensions"])


@router.get("/manager", response_model=ExtensionManagerSnapshot)
def get_extension_manager_route(
    db: Session = Depends(get_db),
) -> ExtensionManagerSnapshot:
    return get_extension_manager_snapshot(db)


@router.put("/agents/{agent_id}", response_model=ExtensionManagerSnapshot)
def update_agent_catalog_entry_route(
    agent_id: str,
    payload: workbench_schemas.AgentCatalogEntryUpdateRequest,
    db: Session = Depends(get_db),
) -> ExtensionManagerSnapshot:
    return upsert_agent_catalog_entry(db, agent_id, payload)


@router.put("/packs/{pack_id}", response_model=ExtensionManagerSnapshot)
def update_pack_catalog_entry_route(
    pack_id: str,
    payload: workbench_schemas.PackCatalogEntryUpdateRequest,
    db: Session = Depends(get_db),
) -> ExtensionManagerSnapshot:
    return upsert_pack_catalog_entry(db, pack_id, payload)
