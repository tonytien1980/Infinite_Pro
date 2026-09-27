from __future__ import annotations

import csv
import multiprocessing
import os
import signal
import sys
import tempfile
import time
from dataclasses import dataclass
from io import BytesIO, StringIO
from pathlib import Path
from tempfile import TemporaryDirectory
from zipfile import BadZipFile, ZipFile

from defusedxml import ElementTree
from docx import Document
from docx.table import Table
from docx.text.paragraph import Paragraph
from openpyxl import load_workbook
from openpyxl.utils.cell import range_boundaries
from pypdf import PdfReader

from app.core.config import settings


FULLY_SUPPORTED_EXTENSIONS = {".md", ".txt", ".docx", ".xlsx", ".csv", ".pdf"}
LIMITED_SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
UNSUPPORTED_EXTENSIONS = {".pptx", ".zip"}


@dataclass(frozen=True)
class ExtractedBlock:
    text: str
    locator: dict
    locator_label: str


@dataclass(frozen=True)
class FileExtractResult:
    text: str
    support_level: str
    ingest_strategy: str
    metadata_only: bool
    message: str | None = None
    blocks: tuple[ExtractedBlock, ...] = ()
    coverage: str = "unavailable"
    warnings: tuple[str, ...] = ()

    def to_manifest(self, *, version: int = 1) -> dict:
        offset = 0
        entries = []
        for index, block in enumerate(self.blocks):
            entries.append({
                "id": index + 1,
                "start_offset": offset,
                "end_offset": offset + len(block.text),
                "locator": block.locator,
                "locator_label": block.locator_label,
            })
            offset += len(block.text) + 1
        return {
            "version": version,
            "coverage": self.coverage,
            "scope": "extracted_text_not_model_reading",
            "offset_unit": "unicode_character_in_extracted_text",
            "text_length": len(self.text),
            "blocks": entries,
            "warnings": list(self.warnings),
        }


def _result(blocks: list[ExtractedBlock], strategy: str, warnings: list[str], *, coverage: str | None = None) -> FileExtractResult:
    text = "\n".join(block.text for block in blocks)
    if len(text) > settings.material_max_source_chars:
        raise ValueError(f"抽取文字超過單份材料 {settings.material_max_source_chars} 字元上限；未截斷當作完整內容。")
    if not text.strip():
        text = ""
        blocks = []
    if not text:
        warnings = [*warnings, "尚未抽出可分析文字，請補充文字或更清晰的材料。"]
    return FileExtractResult(
        text=text,
        support_level="limited" if warnings else "full",
        ingest_strategy=strategy,
        metadata_only=not bool(text),
        message="；".join(dict.fromkeys(warnings)) or None,
        blocks=tuple(blocks),
        coverage=(coverage or ("partial" if warnings else "complete")) if text else "unavailable",
        warnings=tuple(dict.fromkeys(warnings)),
    )


def _check_archive(content: bytes) -> list[str]:
    warnings = []
    with ZipFile(BytesIO(content)) as archive:
        entries = archive.infolist()
        if len(entries) > settings.material_max_zip_entries:
            raise ValueError(f"壓縮文件超過 {settings.material_max_zip_entries} 個項目上限。")
        if sum(item.file_size for item in entries) > settings.material_max_zip_bytes:
            raise ValueError(f"解壓大小超過 {settings.material_max_zip_bytes} bytes 上限。")
        for entry in entries:
            if entry.flag_bits & 1:
                raise ValueError("不接受加密文件。")
            if entry.file_size > settings.material_max_zip_entry_bytes:
                raise ValueError(f"文件內單項超過 {settings.material_max_zip_entry_bytes} bytes 上限。")
            if entry.filename.lower().endswith("vbaproject.bin"):
                raise ValueError("不接受含巨集的文件，請另存不含巨集的版本。")
            if entry.filename.endswith((".xml", ".rels")):
                # Parse XML before the document libraries; entity expansion is forbidden.
                root = ElementTree.fromstring(archive.read(entry))
                if entry.filename.startswith("xl/worksheets/"):
                    populated = [cell for cell in root.findall(".//{*}c") if any(
                        child.tag.rsplit("}", 1)[-1] in {"v", "f", "is"} for child in cell
                    )]
                    if len(populated) > settings.material_max_cells:
                        raise ValueError(f"工作表超過 {settings.material_max_cells} 個儲存格上限。")
                    for merge in root.findall(".//{*}mergeCell"):
                        left, top, right, bottom = range_boundaries(merge.attrib["ref"])
                        if (right - left + 1) * (bottom - top + 1) > settings.material_max_cells:
                            raise ValueError(f"合併區域超過可安全解析的 {settings.material_max_cells} 個儲存格範圍。")
                if entry.filename.endswith(".rels"):
                    for relation in root:
                        if relation.get("TargetMode") == "External" and not relation.get("Type", "").endswith("/hyperlink"):
                            warnings.append("外部連結的內容未抓取，請另外提供原始材料。")
            if entry.filename.startswith(("word/media/", "word/embeddings/", "xl/media/", "xl/charts/")):
                warnings.append("文件中的圖片、圖表或嵌入附件尚未擷取，請另外提供文字或資料表。")
            if entry.filename.startswith(("word/footnotes", "word/endnotes", "word/header", "word/footer", "word/comments")):
                warnings.append("頁首頁尾、註腳或批註不在本次正文抽取範圍，請核對。")
    return warnings


