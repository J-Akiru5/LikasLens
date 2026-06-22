/**
 * Client-side EXIF metadata stripping via canvas re-encoding.
 * Canvas.toDataURL() only preserves pixel data, so all EXIF metadata
 * (GPS, camera model, timestamps, etc.) is destroyed.
 */

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to decode image."));
    img.src = src;
  });
}

function canvasReencode(
  source: HTMLImageElement,
  mimeType: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = source.naturalWidth || source.width;
    canvas.height = source.naturalHeight || source.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return reject(new Error("Unable to access canvas context."));
    ctx.drawImage(source, 0, 0);
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("Canvas toBlob returned null")),
      mimeType,
      quality
    );
  });
}

/**
 * Strips EXIF metadata from a base64 data URL by re-encoding through canvas.
 * Returns a new data URL with metadata removed.
 */
export async function stripExif(base64Image: string): Promise<string> {
  if (!base64Image.startsWith("data:")) {
    return base64Image;
  }
  const mimeMatch = base64Image.match(/^data:(image\/[a-zA-Z0-9+.-]+);/);
  const mimeType = mimeMatch?.[1] ?? "image/jpeg";
  const quality = mimeType === "image/jpeg" ? 0.92 : 0.9;
  const img = await loadImage(base64Image);
  const blob = await canvasReencode(img, mimeType, quality);
  return new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

/**
 * Strips EXIF metadata from a File object by re-encoding through canvas.
 * Returns a new Blob with metadata removed.
 */
export async function stripExifFromFile(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    return await canvasReencode(img, file.type, 0.92);
  } catch {
    return file;
  } finally {
    URL.revokeObjectURL(url);
  }
}
