from __future__ import annotations

from io import BytesIO
from pathlib import Path

from docx import Document
from pypdf import PdfReader


def extract_text_from_upload(file_name: str, content: bytes) -> str:
    suffix = Path(file_name).suffix.lower()
    if suffix in {".txt", ".md", ".csv", ".json"}:
        return content.decode("utf-8", errors="ignore").strip()
    if suffix == ".pdf":
        reader = PdfReader(BytesIO(content))
        return "\n".join(page.extract_text() or "" for page in reader.pages).strip()
    if suffix == ".docx":
        document = Document(BytesIO(content))
        return "\n".join(paragraph.text for paragraph in document.paragraphs).strip()
    return ""


def summarize_evidence_text(text: str, limit: int = 1500) -> str:
    normalized = " ".join(text.split())
    return normalized[:limit]
