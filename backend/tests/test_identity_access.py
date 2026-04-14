from __future__ import annotations

from app.services.identity_access import (
    build_post_login_redirect_url,
    normalize_post_login_next_path,
)


def test_normalize_post_login_next_path_accepts_safe_internal_paths() -> None:
    assert normalize_post_login_next_path("/demo") == "/demo"
    assert normalize_post_login_next_path("/matters/abc?tab=evidence") == "/matters/abc?tab=evidence"


def test_normalize_post_login_next_path_rejects_unsafe_values() -> None:
    assert normalize_post_login_next_path(None) is None
    assert normalize_post_login_next_path("") is None
    assert normalize_post_login_next_path("demo") is None
    assert normalize_post_login_next_path("//evil.example") is None
    assert normalize_post_login_next_path("https://evil.example") is None
    assert normalize_post_login_next_path("/login") is None


def test_build_post_login_redirect_url_prefers_safe_next_path() -> None:
    assert build_post_login_redirect_url("http://127.0.0.1:3000", "/demo") == "http://127.0.0.1:3000/demo"
    assert build_post_login_redirect_url("http://127.0.0.1:3000", None) == "http://127.0.0.1:3000"
