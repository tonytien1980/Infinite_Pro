from io import BytesIO
from zipfile import ZIP_DEFLATED, ZipFile

import pytest
from docx import Document
from openpyxl import Workbook
from pypdf import PdfReader, PdfWriter
from pypdf.generic import DecodedStreamObject, DictionaryObject, NameObject

from app.core.config import settings
from app.ingestion.files import analyze_upload_content
from app.ingestion.preprocess import build_text_chunk_specs, normalize_text


def test_long_text_tail_and_every_character_are_covered():
    text = "x" * 6300 + "CRITICAL_TAIL_CLAUSE_42"
    chunks = build_text_chunk_specs(text)
    assert chunks[-1].end_offset == len(normalize_text(text))
    assert "CRITICAL_TAIL_CLAUSE_42" in chunks[-1].text
    assert chunks[0].start_offset == 0
    assert all(left.end_offset >= right.start_offset for left, right in zip(chunks, chunks[1:]))


def test_explicit_chunk_cap_does_not_silently_discard_tail():
    with pytest.raises(ValueError, match="max_chunks"):
        build_text_chunk_specs("x" * 4000, max_chunks=4)


@pytest.mark.parametrize("kwargs", [{"chunk_size": 0}, {"overlap": -1}, {"max_chunks": 0}])
def test_invalid_chunk_configuration_is_rejected(kwargs):
    with pytest.raises(ValueError):
        build_text_chunk_specs("", **kwargs)


def test_docx_body_order_tables_and_merged_cells_are_preserved():
    document = Document()
    document.add_paragraph("BEFORE_TABLE")
    table = document.add_table(rows=2, cols=2)
    table.cell(0, 0).merge(table.cell(0, 1)).text = "MERGED_PAYMENT_123456"
    table.cell(1, 0).text = "AFTER_MERGE"
    document.add_paragraph("AFTER_TABLE")
    stream = BytesIO()
    document.save(stream)
    result = analyze_upload_content("agreement.docx", stream.getvalue())
    assert "MERGED_PAYMENT_123456" in result.text
    assert result.text.count("MERGED_PAYMENT_123456") == 1
    assert result.text.index("BEFORE_TABLE") < result.text.index("MERGED_PAYMENT_123456") < result.text.index("AFTER_TABLE")
    cell = next(block for block in result.blocks if "MERGED_PAYMENT" in block.text)
    assert cell.locator["table"] == 1
    assert cell.locator["cells"] == ["R1C1", "R1C2"]
    assert result.coverage == "complete"


def test_invalid_utf8_is_not_silently_removed():
    with pytest.raises(ValueError, match="UTF-8"):
        analyze_upload_content("notes.txt", b"price=12\xff345")


def test_csv_preserves_quoted_fields_empty_columns_and_line_numbers():
    result = analyze_upload_content("notes.csv", b'name,,amount\n"A, B",,"line1\nline2"\n')
    assert result.coverage == "complete"
    row = result.blocks[1]
    assert row.locator["row"] == 2
    assert row.locator["lines"] == [2, 3]
    assert row.locator["column_count"] == 3
    assert '"A, B",,"line1\nline2"' in row.text


def test_malformed_csv_is_not_marked_complete():
    with pytest.raises(ValueError):
        analyze_upload_content("broken.csv", b'a,b\n"unterminated')


def test_blank_text_has_no_complete_coverage():
    result = analyze_upload_content("empty.txt", b" \n \t")
    assert result.coverage == "unavailable"
    assert result.metadata_only is True


def test_text_limit_rejects_instead_of_truncating(monkeypatch):
    monkeypatch.setattr(settings, "material_max_source_chars", 100)
    assert analyze_upload_content("ok.txt", b"x" * 100).coverage == "complete"
    with pytest.raises(ValueError, match="100"):
        analyze_upload_content("large.txt", b"x" * 101)


def test_file_limit_rejects_before_format_parsing(monkeypatch):
    monkeypatch.setattr(settings, "material_max_file_bytes", 100)
    with pytest.raises(ValueError, match="100"):
        analyze_upload_content("large.docx", b"x" * 101)


