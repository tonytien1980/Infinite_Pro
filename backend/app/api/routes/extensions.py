from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.auth import require_current_member, require_permission
from app.extensions.schemas import ExtensionManagerSnapshot
from app.core.database import get_db
from app.services.extensions_manager import (
    get_extension_manager_snapshot,
    upsert_agent_catalog_entry,
    upsert_pack_catalog_entry,
)
from app.services.extension_contract_synthesis import (
    synthesize_agent_contract_draft,
    synthesize_pack_contract_draft,
)
from app.workbench import schemas as workbench_schemas

router = APIRouter(prefix="/extensions", tags=["extensions"])


@router.get("/manager", response_model=ExtensionManagerSnapshot)
def get_extension_manager_route(
    current_member=Depends(require_current_member),
    db: Session = Depends(get_db),
) -> ExtensionManagerSnapshot:
    return get_extension_manager_snapshot(db)


@router.post(
    "/agents/contract-draft",
    response_model=workbench_schemas.AgentContractDraftResponse,
)
def synthesize_agent_contract_draft_route(
    payload: workbench_schemas.AgentContractDraftRequest,
    current_member=Depends(require_permission("manage_agents")),
) -> workbench_schemas.AgentContractDraftResponse:
    return synthesize_agent_contract_draft(payload)


@router.put("/agents/{agent_id}", response_model=ExtensionManagerSnapshot)
def update_agent_catalog_entry_route(
    agent_id: str,
    payload: workbench_schemas.AgentCatalogEntryUpdateRequest,
    current_member=Depends(require_permission("manage_agents")),
    db: Session = Depends(get_db),
) -> ExtensionManagerSnapshot:
    return upsert_agent_catalog_entry(db, agent_id, payload)


@router.post(
    "/packs/contract-draft",
    response_model=workbench_schemas.PackContractDraftResponse,
)
def synthesize_pack_contract_draft_route(
    payload: workbench_schemas.PackContractDraftRequest,
    current_member=Depends(require_permission("manage_packs")),
) -> workbench_schemas.PackContractDraftResponse:
    return synthesize_pack_contract_draft(payload)


@router.put("/packs/{pack_id}", response_model=ExtensionManagerSnapshot)
def update_pack_catalog_entry_route(
    pack_id: str,
    payload: workbench_schemas.PackCatalogEntryUpdateRequest,
    current_member=Depends(require_permission("manage_packs")),
    db: Session = Depends(get_db),
) -> ExtensionManagerSnapshot:
    return upsert_pack_catalog_entry(db, pack_id, payload)
