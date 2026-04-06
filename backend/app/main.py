from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from app.api.router import api_router
from app.core.config import settings
from app.core.database import initialize_database

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI):
    logger.info("Starting Infinite Pro backend.")
    settings.upload_path.mkdir(parents=True, exist_ok=True)
    initialize_database()
    yield
    logger.info("Stopping Infinite Pro backend.")


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        version="0.1.0",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=[
            "Content-Disposition",
            "X-Infinite-Pro-Version",
            "X-Infinite-Pro-Artifact-Format",
        ],
    )
    app.add_middleware(
        SessionMiddleware,
        secret_key=settings.session_secret_key,
        session_cookie=settings.session_cookie_name,
        same_site="lax",
        https_only=False,
    )

    app.include_router(api_router, prefix=settings.api_v1_prefix)
    return app


app = create_app()