def test_ooxml_archive_limits_apply_before_xml_parsing(monkeypatch):
    monkeypatch.setattr(settings, "material_max_zip_entry_bytes", 100)
    stream = BytesIO()
    with ZipFile(stream, "w", ZIP_DEFLATED) as archive:
        archive.writestr("word/document.xml", "x" * 101)
    with pytest.raises(ValueError, match="100"):
        analyze_upload_content("bomb.docx", stream.getvalue())


def test_encrypted_pdf_is_rejected_even_with_empty_password():
    stream = BytesIO()
    writer = PdfWriter()
    writer.add_blank_page(width=300, height=300)
    writer.encrypt("")
    writer.write(stream)
    with pytest.raises(ValueError, match="加密"):
        analyze_upload_content("encrypted.pdf", stream.getvalue())


def test_manifest_positions_reconstruct_extracted_text_without_duplicating_it():
    result = analyze_upload_content("notes.txt", b"first\n\nlast")
    manifest = result.to_manifest()
    assert manifest["version"] == 1
    assert manifest["coverage"] == "complete"
    assert manifest["text_length"] == len(result.text)
    for block, entry in zip(result.blocks, manifest["blocks"]):
        assert result.text[entry["start_offset"]:entry["end_offset"]] == block.text
        assert "text" not in entry


def workbook_bytes(workbook):
    stream = BytesIO()
    workbook.save(stream)
    return stream.getvalue()


def test_xlsx_late_rows_sheets_sparse_cells_and_merges_are_preserved():
    workbook = Workbook()
    workbook.active["J8"] = "ROW_EIGHT_COLUMN_TEN"
    for number in range(2, 6):
        workbook.create_sheet(f"Sheet{number}")
    workbook["Sheet5"]["Z1000000"] = "FIFTH_SHEET_TAIL"
    workbook.active.merge_cells("B2:C2")
    workbook.active["B2"] = "MERGED"
    result = analyze_upload_content("financials.xlsx", workbook_bytes(workbook))
    assert "ROW_EIGHT_COLUMN_TEN" in result.text
    assert "FIFTH_SHEET_TAIL" in result.text
    merged = next(block for block in result.blocks if block.locator["cell"] == "B2")
    assert merged.locator["merged_ranges"] == ["B2:C2"]
    assert result.coverage == "complete"


def test_xlsx_missing_formula_cache_is_explicit_and_never_evaluated():
    workbook = Workbook()
    workbook.active["A1"] = "=SUM(B1:B2)"
    result = analyze_upload_content("formula.xlsx", workbook_bytes(workbook))
    assert result.coverage == "partial"
    assert result.blocks[0].locator["formula"] == "=SUM(B1:B2)"
    assert result.blocks[0].locator["cached_value"] is None
    assert any("缺少公式快取" in warning for warning in result.warnings)


def test_xlsx_sheet_and_cell_limits_count_across_sheets(monkeypatch):
    workbook = Workbook()
    workbook.active["A1"] = 1
    workbook.create_sheet("Second")["A1"] = 2
    monkeypatch.setattr(settings, "material_max_sheets", 1)
    with pytest.raises(ValueError, match="1 張"):
        analyze_upload_content("sheets.xlsx", workbook_bytes(workbook))
    monkeypatch.setattr(settings, "material_max_sheets", 2)
    monkeypatch.setattr(settings, "material_max_cells", 1)
    with pytest.raises(ValueError, match="1 個"):
        analyze_upload_content("cells.xlsx", workbook_bytes(workbook))


def mixed_pdf_bytes():
    writer = PdfWriter()
    page = writer.add_blank_page(width=300, height=300)
    font = DictionaryObject({NameObject("/Type"): NameObject("/Font"),
                             NameObject("/Subtype"): NameObject("/Type1"),
                             NameObject("/BaseFont"): NameObject("/Helvetica")})
    page[NameObject("/Resources")] = DictionaryObject({NameObject("/Font"): DictionaryObject({NameObject("/F1"): font})})
    stream = DecodedStreamObject()
    stream.set_data(b"BT /F1 12 Tf 10 100 Td (READABLE_PAGE) Tj ET")
    page[NameObject("/Contents")] = writer._add_object(stream)
    writer.add_blank_page(width=300, height=300)
    output = BytesIO()
    writer.write(output)
    return output.getvalue()


