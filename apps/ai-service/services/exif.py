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


MIME_MAP = {"JPEG": "image/jpeg", "PNG": "image/png", "WEBP": "image/webp"}


def get_mime_type(image_bytes: bytes) -> str:
    """Detect MIME type from image bytes."""
    try:
        img = Image.open(io.BytesIO(image_bytes))
        return MIME_MAP.get(img.format or "JPEG", "image/jpeg")
    except Exception:
        return "image/jpeg"
