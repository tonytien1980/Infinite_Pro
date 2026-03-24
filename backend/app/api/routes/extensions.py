from __future__ import annotations

from fastapi import APIRouter

from app.extensions.registry import ExtensionRegistry
from app.extensions.schemas import ExtensionManagerSnapshot

router = APIRouter(prefix="/extensions", tags=["extensions"])

_REGISTRY = ExtensionRegistry()


@router.get("/manager", response_model=ExtensionManagerSnapshot)
def get_extension_manager_route() -> ExtensionManagerSnapshot:
    return _REGISTRY.manager_snapshot()