def _docx_blocks(content: bytes, warnings: list[str]) -> list[ExtractedBlock]:
    document = Document(BytesIO(content))
    blocks = []
    table_number = 0

    def visit(container, context: dict) -> None:
        nonlocal table_number
        for index, item in enumerate(container.iter_inner_content(), start=1):
            if isinstance(item, Paragraph):
                if item.text.strip():
                    locator = {**context, "paragraph": index}
                    label = f"表格 {context['table']} {context['cells'][0]}" if "table" in context else f"段落 {index}"
                    blocks.append(ExtractedBlock(item.text, locator, label))
            elif isinstance(item, Table):
                table_number += 1
                current_table = table_number
                cells = {}
                for row_number, row in enumerate(item.rows, start=1):
                    for column, cell in enumerate(row.cells, start=row.grid_cols_before + 1):
                        stored = cells.setdefault(cell._tc, (cell, []))
                        stored[1].append(f"R{row_number}C{column}")
                for cell, coordinates in cells.values():
                    visit(cell, {"kind": "docx_cell", "table": current_table, "cells": coordinates, "parent": context})

    visit(document, {"kind": "docx_paragraph"})
    if document.element.xpath(".//w:ins | .//w:del | .//w:txbxContent | .//w:sdt"):
        warnings.append("文件含修訂、文字方塊或內容控制項，部分內容需人工核對。")
    return blocks


def _xlsx_blocks(content: bytes, warnings: list[str]) -> list[ExtractedBlock]:
    workbook = load_workbook(BytesIO(content), data_only=False, keep_links=False)
    cached = None
    try:
        if len(workbook.worksheets) > settings.material_max_sheets:
            raise ValueError(f"工作表超過 {settings.material_max_sheets} 張上限。")
        cached = load_workbook(BytesIO(content), data_only=True, keep_links=False)
        blocks = []
        cell_count = 0
        for sheet in workbook.worksheets:
            merges = {(item.min_row, item.min_col): str(item) for item in sheet.merged_cells.ranges}
            # The pinned openpyxl sparse cell map avoids iterating a million empty rows.
            for cell in sorted(sheet._cells.values(), key=lambda item: (item.row, item.column)):
                if cell.value is None:
                    continue
                cell_count += 1
                if cell_count > settings.material_max_cells:
                    raise ValueError(f"文件超過 {settings.material_max_cells} 個有內容儲存格上限。")
                merged_range = merges.get((cell.row, cell.column))
                locator = {"kind": "xlsx_cell", "sheet": sheet.title, "cell": cell.coordinate,
                           "merged_ranges": [merged_range] if merged_range else [],
                           "sheet_state": sheet.sheet_state, "data_type": cell.data_type,
                           "number_format": cell.number_format}
                value = str(cell.value)
                if cell.data_type == "f":
                    formula = cell.value if isinstance(cell.value, str) else getattr(cell.value, "text", None)
                    cached_value = cached[sheet.title][cell.coordinate].value
                    locator["formula"] = formula
                    locator["cached_value"] = None if cached_value is None else str(cached_value)
                    value = f"公式：{formula or '特殊公式'}；檔案快取值：{cached_value if cached_value is not None else '未提供'}"
                    warnings.append("公式未重新計算；檔案快取值不保證最新，重要數字請核對。")
                    if cached_value is None:
                        warnings.append(f"{sheet.title}!{cell.coordinate} 缺少公式快取值。")
                blocks.append(ExtractedBlock(f"{sheet.title}!{cell.coordinate}: {value}", locator, f"{sheet.title}!{cell.coordinate}"))
        return blocks
    finally:
        workbook.close()
        if cached is not None:
            cached.close()