def test_partly_readable_pdf_does_not_claim_complete_coverage():
    result = analyze_upload_content("mixed.pdf", mixed_pdf_bytes())
    assert "READABLE_PAGE" in result.text
    assert result.coverage == "partial"
    assert result.support_level == "limited"
    assert any("第 2 頁" in warning for warning in result.warnings)


def test_upload_persists_manifest_full_chunks_and_positions(client):
    from test_mvp_slice import create_task_payload

    task = client.post("/api/v1/tasks", json=create_task_payload("Material fidelity")).json()
    content = "alpha\n" * 1100 + "TAIL_EVIDENCE_999"
    response = client.post(f"/api/v1/tasks/{task['id']}/uploads", files=[("files", ("long.txt", content.encode(), "text/plain"))])
    assert response.status_code == 200
    source = response.json()["uploaded"][0]["source_document"]
    assert source["extraction_manifest"]["coverage"] == "complete"
    assert source["extraction_manifest"]["text_length"] == len(content)
    aggregate = client.get(f"/api/v1/tasks/{task['id']}").json()
    chunks = [entry["retrieval_provenance"]["chunk_object"] for entry in aggregate["evidence"] if entry["evidence_type"] == "source_chunk"]
    assert len(chunks) > 4
    assert any("TAIL_EVIDENCE_999" in chunk["excerpt_text"] for chunk in chunks)
    for chunk in chunks:
        assert chunk["extraction_version"] == 1
        assert chunk["locator"]["blocks"]
        assert content[chunk["start_offset"]:chunk["end_offset"]] == chunk["excerpt_text"]


def test_partial_pdf_status_survives_api_and_workspace_cards(client):
    from test_mvp_slice import create_task_payload

    task = client.post("/api/v1/tasks", json=create_task_payload("Partial PDF")).json()
    response = client.post(f"/api/v1/tasks/{task['id']}/uploads", files=[("files", ("mixed.pdf", mixed_pdf_bytes(), "application/pdf"))])
    source = response.json()["uploaded"][0]["source_document"]
    assert source["extract_availability"] == "partial_extract_ready"
    assert source["current_usable_scope"] == "limited_extract"
    workspace = client.get(f"/api/v1/matters/{task['matter_workspace']['id']}/artifact-evidence").json()
    card = next(item for item in workspace["source_material_cards"] if item["title"] == "mixed.pdf")
    assert card["extract_availability"] == "partial_extract_ready"


def test_pasted_source_gets_the_same_coverage_and_chunk_contract(client):
    from test_mvp_slice import create_task_payload

    task = client.post("/api/v1/tasks", json=create_task_payload("Pasted source")).json()
    response = client.post(f"/api/v1/tasks/{task['id']}/sources", json={"pasted_text": "FACT " * 1400 + "PASTED_TAIL", "urls": []})
    assert response.status_code == 200
    source = response.json()["ingested"][0]["source_document"]
    assert source["extraction_coverage"] == "complete"
    assert source["extraction_manifest"]["version"] == 1


def test_legacy_sources_remain_unverified_and_are_not_backfilled(client):
    from app.core.database import SessionLocal
    from app.domain.models import SourceDocument
    from test_mvp_slice import create_task_payload

    task = client.post("/api/v1/tasks", json=create_task_payload("Legacy source")).json()
    response = client.post(f"/api/v1/tasks/{task['id']}/uploads", files=[("files", ("legacy.txt", b"old excerpt", "text/plain"))])
    source_id = response.json()["uploaded"][0]["source_document"]["id"]
    with SessionLocal() as db:
        source = db.get(SourceDocument, source_id)
        source.extraction_manifest = None
        db.commit()
    aggregate = client.get(f"/api/v1/tasks/{task['id']}").json()
    source = next(item for item in aggregate["uploads"] if item["id"] == source_id)
    assert source["extraction_coverage"] == "unverified"
    assert source["extraction_manifest"] is None
    assert source["extract_availability"] == "unverified"
    assert aggregate["source_materials"][0]["extract_availability"] == "unverified"


