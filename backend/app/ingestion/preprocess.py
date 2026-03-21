from __future__ import annotations

import re
from collections.abc import Iterable


def normalize_text(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def summarize_evidence_text(text: str, limit: int = 800) -> str:
    normalized = normalize_text(text)
    return normalized[:limit]


def build_text_chunks(
    text: str,
    *,
    chunk_size: int = 900,
    overlap: int = 120,
    max_chunks: int = 4,
) -> list[str]:
    normalized = normalize_text(text)
    if not normalized:
        return []

    chunks: list[str] = []
    start = 0
    text_length = len(normalized)

    while start < text_length and len(chunks) < max_chunks:
        end = min(text_length, start + chunk_size)
        chunks.append(normalized[start:end].strip())
        if end >= text_length:
            break
        start = max(0, end - overlap)

    return [chunk for chunk in chunks if chunk]


def infer_relevance_label(text: str, query_parts: Iterable[str]) -> str:
    text_tokens = {
        token
        for token in re.findall(r"[0-9A-Za-z\u4e00-\u9fff]{2,}", normalize_text(text).lower())
    }
    query_tokens = {
        token
        for part in query_parts
        for token in re.findall(r"[0-9A-Za-z\u4e00-\u9fff]{2,}", normalize_text(part).lower())
    }

    if not text_tokens or not query_tokens:
        return "待確認"

    overlap = len(text_tokens & query_tokens)
    if overlap >= 6:
        return "高"
    if overlap >= 3:
        return "中"
    return "待確認"
