from __future__ import annotations

import base64
import hashlib

from cryptography.fernet import Fernet, InvalidToken

from app.core.config import settings


def _get_fernet() -> Fernet:
    configured_key = (settings.provider_secret_encryption_key or "").strip()
    if not configured_key:
        raise RuntimeError("目前未設定 PROVIDER_SECRET_ENCRYPTION_KEY。")
    digest = hashlib.sha256(configured_key.encode("utf-8")).digest()
    derived_key = base64.urlsafe_b64encode(digest)
    return Fernet(derived_key)


def encrypt_provider_secret(raw_secret: str) -> str:
    trimmed_secret = raw_secret.strip()
    if not trimmed_secret:
        raise RuntimeError("不能加密空白 provider secret。")
    return _get_fernet().encrypt(trimmed_secret.encode("utf-8")).decode("utf-8")


def decrypt_provider_secret(ciphertext: str) -> str:
    try:
        return _get_fernet().decrypt(ciphertext.encode("utf-8")).decode("utf-8")
    except InvalidToken as exc:
        raise RuntimeError("無法解密 provider secret。") from exc
