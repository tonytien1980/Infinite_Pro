"""Offline OCR acceptance against a generated, non-customer bilingual fixture."""
from __future__ import annotations

import argparse
from io import BytesIO
import json
from pathlib import Path
import sys
import tempfile

from PIL import Image, ImageDraw, ImageFont
from pypdf import PdfReader, PdfWriter
from pypdf.generic import DecodedStreamObject, DictionaryObject, NameObject


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--generate-font")
    arguments = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    fixture = root / "tests/fixtures/ocr/printed-bilingual.png"
    if arguments.generate_font:
        fixture.parent.mkdir(parents=True, exist_ok=True)
        image = Image.new("RGB", (1500, 380), "white")
        draw = ImageDraw.Draw(image)
        font = ImageFont.truetype(arguments.generate_font, 70)
        draw.text((60, 40), "營業收入 123456", font=font, fill="black")
        draw.text((60, 150), "REVENUE 123456", font=font, fill="black")
        draw.text((60, 260), "成本 45678", font=font, fill="black")
        image.save(fixture, "PNG")
        print(fixture)
        return

    sys.path.insert(0, str(root))
    from app.core.config import settings
    from app.ingestion.files import analyze_upload_content

    assert settings.material_ocr_enabled, "Run inside the OCR-enabled project container"
    results = []
    for format_name, extension in (("PNG", "png"), ("JPEG", "jpg"), ("WEBP", "webp")):
        output = BytesIO()
        with Image.open(fixture) as image:
            image.save(output, format=format_name)
        result = analyze_upload_content(f"printed.{extension}", output.getvalue())
        normalized = "".join(result.text.split())
        for expected in ("營業收入", "123456", "REVENUE", "45678"):
            assert expected in normalized, (extension, expected, result.text, result.message)
        assert all(block.locator["method"] == "ocr" for block in result.blocks)
        assert result.support_level == "limited" and "核對" in result.message
        results.append({"format": extension, "regions": len(result.blocks), "text": result.text})

    writer = PdfWriter()
    page = writer.add_blank_page(width=600, height=300)
    font = DictionaryObject({NameObject("/Type"): NameObject("/Font"), NameObject("/Subtype"): NameObject("/Type1"), NameObject("/BaseFont"): NameObject("/Helvetica")})
    page[NameObject("/Resources")] = DictionaryObject({NameObject("/Font"): DictionaryObject({NameObject("/F1"): font})})
    stream = DecodedStreamObject()
    stream.set_data(b"BT /F1 20 Tf 40 200 Td (NATIVE_FIRST_PAGE) Tj ET")
    page[NameObject("/Contents")] = writer._add_object(stream)
    scan = BytesIO()
    with Image.open(fixture) as image:
        image.save(scan, format="PDF", resolution=150)
    writer.add_page(PdfReader(scan).pages[0])
    mixed = BytesIO()
    writer.write(mixed)
    result = analyze_upload_content("mixed.pdf", mixed.getvalue())
    assert "NATIVE_FIRST_PAGE" in result.text
    assert "營業收入" in "".join(result.text.split()), (result.text, result.message)
    assert any(block.locator.get("page") == 2 and block.locator.get("method") == "ocr" for block in result.blocks)
    results.append({"format": "mixed-pdf", "regions": len(result.blocks)})

    settings.material_ocr_page_timeout_seconds = 0.001
    result = analyze_upload_content("timeout.png", fixture.read_bytes())
    assert result.coverage == "unavailable" and "時間" in result.message
    results.append({"format": "timeout", "coverage": result.coverage})
    settings.material_ocr_page_timeout_seconds = 15
    settings.material_ocr_file_timeout_seconds = 0.001
    try:
        analyze_upload_content("file-timeout.png", fixture.read_bytes())
    except ValueError as exc:
        assert "時間" in str(exc)
    else:
        raise AssertionError("File OCR deadline was not enforced")
    assert not list(Path(tempfile.gettempdir()).glob("infinite-pro-extract-*"))
    results.append({"format": "file-timeout", "temporary_files": "clean"})
    print(json.dumps({"status": "pass", "checks": results}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
