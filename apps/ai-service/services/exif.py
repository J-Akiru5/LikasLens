"""
EXIF metadata stripping using Pillow.
Replaces the PHP GD re-encode in ReportController.
Always call this before storing any image OR sending to YOLO/Gemini.
"""

import hashlib
import io

from PIL import Image


def strip_exif(image_bytes: bytes) -> tuple[bytes, str]:
    """
    Re-encode image through Pillow to strip all EXIF/metadata.
    Returns (stripped_bytes, sha256_checksum).
    Raises ValueError if the bytes are not a valid image.
    """
    try:
        img = Image.open(io.BytesIO(image_bytes))
    except Exception as e:
        raise ValueError(f"Invalid image data: {e}") from e

    output = io.BytesIO()
    fmt = img.format or "JPEG"

    # Re-encode without EXIF — this is the metadata strip
    if fmt == "JPEG":
        img.save(output, format="JPEG", quality=92, exif=b"")
    elif fmt == "PNG":
        img.save(output, format="PNG", optimize=True)
    elif fmt == "WEBP":
        img.save(output, format="WEBP", quality=90)
    else:
        img.save(output, format="JPEG", quality=92, exif=b"")
        fmt = "JPEG"

    stripped = output.getvalue()
    checksum = hashlib.sha256(stripped).hexdigest()
    return stripped, checksum


MAX_LONGEST_EDGE = 1920


def downscale_image(image_bytes: bytes, max_edge: int = MAX_LONGEST_EDGE) -> bytes:
    """Downscale image so longest edge <= max_edge. Returns re-encoded bytes.

    Preserves format (JPEG/PNG/WEBP). No-op if already within bounds.
    This cuts memory for YOLO inference, Pillow re-encode, and storage.
    """
    try:
        img = Image.open(io.BytesIO(image_bytes))
    except Exception:
        return image_bytes  # pass through unmodified on decode failure

    w, h = img.size
    if max(w, h) <= max_edge:
        return image_bytes

    ratio = max_edge / max(w, h)
    new_size = (int(w * ratio), int(h * ratio))
    img = img.resize(new_size, Image.LANCZOS)

    fmt = img.format or "JPEG"
    output = io.BytesIO()
    if fmt == "JPEG":
        img.save(output, format="JPEG", quality=92)
    elif fmt == "PNG":
        img.save(output, format="PNG", optimize=True)
    elif fmt == "WEBP":
        img.save(output, format="WEBP", quality=90)
    else:
        img.save(output, format="JPEG", quality=92)
    return output.getvalue()


MIME_MAP = {"JPEG": "image/jpeg", "PNG": "image/png", "WEBP": "image/webp"}


def get_mime_type(image_bytes: bytes) -> str:
    """Detect MIME type from image bytes."""
    try:
        img = Image.open(io.BytesIO(image_bytes))
        return MIME_MAP.get(img.format or "JPEG", "image/jpeg")
    except Exception:
        return "image/jpeg"
