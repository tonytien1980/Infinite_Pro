from __future__ import annotations

from fastapi import APIRouter

from app.api.routes import deliverables, extensions, health, matters, runs, tasks, uploads

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(tasks.router)
api_router.include_router(matters.router)
api_router.include_router(deliverables.router)
api_router.include_router(uploads.router)
api_router.include_router(runs.router)
api_router.include_router(extensions.router)
