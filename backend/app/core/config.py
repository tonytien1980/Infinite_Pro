from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Infinite Pro API"
    api_v1_prefix: str = "/api/v1"
    database_url: str = "postgresql+psycopg://postgres:postgres@db:5432/ai_advisory_os"
    upload_dir: str = "/app/storage/uploads"
    derived_dir: str | None = None
    release_dir: str | None = None
    model_provider: str = "mock"
    model_provider_api_key: str | None = None
    model_provider_model: str | None = None
    model_provider_base_url: str | None = None
    model_provider_timeout_seconds: int | None = None
    openai_api_key: str | None = None
    openai_model: str = "gpt-5.4"
    openai_base_url: str = "https://api.openai.com/v1"
    openai_timeout_seconds: int = 60
    cors_origins: str = (
        "http://localhost:3000,"
        "http://127.0.0.1:3000,"
        "http://localhost:3001,"
        "http://127.0.0.1:3001"
    )
    raw_upload_retention_days: int = 30
    active_raw_upload_retention_days: int = 90
    derived_retention_days: int = 180
    release_retention_days: int = 365
    failed_upload_retention_days: int = 7

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def upload_path(self) -> Path:
        return Path(self.upload_dir)

    @property
    def derived_path(self) -> Path:
        if self.derived_dir:
            return Path(self.derived_dir)
        return self.storage_root_path / "derived"

    @property
    def release_path(self) -> Path:
        if self.release_dir:
            return Path(self.release_dir)
        return self.storage_root_path / "releases"

    @property
    def storage_root_path(self) -> Path:
        return self.upload_path.parent

    @property
    def cors_origins_list(self) -> list[str]:
        configured = [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]
        local_dev_origins = [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:3001",
            "http://127.0.0.1:3001",
        ]
        ordered: list[str] = []
        for origin in [*configured, *local_dev_origins]:
            if origin not in ordered:
                ordered.append(origin)
        return ordered


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
