from io import BytesIO
from pathlib import Path
import subprocess

import pytest
from PIL import Image

from app.core.config import settings
from app.ingestion.files import _analyze_upload_content


def png_bytes(width=100, height=60):
    output = BytesIO()
    Image.new("RGB", (width, height), "white").save(output, format="PNG")
    return output.getvalue()


def fake_cli(args, **kwargs):
    assert kwargs["shell"] is False
    assert 0 < kwargs["timeout"] <= 15
    if args[0] == "pdftoppm":
        Path(f"{args[-1]}.png").write_bytes(png_bytes())
    else:
        assert args[0] == "tesseract"
        assert args[args.index("-l") + 1] == "chi_tra+eng"
        Path(f"{args[2]}.tsv").write_text(
            "level\tpage_num\tblock_num\tpar_num\tline_num\tword_num\tleft\ttop\twidth\theight\tconf\ttext\n"
            "5\t1\t1\t1\t1\t1\t5\t7\t80\t15\t96.5\tSCANNED_CLAUSE\n",
            encoding="utf-8",
        )
    return subprocess.CompletedProcess(args, 0, b"", b"")


def enable_ocr(monkeypatch):
    monkeypatch.setattr(settings, "material_ocr_enabled", True)
    monkeypatch.setattr(subprocess, "run", fake_cli)


def test_image_ocr_preserves_region_and_confidence(monkeypatch):
    enable_ocr(monkeypatch)
    result = _analyze_upload_content("scan.png", png_bytes())
    assert "SCANNED_CLAUSE" in result.text
    assert result.blocks[0].locator["bbox"] == [5, 7, 80, 15]
    assert result.blocks[0].locator["confidence"] == 96.5
    assert result.blocks[0].locator["method"] == "ocr"
    assert result.metadata_only is False
    assert result.coverage == "complete"
    assert "核對" in result.message


def test_mixed_pdf_runs_ocr_only_for_unread_pages(monkeypatch):
    from test_material_fidelity import mixed_pdf_bytes

    enable_ocr(monkeypatch)
    result = _analyze_upload_content("mixed.pdf", mixed_pdf_bytes())
    assert "READABLE_PAGE" in result.text
    assert "SCANNED_CLAUSE" in result.text
    ocr_blocks = [block for block in result.blocks if block.locator.get("method") == "ocr"]
    assert len(ocr_blocks) == 1
    assert ocr_blocks[0].locator["page"] == 2


def test_low_confidence_is_limited_and_explained(monkeypatch):
    enable_ocr(monkeypatch)

    def low_confidence(args, **kwargs):
        response = fake_cli(args, **kwargs)
        path = Path(f"{args[2]}.tsv")
        path.write_text(path.read_text().replace("96.5", "30.0"))
        return response

    monkeypatch.setattr(subprocess, "run", low_confidence)
    result = _analyze_upload_content("unclear.png", png_bytes())
    assert result.coverage == "partial"
    assert result.support_level == "limited"
    assert "辨識信心偏低" in result.message


def test_ocr_timeout_retains_readable_pdf_pages(monkeypatch):
    from test_material_fidelity import mixed_pdf_bytes

    enable_ocr(monkeypatch)
    paths = []

    def timeout(args, **kwargs):
        paths.append(Path(args[-1]).parent)
        raise subprocess.TimeoutExpired(args, kwargs["timeout"])

    monkeypatch.setattr(subprocess, "run", timeout)
    result = _analyze_upload_content("mixed.pdf", mixed_pdf_bytes())
    assert "READABLE_PAGE" in result.text
    assert result.coverage == "partial"
    assert "時間" in result.message
    assert all(not path.exists() for path in paths)


def test_pixel_limit_is_checked_before_native_ocr(monkeypatch):
    enable_ocr(monkeypatch)
    monkeypatch.setattr(settings, "material_max_image_pixels", 100)
    monkeypatch.setattr(subprocess, "run", lambda *args, **kwargs: pytest.fail("OCR must not run"))
    with pytest.raises(ValueError, match="像素"):
        _analyze_upload_content("large.png", png_bytes(11, 10))


def test_corrupt_image_is_rejected_before_native_ocr(monkeypatch):
    enable_ocr(monkeypatch)
    with pytest.raises(ValueError, match="影像"):
        _analyze_upload_content("broken.png", b"fake image bytes")


def test_ocr_page_cap_reports_unread_pages(monkeypatch):
    from pypdf import PdfWriter

    enable_ocr(monkeypatch)
    monkeypatch.setattr(settings, "material_max_ocr_pages", 1)
    writer = PdfWriter()
    for _ in range(2):
        writer.add_blank_page(width=300, height=300)
    output = BytesIO()
    writer.write(output)
    result = _analyze_upload_content("two-scans.pdf", output.getvalue())
    assert result.coverage == "partial"
    assert "第 2 頁" in result.message
    assert "上限" in result.message


def test_missing_ocr_binary_is_explicit_not_fake_full(monkeypatch):
    enable_ocr(monkeypatch)
    monkeypatch.setattr(subprocess, "run", lambda *args, **kwargs: (_ for _ in ()).throw(FileNotFoundError()))
    result = _analyze_upload_content("scan.png", png_bytes())
    assert result.coverage == "unavailable"
    assert "OCR" in result.message


def test_twenty_ocr_pages_and_next_page_are_distinguished(monkeypatch):
    from pypdf import PdfWriter
    enable_ocr(monkeypatch)
    writer = PdfWriter()
    for _ in range(21):
        writer.add_blank_page(width=300, height=300)
    output = BytesIO()
    writer.write(output)
    result = _analyze_upload_content("scans.pdf", output.getvalue())
    assert len(result.blocks) == 20
    assert result.coverage == "partial"
    assert "第 21 頁" in result.message


def test_image_pixel_boundary_uses_real_twenty_megapixel_image(monkeypatch):
    enable_ocr(monkeypatch)
    result = _analyze_upload_content("boundary.png", png_bytes(4000, 5000))
    assert result.blocks[0].locator["image_size"] == [4000, 5000]
    with pytest.raises(ValueError, match="像素"):
        _analyze_upload_content("over.png", png_bytes(4001, 5000))


def test_indexed_transparency_is_composited_on_white(tmp_path):
    from app.ingestion.ocr import _prepare_image
    image = Image.new("P", (10, 10), 0)
    image.putpalette([0, 0, 0, 0, 0, 0] + [255] * (768 - 6))
    image.putpixel((5, 5), 1)
    source = tmp_path / "indexed.png"
    target = tmp_path / "normalized.png"
    image.save(source, transparency=0)
    _prepare_image(source, target)
    with Image.open(target) as normalized:
        assert normalized.getpixel((0, 0)) == (255, 255, 255)
        assert normalized.getpixel((5, 5)) == (0, 0, 0)


def test_native_ocr_does_not_inherit_provider_credentials(monkeypatch):
    enable_ocr(monkeypatch)
    monkeypatch.setenv("OPENAI_API_KEY", "synthetic-test-key")

    def checked_run(args, **kwargs):
        assert "OPENAI_API_KEY" not in kwargs["env"]
        assert "DATABASE_URL" not in kwargs["env"]
        assert "SESSION_SECRET_KEY" not in kwargs["env"]
        return fake_cli(args, **kwargs)

    monkeypatch.setattr(subprocess, "run", checked_run)
    assert _analyze_upload_content("safe.png", png_bytes()).text
