function canvasReencode(
  source: HTMLImageElement,
  mimeType: string,
  quality: number | undefined
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = source.naturalWidth || source.width;
    canvas.height = source.naturalHeight || source.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return reject(new Error("Unable to access canvas context."));
    ctx.drawImage(source, 0, 0);
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Canvas toBlob returned null"))),
      mimeType,
      quality
    );
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to decode image."));
    img.src = src;
  });
}

export async function stripExif(base64Image: string): Promise<string> {
  if (!base64Image.startsWith("data:")) {
    throw new Error("Expected a data URL base64 image string.");
  }
  const mimeMatch = base64Image.match(/^data:(image\/[a-zA-Z0-9+.-]+);/);
  const mimeType = mimeMatch?.[1] ?? "image/jpeg";
  const quality = mimeType === "image/jpeg" ? 1 : undefined;
  const img = await loadImage(base64Image);
  const blob = await canvasReencode(img, mimeType, quality);
  return new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

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