def test_additive_schema_upgrade_preserves_old_values_and_is_repeatable(client):
    from sqlalchemy import inspect, text
    from app.core.database import engine, _ensure_incremental_schema_updates
    from test_mvp_slice import create_task_payload

    task = client.post("/api/v1/tasks", json=create_task_payload("Old schema seed")).json()
    response = client.post(f"/api/v1/tasks/{task['id']}/uploads", files=[("files", ("old.txt", b"LEGACY_SEED", "text/plain"))])
    source_id = response.json()["uploaded"][0]["source_document"]["id"]
    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE source_documents DROP COLUMN extraction_manifest"))
        connection.execute(text("ALTER TABLE chunk_objects DROP COLUMN extraction_version"))
        connection.execute(text("ALTER TABLE chunk_objects DROP COLUMN locator"))
        connection.execute(text("ALTER TABLE evidence DROP COLUMN extraction_version"))
    _ensure_incremental_schema_updates()
    _ensure_incremental_schema_updates()
    assert "extraction_manifest" in {item["name"] for item in inspect(engine).get_columns("source_documents")}
    assert {"extraction_version", "locator"} <= {item["name"] for item in inspect(engine).get_columns("chunk_objects")}
    assert "extraction_version" in {item["name"] for item in inspect(engine).get_columns("evidence")}
    with engine.connect() as connection:
        row = connection.execute(text("SELECT extracted_text, extraction_manifest FROM source_documents WHERE id = :id"), {"id": source_id}).one()
        assert row == ("LEGACY_SEED", None)
        chunks = connection.execute(text("SELECT excerpt_text, extraction_version, locator FROM chunk_objects WHERE source_document_id = :id"), {"id": source_id}).all()
        assert chunks == [("LEGACY_SEED", None, None)]


def test_upload_file_limit_does_not_save_an_incomplete_raw_file(client, monkeypatch):
    from test_mvp_slice import create_task_payload

    task = client.post("/api/v1/tasks", json=create_task_payload("Upload limit")).json()
    monkeypatch.setattr(settings, "material_max_file_bytes", 100)
    response = client.post(f"/api/v1/tasks/{task['id']}/uploads", files=[("files", ("large.txt", b"x" * 101, "text/plain"))])
    assert response.status_code == 413
    assert not list(settings.upload_path.rglob("*.txt"))


def test_parse_timeout_terminates_its_worker(monkeypatch):
    import multiprocessing

    monkeypatch.setattr(settings, "material_parse_timeout_seconds", 0.001)
    existing = {process.pid for process in multiprocessing.active_children()}
    with pytest.raises(ValueError, match="時間"):
        analyze_upload_content("slow.pdf", mixed_pdf_bytes())
    assert {process.pid for process in multiprocessing.active_children()} == existing


def test_overlap_equal_to_chunk_size_is_rejected():
    with pytest.raises(ValueError):
        build_text_chunk_specs("anything", chunk_size=120, overlap=120)


@pytest.mark.parametrize("suffix", ["docx", "xlsx", "pdf"])
def test_corrupt_documents_do_not_produce_complete_text(suffix):
    with pytest.raises(Exception):
        analyze_upload_content(f"broken.{suffix}", b"not a valid document")


def test_archive_entity_expansion_is_rejected():
    output = BytesIO()
    with ZipFile(output, "w") as archive:
        archive.writestr("word/document.xml", '<!DOCTYPE doc [<!ENTITY a "EXPANDED">]><doc>&a;</doc>')
    with pytest.raises(Exception, match="EntitiesForbidden"):
        analyze_upload_content("entities.docx", output.getvalue())


def test_pdf_page_limit_includes_unread_pages(monkeypatch):
    monkeypatch.setattr(settings, "material_max_pdf_pages", 1)
    with pytest.raises(ValueError, match="1 頁"):
        analyze_upload_content("two-pages.pdf", mixed_pdf_bytes())


def test_whitespace_only_csv_is_not_marked_complete():
    result = analyze_upload_content("blank.csv", b"\n\n\n")
    assert result.coverage == "unavailable"
    assert result.metadata_only is True


def test_batch_size_preflight_prevents_orphan_files(client, monkeypatch):
    from test_mvp_slice import create_task_payload

    task = client.post("/api/v1/tasks", json=create_task_payload("Batch size limit")).json()
    monkeypatch.setattr(settings, "material_max_file_bytes", 100)
    response = client.post(f"/api/v1/tasks/{task['id']}/uploads", files=[
        ("files", ("ok.txt", b"valid text", "text/plain")),
        ("files", ("large.txt", b"x" * 101, "text/plain")),
    ])
    assert response.status_code == 413
    assert not list(settings.upload_path.rglob("*.txt"))


