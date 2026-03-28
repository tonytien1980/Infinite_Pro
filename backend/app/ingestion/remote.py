from __future__ import annotations

import html
import re
from dataclasses import dataclass
from pathlib import Path
from urllib import error, parse, request

from app.ingestion.files import analyze_upload_content
from app.ingestion.preprocess import normalize_text

GOOGLE_DOCS_RE = re.compile(r"https?://docs\.google\.com/document/d/([a-zA-Z0-9_-]+)")


@dataclass
class RemoteSourceContent:
    source_type: str
    source_url: str
    title: str
    content_type: str | None
    normalized_text: str
    support_level: str = "full"
    ingest_strategy: str = "remote_text_extract"
    metadata_only: bool = False
    message: str | None = None


def _extract_html_title(raw_html: str, fallback: str) -> str:
    og_title_match = re.search(
        r'<meta[^>]+property=["\']og:title["\'][^>]+content=["\']([^"\']+)["\']',
        raw_html,
        re.IGNORECASE,
    )
    if og_title_match:
        return html.unescape(og_title_match.group(1)).strip()

    title_match = re.search(r"<title[^>]*>(.*?)</title>", raw_html, re.IGNORECASE | re.DOTALL)
    if title_match:
        return html.unescape(title_match.group(1)).strip()

    return fallback


def _extract_text_from_html(raw_html: str) -> str:
    cleaned = re.sub(r"<!--.*?-->", " ", raw_html, flags=re.DOTALL)
    cleaned = re.sub(
        r"<(script|style|noscript|svg|footer|header|nav|aside)[^>]*>.*?</\1>",
        " ",
        cleaned,
        flags=re.IGNORECASE | re.DOTALL,
    )
    cleaned = re.sub(r"</(p|div|section|article|main|h1|h2|h3|h4|h5|li|br)>", "\n", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"<[^>]+>", " ", cleaned)
    cleaned = html.unescape(cleaned)
    lines = [line.strip() for line in cleaned.splitlines()]
    content = "\n".join(line for line in lines if len(line) >= 30)
    return normalize_text(content)


def _file_name_from_url(url: str, fallback: str) -> str:
    parsed = parse.urlparse(url)
    candidate = Path(parsed.path).name
    return candidate or fallback


def _normalize_google_docs_url(url: str) -> tuple[str, str]:
    match = GOOGLE_DOCS_RE.match(url)
    if not match:
        return url, "manual_url"

    document_id = match.group(1)
    export_url = f"https://docs.google.com/document/d/{document_id}/export?format=txt"
    return export_url, "google_docs"


def fetch_remote_source(url: str, timeout_seconds: int = 20) -> RemoteSourceContent:
    resolved_url, source_type = _normalize_google_docs_url(url)
    http_request = request.Request(
        resolved_url,
        headers={
            "User-Agent": "AI-Advisory-OS/0.1 (+https://localhost)",
        },
    )

    try:
        with request.urlopen(http_request, timeout=timeout_seconds) as response:
            content = response.read()
            final_url = response.geturl()
            content_type = response.headers.get_content_type()
    except error.HTTPError as exc:
        if source_type == "google_docs" and exc.code in {401, 403}:
            raise RuntimeError("Google Docs 連結目前沒有可讀權限，請確認文件已公開或可供目前環境讀取。") from exc
        raise RuntimeError(f"網址來源讀取失敗，HTTP {exc.code}。") from exc
    except error.URLError as exc:
        raise RuntimeError(f"網址來源讀取失敗：{exc.reason}") from exc

    file_name = _file_name_from_url(final_url, "remote-source")
    extracted_text = ""
    title = file_name

    if source_type == "google_docs":
        extracted_text = content.decode("utf-8", errors="ignore")
        title = "Google Docs 文件"
        analyzed = None
    elif content_type in {
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/csv",
        "image/jpeg",
        "image/png",
        "image/webp",
    } or any(final_url.lower().endswith(suffix) for suffix in (".pdf", ".docx", ".xlsx", ".csv", ".jpg", ".jpeg", ".png", ".webp")):
        analyzed = analyze_upload_content(file_name or "remote-source", content)
        extracted_text = analyzed.text
        title = file_name or "遠端來源"
    elif content_type == "text/html":
        raw_html = content.decode("utf-8", errors="ignore")
        extracted_text = _extract_text_from_html(raw_html)
        title = _extract_html_title(raw_html, file_name or "網頁來源")
        analyzed = None
    else:
        extracted_text = content.decode("utf-8", errors="ignore")
        title = file_name or "文字來源"
        analyzed = None

    normalized_text = normalize_text(extracted_text)
    support_level = "full"
    ingest_strategy = "remote_text_extract"
    metadata_only = False
    message: str | None = None

    if analyzed is not None:
        support_level = analyzed.support_level
        ingest_strategy = analyzed.ingest_strategy
        metadata_only = analyzed.metadata_only
        message = analyzed.message

    if not normalized_text and not metadata_only:
        raise RuntimeError("已抓取來源內容，但未能抽出可用文字。")

    if source_type == "manual_url" and "docs.google.com" in final_url:
        source_type = "google_docs"

    return RemoteSourceContent(
        source_type=source_type,
        source_url=url,
        title=title,
        content_type=content_type,
        normalized_text=normalized_text,
        support_level=support_level,
        ingest_strategy=ingest_strategy,
        metadata_only=metadata_only,
        message=message,
    )
