from __future__ import annotations

from dataclasses import dataclass
from io import BytesIO
from pathlib import Path
from zipfile import ZipFile
import xml.etree.ElementTree as ET

from docx import Document
from pypdf import PdfReader


FULLY_SUPPORTED_EXTENSIONS = {
    ".md",
    ".txt",
    ".docx",
    ".xlsx",
    ".csv",
    ".pdf",
}
LIMITED_SUPPORTED_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
}
UNSUPPORTED_EXTENSIONS = {
    ".pptx",
    ".zip",
}


@dataclass(frozen=True)
class FileExtractResult:
    text: str
    support_level: str
    ingest_strategy: str
    metadata_only: bool
    message: str | None = None


def _read_shared_strings(archive: ZipFile) -> list[str]:
    try:
        shared_strings_xml = archive.read("xl/sharedStrings.xml")
    except KeyError:
        return []
    root = ET.fromstring(shared_strings_xml)
    namespace = {"x": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
    values: list[str] = []
    for item in root.findall("x:si", namespace):
        parts = [node.text or "" for node in item.findall(".//x:t", namespace)]
        values.append("".join(parts).strip())
    return values


def _read_workbook_sheets(archive: ZipFile) -> list[tuple[str, str]]:
    workbook_xml = archive.read("xl/workbook.xml")
    rels_xml = archive.read("xl/_rels/workbook.xml.rels")
    workbook_root = ET.fromstring(workbook_xml)
    rels_root = ET.fromstring(rels_xml)
    book_ns = {
        "x": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
        "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    }
    rel_ns = {"r": "http://schemas.openxmlformats.org/package/2006/relationships"}
    rel_map = {
        rel.attrib.get("Id"): rel.attrib.get("Target", "")
        for rel in rels_root.findall("r:Relationship", rel_ns)
    }
    sheets: list[tuple[str, str]] = []
    for sheet in workbook_root.findall("x:sheets/x:sheet", book_ns):
        relationship_id = sheet.attrib.get("{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id")
        target = rel_map.get(relationship_id or "")
        if not target:
            continue
        normalized_target = target if target.startswith("xl/") else f"xl/{target.lstrip('/')}"
        sheets.append((sheet.attrib.get("name", "Sheet"), normalized_target))
    return sheets


def _column_label(index: int) -> str:
    label = ""
    while index > 0:
        index, remainder = divmod(index - 1, 26)
        label = chr(65 + remainder) + label
    return label or "A"


def _parse_xlsx_text(content: bytes) -> str:
    with ZipFile(BytesIO(content)) as archive:
        shared_strings = _read_shared_strings(archive)
        sheets = _read_workbook_sheets(archive)
        namespace = {"x": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
        lines: list[str] = []
        for sheet_name, sheet_path in sheets[:4]:
            try:
                sheet_xml = archive.read(sheet_path)
            except KeyError:
                continue
            root = ET.fromstring(sheet_xml)
            lines.append(f"工作表：{sheet_name}")
            for row_index, row in enumerate(root.findall("x:sheetData/x:row", namespace)[:6], start=1):
                values: list[str] = []
                for cell in row.findall("x:c", namespace):
                    raw_value = cell.findtext("x:v", default="", namespaces=namespace)
                    cell_type = cell.attrib.get("t")
                    if cell_type == "s" and raw_value.isdigit():
                        shared_index = int(raw_value)
                        value = shared_strings[shared_index] if shared_index < len(shared_strings) else raw_value
                    else:
                        value = raw_value
                    value = " ".join(value.split()).strip()
                    if value:
                        values.append(value)
                if values:
                    lines.append(f"第 {row_index} 列：{' | '.join(values[:8])}")
            lines.append("")
        return "\n".join(line for line in lines if line).strip()


def analyze_upload_content(file_name: str, content: bytes) -> FileExtractResult:
    suffix = Path(file_name).suffix.lower()
    if suffix in {".txt", ".md", ".csv", ".json"}:
        strategy = "table_snapshot" if suffix == ".csv" else "text_extract"
        return FileExtractResult(
            text=content.decode("utf-8", errors="ignore").strip(),
            support_level="limited" if suffix == ".csv" else "full",
            ingest_strategy=strategy,
            metadata_only=False,
            message=(
                "這份表格目前先以列快照方式擷取，欄位關係、公式與跨表脈絡仍需人工補充判讀。"
                if suffix == ".csv"
                else None
            ),
        )
    if suffix == ".xlsx":
        return FileExtractResult(
            text=_parse_xlsx_text(content),
            support_level="limited",
            ingest_strategy="worksheet_snapshot",
            metadata_only=False,
            message="這份工作表目前先以 worksheet snapshot 方式擷取，公式、關聯與深層表格結構仍需人工補充判讀。",
        )
    if suffix == ".pdf":
        reader = PdfReader(BytesIO(content))
        text = "\n".join(page.extract_text() or "" for page in reader.pages).strip()
        if text:
            return FileExtractResult(
                text=text,
                support_level="full",
                ingest_strategy="text_first_pdf",
                metadata_only=False,
            )
        return FileExtractResult(
            text="",
            support_level="limited",
            ingest_strategy="scanned_pdf_reference",
            metadata_only=True,
            message="這份 PDF 目前只建立 metadata 與 reference；若是掃描檔或圖片型 PDF，仍未啟用預設 OCR。",
        )
    if suffix == ".docx":
        document = Document(BytesIO(content))
        return FileExtractResult(
            text="\n".join(paragraph.text for paragraph in document.paragraphs).strip(),
            support_level="full",
            ingest_strategy="document_text_extract",
            metadata_only=False,
        )
    if suffix in LIMITED_SUPPORTED_EXTENSIONS:
        return FileExtractResult(
            text="",
            support_level="limited",
            ingest_strategy="image_reference",
            metadata_only=True,
            message="這份影像目前會先以 reference image 形式保存，只建立 metadata 與工作面引用，不預設啟動 OCR。",
        )
    if suffix in UNSUPPORTED_EXTENSIONS:
        return FileExtractResult(
            text="",
            support_level="unsupported",
            ingest_strategy="unsupported",
            metadata_only=True,
            message=f"目前尚未正式支援 {suffix or '這種格式'} 的 ingestion。",
        )
    return FileExtractResult(
        text="",
        support_level="unsupported",
        ingest_strategy="unsupported",
        metadata_only=True,
        message="目前尚未正式支援這種格式的 ingestion。",
    )


def extract_text_from_upload(file_name: str, content: bytes) -> str:
    return analyze_upload_content(file_name, content).text


def summarize_evidence_text(text: str, limit: int = 1500) -> str:
    normalized = " ".join(text.split())
    return normalized[:limit]
