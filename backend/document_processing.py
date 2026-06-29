"""Prepare mentor download files: format conversion and size compression."""

from __future__ import annotations

import io
import zipfile
from pathlib import Path

try:
    from PIL import Image
except ImportError:  # pragma: no cover
    Image = None

try:
    import fitz
except ImportError:  # pragma: no cover
    fitz = None

try:
    from pypdf import PdfReader, PdfWriter
except ImportError:  # pragma: no cover
    PdfReader = None
    PdfWriter = None


IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tif", ".tiff"}
PDF_EXTENSIONS = {".pdf"}
DOC_EXTENSIONS = {".doc", ".docx"}


def variant_max_bytes(variant: str) -> int | None:
    if variant == "compress_3mb":
        return 3 * 1024 * 1024
    if variant == "compress_1mb":
        return 1 * 1024 * 1024
    return None


def _require_pillow() -> None:
    if Image is None:
        raise RuntimeError("Thiếu thư viện Pillow để xử lý ảnh.")


def _load_image(data: bytes) -> Image.Image:
    _require_pillow()
    image = Image.open(io.BytesIO(data))
    if image.mode in ("RGBA", "P"):
        return image.convert("RGB")
    if image.mode != "RGB":
        return image.convert("RGB")
    return image


def _image_to_png_bytes(data: bytes, quality_pair: tuple[int, float] | None = None) -> bytes:
    image = _load_image(data)
    if quality_pair:
        _quality, scale = quality_pair
        if scale < 1.0:
            image = image.resize(
                (max(1, int(image.width * scale)), max(1, int(image.height * scale))),
                Image.Resampling.LANCZOS,
            )
    output = io.BytesIO()
    image.save(output, format="PNG", optimize=True)
    return output.getvalue()


def _image_to_pdf_bytes(data: bytes, quality_pair: tuple[int, float] | None = None) -> bytes:
    image = _load_image(data)
    if quality_pair:
        _quality, scale = quality_pair
        if scale < 1.0:
            image = image.resize(
                (max(1, int(image.width * scale)), max(1, int(image.height * scale))),
                Image.Resampling.LANCZOS,
            )
    output = io.BytesIO()
    image.save(output, format="PDF")
    return output.getvalue()


def _pdf_first_page_png(data: bytes, quality_pair: tuple[int, float] | None = None) -> bytes:
    if fitz is None:
        raise RuntimeError("Thiếu thư viện PyMuPDF để chuyển PDF sang PNG.")
    document = fitz.open(stream=data, filetype="pdf")
    try:
        page = document.load_page(0)
        scale = quality_pair[1] if quality_pair else 1.5
        matrix = fitz.Matrix(scale, scale)
        pixmap = page.get_pixmap(matrix=matrix, alpha=False)
        png_bytes = pixmap.tobytes("png")
        if quality_pair:
            return _image_to_png_bytes(png_bytes, quality_pair)
        return png_bytes
    finally:
        document.close()


def _compress_pdf_bytes(data: bytes, quality_pair: tuple[int, float] | None = None) -> bytes:
    if PdfReader is None or PdfWriter is None:
        return data
    reader = PdfReader(io.BytesIO(data))
    writer = PdfWriter()
    for page in reader.pages:
        page.compress_content_streams()
        writer.add_page(page)
    output = io.BytesIO()
    writer.write(output)
    result = output.getvalue()
    if quality_pair and len(result) > len(data):
        return data
    return result


def _fit_under_limit(
    builder,
    max_bytes: int | None,
) -> tuple[bytes, str]:
    if max_bytes is None:
        data, ext = builder(None)
        return data, ext

    for scale in (1.0, 0.85, 0.7, 0.55, 0.45, 0.35):
        for quality in (90, 80, 70, 60, 50, 40, 30):
            data, ext = builder((quality, scale))
            if len(data) <= max_bytes:
                return data, ext
    data, ext = builder((25, 0.3))
    return data, ext


def process_document_file(
    source_path: Path,
    *,
    output_format: str = "pdf",
    variant: str = "original",
) -> tuple[bytes, str]:
    output_format = (output_format or "pdf").lower()
    if output_format not in {"pdf", "png"}:
        raise ValueError("Định dạng tải xuống không hợp lệ")

    ext = source_path.suffix.lower()
    raw = source_path.read_bytes()
    max_bytes = variant_max_bytes(variant)

    if ext in DOC_EXTENSIONS:
        return raw, ext

    def build_image_png(quality_pair):
        return _image_to_png_bytes(raw, quality_pair), ".png"

    def build_image_pdf(quality_pair):
        return _image_to_pdf_bytes(raw, quality_pair), ".pdf"

    def build_pdf_as_pdf(quality_pair):
        if quality_pair is None:
            return raw, ext
        return _compress_pdf_bytes(raw, quality_pair), ".pdf"

    def build_pdf_as_png(quality_pair):
        return _pdf_first_page_png(raw, quality_pair), ".png"

    if ext in IMAGE_EXTENSIONS:
        if output_format == "png":
            return _fit_under_limit(build_image_png, max_bytes)
        return _fit_under_limit(build_image_pdf, max_bytes)

    if ext in PDF_EXTENSIONS:
        if output_format == "png":
            return _fit_under_limit(build_pdf_as_png, max_bytes)
        return _fit_under_limit(build_pdf_as_pdf, max_bytes)

    return raw, ext


def build_zip_bytes(entries: list[tuple[str, bytes]]) -> bytes:
    output = io.BytesIO()
    with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for filename, payload in entries:
            archive.writestr(filename, payload)
    return output.getvalue()
