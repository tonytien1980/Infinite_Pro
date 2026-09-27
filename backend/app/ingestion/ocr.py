from __future__ import annotations

import csv
import math
import logging
import os
from pathlib import Path
import subprocess
from tempfile import TemporaryDirectory
import time
import warnings

from PIL import Image, ImageOps, UnidentifiedImageError

from app.core.config import settings

logger = logging.getLogger(__name__)

class OcrUnavailable(ValueError):
    pass


def _run(args: list[str], deadline: float) -> None:
    remaining = min(settings.material_ocr_page_timeout_seconds, deadline - time.monotonic())
    if remaining <= 0:
        raise OcrUnavailable("OCR 已達時間上限，未讀部分請補文字或重試。")
    try:
        subprocess.run(args, shell=False, check=True, timeout=remaining, stdout=subprocess.DEVNULL,
                       stderr=subprocess.PIPE, env={"PATH": os.environ.get("PATH", os.defpath),
                       "LANG": "C.UTF-8", "OMP_THREAD_LIMIT": "1"})
    except FileNotFoundError as exc:
        raise OcrUnavailable("本環境缺少 OCR 引擎，請使用專案 OCR 容器或補充文字。") from exc
    except subprocess.TimeoutExpired as exc:
        raise OcrUnavailable("OCR 已達時間上限，未讀部分請補文字或重試。") from exc
    except subprocess.CalledProcessError as exc:
        logger.warning("%s failed (exit %s): %s", args[0], exc.returncode, (exc.stderr or b"").decode("utf-8", errors="replace")[-500:])
        raise OcrUnavailable("OCR 無法讀取這頁影像，請提供更清晰版本或文字。") from exc


def _prepare_image(source: Path, target: Path) -> tuple[int, int]:
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("error", Image.DecompressionBombWarning)
            with Image.open(source) as image:
                if image.format not in {"PNG", "JPEG", "WEBP"} or getattr(image, "n_frames", 1) != 1:
                    raise ValueError("影像須為單張 PNG、JPEG 或 WebP，請勿使用動畫。")
                if image.width * image.height > settings.material_max_image_pixels:
                    raise ValueError(f"影像超過 {settings.material_max_image_pixels} 像素上限。")
                corrected = ImageOps.exif_transpose(image).convert("RGBA")
                normalized = Image.new("RGB", corrected.size, "white")
                normalized.paste(corrected, mask=corrected.getchannel("A"))
                normalized.save(target, format="PNG")
                return normalized.size
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError, Image.DecompressionBombWarning) as exc:
        raise ValueError("影像損毀或像素過大，無法安全讀取。") from exc


def _read_tsv(path: Path, *, page: int, width: int, height: int) -> tuple[list[dict], list[str]]:
    if not path.exists() or path.stat().st_size > settings.material_ocr_output_bytes:
        raise ValueError("OCR 文字輸出缺失或超過安全上限，請拆分材料。")
    lines: dict[tuple[str, ...], list[dict]] = {}
    with path.open(encoding="utf-8", newline="") as stream:
        for row in csv.DictReader(stream, delimiter="\t", quoting=csv.QUOTE_NONE):
            if row.get("level") != "5" or not (row.get("text") or "").strip():
                continue
            confidence = float(row["conf"])
            if not math.isfinite(confidence) or not 0 <= confidence <= 100:
                raise ValueError("OCR 辨識資訊無效，請核對材料。")
            bbox = [int(row[key]) for key in ("left", "top", "width", "height")]
            if min(bbox) < 0 or bbox[0] + bbox[2] > width or bbox[1] + bbox[3] > height:
                raise ValueError("OCR 位置資訊超出影像範圍。")
            key = tuple(row[key] for key in ("block_num", "par_num", "line_num"))
            lines.setdefault(key, []).append({"text": row["text"], "bbox": bbox, "confidence": confidence})
    blocks = []
    notes = ["OCR 辨識文字可能有誤，重要數字與條件請對照原始影像核對。"]
    for words in lines.values():
        left = min(word["bbox"][0] for word in words)
        top = min(word["bbox"][1] for word in words)
        right = max(word["bbox"][0] + word["bbox"][2] for word in words)
        bottom = max(word["bbox"][1] + word["bbox"][3] for word in words)
        minimum = min(word["confidence"] for word in words)
        confidence = sum(word["confidence"] for word in words) / len(words)
        blocks.append({"text": " ".join(word["text"] for word in words), "locator": {
            "kind": "ocr_region", "method": "ocr", "page": page, "bbox": [left, top, right-left, bottom-top],
            "image_size": [width, height], "confidence": confidence, "min_confidence": minimum,
            "coordinate_space": "rendered_image_pixels", "languages": "chi_tra+eng",
        }, "locator_label": f"第 {page} 頁辨識區域 ({left}, {top})"})
        if minimum < settings.material_ocr_min_confidence:
            notes.append(f"第 {page} 頁部分文字辨識信心偏低，請人工核對。")
    if not blocks:
        notes.append(f"第 {page} 頁未辨識出可用文字。")
    return blocks, list(dict.fromkeys(notes))


def _recognize(image_path: Path, directory: Path, *, page: int, deadline: float):
    normalized = directory / "normalized.png"
    width, height = _prepare_image(image_path, normalized)
    output = directory / "recognized"
    _run(["tesseract", str(normalized), str(output), "-l", "chi_tra+eng", "--psm", "3", "tsv"], deadline)
    return _read_tsv(output.with_suffix(".tsv"), page=page, width=width, height=height)


def extract_image(content: bytes, *, deadline: float):
    with TemporaryDirectory(prefix="infinite-pro-ocr-") as temporary:
        directory = Path(temporary)
        source = directory / "source-image"
        source.write_bytes(content)
        return _recognize(source, directory, page=1, deadline=deadline)


def extract_pdf_page(pdf_path: Path, *, page: int, deadline: float):
    with TemporaryDirectory(prefix="infinite-pro-ocr-") as temporary:
        directory = Path(temporary)
        output = directory / "page"
        edge = math.isqrt(settings.material_max_image_pixels)
        _run(["pdftoppm", "-f", str(page), "-l", str(page), "-singlefile", "-scale-to", str(edge),
              "-png", str(pdf_path), str(output)], deadline)
        return _recognize(output.with_suffix(".png"), directory, page=page, deadline=deadline)