def _analyze_upload_content(file_name: str, content: bytes, *, on_ocr=None) -> FileExtractResult:
    if len(content) > settings.material_max_file_bytes:
        raise ValueError(f"檔案超過 {settings.material_max_file_bytes} bytes 上限。")
    suffix = Path(file_name).suffix.lower()
    if suffix in {".txt", ".md", ".csv", ".json"}:
        try:
            text = content.decode("utf-8-sig")
        except UnicodeDecodeError as exc:
            raise ValueError("無法完整解碼 UTF-8，請轉存為 UTF-8 後重新上傳。") from exc
        if suffix == ".csv":
            blocks = []
            reader = csv.reader(StringIO(text, newline=""), strict=True)
            previous_line = 0
            try:
                for row_number, row in enumerate(reader, start=1):
                    output = StringIO(newline="")
                    csv.writer(output, lineterminator="\n").writerow(row)
                    blocks.append(ExtractedBlock(output.getvalue().removesuffix("\n"), {
                        "kind": "csv_row", "row": row_number, "column_count": len(row),
                        "lines": [previous_line + 1, reader.line_num],
                    }, f"第 {row_number} 列"))
                    previous_line = reader.line_num
            except csv.Error as exc:
                raise ValueError(f"CSV 格式無法完整解析：{exc}") from exc
            return _result(blocks, "csv_structured_extract", [])
        blocks = [ExtractedBlock(text, {"kind": "text"}, "原文")] if text.strip() else []
        return _result(blocks, "text_extract", [])
    if suffix in {".docx", ".xlsx"}:
        try:
            warnings = _check_archive(content)
            blocks = _docx_blocks(content, warnings) if suffix == ".docx" else _xlsx_blocks(content, warnings)
        except BadZipFile as exc:
            raise ValueError("文件損毀或不是有效的 Office 文件。") from exc
        return _result(blocks, "document_text_extract" if suffix == ".docx" else "worksheet_structured_extract", warnings)
    if suffix == ".pdf":
        reader = PdfReader(BytesIO(content))
        if reader.is_encrypted:
            raise ValueError("不接受加密 PDF，請提供未加密版本。")
        if len(reader.pages) > settings.material_max_pdf_pages:
            raise ValueError(f"PDF 超過 {settings.material_max_pdf_pages} 頁上限。")
        blocks_by_page = {}
        scan_pages = []
        warnings = []
        for page_number, page in enumerate(reader.pages, start=1):
            text = page.extract_text() or ""
            blocks_by_page[page_number] = []
            if text.strip():
                blocks_by_page[page_number].append(ExtractedBlock(text, {"kind": "pdf_page", "page": page_number}, f"第 {page_number} 頁"))
            resources = page.get("/Resources")
            if not text.strip() or (resources is not None and resources.get_object().get("/XObject")):
                scan_pages.append(page_number)
        incomplete = bool(scan_pages) and not settings.material_ocr_enabled
        if scan_pages and settings.material_ocr_enabled:
            from app.ingestion import ocr

            if on_ocr:
                on_ocr()
            file_deadline = time.monotonic() + settings.material_ocr_file_timeout_seconds
            with TemporaryDirectory(prefix="infinite-pro-pdf-") as temporary:
                pdf_path = Path(temporary) / "source.pdf"
                pdf_path.write_bytes(content)
                for index, page_number in enumerate(scan_pages):
                    if index >= settings.material_max_ocr_pages:
                        incomplete = True
                        warnings.append(f"第 {page_number} 頁未讀取：已達 {settings.material_max_ocr_pages} 頁 OCR 上限。")
                        continue
                    try:
                        regions, notes = ocr.extract_pdf_page(pdf_path, page=page_number, deadline=min(
                            file_deadline, time.monotonic() + settings.material_ocr_page_timeout_seconds))
                        if not regions or any(region["locator"]["min_confidence"] < settings.material_ocr_min_confidence for region in regions):
                            incomplete = True
                        native_text = " ".join(block.text for block in blocks_by_page[page_number])
                        for region in regions:
                            if " ".join(region["text"].split()) not in " ".join(native_text.split()):
                                blocks_by_page[page_number].append(ExtractedBlock(**region))
                        warnings.extend(notes)
                    except ValueError as exc:
                        incomplete = True
                        warnings.append(f"第 {page_number} 頁未完成：{exc}")
        else:
            warnings.extend(f"第 {page} 頁可能含掃描或圖像內容，尚未完成 OCR 核對。" for page in scan_pages)
        blocks = [block for page_blocks in blocks_by_page.values() for block in page_blocks]
        return _result(blocks, "text_first_pdf" if blocks else "scanned_pdf_reference", warnings,
                       coverage="partial" if incomplete else "complete")
    if suffix in LIMITED_SUPPORTED_EXTENSIONS:
        if settings.material_ocr_enabled:
            from app.ingestion import ocr

            if on_ocr:
                on_ocr()
            try:
                regions, notes = ocr.extract_image(content, deadline=time.monotonic() + settings.material_ocr_page_timeout_seconds)
                complete = bool(regions) and all(region["locator"]["min_confidence"] >= settings.material_ocr_min_confidence for region in regions)
                return _result([ExtractedBlock(**region) for region in regions], "image_ocr", notes,
                               coverage="complete" if complete else "partial")
            except ocr.OcrUnavailable as exc:
                return _result([], "image_ocr", [str(exc)])
        return _result([], "image_reference", ["影像已保存，但尚未完成 OCR，請補充文字。"])
    return FileExtractResult("", "unsupported", "unsupported", True, "目前尚未正式支援這種格式的 ingestion。")