def test_missing_derived_file_does_not_get_replaced_with_only_preview(client):
    from app.core.database import SessionLocal
    from app.domain.models import SourceDocument
    from app.services.material_storage import _ensure_derived_extract
    from test_mvp_slice import create_task_payload

    task = client.post("/api/v1/tasks", json=create_task_payload("Derived recovery")).json()
    response = client.post(f"/api/v1/tasks/{task['id']}/uploads", files=[("files", ("long.txt", b"x" * 6000, "text/plain"))])
    source_id = response.json()["uploaded"][0]["source_document"]["id"]
    with SessionLocal() as db:
        source = db.get(SourceDocument, source_id)
        path = settings.storage_root_path / source.derived_storage_key
        path.unlink()
        _ensure_derived_extract(source)
        assert not path.exists(), "A preview must never pretend to be the original full extraction"
        assert source.extraction_manifest["text_length"] == 6000


def test_remote_file_preserves_manifest_offsets(monkeypatch):
    from email.message import Message
    from app.ingestion import remote

    class Response(BytesIO):
        headers = Message()
        headers["Content-Type"] = "text/csv"

        def geturl(self):
            return "https://example.invalid/table.csv"

    monkeypatch.setattr(remote.request, "urlopen", lambda *args, **kwargs: Response(b'a,b\n1,"two\nlines"'))
    source = remote.fetch_remote_source("https://example.invalid/table.csv")
    assert source.extraction_manifest["coverage"] == "complete"
    assert source.extraction_manifest["text_length"] == len(source.normalized_text)
    block = source.extraction_manifest["blocks"][-1]
    assert source.normalized_text[block["start_offset"]:block["end_offset"]] == '1,"two\nlines"'


def test_xlsx_cached_formula_retains_original_expression_and_cache():
    workbook = Workbook()
    workbook.active["A1"] = "=SUM(1,2)"
    source = BytesIO(workbook_bytes(workbook))
    patched = BytesIO()
    with ZipFile(source) as archive, ZipFile(patched, "w", ZIP_DEFLATED) as output:
        for item in archive.infolist():
            content = archive.read(item)
            if item.filename == "xl/worksheets/sheet1.xml":
                content = content.replace(b"<v></v>", b"<v>3</v>")
            output.writestr(item, content)
    result = analyze_upload_content("cached.xlsx", patched.getvalue())
    assert result.blocks[0].locator["formula"] == "=SUM(1,2)"
    assert result.blocks[0].locator["cached_value"] == "3"
    assert "不保證最新" in result.message


@pytest.mark.parametrize("setting,value", [("material_max_zip_entries", 1), ("material_max_zip_bytes", 1)])
def test_archive_aggregate_limits_are_enforced(monkeypatch, setting, value):
    document = Document()
    stream = BytesIO()
    document.save(stream)
    monkeypatch.setattr(settings, setting, value)
    with pytest.raises(ValueError, match="上限"):
        analyze_upload_content("limited.docx", stream.getvalue())


def test_chunk_label_shows_document_location_not_only_character_offset(client):
    from test_mvp_slice import create_task_payload
    task = client.post("/api/v1/tasks", json=create_task_payload("Visible document locator")).json()
    document = Document()
    document.add_table(rows=1, cols=1).cell(0, 0).text = "PAYMENT 123456"
    stream = BytesIO()
    document.save(stream)
    client.post(f"/api/v1/tasks/{task['id']}/uploads", files=[("files", ("table.docx", stream.getvalue(), "application/octet-stream"))])
    aggregate = client.get(f"/api/v1/tasks/{task['id']}").json()
    chunk = next(item for item in aggregate["evidence"] if item["evidence_type"] == "source_chunk")
    assert "表格 1 R1C1" in chunk["retrieval_provenance"]["locator_label"]


def test_default_file_byte_and_source_character_boundaries():
    assert analyze_upload_content("boundary.bin", b"x" * (20 * 1024 * 1024)).support_level == "unsupported"
    with pytest.raises(ValueError, match="bytes"):
        analyze_upload_content("over.bin", b"x" * (20 * 1024 * 1024 + 1))
    assert analyze_upload_content("boundary.txt", b"x" * 100_000).coverage == "complete"
    with pytest.raises(ValueError, match="100000"):
        analyze_upload_content("over.txt", b"x" * 100_001)