def _extract_worker(connection, file_name: str, content: bytes, limits: dict, temporary_root: str) -> None:
    try:
        if os.name == "posix":
            os.setsid()
        tempfile.tempdir = temporary_root
        for name, value in limits.items():
            setattr(settings, name, value)
        if sys.platform == "linux":
            import resource
            resource.setrlimit(resource.RLIMIT_AS, (settings.material_parse_memory_bytes,) * 2)
        result = _analyze_upload_content(file_name, content, on_ocr=lambda: connection.send(("ocr", None)))
        connection.send(("result", result))
    except Exception as exc:
        connection.send(("error", f"{type(exc).__name__}: {exc}"))
    finally:
        connection.close()


def analyze_upload_content(file_name: str, content: bytes) -> FileExtractResult:
    if len(content) > settings.material_max_file_bytes:
        raise ValueError(f"檔案超過 {settings.material_max_file_bytes} bytes 上限。")
    # A process deadline can stop a stuck native/XML parser; a timed-out thread cannot.
    context = multiprocessing.get_context("spawn")
    receiving, sending = context.Pipe(duplex=False)
    temporary = TemporaryDirectory(prefix="infinite-pro-extract-")
    limits = {name: value for name, value in settings.model_dump().items() if name.startswith("material_")}
    worker = context.Process(target=_extract_worker, args=(sending, file_name, content, limits, temporary.name))
    started = time.monotonic()
    try:
        worker.start()
        sending.close()
        deadline = started + settings.material_parse_timeout_seconds
        while True:
            if not receiving.poll(max(0, deadline - time.monotonic())):
                raise ValueError("文件解析超過時間上限；未將部分內容標成完整。")
            state, result = receiving.recv()
            if state == "ocr":
                deadline = started + settings.material_ocr_file_timeout_seconds
            elif state == "error":
                raise ValueError(result)
            else:
                return result
    except EOFError as exc:
        raise ValueError("文件解析程序中斷，請確認檔案後重試。") from exc
    finally:
        receiving.close()
        sending.close()
        if worker.pid is not None:
            worker.join(timeout=0.1)
            if os.name == "posix":
                try:
                    os.killpg(worker.pid, signal.SIGKILL)
                except ProcessLookupError:
                    pass
            if worker.is_alive():
                worker.terminate()
                worker.join(timeout=1)
            if worker.is_alive():
                worker.kill()
                worker.join()
            worker.close()
        temporary.cleanup()


def extract_text_from_upload(file_name: str, content: bytes) -> str:
    return analyze_upload_content(file_name, content).text


def summarize_evidence_text(text: str, limit: int = 1500) -> str:
    return " ".join(text.split())[:limit]