def test_default_pdf_page_boundary():
    native = PdfReader(BytesIO(mixed_pdf_bytes())).pages[0]
    writer = PdfWriter()
    for _ in range(100):
        writer.add_page(native)
    output = BytesIO()
    writer.write(output)
    assert len(analyze_upload_content("boundary.pdf", output.getvalue()).blocks) == 100
    writer.add_page(native)
    output = BytesIO()
    writer.write(output)
    with pytest.raises(ValueError, match="100 頁"):
        analyze_upload_content("over.pdf", output.getvalue())


def test_default_worksheet_boundary():
    workbook = Workbook()
    for number in range(9):
        workbook.create_sheet(f"Sheet{number}")
    for sheet in workbook:
        sheet["A1"] = "read"
    assert len(analyze_upload_content("boundary.xlsx", workbook_bytes(workbook)).blocks) == 10
    workbook.create_sheet("Eleventh")
    with pytest.raises(ValueError, match="10 張"):
        analyze_upload_content("over.xlsx", workbook_bytes(workbook))


def test_default_cell_boundary_independent_of_text_budget(monkeypatch):
    # Isolate the cell budget; the default text budget may be reached first in actual files.
    monkeypatch.setattr(settings, "material_max_source_chars", 1_000_000)
    workbook = Workbook()
    for index in range(1, 20_001):
        workbook.active.cell(index, 1, "x")
    assert len(analyze_upload_content("boundary.xlsx", workbook_bytes(workbook)).blocks) == 20_000
    workbook.active.cell(20_001, 1, "x")
    with pytest.raises(ValueError, match="20000"):
        analyze_upload_content("over.xlsx", workbook_bytes(workbook))


def test_default_zip_entry_count_boundary():
    document = Document()
    document.add_paragraph("ZIP_ENTRY_BOUNDARY")
    original = BytesIO()
    document.save(original)

    def archive_with_count(count):
        output = BytesIO()
        with ZipFile(original) as source, ZipFile(output, "w", ZIP_DEFLATED) as target:
            for item in source.infolist():
                target.writestr(item.filename, source.read(item))
            for index in range(count - len(source.infolist())):
                target.writestr(f"padding/{index}.bin", b"")
        return output.getvalue()

    assert analyze_upload_content("boundary.docx", archive_with_count(2000)).coverage == "complete"
    with pytest.raises(ValueError, match="2000"):
        analyze_upload_content("over.docx", archive_with_count(2001))


def test_default_zip_expanded_byte_boundary():
    document = Document()
    document.add_paragraph("ZIP_BYTE_BOUNDARY")
    original = BytesIO()
    document.save(original)

    def archive_with_size(size):
        output = BytesIO()
        with ZipFile(original) as source, ZipFile(output, "w", ZIP_DEFLATED) as target:
            for item in source.infolist():
                target.writestr(item.filename, source.read(item))
            remaining = size - sum(item.file_size for item in source.infolist())
            index = 0
            while remaining:
                amount = min(remaining, 20 * 1024 * 1024)
                target.writestr(f"padding/{index}.bin", b"x" * amount)
                remaining -= amount
                index += 1
        return output.getvalue()

    assert analyze_upload_content("boundary.docx", archive_with_size(100 * 1024 * 1024)).coverage == "complete"
    with pytest.raises(ValueError, match="解壓大小"):
        analyze_upload_content("over.docx", archive_with_size(100 * 1024 * 1024 + 1))


def test_merged_cell_lookup_does_not_scan_every_range_for_each_value(monkeypatch):
    from openpyxl.worksheet.cell_range import CellRange
    from app.ingestion.files import _analyze_upload_content
    workbook = Workbook()
    for row in range(1, 101):
        workbook.active.merge_cells(start_row=row, end_row=row, start_column=1, end_column=2)
        workbook.active.cell(row, 1, f"value-{row}")
    content = workbook_bytes(workbook)
    monkeypatch.setattr(CellRange, "__contains__", lambda *args: pytest.fail("Avoid a cell-by-range Cartesian scan"))
    result = _analyze_upload_content("merged.xlsx", content)
    assert len(result.blocks) == 100
    assert result.blocks[-1].locator["merged_ranges"] == ["A100:B100"]
